import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserProfile, setUserProfileMusic, setUserProfileMusicVolume } from "@/lib/db";
import { transcodeProfileAudio } from "@/lib/transcode";

const PROFILE_MUSIC_DIR = path.join(process.cwd(), "data", "profile-music");
const MAX_SIZE = 15 * 1024 * 1024;

const extensionByMime: Record<string, string> = {
  "audio/mpeg": ".mp3",
  "audio/ogg": ".ogg",
  "audio/wav": ".wav",
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
    return NextResponse.json({ success: false, message: "Unsupported audio type (mp3, ogg or wav only)" }, { status: 415 });
  }
  if (uploadedFile.size > MAX_SIZE) {
    return NextResponse.json({ success: false, message: "Audio too large (max 15MB)" }, { status: 413 });
  }

  await fs.mkdir(PROFILE_MUSIC_DIR, { recursive: true });

  const tempPath = path.join(PROFILE_MUSIC_DIR, `.tmp-${randomUUID()}${extension}`);
  const buffer = Buffer.from(await uploadedFile.arrayBuffer());
  await fs.writeFile(tempPath, buffer);

  const filename = `${user}-${Date.now()}.mp3`;
  try {
    await transcodeProfileAudio(tempPath, path.join(PROFILE_MUSIC_DIR, filename));
  } catch {
    return NextResponse.json({ success: false, message: "Could not process audio" }, { status: 400 });
  } finally {
    await fs.rm(tempPath, { force: true });
  }

  const profile = await getUserProfile(user);
  if (profile?.profileMusic) {
    await fs.rm(path.join(PROFILE_MUSIC_DIR, profile.profileMusic), { force: true });
  }

  await setUserProfileMusic(user, filename);

  return NextResponse.json({ success: true, filename });
}

export async function PATCH(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: { volume?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const volume = Math.round(Number(body.volume));
  if (!Number.isFinite(volume) || volume < 0 || volume > 100) {
    return NextResponse.json({ success: false, message: "Volume must be between 0 and 100" }, { status: 400 });
  }

  await setUserProfileMusicVolume(user, volume);
  return NextResponse.json({ success: true, volume });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const profile = await getUserProfile(user);
  if (profile?.profileMusic) {
    await fs.rm(path.join(PROFILE_MUSIC_DIR, profile.profileMusic), { force: true });
  }
  await setUserProfileMusic(user, null);

  return NextResponse.json({ success: true });
}
