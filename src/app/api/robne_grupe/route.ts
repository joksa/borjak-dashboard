
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const data = await prisma.$queryRaw`
      SELECT ID_Robna_Grupa, Naziv 
      FROM robne_grupe 
      ORDER BY Naziv
    `;
    
    // Serialize BigInt if any (though ID_Robna_Grupa is likely int)
    const serializedData = JSON.parse(JSON.stringify(data, (key, value) =>
      typeof value === 'bigint'
        ? value.toString()
        : value
    ));

    return NextResponse.json({ data: serializedData });
  } catch (error) {
    console.error("Error fetching robne_grupe:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}
