import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const to = formData.get("to") as string;
    const subject = formData.get("subject") as string;
    const text = formData.get("text") as string;
    const html = formData.get("html") as string;

    if (!to || !subject || (!text && !html)) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Extract attachments
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("attachment_") && value instanceof File) {
        const buffer = Buffer.from(await value.arrayBuffer());
        attachments.push({
          filename: value.name,
          content: buffer,
          contentType: value.type,
        });
      }
    }

    // Debug SMTP config
    console.log("SMTP Config:", {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER,
      passLength: process.env.SMTP_PASS?.length,
    });

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${process.env.FROM_NAME}" <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      text,
      html,
      attachments,
    });

    console.log("Message sent: %s", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
