"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  XCircle,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  printCeneRaf,
  printSpisakRaf,
  type PrintConfig,
} from "@/lib/print-utils";
import { useAuthStore } from "@/store/useAuthStore";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type SpisakRaf = {
  id: number;
  id_prodavnica: number | null;
  id_artikal: number | null;
  amount: number | null;
  prodavnice?: {
    ID_Prodavnica: number;
    Naziv: string | null;
  };
  artikli?: {
    Id_Artikal: number;
    DESCRIPTION: string | null;
    BAR_CODE: string | null;
  };
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

export default function SpisakRafPage() {
  const [spisakRaf, setSpisakRaf] = useState<SpisakRaf[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [prodavnicaFilter, setProdavnicaFilter] = useState<string>("all");
  const [availableProdavnice, setAvailableProdavnice] = useState<
    Array<{ ID_Prodavnica: number; Naziv: string | null }>
  >([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "id",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Printing configuration state
  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    radnja: "",
    format: "6x4",
    tip_cene: "redovna", // Default value
    kopija: 1,
  });

  // Printer modal state
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string>("default");

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSpisakRaf, setEditingSpisakRaf] = useState<SpisakRaf | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkDeleteProdavnica, setBulkDeleteProdavnica] = useState<{
    ID_Prodavnica: number;
    Naziv: string | null;
  } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id_prodavnica: "",
    id_artikal: "",
    amount: "",
  });

  const [articleSearchTerm, setArticleSearchTerm] = useState("");
  const [searchedArticles, setSearchedArticles] = useState<
    Array<{
      Id_Artikal: number;
      DESCRIPTION: string | null;
      BAR_CODE: string | null;
    }>
  >([]);
  const [showArticleDropdown, setShowArticleDropdown] = useState(false);

  const [prodavnicaSearchTerm, setProdavnicaSearchTerm] = useState("");
  const [searchedProdavnice, setSearchedProdavnice] = useState<
    Array<{
      ID_Prodavnica: number;
      Naziv: string | null;
      Sifra: string | null;
    }>
  >([]);
  const [showProdavnicaDropdown, setShowProdavnicaDropdown] = useState(false);

  const { user } = useAuthStore();

  useEffect(() => {
    loadSpisakRaf();
  }, [sortConfig, prodavnicaFilter]);

  // Preselect prodavnica for USER level
  useEffect(() => {
    if (user && user.level === 'USER') {
      const prodavnicaId = user.prodavnica.toString();
      setProdavnicaFilter(prodavnicaId);
      setFormData(prev => ({ ...prev, id_prodavnica: prodavnicaId }));
    }
  }, [user]);

  // Update prodavnica search term
  useEffect(() => {
    if (user && user.level === 'USER' && availableProdavnice.length > 0) {
      const userStore = availableProdavnice.find(p => p.ID_Prodavnica === user.prodavnica);
      if (userStore) {
        setProdavnicaSearchTerm(userStore.Naziv || userStore.ID_Prodavnica.toString());
      }
    }
  }, [user, availableProdavnice]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, prodavnicaFilter, itemsPerPage]);

  useEffect(() => {
    loadAvailableProdavnice();
  }, []);

  const loadSpisakRaf = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/spisak_raf?sort=${sortConfig.key}&order=${sortConfig.direction}&radnja=${prodavnicaFilter === 'all' ? '' : prodavnicaFilter}&limit=10000`
      );
      const data = await response.json();
    
      setSpisakRaf(data.data || []);
      // setTotalRecords(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading spisak_raf:", error);
      toast.error("Failed to load spisak raf data");
    } finally {
      setLoading(false);
    }
  }, [sortConfig, prodavnicaFilter]);

  const loadAvailableProdavnice = async () => {
    try {
      const response = await fetch("/api/prodavnice?limit=1000");
      const data = await response.json();
      setAvailableProdavnice(data.data || []);
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

  const handleCreate = async () => {
    try {
      const response = await fetch("/api/spisak_raf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Uspešno dodato u spisak");
        setIsCreateModalOpen(false);
        resetForm();
        loadSpisakRaf();
      } else {
        toast.error("Greška pri dodavanju");
      }
    } catch (error) {
      console.error("Error creating spisak raf:", error);
      toast.error("Greška pri dodavanju");
    }
  };

  const handleEdit = async () => {
    if (!editingSpisakRaf) return;

    try {
      const response = await fetch(`/api/spisak_raf/${editingSpisakRaf.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Uspešno ažurirano");
        setIsEditModalOpen(false);
        setEditingSpisakRaf(null);
        resetForm();
        loadSpisakRaf();
      } else {
        toast.error("Greška pri ažuriranju");
      }
    } catch (error) {
      console.error("Error updating spisak raf:", error);
      toast.error("Greška pri ažuriranju");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/spisak_raf/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Uspešno obrisano");
        loadSpisakRaf();
      } else {
        toast.error("Greška pri brisanju");
      }
    } catch (error) {
      console.error("Error deleting spisak raf:", error);
      toast.error("Greška pri brisanju");
    }
  };

  const handleBulkDelete = async () => {
    if (!bulkDeleteProdavnica) return;

    try {
      const response = await fetch(
        `/api/spisak_raf?prodavnica_id=${bulkDeleteProdavnica.ID_Prodavnica}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(
          `Uspešno obrisano ${data.deletedCount} zapisa za prodavnicu ${
            bulkDeleteProdavnica.Naziv || bulkDeleteProdavnica.ID_Prodavnica
          }`
        );
        setIsBulkDeleteModalOpen(false);
        setBulkDeleteProdavnica(null);
        loadSpisakRaf();
      } else {
        toast.error("Greška pri brisanju zapisa");
      }
    } catch (error) {
      console.error("Error bulk deleting spisak raf:", error);
      toast.error("Greška pri brisanju zapisa");
    }
  };

  const openBulkDeleteModal = () => {
    if (prodavnicaFilter === "all") {
      toast.error("Izaberite prodavnicu za brisanje svih zapisa");
      return;
    }

    const selectedProdavnica = availableProdavnice.find(
      (p) => p.ID_Prodavnica.toString() === prodavnicaFilter
    );

    if (!selectedProdavnica) {
      toast.error("Prodavnica nije pronađena");
      return;
    }

    setBulkDeleteProdavnica(selectedProdavnica);
    setIsBulkDeleteModalOpen(true);
  };

  const resetForm = () => {
    const isUser = user && user.level === 'USER';
    const userStoreId = isUser ? user.prodavnica.toString() : "";
    const userStoreName = (isUser && availableProdavnice.find(p => p.ID_Prodavnica === user.prodavnica)?.Naziv) || (isUser ? user.prodavnica.toString() : "");

    setFormData({
      id_prodavnica: userStoreId,
      id_artikal: "",
      amount: "",
    });
    setArticleSearchTerm("");
    setProdavnicaSearchTerm(userStoreName);
    setSearchedArticles([]);
    setSearchedProdavnice([]);
  };

  const searchArticles = async (search: string) => {
    if (search.length < 2) {
      setSearchedArticles([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/articles?search=${encodeURIComponent(search)}&limit=50`
      );
      const data = await response.json();
      setSearchedArticles(data.data || []);
      setShowArticleDropdown(true);
    } catch (error) {
      console.error("Error searching articles:", error);
    }
  };

  const searchProdavnice = async (search: string) => {
     if (search.length < 2) {
      setSearchedProdavnice([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/prodavnice?search=${encodeURIComponent(search)}&limit=20`
      );
      const data = await response.json();
      setSearchedProdavnice(data.data || []);
      setShowProdavnicaDropdown(true);
    } catch (error) {
      console.error("Error searching prodavnice:", error);
    }
  };

  const selectArticle = async (article: {
      Id_Artikal: number;
      DESCRIPTION: string | null;
      BAR_CODE: string | null;
    }) => {
    setFormData({
      ...formData,
      id_artikal: article.Id_Artikal.toString(),
    });
    
    setArticleSearchTerm(`${article.DESCRIPTION} (${article.BAR_CODE})`);
    setShowArticleDropdown(false);
  };

  const selectProdavnica = (prodavnica: {
      ID_Prodavnica: number;
      Naziv: string | null;
      Sifra: string | null;
    }) => {
    setFormData({
      ...formData,
      id_prodavnica: prodavnica.ID_Prodavnica.toString(),
    });
    setProdavnicaSearchTerm(prodavnica.Naziv || "");
    setShowProdavnicaDropdown(false);
  };

  const openEditModal = (item: SpisakRaf) => {
    setEditingSpisakRaf(item);
    setFormData({
      id_prodavnica: item.id_prodavnica?.toString() || "",
      id_artikal: item.id_artikal?.toString() || "",
      amount: item.amount ? item.amount.toString() : "",
    });
    setArticleSearchTerm(
      item.artikli ? `${item.artikli.DESCRIPTION}` : ""
    );
    setProdavnicaSearchTerm(item.prodavnice?.Naziv || "");
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

  const filteredData = spisakRaf.filter((item) => {
    const descriptionContainsAllParts = (
      description: string | null | undefined,
      searchTerm: string
    ) => {
      if (!description) return false;
      const searchParts = searchTerm
        .toLowerCase()
        .trim()
        .split(/\s+/)
        .filter((part) => part.length > 0);
      const descriptionLower = description.toLowerCase();
      return searchParts.every((part) => descriptionLower.includes(part));
    };

    const matchesSearch =
      !searchTerm ||
      item.id_artikal?.toString() === searchTerm ||
      item.artikli?.BAR_CODE?.toLowerCase().includes(
        searchTerm.toLowerCase()
      ) ||
      descriptionContainsAllParts(item.artikli?.DESCRIPTION, searchTerm) ||
      item.prodavnice?.Naziv?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProdavnica =
      prodavnicaFilter === "all" ||
      item.id_prodavnica?.toString() === prodavnicaFilter;

    return matchesSearch && matchesProdavnica;
  });

  const totalFilteredRecords = filteredData.length;
  const maxPages = Math.ceil(totalFilteredRecords / itemsPerPage);
  const effectiveCurrentPage =
    currentPage > maxPages && maxPages > 0 ? 1 : currentPage;
  const startIndex = (effectiveCurrentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);


  
  const handlePrint = async () => {
    try {
      const availablePrinters = ["Štampaj", "Sačuvaj kao PDF"];
      setPrinters(availablePrinters);
      setSelectedPrinter("Štampaj");
      setIsPrinterModalOpen(true);
    } catch (error) {
      console.error("Error preparing print:", error);
      toast.error("Failed to prepare print dialog");
    }
  };

  const handleConfirmPrint = async () => {
    try {
      setIsPrinterModalOpen(false);
      
      const itemsToPrint = filteredData; // Use filtered data to respect search/filter

      if (itemsToPrint.length === 0) {
        toast.warning("Nema artikala za štampanje");
        return;
      }
      
      let radnjaName = "Nepoznata radnja";
      if (prodavnicaFilter !== "all") {
        const store = availableProdavnice.find(p => p.ID_Prodavnica.toString() === prodavnicaFilter);
        if (store) radnjaName = store.Naziv || `Prodavnica ${store.ID_Prodavnica}`;
      } else if (itemsToPrint.length > 0 && itemsToPrint[0].prodavnice) {
         // Fallback if mixed (though usually we print for one store) or just take first one
         radnjaName = itemsToPrint[0].prodavnice.Naziv || `Prodavnica ${itemsToPrint[0].id_prodavnica}`;
         if (itemsToPrint.some(i => i.id_prodavnica !== itemsToPrint[0].id_prodavnica)) {
             radnjaName = "Više prodavnica";
         }
      }

      await printSpisakRaf(itemsToPrint, radnjaName, selectedPrinter);
      
      toast.success(`Štampanje poslato`);
    } catch (error) {
      console.error("Error printing:", error);
      toast.error(error instanceof Error ? error.message : "Greška pri štampanju");
    }
  };
  
  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upravljanje Spiskom Magacina</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              onClick={openBulkDeleteModal}
              disabled={prodavnicaFilter === "all"}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Resetuj spisak za magacin
            </Button>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj u Spisak
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Dodaj u spisak</DialogTitle>
                  <DialogDescription>
                    Dodaj novi artikal u spisak magacina.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  {/* Article Search */}
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="article_search" className="text-right">
                      Artikal
                    </Label>
                    <div className="col-span-3 relative">
                      <div className="relative">
                        <Input
                          id="article_search"
                          placeholder="Pretražite artikle..."
                          value={articleSearchTerm}
                          onChange={(e) => {
                            setArticleSearchTerm(e.target.value);
                            searchArticles(e.target.value);
                          }}
                          className="w-full pr-8"
                        />
                         {articleSearchTerm && (
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setArticleSearchTerm("");
                              setSearchedArticles([]);
                              setFormData(prev => ({ ...prev, id_artikal: "" }));
                            }}
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      {showArticleDropdown && searchedArticles.length > 0 && (
                        <div className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searchedArticles.map((article) => (
                            <div
                              key={article.Id_Artikal}
                              className="px-4 py-1 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                              onClick={() => selectArticle(article)}
                            >
                              <div className="font-medium">
                                {article.DESCRIPTION}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                ID: {article.Id_Artikal} | Barkod:{" "}
                                {article.BAR_CODE}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Prodavnica Search */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="prodavnica_search" className="text-right">
                      Prodavnica
                    </Label>
                    <div className="col-span-3 relative">
                      <Input
                        id="prodavnica_search"
                        placeholder="Pretražite prodavnice..."
                        value={prodavnicaSearchTerm}
                        onChange={(e) => {
                          setProdavnicaSearchTerm(e.target.value);
                          searchProdavnice(e.target.value);
                        }}
                        className="w-full"
                        disabled={user?.level === 'USER'}
                      />
                      {showProdavnicaDropdown &&
                        searchedProdavnice.length > 0 && (
                          <div className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {searchedProdavnice.map((prodavnica) => (
                              <div
                                key={prodavnica.ID_Prodavnica}
                                className="px-4 py-1 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                                onClick={() => selectProdavnica(prodavnica)}
                              >
                                <div className="font-medium">
                                  {`${prodavnica.ID_Prodavnica} ${
                                    prodavnica.Naziv || ""
                                  }`.trim()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {prodavnica.Sifra &&
                                    `Šifra: ${prodavnica.Sifra}`}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Količina
                    </Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: e.target.value,
                        })
                      }
                      className="col-span-3"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" onClick={handleCreate} disabled={!formData.id_artikal}>
                    Dodaj
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4" />
            <Input
              placeholder="Pretražite po bilo kom podatku..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 max-w-xs"
            />

            <Select
              value={prodavnicaFilter}
              onValueChange={setProdavnicaFilter}
              disabled={user?.level === 'USER'}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtriraj po prodavnici" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Sve prodavnice</SelectItem>
                {availableProdavnice.map((prodavnica) => (
                  <SelectItem
                    key={prodavnica.ID_Prodavnica}
                    value={prodavnica.ID_Prodavnica.toString()}
                  >
                    {`${prodavnica.ID_Prodavnica} ${
                      prodavnica.Naziv || ""
                    }`.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={itemsPerPage.toString()}
              onValueChange={(value) => setItemsPerPage(Number(value))}
            >
              <SelectTrigger className="w-[100px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 po strani</SelectItem>
                <SelectItem value="20">20 po strani</SelectItem>
                <SelectItem value="50">50 po strani</SelectItem>
                <SelectItem value="100">100 po strani</SelectItem>
              </SelectContent>
            </Select>

            <div className="ml-auto">
              <Button 
                onClick={handlePrint} 
                className="disabled:opacity-50" 
                disabled={!printConfig.format || !printConfig.tip_cene || !printConfig.kopija}
              >
                <Printer className="w-4 h-4 mr-2" />
                Štampaj
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted/50">
                  <th
                    style={{ display: "none" }}
                    className="border border-border px-2 py-1 text-left cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("id")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>ID</span>
                      {getSortIcon("id")}
                    </div>
                  </th>
                 <th
                    className="border border-border px-4 py-1 text-left cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("id_artikal")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Artikal</span>
                      {getSortIcon("id_artikal")}
                    </div>
                  </th>
                <th
                    className="border border-border px-4 py-1 text-left cursor-pointer hover:bg-muted"
                    onClick={() => handleSort("DESCRIPTION")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Naziv Artikla</span>
                      {getSortIcon("DESCRIPTION")}
                    </div>
                  </th>
                  <th className="border border-border px-4 py-1 text-left">
                    Prodavnica
                  </th>
                  <th className="border border-border px-4 py-1 text-right">
                    Količina
                  </th>
                  <th className="border border-border px-4 py-1 text-left">
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
                ) : paginatedData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="border border-border px-4 py-8 text-center"
                    >
                      Nema podataka
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((item) => (
                    <tr key={item.id} className="hover:bg-muted">
                      <td className="border border-border px-4 py-0" style={{ display: "none" }}>
                        {item.id}
                      </td>
                      <td className="border border-border px-4 py-0">
                        <div>
                          <div className="font-medium">{item.id_artikal}</div>
                          {item.artikli?.BAR_CODE && (
                            <div className="text-sm text-muted-foreground">
                              {item.artikli.BAR_CODE}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-border px-4 py-0">
                        {item.artikli?.DESCRIPTION}
                      </td>
                      <td className="border border-border px-4 py-0">
                        <div className="flex flex-col w-[200px]">
                          <div className="font-medium">
                            {item.prodavnice?.Naziv ||
                              `Prodavnica ${item.id_prodavnica || ""}`}
                          </div>
                          {item.id_prodavnica && (
                            <div className="text-sm text-muted-foreground">
                              ID: {item.id_prodavnica}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-border px-4 py-0 text-right">
                        {Number(item.amount).toFixed(2)}
                      </td>
                      <td className="border border-border px-4 py-0">
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditModal(item)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive hover:text-destructive/90"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
           {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="text-sm text-muted-foreground mr-4">
              Prikaz {startIndex + 1}-{Math.min(endIndex, totalFilteredRecords)}{" "}
              od {totalFilteredRecords}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prethodna
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(maxPages, p + 1))}
              disabled={currentPage === maxPages || maxPages === 0}
            >
              Sledeća
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
             <DialogTitle>Izmeni Spisak</DialogTitle>
          </DialogHeader>
           <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Artikal</Label>
                    <div className="col-span-3 font-medium">
                      {articleSearchTerm}
                    </div>
                  </div>
                  
                   <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Prodavnica</Label>
                    <div className="col-span-3 font-medium">
                      {prodavnicaSearchTerm}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit_amount" className="text-right">
                      Količina
                    </Label>
                    <Input
                      id="edit_amount"
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          amount: e.target.value,
                        })
                      }
                      className="col-span-3"
                    />
                  </div>
           </div>
           
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
                Odustani
             </Button>
             <Button onClick={handleEdit}>
                Sačuvaj
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
      
       {/* Bulk Delete Alert */}
      <AlertDialog
        open={isBulkDeleteModalOpen}
        onOpenChange={setIsBulkDeleteModalOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Da li ste sigurni?</AlertDialogTitle>
            <AlertDialogDescription>
              Ova akcija će obrisati sve stavke iz spiska magacina za prodavnicu{" "}
              <span className="font-bold">
                {bulkDeleteProdavnica?.Naziv ||
                  bulkDeleteProdavnica?.ID_Prodavnica}
              </span>
              . Ova radnja je nepovratna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Odustani</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBulkDelete}
            >
              Obriši sve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Printer Selection Modal */}
      <Dialog open={isPrinterModalOpen} onOpenChange={setIsPrinterModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Izaberite štampač</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              value={selectedPrinter}
              onValueChange={setSelectedPrinter}
              className="gap-4"
            >
              {printers.map((printer) => (
                <div key={printer} className="flex items-center space-x-2">
                  <RadioGroupItem value={printer} id={printer} />
                  <Label htmlFor={printer}>{printer}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrinterModalOpen(false)}>
              Odustani
            </Button>
            <Button onClick={handleConfirmPrint}>Potvrdi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
