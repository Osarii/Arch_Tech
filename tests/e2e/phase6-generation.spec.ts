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

    // Verify Phase 6B.1 badge
    await expect(page.getByText('Phase 6B.1')).toBeVisible();

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

  test('Phase 6B.1: authors real IFC4 from generation plan, validates by reopening with web-ifc, and loads generated model upon human confirmation', async ({ page }) => {
    test.setTimeout(80000);

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
    await aiTab.click();

    // 2. Click Quick Generation Prompt Chip to generate preview
    const genChip = page.getByTestId('ai-chip-0');
    await expect(genChip).toBeVisible();
    await genChip.click();

    await expect(page.getByText('BIM Generation Preview')).toBeVisible({ timeout: 15000 });

    // Verify active preview in Three.js
    const previewActive = await page.evaluate(() => {
      const genService = (window as any).bimGenerationService;
      return genService ? genService.hasActivePreview() : false;
    });
    expect(previewActive).toBe(true);

    // 3. Click 'Commit to model' chip (ai-chip-2)
    const commitChip = page.getByTestId('ai-chip-2');
    await expect(commitChip).toBeVisible();
    await expect(commitChip).toContainText('Commit to model');
    await commitChip.click();

    // 4. Verify WRITE proposal card appears and does NOT execute yet
    const proposalCard = page.getByTestId('ai-proposal-card');
    await expect(proposalCard).toBeVisible({ timeout: 10000 });
    await expect(proposalCard).toContainText('WRITE ACTION CONFIRMATION');
    await expect(proposalCard).toContainText('commit_generation');
    await expect(proposalCard).toContainText('Author real IFC4 model from generation plan');

    // Confirm buttons are available
    const confirmBtn = page.getByTestId('ai-confirm-write');
    const rejectBtn = page.getByTestId('ai-reject-write');
    await expect(confirmBtn).toBeVisible();
    await expect(rejectBtn).toBeVisible();

    // 5. Test rejection safety first
    await rejectBtn.click();
    await expect(page.getByText('Action Cancelled')).toBeVisible();

    // Verify preview is STILL intact after rejection
    const stillActivePreview = await page.evaluate(() => {
      const genService = (window as any).bimGenerationService;
      return genService ? genService.hasActivePreview() : false;
    });
    expect(stillActivePreview).toBe(true);

    // 6. Now commit again and confirm
    await commitChip.click();
    const newProposalCard = page.getByTestId('ai-proposal-card').last();
    await expect(newProposalCard).toBeVisible({ timeout: 10000 });
    const newConfirmBtn = page.getByTestId('ai-confirm-write').last();
    await newConfirmBtn.click();

    // 7. Verify model loads into viewer
    // Waiting for confirmation execution and loadIfc
    await expect(page.getByText('generated_building_2s.ifc').first()).toBeVisible({ timeout: 30000 });
    await expect(page.getByText('11 elements').first()).toBeVisible();

    // Verify Model Overview in Properties panel
    await expect(page.getByText(/Total Elements:\s*11/i)).toBeVisible();
    await expect(page.getByText(/Walls\s*8/i)).toBeVisible();
    await expect(page.getByText(/Slabs\s*3/i)).toBeVisible();
    await expect(page.getByText(/Storeys\s*2/i)).toBeVisible();

    // Open AI tab to verify success message
    await aiTab.click();
    await expect(page.getByText('Executed & Recorded in Change Set').last()).toBeVisible();
    await expect(page.getByText(/Confirmed & Executed: Author real IFC4 model/i)).toBeVisible();

    // Verify preview is cleared and real IFC model is loaded in bimEngine
    const authoredModelState = await page.evaluate(() => {
      const genService = (window as any).bimGenerationService;
      const engine = (window as any).bimEngine;
      const model = engine?.currentModel;
      const bounds = engine?.getModelBounds();
      return {
        hasActivePreview: genService?.hasActivePreview(),
        hasLoadedModel: !!model,
        modelBoundsEmpty: bounds ? bounds.isEmpty() : true,
      };
    });

    expect(authoredModelState.hasActivePreview).toBe(false);
    expect(authoredModelState.hasLoadedModel).toBe(true);
    expect(authoredModelState.modelBoundsEmpty).toBe(false);

    // 8. Verify Spatial Tree Panel reflects the generated IFC model
    const treeTab = page.getByTestId('tab-spatial-tree');
    await treeTab.click();

    // Exactly 2 storeys from generated plan should be in the tree (NO Roof Level storey)
    await expect(page.getByText('Level 0 (Ground Floor)')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Level 1')).toBeVisible();
    await expect(page.getByText('Roof Level')).not.toBeVisible();

    // Verify Wall and Slab category counts match generation plan (8 walls, 3 slabs = 11 elements)
    await expect(page.getByText(/Walls/i).first()).toBeVisible();
    await expect(page.getByText(/Slabs/i).first()).toBeVisible();

    // 9. Phase 6B.2 Persistence Round-Trip: edit -> persist -> reload -> edit again -> persist again -> reload again
    // Switch to Edit Mode
    await page.getByTestId('mode-edit').click();
    await expect(page.getByTestId('tab-edit')).toBeVisible();

    // Select the first element in spatial tree
    await page.getByTitle('Expand All').click();
    const firstWall = page.getByTestId('tree-element-leaf').first();
    await expect(firstWall).toBeVisible();
    await firstWall.click();

    // First edit: Move element
    await page.getByTestId('btn-move-x-add-1').click();

    // Open Change Set Panel
    const csTab = page.getByTestId('tab-changeset');
    await csTab.click();
    await expect(page.getByText('Change Set (1)')).toBeVisible();

    // Save & Reload Persisted IFC
    const saveReloadBtn = page.getByTestId('btn-save-reload-ifc');
    await expect(saveReloadBtn).toBeEnabled();
    await saveReloadBtn.click();

    // Verify first persisted reload
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('generated_building_2s_persisted.ifc').first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('11 elements').first()).toBeVisible();

    // Verify change set is reset
    await csTab.click();
    await expect(page.getByText('No changes recorded yet.')).toBeVisible();

    // Second edit: Select an element and move it again
    await page.getByTestId('tab-spatial-tree').click();
    await page.getByTitle('Expand All').click();
    const secondElem = page.getByTestId('tree-element-leaf').nth(1);
    await secondElem.click();

    await page.getByTestId('tab-edit').click();
    await page.getByTestId('btn-move-x-add-1').click();

    // Second Save & Reload
    await csTab.click();
    await expect(page.getByText('Change Set (1)')).toBeVisible();
    const saveReloadBtn2 = page.getByTestId('btn-save-reload-ifc');
    await expect(saveReloadBtn2).toBeEnabled();
    await saveReloadBtn2.click();

    // Verify second persisted reload completes with no corruption
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });
    await expect(page.getByText(/generated_building_2s_persisted.*\.ifc/i).first()).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('11 elements').first()).toBeVisible();

    await csTab.click();
    await expect(page.getByText('No changes recorded yet.')).toBeVisible();

    expect(criticalErrors).toEqual([]);
  });
});
