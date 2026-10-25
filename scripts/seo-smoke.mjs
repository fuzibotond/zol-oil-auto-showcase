#!/usr/bin/env node
// SEO / HTTP smoke test — no dependencies, runs against any deployment.
//
//   node scripts/seo-smoke.mjs http://localhost:8788          (wrangler pages dev dist)
//   node scripts/seo-smoke.mjs https://zoloil.ro --canonical https://zoloil.ro
//
// --canonical <origin>  expected canonical origin in <link rel=canonical>, sitemap
//                       and robots (defaults to the origin VITE_SITE_URL was built with,
//                       read from the homepage canonical).
// Exits non-zero when any check fails.

const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:\/\//.test(a)) ?? "http://localhost:8788").replace(
  /\/$/,
  "",
);
const canonIdx = args.indexOf("--canonical");
let canonical = canonIdx >= 0 ? args[canonIdx + 1]?.replace(/\/$/, "") : null;

let failures = 0;
const ok = (msg) => console.log(`  ✓ ${msg}`);
const fail = (msg) => {
  failures++;
  console.log(`  ✗ ${msg}`);
};
const check = (cond, msg) => (cond ? ok(msg) : fail(msg));

async function get(path, init = {}) {
  const res = await fetch(base + path, { redirect: "manual", ...init });
  const text = init.method === "HEAD" ? "" : await res.text();
  return { res, text };
}

const attr = (html, re) => html.match(re)?.[1] ?? null;
const titleOf = (h) => attr(h, /<title>([^<]*)<\/title>/);
const canonicalOf = (h) => attr(h, /<link[^>]+rel="canonical"[^>]+href="([^"]+)"/);
const metaOf = (h, name) =>
  attr(h, new RegExp(`<meta[^>]+(?:name|property)="${name}"[^>]+content="([^"]*)"`));
const h1Count = (h) => (h.match(/<h1[\s>]/g) ?? []).length;
function jsonLd(html) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  return blocks.map((m) => JSON.parse(m[1]));
}
const types = (blocks) => blocks.flatMap((b) => [b["@type"]].flat());

async function page(path, { expectTypes = [], indexable = true } = {}) {
  console.log(`\n${path}`);
  const { res, text } = await get(path);
  check(res.status === 200, `HTTP 200 (got ${res.status})`);
  const t = titleOf(text);
  check(Boolean(t && t.length >= 15 && t.length <= 75), `title present, 15–75 chars: "${t}"`);
  const d = metaOf(text, "description");
  check(
    Boolean(d && d.length >= 50 && d.length <= 200),
    `meta description 50–200 chars (${d?.length})`,
  );
  const c = canonicalOf(text);
  if (!canonical && c) canonical = new URL(c).origin;
  check(Boolean(c && c.startsWith(`${canonical}/`)), `absolute canonical on ${canonical}: ${c}`);
  check(metaOf(text, "og:url") === c, "og:url equals canonical");
  const robots = metaOf(text, "robots") ?? "";
  check(indexable ? !robots.includes("noindex") : robots.includes("noindex"), `robots="${robots}"`);
  check(h1Count(text) === 1, `exactly one <h1> (found ${h1Count(text)})`);
  let blocks = [];
  try {
    blocks = jsonLd(text);
    ok(`JSON-LD parses (${blocks.length} blocks: ${types(blocks).join(", ")})`);
  } catch (e) {
    fail(`JSON-LD parse error: ${e.message}`);
  }
  for (const ty of expectTypes) check(types(blocks).includes(ty), `JSON-LD has ${ty}`);
  check(!/0700[ .]?000[ .]?000/.test(text), "no 0700 000 000 placeholder phone in HTML");
  for (const b of blocks)
    if (b.telephone)
      check(!/700000000/.test(b.telephone), `JSON-LD telephone real: ${b.telephone}`);
  return { text, title: t, blocks };
}

console.log(`Smoke test against ${base}`);

// robots.txt
console.log("\n/robots.txt");
{
  const { res, text } = await get("/robots.txt");
  check(res.status === 200, "HTTP 200");
  check(/Disallow: \/admin/.test(text), "disallows /admin");
  check(/Sitemap: https:\/\/[^\s]+\/sitemap\.xml/.test(text), "absolute Sitemap line");
}

const home = await page("/", { expectTypes: ["AutoDealer", "WebSite"] });
await page("/masini", { expectTypes: ["BreadcrumbList", "ItemList"] });
await page("/contact", { expectTypes: ["AutoDealer", "BreadcrumbList"] });
await page("/despre-noi", { expectTypes: ["AutoDealer", "BreadcrumbList"] });

// sitemap.xml
console.log("\n/sitemap.xml");
const { res: smRes, text: sm } = await get("/sitemap.xml");
check(smRes.status === 200, "HTTP 200");
const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
check(locs.length >= 7, `${locs.length} URLs`);
check(
  locs.every((l) => l.startsWith(`${canonical}/`)),
  `every <loc> is on the canonical origin ${canonical}`,
);
check(new Set(locs).size === locs.length, "no duplicate URLs");
const carLocs = locs.filter((l) => /\/masini\/[^/]+$/.test(l));
check(carLocs.length > 0, `${carLocs.length} car detail URLs listed`);

// Car detail pages from the sitemap (all must be indexable + unique titles).
const titles = new Set();
for (const loc of carLocs.slice(0, 5)) {
  const path = new URL(loc).pathname;
  const p = await page(path, { expectTypes: ["Car", "BreadcrumbList"] });
  check(!titles.has(p.title), "title unique among sampled cars");
  titles.add(p.title);
  const car = p.blocks.find((b) => b["@type"] === "Car");
  check(
    Boolean(car?.offers?.price != null && car?.offers?.priceCurrency),
    "Car.offers has price + currency",
  );
  check(!/SoldOut/.test(car?.offers?.availability ?? ""), "sitemap car is not SoldOut");
}

// Every sitemap URL must answer 200 (no redirects/404s in the sitemap).
console.log("\nsitemap URLs status");
{
  const bad = [];
  for (const loc of locs) {
    const r = await fetch(base + new URL(loc).pathname, { method: "HEAD", redirect: "manual" });
    if (r.status !== 200) bad.push(`${r.status} ${loc}`);
  }
  check(
    bad.length === 0,
    bad.length ? `non-200: ${bad.join(", ")}` : "all sitemap URLs return 200",
  );
}

// Legacy URLs + error handling.
console.log("\nredirects / status codes");
for (const [path, status, location] of [
  ["/1618/opel-astra-1-6i-twin-top.html", 410],
  ["/index.php?nr=101", 410],
  ["/oferta", 301, "/masini"],
  ["/index.php?cat=contact", 301, "/contact"],
  ["/masini/acest-slug-nu-exista", 404],
  ["/pagina-inexistenta", 404],
]) {
  const r = await fetch(base + path, { redirect: "manual" });
  const loc = r.headers.get("location");
  check(
    r.status === status && (!location || loc === location || loc?.endsWith(location)),
    `${path} → ${r.status}${loc ? ` ${loc}` : ""} (want ${status}${location ? ` ${location}` : ""})`,
  );
}
{
  const r = await fetch(base + "/admin", { redirect: "manual" });
  const xr = r.headers.get("x-robots-tag") ?? "";
  check(
    r.status === 302 || xr.includes("noindex"),
    `/admin is behind Access (302) or noindex (${r.status}, x-robots-tag="${xr}")`,
  );
}

// Performance-critical markup on the homepage.
console.log("\nhomepage performance markup");
check(!home.text.includes("fonts.googleapis.com"), "no render-blocking Google Fonts CSS");
check(!/src="\/parc-auto\.png"/.test(home.text), "hero no longer uses the 2.9 MB PNG");
check(
  /fetchPriority="high"|fetchpriority="high"/.test(home.text),
  "LCP image has fetchpriority=high",
);

console.log(failures ? `\n${failures} check(s) FAILED` : "\nAll checks passed");
process.exit(failures ? 1 : 0);
