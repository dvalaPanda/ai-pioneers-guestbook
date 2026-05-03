import { useEffect, useState } from "react";
import type { PaletteId, PinStyle, TweakState } from "../types";

const PANEL_STYLE = `
  .twk-fab{position:fixed;right:16px;bottom:16px;z-index:2147483646;
    width:34px;height:34px;border-radius:8px;
    border:0.5px solid var(--line);background:var(--paper);color:var(--ink-2);
    box-shadow:0 8px 24px -12px rgba(0,0,0,0.18);cursor:pointer;
    display:grid;place-items:center;font-size:15px}
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:var(--paper);color:var(--ink-2);
    border:0.5px solid var(--line);border-radius:14px;
    box-shadow:0 12px 40px -16px rgba(0,0,0,.22);
    font:11.5px/1.4 var(--font-sans);overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:12px 10px 12px 16px;border-bottom:0.5px solid var(--line)}
  .twk-hd b{font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
  .twk-x{appearance:none;border:0;background:transparent;color:var(--muted);
    width:22px;height:22px;border-radius:6px;cursor:pointer;font-size:13px;line-height:1}
  .twk-x:hover{background:var(--bg-2);color:var(--ink-2)}
  .twk-body{padding:12px 16px 16px;display:flex;flex-direction:column;gap:14px;
    overflow-y:auto;overflow-x:hidden;min-height:0;
    scrollbar-width:thin;scrollbar-color:var(--line-2) transparent}
  .twk-row{display:flex;flex-direction:column;gap:6px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:var(--muted)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-val{color:var(--muted-2);font-variant-numeric:tabular-nums;font-family:var(--font-mono);font-size:10px}
  .twk-sect{font-size:9.5px;font-weight:600;letter-spacing:.16em;text-transform:uppercase;
    color:var(--muted-2);padding:6px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-slider{appearance:none;-webkit-appearance:none;width:100%;height:4px;margin:6px 0;
    border-radius:999px;background:var(--line);outline:none}
  .twk-slider::-webkit-slider-thumb{-webkit-appearance:none;appearance:none;
    width:14px;height:14px;border-radius:50%;background:var(--paper);
    border:0.5px solid var(--line-2);box-shadow:0 1px 3px rgba(0,0,0,.18);cursor:pointer}
  .twk-slider::-moz-range-thumb{width:14px;height:14px;border-radius:50%;
    background:var(--paper);border:0.5px solid var(--line-2);
    box-shadow:0 1px 3px rgba(0,0,0,.18);cursor:pointer}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;background:var(--bg-2);user-select:none}
  .twk-seg button{appearance:none;flex:1;border:0;background:transparent;
    color:var(--muted);font:inherit;font-weight:500;min-height:24px;
    border-radius:6px;cursor:pointer;padding:4px 6px;line-height:1.2;text-transform:capitalize}
  .twk-seg button[aria-pressed="true"]{background:var(--paper);color:var(--ink);
    box-shadow:0 1px 3px rgba(0,0,0,.10)}
`;

export interface TweaksPanelProps {
  state: TweakState;
  onChange: <K extends keyof TweakState>(key: K, value: TweakState[K]) => void;
}

const PALETTE_OPTIONS: PaletteId[] = ["bone", "forest", "navy", "parchment"];
const PIN_OPTIONS: PinStyle[] = ["ring", "dot", "pin", "stack"];

export function TweaksPanel({ state, onChange }: TweaksPanelProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <style>{PANEL_STYLE}</style>
      {!open ? (
        <button
          type="button"
          aria-label="Open tweaks"
          className="twk-fab"
          onClick={() => setOpen(true)}
          title="Tweaks"
        >
          ☰
        </button>
      ) : (
        <div className="twk-panel" role="dialog" aria-label="Tweaks">
          <div className="twk-hd">
            <b>Tweaks</b>
            <button
              type="button"
              className="twk-x"
              aria-label="Close tweaks"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
          </div>
          <div className="twk-body">
            <div className="twk-sect">Aesthetic</div>
            <div className="twk-row">
              <div className="twk-lbl">
                <span>Palette</span>
              </div>
              <div className="twk-seg" role="radiogroup" aria-label="Palette">
                {PALETTE_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={state.palette === opt}
                    aria-pressed={state.palette === opt}
                    onClick={() => onChange("palette", opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="twk-sect">Map</div>
            <div className="twk-row">
              <div className="twk-lbl">
                <span>Pin style</span>
              </div>
              <div className="twk-seg" role="radiogroup" aria-label="Pin style">
                {PIN_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={state.pinStyle === opt}
                    aria-pressed={state.pinStyle === opt}
                    onClick={() => onChange("pinStyle", opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div className="twk-row">
              <div className="twk-lbl">
                <span>Globe rotation</span>
                <span className="twk-val">{state.rotationSpeed.toFixed(2)}</span>
              </div>
              <input
                type="range"
                className="twk-slider"
                min={0}
                max={0.2}
                step={0.01}
                value={state.rotationSpeed}
                onChange={(e) => onChange("rotationSpeed", Number(e.target.value))}
                aria-label="Globe rotation speed"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
