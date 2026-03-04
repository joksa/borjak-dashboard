import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function serialize(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await request.json();
    const { datum, id_artikal } = body;

    const updated = await prisma.normativi_zaglavlje.update({
      where: { id },
      data: {
        datum: new Date(datum),
        id_artikal: Number(id_artikal),
        updated_at: new Date(),
      },
      include: {
        artikli: { select: { Id_Artikal: true, DESCRIPTION: true } },
      },
    });

    return NextResponse.json({ success: true, data: serialize(updated) });
  } catch (error) {
    console.error("Error updating normativ:", error);
    return NextResponse.json({ error: "Error updating data" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    await prisma.normativi_zaglavlje.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting normativ:", error);
    return NextResponse.json({ error: "Error deleting data" }, { status: 500 });
  }
}
