import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { supabase } from '../integrations/supabase/client';

// Test Configuration
const TEST_USERS = {
  admin: {
    email: 'admin@test-override.com',
    password: 'TestPass123!',
    firstName: 'Admin',
    lastName: 'User'
  },
  talent: {
    email: 'talent@test-override.com', 
    password: 'TestPass123!',
    firstName: 'Talent',
    lastName: 'User'
  }
};

/**
 * Administrative Override Test Documentation
 * 
 * These tests validate the admin's ability to override user profile data,
 * images, and settings across all user roles (staff, business, talent).
 */

describe('Admin Override Functionality Tests', () => {
  let testUserIds: { admin?: string; talent?: string } = {};

  beforeAll(async () => {
    // Clean up any existing test users
    await cleanupTestUsers();
    
    // Create test users
    const { data: adminUser, error: adminError } = await supabase.auth.signUp({
      email: TEST_USERS.admin.email,
      password: TEST_USERS.admin.password,
    });
    
    if (!adminError && adminUser.user) {
      testUserIds.admin = adminUser.user.id;
      
      // Set admin role
      await supabase
        .from('profiles')
        .upsert({
          id: adminUser.user.id,
          user_id: adminUser.user.id,
          email: TEST_USERS.admin.email,
          first_name: TEST_USERS.admin.firstName,
          last_name: TEST_USERS.admin.lastName,
          role: 'admin'
        });
    }

    const { data: talentUser, error: talentError } = await supabase.auth.signUp({
      email: TEST_USERS.talent.email,
      password: TEST_USERS.talent.password,
    });
    
    if (!talentError && talentUser.user) {
      testUserIds.talent = talentUser.user.id;
      
      // Set talent role
      await supabase
        .from('profiles')
        .upsert({
          id: talentUser.user.id,
          user_id: talentUser.user.id,
          email: TEST_USERS.talent.email,
          first_name: TEST_USERS.talent.firstName,
          last_name: TEST_USERS.talent.lastName,
          role: 'talent'
        });
    }
  });

  afterAll(async () => {
    await cleanupTestUsers();
  });

  beforeEach(async () => {
    // Clear any existing data modifications
    await supabase
      .from('profiles')
      .update({
        first_name: TEST_USERS.talent.firstName,
        last_name: TEST_USERS.talent.lastName,
        phone: null
      })
      .eq('id', testUserIds.talent);
  });

  afterEach(async () => {
    await supabase.auth.signOut();
  });

  async function cleanupTestUsers() {
    // Delete test user profiles
    await supabase
      .from('profiles')
      .delete()
      .or(`email.eq.${TEST_USERS.admin.email},email.eq.${TEST_USERS.talent.email}`);
  }

  describe('Profile Data Override', () => {
    it('should allow admin to override talent user profile data', async () => {
      // Sign in as admin
      const { data: adminSession, error: adminLoginError } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.admin.email,
        password: TEST_USERS.admin.password,
      });

      expect(adminLoginError).toBeNull();
      expect(adminSession.user).toBeTruthy();

      // Admin updates talent profile data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: 'AdminOverride',
          last_name: 'Name',
          phone: '555-9999'
        })
        .eq('id', testUserIds.talent);

      expect(updateError).toBeNull();

      // Verify the changes were saved
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone')
        .eq('id', testUserIds.talent)
        .single();

      expect(fetchError).toBeNull();
      expect(updatedProfile.first_name).toBe('AdminOverride');
      expect(updatedProfile.last_name).toBe('Name');
      expect(updatedProfile.phone).toBe('555-9999');
    });

    it('should persist admin changes when user signs in', async () => {
      // First, admin makes changes
      await supabase.auth.signInWithPassword({
        email: TEST_USERS.admin.email,
        password: TEST_USERS.admin.password,
      });

      await supabase
        .from('profiles')
        .update({
          first_name: 'PersistTest',
          phone: '555-1234'
        })
        .eq('id', testUserIds.talent);

      // Sign out admin
      await supabase.auth.signOut();

      // Sign in as talent user
      const { data: talentSession, error: talentLoginError } = await supabase.auth.signInWithPassword({
        email: TEST_USERS.talent.email,
        password: TEST_USERS.talent.password,
      });

      expect(talentLoginError).toBeNull();
      expect(talentSession.user).toBeTruthy();

      // Verify admin changes are still there
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('first_name, phone')
        .eq('id', testUserIds.talent)
        .single();

      expect(fetchError).toBeNull();
      expect(currentProfile.first_name).toBe('PersistTest');
      expect(currentProfile.phone).toBe('555-1234');
    });
  });

  describe('Image Upload Override', () => {
    it('should allow admin to override user uploaded images', async () => {
      const mockImageUrl = 'https://example.com/admin-override.jpg';
      
      // Sign in as admin
      await supabase.auth.signInWithPassword({
        email: TEST_USERS.admin.email,
        password: TEST_USERS.admin.password,
      });

      // Admin overrides talent's images
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: mockImageUrl,
          background_image_url: mockImageUrl
        })
        .eq('id', testUserIds.talent);

      expect(updateError).toBeNull();

      // Verify admin changes
      const { data: updatedProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('avatar_url, background_image_url')
        .eq('id', testUserIds.talent)
        .single();

      expect(fetchError).toBeNull();
      expect(updatedProfile.avatar_url).toBe(mockImageUrl);
      expect(updatedProfile.background_image_url).toBe(mockImageUrl);
    });
  });
});

/**
 * Test Scenarios Documentation Export
 */
export const AdminOverrideTestScenarios = {
  profileDataOverride: {
    description: 'Admin overrides user profile data',
    steps: [
      'Admin signs in',
      'Admin navigates to User Management',
      'Admin searches for target user',
      'Admin updates user profile fields',
      'Admin saves changes',
      'User signs in and verifies changes'
    ]
  },
  
  imageUploadOverride: {
    description: 'Admin replaces user uploaded images',
    steps: [
      'User uploads profile and hero images',
      'Admin signs in',
      'Admin accesses user profile',
      'Admin uploads replacement images',
      'User verifies new images are displayed'
    ]
  }
};