import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminNewsPage } from '../src/components/portal/admin/AdminNewsPage';

describe('AdminNewsPage UI and Management', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders editorial news register header and metrics strip', async () => {
    render(<AdminNewsPage />);

    expect(screen.getByText(/Editorial news register/i)).toBeDefined();
    expect(screen.getByText(/Published News/i)).toBeDefined();
    expect(screen.getByText(/Draft Register/i)).toBeDefined();
    expect(screen.getByText(/n8n Ingests/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /New article/i })).toBeDefined();
  });

  it('renders news articles with badges and metadata', async () => {
    render(<AdminNewsPage />);

    // Seed articles
    expect(screen.getByText(/Zona Franca La Lima Announces Phase 4/i)).toBeDefined();
    expect(screen.getByText(/Automated Drone Telemetry Report/i)).toBeDefined();
    expect(screen.getAllByText(/n8n telemetry/i).length).toBeGreaterThan(0);
  });

  it('filters articles by search input', async () => {
    render(<AdminNewsPage />);

    const searchInput = screen.getByLabelText(/Search news/i);
    fireEvent.change(searchInput, { target: { value: 'Drone Telemetry' } });

    expect(screen.getByText(/Automated Drone Telemetry Report/i)).toBeDefined();
    expect(screen.queryByText(/Zona Franca La Lima Announces Phase 4/i)).toBeNull();
  });

  it('filters articles by status', async () => {
    render(<AdminNewsPage />);

    const statusFilter = screen.getByLabelText(/Filter by status/i);
    fireEvent.change(statusFilter, { target: { value: 'draft' } });

    expect(screen.getByText(/Automated Drone Telemetry Report/i)).toBeDefined();
    expect(screen.queryByText(/Zona Franca La Lima Announces Phase 4/i)).toBeNull();
  });

  it('allows publishing a draft article and unpublishing a published article', async () => {
    render(<AdminNewsPage />);

    // Find the drone draft and publish it
    const publishBtn = screen.getByLabelText(/Publish Automated Drone Telemetry Report/i);
    fireEvent.click(publishBtn);

    await waitFor(() => {
      expect(screen.getByText(/published successfully/i)).toBeDefined();
    });

    const unpublishBtn = screen.getByLabelText(/Unpublish Automated Drone Telemetry Report/i);
    expect(unpublishBtn).toBeDefined();
  });

  it('opens create modal, submits a new article, and displays it in the list', async () => {
    render(<AdminNewsPage />);

    const createBtn = screen.getByRole('button', { name: /New article/i });
    fireEvent.click(createBtn);

    expect(screen.getByRole('dialog')).toBeDefined();
    expect(screen.getByText(/Draft New Article/i)).toBeDefined();

    const titleInput = screen.getByPlaceholderText(/e\.g\. Zona Franca/i);
    fireEvent.change(titleInput, { target: { value: 'Brand New Campus Inauguration' } });

    const form = screen.getByRole('dialog').querySelector('form')!;
    await fireEvent.submit(form);

    await waitFor(() => {
      const alert = screen.queryByRole('alert');
      if (alert) console.log('MODAL ALERT:', alert.textContent);
      expect(screen.queryByRole('dialog')).toBeNull();
      expect(screen.getByRole('heading', { name: /Brand New Campus Inauguration/i })).toBeDefined();
    });
  });
});
