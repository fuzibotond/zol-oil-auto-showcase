import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { AdminCarForm } from "@/components/admin/AdminCarForm";

export const Route = createFileRoute("/admin/masini/nou")({
  component: NewCarPage,
});

function NewCarPage() {
  return (
    <div className="p-6 md:p-10 max-w-4xl">
      <Link to="/admin/masini" className="inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Înapoi
      </Link>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">Adaugă mașină nouă</h1>
      <p className="text-sm text-muted-foreground">Completează datele mașinii și apasă „Adaugă mașina".</p>
      <div className="mt-6">
        <AdminCarForm />
      </div>
    </div>
  );
}
