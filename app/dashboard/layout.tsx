import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUser, SESSION_COOKIE } from "@/lib/session";
import { getUserProfile, getUserRole, getBanInfo, deleteSession } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { DashboardShell } from "@/app/dashboard/shell";

const siteName = process.env.SITE_NAME || "jinxmrcl";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const ban = await getBanInfo(user);
  if (ban.banned) {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (token) await deleteSession(token);
    redirect("/login");
  }

  const profile = await getUserProfile(user);
  const role = await getUserRole(user);
  const { locale, t } = await getDictionary();

  return (
    <DashboardShell
      siteName={siteName}
      user={user}
      avatarUrl={profile?.avatar ? `/avatar/${user}` : null}
      role={role}
      locale={locale}
      t={t}
    >
      {children}
    </DashboardShell>
  );
}
