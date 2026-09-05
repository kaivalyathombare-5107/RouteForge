// src/lib/security.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // NIST recommendation for GCM
const AUTH_TAG_LENGTH = 16;
const DEFAULT_SALT = 'routeforge-vault-pbkdf2-salt-secure';

// Get or derive 32-byte encryption key from environment secret
function getEncryptionKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.VITE_ENCRYPTION_SECRET || 'routeforge-production-master-secret-key-2026';
  return crypto.pbkdf2Sync(secret, DEFAULT_SALT, 100000, 32, 'sha256');
}

/**
 * Encrypts sensitive provider tokens or API secrets at rest using AES-256-GCM.
 * Output format: <iv-hex>:<authTag-hex>:<ciphertext-hex>
 */
export function encryptToken(plainText: string): string {
  if (!plainText) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Decrypts sensitive provider tokens at rest.
 */
export function decryptToken(cipherPayload: string): string {
  if (!cipherPayload) return '';
  const parts = cipherPayload.split(':');
  if (parts.length !== 3) {
    // If not encrypted in standard format, return as-is for backward compatibility
    return cipherPayload;
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Safely masks an API token or secret for display or logging
 * e.g. "mmt_live_secret_99812456" -> "mmt_live_...2456"
 */
export function maskSecret(secret: string): string {
  if (!secret) return '••••••••';
  if (secret.length <= 8) return '••••••••';
  return `${secret.slice(0, 8)}...${secret.slice(-4)}`;
}

/**
 * Metadata for tracking token rotation and lifecycle
 */
export interface SecureTokenMetadata {
  encryptedToken: string;
  maskedToken: string;
  provider: string;
  createdAt: string;
  expiresAt: string;
  lastRotatedAt: string;
  rotationIntervalDays: number;
  isExpired: boolean;
}

export function createSecureTokenMetadata(
  rawToken: string,
  provider: string,
  ttlDays: number = 90
): SecureTokenMetadata {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlDays * 24 * 60 * 60 * 1000);

  return {
    encryptedToken: encryptToken(rawToken),
    maskedToken: maskSecret(rawToken),
    provider,
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    lastRotatedAt: now.toISOString(),
    rotationIntervalDays: ttlDays,
    isExpired: false,
  };
}

export function isTokenExpiringSoon(metadata: SecureTokenMetadata, thresholdDays: number = 7): boolean {
  const expiresAt = new Date(metadata.expiresAt).getTime();
  const now = Date.now();
  const daysRemaining = (expiresAt - now) / (1000 * 60 * 60 * 24);
  return daysRemaining <= thresholdDays;
}
