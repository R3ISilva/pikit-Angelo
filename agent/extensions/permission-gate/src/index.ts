/**
 * Permission Gate Extension
 *
 * Intercepts bash tool calls and prompts for confirmation before running
 * commands that match dangerous patterns (rm -rf, sudo, chmod/chown 777).
 *
 * Patterns are configurable via ~/.pi/agent/configs/permission-gate.json.
 * When no config is present the three built-in defaults apply.
 *
 * Config location:
 *   ~/.pi/agent/configs/permission-gate.json
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { loadConfig } from "./config.js";

export default function permissionGateExtension(pi: ExtensionAPI) {
  const { patterns, blockWithoutUI } = loadConfig();

  pi.on("tool_call", async (event, ctx) => {
    if (event.toolName !== "bash") return undefined;

    const command = event.input.command as string;
    const isDangerous = patterns.some((p) => p.test(command));

    if (!isDangerous) return undefined;

    if (!ctx.hasUI) {
      if (blockWithoutUI) {
        return { block: true, reason: "[permission-gate] Command blocked \u2014 matches a dangerous pattern. You can override this by editing ~/.pi/agent/configs/permission-gate.json." };
      }
      return undefined;
    }

    const choice = await ctx.ui.select(
      `⚠️  Dangerous command detected:\n\n  ${command}\n\nAllow?`,
      ["Yes", "No"],
    );

    if (choice !== "Yes") {
      return { block: true, reason: "[permission-gate] Command blocked by user \u2014 matches a dangerous pattern. You can override this by editing ~/.pi/agent/configs/permission-gate.json." };
    }

    return undefined;
  });
}
