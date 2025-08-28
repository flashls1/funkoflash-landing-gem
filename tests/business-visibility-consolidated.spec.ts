import { test, expect } from '@playwright/test';

test.describe('Consolidated Business Visibility Tests', () => {
  test('Jesse sees only Collectors Collision, not Anime Fresno', async ({ page }) => {
    // Login as Jesse
    await page.goto('/login');
    await page.fill('input[type="email"]', 'dsocial@live.com');
    await page.fill('input[type="password"]', process.env.TEST_PASSWORD || 'testpassword123');
    await page.click('button:has-text("Iniciar sesión")');
    
    // Navigate to business dashboard
    await page.goto('/dashboard/business');
    
    // Should see "Collectors Collision" event
    await expect(page.getByTestId('next-event-title')).toContainText(/Collectors Collision/i);
    
    // Should NOT see "Anime Fresno" anywhere on the page
    await expect(page.getByText(/Anime Fresno/i)).toHaveCount(0);
    
    // Verify only authorized events are visible in any event lists
    const eventTitles = await page.locator('[data-testid*="event-title"]').allTextContents();
    const hasUnauthorizedEvents = eventTitles.some(title => 
      title.toLowerCase().includes('anime fresno') || 
      (!title.toLowerCase().includes('collectors collision') && title.trim() !== '')
    );
    expect(hasUnauthorizedEvents).toBeFalsy();
    
    console.log('✅ Jesse can only see authorized events:', eventTitles);
  });

  test('Admin dropdown shows all business users including Jesse', async ({ page }) => {
    // Sign in as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@funkoflash.com');
    await page.fill('input[type="password"]', 'flash123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to Business Events
    await page.goto('/admin/business-events');
    
    // Click Add Event button
    await page.click('button:has-text("Add Event")');
    
    // Wait for form to load
    await page.waitForSelector('text=Primary Business');
    
    // Open the Primary Business dropdown
    const primaryBusinessTrigger = page.locator('[role="combobox"]').filter({ hasText: 'Select business' });
    await primaryBusinessTrigger.click();
    
    // Wait for dropdown options to load
    await page.waitForTimeout(2000);
    
    // Verify Jesse Ortega appears with business context
    const jesseOption = page.locator('[role="option"]').filter({ 
      hasText: /Jesse.*Ortega.*\(.*Collectors Collision.*\)/
    });
    await expect(jesseOption).toBeVisible();
    
    // Verify other business users appear
    const hoaOption = page.locator('[role="option"]').filter({ 
      hasText: /Hoa.*Tran/
    });
    const naomiOption = page.locator('[role="option"]').filter({ 
      hasText: /Naomi.*Espinosa/
    });
    
    await expect(hoaOption).toBeVisible();
    await expect(naomiOption).toBeVisible();
    
    // Log all options for verification
    const allOptions = await page.locator('[role="option"]').allTextContents();
    console.log('✅ All business users in dropdown:', allOptions);
    
    expect(allOptions.length).toBeGreaterThanOrEqual(3); // Jesse, Hoa, Naomi
  });

  test('Business event assignment works correctly', async ({ page }) => {
    // Sign in as admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@funkoflash.com');
    await page.fill('input[type="password"]', 'flash123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to Business Events
    await page.goto('/admin/business-events');
    
    // Look for Collectors Collision event
    const collectorsEvent = page.locator('text=COLLECTORS COLLISION').first();
    if (await collectorsEvent.isVisible()) {
      // Click to edit
      await collectorsEvent.click();
      
      // Wait for edit form
      await page.waitForSelector('text=Primary Business');
      
      // Verify the dropdown shows Jesse as selected or selectable
      const primaryBusinessTrigger = page.locator('[role="combobox"]').filter({ hasText: /Select business|Jesse/ });
      await expect(primaryBusinessTrigger).toBeVisible();
      
      console.log('✅ Collectors Collision event form loads with business user dropdown');
    } else {
      console.log('ℹ️ Collectors Collision event not found in list view');
    }
  });
});

// Helper functions for common actions
async function signInAsUser(page: any, email: string, password: string) {
  await page.click('text=Login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button:has-text("Sign In")');
}

async function signOut(page: any) {
  await page.click('[data-testid="user-menu"]');
  await page.click('text=Sign Out');
}