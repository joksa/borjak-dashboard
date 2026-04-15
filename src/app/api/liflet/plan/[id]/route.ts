import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { Id_klijent, iznos, datum_od, datum_do, tekst } = body;

    const plan = await prisma.liflet_plan.update({
      where: { id: parseInt(id) },
      data: {
        Id_klijent: Id_klijent ? parseInt(Id_klijent) : null,
        iznos: iznos ? parseFloat(iznos) : null,
        datum_od: new Date(datum_od),
        datum_do: new Date(datum_do),
        tekst,
      },
      include: {
        klijenti: {
          select: { ID_Klijent: true, Naziv: true, PIB: true },
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating liflet plan:", error);
    return NextResponse.json(
      { error: "Failed to update liflet plan" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.liflet_plan.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting liflet plan:", error);
    return NextResponse.json(
      { error: "Failed to delete liflet plan" },
      { status: 500 }
    );
  }
}
