import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { Id_klijent, dug, iznos, datum, valuta, napomena } = body

    const finansija = await prisma.liflet_finansije.update({
      where: { id: parseInt(id) },
      data: {
        Id_klijent: Id_klijent ? parseInt(Id_klijent) : null,
        dug: dug === "1" || dug === 1 || dug === true,
        iznos: parseFloat(iznos),
        datum: new Date(datum),
        valuta: valuta ? new Date(valuta) : null,
        napomena: napomena || null
      },
      include: {
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true,
            PIB: true,
            Adresa: true,
            Telefon: true
          }
        }
      }
    })

    return NextResponse.json(finansija)
  } catch (error) {
    console.error('Error updating liflet finansije:', error)
    return NextResponse.json(
      { error: 'Failed to update liflet finansije' },
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
    await prisma.liflet_finansije.delete({
      where: { id: parseInt(id) }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting liflet finansije:', error)
    return NextResponse.json(
      { error: 'Failed to delete liflet finansije' },
      { status: 500 }
    )
  }
}
