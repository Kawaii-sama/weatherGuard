import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { api, ApiRequestError } from '../api/client';
import type { AlertLogEntry, AppUser } from '../types';

export function AlertsLogPage() {
  // State for the alert log rows shown in the table.
  const [logs, setLogs] = useState<AlertLogEntry[] | null>(null);
  // Approved users are used for manual test alert selection.
  const [approvedUsers, setApprovedUsers] = useState<AppUser[]>([]);
  // Show count of pending approvals in the admin nav.
  const [pendingCount, setPendingCount] = useState(0);
  // Track the currently selected user for sending a test alert.
  const [selectedUserId, setSelectedUserId] = useState('');
  // Busy state disables buttons while requests are in flight.
  const [busy, setBusy] = useState(false);
  // Inline flash message shown after broadcast or test actions.
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);

  // Load the most recent alert logs from the API.
  const loadLogs = useCallback(async () => {
    try {
      setLogs(await api.listAlertLogs(50));
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof ApiRequestError ? err.message : 'Could not load the alert log.',
      });
    }
  }, []);

  useEffect(() => {
    // Fetch initial data once when the component mounts.
    loadLogs();
    api.listUsers('approved').then(setApprovedUsers).catch(() => undefined);
    api.listUsers('pending').then((u) => setPendingCount(u.length)).catch(() => undefined);
  }, [loadLogs]);

  // Only show users who have linked Telegram for the test alert dropdown.
  const linkedApprovedUsers = approvedUsers.filter((u) => u.telegramLinked);

  const handleBroadcast = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await api.triggerBroadcast();
      setMessage({ kind: 'success', text: 'Broadcast queued — check back here in a few seconds.' });
      // Refresh logs after a short delay so the UI can reflect the broadcast.
      setTimeout(loadLogs, 3000);
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof ApiRequestError ? err.message : 'Could not queue the broadcast.',
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSimulate = async () => {
    if (!selectedUserId) return;

    setBusy(true);
    setMessage(null);

    try {
      const result = await api.simulateAlert(selectedUserId);
      setMessage({
        kind: result.status === 'sent' ? 'success' : 'error',
        text:
          result.status === 'sent'
            ? `Test alert delivered: ${result.condition}, ${result.temperatureCelsius}°C in ${result.city}.`
            : `Delivery failed: ${result.errorMessage ?? 'unknown error.'}`,
      });
      await loadLogs();
    } catch (err) {
      setMessage({
        kind: 'error',
        text: err instanceof ApiRequestError ? err.message : 'Could not send the test alert.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout pendingCount={pendingCount}>
      <h1 className="text-2xl font-display font-extrabold mb-1">Alerts</h1>
      <p className="text-ink-soft mb-6">
        Weather alerts broadcast automatically on a schedule — or trigger one by hand any time.
      </p>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="kawaii-card px-6 py-6">
          <h2 className="font-display font-bold mb-1">Broadcast now</h2>
          <p className="text-sm text-ink-soft mb-4">
            Sends a weather alert to every approved user with Telegram linked, right now.
          </p>
          <button className="kawaii-btn-primary" onClick={handleBroadcast} disabled={busy}>
            {busy ? 'Working…' : 'Send broadcast now'}
          </button>
        </div>

        <div className="kawaii-card px-6 py-6">
          <h2 className="font-display font-bold mb-1">Send a test alert</h2>
          <p className="text-sm text-ink-soft mb-4">
            Deliver one simulated alert to a single approved, linked user.
          </p>
          {linkedApprovedUsers.length === 0 ? (
            <p className="text-sm text-ink-soft">No approved users have linked Telegram yet.</p>
          ) : (
            <div className="flex gap-2">
              <select
                className="kawaii-input"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
              >
                <option value="">Choose a user…</option>
                {linkedApprovedUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} — {u.city}
                  </option>
                ))}
              </select>
              <button
                className="kawaii-btn-secondary whitespace-nowrap"
                onClick={handleSimulate}
                disabled={busy || !selectedUserId}
              >
                Send test
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`kawaii-card px-5 py-4 mb-6 text-sm ${
            message.kind === 'success' ? 'border-mint bg-[#F2FBF6] text-[#2F8F5B]' : 'border-blush bg-[#FFF3F3] text-[#9B3B3B]'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="kawaii-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F1E4F0]">
          <h2 className="font-display font-bold">Recent activity</h2>
        </div>
        {logs === null ? (
          <div className="px-8 py-10">
            <LoadingSpinner label="Loading activity…" />
          </div>
        ) : logs.length === 0 ? (
          <div className="px-8 py-10 text-center text-ink-soft">
            No alerts have been sent yet — they'll show up here the moment one goes out.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#FBF3FA] text-xs font-display font-semibold text-ink-soft uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">When</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Conditions</th>
                <th className="px-5 py-3">Source</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4F0]">
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="px-5 py-4 text-sm text-ink-soft">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString() : '—'}
                  </td>
                  <td className="px-5 py-4 text-sm">{log.city}</td>
                  <td className="px-5 py-4 text-sm">
                    {log.condition}, {log.temperatureCelsius}°C
                  </td>
                  <td className="px-5 py-4 text-sm">{log.simulated ? 'Manual test' : 'Scheduled'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={log.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
