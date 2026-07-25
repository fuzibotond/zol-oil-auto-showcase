import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  adminListLegalPages,
  adminSaveLegalPage,
  LEGAL_META,
  type LegalSlug,
} from "@/lib/api/legal.functions";
import type { LegalPageDoc } from "@/lib/types";

export const Route = createFileRoute("/admin/legal")({
  component: AdminLegalPage,
});

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm";

function AdminLegalPage() {
  const fetchPages = useServerFn(adminListLegalPages);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "legal"],
    queryFn: () => fetchPages(),
  });

  if (isLoading || !data) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Pagini legale</h1>
        <p className="mt-2 text-sm text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Pagini legale</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Confidențialitate, cookie-uri și termeni. Textul actual este orientativ și necesită
        verificare juridică. Folosește „## ” la începutul unei linii pentru un subtitlu.
      </p>
      <div className="mt-8 space-y-6">
        {data.map((p) => (
          <LegalEditor key={p.slug} page={p} onSaved={refetch} />
        ))}
      </div>
    </div>
  );
}

function LegalEditor({ page, onSaved }: { page: LegalPageDoc; onSaved: () => void }) {
  const save = useServerFn(adminSaveLegalPage);
  const [title, setTitle] = useState(page.title);
  const [body, setBody] = useState(page.body);
  const [needsReview, setNeedsReview] = useState(page.needs_review);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTitle(page.title);
    setBody(page.body);
    setNeedsReview(page.needs_review);
  }, [page]);

  async function onSave() {
    setSaving(true);
    try {
      await save({
        data: { slug: page.slug as LegalSlug, title, body, needs_review: needsReview },
      });
      toast.success("Pagină salvată");
      onSaved();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  }

  const nav = LEGAL_META[page.slug as LegalSlug]?.nav ?? page.slug;

  return (
    <section className="surface-card p-6 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="font-display text-lg font-semibold">{nav}</div>
        <a
          href={`/${page.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-accent hover:underline"
        >
          Vezi pagina <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Titlu</span>
        <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-muted-foreground">Conținut</span>
        <textarea
          rows={12}
          className={`${inputCls} font-mono text-xs`}
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
      </label>
      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm">
          <Switch checked={needsReview} onCheckedChange={setNeedsReview} />
          Necesită verificare juridică
        </label>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> {saving ? "Se salvează..." : "Salvează"}
        </button>
      </div>
    </section>
  );
}
