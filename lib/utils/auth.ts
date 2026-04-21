/**
 * Authentication and Authorization Utilities
 */

/**
 * Check if user has admin privileges
 * Both 'admin' and 'admin_agent' roles have full admin access
 *
 * Difference:
 * - admin: Full admin access, NOT listed on public agent pages
 * - admin_agent: Full admin access, IS listed on public agent pages
 */
export function isAdmin(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'admin_agent';
}

/**
 * Check if user is a regular admin (not listed on site)
 */
export function isPureAdmin(role: string | null | undefined): boolean {
  return role === 'admin';
}

/**
 * Check if user is an admin agent (listed on site with admin privileges)
 */
export function isAdminAgent(role: string | null | undefined): boolean {
  return role === 'admin_agent';
}

/**
 * Check if user is any type of agent (agent or admin_agent)
 */
export function isAgent(role: string | null | undefined): boolean {
  return role === 'agent' || role === 'admin_agent';
}

/**
 * Check if user should be listed on public agent pages
 * Only 'agent' and 'admin_agent' roles are publicly listed
 */
export function isPubliclyListedAgent(role: string | null | undefined): boolean {
  return role === 'agent' || role === 'admin_agent';
}
