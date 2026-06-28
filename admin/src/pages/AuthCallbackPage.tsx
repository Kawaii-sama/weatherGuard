import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/LoadingSpinner';

/**
 * The backend redirects here as `${FRONTEND_URL}/auth/callback?token=...`
 * right after a successful Google/GitHub OAuth exchange. This page's only
 * job is to move that token out of the URL and into storage, then hand off
 * to the router — it never re-reads the URL after this first render.
 */
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setError('No sign-in token was returned. Please try signing in again.');
      return;
    }

    setToken(token);
    refresh().then(() => navigate('/', { replace: true }));
  }, [searchParams, navigate, refresh]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="kawaii-card px-8 py-10 max-w-md text-center">
          <p className="font-display font-bold text-lg mb-2">Sign-in didn't go through</p>
          <p className="text-ink-soft mb-6">{error}</p>
          <a href="/login" className="kawaii-btn-primary">
            Back to sign in
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner label="Signing you in…" />
    </div>
  );
}
