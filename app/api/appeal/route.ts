import { NextResponse } from "next/server";
import { verifyCredentials, createAppeal } from "@/lib/db";
import { getClientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = rateLimit(`appeal:${getClientIp(request)}`, 8, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many attempts, please try again later" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { username?: string; password?: string; message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const { username, password, message } = body;
  if (!username || !password || !(await verifyCredentials(username, password))) {
    return NextResponse.json({ success: false, message: "Invalid credentials" }, { status: 401 });
  }

  if (!message || message.trim().length < 5) {
    return NextResponse.json({ success: false, message: "Please explain your appeal" }, { status: 400 });
  }

  await createAppeal(username, message.trim().slice(0, 2000));
  return NextResponse.json({ success: true });
}
