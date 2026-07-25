import { createFileRoute } from "@tanstack/react-router";
import { getLegalPage, LEGAL_META } from "@/lib/api/legal.functions";
import { LegalArticle } from "@/components/site/LegalArticle";

const SLUG = "termeni" as const;

export const Route = createFileRoute("/termeni")({
  loader: async () => await getLegalPage({ data: SLUG }),
  head: ({ loaderData }) => {
    const title = `${loaderData?.title || LEGAL_META[SLUG].title} · ZOL-OIL`;
    return {
      meta: [
        { title },
        { name: "description", content: "Termeni și condiții — Parc Auto ZOL-OIL." },
      ],
      links: [{ rel: "canonical", href: `/${SLUG}` }],
    };
  },
  component: () => (
    <LegalArticle page={Route.useLoaderData()} fallbackTitle={LEGAL_META[SLUG].title} />
  ),
});
