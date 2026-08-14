import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getUserProfile } from "@/lib/db";

const AVATAR_DIR = path.join(process.cwd(), "data", "avatars");

const mimeByExtension: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

export async function GET(request: Request, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;

  const profile = await getUserProfile(username);
  if (!profile?.avatar) {
    return NextResponse.json({ success: false, message: "No avatar" }, { status: 404 });
  }

  const filePath = path.join(AVATAR_DIR, profile.avatar);
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  const ext = path.extname(profile.avatar);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": mimeByExtension[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "sandbox",
    },
  });
}
