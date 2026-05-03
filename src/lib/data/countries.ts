import type { CountryEntry } from "../../types";
import { CITY_DB } from "./cities";

const acc = new Map<string, { name: string; lats: number[]; lons: number[] }>();
for (const c of CITY_DB) {
  const existing = acc.get(c.countryCode);
  if (!existing) {
    acc.set(c.countryCode, { name: c.country, lats: [c.lat], lons: [c.lon] });
  } else {
    existing.lats.push(c.lat);
    existing.lons.push(c.lon);
  }
}

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

export const COUNTRY_DB: Record<string, CountryEntry> = {};
for (const [code, v] of acc) {
  COUNTRY_DB[code] = { code, name: v.name, lat: mean(v.lats), lon: mean(v.lons) };
}
