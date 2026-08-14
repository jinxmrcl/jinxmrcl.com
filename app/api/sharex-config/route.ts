import { NextResponse } from "next/server";
import { resolveUploader } from "@/lib/auth";

function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3003").replace(/\/$/, "");
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");

  const user = await resolveUploader(request);
  if (!user || !key) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const siteName = process.env.SITE_NAME || "jinxmrcl";

  const config = {
    Version: "17.1.0",
    Name: `${siteName} (${user})`,
    DestinationType: "ImageUploader, FileUploader",
    RequestMethod: "POST",
    RequestURL: `${siteUrl()}/api/upload`,
    Body: "MultipartFormData",
    Arguments: {
      key: key,
    },
    FileFormName: "file",
    URL: "{json:url}",
    ThumbnailURL: "{json:raw}",
    DeletionURL: "{json:deleteUrl}",
    ErrorMessage: "{json:message}",
  };

  return new NextResponse(JSON.stringify(config, null, 2), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${siteName}-${user}.sxcu"`,
    },
  });
}
