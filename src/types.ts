export interface Visitor {
  id: string;
  createdAt: number;
  city: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lon: number | null;
}

export interface Note {
  id: string;
  visitorId: string | null;
  createdAt: number;
  rating: number;
  body: string | null;
  displayName: string;
  emoji: string;
}

export interface CountryCount {
  country: string;
  count: number;
}

export interface AppConfig {
  turnstileSiteKey: string;
}

export interface ApiState {
  visitors: Visitor[];
  notes: Note[];
  countryCounts: CountryCount[];
  totals: {
    visitors: number;
    located: number;
    anonymous: number;
    avgRating: number;
  };
  config: AppConfig;
}

export interface CitySeed {
  city: string;
  lat: number;
  lon: number;
  countryCode: string;
  country: string;
}

export interface CountryEntry {
  name: string;
  code: string;
  lat: number;
  lon: number;
}

export interface AnonHandle {
  name: string;
  emoji: string;
}

export type PaletteId = "bone" | "forest" | "navy" | "parchment";
export type PinStyle = "ring" | "dot" | "pin" | "stack";
export type ProjectionId = "globe" | "mercator" | "natural" | "goode";

export interface TweakState {
  palette: PaletteId;
  pinStyle: PinStyle;
  rotationSpeed: number;
}

export interface PickedLocation {
  city: string | null;
  country: string | null;
  countryCode: string | null;
  lat: number | null;
  lon: number | null;
}
