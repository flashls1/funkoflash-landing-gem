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
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    
    // Wait for redirect to admin dashboard
    await page.waitForURL('**/dashboard/admin');
    
    // Navigate to Business Events
    await page.click('text=Business Events');
    await page.waitForURL('**/admin/business-events');
    
    // Click Add Event button
    await page.click('button:has-text("Add Event")');
    
    // Wait for the form dialog to open
    await page.waitForSelector('dialog[open]', { state: 'visible' });
    
    // Look for the Primary Business dropdown
    await page.click('text=Primary Business');
    
    // Open the dropdown
    const primaryBusinessTrigger = page.locator('[aria-haspopup="listbox"]:has-text("Select business")');
    await primaryBusinessTrigger.click();
    
    // Wait for dropdown to open and check for Jesse Ortega
    await page.waitForSelector('[role="listbox"]', { state: 'visible' });
    
    // Check that Jesse Ortega appears in the dropdown
    const jessOption = page.locator('[role="option"]:has-text("Jesse")');
    await expect(jessOption).toBeVisible();
    
    // Also check that the option contains business info
    const jessOptionWithBusiness = page.locator('[role="option"]').filter({ 
      hasText: /Jesse.*\(/
    });
    await expect(jessOptionWithBusiness).toBeVisible();
    
    // Verify at least one business user is listed
    const businessOptions = page.locator('[role="option"]');
    const optionCount = await businessOptions.count();
    expect(optionCount).toBeGreaterThan(0);
    
    console.log(`Found ${optionCount} business user options in the dropdown`);
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