"use client";

import { useEffect, useRef, useState } from "react";

export type Hello = { code: string; hello: string; font: string; color: string };

/**
 * Cycles "hello" through every culture, each in its own script, font and color.
 * - Inline with line-height 0: every face sits on the heading's baseline (next to the comma)
 *   and none can grow the line, so the heading never moves. (Inline also skips fade-in's slide.)
 * - Scripts and faces draw letters at very different heights (你好 vs Hello vs Khmer), so once the
 *   faces load, each greeting is resized until its letters reach as high as the first one's.
 */
export function HelloRotator({ items, label }: { items: Hello[]; label: string }) {
  const [i, setI] = useState(0);
  const [scale, setScale] = useState<number[]>([]);
  const span = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    // Auto-rotating text stays still for people who ask for reduced motion.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => setI((x) => (x + 1) % items.length), 2200);
    return () => clearInterval(id);
  }, [items.length]);

  useEffect(() => {
    const el = span.current;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!el || !ctx) return;
    const cs = getComputedStyle(el);
    const font = (it: Hello) => `${cs.fontWeight} 100px ${cs.getPropertyValue(it.font) || "sans-serif"}, ${cs.getPropertyValue("--font-brand")}, sans-serif`;
    const top = (it: Hello) => {
      ctx.font = font(it);
      return ctx.measureText(it.hello).actualBoundingBoxAscent || 1;
    };
    let live = true;
    Promise.all(items.map((it) => document.fonts.load(font(it), it.hello).catch(() => null))).then(() => {
      if (!live) return;
      const goal = top(items[0]);
      setScale(items.map((it) => Math.min(1.3, Math.max(0.55, goal / top(it)))));
    });
    return () => {
      live = false;
    };
  }, [items]);

  const it = items[i];
  return (
    <>
      <span className="sr-only">{label}</span>
      <span
        ref={span}
        aria-hidden="true"
        key={it.code}
        className="animate-fade-in leading-[0]"
        style={{ fontFamily: `var(${it.font}), var(--font-brand), sans-serif`, color: it.color, fontSize: scale[i] ? `${scale[i]}em` : undefined }}
      >
        {it.hello}
      </span>
    </>
  );
}
