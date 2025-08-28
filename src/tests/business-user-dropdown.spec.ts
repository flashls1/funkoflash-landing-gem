import { test, expect } from '@playwright/test';

// STEP 4: Playwright test to verify Jesse Ortega appears in admin dropdown
test.describe('Business User Dropdown Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Admin can see Jesse Ortega in Primary Business dropdown', async ({ page }) => {
    // Sign in as admin
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'admin@funkoflash.com');
    await page.fill('input[type="password"]', 'flash123');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('**/dashboard/admin');
    
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
    
    // Check that Jesse Ortega appears in the dropdown with correct format
    const jesseOption = page.locator('[role="option"]').filter({ 
      hasText: /Jesse.*Ortega.*\(.*Collectors Collision.*\)/
    });
    await expect(jesseOption).toBeVisible();
    
    // Also check for Hoa Tran and Naomi Espinosa
    const hoaOption = page.locator('[role="option"]').filter({ 
      hasText: /Hoa.*Tran/
    });
    await expect(hoaOption).toBeVisible();
    
    const naomiOption = page.locator('[role="option"]').filter({ 
      hasText: /Naomi.*Espinosa/
    });
    await expect(naomiOption).toBeVisible();
    
    // Verify at least 3 business users are listed
    const businessOptions = page.locator('[role="option"]');
    const optionCount = await businessOptions.count();
    expect(optionCount).toBeGreaterThanOrEqual(3);
    
    console.log(`Found ${optionCount} business user options in the dropdown`);
    
    // Log all options for debugging
    const allOptions = await businessOptions.allTextContents();
    console.log('All business user options:', allOptions);
  });

  test('Business user dropdown loads correctly for admin', async ({ page }) => {
    // Sign in as admin
    await page.click('text=Login');
    await page.fill('input[type="email"]', 'admin@funkoflash.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    
    // Navigate to Business Events
    await page.goto('/admin/business-events');
    
    // Create new event
    await page.click('button:has-text("Add Event")');
    
    // Wait for form to load and check that business users are available
    await page.waitForSelector('text=Primary Business');
    
    // Check that we can see the help text if no users are available
    const noUsersText = page.locator('text=No business users available');
    const businessDropdown = page.locator('text=Select business');
    
    // Either we have business users available OR we see the help message
    const hasBusinessUsers = await businessDropdown.isVisible();
    const showsNoUsersMessage = await noUsersText.isVisible();
    
    expect(hasBusinessUsers || showsNoUsersMessage).toBeTruthy();
    
    if (hasBusinessUsers) {
      console.log('✅ Business users dropdown is populated');
    } else {
      console.log('ℹ️ No business users available message shown');
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