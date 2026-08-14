"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export function UsernameForm({ currentUsername, t }: { currentUsername: string; t: Dictionary }) {
  const router = useRouter();
  const [username, setUsername] = useState(currentUsername);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch("/api/dashboard/username", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    const data = await res.json();

    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(data.message || "Error");
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="username">{t.settings.username}</Label>
      <div className="flex items-center gap-2">
        <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Button onClick={save} disabled={saving || username === currentUsername}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saving ? t.settings.saving : saved ? t.settings.saved : t.settings.save}
        </Button>
      </div>
      {error && <p className="text-[12px] text-red-400">{error}</p>}
    </div>
  );
}
