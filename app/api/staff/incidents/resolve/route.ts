import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { resolveIncident } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await requireApiRole("owner");
  if (auth instanceof NextResponse) return auth;

  let body: { id?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  if (!body.id) {
    return NextResponse.json({ success: false, message: "Missing id" }, { status: 400 });
  }

  await resolveIncident(body.id);
  return NextResponse.json({ success: true });
}
