"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Users, FileText, Calendar, Clock, MapPin, Activity } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface TopOperater {
  op_ime_prezime: string;
  total_records: number;
  days_worked: number;
  daily_average: number;
}

interface SyncItem {
  id: number;
  naziv: string;
  datum: string;
  vreme: string;
  total_value: number;
}

interface LastDocument {
  dok_godina: string;
  dok_tip: string;
  dok_broj: string;
  dok_klijent: number;
  klijent_naziv: string | null;
  dok_datum: string;
  dok_vreme: string;
  dok_obj1: string;
  dok_obj2: string | null;
  operater_naziv: string | null;
  created_at: string;
  stavki: number;
}

interface DocDetail {
  dd_sifra: string;
  DESCRIPTION: string | null;
  dd_barkod: string | null;
  dd_kol1: number;
  dd_kol2: number;
  dd_kol3: number;
}

export default function DashboardPage() {
  const [data, setData] = useState<{
    topOperateri: TopOperater[];
    lastDocuments: LastDocument[];
    syncStatus: SyncItem[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedDoc, setSelectedDoc] = useState<LastDocument | null>(null);
  const [details, setDetails] = useState<DocDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchStats = async (isInitial = false) => {
      try {
        if (isInitial) setLoading(true);
        const response = await fetch("/api/dashboard/stats");
        const json = await response.json();
        if (json.success) {
          setData(json.data);
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    fetchStats(true);

    const intervalId = setInterval(() => {
      fetchStats(false);
    }, 30000); // 30 seconds as requested by user update

    return () => clearInterval(intervalId);
  }, []);

  const fetchDetails = async (doc: LastDocument) => {
    setLoadingDetails(true);
    setSelectedDoc(doc);
    try {
      const params = new URLSearchParams({
        godina: doc.dok_godina,
        tip: doc.dok_tip,
        broj: doc.dok_broj,
        objekat: doc.dok_obj1
      });
      const response = await fetch(`/api/dashboard/document-details?${params.toString()}`);
      const json = await response.json();
      if (json.success) {
        setDetails(json.data);
      }
    } catch (error) {
      console.error("Error fetching doc details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("sr-RS", { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    return date.toLocaleTimeString("sr-RS", { hour: '2-digit', minute: '2-digit' });
  };

  // Helper to parse "dd/mm/yyyy" and "HH:mm:ss" into a Date object
  const parseSyncTime = (dateStr: string, timeStr: string) => {
    if (!dateStr || !timeStr) return null;
    const [day, month, year] = dateStr.split('/').map(Number);
    const [hour, minute, second] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute, second);
  };

  const getSyncStatus = (item: SyncItem) => {
    const syncTime = parseSyncTime(item.datum, item.vreme);
    if (!syncTime) return { status: 'stuck', label: 'Nepoznato' };

    const now = new Date();
    const isToday = syncTime.toLocaleDateString() === now.toLocaleDateString();
    
    // Check if more than 1 hour behind
    const diffMs = now.getTime() - syncTime.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (!isToday) return { status: 'stuck', label: 'Zastoj (Nije danas)' };
    if (diffHours > 1) return { status: 'late', label: 'Kasni (>1h)' };
    return { status: 'ok', label: 'Aktivno' };
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px] w-full rounded-xl" />
          <Skeleton className="h-[400px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
      {/* Header Summary */}
      <h1 className="text-3xl font-bold tracking-tight">Kontrolna tabla</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">        

        {/* Last Documents Card */}
        <Card className="col-span-1 lg:col-span-3 border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-emerald-500" />
              Poslednja dokumenta
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="relative overflow-x-auto h-[500px] scrollbar-thin">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-background/95 backdrop-blur-md z-10 border-b">
                  <tr className="text-muted-foreground">
                    <th className="p-4 font-medium">Tip & Broj</th>
                    <th className="p-4 font-medium">Klijent</th>
                    <th className="p-4 font-medium text-center">Objekat</th>
                    <th className="p-4 font-medium">Stavki</th>
                    <th className="p-4 font-medium">Datum / Vreme</th>
                    <th className="p-4 font-medium">Operater</th>
                    <th className="p-4 font-medium text-right">Akcija</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data?.lastDocuments.map((doc, idx) => (
                    <tr key={idx} className="hover:bg-accent/20 transition-colors group">
                      <td className="p-4">
                        <div className="font-bold text-foreground group-hover:text-blue-600 transition-colors uppercase">{doc.dok_tip}</div>
                        <div className="text-xs text-muted-foreground">{doc.dok_broj}</div>
                      </td>
                      <td className="p-4 max-w-[200px] truncate">
                        {doc.klijent_naziv ? (
                          <span className="font-medium">{doc.klijent_naziv}</span>
                        ) : (
                          <span className="text-muted-foreground italic">Bez klijenta</span>
                        )}
                        <div className="text-[10px] text-muted-foreground">ID: {doc.dok_klijent}</div>
                      </td>
                      <td className="p-4 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/50 text-[10px] font-bold">
                          <MapPin className="h-3 w-3" />
                          {doc.dok_obj1}
                          {doc.dok_obj2 && ` → ${doc.dok_obj2}`}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-mono text-sm font-bold text-blue-500">
                          {doc.stavki}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          {formatDate(doc.dok_datum)}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTime(doc.dok_vreme)}
                        </div>
                      </td>
                      <td className="p-4">
                        {doc.operater_naziv ? (
                          <div className="flex items-center gap-2">
                             <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-700 uppercase">
                               {doc.operater_naziv.slice(0, 2)}
                             </div>
                             <span className="text-xs font-medium">{doc.operater_naziv}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground italic text-xs">Sistem</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0"
                          onClick={() => fetchDetails(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Top Operateri Card */}
        <Card className="col-span-1 border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-500" />
              Top Operateri (Ova godina)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-background/95 backdrop-blur-md text-muted-foreground uppercase tracking-wider font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-2 border-b">Rang</th>
                    <th className="p-2 border-b">Ime i prezime</th>
                    <th className="p-2 border-b text-right">Prosek</th>
                    <th className="p-2 border-b text-right">Ukupno</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/20">
                  {data?.topOperateri.map((op, idx) => (
                    <tr key={idx} className="hover:bg-accent/30 transition-colors group">
                      <td className="p-2 text-muted-foreground font-mono">#{idx + 1}</td>
                      <td className="p-2 font-medium text-[13px] uppercase tracking-tight">{op.op_ime_prezime}</td>
                      <td className="p-2 text-right">
                        <span className="font-semibold text-foreground">{op.daily_average}</span>
                        <div className="text-[8px] text-muted-foreground">/dan</div>
                      </td>
                      <td className="p-2 text-right">
                        <div className="font-bold text-blue-600">{op.total_records}</div>
                        <div className="text-[8px] text-muted-foreground uppercase">Zapisa</div>
                      </td>
                    </tr>
                  ))}
                  {!data?.topOperateri.length && (
                    <tr>
                      <td colSpan={4} className="p-10 text-center text-muted-foreground italic">
                        Nema podataka za tekuću godinu
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status Card */}
        <Card className="col-span-1 border-none shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-500" />
              Sinhronizacija kasa
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[400px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-background/95 backdrop-blur-md text-muted-foreground uppercase tracking-wider font-bold sticky top-0 z-10">
                  <tr>
                    <th className="p-2 border-b">Objekat</th>
                    <th className="p-2 border-b text-center">Status</th>
                    <th className="p-2 border-b text-right">Prenos</th>
                    <th className="p-2 border-b text-right whitespace-nowrap">Vrednost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/20">
                  {data?.syncStatus.map((item, idx) => {
                    const statusInfo = getSyncStatus(item);
                    return (
                      <tr key={idx} className="hover:bg-accent/30 transition-colors group">
                        <td className="p-2 font-medium text-[13px] uppercase tracking-tight">{item.naziv}</td>
                        <td className="p-2 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`h-2 w-2 rounded-full mb-0.5 ${
                              statusInfo.status === 'ok' ? 'bg-emerald-500 animate-pulse' : 
                              statusInfo.status === 'late' ? 'bg-amber-500' : 'bg-destructive'
                            }`} />
                            <span className={`text-[8px] font-bold ${
                              statusInfo.status === 'ok' ? 'text-emerald-600' : 
                              statusInfo.status === 'late' ? 'text-amber-600' : 'text-destructive'
                            }`}>
                              {statusInfo.status === 'ok' ? 'OK' : statusInfo.status === 'late' ? 'KASNI' : 'ZASTOJ'}
                            </span>
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <div className="font-mono">{formatDate(item.datum)}</div>
                          <div className="text-muted-foreground font-mono">{item.vreme}</div>
                        </td>
                        <td className="p-2 text-right font-bold text-muted-foreground">
                          {new Intl.NumberFormat('sr-RS', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(item.total_value)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={(open) => !open && setSelectedDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center pr-8">
               <span>Stavke dokumenta: {selectedDoc?.dok_broj} ({selectedDoc?.dok_tip})</span>
               <span className="text-xs bg-accent px-2 py-1 rounded">Objekat: {selectedDoc?.dok_obj1}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto mt-4 scrollbar-thin">
            {loadingDetails ? (
              <div className="p-10 space-y-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <table className="w-full text-sm text-left border-collapse">
                <thead className="sticky top-0 bg-background z-10 border-b">
                  <tr className="text-muted-foreground">
                    <th className="p-3 font-medium">Šifra</th>
                    <th className="p-3 font-medium">Naziv artikla</th>
                    <th className="p-3 font-medium">Barkod</th>
                    <th className="p-3 font-medium text-right">Količina 1</th>
                    <th className="p-3 font-medium text-right">Količina 2</th>
                    <th className="p-3 font-medium text-right">Količina 3</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-accent/20">
                  {details.map((item, i) => (
                    <tr key={i} className="hover:bg-accent/10 transition-colors">
                      <td className="p-3 font-mono text-xs">{item.dd_sifra}</td>
                      <td className="p-3 font-medium">{item.DESCRIPTION || <span className="text-muted-foreground italic">Nepoznat artikal</span>}</td>
                      <td className="p-3 font-mono text-xs text-muted-foreground">{item.dd_barkod}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{Number(item.dd_kol1).toFixed(2)}</td>
                      <td className="p-3 text-right font-bold text-blue-600">{Number(item.dd_kol2).toFixed(2)}</td>
                     <td className="p-3 text-right font-bold text-blue-600">{Number(item.dd_kol3).toFixed(2)}</td>
                    </tr>
                  ))}
                  {details.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-10 text-center text-muted-foreground">
                        Nema stavki za ovaj dokument.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
