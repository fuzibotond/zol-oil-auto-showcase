import { useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { submitLead } from "@/lib/api/cars.functions";
import { trackLead } from "@/lib/analytics";
import { toast } from "sonner";

type Errors = Partial<Record<"name" | "phone" | "email", string>>;

/** Client-side checks mirroring the server schema, with Romanian messages. */
function validate(values: { name: string; phone: string; email: string }): Errors {
  const errors: Errors = {};
  if (values.name.trim().length < 2) errors.name = "Scrie-ți numele (minim 2 caractere).";
  const digits = values.phone.replace(/\D/g, "");
  if (digits.length < 9 || digits.length > 15)
    errors.phone = "Scrie un număr de telefon valid, de ex. 07xx xxx xxx.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Adresa de email nu pare corectă.";
  return errors;
}

export function LeadForm({
  carId,
  carTitle,
  source = "website",
  heading = "Trimite o întrebare",
  defaultMessage,
}: {
  carId?: string;
  carTitle?: string;
  source?: string;
  heading?: string;
  /** Message sent when the visitor leaves the field empty. */
  defaultMessage?: string;
}) {
  const submit = useServerFn(submitLead);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const uid = useId();
  const fallbackMessage = defaultMessage ?? (carTitle ? `Sunt interesat de ${carTitle}` : "");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const values = {
      name: String(fd.get("name") ?? ""),
      phone: String(fd.get("phone") ?? ""),
      email: String(fd.get("email") ?? ""),
    };
    const found = validate(values);
    setErrors(found);
    setFormError(null);
    const firstInvalid = (["name", "phone", "email"] as const).find((k) => found[k]);
    if (firstInvalid) {
      formRef.current?.querySelector<HTMLInputElement>(`[name="${firstInvalid}"]`)?.focus();
      return;
    }

    setLoading(true);
    try {
      await submit({
        data: {
          car_id: carId ?? null,
          name: values.name,
          phone: values.phone,
          email: values.email,
          message: String(fd.get("message") ?? "") || fallbackMessage,
          source,
          honeypot: String(fd.get("honeypot") ?? ""),
        },
      });
      setSent(true);
      // Fired only after the server accepted the lead (no PII in the event).
      trackLead(source, carId ?? null);
      toast.success("Mesaj trimis! Te contactăm în scurt timp.");
    } catch {
      // Server validation errors arrive as raw JSON — never show those verbatim.
      const msg = "Mesajul nu a putut fi trimis. Încearcă din nou sau sună-ne direct.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="surface-card p-6 text-center" role="status">
        <div className="font-display text-lg font-semibold">Mulțumim!</div>
        <p className="mt-1 text-sm text-muted-foreground">
          Mesajul tău a fost trimis. Te vom contacta în scurt timp.
        </p>
      </div>
    );
  }

  const headingId = `${uid}-heading`;
  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      noValidate
      aria-labelledby={headingId}
      className="surface-card p-6 space-y-3"
    >
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
      <h2 id={headingId} className="font-display text-lg font-semibold">
        {heading}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field
          id={`${uid}-name`}
          name="name"
          label="Nume"
          required
          maxLength={80}
          autoComplete="name"
          error={errors.name}
        />
        <Field
          id={`${uid}-phone`}
          name="phone"
          label="Telefon"
          type="tel"
          inputMode="tel"
          required
          maxLength={30}
          autoComplete="tel"
          error={errors.phone}
        />
      </div>
      <Field
        id={`${uid}-email`}
        name="email"
        label="Email (opțional)"
        type="email"
        maxLength={120}
        autoComplete="email"
        error={errors.email}
      />
      <div>
        <label
          htmlFor={`${uid}-message`}
          className="block text-xs font-medium text-muted-foreground mb-1"
        >
          Mesaj
        </label>
        <textarea
          id={`${uid}-message`}
          name="message"
          rows={3}
          maxLength={1000}
          placeholder={fallbackMessage || "Sunt interesat de o mașină..."}
          className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        />
      </div>
      {formError && (
        <p role="alert" className="text-sm text-destructive">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
      >
        {loading ? "Se trimite..." : "Trimite mesajul"}
      </button>
      <p className="text-[11px] text-muted-foreground text-center">
        Prin trimiterea formularului, datele furnizate vor fi utilizate pentru a răspunde
        solicitării dumneavoastră, conform{" "}
        <Link to="/confidentialitate" className="underline hover:text-foreground">
          Politicii de confidențialitate
        </Link>
        .
      </p>
    </form>
  );
}

function Field({
  id,
  name,
  label,
  type = "text",
  required,
  maxLength,
  autoComplete,
  inputMode,
  error,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  error?: string;
}) {
  const errorId = `${id}-error`;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-medium text-muted-foreground mb-1">
        {label}
        {required && (
          <>
            <span aria-hidden> *</span>
            <span className="sr-only"> (obligatoriu)</span>
          </>
        )}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring/40 ${
          error ? "border-destructive" : "border-input"
        }`}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
