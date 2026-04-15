"use client";

import { useCallback, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────────────

type ImportRow = {
  rowIndex: number;
  datum: string;
  valuta: string;
  klijentRaw: string;
  iznos: number;
};

type MatchCandidate = {
  ID_Klijent: number;
  Naziv: string | null;
  Grad: string | null;
  PIB: string | null;
  score: number;
};

type MatchedRow = ImportRow & {
  candidates: MatchCandidate[];
  // user's selected client for this row
  selectedId: number | null;
  skip: boolean;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseSerbianDate(s: string): string | null {
  // Handles "dd.mm.yyyy" → "yyyy-mm-dd"
  if (!s) return null;
  const m = String(s).match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
}

function parseAmount(raw: unknown): number {
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    // Handle "1.234,56" (Serbian) or "1,234.56" (EN) formats
    const cleaned = raw.replace(/\./g, "").replace(",", ".");
    return parseFloat(cleaned) || 0;
  }
  return 0;
}

function parseXlsRows(wb: XLSX.WorkBook): ImportRow[] {
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });

  const rows: ImportRow[] = [];
  // Skip first 3 rows (2 headers + column names row)
  for (let i = 3; i < raw.length; i++) {
    const r = raw[i] as unknown[];
    const datum = String(r[1] || "").trim();
    const valuta = String(r[2] || "").trim();
    const klijentRaw = String(r[3] || "").trim();
    const iznos = parseAmount(r[4]);

    if (!klijentRaw || !datum || iznos <= 0) continue;

    rows.push({ rowIndex: i, datum, valuta, klijentRaw, iznos });
  }
  return rows;
}

function scoreBadge(score: number) {
  if (score >= 0.65)
    return <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle2 className="w-3 h-3" />{Math.round(score * 100)}%</span>;
  if (score >= 0.35)
    return <span className="inline-flex items-center gap-1 text-yellow-600 text-xs font-medium"><AlertCircle className="w-3 h-3" />{Math.round(score * 100)}%</span>;
  return <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium"><XCircle className="w-3 h-3" />{Math.round(score * 100)}%</span>;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

export function LifletUvozDialog({ open, onOpenChange, onImported }: Props) {
  const [step, setStep] = useState<"drop" | "matching" | "review" | "importing">("drop");
  const [rows, setRows] = useState<MatchedRow[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("drop");
    setRows([]);
  };

  const handleClose = (v: boolean) => {
    if (!v) reset();
    onOpenChange(v);
  };

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setStep("matching");

    let parsed: ImportRow[];
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array", cellDates: false });
      parsed = parseXlsRows(wb);
    } catch {
      toast.error("Greška pri čitanju fajla. Proveri format.");
      setStep("drop");
      return;
    }

    if (parsed.length === 0) {
      toast.error("Nije pronađen ni jedan validan red u fajlu.");
      setStep("drop");
      return;
    }

    try {
      const res = await fetch("/api/liflet/finansije/uvoz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });
      const matched = await res.json();
      const withState: MatchedRow[] = (matched as (ImportRow & { candidates: MatchCandidate[] })[]).map((r) => ({
        ...r,
        selectedId: r.candidates[0]?.ID_Klijent ?? null,
        skip: r.candidates.length === 0,
      }));
      setRows(withState);
      setStep("review");
    } catch {
      toast.error("Greška pri poklapanju klijenata.");
      setStep("drop");
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleImport = async () => {
    const toImport = rows.filter((r) => !r.skip && r.selectedId);
    if (toImport.length === 0) {
      toast.error("Nema redova za uvoz.");
      return;
    }
    setStep("importing");

    let ok = 0;
    let fail = 0;
    for (const row of toImport) {
      const datum = parseSerbianDate(row.datum);
      const valuta = parseSerbianDate(row.valuta);
      if (!datum) { fail++; continue; }

      try {
        const res = await fetch("/api/liflet/finansije", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            Id_klijent: row.selectedId?.toString(),
            dug: true,
            iznos: row.iznos.toString(),
            datum,
            valuta: valuta ?? "",
            napomena: "",
          }),
        });
        if (res.ok) ok++; else fail++;
      } catch { fail++; }
    }

    if (ok > 0) toast.success(`Uvezeno ${ok} zaduženja${fail > 0 ? `, ${fail} neuspješno` : ""}.`);
    else toast.error("Uvoz nije uspio.");

    onImported();
    handleClose(false);
  };

  const updateRow = (idx: number, patch: Partial<MatchedRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)));
  };

  const toImportCount = rows.filter((r) => !r.skip && r.selectedId).length;
  const skipCount = rows.filter((r) => r.skip).length;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Uvoz zaduženja iz Excel fajla</DialogTitle>
          <DialogDescription>
            Prihvatamo .xls / .xlsx fajlove. Prvih 3 reda se preskaču. Svaki red treba imati: datum (B), valuta (C), klijent (D), iznos (E).
          </DialogDescription>
        </DialogHeader>

        {/* ── Step: drop ── */}
        {step === "drop" && (
          <div
            className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-lg p-12 cursor-pointer transition-colors
              ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
          >
            <FileSpreadsheet className="w-12 h-12 text-muted-foreground" />
            <div className="text-center">
              <p className="font-medium">Prevuci Excel fajl ovde ili klikni da odabereš</p>
              <p className="text-sm text-muted-foreground mt-1">.xls, .xlsx — preskaču se prva 3 reda</p>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".xls,.xlsx"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f); }}
            />
          </div>
        )}

        {/* ── Step: matching ── */}
        {step === "matching" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Poklapam klijente iz baze…</p>
          </div>
        )}

        {/* ── Step: importing ── */}
        {step === "importing" && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <p className="text-muted-foreground">Uvozim zaduženja…</p>
          </div>
        )}

        {/* ── Step: review ── */}
        {step === "review" && (
          <>
            <div className="text-sm text-muted-foreground flex gap-4">
              <span>Ukupno redova: <strong>{rows.length}</strong></span>
              <span className="text-green-600">Za uvoz: <strong>{toImportCount}</strong></span>
              {skipCount > 0 && <span className="text-red-500">Preskočeno (bez podudaranja): <strong>{skipCount}</strong></span>}
            </div>

            <div className="overflow-auto flex-1 border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-muted sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left w-8">#</th>
                    <th className="px-3 py-2 text-left">Datum</th>
                    <th className="px-3 py-2 text-left">Valuta</th>
                    <th className="px-3 py-2 text-left">Klijent u fajlu</th>
                    <th className="px-3 py-2 text-right">Iznos</th>
                    <th className="px-3 py-2 text-left">Klijent u bazi</th>
                    <th className="px-3 py-2 text-center">Uveži</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className={`border-t ${row.skip ? "opacity-40" : ""}`}>
                      <td className="px-3 py-2 text-muted-foreground">{idx + 1}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.datum}</td>
                      <td className="px-3 py-2 whitespace-nowrap">{row.valuta}</td>
                      <td className="px-3 py-2 max-w-[200px]">
                        <span className="text-xs text-muted-foreground break-words">{row.klijentRaw}</span>
                      </td>
                      <td className="px-3 py-2 text-right whitespace-nowrap font-mono">
                        {new Intl.NumberFormat("sr-RS", { minimumFractionDigits: 2 }).format(row.iznos)}
                      </td>
                      <td className="px-3 py-2 min-w-[260px]">
                        {row.candidates.length === 0 ? (
                          <span className="text-red-500 text-xs">Nema podudaranja</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <select
                              className="w-full border border-border rounded px-2 py-1 text-xs bg-background"
                              value={row.selectedId ?? ""}
                              onChange={(e) => updateRow(idx, { selectedId: e.target.value ? Number(e.target.value) : null, skip: !e.target.value })}
                              disabled={row.skip}
                            >
                              {row.candidates.map((c) => (
                                <option key={c.ID_Klijent} value={c.ID_Klijent}>
                                  {c.Naziv}{c.Grad ? ` — ${c.Grad}` : ""}
                                </option>
                              ))}
                            </select>
                            {(() => {
                              const sel = row.candidates.find((c) => c.ID_Klijent === row.selectedId);
                              return sel ? scoreBadge(sel.score) : null;
                            })()}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={!row.skip}
                          disabled={row.candidates.length === 0}
                          onChange={(e) => updateRow(idx, { skip: !e.target.checked })}
                          className="w-4 h-4 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={reset}>
                <Upload className="w-4 h-4 mr-2" />
                Novi fajl
              </Button>
              <Button onClick={handleImport} disabled={toImportCount === 0}>
                Uvezi {toImportCount} zaduženja
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
