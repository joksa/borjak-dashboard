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
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { LifletUvozDialog } from "@/components/liflet-uvoz-dialog";

type LifletFinansije = {
  id: number;
  Id_klijent: number | null;
  dug: number;
  iznos: number;
  datum: Date;
  valuta: Date | null;
  napomena: string | null;
  klijenti?: {
    ID_Klijent: number;
    Naziv: string | null;
    PIB: string | null;
    Adresa: string | null;
    Telefon: string | null;
  };
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

type ClientSearchResult = {
  ID_Klijent: number;
  Naziv: string | null;
  PIB: string | null;
};

export default function ZaduzenjaPage() {
  const [finansije, setFinansije] = useState<LifletFinansije[]>([]);
  const [loading, setLoading] = useState(true);
  const [monthFilter, setMonthFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "datum",
    direction: "desc",
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUvozOpen, setIsUvozOpen] = useState(false);
  const [editingFinansija, setEditingFinansija] =
    useState<LifletFinansije | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    Id_klijent: "",
    dug: true, // Always true for zaduzenja (debts)
    iznos: "",
    datum: "",
    valuta: "",
    napomena: "",
    selectedClient: null as ClientSearchResult | null,
  });

  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [searchedClients, setSearchedClients] = useState<ClientSearchResult[]>(
    [],
  );
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    loadFinansije();
  }, [sortConfig]);

  const loadFinansije = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/liflet/finansije?dug=1`);
      const data = await response.json();
      setFinansije(data.data || []);
    } catch (error) {
      console.error("Error loading finansije:", error);
      toast.error("Failed to load financial data");
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleCreate = async () => {
    if (!formData.Id_klijent) {
      toast.error("Klijent je obavezan");
      return;
    }
    if (!formData.iznos || parseFloat(formData.iznos) <= 0) {
      toast.error("Iznos je obavezan");
      return;
    }
    if (!formData.datum) {
      toast.error("Datum je obavezan");
      return;
    }
    if (!formData.valuta) {
      toast.error("Datum dospeća je obavezan");
      return;
    }
    try {
      const response = await fetch("/api/liflet/finansije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Financial record created successfully");
        setIsCreateModalOpen(false);
        resetForm();
        loadFinansije();
      } else {
        toast.error("Failed to create financial record");
      }
    } catch (error) {
      console.error("Error creating financial record:", error);
      toast.error("Failed to create financial record");
    }
  };

  const handleEdit = async () => {
    if (!editingFinansija) return;

    try {
      const response = await fetch(
        `/api/liflet/finansije/${editingFinansija.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        },
      );

      if (response.ok) {
        toast.success("Financial record updated successfully");
        setIsEditModalOpen(false);
        setEditingFinansija(null);
        resetForm();
        loadFinansije();
      } else {
        toast.error("Failed to update financial record");
      }
    } catch (error) {
      console.error("Error updating financial record:", error);
      toast.error("Failed to update financial record");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/liflet/finansije/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Financial record deleted successfully");
        loadFinansije();
      } else {
        toast.error("Failed to delete financial record");
      }
    } catch (error) {
      console.error("Error deleting financial record:", error);
      toast.error("Failed to delete financial record");
    }
  };

  const resetForm = () => {
    setFormData({
      Id_klijent: "",
      dug: true,
      iznos: "",
      datum: "",
      valuta: "",
      napomena: "",
      selectedClient: null,
    });
    setClientSearchTerm("");
    setSearchedClients([]);
  };

  const searchClients = async (search: string) => {
    if (search.length < 2) {
      setSearchedClients([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/clients?search=${encodeURIComponent(search)}&limit=20`,
      );
      const data = await response.json();
      setSearchedClients(data.data || []);
      setShowClientDropdown(true);
    } catch (error) {
      console.error("Error searching clients:", error);
    }
  };

  const selectClient = (client: ClientSearchResult) => {
    setFormData({
      ...formData,
      Id_klijent: client.ID_Klijent.toString(),
      selectedClient: client,
    });
    setClientSearchTerm(`${client.Naziv} (${client.PIB})`);
    setShowClientDropdown(false);
  };

  const openEditModal = (finansija: LifletFinansije) => {
    setEditingFinansija(finansija);
    setFormData({
      Id_klijent: finansija.Id_klijent?.toString() || "",
      dug: true, // Always true for zaduzenja
      iznos: finansija.iznos.toString(),
      datum: new Date(finansija.datum).toISOString().split("T")[0],
      valuta: finansija.valuta
        ? new Date(finansija.valuta).toISOString().split("T")[0]
        : "",
      napomena: finansija.napomena || "",
      selectedClient: finansija.klijenti || null,
    });
    setClientSearchTerm(
      finansija.klijenti
        ? `${finansija.klijenti.Naziv} (${finansija.klijenti.PIB})`
        : "",
    );
    setIsEditModalOpen(true);
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  // Serbian number formatting function
  const formatSerbianDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    const d = String(dateObj.getUTCDate()).padStart(2, "0");
    const m = String(dateObj.getUTCMonth() + 1).padStart(2, "0");
    const y = dateObj.getUTCFullYear();
    return `${d}.${m}.${y}`;
  };

  const formatSerbianNumber = (value: number) => {
    return new Intl.NumberFormat("sr-RS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Months for filter dropdown
  const months = [
    { value: "all", label: "Svi meseci" },
    { value: "01", label: "Januar" },
    { value: "02", label: "Februar" },
    { value: "03", label: "Mart" },
    { value: "04", label: "April" },
    { value: "05", label: "Maj" },
    { value: "06", label: "Jun" },
    { value: "07", label: "Juli" },
    { value: "08", label: "Avgust" },
    { value: "09", label: "Septembar" },
    { value: "10", label: "Oktobar" },
    { value: "11", label: "Novembar" },
    { value: "12", label: "Decembar" },
  ];

  const filteredFinansije = finansije
    .filter((finansija) => {
      // Month filter
      const matchesMonth =
        monthFilter === "all" ||
        new Date(finansija.datum).getMonth() + 1 === parseInt(monthFilter);

      // Client filter
      const matchesClient =
        clientFilter === "all" || finansija.klijenti?.Naziv === clientFilter;

      return matchesMonth && matchesClient;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key as keyof LifletFinansije];
      const bValue = b[sortConfig.key as keyof LifletFinansije];

      // Handle null/undefined values
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

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Detalji o zaduženjima */}
      <div className="w-full">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle>Detalji o zaduženjima</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsUvozOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Uvoz
              </Button>
              <LifletUvozDialog
                open={isUvozOpen}
                onOpenChange={setIsUvozOpen}
                onImported={loadFinansije}
              />
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Zaduženje
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Dodaj Novo Zaduženje</DialogTitle>
                  <DialogDescription>
                    Dodaj novo zaduženje/obavezu.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="client_search" className="text-right">
                      Klijent
                    </label>
                    <div className="col-span-3 relative">
                      <Input
                        id="client_search"
                        placeholder="Pretražite klijente..."
                        value={clientSearchTerm}
                        onChange={(e) => {
                          setClientSearchTerm(e.target.value);
                          searchClients(e.target.value);
                        }}
                        className="w-full"
                      />
                      {showClientDropdown && searchedClients.length > 0 && (
                        <div className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searchedClients.map((client) => (
                            <div
                              key={client.ID_Klijent}
                              className="px-4 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                              onClick={() => selectClient(client)}
                            >
                              <div className="font-medium">{client.Naziv}</div>
                              <div className="text-sm text-muted-foreground">
                                PIB: {client.PIB}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="iznos" className="text-right">
                      Iznos
                    </label>
                    <Input
                      id="iznos"
                      type="number"
                      step="0.01"
                      value={formData.iznos}
                      onChange={(e) =>
                        setFormData({ ...formData, iznos: e.target.value })
                      }
                      className="col-span-3"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="datum" className="text-right">
                      Datum
                    </label>
                    <DateInput
                      id="datum"
                      value={formData.datum}
                      onChange={(e) =>
                        setFormData({ ...formData, datum: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="valuta" className="text-right">
                      Datum dospeća
                    </label>
                    <DateInput
                      id="valuta"
                      value={formData.valuta}
                      onChange={(e) =>
                        setFormData({ ...formData, valuta: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="napomena" className="text-right">
                      Napomena
                    </label>
                    <Input
                      id="napomena"
                      value={formData.napomena}
                      onChange={(e) =>
                        setFormData({ ...formData, napomena: e.target.value })
                      }
                      className="col-span-3"
                      placeholder="Opciona napomena"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreate}>
                    Dodaj Zaduženje
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtriraj po mesecu" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtriraj po klijentu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Svi Klijenti</SelectItem>
                  {Array.from(
                    new Set(
                      finansije
                        .filter((item) => item.klijenti?.Naziv)
                        .map((item) => item.klijenti!.Naziv!),
                    ),
                  )
                    .sort()
                    .map((clientName) => (
                      <SelectItem key={clientName} value={clientName}>
                        {clientName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("id")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>ID</span>
                        {getSortIcon("id")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      Klijent
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("iznos")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Iznos</span>
                        {getSortIcon("iznos")}
                      </div>
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("datum")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Datum</span>
                        {getSortIcon("datum")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      Datum dospeća
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      Napomena
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
                        colSpan={7}
                        className="border border-border px-4 py-8 text-center"
                      >
                        Učitavanje...
                      </td>
                    </tr>
                  ) : filteredFinansije.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-border px-4 py-8 text-center"
                      >
                        Nije pronađeno nijedno zaduženje
                      </td>
                    </tr>
                  ) : (
                    filteredFinansije.map((finansija) => (
                      <tr key={finansija.id} className="hover:bg-muted">
                        <td className="border border-border px-4 py-2">
                          {finansija.id}
                        </td>
                        <td className="border border-border px-4 py-2">
                          <div>
                            <div className="font-medium">
                              {finansija.klijenti?.Naziv}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              PIB: {finansija.klijenti?.PIB}
                            </div>
                          </div>
                        </td>
                        <td className="border border-border px-4 py-2 text-right">
                          {formatSerbianNumber(Number(finansija.iznos))}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {formatSerbianDate(finansija.datum)}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {finansija.valuta
                            ? formatSerbianDate(finansija.valuta)
                            : "-"}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {finansija.napomena || "-"}
                        </td>
                        <td className="border border-border px-4 py-2">
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditModal(finansija)}
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
                                  <AlertDialogTitle>
                                    Da li ste sigurni?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Ova akcija ne može biti poništena. Ovo će
                                    trajno obrisati ovaj zapis o zaduženju.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Odustani
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(finansija.id)}
                                  >
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
                <tfoot>
                  <tr className="bg-muted/30 font-semibold">
                    <td
                      colSpan={2}
                      className="border border-border px-4 py-3 text-right"
                    >
                      UKUPNO:
                    </td>
                    <td className="border border-border px-4 py-3 text-right">
                      {formatSerbianNumber(
                        filteredFinansije.reduce(
                          (sum, f) => sum + Number(f.iznos || 0),
                          0,
                        ),
                      )}
                    </td>
                    <td
                      colSpan={4}
                      className="border border-border px-4 py-3 text-right"
                    >
                      {/* Prazne ćelije za preostale kolone */}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uredi Zaduženje</DialogTitle>
            <DialogDescription>
              Ažuriraj informacije o zaduženju.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_client" className="text-right">
                Klijent
              </label>
              <div className="col-span-3">
                <Input
                  id="edit_client"
                  value={clientSearchTerm}
                  disabled
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_iznos" className="text-right">
                Iznos
              </label>
              <Input
                id="edit_iznos"
                type="number"
                step="0.01"
                value={formData.iznos}
                onChange={(e) =>
                  setFormData({ ...formData, iznos: e.target.value })
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_datum" className="text-right">
                Datum
              </label>
              <DateInput
                id="edit_datum"
                value={formData.datum}
                onChange={(e) =>
                  setFormData({ ...formData, datum: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_valuta" className="text-right">
                Datum dospeća
              </label>
              <DateInput
                id="edit_valuta"
                value={formData.valuta}
                onChange={(e) =>
                  setFormData({ ...formData, valuta: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_napomena" className="text-right">
                Napomena
              </label>
              <Input
                id="edit_napomena"
                value={formData.napomena}
                onChange={(e) =>
                  setFormData({ ...formData, napomena: e.target.value })
                }
                className="col-span-3"
                placeholder="Opciona napomena"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEdit}>
              Ažuriraj Zaduženje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
