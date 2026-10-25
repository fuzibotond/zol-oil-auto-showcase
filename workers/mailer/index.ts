// zol-oil-mailer — POST /send {to, from, subject, html, text} → env.EMAIL.send().
// Called only by the Pages app over the MAILER service binding (no public URL).
// Responds {ok:true, messageId} or {ok:false, error} with a non-2xx status.

interface SendEmailBinding {
  send(message: {
    to: string | string[];
    from: string | { email: string; name?: string };
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
  }): Promise<{ messageId: string }>;
}

interface Env {
  EMAIL: SendEmailBinding;
}

interface SendRequest {
  to: string[];
  from: { email: string; name?: string };
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (request.method !== "POST" || url.pathname !== "/send") {
      return json({ ok: false, error: "not found" }, 404);
    }

    let body: SendRequest;
    try {
      body = (await request.json()) as SendRequest;
    } catch {
      return json({ ok: false, error: "invalid JSON" }, 400);
    }
    if (!Array.isArray(body.to) || body.to.length === 0 || !body.from?.email || !body.subject) {
      return json({ ok: false, error: "missing to/from/subject" }, 400);
    }

    try {
      const { messageId } = await env.EMAIL.send({
        to: body.to,
        from: body.from,
        subject: body.subject,
        html: body.html,
        text: body.text,
        ...(body.replyTo ? { replyTo: body.replyTo } : {}),
      });
      console.log("[mailer] sent", { messageId, to: body.to });
      return json({ ok: true, messageId });
    } catch (e) {
      const error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error("[mailer] send failed", { error, to: body.to });
      return json({ ok: false, error }, 502);
    }
  },
};
