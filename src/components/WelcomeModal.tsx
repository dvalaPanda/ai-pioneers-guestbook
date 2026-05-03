import { useRef, useState } from "react";
import { COUNTRY_DB } from "../lib/data/countries";
import type { PickedLocation } from "../types";
import { LocationInput, type PickedCity } from "./LocationInput";
import { Turnstile } from "./Turnstile";
import { useFocusTrap } from "../hooks/useFocusTrap";

export interface WelcomeModalProps {
  visible: boolean;
  turnstileSiteKey: string;
  submitting: boolean;
  errorMessage: string | null;
  onSubmit: (loc: PickedLocation, turnstileToken: string) => void;
  onSkip: (turnstileToken: string) => void;
}

export function WelcomeModal(props: WelcomeModalProps) {
  const { visible, turnstileSiteKey, submitting, errorMessage, onSubmit, onSkip } = props;
  const [picked, setPicked] = useState<PickedCity | null>(null);
  const [text, setText] = useState("");
  const [token, setToken] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useFocusTrap(cardRef, visible);

  const buildLocation = (): PickedLocation | null => {
    if (picked) {
      return {
        city: picked.city,
        country: picked.country,
        countryCode: picked.countryCode,
        lat: picked.lat,
        lon: picked.lon,
      };
    }
    const trimmed = text.trim();
    if (!trimmed) return null;
    const q = trimmed.toLowerCase();
    const country = Object.values(COUNTRY_DB).find((c) => c.name.toLowerCase() === q);
    if (country) {
      return {
        city: null,
        country: country.name,
        countryCode: country.code,
        lat: country.lat,
        lon: country.lon,
      };
    }
    return {
      city: trimmed,
      country: null,
      countryCode: null,
      lat: null,
      lon: null,
    };
  };

  const handleAdd = () => {
    if (!token) return;
    const loc = buildLocation();
    if (loc) onSubmit(loc, token);
    else onSkip(token);
  };

  const handleSkip = () => {
    if (!token) return;
    onSkip(token);
  };

  const cta = picked || text.trim() ? "Place me on the map" : "Sign the book";
  const disabled = submitting || !token;

  return (
    <div
      className={`welcome ${visible ? "show" : "hidden"}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <div
        ref={cardRef}
        style={{
          background: "var(--paper)",
          border: "0.5px solid var(--line)",
          padding: "44px 48px",
          width: "min(520px, 90vw)",
          boxShadow: "0 24px 60px -20px rgba(26,24,20,0.18)",
          transform: visible ? "translateY(0)" : "translateY(8px)",
          transition: "transform 600ms ease",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
        }}
      >
        <div className="label-eyebrow" style={{ marginBottom: 12 }}>
          Welcome, traveller
        </div>
        <h1
          id="welcome-title"
          className="display"
          style={{
            fontSize: 32,
            lineHeight: 1.15,
            fontWeight: 400,
            margin: "0 0 12px 0",
          }}
        >
          You've reached the{" "}
          <em style={{ fontStyle: "italic", color: "var(--accent)" }}>
            Pioneers' Guestbook
          </em>
          .
        </h1>
        <p
          style={{
            fontSize: 14.5,
            color: "var(--muted)",
            lineHeight: 1.6,
            margin: "0 0 28px 0",
          }}
        >
          A quiet ledger of who came by, and from where. Mark your corner of the
          map — or stay anonymous. Either is welcome.
        </p>

        <div style={{ marginBottom: 16 }}>
          <LocationInput
            value=""
            onChange={(v) => {
              setText(v);
              if (!v) setPicked(null);
            }}
            onSelect={(p) => setPicked(p)}
          />
        </div>

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <Turnstile
            siteKey={turnstileSiteKey}
            onToken={(t) => setToken(t)}
            onExpire={() => setToken(null)}
            onError={() => setToken(null)}
          />
        </div>

        {errorMessage && (
          <div
            role="alert"
            style={{
              fontSize: 12,
              color: "var(--accent)",
              marginBottom: 12,
              fontStyle: "italic",
            }}
          >
            {errorMessage}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button
            type="button"
            onClick={handleAdd}
            disabled={disabled}
            style={{
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
              opacity: disabled ? 0.55 : 1,
              cursor: disabled ? "default" : "pointer",
            }}
          >
            {submitting ? "Signing…" : cta}
          </button>
          <button
            type="button"
            onClick={handleSkip}
            disabled={disabled}
            style={{
              background: "transparent",
              color: "var(--muted)",
              border: "0.5px solid var(--line)",
              padding: "13px 16px",
              borderRadius: 2,
              fontSize: 12,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              fontWeight: 500,
              opacity: disabled ? 0.55 : 1,
              cursor: disabled ? "default" : "pointer",
            }}
          >
            Stay Anonymous
          </button>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--muted-2)",
            marginTop: 20,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          We never store your name, email, or IP.
        </div>
      </div>
    </div>
  );
}
