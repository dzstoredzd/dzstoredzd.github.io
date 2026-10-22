# Store Soft — website

Marketing landing page + legal pages for **Store Soft**, an offline-first
store-management app for Algerian shops. These pages also satisfy the Google
OAuth consent-screen "App domain" requirements (home page, privacy policy,
terms of service).

Plain HTML/CSS/JS — no build step, no dependencies. Open `index.html` in a
browser to preview locally.

## Static website pricing (19 October 2026)

The owner replaced the Supabase pricing setup with static website content.
Edit pricing/offers.js for prices, names, descriptions, features and billing
notes in Arabic, French and English. Amounts are integer centimes. Until
31 October 2026 the page shows two cards: the old lifetime offer (billing
"lifetime": 7,000 DA once for the first device + 3,000 DA/year per extra
device, `available_until: "2026-10-31"`) and the new yearly plan (billing
"yearly": 6,900 DA/year for the first device + 3,000 DA/year per extra device,
from 1 November 2026). From 1 November (Algeria time) the lifetime card hides
itself, so no publish is needed that day. The
page calculates the totals for 1–100 devices locally and formats DA;
support confirms the actual charge before activation. The homepage hero says
"yearly subscription" and the Apps Script welcome email shows the same prices
(redeploy Code.gs after editing it).
The lifetime card shows the days left (today and 31 October count, Algeria
time), the yearly card shows "less than N DA a day", a "try 14 days free"
button opens the Google Play listing (referrer `utm_source=pricing`), and one line says
payment is by CCP or BaridiMob.
Publish the website after edits and bump the offers.js version in pricing/index.html
so existing browsers receive the new file. No app update is needed for these edits.

The homepage and both download pages link to /pricing/?lang=ar|fr|en.
There is no pricing API, Supabase key, login, payment or entitlement bridge on
this page. Loaded offers and device estimates keep working when offline; the
page must first be downloaded. A failed page download still uses the app's
existing error/Retry flow. WhatsApp stays the contact channel.

Run node --test test/*.test.mjs and node test/pricing.browser.mjs with
PLAYWRIGHT_PATH and optionally PLAYWRIGHT_CHANNEL=msedge. Browser checks cover
AR/FR/EN, 320–1440px, local estimates, offline events and zero external requests.

## Font

Every Store Soft page uses the app font, IBM Plex Sans Arabic, self-hosted in
`assets/fonts/` (woff2 made from the app's TTF files, SIL OFL licence included).
Pages link `/assets/fonts/plex.css`; there is no Google Fonts request.

Website content update (12 October 2026): the homepage defaults to
Arabic/RTL and switches to French/LTR with its header button. `?lang=fr` opens
French directly; reload preserves that URL choice. Homepage copy lives in
`home.js`, with Arabic also rendered in HTML for visitors without JavaScript.
The Android hero button opens `/storesoft/v1/android/`; Windows keeps the
general download page. Both public trial pages now describe the app's 14-day
trial. Privacy/deletion text covers CRM contact and linked activity records,
including requests from people without a Sync account. Policy pages remain in
English. Form APIs, billing, backend and native app behavior are unchanged.

For a local review, run `node tool/preview.mjs` and open
`http://127.0.0.1:8765/` (or add `?lang=fr`). This localhost-only server blocks
form requests, tracking and external embeds through a response CSP; it cannot
be used to test real lead submission or YouTube playback. No CSP restriction is
added to the published HTML. Browser QA for the homepage and policy/deletion
layouts: `node test/store-soft-home.browser.mjs`, with the same Playwright
environment variables as the download-page browser suite.

## Pages

| File | Purpose | Live URL |
|------|---------|----------|
| `index.html` | Landing / home page | https://yousoft.site/ |
| `pricing/index.html` | Live published offers in Arabic, French and English | https://yousoft.site/pricing/ |
| `storesoft/download/index.html` | Store Soft trial/download lead form | https://yousoft.site/storesoft/download/ |
| `storesoft/v1/android/index.html` | Mobile-first Android v1 video, lead form and automatic Play redirect | https://yousoft.site/storesoft/v1/android/ |
| `storesoft/android/index.html` | Compatibility redirect preserving query and fragment | https://yousoft.site/storesoft/android/ |
| `storesoft/try/index.html` | Six-character tracked Google Play redirect | https://yousoft.site/storesoft/try/ |
| `privacy.html` | Privacy Policy (incl. Google API Limited Use) | https://yousoft.site/privacy.html |
| `terms.html` | Terms of Service | https://yousoft.site/terms.html |

Served from the `dzstoredzd.github.io` repo via GitHub Pages on the custom
domain **yousoft.site** (set by the `CNAME` file). The custom domain is what
Google OAuth brand verification requires (github.io is not accepted).

## Store Soft lead capture

The Android-only `/storesoft/v1/android/` page shows its three-field form first,
then the vertical YouTube explanation (`80QGPOKsXXg`), then a link to the live
Pricing page. Arabic and French are available. All commercial amounts and offer
details are maintained through Admin Billing, as described above.
It posts the existing `phone_shop_select_v4` contract with
`requested_platform: phone` (the API's existing Android preference value);
the existing download page stays unchanged. CRM `source` is always `android_v1`,
even with `utm_source` in the query. Other campaign fields remain unchanged;
the full `landing_page` retains all UTM values. The old `/storesoft/android/`
URL redirects here and preserves its query and fragment.
After the durable save, it records best-effort submission/download telemetry
and navigates in the same tab through `/storesoft/try/?t=<public code>` to Play.
An invalid/missing code falls back to the ordinary Play listing. A saved-state
link remains available if navigation is blocked. Errors preserve entered values
for retry; no download starts before a successful save. Contact details are
never put in analytics events or redirect URLs.

Android v1 uses the existing Meta Pixel `2176257146284643`. Successful CRM saves
fire one standard `Lead` event, with `content_category: android_v1` and
`content_name: Store Soft Android v1`. Invalid fields, pending saves and failed
requests never fire `Lead`; an explicit submit attempt remains a separate custom
event. A bounded 300 ms pause gives queued Pixel requests a chance to start
before Play navigation. Blocked/failed Facebook tracking never prevents the
download. No contact data, CRM lead ID or referral code is included in Pixel
parameters. Browser tests use a synthetic Pixel and do not prove Meta account
receipt; confirm receipt separately in that Pixel's Events Manager.

The download form posts to the `submit-store-soft-lead` Supabase Edge Function.
Its schema is recorded in the versioned migration under `supabase/migrations/`. The leads
table and immutable `lead_events` timeline are private (RLS enabled, no
browser-role grants); only guarded admin RPCs and Edge Functions access them.
Google Sheets mirroring uses `google-apps-script/Code.gs` and the
function secrets `GOOGLE_SHEETS_WEBHOOK_URL` and
`GOOGLE_SHEETS_WEBHOOK_SECRET`.

Every valid form submission creates a new lead. The current `phone_shop_select_v4`
form records name, phone/WhatsApp number, and an activity from the approved list.
Email and platform choice are not required; cached email and phone/platform forms
remain supported. Campaign fields are preserved. The endpoint responds after the
durable CRM insert with `lead_id` and the public six-character `tracking_code`, never
the private tracking token; Google Sheet delivery continues in the background.

The success screen immediately offers Android and Windows downloads, emphasizing
the visitor's platform when recognized. Both links open separately so either can be
used without resubmitting. Android uses `/storesoft/try/?t=<tracking_code>` and the
existing Play Install Referrer flow; Windows reads the public production Stable
feed at `https://raw.githubusercontent.com/dzstoredzd/dz-store-releases/main/storesoft/stable/latest.json`
after a successful submission and uses its versioned GitHub EXE URL. The request
bypasses the browser cache and never delays the success screen. If the feed is
unavailable or invalid, the button opens the latest stable GitHub release page.
Staging/Beta installers are excluded. Publishing a new Stable feed automatically
updates this download without another website edit.
`DownloadClicked` records only the selected platform, not contact details, and is
separate from installation/app milestones. Google Play is now live in production,
so no tester email or approval step is needed.

### Google Sheet workflow

The Apps Script keeps separate `date` (`dd/MM/yyyy`) and `time` (`HH:mm`)
columns in GMT+1 and inserts each new lead at row 2 so the newest leads stay
at the top. All rows are sorted by date and time in descending order; each date
group has a divider and alternating date-column shading. The `status` column is
a dropdown. Incoming webhook retries upsert the existing row by `lead_id`.
Confirmation email is controlled only by the authenticated StoreSoft CRM; the
Apps Script sender permits explicit repeat delivery. After each successful MailApp call,
`crm-admin-action` uses the vendor-admin-only counter RPC to preserve the first
`email_sent_at`, advance `email_last_sent_at`, and increment `email_sent_count`; failures record
`email_error` without incrementing. Deploy the migration before the sender and
`crm-admin-action`, then verify one real CRM
email, then run **Store Soft → Switch email control to CRM**. Until that explicit
cutover, the legacy Sheet trigger keeps the ordinary Play link working.

Production status (2026-09-04): migration `20260830134150_store_soft_crm_repeat_email`,
Apps Script version 11, and `crm-admin-action` version 7 are live. The confirmation email includes
the tracked Google Play URL, WhatsApp support, and a direct Windows installer link in HTML and plain
text. The Apps Script web-app URL was preserved, and no customer email was sent during deployment
verification.

Version 11 removes the obsolete matching-Google-Play-account reminder from both email bodies.

### CRM and tracked trial links

`supabase/migrations/20260829153849_store_soft_crm_core.sql` additively extends
`public.store_soft_leads`, preserves every legacy column and row, and creates
`public.lead_events`. Admin access uses the existing `sync.admins` allow-list.
`20260829154758_store_soft_crm_transition_idempotency.sql` keeps contacted/replied
Play clicks non-downgrading and makes repeated Customer actions preserve an
already-recorded purchase amount when the retry omits it.
`20260829163153_store_soft_crm_short_referral.sql` keeps the 256-bit token private and
adds the unique six-character referral code used by public tracking.
Confirmation email and WhatsApp use
`https://yousoft.site/storesoft/try/?t=<six-character-code>`; the redirect function
records a Play click and sends only that code through Google Play Install
Referrer. App milestone delivery accepts only UUID events from the explicit
allowlist and never accepts product/sale contents, amounts, or PII.

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
and records the base `PageView`, custom `LandingPageView`, `TrialCTAClick`,
`FormStarted`, `FormSubmitAttempt`, `FormSubmitted`, and `WhatsAppCTAClick` events,
plus the standard `Lead` event only after the Edge Function confirms that the request
was saved. Events carry a normalized `traffic_source` that distinguishes Facebook,
Instagram and TikTok while preserving the ordinary UTM fields. Form values are never
included in tracking events. The same conversion events are also exposed through the
`storesoft:tracking` browser event and `dataLayer` for future integrations.

A submitted form remains a lead, not a successful trial or sale. The tracked Google
Play redirect records `PLAYSTORE_CLICKED`; the Android Install Referrer flow then
records `APP_FIRST_OPEN`, `STORE_CREATED`, `PRODUCT_CREATED`, and `FIRST_SALE` as
separate funnel milestones. The CRM never infers those milestones from submission.

The product-proof gallery reuses 37 optimized Android screenshots under
`storesoft/download/assets/features/`. Only the first eight render initially; visitors
can reveal the full gallery or open any screenshot in an accessible lightbox. Images
are lazy-loaded to keep the landing page fast on mobile connections.

## Deploy

Checks: `node --test test/*.test.mjs` (Node 24 for the Edge Function TypeScript harness).
Browser QA: `node test/store-soft-download.browser.mjs` with Playwright available; optional
`PLAYWRIGHT_PATH`, `PLAYWRIGHT_CHANNEL`, and `QA_OUTPUT_DIR` select the local runtime/browser
and screenshot directory. Browser QA mocks external requests and creates no production leads.

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
