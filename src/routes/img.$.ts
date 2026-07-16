import { createFileRoute } from "@tanstack/react-router";
import { adoptRequestEnv, getR2 } from "@/lib/db/env";

// Same-origin R2 image delivery: /img/<key>. Used when no custom R2 image domain
// (R2_PUBLIC_BASE_URL) is configured. Long-lived immutable caching (keys are
// content-unique UUIDs).
export const Route = createFileRoute("/img/$")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        adoptRequestEnv(request);
        const url = new URL(request.url);
        const key = decodeURIComponent(url.pathname.replace(/^\/img\//, ""));
        if (!key || key.includes("..")) return new Response("Not found", { status: 404 });

        let obj;
        try {
          obj = await getR2().get(key);
        } catch {
          return new Response("Not found", { status: 404 });
        }
        if (!obj) return new Response("Not found", { status: 404 });

        const headers = new Headers();
        obj.writeHttpMetadata(headers);
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("ETag", obj.httpEtag);
        return new Response(obj.body, { headers });
      },
    },
  },
});
