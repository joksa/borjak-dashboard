import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "10");
    const accounts = searchParams.get("accounts"); // New parameter for account numbers

    // If accounts parameter is provided, search by account numbers
    if (accounts) {
      const accountNumbers = accounts.split(',').map(acc => acc.trim()).filter(acc => acc.length > 0);

      if (accountNumbers.length === 0) {
        return NextResponse.json({ data: [] });
      }

      const clients = await prisma.klijenti_racuni.findMany({
        where: {
          tekuci_racun: {
            in: accountNumbers
          }
        },
        include: {
          klijenti: {
            select: {
              ID_Klijent: true,
              Naziv: true,
              PIB: true
            }
          }
        }
      });

      // Transform to match expected format
      const result = clients.map(client => ({
        accountNumber: client.tekuci_racun,
        ID_Klijent: client.klijenti?.ID_Klijent,
        Naziv: client.klijenti?.Naziv,
        PIB: client.klijenti?.PIB
      }));

      return NextResponse.json({
        data: result,
      });
    }

    // Split search into words and create AND conditions for each word
    const searchWords = search
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    let whereCondition: any = {};

    if (searchWords.length > 0) {
      // Create OR conditions for each field (Naziv or PIB)
      // Each field must contain ALL search words (AND logic for words within field)
      whereCondition = {
        OR: [
          // Naziv must contain all words
          searchWords.length === 1
            ? {
                Naziv: { contains: searchWords[0] },
              }
            : {
                AND: searchWords.map((word) => ({
                  Naziv: { contains: word },
                })),
              },
          // PIB must contain all words
          searchWords.length === 1
            ? {
                PIB: { contains: searchWords[0] },
              }
            : {
                AND: searchWords.map((word) => ({
                  PIB: { contains: word },
                })),
              },
        ],
      };
    }

    const clients = await prisma.klijenti.findMany({
      where: whereCondition,
      select: {
        ID_Klijent: true,
        Naziv: true,
        PIB: true,
      },
      orderBy: {
        Naziv: "asc",
      },
      take: limit,
    });

    return NextResponse.json({
      data: clients,
    });
  } catch (error) {
    console.error("Error searching clients:", error);
    return NextResponse.json(
      { error: "Failed to search clients" },
      { status: 500 }
    );
  }
}
