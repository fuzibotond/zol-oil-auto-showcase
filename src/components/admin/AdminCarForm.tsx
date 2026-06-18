import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2, GripVertical, Plus } from "lucide-react";
import { adminUpsertCar } from "@/lib/api/cars.functions";
import type { Car } from "@/lib/types";
import { slugify } from "@/lib/format";
import { FUEL_TYPES, TRANSMISSIONS, BODY_TYPES, STATUSES, STATUS_LABEL } from "@/lib/site";
import { supabase } from "@/integrations/supabase/client";

type ImageRow = { url: string; alt_text?: string | null };

interface Props { initial?: Car | null }

export function AdminCarForm({ initial }: Props) {
  const upsert = useServerFn(adminUpsertCar);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [form, setForm] = useState({
    slug: initial?.slug ?? "",
    brand: initial?.brand ?? "",
    model: initial?.model ?? "",
    autovit_url: initial?.autovit_url ?? "",
    version: initial?.version ?? "",
    year: initial?.year ?? new Date().getFullYear() - 5,
    price: initial?.price ?? 0,
    currency: initial?.currency ?? "EUR",
    mileage: initial?.mileage ?? 0,
    fuel_type: initial?.fuel_type ?? FUEL_TYPES[1],
    transmission: initial?.transmission ?? TRANSMISSIONS[0],
    engine_size: initial?.engine_size ?? 0,
    power: initial?.power ?? 0,
    body_type: initial?.body_type ?? BODY_TYPES[0],
    color: initial?.color ?? "",
    description: initial?.description ?? "",
    equipment: (initial?.equipment ?? []).join("\n"),
    status: (initial?.status ?? "disponibil") as string,
    is_featured: initial?.is_featured ?? false,
  });
  const [images, setImages] = useState<ImageRow[]>(
    (initial?.images ?? []).map((i) => ({ url: i.url, alt_text: i.alt_text ?? "" }))
  );
  const [newImage, setNewImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function autoSlug() {
    if (!form.slug && form.brand && form.model) {
      setForm((f) => ({ ...f, slug: slugify(`${form.brand}-${form.model}-${form.year}`) }));
    }
  }

  function addImage() {
    const url = newImage.trim();
    if (!url) return;
    setImages((arr) => [...arr, { url, alt_text: `${form.brand} ${form.model}` }]);
    setNewImage("");
  }

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded: ImageRow[] = [];
      for (const file of Array.from(files)) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
        const safeExt = ext.replace(/[^a-z0-9]/g, "") || "jpg";
        const path = `cars/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${safeExt}`;
        const { error } = await supabase.storage.from("car-images").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (error) throw error;
        const { data } = supabase.storage.from("car-images").getPublicUrl(path);
        uploaded.push({
          url: data.publicUrl,
          alt_text: `${form.brand} ${form.model}`.trim(),
        });
      }
      setImages((arr) => [...arr, ...uploaded]);
      toast.success(`Au fost încărcate ${uploaded.length} imagine(i).`);
    } catch (e: any) {
      toast.error(e?.message ?? "Nu am putut încărca imaginile.");
    } finally {
      setUploading(false);
    }
  }

  function move(idx: number, dir: -1 | 1) {
    setImages((arr) => {
      const next = [...arr];
      const t = next[idx + dir];
      if (!t) return arr;
      next[idx + dir] = next[idx];
      next[idx] = t;
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        slug: form.slug || slugify(`${form.brand}-${form.model}-${form.year}`),
        year: Number(form.year),
        price: Number(form.price),
        mileage: Number(form.mileage),
        engine_size: form.engine_size ? Number(form.engine_size) : null,
        power: form.power ? Number(form.power) : null,
        equipment: form.equipment.split(/\r?\n/).map((s) => s.trim()).filter(Boolean),
        autovit_url: form.autovit_url?.trim() || null,
        version: form.version || null,
        body_type: form.body_type || null,
        color: form.color || null,
        description: form.description || null,
        images: images.map((i) => ({ url: i.url, alt_text: i.alt_text || null })),
      };
      const res = await upsert({ data: { id: initial?.id, data: payload } });
      toast.success(initial ? "Mașină actualizată" : "Mașină adăugată");
      qc.invalidateQueries({ queryKey: ["admin", "cars"] });
      qc.invalidateQueries({ queryKey: ["cars"] });
      navigate({ to: "/admin/masini/$id/edit", params: { id: res.id! } });
    } catch (e: any) {
      toast.error(e?.message ?? "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <section className="surface-card p-6">
        <div className="font-display text-lg font-semibold">Informații de bază</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <F label="Marcă *"><input required value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} onBlur={autoSlug} className={inputCls} /></F>
          <F label="Model *"><input required value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })} onBlur={autoSlug} className={inputCls} /></F>
          <F label="Link Autovit"><input value={form.autovit_url ?? ""} onChange={(e) => setForm({ ...form, autovit_url: e.target.value })} placeholder="https://www.autovit.ro/..." className={inputCls} /></F>
          <F label="Versiune"><input value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} className={inputCls} /></F>
          <F label="An *"><input required type="number" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })} className={inputCls} /></F>
          <F label="Preț *"><input required type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} className={inputCls} /></F>
          <F label="Monedă"><select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} className={inputCls}><option>EUR</option><option>RON</option></select></F>
          <F label="Kilometraj *"><input required type="number" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })} className={inputCls} /></F>
          <F label="Slug (URL)"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="bmw-320d-2017" className={inputCls} /></F>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="font-display text-lg font-semibold">Specificații tehnice</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <F label="Combustibil"><select value={form.fuel_type} onChange={(e) => setForm({ ...form, fuel_type: e.target.value })} className={inputCls}>{FUEL_TYPES.map(o => <option key={o}>{o}</option>)}</select></F>
          <F label="Transmisie"><select value={form.transmission} onChange={(e) => setForm({ ...form, transmission: e.target.value })} className={inputCls}>{TRANSMISSIONS.map(o => <option key={o}>{o}</option>)}</select></F>
          <F label="Capacitate motor (cm³)"><input type="number" value={form.engine_size} onChange={(e) => setForm({ ...form, engine_size: Number(e.target.value) })} className={inputCls} /></F>
          <F label="Putere (CP)"><input type="number" value={form.power} onChange={(e) => setForm({ ...form, power: Number(e.target.value) })} className={inputCls} /></F>
          <F label="Caroserie"><select value={form.body_type ?? ""} onChange={(e) => setForm({ ...form, body_type: e.target.value })} className={inputCls}>{BODY_TYPES.map(o => <option key={o}>{o}</option>)}</select></F>
          <F label="Culoare"><input value={form.color ?? ""} onChange={(e) => setForm({ ...form, color: e.target.value })} className={inputCls} /></F>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="font-display text-lg font-semibold">Status & vizibilitate</div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <F label="Status"><select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputCls}>{STATUSES.map(s => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}</select></F>
          <label className="flex items-center gap-2 mt-6">
            <input type="checkbox" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} className="h-4 w-4" />
            <span className="text-sm">Mașină recomandată</span>
          </label>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="font-display text-lg font-semibold">Descriere & dotări</div>
        <div className="mt-4 grid gap-4">
          <F label="Descriere"><textarea rows={5} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} /></F>
          <F label="Dotări (una pe linie)"><textarea rows={5} value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="Climatronic&#10;Navigație&#10;Pilot automat" className={inputCls} /></F>
        </div>
      </section>

      <section className="surface-card p-6">
        <div className="font-display text-lg font-semibold">Imagini</div>
        <p className="mt-1 text-xs text-muted-foreground">Încarcă direct de pe dispozitiv (stocare Supabase) sau adaugă URL-uri externe. Prima imagine este cea principală.</p>
        <div className="mt-3">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm hover:bg-secondary">
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => uploadImages(e.target.files)}
            />
            {uploading ? "Se încarcă..." : "Încarcă din dispozitiv"}
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <input value={newImage} onChange={(e) => setNewImage(e.target.value)} placeholder="https://..." className={`${inputCls} flex-1`} />
          <button type="button" onClick={addImage} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm text-background">
            <Plus className="h-4 w-4" /> Adaugă
          </button>
        </div>
        <ul className="mt-4 space-y-2">
          {images.map((img, i) => (
            <li key={i} className="flex items-center gap-3 rounded-xl border border-border bg-card p-2">
              <div className="flex flex-col">
                <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="h-5 text-muted-foreground disabled:opacity-30">↑</button>
                <GripVertical className="h-3 w-3 text-muted-foreground" />
                <button type="button" onClick={() => move(i, 1)} disabled={i === images.length - 1} className="h-5 text-muted-foreground disabled:opacity-30">↓</button>
              </div>
              <div className="h-14 w-20 overflow-hidden rounded-md bg-muted flex-shrink-0">
                <img src={img.url} alt="" className="h-full w-full object-cover" onError={(e) => ((e.currentTarget.style.opacity = "0.3"))} />
              </div>
              <input value={img.url} onChange={(e) => setImages((arr) => arr.map((x, j) => j === i ? { ...x, url: e.target.value } : x))} className={`${inputCls} flex-1 text-xs`} />
              <button type="button" onClick={() => setImages((arr) => arr.filter((_, j) => j !== i))} className="rounded-lg border border-destructive/30 bg-destructive/5 p-2 text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
          {images.length === 0 && <li className="text-sm text-muted-foreground">Nicio imagine adăugată.</li>}
        </ul>
      </section>

      <div className="flex items-center justify-end gap-2">
        <button type="button" onClick={() => navigate({ to: "/admin/masini" })} className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm">Anulează</button>
        <button disabled={saving} type="submit" className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60">
          {saving ? "Se salvează..." : initial ? "Salvează modificările" : "Adaugă mașina"}
        </button>
      </div>
    </form>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm";
function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
