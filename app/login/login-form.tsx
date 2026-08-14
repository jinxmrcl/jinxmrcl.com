"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BanNotice } from "@/app/login/ban-notice";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DiscordIcon } from "@/app/discord-icon";

interface BanInfo {
  reason: string | null;
  staff: string | null;
  time: number | null;
  unbanDate: number | null;
}

export function LoginForm({ t }: { t: Dictionary }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ban, setBan] = useState<BanInfo | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setBan(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      if ("credentials" in navigator && "PasswordCredential" in window) {
        try {
          const PasswordCredentialCtor = (window as unknown as { PasswordCredential: new (data: { id: string; password: string; name: string }) => Credential }).PasswordCredential;
          const credential = new PasswordCredentialCtor({ id: username, password, name: username });
          await navigator.credentials.store(credential);
        } catch {}
      }
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({ message: t.login.failed }));
      if (data.banned && data.ban) {
        setBan(data.ban);
      } else {
        setError(data.message || t.login.failed);
      }
      setLoading(false);
    }
  }

  if (ban) {
    return <BanNotice username={username} password={password} ban={ban} t={t} />;
  }

  return (
    <Card className="w-full max-w-sm gap-5 rounded-[22px] p-8 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <h1 className="text-center text-2xl font-semibold text-white">{t.login.title}</h1>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">{t.login.username}</Label>
          <Input
            id="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="h-11 rounded-xl px-4"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">{t.login.password}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl px-4"
            required
          />
        </div>

        {error && <p className="text-center text-[13px] text-red-400">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 h-11 rounded-xl">
          {loading ? t.login.signingIn : t.login.signIn}
        </Button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs uppercase tracking-wide text-white/25">{t.login.orDivider}</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <Button variant="outline" asChild className="h-11 rounded-xl">
          <a href="/api/auth/discord" className="flex items-center justify-center gap-2">
            <DiscordIcon /> {t.login.signInWithDiscord}
          </a>
        </Button>

        <p className="text-center text-[13px] text-muted-foreground">
          {t.login.noAccount}{" "}
          <Link href="/register" className="text-white hover:underline">
            {t.login.createOne}
          </Link>
        </p>
      </form>
    </Card>
  );
}
