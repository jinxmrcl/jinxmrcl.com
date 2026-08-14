import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { resolveReport } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await requireApiRole("staff");
  if (auth instanceof NextResponse) return auth;

  let body: { reportId?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  if (!body.reportId) {
    return NextResponse.json({ success: false, message: "Missing reportId" }, { status: 400 });
  }

  await resolveReport(body.reportId, auth.user);
  return NextResponse.json({ success: true });
}
