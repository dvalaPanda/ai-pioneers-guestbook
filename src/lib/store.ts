import type { ApiState, Note, Visitor, CountryCount } from "../types";
import { fetchState } from "./api";

type Listener = (s: ApiState) => void;

const empty: ApiState = {
  visitors: [],
  notes: [],
  countryCounts: [],
  totals: { visitors: 0, located: 0, anonymous: 0, avgRating: 0 },
  config: { turnstileSiteKey: "" },
};

let state: ApiState = empty;
const listeners = new Set<Listener>();

function emit(): void {
  for (const l of listeners) l(state);
}

export function subscribe(l: Listener): () => void {
  listeners.add(l);
  l(state);
  return () => {
    listeners.delete(l);
  };
}

export function getState(): ApiState {
  return state;
}

export async function hydrate(): Promise<void> {
  const next = await fetchState();
  state = next;
  emit();
}

function recomputeTotals(s: ApiState): ApiState["totals"] {
  const visitors = s.visitors.length;
  const located = s.visitors.filter((v) => v.lat != null && v.lon != null).length;
  const anonymous = visitors - located;
  const avgRating = s.notes.length
    ? s.notes.reduce((a, n) => a + n.rating, 0) / s.notes.length
    : 0;
  return { visitors, located, anonymous, avgRating };
}

function recomputeCountryCounts(visitors: Visitor[]): CountryCount[] {
  const m = new Map<string, number>();
  for (const v of visitors) {
    if (!v.country) continue;
    m.set(v.country, (m.get(v.country) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);
}

export function appendVisitor(v: Visitor): void {
  const visitors = [v, ...state.visitors];
  state = {
    ...state,
    visitors,
    countryCounts: recomputeCountryCounts(visitors),
    totals: recomputeTotals({ ...state, visitors }),
  };
  emit();
}

export function appendNote(n: Note): void {
  const notes = [n, ...state.notes];
  state = {
    ...state,
    notes,
    totals: recomputeTotals({ ...state, notes }),
  };
  emit();
}
