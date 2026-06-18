// Supabase Edge Function: notify-lead
// Triggered by a Supabase Database Webhook on INSERT to the `leads` table.
// Sends an email alert to the dealership via Resend.
//
// Deploy:  supabase functions deploy notify-lead
// Secrets: supabase secrets set RESEND_API_KEY=re_... NOTIFY_EMAIL=contact@zol-oil.ro VITE_SITE_URL=https://zoloil.ro

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  source: string;
  status: string;
  car_id: string | null;
  created_at: string;
}

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: LeadRecord;
  schema: string;
}

serve(async (req: Request) => {
  // Verify this is a POST from Supabase Webhooks
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Validate the webhook secret to prevent spoofed calls
  const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
  if (webhookSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${webhookSecret}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const NOTIFY_EMAIL = Deno.env.get("NOTIFY_EMAIL") ?? "contact@zol-oil.ro";
  const SITE_URL = (Deno.env.get("VITE_SITE_URL") ?? "https://zoloil.ro").replace(/\/$/, "");

  if (!RESEND_API_KEY) {
    console.error("[notify-lead] RESEND_API_KEY is not set");
    return new Response("Server misconfigured", { status: 500 });
  }

  let payload: WebhookPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  // Only act on new leads
  if (payload.type !== "INSERT" || payload.table !== "leads") {
    return new Response("Ignored", { status: 200 });
  }

  const lead = payload.record;
  const adminUrl = `${SITE_URL}/admin/leaduri`;
  const carLine = lead.car_id
    ? `<p><strong>Mașină:</strong> <a href="${SITE_URL}/admin/masini/${lead.car_id}/edit">Vezi mașina în admin</a></p>`
    : "";

  const emailHtml = `
<h2>Lead nou – Parc Auto ZOL-OIL</h2>
<p><strong>Nume:</strong> ${escHtml(lead.name)}</p>
<p><strong>Telefon:</strong> <a href="tel:${escHtml(lead.phone)}">${escHtml(lead.phone)}</a></p>
${lead.email ? `<p><strong>Email:</strong> <a href="mailto:${escHtml(lead.email)}">${escHtml(lead.email)}</a></p>` : ""}
${lead.message ? `<p><strong>Mesaj:</strong> ${escHtml(lead.message)}</p>` : ""}
${carLine}
<p><strong>Sursă:</strong> ${escHtml(lead.source)}</p>
<p><strong>Data:</strong> ${new Date(lead.created_at).toLocaleString("ro-RO", { timeZone: "Europe/Bucharest" })}</p>
<hr />
<p><a href="${adminUrl}">Deschide panoul admin → Leaduri</a></p>
`.trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "ZOL-OIL Auto <noreply@zoloil.ro>",
      to: [NOTIFY_EMAIL],
      subject: `Lead nou de la ${lead.name} – ${lead.phone}`,
      html: emailHtml,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error("[notify-lead] Resend error:", body);
    return new Response("Email send failed", { status: 500 });
  }

  console.log(`[notify-lead] Email sent for lead ${lead.id}`);
  return new Response("OK", { status: 200 });
});

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
