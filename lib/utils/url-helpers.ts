/**
 * Ensures a URL has a proper https:// protocol
 * @param url - The URL to validate and format
 * @returns Formatted URL with https:// protocol, or null if invalid
 */
export function ensureHttpsProtocol(url: string | null | undefined): string | null {
  if (!url || url.trim() === '') {
    return null;
  }

  const trimmedUrl = url.trim();

  // If URL already has a protocol, return as is
  if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
    return trimmedUrl;
  }

  // If URL starts with //, add https:
  if (trimmedUrl.startsWith('//')) {
    return `https:${trimmedUrl}`;
  }

  // Otherwise, add https:// prefix
  return `https://${trimmedUrl}`;
}

/**
 * Builds a proper Instagram URL from a username or partial URL
 * @param input - Username, partial URL, or full URL
 * @returns Formatted Instagram URL or null if invalid
 */
export function buildInstagramUrl(input: string | null | undefined): string | null {
  if (!input || input.trim() === '') {
    return null;
  }

  const trimmed = input.trim();

  // If already a full URL with protocol, clean it up
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace('http://', 'https://');
  }

  // Remove common URL patterns to extract username
  let username = trimmed
    .replace(/^(www\.)?instagram\.com\//i, '')
    .replace(/^@/, '')
    .replace(/^\/+/, '');

  // If there's nothing left, return null
  if (!username) {
    return null;
  }

  // Build the Instagram URL
  return `https://instagram.com/${username}`;
}

/**
 * Builds a proper Facebook URL from a username or partial URL
 * @param input - Username, partial URL, or full URL
 * @returns Formatted Facebook URL or null if invalid
 */
export function buildFacebookUrl(input: string | null | undefined): string | null {
  if (!input || input.trim() === '') {
    return null;
  }

  const trimmed = input.trim();

  // If already a full URL with protocol, clean it up
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace('http://', 'https://');
  }

  // Remove common URL patterns to extract username
  let username = trimmed
    .replace(/^(www\.)?facebook\.com\//i, '')
    .replace(/^(www\.)?fb\.com\//i, '')
    .replace(/^@/, '')
    .replace(/^\/+/, '');

  // If there's nothing left, return null
  if (!username) {
    return null;
  }

  // Build the Facebook URL
  return `https://facebook.com/${username}`;
}

/**
 * Builds a proper LinkedIn URL from a username or partial URL
 * @param input - Username, partial URL, or full URL
 * @returns Formatted LinkedIn URL or null if invalid
 */
export function buildLinkedInUrl(input: string | null | undefined): string | null {
  if (!input || input.trim() === '') {
    return null;
  }

  const trimmed = input.trim();

  // If already a full URL with protocol, clean it up
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace('http://', 'https://');
  }

  // Remove common URL patterns to extract username
  let username = trimmed
    .replace(/^(www\.)?linkedin\.com\/(in\/)?/i, '')
    .replace(/^@/, '')
    .replace(/^\/+/, '');

  // If there's nothing left, return null
  if (!username) {
    return null;
  }

  // Build the LinkedIn URL with /in/ prefix
  return `https://linkedin.com/in/${username}`;
}

/**
 * Builds a proper TikTok URL from a username or partial URL
 * @param input - Username, partial URL, or full URL
 * @returns Formatted TikTok URL or null if invalid
 */
export function buildTikTokUrl(input: string | null | undefined): string | null {
  if (!input || input.trim() === '') {
    return null;
  }

  const trimmed = input.trim();

  // If already a full URL with protocol, clean it up
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace('http://', 'https://');
  }

  // Remove common URL patterns to extract username
  let username = trimmed
    .replace(/^(www\.)?tiktok\.com\//i, '')
    .replace(/^@/, '')
    .replace(/^\/+/, '');

  // If there's nothing left, return null
  if (!username) {
    return null;
  }

  // Ensure @ prefix for TikTok usernames
  if (!username.startsWith('@')) {
    username = `@${username}`;
  }

  // Build the TikTok URL
  return `https://tiktok.com/${username}`;
}

/**
 * Builds a proper X (Twitter) URL from a username or partial URL
 * @param input - Username, partial URL, or full URL
 * @returns Formatted X/Twitter URL or null if invalid
 */
export function buildTwitterUrl(input: string | null | undefined): string | null {
  if (!input || input.trim() === '') {
    return null;
  }

  const trimmed = input.trim();

  // If already a full URL with protocol, clean it up
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed.replace('http://', 'https://');
  }

  // Remove common URL patterns to extract username
  let username = trimmed
    .replace(/^(www\.)?(twitter|x)\.com\//i, '')
    .replace(/^@/, '')
    .replace(/^\/+/, '');

  // If there's nothing left, return null
  if (!username) {
    return null;
  }

  // Build the X URL (using x.com)
  return `https://x.com/${username}`;
}
