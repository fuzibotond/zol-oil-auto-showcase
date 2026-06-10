import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft } from "lucide-react";
import { adminGetCar } from "@/lib/api/cars.functions";
import { AdminCarForm } from "@/components/admin/AdminCarForm";

export const Route = createFileRoute("/admin/masini/$id/edit")({
  component: EditCarPage,
});

function EditCarPage() {
  const { id } = Route.useParams();
  const get = useServerFn(adminGetCar);
  const { data: car, isLoading } = useQuery({ queryKey: ["admin", "car", id], queryFn: () => get({ data: id }) });

  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Link to="/admin/masini" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Înapoi
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Editează mașina</h1>
      {isLoading ? <div className="mt-8 text-muted-foreground text-sm">Se încarcă...</div> : car ? (
        <div className="mt-6"><AdminCarForm initial={car} /></div>
      ) : <div className="mt-8 text-muted-foreground text-sm">Mașina nu a fost găsită.</div>}
    </div>
  );
}
