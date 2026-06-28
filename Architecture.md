src/
├── App.tsx           ← router only (assembles pages into routes)
├── main.tsx          ← entry point (mounts App)
├── pages/             ← one file per *route* — what the user navigates to
│   ├── LoginPage.tsx
│   ├── AuthCallbackPage.tsx
│   ├── PendingApprovalPage.tsx
│   ├── DashboardPage.tsx
│   ├── AlertsLogPage.tsx
│   └── NotFoundPage.tsx
├── components/        ← reusable building blocks, used BY multiple pages
│   ├── KawaiiSunMascot.tsx   (used on Login, Pending, AdminLayout, NotFound)
│   ├── KawaiiCloud.tsx       (used on Login, Pending)
│   ├── StatusBadge.tsx       (used on Dashboard, Pending, Alerts)
│   ├── AdminLayout.tsx       (used by Dashboard, Alerts)
│   ├── ProtectedRoute.tsx    (route guard, used by App)
│   └── LoadingSpinner.tsx    (used everywhere data loads)
├── context/AuthContext.tsx  ← global auth state, not tied to any one page
├── api/client.ts             ← all HTTP calls, not tied to any one page
└── types/index.ts            ← shared type definitions