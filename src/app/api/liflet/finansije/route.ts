import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import * as cheerio from "cheerio";

const prisma = new PrismaClient();

// Function to refresh client bank accounts from NBS registry
async function refreshClientBankAccounts(clientId: number) {
  try {
    // Get client to fetch PIB
    const client = await prisma.klijenti.findUnique({
      where: { ID_Klijent: clientId },
      select: { ID_Klijent: true, PIB: true, Naziv: true },
    });

    if (!client || !client.PIB) {
      console.log(`Client ${clientId} not found or no PIB available`);
      return;
    }

    // Check last updated_at for this client
    const lastUpdate = await prisma.klijenti_racuni.findFirst({
      where: { Id_klijent: clientId },
      orderBy: { updated_at: "desc" },
      select: { updated_at: true },
    });

    // If updated within last 7 days, skip
    if (lastUpdate) {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (lastUpdate.updated_at > sevenDaysAgo) {
        console.log(
          `Bank accounts for client ${clientId} updated recently, skipping refresh`
        );
        return;
      }
    }

    // Fetch data from NBS registry
    const nbsUrl = `https://webappcenter.nbs.rs/PnWebApp/CompanyAccount/CompanyAccountResident?isSearchExecuted=true&BankCode=&AccountNumber=&ControlNumber=&CompanyNationalCode=&CompanyTaxCode=${client.PIB}&CompanyName=&City=&TypeID=1&OrderBy=&Pagging.CurrentPage=1&Pagging.PageSize=50`;

    const response = await fetch(nbsUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch from NBS");
    }

    const html = await response.text();

    // Parse HTML using cheerio
    const $ = cheerio.load(html);
    const accounts: string[] = [];

    console.log(`Parsing NBS data for PIB: ${client.PIB}`);

    // Find the results table with class "responsive-table"
    $("table.responsive-table tbody tr").each((_, row) => {
      let accountNumber = "";

      // Find account number: td with data-title="&#x420;&#x430;&#x447;&#x443;&#x43D;" (Рачун)
      $(row)
        .find('td[data-title*="\\u0420\\u0430\\u0447\\u0443\\u043D"]')
        .each((_, cell) => {
          const text = $(cell).text().trim();
          // Extract account number from <b> tag if exists
          const boldText = $(cell).find("b").text().trim();
          accountNumber = boldText || text;
        });

      // Also try with direct Cyrillic text
      if (!accountNumber) {
        $(row)
          .find("td")
          .each((_, cell) => {
            const dataTitle = $(cell).attr("data-title");
            if (dataTitle && dataTitle.includes("Рачун")) {
              const text = $(cell).text().trim();
              const boldText = $(cell).find("b").text().trim();
              accountNumber = boldText || text;
            }
          });
      }

      // Validate account number format: 340-0000011027522-87 (3 digits - up to 13 digits - up to 2 digits)
      const accountPattern = /^\d{3}-\d{1,13}-\d{1,2}$/;
      if (accountNumber && accountPattern.test(accountNumber)) {
        console.log(`Found account: ${accountNumber}`);
        accounts.push(accountNumber);
      }
    });

    console.log(`Total accounts found: ${accounts.length}`);

    if (accounts.length > 0) {
      // Delete existing accounts for this client
      await prisma.klijenti_racuni.deleteMany({
        where: { Id_klijent: clientId },
      });

      // Insert new accounts
      await prisma.klijenti_racuni.createMany({
        data: accounts.map((accountNumber) => ({
          Id_klijent: clientId,
          tekuci_racun: accountNumber,
        })),
      });

      console.log(
        `Updated ${accounts.length} bank accounts for client ${clientId}`
      );
    }
  } catch (error) {
    console.error("Error refreshing client bank accounts:", error);
    // Don't throw error to avoid breaking the main flow
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dug = searchParams.get("dug");
    const stanje = searchParams.get("stanje");
    const clientId = searchParams.get("client_id");
    const details = searchParams.get("details");

    if (stanje === "true") {
      // Return aggregated financial data per client for stanje page
      const finansije = await prisma.liflet_finansije.findMany({
        include: {
          klijenti: {
            select: {
              ID_Klijent: true,
              Naziv: true,
              PIB: true,
              Adresa: true,
              Telefon: true,
            },
          },
        },
      });

      // Aggregate data by client
      const clientStats = new Map();

      finansije.forEach((record) => {
        if (!record.klijenti) return;

        const clientId = record.klijenti.ID_Klijent;
        const clientName = record.klijenti.Naziv || "Unknown Client";
        const pib = record.klijenti.PIB || "";

        if (!clientStats.has(clientId)) {
          clientStats.set(clientId, {
            id: clientId,
            naziv: clientName,
            pib: pib,
            totalZaduzenja: 0,
            totalUplate: 0,
            currentDue: 0,
            pastDue: 0,
          });
        }
      });

      // Calculate totals for each client
      Array.from(clientStats.keys()).forEach((clientId) => {
        const clientStat = clientStats.get(clientId);
        const clientFinansije = finansije.filter(
          (f: any) => f.klijenti?.ID_Klijent === clientId
        );
        const now = new Date();

        let totalZaduzenja = 0;
        let totalUplate = 0;
        let currentDueAmount = 0;

        clientFinansije.forEach((record: any) => {
          const amount = Number(record.iznos);

          if (record.dug === true || record.dug === 1) {
            // Zaduženje (debt)
            totalZaduzenja += amount;

            // Current due: debts with due date <= today
            if (record.valuta && new Date(record.valuta) <= now) {
              currentDueAmount += amount;
            }
          } else if (record.dug === false || record.dug === 0) {
            // Uplata (payment)
            totalUplate += amount;
          }
        });

        // Current Due = debts with due date <= today minus all payments
        clientStat.currentDue = Math.max(0, currentDueAmount - totalUplate);

        // Past Due (actually Total Due) = all debts minus all payments
        clientStat.pastDue = Math.max(0, totalZaduzenja - totalUplate);

        clientStat.totalZaduzenja = totalZaduzenja;
        clientStat.totalUplate = totalUplate;
      });

      const result = Array.from(clientStats.values())
        .filter((client) => client.totalZaduzenja > 0 || client.totalUplate > 0)
        .sort((a, b) => a.naziv.localeCompare(b.naziv));

      return NextResponse.json({
        data: result,
      });
    }

    if (details === "true" && clientId) {
      // Return detailed transactions for a specific client
      const clientTransactions = await prisma.liflet_finansije.findMany({
        where: {
          Id_klijent: parseInt(clientId),
        },
        select: {
          id: true,
          dug: true,
          iznos: true,
          datum: true,
          valuta: true,
          napomena: true,
        },
        orderBy: {
          datum: "asc",
        },
      });

      return NextResponse.json({
        data: clientTransactions,
      });
    }

    // Build where clause for regular finansije queries
    const where: any = {};

    // Filter by dug if specified
    if (dug !== null) {
      where.dug = dug === "1" || dug === "true";
    }

    const finansije = await prisma.liflet_finansije.findMany({
      where,
      include: {
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true,
            PIB: true,
            Adresa: true,
            Telefon: true,
          },
        },
      },
      orderBy: {
        datum: "desc",
      },
    });

    return NextResponse.json({
      data: finansije,
    });
  } catch (error) {
    console.error("Error fetching liflet finansije:", error);
    return NextResponse.json(
      { error: "Failed to fetch liflet finansije" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { Id_klijent, dug, iznos, datum, valuta, napomena } = body;

    const finansija = await prisma.liflet_finansije.create({
      data: {
        Id_klijent: Id_klijent ? parseInt(Id_klijent) : null,
        dug: dug === "1" || dug === 1 || dug === true,
        iznos: parseFloat(iznos),
        datum: new Date(datum),
        valuta: valuta ? new Date(valuta) : null,
        napomena: napomena || null,
      },
      include: {
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true,
            PIB: true,
            Adresa: true,
            Telefon: true,
          },
        },
      },
    });

    // Refresh client bank accounts if client ID is provided
    if (Id_klijent) {
      // Run in background to avoid delaying the response
      setImmediate(() => {
        refreshClientBankAccounts(parseInt(Id_klijent));
      });
    }

    return NextResponse.json(finansija);
  } catch (error) {
    console.error("Error creating liflet finansije:", error);
    return NextResponse.json(
      { error: "Failed to create liflet finansije" },
      { status: 500 }
    );
  }
}
