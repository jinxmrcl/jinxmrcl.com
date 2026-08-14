import { promises as fs } from "fs";
import path from "path";
import { generateId, generateToken } from "@/lib/id";
import { insertFile } from "@/lib/db";

export const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");
export const MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES) || 1.5 * 1024 * 1024 * 1024;

export const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/bmp": ".bmp",
  "image/svg+xml": ".svg",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "audio/mpeg": ".mp3",
  "audio/wav": ".wav",
  "audio/ogg": ".ogg",
  "text/plain": ".txt",
};

export function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3003").replace(/\/$/, "");
}

export function tooLargeMessage(): string {
  const maxGb = (MAX_UPLOAD_BYTES / (1024 * 1024 * 1024)).toFixed(1);
  return `File too large (max ${maxGb} GB)`;
}

export interface UploadResult {
  success: true;
  message: string;
  url: string;
  raw: string;
  deleteUrl: string;
  filename: string;
}

export async function finalizeUpload(params: {
  buffer: Buffer;
  originalName: string;
  mime: string;
  uploader: string;
  ip: string;
}): Promise<UploadResult> {
  const { buffer, originalName, mime, uploader, ip } = params;

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  const id = generateId(8);
  const fallbackExt = path.extname(originalName).toLowerCase().slice(0, 10);
  const extension = EXTENSION_BY_MIME[mime] || fallbackExt || ".bin";
  const storedName = `${id}${extension}`;
  const filePath = path.join(UPLOAD_DIR, storedName);

  await fs.writeFile(filePath, buffer);

  const deleteToken = generateToken();

  await insertFile({
    id,
    stored_name: storedName,
    original_name: originalName || storedName,
    mime: mime || "application/octet-stream",
    size: buffer.byteLength,
    uploader,
    delete_token: deleteToken,
    created_at: Date.now(),
    upload_ip: ip,
  });

  const base = siteUrl();
  const isMedia = mime.startsWith("video/") || mime.startsWith("audio/");
  const rawUrl = `${base}/raw/${storedName}`;

  return {
    success: true,
    message: "Upload successful",
    url: isMedia ? rawUrl : `${base}/${id}`,
    raw: rawUrl,
    deleteUrl: `${base}/api/delete/${id}?token=${deleteToken}`,
    filename: storedName,
  };
}
