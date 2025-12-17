
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.dok_zaglavlje.findFirst({
        where: { dok_id: BigInt(id) }
    });

    if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.dok_status === 2) {
        return NextResponse.json({ error: "Cannot delete finished item" }, { status: 403 });
    }

    await prisma.dok_zaglavlje.delete({
        where: { dok_id: BigInt(id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting popisi_parcijalno:", error);
    return NextResponse.json({ error: "Error deleting item" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dok_datum, dok_obj1, dok_opis, dok_status } = body;

    const item = await prisma.dok_zaglavlje.findFirst({
        where: { dok_id: BigInt(id) }
    });

    if (!item) {
        return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    if (item.dok_status === 2) {
        // If it's already finished, we can't edit it. 
        // Unless we are allowing unlocking (changing status back to 1)?
        // The user said "if dok_status is 2, block EDIT/Delete". Implies strict blocking.
        return NextResponse.json({ error: "Cannot edit finished item" }, { status: 403 });
    }

    // Update
    // Note: Changing dok_datum might change dok_godina, which complicates the unique key. 
    // Ideally we shouldn't change the year easily or we need to recalculate dok_broj or ensure it doesn't conflict.
    // For simplicity, let's assume year stays same or handle it.
    // If year changes, we might have a collision on dok_broj?
    // Let's just update fields. Prisma will throw if unique constraint violated.
    
    // We update:
    const updateData: any = {};
    if (dok_datum) updateData.dok_datum = new Date(dok_datum);
    if (dok_obj1) updateData.dok_obj1 = dok_obj1;
    if (dok_opis) updateData.dok_opis = dok_opis;
    if (dok_status) updateData.dok_status = Number(dok_status);

    await prisma.dok_zaglavlje.update({
        where: { dok_id: BigInt(id) },
        data: updateData
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating popisi_parcijalno:", error);
    return NextResponse.json({ error: "Error updating item" }, { status: 500 });
  }
}
