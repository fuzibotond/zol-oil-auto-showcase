// Server-only lead notification via Resend HTTP API. Replaces the former
// Supabase Edge Function `notify-lead` (which was DB-webhook triggered). Now
// called directly after a lead is inserted. Best-effort: callers must not fail
// the lead submission if this throws.
//
// Env: RESEND_API_KEY (required to send), NOTIFY_EMAIL (recipient),
//      NOTIFY_FROM (verified Resend sender; optional), VITE_SITE_URL (for links).

import { getEnvVar } from "@/lib/db/env";

export interface LeadNotification {
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyNewLead(lead: LeadNotification): Promise<void> {
  const apiKey = getEnvVar("RESEND_API_KEY");
  const to = getEnvVar("NOTIFY_EMAIL");
  if (!apiKey || !to) return; // notifications disabled / not configured

  const from = getEnvVar("NOTIFY_FROM") || "ZOL-OIL Auto <onboarding@resend.dev>";
  const siteUrl = (getEnvVar("VITE_SITE_URL") || "").replace(/\/$/, "");
  const adminLink = siteUrl
    ? `<hr /><p><a href="${siteUrl}/admin/leaduri">Deschide panoul admin → Leaduri</a></p>`
    : "";

  const html = `
<h2>Lead nou – Parc Auto ZOL-OIL</h2>
<p><strong>Nume:</strong> ${escHtml(lead.name)}</p>
<p><strong>Telefon:</strong> <a href="tel:${escHtml(lead.phone)}">${escHtml(lead.phone)}</a></p>
${lead.email ? `<p><strong>Email:</strong> <a href="mailto:${escHtml(lead.email)}">${escHtml(lead.email)}</a></p>` : ""}
${lead.message ? `<p><strong>Mesaj:</strong> ${escHtml(lead.message)}</p>` : ""}
<p><strong>Data:</strong> ${new Date().toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</p>
${adminLink}
`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: `Lead nou de la ${lead.name} – ${lead.phone}`,
      html,
    }),
  });
  if (!res.ok) {
    console.error("[notify] Resend error:", res.status, await res.text().catch(() => ""));
  }
}
