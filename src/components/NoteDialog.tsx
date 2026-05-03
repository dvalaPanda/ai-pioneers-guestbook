import { useEffect, useRef, useState } from "react";
import type { Visitor } from "../types";
import { Turnstile } from "./Turnstile";
import { useFocusTrap } from "../hooks/useFocusTrap";

export interface NoteSubmission {
  rating: number;
  body: string;
  includeLocation: boolean;
  turnstileToken: string;
}

export interface NoteDialogProps {
  visible: boolean;
  turnstileSiteKey: string;
  defaultLocation: Visitor | null;
  submitting: boolean;
  errorMessage: string | null;
  onClose: () => void;
  onSubmit: (n: NoteSubmission) => void;
}

export function NoteDialog(props: NoteDialogProps) {
  const {
    visible,
    turnstileSiteKey,
    defaultLocation,
    submitting,
    errorMessage,
    onClose,
    onSubmit,
  } = props;
  const [rating, setRating] = useState(5);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState("");
  const [includeLocation, setIncludeLocation] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useFocusTrap(cardRef, visible, onClose);

  useEffect(() => {
    if (visible) {
      setRating(5);
      setHover(0);
      setBody("");
      setIncludeLocation(!!(defaultLocation?.city || defaultLocation?.country));
      setToken(null);
    }
  }, [visible, defaultLocation]);

  if (!visible) return null;

  const submit = () => {
    if (!token) return;
    onSubmit({
      rating,
      body: body.trim(),
      includeLocation: includeLocation && !!(defaultLocation?.city || defaultLocation?.country),
      turnstileToken: token,
    });
  };

  const disabled = submitting || !token;

  return (
    <div
      className="welcome show"
      role="dialog"
      aria-modal="true"
      aria-labelledby="note-title"
      style={{ background: "rgba(26,24,20,0.32)" }}
    >
      <div
        ref={cardRef}
        style={{
          background: "var(--paper)",
          border: "0.5px solid var(--line)",
          padding: "36px 40px",
          width: "min(480px, 90vw)",
          position: "relative",
          boxShadow: "0 24px 60px -20px rgba(26,24,20,0.25)",
          maxHeight: "calc(100vh - 32px)",
          overflowY: "auto",
        }}
      >
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 28,
            height: 28,
            border: 0,
            background: "transparent",
            color: "var(--muted)",
            fontSize: 20,
            lineHeight: 1,
            padding: 0,
            cursor: "pointer",
          }}
        >
          ×
        </button>

        <div className="label-eyebrow" style={{ marginBottom: 8 }}>
          Leave a Note
        </div>
        <h2
          id="note-title"
          className="display"
          style={{ fontSize: 26, fontWeight: 400, margin: "0 0 20px 0" }}
        >
          A line for the ledger.
        </h2>

        <div style={{ marginBottom: 18 }}>
          <div className="label-eyebrow" style={{ fontSize: 9, marginBottom: 8 }}>
            Rating
          </div>
          <div style={{ display: "flex", gap: 6 }} role="radiogroup" aria-label="Rating">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={rating === s}
                aria-label={`${s} star${s === 1 ? "" : "s"}`}
                className="star-btn"
                onClick={() => setRating(s)}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill={s <= (hover || rating) ? "var(--accent)" : "none"}
                  stroke="var(--accent)"
                  strokeWidth="1.4"
                  style={{ transition: "fill 120ms ease" }}
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setRating(0)}
              style={{
                border: 0,
                background: "transparent",
                color: "var(--muted)",
                fontSize: 11,
                marginLeft: 10,
                cursor: "pointer",
              }}
            >
              clear
            </button>
          </div>
        </div>

        <div style={{ marginBottom: 18 }}>
          <label
            className="label-eyebrow"
            htmlFor="note-comment"
            style={{ fontSize: 9, marginBottom: 8, display: "block" }}
          >
            Comment{" "}
            <span
              style={{ textTransform: "none", letterSpacing: 0, color: "var(--muted-2)" }}
            >
              (optional)
            </span>
          </label>
          <textarea
            id="note-comment"
            className="field"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What brought you here?"
            rows={4}
            maxLength={400}
            style={{ resize: "vertical", fontFamily: "var(--font-display)", fontSize: 15 }}
          />
          <div
            className="mono"
            style={{
              fontSize: 10,
              color: "var(--muted-2)",
              textAlign: "right",
              marginTop: 4,
            }}
          >
            {body.length}/400
          </div>
        </div>

        {(defaultLocation?.city || defaultLocation?.country) && (
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 13,
              color: "var(--ink-2)",
              cursor: "pointer",
              marginBottom: 18,
            }}
          >
            <input
              type="checkbox"
              checked={includeLocation}
              onChange={(e) => setIncludeLocation(e.target.checked)}
              style={{ accentColor: "var(--accent)" }}
            />
            Show my location ({defaultLocation.city || defaultLocation.country})
          </label>
        )}

        <div style={{ marginBottom: 16, display: "flex", justifyContent: "center" }}>
          <Turnstile
            siteKey={turnstileSiteKey}
            onToken={setToken}
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
            onClick={submit}
            disabled={disabled}
            style={{
              flex: 1,
              background: "var(--accent)",
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
            {submitting ? "Posting…" : "Sign the Ledger"}
          </button>
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--muted-2)",
            marginTop: 16,
            fontStyle: "italic",
            textAlign: "center",
          }}
        >
          Posted with a generated handle — your identity is never recorded.
        </div>
      </div>
    </div>
  );
}
