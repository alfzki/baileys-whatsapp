// Export all utility functions
export * from './phoneNumber.js';
export * from './session.js';
export * from './databaseAuth.js';

/**
 * Sleep utility function
 * @param ms - Milliseconds to sleep
 * @returns Promise that resolves after specified time
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Generate a random delay between min and max milliseconds
 * This creates more human-like behavior to avoid spam detection
 * @param minMs - Minimum delay in milliseconds
 * @param maxMs - Maximum delay in milliseconds
 * @returns Random delay value in milliseconds
 */
export function randomDelay(minMs: number, maxMs: number): number {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

/**
 * Get bulk message delay configuration from environment
 * Returns safe defaults if environment variables are not set or invalid
 * @returns Object with minDelay and maxDelay in milliseconds
 */
export function getBulkMessageDelayConfig(): { minDelay: number; maxDelay: number } {
  const DEFAULT_MIN_DELAY = 10000; // 10 seconds
  const DEFAULT_MAX_DELAY = 15000; // 15 seconds
  
  let minDelay = parseInt(process.env.BULK_MESSAGE_MIN_DELAY || '', 10);
  let maxDelay = parseInt(process.env.BULK_MESSAGE_MAX_DELAY || '', 10);
  
  // Use defaults if values are invalid (NaN, negative, or zero)
  if (isNaN(minDelay) || minDelay <= 0) {
    minDelay = DEFAULT_MIN_DELAY;
  }
  if (isNaN(maxDelay) || maxDelay <= 0) {
    maxDelay = DEFAULT_MAX_DELAY;
  }
  
  // Ensure min is not greater than max
  if (minDelay > maxDelay) {
    console.warn(`[Config] BULK_MESSAGE_MIN_DELAY (${minDelay}) > BULK_MESSAGE_MAX_DELAY (${maxDelay}), swapping values`);
    [minDelay, maxDelay] = [maxDelay, minDelay];
  }
  
  // Enforce minimum safety delay of 5 seconds
  const ABSOLUTE_MIN_DELAY = 5000;
  if (minDelay < ABSOLUTE_MIN_DELAY) {
    console.warn(`[Config] BULK_MESSAGE_MIN_DELAY too low, enforcing minimum of ${ABSOLUTE_MIN_DELAY}ms`);
    minDelay = ABSOLUTE_MIN_DELAY;
  }
  
  return { minDelay, maxDelay };
}

/**
 * Generate random string
 * @param length - Length of random string
 * @returns Random alphanumeric string
 */
export function generateRandomString(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Sanitize string for safe usage
 * @param str - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(str: string): string {
  return str.replace(/[<>\"'&]/g, '');
}

/**
 * Parse JSON safely with fallback
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(jsonString: string, fallback: T): T {
  try {
    return JSON.parse(jsonString) as T;
  } catch {
    return fallback;
  }
} 