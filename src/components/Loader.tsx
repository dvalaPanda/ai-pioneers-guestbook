import { useEffect, useMemo, useState } from "react";
import { geoGraticule, geoOrthographic, geoPath } from "d3-geo";
import { useLandData } from "../hooks/useWorldData";
import { usePrefersReducedMotion } from "../hooks/usePrefersReducedMotion";

interface WireframeGlobeProps {
  size?: number;
  animate?: boolean;
}

function WireframeGlobe({ size = 140, animate = true }: WireframeGlobeProps) {
  const land = useLandData();
  const reduced = usePrefersReducedMotion();
  const [lambda, setLambda] = useState(0);

  useEffect(() => {
    if (reduced || !animate) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setLambda((l) => (l + dt * 30) % 360);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced, animate]);

  const proj = useMemo(() => {
    const p = geoOrthographic().clipAngle(90);
    p.scale(size / 2 - 2)
      .translate([size / 2, size / 2])
      .rotate([lambda, -12, 0]);
    return p;
  }, [lambda, size]);

  const path = useMemo(() => geoPath(proj), [proj]);
  const grat = useMemo(() => geoGraticule().step([20, 20])(), []);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2 - 2}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="0.7"
      />
      <path
        d={path(grat) ?? undefined}
        fill="none"
        stroke="var(--ink)"
        strokeWidth="0.35"
        opacity="0.4"
      />
      {land && (
        <path d={path(land) ?? undefined} fill="none" stroke="var(--ink)" strokeWidth="0.9" />
      )}
    </svg>
  );
}

export function Loader({ visible }: { visible: boolean }) {
  return (
    <div className={`loader ${visible ? "" : "hidden"}`} aria-hidden={visible ? undefined : true}>
      <div className="loader-stack">
        <div className="loader-mark">The Pioneers' Guestbook</div>
        <WireframeGlobe size={140} animate={visible} />
        <div className="loader-tagline">A register of arrivals, kept by hand.</div>
      </div>
    </div>
  );
}
