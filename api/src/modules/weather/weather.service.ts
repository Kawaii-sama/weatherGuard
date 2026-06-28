import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WeatherData } from './interfaces/weather-data.interface';
import { AppConfig } from '../../config/configuration';

const CONDITIONS: Array<{ condition: string; emoji: string }> = [
  { condition: 'Clear skies', emoji: '☀️' },
  { condition: 'Partly cloudy', emoji: '🌤️' },
  { condition: 'Cloudy', emoji: '☁️' },
  { condition: 'Light rain', emoji: '🌦️' },
  { condition: 'Thunderstorms', emoji: '⛈️' },
  { condition: 'Snow', emoji: '🌨️' },
  { condition: 'Windy', emoji: '🌬️' },
];

/**
 * Talks to OpenWeatherMap when an API key is configured. Without one, it
 * falls back to a deterministic simulator (seeded by city name + current
 * hour) so the rest of the pipeline — scheduling, Telegram delivery,
 * logging — is fully demoable without any third-party weather account.
 * This is also exactly what the "simulated weather alert" deliverable
 * exercises on demand via POST /alerts/simulate/:userId.
 */
@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(private readonly configService: ConfigService<AppConfig, true>) {}

  async getWeatherForCity(city: string): Promise<WeatherData> {
    const apiKey = this.configService.get('weather', { infer: true }).apiKey;

    if (apiKey) {
      try {
        return await this.fetchFromOpenWeather(city, apiKey);
      } catch (error) {
        this.logger.warn(
          `OpenWeather lookup failed for "${city}" (${(error as Error).message}) — falling back to simulated data.`,
        );
      }
    }

    return this.simulate(city);
  }

  private async fetchFromOpenWeather(city: string, apiKey: string): Promise<WeatherData> {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
      city,
    )}&units=metric&appid=${apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OpenWeather responded with ${response.status}`);
    }

    const data: any = await response.json();
    const condition: string = data.weather?.[0]?.main ?? 'Unknown';
    const temperatureCelsius: number = Math.round(data.main?.temp ?? 0);

    return {
      city,
      temperatureCelsius,
      condition,
      emoji: this.emojiFor(condition),
      summary: data.weather?.[0]?.description ?? condition,
      simulated: false,
    };
  }

  /** Deterministic per city + hour, so repeated demos within the same hour look consistent. */
  simulate(city: string): WeatherData {
    const seed = this.hashString(`${city.toLowerCase()}-${new Date().getHours()}`);
    const { condition, emoji } = CONDITIONS[seed % CONDITIONS.length];
    const temperatureCelsius = 5 + (seed % 30); // a plausible-looking 5–34°C

    return {
      city,
      temperatureCelsius,
      condition,
      emoji,
      summary: `${condition.toLowerCase()} with a gentle breeze`,
      simulated: true,
    };
  }

  private emojiFor(condition: string): string {
    const match = CONDITIONS.find((entry) => entry.condition.toLowerCase().includes(condition.toLowerCase()));
    return match?.emoji ?? '🌈';
  }

  private hashString(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  }
}
