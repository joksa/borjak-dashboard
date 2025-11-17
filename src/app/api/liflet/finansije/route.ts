import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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

    return NextResponse.json(finansija);
  } catch (error) {
    console.error("Error creating liflet finansije:", error);
    return NextResponse.json(
      { error: "Failed to create liflet finansije" },
      { status: 500 }
    );
  }
}
