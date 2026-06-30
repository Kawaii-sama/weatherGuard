import { Link } from 'react-router-dom';
import { KawaiiSunMascot } from '../components/KawaiiSunMascot';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      {/* Simple 404 view for unknown routes. */}
      <div className="kawaii-card px-8 py-10 text-center max-w-sm">
        <div className="flex justify-center mb-4">
          <KawaiiSunMascot mood="sleepy" size={72} />
        </div>
        <h1 className="font-display font-extrabold text-xl mb-2">Nothing forecast here</h1>
        <p className="text-ink-soft mb-6">This page doesn't exist.</p>
        {/* Route back to the safe landing page. */}
        <Link to="/" className="kawaii-btn-primary">
          Back home
        </Link>
      </div>
    </div>
  );
}
