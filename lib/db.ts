import mysql, { type RowDataPacket } from "mysql2/promise";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

const globalForDb = globalThis as unknown as { jinxmrclPool?: mysql.Pool; jinxmrclSchemaReady?: Promise<void> };

const pool =
  globalForDb.jinxmrclPool ??
  mysql.createPool({
    host: process.env.JINXMRCL_DB_HOST || "127.0.0.1",
    port: Number(process.env.JINXMRCL_DB_PORT || 3306),
    user: process.env.JINXMRCL_DB_USER || "jinxmrcl",
    password: process.env.JINXMRCL_DB_PASSWORD || "",
    database: process.env.JINXMRCL_DB_NAME || "jinxmrcl",
    waitForConnections: true,
    connectionLimit: 10,
    charset: "utf8mb4",
  });

if (process.env.NODE_ENV !== "production") globalForDb.jinxmrclPool = pool;

function generateApiKey(): string {
  return randomBytes(32).toString("base64url");
}

async function ensureSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS files (
      id VARCHAR(16) PRIMARY KEY,
      stored_name VARCHAR(64) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime VARCHAR(127) NOT NULL,
      size BIGINT NOT NULL,
      uploader VARCHAR(64) NOT NULL,
      delete_token VARCHAR(64) NOT NULL,
      created_at BIGINT NOT NULL,
      INDEX idx_uploader (uploader),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS health_checks (
      date VARCHAR(10) NOT NULL,
      service VARCHAR(64) NOT NULL,
      status VARCHAR(16) NOT NULL,
      PRIMARY KEY (date, service)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_users (
      username VARCHAR(64) PRIMARY KEY,
      password_hash VARCHAR(255) NOT NULL,
      api_key VARCHAR(64) UNIQUE
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS sessions (
      token VARCHAR(64) PRIMARY KEY,
      username VARCHAR(64) NOT NULL,
      created_at BIGINT NOT NULL,
      expires_at BIGINT NOT NULL,
      INDEX idx_username (username)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS embed_settings (
      username VARCHAR(64) PRIMARY KEY,
      color VARCHAR(7) NOT NULL DEFAULT '#ffffff',
      site_name VARCHAR(100) NOT NULL DEFAULT '',
      title_template VARCHAR(255) NOT NULL DEFAULT '',
      description_template VARCHAR(255) NOT NULL DEFAULT ''
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  try {
    await pool.query("ALTER TABLE embed_settings DROP COLUMN IF EXISTS author_name");
  } catch (err) {
    if ((err as { code?: string }).code !== "ER_CANT_DROP_FIELD_OR_KEY") throw err;
  }

  await ensureColumn("admin_users", "id", "INT AUTO_INCREMENT UNIQUE");
  await ensureColumn("admin_users", "avatar", "VARCHAR(64) DEFAULT NULL");
  await ensureColumn("admin_users", "created_at", "BIGINT DEFAULT NULL");
  await pool.query(`UPDATE admin_users SET created_at = ${Date.now()} WHERE created_at IS NULL`);

  await ensureColumn("admin_users", "role", "VARCHAR(16) NOT NULL DEFAULT 'user'");
  await ensureColumn("admin_users", "email", "VARCHAR(255) DEFAULT NULL");
  await ensureColumn("admin_users", "last_ip", "VARCHAR(45) DEFAULT NULL");
  await ensureColumn("admin_users", "banned", "TINYINT(1) NOT NULL DEFAULT 0");
  await ensureColumn("admin_users", "ban_reason", "TEXT DEFAULT NULL");
  await ensureColumn("admin_users", "ban_staff", "VARCHAR(64) DEFAULT NULL");
  await ensureColumn("admin_users", "ban_time", "BIGINT DEFAULT NULL");
  await ensureColumn("admin_users", "ban_unban_date", "BIGINT DEFAULT NULL");
  await ensureColumn("admin_users", "profile_video", "VARCHAR(64) DEFAULT NULL");
  await ensureColumn("admin_users", "profile_music", "VARCHAR(64) DEFAULT NULL");
  await ensureColumn("admin_users", "profile_music_volume", "TINYINT UNSIGNED NOT NULL DEFAULT 80");

  await ensureColumn("admin_users", "discord_id", "VARCHAR(32) DEFAULT NULL");
  await ensureColumn("admin_users", "discord_username", "VARCHAR(64) DEFAULT NULL");
  await ensureColumn("admin_users", "discord_avatar", "VARCHAR(64) DEFAULT NULL");
  await ensureColumn("admin_users", "discord_public_flags", "INT DEFAULT NULL");
  await ensureColumn("admin_users", "discord_premium_type", "TINYINT DEFAULT NULL");
  await ensureColumn("admin_users", "discord_clan_tag", "VARCHAR(8) DEFAULT NULL");
  await ensureColumn("admin_users", "discord_clan_badge", "VARCHAR(64) DEFAULT NULL");
  await ensureColumn("admin_users", "discord_clan_guild_id", "VARCHAR(32) DEFAULT NULL");
  await ensureColumn("admin_users", "discord_access_token", "TEXT DEFAULT NULL");
  await ensureColumn("admin_users", "discord_refresh_token", "TEXT DEFAULT NULL");
  await ensureColumn("admin_users", "discord_token_expires_at", "BIGINT DEFAULT NULL");
  await ensureColumn("admin_users", "discord_linked_at", "BIGINT DEFAULT NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS discord_presence (
      discord_id VARCHAR(32) PRIMARY KEY,
      status VARCHAR(16) NOT NULL DEFAULT 'offline',
      custom_status_text VARCHAR(128) DEFAULT NULL,
      custom_status_emoji VARCHAR(64) DEFAULT NULL,
      custom_status_emoji_id VARCHAR(32) DEFAULT NULL,
      custom_status_emoji_animated TINYINT(1) NOT NULL DEFAULT 0,
      updated_at BIGINT NOT NULL
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(`
    CREATE UNIQUE INDEX idx_discord_id ON admin_users (discord_id)
  `).catch((err) => {
    if ((err as { code?: string }).code !== "ER_DUP_KEYNAME") throw err;
  });

  await ensureColumn("files", "upload_ip", "VARCHAR(45) DEFAULT NULL");

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reports (
      id INT AUTO_INCREMENT PRIMARY KEY,
      file_id VARCHAR(16) NOT NULL,
      reporter_username VARCHAR(64) DEFAULT NULL,
      reporter_ip VARCHAR(45) DEFAULT NULL,
      reason TEXT NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'open',
      created_at BIGINT NOT NULL,
      resolved_by VARCHAR(64) DEFAULT NULL,
      resolved_at BIGINT DEFAULT NULL,
      INDEX idx_status (status)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS appeals (
      id INT AUTO_INCREMENT PRIMARY KEY,
      username VARCHAR(64) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(16) NOT NULL DEFAULT 'pending',
      created_at BIGINT NOT NULL,
      reviewed_by VARCHAR(64) DEFAULT NULL,
      reviewed_at BIGINT DEFAULT NULL,
      INDEX idx_status (status)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS incidents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      message TEXT NOT NULL,
      severity VARCHAR(16) NOT NULL DEFAULT 'degraded',
      service VARCHAR(64) DEFAULT NULL,
      created_by VARCHAR(64) NOT NULL,
      created_at BIGINT NOT NULL,
      resolved_at BIGINT DEFAULT NULL,
      INDEX idx_resolved_at (resolved_at)
    ) ENGINE=InnoDB CHARACTER SET utf8mb4
  `);

  await pool.query(
    "UPDATE admin_users SET role = 'owner' WHERE username = ? AND role != 'owner'",
    [process.env.OWNER_USERNAME || "Root"]
  );
}

async function ensureColumn(table: string, column: string, definition: string): Promise<void> {
  try {
    await pool.query(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${column} ${definition}`);
  } catch (err) {
    if ((err as { code?: string }).code !== "ER_DUP_FIELDNAME") throw err;
  }
}

function getReady(): Promise<void> {
  if (!globalForDb.jinxmrclSchemaReady) {
    globalForDb.jinxmrclSchemaReady = ensureSchema();
  }
  return globalForDb.jinxmrclSchemaReady;
}

async function db(): Promise<mysql.Pool> {
  await getReady();
  return pool;
}

export interface FileRecord {
  id: string;
  stored_name: string;
  original_name: string;
  mime: string;
  size: number;
  uploader: string;
  delete_token: string;
  created_at: number;
  upload_ip?: string | null;
}

export async function insertFile(record: FileRecord) {
  const conn = await db();
  await conn.execute(
    `INSERT INTO files (id, stored_name, original_name, mime, size, uploader, delete_token, created_at, upload_ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.id,
      record.stored_name,
      record.original_name,
      record.mime,
      record.size,
      record.uploader,
      record.delete_token,
      record.created_at,
      record.upload_ip ?? null,
    ]
  );
}

export async function getFile(id: string): Promise<FileRecord | undefined> {
  const conn = await db();
  const [rows] = await conn.execute<(FileRecord & RowDataPacket)[]>("SELECT * FROM files WHERE id = ?", [id]);
  return rows[0];
}

export async function getFileByStoredName(storedName: string): Promise<FileRecord | undefined> {
  const conn = await db();
  const [rows] = await conn.execute<(FileRecord & RowDataPacket)[]>(
    "SELECT * FROM files WHERE stored_name = ?",
    [storedName]
  );
  return rows[0];
}

export async function deleteFile(id: string) {
  const conn = await db();
  await conn.execute("DELETE FROM files WHERE id = ?", [id]);
}

export interface HostStats {
  count: number;
  totalSize: number;
  latestUpload: number | null;
}

export async function getStats(): Promise<HostStats> {
  const conn = await db();
  const [rows] = await conn.query<(HostStats & RowDataPacket)[]>(
    "SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as totalSize, MAX(created_at) as latestUpload FROM files"
  );
  return rows[0];
}

export type HealthStatus = "operational" | "degraded" | "down";

const STATUS_SEVERITY: Record<HealthStatus, number> = {
  operational: 0,
  degraded: 1,
  down: 2,
};

export async function recordHealth(service: string, status: HealthStatus, date = todayKey()) {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { status: HealthStatus })[]>(
    "SELECT status FROM health_checks WHERE date = ? AND service = ?",
    [date, service]
  );
  const existing = rows[0];

  if (!existing || STATUS_SEVERITY[status] > STATUS_SEVERITY[existing.status]) {
    await conn.execute(
      `INSERT INTO health_checks (date, service, status) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE status = VALUES(status)`,
      [date, service, status]
    );
  }
}

export async function getHealthHistory(
  service: string,
  days: number
): Promise<{ date: string; status: HealthStatus }[]> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { date: string; status: HealthStatus })[]>(
    "SELECT date, status FROM health_checks WHERE service = ? ORDER BY date DESC LIMIT ?",
    [service, days]
  );
  return rows.reverse();
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { password_hash: string })[]>(
    "SELECT password_hash FROM admin_users WHERE username = ?",
    [username]
  );
  const row = rows[0];
  if (!row) return false;
  return bcrypt.compareSync(password, row.password_hash);
}

export async function usernameExists(username: string): Promise<boolean> {
  const conn = await db();
  const [rows] = await conn.execute<RowDataPacket[]>("SELECT 1 FROM admin_users WHERE username = ?", [username]);
  return rows.length > 0;
}

export async function createUser(username: string, password: string): Promise<{ username: string; apiKey: string }> {
  const conn = await db();
  const hash = bcrypt.hashSync(password, 12);
  const apiKey = generateApiKey();
  await conn.execute(
    "INSERT INTO admin_users (username, password_hash, api_key, created_at) VALUES (?, ?, ?, ?)",
    [username, hash, apiKey, Date.now()]
  );
  return { username, apiKey };
}

export async function createDiscordUser(
  username: string,
  fields: DiscordProfileFields,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<void> {
  const conn = await db();
  const hash = bcrypt.hashSync(randomBytes(32).toString("hex"), 12);
  const apiKey = generateApiKey();
  const now = Date.now();
  await conn.execute(
    `INSERT INTO admin_users (
       username, password_hash, api_key, created_at,
       discord_id, discord_username, discord_avatar, discord_public_flags, discord_premium_type,
       discord_clan_tag, discord_clan_badge, discord_clan_guild_id,
       discord_access_token, discord_refresh_token, discord_token_expires_at, discord_linked_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      username,
      hash,
      apiKey,
      now,
      fields.discordId,
      fields.discordUsername,
      fields.discordAvatar,
      fields.discordPublicFlags,
      fields.discordPremiumType,
      fields.discordClanTag,
      fields.discordClanBadge,
      fields.discordClanGuildId,
      accessToken,
      refreshToken,
      expiresAt,
      now,
    ]
  );
}

export interface UserProfile {
  id: number;
  username: string;
  avatar: string | null;
  profileVideo: string | null;
  profileMusic: string | null;
  profileMusicVolume: number;
  discordId: string | null;
  discordUsername: string | null;
  discordAvatar: string | null;
  discordPublicFlags: number | null;
  discordPremiumType: number | null;
  discordClanTag: string | null;
  discordClanBadge: string | null;
  discordClanGuildId: string | null;
  createdAt: number;
}

export async function getUserProfile(username: string): Promise<UserProfile | null> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & UserProfile)[]>(
    `SELECT id, username, avatar, profile_video as profileVideo, profile_music as profileMusic,
            profile_music_volume as profileMusicVolume,
            discord_id as discordId, discord_username as discordUsername,
            discord_avatar as discordAvatar, discord_public_flags as discordPublicFlags,
            discord_premium_type as discordPremiumType, discord_clan_tag as discordClanTag,
            discord_clan_badge as discordClanBadge, discord_clan_guild_id as discordClanGuildId,
            created_at as createdAt
     FROM admin_users WHERE username = ?`,
    [username]
  );
  return rows[0] ?? null;
}

export async function setUserAvatar(username: string, avatar: string | null): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE admin_users SET avatar = ? WHERE username = ?", [avatar, username]);
}

export async function setUserProfileVideo(username: string, filename: string | null): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE admin_users SET profile_video = ? WHERE username = ?", [filename, username]);
}

export async function setUserProfileMusic(username: string, filename: string | null): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE admin_users SET profile_music = ? WHERE username = ?", [filename, username]);
}

export interface DiscordProfileFields {
  discordId: string;
  discordUsername: string;
  discordAvatar: string | null;
  discordPublicFlags: number;
  discordPremiumType: number;
  discordClanTag: string | null;
  discordClanBadge: string | null;
  discordClanGuildId: string | null;
}

export async function getUserByDiscordId(discordId: string): Promise<string | null> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { username: string })[]>(
    "SELECT username FROM admin_users WHERE discord_id = ?",
    [discordId]
  );
  return rows[0]?.username ?? null;
}

export async function linkDiscordAccount(
  username: string,
  fields: DiscordProfileFields,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<void> {
  const conn = await db();
  await conn.execute(
    `UPDATE admin_users SET
       discord_id = ?, discord_username = ?, discord_avatar = ?,
       discord_public_flags = ?, discord_premium_type = ?,
       discord_clan_tag = ?, discord_clan_badge = ?, discord_clan_guild_id = ?,
       discord_access_token = ?, discord_refresh_token = ?, discord_token_expires_at = ?,
       discord_linked_at = ?
     WHERE username = ?`,
    [
      fields.discordId,
      fields.discordUsername,
      fields.discordAvatar,
      fields.discordPublicFlags,
      fields.discordPremiumType,
      fields.discordClanTag,
      fields.discordClanBadge,
      fields.discordClanGuildId,
      accessToken,
      refreshToken,
      expiresAt,
      Date.now(),
      username,
    ]
  );
}

export async function updateDiscordProfileFields(discordId: string, fields: DiscordProfileFields): Promise<void> {
  const conn = await db();
  await conn.execute(
    `UPDATE admin_users SET
       discord_username = ?, discord_avatar = ?, discord_public_flags = ?, discord_premium_type = ?,
       discord_clan_tag = ?, discord_clan_badge = ?, discord_clan_guild_id = ?
     WHERE discord_id = ?`,
    [
      fields.discordUsername,
      fields.discordAvatar,
      fields.discordPublicFlags,
      fields.discordPremiumType,
      fields.discordClanTag,
      fields.discordClanBadge,
      fields.discordClanGuildId,
      discordId,
    ]
  );
}

export async function unlinkDiscordAccount(username: string): Promise<void> {
  const conn = await db();
  await conn.execute(
    `UPDATE admin_users SET
       discord_id = NULL, discord_username = NULL, discord_avatar = NULL,
       discord_public_flags = NULL, discord_premium_type = NULL,
       discord_clan_tag = NULL, discord_clan_badge = NULL, discord_clan_guild_id = NULL,
       discord_access_token = NULL, discord_refresh_token = NULL, discord_token_expires_at = NULL,
       discord_linked_at = NULL
     WHERE username = ?`,
    [username]
  );
}

export interface DiscordTokenInfo {
  username: string;
  discordId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export async function getDiscordTokens(username: string): Promise<DiscordTokenInfo | null> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & DiscordTokenInfo)[]>(
    `SELECT username, discord_id as discordId, discord_access_token as accessToken,
            discord_refresh_token as refreshToken, discord_token_expires_at as expiresAt
     FROM admin_users WHERE username = ? AND discord_id IS NOT NULL`,
    [username]
  );
  return rows[0] ?? null;
}

export async function updateDiscordTokens(
  username: string,
  accessToken: string,
  refreshToken: string,
  expiresAt: number
): Promise<void> {
  const conn = await db();
  await conn.execute(
    "UPDATE admin_users SET discord_access_token = ?, discord_refresh_token = ?, discord_token_expires_at = ? WHERE username = ?",
    [accessToken, refreshToken, expiresAt, username]
  );
}

export async function listLinkedDiscordAccounts(): Promise<{ username: string; discordId: string }[]> {
  const conn = await db();
  const [rows] = await conn.query<(RowDataPacket & { username: string; discordId: string })[]>(
    "SELECT username, discord_id as discordId FROM admin_users WHERE discord_id IS NOT NULL"
  );
  return rows;
}

export interface DiscordPresence {
  status: string;
  customStatusText: string | null;
  customStatusEmoji: string | null;
  customStatusEmojiId: string | null;
  customStatusEmojiAnimated: boolean;
  updatedAt: number;
}

export async function getDiscordPresence(discordId: string): Promise<DiscordPresence | null> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & DiscordPresence)[]>(
    `SELECT status, custom_status_text as customStatusText, custom_status_emoji as customStatusEmoji,
            custom_status_emoji_id as customStatusEmojiId,
            custom_status_emoji_animated as customStatusEmojiAnimated, updated_at as updatedAt
     FROM discord_presence WHERE discord_id = ?`,
    [discordId]
  );
  const row = rows[0];
  if (!row) return null;
  return { ...row, customStatusEmojiAnimated: !!row.customStatusEmojiAnimated };
}

export async function setUserProfileMusicVolume(username: string, volume: number): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE admin_users SET profile_music_volume = ? WHERE username = ?", [volume, username]);
}

export async function renameUser(oldUsername: string, newUsername: string): Promise<void> {
  await db();
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("UPDATE admin_users SET username = ? WHERE username = ?", [
      newUsername,
      oldUsername,
    ]);
    await connection.execute("UPDATE files SET uploader = ? WHERE uploader = ?", [newUsername, oldUsername]);
    await connection.execute("UPDATE sessions SET username = ? WHERE username = ?", [
      newUsername,
      oldUsername,
    ]);
    await connection.execute("UPDATE embed_settings SET username = ? WHERE username = ?", [
      newUsername,
      oldUsername,
    ]);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

export async function getUserByApiKey(key: string): Promise<string | null> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { username: string })[]>(
    "SELECT username FROM admin_users WHERE api_key = ?",
    [key]
  );
  return rows[0]?.username ?? null;
}

export async function getUserApiKey(username: string): Promise<string | null> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { api_key: string })[]>(
    "SELECT api_key FROM admin_users WHERE username = ?",
    [username]
  );
  return rows[0]?.api_key ?? null;
}

export async function createSession(username: string): Promise<string> {
  const conn = await db();
  const token = randomBytes(32).toString("base64url");
  const now = Date.now();
  await conn.execute("INSERT INTO sessions (token, username, created_at, expires_at) VALUES (?, ?, ?, ?)", [
    token,
    username,
    now,
    now + SESSION_TTL_MS,
  ]);
  return token;
}

export async function getSessionUser(token: string): Promise<string | null> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { username: string; expires_at: number })[]>(
    "SELECT username, expires_at FROM sessions WHERE token = ?",
    [token]
  );
  const row = rows[0];
  if (!row) return null;
  if (Number(row.expires_at) < Date.now()) {
    await conn.execute("DELETE FROM sessions WHERE token = ?", [token]);
    return null;
  }
  return row.username;
}

export async function deleteSession(token: string) {
  const conn = await db();
  await conn.execute("DELETE FROM sessions WHERE token = ?", [token]);
}

export async function listFiles(): Promise<FileRecord[]> {
  const conn = await db();
  const [rows] = await conn.query<(FileRecord & RowDataPacket)[]>(
    "SELECT * FROM files ORDER BY created_at DESC"
  );
  return rows;
}

export async function listFilesByOwner(username: string): Promise<FileRecord[]> {
  const conn = await db();
  const [rows] = await conn.execute<(FileRecord & RowDataPacket)[]>(
    "SELECT * FROM files WHERE uploader = ? ORDER BY created_at DESC",
    [username]
  );
  return rows;
}

export async function getStatsByOwner(username: string): Promise<HostStats> {
  const conn = await db();
  const [rows] = await conn.execute<(HostStats & RowDataPacket)[]>(
    "SELECT COUNT(*) as count, COALESCE(SUM(size), 0) as totalSize, MAX(created_at) as latestUpload FROM files WHERE uploader = ?",
    [username]
  );
  return rows[0];
}

export async function rawQuery(sql: string, sqlParams: (string | number | null)[] = []) {
  const conn = await db();
  return conn.execute(sql, sqlParams);
}

export interface EmbedSettings {
  color: string;
  siteName: string;
  titleTemplate: string;
  descriptionTemplate: string;
}

export const DEFAULT_EMBED_SETTINGS: EmbedSettings = {
  color: "#ffffff",
  siteName: process.env.SITE_NAME || "jinxmrcl",
  titleTemplate: "{filename}",
  descriptionTemplate: "{size} • uploaded by {uploader}",
};

export async function getEmbedSettings(username: string): Promise<EmbedSettings> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & {
    color: string;
    site_name: string;
    title_template: string;
    description_template: string;
  })[]>("SELECT * FROM embed_settings WHERE username = ?", [username]);

  const row = rows[0];
  if (!row) return DEFAULT_EMBED_SETTINGS;

  return {
    color: row.color || DEFAULT_EMBED_SETTINGS.color,
    siteName: row.site_name || DEFAULT_EMBED_SETTINGS.siteName,
    titleTemplate: row.title_template || DEFAULT_EMBED_SETTINGS.titleTemplate,
    descriptionTemplate: row.description_template || DEFAULT_EMBED_SETTINGS.descriptionTemplate,
  };
}

export async function saveEmbedSettings(username: string, settings: EmbedSettings): Promise<void> {
  const conn = await db();
  await conn.execute(
    `INSERT INTO embed_settings (username, color, site_name, title_template, description_template)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       color = VALUES(color),
       site_name = VALUES(site_name),
       title_template = VALUES(title_template),
       description_template = VALUES(description_template)`,
    [username, settings.color, settings.siteName, settings.titleTemplate, settings.descriptionTemplate]
  );
}

export type { Role } from "@/lib/role-types";
export { ROLE_RANK, roleAtLeast } from "@/lib/role-types";
import type { Role } from "@/lib/role-types";

export async function getUserRole(username: string): Promise<Role> {
  const conn = await db();
  const [rows] = await conn.execute<(RowDataPacket & { role: Role })[]>(
    "SELECT role FROM admin_users WHERE username = ?",
    [username]
  );
  return rows[0]?.role ?? "user";
}

export async function setUserRole(username: string, role: Role): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE admin_users SET role = ? WHERE username = ?", [role, username]);
}

export interface BanInfo {
  banned: boolean;
  reason: string | null;
  staff: string | null;
  time: number | null;
  unbanDate: number | null;
}

function rowToBanInfo(row: {
  banned: number;
  ban_reason: string | null;
  ban_staff: string | null;
  ban_time: number | null;
  ban_unban_date: number | null;
}): BanInfo {
  return {
    banned: !!row.banned,
    reason: row.ban_reason,
    staff: row.ban_staff,
    time: row.ban_time,
    unbanDate: row.ban_unban_date,
  };
}

export async function getBanInfo(username: string): Promise<BanInfo> {
  const conn = await db();
  const [rows] = await conn.execute<
    (RowDataPacket & {
      banned: number;
      ban_reason: string | null;
      ban_staff: string | null;
      ban_time: number | null;
      ban_unban_date: number | null;
    })[]
  >("SELECT banned, ban_reason, ban_staff, ban_time, ban_unban_date FROM admin_users WHERE username = ?", [
    username,
  ]);
  const row = rows[0];
  if (!row) return { banned: false, reason: null, staff: null, time: null, unbanDate: null };

  if (row.banned && row.ban_unban_date && row.ban_unban_date < Date.now()) {
    await unbanUser(username);
    return { banned: false, reason: null, staff: null, time: null, unbanDate: null };
  }

  return rowToBanInfo(row);
}

export async function banUser(
  username: string,
  staff: string,
  reason: string,
  unbanDate: number | null
): Promise<void> {
  const conn = await db();
  await conn.execute(
    `UPDATE admin_users
     SET banned = 1, ban_reason = ?, ban_staff = ?, ban_time = ?, ban_unban_date = ?
     WHERE username = ?`,
    [reason, staff, Date.now(), unbanDate, username]
  );
}

export async function unbanUser(username: string): Promise<void> {
  const conn = await db();
  await conn.execute(
    `UPDATE admin_users
     SET banned = 0, ban_reason = NULL, ban_staff = NULL, ban_time = NULL, ban_unban_date = NULL
     WHERE username = ?`,
    [username]
  );
}

export async function setLastIp(username: string, ip: string): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE admin_users SET last_ip = ? WHERE username = ?", [ip, username]);
}

export async function setUserEmail(username: string, email: string | null): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE admin_users SET email = ? WHERE username = ?", [email, username]);
}

export interface StaffUserSummary {
  id: number;
  username: string;
  role: Role;
  email: string | null;
  lastIp: string | null;
  avatar: string | null;
  createdAt: number;
  banned: boolean;
  uploads: number;
  storage: number;
}

export async function searchUsers(query: string): Promise<StaffUserSummary[]> {
  const conn = await db();
  const like = `%${query}%`;
  const [rows] = await conn.execute<(RowDataPacket & StaffUserSummary & { role: Role })[]>(
    `SELECT
       u.id, u.username, u.role, u.email, u.last_ip as lastIp, u.avatar, u.created_at as createdAt, u.banned,
       COUNT(f.id) as uploads, COALESCE(SUM(f.size), 0) as storage
     FROM admin_users u
     LEFT JOIN files f ON f.uploader = u.username
     WHERE u.username LIKE ? OR u.email LIKE ? OR u.last_ip = ?
     GROUP BY u.id
     ORDER BY u.id ASC`,
    [like, like, query]
  );
  return rows.map((r) => ({ ...r, banned: !!r.banned }));
}

export async function listAllUsers(): Promise<StaffUserSummary[]> {
  const conn = await db();
  const [rows] = await conn.query<(RowDataPacket & StaffUserSummary & { role: Role })[]>(
    `SELECT
       u.id, u.username, u.role, u.email, u.last_ip as lastIp, u.avatar, u.created_at as createdAt, u.banned,
       COUNT(f.id) as uploads, COALESCE(SUM(f.size), 0) as storage
     FROM admin_users u
     LEFT JOIN files f ON f.uploader = u.username
     GROUP BY u.id
     ORDER BY u.id ASC`
  );
  return rows.map((r) => ({ ...r, banned: !!r.banned }));
}

export interface ReportRecord {
  id: number;
  file_id: string;
  reporter_username: string | null;
  reporter_ip: string | null;
  reason: string;
  status: string;
  created_at: number;
}

export async function createReport(
  fileId: string,
  reporterUsername: string | null,
  reporterIp: string | null,
  reason: string
): Promise<void> {
  const conn = await db();
  await conn.execute(
    "INSERT INTO reports (file_id, reporter_username, reporter_ip, reason, status, created_at) VALUES (?, ?, ?, ?, 'open', ?)",
    [fileId, reporterUsername, reporterIp, reason, Date.now()]
  );
}

export async function listOpenReports(): Promise<(ReportRecord & { file: FileRecord | null })[]> {
  const conn = await db();
  const [rows] = await conn.query<(RowDataPacket & ReportRecord)[]>(
    "SELECT * FROM reports WHERE status = 'open' ORDER BY created_at DESC"
  );

  const results: (ReportRecord & { file: FileRecord | null })[] = [];
  for (const row of rows) {
    const file = await getFile(row.file_id);
    results.push({ ...row, file: file ?? null });
  }
  return results;
}

export async function resolveReport(id: number, resolvedBy: string): Promise<void> {
  const conn = await db();
  await conn.execute(
    "UPDATE reports SET status = 'resolved', resolved_by = ?, resolved_at = ? WHERE id = ?",
    [resolvedBy, Date.now(), id]
  );
}

export interface AppealRecord {
  id: number;
  username: string;
  message: string;
  status: string;
  created_at: number;
}

export async function createAppeal(username: string, message: string): Promise<void> {
  const conn = await db();
  await conn.execute(
    "INSERT INTO appeals (username, message, status, created_at) VALUES (?, ?, 'pending', ?)",
    [username, message, Date.now()]
  );
}

export async function listPendingAppeals(): Promise<AppealRecord[]> {
  const conn = await db();
  const [rows] = await conn.query<(RowDataPacket & AppealRecord)[]>(
    "SELECT * FROM appeals WHERE status = 'pending' ORDER BY created_at ASC"
  );
  return rows;
}

export async function resolveAppeal(
  id: number,
  status: "approved" | "denied",
  reviewedBy: string
): Promise<void> {
  const conn = await db();
  await conn.execute(
    "UPDATE appeals SET status = ?, reviewed_by = ?, reviewed_at = ? WHERE id = ?",
    [status, reviewedBy, Date.now(), id]
  );
}

export type IncidentSeverity = "degraded" | "down";

export interface IncidentRecord {
  id: number;
  title: string;
  message: string;
  severity: IncidentSeverity;
  service: string | null;
  created_by: string;
  created_at: number;
  resolved_at: number | null;
}

export async function createIncident(
  title: string,
  message: string,
  severity: IncidentSeverity,
  service: string | null,
  createdBy: string
): Promise<void> {
  const conn = await db();
  await conn.execute(
    "INSERT INTO incidents (title, message, severity, service, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    [title, message, severity, service, createdBy, Date.now()]
  );
}

export async function resolveIncident(id: number): Promise<void> {
  const conn = await db();
  await conn.execute("UPDATE incidents SET resolved_at = ? WHERE id = ? AND resolved_at IS NULL", [Date.now(), id]);
}

export async function listOpenIncidents(): Promise<IncidentRecord[]> {
  const conn = await db();
  const [rows] = await conn.query<(RowDataPacket & IncidentRecord)[]>(
    "SELECT * FROM incidents WHERE resolved_at IS NULL ORDER BY created_at DESC"
  );
  return rows;
}

export async function listRecentIncidents(limit = 10): Promise<IncidentRecord[]> {
  const conn = await db();
  const [rows] = await conn.query<(RowDataPacket & IncidentRecord)[]>(
    "SELECT * FROM incidents WHERE resolved_at IS NOT NULL ORDER BY resolved_at DESC LIMIT ?",
    [limit]
  );
  return rows;
}
