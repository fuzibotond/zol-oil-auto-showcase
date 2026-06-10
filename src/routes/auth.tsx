import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

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
  const navigate = useNavigate();
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bine ai venit!");
        await router.invalidate();
        navigate({ to: "/admin" });
      } else {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("Cont creat. Un admin trebuie să-ți atribuie rolul de administrator.");
      }
    } catch (err: any) {
      toast.error(err?.message ?? "Eroare la autentificare");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-secondary">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Înapoi la site
      </Link>
      <div className="w-full max-w-md surface-card p-8">
        <div className="font-display text-2xl font-bold">Admin ZOL-OIL</div>
        <p className="mt-1 text-sm text-muted-foreground">Autentificare pentru gestionarea mașinilor și leadurilor.</p>

        <form onSubmit={onSubmit} className="mt-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Parolă</label>
            <input required minLength={6} type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm" />
          </div>
          <button disabled={loading} type="submit" className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-60">
            {loading ? "..." : mode === "login" ? "Autentifică-te" : "Creează cont"}
          </button>
        </form>

        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 w-full text-sm text-muted-foreground hover:text-foreground">
          {mode === "login" ? "Nu ai cont? Creează unul" : "Ai deja cont? Autentifică-te"}
        </button>
      </div>
      <p className="mt-4 max-w-md text-center text-xs text-muted-foreground">
        Doar conturile cu rol de administrator au acces la panoul de control. Contactează proprietarul pentru atribuirea rolului.
      </p>
    </div>
  );
}
