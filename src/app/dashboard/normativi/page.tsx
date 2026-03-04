"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Check,
  ChevronsUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Artikal = {
  Id_Artikal: number;
  DESCRIPTION: string | null;
  BAR_CODE: string | null;
};

function ArtikalCombobox({
  open,
  onOpenChange,
  searchValue,
  onSearchChange,
  options,
  selectedId,
  selectedNaziv,
  onSelect,
  placeholder,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  searchValue: string;
  onSearchChange: (v: string) => void;
  options: Artikal[];
  selectedId: number;
  selectedNaziv: string;
  onSelect: (a: Artikal) => void;
  placeholder: string;
}) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedId ? selectedNaziv || `Artikal #${selectedId}` : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Pretraži artikle..."
            value={searchValue}
            onValueChange={onSearchChange}
          />
          <CommandList>
            <CommandEmpty>
              {searchValue.length < 2
                ? "Unesite najmanje 2 karaktera..."
                : "Nema rezultata."}
            </CommandEmpty>
            <CommandGroup>
              {options.map((a) => (
                <CommandItem
                  key={a.Id_Artikal}
                  value={String(a.Id_Artikal)}
                  onSelect={() => {
                    onSelect(a);
                    onOpenChange(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedId === a.Id_Artikal ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <span className="flex-1">{a.DESCRIPTION}</span>
                  <span className="text-muted-foreground text-xs ml-2">
                    {a.BAR_CODE}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

type NormativDetalj = {
  id: number;
  normativ_id: number;
  id_artikal: number;
  kolicina: string;
  artikli: Artikal;
};

type NormativZaglavlje = {
  id: number;
  broj: string;
  datum: string;
  vreme: string;
  id_artikal: number;
  artikli: Artikal;
  normativi_detalji: NormativDetalj[];
};

export default function NormativiPage() {
  const [normativi, setNormativi] = useState<NormativZaglavlje[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Header form
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NormativZaglavlje | null>(
    null,
  );
  const [headerForm, setHeaderForm] = useState({
    datum: new Date().toISOString().split("T")[0],
    id_artikal: 0,
    artikal_naziv: "",
  });
  const [openArtikalHeader, setOpenArtikalHeader] = useState(false);
  const [artikalSearchHeader, setArtikalSearchHeader] = useState("");
  const [artikalOptionsHeader, setArtikalOptionsHeader] = useState<Artikal[]>(
    [],
  );

  // Detalj form
  const [isDetaljOpen, setIsDetaljOpen] = useState(false);
  const [activeNormativId, setActiveNormativId] = useState<number | null>(null);
  const [detaljForm, setDetaljForm] = useState({
    id_artikal: 0,
    artikal_naziv: "",
    kolicina: "",
  });
  const [openArtikalDetalj, setOpenArtikalDetalj] = useState(false);
  const [artikalSearchDetalj, setArtikalSearchDetalj] = useState("");
  const [artikalOptionsDetalj, setArtikalOptionsDetalj] = useState<Artikal[]>(
    [],
  );

  // Edit detalj form
  const [isEditDetaljOpen, setIsEditDetaljOpen] = useState(false);
  const [editingDetalj, setEditingDetalj] = useState<NormativDetalj | null>(
    null,
  );
  const [editDetaljKolicina, setEditDetaljKolicina] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/normativi");
      const data = await res.json();
      setNormativi(data.data || []);
    } catch {
      toast.error("Greška pri učitavanju podataka");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const searchArtikli = useCallback(
    async (term: string, setter: (a: Artikal[]) => void, normativi = false) => {
      if (!term || term.length < 2) {
        setter([]);
        return;
      }
      try {
        const params = new URLSearchParams({ search: term, limit: "20" });
        if (normativi) params.set("normativi", "1");
        const res = await fetch(`/api/articles?${params}`);
        const data = await res.json();
        setter(data.data || []);
      } catch {
        setter([]);
      }
    },
    [],
  );

  useEffect(() => {
    const t = setTimeout(
      () => searchArtikli(artikalSearchHeader, setArtikalOptionsHeader, true),
      300,
    );
    return () => clearTimeout(t);
  }, [artikalSearchHeader, searchArtikli]);

  useEffect(() => {
    const t = setTimeout(
      () => searchArtikli(artikalSearchDetalj, setArtikalOptionsDetalj),
      300,
    );
    return () => clearTimeout(t);
  }, [artikalSearchDetalj, searchArtikli]);

  const resetHeaderForm = () => {
    setHeaderForm({
      datum: new Date().toISOString().split("T")[0],
      id_artikal: 0,
      artikal_naziv: "",
    });
    setArtikalSearchHeader("");
    setArtikalOptionsHeader([]);
  };

  const resetDetaljForm = () => {
    setDetaljForm({ id_artikal: 0, artikal_naziv: "", kolicina: "" });
    setArtikalSearchDetalj("");
    setArtikalOptionsDetalj([]);
  };

  const handleCreate = async () => {
    if (!headerForm.id_artikal) {
      toast.error("Izaberite artikal");
      return;
    }
    try {
      const res = await fetch("/api/normativi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datum: headerForm.datum,
          id_artikal: headerForm.id_artikal,
        }),
      });
      if (res.ok) {
        toast.success("Normativ kreiran");
        setIsCreateOpen(false);
        resetHeaderForm();
        loadData();
      } else {
        toast.error("Greška pri kreiranju");
      }
    } catch {
      toast.error("Greška pri kreiranju");
    }
  };

  const handleEdit = async () => {
    if (!editingItem || !headerForm.id_artikal) {
      toast.error("Izaberite artikal");
      return;
    }
    try {
      const res = await fetch(`/api/normativi/${editingItem.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          datum: headerForm.datum,
          id_artikal: headerForm.id_artikal,
        }),
      });
      if (res.ok) {
        toast.success("Normativ izmenjen");
        setIsEditOpen(false);
        setEditingItem(null);
        resetHeaderForm();
        loadData();
      } else {
        toast.error("Greška pri izmeni");
      }
    } catch {
      toast.error("Greška pri izmeni");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/normativi/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Normativ obrisan");
        loadData();
      } else {
        toast.error("Greška pri brisanju");
      }
    } catch {
      toast.error("Greška pri brisanju");
    }
  };

  const openEdit = (item: NormativZaglavlje) => {
    setEditingItem(item);
    setHeaderForm({
      datum: new Date(item.datum).toISOString().split("T")[0],
      id_artikal: item.id_artikal,
      artikal_naziv: item.artikli?.DESCRIPTION || "",
    });
    setArtikalOptionsHeader(item.artikli ? [item.artikli] : []);
    setIsEditOpen(true);
  };

  const openAddDetalj = (normativId: number) => {
    setActiveNormativId(normativId);
    resetDetaljForm();
    setIsDetaljOpen(true);
  };

  const handleAddDetalj = async () => {
    if (!activeNormativId || !detaljForm.id_artikal || !detaljForm.kolicina) {
      toast.error("Popunite sva polja");
      return;
    }
    try {
      const res = await fetch(`/api/normativi/${activeNormativId}/detalji`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id_artikal: detaljForm.id_artikal,
          kolicina: detaljForm.kolicina,
        }),
      });
      if (res.ok) {
        toast.success("Stavka dodana");
        resetDetaljForm();
        loadData();
      } else {
        toast.error("Greška pri dodavanju stavke");
      }
    } catch {
      toast.error("Greška pri dodavanju stavke");
    }
  };

  const handleEditDetalj = async () => {
    if (!editingDetalj || !editDetaljKolicina) {
      toast.error("Unesite količinu");
      return;
    }
    try {
      const res = await fetch(`/api/normativi/detalji/${editingDetalj.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kolicina: editDetaljKolicina }),
      });
      if (res.ok) {
        toast.success("Stavka izmenjena");
        setIsEditDetaljOpen(false);
        setEditingDetalj(null);
        loadData();
      } else {
        toast.error("Greška pri izmeni stavke");
      }
    } catch {
      toast.error("Greška pri izmeni stavke");
    }
  };

  const handleDeleteDetalj = async (id: number) => {
    try {
      const res = await fetch(`/api/normativi/detalji/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast.success("Stavka obrisana");
        loadData();
      } else {
        toast.error("Greška pri brisanju stavke");
      }
    } catch {
      toast.error("Greška pri brisanju stavke");
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const filtered = normativi.filter((item) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      item.broj.toLowerCase().includes(s) ||
      (item.artikli?.DESCRIPTION?.toLowerCase() || "").includes(s)
    );
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Normativi</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pretraži..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            <Dialog
              open={isCreateOpen}
              onOpenChange={(v) => {
                setIsCreateOpen(v);
                if (!v) resetHeaderForm();
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novi Normativ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Dodaj Novi Normativ</DialogTitle>
                  <DialogDescription>Kreiraj novi normativ.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Datum</label>
                    <Input
                      type="date"
                      value={headerForm.datum}
                      onChange={(e) =>
                        setHeaderForm({ ...headerForm, datum: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right">Artikal</label>
                    <div className="col-span-3">
                      <ArtikalCombobox
                        open={openArtikalHeader}
                        onOpenChange={setOpenArtikalHeader}
                        searchValue={artikalSearchHeader}
                        onSearchChange={setArtikalSearchHeader}
                        options={artikalOptionsHeader}
                        selectedId={headerForm.id_artikal}
                        selectedNaziv={headerForm.artikal_naziv}
                        onSelect={(a) =>
                          setHeaderForm({
                            ...headerForm,
                            id_artikal: a.Id_Artikal,
                            artikal_naziv: a.DESCRIPTION || "",
                          })
                        }
                        placeholder="Izaberi artikal..."
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate}>Sačuvaj</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th className="border border-border px-2 py-2 w-8"></th>
                  <th className="border border-border px-4 py-2 text-left">
                    Broj
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Datum
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Artikal
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Stavki
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Akcije
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-border px-4 py-8 text-center"
                    >
                      Učitavanje...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-border px-4 py-8 text-center"
                    >
                      Nema podataka
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isExpanded = expandedRows.has(item.id);
                    return (
                      <>
                        <tr key={item.id} className="hover:bg-muted">
                          <td className="border border-border px-2 py-2 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleExpand(item.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </Button>
                          </td>
                          <td className="border border-border px-4 py-2 font-mono text-sm">
                            {item.broj}
                          </td>
                          <td className="border border-border px-4 py-2">
                            {new Date(item.datum).toLocaleDateString("sr-RS")}
                          </td>
                          <td className="border border-border px-4 py-2">
                            <div className="font-medium">
                              {item.artikli?.DESCRIPTION}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.artikli?.BAR_CODE}
                            </div>
                          </td>
                          <td className="border border-border px-4 py-2 text-center">
                            {item.normativi_detalji?.length || 0}
                          </td>
                          <td className="border border-border px-4 py-2">
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEdit(item)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAddDetalj(item.id)}
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Da li ste sigurni?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Ova akcija je nepovratna. Sve stavke
                                      normativa će biti obrisane.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Odustani
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(item.id)}
                                    >
                                      Obriši
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr key={`${item.id}-detalji`}>
                            <td
                              colSpan={6}
                              className="border border-border p-0"
                            >
                              <div className="bg-muted/20 px-8 py-3">
                                {item.normativi_detalji?.length === 0 ? (
                                  <p className="text-sm text-muted-foreground py-2">
                                    Nema stavki. Kliknite + da dodate.
                                  </p>
                                ) : (
                                  <table className="w-full border-collapse">
                                    <thead>
                                      <tr className="text-sm">
                                        <th className="border border-border px-3 py-1 text-left bg-muted/50">
                                          Artikal
                                        </th>
                                        <th className="border border-border px-3 py-1 text-left bg-muted/50">
                                          Barkod
                                        </th>
                                        <th className="border border-border px-3 py-1 text-right bg-muted/50">
                                          Količina
                                        </th>
                                        <th className="border border-border px-3 py-1 text-left bg-muted/50 w-20">
                                          Akcije
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {item.normativi_detalji.map((d) => (
                                        <tr
                                          key={d.id}
                                          className="text-sm hover:bg-muted/40"
                                        >
                                          <td className="border border-border px-3 py-1">
                                            {d.artikli?.DESCRIPTION}
                                          </td>
                                          <td className="border border-border px-3 py-1 text-muted-foreground">
                                            {d.artikli?.BAR_CODE}
                                          </td>
                                          <td className="border border-border px-3 py-1 text-right font-mono">
                                            {parseFloat(d.kolicina).toFixed(6)}
                                          </td>
                                          <td className="border border-border px-3 py-1">
                                            <div className="flex space-x-1">
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-6 w-6 p-0"
                                                onClick={() => {
                                                  setEditingDetalj(d);
                                                  setEditDetaljKolicina(
                                                    d.kolicina,
                                                  );
                                                  setIsEditDetaljOpen(true);
                                                }}
                                              >
                                                <Edit className="w-3 h-3" />
                                              </Button>
                                              <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-6 w-6 p-0"
                                                  >
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                  <AlertDialogHeader>
                                                    <AlertDialogTitle>
                                                      Da li ste sigurni?
                                                    </AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                      Obriši stavku normativa?
                                                    </AlertDialogDescription>
                                                  </AlertDialogHeader>
                                                  <AlertDialogFooter>
                                                    <AlertDialogCancel>
                                                      Odustani
                                                    </AlertDialogCancel>
                                                    <AlertDialogAction
                                                      onClick={() =>
                                                        handleDeleteDetalj(d.id)
                                                      }
                                                    >
                                                      Obriši
                                                    </AlertDialogAction>
                                                  </AlertDialogFooter>
                                                </AlertDialogContent>
                                              </AlertDialog>
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Edit normativ header dialog */}
      <Dialog
        open={isEditOpen}
        onOpenChange={(v) => {
          setIsEditOpen(v);
          if (!v) {
            setEditingItem(null);
            resetHeaderForm();
          }
        }}
      >
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Izmeni Normativ</DialogTitle>
            <DialogDescription>Izmeni podatke o normativu.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Datum</label>
              <Input
                type="date"
                value={headerForm.datum}
                onChange={(e) =>
                  setHeaderForm({ ...headerForm, datum: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Artikal</label>
              <div className="col-span-3">
                <ArtikalCombobox
                  open={openArtikalHeader}
                  onOpenChange={setOpenArtikalHeader}
                  searchValue={artikalSearchHeader}
                  onSearchChange={setArtikalSearchHeader}
                  options={artikalOptionsHeader}
                  selectedId={headerForm.id_artikal}
                  selectedNaziv={headerForm.artikal_naziv}
                  onSelect={(a) =>
                    setHeaderForm({
                      ...headerForm,
                      id_artikal: a.Id_Artikal,
                      artikal_naziv: a.DESCRIPTION || "",
                    })
                  }
                  placeholder="Izaberi artikal..."
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Sačuvaj Izmene</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add detalj dialog */}
      <Dialog
        open={isDetaljOpen}
        onOpenChange={(v) => {
          setIsDetaljOpen(v);
          if (!v) resetDetaljForm();
        }}
      >
        <DialogContent className="max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Stavke Normativa</DialogTitle>
            <DialogDescription>
              {
                normativi.find((n) => n.id === activeNormativId)?.artikli
                  ?.DESCRIPTION
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Add new row */}
            <div className="grid gap-3">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Artikal</label>
                <div className="col-span-3">
                  <ArtikalCombobox
                    open={openArtikalDetalj}
                    onOpenChange={setOpenArtikalDetalj}
                    searchValue={artikalSearchDetalj}
                    onSearchChange={setArtikalSearchDetalj}
                    options={artikalOptionsDetalj}
                    selectedId={detaljForm.id_artikal}
                    selectedNaziv={detaljForm.artikal_naziv}
                    onSelect={(a) =>
                      setDetaljForm({
                        ...detaljForm,
                        id_artikal: a.Id_Artikal,
                        artikal_naziv: a.DESCRIPTION || "",
                      })
                    }
                    placeholder="Izaberi artikal..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right text-sm">Količina</label>
                <Input
                  type="number"
                  step="0.000001"
                  placeholder="0.000000"
                  value={detaljForm.kolicina}
                  onChange={(e) =>
                    setDetaljForm({ ...detaljForm, kolicina: e.target.value })
                  }
                  className="col-span-3"
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddDetalj}>Dodaj Stavku</Button>
              </div>
            </div>
            {/* Existing detalji list */}
            <div className="border-t border-border pt-3">
              {(() => {
                const activeNormativ = normativi.find(
                  (n) => n.id === activeNormativId,
                );
                const detalji = activeNormativ?.normativi_detalji || [];
                if (detalji.length === 0)
                  return (
                    <p className="text-sm text-muted-foreground py-2">
                      Još nema stavki.
                    </p>
                  );
                return (
                  <div className="max-h-56 overflow-y-auto border border-border rounded-md">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-[orange] sticky top-0">
                          <th className="px-3 py-1 text-left font-medium">
                            Artikal
                          </th>
                          <th className="px-3 py-1 text-right font-medium w-36">
                            Količina
                          </th>
                          <th className="px-3 py-1 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {detalji.map((d) => (
                          <tr
                            key={d.id}
                            className="border-t border-border hover:bg-muted/30"
                          >
                            <td className="px-3 py-1">
                              <span className="text-muted-foreground text-xs mr-1">[{d.id_artikal}]</span>{d.artikli?.DESCRIPTION}
                            </td>
                            <td className="px-3 py-1 text-right font-mono">
                              {parseFloat(d.kolicina).toFixed(6)}
                            </td>
                            <td className="px-3 py-1">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Obriši stavku?
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      {d.artikli?.DESCRIPTION}
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Odustani
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteDetalj(d.id)}
                                    >
                                      Obriši
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetaljOpen(false)}>
              Zatvori
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit detalj dialog */}
      <Dialog
        open={isEditDetaljOpen}
        onOpenChange={(v) => {
          setIsEditDetaljOpen(v);
          if (!v) setEditingDetalj(null);
        }}
      >
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Izmeni Količinu</DialogTitle>
            <DialogDescription>
              {editingDetalj?.artikli?.DESCRIPTION}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right">Količina</label>
              <Input
                type="number"
                step="0.000001"
                placeholder="0.000000"
                value={editDetaljKolicina}
                onChange={(e) => setEditDetaljKolicina(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEditDetalj}>Sačuvaj</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
