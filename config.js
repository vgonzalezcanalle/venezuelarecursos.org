// ============================================================
//  CONFIGURATION — edit this file to connect your data
// ============================================================

const CONFIG = {

  // ----------------------------------------------------------
  // 1. GOOGLE SHEETS (published as CSV)
  //
  //    How to get this URL:
  //    a. Open your Google Sheet
  //    b. File → Share → Publish to web
  //    c. Choose the "Base de Datos (ENES)" sheet
  //    d. Choose "Comma-separated values (.csv)"
  //    e. Click Publish and copy the URL
  //    f. Paste it below
  // ----------------------------------------------------------
  SHEET_CSV_URL: "Yhttps://docs.google.com/spreadsheets/d/e/2PACX-1vTMGZSewQVcxrzERzjxUfcv4XuCPG_u7gmygSBZ9jazXnu59iYXKcqG7D5Tafyufx0aMFxU7DcoMyMU/pub?gid=0&single=true&output=csv",

  // ----------------------------------------------------------
  // 2. GOOGLE FORM (for resource submissions)
  //
  //    How to get this URL:
  //    a. Open your Google Form
  //    b. Click Send → Embed (<>)
  //    c. Copy just the src URL from the iframe code
  //    d. Paste it below
  //
  //    Also paste the plain shareable link for the fallback button.
  // ----------------------------------------------------------
  FORM_EMBED_URL: "<iframe src="https://docs.google.com/forms/d/e/1FAIpQLSfMEOIWm93TL5zIHvxvcPNenijiuwI8dgMEgVnwVluTepnGAA/viewform?embedded=true" width="640" height="4147" frameborder="0" marginheight="0" marginwidth="0">Loading…</iframe>",
  FORM_DIRECT_URL: "https://docs.google.com/forms/d/e/1FAIpQLSfMEOIWm93TL5zIHvxvcPNenijiuwI8dgMEgVnwVluTepnGAA/viewform?usp=dialog",

  // ----------------------------------------------------------
  // 3. SITE SETTINGS
  // ----------------------------------------------------------
  DEFAULT_LANG: "es",          // "es" or "en"
  REFRESH_INTERVAL_MS: 300000, // Auto-refresh data every 5 minutes (300000ms)

};
