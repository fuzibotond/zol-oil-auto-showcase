import type { ReactNode } from "react";
import type { LegalPageDoc } from "@/lib/types";

// Renders a legal page body as PLAIN TEXT (never HTML): lines starting with "## "
// become headings, blank lines separate paragraphs. Safe by construction — no
// dangerouslySetInnerHTML, so admin-entered content can't inject markup.
function renderBlocks(body: string): ReactNode[] {
  const out: ReactNode[] = [];
  let para: string[] = [];
  let key = 0;
  const flush = () => {
    if (para.length) {
      out.push(
        <p key={key++} className="whitespace-pre-line">
          {para.join("\n")}
        </p>,
      );
      para = [];
    }
  };
  for (const raw of body.split("\n")) {
    const line = raw.replace(/\r$/, "");
    if (line.startsWith("## ")) {
      flush();
      out.push(
        <h2 key={key++} className="font-display text-xl font-semibold tracking-tight pt-2">
          {line.slice(3).trim()}
        </h2>,
      );
    } else if (line.trim() === "") {
      flush();
    } else {
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
