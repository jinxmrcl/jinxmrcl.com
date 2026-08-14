import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserProfile, setUserProfileVideo } from "@/lib/db";
import { transcodeProfileVideo } from "@/lib/transcode";

const PROFILE_VIDEO_DIR = path.join(process.cwd(), "data", "profile-video");
const MAX_SIZE = 50 * 1024 * 1024;

const extensionByMime: Record<string, string> = {
  "video/mp4": ".mp4",
  "video/webm": ".webm",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ success: false, message: "Missing file" }, { status: 400 });
  }

  const uploadedFile = file as File;
  const extension = extensionByMime[uploadedFile.type];
  if (!extension) {
    return NextResponse.json({ success: false, message: "Unsupported video type (mp4 or webm only)" }, { status: 415 });
  }
  if (uploadedFile.size > MAX_SIZE) {
    return NextResponse.json({ success: false, message: "Video too large (max 50MB)" }, { status: 413 });
  }

  await fs.mkdir(PROFILE_VIDEO_DIR, { recursive: true });

  const tempPath = path.join(PROFILE_VIDEO_DIR, `.tmp-${randomUUID()}${extension}`);
  const buffer = Buffer.from(await uploadedFile.arrayBuffer());
  await fs.writeFile(tempPath, buffer);

  const filename = `${user}-${Date.now()}.mp4`;
  try {
    await transcodeProfileVideo(tempPath, path.join(PROFILE_VIDEO_DIR, filename));
  } catch {
    return NextResponse.json({ success: false, message: "Could not process video" }, { status: 400 });
  } finally {
    await fs.rm(tempPath, { force: true });
  }

  const profile = await getUserProfile(user);
  if (profile?.profileVideo) {
    await fs.rm(path.join(PROFILE_VIDEO_DIR, profile.profileVideo), { force: true });
  }

  await setUserProfileVideo(user, filename);

  return NextResponse.json({ success: true, filename });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(user);
  if (profile?.profileVideo) {
    await fs.rm(path.join(PROFILE_VIDEO_DIR, profile.profileVideo), { force: true });
  }
  await setUserProfileVideo(user, null);

  return NextResponse.json({ success: true });
}
