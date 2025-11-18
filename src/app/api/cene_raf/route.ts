import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const sort = searchParams.get("sort") || "id";
    const order = searchParams.get("order") || "desc";

    const offset = (page - 1) * limit;

    const ceneRafData = await prisma.cene_raf.findMany({
      orderBy: {
        [sort]: order,
      },
      skip: offset,
      take: limit,
    });

    // Get artikli data separately
    const artikliIds = ceneRafData
      .map((item) => item.id_artikal)
      .filter((id): id is number => id !== null);

    let artikliData: Array<{
      Id_Artikal: number;
      DESCRIPTION: string | null;
      BAR_CODE: string | null;
    }> = [];

    if (artikliIds.length > 0) {
      artikliData = await prisma.artikli.findMany({
        where: {
          Id_Artikal: {
            in: artikliIds,
          },
        },
        select: {
          Id_Artikal: true,
          DESCRIPTION: true,
          BAR_CODE: true,
        },
      });
    }

    // Create a map for quick lookup
    const artikliMap = new Map(
      artikliData.map((artikal) => [artikal.Id_Artikal, artikal])
    );

    // Get prodavnice data separately since it's ignored in Prisma schema
    // Load ALL prodavnice data to ensure filtering works correctly on frontend
    const prodavniceData = (await prisma.$queryRaw`
      SELECT ID_Prodavnica, Naziv
      FROM prodavnice
      ORDER BY ID_Prodavnica
    `) as Array<{ ID_Prodavnica: number; Naziv: string | null }>;

    // Create a map for quick lookup
    const prodavniceMap = new Map(
      prodavniceData.map((p) => [p.ID_Prodavnica, p])
    );

    // Get total count
    const total = await prisma.cene_raf.count();

    // Transform the data to match the expected format
    const transformedData = ceneRafData.map((item) => ({
      id: item.id,
      id_prodavnica: item.id_prodavnica,
      id_artikal: item.id_artikal,
      cena_redovna: item.cena_redovna,
      cena_akcija: item.cena_akcija,
      napomena: item.napomena,
      artikli: item.id_artikal ? artikliMap.get(item.id_artikal) : null,
      prodavnice: item.id_prodavnica
        ? prodavniceMap.get(item.id_prodavnica)
        : null,
    }));

    return NextResponse.json({
      data: transformedData,
      pagination: {
        page,
        limit,
        total: Number(total),
        pages: Math.ceil(Number(total) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cene_raf:", error);
    return NextResponse.json(
      { error: "Failed to fetch cene_raf data" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Check if it's a bulk operation (array of prodavnice_ids)
    if (body.prodavnice_ids && Array.isArray(body.prodavnice_ids)) {
      const { prodavnice_ids, artikli_data, napomena } = body;

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

      // Generate napomena if datum_do is provided and there are akcijske cene

      // Create records for each combination of prodavnica and artikal
      const recordsToCreate = [];

      for (const prodavnica_id of prodavnice_ids) {
        for (const artikal of artikli_data) {
          recordsToCreate.push({
            id_prodavnica: parseInt(prodavnica_id),
            artikli: {
              connect: { Id_Artikal: parseInt(artikal.Id_artikal) },
            },
            cena_redovna: artikal.cena_redovna
              ? parseFloat(artikal.cena_redovna)
              : 0.0,
            cena_akcija: artikal.cena_akcija
              ? parseFloat(artikal.cena_akcija)
              : 0.0,
            napomena: napomena,
          });
        }
      }

      // Use transaction to ensure all records are created or none
      const result = await prisma.$transaction(
        recordsToCreate.map((record) =>
          prisma.cene_raf.create({ data: record })
        )
      );

      return NextResponse.json({
        message: `Successfully created ${result.length} records`,
        count: result.length,
      });
    } else {
      // Single record creation (existing logic)
      const { id_prodavnica, id_artikal, cena_redovna, cena_akcija, napomena } =
        body;

      const result = await prisma.cene_raf.create({
        data: {
          id_prodavnica: id_prodavnica ? parseInt(id_prodavnica) : null,
          artikli: id_artikal
            ? {
                connect: { Id_Artikal: parseInt(id_artikal) },
              }
            : undefined,
          cena_redovna: cena_redovna ? parseFloat(cena_redovna) : 0.0,
          cena_akcija: cena_akcija ? parseFloat(cena_akcija) : 0.0,
          napomena: napomena || null,
        },
      });

      return NextResponse.json(result);
    }
  } catch (error) {
    console.error("Error creating cene_raf:", error);
    return NextResponse.json(
      { error: "Failed to create cene_raf record" },
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

    // Get count of records before deletion for confirmation
    const countBefore = await prisma.cene_raf.count({
      where: { id_prodavnica: id },
    });

    // Delete all records for the specified prodavnica
    const result = await prisma.cene_raf.deleteMany({
      where: { id_prodavnica: id },
    });

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `Successfully deleted ${result.count} records for prodavnica ${id}`,
    });
  } catch (error) {
    console.error("Error deleting cene_raf records:", error);
    return NextResponse.json(
      { error: "Failed to delete cene_raf records" },
      { status: 500 }
    );
  }
}
