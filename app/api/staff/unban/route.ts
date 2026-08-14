import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { unbanUser } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await requireApiRole("staff");
  if (auth instanceof NextResponse) return auth;

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  if (!body.username) {
    return NextResponse.json({ success: false, message: "Missing username" }, { status: 400 });
  }

  await unbanUser(body.username);
  return NextResponse.json({ success: true });
}
