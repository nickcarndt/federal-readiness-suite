/**
 * Best-effort in-memory rate limiter.
 *
 * On Vercel serverless, each isolate has its own Map — this does NOT provide
 * durable cross-instance enforcement. It still throttles bursty single-isolate
 * abuse and fails closed locally. Documented as best-effort in the README.
 */
interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LIMIT = 10;

export function rateLimit(req: Request): { success: boolean } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const key = ip;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true };
  }

  if (entry.count >= LIMIT) {
    return { success: false };
  }

  entry.count++;
  return { success: true };
}
