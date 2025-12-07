import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");
  const prodavnicaId = searchParams.get("prodavnicaId");

  if (!articleId) {
    return NextResponse.json({ error: "Missing articleId parameter" }, { status: 400 });
  }

  const artIdInt = parseInt(articleId);

  try {
    const currentDate = new Date();

    // 1. Check Liflet (Active Promotion)
    // Looking for active promotion across all leaflets?
    // User query: SELECT * from liflet_zaglavlje lz LEFT JOIN liflet_detalji ld ON lz.id = ld.liflet_id 
    // where CURRENT_DATE() >= lz.datum_od and CURRENT_DATE() <= lz.datum_do
    
    const activeLiflet = await prisma.liflet_detalji.findFirst({
      where: {
        Id_artikal: artIdInt,
        liflet_zaglavlje: {
          datum_od: { lte: currentDate },
          datum_do: { gte: currentDate },
        },
      },
      select: {
        cena_redovna: true,
        cena_akcija: true,
      },
    });

    if (activeLiflet) {
      return NextResponse.json({
        found: true,
        source: "liflet",
        cena_redovna: activeLiflet.cena_redovna,
        cena_akcija: activeLiflet.cena_akcija,
      });
    }

    // 2. Check Cenovnik (Regular Price) if prodavnicaId provided
    if (prodavnicaId) {
      const prodIdInt = parseInt(prodavnicaId);
      
      // Cenovnik is ignored in Prisma schema (no ID), so use queryRaw
      const cenovnikData: any[] = await prisma.$queryRaw`
        SELECT cena 
        FROM cenovnik 
        WHERE id_prodavnica = ${prodIdInt} 
        AND id_artikal = ${artIdInt}
        LIMIT 1
      `;

      if (cenovnikData.length > 0) {
        return NextResponse.json({
          found: true,
          source: "cenovnik",
          cena_redovna: cenovnikData[0].cena,
          cena_akcija: 0,
        });
      }
    }

    // Not found
    return NextResponse.json({
      found: false,
      cena_redovna: 0,
      cena_akcija: 0,
    });

  } catch (error) {
    console.error("Error checking prices:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
