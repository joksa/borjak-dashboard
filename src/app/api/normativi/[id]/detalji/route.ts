import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function serialize(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v))
  );
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const normativ_id = parseInt(id);
    const body = await request.json();
    const { id_artikal, kolicina } = body;

    const created = await prisma.normativi_detalji.create({
      data: {
        normativi_zaglavlje: { connect: { id: normativ_id } },
        artikli: { connect: { Id_Artikal: Number(id_artikal) } },
        kolicina: Number(kolicina),
      },
      include: {
        artikli: { select: { Id_Artikal: true, DESCRIPTION: true, BAR_CODE: true } },
      },
    });

    return NextResponse.json({ success: true, data: serialize(created) });
  } catch (error) {
    console.error("Error creating normativ detalj:", error);
    return NextResponse.json({ error: "Error creating data" }, { status: 500 });
  }
}
