"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutGrid, Upload, Images, Palette, Users, Flag, Gavel, Siren, Download, LogOut } from "lucide-react";
import { ROLE_RANK, type Role } from "@/lib/role-types";
import type { Dictionary } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export function DashboardNav({
  role,
  t,
  onNavigate,
}: {
  role: Role;
  t: Dictionary;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    { href: "/dashboard", label: t.nav.overview, icon: LayoutGrid, min: "user" as Role },
    { href: "/dashboard/upload", label: t.nav.upload, icon: Upload, min: "user" as Role },
    { href: "/dashboard/gallery", label: t.nav.gallery, icon: Images, min: "user" as Role },
    { href: "/dashboard/embed", label: t.nav.embed, icon: Palette, min: "user" as Role },
    { href: "/dashboard/downloader", label: t.nav.downloader, icon: Download, min: "user" as Role },
    { href: "/dashboard/users", label: t.nav.users, icon: Users, min: "staff" as Role },
    { href: "/dashboard/reports", label: t.nav.reports, icon: Flag, min: "staff" as Role },
    { href: "/dashboard/appeals", label: t.nav.appeals, icon: Gavel, min: "staff" as Role },
    { href: "/dashboard/incidents", label: t.nav.incidents, icon: Siren, min: "owner" as Role },
  ];

  async function handleLogout() {
    onNavigate?.();
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  const visibleLinks = links.filter((l) => ROLE_RANK[role] >= ROLE_RANK[l.min]);
  const staffLinksStart = visibleLinks.findIndex((l) => l.min !== "user");

  return (
    <nav className="flex flex-1 flex-col gap-1">
      {visibleLinks.map(({ href, label, icon: Icon }, i) => {
        const active = pathname === href;
        return (
          <div key={href}>
            {i === staffLinksStart && staffLinksStart > 0 && <Separator className="my-2" />}
            <Link
              href={href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[14px] transition",
                active
                  ? "bg-accent font-medium text-white"
                  : "text-muted-foreground hover:bg-accent/60 hover:text-white/80"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-white" />
              )}
              <Icon size={17} />
              {label}
            </Link>
          </div>
        );
      })}

      <Separator className="my-2" />

      <Button
        variant="ghost"
        onClick={handleLogout}
        className="justify-start gap-2.5 px-3 text-muted-foreground hover:bg-red-500/10 hover:text-red-400"
      >
        <LogOut size={17} />
        {t.nav.logout}
      </Button>
    </nav>
  );
}
