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
  Upload,
  X,
  Image as ImageIcon,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type LifletZaglavlje = {
  id: number;
  datum_od: Date;
  datum_do: Date;
  op_id: number | null;
};

type LifletDetalji = {
  id: number;
  liflet_id: number;
  Id_artikal: number;
  ID_Klijent: number | null;
  cena_akcija: number | null;
  cena_redovna: number | null;
  image: string | null;
  artikli?: {
    Id_Artikal: number;
    DESCRIPTION: string | null;
    BAR_CODE: string | null;
  };
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

export default function LifletPage() {
  const [lifletZaglavlje, setLifletZaglavlje] = useState<LifletZaglavlje[]>([]);
  const [lifletDetalji, setLifletDetalji] = useState<LifletDetalji[]>([]);
  const [selectedLiflet, setSelectedLiflet] = useState<LifletZaglavlje | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [articleSearchTerm, setArticleSearchTerm] = useState("");
  const [searchedArticles, setSearchedArticles] = useState<
    Array<{
      Id_Artikal: number;
      DESCRIPTION: string | null;
      BAR_CODE: string | null;
      PRICE: string | null;
      hasImage: boolean;
      image: string | null;
    }>
  >([]);
  const [showArticleDropdown, setShowArticleDropdown] = useState(false);
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [searchedClients, setSearchedClients] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "datum_do",
    direction: "desc",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modal states for store selection
  const [isStoreSelectionModalOpen, setIsStoreSelectionModalOpen] =
    useState(false);
  const [availableProdavnice, setAvailableProdavnice] = useState<
    Array<{
      ID_Prodavnica: number;
      Naziv: string | null;
      Sifra: string | null;
    }>
  >([]);
  const [selectedProdavnice, setSelectedProdavnice] = useState<number[]>([]);
  const [storeSearchTerm, setStoreSearchTerm] = useState("");
  const [filteredProdavnice, setFilteredProdavnice] = useState<
    Array<{
      ID_Prodavnica: number;
      Naziv: string | null;
      Sifra: string | null;
    }>
  >([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateDetailModalOpen, setIsCreateDetailModalOpen] = useState(false);
  const [isEditDetailModalOpen, setIsEditDetailModalOpen] = useState(false);
  const [editingLiflet, setEditingLiflet] = useState<LifletZaglavlje | null>(
    null
  );
  const [editingDetail, setEditingDetail] = useState<LifletDetalji | null>(
    null
  );

  // Form states
  const [formData, setFormData] = useState({
    datum_od: "",
    datum_do: "",
    op_id: "",
  });

  const [detailFormData, setDetailFormData] = useState({
    Id_artikal: "",
    ID_Klijent: "",
    cena_akcija: "",
    cena_redovna: "",
    selectedArticle: null as any,
    selectedClient: null as any,
    image: null as File | null,
    imagePreview: null as string | null,
    existingImage: null as string | null,
  });

  useEffect(() => {
    loadLifletZaglavlje();
  }, [sortConfig]);

  // Reset to page 1 when items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [itemsPerPage]);

  useEffect(() => {
    if (selectedLiflet) {
      loadLifletDetalji(selectedLiflet.id);
    }
  }, [selectedLiflet]);

  const loadLifletZaglavlje = async () => {
    try {
      setLoading(true);
      // Load all data for proper pagination
      const response = await fetch(
        `/api/liflet/zaglavlje?sort=${sortConfig.key}&order=${sortConfig.direction}&limit=10000`
      );
      const data = await response.json();
      setLifletZaglavlje(data.data || []);
      setTotalRecords(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error loading liflet zaglavlje:", error);
      toast.error("Failed to load liflet data");
    } finally {
      setLoading(false);
    }
  };

  const loadLifletDetalji = async (lifletId: number) => {
    try {
      const response = await fetch(`/api/liflet/detalji?liflet_id=${lifletId}`);
      const data = await response.json();
      setLifletDetalji(data.data || []);
    } catch (error) {
      console.error("Error loading liflet detalji:", error);
      toast.error("Failed to load liflet details");
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
      const response = await fetch("/api/liflet/zaglavlje", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast.success("Liflet created successfully");
        setIsCreateModalOpen(false);
        resetForm();
        loadLifletZaglavlje();
      } else {
        toast.error("Failed to create liflet");
      }
    } catch (error) {
      console.error("Error creating liflet:", error);
      toast.error("Failed to create liflet");
    }
  };

  const handleEdit = async () => {
    if (!editingLiflet) return;

    try {
      const response = await fetch(
        `/api/liflet/zaglavlje/${editingLiflet.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        toast.success("Liflet updated successfully");
        setIsEditModalOpen(false);
        setEditingLiflet(null);
        resetForm();
        loadLifletZaglavlje();
      } else {
        toast.error("Failed to update liflet");
      }
    } catch (error) {
      console.error("Error updating liflet:", error);
      toast.error("Failed to update liflet");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/liflet/zaglavlje/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Liflet deleted successfully");
        loadLifletZaglavlje();
        if (selectedLiflet?.id === id) {
          setSelectedLiflet(null);
          setLifletDetalji([]);
          setClientFilter("all");
          setSearchTerm("");
        }
      } else {
        toast.error("Failed to delete liflet");
      }
    } catch (error) {
      console.error("Error deleting liflet:", error);
      toast.error("Failed to delete liflet");
    }
  };

  const resetForm = () => {
    setFormData({
      datum_od: "",
      datum_do: "",
      op_id: "",
    });
  };

  const resetDetailForm = () => {
    setDetailFormData({
      Id_artikal: "",
      ID_Klijent: "",
      cena_akcija: "",
      cena_redovna: "",
      selectedArticle: null,
      selectedClient: null,
      image: null,
      imagePreview: null,
      existingImage: null,
    });
    setArticleSearchTerm("");
    setSearchedArticles([]);
    setClientSearchTerm("");
    setSearchedClients([]);
  };

  // Image handling functions
  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select a valid image file");
      return;
    }

    setDetailFormData((prev) => ({
      ...prev,
      image: file,
      imagePreview: URL.createObjectURL(file),
    }));
  };

  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleImageSelect(files[0]);
    }
  };

  const handleImageDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeImage = () => {
    if (detailFormData.imagePreview) {
      URL.revokeObjectURL(detailFormData.imagePreview);
    }
    setDetailFormData((prev) => ({
      ...prev,
      image: null,
      imagePreview: null,
      existingImage: null,
    }));
  };

  const exportToPDF = async () => {
    if (!selectedLiflet) return;

    try {
      // Filter data
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

      // Serbian number formatting function for HTML
      const formatSerbianNumberHTML = (value: number) => {
        return new Intl.NumberFormat("sr-RS", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      };

      // Create HTML content with proper Serbian characters and logo
      const htmlContent = `
        <div style="font-family: 'DejaVu Sans', 'Arial Unicode MS', Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; background: white;">
          <div style="display: flex; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #428bca; padding-bottom: 20px;">
            <img src="/logo.png" alt="Logo" style="width: 80px; height: 80px; margin-right: 20px;" onerror="this.style.display='none'" />
            <div>
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #428bca;">BORJAK ZTR</h1>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">Todorovića 7</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">Kraljevo</p>
              <p style="margin: 5px 0; font-size: 14px; color: #666;">PIB: 104069152</p>
            </div>
          </div>

          <div style="margin-bottom: 20px; text-align: center;">
            <h2 style="margin: 0; font-size: 20px; color: #333;">Liflet: ${new Date(
              selectedLiflet.datum_od
            ).toLocaleDateString("sr-RS")} - ${new Date(
        selectedLiflet.datum_do
      ).toLocaleDateString("sr-RS")}</h2>
            ${
              clientFilter !== "all"
                ? `<p style="margin: 10px 0; font-size: 14px; color: #666;">Filtriraj po Klijentu: ${clientFilter}</p>`
                : ""
            }
            <p style="margin: 5px 0; font-size: 12px; color: #888;">Generisano: ${new Date().toLocaleDateString(
              "sr-RS"
            )}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: 'DejaVu Sans', Arial, sans-serif;">
            <thead>
              <tr style="background-color: #428bca; color: white;">
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: center; font-weight: bold; width: 60px;">Slika</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Artikal</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Šifra</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Klijent</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Redovna cena</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Akcijska cena</th>
              </tr>
            </thead>
            <tbody>
              ${filteredData
                .map(
                  (detalj, index) => `
                <tr style="background-color: ${
                  index % 2 === 0 ? "#ffffff" : "#f9f9f9"
                };">
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">
                    ${
                      detalj.image
                        ? `<img src="/api/images/${detalj.image}" alt="Product" style="max-width: 35px; max-height: 35px; width: auto; height: auto; object-fit: contain; border: 1px solid #ddd;" />`
                        : '<div style="width: 35px; height: 35px; background-color: #f0f0f0; display: inline-flex; align-items: center; justify-content: center; border: 1px solid #ddd; font-size: 12px;">📷</div>'
                    }
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    detalj.artikli?.DESCRIPTION || ""
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    detalj.artikli?.BAR_CODE || ""
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    detalj.klijenti?.Naziv || ""
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                    detalj.cena_redovna
                      ? formatSerbianNumberHTML(Number(detalj.cena_redovna))
                      : ""
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                    detalj.cena_akcija
                      ? formatSerbianNumberHTML(Number(detalj.cena_akcija))
                      : ""
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </div>
      `;

      // Create a temporary element to render
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      tempDiv.style.width = "800px";
      tempDiv.style.background = "white";
      document.body.appendChild(tempDiv);

      // Use html2canvas to render the HTML with Serbian character support
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 800,
        height: tempDiv.scrollHeight,
        onclone: (clonedDoc) => {
          // Ensure Serbian fonts are applied
          const clonedElement = clonedDoc.body.firstElementChild as HTMLElement;
          if (clonedElement) {
            clonedElement.style.fontFamily =
              "'DejaVu Sans', 'Arial Unicode MS', Arial, sans-serif";
          }
        },
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
      const pageHeight = 295; // A4 height in mm
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
      const fileName = `liflet_${selectedLiflet.id}_${
        clientFilter !== "all"
          ? clientFilter.replace(/[^a-zA-Z0-9šđčćžŠĐČĆŽ]/g, "_")
          : "all"
      }.pdf`;
      pdf.save(fileName);

      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  const loadProdavnice = async () => {
    try {
      const response = await fetch("/api/prodavnice");
      const data = await response.json();
      setAvailableProdavnice(data.data || []);
      setFilteredProdavnice(data.data || []);
    } catch (error) {
      console.error("Error loading prodavnice:", error);
      toast.error("Failed to load stores");
    }
  };

  const openStoreSelectionModal = () => {
    if (!selectedLiflet) {
      toast.error("Please select a liflet first");
      return;
    }

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
      toast.error("No items to add to stores");
      return;
    }

    loadProdavnice();
    setSelectedProdavnice([]);
    setStoreSearchTerm("");
    setIsStoreSelectionModalOpen(true);
  };

  const handleStoreSearch = (search: string) => {
    setStoreSearchTerm(search);
    const filtered = availableProdavnice.filter(
      (prodavnica) =>
        prodavnica.Naziv?.toLowerCase().includes(search.toLowerCase()) ||
        prodavnica.Sifra?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredProdavnice(filtered);
  };

  const toggleProdavnicaSelection = (id: number) => {
    setSelectedProdavnice((prev) =>
      prev.includes(id)
        ? prev.filter((storeId) => storeId !== id)
        : [...prev, id]
    );
  };

  const selectAllProdavnice = () => {
    setSelectedProdavnice(filteredProdavnice.map((p) => p.ID_Prodavnica));
  };

  const deselectAllProdavnice = () => {
    setSelectedProdavnice([]);
  };

  const submitToStores = async () => {
    if (selectedProdavnice.length === 0) {
      toast.error("Please select at least one store");
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

      const artikliData = filteredData.map((detalj) => ({
        Id_artikal: detalj.Id_artikal,
        cena_redovna: detalj.cena_redovna,
        cena_akcija: detalj.cena_akcija,
      }));

      const response = await fetch("/api/cene_raf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prodavnice_ids: selectedProdavnice,
          artikli_data: artikliData,
          napomena: selectedLiflet?.datum_do
            ? "Akcijska cena do: " + formatSerbianDate(selectedLiflet.datum_do)
            : null,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Uspesno dodato ${result.count} cena u rafove`);
        setIsStoreSelectionModalOpen(false);
      } else {
        toast.error("Greska pri dodavanju cena u rafove");
      }
    } catch (error) {
      console.error("Error submitting to stores:", error);
      toast.error("Greska pri dodavanju cena u rafove");
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!detailFormData.image || !detailFormData.Id_artikal) return null;

    try {
      const formData = new FormData();
      formData.append("file", detailFormData.image);
      formData.append("idArtikal", detailFormData.Id_artikal);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        return result.filename;
      } else {
        toast.error("Failed to upload image");
        return null;
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
      return null;
    }
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

  const selectArticle = (article: any) => {
    setDetailFormData({
      ...detailFormData,
      Id_artikal: article.Id_Artikal.toString(),
      selectedArticle: article,
    });
    setArticleSearchTerm(`${article.DESCRIPTION} (${article.BAR_CODE})`);
    setShowArticleDropdown(false);
  };

  const selectClient = (client: any) => {
    setDetailFormData({
      ...detailFormData,
      ID_Klijent: client.ID_Klijent.toString(),
      selectedClient: client,
    });
    setClientSearchTerm(`${client.Naziv} (${client.PIB})`);
    setShowClientDropdown(false);
  };

  const handleCreateDetail = async () => {
    if (
      !selectedLiflet ||
      !detailFormData.selectedArticle ||
      !detailFormData.selectedClient
    )
      return;

    try {
      let imageFilename = null;

      // Upload image if one is selected
      if (detailFormData.image) {
        imageFilename = await uploadImage();
        if (!imageFilename) {
          // Upload failed, but continue without image
          toast.warning("Image upload failed, but continuing without image");
        }
      }

      const response = await fetch("/api/liflet/detalji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liflet_id: selectedLiflet.id,
          Id_artikal: detailFormData.Id_artikal,
          ID_Klijent: detailFormData.ID_Klijent,
          cena_akcija: detailFormData.cena_akcija || null,
          cena_redovna: detailFormData.cena_redovna || null,
          image: imageFilename,
        }),
      });

      if (response.ok) {
        toast.success("Detail added successfully");
        setIsCreateDetailModalOpen(false);
        resetDetailForm();
        loadLifletDetalji(selectedLiflet.id);
      } else {
        toast.error("Failed to add detail");
      }
    } catch (error) {
      console.error("Error creating detail:", error);
      toast.error("Failed to add detail");
    }
  };

  const handleEditDetail = async () => {
    if (!editingDetail) return;

    try {
      let imageFilename = detailFormData.existingImage;

      // Upload new image if one is selected
      if (detailFormData.image) {
        const uploadedFilename = await uploadImage();
        if (uploadedFilename) {
          imageFilename = uploadedFilename;
        } else {
          // Upload failed, but continue without updating image
          toast.warning(
            "Image upload failed, but continuing without image update"
          );
        }
      } else if (detailFormData.existingImage === null) {
        // Image was removed
        imageFilename = null;
      }

      const response = await fetch(`/api/liflet/detalji/${editingDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Id_artikal: detailFormData.Id_artikal,
          ID_Klijent: detailFormData.ID_Klijent,
          cena_akcija: detailFormData.cena_akcija || null,
          cena_redovna: detailFormData.cena_redovna || null,
          image: imageFilename,
        }),
      });

      if (response.ok) {
        toast.success("Detail updated successfully");
        setIsEditDetailModalOpen(false);
        setEditingDetail(null);
        resetDetailForm();
        if (selectedLiflet) {
          loadLifletDetalji(selectedLiflet.id);
        }
      } else {
        toast.error("Failed to update detail");
      }
    } catch (error) {
      console.error("Error updating detail:", error);
      toast.error("Failed to update detail");
    }
  };

  const handleDeleteDetail = async (id: number) => {
    try {
      const response = await fetch(`/api/liflet/detalji/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Detail deleted successfully");
        if (selectedLiflet) {
          loadLifletDetalji(selectedLiflet.id);
        }
      } else {
        toast.error("Failed to delete detail");
      }
    } catch (error) {
      console.error("Error deleting detail:", error);
      toast.error("Failed to delete detail");
    }
  };

  const openEditDetailModal = (detail: LifletDetalji) => {
    setEditingDetail(detail);
    setDetailFormData({
      Id_artikal: detail.Id_artikal.toString(),
      ID_Klijent: detail.ID_Klijent?.toString() || "",
      cena_akcija: detail.cena_akcija
        ? Number(detail.cena_akcija).toString()
        : "",
      cena_redovna: detail.cena_redovna
        ? Number(detail.cena_redovna).toString()
        : "",
      selectedArticle: detail.artikli,
      selectedClient: detail.klijenti,
      image: null,
      imagePreview: null,
      existingImage: detail.image,
    });
    setArticleSearchTerm(
      detail.artikli
        ? `${detail.artikli.DESCRIPTION} (${detail.artikli.BAR_CODE})`
        : ""
    );
    setClientSearchTerm(
      detail.klijenti ? `${detail.klijenti.Naziv} (${detail.klijenti.PIB})` : ""
    );
    setIsEditDetailModalOpen(true);
  };

  const openEditModal = (liflet: LifletZaglavlje) => {
    setEditingLiflet(liflet);
    
    // Format dates without timezone conversion to avoid date shifting
    const formatDateForInput = (date: Date) => {
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    setFormData({
      datum_od: formatDateForInput(liflet.datum_od),
      datum_do: formatDateForInput(liflet.datum_do),
      op_id: liflet.op_id?.toString() || "",
    });
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

  const formatSerbianDate = (date: string | Date) => {
    const dateObj = typeof date === "string" ? new Date(date) : date;
    return dateObj.toLocaleDateString("sr-RS");
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Liflet Zaglavlje - Full Width */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Upravljanje Lifletima</CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Kreiraj Liflet
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kreiraj Novi Liflet</DialogTitle>
                <DialogDescription>
                  Dodaj novi prometni list sa datumskim opsegom i informacijama
                  o klijentu.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="datum_od" className="text-right">
                    Datum početka
                  </Label>
                  <Input
                    id="datum_od"
                    type="date"
                    value={formData.datum_od}
                    onChange={(e) =>
                      setFormData({ ...formData, datum_od: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="datum_do" className="text-right">
                    Datum završetka
                  </Label>
                  <Input
                    id="datum_do"
                    type="date"
                    value={formData.datum_do}
                    onChange={(e) =>
                      setFormData({ ...formData, datum_do: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="op_id" className="text-right">
                    ID operatora
                  </Label>
                  <Input
                    id="op_id"
                    type="number"
                    value={formData.op_id}
                    onChange={(e) =>
                      setFormData({ ...formData, op_id: e.target.value })
                    }
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleCreate}>
                  Kreiraj Liflet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
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

          {/* Paginate the liflet data */}
          {(() => {
            const maxPages = Math.ceil(lifletZaglavlje.length / itemsPerPage);
            const effectiveCurrentPage =
              currentPage > maxPages && maxPages > 0 ? 1 : currentPage;
            const startIndex = (effectiveCurrentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const paginatedData = lifletZaglavlje.slice(startIndex, endIndex);

            return (
              <>
                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th
                          className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted w-20"
                          onClick={() => handleSort("id")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>ID</span>
                            {getSortIcon("id")}
                          </div>
                        </th>
                        <th
                          className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted w-48"
                          onClick={() => handleSort("datum_od")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Datum početka</span>
                            {getSortIcon("datum_od")}
                          </div>
                        </th>
                        <th
                          className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted w-48"
                          onClick={() => handleSort("datum_do")}
                        >
                          <div className="flex items-center space-x-1">
                            <span>Datum završetka</span>
                            {getSortIcon("datum_do")}
                          </div>
                        </th>
                        <th className="border border-border px-4 py-2 text-left w-48">
                          Akcije
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="border border-border px-4 py-8 text-center"
                          >
                            Učitavanje...
                          </td>
                        </tr>
                      ) : paginatedData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="border border-border px-4 py-8 text-center"
                          >
                            Nije pronađen nijedan liflet
                          </td>
                        </tr>
                      ) : (
                        paginatedData.map((liflet) => (
                          <tr
                            key={liflet.id}
                            className={`cursor-pointer hover:bg-muted ${
                              selectedLiflet?.id === liflet.id
                                ? "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                                : ""
                            }`}
                            onClick={() => {
                              setSelectedLiflet(liflet);
                              setClientFilter("all");
                              setSearchTerm("");
                            }}
                          >
                            <td className="border border-border px-4 py-2 w-20">
                              {liflet.id}
                            </td>
                            <td className="border border-border px-4 py-2 w-32">
                              {new Date(liflet.datum_od).toLocaleDateString()}
                            </td>
                            <td className="border border-border px-4 py-2 w-32">
                              {new Date(liflet.datum_do).toLocaleDateString()}
                            </td>
                            <td className="border border-border px-4 py-2 w-32">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditModal(liflet);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Da li ste sigurni?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Ova akcija ne može biti poništena. Ovo
                                        će trajno obrisati liflet i sve njegove
                                        povezane detalje.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Odustani
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() => handleDelete(liflet.id)}
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
                    Prikazano {(effectiveCurrentPage - 1) * itemsPerPage + 1} do{" "}
                    {Math.min(
                      effectiveCurrentPage * itemsPerPage,
                      lifletZaglavlje.length
                    )}{" "}
                    od {lifletZaglavlje.length} zapisa{" "}
                    {lifletZaglavlje.length !== totalRecords &&
                      `(od ukupno ${totalRecords})`}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={effectiveCurrentPage === 1}
                    >
                      Prethodna
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={
                        effectiveCurrentPage * itemsPerPage >=
                        lifletZaglavlje.length
                      }
                    >
                      Sledeća
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Liflet Detalji */}
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            {selectedLiflet
              ? `Detalji Lifleta - ID: ${selectedLiflet.id}`
              : "Izaberite Liflet"}
          </CardTitle>
          {selectedLiflet && (
            <Dialog
              open={isCreateDetailModalOpen}
              onOpenChange={setIsCreateDetailModalOpen}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Dodaj Artikal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Dodaj Artikal na Liflet</DialogTitle>
                  <DialogDescription>
                    Pretražite i izaberite artikal za dodavanje na ovaj liflet.
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
                        placeholder="Type to search articles..."
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
                              className="px-4 py-3 hover:bg-accent cursor-pointer border-b border-border last:border-b-0 flex items-center gap-3"
                              onClick={() => selectArticle(article)}
                            >
                              <div className="flex-shrink-0">
                                {article.hasImage && article.image ? (
                                  <img
                                    src={`/api/images/${article.image}`}
                                    alt={article.DESCRIPTION || "Article"}
                                    className="w-16 h-12 object-contain rounded border"
                                  />
                                ) : (
                                  <div className="w-16 h-12 bg-muted rounded border flex items-center justify-center">
                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium truncate">
                                  {article.DESCRIPTION}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Barkod: {article.BAR_CODE}
                                </div>
                                {article.PRICE && (
                                  <div className="text-sm text-muted-foreground">
                                    Cena: {article.PRICE}
                                  </div>
                                )}
                                {article.hasImage && (
                                  <div className="text-xs text-green-600 font-medium mt-1">
                                    ✓ Ima sliku
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="client_search" className="text-right">
                      Klijent
                    </Label>
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
                    <Label htmlFor="cena_redovna" className="text-right">
                      Regularna cena
                    </Label>
                    <Input
                      id="cena_redovna"
                      type="number"
                      step="0.01"
                      value={detailFormData.cena_redovna}
                      onChange={(e) =>
                        setDetailFormData({
                          ...detailFormData,
                          cena_redovna: e.target.value,
                        })
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
                      value={detailFormData.cena_akcija}
                      onChange={(e) =>
                        setDetailFormData({
                          ...detailFormData,
                          cena_akcija: e.target.value,
                        })
                      }
                      className="col-span-3"
                      placeholder="0.00"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label className="text-right pt-2">Slika</Label>
                    <div className="col-span-3">
                      <div
                        className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                        onDrop={handleImageDrop}
                        onDragOver={handleImageDragOver}
                        onClick={() =>
                          document.getElementById("image-input")?.click()
                        }
                      >
                        {detailFormData.imagePreview ? (
                          <div className="relative">
                            <img
                              src={detailFormData.imagePreview}
                              alt="Preview"
                              className="max-w-full max-h-32 mx-auto rounded"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute top-2 right-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeImage();
                              }}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div>
                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground mb-1">
                              Prevucite i spustite sliku ovde, ili kliknite da
                              odaberete
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Slika će biti sačuvana kao{" "}
                              {detailFormData.Id_artikal || "ID_artikal"}.
                              {detailFormData.image?.name.split(".").pop() ||
                                "ekstenzija"}
                            </p>
                          </div>
                        )}
                      </div>
                      <input
                        id="image-input"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleImageSelect(file);
                          }
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Opciono: Pošaljite sliku za ovaj artikal
                      </p>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="submit"
                    onClick={handleCreateDetail}
                    disabled={
                      !detailFormData.selectedArticle ||
                      !detailFormData.selectedClient
                    }
                  >
                    Dodaj Artikal
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {selectedLiflet ? (
            <div>
              <div className="mb-4 flex items-center gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Pretražite artikle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 max-w-xs"
                  />
                </div>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtriraj po klijentu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Svi Klijenti</SelectItem>
                    {Array.from(
                      new Set(
                        lifletDetalji
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
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportToPDF}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Izvezi PDF
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={openStoreSelectionModal}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Dodaj u Rafove
                </Button>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full border-collapse border border-border">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="border border-border px-2 py-2 text-left w-64">
                        Artikal
                      </th>
                      <th className="border border-border px-2 py-2 text-left w-48">
                        Klijent
                      </th>
                      <th className="border border-border px-4 py-2 text-left w-24">
                        Regularna cena
                      </th>
                      <th className="border border-border px-4 py-2 text-left w-24">
                        Akcijska cena
                      </th>
                      <th className="border border-border px-2 py-2 text-left w-20">
                        Slika
                      </th>
                      <th className="border border-border px-2 py-2 text-left w-32">
                        Akcije
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {lifletDetalji
                      .filter((detalj) => {
                        // Filter po tekstu
                        const matchesSearch =
                          !searchTerm ||
                          detalj.artikli?.DESCRIPTION?.toLowerCase().includes(
                            searchTerm.toLowerCase()
                          ) ||
                          detalj.artikli?.BAR_CODE?.includes(searchTerm);

                        // Filter po klijentu
                        const matchesClient =
                          clientFilter === "all" ||
                          detalj.klijenti?.Naziv === clientFilter;

                        return matchesSearch && matchesClient;
                      })
                      .map((detalj) => (
                        <tr key={detalj.id} className="hover:bg-muted">
                          <td className="border border-border px-2 py-2 w-64">
                            <div>
                              <div className="font-medium">
                                {detalj.artikli?.DESCRIPTION}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {detalj.artikli?.Id_Artikal}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {detalj.artikli?.BAR_CODE}
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 py-2 w-48">
                            <div>
                              <div className="font-medium">
                                {detalj.klijenti?.Naziv}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                PIB: {detalj.klijenti?.PIB}
                              </div>
                            </div>
                          </td>
                          <td className="border border-border px-2 py-2 w-24">
                            {detalj.cena_redovna
                              ? `${Number(detalj.cena_redovna).toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="border border-border px-2 py-2 w-24">
                            {detalj.cena_akcija
                              ? `${Number(detalj.cena_akcija).toFixed(2)}`
                              : "-"}
                          </td>
                          <td className="border border-border px-2 py-2 w-20 justify-center items-center">
                            {detalj.image ? (
                              <img
                                src={`/api/images/${detalj.image}`}
                                alt={
                                  detalj.artikli?.DESCRIPTION || "Article image"
                                }
                                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 object-contain rounded cursor-pointer hover:opacity-80 mx-auto"
                                onClick={() =>
                                  window.open(
                                    `/api/images/${detalj.image}`,
                                    "_blank"
                                  )
                                }
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-muted rounded flex items-center justify-center">
                                <ImageIcon className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-muted-foreground" />
                              </div>
                            )}
                          </td>
                          <td className="border border-border px-2 py-2">
                            <div className="flex space-x-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditDetailModal(detalj)}
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
                                      trajno obrisati ovaj artikal sa lifleta.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Odustani
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteDetail(detalj.id)
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
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Izaberite liflet sa leve strane da biste videli njegove detalje
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Uredi Liflet</DialogTitle>
            <DialogDescription>
              Ažuriraj informacije o lifletu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_datum_od" className="text-right">
                Datum početka
              </Label>
              <Input
                id="edit_datum_od"
                type="date"
                value={formData.datum_od}
                onChange={(e) =>
                  setFormData({ ...formData, datum_od: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_datum_do" className="text-right">
                Datum završetka
              </Label>
              <Input
                id="edit_datum_do"
                type="date"
                value={formData.datum_do}
                onChange={(e) =>
                  setFormData({ ...formData, datum_do: e.target.value })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_op_id" className="text-right">
                ID operatora
              </Label>
              <Input
                id="edit_op_id"
                type="number"
                value={formData.op_id}
                onChange={(e) =>
                  setFormData({ ...formData, op_id: e.target.value })
                }
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEdit}>
              Ažuriraj Liflet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Detail Modal */}
      <Dialog
        open={isEditDetailModalOpen}
        onOpenChange={setIsEditDetailModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Uredi Liflet Detalj</DialogTitle>
            <DialogDescription>
              Ažuriraj detalje o artiklu u ovom lifletu.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_article" className="text-right">
                Artikal
              </Label>
              <div className="col-span-3">
                <Input
                  id="edit_article"
                  value={articleSearchTerm}
                  disabled
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_client" className="text-right">
                Klijent
              </Label>
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
              <Label htmlFor="edit_cena_redovna" className="text-right">
                Regularna cena
              </Label>
              <Input
                id="edit_cena_redovna"
                type="number"
                step="0.01"
                value={detailFormData.cena_redovna}
                onChange={(e) =>
                  setDetailFormData({
                    ...detailFormData,
                    cena_redovna: e.target.value,
                  })
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
                value={detailFormData.cena_akcija}
                onChange={(e) =>
                  setDetailFormData({
                    ...detailFormData,
                    cena_akcija: e.target.value,
                  })
                }
                className="col-span-3"
                placeholder="0.00"
              />
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Slika</Label>
              <div className="col-span-3">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
                  onDrop={handleImageDrop}
                  onDragOver={handleImageDragOver}
                  onClick={() =>
                    document.getElementById("edit-image-input")?.click()
                  }
                >
                  {detailFormData.imagePreview ? (
                    <div className="relative">
                      <img
                        src={detailFormData.imagePreview}
                        alt="Preview"
                        className="max-w-full max-h-32 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : detailFormData.existingImage ? (
                    <div className="relative">
                      <img
                        src={`/api/images/${detailFormData.existingImage}`}
                        alt="Existing"
                        className="max-w-full max-h-32 mx-auto rounded"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage();
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        Trenutna slika: {detailFormData.existingImage}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-1">
                        Prevucite i spustite sliku ovde, ili kliknite da
                        odaberete
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Slika će biti sačuvana kao{" "}
                        {detailFormData.Id_artikal || "ID_artikal"}.
                        {detailFormData.image?.name.split(".").pop() ||
                          "ekstenzija"}
                      </p>
                    </div>
                  )}
                </div>
                <input
                  id="edit-image-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImageSelect(file);
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Opciono: Pošaljite novu sliku ili uklonite postojeću
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditDetail}>
              Ažuriraj Detalje
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Store Selection Modal */}
      <Dialog
        open={isStoreSelectionModalOpen}
        onOpenChange={setIsStoreSelectionModalOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Dodaj Cene u Rafove</DialogTitle>
            <DialogDescription>
              Izaberite prodavnice u koje želite da dodate cene za artikle iz
              ovog lifleta.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="store_search" className="text-right">
                Pretraga prodavnica
              </Label>
              <div className="col-span-3">
                <Input
                  id="store_search"
                  placeholder="Pretražite prodavnice..."
                  value={storeSearchTerm}
                  onChange={(e) => handleStoreSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="items-center gap-4">
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={selectAllProdavnice}
                  >
                    Izaberi sve
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={deselectAllProdavnice}
                  >
                    Poništi izbor
                  </Button>
                  <div className="text-sm text-muted-foreground ml-2 w-full text-right">
                    Izabrano: {selectedProdavnice.length} prodavnica
                  </div>
                </div>
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto border rounded-md">
              {filteredProdavnice.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Nema prodavnica
                </div>
              ) : (
                filteredProdavnice.map((prodavnica) => (
                  <div
                    key={prodavnica.ID_Prodavnica}
                    className={`flex items-center p-3 hover:bg-accent cursor-pointer border-b last:border-b-0 ${
                      selectedProdavnice.includes(prodavnica.ID_Prodavnica)
                        ? "bg-accent"
                        : ""
                    }`}
                    onClick={() =>
                      toggleProdavnicaSelection(prodavnica.ID_Prodavnica)
                    }
                  >
                    <input
                      type="checkbox"
                      checked={selectedProdavnice.includes(
                        prodavnica.ID_Prodavnica
                      )}
                      onChange={() =>
                        toggleProdavnicaSelection(prodavnica.ID_Prodavnica)
                      }
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {prodavnica.Naziv || "Nepoznato ime"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Šifra: {prodavnica.ID_Prodavnica || "N/A"}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStoreSelectionModalOpen(false)}
            >
              Odustani
            </Button>
            <Button
              type="button"
              onClick={submitToStores}
              disabled={selectedProdavnice.length === 0}
            >
              Dodaj u Rafove ({selectedProdavnice.length})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
