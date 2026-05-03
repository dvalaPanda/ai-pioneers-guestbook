import type { PaletteId } from "../../types";

export interface Palette {
  label: string;
  vars: Record<string, string>;
}

export const PALETTES: Record<PaletteId, Palette> = {
  bone: {
    label: "Bone & Burgundy",
    vars: {
      "--bg": "#f4f1ea",
      "--bg-2": "#ebe6db",
      "--paper": "#fbf9f3",
      "--ink": "#1a1814",
      "--ink-2": "#2c2823",
      "--muted": "#7a7468",
      "--muted-2": "#b6ad9c",
      "--line": "#d9d2c3",
      "--line-2": "#c4bba8",
      "--accent": "#7a2a2a",
      "--accent-soft": "#b8584a",
      "--gold": "#a08358",
    },
  },
  forest: {
    label: "Cream & Forest",
    vars: {
      "--bg": "#f1ede2",
      "--bg-2": "#e6dfcd",
      "--paper": "#faf6ec",
      "--ink": "#1c1f1b",
      "--ink-2": "#2c322c",
      "--muted": "#6e7268",
      "--muted-2": "#a8ad9e",
      "--line": "#d2cdb9",
      "--line-2": "#bdb69e",
      "--accent": "#2f4a36",
      "--accent-soft": "#5b7a5f",
      "--gold": "#b08a4a",
    },
  },
  navy: {
    label: "Ivory & Navy",
    vars: {
      "--bg": "#f3eee5",
      "--bg-2": "#e6dfd1",
      "--paper": "#fbf7ee",
      "--ink": "#171a25",
      "--ink-2": "#252a3a",
      "--muted": "#737887",
      "--muted-2": "#aeb1bf",
      "--line": "#d2ccbd",
      "--line-2": "#bbb4a3",
      "--accent": "#1f3358",
      "--accent-soft": "#5c79a8",
      "--gold": "#9a7d44",
    },
  },
  parchment: {
    label: "Parchment & Ink",
    vars: {
      "--bg": "#efe9da",
      "--bg-2": "#e2d9c3",
      "--paper": "#f7f1e1",
      "--ink": "#161310",
      "--ink-2": "#2a2520",
      "--muted": "#7d756a",
      "--muted-2": "#b3a995",
      "--line": "#d6cdb6",
      "--line-2": "#bfb497",
      "--accent": "#5d2230",
      "--accent-soft": "#955062",
      "--gold": "#a48345",
    },
  },
};

export function applyPalette(id: PaletteId): void {
  const p = PALETTES[id];
  const root = document.documentElement;
  for (const [k, v] of Object.entries(p.vars)) {
    root.style.setProperty(k, v);
  }
}
