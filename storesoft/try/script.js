"use strict";
const play = "https://play.google.com/store/apps/details?id=com.yousoft.storesoft";
const code = (new URLSearchParams(location.search).get("t") || "").trim().toUpperCase();
const target = /^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{6}$/.test(code)
  ? `https://blczhiusyvpkxrktgwng.supabase.co/functions/v1/store-soft-play-redirect?t=${encodeURIComponent(code)}`
  : play;
document.getElementById("fallback").href = target;
location.replace(target);
