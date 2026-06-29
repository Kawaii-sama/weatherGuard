import { useState } from 'react';

interface TelegramConnectProps {
  deepLink: string;
}

export function TelegramConnect({ deepLink }: TelegramConnectProps) {
  const [choice, setChoice] = useState<'none' | 'desktop' | 'mobile'>('none');
  const [copied, setCopied] = useState(false);

  const handleDesktop = () => {
    setChoice('desktop');
    window.open(deepLink, '_blank');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (choice === 'none') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          How would you like to connect?
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleDesktop}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '16px 12px',
              borderRadius: '16px',
              border: '2px solid #e0e7ff',
              background: '#f0f4ff',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#5b8dee')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#e0e7ff')}
          >
            <span style={{ fontSize: '1.75rem' }}>🖥️</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Desktop</span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Open in Telegram app</span>
          </button>

          <button
            onClick={() => setChoice('mobile')}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              padding: '16px 12px',
              borderRadius: '16px',
              border: '2px solid #d1fae5',
              background: '#f0fff6',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = '#2cca7e')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = '#d1fae5')}
          >
            <span style={{ fontSize: '1.75rem' }}>📱</span>
            <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>Mobile</span>
            <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>Send link to my phone</span>
          </button>
        </div>
      </div>
    );
  }

  if (choice === 'desktop') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
          A Telegram window just opened — press <strong>Start</strong> to link your account.
        </p>
        <a
          href={deepLink}
          target="_blank"
          rel="noreferrer"
          className="kawaii-btn-primary"
          style={{ textAlign: 'center' }}
        >
          Open Telegram bot again
        </a>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button
            onClick={() => setChoice('mobile')}
            style={{ fontSize: '0.75rem', color: '#5b8dee', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Switch to mobile instead
          </button>
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>·</span>
          <button
            onClick={() => setChoice('none')}
            style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // mobile
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
        Copy this link and send it to yourself on WhatsApp or iMessage, then tap it on your phone.
      </p>

      {/* Copyable link box */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: '#f3f4f6',
        borderRadius: '12px',
        padding: '10px 12px',
      }}>
        <span style={{
          flex: 1,
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: '#374151',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {deepLink}
        </span>
        <button
          onClick={handleCopy}
          style={{
            flexShrink: 0,
            background: copied ? '#2cca7e' : '#1f2937',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            padding: '6px 14px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
        >
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>

      {/* Clickable button fallback */}
      <a
        href={deepLink}
        target="_blank"
        rel="noreferrer"
        className="kawaii-btn-primary"
        style={{ textAlign: 'center' }}
      >
        Or tap here to open directly 📱
      </a>

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
        <button
          onClick={() => setChoice('none')}
          style={{ fontSize: '0.75rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
        >
          ← Back
        </button>
      </div>
    </div>
  );
}