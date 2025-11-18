import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Use raw SQL query since prodavnice table is ignored by Prisma
    const prodavnice = (await prisma.$queryRaw`
      SELECT ID_Prodavnica, Naziv, Sifra
      FROM prodavnice
      WHERE (Naziv LIKE ${`%${search}%`} OR Sifra LIKE ${`%${search}%`})
      ORDER BY ID_Prodavnica ASC
    `) as Array<{
      ID_Prodavnica: number;
      Naziv: string | null;
      Sifra: string | null;
    }>;

    return NextResponse.json({
      data: prodavnice,
    });
  } catch (error) {
    console.error("Error fetching prodavnice:", error);
    return NextResponse.json(
      { error: "Failed to fetch prodavnice" },
      { status: 500 }
    );
  }
}
