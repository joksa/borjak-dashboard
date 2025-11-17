import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

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

    // Get file extension
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";

    // Create filename with Id_artikal
    const filename = `${idArtikal}.${fileExtension}`;

    // Ensure public directory exists
    const publicDir = join(process.cwd(), "public");
    const imagesDir = join(publicDir, "images");

    try {
      await mkdir(imagesDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, continue
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Write file to public/images directory
    const filepath = join(imagesDir, filename);
    await writeFile(filepath, buffer);

    // Return the relative path for database storage
    const imagePath = `/images/${filename}`;

    return NextResponse.json({
      success: true,
      filename: filename,
      path: imagePath
    });

  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
