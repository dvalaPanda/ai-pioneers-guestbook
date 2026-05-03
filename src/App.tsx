import { useEffect, useMemo, useState } from "react";
import { GlobeMap } from "./components/GlobeMap";
import { Loader } from "./components/Loader";
import { NoteDialog, type NoteSubmission } from "./components/NoteDialog";
import { Sidebar } from "./components/Sidebar";
import { TweaksPanel } from "./components/TweaksPanel";
import { WelcomeModal } from "./components/WelcomeModal";
import { useTweaks } from "./hooks/useTweaks";
import { useViewport } from "./hooks/useViewport";
import { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
import { applyPalette } from "./lib/data/palettes";
import { PROJECTIONS } from "./lib/data/projections";
import { makeAnonName } from "./lib/names";
import { ApiError, createNote, createVisitor } from "./lib/api";
import { appendNote, appendVisitor, getState, hydrate, subscribe } from "./lib/store";
import type {
  ApiState,
  Note,
  PickedLocation,
  ProjectionId,
  Visitor,
} from "./types";

type Phase = "loading" | "welcome" | "ready";

function readAccentColor(): string {
  if (typeof document === "undefined") return "#7a2a2a";
  const v = getComputedStyle(document.documentElement)
    .getPropertyValue("--accent")
    .trim();
  return v || "#7a2a2a";
}

const errorCopy: Record<string, string> = {
  rate_limited: "You're going a bit fast — wait a minute and try again.",
  turnstile_failed: "Captcha failed. Reload and try again.",
  rejected_content: "Your note was rejected by our auto-filter.",
  invalid_display_name: "Couldn't generate a valid handle. Try again.",
  invalid_emoji: "Couldn't generate a valid emoji. Try again.",
  invalid_country_code: "Country code looks off — pick from the list.",
  lat_lon_mismatch: "Location coords were inconsistent — pick from the list.",
  invalid_coords: "Location coords looked invalid.",
  unknown_visitor: "Your session expired. Reload to try again.",
  internal: "Something went wrong on our end. Please try again.",
};

function formatError(e: unknown): string {
  if (e instanceof ApiError) {
    const code =
      e.payload && typeof e.payload === "object" && "error" in e.payload
        ? String((e.payload as { error: unknown }).error)
        : null;
    if (code && errorCopy[code]) return errorCopy[code]!;
    return code ? `Error: ${code}` : "Network error.";
  }
  return "Network error.";
}

export default function App() {
  const [tweaks, setTweak] = useTweaks();
  const vp = useViewport();
  const reducedMotion = usePrefersReducedMotion();
  const isMobile = vp.w < 920;

  const [state, setState] = useState<ApiState>(getState());
  const [phase, setPhase] = useState<Phase>("loading");
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [me, setMe] = useState<Visitor | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Map state
  const [projectionId, setProjectionId] = useState<ProjectionId>("globe");
  const [rotation, setRotation] = useState<[number, number, number]>([20, -8, 0]);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [spinning, setSpinning] = useState(true);
  const [accentColor, setAccentColor] = useState(readAccentColor());

  const [welcomeSubmitting, setWelcomeSubmitting] = useState(false);
  const [welcomeError, setWelcomeError] = useState<string | null>(null);
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  // Subscribe to store
  useEffect(() => subscribe(setState), []);

  // Hydrate state and run loader timing in parallel.
  useEffect(() => {
    let cancelled = false;
    const minDelay = new Promise<void>((r) => setTimeout(r, reducedMotion ? 400 : 1800));
    const work = (async () => {
      try {
        await hydrate();
      } catch (e) {
        console.error("hydrate failed", e);
      }
    })();
    Promise.all([minDelay, work]).then(() => {
      if (cancelled) return;
      setPhase("welcome");
      setWelcomeVisible(true);
    });
    return () => {
      cancelled = true;
    };
  }, [reducedMotion]);

  // Apply palette + grab the accent color whenever it changes.
  useEffect(() => {
    applyPalette(tweaks.palette);
    setAccentColor(readAccentColor());
  }, [tweaks.palette]);

  // Reset zoom/pan when projection changes
  useEffect(() => {
    setZoom(1);
    setPan([0, 0]);
  }, [projectionId]);

  // Auto-rotate globe
  useEffect(() => {
    if (projectionId !== "globe" || !spinning || tweaks.rotationSpeed === 0) return;
    if (reducedMotion) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotation((r) => [r[0] + dt * 60 * tweaks.rotationSpeed, r[1], r[2]]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [projectionId, spinning, tweaks.rotationSpeed, reducedMotion]);

  const submitWelcome = async (loc: PickedLocation, turnstileToken: string) => {
    setWelcomeSubmitting(true);
    setWelcomeError(null);
    try {
      const { id, createdAt } = await createVisitor({ ...loc, turnstileToken });
      const visitor: Visitor = { id, createdAt, ...loc };
      appendVisitor(visitor);
      setMe(visitor);
      setWelcomeVisible(false);
      setTimeout(() => setPhase("ready"), 600);
    } catch (e) {
      setWelcomeError(formatError(e));
    } finally {
      setWelcomeSubmitting(false);
    }
  };

  const skipWelcome = async (turnstileToken: string) => {
    setWelcomeSubmitting(true);
    setWelcomeError(null);
    try {
      const empty: PickedLocation = {
        city: null,
        country: null,
        countryCode: null,
        lat: null,
        lon: null,
      };
      const { id, createdAt } = await createVisitor({ ...empty, turnstileToken });
      const visitor: Visitor = { id, createdAt, ...empty };
      appendVisitor(visitor);
      setMe(visitor);
      setWelcomeVisible(false);
      setTimeout(() => setPhase("ready"), 600);
    } catch (e) {
      setWelcomeError(formatError(e));
    } finally {
      setWelcomeSubmitting(false);
    }
  };

  const submitNote = async ({ rating, body, turnstileToken }: NoteSubmission) => {
    setNoteSubmitting(true);
    setNoteError(null);
    try {
      const handle = makeAnonName();
      const created: Note = await createNote({
        visitorId: me?.id ?? null,
        rating,
        body: body || null,
        displayName: handle.name,
        emoji: handle.emoji,
        turnstileToken,
      });
      appendNote(created);
      setNoteOpen(false);
    } catch (e) {
      setNoteError(formatError(e));
    } finally {
      setNoteSubmitting(false);
    }
  };

  const sidebarW = isMobile ? 0 : 340;
  const sidebarH = isMobile ? Math.min(vp.h * 0.42, 380) : 0;
  const mapW = isMobile ? vp.w : Math.max(0, vp.w - sidebarW);
  const mapH = isMobile ? Math.max(0, vp.h - sidebarH) : vp.h;

  const turnstileSiteKey = state.config.turnstileSiteKey;

  const headerLeftMaxW = useMemo(
    () => (isMobile ? "calc(100vw - 140px)" : "min(420px, 50%)"),
    [isMobile],
  );

  const resetView = () => {
    setZoom(1);
    setPan([0, 0]);
    if (projectionId === "globe") setRotation([20, -8, 0]);
  };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        background: "var(--bg)",
      }}
    >
      <main style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0 }}>
        <header
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 5,
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              pointerEvents: "auto",
              maxWidth: headerLeftMaxW,
              background:
                "linear-gradient(180deg, var(--bg) 0%, var(--bg) 65%, rgba(244,241,234,0) 100%)",
              padding: isMobile ? "16px 22px 30px 18px" : "22px 32px 36px 30px",
              borderRight: "0.5px solid var(--line)",
              borderBottom: "0.5px solid var(--line)",
              borderBottomRightRadius: 4,
            }}
          >
            <div className="label-eyebrow" style={{ marginBottom: 4 }}>
              Est. MMXXVI
            </div>
            <div
              className="display"
              style={{
                fontSize: isMobile ? 22 : 26,
                fontWeight: 500,
                lineHeight: 1.05,
                letterSpacing: "-0.015em",
              }}
            >
              The Pioneers' Guestbook
            </div>
            <div
              className="display"
              style={{
                fontStyle: "italic",
                color: "var(--muted)",
                fontSize: 13,
                marginTop: 4,
                fontWeight: 300,
              }}
            >
              left open, for those who pass
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              pointerEvents: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 8,
              alignItems: "flex-end",
              background:
                "linear-gradient(180deg, var(--bg) 0%, var(--bg) 65%, rgba(244,241,234,0) 100%)",
              padding: isMobile ? "16px 18px 30px 22px" : "22px 30px 36px 32px",
              borderLeft: "0.5px solid var(--line)",
              borderBottom: "0.5px solid var(--line)",
              borderBottomLeftRadius: 4,
            }}
          >
            <div
              className="label-eyebrow"
              style={{ fontSize: 9, alignSelf: "flex-end" }}
            >
              Projection
            </div>
            <div
              role="radiogroup"
              aria-label="Map projection"
              style={{
                display: "flex",
                gap: 4,
                background: "var(--paper)",
                border: "0.5px solid var(--line)",
                padding: 3,
                borderRadius: 3,
                flexWrap: "nowrap",
              }}
            >
              {PROJECTIONS.map((p) => {
                const label = isMobile ? p.short : p.label;
                const active = projectionId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setProjectionId(p.id)}
                    style={{
                      border: 0,
                      background: active ? "var(--ink)" : "transparent",
                      color: active ? "var(--paper)" : "var(--muted)",
                      padding: isMobile ? "6px 8px" : "6px 11px",
                      fontSize: isMobile ? 9.5 : 10,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      borderRadius: 2,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        <div style={{ position: "absolute", inset: 0 }}>
          <GlobeMap
            width={mapW}
            height={mapH}
            projectionId={projectionId}
            rotation={rotation}
            setRotation={setRotation}
            visitors={state.visitors}
            pinStyle={tweaks.pinStyle}
            accentColor={accentColor}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            zoom={zoom}
            setZoom={setZoom}
            pan={pan}
            setPan={setPan}
          />
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 14,
            left: 22,
            zIndex: 4,
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          {projectionId === "globe" && (
            <button
              type="button"
              onClick={() => setSpinning((s) => !s)}
              title={spinning ? "Pause rotation" : "Resume rotation"}
              aria-label={spinning ? "Pause rotation" : "Resume rotation"}
              style={{
                width: 30,
                height: 30,
                border: "0.5px solid var(--line)",
                background: "var(--paper)",
                borderRadius: 2,
                display: "grid",
                placeItems: "center",
                color: "var(--ink-2)",
                cursor: "pointer",
              }}
            >
              {spinning ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" />
                  <rect x="14" y="5" width="4" height="14" />
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(z * 1.4, 8))}
            aria-label="Zoom in"
            style={{
              width: 30,
              height: 30,
              border: "0.5px solid var(--line)",
              background: "var(--paper)",
              borderRadius: 2,
              fontSize: 16,
              color: "var(--ink-2)",
              fontFamily: "var(--font-display)",
              lineHeight: 1,
              padding: 0,
              cursor: "pointer",
            }}
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(z / 1.4, 0.5))}
            aria-label="Zoom out"
            style={{
              width: 30,
              height: 30,
              border: "0.5px solid var(--line)",
              background: "var(--paper)",
              borderRadius: 2,
              fontSize: 16,
              color: "var(--ink-2)",
              fontFamily: "var(--font-display)",
              lineHeight: 1,
              padding: 0,
              cursor: "pointer",
            }}
          >
            −
          </button>
          <button
            type="button"
            onClick={resetView}
            style={{
              height: 30,
              padding: "0 12px",
              border: "0.5px solid var(--line)",
              background: "var(--paper)",
              borderRadius: 2,
              fontSize: 10,
              color: "var(--ink-2)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 18,
            right: isMobile ? 110 : 22,
            fontSize: 10,
            color: "var(--muted)",
            letterSpacing: "0.08em",
            fontFamily: "var(--font-mono)",
            textTransform: "uppercase",
            pointerEvents: "none",
          }}
        >
          {state.totals.located} pinned
        </div>

        {isMobile && phase === "ready" && (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="cta-pulse"
            style={{
              position: "absolute",
              bottom: 16,
              right: 16,
              zIndex: 4,
              background: "var(--accent)",
              color: "var(--paper)",
              border: 0,
              padding: "12px 18px",
              borderRadius: 2,
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Leave a Note
          </button>
        )}
      </main>

      {phase === "ready" && (
        <Sidebar
          visitors={state.visitors}
          notes={state.notes}
          totals={state.totals}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onLeaveNote={() => setNoteOpen(true)}
          isMobile={isMobile}
        />
      )}

      <Loader visible={phase === "loading"} />
      <WelcomeModal
        visible={welcomeVisible}
        turnstileSiteKey={turnstileSiteKey}
        submitting={welcomeSubmitting}
        errorMessage={welcomeError}
        onSubmit={submitWelcome}
        onSkip={skipWelcome}
      />
      <NoteDialog
        visible={noteOpen}
        turnstileSiteKey={turnstileSiteKey}
        defaultLocation={me}
        submitting={noteSubmitting}
        errorMessage={noteError}
        onClose={() => setNoteOpen(false)}
        onSubmit={submitNote}
      />

      <TweaksPanel state={tweaks} onChange={setTweak} />
    </div>
  );
}
