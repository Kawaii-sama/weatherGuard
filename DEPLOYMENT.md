# Deployment guide

Everything below is meant to be copy-pasted into your own terminal — none of
it can be run from inside Claude's sandbox (no outbound network there).

## 0. One-time accounts/credentials you'll need

| What | Where to get it |
|---|---|
| MongoDB connection string | [mongodb.com/atlas](https://www.mongodb.com/atlas) — free M0 cluster |
| Telegram bot token | Message **@BotFather** on Telegram → `/newbot` |
| Google OAuth client | [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials |
| GitHub OAuth client | [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps |
| OpenWeatherMap key (optional) | [openweathermap.org/api](https://openweathermap.org/api) — free tier. Skip it and the simulated forecaster kicks in automatically. |

## 1. Run it locally with Docker (fastest way to see it working)

```bash
cp api/.env.example api/.env
# edit api/.env and fill in the credentials from the table above

docker compose up --build
```

- API: http://localhost:3000 (Swagger docs at `/docs`)
- Admin: http://localhost:5173

Mongo and Redis run as containers automatically — no separate setup.

## 2. Push to GitHub

```bash
cd weatherguard-admin
git init
git add .
git commit -m "WeatherGuard Admin — invite-only weather alerts over Telegram"

# create the repo (pick one):
gh repo create weatherguard-admin --public --source=. --remote=origin   # GitHub CLI
# — or create an empty repo at github.com/new, then:
git remote add origin https://github.com/<your-username>/weatherguard-admin.git

git branch -M main
git push -u origin main
```

## 3. Deploy the API (Render)

1. [render.com](https://render.com) → **New** → **Blueprint** → connect your
   GitHub repo. Render reads `render.yaml` at the repo root automatically
   and provisions the API + a managed Redis instance.
2. Render will prompt for the env vars marked `sync: false` in
   `render.yaml` — paste in your Mongo URI, JWT secret, OAuth credentials,
   Telegram token, etc.
3. Set `API_URL` to your Render service URL once it's assigned (e.g.
   `https://weatherguard-api.onrender.com`) and update
   `GOOGLE_CALLBACK_URL` / `GITHUB_CALLBACK_URL` to
   `<API_URL>/auth/google/callback` / `<API_URL>/auth/github/callback`.
4. Add those same callback URLs to your Google Cloud and GitHub OAuth app
   settings (they must match exactly).

_No Render account? Railway and Fly.io both work too — `api/Dockerfile`
builds the same way on either._

## 4. Deploy the admin frontend (Vercel)

```bash
cd admin
vercel login
vercel --prod
```

Vercel auto-detects the Vite project. When prompted for environment
variables, set:

```
VITE_API_URL=<your deployed API URL from step 3>
```

`admin/vercel.json` is already in place for client-side routing (so
refreshing `/dashboard` doesn't 404).

## 5. Close the loop

Once both are deployed:

1. Set `FRONTEND_URL` on the API (Render dashboard → Environment) to your
   Vercel URL, so CORS and the post-login redirect both point at the right
   place.
2. Re-deploy the API once that's set (Render redeploys automatically on env
   var changes).
3. Visit your Vercel URL, sign in, and run through the demo flow described
   in the main `README.md`.
