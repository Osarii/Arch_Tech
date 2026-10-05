export type ExternalContext = {
  location: string;
  temperature: number;
  weatherCode: number;
  observedAt: string;
};

export class ExternalContextError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExternalContextError';
  }
}

export const externalContextService = {
  async getCostaRicaWeather(signal?: AbortSignal): Promise<ExternalContext> {
    const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=9.93&longitude=-84.08&current=temperature_2m,weather_code&timezone=America%2FCosta_Rica', { signal });
    if (!response.ok) throw new ExternalContextError('External context is temporarily unavailable.');
    const body = await response.json() as { current?: { temperature_2m?: number; weather_code?: number; time?: string } };
    if (typeof body.current?.temperature_2m !== 'number' || typeof body.current.weather_code !== 'number') throw new ExternalContextError('External context returned an incomplete response.');
    return { location: 'Costa Rica', temperature: body.current.temperature_2m, weatherCode: body.current.weather_code, observedAt: body.current.time ?? '' };
  },
};
