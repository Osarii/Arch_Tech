import { test, expect } from '@playwright/test';

test.describe('BIM LAB V1 E2E Verification', () => {
  test('renders base application shell, panels, and diagnostics', async ({ page }) => {
    await page.goto('/');

    // Check title and brand
    await expect(page).toHaveTitle(/BIM LAB/i);
    await expect(page.getByText('BIM LAB')).toBeVisible();

    // Check header controls
    await expect(page.getByRole('button', { name: /Open IFC/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sample \(Fast\)/i })).toBeVisible();

    // Check empty state
    await expect(page.getByText('No BIM Model Loaded')).toBeVisible();

    // Check panels
    await expect(page.getByText('Spatial BIM Tree')).toBeVisible();
    await expect(page.getByText('Properties & Data')).toBeVisible();

    // Check diagnostics
    await expect(page.getByText('Diagnostics')).toBeVisible();
    await expect(page.getByText(/FPS/i).first()).toBeVisible();
  });

  test('loads real IFC model, builds spatial tree, and inspects properties', async ({ page }) => {
    // Increase test timeout for WebAssembly initialization
    test.setTimeout(45000);

    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
    page.on('pageerror', (err) => console.log('BROWSER ERROR:', err));
    await page.goto('/');

    // Click sample model button
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample \(Fast/i });
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Wait for model loading to complete and BottomToolbar to appear
    await expect(page.getByRole('button', { name: /Select/i })).toBeVisible({ timeout: 25000 });
    await expect(page.getByRole('button', { name: /Fit/i })).toBeVisible();

    // Verify spatial tree populated
    await expect(page.getByText(/project/i).first()).toBeVisible();

    // Verify model summary in properties panel
    await expect(page.getByText(/Category Breakdown|Model Overview/i).first()).toBeVisible();
    await expect(page.getByText(/Walls/i).first()).toBeVisible();

    // Test tool switching
    await page.getByRole('button', { name: /Measure/i }).click();
    await expect(page.getByRole('button', { name: /Measure/i })).toHaveClass(/bg-sky-600/);

    await page.getByRole('button', { name: /Section/i }).click();
    await expect(page.getByRole('button', { name: /Add Plane/i })).toBeVisible();

    // Switch back to select
    await page.getByRole('button', { name: /Select/i }).click();

    // Test Fit Model button
    await page.getByRole('button', { name: /Fit/i }).click();

    // Test Close Model
    const closeBtn = page.getByRole('button', { name: /^Close$/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Should return to empty state
    await expect(page.getByText('No BIM Model Loaded')).toBeVisible();
  });
});
