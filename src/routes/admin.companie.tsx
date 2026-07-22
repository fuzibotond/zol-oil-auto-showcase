import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { Save, CircleAlert, CircleCheck, CircleDashed } from "lucide-react";
import { toast } from "sonner";
import {
  adminSaveCompanyInfo,
  getCompanyInfo,
  VERIFIABLE_FIELDS,
} from "@/lib/api/company.functions";
import type { CompanyInfo } from "@/lib/types";

export const Route = createFileRoute("/admin/companie")({
  component: AdminCompanyPage,
});

const inputCls = "w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm";

type VerifiableField = (typeof VERIFIABLE_FIELDS)[number];

const CHECKLIST: { key: VerifiableField; label: string }[] = [
  { key: "legal_name", label: "Denumire legală (firmă)" },
  { key: "cui", label: "CUI / CIF" },
  { key: "reg_com", label: "Nr. Registrul Comerțului" },
  { key: "registered_address", label: "Sediu social" },
];

function AdminCompanyPage() {
  const fetchCompany = useServerFn(getCompanyInfo);
  const saveCompany = useServerFn(adminSaveCompanyInfo);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["company-info"],
    queryFn: () => fetchCompany(),
  });

  const [form, setForm] = useState<CompanyInfo | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm({ ...data, verified_fields: [...data.verified_fields] });
  }, [data]);

  function set<K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) {
    setForm((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  function toggleVerified(key: VerifiableField, checked: boolean) {
    setForm((prev) => {
      if (!prev) return prev;
      const withOut = prev.verified_fields.filter((f) => f !== key);
      return { ...prev, verified_fields: checked ? [...withOut, key] : withOut };
    });
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    try {
      await saveCompany({
        data: {
          ...form,
          verified_fields: form.verified_fields.filter((f): f is VerifiableField =>
            (VERIFIABLE_FIELDS as readonly string[]).includes(f),
          ),
        },
      });
      await qc.invalidateQueries({ queryKey: ["company-info"] });
      toast.success("Datele companiei au fost salvate");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Eroare la salvare");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading || !form) {
    return (
      <div className="p-6 md:p-10">
        <h1 className="font-display text-3xl font-bold tracking-tight">Date companie</h1>
        <p className="mt-2 text-sm text-muted-foreground">Se încarcă...</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Date oficiale companie</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Informațiile legale afișate public (footer, „Despre noi”, pagini legale). Completează doar
        date reale — câmpurile goale nu apar pe site.
      </p>

      {/* Legal checklist */}
      <div className="mt-6 surface-card p-5">
        <div className="font-display text-base font-semibold">Stare date legale</div>
        <ul className="mt-3 space-y-2">
          {CHECKLIST.map(({ key, label }) => {
            const value = (form[key] ?? "").trim();
            const verified = value && form.verified_fields.includes(key);
            return (
              <li key={key} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="inline-flex items-center gap-2">
                  {!value ? (
                    <CircleAlert className="h-4 w-4 text-destructive" />
                  ) : verified ? (
                    <CircleCheck className="h-4 w-4 text-accent" />
                  ) : (
                    <CircleDashed className="h-4 w-4 text-muted-foreground" />
                  )}
                  {label}
                  <span className="text-xs text-muted-foreground">
                    {!value ? "— lipsește" : verified ? "— verificat" : "— necesită verificare"}
                  </span>
                </span>
                <label
                  className={`inline-flex items-center gap-2 text-xs ${!value ? "opacity-40" : ""}`}
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4"
                    disabled={!value}
                    checked={Boolean(verified)}
                    onChange={(e) => toggleVerified(key, e.target.checked)}
                  />
                  Confirm că este corect
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      <form onSubmit={onSave} className="mt-6 space-y-6">
        <section className="surface-card p-6">
          <div className="font-display text-lg font-semibold">Identitate legală</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Nume comercial (public)">
              <input
                className={inputCls}
                value={form.trading_name}
                onChange={(e) => set("trading_name", e.target.value)}
                placeholder="Parc Auto ZOL-OIL"
              />
            </Field>
            <Field label="Denumire legală (firmă)">
              <input
                className={inputCls}
                value={form.legal_name}
                onChange={(e) => set("legal_name", e.target.value)}
                placeholder="EXEMPLU AUTO S.R.L."
              />
            </Field>
            <Field label="Formă juridică">
              <input
                className={inputCls}
                value={form.entity_type}
                onChange={(e) => set("entity_type", e.target.value)}
                placeholder="SRL / PFA / II"
              />
            </Field>
            <Field label="CUI / CIF">
              <input
                className={inputCls}
                value={form.cui}
                onChange={(e) => set("cui", e.target.value)}
                placeholder="RO12345678"
              />
            </Field>
            <Field label="Nr. Registrul Comerțului">
              <input
                className={inputCls}
                value={form.reg_com}
                onChange={(e) => set("reg_com", e.target.value)}
                placeholder="J14/123/2020"
              />
            </Field>
            <Field label="Statut TVA">
              <select
                className={inputCls}
                value={form.vat_status}
                onChange={(e) => set("vat_status", e.target.value)}
              >
                <option value="">Nespecificat</option>
                <option value="platitor_tva">Plătitor de TVA</option>
                <option value="neplatitor_tva">Neplătitor de TVA</option>
              </select>
            </Field>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="font-display text-lg font-semibold">Sedii & contact oficial</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Sediu social">
              <input
                className={inputCls}
                value={form.registered_address}
                onChange={(e) => set("registered_address", e.target.value)}
              />
            </Field>
            <Field label="Punct de lucru (parc auto)">
              <input
                className={inputCls}
                value={form.workpoint_address}
                onChange={(e) => set("workpoint_address", e.target.value)}
              />
            </Field>
            <Field label="Județ">
              <input
                className={inputCls}
                value={form.county}
                onChange={(e) => set("county", e.target.value)}
                placeholder="Covasna"
              />
            </Field>
            <Field label="Țară">
              <input
                className={inputCls}
                value={form.country}
                onChange={(e) => set("country", e.target.value)}
                placeholder="România"
              />
            </Field>
            <Field label="Telefon oficial">
              <input
                className={inputCls}
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </Field>
            <Field label="Email oficial">
              <input
                className={inputCls}
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
              />
            </Field>
            <Field label="Website">
              <input
                className={inputCls}
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
                placeholder="https://..."
              />
            </Field>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="font-display text-lg font-semibold">Protecția datelor & reclamații</div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Email protecția datelor (GDPR)">
              <input
                className={inputCls}
                type="email"
                value={form.dpo_email}
                onChange={(e) => set("dpo_email", e.target.value)}
              />
            </Field>
            <Field label="Informații reclamații clienți">
              <input
                className={inputCls}
                value={form.complaints_info}
                onChange={(e) => set("complaints_info", e.target.value)}
                placeholder="Cum pot clienții depune o reclamație"
              />
            </Field>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {saving ? "Se salvează..." : "Salvează datele"}
          </button>
        </div>
      </form>
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
