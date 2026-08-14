import path from "path";
import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/db";
import { serveFileWithRange } from "@/lib/range-serve";

const PROFILE_VIDEO_DIR = path.join(process.cwd(), "data", "profile-video");

const mimeByExtension: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const profile = await getUserProfile(username);
  if (!profile?.profileVideo) {
    return NextResponse.json({ success: false, message: "No video" }, { status: 404 });
  }

  const ext = path.extname(profile.profileVideo);
  const filePath = path.join(PROFILE_VIDEO_DIR, profile.profileVideo);

  return serveFileWithRange(request, filePath, mimeByExtension[ext] || "application/octet-stream");
}
