import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserRole, roleAtLeast, type Role } from "@/lib/db";

export async function getCurrentUserAndRole(): Promise<{ user: string; role: Role } | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const role = await getUserRole(user);
  return { user, role };
}

export async function requireRole(min: Role): Promise<{ user: string; role: Role }> {
  const ctx = await getCurrentUserAndRole();
  if (!ctx) redirect("/login");
  if (!roleAtLeast(ctx.role, min)) redirect("/dashboard");
  return ctx;
}

export async function requireApiRole(min: Role): Promise<{ user: string } | NextResponse> {
  const ctx = await getCurrentUserAndRole();
  if (!ctx) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  if (!roleAtLeast(ctx.role, min)) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }
  return { user: ctx.user };
}
