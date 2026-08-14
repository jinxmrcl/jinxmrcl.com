import { searchUsers, listAllUsers, roleAtLeast } from "@/lib/db";
import { requireRole } from "@/lib/roles";
import { getDictionary } from "@/lib/i18n";
import { UserTable } from "@/app/dashboard/users/user-table";
import { SearchBox } from "@/app/dashboard/users/search-box";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { role: viewerRole } = await requireRole("staff");
  const { q } = await searchParams;
  const { t } = await getDictionary();

  const users = q ? await searchUsers(q) : await listAllUsers();
  const canSeeIp = roleAtLeast(viewerRole, "admin");
  const canManageRoles = roleAtLeast(viewerRole, "owner");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">{t.users.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t.users.subtitle}</p>
      </div>

      <SearchBox initial={q || ""} t={t} />

      <UserTable users={users} canSeeIp={canSeeIp} canManageRoles={canManageRoles} viewerRole={viewerRole} t={t} />
    </div>
  );
}
