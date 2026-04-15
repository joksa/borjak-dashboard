
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Podgrupa = {
  ID_Podgrupa: number;
  ID_Robna_Grupa: number | null;
  Naziv: string | null;
};

type PopisParcijalno = {
  dok_id: string;
  dok_godina: string;
  dok_tip: string;
  dok_broj: string;
  dok_obj1: string;
  dok_status: number;
  dok_datum: string;
  dok_opis: string; // ID_Podgrupa
  ID_Podgrupa: number | null;
  PodgrupaNaziv: string | null;
  ID_Robna_Grupa: number | null;
  RobnaGrupaNaziv: string | null;
};

type RobnaGrupa = {
  ID_Robna_Grupa: number;
  Naziv: string | null;
};

type Prodavnica = {
  ID_Prodavnica: number;
  Naziv: string | null;
  Sifra: string | null;
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

export default function PopisiParcijalnoPage() {
  const [popisi, setPopisi] = useState<PopisParcijalno[]>([]);
  const [loading, setLoading] = useState(true);
  const [robneGrupe, setRobneGrupe] = useState<RobnaGrupa[]>([]);
  const [podgrupe, setPodgrupe] = useState<Podgrupa[]>([]);
  const [prodavnice, setProdavnice] = useState<Prodavnica[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "dok_datum",
    direction: "desc",
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPopis, setEditingPopis] = useState<PopisParcijalno | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    dok_datum: new Date().toISOString().split("T")[0],
    dok_obj1: "",
    dok_opis: "", // Selected robna grupa ID
    dok_status: "1",
  });

  // Combobox open states
  const [openObjekat, setOpenObjekat] = useState(false);
  const [openRobnaGrupa, setOpenRobnaGrupa] = useState(false);
  const [openPodgrupa, setOpenPodgrupa] = useState(false);

  // Create separate open states for Edit modal to avoid conflicts if needed, 
  // currently we reuse the same form state but modal visibility separates them.
  // However, combobox open state might need to be specific if we have multiple. 
  // Since only one modal is open at a time, we can reuse variables or use a key.

  // Search state
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
    loadRobneGrupe();
    loadProdavnice();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/popisi_parcijalno");
      const data = await response.json();
      setPopisi(data.data || []);
    } catch (error) {
      console.error("Error loading popisi:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadRobneGrupe = async () => {
    try {
      const response = await fetch("/api/robne_grupe");
      const data = await response.json();
      setRobneGrupe(data.data || []);
    } catch (error) {
      console.error("Error loading robne grupe:", error);
    }
  };

  const loadPodgrupe = async (groupId: string) => {
    try {
      if (!groupId) {
        setPodgrupe([]);
        return;
      }
      const response = await fetch(`/api/podgrupe?groupId=${groupId}`);
      const data = await response.json();
      setPodgrupe(data.data || []);
    } catch (error) {
      console.error("Error loading podgrupe:", error);
    }
  };

  const loadProdavnice = async () => {
    try {
      // Fetch generous limit to simulate "all" for filtering
      const response = await fetch("/api/prodavnice?limit=1000");
      const data = await response.json();
      setProdavnice(data.data || []);
    } catch (error) {
      console.error("Error loading prodavnice:", error);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const resetForm = () => {
    setFormData({
      dok_datum: new Date().toISOString().split("T")[0],
      dok_obj1: "",
      dok_opis: "",
      dok_status: "1",
    });
    setSelectedGroupId("");
    setPodgrupe([]);
  };

  const handleCreate = async () => {
    if (!formData.dok_obj1 || !formData.dok_opis) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch("/api/popisi_parcijalno", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Record created successfully");
        setIsCreateModalOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error("Failed to create record");
      }
    } catch (error) {
      console.error("Error creating record:", error);
      toast.error("Failed to create record");
    }
  };

  const handleEdit = async () => {
    if (!editingPopis) return;
    if (!formData.dok_obj1 || !formData.dok_opis) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const response = await fetch(`/api/popisi_parcijalno/${editingPopis.dok_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Record updated successfully");
        setIsEditModalOpen(false);
        setEditingPopis(null);
        resetForm();
        loadData();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to update record");
      }
    } catch (error) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/popisi_parcijalno/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Record deleted successfully");
        loadData();
      } else {
        const err = await response.json();
        toast.error(err.error || "Failed to delete record");
      }
    } catch (error) {
      console.error("Error deleting record:", error);
      toast.error("Failed to delete record");
    }
  };

  const openEditModal = (item: PopisParcijalno) => {
    setEditingPopis(item);
    setFormData({
      dok_datum: new Date(item.dok_datum).toISOString().split("T")[0],
      dok_obj1: item.dok_obj1,
      dok_opis: item.dok_opis,
      dok_status: item.dok_status.toString(),
    });
    if (item.ID_Robna_Grupa) {
      const gId = item.ID_Robna_Grupa.toString();
      setSelectedGroupId(gId);
      loadPodgrupe(gId);
    } else {
      setSelectedGroupId("");
      setPodgrupe([]);
    }
    setIsEditModalOpen(true);
  };

  const sortedAndFilteredData = popisi
    .filter((item) => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        item.dok_obj1.toLowerCase().includes(searchLower) ||
        (item.RobnaGrupaNaziv?.toLowerCase() || "").includes(searchLower) ||
        (item.PodgrupaNaziv?.toLowerCase() || "").includes(searchLower) ||
        item.dok_broj.includes(searchLower)
      );
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key as keyof PopisParcijalno];
      const bValue = b[sortConfig.key as keyof PopisParcijalno];

      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });

  // Reusable Combobox content
  // Note: We need to handle `open` state carefully. 
  // Since we have multiple inputs, we shouldn't share single `open` state if both are visible, 
  // but they are in different fields.

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="w-full">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Popisi Parcijalno</CardTitle>
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
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novi Popis
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Dodaj Novi Popis</DialogTitle>
                    <DialogDescription>
                      Kreiraj novi parcijalni popis.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="dok_datum" className="text-right">Datum</label>
                      <DateInput
                        id="dok_datum"
                        value={formData.dok_datum}
                        onChange={(e) => setFormData({ ...formData, dok_datum: e.target.value })}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="dok_obj1" className="text-right">Objekat</label>
                      <Popover open={openObjekat} onOpenChange={setOpenObjekat}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openObjekat}
                            className="col-span-3 justify-between"
                          >
                            {formData.dok_obj1
                              ? prodavnice.find((store) => (store.Sifra === formData.dok_obj1 || store.ID_Prodavnica.toString() === formData.dok_obj1))?.Naziv || formData.dok_obj1
                              : "Izaberi objekat..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Pretraži prodavnice..." />
                            <CommandList>
                              <CommandEmpty>Nema rezultata.</CommandEmpty>
                              <CommandGroup>
                                {prodavnice.map((store) => (
                                  <CommandItem
                                    key={store.ID_Prodavnica}
                                    value={`${store.Naziv} ${store.Sifra || store.ID_Prodavnica}`} // searchable text
                                    onSelect={(currentValue) => {
                                      setFormData({ ...formData, dok_obj1: store.Sifra || store.ID_Prodavnica.toString() });
                                      setOpenObjekat(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.dok_obj1 === (store.Sifra || store.ID_Prodavnica.toString()) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {store.Naziv} ({store.Sifra || store.ID_Prodavnica})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="dok_grupa" className="text-right">Robna Grupa</label>
                      <Popover open={openRobnaGrupa} onOpenChange={setOpenRobnaGrupa}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openRobnaGrupa}
                            className="col-span-3 justify-between"
                          >
                            {selectedGroupId
                              ? robneGrupe.find((rg) => rg.ID_Robna_Grupa.toString() === selectedGroupId)?.Naziv || selectedGroupId
                              : "Izaberi grupu..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Pretraži grupe..." />
                            <CommandList>
                              <CommandEmpty>Nema rezultata.</CommandEmpty>
                              <CommandGroup>
                                {robneGrupe.map((rg) => (
                                  <CommandItem
                                    key={rg.ID_Robna_Grupa}
                                    value={`${rg.Naziv} ${rg.ID_Robna_Grupa}`} // searchable text
                                    onSelect={(currentValue) => {
                                      setSelectedGroupId(rg.ID_Robna_Grupa.toString());
                                      setFormData({ ...formData, dok_opis: "" }); // Reset podgrupa
                                      loadPodgrupe(rg.ID_Robna_Grupa.toString());
                                      setOpenRobnaGrupa(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedGroupId === rg.ID_Robna_Grupa.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {rg.Naziv} ({rg.ID_Robna_Grupa})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="dok_opis" className="text-right">Podgrupa</label>
                      <Popover open={openPodgrupa} onOpenChange={setOpenPodgrupa}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            disabled={!selectedGroupId}
                            aria-expanded={openPodgrupa}
                            className="col-span-3 justify-between"
                          >
                            {formData.dok_opis
                              ? podgrupe.find((p) => p.ID_Podgrupa.toString() === formData.dok_opis)?.Naziv || formData.dok_opis
                              : "Izaberi podgrupu..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                          <Command>
                            <CommandInput placeholder="Pretraži podgrupe..." />
                            <CommandList>
                              <CommandEmpty>Nema rezultata.</CommandEmpty>
                              <CommandGroup>
                                {podgrupe.map((p) => (
                                  <CommandItem
                                    key={p.ID_Podgrupa}
                                    value={`${p.Naziv} ${p.ID_Podgrupa}`} // searchable text
                                    onSelect={(currentValue) => {
                                      setFormData({ ...formData, dok_opis: p.ID_Podgrupa.toString() });
                                      setOpenPodgrupa(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.dok_opis === p.ID_Podgrupa.toString() ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {p.Naziv} ({p.ID_Podgrupa})
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
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
                    <th className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort("dok_id")}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {getSortIcon("dok_id")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort("dok_datum")}>
                      <div className="flex items-center space-x-1">
                        <span>Datum</span>
                        {getSortIcon("dok_datum")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">Objekat</th>
                    <th className="border border-border px-4 py-2 text-left">Robna Grupa / Podgrupa</th>
                    <th className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort("dok_status")}>
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon("dok_status")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="border border-border px-4 py-8 text-center">
                        Učitavanje...
                      </td>
                    </tr>
                  ) : sortedAndFilteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="border border-border px-4 py-8 text-center">
                        Nema podataka
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredData.map((item) => (
                      <tr key={item.dok_id} className="hover:bg-muted">
                        <td className="border border-border px-4 py-2">{item.dok_broj}</td>
                        <td className="border border-border px-4 py-2">
                          {new Date(item.dok_datum).toLocaleDateString("sr-RS")}
                        </td>
                        <td className="border border-border px-4 py-2">{item.dok_obj1} {prodavnice.find(p => "" + p.ID_Prodavnica === item.dok_obj1)?.Naziv}</td>
                        <td className="border border-border px-4 py-2">
                          {item.RobnaGrupaNaziv} / {item.PodgrupaNaziv} <span className="text-muted-foreground text-sm">({item.dok_opis})</span>
                        </td>
                        <td className="border border-border px-4 py-2">
                          {item.dok_status === 1 && <Badge variant="secondary">U toku</Badge>}
                          {item.dok_status === 2 && <Badge variant="default" className="bg-green-600 hover:bg-green-700">Završeno</Badge>}
                        </td>
                        <td className="border border-border px-4 py-2">
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(item)}
                              disabled={item.dok_status === 2}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" disabled={item.dok_status === 2}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ova akcija je nepovratna.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Odustani</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item.dok_id)}>
                                    Obriši
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Izmeni Popis</DialogTitle>
            <DialogDescription>
              Izmeni podatke o popisu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_datum" className="text-right">Datum</label>
              <DateInput
                id="edit_datum"
                value={formData.dok_datum}
                onChange={(e) => setFormData({ ...formData, dok_datum: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_obj1" className="text-right">Objekat</label>
              <Popover open={openObjekat} onOpenChange={setOpenObjekat}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openObjekat}
                    className="col-span-3 justify-between"
                  >
                    {formData.dok_obj1
                      ? prodavnice.find((store) => (store.Sifra === formData.dok_obj1 || store.ID_Prodavnica.toString() === formData.dok_obj1))?.Naziv || formData.dok_obj1
                      : "Izaberi objekat..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Pretraži prodavnice..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata.</CommandEmpty>
                      <CommandGroup>
                        {prodavnice.map((store) => (
                          <CommandItem
                            key={store.ID_Prodavnica}
                            value={`${store.Naziv} ${store.Sifra || store.ID_Prodavnica}`} // searchable text
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, dok_obj1: store.Sifra || store.ID_Prodavnica.toString() });
                              setOpenObjekat(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.dok_obj1 === (store.Sifra || store.ID_Prodavnica.toString()) ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {store.Naziv} ({store.Sifra || store.ID_Prodavnica})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_grupa" className="text-right">Robna Grupa</label>
              <Popover open={openRobnaGrupa} onOpenChange={setOpenRobnaGrupa}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openRobnaGrupa}
                    className="col-span-3 justify-between"
                  >
                    {selectedGroupId
                      ? robneGrupe.find((rg) => rg.ID_Robna_Grupa.toString() === selectedGroupId)?.Naziv || selectedGroupId
                      : "Izaberi grupu..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Pretraži grupe..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata.</CommandEmpty>
                      <CommandGroup>
                        {robneGrupe.map((rg) => (
                          <CommandItem
                            key={rg.ID_Robna_Grupa}
                            value={`${rg.Naziv} ${rg.ID_Robna_Grupa}`} // searchable text
                            onSelect={(currentValue) => {
                              setSelectedGroupId(rg.ID_Robna_Grupa.toString());
                              setFormData({ ...formData, dok_opis: "" }); // Reset podgrupa
                              loadPodgrupe(rg.ID_Robna_Grupa.toString());
                              setOpenRobnaGrupa(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                selectedGroupId === rg.ID_Robna_Grupa.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {rg.Naziv} ({rg.ID_Robna_Grupa})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_podgrupa" className="text-right">Podgrupa</label>
              <Popover open={openPodgrupa} onOpenChange={setOpenPodgrupa}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    disabled={!selectedGroupId}
                    aria-expanded={openPodgrupa}
                    className="col-span-3 justify-between"
                  >
                    {formData.dok_opis
                      ? podgrupe.find((p) => p.ID_Podgrupa.toString() === formData.dok_opis)?.Naziv || formData.dok_opis
                      : "Izaberi podgrupu..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                  <Command>
                    <CommandInput placeholder="Pretraži podgrupe..." />
                    <CommandList>
                      <CommandEmpty>Nema rezultata.</CommandEmpty>
                      <CommandGroup>
                        {podgrupe.map((p) => (
                          <CommandItem
                            key={p.ID_Podgrupa}
                            value={`${p.Naziv} ${p.ID_Podgrupa}`} // searchable text
                            onSelect={(currentValue) => {
                              setFormData({ ...formData, dok_opis: p.ID_Podgrupa.toString() });
                              setOpenPodgrupa(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.dok_opis === p.ID_Podgrupa.toString() ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {p.Naziv} ({p.ID_Podgrupa})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_status" className="text-right">Status</label>
              <div className="col-span-3">
                <Select
                  value={formData.dok_status}
                  onValueChange={(val) => setFormData({ ...formData, dok_status: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">U toku</SelectItem>
                    <SelectItem value="2">Završeno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleEdit}>Sačuvaj Izmene</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
