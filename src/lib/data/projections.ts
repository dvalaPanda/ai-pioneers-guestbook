import type { ProjectionId } from "../../types";

export interface ProjectionDef {
  id: ProjectionId;
  label: string;
  short: string;
  kind: "globe" | "map";
}

export const PROJECTIONS: readonly ProjectionDef[] = [
  { id: "globe", label: "Globe", short: "Globe", kind: "globe" },
  { id: "mercator", label: "Mercator", short: "Merc", kind: "map" },
  { id: "natural", label: "Natural Earth", short: "Nat", kind: "map" },
  { id: "goode", label: "Goode", short: "Good", kind: "map" },
];
