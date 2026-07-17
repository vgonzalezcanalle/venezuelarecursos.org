// ============================================================
//  CONFIGURATION — edit this file to connect your data
// ============================================================
const CONFIG = {

  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMGZSewQVcxrzERzjxUfcv4XuCPG_u7gmygSBZ9jazXnu59iYXKcqG7D5Tafyufx0aMFxU7DcoMyMU/pub?gid=0&single=true&output=csv",

  // Categories tab — columns: Category, Categoría, Icon (Icon is optional; falls
  // back to 📌 if blank). Leave empty to use the hardcoded category list in app.js.
  CATEGORIES_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMGZSewQVcxrzERzjxUfcv4XuCPG_u7gmygSBZ9jazXnu59iYXKcqG7D5Tafyufx0aMFxU7DcoMyMU/pub?gid=1688607897&single=true&output=csv",

  FORM_EMBED_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfMEOIWm93TL5zIHvxvcPNenijiuwI8dgMEgVnwVluTepnGAA/viewform?embedded=true",

  FORM_DIRECT_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfMEOIWm93TL5zIHvxvcPNenijiuwI8dgMEgVnwVluTepnGAA/viewform?usp=dialog",

  DEFAULT_LANG: "es",
  REFRESH_INTERVAL_MS: 300000,

  // News sources for the News tab — no API keys needed.
  // type: "bluesky" → public Bluesky API (handle required)
  // type: "rss"     → RSS/Atom feed, proxied through rss2json.com to avoid CORS (url required)
  // noFilter: true  → show all posts as-is (source already covers only the earthquake)
  // noFilter: false → filter posts by earthquake keywords (source is general news)
  NEWS_SOURCES: [
    { type: "bluesky", handle: "noticiasvv.vzla.masto.host.ap.brid.gy", label: "Noticias VV", noFilter: false },
    { type: "bluesky", handle: "caracaschronicles.tierra-de-gracia.com", label: "Caracas Chronicles", noFilter: true },
    { type: "rss", url: "https://eldiario.com/etiqueta/terremotos-venezuela/feed/", label: "El Diario", noFilter: true },
  ],

  // Earthquake date — news pagination stops once it reaches posts older than this
  BSKY_NEWS_SINCE: "2026-06-20",

};
