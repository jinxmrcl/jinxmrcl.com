import { NextResponse } from "next/server";
import { getFile, createReport } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getClientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limit = rateLimit(`report:${ip}`, 10, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many reports, please try again later" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { fileId?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const { fileId, reason } = body;
  if (!fileId || !reason || reason.trim().length < 3) {
    return NextResponse.json({ success: false, message: "Please provide a reason" }, { status: 400 });
  }

  const file = await getFile(fileId);
  if (!file) {
    return NextResponse.json({ success: false, message: "File not found" }, { status: 404 });
  }

  const user = await getCurrentUser();
  await createReport(fileId, user, ip, reason.trim().slice(0, 1000));

  return NextResponse.json({ success: true });
}
