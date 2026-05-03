import { clientIp } from "./clientIp";

// Cloudflare RateLimit binding type (from @cloudflare/workers-types).
// `limit({ key })` returns `{ success: boolean }` — true if the request is within budget.
export async function checkRateLimit(
  binding: RateLimit,
  req: Request,
  bucket: string,
): Promise<boolean> {
  const ip = clientIp(req);
  const key = `${bucket}:${ip}`;
  try {
    const { success } = await binding.limit({ key });
    return success;
  } catch {
    // Fail open on binding error rather than locking the site out.
    return true;
  }
}
