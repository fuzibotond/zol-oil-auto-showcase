import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/api/cars.functions";
import { toast } from "sonner";

export function LeadForm({ carId, carTitle }: { carId?: string; carTitle?: string }) {
  const submit = useServerFn(submitLead);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setLoading(true);
    try {
      await submit({
        data: {
          car_id: carId ?? null,
          name: String(fd.get("name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          email: String(fd.get("email") ?? ""),
          message: String(fd.get("message") ?? "") || (carTitle ? `Sunt interesat de ${carTitle}` : ""),
          honeypot: String(fd.get("honeypot") ?? ""),
        },
      });
      setSent(true);
      toast.success("Mesaj trimis! Te contactăm în scurt timp.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      // Show Zod validation messages (e.g. invalid phone) verbatim; fall back to generic text
      const userMsg = msg && msg.length < 200 ? msg : "A apărut o eroare. Încearcă din nou sau sună-ne direct.";
      toast.error(userMsg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="surface-card p-6 text-center">
        <div className="font-display text-lg font-semibold">Mulțumim!</div>
        <p className="mt-1 text-sm text-muted-foreground">Mesajul tău a fost trimis. Te vom contacta în scurt timp.</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface-card p-6 space-y-3">
      {/* Honeypot — hidden from humans; bots fill it and are silently discarded server-side */}
      <input
        type="text"
        name="honeypot"
        defaultValue=""
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0 }}
      />
      <div className="font-display text-lg font-semibold">Trimite o întrebare</div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field name="name" label="Nume" required maxLength={80} />
        <Field name="phone" label="Telefon" type="tel" required maxLength={30} />
      </div>
      <Field name="email" label="Email (opțional)" type="email" maxLength={120} />
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-1">Mesaj</label>
        <textarea
          name="message"
          rows={3}
          maxLength={1000}
          placeholder={carTitle ? `Sunt interesat de ${carTitle}` : "Sunt interesat de o mașină..."}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Se trimite..." : "Trimite mesajul"}
      </button>
      <p className="text-[11px] text-muted-foreground text-center">
        Apăsând „Trimite mesajul" ești de acord să te contactăm referitor la mașina solicitată.
      </p>
    </form>
  );
}

function Field({ name, label, type = "text", required, maxLength }: { name: string; label: string; type?: string; required?: boolean; maxLength?: number }) {
  return (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}{required && " *"}</label>
      <input
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
      />
    </div>
  );
}
