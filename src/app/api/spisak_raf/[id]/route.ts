import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    const { id_prodavnica, id_artikal, amount } =
      body;
    const resolvedParams = await params;
    const id = parseInt(resolvedParams.id);

    const result = await prisma.spisak_raf.update({
      where: { id },
      data: {
        id_prodavnica: id_prodavnica ? parseInt(id_prodavnica) : null,
        id_artikal: id_artikal ? parseInt(id_artikal) : null,
        amount: amount ? parseFloat(amount) : 0.0,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating spisak_raf:", error);
    return NextResponse.json(
      { error: "Failed to update spisak_raf record" },
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

    await prisma.spisak_raf.delete({
        where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting spisak_raf:", error);
    return NextResponse.json(
      { error: "Failed to delete spisak_raf record" },
      { status: 500 }
    );
  }
}
