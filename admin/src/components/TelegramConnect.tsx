import { useState } from "react";

interface TelegramConnectProps {
  telegramLinkToken: string;
  botUsername: string; // e.g. "WeatherGuardAlertsBot"
}

export function TelegramConnect({ telegramLinkToken, botUsername }: TelegramConnectProps) {
  const [choice, setChoice] = useState<"none" | "desktop" | "mobile">("none");
  const [copied, setCopied] = useState(false);

  const deepLink = `https://t.me/${botUsername}?start=${telegramLinkToken}`;

  const handleDesktop = () => {
    setChoice("desktop");
    window.open(deepLink, "_blank");
  };

  const handleMobile = () => {
    setChoice("mobile");
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(deepLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Initial state: choose how to connect ───────────────────────────────────
  if (choice === "none") {
    return (
      <div className="telegram-connect">
        <div className="tc-icon">✉️</div>
        <h2 className="tc-title">Connect your Telegram</h2>
        <p className="tc-subtitle">
          How would you like to open the Telegram bot?
        </p>

        <div className="tc-options">
          <button className="tc-btn tc-btn--desktop" onClick={handleDesktop}>
            <span className="tc-btn-icon">🖥️</span>
            <span className="tc-btn-label">Open on Desktop</span>
            <span className="tc-btn-desc">Telegram installed on this computer</span>
          </button>

          <button className="tc-btn tc-btn--mobile" onClick={handleMobile}>
            <span className="tc-btn-icon">📱</span>
            <span className="tc-btn-label">Open on Mobile</span>
            <span className="tc-btn-desc">I use Telegram on my phone</span>
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop: opened automatically, show confirmation ──────────────────────
  if (choice === "desktop") {
    return (
      <div className="telegram-connect">
        <div className="tc-icon">🖥️</div>
        <h2 className="tc-title">Opening Telegram…</h2>
        <p className="tc-subtitle">
          A new window just opened with your bot. Press <strong>Start</strong> in Telegram to link your account.
        </p>
        <p className="tc-hint">
          Nothing happened?{" "}
          <a href={deepLink} target="_blank" rel="noreferrer" className="tc-link">
            Click here to try again
          </a>
          {" "}or{" "}
          <button className="tc-text-btn" onClick={() => setChoice("mobile")}>
            switch to mobile instead
          </button>
          .
        </p>
      </div>
    );
  }

  // ── Mobile: show the link to share to phone ───────────────────────────────
  return (
    <div className="telegram-connect">
      <div className="tc-icon">📱</div>
      <h2 className="tc-title">Connect on Mobile</h2>
      <p className="tc-subtitle">
        Share this link to your phone, then tap it to open the bot and press <strong>Start</strong>.
      </p>

      <div className="tc-link-box">
        <span className="tc-link-text">{deepLink}</span>
        <button className="tc-copy-btn" onClick={handleCopy}>
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>

      <div className="tc-steps">
        <div className="tc-step">
          <span className="tc-step-num">1</span>
          <span>Copy the link above and send it to yourself on WhatsApp, iMessage, or any app</span>
        </div>
        <div className="tc-step">
          <span className="tc-step-num">2</span>
          <span>Open the link on your phone — Telegram will open</span>
        </div>
        <div className="tc-step">
          <span className="tc-step-num">3</span>
          <span>Tap <strong>Start</strong> in the chat — you're done! ✨</span>
        </div>
      </div>

      <button className="tc-text-btn tc-back" onClick={() => setChoice("none")}>
        ← Go back
      </button>
    </div>
  );
}