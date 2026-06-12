# Deploy LifeOS AI to the web (Render) + build the Android APK

This is the end-to-end runbook. Order matters: **deploy the backend first**, then build the APK against its public URL.

---

## Part A — Push the code to GitHub (one-time)

Render deploys from a Git repo, so the code must be on GitHub. Your `.env` (with the Groq key) is git-ignored and will **not** be uploaded.

1. Create an empty repo at <https://github.com/new> (e.g. `lifeos-ai`). Don't add a README/.gitignore.
2. From the project root:

```bash
git add .
git commit -m "LifeOS AI: full stack (web + mobile + deploy config)"
git branch -M main
git remote add origin https://github.com/<you>/lifeos-ai.git
git push -u origin main
```

(First push opens a browser to authenticate via Git Credential Manager.)

---

## Part B — Deploy on Render (web + API + DB + cache)

The repo includes a **Blueprint** (`render.yaml`) that provisions everything.

1. Sign up / log in at <https://render.com> (free; GitHub login).
2. **Dashboard → New → Blueprint**, connect your GitHub account, pick the `lifeos-ai` repo. Render reads `render.yaml` and shows: `lifeos-postgres`, `lifeos-redis`, `lifeos-backend`, `lifeos-frontend`.
3. Click **Apply**. Render builds the backend Docker image and the static frontend. First build takes a few minutes.
4. When the services exist, set the three values the Blueprint left as "set in dashboard":
   - **lifeos-backend → Environment**:
     - `OPENAI_API_KEY` = your Groq key (`gsk_...`)
     - `CORS_ALLOWED_ORIGINS` = your frontend URL, e.g. `https://lifeos-frontend.onrender.com`
   - **lifeos-frontend → Environment**:
     - `VITE_API_BASE_URL` = your backend URL + `/api`, e.g. `https://lifeos-backend.onrender.com/api`
5. **Manual Deploy → Deploy latest commit** on both `lifeos-backend` and `lifeos-frontend` so the new values take effect.
6. Open the frontend URL — your app is live on the internet. Verify backend health at `https://lifeos-backend.onrender.com/actuator/health` → `{"status":"UP"}`.

### Free-tier caveats (important)
- **Free web services sleep** after ~15 min idle; the first request afterward is slow (cold start).
- **Free Postgres expires after 30 days** — upgrade to a paid instance for anything permanent.
- **512 MB RAM** on the free backend is tight for the JVM + Tika. If it OOMs/restarts, change `lifeos-backend` `plan` to `starter` (~$7/mo) in `render.yaml` (or the dashboard).
- **Uploaded documents are ephemeral** on Render (no persistent disk on free). For durable files set `STORAGE_PROVIDER=s3` + the `S3_*` env vars.

---

## Part C — Build the Android APK (Expo EAS)

The APK points at your **public** backend (already set in `mobile/eas.json` → `preview.env.EXPO_PUBLIC_API_URL`). If your backend URL differs from `https://lifeos-backend.onrender.com`, edit that value first.

1. Create a free Expo account at <https://expo.dev>.
2. From `mobile/`:

```bash
npm install -g eas-cli
eas login                 # use your Expo account
eas init                  # links the project, fills extra.eas.projectId
eas build -p android --profile preview
```

3. The build runs in Expo's cloud (~10–15 min). When done, the CLI prints a URL; open it on your phone and tap **Download** to install the `.apk`.
   - On the phone, allow "Install unknown apps" for your browser when prompted.
4. Launch the app, register/log in — it talks to your Render backend, with AI powered by your Groq key.

> Want it on the Play Store later? Use `--profile production` (builds an `.aab`) and `eas submit -p android`.

---

## Updating after changes
- **Web**: push to `main` → Render auto-deploys (`autoDeployTrigger: commit`).
- **APK**: re-run `eas build -p android --profile preview` and reinstall.
