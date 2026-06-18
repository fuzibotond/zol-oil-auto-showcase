import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  adminUpdateSiteSettings,
  getSiteSettings,
} from "@/lib/api/site-settings.functions";
import {
  SOCIAL_PLATFORM_META,
  type SiteOpeningHour,
  type SiteSettingsInput,
} from "@/lib/site";

export const Route = createFileRoute("/admin/setari")({
  component: AdminSettingsPage,
});

function AdminSettingsPage() {
  const fetchSettings = useServerFn(getSiteSettings);
  const updateSettings = useServerFn(adminUpdateSiteSettings);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["site-settings"],
    queryFn: () => fetchSettings(),
  });

  const [form, setForm] = useState<SiteSettingsInput | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    setForm({
      ...data,
      opening_hours: data.opening_hours.map((h) => ({ ...h })),
      social_links: data.social_links.map((s) => ({ ...s })),
    });
  }, [data]);

  function updateHour(index: number, patch: Partial<SiteOpeningHour>) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        opening_hours: prev.opening_hours.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      };
    });
  }

  function addHour() {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        opening_hours: [...prev.opening_hours, { day: "", value: "" }],
      };
    });
  }

  function removeHour(index: number) {
    setForm((prev) => {
      if (!prev) return prev;
      const next = prev.opening_hours.filter((_, i) => i !== index);
      return {
        ...prev,
        opening_hours: next.length ? next : [{ day: "", value: "" }],
      };
    });
  }

  function updateSocial(index: number, patch: Partial<SiteSettingsInput["social_links"][number]>) {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        social_links: prev.social_links.map((item, i) => (i === index ? { ...item, ...patch } : item)),
      };
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);

    try {
      const payload: SiteSettingsInput = {
        ...form,
        contact_email: form.contact_email.trim(),
        phone: form.phone.trim(),
        phone_display: form.phone_display.trim(),
        whatsapp: form.whatsapp.trim(),
        opening_hours: form.opening_hours
          .map((h) => ({ day: h.day.trim(), value: h.value.trim() }))
          .filter((h) => h.day && h.value),
        social_links: form.social_links.map((s) => ({ ...s, url: s.url.trim() })),
      };

      await updateSettings({ data: payload });
      await qc.invalidateQueries({ queryKey: ["site-settings"] });
      toast.success("Setările au fost salvate");
    } catch (error: any) {
      toast.error(error?.message ?? "Nu am putut salva setările");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Setări site</h1>
        <p className="mt-2 text-sm text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Setări site</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Actualizează rapid datele de contact, programul și link-urile social media fără modificări în cod.
      </p>

      <form onSubmit={onSave} className="mt-8 space-y-6">
        <section className="surface-card p-6">
          <div className="font-display text-lg font-semibold">Contact</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Email contact *">
              <input
                required
                type="email"
                className={inputCls}
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </Field>
            <Field label="Telefon (link) *">
              <input
                required
                className={inputCls}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+40 700 000 000"
              />
            </Field>
            <Field label="Telefon afișat *">
              <input
                required
                className={inputCls}
                value={form.phone_display}
                onChange={(e) => setForm({ ...form, phone_display: e.target.value })}
                placeholder="0700 000 000"
              />
            </Field>
            <Field label="WhatsApp (număr fără +) *">
              <input
                required
                className={inputCls}
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                placeholder="40700000000"
              />
            </Field>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-display text-lg font-semibold">Program</div>
              <p className="mt-1 text-xs text-muted-foreground">Exemplu: Luni - Vineri / 09:00 - 18:00</p>
            </div>
            <button type="button" onClick={addHour} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
              <Plus className="h-4 w-4" /> Interval
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {form.opening_hours.map((hour, index) => (
              <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <input
                  className={inputCls}
                  placeholder="Zi"
                  value={hour.day}
                  onChange={(e) => updateHour(index, { day: e.target.value })}
                />
                <input
                  className={inputCls}
                  placeholder="Interval"
                  value={hour.value}
                  onChange={(e) => updateHour(index, { value: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => removeHour(index)}
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 px-3 text-destructive"
                  aria-label="Șterge interval"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="font-display text-lg font-semibold">Social media</div>
          <p className="mt-1 text-xs text-muted-foreground">
            Activează platformele pe care vrei să le afișezi pe site și completează link-urile lor.
          </p>

          <div className="mt-4 space-y-3">
            {form.social_links.map((social, index) => (
              <div key={social.key} className="grid items-center gap-3 rounded-xl border border-border p-3 sm:grid-cols-[170px_1fr_auto]">
                <div className="flex items-center justify-between gap-2 sm:block">
                  <div className="text-sm font-medium">{SOCIAL_PLATFORM_META[social.key].label}</div>
                  <div className="text-xs text-muted-foreground sm:mt-0.5">Afișează pe site</div>
                </div>
                <input
                  className={`${inputCls} ${!social.enabled ? "opacity-60" : ""}`}
                  value={social.url}
                  onChange={(e) => updateSocial(index, { url: e.target.value })}
                  placeholder="https://..."
                  disabled={!social.enabled}
                />
                <Switch
                  checked={social.enabled}
                  onCheckedChange={(checked) => updateSocial(index, { enabled: checked })}
                  aria-label={`Activează ${social.label}`}
                />
              </div>
            ))}
          </div>
        </section>

        <div className="flex justify-end">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60">
            <Save className="h-4 w-4" /> {saving ? "Se salvează..." : "Salvează setările"}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
