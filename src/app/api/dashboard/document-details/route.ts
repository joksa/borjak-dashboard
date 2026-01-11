import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const godina = searchParams.get("godina");
    const tip = searchParams.get("tip");
    const broj = searchParams.get("broj");
    const objekat = searchParams.get("objekat");

    if (!godina || !tip || !broj || !objekat) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const details: any[] = await prisma.$queryRaw`
      SELECT 
        dd.dd_sifra,
        a.DESCRIPTION,
        dd.dd_barkod,
        dd.dd_kol1,
        dd.dd_kol2,
        dd.dd_kol3
      FROM dok_detalji dd
      LEFT JOIN artikli a ON (dd.dd_sifra COLLATE utf8mb4_general_ci) = (CAST(a.Id_Artikal AS CHAR) COLLATE utf8mb4_general_ci)
      WHERE (dd.dd_godina COLLATE utf8mb4_general_ci) = ${godina}
        AND (dd.dd_tip COLLATE utf8mb4_general_ci) = ${tip}
        AND (dd.dd_broj COLLATE utf8mb4_general_ci) = ${broj}
        AND (dd.dd_obj1 COLLATE utf8mb4_general_ci) = ${objekat}
    `;

    return NextResponse.json({ success: true, data: details });
  } catch (error) {
    console.error("Error fetching document details:", error);
    return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
  }
}
