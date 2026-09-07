import type { Page } from "@playwright/test";

/*
 * Measured AA text contrast (WCAG 2.2 AA 1.4.3).
 *
 * Extracted from the S1 shell suite so S2 can measure the guided lab in its
 * RUN state as well — the evidence panels, the tinted status blocks, the dark
 * code surface, and the matrix are all new colour composition that no static
 * route exercises.
 *
 * Measured in the browser from computed styles rather than from the token
 * table, so a composition mistake (a softened white on the brand surface, a
 * muted token on the wrong surface) is caught where it actually renders.
 *
 * Every leaf text node is checked against the first opaque background in its
 * ancestor chain. Large text uses the 3:1 threshold the guideline allows.
 */
export async function measureContrastFailures(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const parse = (value: string): [number, number, number, number] | null => {
      const match = value.match(/rgba?\(([^)]+)\)/);
      if (!match) return null;
      const parts = match[1]
        .split(/[\s,/]+/)
        .filter(Boolean)
        .map(Number);
      return [parts[0], parts[1], parts[2], parts[3] ?? 1];
    };
    const channel = (c: number) => {
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    const luminance = ([r, g, b]: number[]) =>
      0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    const contrast = (a: number[], b: number[]) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
      return (hi + 0.05) / (lo + 0.05);
    };
    const composite = (fg: number[], bg: number[]) =>
      [0, 1, 2].map((i) => fg[i] * fg[3] + bg[i] * (1 - fg[3]));

    function backgroundOf(el: Element): number[] {
      let node: Element | null = el;
      while (node) {
        const rgba = parse(getComputedStyle(node).backgroundColor);
        if (rgba && rgba[3] > 0) {
          if (rgba[3] === 1) return rgba.slice(0, 3);
          const below = node.parentElement
            ? backgroundOf(node.parentElement)
            : [255, 255, 255];
          return composite(rgba, below);
        }
        node = node.parentElement;
      }
      return [255, 255, 255];
    }

    const problems: string[] = [];
    for (const el of document.querySelectorAll("body *")) {
      if (!el.textContent?.trim()) continue;
      // Leaf text only, so a container is not measured against its children.
      if (el.querySelector("*")) continue;
      const style = getComputedStyle(el);
      if (style.visibility === "hidden" || style.display === "none") continue;
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) continue;
      /*
       * Skip visually hidden text. The sr-only pattern clips a node to a 1px
       * box, so it reports a 1:1 ratio against whatever is behind it while
       * being unreadable by definition. WCAG 1.4.3 governs perceivable text;
       * measuring screen-reader-only strings would report failures no sighted
       * user can encounter, and would push toward deleting the very text that
       * carries evidence state non-visually.
       */
      if (rect.width <= 1 || rect.height <= 1) continue;

      const fg = parse(style.color);
      if (!fg) continue;
      const bg = backgroundOf(el);
      const ratio = contrast(composite(fg, bg), bg);

      const size = parseFloat(style.fontSize);
      const weight = Number(style.fontWeight) || 400;
      const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
      const min = isLarge ? 3 : 4.5;

      if (ratio < min) {
        problems.push(
          `${ratio.toFixed(2)}:1 (min ${min}) — "${el.textContent.trim().slice(0, 45)}"`,
        );
      }
    }
    return problems;
  });
}
