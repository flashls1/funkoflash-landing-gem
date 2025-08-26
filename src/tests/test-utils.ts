/**
 * Utility Functions for Testing Admin Override Functionality
 */

// Test utilities for admin override testing

export const createMockUser = (role: 'admin' | 'staff' | 'talent' | 'business', overrides = {}) => ({
  id: `${role}-user-id`,
  email: `${role}@test.com`,
  first_name: role.charAt(0).toUpperCase() + role.slice(1),
  last_name: 'User',
  phone: `555-000${role.length}`,
  role,
  active: true,
  last_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  avatar_url: `https://test.com/${role}-avatar.jpg`,
  background_image_url: `https://test.com/${role}-bg.jpg`,
  ...overrides
});

export const createMockAuthSession = (user: any) => ({
  user,
  access_token: 'mock-token',
  expires_at: Date.now() + 3600000,
  refresh_token: 'mock-refresh'
});

export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
});

// Mock database operations for testing admin override functionality
export const createMockDatabase = () => {
  const profiles = new Map();
  const activityLogs: any[] = [];
  const loginHistory: any[] = [];

  return {
    profiles: {
      get: (userId: string) => profiles.get(userId),
      set: (userId: string, profile: any) => {
        const existing = profiles.get(userId) || {};
        const updated = { 
          ...existing, 
          ...profile, 
          updated_at: new Date().toISOString() 
        };
        profiles.set(userId, updated);
        return updated;
      },
      getAll: () => Array.from(profiles.values()),
      delete: (userId: string) => profiles.delete(userId)
    },
    
    activityLogs: {
      add: (log: any) => {
        const logEntry = {
          id: `log-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...log
        };
        activityLogs.push(logEntry);
        return logEntry;
      },
      getByUserId: (userId: string) => 
        activityLogs.filter(log => log.user_id === userId),
      getByAdminId: (adminId: string) => 
        activityLogs.filter(log => log.admin_user_id === adminId),
      getAll: () => activityLogs
    },
    
    loginHistory: {
      add: (entry: any) => {
        const loginEntry = {
          id: `login-${Date.now()}`,
          login_time: new Date().toISOString(),
          ...entry
        };
        loginHistory.push(loginEntry);
        return loginEntry;
      },
      getByUserId: (userId: string) => 
        loginHistory.filter(entry => entry.user_id === userId)
    }
  };
};

// Simulate admin override scenarios
export const simulateAdminOverride = async (
  mockDb: any, 
  adminUser: any, 
  targetUser: any, 
  updateData: any
) => {
  // Log the admin action
  const logEntry = mockDb.activityLogs.add({
    user_id: targetUser.id,
    admin_user_id: adminUser.id,
    action: 'profile_updated_by_admin',
    details: {
      updated_fields: Object.keys(updateData),
      timestamp: new Date().toISOString(),
      admin_email: adminUser.email
    }
  });

  // Update the user profile
  const updatedProfile = mockDb.profiles.set(targetUser.id, updateData);

  return { updatedProfile, logEntry };
};

// Test admin override permissions
export const testAdminOverridePermissions = (userRole: string) => {
  const permissions = {
    admin: {
      canOverrideProfiles: true,
      canResetPasswords: true,
      canManageUsers: true,
      canViewAuditLogs: true
    },
    staff: {
      canOverrideProfiles: true,
      canResetPasswords: true, 
      canManageUsers: true,
      canViewAuditLogs: true
    },
    talent: {
      canOverrideProfiles: false,
      canResetPasswords: false,
      canManageUsers: false,
      canViewAuditLogs: false
    },
    business: {
      canOverrideProfiles: false,
      canResetPasswords: false,
      canManageUsers: false,
      canViewAuditLogs: false
    }
  };

  return permissions[userRole as keyof typeof permissions] || {
    canOverrideProfiles: false,
    canResetPasswords: false,
    canManageUsers: false,
    canViewAuditLogs: false
  };
};

// Validate admin override scenarios
export const validateAdminOverride = (
  originalData: any,
  userUpdate: any,
  adminUpdate: any,
  finalData: any
) => {
  // Admin updates should always take precedence over user updates
  const expectedFinalData = { ...originalData, ...userUpdate, ...adminUpdate };
  
  // Check that admin changes override user changes
  const adminOverrideSuccess = Object.keys(adminUpdate).every(key => 
    finalData[key] === adminUpdate[key]
  );

  // Check that updated_at timestamp reflects the latest change
  const timestampUpdated = new Date(finalData.updated_at).getTime() > 
    new Date(originalData.updated_at).getTime();

  return {
    adminOverrideSuccess,
    timestampUpdated,
    expectedFinalData,
    actualFinalData: finalData
  };
};

// Create test scenarios for different user role combinations
export const createTestScenarios = () => {
  const roles = ['admin', 'staff', 'talent', 'business'] as const;
  const scenarios = [];

  // Admin overriding each role
  for (const targetRole of roles) {
    if (targetRole !== 'admin') {
      scenarios.push({
        name: `Admin overrides ${targetRole}`,
        adminUser: createMockUser('admin'),
        targetUser: createMockUser(targetRole),
        expectedPermission: true
      });
    }
  }

  // Staff overriding each role
  for (const targetRole of roles) {
    if (targetRole !== 'staff') {
      scenarios.push({
        name: `Staff overrides ${targetRole}`,
        adminUser: createMockUser('staff'),
        targetUser: createMockUser(targetRole),
        expectedPermission: targetRole !== 'admin'
      });
    }
  }

  // Non-admin roles attempting to override (should fail)
  for (const sourceRole of ['talent', 'business'] as const) {
    for (const targetRole of roles) {
      scenarios.push({
        name: `${sourceRole} attempts to override ${targetRole}`,
        adminUser: createMockUser(sourceRole),
        targetUser: createMockUser(targetRole),
        expectedPermission: false
      });
    }
  }

  return scenarios;
};

// Mock file upload for image override testing
export const createMockFileUpload = (filename: string, type: string = 'image/jpeg') => {
  const mockFile = new File(['mock-content'], filename, { type });
  
  return {
    file: mockFile,
    upload: () => Promise.resolve({ error: null }),
    getPublicUrl: () => ({ 
      data: { publicUrl: `https://mock-storage.com/${filename}` }
    })
  };
};

// Validate image override scenarios
export const validateImageOverride = (
  userImageUrl: string,
  adminImageUrl: string, 
  finalImageUrl: string
) => {
  return {
    adminImageTakesPrecedence: finalImageUrl === adminImageUrl,
    userImageOverridden: finalImageUrl !== userImageUrl,
    validUrl: finalImageUrl.startsWith('http')
  };
};

// Test utilities for admin override testing

export const createMockUser = (role: 'admin' | 'staff' | 'talent' | 'business', overrides = {}) => ({
  id: `${role}-user-id`,
  email: `${role}@test.com`,
  first_name: role.charAt(0).toUpperCase() + role.slice(1),
  last_name: 'User',
  phone: `555-000${role.length}`,
  role,
  active: true,
  last_login: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  avatar_url: `https://test.com/${role}-avatar.jpg`,
  background_image_url: `https://test.com/${role}-bg.jpg`,
  ...overrides
});

export const createMockAuthSession = (user: any) => ({
  user,
  access_token: 'mock-token',
  expires_at: Date.now() + 3600000,
  refresh_token: 'mock-refresh'
});

export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error,
  status: error ? 400 : 200,
  statusText: error ? 'Bad Request' : 'OK'
});

// Mock database operations for testing admin override functionality
export const createMockDatabase = () => {
  const profiles = new Map();
  const activityLogs = [];
  const loginHistory = [];

  return {
    profiles: {
      get: (userId: string) => profiles.get(userId),
      set: (userId: string, profile: any) => {
        const existing = profiles.get(userId) || {};
        const updated = { 
          ...existing, 
          ...profile, 
          updated_at: new Date().toISOString() 
        };
        profiles.set(userId, updated);
        return updated;
      },
      getAll: () => Array.from(profiles.values()),
      delete: (userId: string) => profiles.delete(userId)
    },
    
    activityLogs: {
      add: (log: any) => {
        const logEntry = {
          id: `log-${Date.now()}`,
          created_at: new Date().toISOString(),
          ...log
        };
        activityLogs.push(logEntry);
        return logEntry;
      },
      getByUserId: (userId: string) => 
        activityLogs.filter(log => log.user_id === userId),
      getByAdminId: (adminId: string) => 
        activityLogs.filter(log => log.admin_user_id === adminId),
      getAll: () => activityLogs
    },
    
    loginHistory: {
      add: (entry: any) => {
        const loginEntry = {
          id: `login-${Date.now()}`,
          login_time: new Date().toISOString(),
          ...entry
        };
        loginHistory.push(loginEntry);
        return loginEntry;
      },
      getByUserId: (userId: string) => 
        loginHistory.filter(entry => entry.user_id === userId)
    }
  };
};

// Simulate admin override scenarios
export const simulateAdminOverride = async (
  mockDb: any, 
  adminUser: any, 
  targetUser: any, 
  updateData: any
) => {
  // Log the admin action
  const logEntry = mockDb.activityLogs.add({
    user_id: targetUser.id,
    admin_user_id: adminUser.id,
    action: 'profile_updated_by_admin',
    details: {
      updated_fields: Object.keys(updateData),
      timestamp: new Date().toISOString(),
      admin_email: adminUser.email
    }
  });

  // Update the user profile
  const updatedProfile = mockDb.profiles.set(targetUser.id, updateData);

  return { updatedProfile, logEntry };
};

// Test admin override permissions
export const testAdminOverridePermissions = (userRole: string) => {
  const permissions = {
    admin: {
      canOverrideProfiles: true,
      canResetPasswords: true,
      canManageUsers: true,
      canViewAuditLogs: true
    },
    staff: {
      canOverrideProfiles: true,
      canResetPasswords: true, 
      canManageUsers: true,
      canViewAuditLogs: true
    },
    talent: {
      canOverrideProfiles: false,
      canResetPasswords: false,
      canManageUsers: false,
      canViewAuditLogs: false
    },
    business: {
      canOverrideProfiles: false,
      canResetPasswords: false,
      canManageUsers: false,
      canViewAuditLogs: false
    }
  };

  return permissions[userRole as keyof typeof permissions] || {
    canOverrideProfiles: false,
    canResetPasswords: false,
    canManageUsers: false,
    canViewAuditLogs: false
  };
};

// Validate admin override scenarios
export const validateAdminOverride = (
  originalData: any,
  userUpdate: any,
  adminUpdate: any,
  finalData: any
) => {
  // Admin updates should always take precedence over user updates
  const expectedFinalData = { ...originalData, ...userUpdate, ...adminUpdate };
  
  // Check that admin changes override user changes
  const adminOverrideSuccess = Object.keys(adminUpdate).every(key => 
    finalData[key] === adminUpdate[key]
  );

  // Check that updated_at timestamp reflects the latest change
  const timestampUpdated = new Date(finalData.updated_at).getTime() > 
    new Date(originalData.updated_at).getTime();

  return {
    adminOverrideSuccess,
    timestampUpdated,
    expectedFinalData,
    actualFinalData: finalData
  };
};

// Create test scenarios for different user role combinations
export const createTestScenarios = () => {
  const roles = ['admin', 'staff', 'talent', 'business'] as const;
  const scenarios = [];

  // Admin overriding each role
  for (const targetRole of roles) {
    if (targetRole !== 'admin') {
      scenarios.push({
        name: `Admin overrides ${targetRole}`,
        adminUser: createMockUser('admin'),
        targetUser: createMockUser(targetRole),
        expectedPermission: true
      });
    }
  }

  // Staff overriding each role
  for (const targetRole of roles) {
    if (targetRole !== 'staff') {
      scenarios.push({
        name: `Staff overrides ${targetRole}`,
        adminUser: createMockUser('staff'),
        targetUser: createMockUser(targetRole),
        expectedPermission: targetRole !== 'admin'
      });
    }
  }

  // Non-admin roles attempting to override (should fail)
  for (const sourceRole of ['talent', 'business'] as const) {
    for (const targetRole of roles) {
      scenarios.push({
        name: `${sourceRole} attempts to override ${targetRole}`,
        adminUser: createMockUser(sourceRole),
        targetUser: createMockUser(targetRole),
        expectedPermission: false
      });
    }
  }

  return scenarios;
};

// Mock file upload for image override testing
export const createMockFileUpload = (filename: string, type: string = 'image/jpeg') => {
  const mockFile = new File(['mock-content'], filename, { type });
  
  return {
    file: mockFile,
    upload: vi.fn().mockResolvedValue({ error: null }),
    getPublicUrl: vi.fn().mockReturnValue({ 
      data: { publicUrl: `https://mock-storage.com/${filename}` }
    })
  };
};

// Validate image override scenarios
export const validateImageOverride = (
  userImageUrl: string,
  adminImageUrl: string, 
  finalImageUrl: string
) => {
  return {
    adminImageTakesPrecedence: finalImageUrl === adminImageUrl,
    userImageOverridden: finalImageUrl !== userImageUrl,
    validUrl: finalImageUrl.startsWith('http')
  };
};