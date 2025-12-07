import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";

export interface PrintItem {
  id: number;
  id_prodavnica: number | null;
  id_artikal: number | null;
  cena_redovna: any;
  cena_akcija: any;
  artikli?: {
    Id_Artikal: number;
    DESCRIPTION: string | null;
    BAR_CODE: string | null;
  };
  prodavnice?: {
    ID_Prodavnica: number;
    Naziv: string | null;
  };
  napomena: string | null;
}

export interface PrintConfig {
  radnja: string;
  format: string;
  tip_cene: string;
  kopija: number;
}

export interface LifletPrintData {
  id: number;
  artikli?: {
    Id_Artikal: number;
    DESCRIPTION: string | null;
    BAR_CODE: string | null;
  };
  klijenti?: {
    Naziv: string | null;
  };
  cena_redovna: any;
  cena_akcija: any;
}

// Serbian number formatting function for HTML
export const formatSerbianNumberHTML = (value: number): string => {
  return new Intl.NumberFormat("sr-RS", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Generate QR code for an item
export const generateQRCode = async (data: string): Promise<string> => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
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
};

// Format 5x3 cm price tag
export const format5x3 = (item: PrintItem, qrCode?: string): string => {
  const sifra = item.artikli?.Id_Artikal || "";
  const articleName = item.artikli?.DESCRIPTION || "";
  const barcode = item.artikli?.BAR_CODE || "";
  const clientName = item.prodavnice?.Naziv || "";
  const price =
    item.cena_akcija && Number(item.cena_akcija) > 0
      ? Number(item.cena_akcija)
      : Number(item.cena_redovna) || 0;

  return `
    <div style="
      width: 50mm;
      height: 30mm;
      border: 1px solid #000;
      background: white;
      box-sizing: border-box;
      padding: 2px;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
    ">
      <div style="font-size: 8px; font-weight: bold; color: #000; margin-bottom: 1mm;">
        ${articleName}
      </div>
      <div style="font-size: 6px; line-height: 1.1;color: #000; ">
        <div><strong>${sifra}</strong> | ${barcode}</div>
        <div>Klijent: ${clientName}</div>
      </div>
      <div style="
        background: #b00;
        color: white;
        padding: 2px;
        border-radius: 2px;
        text-align: center;
      ">
        <div style="font-size: 14px; font-weight: bold;color: #000; ">
          ${formatSerbianNumberHTML(
            price
          )} <span style="font-size: 6px;">RSD</span>
        </div>
      </div>
    </div>
  `;
};

// Format 6x4 cm price tag
export const format6x4 = (
  item: PrintItem,
  qrCode?: string,
  tip_cene?: string
): string => {
  const tipCene = tip_cene || "akcija";
  const sifra = item.artikli?.Id_Artikal || "";
  const articleName = item.artikli?.DESCRIPTION || "";
  const barcode = item.artikli?.BAR_CODE || "";
  const clientName = item.prodavnice?.Naziv || "";
  const regularPrice = item.cena_redovna ? Number(item.cena_redovna) : 0;
  let promoPrice = item.cena_akcija ? Number(item.cena_akcija) : 0;
  if (tip_cene !== "akcija") {
    promoPrice = 0;
  }
  const displayPrice = promoPrice > 0 ? promoPrice : regularPrice;
  const napomena = item.napomena || "";

  return `<div style="
  width: calc((210mm - 10mm) / 3);
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

  <!-- Top Section -->
  <div style="display: flex; justify-content: space-between;">
    <div style="flex: 1; padding-right: 6px;">
      
      <!-- Article Name -->
      <div style="font-size: 12px; font-weight: bold; color: #000; margin-bottom: 0px; margin: 0; padding: 0; line-height: 1;">  
        ${articleName}
      </div>

      <!-- Sifra + Barcode -->
      <div style="font-size: 12px;color: #000; ">
        <div><strong>${sifra}</strong> | ${barcode}</div>
      </div>
    
  <div style="margin-top: 1px; font-size: 9px; color: #000; ">
              JM:
              <span>KOM</span>              
            </div>

              <div style="margin-top: 1px; font-size: 9px;color: #000; ">
              Jedinična cena:
              <span>1.234,56 rsd/kg</span>              
            </div>     
            
            ${
              napomena && napomena.trim() !== "" && promoPrice > 0
                ? `
                  <div style="
                    margin-top: 1px;
                    font-size: 9px;
                    color: #000;
                  ">
                    ${napomena}
                  </div>
                `
                : ""
            }
    </div>

    <!-- QR Code -->
    <div style="width: 54px; display: flex; align-items: center; justify-content: flex-end;">
      ${
        qrCode
          ? `<img src="${qrCode}" alt="QR" style="width: 54px; height: 54px;" />`
          : ""
      }
    </div>
  </div>

  <!-- ABSOLUTE PRICE (bottom-right) -->
  <div style="position: relative; width: 100%; height: 40%;">
   <div style="
    position: absolute;
    bottom: 36px;
    left: 8px;
    font-weight: bold;
    color: #000;
  ">

  <div style="display: flex; width: 100px; justify-content: center; align-items: center;">
              <span style="position: absolute; inset: 0; font-size: 18px; line-height: 1.5; padding-left: ${
                regularPrice < 100
                  ? "15px"
                  : regularPrice < 1000
                  ? "10px"
                  : "2px"
              };">${
    promoPrice > 0 ? formatSerbianNumberHTML(regularPrice) : ""
  }</span>
              <span style="position: absolute; inset: 0; font-size: 16px; line-height: 1.5; width: 70px;">${
                promoPrice > 0 ? "───────" : ""
              }</span>            
          </div>
  </div>
  
  
  <div style="
    position: absolute;
    bottom: 8px;
    right: 0;
    display: flex;
    align-items: flex-end;
    gap: 4px;
    font-weight: bold;
    color: #000;
  ">


    <!-- Price -->
    <span style="font-size: 40px; ">
      ${formatSerbianNumberHTML(promoPrice > 0 ? promoPrice : regularPrice)}
    </span>

    <!-- Vertical RSD -->
  <span style="
  font-size: 12px;
  font-weight: bold;
  transform: rotate(0deg);
  transform-origin: center;
  display: inline-block;
  margin-left: 0px;
  line-height: 1;
  text-align: center;
">
  R<br>S<br>D
</span>

  </div>
</div>

</div>

  `;
};

// Format 10x10x cm price tag (assuming this is 10x10 cm)
export const format10x10x = (item: PrintItem, qrCode?: string): string => {
  const sifra = item.artikli?.Id_Artikal || "";
  const articleName = item.artikli?.DESCRIPTION || "";
  const barcode = item.artikli?.BAR_CODE || "";
  const clientName = item.prodavnice?.Naziv || "";
  const regularPrice = item.cena_redovna ? Number(item.cena_redovna) : 0;
  const promoPrice = item.cena_akcija ? Number(item.cena_akcija) : 0;
  const displayPrice = promoPrice > 0 ? promoPrice : regularPrice;

  return `
    <div style="
      width: 100mm;
      height: 100mm;
      border: 1px solid #000;
      background: white;
      box-sizing: border-box;
      padding: 5px;
      font-family: Arial, sans-serif;
      display: flex;
      flex-direction: column;
    ">
      <div style="display: flex; justify-content: space-between; margin-bottom: 5mm;">
        <div style="flex: 1;">
          <div style="font-size: 14px; font-weight: bold; color: #000; margin-bottom: 2mm;">
            ${articleName}
          </div>
          <div style="font-size: 10px; line-height: 1.3;">
            <div><strong>Šifra:</strong> ${sifra}</div>
            <div><strong>Barkod:</strong> ${barcode}</div>
            <div><strong>Klijent:</strong> ${clientName}</div>
          </div>
        </div>
        <div style="width: 25mm; display: flex; align-items: flex-start; justify-content: flex-end;">
          ${
            qrCode
              ? `<img src="${qrCode}" alt="QR" style="width: 24mm; height: 24mm;" />`
              : ""
          }
        </div>
      </div>

      <div style="
        background: #b00;
        color: white;
        padding: 5px;
        border-radius: 3px;
        text-align: center;
        margin-top: auto;
      ">
        <div style="font-size: 12px; font-weight: bold; margin-bottom: 2mm;">
          ${promoPrice > 0 ? "AKCIJSKA CENA" : "REDOVNA CENA"}
        </div>
        <div style="font-size: 36px; font-weight: bold; margin-bottom: 2mm;">
          ${formatSerbianNumberHTML(displayPrice)} RSD
        </div>
        ${
          promoPrice > 0 && regularPrice > 0
            ? `
          <div style="font-size: 14px; opacity: 0.8;">
            <span>
              ${formatSerbianNumberHTML(regularPrice)} RSD
            </span>
          </div>
        `
            : ""
        }
      </div>
    </div>
  `;
};

// Format A5 table
export const formatA5 = (items: PrintItem[]): string => {
  const tableRows = items
    .map((item) => {
      const sifra = item.artikli?.Id_Artikal || "";
      const articleName = item.artikli?.DESCRIPTION || "";
      const clientName = item.prodavnice?.Naziv || "";
      const price =
        item.cena_akcija && Number(item.cena_akcija) > 0
          ? Number(item.cena_akcija)
          : Number(item.cena_redovna) || 0;

      return `
      <tr>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px;">${articleName}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${sifra}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: center;">${clientName}</td>
        <td style="border: 1px solid #000; padding: 4px; font-size: 10px; text-align: right; font-weight: bold;">
          ${formatSerbianNumberHTML(price)} RSD
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <div style="
      width: 210mm;
      min-height: 148mm;
      background: white;
      padding: 10mm;
      font-family: Arial, sans-serif;
      box-sizing: border-box;
    ">
      <h2 style="text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5mm;">
        BORJAK ZTR
      </h2>
      <div style="text-align: center; font-size: 12px; margin-bottom: 8mm;">
        Todorovića 7, Kraljevo
      </div>
      <h3 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 8mm;">
        CENOVNIK ARTIKALA
      </h3>

      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 6px; text-align: left; font-weight: bold;">Artikal</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">Šifra</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: center; font-weight: bold;">Klijent</th>
            <th style="border: 1px solid #000; padding: 6px; text-align: right; font-weight: bold;">Cena</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
};

// Format A4 table
export const formatA4 = (items: PrintItem[]): string => {
  const tableRows = items
    .map((item) => {
      const sifra = item.artikli?.Id_Artikal || "";
      const articleName = item.artikli?.DESCRIPTION || "";
      const clientName = item.prodavnice?.Naziv || "";
      const price =
        item.cena_akcija && Number(item.cena_akcija) > 0
          ? Number(item.cena_akcija)
          : Number(item.cena_redovna) || 0;

      return `
      <tr>
        <td style="border: 1px solid #000; padding: 6px; font-size: 11px;">${articleName}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 11px; text-align: center;">${sifra}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 11px; text-align: center;">${clientName}</td>
        <td style="border: 1px solid #000; padding: 6px; font-size: 11px; text-align: right; font-weight: bold;">
          ${formatSerbianNumberHTML(price)} RSD
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <div style="
      width: 297mm;
      min-height: 210mm;
      background: white;
      padding: 15mm;
      font-family: Arial, sans-serif;
      box-sizing: border-box;
    ">
      <h1 style="text-align: center; font-size: 24px; font-weight: bold; margin-bottom: 8mm;">
        BORJAK ZTR
      </h1>
      <div style="text-align: center; font-size: 16px; margin-bottom: 10mm;">
        Todorovića 7, Kraljevo
      </div>
      <h2 style="text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 12mm;">
        CENOVNIK ARTIKALA
      </h2>

      <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
        <thead>
          <tr style="background: #f0f0f0;">
            <th style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: bold;">Artikal</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Šifra</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">Klijent</th>
            <th style="border: 1px solid #000; padding: 8px; text-align: right; font-weight: bold;">Cena</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
};

// Price tag format (adapted from format6x4 layout)
export const formatPriceTag = (
  item: LifletPrintData,
  selectedLiflet?: any
): string => {
  const sifra = item.artikli?.Id_Artikal || "";
  const articleName = item.artikli?.DESCRIPTION || "";
  const barcode = item.artikli?.BAR_CODE || "";
  const clientName = item.klijenti?.Naziv || "";
  const regularPrice = item.cena_redovna ? Number(item.cena_redovna) : 0;
  const promoPrice = item.cena_akcija ? Number(item.cena_akcija) : 0;
  const displayPrice = promoPrice > 0 ? promoPrice : regularPrice;

  return `<div style="
  width: calc((210mm - 10mm) / 3);
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

  <!-- Top Section -->
  <div style="display: flex; justify-content: space-between;">
    <div style="flex: 1; padding-right: 6px;">

      <!-- Article Name -->
      <div style="font-size: 12px; font-weight: bold; color: #000; margin-bottom: 0px; margin: 0; padding: 0; line-height: 1;">
        ${articleName}
      </div>

      <!-- Sifra + Barcode -->
      <div style="font-size: 12px;">
        <div><strong>${sifra}</strong> | ${barcode}</div>
      </div>

    <div style="margin-top: 1px; font-size: 9px;">
              JM:
              <span>KOM</span>
            </div>

              <div style="margin-top: 1px; font-size: 9px;">
              Jedinična cena:
              <span>1.234,56 rsd/kg</span>
            </div>

            <div style="font-size: 9px; color: #b00; font-weight: bold;">
              Akcijska cena<br>
              <span style="font-size: 8px; color: #555; font-weight: normal;">
                Akcija važi do:
              </span>
              <span style="font-size: 8px; color: #555; font-weight: normal;">
                ${
                  selectedLiflet?.datum_do
                    ? new Date(selectedLiflet.datum_do).toLocaleDateString(
                        "sr-RS"
                      )
                    : ""
                }
              </span>
            </div>
    </div>

    <!-- QR Code -->
    <div style="width: 50px; display: flex; align-items: center; justify-content: flex-end;">
      <div style="width: 48px; height: 48px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; font-size: 8px;">QR</div>
    </div>
  </div>

  <!-- ABSOLUTE PRICE (bottom-right) -->
  <div style="position: relative; width: 100%; height: 40%;">
   <div style="
    position: absolute;
    bottom: 36px;
    left: 8px;
    font-weight: bold;
    color: #000;
  ">

  <div style="display: flex; width: 100px; justify-content: center; align-items: center;">
              <span style="position: absolute; inset: 0; font-size: 18px; width: 100px; display: flex; justify-content: center; align-items: center;">${
                promoPrice > 0 ? formatSerbianNumberHTML(regularPrice) : ""
              }</span>
              <span style="position: absolute; inset: 0; font-size: 16px; width: 100px; display: flex; justify-content: center; align-items: center; ">${
                promoPrice > 0 ? "──────" : ""
              }</span>
          </div>
  </div>


  <div style="
    position: absolute;
    bottom: 8px;
    right: 0;
    display: flex;
    align-items: flex-end;
    gap: 4px;
    font-weight: bold;
    color: #000;
  ">


    <!-- Price -->
    <span style="font-size: 40px; ">
      ${formatSerbianNumberHTML(promoPrice > 0 ? promoPrice : regularPrice)}
    </span>

    <!-- Vertical RSD -->
  <span style="
  font-size: 12px;
  font-weight: bold;
  transform: rotate(0deg);
  transform-origin: center;
  display: inline-block;
  margin-left: 0px;
  line-height: 1;
  text-align: center;
">
  R<br>S<br>D
</span>

  </div>
</div>

</div>

  `;
};

// Main print function for cene_raf data
export const printCeneRaf = async (
  items: PrintItem[],
  config: PrintConfig,
  copies: number = 1,
  printer?: string
): Promise<void> => {
  try {
    let htmlContent: string | string[] = "";

    // Filter items based on config
    const filteredItems = items.filter((item) => {
      const matchesProdavnica =
        item.id_prodavnica?.toString() === config.radnja;
      let hasValidPrice = false;

      if (config.tip_cene === "akcija") {
        hasValidPrice = item.cena_akcija && Number(item.cena_akcija) > 0;
      } else if (config.tip_cene === "redovna") {
        hasValidPrice = item.cena_redovna && Number(item.cena_redovna) > 0;
      } else {
        hasValidPrice = true; // Show all if no type selected
      }

      return matchesProdavnica && hasValidPrice;
    });

    if (filteredItems.length === 0) {
      throw new Error("Nema podataka za štampanje za izabrane kriterijume");
    }

    // Generate HTML based on format
    if (config.format === "A5" || config.format === "A4") {
      // Table formats
      htmlContent =
        config.format === "A5"
          ? formatA5(filteredItems)
          : formatA4(filteredItems);
    } else {
      // Individual tag formats - generate multiple copies
      const itemContents: string[] = [];

      for (const item of filteredItems) {
        let qrCode = "";
        if (config.format === "6x4" || config.format === "10x10x") {
          qrCode = await generateQRCode(
            item.artikli?.Id_Artikal?.toString() ||
              item.artikli?.BAR_CODE?.toString() ||
              ""
          );
        }

        for (let copy = 0; copy < copies; copy++) {
          switch (config.format) {
            case "5x3":
              itemContents.push(format5x3(item, qrCode));
              break;
            case "6x4":
              itemContents.push(format6x4(item, qrCode, config.tip_cene));
              break;
            case "10x10x":
              itemContents.push(format10x10x(item, qrCode));
              break;
            default:
              itemContents.push(format6x4(item, qrCode, config.tip_cene)); // default fallback
          }
        }
      }

      // Arrange items in a grid layout
      const itemsPerRow = 3; // 3 items per row
      const rowsPerPage = config.format === "6x4" ? 8 : 10; // 8 rows per page for 6x4 format
      const rows: string[] = [];

      for (let i = 0; i < itemContents.length; i += itemsPerRow) {
        const rowItems = itemContents.slice(i, i + itemsPerRow);
        rows.push(`
          <div style="display: flex; gap: 0mm; margin-bottom: 0mm;">
            ${rowItems.join("")}
          </div>
        `);
      }

      // For 6x4 format, split into pages with 8 rows each
      if (config.format === "6x4") {
        const pages: string[] = [];
        for (let i = 0; i < rows.length; i += rowsPerPage) {
          const pageRows = rows.slice(i, i + rowsPerPage);
          pages.push(`
            <div style="
              width: 210mm;
              background: white;
              padding: 5mm;
              font-family: Arial, sans-serif;
            ">
              ${pageRows.join("")}
            </div>
          `);
        }
        htmlContent = pages;
      } else {
        htmlContent = `
          <div style="
            width: 210mm;
            background: white;
            padding: 5mm;
            font-family: Arial, sans-serif;
          ">
            ${rows.join("")}
          </div>
        `;
      }
    }

    // Determine PDF format and dimensions
    // Default to A4 for grids (6x4, etc) unless A5 is explicitly requested
    const isA5 = config.format === "A5";
    const targetFormat = isA5 ? "a5" : "a4";
    const pdfWidth = isA5 ? 148 : 210;
    const pdfHeight = isA5 ? 210 : 297; 
    const pxWidth = Math.round(pdfWidth * 3.7795); // Convert mm to px at roughly 96 DPI for canvas sizing

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: targetFormat,
    });

    // Handle different content structures
    if (Array.isArray(htmlContent)) {
      // Multiple pages
      for (const pageContent of htmlContent) {
        // Create temporary element for rendering
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = pageContent;
        tempDiv.style.position = "absolute";
        tempDiv.style.left = "-9999px";
        tempDiv.style.top = "-9999px";
        // Explicitly match PDF width
        tempDiv.style.width = `${pdfWidth}mm`; 
        tempDiv.style.background = "white";
        document.body.appendChild(tempDiv);

        // Render with html2canvas
        const canvas = await html2canvas(tempDiv, {
          scale: 2, // Good balance for text precision
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          width: pxWidth,
          windowWidth: pxWidth, // Helper for some scrollbar edge cases
          height: Math.max(1, tempDiv.scrollHeight),
        });

        // Remove temporary element
        document.body.removeChild(tempDiv);

        // Use JPEG with reasonable quality
        const imgData = canvas.toDataURL("image/jpeg", 0.8);
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;

        // Add page to PDF
        if (htmlContent.indexOf(pageContent) > 0) {
          pdf.addPage();
        }
        pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, imgHeight, undefined, 'FAST');
      }
    } else {
      // Single content block
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = "absolute";
      tempDiv.style.left = "-9999px";
      tempDiv.style.top = "-9999px";
      // Explicitly match PDF width
      tempDiv.style.width = `${pdfWidth}mm`;
      tempDiv.style.background = "white";
      document.body.appendChild(tempDiv);

      // Render with html2canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: pxWidth,
        windowWidth: pxWidth,
        height: Math.max(1, tempDiv.scrollHeight),
      });

      // Remove temporary element
      document.body.removeChild(tempDiv);

      // Create PDF content
      const imgData = canvas.toDataURL("image/jpeg", 0.8);
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pdfHeight;

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pdfHeight;
      }
    }

    // Output based on printer selection
    if (printer === "Štampaj") {
      // For direct printing, we trigger the browser's print dialog on the generated PDF
      pdf.autoPrint();
      
      // We open a new window with the PDF blob to ensure it prints correctly without redirecting current page
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      // Default: Save as PDF (download)
      const fileName = `cene_raf_${config.radnja}_${config.format}_${
        config.tip_cene
      }_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    }
  } catch (error) {
    console.error("Error generating print PDF:", error);
    throw error;
  }
};

// Print function for liflet price tags (existing functionality)
export const printLifletPriceTags = async (
  items: LifletPrintData[],
  selectedLiflet?: any
): Promise<void> => {
  try {
    // Generate QR codes for all items
    const qrCodesPromises = items.map(async (item) => {
      const qrData =
        item.artikli?.Id_Artikal || item.artikli?.DESCRIPTION || "";
      try {
        return await generateQRCode(qrData.toString());
      } catch (error) {
        console.error("Error generating QR code:", error);
        return "";
      }
    });

    const qrCodes = await Promise.all(qrCodesPromises);

    // Create HTML content for price tags
    let htmlContent = "";
    items.forEach((item, index) => {
      const qrCode = qrCodes[index];
      htmlContent += formatPriceTag(item, selectedLiflet);
    });

    // Create temporary element for rendering
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    tempDiv.style.width = "210mm";
    tempDiv.style.background = "white";
    document.body.appendChild(tempDiv);

    // Render with html2canvas
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: 794, // 210mm at 96 DPI
      height: Math.max(1123, tempDiv.scrollHeight),
    });

    // Remove temporary element
    document.body.removeChild(tempDiv);

    // Create PDF
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

    // Save PDF
    const fileName = `cene_za_raf_${selectedLiflet?.id || "unknown"}_${
      new Date().toISOString().split("T")[0]
    }.pdf`;
    pdf.save(fileName);
  } catch (error) {
    console.error("Error generating price tags PDF:", error);
    throw error;
  }
};

// Preview functions for UI display
export const getFormatPreview = (format: string, tip_cene: string): string => {
  const mockItem: PrintItem = {
    id: 1,
    id_prodavnica: 1,
    id_artikal: 12345,
    cena_redovna: 1129.99,
    cena_akcija: 99.99,
    napomena: null,
    artikli: {
      Id_Artikal: 12345,
      DESCRIPTION: "NAZIV ARTIKLA",
      BAR_CODE: "123456789",
    },
    prodavnice: {
      ID_Prodavnica: 1,
      Naziv: "Prodavnica",
    },
  };

  switch (format) {
    case "5x3":
      return format5x3(mockItem);
    case "6x4":
      return format6x4(mockItem, "", tip_cene); // QR code would be generated in real usage
    case "10x10x":
      return format10x10x(mockItem, "");
    case "A5":
      return formatA5([mockItem]);
    case "A4":
      return formatA4([mockItem]);
    default:
      return format6x4(mockItem, "", tip_cene);
  }
};

export interface SpisakRafItem {
  id: number;
  id_prodavnica: number | null;
  id_artikal: number | null;
  amount: number | null;
  artikli?: {
    Id_Artikal: number;
    DESCRIPTION: string | null;
    BAR_CODE: string | null;
  };
  prodavnice?: {
    ID_Prodavnica: number;
    Naziv: string | null;
  };
}

// Format Spisak Raf A4
export const formatSpisakRafA4 = (items: SpisakRafItem[], radnjaName: string): string => {
  const tableRows = items
    .map((item) => {
      const articleName = item.artikli?.DESCRIPTION || "";
      const rawBarcode = item.artikli?.BAR_CODE || "";
      // Split barcodes by space or comma and join with <br> for multi-line display
      const barcodeDisplay = rawBarcode.split(/[\s,]+/).filter(b => b.trim().length > 0).join("<br/>");
      const amount = item.amount ? Number(item.amount) : 0;

      return `
      <tr style="height: 12mm;">
        <td style="border: 1px solid #000; padding: 3px 4px; font-size: 18px; line-height: 1.3; vertical-align: top;">${articleName}</td>
        <td style="border: 1px solid #000; padding: 3px 4px; font-size: 18px; line-height: 1.3; text-align: center; vertical-align: top;">${barcodeDisplay}</td>
        <td style="border: 1px solid #000; padding: 3px 4px; font-size: 18px; line-height: 1.3; text-align: right; font-weight: bold; vertical-align: top;">
          ${formatSerbianNumberHTML(amount)}
        </td>
      </tr>
    `;
    })
    .join("");

  return `
    <div style="
      width: 210mm;
      min-height: 297mm;
      background: white;
      padding: 10mm;
      font-family: Arial, sans-serif;
      box-sizing: border-box;
    ">
      <div style="display: flex; align-items: flex-start; margin-bottom: 5mm;">
         <img src="/logo.png" style="height: 20mm; margin-right: 5mm;" />
         <div style="font-weight: bold; font-size: 16px; line-height: 1.2;">
            BORJAK TZR<br/>
            Todorovića 7<br/>
            Kraljevo - Grdica
         </div>
      </div>
      
      <h1 style="text-align: center; font-size: 16px; font-weight: bold; margin-bottom: 5mm; text-transform: uppercase;">
        Spisak za punjenje rafa u prodavnici ${radnjaName}
      </h1>

      <table style="width: 100%; border-collapse: collapse; font-size: 18px;">
        <thead>
         <tr style="background: #f0f0f0; height: 12mm;">
    <th
      style="
        border: 1px solid #000;
        padding: 4px;
        text-align: center;
        vertical-align: top;
        font-weight: bold;
        line-height: 1.3;
      "
    >
      Artikal
    </th>

    <th
      style="
        border: 1px solid #000;
        padding: 4px;
        text-align: center;
        vertical-align: top;
        font-weight: bold;
        line-height: 1.3;
      "
    >
      Barkod
    </th>

    <th
      style="
        border: 1px solid #000;
        padding: 4px;
        text-align: center;
        vertical-align: top;
        font-weight: bold;
        line-height: 1.3;
      "
    >
      Količina
    </th>
  </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </div>
  `;
};

// Print function for Spisak Raf
export const printSpisakRaf = async (
  items: SpisakRafItem[],
  radnjaName: string,
  printer?: string
): Promise<void> => {
  try {
    const htmlContent = formatSpisakRafA4(items, radnjaName);

    // Create temporary element for rendering
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "-9999px";
    // Explicitly match PDF width
    tempDiv.style.width = "210mm";
    tempDiv.style.background = "white";
    document.body.appendChild(tempDiv);

    // Wait for images to load (specifically the logo)
    const images = tempDiv.getElementsByTagName("img");
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve(true);
              else {
                img.onload = () => resolve(true);
                img.onerror = () => resolve(true);
              }
            })
        )
      );
    }

    // Render with html2canvas
    const pdfWidth = 210;
    const pxWidth = Math.round(pdfWidth * 3.7795); // Convert mm to px

    const canvas = await html2canvas(tempDiv, {
      scale: 2, // 2 is a good balance for A4 text quality
      useCORS: true,
      allowTaint: true,
      backgroundColor: "#ffffff",
      width: pxWidth,
      windowWidth: pxWidth,
      height: Math.max(1, tempDiv.scrollHeight),
    });

    // Remove temporary element
    document.body.removeChild(tempDiv);

    // Create PDF
    const imgData = canvas.toDataURL("image/jpeg", 0.8);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageHeight = 297;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // Add first page
    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Add additional pages if needed
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Output based on printer selection
    if (printer === "Štampaj") {
      pdf.autoPrint();
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else {
      const fileName = `spisak_raf_${radnjaName.replace(
        /\s+/g,
        "_"
      )}_${new Date().toISOString().split("T")[0]}.pdf`;
      pdf.save(fileName);
    }
  } catch (error) {
    console.error("Error generating spisak raf PDF:", error);
    throw error;
  }
};
