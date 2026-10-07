export type HaciendaLookupResult =
  | { status: 'found'; name: string }
  | { status: 'not-found' }
  | { status: 'unavailable'; retryAfter?: number };

export const normalizeCostaRicanId = (value: string): string => value.replace(/\D/g, '');

export const isCostaRicanId = (value: string): boolean => /^\d{9,12}$/.test(normalizeCostaRicanId(value));

export async function lookupHaciendaIdentity(
  identification: string,
  fetcher: typeof fetch = fetch,
): Promise<HaciendaLookupResult> {
  const normalized = normalizeCostaRicanId(identification);
  if (!isCostaRicanId(normalized)) return { status: 'not-found' };

  try {
    const response = await fetcher(`https://api.hacienda.go.cr/fe/ae?identificacion=${encodeURIComponent(normalized)}`);
    if (response.status === 404) return { status: 'not-found' };
    if (!response.ok) {
      const retryAfter = Number(response.headers.get('retry-after'));
      return { status: 'unavailable', ...(Number.isFinite(retryAfter) ? { retryAfter } : {}) };
    }
    const data = await response.json() as { nombre?: string };
    return data.nombre ? { status: 'found', name: data.nombre } : { status: 'not-found' };
  } catch {
    return { status: 'unavailable' };
  }
}
