import { NextRequest, NextResponse } from "next/server";
import { lt, sql } from "drizzle-orm";
import { db, rateLimits } from "@/lib/db";

interface Limit {
  /** Requests allowed per window. */
  max: number;
  windowSec: number;
}

/** Per-caller limits; `user` applies when signed in, `guest` per IP otherwise. */
export const LIMITS = {
  generate: { user: { max: 10, windowSec: 3600 }, guest: { max: 3, windowSec: 3600 } },
  // Upper bound on Gemini spend from exam generation across all callers.
  generateGlobal: { max: 150, windowSec: 3600 },
  submit: { user: { max: 20, windowSec: 3600 }, guest: { max: 10, windowSec: 3600 } },
  retake: { user: { max: 20, windowSec: 3600 }, guest: { max: 10, windowSec: 3600 } },
  upload: { user: { max: 10, windowSec: 3600 } },
  register: { guest: { max: 5, windowSec: 3600 } },
  // Password guesses per account, counted whether or not they succeed.
  loginPerEmail: { max: 10, windowSec: 900 },
} as const;

export function clientIp(request: NextRequest): string {
  // On Vercel the first x-forwarded-for hop is set by the platform; self-hosted setups must
  // put a proxy in front that overwrites this header, or the IP limit can be spoofed.
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export function callerKey(request: NextRequest, userId: string | null | undefined) {
  return userId ? `user:${userId}` : `ip:${clientIp(request)}`;
}

/**
 * Counts this request against `key` and returns a 429 response once the window is full.
 * Returns null when the request may proceed.
 */
export async function rateLimit(key: string, limit: Limit): Promise<NextResponse | null> {
  const windowMs = limit.windowSec * 1000;
  const now = Date.now();
  const windowStart = new Date(Math.floor(now / windowMs) * windowMs);

  const [row] = await db
    .insert(rateLimits)
    .values({ key, windowStart, count: 1 })
    .onConflictDoUpdate({
      target: [rateLimits.key, rateLimits.windowStart],
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });

  // Occasional cleanup keeps the table small without a cron job.
  if (Math.random() < 0.01) {
    db.delete(rateLimits)
      .where(lt(rateLimits.windowStart, new Date(now - 24 * 3600 * 1000)))
      .catch(() => {});
  }

  if (row.count <= limit.max) return null;

  const retryAfter = Math.ceil((windowStart.getTime() + windowMs - now) / 1000);
  return NextResponse.json(
    { error: "Terlalu banyak permintaan. Coba lagi nanti.", retryAfter },
    { status: 429, headers: { "Retry-After": String(retryAfter) } }
  );
}

/** Applies the user or guest limit for `action`; guests are refused when the action has no guest limit. */
export async function limitCaller(
  request: NextRequest,
  action: keyof typeof LIMITS,
  userId: string | null | undefined
): Promise<NextResponse | null> {
  const limits = LIMITS[action] as { user?: Limit; guest?: Limit };
  const limit = userId ? limits.user : limits.guest;
  if (!limit) {
    return NextResponse.json({ error: "Silakan login terlebih dahulu" }, { status: 401 });
  }
  return rateLimit(`${action}:${callerKey(request, userId)}`, limit);
}
