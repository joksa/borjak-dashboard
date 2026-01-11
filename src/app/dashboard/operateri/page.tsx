
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  ChevronsUpDown,
  X
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type Operater = {
  op_id: number;
  op_ime_prezime: string;
  op_lozinka: string;
  op_aktivan: number;
  op_objekat: string;
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

export default function OperateriPage() {
  const [operateri, setOperateri] = useState<Operater[]>([]);
  const [loading, setLoading] = useState(true);
  const [prodavnice, setProdavnice] = useState<Prodavnica[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "op_ime_prezime",
    direction: "asc",
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOperater, setEditingOperater] = useState<Operater | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    op_ime_prezime: "",
    op_lozinka: "",
    op_aktivan: "1",
    op_objekat: "",
  });
  
  // Combobox open states
  const [openObjekat, setOpenObjekat] = useState(false);
  
  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("SVE");

  useEffect(() => {
    loadData();
    loadProdavnice();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/operateri");
      const data = await response.json();
      setOperateri(data.data || []);
    } catch (error) {
      console.error("Error loading operateri:", error);
      toast.error("Greška pri učitavanju podataka");
    } finally {
      setLoading(false);
    }
  };

  const loadProdavnice = async () => {
    try {
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
      op_ime_prezime: "",
      op_lozinka: "",
      op_aktivan: "1",
      op_objekat: "",
    });
  };

  const handleCreate = async () => {
    if (!formData.op_ime_prezime || !formData.op_lozinka || !formData.op_objekat) {
      toast.error("Molimo popunite sva obavezna polja");
      return;
    }

    try {
      const response = await fetch("/api/operateri", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Operater uspešno kreiran");
        setIsCreateModalOpen(false);
        resetForm();
        loadData();
      } else {
        toast.error("Greška pri kreiranju operatera");
      }
    } catch (error) {
      console.error("Error creating operater:", error);
      toast.error("Greška pri kreiranju operatera");
    }
  };

  const handleEdit = async () => {
    if (!editingOperater) return;
    if (!formData.op_ime_prezime || !formData.op_lozinka || !formData.op_objekat) {
        toast.error("Molimo popunite sva obavezna polja");
        return;
    }

    try {
      const response = await fetch(`/api/operateri/${editingOperater.op_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Operater uspešno izmenjen");
        setIsEditModalOpen(false);
        setEditingOperater(null);
        resetForm();
        loadData();
      } else {
        const err = await response.json();
        toast.error(err.error || "Greška pri izmeni operatera");
      }
    } catch (error) {
      console.error("Error updating operater:", error);
      toast.error("Greška pri izmeni operatera");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/operateri/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Operater uspešno obrisan");
        loadData();
      } else {
        const err = await response.json();
        toast.error(err.error || "Greška pri brisanju operatera");
      }
    } catch (error) {
      console.error("Error deleting operater:", error);
      toast.error("Greška pri brisanju operatera");
    }
  };

  const openEditModal = (item: Operater) => {
    setEditingOperater(item);
    setFormData({
      op_ime_prezime: item.op_ime_prezime,
      op_lozinka: item.op_lozinka,
      op_aktivan: item.op_aktivan.toString(),
      op_objekat: item.op_objekat,
    });
    setIsEditModalOpen(true);
  };

  const sortedAndFilteredData = operateri
    .filter((item) => {
        // Search term filter
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = !searchTerm || 
            item.op_ime_prezime.toLowerCase().includes(searchLower) ||
            item.op_objekat.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;

        // Store filter logic
        if (selectedStoreFilter === "SVE") return true;
        
        // Get array of assigned store IDs, filtering out empty strings/whitespace
        const assignedStores = (item.op_objekat || "")
            .split(" ")
            .map(s => s.trim())
            .filter(Boolean);

        // If the operator has 'SVE' assigned, they have access to everything
        if (assignedStores.includes("SVE")) return true;

        // Otherwise, check if the selected store ID is in their assigned list
        return assignedStores.includes(selectedStoreFilter);
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key as keyof Operater];
      const bValue = b[sortConfig.key as keyof Operater];

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

  const handleToggleStore = (storeId: string) => {
    let current = formData.op_objekat.split(" ").filter(s => s !== "");
    
    if (storeId === "SVE") {
      setFormData({ ...formData, op_objekat: "SVE" });
      return;
    }

    // If "SVE" was selected, and we select a specific store, remove "SVE"
    if (current.includes("SVE")) {
      current = [];
    }

    if (current.includes(storeId)) {
      current = current.filter(s => s !== storeId);
    } else {
      current.push(storeId);
    }

    setFormData({ ...formData, op_objekat: current.join(" ") });
  };

  const getObjekatDisplay = (val: string) => {
    if (!val) return "Izaberi objekte...";
    if (val === "SVE") return "SVE";
    
    const ids = val.split(" ");
    if (ids.length > 2) return `${ids.length} objekta izabrana`;
    
    return ids.map(id => {
      const store = prodavnice.find(p => p.ID_Prodavnica.toString() === id || p.Sifra === id);
      return store ? store.Naziv : id;
    }).join(", ");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="w-full">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Operateri</CardTitle>
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
                  <Select value={selectedStoreFilter} onValueChange={setSelectedStoreFilter}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Filtriraj po objektu" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SVE">Svi Objekti</SelectItem>
                      {prodavnice.map((store) => (
                        <SelectItem key={store.ID_Prodavnica} value={store.ID_Prodavnica.toString()}>
                          {store.Naziv}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                    <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Novi Operater
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[500px]">
                    <DialogHeader>
                    <DialogTitle>Dodaj Novog Operatera</DialogTitle>
                    <DialogDescription>
                        Kreiraj novog operatera u sistemu.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="op_ime_prezime" className="text-right">Ime i Prezime</label>
                        <Input
                        id="op_ime_prezime"
                        value={formData.op_ime_prezime}
                        onChange={(e) => setFormData({ ...formData, op_ime_prezime: e.target.value })}
                        className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="op_lozinka" className="text-right">Lozinka</label>
                        <Input
                        id="op_lozinka"
                        maxLength={8}
                        minLength={4}
                        type="number"
                        value={formData.op_lozinka}
                        onChange={(e) => setFormData({ ...formData, op_lozinka: e.target.value })}
                        className="col-span-3 spin-button-hidden"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <label htmlFor="op_objekat" className="text-right">Objekti</label>
                        <Popover open={openObjekat} onOpenChange={setOpenObjekat}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openObjekat}
                              className="col-span-3 justify-between"
                            >
                              <span className="truncate">{getObjekatDisplay(formData.op_objekat)}</span>
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[350px] p-0">
                            <Command>
                              <CommandInput placeholder="Pretraži objekte..." />
                              <CommandList>
                                <CommandEmpty>Nema rezultata.</CommandEmpty>
                                <CommandGroup>
                                  <CommandItem
                                    onSelect={() => handleToggleStore("SVE")}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        formData.op_objekat === "SVE" ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    SVE
                                  </CommandItem>
                                  {prodavnice.map((store) => (
                                    <CommandItem
                                      key={store.ID_Prodavnica}
                                      value={`${store.Naziv} ${store.Sifra || store.ID_Prodavnica}`} // searchable text
                                      onSelect={() => handleToggleStore(store.ID_Prodavnica.toString())}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          formData.op_objekat.split(" ").includes(store.ID_Prodavnica.toString()) ? "opacity-100" : "opacity-0"
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
                        <label htmlFor="op_aktivan" className="text-right">Aktivan</label>
                        <div className="col-span-3">
                            <Select 
                                value={formData.op_aktivan} 
                                onValueChange={(val) => setFormData({ ...formData, op_aktivan: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                     <SelectItem value="1">Da</SelectItem>
                                     <SelectItem value="0">Ne</SelectItem>
                                </SelectContent>
                            </Select>
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
                    <th className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort("op_id")}>
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {getSortIcon("op_id")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort("op_ime_prezime")}>
                       <div className="flex items-center space-x-1">
                        <span>Ime i Prezime</span>
                        {getSortIcon("op_ime_prezime")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">Objekti</th>
                    <th className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted" onClick={() => handleSort("op_aktivan")}>
                        <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {getSortIcon("op_aktivan")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="border border-border px-4 py-8 text-center">
                        Učitavanje...
                      </td>
                    </tr>
                  ) : sortedAndFilteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="border border-border px-4 py-8 text-center">
                        Nema podataka
                      </td>
                    </tr>
                  ) : (
                    sortedAndFilteredData.map((item) => (
                      <tr key={item.op_id} className="hover:bg-muted">
                        <td className="border border-border px-4 py-2">{item.op_id}</td>
                        <td className="border border-border px-4 py-2 font-medium">{item.op_ime_prezime}</td>
                        <td className="border border-border px-4 py-2">
                           <div className="flex flex-wrap gap-1">
                              {item.op_objekat === "SVE" ? (
                                <Badge variant="secondary">SVE</Badge>
                              ) : (
                                item.op_objekat.split(" ").map(id => {
                                   const storeName = prodavnice.find(p => p.ID_Prodavnica.toString() === id || p.Sifra === id)?.Naziv || id;
                                   return <Badge key={id} variant="outline" className="text-xs">{storeName}</Badge>
                                })
                              )}
                           </div>
                        </td>
                        <td className="border border-border px-4 py-2">
                           {item.op_aktivan === 1 ? (
                             <Badge variant="default" className="bg-green-600 hover:bg-green-700">Aktivan</Badge>
                           ) : (
                             <Badge variant="secondary">Neaktivan</Badge>
                           )}
                        </td>
                        <td className="border border-border px-4 py-2">
                           <div className="flex space-x-1">
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openEditModal(item)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ova akcija je nepovratna. Brišete operatera {item.op_ime_prezime}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Odustani</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(item.op_id)}>
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
            <DialogTitle>Izmeni Operatera</DialogTitle>
            <DialogDescription>
                Izmeni podatke o operateru.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit_op_ime_prezime" className="text-right">Ime i Prezime</label>
                <Input
                id="edit_op_ime_prezime"
                value={formData.op_ime_prezime}
                onChange={(e) => setFormData({ ...formData, op_ime_prezime: e.target.value })}
                className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit_op_lozinka" className="text-right">Lozinka</label>
                <Input
                id="edit_op_lozinka"
                maxLength={8}
                value={formData.op_lozinka}
                onChange={(e) => setFormData({ ...formData, op_lozinka: e.target.value })}
                className="col-span-3"
                />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit_op_objekat" className="text-right">Objekti</label>
                <Popover open={openObjekat} onOpenChange={setOpenObjekat}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openObjekat}
                      className="col-span-3 justify-between"
                    >
                      <span className="truncate">{getObjekatDisplay(formData.op_objekat)}</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[350px] p-0">
                    <Command>
                      <CommandInput placeholder="Pretraži objekte..." />
                      <CommandList>
                        <CommandEmpty>Nema rezultata.</CommandEmpty>
                        <CommandGroup>
                        <CommandItem
                            onSelect={() => handleToggleStore("SVE")}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.op_objekat === "SVE" ? "opacity-100" : "opacity-0"
                              )}
                            />
                            SVE
                          </CommandItem>
                          {prodavnice.map((store) => (
                            <CommandItem
                              key={store.ID_Prodavnica}
                              value={`${store.Naziv} ${store.Sifra || store.ID_Prodavnica}`} // searchable text
                              onSelect={() => handleToggleStore(store.ID_Prodavnica.toString())}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  formData.op_objekat.split(" ").includes(store.ID_Prodavnica.toString()) ? "opacity-100" : "opacity-0"
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
                <label htmlFor="edit_op_aktivan" className="text-right">Aktivan</label>
                <div className="col-span-3">
                    <Select 
                        value={formData.op_aktivan} 
                        onValueChange={(val) => setFormData({ ...formData, op_aktivan: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                             <SelectItem value="1">Da</SelectItem>
                             <SelectItem value="0">Ne</SelectItem>
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
