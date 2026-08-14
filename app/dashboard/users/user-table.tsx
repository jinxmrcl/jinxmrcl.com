"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ban, ShieldCheck } from "lucide-react";
import type { StaffUserSummary, Role } from "@/lib/db";
import { formatBytes } from "@/lib/format";
import { RoleBadge } from "@/app/role-badge";
import type { Dictionary } from "@/lib/i18n";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const DURATIONS = [
  { label: "1h", hours: 1 },
  { label: "24h", hours: 24 },
  { label: "7d", hours: 24 * 7 },
  { label: "30d", hours: 24 * 30 },
];

function BanModal({
  username,
  onClose,
  t,
}: {
  username: string | null;
  onClose: () => void;
  t: Dictionary;
}) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState<number | null>(24);
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!username) return;
    setSending(true);
    await fetch("/api/staff/ban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, reason, durationHours: hours }),
    });
    setSending(false);
    setReason("");
    onClose();
    router.refresh();
  }

  return (
    <Dialog open={!!username} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {t.users.banUser} {username}
          </DialogTitle>
        </DialogHeader>

        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.users.banReason} rows={3} />

        <div className="flex flex-wrap gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d.label}
              onClick={() => setHours(d.hours)}
              className={`rounded-lg border px-2.5 py-1 text-[12px] transition ${
                hours === d.hours
                  ? "border-white/30 bg-white/10 text-white"
                  : "border-border text-muted-foreground hover:text-white/80"
              }`}
            >
              {d.label}
            </button>
          ))}
          <button
            onClick={() => setHours(null)}
            className={`rounded-lg border px-2.5 py-1 text-[12px] transition ${
              hours === null
                ? "border-white/30 bg-white/10 text-white"
                : "border-border text-muted-foreground hover:text-white/80"
            }`}
          >
            {t.ban.permanent}
          </button>
        </div>

        <Button
          variant="destructive"
          onClick={submit}
          disabled={sending || reason.trim().length < 3}
          className="w-full"
        >
          {sending ? "..." : t.users.confirm}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function RoleSelect({ username, role, t }: { username: string; role: Role; t: Dictionary }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function change(newRole: string) {
    setSaving(true);
    await fetch("/api/staff/role", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, role: newRole }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <Select value={role} onValueChange={change} disabled={saving}>
      <SelectTrigger size="sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="user">{t.role.user}</SelectItem>
        <SelectItem value="staff">{t.role.staff}</SelectItem>
        <SelectItem value="admin">{t.role.admin}</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function UserTable({
  users,
  canSeeIp,
  canManageRoles,
  t,
}: {
  users: StaffUserSummary[];
  canSeeIp: boolean;
  canManageRoles: boolean;
  viewerRole: Role;
  t: Dictionary;
}) {
  const router = useRouter();
  const [banTarget, setBanTarget] = useState<string | null>(null);

  async function unban(username: string) {
    await fetch("/api/staff/unban", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.users.user}</TableHead>
            <TableHead>{t.users.role}</TableHead>
            <TableHead>{t.users.uploads}</TableHead>
            <TableHead>{t.users.storage}</TableHead>
            {canSeeIp && <TableHead>{t.users.ip}</TableHead>}
            {canSeeIp && <TableHead>{t.users.email}</TableHead>}
            <TableHead>{t.users.status}</TableHead>
            <TableHead>{t.users.actions}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell>
                <Link href={`/dashboard/users/${u.username}`} className="flex items-center gap-2.5 hover:underline">
                  <Avatar className="size-7">
                    {u.avatar && <AvatarImage src={`/avatar/${u.username}`} alt="" />}
                    <AvatarFallback className="text-[11px]">{u.username.slice(0, 1).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="text-white">{u.username}</span>
                  <span className="text-white/30">#{u.id}</span>
                </Link>
              </TableCell>
              <TableCell>
                {canManageRoles && u.role !== "owner" ? (
                  <RoleSelect username={u.username} role={u.role} t={t} />
                ) : (
                  <RoleBadge role={u.role} />
                )}
              </TableCell>
              <TableCell className="text-white/70">{u.uploads}</TableCell>
              <TableCell className="text-white/70">{formatBytes(u.storage)}</TableCell>
              {canSeeIp && <TableCell className="text-white/50">{u.lastIp || "—"}</TableCell>}
              {canSeeIp && <TableCell className="text-white/50">{u.email || "—"}</TableCell>}
              <TableCell>
                {u.banned ? (
                  <Badge variant="destructive">{t.users.banned}</Badge>
                ) : (
                  <Badge variant="success">{t.users.active}</Badge>
                )}
              </TableCell>
              <TableCell>
                {u.role === "owner" ? (
                  <span className="text-white/20">—</span>
                ) : u.banned ? (
                  <button
                    onClick={() => unban(u.username)}
                    className="flex items-center gap-1.5 text-emerald-400 hover:underline"
                  >
                    <ShieldCheck size={14} /> {t.users.unban}
                  </button>
                ) : (
                  <button
                    onClick={() => setBanTarget(u.username)}
                    className="flex items-center gap-1.5 text-red-400 hover:underline"
                  >
                    <Ban size={14} /> {t.users.banUser}
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
          {users.length === 0 && (
            <TableRow>
              <TableCell colSpan={canSeeIp ? 8 : 6} className="py-8 text-center text-muted-foreground">
                {t.users.noUsers}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <BanModal username={banTarget} onClose={() => setBanTarget(null)} t={t} />
    </div>
  );
}
