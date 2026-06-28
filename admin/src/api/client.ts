import type { AlertLogEntry, ApiError, AppUser, UserStatus } from '../types';

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

const TOKEN_KEY = 'weatherguard.token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiRequestError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const body = (await response.json()) as ApiError;
      message = Array.isArray(body.message) ? body.message.join(' ') : body.message;
    } catch {
      // Response wasn't JSON — keep the generic message above.
    }
    throw new ApiRequestError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const api = {
  googleLoginUrl: () => `${API_URL}/auth/google`,
  githubLoginUrl: () => `${API_URL}/auth/github`,

  getMe: () => request<AppUser>('/users/me'),

  updateMe: (data: { city?: string; requestNote?: string }) =>
    request<AppUser>('/users/me', { method: 'PATCH', body: JSON.stringify(data) }),

  listUsers: (status?: UserStatus) =>
    request<AppUser[]>(`/users${status ? `?status=${status}` : ''}`),

  approveUser: (id: string) => request<AppUser>(`/users/${id}/approve`, { method: 'PATCH' }),

  rejectUser: (id: string) => request<AppUser>(`/users/${id}/reject`, { method: 'PATCH' }),

  listAlertLogs: (limit = 50) => request<AlertLogEntry[]>(`/alerts/logs?limit=${limit}`),

  triggerBroadcast: () => request<{ queued: true }>('/alerts/broadcast', { method: 'POST' }),

  simulateAlert: (userId: string) =>
    request<AlertLogEntry>(`/alerts/simulate/${userId}`, { method: 'POST' }),
};
