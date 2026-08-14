import { NextResponse } from "next/server";
import { resolveUploader } from "@/lib/auth";
import { getClientIp } from "@/lib/ip";
import { MAX_UPLOAD_BYTES, tooLargeMessage, finalizeUpload } from "@/lib/upload";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid form data" }, { status: 400 });
  }

  const formKey = formData.get("key");

  const uploader = await resolveUploader(request, typeof formKey === "string" ? formKey : null);
  if (!uploader) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const file = formData.get("file") ?? formData.get("sharex") ?? formData.get("upload");

  if (!file || typeof file === "string" || !("arrayBuffer" in file)) {
    return NextResponse.json({ success: false, message: "Missing file" }, { status: 400 });
  }

  const uploadedFile = file as File;

  if (uploadedFile.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ success: false, message: tooLargeMessage() }, { status: 413 });
  }

  const buffer = Buffer.from(await uploadedFile.arrayBuffer());

  const result = await finalizeUpload({
    buffer,
    originalName: uploadedFile.name,
    mime: uploadedFile.type,
    uploader,
    ip: getClientIp(request),
  });

  return NextResponse.json(result);
}
