import { notFound } from "next/navigation";
import { getUserProfile, getStatsByOwner, getUserRole, updateDiscordProfileFields } from "@/lib/db";
import { formatBytes, formatDate } from "@/lib/format";
import { getDictionary } from "@/lib/i18n";
import { decodeDiscordBadges, fetchDiscordUserByBot } from "@/lib/discord";
import { ProfileExperience } from "@/app/u/[username]/profile-experience";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const profile = await getUserProfile(username);
  if (!profile) notFound();

  const stats = await getStatsByOwner(username);
  const role = await getUserRole(username);
  const { t } = await getDictionary();

  let discord = profile.discordId
    ? {
        discordId: profile.discordId,
        discordUsername: profile.discordUsername ?? profile.username,
        discordAvatar: profile.discordAvatar,
        discordClanTag: profile.discordClanTag,
        discordClanBadge: profile.discordClanBadge,
        discordClanGuildId: profile.discordClanGuildId,
        discordPremiumType: profile.discordPremiumType ?? 0,
        badges: decodeDiscordBadges(profile.discordPublicFlags ?? 0),
      }
    : null;

  if (profile.discordId) {
    const fresh = await fetchDiscordUserByBot(profile.discordId);
    if (fresh) {
      const freshFields = {
        discordId: fresh.id,
        discordUsername: fresh.username,
        discordAvatar: fresh.avatar,
        discordPublicFlags: fresh.public_flags ?? 0,
        discordPremiumType: fresh.premium_type ?? 0,
        discordClanTag: fresh.primary_guild?.identity_enabled ? fresh.primary_guild.tag : null,
        discordClanBadge: fresh.primary_guild?.identity_enabled ? fresh.primary_guild.badge : null,
        discordClanGuildId: fresh.primary_guild?.identity_enabled ? fresh.primary_guild.identity_guild_id : null,
      };
      discord = {
        ...freshFields,
        discordUsername: freshFields.discordUsername ?? profile.username,
        badges: decodeDiscordBadges(freshFields.discordPublicFlags),
      };
      await updateDiscordProfileFields(profile.discordId, freshFields).catch(() => {});
    }
  }

  return (
    <ProfileExperience
      username={username}
      displayName={profile.username}
      uid={profile.id}
      role={role}
      avatar={!!profile.avatar}
      hasVideo={!!profile.profileVideo}
      hasMusic={!!profile.profileMusic}
      defaultVolume={profile.profileMusicVolume}
      createdAtLabel={formatDate(profile.createdAt).split(",")[0]}
      uploadCount={stats.count}
      storageLabel={formatBytes(stats.totalSize)}
      discord={discord}
      labels={{
        memberSince: t.settings.memberSince,
        uploads: t.overview.uploads,
        storage: t.overview.storage,
        enter: t.settings.enter,
      }}
    />
  );
}
