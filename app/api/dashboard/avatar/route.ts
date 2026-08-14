import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserProfile, setUserAvatar } from "@/lib/db";

const AVATAR_DIR = path.join(process.cwd(), "data", "avatars");
const MAX_SIZE = 5 * 1024 * 1024;

const extensionByMime: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
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
    return NextResponse.json({ success: false, message: "Unsupported image type" }, { status: 415 });
  }
  if (uploadedFile.size > MAX_SIZE) {
    return NextResponse.json({ success: false, message: "Image too large (max 5MB)" }, { status: 413 });
  }

  await fs.mkdir(AVATAR_DIR, { recursive: true });

  const profile = await getUserProfile(user);
  if (profile?.avatar) {
    await fs.rm(path.join(AVATAR_DIR, profile.avatar), { force: true });
  }

  const filename = `${user}-${Date.now()}${extension}`;
  const buffer = Buffer.from(await uploadedFile.arrayBuffer());
  await fs.writeFile(path.join(AVATAR_DIR, filename), buffer);

  await setUserAvatar(user, filename);

  return NextResponse.json({ success: true, avatar: filename });
}
