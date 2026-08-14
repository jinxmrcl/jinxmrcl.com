import { Images, HardDrive, Clock } from "lucide-react";
import { getStatsByOwner, listFilesByOwner, getUserApiKey, getUserProfile, getUserRole } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { getDictionary } from "@/lib/i18n";
import { formatBytes, formatDate } from "@/lib/format";
import { ApiKeyCard } from "@/app/dashboard/api-key-card";
import { AvatarUpload } from "@/app/dashboard/avatar-upload";
import { RoleBadge } from "@/app/role-badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function DashboardOverview() {
  const user = await getCurrentUser();
  const stats = user ? await getStatsByOwner(user) : { count: 0, totalSize: 0, latestUpload: null };
  const recent = user ? (await listFilesByOwner(user)).slice(0, 5) : [];
  const apiKey = user ? await getUserApiKey(user) : null;
  const profile = user ? await getUserProfile(user) : null;
  const role = user ? await getUserRole(user) : "user";
  const { t } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <Card className="p-4 sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          {user && (
            <AvatarUpload
              username={user}
              avatarUrl={profile?.avatar ? `/avatar/${user}` : null}
              title={t.settings.clickToChange}
            />
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-white">{user}</h1>
              {profile && <Badge variant="info">UID: {profile.id}</Badge>}
              <RoleBadge role={role} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {t.overview.memberSince} {profile ? formatDate(profile.createdAt).split(",")[0] : "—"}
            </p>
          </div>
        </div>

        <Separator />

        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Images size={14} />
              <p className="text-[13px]">{t.overview.uploads}</p>
            </div>
            <p className="text-2xl font-semibold text-white">{stats.count}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <HardDrive size={14} />
              <p className="text-[13px]">{t.overview.storage}</p>
            </div>
            <p className="text-2xl font-semibold text-white">{formatBytes(stats.totalSize)}</p>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock size={14} />
              <p className="text-[13px]">{t.overview.lastUpload}</p>
            </div>
            <p className="text-lg font-semibold text-white">
              {stats.latestUpload ? formatDate(stats.latestUpload).split(",")[0] : "—"}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="gap-0 p-0">
          <CardHeader className="border-b border-border px-5 py-4">
            <CardTitle>{t.overview.recentUploads}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted-foreground">{t.overview.noUploads}</p>
            ) : (
              <div className="divide-y divide-border">
                {recent.map((file) => (
                  <div key={file.id} className="flex items-center justify-between px-5 py-3 text-sm">
                    <span className="truncate text-white/70">{file.original_name}</span>
                    <span className="shrink-0 pl-3 text-muted-foreground">{formatBytes(file.size)}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {apiKey && <ApiKeyCard apiKey={apiKey} t={t} />}
      </div>
    </div>
  );
}
