import { test, expect } from '@playwright/test';

test.describe('Business Event Visibility - Consolidated Test', () => {
  test('Jesse sees only Collectors Collision, not Anime Fresno', async ({ page }) => {
    // Login as Jesse
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'dsocial@live.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Iniciar sesión")');
    
    // Wait for redirect to business dashboard
    await page.waitForURL('**/dashboard/business');
    
    // Should see "Collectors Collision" event
    await expect(page.getByText(/Collectors Collision/i)).toBeVisible();
    
    // Should NOT see "Anime Fresno" event
    await expect(page.getByText(/Anime Fresno/i)).toHaveCount(0);
    
    // Navigate to calendar view if available
    const calendarLink = page.locator('a[href*="calendar"]').first();
    if (await calendarLink.isVisible()) {
      await calendarLink.click();
      await page.waitForTimeout(2000);
      
      // In calendar view, should still only see Collectors Collision
      await expect(page.getByText(/Collectors Collision/i)).toBeVisible();
      await expect(page.getByText(/Anime Fresno/i)).toHaveCount(0);
    }
    
    console.log('✅ Jesse visibility test passed - sees only Collectors Collision');
  });

  test('Admin can see all business users in dropdown including Jesse', async ({ page }) => {
    // Login as admin
    await page.goto('/');
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'admin@funkoflash.com');
    await page.fill('input[type="password"]', 'flash123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to Business Events
    await page.goto('/admin/business-events');
    await page.waitForURL('**/admin/business-events');
    
    // Click Add Event button
    await page.click('button:has-text("Add Event")');
    
    // Wait for the form dialog to open
    await page.waitForSelector('text=Primary Business', { timeout: 10000 });
    
    // Open the Primary Business dropdown
    const primaryBusinessTrigger = page.locator('[role="combobox"]').filter({ hasText: 'Select business' });
    await primaryBusinessTrigger.click();
    
    // Wait for dropdown options to load
    await page.waitForTimeout(2000);
    
    // Check that all business users appear
    const jesseOption = page.locator('[role="option"]').filter({ hasText: /Jesse.*Ortega/i });
    const hoaOption = page.locator('[role="option"]').filter({ hasText: /Hoa.*Tran/i });
    const naomiOption = page.locator('[role="option"]').filter({ hasText: /Naomi.*Espinosa/i });
    
    await expect(jesseOption).toBeVisible();
    await expect(hoaOption).toBeVisible();
    await expect(naomiOption).toBeVisible();
    
    // Verify at least 3 business users are listed
    const businessOptions = page.locator('[role="option"]');
    const optionCount = await businessOptions.count();
    expect(optionCount).toBeGreaterThanOrEqual(3);
    
    console.log(`✅ Admin dropdown test passed - found ${optionCount} business users`);
  });
});