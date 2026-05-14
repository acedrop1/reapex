/**
 * Authentication and Authorization Utilities
 *
 * Valid roles: 'agent', 'admin'
 * - agent: Regular agent with standard access
 * - admin: Full admin access (manage users, listings, billing, etc.)
 *
 * Visibility on public site is controlled by `hide_from_listing` flag,
 * not by role. Agents default to visible, admins default to hidden,
 * but admins can toggle visibility for any account.
 */

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: string | null | undefined): boolean {
  return role === 'admin';
}

/**
 * Check if user is any type of agent
 */
export function isAgent(role: string | null | undefined): boolean {
  return role === 'agent';
}
