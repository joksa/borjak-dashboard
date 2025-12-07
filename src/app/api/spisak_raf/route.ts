import { NextRequest, NextResponse } from "next/server";
import { PrismaClient, Prisma } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "id";
    const order = searchParams.get("order") || "desc";
    const radnja = searchParams.get("radnja") || "";
    
    const offset = (page - 1) * limit;

    const radnjaInt = radnja ? parseInt(radnja) : null;

    // Use raw query to get combined barcodes
    const spisakRafData = await prisma.$queryRaw<any[]>`
      SELECT sr.id, sr.id_artikal, sr.id_prodavnica, sr.amount, a.DESCRIPTION,
        TRIM(
          CONCAT_WS(' ',
            NULLIF(a.bar_code, ''),
            NULLIF(
              (SELECT GROUP_CONCAT(bc.Bar_Code SEPARATOR ' ')
               FROM bar_code bc 
               WHERE bc.ID_Artikal = CAST(a.id_artikal AS UNSIGNED)
              ), 
              ''
            ),
            NULLIF(a.BAR_CODE, '')
          )
        ) as bar_code
      FROM spisak_raf sr 
      LEFT JOIN artikli a on sr.id_artikal = a.id_artikal
      WHERE ${radnjaInt ? Prisma.sql`sr.id_prodavnica = ${radnjaInt}` : Prisma.sql`1=1`}
      ORDER BY sr.id DESC
    `;

    // Retrieve prodavnice for mapping
    const prodavniceData = (await prisma.$queryRaw`
      SELECT ID_Prodavnica, Naziv
      FROM prodavnice
      ORDER BY ID_Prodavnica
    `) as Array<{ ID_Prodavnica: number; Naziv: string | null }>;

    const prodavniceMap = new Map(
      prodavniceData.map((p) => [p.ID_Prodavnica, p])
    );

    // Filter unique barcodes and format data
    const spisakRafUnique = spisakRafData
      .map((item: any) => {
        // Normalize barcodes
        const uniqueBarcodes = [
          ...new Set(
            (item.bar_code || "").split(" ").filter((b: string) => b !== "")
          ),
        ].join(" ");
        
        return {
          ...item,
          bar_code: uniqueBarcodes,
          // Ensure amount is number
          amount: Number(item.amount),
        };
      })
      .filter((item: any, index: number, self: any[]) => {
        // Unique by bar_code
        return (
          self.findIndex((i: any) => i.bar_code === item.bar_code) === index
        );
      });

    // Transform to final response format
    const transformedData = spisakRafUnique.map((item: any) => ({
      id: Number(item.id),
      id_prodavnica: item.id_prodavnica,
      id_artikal: item.id_artikal,
      amount: item.amount,
      artikli: {
        Id_Artikal: item.id_artikal,
        DESCRIPTION: item.DESCRIPTION,
        BAR_CODE: item.bar_code,
      },
      prodavnice: item.id_prodavnica
        ? prodavniceMap.get(item.id_prodavnica)
        : null,
    }));

    // Handle pagination (in-memory since we fetched all)
    // If limit is large (10000), this effectively returns all
    const total = transformedData.length;
    const items = transformedData.slice(offset, offset + limit);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching spisak_raf:", error);
    return NextResponse.json(
      { error: "Failed to fetch spisak_raf data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if it's a bulk operation (array of prodavnice_ids)
    if (body.prodavnice_ids && Array.isArray(body.prodavnice_ids)) {
      const { prodavnice_ids, artikli_data } = body;

      if (!artikli_data || !Array.isArray(artikli_data)) {
        return NextResponse.json(
          { error: "artikli_data array is required for bulk operations" },
          { status: 400 }
        );
      }

      // Validate that artikli exist
      const artikalIds = artikli_data.map((artikal) =>
        parseInt(artikal.Id_artikal)
      );
      const existingArtikli = await prisma.artikli.findMany({
        where: {
          Id_Artikal: {
            in: artikalIds,
          },
        },
        select: {
          Id_Artikal: true,
        },
      });

      const existingArtikalIds = existingArtikli.map(
        (artikal) => artikal.Id_Artikal
      );
      const invalidArtikalIds = artikalIds.filter(
        (id) => !existingArtikalIds.includes(id)
      );

      if (invalidArtikalIds.length > 0) {
        return NextResponse.json(
          {
            error: `Artikli sa ID-ovima ${invalidArtikalIds.join(
              ", "
            )} ne postoje`,
          },
          { status: 400 }
        );
      }

      // Create records for each combination of prodavnica and artikal
      const recordsToCreate = [];

      for (const prodavnica_id of prodavnice_ids) {
        for (const artikal of artikli_data) {
          recordsToCreate.push({
            id_prodavnica: parseInt(prodavnica_id),
            id_artikal: parseInt(artikal.Id_artikal),
            amount: artikal.amount
              ? parseFloat(artikal.amount)
              : 0.0
          });
        }
      }

      // Use transaction to ensure all records are created or none
      const result = await prisma.$transaction(
        recordsToCreate.map((record) =>
          prisma.spisak_raf.create({ data: record })
        )
      );

      return NextResponse.json({
        message: `Successfully created ${result.length} records`,
        count: result.length,
      });
    } else {
      // Single record creation (existing logic)
      const { id_prodavnica, id_artikal, amount } =
        body;

      const result = await prisma.spisak_raf.create({
        data: {
          id_prodavnica: id_prodavnica ? parseInt(id_prodavnica) : null,
          id_artikal: id_artikal ? parseInt(id_artikal) : null, // Corrected logic: pass integer directly
          amount: amount ? parseFloat(amount) : 0.0,
        },
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error creating spisak_raf:", error);
    return NextResponse.json(
      { error: "Failed to create spisak_raf record" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const prodavnicaId = searchParams.get("prodavnica_id");

    if (!prodavnicaId) {
      return NextResponse.json(
        { error: "prodavnica_id parameter is required" },
        { status: 400 }
      );
    }

    const id = parseInt(prodavnicaId);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid prodavnica_id parameter" },
        { status: 400 }
      );
    }

    // Delete all records for the specified prodavnica
    const result = await prisma.spisak_raf.deleteMany({
      where: { id_prodavnica: id },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} records for prodavnica ${id}`,
    });
  } catch (error) {
    console.error("Error deleting spisak_raf records:", error);
    return NextResponse.json(
      { error: "Failed to delete spisak_raf records" },
      { status: 500 }
    );
  }
}
