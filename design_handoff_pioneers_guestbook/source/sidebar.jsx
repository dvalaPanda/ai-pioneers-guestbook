// sidebar.jsx — Stats sidebar + guestbook entries list

function Sidebar({ visitors, notes, palette, hoveredId, setHoveredId, onLeaveNote, isMobile }) {
  const totalVisitors = visitors.length;
  const opted = visitors.filter(v => v.lat != null);
  const optedOut = visitors.filter(v => v.lat == null);

  // Country tally
  const tally = {};
  opted.forEach(v => {
    const key = v.country || "Unknown";
    if (!tally[key]) tally[key] = { country: key, count: 0, code: v.countryCode };
    tally[key].count += 1;
  });
  const ranked = Object.values(tally).sort((a,b)=>b.count - a.count);
  const maxCount = Math.max(1, ...ranked.map(r => r.count));

  const avgRating = notes.length
    ? (notes.reduce((s,n)=>s + n.rating, 0) / notes.length)
    : 0;

  return (
    <aside style={{
      width: isMobile ? "100%" : 340,
      height: "100%",
      borderLeft: isMobile ? "none" : "0.5px solid var(--line)",
      borderTop: isMobile ? "0.5px solid var(--line)" : "none",
      background: "var(--bg)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
      position: "relative",
      zIndex: 2,
    }}>
      {/* Header */}
      <div style={{ padding: "26px 28px 18px", borderBottom: "0.5px solid var(--line)" }}>
        <div className="label-eyebrow" style={{ marginBottom: 6 }}>Ledger</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div className="display" style={{ fontSize: 44, lineHeight: 1, fontWeight: 400 }}>
            {totalVisitors}
          </div>
          <div className="display" style={{ fontStyle: "italic", color: "var(--muted)", fontSize: 14 }}>
            {totalVisitors === 1 ? "pioneer" : "pioneers"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, marginTop: 14, fontSize: 11, color: "var(--muted)" }}>
          <div>
            <span className="mono" style={{ color: "var(--ink)", fontSize: 13 }}>{opted.length}</span>
            <span style={{ marginLeft: 6 }}>located</span>
          </div>
          <div style={{ width: 1, background: "var(--line)" }} />
          <div>
            <span className="mono" style={{ color: "var(--ink)", fontSize: 13 }}>{optedOut.length}</span>
            <span style={{ marginLeft: 6 }}>anonymous</span>
          </div>
          {notes.length > 0 && (
            <>
              <div style={{ width: 1, background: "var(--line)" }} />
              <div>
                <span className="mono" style={{ color: "var(--ink)", fontSize: 13 }}>
                  {avgRating.toFixed(1)}
                </span>
                <span style={{ marginLeft: 6 }}>★ avg</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Country tally */}
      <div style={{ padding: "18px 28px 14px", borderBottom: "0.5px solid var(--line)" }}>
        <div className="label-eyebrow" style={{ marginBottom: 12 }}>By Country</div>
        {ranked.length === 0 ? (
          <div style={{ fontFamily: "var(--font-display)", fontStyle: "italic",
                        color: "var(--muted)", fontSize: 14 }}>
            No locations yet — be the first.
          </div>
        ) : (
          <div className="scroll" style={{ maxHeight: 180, paddingRight: 6 }}>
            {ranked.slice(0, 30).map((r, i) => (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: "1fr auto auto",
                alignItems: "center",
                gap: 10,
                padding: "5px 0",
                borderBottom: i < ranked.length - 1 ? "0.5px dotted var(--line)" : "none",
              }}>
                <div style={{ fontSize: 13, color: "var(--ink-2)" }}>{r.country}</div>
                <div style={{ width: 56, height: 2, background: "var(--line)", borderRadius: 1, overflow: "hidden" }}>
                  <div style={{
                    width: `${(r.count / maxCount) * 100}%`,
                    height: "100%",
                    background: "var(--accent)",
                  }} />
                </div>
                <div className="mono" style={{ fontSize: 11, color: "var(--muted)", minWidth: 18, textAlign: "right" }}>
                  {r.count}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{
          padding: "16px 28px 10px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div className="label-eyebrow">Guestbook</div>
          <button
            onClick={onLeaveNote}
            className="cta-pulse"
            style={{
              border: 0,
              background: "var(--accent)",
              color: "var(--paper)",
              padding: "8px 14px",
              borderRadius: 2,
              fontSize: 11,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontWeight: 500,
            }}>
            Leave a Note
          </button>
        </div>

        <div className="scroll" style={{ flex: 1, padding: "0 28px 24px", minHeight: 0 }}>
          {notes.length === 0 ? (
            <div style={{
              fontFamily: "var(--font-display)", fontStyle: "italic",
              color: "var(--muted)", fontSize: 14, padding: "20px 0",
            }}>
              The first word is yours to write.
            </div>
          ) : (
            notes.map((n, i) => (
              <div key={n.id} className="entry-anim"
                   onMouseEnter={() => setHoveredId && setHoveredId(n.visitorId)}
                   onMouseLeave={() => setHoveredId && setHoveredId(null)}
                   style={{
                     padding: "14px 0",
                     borderBottom: i < notes.length - 1 ? "0.5px solid var(--line)" : "none",
                   }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: "var(--gold)" }}>{n.emoji}</span>
                  <span className="display" style={{ fontSize: 14, fontWeight: 500 }}>{n.name}</span>
                  {n.location && (
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>· {n.location}</span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 1, marginBottom: 8 }}>
                  {[1,2,3,4,5].map(s => (
                    <svg key={s} width="11" height="11" viewBox="0 0 24 24"
                         fill={s <= n.rating ? "var(--accent)" : "none"}
                         stroke="var(--accent)" strokeWidth="1.4">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                {n.comment && (
                  <div className="display" style={{
                    fontSize: 14.5, lineHeight: 1.55,
                    color: "var(--ink-2)", fontWeight: 300,
                    fontStyle: n.comment.length < 30 ? "italic" : "normal",
                  }}>
                    {n.comment}
                  </div>
                )}
                <div className="mono" style={{ fontSize: 9.5, color: "var(--muted-2)",
                                                marginTop: 6, letterSpacing: "0.06em" }}>
                  {new Date(n.timestamp).toLocaleDateString(undefined,
                    { month: "short", day: "numeric", year: "numeric" })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}

Object.assign(window, { Sidebar });
