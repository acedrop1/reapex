/**
 * Authentication and Authorization Utilities
 *
 * Valid roles in user_role enum: 'agent', 'admin', 'broker'
 * - agent: Regular agent with standard access
 * - admin: Full admin access
 * - broker: Full admin access (broker/owner level)
 */

/**
 * Check if user has admin privileges
 * Both 'admin' and 'broker' roles have full admin access
 */
export function isAdmin(role: string | null | undefined): boolean {
  return role === 'admin' || role === 'broker';
}

/**
 * Check if user is a broker (highest privilege level)
 */
export function isBroker(role: string | null | undefined): boolean {
  return role === 'broker';
}

/**
 * Check if user is any type of agent
 */
export function isAgent(role: string | null | undefined): boolean {
  return role === 'agent';
}

/**
 * Check if user should be listed on public agent pages
 * All agents are publicly listed, admins/brokers can optionally be listed
 */
export function isPubliclyListedAgent(role: string | null | undefined): boolean {
  return role === 'agent' || role === 'broker';
}
