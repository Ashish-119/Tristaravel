# Deploying Tristaravel to Railway + Hostinger domain

This guide takes the app live at **https://tristaravel.com** with full functionality
(quote form + fare estimate, leads stored in PostgreSQL, and the driver portal).

**Architecture:** React Router 7 (SSR) running on a Hono Node server, with a
PostgreSQL database. We deploy the app on **Railway** (builds from GitHub, runs the
container, hosts the database) and point your **Hostinger** domain at it.

> Everything below was verified against a real production build of this app: the
> server boots, the quote API writes to Postgres, and driver login + leads work.

---

## 0. What's already been prepared in this repo

These changes are done — you don't need to redo them, but here's what changed and why:

- **`build` / `start` scripts** added to `package.json` (`react-router build` /
  `node ./build/server/index.js`).
- **`Dockerfile` + `.dockerignore`** — Railway builds and runs this. Verified.
- **`railway.json`** — pins the Docker builder + a health check.
- **`.env.example`** — the full list of environment variables.
- **`.gitignore`** now excludes real `.env` files (your secret token won't leak).
- **Build fixes** (the app would not build/run in production before these):
  - removed `prerender` from `react-router.config.ts` (it pulled server code into
    the browser bundle and broke the build);
  - set the Vite build target to `es2022` (the server uses top-level `await`);
  - rewrote the API route loader (`__create/route-builder.ts`) to bundle routes via
    `import.meta.glob` instead of scanning the filesystem at runtime (the old way
    only worked under the dev server);
  - removed a server-only global `fetch` override that caused a startup deadlock;
  - the dev error overlay + favicon now resolve in production (favicon served from
    `public/`);
  - the quote API now stores `NULL` (not `undefined`) for optional fields, so blank
    emails / custom "Traveller" quotes don't error on real PostgreSQL.
- Vendored the one `../../shared` import so **`apps/web` is self-contained** and can
  be pushed on its own.

---

## 1. Get a Google Maps API key (for the fare/distance feature)

The quote form's distance + fare estimate calls Google. Lead capture still works
without it, but the estimate won't.

1. Go to <https://console.cloud.google.com> → create/select a project.
2. **APIs & Services → Library** → enable **Distance Matrix API**.
3. **APIs & Services → Credentials → Create credentials → API key.** Copy it.
4. Enable **Billing** on the project (Google requires a card; there's a large free
   tier — a small site typically pays nothing).
5. (Recommended) Restrict the key to the Distance Matrix API.

Keep this key for step 3 — it becomes `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`.

---

## 2. Push to a private GitHub repository

You can push **just the `apps/web` folder** (it's self-contained). From this folder:

```bash
# from apps/web/
git init
git add .
git commit -m "Tristaravel web app — deploy ready"
```

Create an empty **private** repo on GitHub (github.com → New repository → Private,
no README), then:

```bash
git branch -M main
git remote add origin https://github.com/<your-username>/tristaravel.git
git push -u origin main
```

> The `.gitignore` already excludes `.env`, `node_modules`, and `build`, so no
> secrets or junk get pushed. Double-check `git status` shows no `.env` before pushing.

---

## 3. Deploy on Railway

1. Sign in at <https://railway.com> with GitHub.
2. **New Project → Deploy from GitHub repo** → pick your `tristaravel` repo.
   - Railway detects the `Dockerfile` and starts building automatically.
3. **Add the database:** in the project, **New → Database → Add PostgreSQL.**
4. **Wire the database URL into the app:** open the **web service → Variables →
   New Variable**, and add a *reference*:
   - Name: `DATABASE_URL`
   - Value: `${{Postgres.DATABASE_URL}}`  (Railway autocompletes this reference)
5. **Add the other variables** (web service → Variables):
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` = your key from step 1
   - `AUTH_URL` = `https://tristaravel.com`
   - `AUTH_SECRET` = output of `openssl rand -base64 32`
   - *(Don't set `PORT` — Railway injects it and the server honors it.)*
6. Railway redeploys on save. Watch **Deployments → Logs** for
   `🚀 Server started on port …`.

### 3a. Load the database schema (once)

The new Postgres is empty. Apply the schema (it's idempotent — safe to re-run).

**Easiest — locally with the Railway DB URL:**
1. Railway → **Postgres service → Connect →** copy the **Public Network**
   connection string.
2. From `apps/web/`, append `?sslmode=require` and pipe in the schema:
   ```bash
   psql "postgres://...railway-public-url...?sslmode=require" -f db/init/01-schema.sql
   ```
   (No local `psql`? Use the **Postgres service → Data/Query** tab in the Railway
   dashboard and paste the contents of `db/init/01-schema.sql`.)

Verify three tables exist: `quotes`, `drivers`, `driver_sessions`.

---

## 4. Point your Hostinger domain at Railway

In Railway: **web service → Settings → Networking → Custom Domain.** Add
**`www.tristaravel.com`**. Railway shows a **CNAME target** like
`abcd1234.up.railway.app` — copy it.

In **Hostinger** (hPanel → **Domains → DNS / Nameservers → DNS records**):

1. Add a **CNAME** record:
   - **Type:** CNAME · **Name:** `www` · **Target/Points to:** the Railway target ·
     **TTL:** default
2. **Apex (`tristaravel.com`) → redirect to www.** Hostinger DNS can't CNAME the
   root domain, so use **hPanel → Domains → (your domain) → Redirects** and redirect
   `tristaravel.com` → `https://www.tristaravel.com`.
   - *(Alternative: if you want the bare `tristaravel.com` as primary, move your DNS
     to Cloudflare (free) which supports apex CNAME flattening, and add the same
     CNAME at the root.)*

Railway issues a free SSL certificate automatically once DNS resolves (can take a few
minutes to ~an hour). Then **https://www.tristaravel.com** is live.

> If you make `www` the canonical host, set `AUTH_URL=https://www.tristaravel.com`
> in Railway to match.

---

## 5. Create driver logins (for the /driver portal)

Run the admin script locally, pointed at the Railway database (use the **public**
connection string + `?sslmode=require`):

```bash
# from apps/web/
DATABASE_URL="postgres://...railway-public-url...?sslmode=require" \
  bun scripts/create-driver.mjs \
  --name "Ravi Kumar" --email ravi@example.com --password "a-strong-password" \
  --phone 9811112233
```

Re-running with the same email resets that driver's password and re-activates them.
Drivers then log in at **https://www.tristaravel.com/driver**.

---

## 6. Updating values later (no code changes)

- **Database URL, Maps key, domain, secrets** → edit them in **Railway → Variables**.
  Runtime variables (like the Maps key) take effect on the next deploy/restart.
- **Fare rates** (₹11/km Sedan, ₹15/km SUV) → `src/app/page.jsx` (`calcFare`).
- **Phone / email shown on the site** → `src/app/layout.jsx`.
  Change code → `git push` → Railway auto-redeploys.

---

## 7. Local development

```bash
# from apps/web/
docker compose up -d                      # start local Postgres (loads schema)
cp .env.example .env                       # then fill in values
bun install
bun run dev                                # http://localhost:4000
```

`DATABASE_URL` for local dev: `postgres://postgres:postgres@localhost:5432/anything`

---

## 8. Troubleshooting

- **Public URL doesn't load / 502:** check Railway deploy logs for
  `Server started on port …`. If it built but won't route, set the web service's
  target port to the value of `PORT` (the server logs it).
- **Quote form says "Internal server error":** usually `DATABASE_URL` is wrong/not
  referenced, or the schema wasn't applied (step 3a).
- **Fare estimate fails but the form still submits:** the Google Maps key is
  missing/restricted, or Distance Matrix API / billing isn't enabled.
- **Driver login fails:** make sure you created the driver (step 5) against the
  **same** database Railway uses.
