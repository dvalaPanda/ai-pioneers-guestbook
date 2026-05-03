# Pioneers' Guestbook — Project Summary

## 1. Problem Statement

The Pioneer cohort had no shared, public, lightweight artifact that says "we were here together." The Guestbook is a public web app where any classmate can drop a pin on a 3D globe (city-level, no GPS), and optionally leave a rating + 400-char note or comment or review for the app signed with an auto-generated handle (adjective + noun + emoji). Notes go live immediately; the globe shows everyone's pins; a sidebar lists recent notes.

The technical object was hands-on practice with additional features on the Cloudflare platform and a richer client stack than a basic form-and-list app would justify:

- **Turnstile** — bot challenge, including the server-side verification call and key plumbing that's where most of the actual work lives.
- **D1** — SQLite at the edge, including a real schema with `CHECK` constraints and indexes rather than a single denormalized blob.
- **Rate Limiting binding** — request throttling at the network tier.
- **Single Cloudflare Worker with Static Assets binding** — the post-Pages unified deployment model, exercised end-to-end via `@cloudflare/vite-plugin`.
- **Richer graphics** — D3 orthographic globe with topojson, drag-to-rotate, and animated pin styles instead of a flat Mercator map.
- **Server-side validation, profanity wordlist, length caps, no-PII storage** — defense built into the data path, not bolted on.
- **Vite 6 + React 18 + TypeScript** — modern toolchain rather than a Babel-standalone single-file app.

## 2. Reflection Points

- **Single-Worker-with-Assets is genuinely simpler than Pages + Functions.** One config, one deploy, one binding surface. The unified dev story via `@cloudflare/vite-plugin` is the part that sells it.
- **Turnstile is mostly server-side work.** The widget itself is trivial to drop in; the verification request, secret-key plumbing through `.dev.vars`, and the failure-mode UX are where the time actually goes.
- **D1 `CHECK` constraints earn their keep even at this scale.** Bounded lat/lon, 2-char country code, rating 0–5, body ≤400 chars — schema-level guards caught a class of bugs early and let the application code stay terse.
- **D3 globe is more rewarding than a Mercator map and not meaningfully harder.** Orthographic projection + drag-to-rotate is a few dozen lines of code; the visual payoff is disproportionate.
- **"No PII" is a real design constraint, not a slogan.** It shaped the visitor row (no IP, no UA), the handle generator (adjective + noun + emoji instead of names/emails), and the moderation choice (auto-filter wordlist, no queue, notes go live immediately). Removing the option of "just store the IP for abuse handling" forced cleaner choices upstream.
- **Mobile sidebar layout was the only late-stage rework.** Flexbox got it right eventually; worth fronting the mobile breakpoints earlier next time.
- **The "Tweaks panel stays public" decision held up.** Letting any visitor change palette and pin style (defaults locked to **parchment** + **ring**) cost nothing and made the site feel like an art project rather than a CRUD form.

## 3. Code Generation

### Coding (language / framework)

- **Frontend:** Vite 6 + React 18 + TypeScript (`.tsx`).
- **Backend:** Single Cloudflare Worker, deployed as one artifact with Static Assets binding. Unified dev/build via `@cloudflare/vite-plugin`. Wrangler 4 for deploy.
- **Graphics:** `d3-geo` + `d3-geo-projection` + `topojson-client` for the orthographic globe.
- **Auth/anti-abuse:** Cloudflare Turnstile (server-verified) + Rate Limiting binding + server-side validation/length caps + small profanity wordlist.

### Data (what / where / format)

Cloudflare D1 (SQLite at the edge). Two tables, defined in `migrations/0001_init.sql`:

```sql
visitors(id, created_at, city, country, country_code, lat, lon)
  -- bounded lat/lon, 2-char country_code

notes(id, visitor_id, created_at, rating, body, display_name, emoji)
  -- rating 0–5, body ≤400, display_name 3–40, emoji ≤4
  -- visitor_id FK with ON DELETE SET NULL
```

Indexes on `created_at DESC` for both tables, plus `country` (visitors) and `visitor_id` (notes). No raw IPs, no user accounts, no PII stored anywhere.

### Details (basic object shapes)

- **Visitor:** `id`, `created_at`, `city`, `country`, `country_code`, `lat`, `lon` (the pin's position on the globe).
- **Note:** `id`, `visitor_id` (FK), `created_at`, `rating` (0–5), `body` (≤400 chars), `display_name` (auto-generated adjective + noun, 3–40 chars), `emoji` (≤4 chars).

### Outcome (basic features)

- **Welcome modal** → pick a city from the seeded ~90-entry `CITY_DB` (no external geocoder) → creates a visitor row + a globe pin.
- **Note dialog** (optional, after pinning) → 5★ rating + body → posts a note row.
- **Globe** → renders all visitor pins; drag to rotate.
- **Sidebar** → lists recent notes with handle, rating, body, and city.
- **Tweaks panel** → public to all visitors; controls palette + pin style. Defaults locked to **parchment** + **ring**.
- **Server-side guards** → Turnstile verification, Rate Limiting binding, body/handle length caps, profanity filter; notes go live immediately (no moderation queue).

## 4. User Pain · Persona · Success

### User Pain

Pioneer cohort classmates have no lightweight, shared, public artifact that says "we were here together." The available options — group chats, private docs, shared spreadsheets — aren't public-facing, aren't visually memorable, and don't accumulate into something a member would proudly link to. The Guestbook fills that gap with a single-link, no-account, low-friction surface.

### Persona

A Pioneer cohort member arriving from a link a classmate sent. They're often on a phone, intent is low — they may sign and leave in under a minute. A subset returns periodically to read new notes and watch the globe fill in. They are not power users, won't read instructions, and won't tolerate sign-up friction or a captcha that takes more than a beat.

### Success Metrics (2–3)

1. **Pin coverage** — number of distinct cities pinned. Proxies whether the artifact is actually reaching the cohort breadth, not just one cluster of friends.
2. **Sign-through rate** — % of visitors who progress from the welcome modal through to leaving a note. Proxies whether the flow is frictionless enough; a low number means the modal-to-note step is leaking.
3. **Return visits** — repeat sessions per visitor in the first 30 days. Proxies whether reading other people's notes has any pull beyond the one-time signing event. If this is near zero, the site is a write-once form, not a shared artifact.
