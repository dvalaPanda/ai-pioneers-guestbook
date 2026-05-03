import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Feature } from "geojson";
import { useWorldData } from "../hooks/useWorldData";
import {
  makeProjection,
  makePath,
  getGraticule,
  normalizeName,
  lookupAliases,
  isVisibleOnGlobe,
} from "../lib/geo";
import type { PinStyle, ProjectionId, Visitor } from "../types";

interface PinGroup {
  lat: number;
  lon: number;
  label: string;
  country: string | null;
  visitors: Visitor[];
}

interface CountryHover {
  featureId: string | number | undefined;
  name: string;
  total: number;
  cities: [string, number][];
  anonymous: number;
  x: number;
  y: number;
}

export interface GlobeMapProps {
  width: number;
  height: number;
  projectionId: ProjectionId;
  rotation: [number, number, number];
  setRotation: (
    r: [number, number, number] | ((prev: [number, number, number]) => [number, number, number]),
  ) => void;
  visitors: Visitor[];
  pinStyle: PinStyle;
  accentColor: string;
  hoveredId: string | null;
  setHoveredId: (id: string | null) => void;
  zoom: number;
  setZoom: (z: number | ((prev: number) => number)) => void;
  pan: [number, number];
  setPan: (p: [number, number] | ((prev: [number, number]) => [number, number])) => void;
}

export function GlobeMap({
  width,
  height,
  projectionId,
  rotation,
  setRotation,
  visitors,
  pinStyle,
  accentColor,
  hoveredId,
  setHoveredId,
  zoom,
  setZoom,
  pan,
  setPan,
}: GlobeMapProps) {
  const world = useWorldData();
  const svgRef = useRef<SVGSVGElement | null>(null);

  const rotationRef = useRef(rotation);
  const panRef = useRef(pan);
  const zoomRef = useRef(zoom);
  rotationRef.current = rotation;
  panRef.current = pan;
  zoomRef.current = zoom;

  const projection = useMemo(
    () => makeProjection(projectionId, width, height, rotation),
    [projectionId, width, height, rotation],
  );
  const path = useMemo(() => makePath(projection), [projection]);
  const isGlobe = projectionId === "globe";

  // Pointer interactions: drag to rotate (globe) / pan (map), pinch zoom.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let mode: "drag" | "pinch" | null = null;
    let last: { x: number; y: number } | null = null;
    let startRot: [number, number, number] = [...rotationRef.current] as [number, number, number];
    let startPan: [number, number] = [...panRef.current] as [number, number];
    let startZoom = zoomRef.current;
    let startDist = 0;
    let startMid: { x: number; y: number } | null = null;

    const distance = (a: { x: number; y: number }, b: { x: number; y: number }) =>
      Math.hypot(a.x - b.x, a.y - b.y);
    const midpoint = (a: { x: number; y: number }, b: { x: number; y: number }) => ({
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    });

    const onDown = (e: PointerEvent) => {
      svg.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        mode = "drag";
        last = { x: e.clientX, y: e.clientY };
        startRot = [...rotationRef.current] as [number, number, number];
        startPan = [...panRef.current] as [number, number];
        svg.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        mode = "pinch";
        const pts = [...pointers.values()];
        startDist = distance(pts[0]!, pts[1]!);
        startMid = midpoint(pts[0]!, pts[1]!);
        startZoom = zoomRef.current;
        startPan = [...panRef.current] as [number, number];
        startRot = [...rotationRef.current] as [number, number, number];
      }
    };

    const onMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (mode === "drag" && pointers.size === 1 && last) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        if (isGlobe) {
          const sensitivity = 0.4 / zoomRef.current;
          setRotation([
            startRot[0] + dx * sensitivity,
            Math.max(-90, Math.min(90, startRot[1] - dy * sensitivity)),
            startRot[2] || 0,
          ]);
        } else {
          setPan([startPan[0] + dx, startPan[1] + dy]);
        }
      } else if (mode === "pinch" && pointers.size === 2 && startMid) {
        const pts = [...pointers.values()];
        const dist = distance(pts[0]!, pts[1]!);
        const mid = midpoint(pts[0]!, pts[1]!);
        const scaleFactor = dist / startDist;
        const nextZoom = Math.max(0.5, Math.min(8, startZoom * scaleFactor));
        const dxMid = mid.x - startMid.x;
        const dyMid = mid.y - startMid.y;
        setZoom(nextZoom);
        if (!isGlobe) setPan([startPan[0] + dxMid, startPan[1] + dyMid]);
      }
    };

    const onUp = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      try {
        svg.releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
      if (pointers.size === 0) {
        mode = null;
        svg.style.cursor = "grab";
      } else if (pointers.size === 1) {
        mode = "drag";
        const remaining = [...pointers.values()][0]!;
        last = { x: remaining.x, y: remaining.y };
        startRot = [...rotationRef.current] as [number, number, number];
        startPan = [...panRef.current] as [number, number];
      }
    };

    svg.addEventListener("pointerdown", onDown);
    svg.addEventListener("pointermove", onMove);
    svg.addEventListener("pointerup", onUp);
    svg.addEventListener("pointercancel", onUp);
    svg.style.cursor = "grab";
    svg.style.touchAction = "none";

    return () => {
      svg.removeEventListener("pointerdown", onDown);
      svg.removeEventListener("pointermove", onMove);
      svg.removeEventListener("pointerup", onUp);
      svg.removeEventListener("pointercancel", onUp);
    };
  }, [isGlobe, setRotation, setPan, setZoom]);

  // Wheel: pinch-zoom or scroll-pan / scroll-rotate.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const isZoom = e.ctrlKey || e.metaKey;
      if (isZoom) {
        const factor = Math.exp(-e.deltaY * 0.01);
        setZoom((z) => Math.max(0.5, Math.min(8, z * factor)));
      } else if (isGlobe) {
        setRotation((r) => [
          r[0] - e.deltaX * 0.3,
          Math.max(-90, Math.min(90, r[1] + e.deltaY * 0.3)),
          r[2] || 0,
        ]);
      } else {
        setPan((p) => [p[0] - e.deltaX, p[1] - e.deltaY]);
      }
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [setZoom, setPan, setRotation, isGlobe]);

  // Group visitors by approximate location for stacked pins.
  const pinGroups = useMemo<PinGroup[]>(() => {
    const m = new Map<string, PinGroup>();
    for (const v of visitors) {
      if (v.lat == null || v.lon == null) continue;
      const key = `${v.lat.toFixed(2)},${v.lon.toFixed(2)}`;
      const existing = m.get(key);
      if (!existing) {
        m.set(key, {
          lat: v.lat,
          lon: v.lon,
          label: v.city ?? v.country ?? "",
          country: v.country,
          visitors: [v],
        });
      } else {
        existing.visitors.push(v);
      }
    }
    return [...m.values()];
  }, [visitors]);

  // Per-country aggregation for tooltip.
  const countryStats = useMemo(() => {
    const m = new Map<
      string,
      { country: string; total: number; cities: Map<string, number>; anonymous: number }
    >();
    for (const v of visitors) {
      if (!v.country) continue;
      const norm = normalizeName(v.country);
      let entry = m.get(norm);
      if (!entry) {
        entry = { country: v.country, total: 0, cities: new Map(), anonymous: 0 };
        m.set(norm, entry);
      }
      entry.total += 1;
      if (v.city) {
        entry.cities.set(v.city, (entry.cities.get(v.city) ?? 0) + 1);
      } else {
        entry.anonymous += 1;
      }
    }
    return m;
  }, [visitors]);

  const lookupCountryStats = useCallback(
    (name: string | undefined | null) => {
      if (!name) return null;
      const norm = normalizeName(name);
      for (const candidate of lookupAliases(norm)) {
        const hit = countryStats.get(candidate);
        if (hit) return hit;
      }
      return null;
    },
    [countryStats],
  );

  const [hoveredCountry, setHoveredCountry] = useState<CountryHover | null>(null);

  const graticulePath = useMemo(() => path(getGraticule()), [path]);
  const spherePath = useMemo(() => path({ type: "Sphere" }), [path]);

  if (!world) {
    return (
      <div
        style={{
          width,
          height,
          display: "grid",
          placeItems: "center",
          color: "var(--muted)",
          fontFamily: "var(--font-display)",
          fontStyle: "italic",
        }}
      >
        Charting the world…
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ overflow: "hidden", display: "block" }}
        role="img"
        aria-label="Interactive map of guestbook visitors"
      >
        <defs>
          <radialGradient id="globe-shade" cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
          </radialGradient>
        </defs>

        <g
          transform={`translate(${width / 2 + pan[0]} ${height / 2 + pan[1]}) scale(${zoom}) translate(${-width / 2} ${-height / 2})`}
        >
          <path
            d={spherePath ?? undefined}
            fill="var(--paper)"
            stroke="var(--ink)"
            strokeWidth={(isGlobe ? 1 : 0.5) / zoom}
          />
          <path
            d={graticulePath ?? undefined}
            fill="none"
            stroke="var(--line-2)"
            strokeWidth={0.4 / zoom}
            opacity={0.5}
          />

          <g>
            {world.countries.features.map((f: Feature, i: number) => {
              const fname = (f.properties as { name?: string } | null)?.name;
              const stats = lookupCountryStats(fname);
              const hasVisitors = stats && stats.total > 0;
              const isHov =
                hoveredCountry !== null && hoveredCountry.featureId === f.id;
              return (
                <path
                  key={f.id ?? i}
                  d={path(f) ?? undefined}
                  fill={
                    isHov
                      ? "var(--accent-soft)"
                      : hasVisitors
                        ? "var(--bg-2)"
                        : "var(--bg-2)"
                  }
                  stroke="var(--ink)"
                  strokeWidth={(isHov ? 0.9 : 0.4) / zoom}
                  strokeOpacity={isHov ? 0.95 : 0.55}
                  style={{ cursor: stats ? "pointer" : "default", transition: "fill 80ms" }}
                  onMouseEnter={(e) => {
                    if (!stats) {
                      setHoveredCountry(null);
                      return;
                    }
                    setHoveredCountry({
                      featureId: f.id,
                      name: stats.country,
                      total: stats.total,
                      cities: [...stats.cities.entries()].sort((a, b) => b[1] - a[1]),
                      anonymous: stats.anonymous,
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }}
                  onMouseMove={(e) => {
                    if (!stats) return;
                    setHoveredCountry((h) =>
                      h && h.featureId === f.id ? { ...h, x: e.clientX, y: e.clientY } : h,
                    );
                  }}
                  onMouseLeave={() => setHoveredCountry(null)}
                />
              );
            })}
          </g>

          {isGlobe && (
            <path d={spherePath ?? undefined} fill="url(#globe-shade)" pointerEvents="none" />
          )}

          <g>
            {pinGroups.map((g, i) => {
              if (isGlobe && !isVisibleOnGlobe(g.lon, g.lat, rotation)) return null;
              const proj = projection([g.lon, g.lat]);
              if (!proj) return null;
              const [x, y] = proj;
              const count = g.visitors.length;
              const core = 2.2 / Math.sqrt(zoom);
              const halo = (3 + Math.log2(count + 1) * 2.4) / Math.sqrt(zoom);
              const haloOpacity = 0.1 + Math.min(0.25, Math.log2(count + 1) * 0.06);
              const isHovered = g.visitors.some((v) => v.id === hoveredId);
              const labelText = count === 1 ? g.label : `${g.label} · ${count}`;

              return (
                <g
                  key={i}
                  transform={`translate(${x},${y})`}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHoveredId(g.visitors[0]!.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {pinStyle === "dot" && (
                    <>
                      <circle r={halo} fill={accentColor} opacity={haloOpacity} />
                      <circle
                        r={core}
                        fill={accentColor}
                        stroke="var(--paper)"
                        strokeWidth={0.6 / zoom}
                      />
                    </>
                  )}
                  {pinStyle === "ring" && (
                    <>
                      {count > 1 && (
                        <circle
                          className="pin-pulse"
                          r={core * 1.4}
                          fill="none"
                          stroke={accentColor}
                          strokeWidth={0.8 / zoom}
                        />
                      )}
                      <circle r={halo} fill={accentColor} opacity={haloOpacity * 0.7} />
                      <circle r={core} fill={accentColor} />
                      <circle
                        r={core + 1.6 / zoom}
                        fill="none"
                        stroke={accentColor}
                        strokeWidth={0.6 / zoom}
                        opacity={0.5}
                      />
                    </>
                  )}
                  {pinStyle === "pin" && (
                    <g transform={`scale(${1 / Math.sqrt(zoom)})`}>
                      <circle
                        r={halo * Math.sqrt(zoom)}
                        fill={accentColor}
                        opacity={haloOpacity * 0.7}
                      />
                      <path
                        d="M0,-10 C-4,-10 -6,-7 -6,-4 C-6,-1 -3,2 0,8 C3,2 6,-1 6,-4 C6,-7 4,-10 0,-10 Z"
                        fill={accentColor}
                        stroke="var(--paper)"
                        strokeWidth={0.6}
                      />
                      <circle cy={-4} r={1.6} fill="var(--paper)" />
                    </g>
                  )}
                  {pinStyle === "stack" && (
                    <g transform={`scale(${1 / Math.sqrt(zoom)})`}>
                      {[...Array(Math.min(count, 6))].map((_, k) => (
                        <circle
                          key={k}
                          cx={(k - Math.min(count, 6) / 2 + 0.5) * 3.4}
                          r={1.6}
                          fill={accentColor}
                          stroke="var(--paper)"
                          strokeWidth={0.4}
                        />
                      ))}
                      {count > 6 && (
                        <text
                          y={10}
                          textAnchor="middle"
                          fontSize="8"
                          fill="var(--muted)"
                          fontFamily="var(--font-mono)"
                        >
                          +{count - 6}
                        </text>
                      )}
                    </g>
                  )}
                  {count > 1 && pinStyle !== "stack" && (
                    <text
                      y={core * 0.4}
                      textAnchor="middle"
                      fill="var(--paper)"
                      fontFamily="var(--font-mono)"
                      fontWeight="600"
                      fontSize={Math.max(5.5, core * 1.2)}
                      pointerEvents="none"
                    >
                      {count > 99 ? "99+" : count}
                    </text>
                  )}
                  {isHovered && (
                    <g
                      transform={`translate(0, ${-halo - 10 / zoom}) scale(${1 / zoom})`}
                      pointerEvents="none"
                    >
                      <rect
                        x={-(labelText.length * 3.5 + 10)}
                        y={-16}
                        width={labelText.length * 7 + 20}
                        height={20}
                        rx={2}
                        fill="var(--ink)"
                        opacity={0.96}
                      />
                      <text
                        textAnchor="middle"
                        y={-2.5}
                        fill="var(--paper)"
                        fontSize="10"
                        fontFamily="var(--font-sans)"
                        fontWeight="500"
                      >
                        {labelText}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      {hoveredCountry !== null && <CountryTooltip h={hoveredCountry} accentColor={accentColor} />}
    </div>
  );
}

function CountryTooltip({ h, accentColor }: { h: CountryHover; accentColor: string }) {
  const TT_W = 220;
  const margin = 16;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  let left = h.x + 18;
  let top = h.y + 18;
  if (left + TT_W + margin > vw) left = h.x - TT_W - 18;
  if (top + 200 > vh) top = Math.max(margin, h.y - 200);

  return (
    <div
      style={{
        position: "fixed",
        left,
        top,
        width: TT_W,
        background: "var(--paper)",
        color: "var(--ink)",
        border: "0.5px solid var(--line)",
        boxShadow:
          "0 6px 24px rgba(20,16,10,0.10), 0 1px 0 rgba(20,16,10,0.04)",
        padding: "12px 14px 12px",
        fontFamily: "var(--font-sans)",
        fontSize: 12,
        pointerEvents: "none",
        zIndex: 50,
        borderRadius: 3,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 9,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--muted)",
          marginBottom: 4,
        }}
      >
        {h.total} {h.total === 1 ? "pioneer" : "pioneers"}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: 16,
          fontWeight: 500,
          lineHeight: 1.1,
          marginBottom: 10,
          letterSpacing: "-0.01em",
        }}
      >
        {h.name}
      </div>
      {h.cities.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {h.cities.slice(0, 8).map(([city, count]) => {
            const pct = count / h.total;
            return (
              <div
                key={city}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11.5,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    color: "var(--ink)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {city}
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    width: 36,
                    height: 4,
                    background: "var(--line-2)",
                    borderRadius: 2,
                    overflow: "hidden",
                  }}
                >
                  <span
                    style={{
                      display: "block",
                      height: "100%",
                      width: `${Math.max(8, pct * 100)}%`,
                      background: accentColor,
                      opacity: 0.7,
                    }}
                  />
                </span>
                <span
                  style={{
                    flexShrink: 0,
                    fontFamily: "var(--font-mono)",
                    fontSize: 10.5,
                    color: "var(--muted)",
                    minWidth: 16,
                    textAlign: "right",
                  }}
                >
                  {count}
                </span>
              </div>
            );
          })}
          {h.cities.length > 8 && (
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 4,
                fontStyle: "italic",
                fontFamily: "var(--font-display)",
              }}
            >
              + {h.cities.length - 8} more {h.cities.length - 8 === 1 ? "city" : "cities"}
            </div>
          )}
          {h.anonymous > 0 && (
            <div
              style={{
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 6,
                paddingTop: 6,
                borderTop: "0.5px dashed var(--line)",
                fontStyle: "italic",
              }}
            >
              + {h.anonymous} unspecified {h.anonymous === 1 ? "city" : "cities"}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
          {h.anonymous} {h.anonymous === 1 ? "pioneer, location" : "pioneers, locations"} unspecified
        </div>
      )}
    </div>
  );
}
