/**
 * Sanitizes user-supplied strings to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitize(str: string | null | undefined): string {
  if (!str) return '';
  
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitizes domain names - allows alphanumeric, dots, hyphens
 * Removes any potentially malicious characters
 */
export function sanitizeDomain(domain: string | null | undefined): string {
  if (!domain) return '';
  
  // Only allow alphanumeric, dots, and hyphens (valid domain characters)
  return String(domain).replace(/[^a-zA-Z0-9.-]/g, '');
}
