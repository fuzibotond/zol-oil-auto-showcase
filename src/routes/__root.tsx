import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useRouterState,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { GTM_ID, consentDefaultScript, gtmLoaderScript } from "@/lib/consent";
import { absoluteUrl, DEFAULT_OG_IMAGE_PATH } from "@/lib/seo";
import { getSiteSettings } from "@/lib/api/site-settings.functions";
import { getCompanyInfo } from "@/lib/api/company.functions";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { CookieConsent } from "@/components/site/CookieConsent";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Pagina nu a fost găsită</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Pagina pe care o cauți nu există sau a fost mutată.
        </p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
        >
          Înapoi acasă
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Această pagină nu s-a încărcat</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Ceva nu a funcționat. Reîncearcă sau revino mai târziu.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Reîncearcă
          </button>
          <a href="/" className="rounded-xl border border-border bg-background px-4 py-2 text-sm">
            Acasă
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  // Site-wide contact settings + company identity, loaded on the server so the
  // header/footer/contact blocks are server-rendered with the real NAP data
  // (useSiteSettings / useCompanyInfo seed from this). Both fns never throw.
  loader: async () => {
    const [settings, company] = await Promise.all([getSiteSettings(), getCompanyInfo()]);
    return { settings, company };
  },
  // Contact data changes rarely; don't re-fetch it on every client navigation.
  staleTime: 5 * 60_000,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ZOL-OIL · Parc Auto Cernat" },
      {
        name: "description",
        content:
          "Parc Auto ZOL-OIL Cernat — autoturisme rulate, verificate și pregătite pentru drum.",
      },
      { name: "author", content: "ZOL-OIL" },
      { property: "og:site_name", content: "Parc Auto ZOL-OIL" },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ro_RO" },
      { property: "og:image", content: absoluteUrl(DEFAULT_OG_IMAGE_PATH) },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: absoluteUrl(DEFAULT_OG_IMAGE_PATH) },
      { name: "theme-color", content: "#22282b" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      { rel: "icon", type: "image/png", sizes: "96x96", href: "/favicon-96x96.png" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      // Fonts are self-hosted (see @font-face in styles.css): no render-blocking
      // third-party CSS and no visitor IP sent to Google. Both subset files
      // are preloaded: every page uses them above the fold.
      {
        rel: "preload",
        href: "/fonts/inter-ro.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/sora-ro.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ro">
      <head>
        <HeadContent />
        {/* Google Tag Manager — Consent Mode v2 defaults (denied) are set first,
            then the GTM loader. GA4 + Meta Pixel are configured as tags inside
            GTM. Renders only when VITE_GTM_ID is set at build time. */}
        {GTM_ID ? (
          <>
            <script dangerouslySetInnerHTML={{ __html: consentDefaultScript() }} />
            <script dangerouslySetInnerHTML={{ __html: gtmLoaderScript(GTM_ID) }} />
          </>
        ) : null}
      </head>
      <body suppressHydrationWarning>
        <a
          href="#continut"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-xl focus:bg-foreground focus:px-4 focus:py-2 focus:text-sm focus:text-background"
        >
          Sari la conținut
        </a>
        {/* GTM noscript fallback for browsers with JavaScript disabled. */}
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
              title="gtm"
            />
          </noscript>
        ) : null}
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = pathname.startsWith("/admin") || pathname.startsWith("/auth");

  return (
    <QueryClientProvider client={queryClient}>
      <div suppressHydrationWarning className="flex min-h-screen flex-col">
        {!isAdmin && <Header />}
        <main id="continut" className="flex-1">
          <Outlet />
        </main>
        {!isAdmin && <Footer />}
        {!isAdmin && <CookieConsent />}
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}
