import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { deleteFile, getFile } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const record = await getFile(id);
  if (!record) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  if (record.uploader !== user) {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  await fs.rm(path.join(UPLOAD_DIR, record.stored_name), { force: true });
  await deleteFile(id);

  return NextResponse.json({ success: true });
}
