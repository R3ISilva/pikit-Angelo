/** Plan Mode — toggle via /plan or Ctrl+Alt+P. PLAN: read-only. EXECUTE: tools restored + step_done tracking. Plan files stored in .pi/plans/. */

import type {
  ExtensionAPI,
  ExtensionContext,
  BeforeAgentStartEvent,
  BeforeAgentStartEventResult,
  ToolCallEvent,
  ToolCallEventResult,
  ToolResultEvent,
  AgentEndEvent,
} from "@mariozechner/pi-coding-agent";
import { DynamicBorder } from "@mariozechner/pi-coding-agent";

import { PLAN_MODE_TOOLS, PLAN_MODE_PROMPT, PLAN_FILE_PREFIX, PLAN_DIR, buildExecutePrompt, buildRefinePrompt } from "./config.js";
import {
  isSafeCommand,
  extractPlanSteps,
  ensurePlanDir,
  parsePlanFile,
  serializePlanFile,
  markStepInFile,
  titleFromFilename,
  listPlanFiles,
  sanitizePlanName,
  stripMarkdownFormatting,
  renderMarkdownStep,
} from "./utils.js";
import { Container, Input, Text, Spacer, matchesKey, Key, type Component } from "@earendil-works/pi-tui";
import type { TodoItem } from "./utils.js";
import { getMode, getRefining, setRefining, getActivePlanFile, setActivePlanFile, transition, enterPlanWithFile, restore, resetState } from "./state.js";
import { join } from "node:path";
import { existsSync, writeFileSync, readFileSync } from "node:fs";

export default function planMode(pi: ExtensionAPI) {
  // ─── Saved tool list for restoring ────────────────────────────────────────
  let savedToolNames: string[] | null = null;

  // In-memory todos cache (populated from plan file on disk)
  let todosCache: TodoItem[] = [];

  function saveAndSetActiveTools(toolNames: string[]): void {
    if (savedToolNames === null) {
      savedToolNames = pi.getAllTools().map((t) => t.name);
    }
    pi.setActiveTools(toolNames);
  }

  function restoreAllTools(): void {
    if (savedToolNames !== null) {
      pi.setActiveTools(savedToolNames);
      savedToolNames = null;
    } else {
      pi.setActiveTools(pi.getAllTools().map((t) => t.name));
    }
  }

  /** Get absolute path to the active plan file, or null if none set. */
  function getPlanFilePath(): string | null {
    const file = getActivePlanFile();
    if (!file) return null;
    return join(process.cwd(), PLAN_DIR, file);
  }

  /** Load todos from plan file into cache. Returns empty array if no file. */
  function loadTodosFromPlanFile(): TodoItem[] {
    const filePath = getPlanFilePath();
    if (!filePath || !existsSync(filePath)) return [];
    const content = readFileSync(filePath, "utf-8");
    todosCache = parsePlanFile(content);
    return todosCache;
  }

  /** Check if the active plan file exists on disk. Returns true if no file is active. */
  function activePlanFileExists(): boolean {
    const filePath = getPlanFilePath();
    return !filePath || existsSync(filePath);
  }

  // ─── UI helpers ────────────────────────────────────────────────────────────

  function updateStatus(ctx: ExtensionContext): void {
    if (!ctx.hasUI) return;
    const mode = getMode();

    if (mode === "plan") {
      ctx.ui.setStatus("plan-mode", "⏸ PLAN");
      ctx.ui.setWidget("plan-mode", ["⏸ Plan Mode — read-only"]);
    } else if (mode === "execute") {
      const done = todosCache.filter((t) => t.completed).length;
      const total = todosCache.length;
      ctx.ui.setStatus("plan-mode", `📋 ${done}/${total}`);
      ctx.ui.setWidget("plan-mode", (_tui, theme) => {
        return new Text(renderTodoListThemed(todosCache, theme), 0, 0);
      });
    } else {
      ctx.ui.setStatus("plan-mode", undefined);
      ctx.ui.setWidget("plan-mode", undefined);
    }

    pi.events.emit("plan-mode:state", { mode });
  }

  function renderTodoList(todos: TodoItem[]): string[] {
    return todos.map((t) => `${t.completed ? "☑" : "☐"} ${t.step}. ${stripMarkdownFormatting(t.text)}`);
  }

  function renderTodoListThemed(todos: TodoItem[], theme: { bold: (s: string) => string; italic: (s: string) => string; fg: (c: string, s: string) => string }): string {
    return todos.map((t) => {
      const marker = t.completed ? "☑" : "☐";
      const stepText = renderMarkdownStep(t.text, theme);
      return `${marker} ${t.step}. ${stepText}`;
    }).join("\n");
  }

  // ─── State transitions ─────────────────────────────────────────────────────

  function enterPlanMode(ctx: ExtensionContext): void {
    transition("plan", pi);
    saveAndSetActiveTools(PLAN_MODE_TOOLS);
    updateStatus(ctx);
    if (ctx.hasUI) ctx.ui.notify("Plan mode ON — read-only, explore and plan", "info");
  }

  function enterExecuteMode(ctx: ExtensionContext): void {
    transition("execute", pi);
    restoreAllTools();
    updateStatus(ctx);
  }

  function enterOffMode(ctx: ExtensionContext): void {
    transition("off", pi);
    restoreAllTools();
    updateStatus(ctx);
    if (ctx.hasUI) ctx.ui.notify("Plan mode OFF", "info");
  }

  // ─── Re-derive state from entries on the current branch ──────────────────────

  function syncStateFromBranch(ctx: ExtensionContext): void {
    const branch = ctx.sessionManager.getBranch();
    const restored = restore(branch);

    if (!restored) {
      resetState();
      restoreAllTools();
      updateStatus(ctx);
      return;
    }

    // Check if active plan file was deleted externally
    if (getActivePlanFile() && !activePlanFileExists()) {
      if (ctx.hasUI) ctx.ui.notify(`Plan file "${getActivePlanFile()}" not found — disabling plan mode.`, "warning");
      enterOffMode(ctx);
      return;
    }

    // Load todos from file if activePlanFile is set
    loadTodosFromPlanFile();

    if (getMode() === "plan") {
      saveAndSetActiveTools(PLAN_MODE_TOOLS);
    }

    updateStatus(ctx);
  }

  // ─── Event: session_start ──────────────────────────────────────────────────

  pi.on("session_start", async (event, ctx) => {
    // Handle --plan flag: start in plan mode on initial startup
    if (event.reason === "startup" && pi.getFlag("plan") === true && getMode() === "off") {
      enterPlanMode(ctx);
      return;
    }

    syncStateFromBranch(ctx);
  });

  // ─── Event: before_agent_start ──────────────────────────────────────────────

  pi.on("before_agent_start", (event: BeforeAgentStartEvent): BeforeAgentStartEventResult => {
    const mode = getMode();

    if (mode === "plan") {
      if (getRefining()) {
        if (todosCache.length > 0) {
          return { systemPrompt: event.systemPrompt + "\n\n" + buildRefinePrompt(todosCache) };
        }
      }
      return { systemPrompt: event.systemPrompt + "\n\n" + PLAN_MODE_PROMPT };
    }

    if (mode === "execute") {
      const incomplete = todosCache.filter((t) => !t.completed);
      if (incomplete.length === 0) return {};
      return { systemPrompt: event.systemPrompt + "\n\n" + buildExecutePrompt(incomplete) };
    }

    return {};
  });

  // ─── Event: tool_call (block unsafe bash in PLAN mode) ─────────────────────

  pi.on("tool_call", (event: ToolCallEvent): ToolCallEventResult => {
    if (getMode() !== "plan") return {};
    if (event.toolName !== "bash") return {};

    const command = event.input.command as string;
    if (isSafeCommand(command)) return {};

    return {
      block: true,
      reason: `[plan-mode] Command blocked — destructive or unknown command in plan mode: ${command}`,
    };
  });

  // ─── Tool: step_done ────────────────────────────────────────────────────────

  pi.registerTool({
    name: "step_done",
    label: "Step Done",
    description: "Mark a plan step as complete. Call this with the step number after finishing a step.",
    parameters: {
      type: "object",
      properties: {
        step: { type: "number", description: "The step number that was completed" },
      },
      required: ["step"],
    },
    async execute(_toolCallId, params) {
      const allDone = todosCache.length > 0 && todosCache.every((t) => t.completed);
      if (allDone) {
        return { content: [{ type: "text", text: "All plan steps are already complete. No further step_done calls needed." }] };
      }
      const alreadyDone = todosCache.find((t) => t.step === params.step);
      if (alreadyDone?.completed) {
        return { content: [{ type: "text", text: `Step ${params.step} is already marked complete. Do not call step_done for this step again. Move on to the next incomplete step.` }] };
      }
      return { content: [{ type: "text", text: JSON.stringify({ status: "ok", step: params.step }) }], details: { step: params.step } };
    },
  });

  // ─── Event: tool_result (process step_done results) ────────────────────────

  pi.on("tool_result", (event: ToolResultEvent, ctx: ExtensionContext): void => {
    if (event.toolName !== "step_done") return;
    if (getMode() !== "execute") return;

    const step = event.input?.step;
    if (typeof step !== "number") return;

    const item = todosCache.find((t) => t.step === step);
    if (!item || item.completed) return;

    item.completed = true;
    const filePath = getPlanFilePath();
    if (filePath) markStepInFile(filePath, step);
    updateStatus(ctx);

    // Check if all done
    if (todosCache.length > 0 && todosCache.every((t) => t.completed)) {
      if (ctx.hasUI) ctx.ui.notify("All plan steps complete!", "success");
      enterOffMode(ctx);
    }
  });

  // ─── Event: agent_end (extract plan steps in PLAN mode) ────────────────────

  pi.on("agent_end", async (event: AgentEndEvent, ctx: ExtensionContext) => {
    if (getMode() !== "plan") return;
    if (!ctx.hasUI) return;

    // Get the last assistant message
    const lastAssistant = [...event.messages].reverse().find((m) => m.role === "assistant");
    if (!lastAssistant) return;

    const text = extractTextFromMessage(lastAssistant);
    if (!text) return;

    const steps = extractPlanSteps(text);
    if (steps.length === 0) return; // No plan extracted yet — skip ui.select

    setRefining(false);

    // Write plan file
    const planDir = ensurePlanDir();
    const activeFile = getActivePlanFile();
    let filename = activeFile;
    if (!filename) {
      // Generate timestamp filename
      const ts = new Date().toISOString().replace(/[T:]/g, "-").slice(0, 16);
      filename = `${PLAN_FILE_PREFIX}${ts}.md`;
      setActivePlanFile(filename, pi);
    }
    const filePath = join(planDir, filename);
    const title = titleFromFilename(filename);
    writeFileSync(filePath, serializePlanFile(title, steps), "utf-8");

    // Update in-memory cache
    todosCache = steps;

    updateStatus(ctx);

    const choice = await ctx.ui.select(
      "Plan is ready. How'd you like to proceed?",
      ["Execute plan", "Refine"],
    );

    if (choice === "Execute plan") {
      enterExecuteMode(ctx);
      pi.sendUserMessage("Execute the plan steps now.");
    } else if (choice === "Refine") {
      setRefining(true);
      updateStatus(ctx);
    }
    // "Stay in plan mode" or undefined (cancelled) — do nothing
  });



  // ─── Event: session_tree ──────────────────────────────────────────────────

  pi.on("session_tree", async (_event, ctx) => {
    syncStateFromBranch(ctx);
  });

  /** Prompt user for optional plan name, then enter plan mode. Uses timestamp if no name given. Returns false if cancelled or invalid. */
  async function promptNameAndEnterPlanMode(ctx: ExtensionContext): Promise<boolean> {
    const nameInput = await ctx.ui.custom<string | undefined>((tui, theme, _kb, done) => {
      const input = new Input();
      input.onSubmit = (value) => done(value);

      const border = new DynamicBorder((s: string) => theme.fg("accent", s));
      const label = new Text(theme.fg("accent", "Plan name ") + theme.fg("dim", "(optional, leave empty for timestamp)"), 1, 0);
      const indent = 1;

      const container = new Container();
      container.addChild(border);
      container.addChild(new Spacer());
      container.addChild(label);
      container.addChild(new Spacer());
      const indentedInput: Component = {
        render: (w: number) => input.render(w - indent).map(line => " ".repeat(indent) + line),
        invalidate: () => input.invalidate(),
      };
      container.addChild(indentedInput);
      container.addChild(new Spacer());
      container.addChild(new Text(theme.fg("dim", "enter") + theme.fg("muted", " to submit") + theme.fg("dim", " • ") + theme.fg("dim", "esc") + theme.fg("muted", " to cancel"), 1, 0));
      container.addChild(new Spacer());
      container.addChild(border);

      input.focused = true;

      return {
        render(width: number) { return container.render(width); },
        invalidate() { container.invalidate(); },
        handleInput(data: string) {
          if (matchesKey(data, Key.escape)) { done(undefined); return; }
          input.handleInput(data);
          tui.requestRender();
        },
      };
    });

    if (nameInput === undefined) return false; // cancelled
    const trimmed = nameInput.trim();
    if (trimmed) {
      const sanitized = sanitizePlanName(trimmed);
      if (!sanitized) {
        ctx.ui.notify("Invalid plan name. Use letters, numbers, hyphens, spaces, and dots only.", "warning");
        return false;
      }
      const filename = `${PLAN_FILE_PREFIX}${sanitized}.md`;
      enterPlanWithFile(filename, pi);
      saveAndSetActiveTools(PLAN_MODE_TOOLS);
      updateStatus(ctx);
      if (ctx.hasUI) ctx.ui.notify(`Plan mode ON — creating plan "${sanitized}"`, "info");
    } else {
      enterPlanMode(ctx);
    }
    return true;
  }

  /** Load an existing plan file and enter execute mode. Returns false if load failed. */
  function loadPlanAndExecute(ctx: ExtensionContext, filename: string, displayName: string): boolean {
    const filePath = join(process.cwd(), PLAN_DIR, filename);
    const content = readFileSync(filePath, "utf-8");
    const items = parsePlanFile(content);
    if (items.length === 0) {
      ctx.ui.notify(`Plan file is empty: ${filename}`, "warning");
      return false;
    }
    const allDone = items.every((i) => i.completed);
    if (allDone) {
      ctx.ui.notify("All steps already complete.", "info");
      return false;
    }
    setActivePlanFile(filename, pi);
    todosCache = items;
    transition("execute", pi);
    restoreAllTools();
    updateStatus(ctx);
    const done = items.filter((i) => i.completed).length;
    ctx.ui.notify(`Loaded plan "${displayName}" — ${done}/${items.length} steps done`, "info");
    pi.sendUserMessage("Execute the plan steps now.");
    return true;
  }

  // ─── Command: /plan [off|status|list|<name>] ──────────────────────────────────

  pi.registerCommand("plan", {
    description: "Plan mode: /plan (toggle) · /plan <name> (load existing or create new) · /plan off · /plan status · /plan list",
    handler: async (args: string, ctx) => {
      const input = args.trim();

      if (!input) {
        // Toggle: OFF (with picker if plans exist)↔PLAN, EXECUTE→OFF
        const current = getMode();
        if (current === "off") {
          const files = listPlanFiles();
          if (files.length === 0) {
            await promptNameAndEnterPlanMode(ctx);
          } else {
            const options = ["Create new plan", ...files.map((f) => `${f.display} (${f.done}/${f.total} done)`)];
            const choice = await ctx.ui.select("Select a plan or create new:", options);
            if (choice === undefined) return; // cancelled
            if (choice === "Create new plan") {
              await promptNameAndEnterPlanMode(ctx);
            } else {
              const idx = options.indexOf(choice) - 1; // offset for "Create new" option
              if (idx >= 0 && idx < files.length) {
                const file = files[idx];
                loadPlanAndExecute(ctx, file.name, file.display);
              }
            }
          }
        } else {
          enterOffMode(ctx);
        }
      } else if (input.toLowerCase() === "off") {
        if (getMode() === "off") {
          ctx.ui.notify("Plan mode is already off", "info");
          return;
        }
        enterOffMode(ctx);
      } else if (input.toLowerCase() === "status") {
        const mode = getMode();
        if (mode === "off") {
          ctx.ui.notify("Plan mode is OFF", "info");
        } else if (mode === "plan") {
          const file = getActivePlanFile();
          const fileMissing = file && !activePlanFileExists();
          ctx.ui.notify(todosCache.length > 0
            ? `Plan mode ON — ${todosCache.length} step(s) planned`
            : fileMissing
              ? `Plan mode ON — plan file "${file}" missing`
              : file
                ? `Plan mode ON — awaiting plan (${file})`
                : "Plan mode ON — no plan yet", "info");
        } else {
          const done = todosCache.filter((t) => t.completed).length;
          ctx.ui.notify(`Execute mode — ${done}/${todosCache.length} steps done`, "info");
        }
      } else if (input.toLowerCase() === "list") {
        const files = listPlanFiles();
        if (files.length === 0) {
          ctx.ui.notify("No plan files found in .pi/plans/", "info");
          return;
        }
        const lines = files.map((f) => `  ${f.display} (${f.done}/${f.total} done)`);
        ctx.ui.notify(`Plan files:\n${lines.join("\n")}`, "info");
      } else {
        // Treat input as plan name: load existing → execute, or create new → plan mode
        const sanitized = sanitizePlanName(input);
        if (!sanitized) {
          ctx.ui.notify("Invalid plan name. Use letters, numbers, hyphens, spaces, and dots only.", "warning");
          return;
        }
        const filename = `${PLAN_FILE_PREFIX}${sanitized}.md`;
        const filePath = join(process.cwd(), PLAN_DIR, filename);

        if (existsSync(filePath)) {
          // Load existing plan → execute mode
          loadPlanAndExecute(ctx, filename, titleFromFilename(filename));
        } else {
          // New plan → plan mode
          if (getMode() === "plan") {
            ctx.ui.notify("Already in plan mode", "info");
            return;
          }
          enterPlanWithFile(filename, pi);
          saveAndSetActiveTools(PLAN_MODE_TOOLS);
          updateStatus(ctx);
          if (ctx.hasUI) ctx.ui.notify(`Plan mode ON — creating plan "${sanitized}"`, "info");
        }
      }
    },
  });

  // ─── Shortcut: Ctrl+Alt+P ─────────────────────────────────────────────────

  pi.registerShortcut("ctrl+alt+p", {
    description: "Toggle plan mode",
    handler: async (ctx) => {
      const current = getMode();
      if (current === "off") {
        enterPlanMode(ctx);
      } else {
        enterOffMode(ctx);
      }
    },
  });

  // ─── Flag: --plan ──────────────────────────────────────────────────────────

  pi.registerFlag("plan", {
    type: "boolean",
    description: "Start in plan mode (read-only, explore and plan)",
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractTextFromMessage(message: Record<string, unknown>): string | null {
  const content = message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .filter((block: unknown): block is { type: string; text?: string } =>
        typeof block === "object" && block !== null && "type" in block && (block as { type: string }).type === "text",
      )
      .map((block) => block.text ?? "")
      .join("\n");
  }
  return null;
}