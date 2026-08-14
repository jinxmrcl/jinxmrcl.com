import { NextResponse } from "next/server";
import { fetch as undiciFetch } from "undici";
import { resolveUploader } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";
import { MAX_UPLOAD_BYTES, tooLargeMessage, finalizeUpload } from "@/lib/upload";
import { ssrfSafeAgent } from "@/lib/ssrf-guard";

const FETCH_TIMEOUT_MS = 20000;

export async function POST(request: Request) {
  const uploader = await resolveUploader(request);
  if (!uploader) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const limit = rateLimit(`upload-url:${uploader}`, 20, 60 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { success: false, message: "Too many URL uploads, please slow down" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let body: { url?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(body.url ?? "");
  } catch {
    return NextResponse.json({ success: false, message: "Please provide a valid URL" }, { status: 400 });
  }

  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ success: false, message: "Only http/https URLs are supported" }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = (await undiciFetch(target, {
      dispatcher: ssrfSafeAgent,
      redirect: "manual",
      signal: controller.signal,
      headers: { "User-Agent": "jinxmrcl-url-upload/1.0" },
    })) as unknown as Response;
  } catch {
    return NextResponse.json({ success: false, message: "Could not fetch that URL" }, { status: 400 });
  } finally {
    clearTimeout(timeout);
  }

  if (response.status >= 300 && response.status < 400) {
    return NextResponse.json(
      { success: false, message: "Redirects aren't supported, please use the direct file link" },
      { status: 400 }
    );
  }

  if (!response.ok || !response.body) {
    return NextResponse.json({ success: false, message: "That URL did not return a file" }, { status: 400 });
  }

  const contentLength = Number(response.headers.get("content-length") || "0");
  if (contentLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ success: false, message: tooLargeMessage() }, { status: 413 });
  }

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_UPLOAD_BYTES) {
      await reader.cancel();
      return NextResponse.json({ success: false, message: tooLargeMessage() }, { status: 413 });
    }
    chunks.push(value);
  }

  if (total === 0) {
    return NextResponse.json({ success: false, message: "That URL returned no data" }, { status: 400 });
  }

  const buffer = Buffer.concat(chunks);
  const mime = response.headers.get("content-type")?.split(";")[0].trim() || "application/octet-stream";
  const originalName = decodeURIComponent(target.pathname.split("/").pop() || "download") || "download";

  const result = await finalizeUpload({
    buffer,
    originalName,
    mime,
    uploader,
    ip: getClientIp(request),
  });

  return NextResponse.json(result);
}
