import { useCallback, useEffect, useState } from "react";
import type { TweakState } from "../types";

const STORAGE_KEY = "pg_tweaks_v1";

export const TWEAK_DEFAULTS: TweakState = {
  palette: "parchment",
  pinStyle: "ring",
  rotationSpeed: 0.04,
};

function loadInitial(): TweakState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return TWEAK_DEFAULTS;
    const parsed = JSON.parse(raw) as Partial<TweakState>;
    return { ...TWEAK_DEFAULTS, ...parsed };
  } catch {
    return TWEAK_DEFAULTS;
  }
}

export function useTweaks(): [
  TweakState,
  <K extends keyof TweakState>(key: K, value: TweakState[K]) => void,
] {
  const [state, setState] = useState<TweakState>(loadInitial);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage quota / disabled — fail silently; in-memory state still works.
    }
  }, [state]);

  const set = useCallback(
    <K extends keyof TweakState>(key: K, value: TweakState[K]) => {
      setState((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  return [state, set];
}
