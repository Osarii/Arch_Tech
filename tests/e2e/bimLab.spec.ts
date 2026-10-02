import { test, expect } from '@playwright/test';

test.describe('BIM LAB V1 & V2 Comprehensive E2E Verification', () => {
  test('renders base application shell, panels, and diagnostics', async ({ page }) => {
    await page.goto('/?view=workspace');

    // Check title and brand
    await expect(page).toHaveTitle(/ARCH_TECH/i);
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

  test('executes real IFC workflow: load -> Ready -> tree -> select -> properties -> Hide -> Show All -> Isolate -> Fit', async ({ page }) => {
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

    await page.goto('/?view=workspace');

    // 1. IFC Load
    const loadSampleBtn = page.getByTestId('header-btn-sample-fast');
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // 2. Ready State & Bottom Toolbar
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });
    await expect(page.getByText('Ready')).toBeHidden({ timeout: 25000 });

    // 3. BIM Tree verification
    await expect(page.locator('[data-type="IFCPROJECT"]').first()).toBeVisible();

    // Expand tree to find real elements
    const expandAllBtn = page.getByTitle('Expand All');
    await expect(expandAllBtn).toBeVisible();
    await expandAllBtn.click();

    // Locate physical building element leaf
    const elementNode = page.getByTestId('tree-element-leaf').first();
    await expect(elementNode).toBeVisible();
    const expressId = await elementNode.getAttribute('data-express-id');
    expect(expressId).toBeTruthy();

    // 4. Select Real Element
    await elementNode.click();

    // 5. Verify Real Properties displayed
    const expressIdBadge = page.getByTestId('selected-element-express-id');
    await expect(expressIdBadge).toBeVisible();
    await expect(expressIdBadge).toContainText(`#${expressId}`);

    const elementType = page.getByTestId('selected-element-type');
    await expect(elementType).toBeVisible();

    const elementGuid = page.getByTestId('selected-element-guid');
    await expect(elementGuid).toBeVisible();

    // Verify property groups rendered (Attributes, Property Sets, etc.)
    await expect(page.getByText(/Attributes/i).first()).toBeVisible();

    // 6. Test Hide tool
    const hideBtn = page.getByTestId('action-hide');
    await expect(hideBtn).toBeEnabled();
    await hideBtn.click();

    // Selection clears after hiding
    await expect(expressIdBadge).toBeHidden();

    // 7. Test Show All tool
    const showAllBtn = page.getByTestId('action-show-all');
    await expect(showAllBtn).toBeVisible();
    await showAllBtn.click();

    // 8. Re-select and Test Isolate tool
    await elementNode.click();
    await expect(expressIdBadge).toBeVisible();

    const isolateBtn = page.getByTestId('action-isolate');
    await expect(isolateBtn).toBeEnabled();
    await isolateBtn.click();

    // 9. Test Fit tool
    const fitBtn = page.getByTestId('action-fit');
    await expect(fitBtn).toBeVisible();
    await fitBtn.click();

    expect(criticalErrors).toEqual([]);
  });

  test('verifies lifecycle reliability: load -> close -> load again with clean state reset', async ({ page }) => {
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

    await page.goto('/?view=workspace');

    // --- CYCLE 1: First Load ---
    const sampleBtn = page.getByTestId('header-btn-sample-fast');
    await sampleBtn.click();

    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });
    await expect(page.locator('[data-type="IFCPROJECT"]').first()).toBeVisible();

    // Expand and select element
    await page.getByTitle('Expand All').click();
    const elementNode1 = page.getByTestId('tree-element-leaf').first();
    await expect(elementNode1).toBeVisible();
    await elementNode1.click();
    await expect(page.getByTestId('selected-element-express-id')).toBeVisible();

    // Hide the element
    await page.getByTestId('action-hide').click();
    await expect(page.getByTestId('selected-element-express-id')).toBeHidden();

    // --- CLOSE MODEL ---
    const closeBtn = page.getByRole('button', { name: /^Close$/i });
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    // Verify all components returned to clean empty state
    await expect(page.getByText('No BIM Model Loaded')).toBeVisible();
    await expect(page.getByText('No spatial structure available')).toBeVisible();
    await expect(page.getByText('Select an element or load an IFC model to view properties.')).toBeVisible();
    await expect(page.getByTestId('action-fit')).toBeHidden();

    // --- CYCLE 2: Second Load (Reload) ---
    await sampleBtn.click();

    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 30000 });
    await expect(page.locator('[data-type="IFCPROJECT"]').first()).toBeVisible({ timeout: 30000 });

    // Verify tree can be expanded and selected fresh
    await page.getByTitle('Expand All').click();
    const elementNode2 = page.getByTestId('tree-element-leaf').first();
    await expect(elementNode2).toBeVisible();
    await elementNode2.click();

    // Verify properties inspect cleanly on second model load
    await expect(page.getByTestId('selected-element-express-id')).toBeVisible();
    await expect(page.getByTestId('selected-element-type')).toBeVisible();

    // Clean up
    await page.getByRole('button', { name: /^Close$/i }).click();
    await expect(page.getByText('No BIM Model Loaded')).toBeVisible();

    expect(criticalErrors).toEqual([]);
  });

  test('verifies Phase 2 advanced inspection: 2D floor plans, X/Y/Z sections, filtering, analysis, viewpoints', async ({ page }) => {
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

    await page.goto('/?view=workspace');

    // Load Model
    await page.getByTestId('header-btn-sample-fast').click();
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });

    // 1. Verify Storeys & 2D Floor Plan Mode
    await page.getByTestId('tab-storeys').click();
    await expect(page.getByText(/Building Storeys/i)).toBeVisible();
    const floorPlanBtn = page.getByRole('button', { name: /2D Floor Plan/i }).first();
    await expect(floorPlanBtn).toBeVisible();
    await floorPlanBtn.click();

    // Header should show 2D Plan badge
    await expect(page.getByTestId('header-badge-2d-mode')).toBeVisible();

    // Exit 2D Mode via toolbar quick toggle
    const toggle2dBtn = page.getByTestId('btn-toggle-2d-3d');
    await expect(toggle2dBtn).toBeVisible();
    await toggle2dBtn.click(); // Returns to 3D
    await expect(page.getByTestId('header-badge-2d-mode')).toBeHidden();

    // 2. Verify X / Y / Z Section Cuts
    await page.getByTestId('tool-section').click();
    await expect(page.getByTestId('section-btn-x')).toBeVisible();
    await expect(page.getByTestId('section-btn-y')).toBeVisible();
    await expect(page.getByTestId('section-btn-z')).toBeVisible();

    // Create X and Y section planes
    await page.getByTestId('section-btn-x').click();
    await page.getByTestId('section-btn-y').click();

    // Clear section planes
    const clearSectionsBtn = page.getByTestId('section-btn-clear');
    await expect(clearSectionsBtn).toBeVisible();
    await clearSectionsBtn.click();
    await expect(clearSectionsBtn).toBeHidden();

    // 3. Verify Multi-Mode Measurement
    await page.getByTestId('tool-measure').click();
    await expect(page.getByTestId('measure-btn-distance')).toBeVisible();
    await expect(page.getByTestId('measure-btn-area')).toBeVisible();
    await expect(page.getByTestId('measure-btn-angle')).toBeVisible();

    await page.getByTestId('measure-btn-area').click();
    await page.getByTestId('measure-btn-distance').click();
    await page.getByTestId('measure-btn-clear').click();

    // 4. Verify Advanced Filter Panel
    await page.getByTestId('tab-filter').click();
    await expect(page.getByTestId('filter-match-count')).toBeVisible();

    // Select category filter
    const typeSelect = page.getByTestId('filter-select-type');
    await expect(typeSelect).toBeVisible();
    await typeSelect.selectOption({ label: 'Walls' });

    // Verify matching count updated
    await expect(page.getByTestId('filter-match-count')).not.toHaveText('0');

    // Isolate matches
    await page.getByTestId('filter-btn-isolate').click();

    // Reset filters
    await page.getByRole('button', { name: /Reset/i }).click();

    // 5. Verify BIM Analysis Panel
    await page.getByTestId('tab-analysis').click();
    await expect(page.getByText(/Real IFC Quantities Takeoff/i)).toBeVisible();
    await expect(page.getByText(/Storey Distribution/i)).toBeVisible();
    await expect(page.getByText(/Category Breakdown/i)).toBeVisible();

    // 6. Verify Local Viewpoints
    await page.getByTestId('tab-viewpoints').click();
    const saveViewBtn = page.getByTestId('btn-save-viewpoint');
    await expect(saveViewBtn).toBeVisible();
    await saveViewBtn.click();

    await page.getByTestId('input-viewpoint-title').fill('Isometric Master View');
    await page.getByTestId('btn-confirm-save-viewpoint').click();

    // Viewpoint should appear in list
    const viewpointItem = page.getByTestId('viewpoint-item-isometric-master-view');
    await expect(viewpointItem).toBeVisible();

    // Click to restore viewpoint
    await viewpointItem.click();

    expect(criticalErrors).toEqual([]);
  });

  test('verifies Phase 3 non-destructive BIM editing: inspect/edit modes, transforms, visual overrides, temp delete/restore, undo/redo, change set tracking, reset all', async ({ page }) => {
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

    await page.goto('/?view=workspace');

    // 1. Load Model
    await page.getByTestId('header-btn-sample-fast').click();
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });

    // 2. Verify Mode Switch (Inspect -> Edit)
    const modeInspectBtn = page.getByTestId('mode-inspect');
    const modeEditBtn = page.getByTestId('mode-edit');
    await expect(modeInspectBtn).toBeVisible();
    await expect(modeEditBtn).toBeVisible();

    await modeEditBtn.click();
    await expect(page.getByTestId('tab-edit')).toBeVisible();

    // 3. Select an Element
    await page.getByTitle('Expand All').click();
    const firstElement = page.getByTestId('tree-element-leaf').first();
    await expect(firstElement).toBeVisible();
    await firstElement.click();

    // 4. Verify Edit Inspector shows element and transform controls
    const inputMoveX = page.getByTestId('input-move-x');
    await expect(inputMoveX).toBeVisible();

    // Move element by +1m on X axis
    await page.getByTestId('btn-move-x-add-1').click();
    await expect(inputMoveX).toHaveValue('1');

    // Header badge should indicate 1 edit
    await expect(page.getByTestId('header-changes-badge')).toContainText('1 edit');

    // 5. Visual Appearance Overrides (Cyan Color)
    const cyanSwatch = page.getByTestId('color-swatch-cyan');
    await expect(cyanSwatch).toBeVisible();
    await cyanSwatch.click();
    await expect(page.getByTestId('header-changes-badge')).toContainText('2 edits');

    // 6. Non-Destructive Actions (Temporary Delete & Restore)
    const deleteBtn = page.getByTestId('btn-toggle-delete');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();
    await expect(page.getByText('Restore Element')).toBeVisible();

    // Restore element
    await deleteBtn.click();
    await expect(page.getByText('Temp Delete')).toBeVisible();

    // 7. Verify Change Set Panel
    await page.getByTestId('tab-changeset').click();
    await expect(page.getByTestId('change-item-move')).toBeVisible();
    await expect(page.getByTestId('change-item-color')).toBeVisible();

    // Focus element by clicking change item
    await page.getByTestId('change-item-move').click();
    await expect(page.getByTestId('selected-element-express-id')).toBeVisible();

    // 8. Test Undo & Redo
    const undoBtn = page.getByTestId('header-btn-undo');
    await expect(undoBtn).toBeEnabled();
    await undoBtn.click(); // Undo last action

    const redoBtn = page.getByTestId('header-btn-redo');
    await expect(redoBtn).toBeEnabled();
    await redoBtn.click(); // Redo

    // 9. Reset All Edits
    const resetAllBtn = page.getByTestId('btn-changeset-reset-all');
    await expect(resetAllBtn).toBeVisible();
    await resetAllBtn.click();

    await expect(page.getByText('No changes recorded yet.')).toBeVisible();

    // 10. Return to Inspect Mode
    await modeInspectBtn.click();

    expect(criticalErrors).toEqual([]);
  });

  test('verifies Phase 4 real IFC persistence: JSON export/import, persistable vs viewport badges, save & reload new IFC, persistence audit', async ({ page }) => {
    test.setTimeout(50000);

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

    await page.goto('/?view=workspace');

    // 1. Load initial model
    await page.getByTestId('header-btn-sample-fast').click();
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });

    // 2. Switch to Edit Mode
    await page.getByTestId('mode-edit').click();
    await expect(page.getByTestId('tab-edit')).toBeVisible();

    // 3. Select an Element
    await page.getByTitle('Expand All').click();
    const firstElement = page.getByTestId('tree-element-leaf').first();
    await expect(firstElement).toBeVisible();
    await firstElement.click();

    // 4. Apply a translation (move) and color override
    await page.getByTestId('btn-move-x-add-1').click();
    await page.getByTestId('color-swatch-cyan').click();

    // 5. Open Change Set Panel
    await page.getByTestId('tab-changeset').click();
    await expect(page.getByText('Change Set (2)')).toBeVisible();

    // Verify Persistable vs Viewport Only badges
    await expect(page.getByText('IFC Persistable')).toBeVisible();
    await expect(page.getByText('Viewport Only')).toBeVisible();

    // 6. Test JSON Export button
    const exportJsonBtn = page.getByTestId('btn-export-changeset-json');
    await expect(exportJsonBtn).toBeEnabled();

    // 7. Save & Reload Persisted IFC
    const saveReloadBtn = page.getByTestId('btn-save-reload-ifc');
    await expect(saveReloadBtn).toBeEnabled();
    await saveReloadBtn.click();

    // Verify Persistence Audit Card
    const auditCard = page.getByTestId('persistence-audit-card');
    await expect(auditCard).toBeVisible({ timeout: 15000 });
    await expect(auditCard).toContainText('Persisted: 1');
    await expect(auditCard).toContainText('Unsupported: 1');

    // Model reloads with new persisted filename and viewport resets changes
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });
    await page.getByTestId('tab-changeset').click();
    await expect(page.getByText('No changes recorded yet.')).toBeVisible();

    // Return to Inspect Mode
    await page.getByTestId('mode-inspect').click();

    expect(criticalErrors).toEqual([]);
  });
});

test.describe('Arch_Tech Architectural Landing Page E2E', () => {
  test('public projects lead through client login to the existing workspace', async ({ page }) => {
    await page.goto('/');

    // 1. Public architectural portfolio
    await expect(page.getByText('ARCH_TECH').first()).toBeVisible();
    await expect(page.getByText(/Architecture,/i).first()).toBeVisible();
    await expect(page.getByText('Selected projects', { exact: true })).toBeVisible();

    // 2. Demo client access
    await page.getByTestId('client-login-link').click();
    await expect(page.getByRole('heading', { name: 'Portal Access' })).toBeVisible();
    await page.getByTestId('login-submit').click();
    await expect(page.getByText('Projects in progress.')).toBeVisible();

    // 3. Project model opens in the existing workspace
    await page.getByTestId('dashboard-project-lake-house').click();
    await page.getByTestId('project-tab-model').click();
    await page.getByTestId('open-3d-model').click();
    await expect(page.getByRole('button', { name: /Open IFC/i })).toBeVisible();
    const backToLandingBtn = page.getByTestId('btn-back-to-landing');
    await expect(backToLandingBtn).toBeVisible();

    // 4. Return to the client dashboard
    await backToLandingBtn.click();
    await expect(page.getByText('Projects in progress.')).toBeVisible();
  });
});
