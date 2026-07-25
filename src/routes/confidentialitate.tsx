import { createFileRoute } from "@tanstack/react-router";
import { getLegalPage, LEGAL_META } from "@/lib/api/legal.functions";
import { LegalArticle } from "@/components/site/LegalArticle";

const SLUG = "confidentialitate" as const;

export const Route = createFileRoute("/confidentialitate")({
  loader: async () => await getLegalPage({ data: SLUG }),
  head: ({ loaderData }) => {
    const title = `${loaderData?.title || LEGAL_META[SLUG].title} · ZOL-OIL`;
    return {
      meta: [
        { title },
        { name: "description", content: "Politica de confidențialitate — Parc Auto ZOL-OIL." },
      ],
      links: [{ rel: "canonical", href: `/${SLUG}` }],
    };
  },
  component: () => (
    <LegalArticle page={Route.useLoaderData()} fallbackTitle={LEGAL_META[SLUG].title} />
  ),
});
