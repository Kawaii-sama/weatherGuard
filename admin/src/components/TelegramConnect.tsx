import { useState } from 'react';

interface TelegramConnectProps {
  deepLink: string;
}

export function TelegramConnect({ deepLink }: TelegramConnectProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>

      {/* ── Desktop section ── */}
      <div style={{
        borderRadius: '20px',
        padding: '18px 16px',
        background: 'linear-gradient(135deg, #fce4ec 0%, #f8bbd0 100%)',
        border: '2px solid #f48fb1',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative vine */}
        <span style={{ position: 'absolute', top: 6, right: 10, fontSize: '1.4rem', opacity: 0.5 }}>🌸</span>
        <span style={{ position: 'absolute', bottom: 6, right: 28, fontSize: '1rem', opacity: 0.4 }}>🌿</span>

        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#880e4f', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          🖥️ On Desktop
        </div>
        <p style={{ fontSize: '0.78rem', color: '#ad1457', marginBottom: '12px', lineHeight: 1.5 }}>
          Click below to open the bot. No Telegram installed? Use the Web version — works right in your browser!
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={deepLink}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '11px',
              borderRadius: '14px',
              background: '#e91e8c',
              color: '#fff',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              boxShadow: '0 3px 10px rgba(233,30,140,0.25)',
            }}
          >
            🌸 Open in Telegram App
          </a>
          <a
            href="https://web.telegram.org/k/"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '11px',
              borderRadius: '14px',
              background: '#fff',
              color: '#ad1457',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              border: '2px solid #f48fb1',
            }}
          >
            🌐 Open in Telegram Web (no install)
          </a>
        </div>
      </div>

      {/* ── Mobile section ── */}
      <div style={{
        borderRadius: '20px',
        padding: '18px 16px',
        background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
        border: '2px solid #a5d6a7',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* decorative plants */}
        <span style={{ position: 'absolute', top: 6, right: 10, fontSize: '1.4rem', opacity: 0.5 }}>🌱</span>
        <span style={{ position: 'absolute', bottom: 6, right: 30, fontSize: '1rem', opacity: 0.4 }}>🍃</span>
        <span style={{ position: 'absolute', top: 6, left: 10, fontSize: '1rem', opacity: 0.3 }}>🌿</span>

        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1b5e20', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          📱 On Mobile
        </div>
        <p style={{ fontSize: '0.78rem', color: '#2e7d32', marginBottom: '12px', lineHeight: 1.5 }}>
          Copy this link and send it to yourself on WhatsApp or iMessage, then tap it on your phone!
        </p>

        {/* Copyable link box */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#fff',
          borderRadius: '12px',
          padding: '8px 12px',
          border: '2px solid #a5d6a7',
          marginBottom: '8px',
        }}>
          <span style={{
            flex: 1,
            fontSize: '0.7rem',
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
              background: copied ? '#43a047' : '#2e7d32',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '6px 14px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy 🌿'}
          </button>
        </div>

        <a
          href={deepLink}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'block',
            textAlign: 'center',
            padding: '11px',
            borderRadius: '14px',
            background: '#43a047',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.875rem',
            textDecoration: 'none',
            boxShadow: '0 3px 10px rgba(67,160,71,0.25)',
          }}
        >
          🌱 Or tap here to open directly
        </a>
      </div>

    </div>
  );
}