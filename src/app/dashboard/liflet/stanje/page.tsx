"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpDown, ArrowUp, ArrowDown, Eye, Download } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

type ClientStanje = {
  id: number;
  naziv: string;
  pib: string;
  totalZaduzenja: number;
  totalUplate: number;
  currentDue: number;
  pastDue: number;
};

type SortConfig = {
  key: string;
  direction: "asc" | "desc";
};

type ClientTransaction = {
  id: number;
  dug: boolean;
  iznos: number;
  datum: Date;
  valuta: Date | null;
  napomena: string | null;
};

export default function StanjePage() {
  const [clientData, setClientData] = useState<ClientStanje[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<ClientStanje | null>(
    null
  );
  const [clientTransactions, setClientTransactions] = useState<
    ClientTransaction[]
  >([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "naziv",
    direction: "asc",
  });

  useEffect(() => {
    loadClientStanje();
  }, [sortConfig]);

  const loadClientTransactions = async (clientId: number) => {
    try {
      setLoadingTransactions(true);
      const response = await fetch(
        `/api/liflet/finansije?client_id=${clientId}&details=true`
      );
      const data = await response.json();
      setClientTransactions(data.data || []);
    } catch (error) {
      console.error("Error loading client transactions:", error);
      setClientTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleClientClick = (client: ClientStanje) => {
    if (selectedClient?.id === client.id) {
      // If clicking the same client, deselect
      setSelectedClient(null);
      setClientTransactions([]);
    } else {
      // Select new client and load their transactions
      setSelectedClient(client);
      loadClientTransactions(client.id);
    }
  };

  const loadClientStanje = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/liflet/finansije?stanje=true`);
      const data = await response.json();
      setClientData(data.data || []);
    } catch (error) {
      console.error("Error loading client stanje:", error);
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

  const sortedClientData = [...clientData].sort((a, b) => {
    const aValue = a[sortConfig.key as keyof ClientStanje];
    const bValue = b[sortConfig.key as keyof ClientStanje];

    if (aValue < bValue) {
      return sortConfig.direction === "asc" ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === "asc" ? 1 : -1;
    }
    return 0;
  });

  // Calculate totals
  const totals = sortedClientData.reduce(
    (acc, client) => ({
      totalZaduzenja: acc.totalZaduzenja + client.totalZaduzenja,
      totalUplate: acc.totalUplate + client.totalUplate,
      currentDue: acc.currentDue + client.currentDue,
      pastDue: acc.pastDue + client.pastDue,
    }),
    { totalZaduzenja: 0, totalUplate: 0, currentDue: 0, pastDue: 0 }
  );

  const exportClientToPDF = async (client: ClientStanje) => {
    try {
      // Get client transactions if not already loaded
      let transactions = clientTransactions;
      if (!selectedClient || selectedClient.id !== client.id) {
        const response = await fetch(
          `/api/liflet/finansije?client_id=${client.id}&details=true`
        );
        const data = await response.json();
        transactions = data.data || [];
      }

      // Sort transactions by due date
      const sortedTransactions = transactions.sort((a, b) => {
        const aValuta = a.valuta ? new Date(a.valuta).getTime() : Infinity;
        const bValuta = b.valuta ? new Date(b.valuta).getTime() : Infinity;

        if (aValuta !== bValuta) {
          return aValuta - bValuta;
        }

        return new Date(a.datum).getTime() - new Date(b.datum).getTime();
      });

      // Serbian number formatting function for HTML
      const formatSerbianNumberHTML = (value: number) => {
        return new Intl.NumberFormat("sr-RS", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(value);
      };

      // Calculate final balance
      let finalBalance = 0;
      sortedTransactions.forEach((transaction) => {
        const amount = Number(transaction.iznos);
        if (transaction.dug) {
          finalBalance += amount;
        } else {
          finalBalance -= amount;
        }
      });

      // Create HTML content with proper Serbian characters and unified header styling
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
            <h2 style="margin: 0; font-size: 20px; color: #333;">Client Statement: ${
              client.naziv
            }</h2>
            <p style="margin: 10px 0; font-size: 14px; color: #666;">PIB: ${
              client.pib
            }</p>
            <p style="margin: 5px 0; font-size: 12px; color: #888;">Generated: ${new Date().toLocaleDateString(
              "sr-RS"
            )}</p>
          </div>

          <div style="margin-bottom: 20px; background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold;">Total Zaduženja:</span>
              <span>${formatSerbianNumberHTML(client.totalZaduzenja)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold;">Total Uplate:</span>
              <span>${formatSerbianNumberHTML(client.totalUplate)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="font-weight: bold;">Trenutni dug:</span>
              <span style="${
                client.currentDue > 0
                  ? "color: #dc3545; font-weight: bold;"
                  : ""
              }">${formatSerbianNumberHTML(client.currentDue)}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="font-weight: bold;">Ukupan dug:</span>
              <span>${formatSerbianNumberHTML(client.pastDue)}</span>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 12px; font-family: 'DejaVu Sans', Arial, sans-serif;">
            <thead>
              <tr style="background-color: #428bca; color: white;">
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Datum</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Tip</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Datum dospeća</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Iznos zaduženja</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">Iznos uplate</th>
                <th style="padding: 12px 8px; border: 1px solid #ddd; text-align: left; font-weight: bold;">Napomena</th>
              </tr>
            </thead>
            <tbody>
              ${sortedTransactions
                .map(
                  (transaction, index) => `
                <tr style="background-color: ${
                  index % 2 === 0 ? "#ffffff" : "#f9f9f9"
                };">
                  <td style="padding: 8px; border: 1px solid #ddd;">${new Date(
                    transaction.datum
                  ).toLocaleDateString()}</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">
                    <span style="padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; ${
                      transaction.dug
                        ? "background-color: #f8d7da; color: #721c24;"
                        : "background-color: #d4edda; color: #155724;"
                    }">${transaction.dug ? "Dug" : "Uplata"}</span>
                  </td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    transaction.valuta
                      ? new Date(transaction.valuta).toLocaleDateString()
                      : "-"
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                    transaction.dug
                      ? formatSerbianNumberHTML(Number(transaction.iznos))
                      : "-"
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${
                    !transaction.dug
                      ? formatSerbianNumberHTML(Number(transaction.iznos))
                      : "-"
                  }</td>
                  <td style="padding: 8px; border: 1px solid #ddd;">${
                    transaction.napomena || "-"
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div style="margin-top: 20px; text-align: center; font-size: 14px; font-weight: bold; padding: 15px; background-color: #e9ecef; border-radius: 5px;">
            Konačno stanje: ${formatSerbianNumberHTML(Math.abs(finalBalance))} 
          </div>
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
      const fileName = `client_statement_${client.naziv.replace(
        /[^a-zA-Z0-9šđčćžŠĐČĆŽ]/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);

      toast.success("PDF exported successfully");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to export PDF");
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Stanje Details */}
      <div className="w-full">
        <Card className="w-full h-full">
          <CardHeader>
            <CardTitle>Izvezi finansije klijenata</CardTitle>
          </CardHeader>
          <CardContent>
            {/* All clients Details */}
            <div className="overflow-x-auto w-full">
              <table className="w-full border-collapse border border-border">
                <thead>
                  <tr className="bg-muted/50">
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("naziv")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Klijent</span>
                        {getSortIcon("naziv")}
                      </div>
                    </th>
                    <th className="border border-border px-4 py-2 text-left">
                      PIB:
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("totalZaduzenja")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Total Zaduženja</span>
                        {getSortIcon("totalZaduzenja")}
                      </div>
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("totalUplate")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Total Uplate</span>
                        {getSortIcon("totalUplate")}
                      </div>
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("currentDue")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Trenutni dug</span>
                        {getSortIcon("currentDue")}
                      </div>
                    </th>
                    <th
                      className="border border-border px-4 py-2 text-left cursor-pointer hover:bg-muted"
                      onClick={() => handleSort("pastDue")}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Ukupan dug</span>
                        {getSortIcon("pastDue")}
                      </div>
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
                  ) : sortedClientData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="border border-border px-4 py-8 text-center"
                      >
                        Nema podataka o klijentu
                      </td>
                    </tr>
                  ) : (
                    sortedClientData.map((client) => (
                      <tr
                        key={client.id}
                        className={`hover:bg-muted cursor-pointer ${
                          client.currentDue > 0
                            ? "bg-red-50 hover:bg-red-100"
                            : ""
                        } ${
                          selectedClient?.id === client.id ? "bg-blue-50" : ""
                        }`}
                        onClick={() => handleClientClick(client)}
                      >
                        <td className="border border-border px-4 py-2">
                          <div className="font-medium">{client.naziv}</div>
                        </td>
                        <td className="border border-border px-4 py-2">
                          {client.pib}
                        </td>
                        <td className="border border-border px-4 py-2 text-right">
                          {formatSerbianNumber(client.totalZaduzenja)}
                        </td>
                        <td className="border border-border px-4 py-2 text-right">
                          {formatSerbianNumber(client.totalUplate)}
                        </td>
                        <td
                          className={`border border-border px-4 py-2 text-right ${
                            client.currentDue > 0
                              ? "text-red-600 font-semibold"
                              : ""
                          }`}
                        >
                          <span className="text-right">
                            {formatSerbianNumber(client.currentDue)}
                          </span>
                        </td>
                        <td className="border border-border px-4 py-2 text-right">
                          {formatSerbianNumber(client.pastDue)}
                        </td>
                        <td className="border border-border px-4 py-2">
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(
                                e: React.MouseEvent<HTMLButtonElement>
                              ) => {
                                e.stopPropagation(); // Prevent row click
                                handleClientClick(client);
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(
                                e: React.MouseEvent<HTMLButtonElement>
                              ) => {
                                e.stopPropagation(); // Prevent row click
                                exportClientToPDF(client);
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
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
                    <td className="border border-border px-4 py-3 text-right font-bold">
                      {formatSerbianNumber(totals.totalZaduzenja)}
                    </td>
                    <td className="border border-border px-4 py-3 text-right font-bold">
                      {formatSerbianNumber(totals.totalUplate)}
                    </td>
                    <td className="border border-border px-4 py-3 text-right font-bold">
                      {formatSerbianNumber(totals.currentDue)}
                    </td>
                    <td className="border border-border px-4 py-3 text-right font-bold">
                      {formatSerbianNumber(totals.pastDue)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Client Details Section */}
            {selectedClient && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">
                  Detalji transakcija za {selectedClient.naziv}
                </h3>

                {loadingTransactions ? (
                  <div className="text-center py-4">
                    Učitavanje transakcija...
                  </div>
                ) : (
                  <div className="overflow-x-auto w-full">
                    <table className="w-full border-collapse border border-border">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="border border-border px-4 py-2 text-left">
                            Datum
                          </th>
                          <th className="border border-border px-4 py-2 text-left">
                            Tip
                          </th>
                          <th className="border border-border px-4 py-2 text-left">
                            Datum
                          </th>
                          <th className="border border-border px-4 py-2 text-left">
                            Dug
                          </th>
                          <th className="border border-border px-4 py-2 text-left">
                            Uplata
                          </th>
                          <th className="border border-border px-4 py-2 text-left">
                            Ukupno
                          </th>
                          <th className="border border-border px-4 py-2 text-left">
                            Napomena
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          let runningTotal = 0;
                          const sortedTransactions = clientTransactions.sort(
                            (a, b) => {
                              // Sort by valuta (due date) first, null dates at the end
                              const aValuta = a.valuta
                                ? new Date(a.valuta).getTime()
                                : Infinity;
                              const bValuta = b.valuta
                                ? new Date(b.valuta).getTime()
                                : Infinity;

                              if (aValuta !== bValuta) {
                                return aValuta - bValuta;
                              }

                              // If valuta dates are equal or both null, sort by transaction date
                              return (
                                new Date(a.datum).getTime() -
                                new Date(b.datum).getTime()
                              );
                            }
                          );

                          // Find the last transaction with due date <= today
                          const today = new Date();
                          let lastCurrentDueIndex = -1;

                          for (
                            let i = sortedTransactions.length - 1;
                            i >= 0;
                            i--
                          ) {
                            const transaction = sortedTransactions[i];
                            if (
                              transaction.valuta &&
                              new Date(transaction.valuta) <= today
                            ) {
                              lastCurrentDueIndex = i;
                              break;
                            }
                          }

                          return sortedTransactions.map(
                            (transaction, index) => {
                              const amount = Number(transaction.iznos);
                              if (transaction.dug === true) {
                                runningTotal += amount;
                              } else if (transaction.dug === false) {
                                runningTotal -= amount;
                              }

                              return (
                                <tr
                                  key={transaction.id}
                                  className={`hover:bg-muted ${
                                    index === lastCurrentDueIndex
                                      ? "bg-yellow-100 border-l-4 border-l-yellow-400"
                                      : ""
                                  }`}
                                >
                                  <td className="border border-border px-4 py-2">
                                    {new Date(
                                      transaction.datum
                                    ).toLocaleDateString()}
                                  </td>
                                  <td className="border border-border px-4 py-2 text-center">
                                    <span
                                      className={`px-2 py-1 rounded text-xs font-medium text-center ${
                                        transaction.dug === true
                                          ? "bg-red-100 text-red-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {transaction.dug === true
                                        ? "Dug"
                                        : "Uplata"}
                                    </span>
                                  </td>
                                  <td className="border border-border px-4 py-2">
                                    {transaction.valuta
                                      ? new Date(
                                          transaction.valuta
                                        ).toLocaleDateString()
                                      : "-"}
                                  </td>
                                  <td className="border border-border px-4 py-2 text-right">
                                    {transaction.dug === true
                                      ? formatSerbianNumber(amount)
                                      : "-"}
                                  </td>
                                  <td className="border border-border px-4 py-2 text-right">
                                    {transaction.dug === false
                                      ? formatSerbianNumber(amount)
                                      : "-"}
                                  </td>
                                  <td
                                    className={`border border-border px-4 py-2 font-medium text-right ${
                                      runningTotal < 0
                                        ? "text-green-600"
                                        : runningTotal > 0
                                        ? "text-red-600"
                                        : ""
                                    }`}
                                  >
                                    {formatSerbianNumber(
                                      Math.abs(runningTotal)
                                    )}
                                  </td>
                                  <td className="border border-border px-4 py-2">
                                    {transaction.napomena || "-"}
                                  </td>
                                </tr>
                              );
                            }
                          );
                        })()}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted/30 font-semibold">
                          <td
                            colSpan={5}
                            className="border border-border px-4 py-3 text-right"
                          >
                            KONAČNO STANJE:
                          </td>
                          <td
                            className={`border border-border px-4 py-3 font-bold ${(() => {
                              let finalBalance = 0;
                              clientTransactions.forEach((transaction) => {
                                const amount = Number(transaction.iznos);
                                if (transaction.dug === true) {
                                  finalBalance += amount;
                                } else if (transaction.dug === false) {
                                  finalBalance -= amount;
                                }
                              });
                              return finalBalance < 0
                                ? "text-green-600"
                                : finalBalance > 0
                                ? "text-red-600"
                                : "";
                            })()}`}
                          >
                            {(() => {
                              let finalBalance = 0;
                              clientTransactions.forEach((transaction) => {
                                const amount = Number(transaction.iznos);
                                if (transaction.dug === true) {
                                  finalBalance += amount;
                                } else if (transaction.dug === false) {
                                  finalBalance -= amount;
                                }
                              });
                              return `${formatSerbianNumber(
                                Math.abs(finalBalance)
                              )} ${
                                finalBalance < 0
                                  ? ""
                                  : finalBalance > 0
                                  ? ""
                                  : ""
                              }`;
                            })()}
                          </td>
                          <td className="border border-border px-4 py-3">
                            {/* Empty cell */}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
