import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { requireApiRole } from "@/lib/roles";
import { getFile, deleteFile } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function POST(request: Request) {
  const auth = await requireApiRole("staff");
  if (auth instanceof NextResponse) return auth;

  let body: { fileId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  if (!body.fileId) {
    return NextResponse.json({ success: false, message: "Missing fileId" }, { status: 400 });
  }

  const record = await getFile(body.fileId);
  if (!record) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  await fs.rm(path.join(UPLOAD_DIR, record.stored_name), { force: true });
  await deleteFile(body.fileId);

  return NextResponse.json({ success: true });
}
