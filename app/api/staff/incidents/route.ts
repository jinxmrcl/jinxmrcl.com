import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { createIncident, type IncidentSeverity } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";

const SERVICES = ["Website", "Database", "Upload API", "Image Delivery"] as const;

export async function POST(request: Request) {
  const auth = await requireApiRole("owner");
  if (auth instanceof NextResponse) return auth;

  const limit = rateLimit(`incident-create:${auth.user}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many incidents created, please slow down" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { title?: string; message?: string; severity?: string; service?: string | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const title = body.title?.trim().slice(0, 255);
  const message = body.message?.trim().slice(0, 2000);
  const severity: IncidentSeverity = body.severity === "down" ? "down" : "degraded";
  const service = body.service && (SERVICES as readonly string[]).includes(body.service) ? body.service : null;

  if (!title || title.length < 3) {
    return NextResponse.json({ success: false, message: "Please provide a title" }, { status: 400 });
  }
  if (!message || message.length < 3) {
    return NextResponse.json({ success: false, message: "Please provide a message" }, { status: 400 });
  }

  await createIncident(title, message, severity, service, auth.user);
  return NextResponse.json({ success: true });
}
