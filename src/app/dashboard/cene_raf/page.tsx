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

type CeneRaf = {
  id: number;
  id_prodavnica: number | null;
  id_artikal: number | null;
  cena_redovna: any; // Decimal type from Prisma
  cena_akcija: any; // Decimal type from Prisma
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
  const [printConfig, setPrintConfig] = useState({
    radnja: "",
    format: "",
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
      // Get filtered data for the selected prodavnica and price type
      const printData = ceneRaf.filter((item) => {
        const matchesProdavnica =
          item.id_prodavnica?.toString() === printConfig.radnja;

        // Filter by price type
        let hasValidPrice = false;
        if (printConfig.tip_cene === "akcija") {
          hasValidPrice = item.cena_akcija && Number(item.cena_akcija) > 0;
        } else if (printConfig.tip_cene === "redovna") {
          hasValidPrice = item.cena_redovna && Number(item.cena_redovna) > 0;
        } else {
          hasValidPrice = true; // Show all if no type selected
        }

        return matchesProdavnica && hasValidPrice;
      });

      if (printData.length === 0) {
        toast.error("Nema podataka za štampanje za izabrane kriterijume");
        return;
      }

      // Here you would implement the actual printing logic
      // For now, we'll just show a success message
      toast.success(
        `Štampanje ${printData.length} artikala u formatu ${
          printConfig.format
        } (${printConfig.kopija} kopija) - ${
          printConfig.tip_cene === "akcija"
            ? "Akcijske"
            : printConfig.tip_cene === "redovna"
            ? "Redovne"
            : "Sve"
        } cene`
      );

      console.log("Print data:", {
        config: printConfig,
        data: printData,
      });

      // TODO: Implement actual printing logic
      // This could involve:
      // 1. Generating PDF with the selected format
      // 2. Sending to printer API
      // 3. Using browser print API
    } catch (error) {
      console.error("Error printing:", error);
      toast.error("Greška pri štampanju");
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

  const stampajCeneZaRaf = async () => {
    if (!selectedLiflet) {
      toast.error("Please select a liflet first");
      return;
    }

    try {
      // Filter data based on current filters
      const filteredData = lifletDetalji.filter((detalj) => {
        const matchesSearch =
          !searchTerm ||
          detalj.artikli?.DESCRIPTION?.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          detalj.artikli?.BAR_CODE?.includes(searchTerm);

        const matchesClient =
          clientFilter === "all" || detalj.klijenti?.Naziv === clientFilter;

        return matchesSearch && matchesClient;
      });

      if (filteredData.length === 0) {
        toast.error("No data to print");
        return;
      }

      // Generate QR codes for all items
      const qrCodesPromises = filteredData.map(async (detalj) => {
        const qrData = `${
          detalj.artikli?.Id_Artikal || detalj.artikli?.DESCRIPTION || ""
        }`;
        try {
          const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            width: 80,
            margin: 1,
            color: {
              dark: "#000000",
              light: "#FFFFFF",
            },
          });
          return qrCodeDataURL;
        } catch (error) {
          console.error("Error generating QR code:", error);
          return "";
        }
      });

      const qrCodes = await Promise.all(qrCodesPromises);

      // Serbian number formatting function for HTML
      const formatSerbianNumberHTML = (value: number) => {
        return new Intl.NumberFormat("sr-RS", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      };

      // Create HTML content for price tags
      // A4 dimensions in pixels at 300 DPI: 2480 x 3508
      // Price tag: 6cm x 3.5cm = ~708px x ~413px at 300 DPI
      // We'll fit 3 tags per row (with margins), so ~3.33 tags per row, let's do 3 per row
      // 7 rows per page = 21 tags per page

      let htmlContent = ``;

      filteredData.forEach((detalj, index) => {
        const qrCode = qrCodes[index];
        const sifra = detalj.artikli?.Id_Artikal || "";
        const articleName = detalj.artikli?.DESCRIPTION || "";
        const barcode = detalj.artikli?.BAR_CODE || "";
        const clientName = detalj.klijenti?.Naziv || "";
        const regularPrice = detalj.cena_redovna
          ? formatSerbianNumberHTML(Number(detalj.cena_redovna))
          : "";
        const promoPrice = detalj.cena_akcija
          ? formatSerbianNumberHTML(Number(detalj.cena_akcija))
          : "";

        htmlContent += `
          <div style="
            width: 60mm; 
            height: 35mm; 
            border: 1px solid #000; 
            background: white; 
            box-sizing: border-box; 
            padding: 2px; 
            font-family: Arial, sans-serif;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          ">
        
            <!-- TOP: Product name and QR -->
            <div style="display: flex; justify-content: space-between;">
              
              <!-- Product info -->
              <div style="flex: 1; padding-right: 2mm;">
                <div style="font-size: 10px; font-weight: bold; color: #000; margin-bottom: 1mm;">
                  ${articleName}
                </div>
        
                <!-- Optional product details row -->
                <div style="font-size: 6.5px; line-height: 1.2;">
                  <div><strong>${sifra}</strong> | ${barcode}</div>
                </div>
              </div>
        
              <!-- QR code -->
              <div style="width: 15mm; display: flex; align-items: center; justify-content: flex-end;">
                ${
                  qrCode
                    ? `<img src="${qrCode}" alt="QR" style="width: 14mm; height: 14mm;" />`
                    : ""
                }
              </div>
            </div>
        
            <!-- BOTTOM: Red promo section -->
            <div style="
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              margin-top: 2mm;
            ">
              
              <!-- Left text -->
              <div style="font-size: 7px; color: #b00; font-weight: bold;">
                Akcijaska cena<br>
                <span style="font-size: 6px; color: #555; font-weight: normal;">
                  Akcija važi do: 
                </span>
                <span style="font-size: 6px; color: #555; font-weight: normal;">
                  ${
                    selectedLiflet?.datum_do
                      ? new Date(selectedLiflet.datum_do).toLocaleDateString(
                          "sr-RS"
                        )
                      : ""
                  }
                </span>
              </div>
        
              <!-- Right red price box -->
              <div style="
                background: #b00;
                color: white;
                padding: 3px;
                border-radius: 2px;
                text-align: right;
                width: 60%;
              ">
                <div style="font-size: 24px; font-weight: bold;">
                  ${promoPrice} <span style="font-size: 8px;">RSD  </span>
                </div>
              <div style="font-size: 10px; opacity: 0.8;">
                  <span style="text-decoration: line-through; display: inline-block;">
                    ${regularPrice}
                  </span>
                  <span style="font-size: 6px; display: inline-block;">
                    RSD
                  </span>
                </div>
              </div>
        
            </div>
        
          </div>
        `;
      });

      // Create a temporary element to render
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.width = "210mm";
      tempDiv.style.background = "white";
      document.body.appendChild(tempDiv);

      // Use html2canvas to render the HTML
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794, // 210mm at 96 DPI
        height: Math.max(1123, tempDiv.scrollHeight), // 297mm at 96 DPI, but adjust for content
      });

      // Remove temporary element
      document.body.removeChild(tempDiv);

      // Create PDF from canvas
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      // Add first page
      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // Save the PDF
      const fileName = `cene_za_raf_${selectedLiflet.id}_${
        new Date().toISOString().split("T")[0]
      }.pdf`;
      pdf.save(fileName);

      toast.success(`Generisan PDF sa ${filteredData.length} artikala`);
    } catch (error) {
      console.error("Error generating price tags PDF:", error);
      toast.error("Failed to generate price tags PDF");
    }
  };

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
                    <SelectItem value="5x3">5x3 cm</SelectItem>
                    <SelectItem value="6x4">6x4 cm</SelectItem>
                    <SelectItem value="10x10x">10x10x cm</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="A4">A4</SelectItem>
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
                <div className="border-2 border-dashed border-border rounded-lg p-4">
                  {printConfig.format === "5x3" && (
                    <div className="bg-white border border-gray-300 rounded p-3 text-center max-w-xs mx-auto">
                      <div className="text-xs font-bold mb-1">
                        NAZIV ARTIKLA
                      </div>
                      <div className="text-xs mb-1">Šifra: 12345</div>
                      <div className="text-xs mb-2">Klijent: Prodavnica</div>
                      <div className="text-lg font-bold text-red-600">
                        {printConfig.tip_cene === "akcija"
                          ? "AKCIJA"
                          : "REDOVNA"}
                      </div>
                      <div className="text-xl font-bold">99.99 RSD</div>
                    </div>
                  )}

                  {printConfig.format === "6x4" && (
                    <div className="bg-white border border-gray-300 rounded p-4 text-center max-w-sm mx-auto">
                      <div className="flex justify-between items-start mb-2">
                        <div className="text-xs">
                          <div className="font-bold">NAZIV ARTIKLA</div>
                          <div>Šifra: 12345</div>
                        </div>
                        <div className="text-xs">📱</div>
                      </div>
                      <div className="text-xs mb-3">Klijent: Prodavnica</div>
                      <div className="bg-red-100 p-2 rounded">
                        <div className="text-sm font-bold text-red-600 mb-1">
                          {printConfig.tip_cene === "akcija"
                            ? "AKCIJSKA CENA"
                            : "REDOVNA CENA"}
                        </div>
                        <div className="text-2xl font-bold">99.99 RSD</div>
                        {printConfig.tip_cene === "akcija" && (
                          <div className="text-xs line-through text-gray-500">
                            129.99 RSD
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {printConfig.format === "10x10x" && (
                    <div className="bg-white border border-gray-300 rounded p-6 text-center max-w-md mx-auto">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-bold mb-2">
                            NAZIV ARTIKLA
                          </div>
                          <div className="text-xs mb-1">Šifra: 12345</div>
                          <div className="text-xs">Klijent: Prodavnica</div>
                        </div>
                        <div className="text-xs">📱 QR CODE</div>
                      </div>
                      <div className="mt-4 bg-red-100 p-3 rounded">
                        <div className="text-sm font-bold text-red-600 mb-1">
                          {printConfig.tip_cene === "akcija"
                            ? "AKCIJA"
                            : "REDOVNA CENA"}
                        </div>
                        <div className="text-3xl font-bold">99.99 RSD</div>
                        {printConfig.tip_cene === "akcija" && (
                          <div className="text-sm line-through text-gray-500 mt-1">
                            129.99 RSD
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {printConfig.format === "A5" && (
                    <div className="bg-white border border-gray-300 rounded p-8 text-center">
                      <h2 className="text-xl font-bold mb-4">BORJAK ZTR</h2>
                      <div className="text-sm mb-6">Todorovića 7, Kraljevo</div>
                      <h3 className="text-lg font-bold mb-4">CENE ARTIKALA</h3>
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-2">
                              Artikal
                            </th>
                            <th className="border border-gray-300 p-2">
                              Šifra
                            </th>
                            <th className="border border-gray-300 p-2">
                              {printConfig.tip_cene === "akcija"
                                ? "Akcijska cena"
                                : "Redovna cena"}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-2">
                              NAZIV ARTIKLA
                            </td>
                            <td className="border border-gray-300 p-2">
                              12345
                            </td>
                            <td className="border border-gray-300 p-2 font-bold">
                              99.99 RSD
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  {printConfig.format === "A4" && (
                    <div className="bg-white border border-gray-300 rounded p-8 text-center">
                      <h1 className="text-2xl font-bold mb-4">BORJAK ZTR</h1>
                      <div className="text-lg mb-6">Todorovića 7, Kraljevo</div>
                      <h2 className="text-xl font-bold mb-6">
                        CENOVNIK -{" "}
                        {printConfig.tip_cene === "akcija"
                          ? "AKCIJSKE CENE"
                          : "REDOVNE CENE"}
                      </h2>
                      <table className="w-full border-collapse border border-gray-300 text-sm">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border border-gray-300 p-3">
                              Artikal
                            </th>
                            <th className="border border-gray-300 p-3">
                              Šifra
                            </th>
                            <th className="border border-gray-300 p-3">
                              Klijent
                            </th>
                            <th className="border border-gray-300 p-3">Cena</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="border border-gray-300 p-3">
                              NAZIV ARTIKLA
                            </td>
                            <td className="border border-gray-300 p-3">
                              12345
                            </td>
                            <td className="border border-gray-300 p-3">
                              Prodavnica
                            </td>
                            <td className="border border-gray-300 p-3 font-bold">
                              99.99 RSD
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
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
