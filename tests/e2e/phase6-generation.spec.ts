import { test, expect } from '@playwright/test';

test.describe('Phase 6A: Deterministic BIM Generation Plan & Safe 3D Preview', () => {
  test('renders Phase 6A AI Assistant badge, quick prompts, and handles valid preview & discard flow', async ({ page }) => {
    test.setTimeout(45000);

    const criticalErrors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error' && !text.includes('favicon') && !text.includes('download')) {
        criticalErrors.push(`[Console Error] ${text}`);
      }
    });
    page.on('pageerror', (err) => {
      criticalErrors.push(`[Page Error] ${err.message}`);
    });

    await page.goto('/');

    // 1. Open AI Assistant Tab
    const aiTab = page.getByTestId('tab-ai');
    await expect(aiTab).toBeVisible();
    await aiTab.click();

    // Verify Phase 6A badge
    await expect(page.getByText('Phase 6A')).toBeVisible();

    // 2. Click Quick Generation Prompt Chip
    const genChip = page.getByTestId('ai-chip-0');
    await expect(genChip).toBeVisible();
    await expect(genChip).toContainText('Preview 10x8m 2-storey building');
    await genChip.click();

    // 3. Verify AI Assistant Output
    await expect(page.getByText('BIM Generation Preview')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/• Dimensions: 10m × 8m/i)).toBeVisible();
    await expect(page.getByText(/• Height: 6m \(2 storeys, 3m\/storey\)/i)).toBeVisible();
    await expect(page.getByText(/• Elements: 8 walls, 3 slabs/i)).toBeVisible();
    await expect(page.getByText(/• Footprint Area: 80\.00 m²/i)).toBeVisible();
    await expect(page.getByText(/• Gross Volume: 480\.00 m³/i)).toBeVisible();
    await expect(page.getByText(/Non-destructive 3D preview overlay rendered/i)).toBeVisible();

    // 4. Verify Change Set is untouched
    const csTab = page.getByTestId('tab-changeset');
    await csTab.click();
    await expect(page.getByText('No changes recorded yet.')).toBeVisible();

    // 5. Return to AI and Discard Preview
    await aiTab.click();
    const discardChip = page.getByTestId('ai-chip-1');
    await expect(discardChip).toBeVisible();
    await discardChip.click();

    await expect(page.getByText(/Cleared 3D generation preview overlay/i).first()).toBeVisible({ timeout: 10000 });

    // 6. Test missing dimensions prompt asks user without generating
    const aiInput = page.getByTestId('ai-chat-input');
    const aiSendBtn = page.getByTestId('ai-chat-send');

    await aiInput.fill('generate building');
    await aiSendBtn.click();

    await expect(page.getByText(/please specify dimensions: length, width, height/i)).toBeVisible({ timeout: 10000 });

    expect(criticalErrors).toEqual([]);
  });
});
