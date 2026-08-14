import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { usernameExists, renameUser } from "@/lib/db";
import { isValidUsername } from "@/lib/username";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  let body: { username?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Invalid request" }, { status: 400 });
  }

  const newUsername = body.username?.trim();
  if (!newUsername || !isValidUsername(newUsername)) {
    return NextResponse.json(
      { success: false, message: "Username must be 3-32 characters (letters, numbers, _ or -) and not a reserved name" },
      { status: 400 }
    );
  }

  if (newUsername === user) {
    return NextResponse.json({ success: true, username: user });
  }

  if (await usernameExists(newUsername)) {
    return NextResponse.json({ success: false, message: "Username already taken" }, { status: 409 });
  }

  await renameUser(user, newUsername);
  return NextResponse.json({ success: true, username: newUsername });
}
