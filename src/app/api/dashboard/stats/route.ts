import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const currentYear = new Date().getFullYear().toString();

    // 1. Top Operateri
    const topOperateri: any[] = await prisma.$queryRaw`
      SELECT 
        o.op_ime_prezime,
        COUNT(d.dd_auto) as total_records,
        COUNT(DISTINCT DATE(d.created_at)) as days_worked,
        CAST(COUNT(d.dd_auto) / COUNT(DISTINCT DATE(d.created_at)) AS DECIMAL(10,2)) as daily_average
      FROM operateri o
      JOIN dok_detalji d ON o.op_id = d.dd_op_id
      WHERE d.dd_godina = ${currentYear}
      GROUP BY o.op_id, o.op_ime_prezime
      ORDER BY total_records DESC
      LIMIT 100
    `;

    // 2. Last 50 Documents
    const lastDocuments: any[] = await prisma.$queryRaw`
      SELECT 
        d.dok_godina,
        d.dok_tip, 
        d.dok_broj, 
        d.dok_klijent, 
        k.Naziv as klijent_naziv,
        d.dok_datum, 
        d.dok_vreme, 
        d.dok_obj1, 
        d.dok_obj2, 
        o.op_ime_prezime as operater_naziv,
        d.created_at,
        (SELECT COUNT(*) FROM dok_detalji dd 
         WHERE dd.dd_godina = d.dok_godina 
           AND dd.dd_tip = d.dok_tip 
           AND dd.dd_broj = d.dok_broj 
           AND dd.dd_obj1 = d.dok_obj1) as stavki
      FROM dok_zaglavlje d
      LEFT JOIN operateri o ON d.dok_radnik = o.op_id
      LEFT JOIN klijenti k ON d.dok_klijent = k.ID_Klijent
      ORDER BY d.created_at DESC
      LIMIT 100
    `;

    // 3. Sync Status (Fiskalni) - Fetching latest for current year
    const syncStatus: any[] = await prisma.$queryRaw`
      SELECT 
        p.ID_Prodavnica as id,
        p.Naziv as naziv,
        fz.datum,
        fz.vreme,
        (CAST(fz.got AS DECIMAL(15,2)) + CAST(fz.kar AS DECIMAL(15,2)) + CAST(fz.cek AS DECIMAL(15,2)) + 
         CAST(fz.virman AS DECIMAL(15,2)) + CAST(fz.vaucer AS DECIMAL(15,2)) + CAST(fz.instant AS DECIMAL(15,2)) + 
         CAST(fz.drugo AS DECIMAL(15,2))) as total_value
      FROM prodavnice p
      JOIN (
        SELECT id_prodavnica, MAX(id_fz) as max_id
        FROM fiskalni_zaglavlje
        WHERE YEAR(STR_TO_DATE(datum, '%d/%m/%Y')) = ${new Date().getFullYear()}
        GROUP BY id_prodavnica
      ) latest ON p.ID_Prodavnica = latest.id_prodavnica
      JOIN fiskalni_zaglavlje fz ON latest.max_id = fz.id_fz
      ORDER BY p.ID_Prodavnica ASC
    `;

    // Helper to serialize BigInt and other Prisma-specific types
    const serialize = (data: any) =>
      JSON.parse(
        JSON.stringify(data, (key, value) =>
          typeof value === "bigint" ? value.toString() : value
        )
      );

    return NextResponse.json({
      success: true,
      data: {
        topOperateri: serialize(topOperateri),
        lastDocuments: serialize(lastDocuments),
        syncStatus: serialize(syncStatus),
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}
