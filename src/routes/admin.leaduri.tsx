import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { adminListLeads, adminUpdateLeadStatus } from "@/lib/api/cars.functions";
import { Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const STATUS_LABELS: Record<string, string> = { nou: "Nou", contactat: "Contactat", inchis: "Închis" };
const STATUS_TONE: Record<string, string> = {
  nou: "bg-accent/15 text-accent border-accent/30",
  contactat: "bg-warning/20 text-warning-foreground border-warning/40",
  inchis: "bg-muted text-muted-foreground border-border",
};

export const Route = createFileRoute("/admin/leaduri")({
  component: LeadsPage,
});

function LeadsPage() {
  const list = useServerFn(adminListLeads);
  const update = useServerFn(adminUpdateLeadStatus);
  const qc = useQueryClient();
  const { data: leads = [], isLoading, isError, error } = useQuery({ queryKey: ["admin", "leads"], queryFn: () => list() });

  async function setStatus(id: string, status: "nou" | "contactat" | "inchis") {
    try {
      await update({ data: { id, status } });
      toast.success("Status actualizat");
      qc.invalidateQueries({ queryKey: ["admin", "leads"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Eroare");
    }
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="font-display text-3xl font-bold tracking-tight">Leaduri</h1>
      <p className="text-sm text-muted-foreground mt-1">{leads.length} mesaje totale</p>

      <div className="mt-6 grid gap-4">
        {isLoading ? <div className="text-sm text-muted-foreground">Se încarcă...</div>
          : isError ? (
            <div className="surface-card p-6 border border-destructive/40 rounded-xl">
              <p className="text-sm font-medium text-destructive">Eroare la încărcarea leadurilor</p>
              <p className="mt-1 text-xs text-muted-foreground font-mono">{(error as Error)?.message ?? "Eroare necunoscută"}</p>
              <p className="mt-2 text-xs text-muted-foreground">Verifică că variabilele de mediu <code>SUPABASE_URL</code> și <code>SUPABASE_PUBLISHABLE_KEY</code> sunt setate corect.</p>
            </div>
          )
          : leads.length === 0 ? <div className="surface-card p-8 text-center text-muted-foreground text-sm">Niciun lead încă.</div>
          : leads.map((l) => (
            <div key={l.id} className="surface-card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="font-display text-lg font-semibold">{l.name}</div>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_TONE[l.status]}`}>{STATUS_LABELS[l.status]}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <a href={`tel:${l.phone}`} className="inline-flex items-center gap-1 hover:text-foreground"><Phone className="h-3.5 w-3.5" /> {l.phone}</a>
                    {l.email && <a href={`mailto:${l.email}`} className="inline-flex items-center gap-1 hover:text-foreground"><Mail className="h-3.5 w-3.5" /> {l.email}</a>}
                    <span>{new Date(l.created_at).toLocaleString("ro-RO")}</span>
                  </div>
                  {l.car && (
                    <Link to="/masini/$slug" params={{ slug: l.car.slug }} className="mt-2 inline-block text-sm text-accent hover:underline">
                      {l.car.brand} {l.car.model} {l.car.year}
                    </Link>
                  )}
                  {l.message && <p className="mt-3 text-sm whitespace-pre-line text-foreground/90">{l.message}</p>}
                </div>
                <div className="flex gap-2">
                  {(["nou", "contactat", "inchis"] as const).map((s) => (
                    <button key={s} onClick={() => setStatus(l.id, s)} disabled={l.status === s} className={`rounded-lg border border-border bg-card px-3 py-1.5 text-xs ${l.status === s ? "opacity-50" : "hover:bg-secondary"}`}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
