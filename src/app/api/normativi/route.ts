import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function serialize(data: unknown) {
  return JSON.parse(
    JSON.stringify(data, (_, v) => (typeof v === "bigint" ? v.toString() : v)),
  );
}

export async function GET() {
  try {
    const data = await prisma.normativi_zaglavlje.findMany({
      include: {
        artikli: {
          select: { Id_Artikal: true, DESCRIPTION: true, BAR_CODE: true },
        },
        normativi_detalji: {
          include: {
            artikli: {
              select: { Id_Artikal: true, DESCRIPTION: true, BAR_CODE: true },
            },
          },
        },
      },
      orderBy: [{ datum: "desc" }, { vreme: "desc" }],
    });

    return NextResponse.json({ data: serialize(data) });
  } catch (error) {
    console.error("Error fetching normativi:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { datum, id_artikal } = body;

    const date = new Date(datum);
    const yyyy = date.getFullYear().toString();
    const mm = (date.getMonth() + 1).toString().padStart(2, "0");
    const dd = date.getDate().toString().padStart(2, "0");
    const prefix = `NORM-${id_artikal}`;

    const maxResult: { max_broj: string | null }[] = await prisma.$queryRaw`
      SELECT MAX(broj) as max_broj FROM normativi_zaglavlje WHERE broj LIKE ${prefix + "%"}
    `;

    let seq = 1;
    const maxBroj = maxResult[0]?.max_broj;
    if (maxBroj) {
      const parts = maxBroj.split("-");
      const last = parseInt(parts[parts.length - 1]);
      if (!isNaN(last)) seq = last + 1;
    }

    const broj = `${prefix}`;

    const created = await prisma.normativi_zaglavlje.create({
      data: {
        broj,
        datum: date,
        vreme: new Date(),
        id_artikal: Number(id_artikal),
      },
      include: {
        artikli: { select: { Id_Artikal: true, DESCRIPTION: true } },
      },
    });

    return NextResponse.json({ success: true, data: serialize(created) });
  } catch (error) {
    console.error("Error creating normativ:", error);
    return NextResponse.json({ error: "Error creating data" }, { status: 500 });
  }
}
