export type AuthProvider = 'google' | 'github';
export type UserRole = 'user' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type AlertLogStatus = 'sent' | 'failed';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  provider: AuthProvider;
  role: UserRole;
  status: UserStatus;
  city: string;
  requestNote?: string;
  telegramLinked: boolean;
  telegramDeepLink?: string;
  approvedAt?: string;
  createdAt?: string;
}

export interface AlertLogEntry {
  id: string;
  userId: string;
  city: string;
  temperatureCelsius: number;
  condition: string;
  message: string;
  status: AlertLogStatus;
  errorMessage?: string;
  simulated: boolean;
  createdAt?: string;
}

export interface ApiError {
  statusCode: number;
  path: string;
  timestamp: string;
  message: string | string[];
}
