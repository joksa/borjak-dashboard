
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const groupId = searchParams.get("groupId");

        if (!groupId) {
            return NextResponse.json({ data: [] });
        }

        const data = await prisma.$queryRaw`
      SELECT ID_Podgrupa, ID_Robna_Grupa, Naziv 
      FROM robne_grupe_podgrupe 
      WHERE ID_Robna_Grupa = ${groupId}
      ORDER BY Naziv
    `;

        const serializedData = JSON.parse(JSON.stringify(data, (key, value) =>
            typeof value === 'bigint'
                ? value.toString()
                : value
        ));

        return NextResponse.json({ data: serializedData });
    } catch (error) {
        console.error("Error fetching podgrupe:", error);
        return NextResponse.json(
            { error: "Error fetching data" },
            { status: 500 }
        );
    }
}
