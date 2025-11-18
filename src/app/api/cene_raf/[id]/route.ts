import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id_prodavnica, id_artikal, cena_redovna, cena_akcija, napomena } =
      body;
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const result = await prisma.cene_raf.update({
      where: { id },
      data: {
        id_prodavnica: id_prodavnica ? parseInt(id_prodavnica) : null,
        artikli: id_artikal
          ? {
              connect: { Id_Artikal: parseInt(id_artikal) },
            }
          : {
              disconnect: true,
            },
        cena_redovna: cena_redovna ? parseFloat(cena_redovna) : 0.0,
        cena_akcija: cena_akcija ? parseFloat(cena_akcija) : 0.0,
        napomena: napomena || null,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating cene_raf:", error);
    return NextResponse.json(
      { error: "Failed to update cene_raf record" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    await prisma.$queryRaw`
      DELETE FROM cene_raf WHERE id = ${id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting cene_raf:", error);
    return NextResponse.json(
      { error: "Failed to delete cene_raf record" },
      { status: 500 }
    );
  }
}
