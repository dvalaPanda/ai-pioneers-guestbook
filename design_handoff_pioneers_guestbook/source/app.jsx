// app.jsx — Top-level app, state, layout, projection toggles, tweaks panel

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "bone",
  "pinStyle": "ring",
  "rotationSpeed": 0.04
}/*EDITMODE-END*/;

function applyPalette(name) {
  const p = PALETTES[name] || PALETTES.bone;
  const root = document.documentElement;
  Object.entries(p).forEach(([k, v]) => {
    if (k.startsWith("--")) root.style.setProperty(k, v);
  });
}

function useViewport() {
  const [vp, setVp] = React.useState({ w: window.innerWidth, h: window.innerHeight });
  React.useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const vp = useViewport();
  const isMobile = vp.w < 920;

  // App phases
  const [phase, setPhase] = React.useState("loading"); // loading -> welcome -> ready
  const [welcomeVisible, setWelcomeVisible] = React.useState(false);
  const [noteOpen, setNoteOpen] = React.useState(false);

  // Data
  const [store, setStore] = React.useState(loadStore());
  const [me, setMe] = React.useState(null); // current visitor record
  const [hoveredId, setHoveredId] = React.useState(null);

  // Map state
  const [projectionId, setProjectionId] = React.useState("globe");
  const [rotation, setRotation] = React.useState([20, -8, 0]);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState([0, 0]);
  const [spinning, setSpinning] = React.useState(true);

  // Reset zoom/pan when projection changes
  React.useEffect(() => { setZoom(1); setPan([0, 0]); }, [projectionId]);

  const resetView = () => {
    setZoom(1); setPan([0, 0]);
    if (projectionId === "globe") setRotation([20, -8, 0]);
  };

  // Apply palette
  React.useEffect(() => { applyPalette(t.palette); }, [t.palette]);

  // Loader → welcome
  React.useEffect(() => {
    const t1 = setTimeout(() => { setPhase("welcome"); setWelcomeVisible(true); }, 2400);
    return () => clearTimeout(t1);
  }, []);

  // Auto-rotate globe
  React.useEffect(() => {
    if (projectionId !== "globe" || !spinning || t.rotationSpeed === 0) return;
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000;
      last = now;
      setRotation(r => [r[0] + dt * 60 * t.rotationSpeed, r[1], r[2]]);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [projectionId, t.rotationSpeed, spinning]);

  // Persist store
  React.useEffect(() => { saveStore(store); }, [store]);

  const submitWelcome = (loc) => {
    const id = "v_" + Math.random().toString(36).slice(2, 10);
    const visitor = {
      id, ts: Date.now(),
      city: loc.city || null,
      country: loc.country || null,
      countryCode: loc.countryCode || null,
      lat: loc.lat ?? null,
      lon: loc.lon ?? null,
    };
    setStore(s => ({ ...s, visitors: [visitor, ...s.visitors] }));
    setMe(visitor);
    setWelcomeVisible(false);
    setTimeout(() => setPhase("ready"), 600);
  };

  const skipWelcome = () => {
    const id = "v_" + Math.random().toString(36).slice(2, 10);
    const visitor = { id, ts: Date.now(), city: null, country: null, countryCode: null, lat: null, lon: null };
    setStore(s => ({ ...s, visitors: [visitor, ...s.visitors] }));
    setMe(visitor);
    setWelcomeVisible(false);
    setTimeout(() => setPhase("ready"), 600);
  };

  const submitNote = ({ rating, comment, includeLocation }) => {
    const handle = makeAnonName();
    const note = {
      id: "n_" + Math.random().toString(36).slice(2, 10),
      visitorId: me?.id,
      timestamp: Date.now(),
      rating, comment,
      name: handle.name,
      emoji: handle.emoji,
      location: includeLocation && me?.city
        ? `${me.city}${me.country ? ", " + me.country : ""}`
        : (includeLocation && me?.country ? me.country : null),
    };
    setStore(s => ({ ...s, notes: [note, ...s.notes] }));
    setNoteOpen(false);
  };

  // Map size
  const sidebarW = isMobile ? 0 : 340;
  const sidebarH = isMobile ? Math.min(vp.h * 0.42, 380) : 0;
  const mapW = isMobile ? vp.w : vp.w - sidebarW;
  const mapH = isMobile ? vp.h - sidebarH : vp.h;

  return (
    <div style={{
      width: "100vw", height: "100vh",
      display: "flex", flexDirection: isMobile ? "column" : "row",
      background: "var(--bg)",
    }}>
      {/* Map area */}
      <main style={{ flex: 1, position: "relative", overflow: "hidden", minWidth: 0 }}>
        {/* Top bar — two absolutely-positioned shelves anchoring corners */}
        <header style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 5,
          pointerEvents: "none",
        }}>
          <div style={{
            position: "absolute", top: 0, left: 0,
            pointerEvents: "auto",
            maxWidth: isMobile ? "calc(100vw - 140px)" : "min(420px, 50%)",
            background: "linear-gradient(180deg, var(--bg) 0%, var(--bg) 65%, rgba(244,241,234,0) 100%)",
            padding: isMobile ? "16px 22px 30px 18px" : "22px 32px 36px 30px",
            borderRight: "0.5px solid var(--line)",
            borderBottom: "0.5px solid var(--line)",
            borderBottomRightRadius: 4,
          }}>
            <div className="label-eyebrow" style={{ marginBottom: 4 }}>Est. MMXXVI</div>
            <div className="display" style={{
              fontSize: isMobile ? 22 : 26, fontWeight: 500, lineHeight: 1.05,
              letterSpacing: "-0.015em",
            }}>
              The Pioneers' Guestbook
            </div>
            <div className="display" style={{
              fontStyle: "italic", color: "var(--muted)",
              fontSize: 13, marginTop: 4, fontWeight: 300,
            }}>
              a quiet ledger of who came by
            </div>
          </div>

          {/* Projection toggles — top-right */}
          <div style={{
            position: "absolute", top: 0, right: 0,
            pointerEvents: "auto",
            display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end",
            background: "linear-gradient(180deg, var(--bg) 0%, var(--bg) 65%, rgba(244,241,234,0) 100%)",
            padding: isMobile ? "16px 18px 30px 22px" : "22px 30px 36px 32px",
            borderLeft: "0.5px solid var(--line)",
            borderBottom: "0.5px solid var(--line)",
            borderBottomLeftRadius: 4,
          }}>
            <div className="label-eyebrow" style={{ fontSize: 9, alignSelf: "flex-end" }}>Projection</div>
            <div style={{ display: "flex", gap: 4, background: "var(--paper)",
                          border: "0.5px solid var(--line)", padding: 3, borderRadius: 3,
                          flexWrap: "nowrap" }}>
              {PROJECTIONS.map(p => {
                const short = { globe: "Globe", mercator: "Mercator", goode: "Goode",
                                natural: "Natural" }[p.id] || p.label;
                return (
                  <button key={p.id}
                          onClick={() => setProjectionId(p.id)}
                          className={`icon-btn ${projectionId === p.id ? "active" : ""}`}
                          style={{
                            border: 0,
                            background: projectionId === p.id ? "var(--ink)" : "transparent",
                            color: projectionId === p.id ? "var(--paper)" : "var(--muted)",
                            padding: isMobile ? "6px 8px" : "6px 11px",
                            fontSize: isMobile ? 9.5 : 10,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            borderRadius: 2,
                            fontWeight: 500,
                            whiteSpace: "nowrap",
                          }}>
                    {isMobile ? short.slice(0, 4) : short}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Map / globe */}
        <div style={{ position: "absolute", inset: 0 }}>
          <GlobeMap
            width={mapW} height={mapH}
            projectionId={projectionId}
            rotation={rotation}
            setRotation={setRotation}
            visitors={store.visitors}
            pinStyle={t.pinStyle}
            accentColor={getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#7a2a2a"}
            hoveredId={hoveredId}
            setHoveredId={setHoveredId}
            zoom={zoom} setZoom={setZoom}
            pan={pan} setPan={setPan}
          />
        </div>

        {/* Bottom-left controls: zoom & spin */}
        <div style={{
          position: "absolute", bottom: 14, left: 22, zIndex: 4,
          display: "flex", gap: 6, alignItems: "center",
        }}>
          {projectionId === "globe" && (
            <button onClick={() => setSpinning(s => !s)}
                    title={spinning ? "Pause rotation" : "Resume rotation"}
                    style={{
                      width: 30, height: 30,
                      border: "0.5px solid var(--line)",
                      background: "var(--paper)",
                      borderRadius: 2,
                      display: "grid", placeItems: "center",
                      color: "var(--ink-2)",
                    }}>
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
          <button onClick={() => setZoom(z => Math.min(z * 1.4, 8))}
                  style={{
                    width: 30, height: 30,
                    border: "0.5px solid var(--line)", background: "var(--paper)",
                    borderRadius: 2, fontSize: 16, color: "var(--ink-2)",
                    fontFamily: "var(--font-display)", lineHeight: 1, padding: 0,
                  }}>+</button>
          <button onClick={() => setZoom(z => Math.max(z / 1.4, 0.5))}
                  style={{
                    width: 30, height: 30,
                    border: "0.5px solid var(--line)", background: "var(--paper)",
                    borderRadius: 2, fontSize: 16, color: "var(--ink-2)",
                    fontFamily: "var(--font-display)", lineHeight: 1, padding: 0,
                  }}>−</button>
          <button onClick={resetView}
                  style={{
                    height: 30, padding: "0 12px",
                    border: "0.5px solid var(--line)", background: "var(--paper)",
                    borderRadius: 2, fontSize: 10, color: "var(--ink-2)",
                    letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 500,
                  }}>Reset</button>
        </div>

        {/* Pinned count */}
        <div style={{
          position: "absolute", bottom: 18, right: isMobile ? 110 : 22,
          fontSize: 10, color: "var(--muted)", letterSpacing: "0.08em",
          fontFamily: "var(--font-mono)", textTransform: "uppercase",
          pointerEvents: "none",
        }}>
          {store.visitors.filter(v => v.lat != null).length} pinned
        </div>

        {/* Floating CTA on mobile */}
        {isMobile && phase === "ready" && (
          <button onClick={() => setNoteOpen(true)} className="cta-pulse"
                  style={{
                    position: "absolute", bottom: 16, right: 16, zIndex: 4,
                    background: "var(--accent)", color: "var(--paper)",
                    border: 0, padding: "12px 18px", borderRadius: 2,
                    fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase",
                    fontWeight: 500,
                  }}>
            Leave a Note
          </button>
        )}
      </main>

      {/* Sidebar */}
      {phase === "ready" && (
        <Sidebar
          visitors={store.visitors}
          notes={store.notes}
          palette={t.palette}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onLeaveNote={() => setNoteOpen(true)}
          isMobile={isMobile}
        />
      )}

      <Loader visible={phase === "loading"} />
      <WelcomeModal visible={welcomeVisible}
                    onSubmit={submitWelcome}
                    onSkip={skipWelcome} />
      <NoteDialog visible={noteOpen}
                  onClose={() => setNoteOpen(false)}
                  onSubmit={submitNote}
                  defaultLocation={me} />

      {/* Tweaks */}
      <TweaksPanel>
        <TweakSection label="Aesthetic" />
        <TweakRadio label="Palette" value={t.palette}
                    options={["bone", "forest", "navy", "parchment"]}
                    onChange={(v) => setTweak("palette", v)} />
        <TweakSection label="Map" />
        <TweakRadio label="Pin style" value={t.pinStyle}
                    options={["ring", "dot", "pin", "stack"]}
                    onChange={(v) => setTweak("pinStyle", v)} />
        <TweakSlider label="Globe rotation" value={t.rotationSpeed}
                     min={0} max={0.2} step={0.01}
                     onChange={(v) => setTweak("rotationSpeed", v)} />
        <TweakSection label="Demo" />
        <TweakButton label="Add 12 sample visitors"
                     onClick={() => {
                       const sample = [];
                       for (let i = 0; i < 12; i++) {
                         const c = CITY_DB[Math.floor(Math.random() * CITY_DB.length)];
                         sample.push({
                           id: "v_" + Math.random().toString(36).slice(2, 10),
                           ts: Date.now() - i * 1000,
                           city: c[0], lat: c[1], lon: c[2],
                           countryCode: c[3], country: c[4],
                         });
                       }
                       setStore(s => ({ ...s, visitors: [...sample, ...s.visitors] }));
                     }} />
        <TweakButton label="Reset guestbook"
                     onClick={() => { setStore({ visitors: [], notes: [] }); setMe(null); }} />
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
