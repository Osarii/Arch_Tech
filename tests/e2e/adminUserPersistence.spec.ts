import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

test.describe('Portal Admin User DB Persistence (Sections 15 & 16)', () => {
  const dbPath = path.resolve(process.cwd(), 'db.json');
  let initialDbUsers: unknown[] = [];

  test.beforeAll(async () => {
    // Read initial db.json users
    const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    initialDbUsers = [...dbContent.users];

    // Verify JSON Server is up and responding
    const res = await fetch('http://localhost:3001/users');
    expect(res.ok).toBe(true);
    const users = await res.json();
    expect(Array.isArray(users)).toBe(true);
  });

  test.afterAll(async () => {
    // Restore db.json to original state if needed
    try {
      const dbContent = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      const found = dbContent.users.find(
        (u: { email: string }) => u.email === 'persistence-test@arch-tech.local'
      );
      if (found) {
        await fetch(`http://localhost:3001/users/${found.id}`, { method: 'DELETE' });
      }
    } catch {
      // ignore
    }
  });

  test('creates, updates, verifies persistence across reload, tests login, and deletes user', async ({ page }) => {
    // 1. Navigate to landing page
    await page.goto('/');

    // 2. Open login modal and login as admin
    const loginLink = page.getByTestId('client-login-link');
    await loginLink.click();

    await page.getByTestId('quick-login-admin').click();

    // Verify redirected to admin
    await expect(page).toHaveURL(/\/admin/);

    // 3. Navigate to /admin/people
    await page.goto('/admin/people');
    await expect(page).toHaveURL(/\/admin\/people/);

    // 4. Verify DB Status shows connected
    const statusBadge = page.getByTestId('db-status-badge');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('Connected');
    await expect(statusBadge).toContainText('db.json');

    // 5. Track network requests
    let createdUserId = '';
    const postPromise = page.waitForResponse(
      (resp) => resp.url().includes('/users') && resp.request().method() === 'POST' && resp.status() === 201
    );

    // 6. Fill user creation form
    await page.getByLabel('Name').fill('Persistence Test');
    await page.getByLabel('Email').fill('persistence-test@arch-tech.local');
    await page.getByLabel('Temporary password').fill('test-password-123');
    await page.getByLabel('Role').selectOption('client');

    // Submit user creation
    await page.getByTestId('create-user').click();

    // 7. Verify POST /users returned 201
    const postResponse = await postPromise;
    expect(postResponse.status()).toBe(201);
    const postData = await postResponse.json();
    createdUserId = postData.id;
    expect(createdUserId).toBeTruthy();
    expect(postData.email).toBe('persistence-test@arch-tech.local');

    // Verify feedback appears in UI
    await expect(page.getByText('Persistence Test was added as an active client.')).toBeVisible();
    await expect(page.getByTestId(`admin-user-row-${createdUserId}`)).toBeVisible();

    // 8. DIRECT DB.JSON VERIFICATION: check both GET http://localhost:3001/users and db.json file
    const apiUsersRes = await fetch('http://localhost:3001/users');
    const apiUsers = (await apiUsersRes.json()) as Array<{ id: string; email: string; name: string }>;
    const foundInApi = apiUsers.find((u) => u.email === 'persistence-test@arch-tech.local');
    expect(foundInApi).toBeDefined();
    expect(foundInApi?.id).toBe(createdUserId);

    // Read db.json from disk directly
    const currentDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const foundInDb = currentDb.users.find(
      (u: { id: string; email: string }) => u.id === createdUserId || u.email === 'persistence-test@arch-tech.local'
    );
    expect(foundInDb).toBeDefined();
    expect(foundInDb.name).toBe('Persistence Test');
    expect(foundInDb.role).toBe('client');

    // 9. RELOAD BROWSER: user still exists after reload
    await page.reload();
    await expect(page.getByTestId(`admin-user-row-${createdUserId}`)).toBeVisible();
    await expect(page.getByTestId(`admin-user-row-${createdUserId}`)).toContainText('Persistence Test');

    // 10. UPDATE FLOW: modify status or role via PATCH /users/:id
    const patchPromise = page.waitForResponse(
      (resp) => resp.url().includes(`/users/${createdUserId}`) && resp.request().method() === 'PATCH' && resp.status() === 200
    );

    // Toggle active/inactive
    const toggleStatusBtn = page.getByTestId(`admin-user-status-toggle-${createdUserId}`);
    await toggleStatusBtn.click();

    const patchResponse = await patchPromise;
    expect(patchResponse.status()).toBe(200);

    // Verify db.json directly reflects the status update
    const updatedDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const updatedUserInDb = updatedDb.users.find((u: { id: string }) => u.id === createdUserId);
    expect(updatedUserInDb.status).toBe('inactive');

    // Toggle back to active
    const patchPromise2 = page.waitForResponse(
      (resp) => resp.url().includes(`/users/${createdUserId}`) && resp.request().method() === 'PATCH' && resp.status() === 200
    );
    await toggleStatusBtn.click();
    await patchPromise2;

    const restoredDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    const restoredUserInDb = restoredDb.users.find((u: { id: string }) => u.id === createdUserId);
    expect(restoredUserInDb.status).toBe('active');

    // 11. SIGN OUT AND TEST LOGIN WITH CREATED USER
    await page.getByRole('button', { name: 'Sign out' }).click();
    await expect(page).toHaveURL(/\/$/);

    // Sign in with new credentials
    await page.getByTestId('client-login-link').click();
    await page.getByTestId('login-email').fill('persistence-test@arch-tech.local');
    await page.getByTestId('login-password').fill('test-password-123');
    await page.getByTestId('login-password').press('Enter');

    // Verify client lands on client dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // 12. CLEANUP: Delete the created user via API
    const deleteRes = await fetch(`http://localhost:3001/users/${createdUserId}`, {
      method: 'DELETE',
    });
    expect([200, 204]).toContain(deleteRes.status);

    // Verify absent from GET /users
    const postDeleteApiRes = await fetch('http://localhost:3001/users');
    const postDeleteUsers = (await postDeleteApiRes.json()) as Array<{ id: string; email: string }>;
    expect(postDeleteUsers.find((u) => u.id === createdUserId)).toBeUndefined();

    // Verify absent from db.json file
    const postDeleteDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    expect(postDeleteDb.users.find((u: { id: string }) => u.id === createdUserId)).toBeUndefined();
    expect(postDeleteDb.users.length).toBe(initialDbUsers.length);
  });
});
