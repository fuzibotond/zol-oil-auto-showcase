import { createFileRoute } from "@tanstack/react-router";
import { getLegalPage, LEGAL_META } from "@/lib/api/legal.functions";
import { LegalArticle } from "@/components/site/LegalArticle";
import { CONTACT_REQUIRED_LABELS } from "@/lib/site";

const SLUG = "confidentialitate" as const;

// Derived from the actual contact-form required fields (single source of truth in
// site.ts), so this note can never contradict the form.
function RequiredDataNote() {
  return (
    <>
      <h2 className="font-display text-xl font-semibold tracking-tight pt-2">
        Datele obligatorii din formularul de contact
      </h2>
      <p>
        Datele marcate ca obligatorii ({CONTACT_REQUIRED_LABELS.join(", ")}) sunt necesare pentru a
        putea procesa și răspunde solicitării. Dacă aceste informații nu sunt furnizate, este
        posibil să nu putem răspunde solicitării. Câmpurile „Email” și „Mesaj” sunt opționale.
      </p>
    </>
  );
}

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
    <LegalArticle
      page={Route.useLoaderData()}
      fallbackTitle={LEGAL_META[SLUG].title}
      extra={<RequiredDataNote />}
    />
  ),
});
