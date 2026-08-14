import { getUserProfile } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import { AvatarUpload } from "@/app/dashboard/avatar-upload";
import { UsernameForm } from "@/app/dashboard/settings/username-form";
import { SubdomainCard } from "@/app/dashboard/settings/subdomain-card";
import { ProfileMediaForm } from "@/app/dashboard/settings/profile-media-form";
import { DiscordCard } from "@/app/dashboard/settings/discord-card";
import { formatDate } from "@/lib/format";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function rootDomain(): string {
  try {
    return new URL(process.env.SITE_URL || "https://jinxmrcl.com").hostname;
  } catch {
    return "jinxmrcl.com";
  }
}

export default async function SettingsPage() {
  const user = await getCurrentUser();
  const profile = user ? await getUserProfile(user) : null;
  const { t } = await getDictionary();
  if (!user || !profile) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.settings.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.settings.subtitle}</p>
      </div>

      <Card className="gap-5 p-6">
        <div className="flex items-center gap-4">
          <AvatarUpload
            username={user}
            avatarUrl={profile.avatar ? `/avatar/${user}` : null}
            title={t.settings.clickToChange}
          />
          <div>
            <p className="text-sm text-muted-foreground">{t.settings.profilePicture}</p>
            <p className="text-[13px] text-white/30">{t.settings.clickToChange}</p>
          </div>
        </div>

        <Separator />

        <UsernameForm currentUsername={user} t={t} />

        <Separator />

        <SubdomainCard url={`https://${user}.${rootDomain()}`} t={t} />

        <Separator />

        <ProfileMediaForm
          profileVideo={profile.profileVideo}
          profileMusic={profile.profileMusic}
          profileMusicVolume={profile.profileMusicVolume}
          t={t}
        />

        <Separator />

        <DiscordCard
          discordId={profile.discordId}
          discordUsername={profile.discordUsername}
          discordAvatar={profile.discordAvatar}
          t={t}
        />

        <Separator />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{t.settings.publicProfile}</p>
            <p className="text-[13px] text-white/30">
              {t.settings.memberSince} {formatDate(profile.createdAt).split(",")[0]}
            </p>
          </div>
          <Button variant="outline" asChild>
            <a href={`/u/${user}`} target="_blank">
              {t.settings.viewProfile}
              <ExternalLink size={14} />
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}
