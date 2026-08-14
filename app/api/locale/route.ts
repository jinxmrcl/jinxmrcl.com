import { NextResponse } from "next/server";
import { LOCALE_COOKIE } from "@/lib/locale-types";

export async function POST(request: Request) {
  let body: { locale?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false }, { status: 400 });
  }

  if (body.locale !== "en" && body.locale !== "de") {
    return NextResponse.json({ success: false, message: "Invalid locale" }, { status: 400 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set(LOCALE_COOKIE, body.locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
