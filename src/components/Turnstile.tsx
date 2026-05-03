import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback?: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          appearance?: "always" | "execute" | "interaction-only";
          size?: "normal" | "compact" | "flexible";
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let scriptPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      if (window.turnstile) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const el = document.createElement("script");
    el.src = SCRIPT_SRC;
    el.async = true;
    el.defer = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("turnstile script failed"));
    document.head.appendChild(el);
  });
  return scriptPromise;
}

export interface TurnstileProps {
  siteKey: string;
  onToken: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
}

export function Turnstile({ siteKey, onToken, onExpire, onError }: TurnstileProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<string | null>(null);
  // Stash the latest callbacks in refs so the render effect doesn't re-render
  // the widget every time the parent rebinds them.
  const onTokenRef = useRef(onToken);
  const onExpireRef = useRef(onExpire);
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onTokenRef.current = onToken;
    onExpireRef.current = onExpire;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    let cancelled = false;
    loadScript().then(() => {
      if (cancelled || !hostRef.current || !window.turnstile) return;
      widgetRef.current = window.turnstile.render(hostRef.current, {
        sitekey: siteKey,
        theme: "light",
        callback: (token) => onTokenRef.current(token),
        "expired-callback": () => onExpireRef.current?.(),
        "error-callback": () => onErrorRef.current?.(),
      });
    });
    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetRef.current);
        } catch {
          // mounting/unmounting can race with the widget — swallow.
        }
        widgetRef.current = null;
      }
    };
  }, [siteKey]);

  return <div ref={hostRef} />;
}
