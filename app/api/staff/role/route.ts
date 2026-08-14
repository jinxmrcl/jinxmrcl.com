import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { setUserRole, getUserRole } from "@/lib/db";

const ASSIGNABLE_ROLES = ["admin", "staff", "user"] as const;

export async function POST(request: Request) {
  const auth = await requireApiRole("owner");
  if (auth instanceof NextResponse) return auth;

  let body: { username?: string; role?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const { username, role } = body;
  if (!username || !role || !(ASSIGNABLE_ROLES as readonly string[]).includes(role)) {
    return NextResponse.json({ success: false, message: "Invalid role" }, { status: 400 });
  }

  const currentRole = await getUserRole(username);
  if (currentRole === "owner") {
    return NextResponse.json({ success: false, message: "Cannot change the owner's role" }, { status: 403 });
  }

  await setUserRole(username, role as "admin" | "staff" | "user");
  return NextResponse.json({ success: true });
}
