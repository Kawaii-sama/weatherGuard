import { useCallback, useEffect, useState } from 'react';
import { AdminLayout } from '../components/AdminLayout';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { api, ApiRequestError } from '../api/client';
import type { AppUser, UserStatus } from '../types';

const TABS: { key: UserStatus; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export function DashboardPage() {
  // Current selected tab of user states: pending/approved/rejected.
  const [tab, setTab] = useState<UserStatus>('pending');
  // The list of users shown for the current tab.
  const [users, setUsers] = useState<AppUser[] | null>(null);
  // Count of pending approvals used in the tab badge and nav.
  const [pendingCount, setPendingCount] = useState(0);
  // Display API errors to the admin.
  const [error, setError] = useState<string | null>(null);
  // Track the user currently being approved/rejected/deleted.
  const [actingOn, setActingOn] = useState<string | null>(null);
  // User selected for the delete confirmation modal.
  const [confirmDelete, setConfirmDelete] = useState<AppUser | null>(null);

  const load = useCallback(async (status: UserStatus) => {
    // Clear previous state while new data is loading.
    setError(null);
    setUsers(null);

    try {
      const [list, allPending] = await Promise.all([
        api.listUsers(status),
        // Only fetch the pending list separately when not already viewing pending.
        status === 'pending' ? Promise.resolve(undefined) : api.listUsers('pending'),
      ]);

      setUsers(list);
      if (allPending) setPendingCount(allPending.length);
      else if (status === 'pending') setPendingCount(list.length);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not load requests.');
    }
  }, []);

  useEffect(() => {
    // Reload the current tab whenever the selected tab changes.
    load(tab);
  }, [tab, load]);

  const handleApprove = async (id: string) => {
    setActingOn(id);
    try {
      await api.approveUser(id);
      await load(tab);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not approve this user.');
    } finally {
      setActingOn(null);
    }
  };

  const handleReject = async (id: string) => {
    setActingOn(id);
    try {
      await api.rejectUser(id);
      await load(tab);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not reject this user.');
    } finally {
      setActingOn(null);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDelete) return;

    // Keep the delete target visible while the request is in flight.
    setActingOn(confirmDelete.id);
    setConfirmDelete(null);

    try {
      await api.deleteUser(confirmDelete.id);
      await load(tab);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'Could not delete this user.');
    } finally {
      setActingOn(null);
    }
  };

  return (
    <AdminLayout pendingCount={pendingCount}>
      <h1 className="text-2xl font-display font-extrabold mb-1">Access requests</h1>
      <p className="text-ink-soft mb-6">Review who's asking in, and decide who gets weather alerts.</p>

      <div className="flex gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`font-display font-semibold text-sm px-4 py-2 rounded-full transition-colors ${
              tab === t.key ? 'bg-ink text-white' : 'bg-white text-ink border-2 border-[#F1E4F0]'
            }`}
          >
            {t.label}
            {t.key === 'pending' && pendingCount > 0 ? ` (${pendingCount})` : ''}
          </button>
        ))}
      </div>

      {error && (
        <div className="kawaii-card px-5 py-4 mb-4 border-blush bg-[#FFF3F3] text-sm text-[#9B3B3B]">
          {error}
        </div>
      )}

      {/* ── Confirm delete modal ── */}
      {confirmDelete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50,
        }}>
          <div className="kawaii-card px-8 py-8 max-w-sm w-full text-center">
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h2 className="font-display font-extrabold text-lg mb-2">Delete {confirmDelete.name}?</h2>
            <p className="text-ink-soft text-sm mb-6">
              This will permanently delete their account, all alert logs, and their entire history.
              <strong> This cannot be undone.</strong>
            </p>
            <div className="flex gap-3">
              <button
                className="flex-1 kawaii-btn-secondary"
                onClick={() => setConfirmDelete(null)}
              >
                Cancel
              </button>
              <button
                className="flex-1 kawaii-btn-danger"
                onClick={handleDeleteConfirmed}
              >
                Yes, delete
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="kawaii-card overflow-hidden">
        {users === null ? (
          <div className="px-8 py-10">
            <LoadingSpinner label="Loading requests…" />
          </div>
        ) : users.length === 0 ? (
          <div className="px-8 py-10 text-center text-ink-soft">
            {tab === 'pending'
              ? 'No pending requests right now — new sign-ups will show up here.'
              : `No ${tab} users yet.`}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#FBF3FA] text-xs font-display font-semibold text-ink-soft uppercase tracking-wide">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">City</th>
                <th className="px-5 py-3">Telegram</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1E4F0]">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-4 font-display font-semibold">{u.name}</td>
                  <td className="px-5 py-4 text-sm text-ink-soft">{u.email}</td>
                  <td className="px-5 py-4 text-sm">{u.city}</td>
                  <td className="px-5 py-4 text-sm">{u.telegramLinked ? '✓ linked' : '— not linked'}</td>
                  <td className="px-5 py-4">
                    <StatusBadge status={u.status} />
                  </td>
                  <td className="px-5 py-4 text-right space-x-2">
                    {tab === 'pending' && (
                      <>
                        <button
                          className="kawaii-btn-success"
                          disabled={actingOn === u.id}
                          onClick={() => handleApprove(u.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="kawaii-btn-danger"
                          disabled={actingOn === u.id}
                          onClick={() => handleReject(u.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      disabled={actingOn === u.id}
                      onClick={() => setConfirmDelete(u)}
                      style={{
                        background: 'none',
                        border: '1.5px solid #e0c0c0',
                        borderRadius: '8px',
                        padding: '5px 12px',
                        fontSize: '0.8rem',
                        color: '#9B3B3B',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      🗑️ Delete
                    </button>
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