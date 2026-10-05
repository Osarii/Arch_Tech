import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import {
  externalContextService,
  resetExternalContextState,
  distanceKm,
} from '../src/services/externalContextService';
import { ExternalContextPanel } from '../src/components/portal/PortalCommon';

const mockNominatimSuccess = (displayName = 'San José, San José Canton, San José Province, 10101, Costa Rica', lat = 9.9322, lon = -84.0795) => [
  {
    lat: String(lat),
    lon: String(lon),
    display_name: displayName,
    address: {
      city: 'San José',
      state: 'San José Province',
      country: 'Costa Rica',
      country_code: 'cr',
    },
  },
];

const mockWeatherSuccess = (temp = 23.4, code = 2, precip = 0.5, wind = 12.3) => ({
  current: {
    temperature_2m: temp,
    weather_code: code,
    precipitation: precip,
    wind_speed_10m: wind,
    time: '2026-10-05T14:00',
  },
});

const mockUsgsSuccess = (features = [
  {
    properties: { mag: 4.8, place: '24 km S of Jacó, Costa Rica', time: Date.now() - 3600000, url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us1' },
    geometry: { coordinates: [-84.62, 9.40, 25] },
  },
  {
    properties: { mag: 3.2, place: '12 km N of San José, Costa Rica', time: Date.now() - 7200000, url: 'https://earthquake.usgs.gov/earthquakes/eventpage/us2' },
    geometry: { coordinates: [-84.05, 10.02, 10] },
  },
]) => ({
  type: 'FeatureCollection',
  features,
});

describe('Site Intelligence - External Context Service', () => {
  beforeEach(() => {
    resetExternalContextState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetExternalContextState();
    vi.restoreAllMocks();
  });

  describe('distance calculation', () => {
    it('calculates great-circle distance accurately', () => {
      const sanJose = { latitude: 9.9322, longitude: -84.0795 };
      const alajuela = { latitude: 10.0163, longitude: -84.2116 };
      const dist = distanceKm(sanJose, alajuela);
      expect(dist).toBeGreaterThan(15);
      expect(dist).toBeLessThan(25);
    });
  });

  describe('geocode (OpenStreetMap Nominatim)', () => {
    it('resolves location with normalized query parameters', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockNominatimSuccess(),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await externalContextService.geocode('San José, Costa Rica');
      expect(result).toMatchObject({
        displayName: expect.stringContaining('San José'),
        latitude: 9.9322,
        longitude: -84.0795,
        address: {
          city: 'San José',
          state: 'San José Province',
          country: 'Costa Rica',
          countryCode: 'CR',
        },
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.hostname).toBe('nominatim.openstreetmap.org');
      expect(url.pathname).toBe('/search');
      expect(url.searchParams.get('format')).toBe('jsonv2');
      expect(url.searchParams.get('limit')).toBe('1');
      expect(url.searchParams.get('addressdetails')).toBe('1');
      expect(url.searchParams.get('q')).toBe('san josé, costa rica');
    });

    it('caches successful geocode requests and does not call fetch twice', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockNominatimSuccess(),
      });
      vi.stubGlobal('fetch', fetchMock);

      const res1 = await externalContextService.geocode('San José, Costa Rica');
      const res2 = await externalContextService.geocode('  san josé,   costa rica  ');

      expect(res1).toEqual(res2);
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws not-found error when Nominatim returns an empty list', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      }));

      await expect(externalContextService.geocode('Nonexistent Place xyz123')).rejects.toThrow(
        /No matching location was found/i,
      );
    });

    it('throws error for empty or whitespace query without network call', async () => {
      const fetchMock = vi.fn();
      vi.stubGlobal('fetch', fetchMock);

      await expect(externalContextService.geocode('   ')).rejects.toThrow(/Enter a location/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('handles network failure gracefully', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

      await expect(externalContextService.geocode('San José')).rejects.toThrow(
        /Location search is temporarily unavailable/i,
      );
    });

    it('handles malformed Nominatim payload', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ lat: 'invalid', lon: null }],
      }));

      await expect(externalContextService.geocode('San José')).rejects.toThrow(
        /Location search returned an incomplete response/i,
      );
    });
  });

  describe('getWeather (Open-Meteo)', () => {
    it('fetches current weather with coordinates', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWeatherSuccess(25.1, 1, 0, 15.5),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await externalContextService.getWeather({ latitude: 9.93, longitude: -84.08 });
      expect(result).toMatchObject({
        latitude: 9.93,
        longitude: -84.08,
        temperature: 25.1,
        weatherCode: 1,
        precipitation: 0,
        windSpeed: 15.5,
        observedAt: '2026-10-05T14:00',
      });

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.hostname).toBe('api.open-meteo.com');
      expect(url.searchParams.get('latitude')).toBe('9.93');
      expect(url.searchParams.get('longitude')).toBe('-84.08');
      expect(url.searchParams.get('current')).toContain('temperature_2m');
    });

    it('handles weather service error', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
      }));

      await expect(
        externalContextService.getWeather({ latitude: 9.93, longitude: -84.08 }),
      ).rejects.toThrow(/Weather is temporarily unavailable/i);
    });

    it('handles missing temperature in weather payload', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ current: {} }),
      }));

      await expect(
        externalContextService.getWeather({ latitude: 9.93, longitude: -84.08 }),
      ).rejects.toThrow(/Weather returned an incomplete response/i);
    });
  });

  describe('getSeismicContext (USGS Earthquake Catalog)', () => {
    it('queries USGS and normalizes seismic events', async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockUsgsSuccess(),
      });
      vi.stubGlobal('fetch', fetchMock);

      const result = await externalContextService.getSeismicContext({ latitude: 9.93, longitude: -84.08 });

      expect(result.eventCount).toBe(2);
      expect(result.radiusKm).toBe(300);
      expect(result.days).toBe(30);
      expect(result.strongest).toMatchObject({
        magnitude: 4.8,
        place: expect.stringContaining('Jacó'),
      });
      expect(result.nearest).toMatchObject({
        place: expect.stringContaining('San José'),
      });
      expect(result.mostRecent).toMatchObject({
        magnitude: 4.8,
      });

      const url = new URL(fetchMock.mock.calls[0][0] as string);
      expect(url.hostname).toBe('earthquake.usgs.gov');
      expect(url.searchParams.get('format')).toBe('geojson');
      expect(url.searchParams.get('maxradiuskm')).toBe('300');
    });

    it('returns empty seismic context when features array is empty', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ type: 'FeatureCollection', features: [] }),
      }));

      const result = await externalContextService.getSeismicContext({ latitude: 9.93, longitude: -84.08 });
      expect(result.eventCount).toBe(0);
      expect(result.strongest).toBeNull();
      expect(result.nearest).toBeNull();
      expect(result.mostRecent).toBeNull();
    });

    it('handles USGS API failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
      }));

      await expect(
        externalContextService.getSeismicContext({ latitude: 9.93, longitude: -84.08 }),
      ).rejects.toThrow(/Seismic context is temporarily unavailable/i);
    });
  });
});

describe('ExternalContextPanel UI Component', () => {
  beforeEach(() => {
    resetExternalContextState();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    resetExternalContextState();
    vi.restoreAllMocks();
  });

  it('renders initial state with input, button, and attributions', () => {
    render(<ExternalContextPanel />);
    expect(screen.getByTestId('site-intelligence-input')).toBeDefined();
    expect(screen.getByTestId('site-intelligence-analyze')).toBeDefined();
    expect(screen.getByText(/OpenStreetMap contributors/i)).toBeDefined();
    expect(screen.getByText(/Open-Meteo\.com/i)).toBeDefined();
    expect(screen.getByText(/USGS Earthquake Hazards Program/i)).toBeDefined();
  });

  it('does NOT fetch or geocode on keystroke (manual search only)', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<ExternalContextPanel />);
    const input = screen.getByTestId('site-intelligence-input');
    fireEvent.change(input, { target: { value: 'Cartago, Costa Rica' } });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('performs full site intelligence analysis on Analyze click', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('nominatim')) {
        return { ok: true, json: async () => mockNominatimSuccess() };
      }
      if (url.includes('open-meteo')) {
        return { ok: true, json: async () => mockWeatherSuccess(22.5, 3, 1.2, 18.0) };
      }
      if (url.includes('earthquake.usgs')) {
        return { ok: true, json: async () => mockUsgsSuccess() };
      }
      return { ok: false, status: 404 };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ExternalContextPanel />);
    fireEvent.click(screen.getByTestId('site-intelligence-analyze'));

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-location')).toBeDefined();
    });

    expect(screen.getByText(/San José, San José Canton/i)).toBeDefined();

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-weather')).toBeDefined();
      expect(screen.getByTestId('site-intelligence-seismic')).toBeDefined();
    });

    expect(screen.getByText('22.5°C')).toBeDefined();
    expect(screen.getByText(/Overcast/i)).toBeDefined();
    expect(screen.getByText(/events recorded within 300 km/i)).toBeDefined();
    expect(screen.getAllByText(/M4.8/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Contextual seismic observations for site planning/i)).toBeDefined();
  });

  it('handles partial failure: weather fails but seismic succeeds', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('nominatim')) {
        return { ok: true, json: async () => mockNominatimSuccess() };
      }
      if (url.includes('open-meteo')) {
        return { ok: false, status: 503 };
      }
      if (url.includes('earthquake.usgs')) {
        return { ok: true, json: async () => mockUsgsSuccess() };
      }
      return { ok: false };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ExternalContextPanel />);
    fireEvent.click(screen.getByTestId('site-intelligence-analyze'));

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-location')).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-weather-error')).toBeDefined();
    });

    expect(screen.getByText(/Weather is temporarily unavailable/i)).toBeDefined();
    expect(screen.getByTestId('site-intelligence-seismic')).toBeDefined();
    expect(screen.getByText(/events recorded within 300 km/i)).toBeDefined();
  });

  it('handles partial failure: seismic fails but weather succeeds', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('nominatim')) {
        return { ok: true, json: async () => mockNominatimSuccess() };
      }
      if (url.includes('open-meteo')) {
        return { ok: true, json: async () => mockWeatherSuccess(26.0, 0, 0, 8.0) };
      }
      if (url.includes('earthquake.usgs')) {
        return { ok: false, status: 500 };
      }
      return { ok: false };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ExternalContextPanel />);
    fireEvent.click(screen.getByTestId('site-intelligence-analyze'));

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-location')).toBeDefined();
    });

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-seismic-error')).toBeDefined();
    });

    expect(screen.getByText(/Seismic context is temporarily unavailable/i)).toBeDefined();
    expect(screen.getByTestId('site-intelligence-weather')).toBeDefined();
    expect(screen.getByText('26°C')).toBeDefined();
    expect(screen.getByText(/Clear sky/i)).toBeDefined();
  });

  it('displays error when geocode fails and does not call weather or seismic APIs', async () => {
    const fetchMock = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes('nominatim')) {
        return { ok: true, json: async () => [] };
      }
      return { ok: true };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<ExternalContextPanel />);
    const input = screen.getByTestId('site-intelligence-input');
    fireEvent.change(input, { target: { value: 'Nonexistent Unknown City' } });
    fireEvent.click(screen.getByTestId('site-intelligence-analyze'));

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-location-error')).toBeDefined();
    });

    expect(screen.getByText(/No matching location was found/i)).toBeDefined();
    expect(screen.queryByTestId('site-intelligence-weather')).toBeNull();
    expect(screen.queryByTestId('site-intelligence-seismic')).toBeNull();
  });

  it('displays validation error if user tries to analyze an empty location', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<ExternalContextPanel />);
    const input = screen.getByTestId('site-intelligence-input');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(screen.getByTestId('site-intelligence-analyze'));

    await waitFor(() => {
      expect(screen.getByTestId('site-intelligence-location-error')).toBeDefined();
    });

    expect(screen.getByText(/Enter a location to analyze/i)).toBeDefined();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
