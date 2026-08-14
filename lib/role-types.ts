export type Role = "owner" | "admin" | "staff" | "user";

export const ROLE_RANK: Record<Role, number> = { user: 0, staff: 1, admin: 2, owner: 3 };

export function roleAtLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}
