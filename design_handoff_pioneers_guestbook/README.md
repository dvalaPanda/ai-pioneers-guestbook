# Handoff: The Pioneers' Guestbook

## Overview

A quiet, single-page web app where early visitors to a product can sign their name (or stay anonymous), optionally drop a pin on a world map showing where they came from, and leave a 0–5 star rating with a short note. The aesthetic is **monochrome cartographic / antique field journal** — bone paper, thin ink lines, a single muted accent (default burgundy), and editorial serif typography.

The product is a "soft launch" register — meant to feel like a hand-bound guestbook left out at a trailhead, rather than a marketing landing page. The map is the centerpiece; visitor pins accumulate on it over time.

## Screenshots

Reference captures of the prototype in `screenshots/`. Treat these as the source of truth for visual fidelity.

| File | Shows |
|---|---|
| `01-loading.png` | Loading screen — spinning wireframe globe, italic tagline. |
| `02-welcome.png` | Welcome modal with city autocomplete. |
| `03-main-globe.png` | Main view (orthographic globe + sidebar) — the canonical hero state. |
| `05-mercator.png` | Same view in Mercator projection (clipped at poles). |
| `06-note-dialog.png` | Note dialog — stars, comment, "show on map" checkbox, primary CTA. |

## About the Design Files

The files in `source/` are **design references created in HTML** — a working React + Babel-in-the-browser prototype showing intended look, layout, and behavior. They are **not production code to copy directly**.

The task is to **recreate this design in the target codebase's existing environment** (React, Vue, Svelte, SwiftUI, etc.) using its established patterns, libraries, and design tokens. If the target project doesn't yet have a frontend, choose a framework appropriate to the rest of the stack (React + Vite is a sensible default given this is a single-page interactive page) and implement there.

The prototype uses inline `<script type="text/babel">` and CDN-loaded React only because the design environment requires it. In a real codebase, expect to:
- Move palettes/fonts into your design-token system
- Replace the in-memory + localStorage store with whatever persistence you have (DB-backed API, Supabase, etc.)
- Integrate real geolocation/IP-to-location instead of the seeded city autocomplete
- Use your existing dialog/modal/button primitives if you have them

## Fidelity

**High-fidelity (hifi).** Final colors, typography, spacing, and interactions are decided. Recreate pixel-perfectly using your codebase's existing libraries and patterns where they exist; faithful values are documented below for places where they don't.

## Screens / Views

There are three sequential phases plus the persistent main view. All live in a single SPA.

### 1. Loading screen
- **Purpose:** Mood-set + cover the topojson fetch (~500ms–2s).
- **Layout:** Full-viewport overlay (`position: fixed; inset: 0; z-index: 9999`), centered content stack, gap 28px.
- **Content:**
  - Spinning wireframe orthographic globe — continent outlines (no country borders) + thin graticule, 220×220px, slow rotation (~12s/revolution).
  - Below globe: italic Fraunces tagline "*for those who came by early*" — 18px, 300 weight, color `--muted`. Fades in after 200ms over 800ms.
  - Top of screen, small mark: `THE PIONEERS' GUESTBOOK` — Fraunces 13px, 500 weight, letter-spacing 0.32em, uppercase, color `--ink`. Fades in 200ms after.
- **Exit:** After ~2.4s OR when topojson resolves (whichever later), fade overlay opacity to 0 over 700ms, then `display: none`.

### 2. Welcome modal
- **Purpose:** Optionally collect city/country before showing the map.
- **Layout:** Centered modal (`max-width: 460px`), `--paper` background, `0.5px solid --line` border, `border-radius: 4px`, padding 32px, soft shadow `0 12px 40px rgba(20,16,10,0.12)`.
- **Backdrop:** `rgba(20,16,10,0.35)` with 8px blur.
- **Content (top to bottom):**
  - Eyebrow: `WELCOME, PIONEER` — `.label-eyebrow` style (10px, 0.18em letter-spacing, uppercase, `--muted`).
  - Display heading: "**Sign the guestbook?**" — Fraunces 28px, 500 weight, line-height 1.1.
  - Subhead: "Drop a pin on the map, or stay anonymous. We're keeping count either way." — Fraunces italic 14px, `--muted`.
  - City input field (`.field` style) with autocomplete dropdown — fuzzy-matches against ~90-city seed DB. Selecting a row fills city + country + lat/lon.
  - Two buttons in a row, gap 8px:
    - Primary: "Add me to the map" — `--ink` background, `--paper` text, 12px 18px, `border-radius: 3px`.
    - Ghost: "Stay anonymous" — transparent, `--muted` text, no border.
- **Exit:** Either button transitions to the main view + persists visitor record.

### 3. Main view (persistent)

The two-column layout, full viewport.

#### 3a. Map column (left, flex-grow 1)
- **Top header — two corner shelves:**
  - Top-left shelf (absolute, anchored top-left): bottom-fade gradient from `--bg` to transparent, `0.5px` right + bottom borders, bottom-right corner radius 4px. Padding `22px 32px 36px 30px` desktop / `16px 22px 30px 18px` mobile. Contents:
    - `EST. MMXXVI` eyebrow
    - "The Pioneers' Guestbook" — Fraunces 26px (22px mobile), 500 weight, line-height 1.05, letter-spacing -0.015em
    - "*a quiet ledger of who came by*" — Fraunces italic 13px, `--muted`
  - Top-right shelf (absolute, anchored top-right): mirror gradient + borders. Contents:
    - `PROJECTION` eyebrow (right-aligned, fontSize 9)
    - Toggle pill: 4 buttons in a row inside `--paper` container with `0.5px` border + 3px padding, 4px gap. Buttons: **Globe / Mercator / Goode / Natural**. Active button: `--ink` background, `--paper` text. Inactive: transparent, `--muted` text. 11px font, 0.06em letter-spacing, uppercase.
- **The map itself:** SVG, fills column width and height. Renders in this order, bottom to top:
  - Sphere fill (orthographic only)
  - Graticule lines (`--line-2`, 0.4px / zoom, opacity 0.5)
  - Country fills (`--bg-2`, country borders `--ink` 0.4px / zoom, opacity 0.55) — **hover-aware** (see Interactions)
  - Globe shading (radial gradient overlay on orthographic only — soft inner light, dark edge vignette)
  - Pins (see Pin styles below)
- **Bottom-left zoom/spin controls:** vertical button stack (`--paper` background, `0.5px` border, 3px radius), stacked icon buttons:
  - **+** zoom in (clamped to 8×)
  - **−** zoom out (clamped to 0.5×)
  - **⊙** reset zoom + pan
  - **▶/⏸** spin toggle (only visible when projection is Globe)
- **Bottom-right "Leave a note" CTA:** Burgundy-filled button (`--accent` background, `--paper` text), text "Leave a Note", 13px, 500 weight, 12×20px padding, 4px radius. Has a subtle pulsing box-shadow halo to draw attention without being loud.

#### 3b. Sidebar (right, fixed width 360px desktop, hides under 920px)
- Background: `--paper` with `0.5px solid --line` left border.
- Padding: 28px.
- Scrollable.
- **Sections:**
  1. **Stats grid** — 2×2 grid of large numerals (Fraunces 32–40px) above small `--muted` labels. Cells: total pioneers, located, anonymous, average ★ rating.
  2. **Country tally** — small bar chart, top 6 countries. Each row: country name (Inter 12px), bar (`--accent` at varying opacity scaled to count), count in mono.
  3. **Guestbook entries** — chronological list of notes. Each entry card: `--bg` background, `0.5px` top border (no card border, just dividers). Top row: anonymous handle in display serif 14px + emoji glyph + tiny date in mono; star row (filled `--accent` stars, empty `--muted-2`); optional note body in Fraunces italic 14px; location footer in mono `--muted` 10px.
- On mobile (<920px), sidebar collapses below the map; a floating "Leave a Note" CTA appears bottom-right.

### Note dialog (overlay)
- Same modal chrome as Welcome modal.
- Star rating row: 5 click-toggle stars, `--accent` filled, `--muted-2` outline. Hover preview before click.
- Optional textarea — `.field` style, 80px tall, placeholder "*A note for the next pioneer (optional)…*".
- Show generated anonymous handle below: e.g. "Quiet Cartographer ✦" (display serif italic + emoji), regenerable via small ↻ button next to it.
- Checkbox: "Attach to my pin on the map" (only visible if visitor has a location).
- Submit + Cancel buttons.

### Country hover tooltip
- Triggered by hovering any country with at least one located visitor.
- Floats following the cursor with offset (+18, +18), flips to negative offsets if it would clip viewport edges. Width 220px, fixed positioning, z-index 50.
- `--paper` background, `0.5px --line` border, soft shadow `0 6px 24px rgba(20,16,10,0.10)`, 3px radius, padding `12px 14px`.
- Header rows:
  - `N PIONEERS` eyebrow (mono, 9px, 0.12em letter-spacing, uppercase, `--muted`)
  - Country name in Fraunces 16px, 500, letter-spacing -0.01em.
- Body: city list, sorted by count desc, max 8 rows. Each row is a flex line: city name (12px, ellipsis), 36×4px bar (`--line-2` track, `--accent` fill at 70% opacity, width = max(8%, count/total)), count in mono 10.5px right-aligned.
- Footer: "+ N more cities" italic Fraunces if truncated; dashed-rule-separated "+ N unspecified cities" line if any anonymous-city visitors exist.

## Interactions & Behavior

### Map gestures (unified across globe + flat projections)
- **One-finger drag / mouse drag:** Globe → rotates (sensitivity 0.4/zoom). Flat projections → pans.
- **Two-finger pinch (touch):** zoom (clamped 0.5×–8×). Pinch midpoint drift also pans flat projections.
- **Trackpad pinch:** browser fires `wheel + ctrlKey`; treated as zoom (`exp(-deltaY * 0.01)`).
- **Two-finger trackpad scroll:** Globe → rotates (lambda from deltaX, phi from deltaY, both ×0.3). Flat → pans by `-deltaX, -deltaY`.
- **Cmd/Ctrl + wheel:** zoom (same as pinch).
- **Wheel without modifier on globe:** rotate. On flat: pan.
- `touch-action: none` on the SVG so the browser doesn't claim gestures.
- All implemented with PointerEvents (single code path mouse + touch).

### Globe rotation
- Auto-rotates lambda by `rotationSpeed` (default 0.04 deg/frame ≈ 2.4 deg/s) via rAF when spinning enabled and globe projection active.
- Spin toggle pauses rAF but drag-rotation always works.
- Rotation pauses while dragging.

### Pin styling — must scale gracefully on skewed distributions
- Visitor distribution will be heavily skewed (e.g. 50% from one city). Naive linear pin sizing makes other pins invisible.
- **Algorithm (used in all four pin styles):**
  - Core dot is **fixed-size** (`2.2 / sqrt(zoom)`) so even single-visitor pins remain visible.
  - Halo radius `(3 + log2(count + 1) * 2.4) / sqrt(zoom)` — log scaling so the dynamic range stays in check.
  - Halo opacity `0.10 + min(0.25, log2(count + 1) * 0.06)` — busier cities feel more present without dominating.
  - When count > 1, render a small numeric badge inside the core (mono, 600 weight, font size `max(5.5, core * 1.2)`, `--paper` text).
  - Single-visitor pins have no badge — keeps them feeling individual.
- **Pin styles** (user-tweakable):
  - `ring` (default): faint pulsing ring (`@keyframes pulse` 2.2s infinite alternate) when count > 1, halo, core, thin outer ring at 50% opacity.
  - `dot`: halo + filled circle with thin paper-color stroke.
  - `pin`: classic teardrop — `path("M0,-10 C-4,-10 -6,-7 -6,-4 C-6,-1 -3,2 0,8 C3,2 6,-1 6,-4 C6,-7 4,-10 0,-10 Z")` filled `--accent`, paper outline, paper dot at `cy=-4 r=1.6`. Halo behind.
  - `stack`: row of small dots side-by-side (one per visitor up to 6), `+N` mono label below if more.
- All pin styles transform with `1/sqrt(zoom)` to grow modestly when zoomed in (visible but not overwhelming).
- Hover label: 10px Inter on `--ink` rect (96% opacity, 2px radius), positioned above the pin. Format: `City` if count=1, else `City · count`.

### Country hover
- Hovering a country whose name matches a visitor `country` field highlights the country (slightly darker fill, thicker stroke 0.9px/zoom, opacity 0.95) and shows the tooltip described above.
- Country name matching: normalize (lowercase, strip "the", strip non-alphanumerics) on both sides + use a hardcoded alias map (`USA ↔ United States of America`, `UK ↔ United Kingdom`, `Czech Republic ↔ Czechia`, etc.). See `globe.jsx → NAME_ALIASES` for the full list.
- Countries with zero visitors: cursor stays default, no hover state.

### Other transitions
- **Loading → welcome:** loader fades 700ms, modal scales in from 0.96 + opacity 0 over 240ms ease.
- **Modal open/close:** backdrop fades 200ms, dialog scales 0.96→1 over 240ms.
- **Note submission:** dialog dismisses, the new entry slides into the sidebar list with a 320ms fade+translate from y=-8.
- **CTA pulse:** `box-shadow 0 0 0 0 rgba(--accent, 0.45)` → `0 0 0 14px rgba(--accent, 0)` over 1.8s, infinite, ease-out. Pauses on hover.
- **Star hover:** instant fill preview while hovering a star at index i (fills 0..i).

## State Management

```ts
type VisitorRecord = {
  id: string;          // "v_" + 8 random base36
  ts: number;          // Date.now() at create
  city: string | null;
  country: string | null;
  countryCode: string | null;  // ISO alpha-2
  lat: number | null;
  lon: number | null;
};

type NoteRecord = {
  id: string;
  ts: number;
  visitorId: string;
  rating: number;       // 0–5
  body: string | null;
  handle: string;       // "Quiet Cartographer"
  emoji: string;        // single glyph from a curated list
  location: string | null;  // "City, Country" or "Country" or null
};

type Store = { visitors: VisitorRecord[]; notes: NoteRecord[]; };
```

- Persisted to `localStorage` under key `pioneers_guestbook_v1` as JSON.
- In production: replace with API calls. The visitor record is created on welcome-modal submit (or "Stay anonymous" → record with all location fields null). Notes are appended on note-dialog submit.

### App-level state
- `phase`: `"loading" | "welcome" | "ready"`
- `me`: current visitor record (after welcome modal)
- `noteOpen`: boolean
- `hoveredId`, `hoveredCountry`: visualization state
- `projectionId`: `"globe" | "mercator" | "goode" | "natural"`
- `rotation`: `[lambda, phi, gamma]`
- `zoom`: number
- `pan`: `[x, y]` (screen-space offset)
- `spinning`: boolean

### Tweak-state (developer-facing only — gate behind a feature flag in production, or remove)
- Palette: `bone | forest | navy | parchment`
- Pin style: `ring | dot | pin | stack`
- Rotation speed: 0–0.2 (0 = paused)

## Design Tokens

### Default palette ("Bone & Burgundy")

| Token | Hex | Usage |
|---|---|---|
| `--bg` | `#f4f1ea` | Page background, map fill |
| `--bg-2` | `#ebe6db` | Country fills, secondary surfaces |
| `--paper` | `#fbf9f3` | Cards, modals, sidebar, tooltips |
| `--ink` | `#1a1814` | Primary text, country borders, active button |
| `--ink-2` | `#2c2823` | Secondary text |
| `--muted` | `#7a7468` | Labels, captions, eyebrows |
| `--muted-2` | `#b6ad9c` | Placeholder, empty stars |
| `--line` | `#d9d2c3` | Hairline borders, dividers |
| `--line-2` | `#c4bba8` | Stronger dividers, scrollbar thumb |
| `--accent` | `#7a2a2a` | Burgundy — pins, primary CTA, stars, bars |
| `--accent-soft` | `#b8584a` | Lighter accent (hover, tints) |
| `--gold` | `#a08358` | Reserved (handle decoration) |

### Alternate palettes (for reference)

| | Forest | Navy | Parchment |
|---|---|---|---|
| `--bg` | `#f1ede2` | `#f3eee5` | `#efe9da` |
| `--ink` | `#1c1f1b` | `#171a25` | `#161310` |
| `--accent` | `#2f4a36` | `#1f3358` | `#5d2230` |

Full palette definitions in `source/data.jsx`.

### Typography
- **Display:** `Fraunces` (Google Fonts) — fallback `"Times New Roman", serif`. Weights used: 300, 400, 500. Italic accents are core to the brand.
- **UI / sans:** `Inter` (Google Fonts) — fallback `ui-sans-serif, system-ui`. Weights: 400, 500, 600.
- **Numerics / mono:** `JetBrains Mono` (Google Fonts) — fallback `ui-monospace, monospace`. Used for counts, dates, ISO codes.
- Body: `font-feature-settings: "ss01", "cv11"` (Inter stylistic alternates).

### Type scale
| Use | Family | Size | Weight | Letter-spacing |
|---|---|---|---|---|
| Hero / display titles | Fraunces | 22–28px | 500 | -0.015em |
| Section heading | Fraunces | 16px | 500 | -0.01em |
| Body | Inter | 14px | 400 | 0 |
| Sidebar handles, tooltip names | Fraunces | 14–16px | 400 | -0.01em |
| Italic accents (taglines, notes) | Fraunces italic | 13–18px | 300 | 0.01em |
| Labels / eyebrow | Inter | 10–11px | 500 | 0.18em uppercase |
| Tiny eyebrow (tooltip header) | JetBrains Mono | 9px | 500 | 0.12em uppercase |
| Numerics / counts | JetBrains Mono | 10–14px | 500/600 | tnum feature |
| Stat numerals | Fraunces | 32–40px | 400 | -0.02em |

### Spacing
- Modal padding: 32px
- Card padding: 28px (sidebar), 18–24px (entries)
- Header padding: 22px 30px desktop, 16px 18px mobile
- Vertical rhythm: 4 / 8 / 12 / 16 / 24 / 28 / 32px

### Border radius
- Buttons: 3–4px
- Modals/cards: 4px
- Pin badges: 2px
- Tooltips: 3px

### Borders & shadows
- Hairline: `0.5px solid var(--line)` — used everywhere. Use `border: 1px` only when the design explicitly calls for a heavier rule.
- Modal shadow: `0 12px 40px rgba(20,16,10,0.12)`
- Tooltip shadow: `0 6px 24px rgba(20,16,10,0.10), 0 1px 0 rgba(20,16,10,0.04)`
- CTA pulse: `box-shadow: 0 0 0 0 rgba(122,42,42,0.45)` keyframed to `0 0 0 14px rgba(122,42,42,0)`

## Assets

- **No imagery used.** All visuals are SVG-rendered (the map) or pure type/CSS.
- **Map data:** [world-atlas](https://github.com/topojson/world-atlas) `countries-110m.json` via `https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json`. In production, download once and serve from your own static hosting; ~100KB gzipped.
- **Topology lib:** [topojson-client](https://unpkg.com/topojson-client@3) for `feature()` + `mesh()`.
- **Geo projections:** [d3-geo](https://unpkg.com/d3-geo@3) + [d3-geo-projection](https://unpkg.com/d3-geo-projection@4) (the latter only needed for `geoGoode`).
- **City seed DB:** ~90 hand-picked cities in `source/data.jsx` (`CITY_DB` array — name, country, country code, lat, lon). For production, swap with a real autocomplete service (Mapbox geocoding, Algolia Places successor, or similar) — the data structure expected is `{ city, country, countryCode, lat, lon }`.
- **Fonts:** Loaded via Google Fonts `<link>` in `index.html` (`Fraunces:opsz,wght,ital@9..144,300..600,0..1`, `Inter:wght@400..600`, `JetBrains+Mono:wght@500`).

## Files

In `source/`:
- `index.html` — Document shell, font imports, base CSS (palette vars, typography, modal/loader/field/CTA styles), script tags for React/Babel/topojson/d3-geo, `<noscript>` fallback.
- `app.jsx` — Top-level `<App>`. State, layout, projection toggles, header shelves, zoom/spin/CTA controls, tweaks panel. ~370 lines.
- `globe.jsx` — `<GlobeMap>` SVG component. Topojson loader, projection switching (globe/mercator/goode/natural), pointer-event gestures (drag/pinch/wheel), country hover tooltip, pin rendering with all four styles + log scaling.
- `modals.jsx` — Welcome modal (city autocomplete), Note dialog (stars, handle generation, textarea).
- `sidebar.jsx` — Stats grid, country tally bar chart, guestbook entry list.
- `data.jsx` — `PALETTES`, `CITY_DB`, `COUNTRY_DB`, anonymous handle generator (adjective+noun+emoji), localStorage helpers.
- `tweaks-panel.jsx` — Floating dev-only tweak controls (palette, pin style, rotation speed). Strip from production.

## Implementation Notes / Gotchas

1. **Country name matching** is the trickiest part. Visitors enter free text ("USA", "UK"); world-atlas features have official names ("United States of America", "United Kingdom"). The alias map in `globe.jsx → NAME_ALIASES` handles ~10 common cases. For production, normalize visitor input at write-time using a real ISO database lookup, and key the breakdown map by ISO numeric code (which is what world-atlas uses as `feature.id`).

2. **Mercator Antarctica clip:** Mercator's pole distortion blows Antarctica up to fill the southern half of the screen. The prototype clips the projection to roughly ±60°S to 72°N via a custom clipExtent. Keep this — uncropped Mercator looks terrible.

3. **Goode Homolosine** is the "interrupted" projection — the basketball-slices look. It's visually distinctive but split land masses across the Atlantic and Pacific seams. Pins on the seams may render twice. The prototype accepts this; if it's a problem, fall back to Natural Earth.

4. **`sqrt(zoom)` in pin scaling** is intentional — pins should grow when zooming in, but more slowly than the map itself, so they don't overwhelm the geography.

5. **localStorage key** is `pioneers_guestbook_v1`. Bump the version suffix when you change the schema.

6. **Mobile breakpoint** is 920px (sidebar collapses). Keep this generous — on a typical 13" laptop in a half-screen window, the design needs to gracefully reflow.

7. **Accessibility:** the prototype is light on a11y. Add at minimum: keyboard focus rings on all buttons, `aria-label` on the icon-only zoom/spin buttons, `role="dialog"` + `aria-modal` + focus trap on modals, `aria-live="polite"` region for new guestbook entries, `prefers-reduced-motion` query to disable rAF spin + CTA pulse.

8. **Server-side data:** the prototype trusts the client. In production, validate visitor + note records server-side, debounce the city autocomplete, rate-limit submissions per IP, and consider moderating note bodies.
