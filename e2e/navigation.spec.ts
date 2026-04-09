import { test, expect } from '@playwright/test';

test.describe('Admin Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin');
  });

  test('should display the admin dashboard', async ({ page }) => {
    await expect(page.locator('text=Analytics Overview')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Sales & History page', async ({ page }) => {
    await page.locator('text=Sales & History').click();
    await page.waitForURL('**/admin/sales');
  });

  test('should navigate to Categories page', async ({ page }) => {
    await page.locator('text=Categories').click();
    await page.waitForURL('**/admin/inventory/categories');
    await expect(page.locator('text=Product Categories')).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to POS Terminal via link', async ({ page }) => {
    // The TERMINAL button is inside an anchor link to /pos
    await page.locator('a[href="/pos"]').click();
    await page.waitForURL('**/pos');
  });
});
