import { NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  checkPassword,
  createSessionToken,
} from "@/lib/admin-auth";
import { checkRateLimit, getClientKey, resetRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const clientKey = getClientKey(request);
  const { allowed, retryAfterSeconds } = checkRateLimit(clientKey);

  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives, réessaie plus tard" },
      { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
    );
  }

  const { password } = await request.json();

  if (typeof password !== "string" || !checkPassword(password)) {
    return NextResponse.json(
      { error: "Mot de passe incorrect" },
      { status: 401 }
    );
  }

  resetRateLimit(clientKey);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, createSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
