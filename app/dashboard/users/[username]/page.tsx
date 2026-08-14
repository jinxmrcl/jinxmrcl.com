import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getUserProfile, listFilesByOwner, getUserRole } from "@/lib/db";
import { requireRole } from "@/lib/roles";
import { getDictionary } from "@/lib/i18n";
import { RoleBadge } from "@/app/role-badge";
import { formatDate } from "@/lib/format";
import { StaffFileGrid } from "@/app/dashboard/users/[username]/staff-file-grid";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export const dynamic = "force-dynamic";

export default async function StaffUserFilesPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  await requireRole("staff");
  const { username } = await params;

  const profile = await getUserProfile(username);
  if (!profile) notFound();

  const files = await listFilesByOwner(username);
  const role = await getUserRole(username);
  const { t } = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <Link href="/dashboard/users" className="flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-white">
        <ArrowLeft size={14} /> {t.users.title}
      </Link>

      <div className="flex items-center gap-3">
        <Avatar className="size-10 rounded-xl">
          {profile.avatar && <AvatarImage src={`/avatar/${username}`} alt="" />}
          <AvatarFallback className="rounded-xl">{username.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-white">{profile.username}</h1>
            <RoleBadge role={role} />
          </div>
          <p className="text-[13px] text-muted-foreground">
            {t.settings.memberSince} {formatDate(profile.createdAt).split(",")[0]} · {files.length} {t.users.uploads}
          </p>
        </div>
      </div>

      <StaffFileGrid files={files} t={t} />
    </div>
  );
}
