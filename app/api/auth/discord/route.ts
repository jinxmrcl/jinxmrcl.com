import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { discordAuthorizeUrl, DISCORD_CLIENT_ID } from "@/lib/discord";

export async function GET() {
  if (!DISCORD_CLIENT_ID) {
    return NextResponse.json({ success: false, message: "Discord integration is not configured" }, { status: 503 });
  }

  const state = randomBytes(24).toString("base64url");
  const response = NextResponse.redirect(discordAuthorizeUrl(state));
  response.cookies.set("discord_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
