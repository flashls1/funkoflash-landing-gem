import { vi } from 'vitest';

/**
 * Test Utilities for Admin Override Functionality
 */

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: 'talent',
  ...overrides
});

export const createMockAdmin = (overrides = {}) => ({
  id: 'admin-user-id',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  ...overrides
});

export const mockSupabaseResponse = (data: any, error: any = null) => ({
  data,
  error
});

export const createMockFileUpload = () => {
  const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  return {
    file: mockFile,
    uploadMock: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null })
  };
};