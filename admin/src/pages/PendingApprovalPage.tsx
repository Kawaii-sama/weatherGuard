import { useState } from 'react';
import { KawaiiCloud } from '../components/KawaiiCloud';
import { KawaiiSunMascot } from '../components/KawaiiSunMascot';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { api, ApiRequestError } from '../api/client';
import { TelegramConnect } from '../components/TelegramConnect';

export function PendingApprovalPage() {
  const { user, refresh } = useAuth();
  const [city, setCity] = useState(user?.city ?? '');
  const [note, setNote] = useState(user?.requestNote ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  if (!user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updateMe({ city, requestNote: note });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not save your preferences.');
    } finally {
      setSaving(false);
    }
  };

  const mood = user.status === 'approved' ? 'heart-eyes' : 'sparkly';

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky via-[#DFF4FF] to-cloud px-6 py-12">
      <KawaiiCloud className="absolute top-8 right-[-6%] w-64 animate-drift opacity-80" />
      <KawaiiCloud className="absolute bottom-10 left-[-6%] w-56 animate-drift-slow opacity-70" tone="sky" />
      {/* pastel decorations */}
      <span className="absolute" style={{ top: '12%', left: '4%', fontSize: '2rem', opacity: 0.18 }}>🌿</span>
      <span className="absolute" style={{ top: '30%', right: '3%', fontSize: '1.6rem', opacity: 0.15 }}>🌸</span>
      <span className="absolute" style={{ top: '55%', left: '2%', fontSize: '1.8rem', opacity: 0.15 }}>🍃</span>
      <span className="absolute" style={{ top: '70%', right: '5%', fontSize: '1.5rem', opacity: 0.13 }}>🌱</span>
      <span className="absolute" style={{ bottom: '15%', left: '6%', fontSize: '1.6rem', opacity: 0.12 }}>🌷</span>
      <span className="absolute" style={{ bottom: '8%', right: '8%', fontSize: '1.4rem', opacity: 0.13 }}>🌾</span>

      <div className="relative max-w-lg mx-auto">
        <div className="kawaii-card px-8 py-10 text-center mb-6">
          <div className="flex justify-center mb-4">
            <KawaiiSunMascot mood={mood} size={88} />
          </div>
          <h1 className="text-2xl font-display font-extrabold mb-1">Hi, {user.name.split(' ')[0]}!</h1>
          <div className="flex justify-center mb-4">
            <StatusBadge status={user.status} />
          </div>

          {user.status === 'pending' && (
            <p className="text-ink-soft font-body">
              Your request is in for review. An admin will approve you soon — we'll let you know the
              moment that happens, right here on Telegram.
            </p>
          )}
          {user.status === 'approved' && (
            <p className="text-ink-soft font-body">
              You're all set! Weather alerts for your city go straight to your linked Telegram
              account.
            </p>
          )}
          {user.status === 'rejected' && (
            <p className="text-ink-soft font-body">
              Your request wasn't approved this time. Reach out to an admin if you think this was a
              mistake.
            </p>
          )}
        </div>

        {user.status !== 'rejected' && (
          <div className="kawaii-card px-8 py-8 mb-6">
            <h2 className="font-display font-bold text-lg mb-1">
              {user.telegramLinked ? 'Telegram linked ✓' : 'Link your Telegram'}
            </h2>
            {user.telegramLinked ? (
              <p className="text-ink-soft font-body text-sm">
                Alerts for <strong>{user.city}</strong> will arrive in your linked Telegram chat.
              </p>
            ) : (
              <>
                <TelegramConnect deepLink={user.telegramDeepLink} />
              </>
            )}
          </div>
        )}

        {user.status !== 'rejected' && (
          <form onSubmit={handleSave} className="kawaii-card px-8 py-8">
            <h2 className="font-display font-bold text-lg mb-4">Alert preferences</h2>

            <label className="block text-sm font-display font-semibold mb-1" htmlFor="city">
              City for weather alerts
            </label>
            <input
              id="city"
              className="kawaii-input mb-4"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="London"
            />

            <label className="block text-sm font-display font-semibold mb-1" htmlFor="note">
              Note to the admin (optional)
            </label>
            <textarea
              id="note"
              className="kawaii-input mb-4"
              rows={3}
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Anything you'd like the admin to know about your request."
            />

            {error && <p className="text-sm text-[#C0392B] mb-3">{error}</p>}
            {saved && !error && <p className="text-sm text-[#2F8F5B] mb-3">Saved!</p>}

            <button type="submit" className="kawaii-btn-primary w-full" disabled={saving}>
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
