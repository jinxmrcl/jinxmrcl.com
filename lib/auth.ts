import { getCurrentUser } from "@/lib/session";
import { getUserByApiKey, getBanInfo } from "@/lib/db";

function extractKey(request: Request, formKey?: string | null): string | null {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) return authHeader.slice(7);

  const headerKey = request.headers.get("x-api-key");
  if (headerKey) return headerKey;

  const { searchParams } = new URL(request.url);
  const queryKey = searchParams.get("key");
  if (queryKey) return queryKey;

  if (formKey) return formKey;

  return null;
}

export async function resolveUploader(request: Request, formKey?: string | null): Promise<string | null> {
  const key = extractKey(request, formKey);

  let resolved: string | null = null;

  if (key) {
    const owner = await getUserByApiKey(key);
    if (owner) resolved = owner;
  }

  if (!resolved) {
    resolved = await getCurrentUser();
  }

  if (!resolved) return null;

  const ban = await getBanInfo(resolved);
  if (ban.banned) return null;

  return resolved;
}

export async function isAuthorized(request: Request, formKey?: string | null): Promise<boolean> {
  return (await resolveUploader(request, formKey)) !== null;
}
