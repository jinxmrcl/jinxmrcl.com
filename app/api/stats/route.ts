import { NextResponse } from "next/server";
import { getStats } from "@/lib/db";

export async function GET() {
  const stats = await getStats();
  return NextResponse.json({
    count: stats.count,
    totalSizeMB: stats.totalSize / (1024 * 1024),
  });
}
