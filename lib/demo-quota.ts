import { createHmac, timingSafeEqual } from "node:crypto";

export const DEMO_REVIEWS = 5;
export const DEMO_COOKIE = "job_match_demo";
const GLOBAL_DAILY_CAP = 40;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

let day = "";
let dailyCalls = 0;

function signingKey(ownerKey: string): Buffer {
  return createHmac("sha256", ownerKey).update("job-match-demo-cookie-v1").digest();
}

function signature(count: number, ownerKey: string): Buffer {
  return createHmac("sha256", signingKey(ownerKey)).update(String(count)).digest();
}

export function readDemoCount(cookie: string | undefined, ownerKey: string): number {
  if (!cookie) return 0;
  const match = /^(\d)\.([a-f0-9]{64})$/.exec(cookie);
  if (!match) return 0;
  const count = Number(match[1]);
  if (count < 1 || count > DEMO_REVIEWS) return 0;
  const actual = Buffer.from(match[2], "hex");
  return timingSafeEqual(actual, signature(count, ownerKey)) ? count : 0;
}

export function makeDemoCookie(count: number, ownerKey: string): string {
  if (count < 1 || count > DEMO_REVIEWS) throw new Error("Invalid demo count");
  return `${count}.${signature(count, ownerKey).toString("hex")}`;
}

function resetDay(now: Date): void {
  const today = now.toISOString().slice(0, 10);
  if (day !== today) {
    day = today;
    dailyCalls = 0;
  }
}

export function demoCallAvailable(now = new Date()): boolean {
  resetDay(now);
  return dailyCalls < GLOBAL_DAILY_CAP;
}

export function reserveDemoCall(now = new Date()): boolean {
  if (!demoCallAvailable(now)) return false;
  dailyCalls += 1;
  return true;
}

export const demoCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: COOKIE_MAX_AGE,
};
