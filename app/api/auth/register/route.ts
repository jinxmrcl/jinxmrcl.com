import { NextResponse } from "next/server";
import { createUser, createSession, usernameExists } from "@/lib/db";
import { SESSION_COOKIE } from "@/lib/session";
import { getClientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";
import { isValidUsername } from "@/lib/username";

export async function POST(request: Request) {
  const limit = rateLimit(`register:${getClientIp(request)}`, 5, 60 * 60 * 1000);
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

  if (!username || !isValidUsername(username)) {
    return NextResponse.json(
      { success: false, message: "Username must be 3-32 characters (letters, numbers, _ or -) and not a reserved name" },
      { status: 400 }
    );
  }

  if (!password || password.length < 8) {
    return NextResponse.json(
      { success: false, message: "Password must be at least 8 characters" },
      { status: 400 }
    );
  }

  if (await usernameExists(username)) {
    return NextResponse.json({ success: false, message: "Username already taken" }, { status: 409 });
  }

  const user = await createUser(username, password);
  const token = await createSession(user.username);

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
