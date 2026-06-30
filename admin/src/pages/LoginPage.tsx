import { KawaiiCloud } from '../components/KawaiiCloud';
import { KawaiiSunMascot } from '../components/KawaiiSunMascot';
import { api } from '../api/client';

export function LoginPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky via-[#DFF4FF] to-cloud flex items-center justify-center px-6">
      {/* Decorative floating clouds in the login background. */}
      <KawaiiCloud className="absolute top-10 left-[-5%] w-56 animate-drift-slow opacity-90" />
      <KawaiiCloud className="absolute top-32 right-[-8%] w-72 animate-drift opacity-80" tone="sky" />
      <KawaiiCloud className="absolute bottom-16 left-[10%] w-44 animate-drift opacity-70" />

      <div className="relative kawaii-card max-w-md w-full px-8 py-10 text-center">
        <div className="flex justify-center mb-4">
          <KawaiiSunMascot mood="sleepy" size={88} />
        </div>
        <h1 className="text-3xl font-display font-extrabold text-ink mb-2">WeatherGuard</h1>
        <p className="text-ink-soft font-body mb-8">
          Invite-only weather alerts, delivered with a smile. Sign in to request access — an admin
          will review you shortly after.
        </p>

        <div className="flex flex-col gap-3">
          {/* Start OAuth flows by redirecting to the backend login endpoints. */}
          <a href={api.googleLoginUrl()} className="kawaii-btn-primary w-full">
            Continue with Google
          </a>
          <a href={api.githubLoginUrl()} className="kawaii-btn-secondary w-full">
            Continue with GitHub
          </a>
        </div>

        <p className="text-xs text-ink-soft mt-8">
          New here? Signing in is also how you request access — there's no separate form.
        </p>
      </div>
    </div>
  );
}
