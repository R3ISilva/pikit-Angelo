/**
 * Config loader for the permission-gate extension.
 *
 * Reads ~/.pi/agent/configs/permission-gate.json if present.
 * Falls back to built-in defaults when the file is absent or unreadable.
 *
 * Config shape:
 * {
 *   "patterns": ["\\brm\\s+(-rf?|--recursive)", "\\bsudo\\b", ...],
 *   "blockWithoutUI": true
 * }
 */

import { readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";

export interface PermissionGateConfig {
  /** Compiled regex patterns to match against bash commands. */
  patterns: RegExp[];
  /** Block dangerous commands when no UI is available. Default: true. */
  blockWithoutUI: boolean;
}

const DEFAULT_PATTERNS: RegExp[] = [
  /\brm\s+(-rf?|--recursive)/i,
  /\bsudo\b/i,
  /\b(chmod|chown)\b.*777/i,
];

const CONFIG_PATH = join(homedir(), ".pi", "agent", "configs", "permission-gate.json");

export function loadConfig(): PermissionGateConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);

    const patterns: RegExp[] =
      Array.isArray(parsed.patterns) && parsed.patterns.length > 0
        ? parsed.patterns.map((p: string) => new RegExp(p, "i"))
        : DEFAULT_PATTERNS;

    const blockWithoutUI =
      typeof parsed.blockWithoutUI === "boolean" ? parsed.blockWithoutUI : true;

    return { patterns, blockWithoutUI };
  } catch {
    // File absent or unreadable — use defaults
    return { patterns: DEFAULT_PATTERNS, blockWithoutUI: true };
  }
}
