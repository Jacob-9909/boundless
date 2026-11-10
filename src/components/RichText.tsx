import type { ReactNode } from "react";
import { Icon } from "./Icon";

// http(s) only, so a "javascript:" address in a post stays plain text. Closing punctuation belongs to the sentence.
const URL_RE = /https?:\/\/[^\s<>"]+/g;
const trim = (u: string) => u.replace(/[.,!?;:)\]}'"”’。、]+$/, "");
const ext = { target: "_blank", rel: "noopener noreferrer nofollow ugc" } as const;

/** Post or comment text with its web addresses as links. */
export function Linkify({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  for (const m of text.matchAll(URL_RE)) {
    const url = trim(m[0]);
    out.push(
      text.slice(last, m.index),
      <a key={m.index} href={url} {...ext} className="rounded bg-primary/10 px-1 font-semibold text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary">
        {url}
      </a>
    );
    last = m.index + url.length;
  }
  out.push(text.slice(last));
  return <>{out}</>;
}

/** The addresses in a post, each once (five at most), for the link cards under the text. */
export function linksIn(text: string) {
  const seen = new Map<string, { href: string; host: string; path: string }>();
  for (const m of text.matchAll(URL_RE)) {
    const href = trim(m[0]);
    if (seen.has(href) || seen.size >= 5) continue;
    try {
      const u = new URL(href);
      seen.set(href, { href, host: u.hostname.replace(/^www\./, ""), path: decodeURI(u.pathname + u.search).replace(/^\/$/, "") });
    } catch {}
  }
  return [...seen.values()];
}

export function LinkCards({ text, label }: { text: string; label: string }) {
  const links = linksIn(text);
  if (!links.length) return null;
  return (
    <div className="mt-5 space-y-2">
      <p className="flex items-center gap-1.5 text-xs font-bold opacity-70">
        <Icon name="link" size={13} />
        {label}
      </p>
      {links.map((l) => (
        <a key={l.href} href={l.href} {...ext} className="flex items-center gap-3 rounded-xl border border-primary/20 bg-soft/40 p-3 transition hover:border-primary/50 hover:bg-soft/70">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-paper">
            <Icon name="link" size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{l.host}</span>
            {l.path && <span className="block truncate text-xs opacity-70">{l.path}</span>}
          </span>
          <Icon name="external" size={16} className="text-primary" />
        </a>
      ))}
    </div>
  );
}
