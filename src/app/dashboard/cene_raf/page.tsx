"use client";

import { useState, useEffect } from "react";
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
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import {
  printCeneRaf,
  printLifletPriceTags,
  getFormatPreview,
  type PrintConfig,
} from "@/lib/print-utils";

type CeneRaf = {
  id: number;
  id_prodavnica: number | null;
  id_artikal: number | null;
  cena_redovna: any; // Decimal type from Prisma
  cena_akcija: any; // Decimal type from Prisma
  napomena: string | null;
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

export default function CeneRafPage() {
  const [ceneRaf, setCeneRaf] = useState<CeneRaf[]>([]);
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

  // Printing configuration state
  const [printConfig, setPrintConfig] = useState<PrintConfig>({
    radnja: "",
    format: "6x4",
    tip_cene: "",
    kopija: 1,
  });

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCeneRaf, setEditingCeneRaf] = useState<CeneRaf | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    id_prodavnica: "",
    id_artikal: "",
    cena_redovna: "",
    cena_akcija: "",
    napomena: "",
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

  useEffect(() => {
    loadCeneRaf();
  }, [sortConfig, currentPage, itemsPerPage]);

  useEffect(() => {
    loadAvailableProdavnice();
  }, []);

  const loadCeneRaf = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/cene_raf?page=${currentPage}&limit=${itemsPerPage}&sort=${sortConfig.key}&order=${sortConfig.direction}`
      );
      const data = await response.json();
      setCeneRaf(data.data || []);
    } catch (error) {
      console.error("Error loading cene_raf:", error);
      toast.error("Failed to load cene raf data");
    } finally {
      setLoading(false);
    }
  };

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
      const response = await fetch("/api/cene_raf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Cene raf record created successfully");
        setIsCreateModalOpen(false);
        resetForm();
        loadCeneRaf();
      } else {
        toast.error("Failed to create cene raf record");
      }
    } catch (error) {
      console.error("Error creating cene raf:", error);
      toast.error("Failed to create cene raf record");
    }
  };

  const handleEdit = async () => {
    if (!editingCeneRaf) return;

    try {
      const response = await fetch(`/api/cene_raf/${editingCeneRaf.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Cene raf record updated successfully");
        setIsEditModalOpen(false);
        setEditingCeneRaf(null);
        resetForm();
        loadCeneRaf();
      } else {
        toast.error("Failed to update cene raf record");
      }
    } catch (error) {
      console.error("Error updating cene raf:", error);
      toast.error("Failed to update cene raf record");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/cene_raf/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Cene raf record deleted successfully");
        loadCeneRaf();
      } else {
        toast.error("Failed to delete cene raf record");
      }
    } catch (error) {
      console.error("Error deleting cene raf:", error);
      toast.error("Failed to delete cene raf record");
    }
  };

  const resetForm = () => {
    setFormData({
      id_prodavnica: "",
      id_artikal: "",
      cena_redovna: "",
      cena_akcija: "",
      napomena: "",
    });
    setArticleSearchTerm("");
    setProdavnicaSearchTerm("");
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
        `/api/articles?search=${encodeURIComponent(search)}&limit=20`
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

  const selectArticle = (article: any) => {
    setFormData({
      ...formData,
      id_artikal: article.Id_Artikal.toString(),
    });
    setArticleSearchTerm(`${article.DESCRIPTION} (${article.BAR_CODE})`);
    setShowArticleDropdown(false);
  };

  const selectProdavnica = (prodavnica: any) => {
    setFormData({
      ...formData,
      id_prodavnica: prodavnica.ID_Prodavnica.toString(),
    });
    setProdavnicaSearchTerm(prodavnica.Naziv || "");
    setShowProdavnicaDropdown(false);
  };

  const openEditModal = (ceneRaf: CeneRaf) => {
    setEditingCeneRaf(ceneRaf);
    setFormData({
      id_prodavnica: ceneRaf.id_prodavnica?.toString() || "",
      id_artikal: ceneRaf.id_artikal?.toString() || "",
      cena_redovna: ceneRaf.cena_redovna
        ? Number(ceneRaf.cena_redovna).toString()
        : "",
      cena_akcija: ceneRaf.cena_akcija
        ? Number(ceneRaf.cena_akcija).toString()
        : "",
      napomena: ceneRaf.napomena || "",
    });
    setArticleSearchTerm(
      ceneRaf.artikli ? `${ceneRaf.artikli.DESCRIPTION}` : ""
    );
    setProdavnicaSearchTerm(ceneRaf.prodavnice?.Naziv || "");
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

  const handlePrint = async () => {
    try {
      await printCeneRaf(ceneRaf, printConfig, printConfig.kopija);
      toast.success(
        `Štampanje ${ceneRaf.length} artikala u formatu ${
          printConfig.format
        } (${printConfig.kopija} kopija) - ${
          printConfig.tip_cene === "akcija"
            ? "Akcijske"
            : printConfig.tip_cene === "redovna"
            ? "Redovne"
            : "Sve"
        } cene`
      );
    } catch (error) {
      console.error("Error printing:", error);
      toast.error(
        error instanceof Error ? error.message : "Greška pri štampanju"
      );
    }
  };

  const filteredData = ceneRaf.filter((item) => {
    // Helper function to check if description contains all search term parts
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

      // All search parts must be present in the description
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

  return (
    <div className="flex flex-col gap-6 w-full">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upravljanje Cenama Raf</CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Dodaj Cenu Raf
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dodaj Novu Cenu Raf</DialogTitle>
                <DialogDescription>
                  Dodaj novi zapis o ceni na rafu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="article_search" className="text-right">
                    Artikal
                  </Label>
                  <div className="col-span-3 relative">
                    <Input
                      id="article_search"
                      placeholder="Pretražite artikle..."
                      value={articleSearchTerm}
                      onChange={(e) => {
                        setArticleSearchTerm(e.target.value);
                        searchArticles(e.target.value);
                      }}
                      className="w-full"
                    />
                    {showArticleDropdown && searchedArticles.length > 0 && (
                      <div className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {searchedArticles.map((article) => (
                          <div
                            key={article.Id_Artikal}
                            className="px-4 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
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
                    />
                    {showProdavnicaDropdown &&
                      searchedProdavnice.length > 0 && (
                        <div className="absolute z-10 w-full bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {searchedProdavnice.map((prodavnica) => (
                            <div
                              key={prodavnica.ID_Prodavnica}
                              className="px-4 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
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
                  <Label htmlFor="cena_redovna" className="text-right">
                    Redovna cena
                  </Label>
                  <Input
                    id="cena_redovna"
                    type="number"
                    step="0.01"
                    value={formData.cena_redovna}
                    onChange={(e) =>
                      setFormData({ ...formData, cena_redovna: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cena_akcija" className="text-right">
                    Akcijska cena
                  </Label>
                  <Input
                    id="cena_akcija"
                    type="number"
                    step="0.01"
                    value={formData.cena_akcija}
                    onChange={(e) =>
                      setFormData({ ...formData, cena_akcija: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="0.00"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="napomena" className="text-right">
                    Napomena
                  </Label>
                  <Input
                    id="napomena"
                    value={formData.napomena}
                    onChange={(e) =>
                      setFormData({ ...formData, napomena: e.target.value })
                    }
                    className="col-span-3"
                    placeholder="Opciono: Unesite napomenu"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreate}>
                  Dodaj Cenu Raf
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
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
                <SelectItem value="5">5 po stranici</SelectItem>
                <SelectItem value="10">10 po stranici</SelectItem>
                <SelectItem value="20">20 po stranici</SelectItem>
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
                    Artikal
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Naziv Artikla
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Prodavnica
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Redovna cena
                  </th>
                  <th className="border border-border px-4 py-2 text-left">
                    Akcijska cena
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
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="border border-border px-4 py-8 text-center"
                    >
                      Nije pronađen nijedan zapis o cenama raf
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-muted">
                      <td className="border border-border px-4 py-2">
                        {item.id}
                      </td>
                      <td className="border border-border px-4 py-2">
                        <div>
                          <div className="font-medium">{item.id_artikal}</div>
                          {item.artikli?.BAR_CODE && (
                            <div className="text-sm text-muted-foreground">
                              {item.artikli.BAR_CODE}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="border border-border px-4 py-2">
                        {item.artikli?.DESCRIPTION}
                      </td>
                      <td className="border border-border px-4 py-2">
                        <div>
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
                      <td className="border border-border px-4 py-2 text-right">
                        {item.cena_redovna
                          ? `${Number(item.cena_redovna).toFixed(2)}`
                          : "0.00"}
                      </td>
                      <td className="border border-border px-4 py-2 text-right">
                        {item.cena_akcija
                          ? `${Number(item.cena_akcija).toFixed(2)}`
                          : "0.00"}
                      </td>
                      <td className="border border-border px-4 py-2">
                        <div className="flex space-x-2">
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
                                <AlertDialogTitle>
                                  Da li ste sigurni?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Ova akcija ne može biti poništena. Ovo će
                                  trajno obrisati zapis o ceni raf.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Odustani</AlertDialogCancel>
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
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, ceneRaf.length)} od{" "}
              {ceneRaf.length} zapisa
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Prethodna
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage * itemsPerPage >= ceneRaf.length}
              >
                Sledeća
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Printing Configuration Card */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Konfiguracija Štampanja
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Form Fields */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="radnja">Radnja</Label>
                <Select
                  value={printConfig.radnja}
                  onValueChange={(value) =>
                    setPrintConfig({ ...printConfig, radnja: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite prodavnicu" />
                  </SelectTrigger>
                  <SelectContent>
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
              </div>

              <div className="space-y-2">
                <Label htmlFor="format">Format</Label>
                <Select
                  value={printConfig.format}
                  onValueChange={(value) =>
                    setPrintConfig({ ...printConfig, format: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6x4">6x4 cm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tip_cene">Tip cene</Label>
                <Select
                  value={printConfig.tip_cene}
                  onValueChange={(value) =>
                    setPrintConfig({ ...printConfig, tip_cene: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Izaberite tip cene" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="akcija">Akcija</SelectItem>
                    <SelectItem value="redovna">Redovna</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="kopija">Kopija</Label>
                <Input
                  id="kopija"
                  type="number"
                  min="1"
                  max="99"
                  value={printConfig.kopija}
                  onChange={(e) =>
                    setPrintConfig({
                      ...printConfig,
                      kopija: parseInt(e.target.value) || 1,
                    })
                  }
                  placeholder="1"
                />
              </div>

              <div className="pt-4">
                <Button
                  onClick={handlePrint}
                  disabled={
                    !printConfig.radnja ||
                    !printConfig.format ||
                    !printConfig.tip_cene
                  }
                  className="flex items-center gap-2 w-full"
                >
                  <Printer className="w-4 h-4" />
                  Štampaj
                </Button>
              </div>
            </div>

            {/* Right Column - Print Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Pregled štampanja</h3>
              {printConfig.format ? (
                <div
                  className="border-2 border-dashed border-border rounded-lg p-4"
                  dangerouslySetInnerHTML={{
                    __html: getFormatPreview(
                      printConfig.format,
                      printConfig.tip_cene
                    ),
                  }}
                />
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center text-muted-foreground">
                  Izaberite format da vidite pregled štampanja
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uredi Cenu Raf</DialogTitle>
            <DialogDescription>
              Ažuriraj informacije o ceni raf.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Artikal</Label>
              <div className="col-span-3">
                <Input value={articleSearchTerm} disabled className="w-full" />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Prodavnica</Label>
              <div className="col-span-3">
                <Input
                  value={prodavnicaSearchTerm}
                  disabled
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_cena_redovna" className="text-right">
                Redovna cena
              </Label>
              <Input
                id="edit_cena_redovna"
                type="number"
                step="0.01"
                value={formData.cena_redovna}
                onChange={(e) =>
                  setFormData({ ...formData, cena_redovna: e.target.value })
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_cena_akcija" className="text-right">
                Akcijska cena
              </Label>
              <Input
                id="edit_cena_akcija"
                type="number"
                step="0.01"
                value={formData.cena_akcija}
                onChange={(e) =>
                  setFormData({ ...formData, cena_akcija: e.target.value })
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_napomena" className="text-right">
                Napomena
              </Label>
              <Input
                id="edit_napomena"
                value={formData.napomena}
                onChange={(e) =>
                  setFormData({ ...formData, napomena: e.target.value })
                }
                className="col-span-3"
                placeholder="Opciono: Unesite napomenu"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEdit}>
              Ažuriraj Cenu Raf
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
