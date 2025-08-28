import { test, expect } from '@playwright/test';

test('Business user sees only their event', async ({ page }) => {
  // Login as Jesse
  await page.goto('/login');
  await page.fill('input[type="email"]', 'dsocial@live.com');
  await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword123');
  await page.click('button:has-text("Iniciar sesión")');
  
  // Navigate to business dashboard
  await page.goto('/dashboard/business');
  
  // Should see "Collectors Collision" event
  await expect(page.getByTestId('next-event-title')).toContainText(/Collectors Collision/i);
  
  // Should NOT see "Anime Fresno" or other business events
  await expect(page.getByText(/Anime Fresno/i)).toHaveCount(0);
  
  // Verify only authorized events are visible in any event lists
  const eventTitles = await page.locator('[data-testid*="event-title"]').allTextContents();
  const hasUnauthorizedEvents = eventTitles.some(title => 
    title.toLowerCase().includes('anime fresno') || 
    !title.toLowerCase().includes('collectors collision')
  );
  expect(hasUnauthorizedEvents).toBeFalsy();
});