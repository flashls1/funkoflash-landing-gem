import { test, expect } from '@playwright/test';

test('Business user sees only their event', async ({ page }) => {
  // Skip if no test password is configured
  if (!process.env.TEST_PASSWORD) {
    test.skip();
    return;
  }

  await page.goto('/login');
  await page.fill('input[type="email"]', 'dsocial@live.com');
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD);
  await page.click('button:has-text("Iniciar sesión")');
  
  // Wait for navigation to complete
  await page.waitForURL('**/dashboard/**');
  
  // Navigate to business dashboard
  await page.goto('/dashboard/business');
  
  // Check that the correct event is visible
  await expect(page.getByTestId('next-event-title')).toContainText(/Collectors Collision/i);
  
  // Check that other businesses' events are NOT visible
  await expect(page.getByText(/Anime Fresno/i)).toHaveCount(0);
});

test('Business event visibility isolation', async ({ page }) => {
  // Skip if no test password is configured
  if (!process.env.TEST_PASSWORD) {
    test.skip();
    return;
  }

  await page.goto('/login');
  await page.fill('input[type="email"]', 'dsocial@live.com');
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD);
  await page.click('button:has-text("Iniciar sesión")');
  
  // Wait for navigation to complete
  await page.waitForURL('**/dashboard/**');
  
  // Check business events page
  await page.goto('/business-events');
  
  // Should see only Collectors Collision
  await expect(page.getByText(/Collectors Collision/i)).toBeVisible();
  
  // Should NOT see other events
  await expect(page.getByText(/Anime Fresno/i)).toHaveCount(0);
});