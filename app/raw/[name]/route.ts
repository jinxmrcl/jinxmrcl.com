import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import path from "path";
import { NextResponse } from "next/server";
import { getFileByStoredName } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export async function GET(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;

  if (name.includes("..") || name.includes("/")) {
    return NextResponse.json({ success: false, message: "Invalid filename" }, { status: 400 });
  }

  const record = await getFileByStoredName(name);

  if (!record) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  const filePath = path.join(UPLOAD_DIR, record.stored_name);

  let fileSize: number;
  try {
    fileSize = (await stat(filePath)).size;
  } catch {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const disposition = searchParams.get("download") !== null ? "attachment" : "inline";

  const baseHeaders = {
    "Content-Type": record.mime,
    "Content-Disposition": `${disposition}; filename="${encodeURIComponent(record.original_name)}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
  };

  const rangeHeader = request.headers.get("range");

  if (!rangeHeader) {
    const stream = Readable.toWeb(createReadStream(filePath)) as ReadableStream;
    return new NextResponse(stream, {
      status: 200,
      headers: { ...baseHeaders, "Content-Length": String(fileSize) },
    });
  }

  const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
  if (!match) {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${fileSize}` },
    });
  }

  let start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
    return new NextResponse(null, {
      status: 416,
      headers: { "Content-Range": `bytes */${fileSize}` },
    });
  }

  end = Math.min(end, fileSize - 1);
  const chunkSize = end - start + 1;

  const stream = Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream;

  return new NextResponse(stream, {
    status: 206,
    headers: {
      ...baseHeaders,
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Content-Length": String(chunkSize),
    },
  });
}
