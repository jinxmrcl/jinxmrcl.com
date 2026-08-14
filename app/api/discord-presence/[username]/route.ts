import { NextResponse } from "next/server";
import { getUserProfile, getDiscordPresence } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const profile = await getUserProfile(username);
  if (!profile?.discordId) {
    return NextResponse.json({ success: false, message: "No linked Discord account" }, { status: 404 });
  }

  const presence = await getDiscordPresence(profile.discordId);
  return NextResponse.json({
    success: true,
    presence: presence ?? { status: "offline", customStatusText: null, customStatusEmoji: null, customStatusEmojiId: null, customStatusEmojiAnimated: false, updatedAt: 0 },
  });
}
