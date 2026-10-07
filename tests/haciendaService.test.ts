import { describe, expect, it, vi } from 'vitest';
import { isCostaRicanId, lookupHaciendaIdentity, normalizeCostaRicanId } from '../src/services/haciendaService';

describe('haciendaService', () => {
  it('normalizes and validates Costa Rican identification input', () => {
    expect(normalizeCostaRicanId('1-2345-6789')).toBe('123456789');
    expect(isCostaRicanId('1-2345-6789')).toBe(true);
    expect(isCostaRicanId('1234')).toBe(false);
  });

  it('distinguishes found, not-found, and unavailable responses without blocking registration', async () => {
    const found = await lookupHaciendaIdentity('123456789', vi.fn().mockResolvedValue(new Response(JSON.stringify({ nombre: 'Ana Solís' }), { status: 200 })));
    const missing = await lookupHaciendaIdentity('123456789', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    const unavailable = await lookupHaciendaIdentity('123456789', vi.fn().mockResolvedValue(new Response('', { status: 429, headers: { 'retry-after': '30' } })));

    expect(found).toEqual({ status: 'found', name: 'Ana Solís' });
    expect(missing).toEqual({ status: 'not-found' });
    expect(unavailable).toEqual({ status: 'unavailable', retryAfter: 30 });
  });
});
