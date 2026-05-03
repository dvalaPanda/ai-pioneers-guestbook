import {
  geoOrthographic,
  geoMercator,
  geoNaturalEarth1,
  geoGraticule,
  geoPath,
  type GeoProjection,
  type GeoPath,
  type GeoPermissibleObjects,
} from "d3-geo";
// d3-geo-projection ships no built-in TypeScript types; declare what we use.
import { geoInterruptedHomolosine } from "d3-geo-projection";
import type { ProjectionId } from "../types";

export function makeProjection(
  id: ProjectionId,
  w: number,
  h: number,
  rotation: [number, number, number],
): GeoProjection {
  const sphere: GeoPermissibleObjects = { type: "Sphere" };

  if (id === "globe") {
    const p = geoOrthographic().clipAngle(90).rotate(rotation);
    p.fitExtent(
      [
        [12, 12],
        [w - 12, h - 12],
      ],
      sphere,
    );
    const scale = Math.min(w, h) / 2 - 18;
    p.scale(scale).translate([w / 2, h / 2]).rotate(rotation);
    return p;
  }

  if (id === "mercator") {
    const p = geoMercator();
    const clipped: GeoPermissibleObjects = {
      type: "Polygon",
      coordinates: [
        [
          [-180, -60],
          [180, -60],
          [180, 72],
          [-180, 72],
          [-180, -60],
        ],
      ],
    };
    p.fitExtent(
      [
        [12, 12],
        [w - 12, h - 12],
      ],
      clipped,
    );
    return p;
  }

  let p: GeoProjection;
  if (id === "goode") {
    p = geoInterruptedHomolosine();
  } else {
    p = geoNaturalEarth1();
  }
  p.fitExtent(
    [
      [12, 12],
      [w - 12, h - 12],
    ],
    sphere,
  );
  return p;
}

export function getGraticule(): GeoPermissibleObjects {
  return geoGraticule().step([20, 20])();
}

export function makePath(projection: GeoProjection): GeoPath {
  return geoPath(projection);
}

const NAME_ALIASES: Record<string, string[]> = {
  "united states": ["usa", "us", "united states of america"],
  "united kingdom": ["uk", "great britain", "britain"],
  russia: ["russian federation"],
  "south korea": ["korea republic of", "republic of korea"],
  "north korea": ["dem rep korea", "democratic peoples republic of korea"],
  "czech republic": ["czechia"],
  burma: ["myanmar"],
  "ivory coast": ["cote divoire"],
  "democratic republic of the congo": [
    "dem rep congo",
    "dr congo",
    "congo dem rep",
  ],
  "republic of the congo": ["congo"],
};

export function normalizeName(s: string | null | undefined): string {
  return (s ?? "")
    .toLowerCase()
    .replace(/^the /, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

export function lookupAliases(norm: string): string[] {
  const out: string[] = [norm];
  for (const [canonical, aliases] of Object.entries(NAME_ALIASES)) {
    if (canonical === norm) out.push(...aliases);
    if (aliases.includes(norm)) {
      out.push(canonical, ...aliases);
    }
  }
  return Array.from(new Set(out));
}

export function isVisibleOnGlobe(
  lon: number,
  lat: number,
  rotation: [number, number, number],
): boolean {
  const [lambda, phi] = rotation;
  const cosc =
    Math.sin((lat * Math.PI) / 180) * Math.sin((-phi * Math.PI) / 180) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((-phi * Math.PI) / 180) *
      Math.cos(((lon + lambda) * Math.PI) / 180);
  return cosc > 0;
}
