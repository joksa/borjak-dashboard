import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const liflet_id = searchParams.get('liflet_id')

    if (!liflet_id) {
      return NextResponse.json(
        { error: 'liflet_id parameter is required' },
        { status: 400 }
      )
    }

    const detalji = await prisma.liflet_detalji.findMany({
      where: {
        liflet_id: parseInt(liflet_id)
      },
      include: {
        artikli: {
          select: {
            Id_Artikal: true,
            DESCRIPTION: true,
            BAR_CODE: true
          }
        },
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true,
            PIB: true
          }
        }
      },
      orderBy: {
        id: 'asc'
      }
    })

    return NextResponse.json({
      data: detalji
    })
  } catch (error) {
    console.error('Error fetching liflet detalji:', error)
    return NextResponse.json(
      { error: 'Failed to fetch liflet detalji' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { liflet_id, Id_artikal, ID_Klijent, cena_akcija, cena_redovna } = body

    const detalj = await prisma.liflet_detalji.create({
      data: {
        liflet_id: parseInt(liflet_id),
        Id_artikal: parseInt(Id_artikal),
        ID_Klijent: ID_Klijent ? parseInt(ID_Klijent) : null,
        cena_akcija: cena_akcija ? parseFloat(cena_akcija) : null,
        cena_redovna: cena_redovna ? parseFloat(cena_redovna) : null
      },
      include: {
        artikli: {
          select: {
            Id_Artikal: true,
            DESCRIPTION: true,
            BAR_CODE: true
          }
        },
        klijenti: {
          select: {
            ID_Klijent: true,
            Naziv: true,
            PIB: true
          }
        }
      }
    })

    return NextResponse.json(detalj)
  } catch (error) {
    console.error('Error creating liflet detalji:', error)
    return NextResponse.json(
      { error: 'Failed to create liflet detalji' },
      { status: 500 }
    )
  }
}
