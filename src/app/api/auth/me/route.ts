import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const jwtPass = process.env.JWT_PASS;
    if (!jwtPass) {
       console.error("JWT_PASS is not defined");
       return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }
    const secret = new TextEncoder().encode(jwtPass);

    const { payload } = await jwtVerify(token, secret);

    return NextResponse.json({
      user: {
        id: payload.id,
        username: payload.username,
        level: payload.level,
        prodavnica: payload.prodavnica,
      },
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}
