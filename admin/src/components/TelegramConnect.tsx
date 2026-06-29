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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '8px' }}>

      {/* ── Desktop card ── */}
      <div style={{
        borderRadius: '22px',
        padding: '20px 18px',
        background: '#fff0f5',
        border: '1.5px solid #f9c6d8',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* soft bg decoration */}
        <span style={{ position: 'absolute', top: -6, right: -4, fontSize: '3.5rem', opacity: 0.08, userSelect: 'none' }}>🌸</span>
        <span style={{ position: 'absolute', bottom: -8, left: -4, fontSize: '3rem', opacity: 0.07, userSelect: 'none' }}>🌷</span>

        <p style={{ fontWeight: 800, fontSize: '0.82rem', color: '#c2678a', marginBottom: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          🖥️ On Desktop
        </p>
        <p style={{ fontSize: '0.78rem', color: '#b07090', marginBottom: '14px', lineHeight: 1.6, margin: '4px 0 14px' }}>
          Click below to open the bot. Don't have Telegram installed? No worries — the Web version works straight in your browser.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a href={deepLink} target="_blank" rel="noreferrer" style={{
            display: 'block', textAlign: 'center', padding: '11px 16px',
            borderRadius: '14px', background: '#f4a7c0', color: '#fff',
            fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(244,167,192,0.4)',
            letterSpacing: '0.01em',
          }}>
            🌸 Open in Telegram App
          </a>
          <a href="https://web.telegram.org/k/" target="_blank" rel="noreferrer" style={{
            display: 'block', textAlign: 'center', padding: '11px 16px',
            borderRadius: '14px', background: '#fff', color: '#c2678a',
            fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
            border: '1.5px solid #f9c6d8',
          }}>
            🌐 Open in Telegram Web (no install)
          </a>
        </div>
      </div>

      {/* ── Mobile card ── */}
      <div style={{
        borderRadius: '22px',
        padding: '20px 18px',
        background: '#f2faf4',
        border: '1.5px solid #b8dfc2',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* soft bg decoration */}
        <span style={{ position: 'absolute', top: -6, right: -4, fontSize: '3.5rem', opacity: 0.08, userSelect: 'none' }}>🌿</span>
        <span style={{ position: 'absolute', bottom: -8, left: -4, fontSize: '3rem', opacity: 0.07, userSelect: 'none' }}>🍃</span>
        <span style={{ position: 'absolute', top: '40%', right: -6, fontSize: '2.5rem', opacity: 0.06, userSelect: 'none' }}>🌱</span>

        <p style={{ fontWeight: 800, fontSize: '0.82rem', color: '#4a9265', marginBottom: '4px', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          📱 On Mobile
        </p>
        <p style={{ fontSize: '0.78rem', color: '#5a8a6a', marginBottom: '14px', lineHeight: 1.6, margin: '4px 0 14px' }}>
          Copy this link and send it to yourself on WhatsApp or iMessage, then tap it on your phone to open the bot.
        </p>

        {/* link copy box */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          background: '#fff', borderRadius: '12px',
          padding: '8px 12px', border: '1.5px solid #b8dfc2', marginBottom: '8px',
        }}>
          <span style={{
            flex: 1, fontSize: '0.7rem', fontFamily: 'monospace',
            color: '#4a6055', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {deepLink}
          </span>
          <button onClick={handleCopy} style={{
            flexShrink: 0,
            background: copied ? '#7ec89a' : '#a8d8b8',
            color: copied ? '#fff' : '#2d6a4f',
            border: 'none', borderRadius: '10px',
            padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700,
            cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.2s',
          }}>
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>

        <a href={deepLink} target="_blank" rel="noreferrer" style={{
          display: 'block', textAlign: 'center', padding: '11px 16px',
          borderRadius: '14px', background: '#a8d8b8', color: '#2d6a4f',
          fontWeight: 700, fontSize: '0.875rem', textDecoration: 'none',
          boxShadow: '0 2px 8px rgba(168,216,184,0.5)',
        }}>
          🌱 Or tap here to open directly
        </a>
      </div>

    </div>
  );
}