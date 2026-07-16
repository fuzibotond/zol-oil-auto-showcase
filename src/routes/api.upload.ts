import { createFileRoute } from "@tanstack/react-router";
import { assertAdminRequest } from "@/lib/auth/access";
import { adoptRequestEnv } from "@/lib/db/env";

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Admin image upload → R2. Protected by Cloudflare Access (verified server-side).
export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        adoptRequestEnv(request);

        try {
          await assertAdminRequest(request);
        } catch {
          return json({ error: "Unauthorized" }, 401);
        }

        let form: FormData;
        try {
          form = await request.formData();
        } catch {
          return json({ error: "Date de formular invalide." }, 400);
        }

        const file = form.get("file");
        if (!(file instanceof File)) return json({ error: "Lipsește fișierul." }, 400);

        const bytes = new Uint8Array(await file.arrayBuffer());
        try {
          const { uploadImage } = await import("@/lib/images/r2");
          const up = await uploadImage(bytes, "cars");
          return json({ url: up.url, r2_key: up.r2_key }, 200);
        } catch (e) {
          return json({ error: e instanceof Error ? e.message : "Încărcare eșuată." }, 400);
        }
      },
    },
  },
});
