import { useEffect, useMemo, useState } from "react";
import { CITY_DB } from "../lib/data/cities";
import type { CitySeed } from "../types";

export interface PickedCity {
  city: string;
  lat: number;
  lon: number;
  country: string;
  countryCode: string;
}

export interface LocationInputProps {
  value?: string;
  onChange?: (q: string) => void;
  onSelect?: (picked: PickedCity) => void;
}

export function LocationInput({ value, onChange, onSelect }: LocationInputProps) {
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  const matches: CitySeed[] = useMemo(() => {
    if (!query) return [];
    const q = query.toLowerCase();
    const out: CitySeed[] = [];
    for (const c of CITY_DB) {
      if (c.city.toLowerCase().includes(q) || c.country.toLowerCase().includes(q)) {
        out.push(c);
        if (out.length >= 6) break;
      }
    }
    return out;
  }, [query]);

  useEffect(() => {
    onChange?.(query);
  }, [query, onChange]);

  const choose = (c: CitySeed) => {
    setQuery(`${c.city}, ${c.country}`);
    setOpen(false);
    onSelect?.({
      city: c.city,
      lat: c.lat,
      lon: c.lon,
      country: c.country,
      countryCode: c.countryCode,
    });
  };

  return (
    <div style={{ position: "relative" }}>
      <input
        className="field"
        type="text"
        value={query}
        placeholder="City, country (or just a country)"
        aria-label="Location"
        aria-autocomplete="list"
        aria-expanded={open && matches.length > 0}
        autoComplete="off"
        autoCapitalize="words"
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, matches.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && matches[active]) {
            e.preventDefault();
            choose(matches[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <div
          role="listbox"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            right: 0,
            background: "var(--paper)",
            border: "0.5px solid var(--line)",
            borderRadius: 4,
            maxHeight: 220,
            overflowY: "auto",
            zIndex: 30,
            boxShadow: "0 8px 24px -12px rgba(0,0,0,0.18)",
          }}
        >
          {matches.map((m, i) => (
            <div
              key={`${m.city}-${m.countryCode}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(m);
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                cursor: "pointer",
                background: i === active ? "var(--bg-2)" : "transparent",
                borderBottom:
                  i < matches.length - 1 ? "0.5px dotted var(--line)" : "none",
              }}
            >
              <span style={{ color: "var(--ink)" }}>{m.city}</span>
              <span style={{ color: "var(--muted)", marginLeft: 6, fontSize: 11 }}>
                {m.country}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
