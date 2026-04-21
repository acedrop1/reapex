/**
 * Development Mode Mock User Configuration
 *
 * This file provides a mock admin user for local development.
 * Only active when BYPASS_AUTH=true in .env.local
 *
 * IMPORTANT: This should NEVER be used in production!
 */

export const MOCK_ADMIN_USER = {
  id: '00000000-0000-0000-0000-000000000000', // Mock UUID
  email: 'admin@re-apex.com',
  role: 'authenticated',
  aud: 'authenticated',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    role: 'admin',
    first_name: 'Admin',
    last_name: 'User',
  },
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const MOCK_SESSION = {
  access_token: 'mock-access-token-dev-only',
  token_type: 'bearer',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: 'mock-refresh-token-dev-only',
  user: MOCK_ADMIN_USER,
};

/**
 * Check if authentication bypass is enabled
 */
export function isAuthBypassed(): boolean {
  return process.env.BYPASS_AUTH === 'true';
}

/**
 * Get mock user profile data from users table
 */
export const MOCK_USER_PROFILE = {
  id: MOCK_ADMIN_USER.id,
  email: 'admin@re-apex.com',
  first_name: 'Admin',
  last_name: 'User',
  role: 'admin',
  approved: true,
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  phone: null,
  headshot_url: null,
  bio: 'Development Admin User',
  specialties: ['Development', 'Testing'],
  languages: ['English'],
  license_number: 'DEV-12345',
  years_experience: 10,
  transactions_closed: 100,
  slug: 'admin-dev',
};
