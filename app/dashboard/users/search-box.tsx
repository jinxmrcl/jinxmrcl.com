"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchBox({ initial, t }: { initial: string; t: Dictionary }) {
  const router = useRouter();
  const [value, setValue] = useState(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    router.push(value ? `/dashboard/users?q=${encodeURIComponent(value)}` : "/dashboard/users");
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.users.searchPlaceholder}
          className="h-10 pl-9"
        />
      </div>
      <Button type="submit" variant="outline">
        {t.users.search}
      </Button>
    </form>
  );
}
