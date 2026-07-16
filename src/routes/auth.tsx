import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ShieldCheck } from "lucide-react";

// Admin sign-in is handled entirely by Cloudflare Access (Zero Trust). Visiting
// /admin triggers the Access login flow at the edge; there is no application
// password form. This page only explains that and links onward.
export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Autentificare admin · ZOL-OIL" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-secondary">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Înapoi la site
      </Link>
      <div className="w-full max-w-md surface-card p-8 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-foreground" />
        <div className="mt-3 font-display text-2xl font-bold">Admin ZOL-OIL</div>
        <p className="mt-2 text-sm text-muted-foreground">
          Accesul la panoul de administrare este protejat prin Cloudflare Access.
          Autentificarea se face automat cu contul tău autorizat.
        </p>
        <Link
          to="/admin"
          className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background"
        >
          Continuă spre panou
        </Link>
      </div>
      <p className="mt-4 max-w-md text-center text-xs text-muted-foreground">
        Doar conturile autorizate în politica Cloudflare Access pot accesa panoul. Contactează proprietarul pentru acordarea accesului.
      </p>
    </div>
  );
}
