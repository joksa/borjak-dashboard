import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { SignJWT } from "jose";
import { cookies } from "next/headers";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: "Korisničko ime i lozinka su obavezni" },
        { status: 400 }
      );
    }

    const user = await prisma.korisnici.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Neispravni podaci" },
        { status: 401 }
      );
    }

    if (!user.active) {
      return NextResponse.json(
        { error: "Nalog nije aktivan" },
        { status: 403 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || "");

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Neispravni podaci" },
        { status: 401 }
      );
    }

    // Generate JWT Token
    // Generate JWT Token
    const jwtPass = process.env.JWT_PASS;
    if (!jwtPass) {
      console.error("JWT_PASS is not defined in environment variables");
      throw new Error("JWT_PASS configuration missing");
    }
    const secret = new TextEncoder().encode(jwtPass);
    console.log("Secret length: ", secret.length);
    const token = await new SignJWT({ 
      id: user.id_korisnik, 
      username: user.username,
      level: user.level,
      prodavnica: user.prodavnica
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(process.env.TOKEN_EXPIRE || "90d")
      .sign(secret);

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 90, // 90 days in seconds
      path: "/",
    });
    
    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id_korisnik, 
        username: user.username,
        level: user.level,
        prodavnica: user.prodavnica
      } 
    });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
