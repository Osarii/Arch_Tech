import { test, expect } from '@playwright/test';

test.describe('Phase 4: AI BIM Assistant & Tool Safety Execution E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to root
    await page.goto('/');

    // Load sample IFC model
    const loadSampleBtn = page.getByRole('button', { name: /Load Sample \(Fast/i });
    await expect(loadSampleBtn).toBeVisible();
    await loadSampleBtn.click();

    // Wait until model is loaded and ready
    await expect(page.getByTestId('action-fit')).toBeVisible({ timeout: 25000 });
  });

  test('opens and closes AI Assistant panel via header and tabs', async ({ page }) => {
    // Click AI Assistant header button
    const aiHeaderBtn = page.getByTestId('header-btn-ai');
    await expect(aiHeaderBtn).toBeVisible();
    await aiHeaderBtn.click();

    // Verify AI Assistant Panel is visible
    await expect(page.getByText('BIM AI Assistant')).toBeVisible();
    await expect(page.getByTestId('ai-chat-input')).toBeVisible();

    // Switch to Properties tab
    const propsTab = page.getByTestId('tab-properties');
    await propsTab.click();
    await expect(page.getByText('Element Inspector')).toBeVisible();

    // Switch back to AI tab
    const aiTab = page.getByTestId('tab-ai');
    await aiTab.click();
    await expect(page.getByTestId('ai-chat-input')).toBeVisible();
  });

  test('executes natural language READ tool "calculate quantities" and renders badge & results', async ({ page }) => {
    // Open AI Panel
    await page.getByTestId('header-btn-ai').click();

    // Type query
    const input = page.getByTestId('ai-chat-input');
    await input.fill('calculate quantities');
    await page.getByTestId('ai-chat-send').click();

    // Verify READ tool call badge appears
    const toolBadge = page.getByTestId('ai-tool-call-calculate_quantities');
    await expect(toolBadge).toBeVisible({ timeout: 5000 });
    await expect(toolBadge).toContainText('READ');
    await expect(toolBadge).toContainText('calculate_quantities');
    await expect(toolBadge).toContainText('Executed');

    // Verify result is rendered
    const toolResult = page.getByTestId('ai-tool-result-calculate_quantities');
    await expect(toolResult).toBeVisible();
  });

  test('executes spatial search "find walls" and renders found count', async ({ page }) => {
    // Open AI Panel
    await page.getByTestId('header-btn-ai').click();

    // Type search query
    const input = page.getByTestId('ai-chat-input');
    await input.fill('find walls');
    await page.getByTestId('ai-chat-send').click();

    // Verify READ tool call query_elements executed
    const toolBadge = page.getByTestId('ai-tool-call-query_elements');
    await expect(toolBadge).toBeVisible({ timeout: 5000 });
    await expect(toolBadge).toContainText('READ');
  });

  test('enforces WRITE tool safety flow: proposal -> confirm -> Change Set incremented -> reject -> unchanged', async ({ page }) => {
    // Open AI Panel
    await page.getByTestId('header-btn-ai').click();

    // 1. Send WRITE request (Move #44)
    const input = page.getByTestId('ai-chat-input');
    await input.fill('move #44 by 1m in X');
    await page.getByTestId('ai-chat-send').click();

    // 2. Proposal Card appears with confirmation request
    const proposalCard = page.getByTestId('ai-proposal-card');
    await expect(proposalCard).toBeVisible({ timeout: 5000 });
    await expect(proposalCard).toContainText('WRITE ACTION CONFIRMATION');
    await expect(proposalCard).toContainText('move_element');

    const confirmBtn = page.getByTestId('ai-confirm-write');
    const cancelBtn = page.getByTestId('ai-reject-write');
    await expect(confirmBtn).toBeVisible();
    await expect(cancelBtn).toBeVisible();

    // Verify Change Set is 0 before confirmation in the Change Set tab
    await page.getByTestId('tab-changeset').click();
    await expect(page.getByText('Change Set (0)')).toBeVisible();

    // 3. Confirm Proposal
    await confirmBtn.click();
    await expect(page.getByText('Executed & Recorded in Change Set')).toBeVisible();

    // Verify Change Set count is now 1
    await expect(page.getByText('Change Set (1)')).toBeVisible();

    // 4. Send Delete #44 request
    await input.fill('delete #44');
    await page.getByTestId('ai-chat-send').click();

    // Second proposal card appears for delete
    const deleteProposalCard = page.getByTestId('ai-proposal-card').last();
    await expect(deleteProposalCard).toBeVisible({ timeout: 5000 });
    await expect(deleteProposalCard).toContainText('delete_element');

    // Reject the deletion
    const rejectBtn = page.getByTestId('ai-reject-write').last();
    await rejectBtn.click();
    await expect(deleteProposalCard).toContainText('Action Cancelled');

    // Verify Change Set count remains 1 (unchanged by rejected write action)
    await expect(page.getByText('Change Set (1)')).toBeVisible();
  });
});
