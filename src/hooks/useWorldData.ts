import { useEffect, useState } from "react";
import { feature, mesh } from "topojson-client";
import type { Topology, GeometryCollection, GeometryObject } from "topojson-specification";
import type { Feature, FeatureCollection, MultiLineString } from "geojson";

export interface WorldData {
  land: Feature;
  countries: FeatureCollection;
  borders: MultiLineString;
}

let cached: WorldData | null = null;
let inFlight: Promise<WorldData> | null = null;

async function load(): Promise<WorldData> {
  if (cached) return cached;
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const res = await fetch("/world/countries-110m.json");
    if (!res.ok) throw new Error(`world topojson: ${res.status}`);
    const topo = (await res.json()) as Topology;
    const landObj = topo.objects["land"] as GeometryObject;
    const countriesObj = topo.objects["countries"] as GeometryCollection;
    const land = feature(topo, landObj) as Feature;
    const countries = feature(topo, countriesObj) as FeatureCollection;
    const borders = mesh(topo, countriesObj, (a, b) => a !== b);
    cached = { land, countries, borders };
    return cached;
  })();
  return inFlight;
}

export function useWorldData(): WorldData | null {
  const [data, setData] = useState<WorldData | null>(cached);
  useEffect(() => {
    if (cached) {
      setData(cached);
      return;
    }
    let cancelled = false;
    load()
      .then((w) => {
        if (!cancelled) setData(w);
      })
      .catch((err) => {
        console.error("world topo failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}

let landCached: Feature | null = null;
let landInFlight: Promise<Feature> | null = null;

async function loadLand(): Promise<Feature> {
  if (landCached) return landCached;
  if (landInFlight) return landInFlight;
  landInFlight = (async () => {
    const res = await fetch("/world/land-110m.json");
    if (!res.ok) throw new Error(`land topojson: ${res.status}`);
    const topo = (await res.json()) as Topology;
    const landObj = topo.objects["land"] as GeometryObject;
    landCached = feature(topo, landObj) as Feature;
    return landCached;
  })();
  return landInFlight;
}

export function useLandData(): Feature | null {
  const [data, setData] = useState<Feature | null>(landCached);
  useEffect(() => {
    if (landCached) {
      setData(landCached);
      return;
    }
    let cancelled = false;
    loadLand()
      .then((l) => {
        if (!cancelled) setData(l);
      })
      .catch((err) => {
        console.error("land topo failed", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return data;
}
