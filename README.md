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
| `storesoft/download/index.html` | Store Soft trial/download lead form | https://yousoft.site/storesoft/download/ |
| `privacy.html` | Privacy Policy (incl. Google API Limited Use) | https://yousoft.site/privacy.html |
| `terms.html` | Terms of Service | https://yousoft.site/terms.html |

Served from the `dzstoredzd.github.io` repo via GitHub Pages on the custom
domain **yousoft.site** (set by the `CNAME` file). The custom domain is what
Google OAuth brand verification requires (github.io is not accepted).

## Store Soft lead capture

The download form posts to the `submit-store-soft-lead` Supabase Edge Function.
Its schema is recorded in the versioned migration under `supabase/migrations/`. The leads
table is private (RLS enabled, no browser-role grants); only the Edge Function
writes to it. Google Sheets mirroring uses `google-apps-script/Code.gs` and the
function secrets `GOOGLE_SHEETS_WEBHOOK_URL` and
`GOOGLE_SHEETS_WEBHOOK_SECRET`.

Every valid form submission creates a new lead. The current form records name,
free-text activity/shop type, phone or WhatsApp number, and whether the visitor
wants Store Soft for phone, computer, or both. Legacy email fields remain nullable
for compatibility with cached versions of the earlier form.

### Google Sheet workflow

The Apps Script keeps separate `date` (`dd/MM/yyyy`) and `time` (`HH:mm`)
columns in GMT+1 and inserts each new lead at row 2 so the newest leads stay
at the top. All rows are sorted by date and time in descending order; each date
group has a divider and alternating date-column shading. The `status` column is
a dropdown. Changing one lead to
`Confirmed` sends the Store Soft Google Play email once when a legacy lead has an
email address and records the result in `email_sent_at` or `email_error`. Current
phone-first leads are contacted through phone or WhatsApp.

`importArchivedLeads()` copies unique lead IDs from the legacy `Archeived Leads`
tab into the current schema, preserves the archived tab, and reapplies the
current sorting, dropdown, and date-group formatting.

To move the workflow to another Google account:

1. Copy the Sheet into the destination account's Drive and open its bound Apps
   Script project.
2. Replace the project code with `google-apps-script/Code.gs`.
3. While signed in as the sender account, run `setupLeadSheet()` and approve the
   requested Sheets and email permissions. The installed edit trigger always
   sends as the account that created it.
4. Deploy the script as a Web app that executes as the deploying account, then
   replace the Supabase Edge Function secrets `GOOGLE_SHEETS_WEBHOOK_URL` and
   `GOOGLE_SHEETS_WEBHOOK_SECRET` with the new deployment URL and the secret
   returned by `setupLeadSheet()`.

The landing page uses Meta Pixel `2176257146284643`. The Pixel is initialized once
and records the base `PageView`, custom `LandingPageView`, `FormStarted`,
`FormSubmitted`, and `WhatsAppCTAClick` events, plus the standard `Lead` event only
after the Edge Function confirms that the request was saved. Form values are never
included in tracking events. The same conversion events are also exposed through
the `storesoft:tracking` browser event and `dataLayer` for future integrations.

The product-proof gallery reuses four optimized Android screenshots under
`storesoft/download/assets/`. They are lazy-loaded to keep the Facebook Ads landing
experience fast on mobile connections.

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
