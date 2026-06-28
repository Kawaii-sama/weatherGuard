# WeatherGuard Admin ☁️☀️

An invite-only weather alert service. Users sign in with Google or GitHub,
request access, and — once an admin approves them from a web dashboard —
start receiving weather alerts on Telegram.

```
/api    NestJS backend  (auth, approval workflow, Telegram bot, scheduling)
/admin  React frontend  (kawaii admin dashboard + user-facing status page)
```

---

## 1. System design

### 1.1 Database schema (MongoDB / Mongoose)

Two collections. No separate "access request" table — a user's `status`
field *is* the request/approval state machine, which keeps "who is allowed
to receive alerts" answerable with a single query instead of a join.

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
│ city         (alert target) │        │ triggeredManually  boolean   │
│ requestNote?                │        │ createdAt                    │
│ telegramChatId?              │       └──────────────────────────────┘
│ telegramLinked     boolean  │
│ telegramLinkToken?           │
│ approvedAt? / approvedBy?   │
│ rejectedAt? / rejectedBy?   │
│ createdAt / updatedAt       │
└─────────────────────────────┘
```

**Why a single `User.status` enum instead of a separate requests table:**
the alert broadcaster's only job is "find everyone who should get a
message." With one collection that's one filter
(`status: 'approved', telegramLinked: true`) instead of joining a users
table against a requests table and reconciling state across two documents.

**Why `AlertLog` is its own collection, not an array on `User`:** it's an
append-only, fast-growing audit trail with a totally different access
pattern (recent-first feed for the admin dashboard) than the user document.
Embedding it would make every `User` document grow without bound.

**Why `telegramLinkToken` instead of asking for a phone number:** Telegram's
Bot API never exposes a user's identity until they message the bot. The
token is a one-time secret embedded in a deep link
(`t.me/<bot>?start=<token>`); when the bot receives `/start <token>`, it
resolves the token back to a `User._id` and stores the resulting `chatId`.
The token is cleared after use, so the link can't be replayed.

### 1.2 Module architecture (NestJS)

```
AppModule
├── AuthModule      Google/GitHub Passport strategies, JWT issuance
├── UsersModule      User schema + approval workflow (the source of truth)
├── TelegramModule   Bot lifecycle, account linking, outbound sends
├── WeatherModule    Live OpenWeather lookup, with a deterministic
│                    simulated fallback when no API key is configured
└── AlertsModule     BullMQ-scheduled broadcast + manual "simulate" path,
                     AlertLog
```

Each module exposes only a `Service` from its `exports`; controllers and
schemas stay private to the module that owns them. **`UsersModule` never
imports `TelegramModule`** — instead, `UsersService.approve()` emits a
`user.approved` event (`@nestjs/event-emitter`) that `TelegramService`
listens for. This keeps the dependency graph a tree instead of a cycle: you
can delete the Telegram integration entirely and the approval workflow
still compiles and works (alerts just wouldn't be deliverable).

`AlertsService` is the **only** code path that ever calls
`TelegramService.sendMessage` with a weather message — both the scheduled
broadcast (via `AlertsProcessor`, a BullMQ worker) and the admin's manual
"send test alert" button funnel through the same private
`deliverAlertToUser`, which re-checks `status === 'approved' &&
telegramLinked` immediately before sending. That single choke point is
what the next section is really about.

### 1.3 Data flow — how only "Approved" users receive alerts

There are **two independent gates**, both enforced at send time, not just
at request time:

1. **`status === 'approved'`** — set exactly once, by `UsersService.approve()`,
   which only an authenticated admin (`@Roles(UserRole.ADMIN)` +
   `RolesGuard`) can call.
2. **`telegramLinked === true`** — set exactly once, by
   `UsersService.linkTelegramAccount()`, which only runs after a user
   completes the one-time `/start <token>` deep link in Telegram.

```
 sign in (Google/GitHub)
        │
        ▼
 User created, status=PENDING ──────────────► dashboard shows "Pending"
        │                                       (UsersController list)
        │ admin clicks "Approve"
        ▼
 status=APPROVED, user.approved event fires
        │                                       ┌─────────────────────┐
        │                                       │ if telegramLinked,  │
        ├──────────────────────────────────────►│ TelegramService     │
        │                                       │ sends "you're in!"  │
        │                                       └─────────────────────┘
        ▼
 user opens t.me/<bot>?start=<token> in Telegram
        │
        ▼
 telegramLinked=true, chatId stored, token cleared (single-use)
        │
        ▼
 user now satisfies BOTH gates
        │
        ▼
 AlertsService.findApprovedAndLinked() includes them
        │
        ▼
 BullMQ repeatable job (cron from ALERT_BROADCAST_CRON) fires
        │
        ▼
 deliverAlertToUser() re-checks both gates → sends → writes AlertLog
```

A user who is `approved` but never links Telegram never receives anything
(there's no `chatId` to send to). A user who links Telegram while still
`pending` is stored as linked, but `findApprovedAndLinked()` still excludes
them — linking early doesn't grant early access. The query that decides
"who gets a message" and the function that's allowed to send a message are
the same two checks, repeated in exactly one place
(`AlertsService.deliverAlertToUser`), which is what makes the guarantee
auditable instead of "trust every caller to remember."

### 1.4 Why BullMQ over plain `node-cron`

The recurring broadcast is a BullMQ **repeatable job**
(`ALERT_BROADCAST_CRON`, default hourly) rather than a bare `node-cron`
timer, because:

- It survives a restart/redeploy without double-scheduling — `AlertsService`
  clears any existing repeatable job with the same id on boot before
  re-adding it.
- The admin's "Send broadcast now" button reuses the exact same queue and
  worker, instead of needing a second, parallel code path.
- Individual deliveries are processed one user at a time inside the worker,
  so one user's Telegram error doesn't take down the batch — every send is
  wrapped and logged independently.

---

## 2. Setup instructions

### 2.1 Prerequisites

- Node.js 20+
- A MongoDB instance (local, or a free MongoDB Atlas cluster)
- A Redis instance (local, or a free Upstash/Redis Cloud instance — required
  by BullMQ)
- A Telegram bot token (message **@BotFather** on Telegram → `/newbot`)
- Google OAuth credentials ([console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials)
- GitHub OAuth credentials ([github.com/settings/developers](https://github.com/settings/developers) → OAuth Apps)

OpenWeatherMap API key is **optional** — without one, `WeatherService` falls
back to a deterministic simulated forecast, so the entire pipeline (auth →
approval → Telegram → scheduled alert) is fully demoable with zero paid
keys.

### 2.2 Backend (`/api`)

```bash
cd api
cp .env.example .env
# fill in MONGODB_URI, REDIS_URL, JWT_SECRET, ADMIN_EMAILS, OAuth + Telegram credentials
npm install
npm run start:dev
```

`ADMIN_EMAILS` is how the first administrator account is seeded — list your
own email there, and your first sign-in auto-approves you as `admin`, with
no manual database edits required.

The API serves interactive Swagger docs at `http://localhost:3000/docs`.

### 2.3 Frontend (`/admin`)

```bash
cd admin
cp .env.example .env
# set VITE_API_URL if your API isn't on localhost:3000
npm install
npm run dev
```

Visit `http://localhost:5173`.

### 2.4 Demoing the full flow locally

1. Sign in with Google or GitHub at `/login`. If your email is in
   `ADMIN_EMAILS`, you land on `/dashboard` as an admin; otherwise you land
   on the pending-status page.
2. As a non-admin user, set a city and open the Telegram deep link shown on
   your status page; tap **Start** in Telegram.
3. As the admin, go to **Requests**, find the pending user, and click
   **Approve**. They immediately get an "approved!" message on Telegram
   (if already linked).
4. Go to **Alerts** → **Send a test alert**, pick that user, and send — this
   is the "simulated weather alert" deliverable, delivered instantly without
   waiting for the hourly broadcast.
5. **Send broadcast now** exercises the same path BullMQ runs automatically
   every `ALERT_BROADCAST_CRON`.

### 2.5 Quickest local start: Docker Compose

```bash
cp api/.env.example api/.env   # fill in your credentials
docker compose up --build
```

Spins up Mongo, Redis, the API, and the admin frontend together —
`api/Dockerfile`, `admin/Dockerfile`, and `docker-compose.yml` are already
in the repo.

### 2.6 Deploying

- **API**: Render, Railway, or Fly.io all work well for a long-running
  Node process (the Telegram bot uses long polling, so it needs a
  persistently-running server rather than serverless functions). A
  `render.yaml` blueprint is included — Render reads it automatically and
  provisions the API + a managed Redis instance in one step.
- **Admin**: Vercel or Netlify for the static Vite build. `admin/vercel.json`
  is included for client-side routing support.
- Remember to set `FRONTEND_URL` on the API (for CORS + the OAuth redirect
  target) and `VITE_API_URL` on the frontend to your deployed API URL, and
  add your deployed callback URLs to the Google/GitHub OAuth app
  configuration.
- **Exact copy-paste commands for all of the above** (git push, Render,
  Vercel) are in `DEPLOYMENT.md`.

---

## 3. Notes on scope

This was built end-to-end as source — auth, approval workflow, Telegram
bot, BullMQ scheduling, weather simulation/live lookup, and the full kawaii
admin UI — but wasn't run against a live MongoDB/Redis/Telegram/OAuth stack
in this environment (no outbound network access here), so there's no
substitute for a real `npm install` + first boot to catch anything an
offline read-through can't. Every `.ts`/`.tsx` file passed a standalone
TypeScript syntax check; what hasn't been verified is runtime behavior
against actual external services.
