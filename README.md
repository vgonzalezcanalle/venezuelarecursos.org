# Venezuela Earthquake Resource Hub
## Setup & Deployment Guide

---

### Files in this project

```
index.html   — The website (all pages in one file)
styles.css   — All visual design
app.js       — Search, filter, language toggle, data loading
config.js    — YOUR SETTINGS (edit this file)
README.md    — This guide
```

---

## Step 1 — Connect your Google Sheet

1. Open your Google Sheet (`Resource_Database.xlsx` imported into Google Sheets)
2. Go to **File → Share → Publish to web**
3. In the first dropdown, choose the sheet tab: **Base de Datos (ENES)**
4. In the second dropdown, choose: **Comma-separated values (.csv)**
5. Click **Publish** and confirm
6. Copy the URL it gives you
7. Open `config.js` and paste it as the value of `SHEET_CSV_URL`

> ⚠️ Every time you add new rows to your Sheet, the site will automatically show them within 5 minutes (auto-refresh is built in). No redeployment needed.

---

## Step 2 — Set up the submission Google Form

1. Go to [forms.google.com](https://forms.google.com) and create a new form
2. Add fields matching what you want to collect (organization name, contact, description, verification source, etc.)
3. Under **Responses**, link the form to your Google Sheet (so submissions land there for you to review)
4. Click **Send → Embed (<>)** and copy the URL inside the `src="..."` attribute
5. Also copy the regular shareable link (the one without embed parameters)
6. Open `config.js` and paste:
   - The embed URL as `FORM_EMBED_URL`
   - The direct link as `FORM_DIRECT_URL`

---

## Step 3 — Deploy to GitHub Pages

1. Create a free account at [github.com](https://github.com) if you don't have one
2. Click **New repository**
3. Name it something like `venezuela-recursos` or `vzla-resource-hub`
4. Set it to **Public**
5. Upload all 5 files: `index.html`, `styles.css`, `app.js`, `config.js`, `README.md`
6. Go to **Settings → Pages**
7. Under **Source**, select **Deploy from a branch**
8. Choose **main** branch, **/ (root)** folder
9. Click **Save**

Your site will be live at:
`https://YOUR-USERNAME.github.io/YOUR-REPO-NAME`

(Takes about 1–2 minutes after saving)

---

## Step 4 — Add a custom domain (optional)

1. Buy a domain from [Namecheap](https://namecheap.com) (~$10–12/year for `.org`)
   - Suggested names: `venezuelarecursos.org`, `ayudavzla.org`, `vzlaquake.org`
2. In your GitHub repo, go to **Settings → Pages → Custom domain**
3. Enter your domain and click Save
4. In Namecheap, go to **Advanced DNS** and add these records:

| Type  | Host | Value                    |
|-------|------|--------------------------|
| A     | @    | 185.199.108.153          |
| A     | @    | 185.199.109.153          |
| A     | @    | 185.199.110.153          |
| A     | @    | 185.199.111.153          |
| CNAME | www  | YOUR-USERNAME.github.io  |

5. Check **Enforce HTTPS** in GitHub Pages settings (may take up to 24h to activate)

---

## Updating resources

You never need to touch the code again to update the directory.

- **Add resources:** Add rows to your Google Sheet. The site refreshes automatically every 5 minutes.
- **Edit resources:** Edit the row in the Sheet. Updated within 5 minutes.
- **Remove resources:** Delete the row from the Sheet.

---

## Updating the site design or content

Edit the files locally and re-upload to GitHub (or use GitHub's built-in editor for small changes).

---

## Questions or issues

Check that:
- Your Google Sheet is published to the web as CSV (Step 1)
- The CSV URL in `config.js` matches exactly what Google gave you
- Your GitHub repo is set to Public and Pages is enabled
