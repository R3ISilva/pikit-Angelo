import { visibleWidth, truncateToWidth } from "@mariozechner/pi-tui";

export function hasNerdFonts(): boolean {
  if (process.env.SLOP_FOOTER_NERD_FONTS === "1") return true;
  if (process.env.SLOP_FOOTER_NERD_FONTS === "0") return false;
  if (process.env.GHOSTTY_RESOURCES_DIR) return true;
  const term = (process.env.TERM_PROGRAM || "").toLowerCase();
  return ["iterm", "wezterm", "kitty", "ghostty", "alacritty"].some(t => term.includes(t));
}

export function bold(text: string): string {
  return `\x1b[1m${text}\x1b[22m`;
}

export function centerText(text: string, width: number): string {
  const visLen = visibleWidth(text);
  if (visLen >= width) return truncateToWidth(text, width, "…");
  const leftPad = Math.floor((width - visLen) / 2);
  return " ".repeat(leftPad) + text + " ".repeat(width - visLen - leftPad);
}

export function fitToWidth(str: string, width: number): string {
  const visLen = visibleWidth(str);
  if (visLen > width) return truncateToWidth(str, width, "…");
  return str + " ".repeat(width - visLen);
}
