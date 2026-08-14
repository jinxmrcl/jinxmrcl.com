import path from "path";
import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/db";
import { serveFileWithRange } from "@/lib/range-serve";

const PROFILE_MUSIC_DIR = path.join(process.cwd(), "data", "profile-music");

const mimeByExtension: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".wav": "audio/wav",
};

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const profile = await getUserProfile(username);
  if (!profile?.profileMusic) {
    return NextResponse.json({ success: false, message: "No music" }, { status: 404 });
  }

  const ext = path.extname(profile.profileMusic);
  const filePath = path.join(PROFILE_MUSIC_DIR, profile.profileMusic);

  return serveFileWithRange(request, filePath, mimeByExtension[ext] || "application/octet-stream");
}
