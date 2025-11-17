import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "10");

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
