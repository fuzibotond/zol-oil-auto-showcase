import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { bindCloudflareEnv } from "@/lib/db/bind-env";

// Admin auth is handled by Cloudflare Access (JWT in the CF_Authorization cookie /
// Cf-Access-Jwt-Assertion header), verified server-side in `requireAdmin`. No
// client-side bearer-token attacher is needed.

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

export const startInstance = createStart(() => ({
  requestMiddleware: [bindCloudflareEnv, csrfMiddleware, errorMiddleware],
}));
