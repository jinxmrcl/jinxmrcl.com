import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { resolveAppeal, unbanUser } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await requireApiRole("staff");
  if (auth instanceof NextResponse) return auth;

  let body: { appealId?: number; username?: string; decision?: "approved" | "denied" };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const { appealId, username, decision } = body;
  if (!appealId || !username || (decision !== "approved" && decision !== "denied")) {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  await resolveAppeal(appealId, decision, auth.user);
  if (decision === "approved") {
    await unbanUser(username);
  }

  return NextResponse.json({ success: true });
}
