import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

export const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID || "";
export const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET || "";
export const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN || "";
export const DISCORD_GUILD_ID = process.env.DISCORD_GUILD_ID || "";

function siteUrl(): string {
  return (process.env.SITE_URL || "http://localhost:3003").replace(/\/$/, "");
}

export function discordRedirectUri(): string {
  return `${siteUrl()}/api/auth/discord/callback`;
}

export function discordAuthorizeUrl(state: string): string {
  const scope = DISCORD_GUILD_ID ? "identify guilds.join" : "identify";
  const params = new URLSearchParams({
    client_id: DISCORD_CLIENT_ID,
    redirect_uri: discordRedirectUri(),
    response_type: "code",
    scope,
    state,
    prompt: "consent",
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

export async function joinConfiguredGuild(discordUserId: string, userAccessToken: string): Promise<void> {
  if (!DISCORD_GUILD_ID || !DISCORD_BOT_TOKEN) return;

  try {
    const res = await fetch(`https://discord.com/api/v10/guilds/${DISCORD_GUILD_ID}/members/${discordUserId}`, {
      method: "PUT",
      headers: {
        Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ access_token: userAccessToken }),
    });
    if (!res.ok && res.status !== 204) {
      const body = await res.text().catch(() => "");
      console.error(`Discord guild auto-join failed (${res.status}):`, body);
    }
  } catch (err) {
    console.error("Discord guild auto-join request failed:", err);
  }
}

interface DiscordTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}

export async function exchangeDiscordCode(code: string): Promise<DiscordTokenResponse> {
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "authorization_code",
      code,
      redirect_uri: discordRedirectUri(),
    }),
  });
  if (!res.ok) throw new Error(`Discord token exchange failed: ${res.status}`);
  return res.json();
}

export async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse> {
  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) throw new Error(`Discord token refresh failed: ${res.status}`);
  return res.json();
}

export interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
  public_flags: number;
  premium_type?: number;
  primary_guild?: {
    identity_guild_id: string | null;
    identity_enabled: boolean | null;
    tag: string | null;
    badge: string | null;
  } | null;
}

export async function fetchDiscordUser(accessToken: string): Promise<DiscordUser> {
  const res = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Discord user fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchDiscordUserByBot(discordId: string): Promise<DiscordUser | null> {
  if (!DISCORD_BOT_TOKEN) return null;
  try {
    const res = await fetch(`https://discord.com/api/v10/users/${discordId}`, {
      headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const DISCORD_BADGES: { flag: number; id: string; label: string }[] = [
  { flag: 1 << 0, id: "staff", label: "Discord Staff" },
  { flag: 1 << 1, id: "partner", label: "Partnered Server Owner" },
  { flag: 1 << 2, id: "hypesquad", label: "HypeSquad Events" },
  { flag: 1 << 3, id: "bug_hunter_1", label: "Bug Hunter" },
  { flag: 1 << 6, id: "house_bravery", label: "HypeSquad Bravery" },
  { flag: 1 << 7, id: "house_brilliance", label: "HypeSquad Brilliance" },
  { flag: 1 << 8, id: "house_balance", label: "HypeSquad Balance" },
  { flag: 1 << 9, id: "early_supporter", label: "Early Supporter" },
  { flag: 1 << 14, id: "bug_hunter_2", label: "Bug Hunter Gold" },
  { flag: 1 << 17, id: "verified_bot_dev", label: "Verified Bot Developer" },
  { flag: 1 << 18, id: "certified_moderator", label: "Certified Moderator" },
  { flag: 1 << 22, id: "active_developer", label: "Active Developer" },
];

export function decodeDiscordBadges(publicFlags: number): { id: string; label: string }[] {
  return DISCORD_BADGES.filter((b) => (publicFlags & b.flag) !== 0).map(({ id, label }) => ({ id, label }));
}

const ENCRYPTION_KEY = scryptSync(process.env.DISCORD_TOKEN_KEY || "insecure-dev-key-change-me", "jinxmrcl-discord", 32);

export function encryptToken(plaintext: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

export function decryptToken(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}
