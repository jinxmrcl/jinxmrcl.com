import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { banUser, getUserRole, roleAtLeast } from "@/lib/db";

export async function POST(request: Request) {
  const auth = await requireApiRole("staff");
  if (auth instanceof NextResponse) return auth;

  let body: { username?: string; reason?: string; durationHours?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const { username, reason, durationHours } = body;
  if (!username || !reason) {
    return NextResponse.json({ success: false, message: "Missing username or reason" }, { status: 400 });
  }

  const targetRole = await getUserRole(username);
  if (roleAtLeast(targetRole, "staff")) {
    return NextResponse.json(
      { success: false, message: "Cannot ban staff, admin, or owner accounts" },
      { status: 403 }
    );
  }

  const unbanDate = durationHours ? Date.now() + durationHours * 60 * 60 * 1000 : null;
  await banUser(username, auth.user, reason, unbanDate);

  return NextResponse.json({ success: true });
}
