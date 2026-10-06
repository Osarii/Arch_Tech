import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { NewsSection } from '../src/components/news/NewsSection';
import { getPublicNewsUpdate, getPublicNewsUpdates } from '../src/services/newsService';

describe('public project updates', () => {
  beforeEach(() => window.localStorage.clear());
  afterEach(() => cleanup());

  it('returns published updates in deterministic newest-first order with project context', () => {
    const updates = getPublicNewsUpdates();
    expect(updates.length).toBeGreaterThanOrEqual(3);
    expect(updates[0]).toMatchObject({
      projectId: 'santa-ana-country-club',
      date: '01 OCT 2026',
      projectTitle: 'Santa Ana Country Club',
    });
    expect(updates.every((update) => update.image.startsWith('/projects/'))).toBe(true);
    expect(getPublicNewsUpdate(updates[0].id)?.title).toBe(updates[0].title);
  });

  it('renders the latest three editorial updates and routes archive access', () => {
    const onNavigate = vi.fn();
    render(<NewsSection onNavigate={onNavigate} />);

    expect(screen.getByRole('heading', { name: 'Latest updates.' })).toBeDefined();
    expect(screen.getAllByRole('article')).toHaveLength(3);
    screen.getByRole('button', { name: /View all updates/i }).click();
    expect(onNavigate).toHaveBeenCalledWith('/news');
  });
});
