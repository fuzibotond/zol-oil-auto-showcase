import { createFileRoute } from "@tanstack/react-router";
import { getLegalPage, LEGAL_META } from "@/lib/api/legal.functions";
import { LegalArticle } from "@/components/site/LegalArticle";
import { seoHead } from "@/lib/seo";

const SLUG = "politica-cookie" as const;

export const Route = createFileRoute("/politica-cookie")({
  loader: async () => await getLegalPage({ data: SLUG }),
  head: ({ loaderData }) =>
    seoHead({
      title: `${loaderData?.title || LEGAL_META[SLUG].title} · ZOL-OIL`,
      description: "Politica privind modulele cookie — Parc Auto ZOL-OIL.",
      path: `/${SLUG}`,
    }),
  component: CookiePolicyPage,
});

function CookiePolicyPage() {
  return <LegalArticle page={Route.useLoaderData()} fallbackTitle={LEGAL_META[SLUG].title} />;
}
