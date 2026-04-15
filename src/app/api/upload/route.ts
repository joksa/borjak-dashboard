import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { readdirSync } from "fs";

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get("file") as unknown as File;
    const idArtikal: string | null = data.get("idArtikal") as string;

    if (!file || !idArtikal) {
      return NextResponse.json(
        { error: "File and Id_artikal are required" },
        { status: 400 }
      );
    }

    // Validate file type (only images)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    // Include timestamp so the filename changes on every upload — busts browser cache
    const filename = `${idArtikal}_${Date.now()}.${fileExtension}`;

    const storageDir = process.env.NODE_ENV === 'production'
      ? '/app/storage'
      : join(process.cwd(), 'storage');

    await mkdir(storageDir, { recursive: true });

    // Delete any previous files for this idArtikal (same prefix, any extension/timestamp)
    try {
      const existing = readdirSync(storageDir).filter(
        (f) => f.startsWith(`${idArtikal}_`) || f.startsWith(`${idArtikal}.`)
      );
      await Promise.all(
        existing.map((f) => unlink(join(storageDir, f)).catch(() => {}))
      );
    } catch {
      // storage dir may not exist yet — ignore
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(join(storageDir, filename), buffer);

    return NextResponse.json({ success: true, filename });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
