// Server-side validators. Mirror the client allow-lists exactly so a tampered
// payload from the browser still gets rejected.

const ADJECTIVES: ReadonlySet<string> = new Set([
  "Quiet", "Curious", "Distant", "Patient", "Gilded", "Northern", "Southern",
  "Sage", "Velvet", "Marble", "Aurora", "Linen", "Brass", "Slow", "Quartz",
  "Coastal", "Hushed", "Verdant", "Ember",
]);

const NOUNS: ReadonlySet<string> = new Set([
  "Voyager", "Wanderer", "Cartographer", "Pilgrim", "Mariner", "Astronomer",
  "Rambler", "Pioneer", "Drifter", "Compass", "Lantern", "Sojourner",
  "Atlas", "Almanac", "Steward",
]);

const EMOJIS: ReadonlySet<string> = new Set([
  "✦", "✧", "☼", "☾", "◐", "◑", "◒", "◓", "❖", "✺", "◈", "◇", "◆", "✿",
]);

const HANDLE_REGEX = /^[A-Z][a-z]+ [A-Z][a-z]+$/;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export interface VisitorInput {
  city: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lon: number | null;
}

export interface NoteInput {
  visitorId: string | null;
  rating: number;
  body: string | null;
  displayName: string;
  emoji: string;
}

function trimmedOrNull(v: unknown, max: number): string | null {
  if (v == null) return null;
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t) return null;
  if (t.length > max) return null;
  return t;
}

function nullableNumber(v: unknown, min: number, max: number): number | null | "invalid" {
  if (v == null) return null;
  if (typeof v !== "number" || !Number.isFinite(v)) return "invalid";
  if (v < min || v > max) return "invalid";
  return v;
}

export function validateVisitor(payload: unknown): Result<VisitorInput> {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "invalid_body" };
  }
  const p = payload as Record<string, unknown>;

  const city = p.city == null ? null : trimmedOrNull(p.city, 80);
  if (p.city != null && city == null) return { ok: false, error: "invalid_city" };

  const country = p.country == null ? null : trimmedOrNull(p.country, 80);
  if (p.country != null && country == null) return { ok: false, error: "invalid_country" };

  let countryCode: string | null = null;
  if (p.countryCode != null) {
    if (typeof p.countryCode !== "string") return { ok: false, error: "invalid_country_code" };
    const cc = p.countryCode.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(cc)) return { ok: false, error: "invalid_country_code" };
    countryCode = cc;
  }

  const lat = nullableNumber(p.lat, -90, 90);
  const lon = nullableNumber(p.lon, -180, 180);
  if (lat === "invalid" || lon === "invalid") return { ok: false, error: "invalid_coords" };
  if ((lat == null) !== (lon == null)) return { ok: false, error: "lat_lon_mismatch" };

  return { ok: true, value: { city, country, countryCode, lat, lon } };
}

export function validateNote(payload: unknown): Result<NoteInput> {
  if (!payload || typeof payload !== "object") {
    return { ok: false, error: "invalid_body" };
  }
  const p = payload as Record<string, unknown>;

  let visitorId: string | null = null;
  if (p.visitorId != null) {
    if (typeof p.visitorId !== "string") return { ok: false, error: "invalid_visitor_id" };
    const t = p.visitorId.trim();
    if (!/^[A-Za-z0-9_-]{8,32}$/.test(t)) return { ok: false, error: "invalid_visitor_id" };
    visitorId = t;
  }

  if (typeof p.rating !== "number" || !Number.isInteger(p.rating)) {
    return { ok: false, error: "invalid_rating" };
  }
  if (p.rating < 0 || p.rating > 5) return { ok: false, error: "invalid_rating" };

  let body: string | null = null;
  if (p.body != null) {
    if (typeof p.body !== "string") return { ok: false, error: "invalid_body_text" };
    const t = p.body.trim();
    if (t.length > 400) return { ok: false, error: "body_too_long" };
    body = t || null;
  }

  if (typeof p.displayName !== "string") return { ok: false, error: "invalid_display_name" };
  const displayName = p.displayName.trim();
  if (!HANDLE_REGEX.test(displayName)) return { ok: false, error: "invalid_display_name" };
  const [adj, noun] = displayName.split(" ");
  if (!adj || !noun || !ADJECTIVES.has(adj) || !NOUNS.has(noun)) {
    return { ok: false, error: "invalid_display_name" };
  }

  if (typeof p.emoji !== "string" || !EMOJIS.has(p.emoji)) {
    return { ok: false, error: "invalid_emoji" };
  }

  return {
    ok: true,
    value: {
      visitorId,
      rating: p.rating,
      body,
      displayName,
      emoji: p.emoji,
    },
  };
}
