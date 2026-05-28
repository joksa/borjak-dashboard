import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const liflet_id = searchParams.get('liflet_id')

    if (!liflet_id) {
      return NextResponse.json({ error: 'liflet_id is required' }, { status: 400 })
    }

    const cene = await prisma.liflet_grupna_cena.findMany({
      where: { liflet_id: parseInt(liflet_id) },
    })

    return NextResponse.json({ data: cene })
  } catch (error) {
    console.error('Error fetching grupna cena:', error)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { liflet_id, ID_Klijent, cena } = body

    if (!liflet_id || !ID_Klijent || cena === undefined || cena === null || cena === '') {
      return NextResponse.json({ error: 'liflet_id, ID_Klijent and cena are required' }, { status: 400 })
    }

    const record = await prisma.liflet_grupna_cena.upsert({
      where: {
        liflet_id_ID_Klijent: {
          liflet_id: parseInt(liflet_id),
          ID_Klijent: parseInt(ID_Klijent),
        },
      },
      update: { cena: parseFloat(cena) },
      create: {
        liflet_id: parseInt(liflet_id),
        ID_Klijent: parseInt(ID_Klijent),
        cena: parseFloat(cena),
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error upserting grupna cena:', error)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const liflet_id = searchParams.get('liflet_id')
    const ID_Klijent = searchParams.get('ID_Klijent')

    if (!liflet_id || !ID_Klijent) {
      return NextResponse.json({ error: 'liflet_id and ID_Klijent are required' }, { status: 400 })
    }

    await prisma.liflet_grupna_cena.deleteMany({
      where: {
        liflet_id: parseInt(liflet_id),
        ID_Klijent: parseInt(ID_Klijent),
      },
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error deleting grupna cena:', error)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
