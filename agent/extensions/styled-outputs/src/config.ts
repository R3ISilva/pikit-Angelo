import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_CONFIG = {
  ASSISTANT_PREFIX: "●",
  THINKING_PREFIX: "✽",
  THINKING_LABEL: "Thinking:",
};

interface StyledOutputsUserConfig {
  assistantPrefix?: string;
  thinkingPrefix?: string;
  thinkingLabel?: string;
}

const CONFIG_PATH = join(homedir(), ".pi", "agent", "configs", "styled-outputs.json");

function loadUserConfig(): StyledOutputsUserConfig {
  try {
    const raw = readFileSync(CONFIG_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

const userConfig = loadUserConfig();

export const CONFIG = {
  assistantPrefix: userConfig.assistantPrefix ?? DEFAULT_CONFIG.ASSISTANT_PREFIX,
  thinkingPrefix: userConfig.thinkingPrefix ?? DEFAULT_CONFIG.THINKING_PREFIX,
  thinkingLabel: userConfig.thinkingLabel ?? DEFAULT_CONFIG.THINKING_LABEL,
};
