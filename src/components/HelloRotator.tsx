"use client";

import { useEffect, useState } from "react";

export type Hello = { code: string; hello: string; font: string; color: string };

/** Cycles "hello" through every culture, each in its own script, font and color.
 *  Inline with line-height 0: every face sits on the heading's baseline (next to the comma)
 *  and none can grow the line, so the word changes without the heading moving. Also means
 *  fade-in's slide is skipped (transforms don't apply to inline boxes), leaving a plain fade. */
export function HelloRotator({ items, label }: { items: Hello[]; label: string }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => (x + 1) % items.length), 2200);
    return () => clearInterval(id);
  }, [items.length]);
  const it = items[i];
  return (
    <>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" key={it.code} className="animate-fade-in leading-[0]" style={{ fontFamily: `var(${it.font}), var(--font-brand), sans-serif`, color: it.color }}>
        {it.hello}
      </span>
    </>
  );
}
