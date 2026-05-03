import type { Env } from "../env";
import { json } from "../lib/json";
import { newId } from "../lib/id";
import { checkRateLimit } from "../lib/ratelimit";
import { verifyTurnstile } from "../lib/turnstile";
import { validateVisitor } from "../lib/validate";

export async function handlePostVisitor(req: Request, env: Env): Promise<Response> {
  if (!(await checkRateLimit(env.RATE_LIMITER_VISITORS, req, "visitors"))) {
    return json({ error: "rate_limited" }, 429);
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "invalid_json" }, 400);
  }

  const token = typeof payload.turnstileToken === "string" ? payload.turnstileToken : null;
  const passed = await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, req);
  if (!passed) return json({ error: "turnstile_failed" }, 403);

  const v = validateVisitor(payload);
  if (!v.ok) return json({ error: v.error }, 422);

  const id = newId();
  const createdAt = Date.now();
  const { city, country, countryCode, lat, lon } = v.value;

  await env.DB.prepare(
    `INSERT INTO visitors (id, created_at, city, country, country_code, lat, lon)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, createdAt, city, country, countryCode, lat, lon)
    .run();

  return json({ id, createdAt }, 201);
}
