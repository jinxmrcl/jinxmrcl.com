import { NextResponse } from "next/server";
import { verifyCredentials, createSession, getBanInfo, setLastIp } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";
import { getClientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`login:${ip}`, 8, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many attempts, please try again later" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { username?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const { username, password } = body;
  if (!username || !password || !(await verifyCredentials(username, password))) {
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }

  const ban = await getBanInfo(username);
  if (ban.banned) {
    return NextResponse.json({ success: false, banned: true, ban }, { status: 403 });
  }

  await setLastIp(username, ip);

  const token = await createSession(username);
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  return response;
}
