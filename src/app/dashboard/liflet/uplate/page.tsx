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
  Plus,
  Edit,
  Trash2,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

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

export default function UplatePage() {
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
  const [editingFinansija, setEditingFinansija] =
    useState<LifletFinansije | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    Id_klijent: "",
    dug: false, // Always false for uplate (payments/credits)
    iznos: "",
    datum: "",
    valuta: "",
    napomena: "",
    selectedClient: null as ClientSearchResult | null,
  });

  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [searchedClients, setSearchedClients] = useState<ClientSearchResult[]>(
    []
  );
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [isDragOver, setIsDragOver] = useState(false);

  useEffect(() => {
    loadFinansije();
  }, [sortConfig]);

  const loadFinansije = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/liflet/finansije?dug=0`);
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
        }
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

  const parseEBankingFile = (content: string) => {
    const lines = content.split("\n");
    const parsedRecords: any[] = [];

    for (const line of lines) {
      if (line.trim().length === 0) continue;

      // Check positions 18-19, if "10" then ignore this line
      const checkValue = line.substring(18, 20).trim();
      if (checkValue === "10") continue;

      // Extract fields based on positions
      const referenceNumber = line.substring(0, 18).trim(); // 0-17
      const amountStr = line.substring(90, 105).trim(); // 90-104
      const accountNumber = line.substring(137, 157).trim(); // 137-156
      const description = line.substring(159, 239).trim(); // 159-238

      // Format reference number as 3-13-2 digits
      let formattedReference = "";
      if (referenceNumber.length >= 18) {
        const part1 = referenceNumber.substring(0, 3);
        const part2 = referenceNumber.substring(3, 16);
        const part3 = referenceNumber.substring(16, 18);
        formattedReference = `${part1}-${part2}-${part3}`;
      } else {
        formattedReference = referenceNumber;
      }

      // Parse amount (divide by 100)
      const amount = amountStr ? parseFloat(amountStr) / 100 : 0;

      parsedRecords.push({
        reference: formattedReference,
        amount: amount,
        accountNumber: accountNumber || "",
        description: description || "",
        rawLine: line.trim(),
      });
    }

    return parsedRecords;
  };

  const handleFileUpload = async (file: File) => {
    try {
      const content = await file.text();
      const parsedRecords = parseEBankingFile(content);

      if (parsedRecords.length === 0) {
        toast.error("No valid records found in the file");
        return;
      }

      setParsedData(parsedRecords);
      setSelectedRows(new Set()); // Clear selection when new file is loaded

      toast.success(
        `Parsed ${parsedRecords.length} records from "${file.name}"`
      );
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Failed to parse file");
    }
  };

  const handleRowSelection = (rowIndex: number, checked: boolean) => {
    const newSelection = new Set(selectedRows);
    if (checked) {
      newSelection.add(rowIndex);
    } else {
      newSelection.delete(rowIndex);
    }
    setSelectedRows(newSelection);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(parsedData.map((_, index) => index)));
    } else {
      setSelectedRows(new Set());
    }
  };

  const handleImportData = async () => {
    try {
      const selectedData = Array.from(selectedRows).map(
        (index) => parsedData[index]
      );

      if (selectedData.length === 0) {
        toast.error("Please select at least one record to import");
        return;
      }

      // For now, just show a placeholder message with selected data count
      // The actual import logic will be implemented based on how to map eBanking data to database
      toast.info(
        `Import functionality ready. Selected ${selectedData.length} records. Mapping logic to be implemented.`
      );

      console.log("Selected data for import:", selectedData);

      setIsImportModalOpen(false);
      setParsedData([]);
      setSelectedRows(new Set());
    } catch (error) {
      console.error("Error importing data:", error);
      toast.error("Failed to import data");
    }
  };

  const resetForm = () => {
    setFormData({
      Id_klijent: "",
      dug: false,
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
        `/api/clients?search=${encodeURIComponent(search)}&limit=20`
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
      dug: false, // Always false for uplate
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
        : ""
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
  const formatSerbianNumber = (value: number) => {
    return new Intl.NumberFormat("sr-RS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Months for filter dropdown
  const months = [
    { value: "all", label: "All Months" },
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
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
      {/* Uplate Details */}
      <div className="w-full">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Uplate Details</CardTitle>
            <div className="flex gap-2">
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Uplata
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Uplata</DialogTitle>
                    <DialogDescription>
                      Add a new payment/credit record.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="client_search" className="text-right">
                        Client
                      </label>
                      <div className="col-span-3 relative">
                        <Input
                          id="client_search"
                          placeholder="Type to search clients..."
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
                                <div className="font-medium">
                                  {client.Naziv}
                                </div>
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
                        Amount
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
                        Date
                      </label>
                      <Input
                        id="datum"
                        type="date"
                        value={formData.datum}
                        onChange={(e) =>
                          setFormData({ ...formData, datum: e.target.value })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="valuta" className="text-right">
                        Due Date
                      </label>
                      <Input
                        id="valuta"
                        type="date"
                        value={formData.valuta}
                        onChange={(e) =>
                          setFormData({ ...formData, valuta: e.target.value })
                        }
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <label htmlFor="napomena" className="text-right">
                        Note
                      </label>
                      <Input
                        id="napomena"
                        value={formData.napomena}
                        onChange={(e) =>
                          setFormData({ ...formData, napomena: e.target.value })
                        }
                        className="col-span-3"
                        placeholder="Optional note"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit" onClick={handleCreate}>
                      Add Uplata
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog
                open={isImportModalOpen}
                onOpenChange={setIsImportModalOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Uvoz eBanking
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Uvoz eBanking podataka</DialogTitle>
                    <DialogDescription>
                      Prevucite CSV ili Excel fajl ili kliknite da odaberete
                      fajl za uvoz transakcija.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div
                      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                        isDragOver
                          ? "border-primary bg-primary/5"
                          : "border-gray-300 hover:border-gray-400"
                      }`}
                      onDrop={(e) => {
                        e.preventDefault();
                        setIsDragOver(false);
                        const files = Array.from(e.dataTransfer.files);
                        if (files.length > 0) {
                          handleFileUpload(files[0]);
                        }
                      }}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                    >
                      <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg font-medium mb-2">
                        Prevucite fajl ovde ili{" "}
                        <label className="text-primary cursor-pointer hover:underline">
                          kliknite da odaberete
                          <input
                            type="file"
                            className="hidden"
                            accept=".csv,.xlsx,.xls,.txt"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleFileUpload(file);
                              }
                            }}
                          />
                        </label>
                      </p>
                      <p className="text-sm text-gray-500">
                        Podržani formati: CSV, Excel, TXT (.xlsx, .xls, .txt)
                      </p>
                    </div>

                    {parsedData.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold">
                            Parsed Data Preview ({selectedRows.size} selected)
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="select-all"
                              checked={
                                selectedRows.size === parsedData.length &&
                                parsedData.length > 0
                              }
                              onCheckedChange={(checked: boolean) =>
                                handleSelectAll(checked)
                              }
                            />
                            <label
                              htmlFor="select-all"
                              className="text-sm font-medium cursor-pointer"
                            >
                              Select All
                            </label>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-auto border rounded-lg">
                          <table className="w-full border-collapse">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium w-12">
                                  Select
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Reference
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium">
                                  Amount
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Account Number
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Description
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedData.slice(0, 50).map((row, index) => (
                                <tr
                                  key={index}
                                  className={`hover:bg-gray-50 ${
                                    selectedRows.has(index) ? "bg-blue-50" : ""
                                  }`}
                                >
                                  <td className="border border-gray-200 px-4 py-2 text-center">
                                    <Checkbox
                                      checked={selectedRows.has(index)}
                                      onCheckedChange={(checked: boolean) =>
                                        handleRowSelection(index, checked)
                                      }
                                    />
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                                    {row.reference}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm text-right font-mono">
                                    {formatSerbianNumber(row.amount)}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                                    {row.accountNumber}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm">
                                    {row.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {parsedData.length > 50 && (
                          <p className="text-sm text-gray-500 text-center">
                            Showing first 50 rows of {parsedData.length} total
                            rows
                          </p>
                        )}
                        {selectedRows.size > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>{selectedRows.size}</strong> record(s)
                              selected for import
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsImportModalOpen(false);
                        setParsedData([]);
                        setSelectedRows(new Set());
                      }}
                    >
                      Cancel
                    </Button>
                    {selectedRows.size > 0 && (
                      <Button onClick={handleImportData}>
                        Import {selectedRows.size} Selected Records
                      </Button>
                    )}
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Select value={monthFilter} onValueChange={setMonthFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by month" />
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
                  <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {Array.from(
                    new Set(
                      finansije
                        .filter((item) => item.klijenti?.Naziv)
                        .map((item) => item.klijenti!.Naziv!)
                    )
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
                      Client
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("iznos")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Amount</span>
                        {getSortIcon("iznos")}
                      </div>
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("datum")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Date</span>
                        {getSortIcon("datum")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      Due Date
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      Note
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      Actions
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
                        Loading...
                      </td>
                    </tr>
                  ) : filteredFinansije.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-border px-4 py-8 text-center"
                      >
                        No uplate found
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
                        <td className="border border-border px-4 py-2">
                          {formatSerbianNumber(Number(finansija.iznos))} RSD
                        </td>
                        <td className="border border-border px-4 py-2">
                          {new Date(finansija.datum).toLocaleDateString()}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {finansija.valuta
                            ? new Date(finansija.valuta).toLocaleDateString()
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
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete this uplata record.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(finansija.id)}
                                  >
                                    Delete
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
                      TOTAL:
                    </td>
                    <td className="border border-border px-4 py-3">
                      {formatSerbianNumber(
                        filteredFinansije.reduce(
                          (sum, f) => sum + Number(f.iznos || 0),
                          0
                        )
                      )}{" "}
                      RSD
                    </td>
                    <td colSpan={4} className="border border-border px-4 py-3">
                      {/* Empty cells for the remaining columns */}
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
            <DialogTitle>Edit Uplata</DialogTitle>
            <DialogDescription>
              Update the uplata information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_client" className="text-right">
                Client
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
                Amount
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
                Date
              </label>
              <Input
                id="edit_datum"
                type="date"
                value={formData.datum}
                onChange={(e) =>
                  setFormData({ ...formData, datum: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_valuta" className="text-right">
                Due Date
              </label>
              <Input
                id="edit_valuta"
                type="date"
                value={formData.valuta}
                onChange={(e) =>
                  setFormData({ ...formData, valuta: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label htmlFor="edit_napomena" className="text-right">
                Note
              </label>
              <Input
                id="edit_napomena"
                value={formData.napomena}
                onChange={(e) =>
                  setFormData({ ...formData, napomena: e.target.value })
                }
                className="col-span-3"
                placeholder="Optional note"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEdit}>
              Update Uplata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
