import type { Env } from "../env";
import { json } from "../lib/json";

interface VisitorRow {
  id: string;
  created_at: number;
  city: string | null;
  country: string | null;
  country_code: string | null;
  lat: number | null;
  lon: number | null;
}

interface NoteRow {
  id: string;
  visitor_id: string | null;
  created_at: number;
  rating: number;
  body: string | null;
  display_name: string;
  emoji: string;
}

interface CountryCountRow {
  country: string;
  count: number;
}

interface TotalsRow {
  visitors: number;
  located: number;
  anonymous: number;
  avg_rating: number | null;
}

export async function handleState(_req: Request, env: Env): Promise<Response> {
  const turnstileSiteKey = env.TURNSTILE_SITE_KEY;
  const [visitorsRes, notesRes, countryRes, totalsRes] = await env.DB.batch([
    env.DB.prepare(
      `SELECT id, created_at, city, country, country_code, lat, lon
         FROM visitors
        WHERE lat IS NOT NULL AND lon IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 500`,
    ),
    env.DB.prepare(
      `SELECT id, visitor_id, created_at, rating, body, display_name, emoji
         FROM notes
        ORDER BY created_at DESC
        LIMIT 100`,
    ),
    env.DB.prepare(
      `SELECT country, COUNT(*) AS count
         FROM visitors
        WHERE country IS NOT NULL
        GROUP BY country
        ORDER BY count DESC, country ASC
        LIMIT 30`,
    ),
    env.DB.prepare(
      `SELECT
          (SELECT COUNT(*) FROM visitors)                                   AS visitors,
          (SELECT COUNT(*) FROM visitors WHERE lat IS NOT NULL)             AS located,
          (SELECT COUNT(*) FROM visitors WHERE lat IS NULL)                 AS anonymous,
          (SELECT AVG(rating) FROM notes)                                   AS avg_rating`,
    ),
  ]);

  const visitors = (visitorsRes.results as VisitorRow[] | undefined ?? []).map(
    (r) => ({
      id: r.id,
      createdAt: r.created_at,
      city: r.city,
      country: r.country,
      countryCode: r.country_code,
      lat: r.lat,
      lon: r.lon,
    }),
  );

  const notes = (notesRes.results as NoteRow[] | undefined ?? []).map((r) => ({
    id: r.id,
    visitorId: r.visitor_id,
    createdAt: r.created_at,
    rating: r.rating,
    body: r.body,
    displayName: r.display_name,
    emoji: r.emoji,
  }));

  const countryCounts =
    (countryRes.results as CountryCountRow[] | undefined ?? []).map((r) => ({
      country: r.country,
      count: r.count,
    }));

  const t =
    ((totalsRes.results as TotalsRow[] | undefined)?.[0]) ?? {
      visitors: 0,
      located: 0,
      anonymous: 0,
      avg_rating: 0,
    };

  return json({
    visitors,
    notes,
    countryCounts,
    totals: {
      visitors: t.visitors,
      located: t.located,
      anonymous: t.anonymous,
      avgRating: t.avg_rating ?? 0,
    },
    config: {
      turnstileSiteKey,
    },
  });
}
