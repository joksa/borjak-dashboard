import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);

    const detalj = await prisma.liflet_detalji.findUnique({
      where: { id: parsedId },
      include: {
        artikli: {
          select: {
            Id_Artikal: true,
            DESCRIPTION: true,
            BAR_CODE: true,
          },
        },
      },
    });

    if (!detalj) {
      return NextResponse.json(
        { error: "Liflet detalji not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(detalj);
  } catch (error) {
    console.error("Error fetching liflet detalji:", error);
    return NextResponse.json(
      { error: "Failed to fetch liflet detalji" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsedId = parseInt(id);
    const body = await request.json();
    const { liflet_id, Id_artikal, cena_akcija, cena_redovna } = body;

    const detalj = await prisma.liflet_detalji.update({
      where: { id: parsedId },
      data: {
        liflet_id: liflet_id ? parseInt(liflet_id) : undefined,
        Id_artikal: Id_artikal ? parseInt(Id_artikal) : undefined,
        cena_akcija: cena_akcija ? parseFloat(cena_akcija) : null,
        cena_redovna: cena_redovna ? parseFloat(cena_redovna) : null,
      },
      include: {
        artikli: {
          select: {
            Id_Artikal: true,
            DESCRIPTION: true,
            BAR_CODE: true,
          },
        },
      },
    });

    return NextResponse.json(detalj);
  } catch (error) {
    console.error("Error updating liflet detalji:", error);
    return NextResponse.json(
      { error: "Failed to update liflet detalji" },
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
    const parsedId = parseInt(id);

    await prisma.liflet_detalji.delete({
      where: { id: parsedId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting liflet detalji:", error);
    return NextResponse.json(
      { error: "Failed to delete liflet detalji" },
      { status: 500 }
    );
  }
}
