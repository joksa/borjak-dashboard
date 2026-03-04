import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function serialize(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ detaljId: string }> }) {
  try {
    const { detaljId } = await params;
    const id = parseInt(detaljId);
    const body = await request.json();
    const { kolicina } = body;

    const updated = await prisma.normativi_detalji.update({
      where: { id },
      data: { kolicina: Number(kolicina) },
      include: {
        artikli: { select: { Id_Artikal: true, DESCRIPTION: true, BAR_CODE: true } },
      },
    });

    return NextResponse.json({ success: true, data: serialize(updated) });
  } catch (error) {
    console.error("Error updating normativ detalj:", error);
    return NextResponse.json({ error: "Error updating data" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ detaljId: string }> }) {
  try {
    const { detaljId } = await params;
    const id = parseInt(detaljId);
    await prisma.normativi_detalji.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting normativ detalj:", error);
    return NextResponse.json({ error: "Error deleting data" }, { status: 500 });
  }
}
