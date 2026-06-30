// ============================================================
//  CONFIGURATION — edit this file to connect your data
// ============================================================
const CONFIG = {

  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMGZSewQVcxrzERzjxUfcv4XuCPG_u7gmygSBZ9jazXnu59iYXKcqG7D5Tafyufx0aMFxU7DcoMyMU/pub?gid=0&single=true&output=csv",

  FORM_EMBED_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfMEOIWm93TL5zIHvxvcPNenijiuwI8dgMEgVnwVluTepnGAA/viewform?embedded=true",

  FORM_DIRECT_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfMEOIWm93TL5zIHvxvcPNenijiuwI8dgMEgVnwVluTepnGAA/viewform?usp=dialog",

  DEFAULT_LANG: "es",
  REFRESH_INTERVAL_MS: 300000,

  // Bluesky handle to pull earthquake-related news from (no API key needed)
  BSKY_NEWS_HANDLE: "noticiasvv.vzla.masto.host.ap.brid.gy",

  // Earthquake date — news pagination stops once it reaches posts older than this
  BSKY_NEWS_SINCE: "2026-06-20",

};
