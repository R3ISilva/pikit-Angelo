import { Markdown } from "@mariozechner/pi-tui";
import { CONFIG } from "../config.js";
import { getVisibleWidth, hasVisibleContent, currentTheme, applyColor } from "../utils.js";

const PREFIX_WIDTH = getVisibleWidth(CONFIG.thinkingPrefix) + 2;
const PADDING_PREFIX = " ".repeat(PREFIX_WIDTH);

function getFullPrefix(): string {
  const prefix = currentTheme
    ? applyColor(currentTheme, CONFIG.thinkingPrefixColor, CONFIG.thinkingPrefix)
    : CONFIG.thinkingPrefix;
  const label = currentTheme
    ? applyColor(currentTheme, CONFIG.thinkingLabelColor, CONFIG.thinkingLabel)
    : CONFIG.thinkingLabel;
  return ` ${prefix}${CONFIG.isThinkingLabelVisible ? ` ${label} ` : ` `}`;
}

export interface ThinkingMessage {
  invalidate(): void;
  render(width: number): string[];
}

export function createThinkingMessage(text: string, markdownTheme: any): ThinkingMessage {
  const md = new Markdown(text, 0, 0, markdownTheme, {
    color: (t: string) => {
      if (!currentTheme) return t;
      return applyColor(currentTheme, CONFIG.thinkingMessageColor, t);
    },
    italic: true,
  });
  let cachedWidth: number | undefined;
  let cachedLines: string[] | undefined;

  function invalidate(): void {
    cachedWidth = undefined;
    cachedLines = undefined;
    md.invalidate();
  }

  function render(width: number): string[] {
    if (cachedLines && cachedWidth === width) return cachedLines;

    const fullPrefix = getFullPrefix();
    const firstLinePrefixWidth = getVisibleWidth(fullPrefix);

    if (width <= firstLinePrefixWidth) {
      cachedWidth = width;
      cachedLines = [fullPrefix.trimEnd()];
      return cachedLines;
    }

    const mdLines = md.render(width - firstLinePrefixWidth);
    let prefixPlaced = false;

    const rendered = mdLines.map((line: string) => {
      if (!prefixPlaced && hasVisibleContent(line)) {
        prefixPlaced = true;
        return `${fullPrefix}${line}`;
      }
      return `${PADDING_PREFIX}${line}`;
    });

    cachedWidth = width;
    cachedLines = rendered;
    return rendered;
  }

  return { invalidate, render };
}
