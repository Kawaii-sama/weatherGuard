# WeatherGuard ☁️☀️

An invite-only weather alert service I built from scratch. Users sign in with Google or GitHub, request access, and once an admin approves them, they start getting weather alerts straight to their Telegram — twice a day, every day.

```
/api    NestJS backend  (auth, approval flow, Telegram bot, BullMQ scheduling)
/admin  React frontend  (kawaii admin dashboard + user status page)
```

---

## What it does

The idea is simple: not everyone should get alerts, only people the admin approves. So the flow is:

1. User signs in with Google or GitHub
2. They link their Telegram account via a one-time deep link
3. Admin reviews the request and approves (or rejects) them
4. Once approved + linked, they get weather alerts at **8:00 AM** and **6:00 PM** every day
5. Admin can also send a test alert instantly from the dashboard

Each alert includes temperature, feels-like, humidity, wind speed, and visibility — not just "it's cloudy."

---

## System design

### Database (MongoDB)

Two collections — `User` and `AlertLog`. I kept it simple on purpose.

```
┌─────────────────────────────┐        ┌──────────────────────────────┐
│ User                        │        │ AlertLog                     │
├─────────────────────────────┤        ├──────────────────────────────┤
│ _id                         │◄───┐   │ _id                          │
│ email            (unique)   │    │   │ userId      → User._id       │
│ name                        │    └───┤ city                         │
│ avatarUrl                   │        │ temperatureCelsius           │
│ provider     google|github  │        │ condition                    │
│ providerId                  │        │ message                      │
│ role         user|admin     │        │ status      sent|failed      │
│ status   pending|approved|  │        │ errorMessage?                │
│              rejected       │        │ simulated    boolean         │
│ city                        │        │ triggeredManually  boolean   │
│ requestNote?                │        │ createdAt                    │
│ telegramChatId?             │        └──────────────────────────────┘
│ telegramLinked  boolean     │
│ telegramLinkToken?          │
│ approvedAt? / approvedBy?   │
│ rejectedAt? / rejectedBy?   │
│ createdAt / updatedAt       │
└─────────────────────────────┘
```

No separate "access requests" table — the `status` field on `User` IS the request state machine. When the broadcaster runs, it just queries `{ status: 'approved', telegramLinked: true }` — one query, no joins.

`AlertLog` is separate because it grows fast and has a completely different access pattern (recent-first feed). Embedding it on the user document would make every user record balloon over time.

### Why Telegram linking works the way it does

Telegram's Bot API never tells you who a user is until they message the bot first. So I generate a one-time UUID token per user, embed it in a deep link (`t.me/<bot>?start=<token>`), and when the bot receives `/start <token>`, it resolves back to the right user and stores their `chatId`. Token is cleared after use so the link can't be replayed.

### Backend module structure (NestJS)

```
AppModule
├── AuthModule      Google + GitHub OAuth strategies, JWT
├── UsersModule     User schema, approval workflow
├── TelegramModule  Bot lifecycle, account linking, message delivery
├── WeatherModule   OpenWeatherMap integration + simulated fallback
└── AlertsModule    BullMQ scheduling, broadcast logic, AlertLog
```

A few intentional design choices worth noting:

- `UsersModule` never imports `TelegramModule`. Instead, `UsersService.approve()` emits a `user.approved` event that `TelegramService` listens for. This keeps the dependency graph clean — you could rip out the entire Telegram integration and the approval flow still works.

- `AlertsService.deliverAlertToUser()` is the **only** place that calls `TelegramService.sendMessage()` with a weather message. Both the scheduled broadcast and the manual test button funnel through it. It re-checks `status === approved && telegramLinked` every time before sending — defense in depth.

### Why BullMQ instead of node-cron

BullMQ repeatable jobs survive restarts without double-scheduling (I clear the existing job by ID on boot before re-adding it). The admin "Send Now" button reuses the exact same queue and worker — no second code path to maintain. And if one user's delivery fails, it doesn't affect anyone else in the batch.

---

## Getting started

### What you'll need

- Node.js 20+
- MongoDB (local or [Atlas free tier](https://www.mongodb.com/atlas))
- Redis (local or [Upstash free tier](https://upstash.com))
- A Telegram bot token — message [@BotFather](https://t.me/botfather) → `/newbot`
- Google OAuth credentials — [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
- GitHub OAuth credentials — [github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps

> OpenWeatherMap API key is **optional**. Without one, the weather service falls back to a deterministic simulated forecast so the whole pipeline is fully demoable with zero paid APIs.

### Backend

```bash
cd api
cp .env.example .env
# fill in MONGODB_URI, REDIS_URL, JWT_SECRET, ADMIN_EMAILS, OAuth + Telegram creds
npm install
npm run start:dev
```

Set your own email in `ADMIN_EMAILS` and your first login auto-promotes you to admin — no database tinkering needed.

Swagger docs available at `http://localhost:3000/docs`.

### Frontend

```bash
cd admin
cp .env.example .env
# set VITE_API_URL if your API isn't on localhost:3000
npm install
npm run dev
```

Visit `http://localhost:5173`.

### Quickest start — Docker Compose

```bash
cp api/.env.example api/.env   # fill in your credentials
docker compose up --build
```

Spins up MongoDB, Redis, the API, and the frontend all at once.

### Testing the full flow locally

1. Go to `/login` and sign in with Google or GitHub. If your email is in `ADMIN_EMAILS` you'll land on the admin dashboard. Otherwise you'll land on the pending page.
2. As a non-admin user, set your city and connect Telegram — you can do it from desktop (opens the bot directly) or mobile (copy the link and send it to yourself).
3. As admin, go to **Requests → Pending**, find the user, and click **Approve**. If they're already Telegram-linked, they'll get a notification instantly.
4. Go to **Alerts → Send test alert**, pick the user, and fire it off. They'll get a full weather alert with temperature, humidity, wind, and more.
5. **Send broadcast now** manually triggers the same job that runs automatically at 8 AM and 6 PM.

---

## Deploying

### API → Render
The repo includes a `render.yaml` blueprint. Push to GitHub, connect to Render, and it provisions the API + a managed Redis instance automatically. Uses long polling for the Telegram bot so it needs a persistent server, not serverless.

### Frontend → Vercel
`admin/vercel.json` is already included for client-side routing. Connect your repo to Vercel and it deploys on every push.

### Database → MongoDB Atlas
Free 512MB cluster. Create one at [mongodb.com/atlas](https://www.mongodb.com/atlas), grab the connection string, and drop it in `MONGODB_URI`.

After deploying, remember to:
- Set `FRONTEND_URL` on the API to your Vercel URL (for CORS + OAuth redirects)
- Set `VITE_API_URL` on the frontend to your Render URL
- Update the Google/GitHub OAuth callback URLs to your deployed domains

Step-by-step deployment commands are in [`DEPLOYMENT.md`](./DEPLOYMENT.md).