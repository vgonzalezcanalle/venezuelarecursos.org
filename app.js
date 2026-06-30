// ============================================================
//  APP.JS — Venezuela Earthquake Resource Hub
// ============================================================

// --- State ---
let currentLang = CONFIG.DEFAULT_LANG || "es";
let allResources = [];
let activeCategory = "";
let activeLocation = "";
let pendingLocationFilter = "";
let pendingRecursoSlug = "";
let dataLoaded = false;

// --- Category definitions (EN + ES + emoji) ---
const CATEGORIES = [
  { en: "Building Inspection",               es: "Inspección de Viviendas y Edificaciones", icon: "🏠" },
  { en: "Home Repair & Recovery",            es: "Reparación y Recuperación de Viviendas",  icon: "🔨" },
  { en: "Medical Care",                      es: "Atención Médica",                         icon: "🚑" },
  { en: "Food & Water",                      es: "Alimentos y Agua",                        icon: "🍲" },
  { en: "Shelter",                           es: "Refugio",                                 icon: "🛏" },
  { en: "Mental Health",                     es: "Salud Mental",                            icon: "💙" },
  { en: "Missing Persons",                   es: "Personas Desaparecidas",                  icon: "👨‍👩‍👧" },
  { en: "Disability & Special Needs Support",es: "Apoyo para Discapacidad y Necesidades Especiales", icon: "♿" },
  { en: "Transportation",                    es: "Transporte",                              icon: "🚗" },
  { en: "Legal Help",                        es: "Asistencia Legal",                        icon: "⚖️" },
  { en: "Financial Assistance",              es: "Ayuda Financiera",                        icon: "💰" },
  { en: "Donations",                         es: "Donaciones",                              icon: "💛" },
  { en: "Essential Supplies",                es: "Suministros Esenciales",                  icon: "📦" },
  { en: "Baby Supplies",                     es: "Suministros para Bebés",                  icon: "👶" },
  { en: "Pet Assistance",                    es: "Asistencia para Mascotas",                icon: "🐾" },
  { en: "Utilities",                         es: "Servicios Públicos",                      icon: "💡" },
  { en: "Documentation & Government Services", es: "Documentación y Trámites Gubernamentales", icon: "📄" },
  { en: "Crisis Hotlines & Emergency Contacts", es: "Líneas de Crisis y Contactos de Emergencia", icon: "📞" },
  { en: "Volunteer Opportunities",           es: "Oportunidades de Voluntariado",           icon: "🤝" },
  { en: "Education",                         es: "Educación",                               icon: "📚" },
  { en: "Other",                             es: "Otro",                                    icon: "➕" },
];

// Map EN category → category object
function getCategoryObj(enName) {
  return CATEGORIES.find(c => c.en === enName) || { en: enName, es: enName, icon: "📌" };
}

// A resource's "Category" cell may list more than one category, comma-separated
// (e.g. "Donations, Financial Assistance"), so it can appear under each one.
function getCategoriesOf(r) {
  return (r["Category"] || "").split(",").map(c => c.trim()).filter(Boolean);
}

// ============================================================
//  LANGUAGE
// ============================================================

function toggleLang() {
  currentLang = currentLang === "es" ? "en" : "es";
  applyLang();
}

function applyLang() {
  document.documentElement.lang = currentLang;

  // Update all data-en / data-es elements
  document.querySelectorAll("[data-en][data-es]").forEach(el => {
    el.textContent = el.getAttribute(`data-${currentLang}`);
  });

  // Toggle button active state
  document.querySelector(".lang-en").classList.toggle("lang-active", currentLang === "en");
  document.querySelector(".lang-es").classList.toggle("lang-active", currentLang === "es");

  // Update select placeholders
  const catFilter = document.getElementById("categoryFilter");
  if (catFilter && catFilter.options[0]) {
    catFilter.options[0].text = currentLang === "en" ? "All Categories" : "Todas las Categorías";
  }
  const locFilter = document.getElementById("locationFilter");
  if (locFilter && locFilter.options[0]) {
    locFilter.options[0].text = currentLang === "en" ? "All Locations" : "Todas las Ubicaciones";
  }

  // Re-render dynamic content
  renderCategoryGrid();
  renderResources(allResources);
  renderNews(allNews);
}

// ============================================================
//  NAVIGATION — hash-based routing
//  URLs: #inicio | #recursos | #enviar | #acerca
// ============================================================

const PAGE_HASHES = {
  "home":      "#inicio",
  "resources": "#recursos",
  "news":      "#noticias",
  "submit":    "#enviar",
  "about":     "#acerca",
};

const HASH_TO_PAGE = Object.fromEntries(
  Object.entries(PAGE_HASHES).map(([k, v]) => [v, k])
);

function showPage(pageId, pushState = true, queryParams = null) {
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const page = document.getElementById(`page-${pageId}`);
  if (page) {
    page.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // URL format: /?categoria=Donaciones#recursos  (query string BEFORE hash)
  // This is the only format browsers reliably preserve when sharing links.
  const baseHash = PAGE_HASHES[pageId] || "#inicio";
  const url = queryParams ? `/?${queryParams}${baseHash}` : `/${baseHash}`;

  if (pushState && window.location.pathname + window.location.search + window.location.hash !== url) {
    history.pushState({ pageId }, "", url);
  }

  // Highlight active nav link
  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach(a => {
    a.classList.remove("nav-active");
  });
  document.querySelectorAll(`.nav-links a[data-page="${pageId}"], .mobile-menu a[data-page="${pageId}"]`).forEach(a => {
    a.classList.add("nav-active");
  });

  if (pageId === "resources") filterResources();
  if (pageId === "submit") setupForm();
}

// Parse /?categoria=Donaciones#recursos into { pageId, params }
function parseHash() {
  // Support both old format (#recursos?categoria=X) and new format (?categoria=X#recursos)
  const hash = window.location.hash || "#inicio";
  const search = window.location.search || "";

  // New format: query string in window.location.search
  if (search) {
    const hashPart = hash.split("?")[0]; // strip any legacy ?params from hash
    const pageId = HASH_TO_PAGE[hashPart] || "home";
    const params = new URLSearchParams(search);
    return { pageId, params };
  }

  // Legacy fallback: params were after the ? inside the hash (#recursos?categoria=X)
  const [hashPart, queryPart] = hash.split("?");
  const pageId = HASH_TO_PAGE[hashPart] || "home";
  const params = new URLSearchParams(queryPart || "");
  return { pageId, params };
}

// Update URL to /?categoria=X#recursos format
function updateHashParams(params, pushState = true) {
  const baseHash = PAGE_HASHES["resources"];
  const queryStr = params.toString();
  const url = queryStr ? `/?${queryStr}${baseHash}` : `/${baseHash}`;
  const current = window.location.pathname + window.location.search + window.location.hash;

  if (current !== url) {
    if (pushState) {
      history.pushState({ pageId: "resources" }, "", url);
    } else {
      history.replaceState({ pageId: "resources" }, "", url);
    }
  }
}

function navigateFromHash() {
  const { pageId, params } = parseHash();

  if (pageId === "resources") {
    const cat = params.get("categoria");
    const loc = params.get("ubicacion");
    const q = params.get("buscar");
    const recurso = params.get("recurso");

    if (cat) activeCategory = cat;
    pendingLocationFilter = loc || "";
    if (q) document.getElementById("searchInput").value = q;

    // If a specific resource was linked, open its modal once data loads
    if (recurso) pendingRecursoSlug = recurso;
  }

  showPage(pageId, false);
}

// Back / forward button support
window.addEventListener("popstate", () => navigateFromHash());

function toggleMobileMenu() {
  document.getElementById("mobileMenu").classList.toggle("open");
}

// ============================================================
//  CATEGORY GRID (Home page)
// ============================================================

function renderCategoryGrid() {
  const grid = document.getElementById("categoryGrid");
  if (!grid) return;
  grid.innerHTML = CATEGORIES.map(cat => {
    const label = currentLang === "en" ? cat.en : cat.es;
    const count = allResources.filter(r => getCategoriesOf(r).includes(cat.en)).length;
    return `
      <button class="category-card ${count === 0 ? 'category-empty' : ''}" onclick="filterAndShow('${cat.en}')">
        <span class="category-icon">${cat.icon}</span>
        <span class="category-label">${label}</span>
        ${count > 0 ? `<span class="category-count">${count}</span>` : ''}
      </button>
    `;
  }).join("");
}

function filterAndShow(categoryEn) {
  activeCategory = categoryEn;
  document.getElementById("categoryFilter").value = categoryEn;

  const params = new URLSearchParams();
  params.set("categoria", categoryEn);

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  document.getElementById("page-resources").classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });

  updateHashParams(params, true);

  document.querySelectorAll(".nav-links a, .mobile-menu a").forEach(a => a.classList.remove("nav-active"));
  document.querySelectorAll(`.nav-links a[data-page="resources"], .mobile-menu a[data-page="resources"]`).forEach(a => a.classList.add("nav-active"));

  filterResources();
}

// ============================================================
//  DATA LOADING
// ============================================================

async function loadResources() {
  const status = document.getElementById("resourcesStatus");
  const grid = document.getElementById("resourceGrid");

  if (!CONFIG.SHEET_CSV_URL || CONFIG.SHEET_CSV_URL === "YOUR_GOOGLE_SHEET_CSV_URL_HERE") {
    status.innerHTML = `<p class="config-warning">⚙️ ${currentLang === "en"
      ? "To display resources, add your Google Sheet CSV URL to <code>config.js</code>."
      : "Para mostrar recursos, agrega la URL CSV de tu Google Sheet en <code>config.js</code>."}</p>`;
    loadSampleData();
    return;
  }

  try {
    status.classList.remove("hidden");
    status.innerHTML = `<div class="loading-spinner"></div><span>${currentLang === "en" ? "Loading resources..." : "Cargando recursos..."}</span>`;

    const res = await fetch(CONFIG.SHEET_CSV_URL);
    if (!res.ok) throw new Error("Network error");
    const csv = await res.text();
    allResources = parseCSV(csv);
    dataLoaded = true;

    status.classList.add("hidden");
    populateFilters();
    renderCategoryGrid();
    filterResources();

    // If a direct resource link was opened, find and open that resource's modal
    if (pendingRecursoSlug) {
      const r = findResourceBySlug(pendingRecursoSlug);
      if (r) {
        const idx = allResources.indexOf(r);
        window._currentFilteredResources = allResources;
        openModal(idx, true);
      }
      pendingRecursoSlug = "";
    }

  } catch (err) {
    console.error("Failed to load resources:", err);
    status.innerHTML = `<p class="config-warning">⚠️ ${currentLang === "en"
      ? "Could not load resources. Check your Sheet URL or network connection."
      : "No se pudieron cargar los recursos. Verifica la URL de tu hoja o la conexión."}</p>`;
  }
}

function parseCSV(csv) {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  const headers = parseCSVRow(lines[0]);
  const resources = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVRow(line);
    if (values.every(v => !v)) continue;
    const obj = {};
    headers.forEach((h, idx) => {
      obj[h.trim()] = (values[idx] || "").trim();
    });
    // Only include rows that have a resource name
    if (obj["Resource Name"] || obj["Nombre del Recurso"]) {
      resources.push(obj);
    }
  }
  return resources;
}

function parseCSVRow(row) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// ============================================================
//  NEWS (Bluesky) — fetched from the public, keyless Bluesky API
// ============================================================

const BSKY_EARTHQUAKE_KEYWORDS = ["terremoto", "sismo", "replica", "desaparecid", "damnificad", "derrumbe", "rescate"];
// Posts matching a keyword above are dropped unless they also mention Venezuela,
// since the source account also covers earthquakes in other countries.
const BSKY_FOREIGN_HINTS = ["japon", "tokio", "turquia", "mexico", "chile", "indonesia", "filipinas", "peru", "ecuador", "colombia", "italia", "marruecos", "afganistan", "china", "taiwan", "nepal", "myanmar"];
const BSKY_VENEZUELA_HINTS = ["venezuela", "caracas", "la guaira", "vargas", "miranda", "vzla"];
const BSKY_MAX_PAGES = 5; // safety cap on pagination (5 x 100 posts)

function normalizeText(str) {
  return (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isEarthquakeRelevant(text) {
  const norm = normalizeText(text);
  const hasKeyword = BSKY_EARTHQUAKE_KEYWORDS.some(k => norm.includes(k));
  if (!hasKeyword) return false;
  const hasForeignHint = BSKY_FOREIGN_HINTS.some(k => norm.includes(k));
  if (!hasForeignHint) return true;
  return BSKY_VENEZUELA_HINTS.some(k => norm.includes(k));
}

let allNews = [];

async function loadNews() {
  const status = document.getElementById("newsStatus");
  const grid = document.getElementById("newsGrid");
  if (!grid) return;

  const handle = CONFIG.BSKY_NEWS_HANDLE;
  if (!handle) {
    status.innerHTML = `<p class="config-warning">⚙️ ${currentLang === "en"
      ? "To display news, add a Bluesky handle to <code>config.js</code>."
      : "Para mostrar noticias, agrega un usuario de Bluesky en <code>config.js</code>."}</p>`;
    return;
  }

  try {
    status.classList.remove("hidden");
    status.innerHTML = `<div class="loading-spinner"></div><span>${currentLang === "en" ? "Loading news..." : "Cargando noticias..."}</span>`;

    const since = CONFIG.BSKY_NEWS_SINCE || "";
    let feedItems = [];
    let cursor = "";

    for (let page = 0; page < BSKY_MAX_PAGES; page++) {
      const url = `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?actor=${encodeURIComponent(handle)}&limit=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      const feed = data.feed || [];
      if (feed.length === 0) break;

      feedItems.push(...feed);

      const oldestDate = feed[feed.length - 1]?.post?.record?.createdAt || "";
      cursor = data.cursor || "";
      if (!cursor || (since && oldestDate < since)) break;
    }

    allNews = feedItems
      .filter(item => !item.reason) // skip reposts, keep only the account's own posts
      .map(item => item.post)
      .filter(post => post && post.record)
      .filter(post => !since || post.record.createdAt >= since)
      .filter(post => isEarthquakeRelevant(post.record.text))
      .map(parseNewsPost);

    status.classList.add("hidden");
    renderNews(allNews);

  } catch (err) {
    console.error("Failed to load news:", err);
    status.innerHTML = `<p class="config-warning">⚠️ ${currentLang === "en"
      ? "Could not load news. Check your connection."
      : "No se pudieron cargar las noticias. Verifica tu conexión."}</p>`;
  }
}

function parseNewsPost(post) {
  const record = post.record || {};
  const external = post.embed && post.embed.$type === "app.bsky.embed.external#view" ? post.embed.external : null;

  return {
    title: external?.title || (record.text || "").split("\n")[0],
    description: external?.description || record.text || "",
    thumb: external?.thumb || "",
    link: external?.uri || bskyPostUrl(post),
    date: record.createdAt || post.indexedAt || "",
  };
}

function bskyPostUrl(post) {
  const rkey = (post.uri || "").split("/").pop();
  return `https://bsky.app/profile/${post.author?.handle || CONFIG.BSKY_NEWS_HANDLE}/post/${rkey}`;
}

function renderNews(list) {
  const grid = document.getElementById("newsGrid");
  const noResults = document.getElementById("newsNoResults");
  if (!grid) return;

  if (!list || list.length === 0) {
    grid.innerHTML = "";
    noResults?.classList.remove("hidden");
    return;
  }

  noResults?.classList.add("hidden");

  grid.innerHTML = list.map(n => `
    <a class="news-card" href="${escHtml(n.link)}" target="_blank" rel="noopener">
      ${n.thumb ? `<div class="news-thumb" style="background-image:url('${escHtml(n.thumb)}')"></div>` : ""}
      <div class="news-body">
        ${n.date ? `<span class="news-date">${escHtml(formatNewsDate(n.date))}</span>` : ""}
        <h3 class="news-title">${escHtml(n.title)}</h3>
        <p class="news-desc">${escHtml(truncateText(n.description, 160))}</p>
        <span class="news-cta">${currentLang === "en" ? "Read more →" : "Leer más →"}</span>
      </div>
    </a>
  `).join("");
}

function truncateText(str, len) {
  if (!str) return "";
  return str.length > len ? str.substring(0, len) + "…" : str;
}

function formatNewsDate(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(currentLang === "en" ? "en-US" : "es-VE", { year: "numeric", month: "short", day: "numeric" });
}

// Load sample data when Sheet is not configured yet
function loadSampleData() {
  allResources = [
    {
      "Resource Name": "Free Structural Evaluation",
      "Nombre del Recurso": "Evaluación Estructural Gratuita",
      "Category": "Building Inspection",
      "Categoria": "Inspección de Viviendas y Edificaciones",
      "Description": "If your home or building has sustained damage from the earthquake, a team of volunteer civil engineers can perform a free structural evaluation.",
      "Descripción": "Si tu vivienda o edificio presenta daños tras el terremoto, un equipo de ingenieros civiles voluntarios puede realizar una evaluación estructural gratuita.",
      "Location": "Caracas, Venezuela",
      "Contact (all in one cell: phone / WhatsApp / email / website / socials)": "https://docs.google.com/forms/d/e/1FAIpQLSc4iB8f_SiQxTEbiAh3uUutuDNPYZWsyOTtaumroCGSmih-7w/viewform",
      "Cost (Free / Paid / Unknown)": "Free",
      "Last Verified": "06/27/2026"
    },
    {
      "Resource Name": "Entre Amigos por Venezuela – Emergency Relief Fund",
      "Nombre del Recurso": "Entre Amigos por Venezuela – Fondo de Ayuda de Emergencia",
      "Category": "Donations",
      "Categoria": "Donaciones",
      "Description": "Young volunteers working in direct contact with first responders to identify real needs and deliver aid quickly. Full transparency on all purchases and deliveries.",
      "Descripción": "Jóvenes voluntarios que trabajan en contacto directo con personas en primera línea para identificar necesidades reales y hacer llegar la ayuda rápidamente.",
      "Location": "Venezuela (remote / diaspora-led)",
      "Contact (all in one cell: phone / WhatsApp / email / website / socials)": "https://www.gofundme.com/f/emergency-relief-for-venezuela-earthquake-victims-5h6nu / IG: https://www.instagram.com/entreamigosporvzla/",
      "Cost (Free / Paid / Unknown)": "Free",
      "Last Verified": "06/27/2026"
    },
    {
      "Resource Name": "Hospitales en Venezuela – Patient Registry",
      "Nombre del Recurso": "Hospitales en Venezuela – Registro de Pacientes",
      "Category": "Medical Care",
      "Categoria": "Atención Médica",
      "Description": "Website to view and add patient information from hospitals across Venezuela following the earthquake.",
      "Descripción": "Sitio web para consultar y agregar información de pacientes en hospitales de Venezuela tras el terremoto.",
      "Location": "Venezuela (nationwide)",
      "Contact (all in one cell: phone / WhatsApp / email / website / socials)": "https://hospitalesenvenezuela.com/",
      "Cost (Free / Paid / Unknown)": "Free",
      "Last Verified": "06/27/2026"
    },
    {
      "Resource Name": "Missing Persons Registry – Venezuela Earthquake",
      "Nombre del Recurso": "Registro de Desaparecidos – Terremoto Venezuela",
      "Category": "Missing Persons",
      "Categoria": "Personas Desaparecidas",
      "Description": "A platform to help reconnect families after the earthquake. Confirm someone is safe or report someone you cannot reach.",
      "Descripción": "Plataforma para reconectar familias tras el terremoto. Confirma que alguien está a salvo o repórtalo si no puedes comunicarte.",
      "Location": "Venezuela (nationwide)",
      "Contact (all in one cell: phone / WhatsApp / email / website / socials)": "https://desaparecidosterremotovenezuela.com/",
      "Cost (Free / Paid / Unknown)": "Free",
      "Last Verified": "06/27/2026"
    },
    {
      "Resource Name": "Por Venezuela – Psychological First Aid",
      "Nombre del Recurso": "Por Venezuela – Primeros Auxilios Psicológicos",
      "Category": "Mental Health",
      "Categoria": "Salud Mental",
      "Description": "A team of volunteer professionals offering free psychological first aid to those affected by the earthquake in Venezuela.",
      "Descripción": "Equipo de profesionales voluntarios que ofrece primeros auxilios psicológicos gratuitos a los afectados por el terremoto en Venezuela.",
      "Location": "Remote",
      "Contact (all in one cell: phone / WhatsApp / email / website / socials)": "https://linktr.ee/m.parejap96",
      "Cost (Free / Paid / Unknown)": "Free",
      "Last Verified": "06/27/2026"
    },
  ];
  dataLoaded = true;
  populateFilters();
  renderCategoryGrid();
  filterResources();
}

// ============================================================
//  FILTERS
// ============================================================

function populateFilters() {
  const catFilter = document.getElementById("categoryFilter");
  const locFilter = document.getElementById("locationFilter");
  if (!catFilter || !locFilter) return;

  // Keep first (all) option
  while (catFilter.options.length > 1) catFilter.remove(1);
  while (locFilter.options.length > 1) locFilter.remove(1);

  const cats = [...new Set(allResources.flatMap(getCategoriesOf))];
  cats.sort().forEach(cat => {
    const catObj = getCategoryObj(cat);
    const opt = document.createElement("option");
    opt.value = cat;
    opt.text = currentLang === "en" ? catObj.en : catObj.es;
    catFilter.add(opt);
  });

  const locs = [...new Set(allResources.map(r => r["Location"]).filter(Boolean))];
  locs.sort().forEach(loc => {
    const opt = document.createElement("option");
    opt.value = loc;
    opt.text = loc;
    locFilter.add(opt);
  });

  // Restore active category and location if set (e.g. from a shared URL or a
  // previous selection) — both must survive a dropdown rebuild (e.g. on auto-refresh).
  if (activeCategory) {
    catFilter.value = activeCategory;
  }
  if (pendingLocationFilter) {
    activeLocation = pendingLocationFilter;
    pendingLocationFilter = ""; // consume it — don't reapply on every future populateFilters call
  }
  if (activeLocation) {
    locFilter.value = activeLocation;
  }
}

function filterResources(fromUserInteraction = false) {
  const query = (document.getElementById("searchInput")?.value || "").toLowerCase();
  // Before data loads, keep activeCategory as set from URL params — don't let an empty
  // dropdown overwrite it. After data loads, always read from the dropdown normally.
  const category = dataLoaded
    ? (document.getElementById("categoryFilter")?.value || "")
    : activeCategory;
  const location = dataLoaded
    ? (document.getElementById("locationFilter")?.value || "")
    : (pendingLocationFilter || "");
  if (dataLoaded) activeCategory = category;
  if (dataLoaded) activeLocation = location;

  const filtered = allResources.filter(r => {
    const nameEn = (r["Resource Name"] || "").toLowerCase();
    const nameEs = (r["Nombre del Recurso"] || "").toLowerCase();
    const descEn = (r["Description"] || "").toLowerCase();
    const descEs = (r["Descripción"] || "").toLowerCase();
    const loc = (r["Location"] || "").toLowerCase();

    const matchesQuery = !query ||
      nameEn.includes(query) || nameEs.includes(query) ||
      descEn.includes(query) || descEs.includes(query) ||
      loc.includes(query);
    const matchesCat = !category || getCategoriesOf(r).includes(category);
    const matchesLoc = !location || r["Location"] === location;

    return matchesQuery && matchesCat && matchesLoc;
  });

  renderResources(filtered);

  // Only sync URL after data has loaded — prevents overwriting shared link params on initial page load
  if (dataLoaded && document.getElementById("page-resources")?.classList.contains("active")) {
    const params = new URLSearchParams();
    if (category) params.set("categoria", category);
    if (location) params.set("ubicacion", location);
    if (query) params.set("buscar", query);

    updateHashParams(params, fromUserInteraction);
  }
}

// ============================================================
//  RENDER RESOURCE CARDS
// ============================================================

// Generate a URL-safe slug from a resource name
function slugify(str) {
  return (str || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // strip accents
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 60);
}

// Find a resource by slug across allResources
function findResourceBySlug(slug) {
  return allResources.find(r => {
    const en = r["Resource Name"] || "";
    const es = r["Nombre del Recurso"] || "";
    return slugify(en) === slug || slugify(es) === slug;
  });
}

function renderResources(resources) {
  const grid = document.getElementById("resourceGrid");
  const noResults = document.getElementById("noResults");
  const status = document.getElementById("resourcesStatus");
  if (!grid) return;

  if (!resources || resources.length === 0) {
    grid.innerHTML = "";
    noResults?.classList.remove("hidden");
    return;
  }

  noResults?.classList.add("hidden");
  status?.classList.add("hidden");

  // Store filtered list globally so modal can look up by filtered index
  window._currentFilteredResources = resources;

  grid.innerHTML = resources.map((r, idx) => {
    const name = currentLang === "en" ? (r["Resource Name"] || r["Nombre del Recurso"]) : (r["Nombre del Recurso"] || r["Resource Name"]);
    const desc = currentLang === "en" ? (r["Description"] || r["Descripción"]) : (r["Descripción"] || r["Description"]);
    const catObjs = getCategoriesOf(r).map(getCategoryObj);
    const location = r["Location"] || "";
    const cost = r["Cost (Free / Paid / Unknown)"] || "";
    const verified = r["Last Verified"] || "";

    const costLabel = getCostLabel(cost);
    const shortDesc = desc.length > 120 ? desc.substring(0, 120) + "…" : desc;

    // Build a shareable URL for this specific resource
    const slug = slugify(r["Resource Name"] || r["Nombre del Recurso"]);
    const cardUrl = `/?recurso=${encodeURIComponent(slug)}#recursos`;

    return `
      <a class="resource-card" href="${cardUrl}" onclick="openModal(${idx}, true, event)">
        <div class="card-header">
          <div class="card-categories">
            ${catObjs.map(catObj => `
              <span class="card-category">
                <span class="card-category-icon">${catObj.icon}</span>
                ${escHtml(currentLang === "en" ? catObj.en : catObj.es)}
              </span>
            `).join("")}
          </div>
          <span class="card-cost ${cost.toLowerCase()}">${costLabel}</span>
        </div>
        <h3 class="card-title">${escHtml(name)}</h3>
        <p class="card-desc">${escHtml(shortDesc)}</p>
        <div class="card-footer">
          ${location ? `<span class="card-location">📍 ${escHtml(location)}</span>` : ""}
          ${verified ? `<span class="card-verified">${currentLang === "en" ? "Verified" : "Verificado"}: ${escHtml(verified)}</span>` : ""}
        </div>
        <div class="card-cta">${currentLang === "en" ? "View details →" : "Ver detalles →"}</div>
      </a>
    `;
  }).join("");
}

function getCostLabel(cost) {
  if (!cost) return "";
  const c = cost.toLowerCase();
  if (c === "free") return currentLang === "en" ? "Free" : "Gratuito";
  if (c === "paid") return currentLang === "en" ? "Paid" : "Con costo";
  return currentLang === "en" ? "Unknown" : "Desconocido";
}

function escHtml(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================
//  MODAL
// ============================================================

function openModal(idx, fromFiltered, event) {
  if (event) event.preventDefault(); // prevent <a> tag from navigating
  const list = fromFiltered && window._currentFilteredResources ? window._currentFilteredResources : allResources;
  const r = list[idx];
  if (!r) return;

  // Push resource URL so it's shareable
  const slug = slugify(r["Resource Name"] || r["Nombre del Recurso"]);
  const resourceUrl = `/?recurso=${encodeURIComponent(slug)}#recursos`;
  history.pushState({ recurso: slug }, "", resourceUrl);

  const name = currentLang === "en" ? (r["Resource Name"] || r["Nombre del Recurso"]) : (r["Nombre del Recurso"] || r["Resource Name"]);
  const desc = currentLang === "en" ? (r["Description"] || r["Descripción"]) : (r["Descripción"] || r["Description"]);
  const catObjs = getCategoriesOf(r).map(getCategoryObj);
  const location = r["Location"] || "";
  const cost = r["Cost (Free / Paid / Unknown)"] || "";
  const contact = r["Contact (all in one cell: phone / WhatsApp / email / website / socials)"] || "";
  const verified = r["Last Verified"] || "";

  const costLabel = getCostLabel(cost);
  const contactHtml = renderContactLinks(contact);

  const modalContent = document.getElementById("modalContent");
  modalContent.innerHTML = `
    <div class="modal-category">
      <div class="modal-categories">
        ${catObjs.map(catObj => `
          <span class="modal-category-chip">
            <span>${catObj.icon}</span>
            <span>${escHtml(currentLang === "en" ? catObj.en : catObj.es)}</span>
          </span>
        `).join("")}
      </div>
      <span class="card-cost ${cost.toLowerCase()}">${costLabel}</span>
    </div>
    <h2 class="modal-title">${escHtml(name)}</h2>
    ${location ? `<p class="modal-location">📍 ${escHtml(location)}</p>` : ""}
    <div class="modal-divider"></div>
    <p class="modal-desc">${escHtml(desc)}</p>
    ${contact ? `
      <div class="modal-section">
        <h4>${currentLang === "en" ? "Contact" : "Contacto"}</h4>
        <div class="modal-contact">${contactHtml}</div>
      </div>
    ` : ""}
    ${verified ? `
      <p class="modal-verified">${currentLang === "en" ? "Last verified" : "Última verificación"}: ${escHtml(verified)}</p>
    ` : ""}
    <p class="modal-disclaimer">${currentLang === "en"
      ? "Always confirm details directly with the organization before acting on this information."
      : "Confirma siempre los datos directamente con la organización antes de actuar sobre esta información."
    }</p>
  `;

  document.getElementById("resourceModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function renderContactLinks(contact) {
  if (!contact) return "";
  const parts = contact.split(" / ").map(p => p.trim()).filter(Boolean);
  return parts.map(part => {
    if (part.startsWith("http://") || part.startsWith("https://")) {
      let label = currentLang === "en" ? "Website" : "Sitio web";
      if (part.includes("instagram.com")) label = "Instagram";
      else if (part.includes("facebook.com")) label = "Facebook";
      else if (part.includes("wa.me") || part.includes("whatsapp.com/channel") || part.includes("whatsapp.com")) label = "WhatsApp";
      else if (part.includes("t.me") || part.includes("telegram.me") || part.includes("telegram.org")) label = "Telegram";
      else if (part.includes("gofundme.com")) label = "GoFundMe";
      else if (part.includes("linktr.ee")) label = "Linktree";
      else if (part.includes("google.com/forms") || part.includes("docs.google.com/forms")) label = currentLang === "en" ? "Open Form" : "Abrir Formulario";
      else if (part.includes("twitter.com") || part.includes("x.com")) label = "X / Twitter";
      else if (part.includes("youtube.com")) label = "YouTube";
      else if (part.includes("tiktok.com")) label = "TikTok";
      // Everything else is a website — already defaulted above
      return `<a href="${escHtml(part)}" target="_blank" rel="noopener" class="contact-link">${label} ↗</a>`;
    } else if (part.startsWith("IG:")) {
      const url = part.replace("IG:", "").trim();
      return `<a href="${escHtml(url)}" target="_blank" rel="noopener" class="contact-link">Instagram ↗</a>`;
    } else if (/^\+?[\d\s\-().]+$/.test(part)) {
      return `<a href="tel:${part.replace(/\s/g, '')}" class="contact-link">📞 ${escHtml(part)}</a>`;
    } else {
      return `<span class="contact-text">${escHtml(part)}</span>`;
    }
  }).join("");
}

function closeModal(event) {
  if (event.target === document.getElementById("resourceModal")) {
    closeModalBtn();
  }
}

function closeModalBtn() {
  document.getElementById("resourceModal").classList.add("hidden");
  document.body.style.overflow = "";
  // Restore URL to the resources page (without the recurso param), preserving
  // whatever category/location/search filters are still active
  const params = new URLSearchParams();
  if (activeCategory) params.set("categoria", activeCategory);
  if (activeLocation) params.set("ubicacion", activeLocation);
  const query = document.getElementById("searchInput")?.value || "";
  if (query) params.set("buscar", query);
  updateHashParams(params, false);
}

document.addEventListener("keydown", e => {
  if (e.key === "Escape") closeModalBtn();
});

// ============================================================
//  SUBMIT FORM SETUP
// ============================================================

function setupForm() {
  const iframe = document.getElementById("googleFormIframe");
  const placeholder = document.getElementById("formPlaceholder");
  const directLink = document.getElementById("formDirectLink");

  if (CONFIG.FORM_EMBED_URL && CONFIG.FORM_EMBED_URL !== "YOUR_GOOGLE_FORM_EMBED_URL_HERE") {
    iframe.src = CONFIG.FORM_EMBED_URL;
    iframe.classList.remove("hidden");
    placeholder?.classList.add("hidden");
  } else {
    iframe.classList.add("hidden");
    placeholder?.classList.remove("hidden");
  }

  if (directLink && CONFIG.FORM_DIRECT_URL && CONFIG.FORM_DIRECT_URL !== "YOUR_GOOGLE_FORM_DIRECT_URL_HERE") {
    directLink.href = CONFIG.FORM_DIRECT_URL;
  }
}

// ============================================================
//  INIT
// ============================================================

document.addEventListener("DOMContentLoaded", () => {
  applyLang(); // already renders the category grid
  loadResources();
  loadNews();

  // Route to correct page based on URL hash on load
  navigateFromHash();

  // Auto-refresh
  if (CONFIG.REFRESH_INTERVAL_MS) {
    setInterval(loadResources, CONFIG.REFRESH_INTERVAL_MS);
    setInterval(loadNews, CONFIG.REFRESH_INTERVAL_MS);
  }
});
