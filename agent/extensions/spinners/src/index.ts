import type { ExtensionAPI, ExtensionContext, TurnStartEvent, MessageUpdateEvent, TurnEndEvent } from "@mariozechner/pi-coding-agent";
import { pickVerb } from "./verbs.js";

const CYCLE_INTERVAL_MS = 2500;
const TYPEWRITER_MS = 42;

export default function spinners(pi: ExtensionAPI) {
  let cycleTimer: ReturnType<typeof setInterval> | null = null;
  let typeTimer: ReturnType<typeof setInterval> | null = null;
  let current = "";

  function stopAll() {
    if (cycleTimer !== null) { clearInterval(cycleTimer); cycleTimer = null; }
    if (typeTimer !== null) { clearInterval(typeTimer); typeTimer = null; }
  }

  function typeVerb(ctx: ExtensionContext, verb: string) {
    if (typeTimer !== null) { clearInterval(typeTimer); typeTimer = null; }
    const full = verb + "...";
    let i = 1;
    ctx.ui.setWorkingMessage(full.slice(0, 1));
    typeTimer = setInterval(() => {
      i++;
      ctx.ui.setWorkingMessage(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(typeTimer!);
        typeTimer = null;
      }
    }, TYPEWRITER_MS);
  }

  function startCycling(ctx: ExtensionContext) {
    current = pickVerb();
    typeVerb(ctx, current);

    cycleTimer = setInterval(() => {
      let next = pickVerb();
      while (next === current) next = pickVerb();
      current = next;
      typeVerb(ctx, current);
    }, CYCLE_INTERVAL_MS);
  }

  pi.on("turn_start", async (_event: TurnStartEvent, ctx: ExtensionContext) => {
    if (!ctx.hasUI) return;
    // If already cycling (e.g. rapid tool calls), leave it running smoothly.
    if (cycleTimer !== null || typeTimer !== null) return;
    startCycling(ctx);
  });

  pi.on("message_update", async (event: MessageUpdateEvent, _ctx: ExtensionContext) => {
    if (event?.delta?.type === "text") stopAll();
  });

  pi.on("turn_end", async (_event: TurnEndEvent, _ctx: ExtensionContext) => {
    stopAll();
  });
}
