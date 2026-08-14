import { cookies } from "next/headers";
import { getSessionUser } from "@/lib/db";

export const SESSION_COOKIE = "jinxmrcl_session";

export async function getCurrentUser(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return getSessionUser(token);
}
