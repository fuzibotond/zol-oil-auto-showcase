import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  X,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { adminListCars, adminDeleteCar } from "@/lib/api/cars.functions";
import { fmtPrice, fmtKm, fmtDate, isRecent } from "@/lib/format";
import { StatusBadge } from "@/components/site/StatusBadge";
import { STATUS_LABEL } from "@/lib/site";
import type { Car } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/masini/")({
  component: AdminCarsPage,
});

type SortKey = "car" | "year" | "mileage" | "price" | "created_at" | "status";
type SortDir = "asc" | "desc";

const PAGE_SIZE = 15;

function compare(a: Car, b: Car, key: SortKey): number {
  switch (key) {
    case "car":
      return `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`, "ro");
    case "year":
      return a.year - b.year;
    case "mileage":
      return a.mileage - b.mileage;
    case "price":
      return a.price - b.price;
    case "created_at":
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    case "status":
      return (STATUS_LABEL[a.status] ?? a.status).localeCompare(
        STATUS_LABEL[b.status] ?? b.status,
        "ro",
      );
  }
}

function AdminCarsPage() {
  const listCars = useServerFn(adminListCars);
  const del = useServerFn(adminDeleteCar);
  const qc = useQueryClient();
  const { data: cars = [], isLoading } = useQuery({
    queryKey: ["admin", "cars"],
    queryFn: () => listCars(),
  });

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);

  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // Text columns read best ascending; numeric/date default to descending.
      setSortDir(key === "car" || key === "status" ? "asc" : "desc");
    }
    setPage(1);
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return cars;
    return cars.filter((c) => `${c.brand} ${c.model} ${c.version ?? ""}`.toLowerCase().includes(q));
  }, [cars, query]);

  const sorted = useMemo(() => {
    const dir = sortDir === "asc" ? 1 : -1;
    return [...filtered].sort((a, b) => compare(a, b, sortKey) * dir);
  }, [filtered, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * PAGE_SIZE;
  const pageRows = sorted.slice(start, start + PAGE_SIZE);

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
          <p className="text-sm text-muted-foreground mt-1">
            {query.trim()
              ? `${filtered.length} din ${cars.length} mașini`
              : `${cars.length} mașini în total`}
          </p>
        </div>
        <Link
          to="/admin/masini/nou"
          className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-sm text-background"
        >
          <Plus className="h-4 w-4" /> Adaugă mașină
        </Link>
      </div>

      <div className="relative mt-5 max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
          placeholder="Caută după marcă, model sau versiune..."
          aria-label="Caută mașini"
          className="w-full rounded-xl border border-input bg-background pl-9 pr-9 py-2.5 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setPage(1);
            }}
            aria-label="Șterge căutarea"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-6 surface-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary/60">
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <SortTh
                  label="Mașină"
                  col="car"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="An"
                  col="year"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="KM"
                  col="mileage"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="Preț"
                  col="price"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="Adăugat"
                  col="created_at"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <SortTh
                  label="Status"
                  col="status"
                  sortKey={sortKey}
                  sortDir={sortDir}
                  onSort={toggleSort}
                />
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Se încarcă...
                  </td>
                </tr>
              ) : cars.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nicio mașină.{" "}
                    <Link to="/admin/masini/nou" className="text-accent">
                      Adaugă prima
                    </Link>
                    .
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Nicio mașină nu corespunde căutării „{query.trim()}".
                  </td>
                </tr>
              ) : (
                pageRows.map((c) => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-14 overflow-hidden rounded-md bg-muted">
                          {c.images?.[0]?.url && (
                            <img
                              src={c.images[0].url}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {c.brand} {c.model}
                            </span>
                            {isRecent(c.created_at) && (
                              <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
                                Nou
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {c.version ?? "—"}
                            {c.is_featured ? " · Recomandat" : ""}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{c.year}</td>
                    <td className="px-4 py-3">{fmtKm(c.mileage)}</td>
                    <td className="px-4 py-3 font-medium">{fmtPrice(c.price, c.currency)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {fmtDate(c.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Link
                          to="/admin/masini/$id/edit"
                          params={{ id: c.id }}
                          className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-secondary"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Editează
                        </Link>
                        <button
                          onClick={() => onDelete(c.id, `${c.brand} ${c.model}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 px-2.5 py-1.5 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Șterge
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!isLoading && sorted.length > 0 && (
          <div className="flex items-center justify-between gap-4 border-t border-border px-4 py-3 text-sm">
            <div className="text-muted-foreground">
              {start + 1}–{Math.min(start + PAGE_SIZE, sorted.length)} din {sorted.length}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage(current - 1)}
                disabled={current <= 1}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-secondary disabled:opacity-40 disabled:hover:bg-card"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Anterior
              </button>
              <span className="text-xs text-muted-foreground">
                Pagina {current} / {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage(current + 1)}
                disabled={current >= pageCount}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs hover:bg-secondary disabled:opacity-40 disabled:hover:bg-card"
              >
                Următor <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SortTh({
  label,
  col,
  sortKey,
  sortDir,
  onSort,
}: {
  label: string;
  col: SortKey;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === col;
  return (
    <th
      className="px-4 py-3"
      aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(col)}
        className={`group inline-flex items-center gap-1 uppercase transition-colors hover:text-foreground ${
          active ? "text-foreground" : ""
        }`}
      >
        {label}
        {active ? (
          sortDir === "asc" ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )
        ) : (
          <ChevronsUpDown className="h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-50" />
        )}
      </button>
    </th>
  );
}
