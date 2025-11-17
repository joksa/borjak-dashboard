import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Prisma } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const sort = searchParams.get('sort') || 'datum_do'
    const order = searchParams.get('order') || 'desc'

    const offset = (page - 1) * limit

    const orderBy = {
      [sort]: order,
    } as Prisma.liflet_zaglavljeOrderByWithRelationInput

    const liflets = await prisma.liflet_zaglavlje.findMany({
      include: {
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true
          }
        }
      },
      orderBy,
      skip: offset,
      take: limit
    })

    const total = await prisma.liflet_zaglavlje.count()

    return NextResponse.json({
      data: liflets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching liflet zaglavlje:', error)
    return NextResponse.json(
      { error: 'Failed to fetch liflet zaglavlje' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { datum_od, datum_do, ID_Klijent, op_id } = body

    const liflet = await prisma.liflet_zaglavlje.create({
      data: {
        datum_od: new Date(datum_od),
        datum_do: new Date(datum_do),
        ID_Klijent: ID_Klijent ? parseInt(ID_Klijent) : null,
        op_id: op_id ? parseInt(op_id) : null
      },
      include: {
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true
          }
        }
      }
    })

    return NextResponse.json(liflet)
  } catch (error) {
    console.error('Error creating liflet zaglavlje:', error)
    return NextResponse.json(
      { error: 'Failed to create liflet zaglavlje' },
      { status: 500 }
    )
  }
}
