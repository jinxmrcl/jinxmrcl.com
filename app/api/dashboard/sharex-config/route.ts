import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getUserApiKey } from "@/lib/db";

function siteUrl() {
  return (process.env.SITE_URL || "http://localhost:3003").replace(/\/$/, "");
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const apiKey = await getUserApiKey(user);
  if (!apiKey) {
    return NextResponse.json({ success: false, message: "No API key" }, { status: 404 });
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
      key: apiKey,
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
