// modals.jsx — Welcome modal, location picker, comment/note dialog, loader

function WireframeGlobe({ size = 140 }) {
  // Real continent outlines on a spinning orthographic projection
  const [land, setLand] = React.useState(null);
  const [lambda, setLambda] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/land-110m.json")
      .then(r => r.json())
      .then(topo => {
        if (cancelled) return;
        setLand(window.topojson.feature(topo, topo.objects.land));
      }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  React.useEffect(() => {
    let raf, last = performance.now();
    const tick = (now) => {
      const dt = (now - last) / 1000; last = now;
      setLambda(l => (l + dt * 30) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const proj = React.useMemo(() => {
    const p = window.d3.geoOrthographic().clipAngle(90);
    p.scale(size / 2 - 2).translate([size / 2, size / 2]).rotate([lambda, -12, 0]);
    return p;
  }, [lambda, size]);

  const path = React.useMemo(() => window.d3.geoPath(proj), [proj]);
  const grat = window.d3.geoGraticule().step([20, 20])();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={size/2 - 2}
              fill="none" stroke="var(--ink)" strokeWidth="0.7" />
      <path d={path(grat)} fill="none" stroke="var(--ink)" strokeWidth="0.35" opacity="0.4" />
      {land && <path d={path(land)} fill="none" stroke="var(--ink)" strokeWidth="0.9" />}
    </svg>
  );
}

function Loader({ visible }) {
  return (
    <div className={`loader ${visible ? "" : "hidden"}`}>
      <div className="loader-stack">
        <div className="loader-mark">The Pioneers' Guestbook</div>
        <WireframeGlobe size={140} />
        <div className="loader-tagline">Charting the cartography of curiosity.</div>
      </div>
    </div>
  );
}

// City autocomplete input
function LocationInput({ value, onChange, onSelect }) {
  const [query, setQuery] = React.useState(value || "");
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState(0);

  const matches = React.useMemo(() => {
    if (!query || query.length < 1) return [];
    const q = query.toLowerCase();
    return CITY_DB
      .filter(([city, , , , country]) =>
        city.toLowerCase().includes(q) || country.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [query]);

  React.useEffect(() => { onChange && onChange(query); }, [query]);

  const choose = (m) => {
    const [city, lat, lon, code, country] = m;
    setQuery(`${city}, ${country}`);
    setOpen(false);
    onSelect && onSelect({ city, lat, lon, country, countryCode: code });
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        className="field"
        type="text"
        value={query}
        placeholder="City, country (or just a country)"
        onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setActive(a => Math.min(a+1, matches.length-1)); }
          if (e.key === "ArrowUp") { e.preventDefault(); setActive(a => Math.max(a-1, 0)); }
          if (e.key === "Enter" && matches[active]) { e.preventDefault(); choose(matches[active]); }
        }}
        autoComplete="off"
        autoCapitalize="words"
      />
      {open && matches.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "var(--paper)", border: "0.5px solid var(--line)", borderRadius: 4,
          maxHeight: 220, overflowY: "auto", zIndex: 30,
          boxShadow: "0 8px 24px -12px rgba(0,0,0,0.18)",
        }}>
          {matches.map((m, i) => (
            <div key={i}
                 onMouseDown={(e) => { e.preventDefault(); choose(m); }}
                 onMouseEnter={() => setActive(i)}
                 style={{
                   padding: "10px 14px",
                   fontSize: 13,
                   cursor: "pointer",
                   background: i === active ? "var(--bg-2)" : "transparent",
                   borderBottom: i < matches.length - 1 ? "0.5px dotted var(--line)" : "none",
                 }}>
              <span style={{ color: "var(--ink)" }}>{m[0]}</span>
              <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: 11 }}>{m[4]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Welcome modal: optionally enter location
function WelcomeModal({ visible, onSubmit, onSkip }) {
  const [loc, setLoc] = React.useState(null);
  const [text, setText] = React.useState("");

  const handleAdd = () => {
    if (loc) {
      onSubmit(loc);
    } else if (text.trim()) {
      // Try to match country only
      const q = text.trim().toLowerCase();
      const country = Object.values(COUNTRY_DB).find(c => c.name.toLowerCase() === q);
      if (country) {
        onSubmit({ city: null, lat: country.lat, lon: country.lon, country: country.name, countryCode: country.code });
      } else {
        // accept as text-only, no pin
        onSubmit({ city: text.trim(), lat: null, lon: null, country: null, countryCode: null });
      }
    } else {
      onSkip();
    }
  };

  return (
    <div className={`welcome ${visible ? "show" : "hidden"}`}
         style={{ opacity: visible ? 1 : 0, pointerEvents: visible ? "auto" : "none" }}>
      <div style={{
        background: "var(--paper)",
        border: "0.5px solid var(--line)",
        padding: "44px 48px",
        width: "min(520px, 90vw)",
        boxShadow: "0 24px 60px -20px rgba(26,24,20,0.18)",
        transform: visible ? "translateY(0)" : "translateY(8px)",
        transition: "transform 600ms ease",
      }}>
        <div className="label-eyebrow" style={{ marginBottom: 12 }}>Welcome, traveller</div>
        <div className="display" style={{ fontSize: 32, lineHeight: 1.15, fontWeight: 400, marginBottom: 12 }}>
          You've reached the <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Pioneers' Guestbook</em>.
        </div>
        <div style={{ fontSize: 14.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 28 }}>
          A quiet ledger of who came by, and from where. Mark your corner of the map —
          or stay anonymous. Either is welcome.
        </div>

        <div style={{ marginBottom: 16 }}>
          <LocationInput
            value=""
            onChange={(v) => { setText(v); if (!v) setLoc(null); }}
            onSelect={(picked) => setLoc(picked)}
          />
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
          <button onClick={handleAdd} style={{
            flex: 1,
            background: "var(--ink)",
            color: "var(--paper)",
            border: 0,
            padding: "13px 16px",
            borderRadius: 2,
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}>
            {loc || text.trim() ? "Place me on the map" : "Sign the book"}
          </button>
          <button onClick={onSkip} style={{
            background: "transparent",
            color: "var(--muted)",
            border: "0.5px solid var(--line)",
            padding: "13px 16px",
            borderRadius: 2,
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 500,
          }}>
            Stay Anonymous
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 20, fontStyle: "italic", textAlign: "center" }}>
          We never collect your name, IP, or anything else. This stays on your device.
        </div>
      </div>
    </div>
  );
}

// Note dialog
function NoteDialog({ visible, onClose, onSubmit, defaultLocation }) {
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [comment, setComment] = React.useState("");
  const [includeLocation, setIncludeLocation] = React.useState(!!defaultLocation);

  React.useEffect(() => {
    if (visible) {
      setRating(5); setComment(""); setHoverRating(0);
      setIncludeLocation(!!defaultLocation);
    }
  }, [visible, defaultLocation]);

  if (!visible) return null;

  return (
    <div className="welcome show" style={{ background: "rgba(26,24,20,0.32)" }}>
      <div style={{
        background: "var(--paper)",
        border: "0.5px solid var(--line)",
        padding: "36px 40px",
        width: "min(480px, 90vw)",
        position: "relative",
        boxShadow: "0 24px 60px -20px rgba(26,24,20,0.25)",
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 12, right: 12,
          width: 28, height: 28, border: 0, background: "transparent",
          color: "var(--muted)", fontSize: 20, lineHeight: 1, padding: 0,
        }}>×</button>

        <div className="label-eyebrow" style={{ marginBottom: 8 }}>Leave a Note</div>
        <div className="display" style={{ fontSize: 26, fontWeight: 400, marginBottom: 20 }}>
          A line for the ledger.
        </div>

        <div style={{ marginBottom: 18 }}>
          <div className="label-eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>Rating</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1,2,3,4,5].map(s => (
              <button key={s}
                      className="star-btn"
                      onClick={() => setRating(s)}
                      onMouseEnter={() => setHoverRating(s)}
                      onMouseLeave={() => setHoverRating(0)}>
                <svg width="26" height="26" viewBox="0 0 24 24"
                     fill={s <= (hoverRating || rating) ? "var(--accent)" : "none"}
                     stroke="var(--accent)" strokeWidth="1.4"
                     style={{ transition: "fill 120ms ease" }}>
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
            <button onClick={() => setRating(0)} style={{
              border: 0, background: "transparent", color: "var(--muted)",
              fontSize: 11, marginLeft: 10,
            }}>clear</button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <div className="label-eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>Comment <span style={{ textTransform: "none", letterSpacing: 0, color: "var(--muted-2)" }}>(optional)</span></div>
          <textarea
            className="field"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What brought you here?"
            rows={4}
            style={{ resize: "vertical", fontFamily: "var(--font-display)", fontSize: 15 }}
            maxLength={400}
          />
          <div className="mono" style={{ fontSize: 10, color: "var(--muted-2)", textAlign: "right", marginTop: 4 }}>
            {comment.length}/400
          </div>
        </div>

        {defaultLocation && (
          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--ink-2)", cursor: "pointer", marginBottom: 22 }}>
            <input type="checkbox" checked={includeLocation}
                   onChange={(e) => setIncludeLocation(e.target.checked)}
                   style={{ accentColor: "var(--accent)" }} />
            Show my note on the map ({defaultLocation.city || defaultLocation.country})
          </label>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={() => onSubmit({ rating, comment: comment.trim(), includeLocation })}
                  style={{
                    flex: 1, background: "var(--accent)", color: "var(--paper)",
                    border: 0, padding: "13px 16px", borderRadius: 2,
                    fontSize: 12, letterSpacing: "0.14em", textTransform: "uppercase",
                    fontWeight: 500,
                  }}>
            Sign the Ledger
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted-2)", marginTop: 16, fontStyle: "italic", textAlign: "center" }}>
          Posted with a generated handle — your identity is never recorded.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Loader, WelcomeModal, NoteDialog, LocationInput, WireframeGlobe });
