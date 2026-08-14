import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { deleteFile, getFile } from "@/lib/db";
import { timingSafeEqual } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

function safeEqual(a: string, b: string) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

async function handleDelete(request: Request, id: string) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const record = await getFile(id);

  if (!record) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  if (!token || !safeEqual(token, record.delete_token)) {
    return NextResponse.json({ success: false, message: "Invalid delete token" }, { status: 403 });
  }

  await fs.rm(path.join(UPLOAD_DIR, record.stored_name), { force: true });
  await deleteFile(id);

  return NextResponse.json({ success: true });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleDelete(request, id);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return handleDelete(request, id);
}
