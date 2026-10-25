// Server-only new-lead email notification via Cloudflare Email Routing (free).
//
// Pages Functions cannot hold a `send_email` binding, so the email is sent by
// the tiny `zol-oil-mailer` Worker (workers/mailer), reached over the MAILER
// service binding. Email Routing delivers ONLY to verified destination
// addresses (Cloudflare → Email Routing → Destination addresses).
//
// Runs AFTER the response via waitUntil and never throws: every attempt is
// recorded in the `lead_notifications` table as sent / failed / skipped.
//
// Env: MAILER (service binding), NOTIFY_EMAIL (comma-separated recipients),
//      NOTIFY_FROM (optional sender on zoloil.ro), VITE_SITE_URL (for links).

import { getCloudflareEnv, getEnvVar } from "@/lib/db/env";

export interface LeadNotification {
  leadId: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string | null;
  carId: string | null;
}

interface Fetcher {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

const DEFAULT_FROM = "notificari@zoloil.ro";
const DEFAULT_SITE_URL = "https://zoloil.ro";

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseRecipients(raw: string | undefined): string[] {
  return (raw ?? "")
    .split(/[,;\s]+/)
    .map((s) => s.trim())
    .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s));
}

async function carLabel(carId: string | null, siteUrl: string) {
  if (!carId) return null;
  try {
    const repo = await import("@/lib/db/repository");
    const car = await repo.getCarById(carId);
    if (!car) return null;
    return {
      title: `${car.brand} ${car.model} (${car.year})`,
      url: `${siteUrl}/masini/${car.slug}`,
    };
  } catch {
    return null;
  }
}

async function buildEmail(lead: LeadNotification) {
  const siteUrl = (getEnvVar("VITE_SITE_URL") || DEFAULT_SITE_URL).replace(/\/$/, "");
  const car = await carLabel(lead.carId, siteUrl);
  const date = new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" });

  const subject = car
    ? `Lead nou: ${lead.name} – ${lead.phone} – ${car.title}`
    : `Lead nou: ${lead.name} – ${lead.phone}`;

  const html = `
<h2>Lead nou – Parc Auto ZOL-OIL</h2>
<p><strong>Nume:</strong> ${escHtml(lead.name)}</p>
<p><strong>Telefon:</strong> <a href="tel:${escHtml(lead.phone)}">${escHtml(lead.phone)}</a></p>
${lead.email ? `<p><strong>Email:</strong> <a href="mailto:${escHtml(lead.email)}">${escHtml(lead.email)}</a></p>` : ""}
${car ? `<p><strong>Mașină:</strong> <a href="${escHtml(car.url)}">${escHtml(car.title)}</a></p>` : ""}
${lead.message ? `<p><strong>Mesaj:</strong><br />${escHtml(lead.message).replace(/\n/g, "<br />")}</p>` : ""}
<p><strong>Sursă:</strong> ${escHtml(lead.source || "website")}</p>
<p><strong>Data:</strong> ${date}</p>
<hr /><p><a href="${siteUrl}/admin/leaduri">Deschide panoul admin → Leaduri</a></p>
`.trim();

  const text = [
    "Lead nou – Parc Auto ZOL-OIL",
    `Nume: ${lead.name}`,
    `Telefon: ${lead.phone}`,
    lead.email ? `Email: ${lead.email}` : null,
    car ? `Mașină: ${car.title} – ${car.url}` : null,
    lead.message ? `Mesaj: ${lead.message}` : null,
    `Sursă: ${lead.source || "website"}`,
    `Data: ${date}`,
    "",
    `Admin: ${siteUrl}/admin/leaduri`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return { subject, html, text };
}

async function log(
  entry: Parameters<typeof import("@/lib/db/repository").insertLeadNotification>[0],
) {
  console.log("[notify]", entry.status, entry.lead_id, entry.error ?? entry.message_id ?? "");
  try {
    const repo = await import("@/lib/db/repository");
    await repo.insertLeadNotification(entry);
  } catch (e) {
    console.error("[notify] could not write lead_notifications row:", e);
  }
}

/** Sends the new-lead email and logs the attempt. Never throws. */
export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  const started = Date.now();
  const recipients = parseRecipients(getEnvVar("NOTIFY_EMAIL"));
  const recipientsCsv = recipients.join(",") || null;

  let mailer: Fetcher | undefined;
  try {
    mailer = getCloudflareEnv().MAILER as Fetcher | undefined;
  } catch {
    mailer = undefined;
  }

  if (recipients.length === 0) {
    return log({ lead_id: lead.leadId, status: "skipped", error: "NOTIFY_EMAIL not set" });
  }
  if (!mailer || typeof mailer.fetch !== "function") {
    return log({
      lead_id: lead.leadId,
      status: "skipped",
      recipients: recipientsCsv,
      error: "MAILER service binding not configured",
    });
  }

  try {
    const { subject, html, text } = await buildEmail(lead);
    const res = await mailer.fetch("https://zol-oil-mailer/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        to: recipients,
        from: { email: getEnvVar("NOTIFY_FROM") || DEFAULT_FROM, name: "ZOL-OIL Auto" },
        subject,
        html,
        text,
        replyTo: lead.email || undefined,
      }),
    });
    const body = (await res.json().catch(() => null)) as {
      ok?: boolean;
      messageId?: string;
      error?: string;
    } | null;

    if (res.ok && body?.ok) {
      return log({
        lead_id: lead.leadId,
        status: "sent",
        recipients: recipientsCsv,
        message_id: body.messageId ?? null,
        duration_ms: Date.now() - started,
      });
    }
    return log({
      lead_id: lead.leadId,
      status: "failed",
      recipients: recipientsCsv,
      error: `mailer HTTP ${res.status}: ${body?.error ?? "no body"}`,
      duration_ms: Date.now() - started,
    });
  } catch (e) {
    return log({
      lead_id: lead.leadId,
      status: "failed",
      recipients: recipientsCsv,
      error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
      duration_ms: Date.now() - started,
    });
  }
}
