"use client";

import { useId, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";

/*
 * Code / log evidence panel (MDS COMPONENTS-PROPOSAL "Code or log excerpt";
 * DESIGN-SYSTEM.md §10; MDS-REF-003, MDS-REF-006).
 *
 * Approved behaviour implemented here:
 *  - dark evidence surface, Geist Mono, numbered lines;
 *  - keyboard-operable tabs that never conceal a material warning or
 *    limitation — the state, consequence, and limitation live outside this
 *    component, so switching tabs cannot hide them;
 *  - controlled horizontal overflow with row identity preserved;
 *  - a copy action;
 *  - a contextual caption;
 *  - accessible text: the excerpt is real text in the DOM, never an image,
 *    and tone is never the only carrier of meaning.
 *
 * Tabs follow the WAI-ARIA tabs pattern: roving tabindex, arrow/Home/End keys,
 * and a single tab stop for the whole tablist.
 */

export type ExcerptTab = {
  id: string;
  label: string;
  /** Plain text. Rendered verbatim, one array entry per line. */
  lines: string[];
  /** Read by assistive technology before the excerpt. */
  description: string;
};

export function CodeExcerpt({
  tabs,
  caption,
  redaction,
}: {
  tabs: ExcerptTab[];
  caption: string;
  /** Shown when any part of the excerpt was withheld. */
  redaction?: string;
}) {
  const baseId = useId();
  const [activeId, setActiveId] = useState(tabs[0]?.id);
  const [copied, setCopied] = useState(false);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];
  if (!active) return null;
  const single = tabs.length === 1;

  function focusTab(index: number) {
    const next = tabs[(index + tabs.length) % tabs.length];
    setActiveId(next.id);
    tabRefs.current[next.id]?.focus();
  }

  function onKeyDown(event: React.KeyboardEvent, index: number) {
    const keys: Record<string, number> = {
      ArrowRight: index + 1,
      ArrowLeft: index - 1,
      Home: 0,
      End: tabs.length - 1,
    };
    if (!(event.key in keys)) return;
    event.preventDefault();
    focusTab(keys[event.key]);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(active!.lines.join("\n"));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused. The excerpt is selectable text, so
      // the buyer still has a route; nothing about the evidence changes.
      setCopied(false);
    }
  }

  return (
    /*
     * min-w-0 matters here: a flex or grid ancestor defaults to
     * min-width:auto, which lets the widest code line push the whole page
     * sideways instead of scrolling inside this figure. The approved rule is
     * that a matrix or excerpt may scroll itself, but the page body must not
     * scroll horizontally.
     */
    <figure className="rounded-card border-line min-w-0 overflow-hidden border">
      <div className="bg-evidence on-ink flex items-center justify-between gap-3 border-b border-white/10 pr-2">
        {/*
         * A single view is not a tab set. A one-item tablist would announce a
         * control that changes nothing, so the tabs pattern is used only when
         * there is a real choice.
         */}
        {single ? (
          <p className="text-body-sm text-inverse min-h-11 px-4 py-3 font-semibold">
            {tabs[0].label}
          </p>
        ) : (
          <div
            role="tablist"
            aria-label="Evidence view"
            className="flex min-w-0 flex-1 overflow-x-auto"
          >
            {tabs.map((tab, index) => {
              const selected = tab.id === active.id;
              return (
                <button
                  key={tab.id}
                  ref={(node) => {
                    tabRefs.current[tab.id] = node;
                  }}
                  type="button"
                  role="tab"
                  id={`${baseId}-tab-${tab.id}`}
                  aria-selected={selected}
                  aria-controls={`${baseId}-panel-${tab.id}`}
                  tabIndex={selected ? 0 : -1}
                  data-print-hide={selected ? undefined : "true"}
                  onClick={() => setActiveId(tab.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  className={`text-body-sm min-h-11 shrink-0 border-b-2 px-4 font-semibold whitespace-nowrap transition-colors duration-(--motion-default) ${
                    selected
                      ? "border-accent text-inverse"
                      : "text-inverse/65 hover:text-inverse border-transparent"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <button
          type="button"
          onClick={copy}
          data-print-hide="true"
          className="on-ink text-inverse/75 hover:text-inverse inline-flex min-h-11 min-w-11 items-center justify-center gap-2 px-2"
        >
          <Icon
            name={copied ? "check" : "copy"}
            size={16}
            label={copied ? "Copied" : `Copy the ${active.label} excerpt`}
          />
        </button>
      </div>

      {tabs.map((tab) => (
        <div
          key={tab.id}
          role={single ? "group" : "tabpanel"}
          id={`${baseId}-panel-${tab.id}`}
          aria-labelledby={single ? undefined : `${baseId}-tab-${tab.id}`}
          aria-label={single ? tab.label : undefined}
          hidden={tab.id !== active.id}
          tabIndex={0}
          className="bg-evidence on-ink relative max-h-[26rem] overflow-auto p-4"
        >
          <p className="sr-only">{tab.description}</p>
          <pre className="text-mono text-inverse font-mono">
            <code>
              {tab.lines.map((line, index) => (
                <span key={index} className="flex gap-4">
                  <span
                    aria-hidden="true"
                    className="text-inverse/35 w-6 shrink-0 text-right tabular-nums select-none"
                  >
                    {index + 1}
                  </span>
                  <span className="whitespace-pre">{line || " "}</span>
                </span>
              ))}
            </code>
          </pre>
        </div>
      ))}

      <figcaption className="border-line bg-muted text-body-sm text-subtle border-t px-4 py-3">
        {caption}
        {redaction ? (
          <span className="text-strong mt-1 block font-semibold">
            {redaction}
          </span>
        ) : null}
      </figcaption>
    </figure>
  );
}
