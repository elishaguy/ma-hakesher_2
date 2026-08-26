# מה הקשר? — Version 2 (experimental sandbox)

This folder started as an exact copy of your live "מה הקשר" site, and now
also includes the backend features from `fixes_v4.md` (items 3–6): **short
links, creators seeing their own past games, your own admin dashboard with a
copy of every board created, and per-board play analytics.** It exists so
none of this ever touches or risks your real, live site.

Deploy it as its own separate website (steps below), and you'll have **two
independent live sites**, each with its own link:

- Your original site keeps running exactly as it does today, for anyone
  already using it.
- This v2 site is where new, riskier features get built and tested. If
  something breaks here, it doesn't affect the original at all.

This guide assumes you've already set up the original site once before, but
it repeats every step in full — nothing is assumed.

---

## Step 1 — Confirm you have a GitHub account

You already made one when you set up the original site. If so, skip to Step 2.

If not:
1. Go to github.com and click **Sign up**.
2. Follow the prompts (email, password, username). Verify your email if asked.

---

## Step 2 — Create a brand-new, separate repository for v2

**Important:** this must be a **different repository** from your original
one — you cannot reuse the same repo name.

1. Once logged in to github.com, click the **+** icon top-right → **New repository**.
2. Repository name: something clearly different from your original, e.g.
   `meha-kesher-v2` (avoid spaces).
3. Keep it **Public** (required for free GitHub Pages) — unless you've since
   set up a private-repo hosting alternative, in which case use that same
   setup here too.
4. Leave everything else as default. Click **Create repository**.

---

## Step 3 — Upload the v2 files

1. On your new (empty) repository page, click **uploading an existing
   file** (a blue link in the middle of the page).
2. Open the `connections_idea_v2` folder on your computer in Finder.
3. Select **all the files inside it** — `index.html`, `create.html`,
   `play.html`, `admin.html`, `styles.css`, `admin.css`, `util.js`, `app.js`,
   `create.js`, `admin.js`, `example-widget.js`, `data.js`,
   `supabase-config.js` — and drag them all into the browser upload area at
   once.
   - You can skip `supabase_setup.sql` and the `.md` files (`README.md`,
     `BACKEND_SETUP.md`, `connections_idea.md`, `fixes_v*.md`) if you want —
     they're setup notes for you, not part of the live site. It's also
     harmless to upload them.
4. Scroll down, add a short message like "first upload", and click
   **Commit changes**.

---

## Step 4 — Turn on GitHub Pages for this new repo

1. In this new repository, click **Settings** (top menu).
2. In the left sidebar, click **Pages**.
3. Under "Build and deployment" → "Source", choose **Deploy from a branch**.
4. Under "Branch", choose `main` and folder `/ (root)`, then click **Save**.
5. Wait about 1–2 minutes. Refresh the page — GitHub will show you a green
   box with your live link, something like:
   `https://your-username.github.io/meha-kesher-v2/`

That's it — you now have a second, fully independent live site.

- v2 home page: `https://your-username.github.io/meha-kesher-v2/`
- v2 create a game: `https://your-username.github.io/meha-kesher-v2/create.html`

---

## Step 5 — Verify it actually works

Before building anything new here, confirm v2 behaves exactly like your
original site:
1. Open the v2 home page link.
2. Click "נסו משחק לדוגמה" — the demo game should load and play normally.
3. Click "צרו משחק משלכם" — try building a small test board and generating a
   link, then open that link to make sure it plays correctly.

If all of that works, v2 is live and fully functional using the same
link-only approach as v1 (nothing broken, nothing missing) — it just doesn't
have the new backend features turned on yet.

---

## Step 6 — Turn on the backend features (short links, admin dashboard, analytics)

This needs a one-time setup of a free database (Supabase) that only you can
do, since it involves creating your own account and private keys. Follow
**`BACKEND_SETUP.md`** in this folder for the full step-by-step walkthrough
— it takes about 15 minutes.

Until you do that, the site works exactly like v1 (long self-contained
links, no admin panel, no analytics) — everything degrades gracefully, so
there's no rush and nothing breaks in the meantime.

---

## Updating v2 after a change

Same process as the original site — this repo has no automatic sync with
anything:
1. Go to the `meha-kesher-v2` repository on github.com.
2. Click **Add file** → **Upload files**, or drag files directly onto that page.
3. Drag in whichever files changed (or all of them — it's always safe to
   re-upload everything, GitHub just overwrites matching filenames).
   **Careful with `supabase-config.js`**: if you've already filled in your
   real Supabase URL/key, make sure you're not accidentally re-uploading a
   version with the placeholder text and overwriting your real config.
4. Add a short commit message and click **Commit changes**.
5. Wait about a minute, then refresh the live v2 site.

---

## Keeping v1 and v2 in sync (optional)

These two repos don't talk to each other. If a bug gets fixed in one, it
won't automatically appear in the other — you'd need to apply the same fix
to both repos' files and re-upload. For now, since v2 is the experimental
one, expect it to drift ahead of v1 as new features get added here.
