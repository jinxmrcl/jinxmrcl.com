"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { DashboardNav } from "@/app/dashboard/nav";
import { LanguageSwitcher } from "@/app/language-switcher";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { Role } from "@/lib/role-types";
import type { Locale } from "@/lib/locale-types";
import type { Dictionary } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function DashboardShell({
  siteName,
  user,
  avatarUrl,
  role,
  locale,
  t,
  children,
}: {
  siteName: string;
  user: string;
  avatarUrl: string | null;
  role: Role;
  locale: Locale;
  t: Dictionary;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col gap-3 p-3 lg:flex-row">
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 px-3 py-2.5 lg:hidden">
        <Link href="/" className="text-base font-bold uppercase tracking-tight text-white">
          {siteName}
        </Link>
        <div className="flex items-center gap-1.5">
          <LanguageSwitcher locale={locale} labels={{ en: t.language.en, de: t.language.de }} />
          <Button variant="outline" size="icon" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu size={18} />
          </Button>
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex h-full w-72 -translate-x-full flex-col overflow-y-auto border-r border-border bg-[#0a0a0a] p-4 transition-transform duration-200 ease-out",
          "lg:static lg:inset-auto lg:z-auto lg:h-auto lg:w-64 lg:shrink-0 lg:translate-x-0 lg:rounded-3xl lg:border lg:bg-card/60",
          open && "translate-x-0"
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2 pt-2">
          <Link href="/" className="text-lg font-bold uppercase tracking-tight text-white">
            {siteName}
          </Link>
          <div className="flex items-center gap-1.5">
            <div className="hidden lg:block">
              <LanguageSwitcher locale={locale} labels={{ en: t.language.en, de: t.language.de }} />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </Button>
          </div>
        </div>
        <Separator className="mb-4" />
        <DashboardNav role={role} t={t} onNavigate={() => setOpen(false)} />

        <Link
          href="/dashboard/settings"
          className="mt-auto flex items-center gap-2.5 rounded-2xl border border-border bg-card px-3 py-2.5 transition hover:bg-accent"
        >
          <Avatar className="size-8">
            {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
            <AvatarFallback>{user.slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-white">{user}</p>
            <p className="text-[11px] text-muted-foreground">{t.nav.signedIn}</p>
          </div>
        </Link>
      </aside>

      <main className="flex-1 overflow-y-auto rounded-3xl border border-border bg-card/30 p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-4xl">{children}</div>
      </main>
    </div>
  );
}
