import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  exchangeDiscordCode,
  fetchDiscordUser,
  encryptToken,
  joinConfiguredGuild,
} from "@/lib/discord";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/session";
import {
  getUserByDiscordId,
  linkDiscordAccount,
  createDiscordUser,
  createSession,
  getBanInfo,
  usernameExists,
  type DiscordProfileFields,
} from "@/lib/db";
import { isValidUsername } from "@/lib/username";
import { getClientIp } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";

function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3003").replace(/\/$/, "");
}

async function generateUsernameFromDiscord(discordUsername: string): Promise<string> {
  let base = discordUsername.replace(/[^a-zA-Z0-9_-]/g, "");
  if (base.length < 3) base = `user${base}`;
  base = base.slice(0, 28);

  let candidate = base;
  let suffix = 0;
  while (!isValidUsername(candidate) || (await usernameExists(candidate))) {
    suffix++;
    if (suffix > 500) return `user${randomBytes(4).toString("hex")}`;
    candidate = `${base}${suffix}`.slice(0, 32);
  }
  return candidate;
}

export async function GET(request: Request) {
  const limit = rateLimit(`discord-oauth:${getClientIp(request)}`, 15, 5 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.redirect(`${siteUrl()}/login?discord_error=rate_limited`);
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const oauthError = searchParams.get("error");

  const store = await cookies();
  const expectedState = store.get("discord_oauth_state")?.value;

  if (oauthError) {
    return NextResponse.redirect(`${siteUrl()}/login?discord_error=denied`);
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${siteUrl()}/login?discord_error=invalid_state`);
  }

  let tokenRes;
  let discordUser;
  try {
    tokenRes = await exchangeDiscordCode(code);
    discordUser = await fetchDiscordUser(tokenRes.access_token);
  } catch {
    return NextResponse.redirect(`${siteUrl()}/login?discord_error=discord_unavailable`);
  }

  const expiresAt = Date.now() + tokenRes.expires_in * 1000;
  const encryptedAccess = encryptToken(tokenRes.access_token);
  const encryptedRefresh = encryptToken(tokenRes.refresh_token);

  await joinConfiguredGuild(discordUser.id, tokenRes.access_token);

  const fields: DiscordProfileFields = {
    discordId: discordUser.id,
    discordUsername: discordUser.username,
    discordAvatar: discordUser.avatar,
    discordPublicFlags: discordUser.public_flags ?? 0,
    discordPremiumType: discordUser.premium_type ?? 0,
    discordClanTag: discordUser.primary_guild?.identity_enabled ? discordUser.primary_guild.tag : null,
    discordClanBadge: discordUser.primary_guild?.identity_enabled ? discordUser.primary_guild.badge : null,
    discordClanGuildId: discordUser.primary_guild?.identity_enabled ? discordUser.primary_guild.identity_guild_id : null,
  };

  const currentUser = await getCurrentUser();

  if (currentUser) {
    const existingOwner = await getUserByDiscordId(discordUser.id);
    if (existingOwner && existingOwner !== currentUser) {
      const response = NextResponse.redirect(`${siteUrl()}/dashboard/settings?discord_error=already_linked`);
      response.cookies.delete("discord_oauth_state");
      return response;
    }

    await linkDiscordAccount(currentUser, fields, encryptedAccess, encryptedRefresh, expiresAt);
    const response = NextResponse.redirect(`${siteUrl()}/dashboard/settings?discord=linked`);
    response.cookies.delete("discord_oauth_state");
    return response;
  }

  let username = await getUserByDiscordId(discordUser.id);
  if (!username) {
    username = await generateUsernameFromDiscord(discordUser.username);
    await createDiscordUser(username, fields, encryptedAccess, encryptedRefresh, expiresAt);
  } else {
    await linkDiscordAccount(username, fields, encryptedAccess, encryptedRefresh, expiresAt);
  }

  const ban = await getBanInfo(username);
  if (ban.banned) {
    const response = NextResponse.redirect(`${siteUrl()}/login?discord_error=banned`);
    response.cookies.delete("discord_oauth_state");
    return response;
  }

  const token = await createSession(username);
  const response = NextResponse.redirect(`${siteUrl()}/dashboard`);
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  });
  response.cookies.delete("discord_oauth_state");
  return response;
}
