import type { ReactNode } from "react";
import type { LegalPageDoc } from "@/lib/types";

// Renders a legal page body from a tiny, safe subset of Markdown — never HTML:
//   "## " / "### " headings, "* " or "- " bullet lists, blank-line paragraphs,
//   and [text](url) links limited to https:, mailto:, tel: and site paths.
// Everything becomes React elements (no dangerouslySetInnerHTML), so
// admin-entered content can't inject markup or javascript: URLs.

const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;

function safeHref(url: string): string | null {
  return /^(https:\/\/|mailto:|tel:|\/(?!\/))/i.test(url) ? url : null;
}

/** Turn inline [text](url) links into <a>; anything else stays plain text. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const m of text.matchAll(LINK_RE)) {
    const href = safeHref(m[2]);
    if (m.index > last) out.push(text.slice(last, m.index));
    if (href) {
      const external = href.startsWith("https://");
      out.push(
        <a
          key={`${keyPrefix}-${i++}`}
          href={href}
          className="font-medium text-accent underline"
          {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
        >
          {m[1]}
        </a>,
      );
    } else {
      out.push(m[1]);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderBlocks(body: string): ReactNode[] {
  const out: ReactNode[] = [];
  let para: string[] = [];
  let list: string[] = [];
  let key = 0;
  const flushPara = () => {
    if (para.length) {
      const k = key++;
      out.push(
        <p key={k} className="whitespace-pre-line">
          {renderInline(para.join("\n"), `p${k}`)}
        </p>,
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const k = key++;
      out.push(
        <ul key={k} className="list-disc space-y-1 pl-5">
          {list.map((item, i) => (
            <li key={i}>{renderInline(item, `l${k}-${i}`)}</li>
          ))}
        </ul>,
      );
      list = [];
    }
  };
  const flush = () => {
    flushPara();
    flushList();
  };
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\r$/, "");
    const bullet = line.match(/^\s*[*-]\s+(.*)$/);
    if (line.startsWith("### ")) {
      flush();
      out.push(
        <h3 key={key++} className="font-display text-lg font-semibold tracking-tight pt-1">
          {line.slice(4).trim()}
        </h3>,
      );
    } else if (line.startsWith("## ")) {
      flush();
      out.push(
        <h2 key={key++} className="font-display text-xl font-semibold tracking-tight pt-2">
          {line.slice(3).trim()}
        </h2>,
      );
    } else if (bullet) {
      flushPara();
      list.push(bullet[1]);
    } else if (line.trim() === "") {
      flush();
    } else {
      flushList();
      para.push(line);
    }
  }
  flush();
  return out;
}

export function LegalArticle({
  page,
  fallbackTitle,
  extra,
}: {
  page: LegalPageDoc | null;
  fallbackTitle: string;
  extra?: ReactNode;
}) {
  const title = page?.title || fallbackTitle;
  const body = page?.body || "Conținutul acestei pagini va fi disponibil în curând.";
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-10 md:py-16">
      <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
      <article className="mt-6 space-y-4 text-sm leading-relaxed text-foreground/90">
        {renderBlocks(body)}
        {extra}
      </article>
    </div>
  );
}
