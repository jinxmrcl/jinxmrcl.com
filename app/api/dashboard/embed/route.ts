import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getEmbedSettings, saveEmbedSettings, type EmbedSettings } from "@/lib/db";

const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const settings = await getEmbedSettings(user);
  return NextResponse.json({ success: true, settings });
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: Partial<EmbedSettings>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const color = body.color || "#ffffff";
  if (!COLOR_PATTERN.test(color)) {
    return NextResponse.json({ success: false, message: "Invalid color, must be #rrggbb" }, { status: 400 });
  }

  const settings: EmbedSettings = {
    color,
    siteName: (body.siteName || "").slice(0, 100),
    titleTemplate: (body.titleTemplate || "{filename}").slice(0, 255),
    descriptionTemplate: (body.descriptionTemplate || "").slice(0, 255),
  };

  await saveEmbedSettings(user, settings);
  return NextResponse.json({ success: true, settings });
}
