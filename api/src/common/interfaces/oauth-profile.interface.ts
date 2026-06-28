import { AuthProvider } from '../enums';

/**
 * Google and GitHub return wildly different profile shapes. Each Passport
 * strategy maps its provider-specific profile into this normalized shape
 * before handing off to AuthService, so AuthService never has to know
 * which provider was used.
 */
export interface NormalizedOAuthProfile {
  provider: AuthProvider;
  providerId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}
