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

type ClientAccountResult = {
  accountNumber: string;
  ID_Klijent: number | null;
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
    [],
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
      const createData = {
        ...formData,
        valuta: formData.datum, // Set due date same as transaction date
      };
      const response = await fetch("/api/liflet/finansije", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createData),
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
      const editData = {
        ...formData,
        valuta: formData.datum, // Set due date same as transaction date
      };
      const response = await fetch(
        `/api/liflet/finansije/${editingFinansija.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editData),
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
      const dateStr = line.substring(20, 28).trim(); // 20-27 (DD.MM.YY format)
      const amountStr = line.substring(90, 105).trim(); // 90-104
      const paymentReference = line.substring(137, 157).trim(); // 137-156
      const description = line.substring(159, 239).trim(); // 159-238

      // Format reference number as 3-13-2 digits
      let formattedClientAccountNumber = "";
      if (referenceNumber.length >= 18) {
        const part1 = referenceNumber.substring(0, 3);
        const part2 = referenceNumber.substring(3, 16);
        const part3 = referenceNumber.substring(16, 18);
        formattedClientAccountNumber = `${part1}-${part2}-${part3}`;
      } else {
        formattedClientAccountNumber = referenceNumber;
      }

      // Parse amount (divide by 100)
      const amount = amountStr ? parseFloat(amountStr) / 100 : 0;

      // Parse date from DD.MM.YY format
      let formattedDate = "";
      if (dateStr.length === 8 && dateStr.includes(".")) {
        // DD.MM.YY format with dots
        const parts = dateStr.split(".");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          let year = parts[2];

          // Convert 2-digit year to 4-digit
          if (year.length === 2) {
            const yearNum = parseInt(year);
            year = yearNum < 50 ? `20${year}` : `19${year}`;
          }

          try {
            const date = new Date(`${year}-${month}-${day}`);
            if (!isNaN(date.getTime())) {
              // Store as YYYY-MM-DD for reliable parsing later
              formattedDate = date.toISOString().split("T")[0];
            } else {
              formattedDate = dateStr; // fallback to original if parsing fails
            }
          } catch {
            formattedDate = dateStr; // fallback to original if parsing fails
          }
        } else {
          formattedDate = dateStr; // fallback if not proper DD.MM.YY format
        }
      } else {
        formattedDate = dateStr || ""; // fallback to empty string
      }

      parsedRecords.push({
        clientAccountNumber: formattedClientAccountNumber,
        transactionDate: formattedDate,
        amount: amount,
        paymentReference: paymentReference || "",
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

      // Extract unique client account numbers for client lookup
      const accountNumbers = Array.from(
        new Set(
          parsedRecords
            .map((record) => record.clientAccountNumber)
            .filter((account) => account && account.trim().length > 0),
        ),
      );

      let enrichedRecords = parsedRecords;

      // If we have account numbers, try to find client names
      if (accountNumbers.length > 0) {
        try {
          const response = await fetch(
            `/api/clients?accounts=${encodeURIComponent(
              accountNumbers.join(","),
            )}`,
          );
          const clientData = await response.json();
          console.log("clientData", clientData);
          if (clientData.data && clientData.data.length > 0) {
            // Create a map of account number to client info
            const clientMap = new Map<string, ClientAccountResult>(
              clientData.data.map((client: ClientAccountResult) => [
                client.accountNumber,
                client,
              ]),
            );

            // Add client names to parsed records
            enrichedRecords = parsedRecords.map((record) => ({
              ...record,
              clientNaziv:
                clientMap.get(record.clientAccountNumber)?.Naziv || null,
              clientPIB: clientMap.get(record.clientAccountNumber)?.PIB || null,
              clientID:
                clientMap.get(record.clientAccountNumber)?.ID_Klijent || null,
            }));
          }
        } catch (clientError) {
          console.warn("Failed to fetch client data:", clientError);
          // Continue without client data if the API call fails
        }
      }

      setParsedData(enrichedRecords);
      setSelectedRows(new Set()); // Clear selection when new file is loaded

      toast.success(
        `Parsed ${parsedRecords.length} records from "${file.name}"`,
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
        (index) => parsedData[index],
      );

      if (selectedData.length === 0) {
        toast.error("Please select at least one record to import");
        return;
      }

      // Filter out records without valid client IDs
      const validRecords = selectedData.filter((record) => record.clientID);

      if (validRecords.length === 0) {
        toast.error(
          "No valid records found with client information. Please ensure clients are properly matched.",
        );
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      // Process each valid record
      for (const record of validRecords) {
        try {
          // Transaction date is already stored as YYYY-MM-DD format
          const datum = record.transactionDate || "";

          // Prepare payment data
          const paymentData = {
            Id_klijent: record.clientID.toString(),
            dug: false, // Always false for uplate (payments/credits)
            iznos: record.amount.toString(),
            datum: datum,
            valuta: datum,
            napomena: `Imported from eBanking: ${
              record.description || ""
            }`.trim(),
          };

          console.log("Creating payment:", paymentData);

          const response = await fetch("/api/liflet/finansije", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(paymentData),
          });

          if (response.ok) {
            successCount++;
          } else {
            console.error(
              `Failed to create payment for client ${record.clientNaziv}:`,
              response.statusText,
            );
            errorCount++;
          }
        } catch (recordError) {
          console.error(
            `Error processing record for client ${record.clientNaziv}:`,
            recordError,
          );
          errorCount++;
        }
      }

      // Show results
      if (successCount > 0) {
        toast.success(
          `Successfully imported ${successCount} payment${
            successCount === 1 ? "" : "s"
          }`,
        );
        loadFinansije(); // Refresh the financial data
      }

      if (errorCount > 0) {
        toast.error(
          `Failed to import ${errorCount} payment${errorCount === 1 ? "" : "s"}`,
        );
      }

      if (selectedData.length > validRecords.length) {
        const skippedCount = selectedData.length - validRecords.length;
        toast.warning(
          `${skippedCount} record${
            skippedCount === 1 ? "" : "s"
          } skipped due to missing client information`,
        );
      }

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

  const formatSerbianNumber = (value: number) => {
    return new Intl.NumberFormat("sr-RS", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Serbian date formatting function (DD.MM.YYYY)
  const formatSerbianDate = (dateString: string | Date): string => {
    try {
      const date = typeof dateString === "string" ? new Date(dateString) : dateString;
      if (isNaN(date.getTime())) {
        return typeof dateString === "string" ? dateString : "";
      }
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    } catch {
      return typeof dateString === "string" ? dateString : "";
    }
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
            <CardTitle>Detalji o uplatama</CardTitle>
            <div className="flex gap-2">
              <Dialog
                open={isCreateModalOpen}
                onOpenChange={setIsCreateModalOpen}
              >
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Dodaj Uplatu
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Dodaj Novu Uplatu</DialogTitle>
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
                      Dodaj Uplatu
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
                    Uvoz iz eBankinga
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-7xl">
                  <DialogHeader>
                    <DialogTitle>Uvoz iz eBankinga</DialogTitle>
                    <DialogDescription>
                      Prevucite CSV ili Excel fajl ili kliknite da odaberete
                      fajl za uvoz uplata.
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
                            Pregled podataka ({selectedRows.size} izabranih)
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
                              Izaberi sve
                            </label>
                          </div>
                        </div>
                        <div className="max-h-96 overflow-auto border rounded-lg">
                          <table className="w-full border-collapse">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="border border-gray-200 px-4 py-2 text-center text-sm font-medium w-12">
                                  Izaberi
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Referenca
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Klijent
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Datum
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-right text-sm font-medium">
                                  Iznos
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Broj računa
                                </th>
                                <th className="border border-gray-200 px-4 py-2 text-left text-sm font-medium">
                                  Opis
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {parsedData.map((row, index) => (
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
                                    {row.clientAccountNumber}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm min-w-48">
                                    {row.clientNaziv || "-"}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm">
                                    {row.transactionDate
                                      ? formatSerbianDate(row.transactionDate)
                                      : "-"}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm text-right font-mono">
                                    {formatSerbianNumber(row.amount)}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm font-mono">
                                    {row.paymentReference}
                                  </td>
                                  <td className="border border-gray-200 px-4 py-2 text-sm max-w-48">
                                    {row.description}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {parsedData.length > 50 && (
                          <p className="text-sm text-gray-500 text-center">
                            Prikazujem prvih 50 redova od {parsedData.length}{" "}
                            ukupnih zapisa
                          </p>
                        )}
                        {selectedRows.size > 0 && (
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-sm text-blue-800">
                              <strong>{selectedRows.size}</strong> zapisa
                              izabranih za uvoz
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
                      Odustani
                    </Button>
                    {selectedRows.size > 0 && (
                      <Button onClick={handleImportData}>
                        Uvoz {selectedRows.size} Izabranih Zapisa
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
                        colSpan={6}
                        className="border border-border px-4 py-8 text-center"
                      >
                        Učitavanje...
                      </td>
                    </tr>
                  ) : filteredFinansije.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="border border-border px-4 py-8 text-center"
                      >
                        Nije pronađeno nijedna uplata
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
                                    trajno obrisati ovaj zapis o uplati.
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
                      colSpan={3}
                      className="border border-border px-4 py-3 text-right"
                    >
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
            <DialogTitle>Uredi Uplatu</DialogTitle>
            <DialogDescription>
              Ažuriraj informacije o uplati.
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
              Ažuriraj Uplatu
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
