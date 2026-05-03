declare module "d3-geo-projection" {
  import type { GeoProjection } from "d3-geo";
  export function geoInterruptedHomolosine(): GeoProjection;
  export function geoHomolosine(): GeoProjection;
  // Other projections exist in this package but we only import what we use.
}
