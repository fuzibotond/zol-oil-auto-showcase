import { createFileRoute } from "@tanstack/react-router";
import { getLegalPage, LEGAL_META } from "@/lib/api/legal.functions";
import { LegalArticle } from "@/components/site/LegalArticle";
import { seoHead } from "@/lib/seo";

const SLUG = "termeni" as const;

export const Route = createFileRoute("/termeni")({
  loader: async () => await getLegalPage({ data: SLUG }),
  head: ({ loaderData }) =>
    seoHead({
      title: `${loaderData?.title || LEGAL_META[SLUG].title} · ZOL-OIL`,
      description: "Termeni și condiții — Parc Auto ZOL-OIL.",
      path: `/${SLUG}`,
    }),
  component: TermsPage,
});

function TermsPage() {
  return <LegalArticle page={Route.useLoaderData()} fallbackTitle={LEGAL_META[SLUG].title} />;
}
