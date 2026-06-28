/**
 * Single source of truth for environment-derived configuration.
 * Every other module reads config through ConfigService<AppConfig>['get']
 * instead of touching `process.env` directly — this keeps env access
 * typed and in one place, which matters once you have 5+ integrations.
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiUrl: string;
  frontendUrl: string;
  mongodbUri: string;
  redisUrl: string;
  jwtSecret: string;
  jwtExpiresIn: string;
  adminEmails: string[];
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  github: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
  };
  telegram: {
    botToken: string;
    botUsername: string;
  };
  weather: {
    apiKey: string;
  };
  alertBroadcastCron: string;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  apiUrl: process.env.API_URL ?? 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:5173',
  mongodbUri: process.env.MONGODB_URI ?? 'mongodb://localhost:27017/weatherguard',
  redisUrl: process.env.REDIS_URL ?? 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET ?? 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  adminEmails: (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:3000/auth/google/callback',
  },
  github: {
    clientId: process.env.GITHUB_CLIENT_ID ?? '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
    callbackUrl: process.env.GITHUB_CALLBACK_URL ?? 'http://localhost:3000/auth/github/callback',
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
    botUsername: process.env.TELEGRAM_BOT_USERNAME ?? 'WeatherGuardAlertsBot',
  },
  weather: {
    apiKey: process.env.OPENWEATHER_API_KEY ?? '',
  },
  alertBroadcastCron: process.env.ALERT_BROADCAST_CRON ?? '0 * * * *',
});
