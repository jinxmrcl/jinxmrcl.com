import { Client, GatewayIntentBits, ActivityType } from "discord.js";
import mysql from "mysql2/promise";

const pool = mysql.createPool({
  host: process.env.JINXMRCL_DB_HOST || "127.0.0.1",
  port: Number(process.env.JINXMRCL_DB_PORT || 3306),
  user: process.env.JINXMRCL_DB_USER || "jinxmrcl",
  password: process.env.JINXMRCL_DB_PASSWORD || "",
  database: process.env.JINXMRCL_DB_NAME || "jinxmrcl",
  waitForConnections: true,
  connectionLimit: 5,
  charset: "utf8mb4",
});

let linkedIds = new Set();

async function refreshLinkedIds() {
  try {
    const [rows] = await pool.query("SELECT discord_id FROM admin_users WHERE discord_id IS NOT NULL");
    linkedIds = new Set(rows.map((r) => r.discord_id));
  } catch (err) {
    console.error("Failed to refresh linked Discord IDs:", err.message);
  }
}

async function upsertPresence(discordId, presence) {
  const status = presence?.status ?? "offline";
  const customActivity = presence?.activities?.find((a) => a.type === ActivityType.Custom);
  const emoji = customActivity?.emoji;

  await pool.execute(
    `INSERT INTO discord_presence
       (discord_id, status, custom_status_text, custom_status_emoji, custom_status_emoji_id, custom_status_emoji_animated, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       status = VALUES(status),
       custom_status_text = VALUES(custom_status_text),
       custom_status_emoji = VALUES(custom_status_emoji),
       custom_status_emoji_id = VALUES(custom_status_emoji_id),
       custom_status_emoji_animated = VALUES(custom_status_emoji_animated),
       updated_at = VALUES(updated_at)`,
    [
      discordId,
      status,
      customActivity?.state ?? null,
      emoji?.name ?? null,
      emoji?.id ?? null,
      emoji?.animated ? 1 : 0,
      Date.now(),
    ]
  );
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMembers],
});

client.on("presenceUpdate", async (_oldPresence, presence) => {
  if (!presence?.userId) return;
  const activityNames = presence.activities?.map((a) => `type=${a.type} state=${a.state ?? ""}`).join(", ") || "none";
  console.log(`presenceUpdate: user=${presence.userId} status=${presence.status} activities=[${activityNames}] tracked=${linkedIds.has(presence.userId)}`);

  if (!linkedIds.has(presence.userId)) return;
  try {
    await upsertPresence(presence.userId, presence);
  } catch (err) {
    console.error("Failed to upsert presence for", presence.userId, err.message);
  }
});

async function seedPresences() {
  for (const guild of client.guilds.cache.values()) {
    try {
      const members = await guild.members.fetch({ withPresences: true });
      for (const member of members.values()) {
        if (linkedIds.has(member.id)) {
          await upsertPresence(member.id, member.presence).catch((err) => {
            console.error("Failed to seed presence for", member.id, err.message);
          });
        }
      }
      console.log(`Seeded presence for ${members.size} members in ${guild.name}`);
    } catch (err) {
      console.error(`Failed to fetch members for ${guild.name}:`, err.message);
    }
  }
}

client.once("ready", async () => {
  console.log(`Discord presence bot ready as ${client.user.tag}`);
  await refreshLinkedIds();
  await seedPresences();
  setInterval(refreshLinkedIds, 60_000);
  setInterval(seedPresences, 5 * 60_000);
});

client.on("error", (err) => console.error("Discord client error:", err.message));

client.login(process.env.DISCORD_BOT_TOKEN).catch((err) => {
  console.error("Failed to log in to Discord:", err.message);
  process.exit(1);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, async () => {
    await client.destroy();
    await pool.end();
    process.exit(0);
  });
}
