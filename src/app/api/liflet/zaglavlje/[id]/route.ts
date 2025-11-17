import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)

    const liflet = await prisma.liflet_zaglavlje.findUnique({
      where: { id: parsedId },
      include: {
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true
          }
        }
      }
    })

    if (!liflet) {
      return NextResponse.json(
        { error: 'Liflet not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(liflet)
  } catch (error) {
    console.error('Error fetching liflet:', error)
    return NextResponse.json(
      { error: 'Failed to fetch liflet' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)
    const body = await request.json()
    const { datum_od, datum_do, ID_Klijent, op_id } = body

    const liflet = await prisma.liflet_zaglavlje.update({
      where: { id: parsedId },
      data: {
        datum_od: datum_od ? new Date(datum_od) : undefined,
        datum_do: datum_do ? new Date(datum_do) : undefined,
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
    console.error('Error updating liflet:', error)
    return NextResponse.json(
      { error: 'Failed to update liflet' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const parsedId = parseInt(id)

    await prisma.liflet_zaglavlje.delete({
      where: { id: parsedId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting liflet:', error)
    return NextResponse.json(
      { error: 'Failed to delete liflet' },
      { status: 500 }
    )
  }
}
