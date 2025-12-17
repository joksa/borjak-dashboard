
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const data = await prisma.$queryRaw`
      SELECT 
        d.dok_id,
        d.dok_godina,
        d.dok_tip,
        d.dok_broj,
        d.dok_obj1,
        d.dok_status,
        d.dok_datum,
        d.dok_opis,
        r.ID_Robna_Grupa,
        r.Naziv as RobnaGrupaNaziv
      FROM dok_zaglavlje d
      LEFT JOIN robne_grupe r ON d.dok_opis COLLATE utf8mb4_unicode_ci = CAST(r.ID_Robna_Grupa AS CHAR) COLLATE utf8mb4_unicode_ci
      WHERE d.dok_tip = 'POPIS_PARCIJALNO'
      ORDER BY d.dok_status, d.dok_datum DESC
    `;
    
    const serializedData = JSON.parse(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value
    ));

    return NextResponse.json({ data: serializedData });
  } catch (error) {
    console.error("Error fetching popisi_parcijalno:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { dok_datum, dok_obj1, dok_opis, dok_status } = body;

    const datum = new Date(dok_datum);
    const godina = datum.getFullYear().toString();
    const tip = 'POPIS_PARCIJALNO';
    
    // Generate dok_broj format: dok_obj1-yyyymmddss
    const yyyy = datum.getFullYear().toString();
    const mm = (datum.getMonth() + 1).toString().padStart(2, '0');
    const dd = datum.getDate().toString().padStart(2, '0');
    const dateStr = `${yyyy}${mm}${dd}`;
    const prefix = `${dok_obj1}-${dateStr}`;

    const maxBrojResult: any[] = await prisma.$queryRaw`
      SELECT MAX(dok_broj) as max_broj
      FROM dok_zaglavlje
      WHERE dok_tip = ${tip} AND dok_broj LIKE ${prefix + '%'}
    `;

    const maxBrojRaw = maxBrojResult[0]?.max_broj;
    let sequence = 1;

    if (maxBrojRaw) {
      // Extract last 2 digits
      const suffix = maxBrojRaw.slice(-2);
      const parsedSeq = parseInt(suffix);
      if (!isNaN(parsedSeq)) {
        sequence = parsedSeq + 1;
      }
    }

    const nextBroj = `${prefix}${sequence.toString().padStart(2, '0')}`;
    // Insert
    // We cannot use prisma.create easily because we need to match the raw query logic potentially?
    // Actually prisma.dok_zaglavlje.create works fine for standard tables.
    
    const newItem = await prisma.dok_zaglavlje.create({
      data: {
        dok_godina: godina,
        dok_tip: tip,
        dok_broj: nextBroj,
        dok_obj1: dok_obj1,
        dok_datum: datum,
        dok_vreme: new Date(),
        dok_status: Number(dok_status) || 1,
        dok_opis: dok_opis, // Stores ID_Robna_Grupa
        dok_radnik: '', // Optional
        // dok_isvoce: 0 // default
      }
    });

    const serializedItem = JSON.parse(JSON.stringify(newItem, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value
    ));

    return NextResponse.json({ success: true, data: serializedItem });

  } catch (error) {
    console.error("Error creating popisi_parcijalno:", error);
     return NextResponse.json({ error: "Error creating data" }, { status: 500 });
  }
}
