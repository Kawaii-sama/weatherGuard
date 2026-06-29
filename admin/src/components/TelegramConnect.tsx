import { useState } from 'react';

interface TelegramConnectProps {
  deepLink: string;
}

export function TelegramConnect({ deepLink }: TelegramConnectProps) {
  const [copied, setCopied] = useState(false);

  // Convert t.me link to web.telegram.org link as fallback
  const webLink = deepLink.replace('https://t.me/', 'https://web.telegram.org/k/#@').split('?')[0];

  const handleCopy = async () => {
    await navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sectionStyle: React.CSSProperties = {
    borderRadius: '14px',
    padding: '16px',
    marginBottom: '12px',
  };

  const labelStyle: React.CSSProperties = {
    fontWeight: 700,
    fontSize: '0.85rem',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  const hintStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    color: '#6b7280',
    marginBottom: '10px',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>

      {/* ── Desktop section ── */}
      <div style={{ ...sectionStyle, background: '#f0f4ff', border: '1.5px solid #c7d7f9' }}>
        <div style={labelStyle}>🖥️ On Desktop</div>
        <p style={hintStyle}>
          Click below to open the bot. If Telegram isn't installed, use the Web version — no download needed.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={deepLink}
            target="_blank"
            rel="noreferrer"
            className="kawaii-btn-primary"
            style={{ textAlign: 'center', display: 'block' }}
          >
            Open in Telegram app
          </a>
          <a
            href={`https://web.telegram.org/k/`}
            target="_blank"
            rel="noreferrer"
            style={{
              textAlign: 'center',
              display: 'block',
              padding: '10px',
              borderRadius: '10px',
              border: '1.5px solid #5b8dee',
              color: '#5b8dee',
              fontWeight: 600,
              fontSize: '0.875rem',
              textDecoration: 'none',
              background: '#fff',
            }}
          >
            Open in Telegram Web (no install) 🌐
          </a>
        </div>
      </div>

      {/* ── Mobile section ── */}
      <div style={{ ...sectionStyle, background: '#f0fff6', border: '1.5px solid #a7f3d0' }}>
        <div style={labelStyle}>📱 On Mobile</div>
        <p style={hintStyle}>
          Copy the link below and send it to yourself on WhatsApp or iMessage, then tap it on your phone.
        </p>

        {/* Copyable link */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#fff',
          borderRadius: '10px',
          padding: '8px 12px',
          border: '1.5px solid #a7f3d0',
          marginBottom: '8px',
        }}>
          <span style={{
            flex: 1,
            fontSize: '0.72rem',
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
              whiteSpace: 'nowrap',
            }}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <a
          href={deepLink}
          target="_blank"
          rel="noreferrer"
          className="kawaii-btn-primary"
          style={{ textAlign: 'center', display: 'block', background: '#2cca7e', borderColor: '#2cca7e' }}
        >
          Or tap here to open on this device 📱
        </a>
      </div>

    </div>
  );
}