import type { RenderedSegment, SegmentContext } from "../types.js";
import { applyColor } from "../theme.js";
import { color } from "./helpers.js";

// Set to a number (0–100) to override context % for visual testing, null to disable
const DEBUG_PCT: number | null = null;

const BAR_WIDTH = 20;
const FILLED_CHAR   = "\u2593";
const UNFILLED_CHAR = "\u2592";
const UNFILLED_COLOR = "#87827a";

// Convert a hex string to an RGB object for gradient interpolation.
// To get a two-colour ramp, set MID the same as START or END.
function hex(h: string): { r: number; g: number; b: number } {
  const c = h.replace("#", "");
  return { r: parseInt(c.slice(0, 2), 16), g: parseInt(c.slice(2, 4), 16), b: parseInt(c.slice(4, 6), 16) };
}

// Gradient stops — drop in any hex values here
const START = hex("#b8b4ae"); 
const MID   = hex("#d67858");
const END   = hex("#d67858");
const MID_FRAC = 0.55;       // 0–1: where MID sits along the bar

function lerp(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function positionColor(pos: number): string {
  const t = pos / (BAR_WIDTH - 1);
  let r: number, g: number, b: number;
  if (t <= MID_FRAC) {
    const f = t / MID_FRAC;
    r = lerp(START.r, MID.r, f);
    g = lerp(START.g, MID.g, f);
    b = lerp(START.b, MID.b, f);
  } else {
    const f = (t - MID_FRAC) / (1 - MID_FRAC);
    r = lerp(MID.r, END.r, f);
    g = lerp(MID.g, END.g, f);
    b = lerp(MID.b, END.b, f);
  }
  return `\x1b[38;2;${r};${g};${b}m`;
}

export const contextPctSegment = {
  id: "context_pct" as const,
  render(ctx: SegmentContext): RenderedSegment {
    const pct = DEBUG_PCT ?? ctx.contextPercent;
    const filled = Math.round((pct / 100) * BAR_WIDTH);

    let bar = "";
    for (let i = 0; i < BAR_WIDTH; i++) {
      if (i < filled) {
        bar += positionColor(i) + FILLED_CHAR;
      } else {
        bar += applyColor(ctx.theme, UNFILLED_COLOR, UNFILLED_CHAR);
      }
    }
    bar += "\x1b[0m";

    const pctLabel = `${pct.toFixed(1)}%`;
    const pctStr = color(ctx, "caveman", pctLabel);

    return { content: `${bar} ${pctStr}`, visible: true };
  },
};

export const contextTotalSegment = {
  id: "context_total" as const,
  render(ctx: SegmentContext): RenderedSegment {
    const window = ctx.contextWindow;
    if (!window) return { content: "", visible: false };
    return {
      content: color(ctx, "context", `${window}`),
      visible: true,
    };
  },
};
