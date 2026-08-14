"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Dictionary } from "@/lib/i18n";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function RegisterForm({ t }: { t: Dictionary }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({ message: t.register.failed }));
      setError(data.message || t.register.failed);
      setLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-sm gap-5 rounded-[22px] p-8 backdrop-blur-xl">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <h1 className="text-center text-2xl font-semibold text-white">{t.register.title}</h1>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">{t.register.username}</Label>
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
          <Label htmlFor="password">{t.register.password}</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-xl px-4"
            required
            minLength={8}
          />
          <span className="text-[12px] text-muted-foreground">{t.register.passwordHint}</span>
        </div>

        {error && <p className="text-center text-[13px] text-red-400">{error}</p>}

        <Button type="submit" disabled={loading} className="mt-2 h-11 rounded-xl">
          {loading ? t.register.creating : t.register.createAccount}
        </Button>

        <p className="text-center text-[13px] text-muted-foreground">
          {t.register.alreadyHaveAccount}{" "}
          <Link href="/login" className="text-white hover:underline">
            {t.register.signIn}
          </Link>
        </p>
      </form>
    </Card>
  );
}
