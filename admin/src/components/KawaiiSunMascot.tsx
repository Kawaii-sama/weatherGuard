interface KawaiiSunMascotProps {
  mood?: 'sleepy' | 'sparkly' | 'heart-eyes';
  size?: number;
  className?: string;
}

/**
 * The one signature element WeatherGuard Admin is built around. Everything
 * else in the UI stays quiet so this gets to be the memorable bit.
 *
 * - sleepy: nothing needs attention (zero pending requests, login screen)
 * - sparkly: there's pending work waiting on an admin
 * - heart-eyes: a celebratory moment (just got approved, alert delivered)
 */
export function KawaiiSunMascot({ mood = 'sleepy', size = 96, className = '' }: KawaiiSunMascotProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`animate-bob ${className}`}
      role="img"
      aria-label={
        mood === 'sleepy'
          ? 'A sleepy kawaii sun, all caught up'
          : mood === 'sparkly'
            ? 'An excited kawaii sun, there is something to look at'
            : 'A delighted kawaii sun with heart eyes'
      }
    >
      {/* Rays */}
      <g fill="#FFE8A3">
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * 360;
          return (
            <rect
              key={i}
              x="57"
              y="2"
              width="6"
              height="16"
              rx="3"
              transform={`rotate(${angle} 60 60)`}
            />
          );
        })}
      </g>

      {/* Face */}
      <circle cx="60" cy="60" r="34" fill="#FFE8A3" stroke="#F7CE68" strokeWidth="2" />

      {/* Blush */}
      <ellipse cx="42" cy="68" rx="6" ry="3.5" fill="#FFB4B4" opacity="0.7" />
      <ellipse cx="78" cy="68" rx="6" ry="3.5" fill="#FFB4B4" opacity="0.7" />

      {mood === 'sleepy' && (
        <>
          <path d="M44 56 q6 -8 12 0" stroke="#4A4063" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M64 56 q6 -8 12 0" stroke="#4A4063" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M50 72 q10 6 20 0" stroke="#4A4063" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}

      {mood === 'sparkly' && (
        <>
          <circle cx="50" cy="58" r="4.5" fill="#4A4063" />
          <circle cx="70" cy="58" r="4.5" fill="#4A4063" />
          <circle cx="48.5" cy="56.5" r="1.4" fill="#FFFFFF" />
          <circle cx="68.5" cy="56.5" r="1.4" fill="#FFFFFF" />
          <path d="M48 74 q12 10 24 0" stroke="#4A4063" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Sparkle */}
          <path
            d="M92 38 l2.4 6 6 2.4 -6 2.4 -2.4 6 -2.4 -6 -6 -2.4 6 -2.4 z"
            fill="#FFD6E8"
          />
        </>
      )}

      {mood === 'heart-eyes' && (
        <>
          {[50, 70].map((cx) => (
            <path
              key={cx}
              d={`M${cx} 62 c-3 -6 -11 -3 -8 3 c2 4 8 7 8 9 c0 -2 6 -5 8 -9 c3 -6 -5 -9 -8 -3 z`}
              fill="#FFB4B4"
            />
          ))}
          <path d="M48 76 q12 8 24 0" stroke="#4A4063" strokeWidth="3" fill="none" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
