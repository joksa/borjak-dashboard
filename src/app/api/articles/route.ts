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
      // Create OR conditions for each field (DESCRIPTION or BAR_CODE)
      // Each field must contain ALL search words (AND logic for words within field)
      whereCondition = {
        OR: [
          // DESCRIPTION must contain all words
          searchWords.length === 1
            ? {
                DESCRIPTION: { contains: searchWords[0] },
              }
            : {
                AND: searchWords.map((word) => ({
                  DESCRIPTION: { contains: word },
                })),
              },
          // BAR_CODE must contain all words
          searchWords.length === 1
            ? {
                BAR_CODE: { contains: searchWords[0] },
              }
            : {
                AND: searchWords.map((word) => ({
                  BAR_CODE: { contains: word },
                })),
              },
        ],
      };
    }

    const articles = await prisma.artikli.findMany({
      where: whereCondition,
      select: {
        Id_Artikal: true,
        DESCRIPTION: true,
        BAR_CODE: true,
        PRICE: true,
        liflet_detalji: {
          select: {
            image: true,
          },
          where: {
            image: {
              not: null,
            },
          },
          take: 1, // Just need to know if at least one exists
        },
      },
      orderBy: {
        DESCRIPTION: "asc",
      },
      take: limit,
    });

    // Transform the data to include image info
    const articlesWithImageInfo = articles.map((article) => ({
      Id_Artikal: article.Id_Artikal,
      DESCRIPTION: article.DESCRIPTION,
      BAR_CODE: article.BAR_CODE,
      PRICE: article.PRICE,
      hasImage: article.liflet_detalji.length > 0,
      image:
        article.liflet_detalji.length > 0
          ? article.liflet_detalji[0].image
          : null,
    }));

    return NextResponse.json({
      data: articlesWithImageInfo,
    });
  } catch (error) {
    console.error("Error searching articles:", error);
    return NextResponse.json(
      { error: "Failed to search articles" },
      { status: 500 }
    );
  }
}
