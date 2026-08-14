import fs from "fs";
import path from "path";
import { recordHealth, rawQuery, type HealthStatus } from "@/lib/db";

const UPLOAD_DIR = path.join(process.cwd(), "data", "uploads");

export const SERVICES = ["Website", "Database", "Upload API", "Image Delivery"] as const;
export type ServiceName = (typeof SERVICES)[number];

async function checkDatabase(): Promise<HealthStatus> {
  try {
    await rawQuery("SELECT 1");
    return "operational";
  } catch {
    return "down";
  }
}

function checkUploadApi(): HealthStatus {
  try {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    fs.accessSync(UPLOAD_DIR, fs.constants.W_OK);
    return "operational";
  } catch {
    return "down";
  }
}

function checkImageDelivery(): HealthStatus {
  try {
    fs.accessSync(UPLOAD_DIR, fs.constants.R_OK);
    return "operational";
  } catch {
    return "down";
  }
}

export async function runHealthChecks() {
  await recordHealth("Website", "operational");
  await recordHealth("Database", await checkDatabase());
  await recordHealth("Upload API", checkUploadApi());
  await recordHealth("Image Delivery", checkImageDelivery());
}

declare global {
  var __healthCheckStarted: boolean | undefined;
}

if (!globalThis.__healthCheckStarted) {
  globalThis.__healthCheckStarted = true;
  runHealthChecks();
  setInterval(runHealthChecks, 60 * 60 * 1000);
}
