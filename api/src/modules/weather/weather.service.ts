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
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${apiKey}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`OpenWeather responded with ${response.status}`);

    const data: any = await response.json();
    const condition: string = data.weather?.[0]?.main ?? 'Unknown';
    const temperatureCelsius: number = Math.round(data.main?.temp ?? 0);
    const feelsLikeCelsius: number = Math.round(data.main?.feels_like ?? temperatureCelsius);
    const humidity: number = data.main?.humidity ?? 0;
    const windSpeedKph: number = Math.round((data.wind?.speed ?? 0) * 3.6); // m/s to km/h
    const visibilityKm: number = Math.round((data.visibility ?? 10000) / 1000);

    return {
      city,
      temperatureCelsius,
      feelsLikeCelsius,
      humidity,
      windSpeedKph,
      visibilityKm,
      condition,
      emoji: this.emojiFor(condition),
      summary: data.weather?.[0]?.description ?? condition,
      simulated: false,
    };
  }

  simulate(city: string): WeatherData {
    const seed = this.hashString(`${city.toLowerCase()}-${new Date().getHours()}`);
    const { condition, emoji } = CONDITIONS[seed % CONDITIONS.length];
    const temperatureCelsius = 5 + (seed % 30);
    const feelsLikeCelsius = temperatureCelsius - (seed % 5);
    const humidity = 40 + (seed % 50);
    const windSpeedKph = 5 + (seed % 30);
    const visibilityKm = 5 + (seed % 10);

    return {
      city,
      temperatureCelsius,
      feelsLikeCelsius,
      humidity,
      windSpeedKph,
      visibilityKm,
      condition,
      emoji,
      summary: `${condition.toLowerCase()} with a gentle breeze`,
      simulated: true,
    };
  }

  private emojiFor(condition: string): string {
    const match = CONDITIONS.find((entry) =>
      entry.condition.toLowerCase().includes(condition.toLowerCase()),
    );
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