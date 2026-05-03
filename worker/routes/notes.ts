import type { Env } from "../env";
import { json } from "../lib/json";
import { newId } from "../lib/id";
import { containsProfanity } from "../lib/profanity";
import { checkRateLimit } from "../lib/ratelimit";
import { verifyTurnstile } from "../lib/turnstile";
import { validateNote } from "../lib/validate";

export async function handlePostNote(req: Request, env: Env): Promise<Response> {
  if (!(await checkRateLimit(env.RATE_LIMITER_NOTES, req, "notes"))) {
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

  const v = validateNote(payload);
  if (!v.ok) return json({ error: v.error }, 422);

  if (containsProfanity(v.value.body, v.value.displayName)) {
    return json({ error: "rejected_content" }, 422);
  }

  if (v.value.visitorId) {
    const row = await env.DB.prepare(`SELECT id FROM visitors WHERE id = ?`)
      .bind(v.value.visitorId)
      .first<{ id: string } | null>();
    if (!row) return json({ error: "unknown_visitor" }, 422);
  }

  const id = newId();
  const createdAt = Date.now();
  const { visitorId, rating, body, displayName, emoji } = v.value;

  await env.DB.prepare(
    `INSERT INTO notes (id, visitor_id, created_at, rating, body, display_name, emoji)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, visitorId, createdAt, rating, body, displayName, emoji)
    .run();

  return json(
    {
      id,
      visitorId,
      createdAt,
      rating,
      body,
      displayName,
      emoji,
    },
    201,
  );
}
