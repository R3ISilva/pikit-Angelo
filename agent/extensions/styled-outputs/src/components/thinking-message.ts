import { Markdown } from "@mariozechner/pi-tui";
import { CONFIG } from "../config.js";
import { getVisibleWidth, hasVisibleContent } from "../utils.js";

const FULL_PREFIX = ` ${CONFIG.thinkingPrefix} ${CONFIG.thinkingLabel} `;
const FIRST_LINE_PREFIX_WIDTH = getVisibleWidth(FULL_PREFIX);
const PREFIX_WIDTH = getVisibleWidth(CONFIG.thinkingPrefix) + 2;
const PADDING_PREFIX = " ".repeat(PREFIX_WIDTH);

export class ThinkingMessage {
  private md: InstanceType<typeof Markdown>;
  private cachedWidth?: number;
  private cachedLines?: string[];

  constructor(text: string, markdownTheme: any) {
    this.md = new Markdown(text, 0, 0, markdownTheme);
  }

  invalidate(): void {
    this.cachedWidth = undefined;
    this.cachedLines = undefined;
    this.md.invalidate();
  }

  render(width: number): string[] {
    if (this.cachedLines && this.cachedWidth === width) return this.cachedLines;

    if (width <= FIRST_LINE_PREFIX_WIDTH) {
      this.cachedWidth = width;
      this.cachedLines = [FULL_PREFIX.trimEnd()];
      return this.cachedLines;
    }

    const mdLines = this.md.render(width - FIRST_LINE_PREFIX_WIDTH);
    let prefixPlaced = false;

    const rendered = mdLines.map((line: string) => {
      if (!prefixPlaced && hasVisibleContent(line)) {
        prefixPlaced = true;
        return `${FULL_PREFIX}${line}`;
      }
      return `${PADDING_PREFIX}${line}`;
    });

    this.cachedWidth = width;
    this.cachedLines = rendered;
    return rendered;
  }
}
