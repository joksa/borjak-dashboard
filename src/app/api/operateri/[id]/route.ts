
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    const body = await request.json();
    const { op_ime_prezime, op_lozinka, op_aktivan, op_objekat } = body;

    const updatedItem = await prisma.operateri.update({
      where: { op_id: id },
      data: {
        op_ime_prezime,
        op_lozinka,
        op_aktivan: Number(op_aktivan),
        op_objekat,
      },
    });

    return NextResponse.json({ success: true, data: updatedItem });
  } catch (error) {
    console.error("Error updating operater:", error);
    return NextResponse.json({ error: "Error updating data" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    await prisma.operateri.delete({
      where: { op_id: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting operater:", error);
    return NextResponse.json({ error: "Error deleting data" }, { status: 500 });
  }
}
