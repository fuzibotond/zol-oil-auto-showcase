import { createFileRoute, Outlet, Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { checkIsAdmin } from "@/lib/api/cars.functions";
import { Car, Users, LogOut, ShieldAlert, LayoutDashboard, Plus, Settings } from "lucide-react";

// Access to /admin* is gated at the edge by Cloudflare Access (Zero Trust).
// `checkIsAdmin` re-verifies the Access JWT server-side, so the UI reflects the
// real authorization result rather than trusting the client.
export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminLayout,
});

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const check = useServerFn(checkIsAdmin);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    check().then(setIsAdmin).catch(() => setIsAdmin(false));
  }, [check]);

  function signOut() {
    // Clears the Cloudflare Access session for this browser.
    window.location.href = "/cdn-cgi/access/logout";
  }

  if (isAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">Se verifică accesul...</div>;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        <ShieldAlert className="h-10 w-10 text-destructive" />
        <h1 className="mt-3 font-display text-2xl font-bold">Acces refuzat</h1>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Acest cont nu are drept de administrator. Autentifică-te cu un cont autorizat prin Cloudflare Access sau contactează proprietarul.
        </p>
        <div className="mt-6 flex gap-2">
          <button onClick={signOut} className="rounded-xl border border-border bg-card px-4 py-2 text-sm">Schimbă contul</button>
          <Link to="/" className="rounded-xl bg-foreground px-4 py-2 text-sm text-background">Înapoi acasă</Link>
        </div>
      </div>
    );
  }

  const navItems = [
    { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard, exact: true },
    { to: "/admin/masini" as const, label: "Mașini", icon: Car },
    { to: "/admin/leaduri" as const, label: "Leaduri", icon: Users },
    { to: "/admin/setari" as const, label: "Setări", icon: Settings },
  ];

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-[260px_1fr] bg-secondary/40">
      <aside className="md:sticky md:top-0 md:h-screen border-b md:border-b-0 md:border-r border-border bg-background flex md:flex-col">
        <div className="px-6 py-5 border-b border-border w-full">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-display text-sm font-bold">Z</div>
            <div className="leading-tight">
              <div className="font-display text-sm font-semibold">ZOL-OIL Admin</div>
              <div className="text-[11px] text-muted-foreground">Panou control</div>
            </div>
          </Link>
        </div>
        <nav className="p-3 flex md:flex-col gap-1 flex-1">
          {navItems.map((n) => {
            const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm ${active ? "bg-foreground text-background" : "hover:bg-secondary text-foreground"}`}>
                <n.icon className="h-4 w-4" /> <span className="hidden md:inline">{n.label}</span>
              </Link>
            );
          })}
          <Link to="/admin/masini/nou" className="hidden md:inline-flex mt-2 items-center gap-2 rounded-xl border border-dashed border-border px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Plus className="h-4 w-4" /> Mașină nouă
          </Link>
        </nav>
        <div className="hidden md:block p-3 border-t border-border">
          <button onClick={signOut} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm hover:bg-secondary">
            <LogOut className="h-4 w-4" /> Deconectare
          </button>
        </div>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
