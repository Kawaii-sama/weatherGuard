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
  // React Router helper for reading the query string.
  const [searchParams] = useSearchParams();
  // Router navigation helper used after onboarding the auth token.
  const navigate = useNavigate();
  // Auth context helper to refresh the authenticated user state.
  const { refresh } = useAuth();
  // Local error message shown if the callback URL is missing a token.
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Expect `?token=...` from the auth provider redirect.
    const token = searchParams.get('token');

    if (!token) {
      setError('No sign-in token was returned. Please try signing in again.');
      return;
    }

    // Persist the token and update auth state, then send the user home.
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
