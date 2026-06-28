export interface WeatherData {
  city: string;
  temperatureCelsius: number;
  condition: string;
  emoji: string;
  summary: string;
  /** True when this came from the deterministic simulator rather than a real API call. */
  simulated: boolean;
}
