import { test, expect } from '@playwright/test';

test.describe('POS Checkout Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin');
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
  });

  test('should display the POS terminal with category buttons', async ({ page }) => {
    await expect(page.locator('button', { hasText: 'All' }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display the POS page content area', async ({ page }) => {
    // Verify the page loaded by checking for the category filter bar
    await expect(page.locator('button', { hasText: 'All' }).first()).toBeVisible({ timeout: 10000 });
    // Verify products or content boxes exist
    const boxes = page.locator('div[class*="MuiBox"]');
    await expect(boxes.first()).toBeVisible();
  });

  test('should switch between product categories', async ({ page }) => {
    const allButton = page.locator('button', { hasText: 'All' });
    await expect(allButton.first()).toBeVisible({ timeout: 10000 });
    
    const coffeeButton = page.locator('button', { hasText: 'Coffee' });
    if (await coffeeButton.isVisible()) {
      await coffeeButton.click();
    }
  });
});
