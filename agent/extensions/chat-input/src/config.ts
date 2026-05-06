import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export const DEFAULT_CONFIG = {
	BOX_PAD_X: 1,
	MENU_GAP: 0,
	EXTRA_MENU_INDENT: 1,
	BORDER_TOKEN: "border" as const,
	ACCENT_TOKEN: "accent" as const,
	PREFIX: "\u276F",
	BOXED_VIEW: true,
};

interface ChatInputUserConfig {
	boxedView?: boolean;
	boxPadX?: number;
	menuGap?: number;
	extraMenuIndent?: number;
	borderToken?: string;
	accentToken?: string;
	prefix?: string;
}

const CONFIG_PATH = join(homedir(), ".pi", "agent", "configs", "chat-input.json");

function loadUserConfig(): ChatInputUserConfig {
	try {
		const raw = readFileSync(CONFIG_PATH, "utf8");
		return JSON.parse(raw);
	} catch {
		return {};
	}
}

const userConfig = loadUserConfig();

export const CONFIG = {
	BOX_PAD_X: userConfig.boxPadX ?? DEFAULT_CONFIG.BOX_PAD_X,
	MENU_GAP: userConfig.menuGap ?? DEFAULT_CONFIG.MENU_GAP,
	EXTRA_MENU_INDENT: userConfig.extraMenuIndent ?? DEFAULT_CONFIG.EXTRA_MENU_INDENT,
	BORDER_TOKEN: (userConfig.borderToken ?? DEFAULT_CONFIG.BORDER_TOKEN) as string,
	ACCENT_TOKEN: (userConfig.accentToken ?? DEFAULT_CONFIG.ACCENT_TOKEN) as string,
	PREFIX: userConfig.prefix ?? DEFAULT_CONFIG.PREFIX,
	BOXED_VIEW: userConfig.boxedView ?? DEFAULT_CONFIG.BOXED_VIEW,
};