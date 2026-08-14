import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";
import { NextResponse } from "next/server";

export async function serveFileWithRange(
  request: Request,
  filePath: string,
  mime: string,
  extraHeaders: Record<string, string> = {}
): Promise<NextResponse> {
  let fileSize: number;
  try {
    fileSize = (await stat(filePath)).size;
  } catch {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  const baseHeaders = {
    "Content-Type": mime,
    "Cache-Control": "private, max-age=3600",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "sandbox",
    ...extraHeaders,
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
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${fileSize}` } });
  }

  const start = match[1] ? parseInt(match[1], 10) : 0;
  let end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= fileSize) {
    return new NextResponse(null, { status: 416, headers: { "Content-Range": `bytes */${fileSize}` } });
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
