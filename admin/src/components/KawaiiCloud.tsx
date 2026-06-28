interface KawaiiCloudProps {
  className?: string;
  tone?: 'white' | 'sky';
}

/** Purely decorative. Used only on auth/pending screens — kept off dense data screens. */
export function KawaiiCloud({ className = '', tone = 'white' }: KawaiiCloudProps) {
  const fill = tone === 'white' ? '#FFFFFF' : '#E4F6FF';

  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden="true">
      <ellipse cx="60" cy="60" rx="50" ry="32" fill={fill} />
      <ellipse cx="110" cy="48" rx="42" ry="38" fill={fill} />
      <ellipse cx="150" cy="62" rx="38" ry="28" fill={fill} />
      <ellipse cx="90" cy="74" rx="60" ry="22" fill={fill} />
    </svg>
  );
}
