import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Car, Users, Plus, ArrowRight } from "lucide-react";
import { adminListCars, adminListLeads } from "@/lib/api/cars.functions";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

function AdminDashboard() {
  const listCars = useServerFn(adminListCars);
  const listLeads = useServerFn(adminListLeads);
  const { data: cars = [] } = useQuery({ queryKey: ["admin", "cars"], queryFn: () => listCars() });
  const { data: leads = [] } = useQuery({ queryKey: ["admin", "leads"], queryFn: () => listLeads() });

  const newLeads = leads.filter((l) => l.status === "nou").length;
  const featured = cars.filter((c) => c.is_featured).length;
  const available = cars.filter((c) => c.status === "disponibil").length;

  return (
    <div className="p-6 md:p-10 space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">Sumar parc auto și activitate.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total mașini" value={cars.length} icon={<Car className="h-4 w-4" />} />
        <Stat label="Disponibile" value={available} icon={<Car className="h-4 w-4" />} />
        <Stat label="Recomandate" value={featured} icon={<Car className="h-4 w-4" />} />
        <Stat label="Leaduri noi" value={newLeads} icon={<Users className="h-4 w-4" />} highlight={newLeads > 0} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-semibold">Mașini recente</div>
            <Link to="/admin/masini" className="text-sm text-muted-foreground inline-flex items-center gap-1">Vezi tot <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {cars.slice(0, 5).map((c) => (
              <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{c.brand} {c.model}</div>
                  <div className="text-xs text-muted-foreground">{c.year} · {c.status}</div>
                </div>
                <Link to="/admin/masini/$id/edit" params={{ id: c.id }} className="text-sm text-accent">Editează</Link>
              </li>
            ))}
            {cars.length === 0 && <li className="py-3 text-sm text-muted-foreground">Nicio mașină. <Link to="/admin/masini/nou" className="text-accent">Adaugă prima</Link>.</li>}
          </ul>
        </div>

        <div className="surface-card p-6">
          <div className="flex items-center justify-between">
            <div className="font-display text-lg font-semibold">Leaduri recente</div>
            <Link to="/admin/leaduri" className="text-sm text-muted-foreground inline-flex items-center gap-1">Vezi tot <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {leads.slice(0, 5).map((l) => (
              <li key={l.id} className="py-3">
                <div className="flex justify-between gap-2">
                  <div className="font-medium">{l.name}</div>
                  <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleDateString("ro-RO")}</div>
                </div>
                <div className="text-xs text-muted-foreground">{l.phone}{l.car ? ` · ${l.car.brand} ${l.car.model}` : ""}</div>
              </li>
            ))}
            {leads.length === 0 && <li className="py-3 text-sm text-muted-foreground">Niciun lead încă.</li>}
          </ul>
        </div>
      </div>

      <Link to="/admin/masini/nou" className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm text-background">
        <Plus className="h-4 w-4" /> Adaugă mașină nouă
      </Link>
    </div>
  );
}

function Stat({ label, value, icon, highlight }: { label: string; value: number; icon: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={`surface-card p-5 ${highlight ? "ring-2 ring-accent" : ""}`}>
      <div className="text-xs text-muted-foreground inline-flex items-center gap-1.5">{icon}{label}</div>
      <div className="mt-2 font-display text-3xl font-bold">{value}</div>
    </div>
  );
}
