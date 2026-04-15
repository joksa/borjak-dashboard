"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { DateInput } from "@/components/ui/date-input";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import { toast } from "sonner";

type LifletPlan = {
  id: number;
  Id_klijent: number | null;
  iznos: number | null;
  datum_od: Date;
  datum_do: Date;
  tekst: string;
  klijenti?: {
    ID_Klijent: number;
    Naziv: string | null;
    PIB: string | null;
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

export default function PlanPage() {
  const [planovi, setPlanovi] = useState<LifletPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "datum_od",
    direction: "desc",
  });

  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<LifletPlan | null>(null);

  const [formData, setFormData] = useState({
    Id_klijent: "",
    iznos: "",
    datum_od: "",
    datum_do: "",
    tekst: "",
  });

  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [searchedClients, setSearchedClients] = useState<ClientSearchResult[]>(
    []
  );
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  useEffect(() => {
    loadPlanovi();
  }, [sortConfig]);

  const loadPlanovi = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filterDateFrom) params.set("date_from", filterDateFrom);
      if (filterDateTo) params.set("date_to", filterDateTo);
      const response = await fetch(`/api/liflet/plan?${params.toString()}`);
      const data = await response.json();
      setPlanovi(data.data || []);
    } catch (error) {
      console.error("Error loading planovi:", error);
      toast.error("Greška pri učitavanju planova");
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
    if (!formData.datum_od || !formData.datum_do || !formData.tekst) {
      toast.error("Datum od, datum do i tekst su obavezni");
      return;
    }
    try {
      const response = await fetch("/api/liflet/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success("Plan kreiran");
        setIsCreateModalOpen(false);
        resetForm();
        loadPlanovi();
      } else {
        toast.error("Greška pri kreiranju plana");
      }
    } catch (error) {
      console.error("Error creating plan:", error);
      toast.error("Greška pri kreiranju plana");
    }
  };

  const handleEdit = async () => {
    if (!editingPlan) return;
    try {
      const response = await fetch(`/api/liflet/plan/${editingPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        toast.success("Plan ažuriran");
        setIsEditModalOpen(false);
        setEditingPlan(null);
        resetForm();
        loadPlanovi();
      } else {
        toast.error("Greška pri ažuriranju plana");
      }
    } catch (error) {
      console.error("Error updating plan:", error);
      toast.error("Greška pri ažuriranju plana");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/liflet/plan/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        toast.success("Plan obrisan");
        loadPlanovi();
      } else {
        toast.error("Greška pri brisanju plana");
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
      toast.error("Greška pri brisanju plana");
    }
  };

  const selectClient = (client: ClientSearchResult) => {
    setFormData({ ...formData, Id_klijent: client.ID_Klijent.toString() });
    setClientSearchTerm(`${client.Naziv} (${client.PIB})`);
    setShowClientDropdown(false);
    setSearchedClients([]);
  };

  const openEditModal = (plan: LifletPlan) => {
    setEditingPlan(plan);
    const fmt = (d: Date) => new Date(d).toISOString().split("T")[0];
    setFormData({
      Id_klijent: plan.Id_klijent?.toString() || "",
      iznos: plan.iznos?.toString() || "",
      datum_od: fmt(plan.datum_od),
      datum_do: fmt(plan.datum_do),
      tekst: plan.tekst,
    });
    setClientSearchTerm(
      plan.klijenti
        ? `${plan.klijenti.Naziv} (${plan.klijenti.PIB})`
        : ""
    );
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({ Id_klijent: "", iznos: "", datum_od: "", datum_do: "", tekst: "" });
    setClientSearchTerm("");
    setSearchedClients([]);
    setShowClientDropdown(false);
  };

  const searchClients = async (search: string) => {
    if (search.length < 2) {
      setSearchedClients([]);
      return;
    }
    try {
      const response = await fetch(
        `/api/clients?search=${encodeURIComponent(search)}&limit=20`
      );
      const data = await response.json();
      setSearchedClients(data.data || []);
      setShowClientDropdown(true);
    } catch (error) {
      console.error("Error searching clients:", error);
    }
  };

  const getSortIcon = (key: string) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="w-4 h-4" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="w-4 h-4" />
    ) : (
      <ArrowDown className="w-4 h-4" />
    );
  };

  const formatSerbianDate = (date: string | Date): string => {
    try {
      const d = typeof date === "string" ? new Date(date) : date;
      if (isNaN(d.getTime())) return "";
      const day = d.getUTCDate().toString().padStart(2, "0");
      const month = (d.getUTCMonth() + 1).toString().padStart(2, "0");
      return `${day}.${month}.${d.getUTCFullYear()}`;
    } catch {
      return "";
    }
  };

  const formatSerbianNumber = (value: number) =>
    new Intl.NumberFormat("sr-RS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);

  const sorted = [...planovi].sort((a, b) => {
    const dir = sortConfig.direction === "asc" ? 1 : -1;
    const key = sortConfig.key as keyof LifletPlan;
    const aVal = a[key];
    const bVal = b[key];
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    if (aVal < bVal) return -1 * dir;
    if (aVal > bVal) return 1 * dir;
    return 0;
  });

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="w-full">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Plan / Dogovori sa klijentima</CardTitle>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novi plan
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novi plan</DialogTitle>
                  <DialogDescription>
                    Dodaj novi dogovor sa klijentom.
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
                      Iznos (RSD)
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
                    <label htmlFor="datum_od" className="text-right">
                      Datum od
                    </label>
                    <DateInput
                      id="datum_od"
                      value={formData.datum_od}
                      onChange={(e) =>
                        setFormData({ ...formData, datum_od: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="datum_do" className="text-right">
                      Datum do
                    </label>
                    <DateInput
                      id="datum_do"
                      value={formData.datum_do}
                      onChange={(e) =>
                        setFormData({ ...formData, datum_do: e.target.value })
                      }
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <label htmlFor="tekst" className="text-right pt-2">
                      Tekst
                    </label>
                    <Textarea
                      id="tekst"
                      placeholder="Opis dogovora..."
                      value={formData.tekst}
                      onChange={(e) =>
                        setFormData({ ...formData, tekst: e.target.value })
                      }
                      className="col-span-3 min-h-[120px]"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreate}>
                    Dodaj plan
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>

          <CardContent>
            {/* Date range filter */}
            <div className="mb-4 flex flex-wrap items-end gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Datum od</label>
                <DateInput
                  value={filterDateFrom}
                  onChange={(e) => setFilterDateFrom(e.target.value)}
                  className="w-36"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-muted-foreground">Datum do</label>
                <DateInput
                  value={filterDateTo}
                  onChange={(e) => setFilterDateTo(e.target.value)}
                  className="w-36"
                />
              </div>
              <Button onClick={loadPlanovi} variant="outline">
                Filtriraj
              </Button>
              {(filterDateFrom || filterDateTo) && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setTimeout(loadPlanovi, 0);
                  }}
                >
                  Resetuj
                </Button>
              )}
            </div>

            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
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
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted w-32"
                      onClick={() => handleSort("datum_od")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Datum od</span>
                        {getSortIcon("datum_od")}
                      </div>
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted w-32"
                      onClick={() => handleSort("datum_do")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Datum do</span>
                        {getSortIcon("datum_do")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      Tekst
                    </th>
                    <th className="border border-border px-4 py-2 text-center w-24">
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
                  ) : sorted.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-border px-4 py-8 text-center"
                      >
                        Nema podataka
                      </td>
                    </tr>
                  ) : (
                    sorted.map((plan) => (
                      <tr key={plan.id} className="hover:bg-muted/50">
                        <td className="border border-border px-4 py-2">
                          <div className="font-medium">
                            {plan.klijenti?.Naziv || "-"}
                          </div>
                          {plan.klijenti?.PIB && (
                            <div className="text-sm text-muted-foreground">
                              PIB: {plan.klijenti.PIB}
                            </div>
                          )}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {plan.iznos != null
                            ? formatSerbianNumber(Number(plan.iznos))
                            : "-"}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {formatSerbianDate(plan.datum_od)}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {formatSerbianDate(plan.datum_do)}
                        </td>
                        <td className="border border-border px-4 py-2 max-w-xs">
                          <span className="line-clamp-2 whitespace-pre-wrap">
                            {plan.tekst}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-2">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(plan)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Obriši plan</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Da li ste sigurni da želite da obrišete ovaj
                                    plan?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Otkaži</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(plan.id)}
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
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uredi plan</DialogTitle>
            <DialogDescription>Ažuriraj informacije o dogovoru.</DialogDescription>
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
                Iznos (RSD)
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
              <label htmlFor="edit_datum_od" className="text-right">
                Datum od
              </label>
              <DateInput
                id="edit_datum_od"
                value={formData.datum_od}
                onChange={(e) =>
                  setFormData({ ...formData, datum_od: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_datum_do" className="text-right">
                Datum do
              </label>
              <DateInput
                id="edit_datum_do"
                value={formData.datum_do}
                onChange={(e) =>
                  setFormData({ ...formData, datum_do: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label htmlFor="edit_tekst" className="text-right pt-2">
                Tekst
              </label>
              <Textarea
                id="edit_tekst"
                value={formData.tekst}
                onChange={(e) =>
                  setFormData({ ...formData, tekst: e.target.value })
                }
                className="col-span-3 min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEdit}>
              Ažuriraj plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
