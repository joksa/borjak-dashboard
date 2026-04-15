import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const where: any = {};

    if (clientId) {
      where.Id_klijent = parseInt(clientId);
    }

    if (dateFrom) {
      where.datum_od = { ...where.datum_od, gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.datum_do = { ...where.datum_do, lte: new Date(dateTo) };
    }

    const planovi = await prisma.liflet_plan.findMany({
      where,
      include: {
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true,
            PIB: true,
          },
        },
      },
      orderBy: { datum_od: "desc" },
    });

    return NextResponse.json({ data: planovi });
  } catch (error) {
    console.error("Error fetching liflet plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch liflet plan" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { Id_klijent, iznos, datum_od, datum_do, tekst } = body;

    const plan = await prisma.liflet_plan.create({
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
    console.error("Error creating liflet plan:", error);
    return NextResponse.json(
      { error: "Failed to create liflet plan" },
      { status: 500 }
    );
  }
}
