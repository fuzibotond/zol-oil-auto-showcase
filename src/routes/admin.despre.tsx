import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save, ArrowUp, ArrowDown, ImageOff } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  adminGetAbout,
  adminSaveAboutPage,
  adminSaveAboutSection,
  adminDeleteAboutSection,
} from "@/lib/api/about.functions";
import type { AboutPage, AboutSection, ImagePosition } from "@/lib/types";

export const Route = createFileRoute("/admin/despre")({
  component: AdminAboutPage,
});

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm";

function AdminAboutPage() {
  const fetchAbout = useServerFn(adminGetAbout);
  const savePage = useServerFn(adminSaveAboutPage);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin", "about"],
    queryFn: () => fetchAbout(),
  });

  const [page, setPage] = useState<AboutPage | null>(null);
  const [sections, setSections] = useState<AboutSection[]>([]);
  const [savingPage, setSavingPage] = useState(false);

  useEffect(() => {
    if (!data) return;
    setPage(data.page);
    setSections(data.sections);
  }, [data]);

  async function onSavePage(e: React.FormEvent) {
    e.preventDefault();
    if (!page) return;
    setSavingPage(true);
    try {
      await savePage({ data: page });
      toast.success("Pagina „Despre noi” a fost salvată");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la salvare");
    } finally {
      setSavingPage(false);
    }
  }

  if (isLoading || !page) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Despre noi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Pagina „Despre noi”</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Editează introducerea, secțiunile de conținut și metadatele SEO. Modificările apar la{" "}
        <span className="font-mono">/despre-noi</span>.
      </p>

      {/* Page meta */}
      <form onSubmit={onSavePage} className="mt-8 surface-card p-6 space-y-4">
        <div className="font-display text-lg font-semibold">Titlu & introducere</div>
        <Field label="Titlu principal">
          <input
            className={inputCls}
            value={page.hero_title}
            onChange={(e) => setPage({ ...page, hero_title: e.target.value })}
          />
        </Field>
        <Field label="Introducere">
          <textarea
            rows={4}
            className={inputCls}
            value={page.intro}
            onChange={(e) => setPage({ ...page, intro: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="SEO — titlu">
            <input
              className={inputCls}
              value={page.seo_title}
              onChange={(e) => setPage({ ...page, seo_title: e.target.value })}
            />
          </Field>
          <Field label="SEO — descriere">
            <input
              className={inputCls}
              value={page.seo_description}
              onChange={(e) => setPage({ ...page, seo_description: e.target.value })}
            />
          </Field>
        </div>
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={savingPage}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {savingPage ? "Se salvează..." : "Salvează pagina"}
          </button>
        </div>
      </form>

      {/* Sections */}
      <div className="mt-8 flex items-center justify-between">
        <div className="font-display text-lg font-semibold">Secțiuni de conținut</div>
        <NewSectionButton nextOrder={sections.length} onCreated={refetch} />
      </div>

      <div className="mt-4 space-y-4">
        {sections.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Nicio secțiune încă. Adaugă prima secțiune.
          </p>
        )}
        {sections.map((s, i) => (
          <SectionEditor
            key={s.id}
            section={s}
            isFirst={i === 0}
            isLast={i === sections.length - 1}
            siblings={sections}
            onChanged={refetch}
          />
        ))}
      </div>
    </div>
  );
}

function NewSectionButton({ nextOrder, onCreated }: { nextOrder: number; onCreated: () => void }) {
  const save = useServerFn(adminSaveAboutSection);
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    try {
      await save({
        data: {
          title: "Secțiune nouă",
          body: "",
          image_url: null,
          image_r2_key: null,
          image_alt: null,
          image_position: "left",
          sort_order: nextOrder,
          is_published: false,
        },
      });
      toast.success("Secțiune adăugată (nepublicată)");
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare");
    } finally {
      setBusy(false);
    }
  }
  return (
    <button
      type="button"
      onClick={add}
      disabled={busy}
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary disabled:opacity-60"
    >
      <Plus className="h-4 w-4" /> Secțiune
    </button>
  );
}

function SectionEditor({
  section,
  isFirst,
  isLast,
  siblings,
  onChanged,
}: {
  section: AboutSection;
  isFirst: boolean;
  isLast: boolean;
  siblings: AboutSection[];
  onChanged: () => void;
}) {
  const save = useServerFn(adminSaveAboutSection);
  const del = useServerFn(adminDeleteAboutSection);
  const [s, setS] = useState<AboutSection>(section);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => setS(section), [section]);

  async function persist(next: AboutSection) {
    await save({
      data: {
        id: next.id,
        title: next.title,
        body: next.body ?? "",
        image_url: next.image_url,
        image_r2_key: next.image_r2_key,
        image_alt: next.image_alt,
        image_position: next.image_position,
        sort_order: next.sort_order,
        is_published: next.is_published,
      },
    });
  }

  async function onSave() {
    setBusy(true);
    try {
      await persist(s);
      toast.success("Secțiune salvată");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete() {
    if (!confirm("Ștergi această secțiune?")) return;
    setBusy(true);
    try {
      await del({ data: s.id });
      toast.success("Secțiune ștearsă");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare");
    } finally {
      setBusy(false);
    }
  }

  // Reorder by swapping sort_order with the neighbour and saving both.
  async function move(dir: -1 | 1) {
    const idx = siblings.findIndex((x) => x.id === s.id);
    const neighbour = siblings[idx + dir];
    if (!neighbour) return;
    setBusy(true);
    try {
      await persist({ ...s, sort_order: neighbour.sort_order });
      await save({
        data: {
          id: neighbour.id,
          title: neighbour.title,
          body: neighbour.body ?? "",
          image_url: neighbour.image_url,
          image_r2_key: neighbour.image_r2_key,
          image_alt: neighbour.image_alt,
          image_position: neighbour.image_position,
          sort_order: s.sort_order,
          is_published: neighbour.is_published,
        },
      });
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare");
    } finally {
      setBusy(false);
    }
  }

  async function uploadImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = (await res.json().catch(() => ({}))) as {
        url?: string;
        r2_key?: string;
        error?: string;
      };
      if (!res.ok || !body.url) throw new Error(body.error ?? "Încărcare eșuată.");
      const next = { ...s, image_url: body.url, image_r2_key: body.r2_key ?? null };
      setS(next);
      await persist(next);
      toast.success("Imagine încărcată");
      onChanged();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la încărcare");
    } finally {
      setUploading(false);
    }
  }

  async function removeImage() {
    const next = { ...s, image_url: null, image_r2_key: null };
    setS(next);
    await persist(next);
    onChanged();
  }

  return (
    <div className="surface-card p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <input
          className={`${inputCls} font-medium`}
          value={s.title}
          onChange={(e) => setS({ ...s, title: e.target.value })}
          placeholder="Titlu secțiune"
        />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => move(-1)}
            disabled={isFirst || busy}
            className="rounded-lg border border-border p-2 disabled:opacity-30"
            aria-label="Mută sus"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => move(1)}
            disabled={isLast || busy}
            className="rounded-lg border border-border p-2 disabled:opacity-30"
            aria-label="Mută jos"
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      <textarea
        rows={4}
        className={inputCls}
        value={s.body ?? ""}
        onChange={(e) => setS({ ...s, body: e.target.value })}
        placeholder="Text (fără cod HTML)"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Poziție imagine
          </span>
          <select
            className={inputCls}
            value={s.image_position}
            onChange={(e) => setS({ ...s, image_position: e.target.value as ImagePosition })}
          >
            <option value="left">Stânga</option>
            <option value="right">Dreapta</option>
            <option value="top">Sus</option>
            <option value="none">Fără imagine</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted-foreground">
            Text alternativ (alt)
          </span>
          <input
            className={inputCls}
            value={s.image_alt ?? ""}
            onChange={(e) => setS({ ...s, image_alt: e.target.value })}
            placeholder="Descriere imagine (RO)"
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {s.image_url ? (
          <img
            src={s.image_url}
            alt={s.image_alt ?? ""}
            className="h-16 w-24 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-24 items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground">
            <ImageOff className="h-5 w-5" />
          </div>
        )}
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadImage(e.target.files?.[0])}
          />
          {uploading ? "Se încarcă..." : "Încarcă imagine"}
        </label>
        {s.image_url && (
          <button
            type="button"
            onClick={removeImage}
            className="text-sm text-destructive hover:underline"
          >
            Elimină imaginea
          </button>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-border pt-3">
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={s.is_published}
            onCheckedChange={(v) => setS({ ...s, is_published: v })}
          />
          {s.is_published ? "Publicată" : "Ascunsă"}
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive disabled:opacity-60"
          >
            <Trash2 className="h-4 w-4" /> Șterge
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> Salvează
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
