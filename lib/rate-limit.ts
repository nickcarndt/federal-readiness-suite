interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const NORMAL_LIMIT = 10;
const DEMO_LIMIT = 50;

export function rateLimit(
  req: Request,
  isDemoMode = false
): { success: boolean } {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";
  const limit = isDemoMode ? DEMO_LIMIT : NORMAL_LIMIT;
  // Separate buckets so demo and normal usage don't share counts
  const key = `${ip}:${isDemoMode ? "demo" : "normal"}`;
  const now = Date.now();

  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + WINDOW_MS });
    return { success: true };
  }

  if (entry.count >= limit) {
    return { success: false };
  }

  entry.count++;
  return { success: true };
}
