import { test, expect } from '@playwright/test';

test.describe('Advanced Features: Search, Hold, Activity Log', () => {

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin');
  });

  test('should trigger search via keyboard shortcut (F2) and filter products', async ({ page }) => {
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');

    // Make sure we have the full product grid initially
    await expect(page.locator('text=Terracotta Espresso').first()).toBeVisible();

    // Trigger F2
    await page.keyboard.press('F2');
    
    // Type into the focused search box
    await page.keyboard.type('Oat');

    // Wait for debounce
    await page.waitForTimeout(500);

    // Should only see the Cold Brew Oat product
    await expect(page.locator('text=Cold Brew Oat').first()).toBeVisible();
    await expect(page.locator('text=Terracotta Espresso')).not.toBeVisible();
  });

  test('should hold an order (F4), show a toast, and permit recall', async ({ page }) => {
    // 1. Add item to cart
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    await page.locator('text=Terracotta Espresso').first().click();

    // Expect item in cart
    await expect(page.locator('text=1 items • $18.00')).toBeVisible();

    // 2. Hold the order via F4 shortcut
    await page.keyboard.press('F4');

    // Expect Toast Notification
    await expect(page.locator('text=Order held (1 items)')).toBeVisible();

    // Expect cart to be cleared
    await expect(page.locator('text=0 items • $0.00')).toBeVisible();

    // 3. Open Recall Drawer
    await page.getByRole('button', { name: /Recall/i }).click();
    
    // Recall the order
    await page.getByRole('button', { name: /Recall/i, exact: true }).first().click();

    // Expect Toast Notification
    await expect(page.locator('text=Order recalled (1 items)')).toBeVisible();

    // Expect items back in cart
    await expect(page.locator('text=1 items • $18.00')).toBeVisible();
  });

  test('should log activities to the Activity Log page', async ({ page }) => {
    // First go to POS and do something to generate a log (Clear cart via Esc)
    await page.goto('/pos');
    await page.waitForLoadState('networkidle');
    await page.locator('text=Terracotta Espresso').first().click();
    await page.keyboard.press('Escape');
    await expect(page.locator('text=Cart cleared')).toBeVisible();

    // Go to Activity Log
    await page.goto('/admin/activity');
    await page.waitForLoadState('networkidle');

    // The login event should be there
    await expect(page.locator('text=Login').first()).toBeVisible();
  });
});
