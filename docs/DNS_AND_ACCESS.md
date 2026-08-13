# Move zoloil.ro DNS to Cloudflare (keep old site + email working) → Access on nou.zoloil.ro

Goal: manage `zoloil.ro` DNS at Cloudflare so we can protect `nou.zoloil.ro/admin` with
Access — **without** breaking the old website or email. This is NOT a registrar transfer;
the domain stays registered where it is. Only the **nameservers** change.

> ⚠️ The #1 risk is losing **email (MX)** records. Do Step 0 first and don't skip verification.

---

## Step 0 — Record what exists today (in cPanel)
In **cPanel → Zone Editor → zoloil.ro → Manage**, write down / screenshot **every** record:
- `A` / `AAAA` (root `@`, `www`, and any like `mail`, `webmail`, `cpanel`, `ftp`, `autodiscover`)
- **`MX`** (mail servers) — critical for email
- **`TXT`** — especially SPF (`v=spf1 …`), DKIM (`*._domainkey`), DMARC (`_dmarc`)
- any `CNAME` (including the `nou` one you already added — you'll re-add it later)
- `SRV` if present (autodiscover/SIP)

Keep this list. You'll compare against it in Step 2.

## Step 1 — Add the site to Cloudflare
1. Cloudflare dashboard → **Add a site** → enter `zoloil.ro` → choose the **Free** plan.
2. Cloudflare scans your current DNS and shows what it found.

## Step 2 — Verify the imported records (do NOT trust the scan blindly)
Compare the imported list against your Step 0 notes. Manually **add anything missing**, especially:
- `MX` records → must match exactly.
- SPF / DKIM / DMARC `TXT` records.
- `mail`, `webmail`, `autodiscover` hostnames.

**Proxy status (orange vs grey cloud):**
- Set **all existing records to "DNS only" (grey cloud)** for now — the old site and mail then
  behave exactly as before. Nothing is routed through Cloudflare's proxy yet.
- **MX and any mail hostname (`mail`, `webmail`, `autodiscover`) MUST stay grey** — email can
  never be proxied.
- Remove the temporary `nou` CNAME here if it was imported — Pages will recreate it in Step 5.

## Step 3 — Change nameservers at your registrar
1. Cloudflare gives you **2 nameservers** (e.g. `xxx.ns.cloudflare.com`).
2. Log into your **registrar** (where `.ro` is registered — ROTLD or your reseller; this may be a
   different account than cPanel). Replace the current nameservers with Cloudflare's two.
   - For `.ro`, some resellers require you to request the change via their panel or support.
3. Save. Propagation is usually 15 min–2 h, up to 24 h.

## Step 4 — Wait for "Active" + set SSL
- Cloudflare emails you and the zone shows **Active** when nameservers have switched.
- Cloudflare → **SSL/TLS → Overview** → set encryption mode to **Full (strict)**.
  (This only affects proxied/orange records; your grey old-site records are unaffected — but set it
  now so the Pages domain is correct.)
- **Verify the old site still loads** (`https://zoloil.ro`) and **send yourself a test email** to a
  zoloil.ro mailbox. If either fails, re-check the A / MX records against Step 0.

## Step 5 — Re-add nou.zoloil.ro to Pages
- Pages project → **Custom domains → Set up a custom domain → `nou.zoloil.ro`**.
- Because the zone is now on Cloudflare, it creates the proxied record automatically (no cPanel step).
- Wait for the domain to show **Active** with a valid certificate.

## Step 6 — Protect nou.zoloil.ro with Access
1. Zero Trust → **Access → Applications** → open your existing app (the one over
   `zol-oil-auto-showcase.pages.dev`).
2. **Add a domain / self-hosted application domain:** `nou.zoloil.ro`, path `/admin`.
   (Same application ⇒ same **AUD** ⇒ no env-var changes.)
3. Confirm the **policy** still allows your email (`fuziboti@gmail.com`).

## Step 7 — Point the app at the new URL
- Pages → **Settings → Variables and Secrets** → set **`VITE_SITE_URL = https://nou.zoloil.ro`** → **redeploy**.
  (Feeds sitemap, robots `Sitemap:`, OG tags, WhatsApp car link.)

## Step 8 — Verify
- `https://nou.zoloil.ro/` → new app loads.
- `https://nou.zoloil.ro/admin` → redirects to Access login → after PIN, admin loads.
- `curl -I https://nou.zoloil.ro/` → shows the security headers + HSTS.
- Old site `https://zoloil.ro/` still works; email still works.

---

## Later: moving the ROOT (zoloil.ro) to the new app
When ready to replace the old site entirely: in Pages → Custom domains add `zoloil.ro` + `www`,
change the root `A`/`www` records to the Pages target (Cloudflare does this for you), add
`zoloil.ro/admin` to the Access app, and update `VITE_SITE_URL` to `https://zoloil.ro`. Keep MX/mail
records untouched.

## Rollback
If anything goes wrong, revert the nameservers at the registrar back to the originals — DNS returns
to cPanel exactly as before. Nothing about the domain registration was changed.
