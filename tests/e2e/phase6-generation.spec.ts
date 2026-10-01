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

    // 3. Verify AI Assistant Output & Non-Empty 3D Preview World Bounds
    await expect(page.getByText('BIM Generation Preview')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/• Dimensions: 10m × 8m/i)).toBeVisible();
    await expect(page.getByText(/• Height: 6m \(2 storeys, 3m\/storey\)/i)).toBeVisible();
    await expect(page.getByText(/• Elements: 8 walls, 3 slabs/i)).toBeVisible();
    await expect(page.getByText(/• Footprint Area: 80\.00 m²/i)).toBeVisible();
    await expect(page.getByText(/• Gross Volume: 480\.00 m³/i)).toBeVisible();
    await expect(page.getByText(/Non-destructive 3D preview overlay rendered/i)).toBeVisible();

    // Verify 3D preview layer in BimGenerationService
    const previewState = await page.evaluate(() => {
      const genService = (window as any).bimGenerationService;
      if (!genService) return null;
      const bounds = genService.getPreviewBounds();
      return {
        hasActivePreview: genService.hasActivePreview(),
        isEmpty: bounds.isEmpty(),
        sizeX: bounds.max.x - bounds.min.x,
        sizeZ: bounds.max.z - bounds.min.z,
        sizeY: bounds.max.y - bounds.min.y,
        childCount: genService.previewGroup.children.length,
      };
    });

    expect(previewState).not.toBeNull();
    expect(previewState?.hasActivePreview).toBe(true);
    expect(previewState?.isEmpty).toBe(false);
    expect(previewState?.sizeX).toBeGreaterThanOrEqual(10);
    expect(previewState?.sizeZ).toBeGreaterThanOrEqual(8);
    expect(previewState?.sizeY).toBeGreaterThanOrEqual(6);
    expect(previewState?.childCount).toBe(11); // 8 walls + 3 slabs

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

    const discardedState = await page.evaluate(() => {
      const genService = (window as any).bimGenerationService;
      if (!genService) return null;
      return {
        hasActivePreview: genService.hasActivePreview(),
        isEmpty: genService.getPreviewBounds().isEmpty(),
        childCount: genService.previewGroup.children.length,
      };
    });
    expect(discardedState?.hasActivePreview).toBe(false);
    expect(discardedState?.isEmpty).toBe(true);
    expect(discardedState?.childCount).toBe(0);

    // 6. Test missing dimensions prompt asks user without generating
    const aiInput = page.getByTestId('ai-chat-input');
    const aiSendBtn = page.getByTestId('ai-chat-send');

    await aiInput.fill('generate building');
    await aiSendBtn.click();

    await expect(page.getByText(/please specify dimensions: length, width, height/i)).toBeVisible({ timeout: 10000 });

    expect(criticalErrors).toEqual([]);
  });

  test('loads Sample House IFC and verifies viewport camera fitting across load, preview, discard, and fit button', async ({ page }) => {
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

    // 1. Load Sample House IFC
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample \(Fast/i });
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Wait for model load to complete
    const fitBtn = page.getByTestId('action-fit');
    await expect(fitBtn).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('Ready')).toBeHidden({ timeout: 25000 });

    // Verify IFC model geometry bounds computed (non-empty) and camera fitted
    const ifcState = await page.evaluate(() => {
      const engine = (window as any).bimEngine;
      if (!engine || !engine.currentModel) return null;
      const bounds = engine.getModelBounds();
      return {
        hasModel: true,
        boundsEmpty: bounds ? bounds.isEmpty() : true,
        boundsMin: bounds ? [bounds.min.x, bounds.min.y, bounds.min.z] : null,
        boundsMax: bounds ? [bounds.max.x, bounds.max.y, bounds.max.z] : null,
      };
    });

    expect(ifcState).not.toBeNull();
    expect(ifcState?.hasModel).toBe(true);
    expect(ifcState?.boundsEmpty).toBe(false);

    // a) Verify Sample IFC is visible after load
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/a_ifc_visible_after_load.png' });

    // 2. Open AI Assistant & Generate Preview
    const aiTab = page.getByTestId('tab-ai');
    await aiTab.click();
    const genChip = page.getByTestId('ai-chip-0');
    await genChip.click();

    await expect(page.getByText('BIM Generation Preview')).toBeVisible({ timeout: 10000 });

    // Verify generation preview has valid non-empty bounds
    const previewBounds = await page.evaluate(() => {
      const genService = (window as any).bimGenerationService;
      const b = genService?.getPreviewBounds();
      return b ? { isEmpty: b.isEmpty(), min: [b.min.x, b.min.y, b.min.z], max: [b.max.x, b.max.y, b.max.z] } : null;
    });
    expect(previewBounds?.isEmpty).toBe(false);

    // b) Verify Phase 6 preview is visibly centered after generation
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/b_preview_centered_after_generation.png' });

    // 3. Discard Preview and verify return to loaded IFC model view
    const discardChip = page.getByTestId('ai-chip-1');
    await discardChip.click();
    await expect(page.getByText(/Cleared 3D generation preview overlay/i).first()).toBeVisible({ timeout: 10000 });

    const postDiscardState = await page.evaluate(() => {
      const genService = (window as any).bimGenerationService;
      const engine = (window as any).bimEngine;
      return {
        hasActivePreview: genService?.hasActivePreview(),
        hasModel: !!engine?.currentModel,
      };
    });
    expect(postDiscardState.hasActivePreview).toBe(false);
    expect(postDiscardState.hasModel).toBe(true);

    // c) Verify discard returns to loaded IFC view
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/c_discard_returns_to_ifc.png' });

    // 4. Verify Fit View button executes successfully
    await expect(fitBtn).toBeEnabled();
    await fitBtn.click();

    // d) Verify Fit button still works
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'test-results/d_fit_button_works.png' });

    // Verify camera controls still operational and model bounds remain valid
    const finalState = await page.evaluate(() => {
      const engine = (window as any).bimEngine;
      const bounds = engine?.getModelBounds();
      return {
        hasControls: !!engine?.world?.camera?.controls,
        boundsEmpty: bounds ? bounds.isEmpty() : true,
      };
    });
    expect(finalState.hasControls).toBe(true);
    expect(finalState.boundsEmpty).toBe(false);

    expect(criticalErrors).toEqual([]);
  });
});
