import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_CONFIG = {
  // Assistant message
  ASSISTANT_MESSAGE: {
    PREFIX: "●",
    COLOR: "text",
  },

  // User message
  USER_MESSAGE: {
    PREFIX: "❯",
    COLOR: "accent",
    IS_THEME_BACKGROUND_VISIBLE: true,
  },
  
  // Thinking message
  THINKING_MESSAGE: {
    PREFIX: "✽",
    PREFIX_COLOR: "accent",
    LABEL: "Thinking:",
    LABEL_COLOR: "muted",
    IS_LABEL_VISIBLE: false,
    MESSAGE_COLOR: "dim",
  },

  // Tools
  TOOL_SPINNER_PREFIX: {
    PREFIX_CHARS: ["·", "✢", "✳", "✶", "✻", "✽"],   // tool loading spinner characters
    COLOR: "muted",                                 // color for the spinner prefix
  },
  TOOL_SUCCESS: {
    PREFIX: "●",                                    // icon for successful tool execution
    PREFIX_COLOR: "success",                        // color for the success prefix
    LABEL_COLOR: "success",                        // color for the success label (DONE on the 2nd line, the status line)
  },
  TOOL_ERROR: {
    PREFIX: "●",                                    // icon for error tool execution
    PREFIX_COLOR: "error",                          // color for the error prefix
    LABEL_COLOR: "error",                           // color for the error label (ERROR on the 2nd line, the status line)
  },
  TOOL_BRANCH: {
    PREFIX: "└─",                                   // icon use right before the status line
    COLOR: "dim",                                   // color for the branch icon
  },
  GENERAL: {
    TITLE_COLOR: "toolTitle",                      // color for tool titles (bash, ls, read, write, etc.)
    SUMMARY_COLOR: "dim",                          // color for tool summary (1st line, right after the title)
    COUNT_COLOR: "muted",                          // color for tool counts (e.g., "Tool 1 of 3")
    EXPAND_HINT_COLOR: "dim",                      // color for hints about expanding tool outputs
    OUTPUT_COLOR: "dim",                           // color for tool outputs
  },
};

// --- User config types (camelCase, partial) ---

interface StyledOutputsUserConfig {
  assistantMessage?: {
    prefix?: string;
    color?: string;
  };
  userMessage?: {
    prefix?: string;
    color?: string;
    isThemeBackgroundVisible?: boolean;
  };
  thinkingMessage?: {
    prefix?: string;
    prefixColor?: string;
    label?: string;
    labelColor?: string;
    isLabelVisible?: boolean;
    messageColor?: string;
  };
  toolSpinnerPrefix?: {
    prefixChars?: string[];
    color?: string;
  };
  toolSuccess?: {
    prefix?: string;
    prefixColor?: string;
    labelColor?: string;
  };
  toolError?: {
    prefix?: string;
    prefixColor?: string;
    labelColor?: string;
  };
  toolBranch?: {
    prefix?: string;
    color?: string;
  };
  general?: {
    titleColor?: string;
    summaryColor?: string;
    countColor?: string;
    expandHintColor?: string;
    outputColor?: string;
  };
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
  assistantMessage: {
    prefix: userConfig.assistantMessage?.prefix ?? DEFAULT_CONFIG.ASSISTANT_MESSAGE.PREFIX,
    color: userConfig.assistantMessage?.color ?? DEFAULT_CONFIG.ASSISTANT_MESSAGE.COLOR,
  },
  userMessage: {
    prefix: userConfig.userMessage?.prefix ?? DEFAULT_CONFIG.USER_MESSAGE.PREFIX,
    color: userConfig.userMessage?.color ?? DEFAULT_CONFIG.USER_MESSAGE.COLOR,
    isThemeBackgroundVisible: userConfig.userMessage?.isThemeBackgroundVisible ?? DEFAULT_CONFIG.USER_MESSAGE.IS_THEME_BACKGROUND_VISIBLE,
  },
  thinkingMessage: {
    prefix: userConfig.thinkingMessage?.prefix ?? DEFAULT_CONFIG.THINKING_MESSAGE.PREFIX,
    prefixColor: userConfig.thinkingMessage?.prefixColor ?? DEFAULT_CONFIG.THINKING_MESSAGE.PREFIX_COLOR,
    label: userConfig.thinkingMessage?.label ?? DEFAULT_CONFIG.THINKING_MESSAGE.LABEL,
    labelColor: userConfig.thinkingMessage?.labelColor ?? DEFAULT_CONFIG.THINKING_MESSAGE.LABEL_COLOR,
    isLabelVisible: userConfig.thinkingMessage?.isLabelVisible ?? DEFAULT_CONFIG.THINKING_MESSAGE.IS_LABEL_VISIBLE,
    messageColor: userConfig.thinkingMessage?.messageColor ?? DEFAULT_CONFIG.THINKING_MESSAGE.MESSAGE_COLOR,
  },
  toolSpinnerPrefix: {
    prefixChars: userConfig.toolSpinnerPrefix?.prefixChars ?? DEFAULT_CONFIG.TOOL_SPINNER_PREFIX.PREFIX_CHARS,
    color: userConfig.toolSpinnerPrefix?.color ?? DEFAULT_CONFIG.TOOL_SPINNER_PREFIX.COLOR,
  },
  toolSuccess: {
    prefix: userConfig.toolSuccess?.prefix ?? DEFAULT_CONFIG.TOOL_SUCCESS.PREFIX,
    prefixColor: userConfig.toolSuccess?.prefixColor ?? DEFAULT_CONFIG.TOOL_SUCCESS.PREFIX_COLOR,
    labelColor: userConfig.toolSuccess?.labelColor ?? DEFAULT_CONFIG.TOOL_SUCCESS.LABEL_COLOR,
  },
  toolError: {
    prefix: userConfig.toolError?.prefix ?? DEFAULT_CONFIG.TOOL_ERROR.PREFIX,
    prefixColor: userConfig.toolError?.prefixColor ?? DEFAULT_CONFIG.TOOL_ERROR.PREFIX_COLOR,
    labelColor: userConfig.toolError?.labelColor ?? DEFAULT_CONFIG.TOOL_ERROR.LABEL_COLOR,
  },
  toolBranch: {
    prefix: userConfig.toolBranch?.prefix ?? DEFAULT_CONFIG.TOOL_BRANCH.PREFIX,
    color: userConfig.toolBranch?.color ?? DEFAULT_CONFIG.TOOL_BRANCH.COLOR,
  },
  general: {
    titleColor: userConfig.general?.titleColor ?? DEFAULT_CONFIG.GENERAL.TITLE_COLOR,
    summaryColor: userConfig.general?.summaryColor ?? DEFAULT_CONFIG.GENERAL.SUMMARY_COLOR,
    countColor: userConfig.general?.countColor ?? DEFAULT_CONFIG.GENERAL.COUNT_COLOR,
    expandHintColor: userConfig.general?.expandHintColor ?? DEFAULT_CONFIG.GENERAL.EXPAND_HINT_COLOR,
    outputColor: userConfig.general?.outputColor ?? DEFAULT_CONFIG.GENERAL.OUTPUT_COLOR,
  },
};