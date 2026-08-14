import { NextResponse, type NextRequest } from "next/server";
import { RESERVED_USERNAMES, USERNAME_PATTERN } from "@/lib/username";

function rootDomain(): string {
  try {
    return new URL(process.env.SITE_URL || "https://jinxmrcl.com").hostname;
  } catch {
    return "jinxmrcl.com";
  }
}

export function middleware(request: NextRequest) {
  const host = (request.headers.get("host") || "").split(":")[0].toLowerCase();
  const root = rootDomain();

  if (host === root || host === `www.${root}` || !host.endsWith(`.${root}`)) {
    return NextResponse.next();
  }

  const sub = host.slice(0, -(`.${root}`.length));

  if (!USERNAME_PATTERN.test(sub) || RESERVED_USERNAMES.has(sub)) {
    return NextResponse.next();
  }

  if (request.nextUrl.pathname !== "/") {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.protocol = "http:";
  url.hostname = "127.0.0.1";
  url.port = "3003";
  url.pathname = `/u/${sub}`;
  return NextResponse.rewrite(url);
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
