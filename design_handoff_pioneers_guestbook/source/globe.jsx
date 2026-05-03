// globe.jsx — Interactive globe + map projection renderer using d3-geo

const PROJECTIONS = [
  { id: "globe",      label: "Globe",          kind: "globe" },
  { id: "mercator",   label: "Mercator",       kind: "map" },
  { id: "natural",    label: "Natural Earth",  kind: "map" },
  { id: "goode",      label: "Goode",          kind: "map" },
];

function makeProjection(id, w, h, rotation) {
  const d3g = window.d3;
  let p;
  if (id === "globe") {
    p = d3g.geoOrthographic().rotate(rotation).clipAngle(90);
  } else if (id === "mercator") {
    // Trim Antarctica & extreme north so the projection isn't distorted to absurdity.
    // Limit latitude to roughly ±60° before fitting.
    p = d3g.geoMercator();
    const sphere = { type: "Sphere" };
    const clipped = {
      type: "Polygon",
      coordinates: [[
        [-180, -60], [180, -60], [180, 72], [-180, 72], [-180, -60],
      ]],
    };
    p.fitExtent([[12, 12], [w - 12, h - 12]], clipped);
    return p;
  } else if (id === "natural") {
    p = (d3g.geoNaturalEarth1)();
  } else if (id === "goode") {
    // Goode Homolosine — interrupted, "basketball-slices" projection
    p = (d3g.geoInterruptedHomolosine || d3g.geoHomolosine || d3g.geoNaturalEarth1)();
  } else {
    p = d3g.geoNaturalEarth1();
  }
  const sphere = { type: "Sphere" };
  p.fitExtent([[12, 12], [w - 12, h - 12]], sphere);
  if (id === "globe") {
    const scale = Math.min(w, h) / 2 - 18;
    p.scale(scale).translate([w / 2, h / 2]).rotate(rotation);
  }
  return p;
}

// Hook: load topojson once
function useWorldData() {
  const [data, setData] = React.useState(null);
  React.useEffect(() => {
    let cancelled = false;
    const url = "https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json";
    fetch(url)
      .then(r => r.json())
      .then(topo => {
        if (cancelled) return;
        const t = window.topojson;
        const land = t.feature(topo, topo.objects.land);
        const countries = t.feature(topo, topo.objects.countries);
        const borders = t.mesh(topo, topo.objects.countries, (a, b) => a !== b);
        setData({ land, countries, borders });
      })
      .catch(err => console.error("world topo failed", err));
    return () => { cancelled = true; };
  }, []);
  return data;
}

// Generate graticule
function getGraticule() {
  return window.d3.geoGraticule().step([20, 20])();
}

function GlobeMap({
  width, height, projectionId, rotation, setRotation,
  visitors, pinStyle, accentColor, onPinClick, hoveredId, setHoveredId,
  zoom, setZoom, pan, setPan,
}) {
  const world = useWorldData();
  const svgRef = React.useRef(null);

  const projection = React.useMemo(
    () => makeProjection(projectionId, width, height, rotation),
    [projectionId, width, height, rotation]
  );
  const path = React.useMemo(() => window.d3.geoPath(projection), [projection]);
  const isGlobe = projectionId === "globe";

  // Drag-to-rotate on globe / drag-to-pan on map (mouse + touch via pointer events)
  React.useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const pointers = new Map(); // id -> {x, y}
    let mode = null; // 'drag' | 'pinch'
    let last = null;
    let startRot = rotation;
    let startPan = pan;
    let startZoom = zoom;
    let startDist = 0;
    let startMid = null;

    const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

    const onDown = (e) => {
      svg.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        mode = "drag";
        last = { x: e.clientX, y: e.clientY };
        startRot = rotation.slice();
        startPan = [...pan];
        svg.style.cursor = "grabbing";
      } else if (pointers.size === 2) {
        mode = "pinch";
        const pts = [...pointers.values()];
        startDist = distance(pts[0], pts[1]);
        startMid = midpoint(pts[0], pts[1]);
        startZoom = zoom;
        startPan = [...pan];
        startRot = rotation.slice();
      }
    };

    const onMove = (e) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (mode === "drag" && pointers.size === 1) {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        if (isGlobe) {
          const sensitivity = 0.4 / zoom;
          setRotation([
            startRot[0] + dx * sensitivity,
            Math.max(-90, Math.min(90, startRot[1] - dy * sensitivity)),
            startRot[2] || 0,
          ]);
        } else {
          setPan([startPan[0] + dx, startPan[1] + dy]);
        }
      } else if (mode === "pinch" && pointers.size === 2) {
        const pts = [...pointers.values()];
        const dist = distance(pts[0], pts[1]);
        const mid = midpoint(pts[0], pts[1]);
        const scaleFactor = dist / startDist;
        const nextZoom = Math.max(0.5, Math.min(8, startZoom * scaleFactor));
        // Pinch midpoint drift -> pan
        const dxMid = mid.x - startMid.x;
        const dyMid = mid.y - startMid.y;
        setZoom(nextZoom);
        if (!isGlobe) {
          setPan([startPan[0] + dxMid, startPan[1] + dyMid]);
        }
      }
    };

    const onUp = (e) => {
      pointers.delete(e.pointerId);
      try { svg.releasePointerCapture(e.pointerId); } catch {}
      if (pointers.size === 0) {
        mode = null;
        svg.style.cursor = "grab";
      } else if (pointers.size === 1) {
        // Switching from pinch back to drag
        mode = "drag";
        const remaining = [...pointers.values()][0];
        last = { x: remaining.x, y: remaining.y };
        startRot = rotation.slice();
        startPan = [...pan];
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
  }, [isGlobe, rotation, setRotation, pan, setPan, zoom, setZoom]);

  // Wheel: zoom (Ctrl/Cmd or pinch zoom on trackpad) — otherwise pan
  React.useEffect(() => {
    if (!svgRef.current) return;
    const svg = svgRef.current;
    const onWheel = (e) => {
      e.preventDefault();
      // Trackpad pinch fires wheel events with ctrlKey=true on most browsers
      const isZoom = e.ctrlKey || e.metaKey;
      if (isZoom) {
        const factor = Math.exp(-e.deltaY * 0.01);
        setZoom(z => Math.max(0.5, Math.min(8, z * factor)));
      } else {
        // Two-finger trackpad scroll → pan
        if (isGlobe) {
          // On globe: scroll rotates
          setRotation(r => [
            r[0] - e.deltaX * 0.3,
            Math.max(-90, Math.min(90, r[1] + e.deltaY * 0.3)),
            r[2] || 0,
          ]);
        } else {
          setPan(p => [p[0] - e.deltaX, p[1] - e.deltaY]);
        }
      }
    };
    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [setZoom, setPan, setRotation, isGlobe]);

  // Aggregate visitors by location for stacked pins
  const pinGroups = React.useMemo(() => {
    const map = new Map();
    visitors.forEach(v => {
      if (v.lat == null || v.lon == null) return;
      const key = `${v.lat.toFixed(2)},${v.lon.toFixed(2)}`;
      if (!map.has(key)) map.set(key, { lat: v.lat, lon: v.lon, label: v.city || v.country, country: v.country, visitors: [] });
      map.get(key).visitors.push(v);
    });
    return [...map.values()];
  }, [visitors]);

  const maxCount = Math.max(1, ...pinGroups.map(g => g.visitors.length));

  // Per-country city breakdown (for country hover tooltip)
  const normalizeName = (s) => (s || "").toLowerCase()
    .replace(/^the /, "").replace(/[^a-z0-9 ]/g, "").trim();
  const NAME_ALIASES = {
    "united states": ["usa", "us", "united states of america"],
    "united kingdom": ["uk", "great britain", "britain"],
    "russia": ["russian federation"],
    "south korea": ["korea republic of", "republic of korea"],
    "north korea": ["dem rep korea", "democratic peoples republic of korea"],
    "czech republic": ["czechia"],
    "burma": ["myanmar"],
    "ivory coast": ["cote divoire"],
    "democratic republic of the congo": ["dem rep congo", "dr congo", "congo dem rep"],
    "republic of the congo": ["congo"],
  };
  const countryStats = React.useMemo(() => {
    // Map: normalized country name -> { country, total, cities: Map<city, count>, anonymous }
    const m = new Map();
    visitors.forEach(v => {
      if (!v.country) return;
      const norm = normalizeName(v.country);
      if (!m.has(norm)) m.set(norm, { country: v.country, total: 0, cities: new Map(), anonymous: 0 });
      const entry = m.get(norm);
      entry.total += 1;
      if (v.city) {
        entry.cities.set(v.city, (entry.cities.get(v.city) || 0) + 1);
      } else {
        entry.anonymous += 1;
      }
    });
    return m;
  }, [visitors]);

  const lookupCountryStats = React.useCallback((featureName) => {
    if (!featureName) return null;
    const norm = normalizeName(featureName);
    if (countryStats.has(norm)) return countryStats.get(norm);
    // Try aliases (both directions)
    for (const [canonical, aliases] of Object.entries(NAME_ALIASES)) {
      if (canonical === norm && aliases.some(a => countryStats.has(a))) {
        for (const a of aliases) if (countryStats.has(a)) return countryStats.get(a);
      }
      if (aliases.includes(norm) && countryStats.has(canonical)) return countryStats.get(canonical);
    }
    return null;
  }, [countryStats]);

  const [hoveredCountry, setHoveredCountry] = React.useState(null); // { name, stats, x, y }

  // For globe: only render pins on visible side
  const isVisible = (lon, lat) => {
    if (!isGlobe) return true;
    const [lambda, phi] = rotation;
    const cosc = Math.sin(lat * Math.PI/180) * Math.sin(-phi * Math.PI/180) +
                 Math.cos(lat * Math.PI/180) * Math.cos(-phi * Math.PI/180) *
                 Math.cos((lon + lambda) * Math.PI/180);
    return cosc > 0;
  };

  const graticulePath = React.useMemo(() => path(getGraticule()), [path]);
  const spherePath = React.useMemo(() => path({ type: "Sphere" }), [path]);

  if (!world) {
    return (
      <div style={{
        width, height, display: "grid", placeItems: "center",
        color: "var(--muted)", fontFamily: "var(--font-display)", fontStyle: "italic",
      }}>Charting the world…</div>
    );
  }

  return (
    <div style={{ position: "relative", width, height }}>
    <svg ref={svgRef} width={width} height={height} style={{ overflow: "hidden", display: "block" }}>
      <defs>
        <radialGradient id="globe-shade" cx="50%" cy="50%" r="50%">
          <stop offset="60%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.08)" />
        </radialGradient>
        <filter id="pin-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      <g transform={`translate(${width/2 + pan[0]} ${height/2 + pan[1]}) scale(${zoom}) translate(${-width/2} ${-height/2})`}>
        {/* Sphere outline */}
        <path d={spherePath} fill="var(--paper)" stroke="var(--ink)"
              strokeWidth={(isGlobe ? 1 : 0.5) / zoom} />

        {/* Graticule */}
        <path d={graticulePath} fill="none" stroke="var(--line-2)"
              strokeWidth={0.4 / zoom} opacity={0.5} />

        {/* Country fills */}
        <g>
          {world.countries.features.map((f, i) => {
            const name = f.properties && f.properties.name;
            const stats = lookupCountryStats(name);
            const hasVisitors = stats && stats.total > 0;
            const isHov = hoveredCountry && hoveredCountry.featureId === f.id;
            return (
              <path
                key={i}
                d={path(f)}
                fill={isHov ? "var(--accent-soft, rgba(0,0,0,0.06))" : (hasVisitors ? "var(--bg-3, var(--bg-2))" : "var(--bg-2)")}
                stroke="var(--ink)"
                strokeWidth={(isHov ? 0.9 : 0.4) / zoom}
                strokeOpacity={isHov ? 0.95 : 0.55}
                style={{ cursor: stats ? "pointer" : "default", transition: "fill 80ms" }}
                onMouseEnter={(e) => {
                  if (!stats) { setHoveredCountry(null); return; }
                  setHoveredCountry({
                    featureId: f.id, name: stats.country, stats,
                    x: e.clientX, y: e.clientY,
                  });
                }}
                onMouseMove={(e) => {
                  if (!stats) return;
                  setHoveredCountry(h => h && h.featureId === f.id
                    ? { ...h, x: e.clientX, y: e.clientY } : h);
                }}
                onMouseLeave={() => setHoveredCountry(null)}
              />
            );
          })}
        </g>

        {/* Globe shading */}
        {isGlobe && <path d={spherePath} fill="url(#globe-shade)" pointerEvents="none" />}

        {/* Pins */}
        <g>
          {pinGroups.map((g, i) => {
            if (!isVisible(g.lon, g.lat)) return null;
            const proj = projection([g.lon, g.lat]);
            if (!proj) return null;
            const [x, y] = proj;
            const count = g.visitors.length;
            // Log-scaled — handles skewed distributions gracefully.
            // The pin core is always 2px (visible even for count=1);
            // a soft halo grows logarithmically with count.
            const core = 2.2 / Math.sqrt(zoom);
            const halo = (3 + Math.log2(count + 1) * 2.4) / Math.sqrt(zoom);
            const haloOpacity = 0.10 + Math.min(0.25, Math.log2(count + 1) * 0.06);
            const isHovered = g.visitors.some(v => v.id === hoveredId);
            const labelText = count === 1 ? g.label : `${g.label} · ${count}`;

            return (
              <g key={i} transform={`translate(${x},${y})`}
                 style={{ cursor: "pointer" }}
                 onClick={() => onPinClick && onPinClick(g)}
                 onMouseEnter={() => setHoveredId && setHoveredId(g.visitors[0].id)}
                 onMouseLeave={() => setHoveredId && setHoveredId(null)}>
                {pinStyle === "dot" && (
                  <>
                    <circle r={halo} fill={accentColor} opacity={haloOpacity} />
                    <circle r={core} fill={accentColor} stroke="var(--paper)" strokeWidth={0.6/zoom} />
                  </>
                )}
                {pinStyle === "ring" && (
                  <>
                    {count > 1 && (
                      <circle className="pin-pulse" r={core * 1.4} fill="none"
                              stroke={accentColor} strokeWidth={0.8/zoom} />
                    )}
                    <circle r={halo} fill={accentColor} opacity={haloOpacity * 0.7} />
                    <circle r={core} fill={accentColor} />
                    <circle r={core + 1.6/zoom} fill="none" stroke={accentColor}
                            strokeWidth={0.6/zoom} opacity={0.5} />
                  </>
                )}
                {pinStyle === "pin" && (
                  <g transform={`scale(${1/Math.sqrt(zoom)})`}>
                    <circle r={halo * Math.sqrt(zoom)} fill={accentColor} opacity={haloOpacity * 0.7} />
                    <path d="M0,-10 C-4,-10 -6,-7 -6,-4 C-6,-1 -3,2 0,8 C3,2 6,-1 6,-4 C6,-7 4,-10 0,-10 Z"
                          fill={accentColor} stroke="var(--paper)" strokeWidth={0.6} />
                    <circle cy={-4} r={1.6} fill="var(--paper)" />
                  </g>
                )}
                {pinStyle === "stack" && (
                  <g transform={`scale(${1/Math.sqrt(zoom)})`}>
                    {[...Array(Math.min(count, 6))].map((_, k) => (
                      <circle key={k} cx={(k - Math.min(count,6)/2 + 0.5) * 3.4} r={1.6}
                              fill={accentColor} stroke="var(--paper)" strokeWidth={0.4} />
                    ))}
                    {count > 6 && (
                      <text y={10} textAnchor="middle" fontSize="8" fill="var(--muted)"
                            fontFamily="var(--font-mono)">+{count-6}</text>
                    )}
                  </g>
                )}
                {/* Count badge — only for groups with >1 visitor, so single pins stay clean */}
                {count > 1 && pinStyle !== "stack" && (
                  <text y={core * 0.4} textAnchor="middle"
                        fill="var(--paper)"
                        fontFamily="var(--font-mono)" fontWeight="600"
                        fontSize={Math.max(5.5, core * 1.2)}
                        pointerEvents="none">
                    {count > 99 ? "99+" : count}
                  </text>
                )}
                {/* Hover label */}
                {isHovered && (
                  <g transform={`translate(0, ${-halo - 10/zoom}) scale(${1/zoom})`} pointerEvents="none">
                    <rect x={-(labelText.length * 3.5 + 10)} y={-16}
                          width={labelText.length * 7 + 20} height={20} rx={2}
                          fill="var(--ink)" opacity={0.96} />
                    <text textAnchor="middle" y={-2.5}
                          fill="var(--paper)" fontSize="10"
                          fontFamily="var(--font-sans)" fontWeight="500">
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
    {hoveredCountry && (() => {
      const s = hoveredCountry.stats;
      const cities = [...s.cities.entries()].sort((a, b) => b[1] - a[1]);
      // Position tooltip relative to viewport using fixed positioning
      const TT_W = 220;
      const margin = 16;
      const vw = (typeof window !== "undefined" ? window.innerWidth : 1200);
      const vh = (typeof window !== "undefined" ? window.innerHeight : 800);
      let left = hoveredCountry.x + 18;
      let top = hoveredCountry.y + 18;
      if (left + TT_W + margin > vw) left = hoveredCountry.x - TT_W - 18;
      if (top + 200 > vh) top = Math.max(margin, hoveredCountry.y - 200);
      return (
        <div style={{
          position: "fixed", left, top, width: TT_W,
          background: "var(--paper)", color: "var(--ink)",
          border: "0.5px solid var(--line)",
          boxShadow: "0 6px 24px rgba(20,16,10,0.10), 0 1px 0 rgba(20,16,10,0.04)",
          padding: "12px 14px 12px",
          fontFamily: "var(--font-sans)",
          fontSize: 12,
          pointerEvents: "none",
          zIndex: 50,
          borderRadius: 3,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.12em",
            textTransform: "uppercase", color: "var(--muted)", marginBottom: 4,
          }}>
            {s.total} {s.total === 1 ? "pioneer" : "pioneers"}
          </div>
          <div style={{
            fontFamily: "var(--font-display, serif)",
            fontSize: 16, fontWeight: 500, lineHeight: 1.1, marginBottom: 10,
            letterSpacing: "-0.01em",
          }}>
            {s.country}
          </div>
          {cities.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {cities.slice(0, 8).map(([city, count]) => {
                const pct = count / s.total;
                return (
                  <div key={city} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5 }}>
                    <span style={{ flex: 1, color: "var(--ink)", whiteSpace: "nowrap",
                                   overflow: "hidden", textOverflow: "ellipsis" }}>
                      {city}
                    </span>
                    <span style={{
                      flexShrink: 0, width: 36, height: 4,
                      background: "var(--line-2, rgba(0,0,0,0.08))",
                      borderRadius: 2, overflow: "hidden",
                    }}>
                      <span style={{
                        display: "block", height: "100%",
                        width: `${Math.max(8, pct * 100)}%`,
                        background: accentColor, opacity: 0.7,
                      }} />
                    </span>
                    <span style={{
                      flexShrink: 0, fontFamily: "var(--font-mono)", fontSize: 10.5,
                      color: "var(--muted)", minWidth: 16, textAlign: "right",
                    }}>
                      {count}
                    </span>
                  </div>
                );
              })}
              {cities.length > 8 && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4,
                              fontStyle: "italic", fontFamily: "var(--font-display, serif)" }}>
                  + {cities.length - 8} more {cities.length - 8 === 1 ? "city" : "cities"}
                </div>
              )}
              {s.anonymous > 0 && (
                <div style={{
                  fontSize: 10, color: "var(--muted)", marginTop: 6,
                  paddingTop: 6, borderTop: "0.5px dashed var(--line)",
                  fontStyle: "italic",
                }}>
                  + {s.anonymous} unspecified {s.anonymous === 1 ? "city" : "cities"}
                </div>
              )}
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--muted)", fontStyle: "italic" }}>
              {s.anonymous} {s.anonymous === 1 ? "pioneer, location" : "pioneers, locations"} unspecified
            </div>
          )}
        </div>
      );
    })()}
    </div>
  );
}

Object.assign(window, { GlobeMap, PROJECTIONS, makeProjection });
