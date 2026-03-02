import { nanoid } from 'nanoid';

/**
 * Generate a URL-safe API key prefixed with "ca_" (creative analyser).
 * Format: ca_ + 32 random characters = 35 chars total.
 */
export function generateApiKey(): string {
  return `ca_${nanoid(32)}`;
}
