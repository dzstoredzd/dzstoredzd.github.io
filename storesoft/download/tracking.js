// Shared with the public download page. No contact details or raw user agent leave the browser.
(function (root) {
  "use strict";
  const endpoint = "https://blczhiusyvpkxrktgwng.supabase.co/rest/v1/rpc/record_store_soft_download_event";
  const key = "sb_publishable_4SQY-raWFj42T9zkTNkAug_y4sdYE1g";
  const storageKey = "storesoft_download_visitor_v1";
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let visitorId;
  let trackingCode;
  try {
    visitorId = root.localStorage.getItem(storageKey);
    if (!uuidPattern.test(visitorId || "")) {
      visitorId = root.crypto.randomUUID();
      root.localStorage.setItem(storageKey, visitorId);
    }
    // Storage-blocked browsers are omitted rather than counted again on every page load.
    if (root.localStorage.getItem(storageKey) !== visitorId) visitorId = null;
  } catch (_) { visitorId = null; }
  const ua = root.navigator.userAgent || "";
  const browserPlatform = /Android/i.test(ua) ? "android" : /Windows/i.test(ua) ? "windows" : "other";
  function record(event, platform, code) {
    if (!visitorId) return;
    try {
      root.fetch(endpoint, {
        method: "POST", keepalive: true,
        headers: { "Content-Type": "application/json", apikey: key },
        body: JSON.stringify({ p_visitor_id: visitorId, p_event_type: event,
          p_platform: platform, p_tracking_code: code || null }),
      }).catch(function () { /* Best effort; form and downloads always remain usable. */ });
    } catch (_) { /* Browser telemetry is never required to download. */ }
  }
  root.StoreSoftDownloadTracking = Object.freeze({
    visit: function () { record("DOWNLOAD_PAGE_VISIT", browserPlatform); },
    submitted: function (code) {
      trackingCode = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code || "") ? code : null;
      if (trackingCode) record("LEAD_SUBMITTED", browserPlatform, trackingCode);
    },
    click: function (platform) {
      if (trackingCode && ["android", "windows"].includes(platform)) record("DOWNLOAD_CLICKED", platform, trackingCode);
    },
  });
})(window);
