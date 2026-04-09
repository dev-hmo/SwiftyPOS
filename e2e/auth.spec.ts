import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should display the login page', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
    await expect(page.getByLabel('Email Address')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
  });

  test('should login and redirect to admin dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to admin dashboard
    await page.waitForURL('**/admin');
    await expect(page.getByText('Analytics Overview')).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email Address').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/admin');

    // Click logout icon
    await page.locator('[data-testid="LogoutIcon"]').click();
    await page.waitForURL('**/login');
    await expect(page.getByText('Welcome back')).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    await page.goto('/admin');
    await page.waitForURL('**/login');
  });

  test('should show 404 for unknown routes', async ({ page }) => {
    await page.goto('/some-random-page');
    await expect(page.getByText('404')).toBeVisible();
    await expect(page.getByText('Page Not Found')).toBeVisible();
  });
});
