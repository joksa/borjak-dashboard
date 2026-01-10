
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const data = await prisma.operateri.findMany({
      orderBy: {
        op_ime_prezime: "asc",
      },
    });
    
    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error fetching operateri:", error);
    return NextResponse.json(
      { error: "Error fetching data" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { op_ime_prezime, op_lozinka, op_aktivan, op_objekat } = body;

    const newItem = await prisma.operateri.create({
      data: {
        op_ime_prezime,
        op_lozinka,
        op_aktivan: Number(op_aktivan),
        op_objekat,
      }
    });

    return NextResponse.json({ success: true, data: newItem });
  } catch (error) {
    console.error("Error creating operater:", error);
    return NextResponse.json({ error: "Error creating data" }, { status: 500 });
  }
}
