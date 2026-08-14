import type { Role } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ROLE_STYLE: Record<Role, string> = {
  owner: "border-amber-400/30 bg-amber-400/10 text-amber-300",
  admin: "border-red-400/30 bg-red-400/10 text-red-300",
  staff: "border-violet-400/30 bg-violet-400/10 text-violet-300",
  user: "border-sky-400/30 bg-sky-400/10 text-sky-300",
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  staff: "Staff",
  user: "User",
};

export function RoleBadge({ role }: { role: Role }) {
  return <Badge variant="outline" className={cn(ROLE_STYLE[role])}>{ROLE_LABEL[role]}</Badge>;
}
