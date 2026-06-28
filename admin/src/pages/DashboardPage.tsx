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
  const [tab, setTab] = useState<UserStatus>('pending');
  const [users, setUsers] = useState<AppUser[] | null>(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  const load = useCallback(async (status: UserStatus) => {
    setError(null);
    setUsers(null);
    try {
      const [list, allPending] = await Promise.all([
        api.listUsers(status),
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
                {tab === 'pending' && <th className="px-5 py-3 text-right">Actions</th>}
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
                  {tab === 'pending' && (
                    <td className="px-5 py-4 text-right space-x-2">
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
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
