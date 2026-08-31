/**
 * App Lock and Inactivity Utilities with cryptographic SHA-256 PIN hashing.
 */

export interface LockSettings {
  enabled: boolean;
  pinHash?: string | null;
  autoLockMinutes: number; // 0 = never, 1 = 1m, 5 = 5m, 15 = 15m, 30 = 30m
}

/**
 * Hashes a 4-digit PIN with SHA-256 using native Web Crypto API.
 */
export async function hashPin(pin: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`inkwell_salt_${pin}`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validates entered PIN against stored hash.
 */
export async function verifyPin(enteredPin: string, storedHash: string): Promise<boolean> {
  const enteredHash = await hashPin(enteredPin);
  return enteredHash === storedHash;
}

/**
 * Checks if app lock is currently enabled in localStorage.
 */
export function isAppLockConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem('inkwell_lock_settings');
    if (!raw) return false;
    const parsed = JSON.parse(raw);
    return !!parsed.enabled && !!parsed.pinHash;
  } catch {
    return false;
  }
}

