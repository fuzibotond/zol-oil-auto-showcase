import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminListCars, adminDeleteCar } from "@/lib/api/cars.functions";
import { fmtPrice, fmtKm } from "@/lib/format";
import { StatusBadge } from "@/components/site/StatusBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/masini/")({
  component: AdminCarsPage,
});

function AdminCarsPage() {
  const listCars = useServerFn(adminListCars);
  const del = useServerFn(adminDeleteCar);
  const qc = useQueryClient();
  const { data: cars = [], isLoading } = useQuery({ queryKey: ["admin", "cars"], queryFn: () => listCars() });

  async function onDelete(id: string, name: string) {
    if (!confirm(`Ștergi ${name}? Acțiunea este definitivă.`)) return;
    try {
      await del({ data: id });
      toast.success("Mașină ștearsă");
      qc.invalidateQueries({ queryKey: ["admin", "cars"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Eroare la ștergere");
    }
  }

  return (
    <div className="p-6 md:p-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Mașini</h1>
          <p className="text-sm text-muted-foreground mt-1">{cars.length} mașini în total</p>
        </div>
        <Link to="/admin/masini/nou" className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm text-background">
          <Plus className="h-4 w-4" /> Adaugă mașină
        </Link>
      </div>

      <div className="mt-6 surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Mașină</th>
                <th className="px-4 py-3">An</th>
                <th className="px-4 py-3">KM</th>
                <th className="px-4 py-3">Preț</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Se încarcă...</td></tr>
              ) : cars.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nicio mașină. <Link to="/admin/masini/nou" className="text-accent">Adaugă prima</Link>.</td></tr>
              ) : cars.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-14 overflow-hidden rounded-md bg-muted">
                        {c.images?.[0]?.url && <img src={c.images[0].url} alt="" className="h-full w-full object-cover" />}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{c.brand} {c.model}</div>
                        <div className="text-xs text-muted-foreground truncate">{c.version ?? "—"}{c.is_featured ? " · Recomandat" : ""}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{c.year}</td>
                  <td className="px-4 py-3">{fmtKm(c.mileage)}</td>
                  <td className="px-4 py-3 font-medium">{fmtPrice(c.price, c.currency)}</td>
                  <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link to="/admin/masini/$id/edit" params={{ id: c.id }} className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-secondary">
                        <Pencil className="h-3.5 w-3.5" /> Editează
                      </Link>
                      <button onClick={() => onDelete(c.id, `${c.brand} ${c.model}`)} className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-3.5 w-3.5" /> Șterge
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
