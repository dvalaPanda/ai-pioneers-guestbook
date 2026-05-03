import { useEffect, useState } from "react";

export interface Viewport {
  w: number;
  h: number;
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState<Viewport>(() => ({
    w: window.innerWidth,
    h: window.innerHeight,
  }));
  useEffect(() => {
    const onResize = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return vp;
}
