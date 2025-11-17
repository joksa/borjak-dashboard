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
} from "lucide-react";
import { toast } from "sonner";

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
  const [articleSearchTerm, setArticleSearchTerm] = useState("");
  const [searchedArticles, setSearchedArticles] = useState<any[]>([]);
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
  });

  useEffect(() => {
    loadLifletZaglavlje();
  }, [sortConfig, currentPage, itemsPerPage]);

  useEffect(() => {
    if (selectedLiflet) {
      loadLifletDetalji(selectedLiflet.id);
    }
  }, [selectedLiflet]);

  const loadLifletZaglavlje = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/liflet/zaglavlje?page=${currentPage}&limit=${itemsPerPage}&sort=${sortConfig.key}&order=${sortConfig.direction}`
      );
      const data = await response.json();
      setLifletZaglavlje(data.data || []);
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
    });
    setArticleSearchTerm("");
    setSearchedArticles([]);
    setClientSearchTerm("");
    setSearchedClients([]);
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
      const response = await fetch("/api/liflet/detalji", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          liflet_id: selectedLiflet.id,
          Id_artikal: detailFormData.Id_artikal,
          ID_Klijent: detailFormData.ID_Klijent,
          cena_akcija: detailFormData.cena_akcija || null,
          cena_redovna: detailFormData.cena_redovna || null,
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
      const response = await fetch(`/api/liflet/detalji/${editingDetail.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Id_artikal: detailFormData.Id_artikal,
          ID_Klijent: detailFormData.ID_Klijent,
          cena_akcija: detailFormData.cena_akcija || null,
          cena_redovna: detailFormData.cena_redovna || null,
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
    setFormData({
      datum_od: new Date(liflet.datum_od).toISOString().split("T")[0],
      datum_do: new Date(liflet.datum_do).toISOString().split("T")[0],
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

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-0">
      {/* Left Side - Liflet Zaglavlje */}
      <div className="flex-1">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Liflet Management</CardTitle>
            <Dialog
              open={isCreateModalOpen}
              onOpenChange={setIsCreateModalOpen}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Liflet
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Liflet</DialogTitle>
                  <DialogDescription>
                    Add a new promotional liflet with date range and client
                    information.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="datum_od" className="text-right">
                      Start Date
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
                      End Date
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
                      Operator ID
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
                    Create Liflet
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
                  <SelectItem value="5">5 per page</SelectItem>
                  <SelectItem value="10">10 per page</SelectItem>
                  <SelectItem value="20">20 per page</SelectItem>
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
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("datum_od")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Start Date</span>
                        {getSortIcon("datum_od")}
                      </div>
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("datum_do")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>End Date</span>
                        {getSortIcon("datum_do")}
                      </div>
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
                        colSpan={4}
                        className="border border-border px-4 py-8 text-center"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : lifletZaglavlje.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="border border-border px-4 py-8 text-center"
                      >
                        No liflets found
                      </td>
                    </tr>
                  ) : (
                    lifletZaglavlje.map((liflet) => (
                      <tr
                        key={liflet.id}
                        className={`cursor-pointer hover:bg-muted ${
                          selectedLiflet?.id === liflet.id
                            ? "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                            : ""
                        }`}
                        onClick={() => setSelectedLiflet(liflet)}
                      >
                        <td className="border border-border px-4 py-2">
                          {liflet.id}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {new Date(liflet.datum_od).toLocaleDateString()}
                        </td>
                        <td className="border border-border px-4 py-2">
                          {new Date(liflet.datum_do).toLocaleDateString()}
                        </td>
                        <td className="border border-border px-4 py-2">
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
                                    Are you sure?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This action cannot be undone. This will
                                    permanently delete the liflet and all its
                                    associated details.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(liflet.id)}
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
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, lifletZaglavlje.length)}{" "}
                of {lifletZaglavlje.length} entries
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={
                    currentPage * itemsPerPage >= lifletZaglavlje.length
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Side - Liflet Detalji */}
      <div className="flex-2">
        <Card className="w-full h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>
              {selectedLiflet
                ? `Liflet Details - ID: ${selectedLiflet.id}`
                : "Select a Liflet"}
            </CardTitle>
            {selectedLiflet && (
              <Dialog
                open={isCreateDetailModalOpen}
                onOpenChange={setIsCreateDetailModalOpen}
              >
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Article
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add Article to Liflet</DialogTitle>
                    <DialogDescription>
                      Search and select an article to add to this promotional
                      liflet.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="article_search" className="text-right">
                        Article
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
                                className="px-4 py-2 hover:bg-accent cursor-pointer border-b border-border last:border-b-0"
                                onClick={() => selectArticle(article)}
                              >
                                <div className="font-medium">
                                  {article.DESCRIPTION}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Code: {article.BAR_CODE}
                                </div>
                                {article.PRICE && (
                                  <div className="text-sm text-muted-foreground">
                                    Price: €{article.PRICE}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="client_search" className="text-right">
                        Client
                      </Label>
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
                      <Label htmlFor="cena_redovna" className="text-right">
                        Regular Price
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
                        Promo Price
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
                      Add Article
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </CardHeader>
          <CardContent>
            {selectedLiflet ? (
              <div>
                <div className="mb-4 flex items-center space-x-2">
                  <Search className="w-4 h-4" />
                  <Input
                    placeholder="Search in liflet details..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>

                <div className="overflow-x-auto w-full">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="border border-border px-4 py-2 text-left w-fit min-w-0">
                          Article
                        </th>
                        <th className="border border-border px-4 py-2 text-left w-fit min-w-0">
                          Client
                        </th>
                        <th className="border border-border px-4 py-2 text-left">
                          Regular Price
                        </th>
                        <th className="border border-border px-4 py-2 text-left">
                          Promo Price
                        </th>
                        <th className="border border-border px-4 py-2 text-left">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {lifletDetalji
                        .filter(
                          (detalj) =>
                            detalj.artikli?.DESCRIPTION?.toLowerCase().includes(
                              searchTerm.toLowerCase()
                            ) || detalj.artikli?.BAR_CODE?.includes(searchTerm)
                        )
                        .map((detalj) => (
                          <tr key={detalj.id} className="hover:bg-muted">
                            <td className="border border-border px-4 py-2 w-fit min-w-0">
                              <div>
                                <div className="font-medium">
                                  {detalj.artikli?.DESCRIPTION}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Code: {detalj.artikli?.BAR_CODE}
                                </div>
                              </div>
                            </td>
                            <td className="border border-border px-4 py-2 w-fit min-w-0">
                              <div>
                                <div className="font-medium">
                                  {detalj.klijenti?.Naziv}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  PIB: {detalj.klijenti?.PIB}
                                </div>
                              </div>
                            </td>
                            <td className="border border-border px-4 py-2">
                              {detalj.cena_redovna
                                ? `€${Number(detalj.cena_redovna).toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="border border-border px-4 py-2">
                              {detalj.cena_akcija
                                ? `€${Number(detalj.cena_akcija).toFixed(2)}`
                                : "-"}
                            </td>
                            <td className="border border-border px-4 py-2">
                              <div className="flex space-x-2">
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
                                        Are you sure?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This action cannot be undone. This will
                                        permanently delete this article from the
                                        liflet.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={() =>
                                          handleDeleteDetail(detalj.id)
                                        }
                                      >
                                        Delete
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
                Select a liflet from the left panel to view its details
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Liflet</DialogTitle>
            <DialogDescription>
              Update the liflet information.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_datum_od" className="text-right">
                Start Date
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
                End Date
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
                Operator ID
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
              Update Liflet
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
            <DialogTitle>Edit Liflet Detail</DialogTitle>
            <DialogDescription>
              Update the article details in this liflet.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit_article" className="text-right">
                Article
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
                Client
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
                Regular Price
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
                Promo Price
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
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleEditDetail}>
              Update Detail
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
