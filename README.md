# Store Soft — website

Marketing landing page + legal pages for **Store Soft**, an offline-first
store-management app for Algerian shops. These pages also satisfy the Google
OAuth consent-screen "App domain" requirements (home page, privacy policy,
terms of service).

Plain HTML/CSS/JS — no build step, no dependencies. Open `index.html` in a
browser to preview locally.

## Pages

| File | Purpose | Live URL |
|------|---------|----------|
| `index.html` | Landing / home page | https://yousoft.site/ |
| `privacy.html` | Privacy Policy (incl. Google API Limited Use) | https://yousoft.site/privacy.html |
| `terms.html` | Terms of Service | https://yousoft.site/terms.html |

Served from the `dzstoredzd.github.io` repo via GitHub Pages on the custom
domain **yousoft.site** (set by the `CNAME` file). The custom domain is what
Google OAuth brand verification requires (github.io is not accepted).

## Deploy

GitHub Pages serves this repo from the `main` branch root. Any push to `main`
republishes the site automatically (Settings → Pages → Deploy from a branch →
`main` / `/root`). The `CNAME` file pins the custom domain `yousoft.site`.

## DNS (Hostinger) for yousoft.site

Apex `yousoft.site` → four A records + four AAAA records to GitHub Pages:

```
A     @   185.199.108.153
A     @   185.199.109.153
A     @   185.199.110.153
A     @   185.199.111.153
AAAA  @   2606:50c0:8000::153
AAAA  @   2606:50c0:8001::153
AAAA  @   2606:50c0:8002::153
AAAA  @   2606:50c0:8003::153
CNAME www dzstoredzd.github.io.
```

## Google OAuth → App domain

- **Authorized domain:** `yousoft.site`
- **Application home page:** https://yousoft.site/
- **Application privacy policy link:** https://yousoft.site/privacy.html
- **Application terms of service link:** https://yousoft.site/terms.html

Verify ownership in Google Search Console as a **Domain** property (`yousoft.site`)
using the DNS TXT record method at Hostinger.

## Contact

WhatsApp +213 654 33 86 49 · younes.mimene@gmail.com
