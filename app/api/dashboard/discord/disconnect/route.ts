import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { unlinkDiscordAccount } from "@/lib/db";

export async function POST() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  await unlinkDiscordAccount(user);
  return NextResponse.json({ success: true });
}
