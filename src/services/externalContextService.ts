export type Coordinates = { latitude: number; longitude: number };

export type ResolvedLocation = Coordinates & {
  displayName: string;
  address: { city?: string; state?: string; country?: string; countryCode?: string };
};

export type ExternalContext = Coordinates & {
  temperature: number;
  weatherCode: number;
  precipitation: number | null;
  windSpeed: number | null;
  observedAt: string;
  location?: string;
};

export type SeismicEvent = {
  magnitude: number;
  place: string;
  time: string;
  distanceKm: number;
  url: string | null;
};

export type SeismicContext = {
  eventCount: number;
  radiusKm: number;
  days: number;
  strongest: SeismicEvent | null;
  nearest: SeismicEvent | null;
  mostRecent: SeismicEvent | null;
  queriedAt: string;
};

export type ExternalContextErrorCode = 'unavailable' | 'incomplete' | 'not-found';

export class ExternalContextError extends Error {
  code: ExternalContextErrorCode;
  constructor(message: string, code: ExternalContextErrorCode = 'unavailable') {
    super(message);
    this.name = 'ExternalContextError';
    this.code = code;
  }
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const USGS_URL = 'https://earthquake.usgs.gov/fdsnws/event/1/query';

/** Nominatim usage policy: at most 1 request per second. */
export const NOMINATIM_MIN_INTERVAL_MS = 1000;
export const SEISMIC_RADIUS_KM = 300;
export const SEISMIC_DAYS = 30;

const geocodeCache = new Map<string, ResolvedLocation>();
let lastGeocodeSlot = 0;

export const resetExternalContextState = () => {
  geocodeCache.clear();
  lastGeocodeSlot = 0;
};

export const normalizeLocationQuery = (query: string) => query.trim().replace(/\s+/g, ' ').toLowerCase();

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const waitForGeocodeSlot = async (signal?: AbortSignal) => {
  // Reserve the slot synchronously so concurrent callers are spaced out too.
  const slot = Math.max(Date.now(), lastGeocodeSlot + NOMINATIM_MIN_INTERVAL_MS);
  lastGeocodeSlot = slot;
  const wait = slot - Date.now();
  if (wait <= 0) return;
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, wait);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new DOMException('Aborted', 'AbortError'));
    });
  });
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

export const distanceKm = (a: Coordinates, b: Coordinates) => {
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
};

type NominatimItem = {
  lat?: unknown;
  lon?: unknown;
  display_name?: unknown;
  address?: Record<string, unknown>;
};

type UsgsFeature = {
  properties?: { mag?: unknown; place?: unknown; time?: unknown; url?: unknown };
  geometry?: { coordinates?: unknown };
};

export const externalContextService = {
  /** OpenStreetMap Nominatim: manual location -> coordinates. Cached, throttled to 1 req/s, limit=1. */
  async geocode(query: string, signal?: AbortSignal): Promise<ResolvedLocation> {
    const key = normalizeLocationQuery(query);
    if (!key) throw new ExternalContextError('Enter a location to analyze.', 'not-found');
    const cached = geocodeCache.get(key);
    if (cached) return cached;

    await waitForGeocodeSlot(signal);
    const params = new URLSearchParams({ q: key, format: 'jsonv2', addressdetails: '1', limit: '1' });
    let response: Response;
    try {
      response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, { signal });
    } catch (error) {
      if ((error as Error).name === 'AbortError') throw error;
      throw new ExternalContextError('Location search is temporarily unavailable.');
    }
    if (!response.ok) throw new ExternalContextError('Location search is temporarily unavailable.');

    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ExternalContextError('Location search returned an incomplete response.', 'incomplete');
    }
    if (!Array.isArray(body)) throw new ExternalContextError('Location search returned an incomplete response.', 'incomplete');
    if (body.length === 0) throw new ExternalContextError('No matching location was found.', 'not-found');

    const item = body[0] as NominatimItem;
    const latitude = typeof item.lat === 'string' ? Number(item.lat) : item.lat;
    const longitude = typeof item.lon === 'string' ? Number(item.lon) : item.lon;
    if (
      !isFiniteNumber(latitude) || !isFiniteNumber(longitude) ||
      Math.abs(latitude) > 90 || Math.abs(longitude) > 180 ||
      typeof item.display_name !== 'string' || !item.display_name
    ) {
      throw new ExternalContextError('Location search returned an incomplete response.', 'incomplete');
    }
    const addr = item.address ?? {};
    const str = (value: unknown) => (typeof value === 'string' && value ? value : undefined);
    const resolved: ResolvedLocation = {
      displayName: item.display_name,
      latitude,
      longitude,
      address: {
        city: str(addr.city) ?? str(addr.town) ?? str(addr.village) ?? str(addr.municipality),
        state: str(addr.state) ?? str(addr.province),
        country: str(addr.country),
        countryCode: str(addr.country_code)?.toUpperCase(),
      },
    };
    geocodeCache.set(key, resolved);
    return resolved;
  },

  /** Open-Meteo current conditions for resolved coordinates. */
  async getWeather({ latitude, longitude }: Coordinates, signal?: AbortSignal): Promise<ExternalContext> {
    const params = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      current: 'temperature_2m,weather_code,precipitation,wind_speed_10m',
      timezone: 'auto',
    });
    const response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, { signal });
    if (!response.ok) throw new ExternalContextError('Weather is temporarily unavailable.');
    const body = await response.json() as {
      current?: { temperature_2m?: number; weather_code?: number; precipitation?: number; wind_speed_10m?: number; time?: string };
    };
    const current = body.current;
    if (!isFiniteNumber(current?.temperature_2m) || !isFiniteNumber(current?.weather_code)) {
      throw new ExternalContextError('Weather returned an incomplete response.', 'incomplete');
    }
    return {
      latitude,
      longitude,
      temperature: current.temperature_2m,
      weatherCode: current.weather_code,
      precipitation: isFiniteNumber(current.precipitation) ? current.precipitation : null,
      windSpeed: isFiniteNumber(current.wind_speed_10m) ? current.wind_speed_10m : null,
      observedAt: current.time ?? '',
    };
  },

  /** Backward-compatible helper for the default Costa Rica operations center. */
  async getCostaRicaWeather(signal?: AbortSignal): Promise<ExternalContext & { location: string }> {
    const weather = await this.getWeather({ latitude: 9.93, longitude: -84.08 }, signal);
    return { ...weather, location: 'Costa Rica' };
  },

  /** USGS Earthquake Catalog: recent seismic context (last 30 days) around coordinates. Not a safety assessment. */
  async getSeismicContext(origin: Coordinates, signal?: AbortSignal): Promise<SeismicContext> {
    const now = new Date();
    const start = new Date(now.getTime() - SEISMIC_DAYS * 24 * 60 * 60 * 1000);
    const params = new URLSearchParams({
      format: 'geojson',
      latitude: String(origin.latitude),
      longitude: String(origin.longitude),
      maxradiuskm: String(SEISMIC_RADIUS_KM),
      starttime: start.toISOString(),
      endtime: now.toISOString(),
      orderby: 'time',
      limit: '500',
    });
    const response = await fetch(`${USGS_URL}?${params.toString()}`, { signal });
    if (!response.ok) throw new ExternalContextError('Seismic context is temporarily unavailable.');
    const body = await response.json() as { features?: UsgsFeature[] };
    if (!Array.isArray(body.features)) throw new ExternalContextError('Seismic context returned an incomplete response.', 'incomplete');

    const events: (SeismicEvent & { timeMs: number })[] = [];
    for (const feature of body.features) {
      const mag = feature.properties?.mag;
      const timeMs = feature.properties?.time;
      const coords = feature.geometry?.coordinates;
      if (!isFiniteNumber(mag) || !isFiniteNumber(timeMs) || !Array.isArray(coords) || !isFiniteNumber(coords[0]) || !isFiniteNumber(coords[1])) continue;
      events.push({
        magnitude: mag,
        place: typeof feature.properties?.place === 'string' ? feature.properties.place : 'Unnamed location',
        time: new Date(timeMs).toISOString(),
        timeMs,
        distanceKm: Math.round(distanceKm(origin, { latitude: coords[1], longitude: coords[0] })),
        url: typeof feature.properties?.url === 'string' ? feature.properties.url : null,
      });
    }
    const pick = (better: (a: typeof events[number], b: typeof events[number]) => boolean) =>
      events.length ? events.reduce((best, e) => (better(e, best) ? e : best)) : null;
    const strip = (e: typeof events[number] | null): SeismicEvent | null => {
      if (!e) return null;
      const { timeMs: _timeMs, ...rest } = e;
      return rest;
    };
    return {
      eventCount: events.length,
      radiusKm: SEISMIC_RADIUS_KM,
      days: SEISMIC_DAYS,
      strongest: strip(pick((a, b) => a.magnitude > b.magnitude)),
      nearest: strip(pick((a, b) => a.distanceKm < b.distanceKm)),
      mostRecent: strip(pick((a, b) => a.timeMs > b.timeMs)),
      queriedAt: now.toISOString(),
    };
  },
};
