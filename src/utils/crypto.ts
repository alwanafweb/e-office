import CryptoJS from 'crypto-js';

// Secret key for AES-256 encryption on client-side storage
const SECRET_KEY = import.meta.env.VITE_STORAGE_SECRET_KEY || 'LDI_EOFFICE_AES256_SECURE_KEY_2026_@#$';

/**
 * Encrypts any data payload using AES-256
 */
export const encryptData = (data: any): string => {
  try {
    const jsonString = typeof data === 'string' ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
  } catch (err) {
    console.error('AES-256 Encryption error:', err);
    return typeof data === 'string' ? data : JSON.stringify(data);
  }
};

/**
 * Decrypts an AES-256 encrypted string back to JavaScript object or value
 */
export const decryptData = <T = any>(encryptedString: string | null): T | null => {
  if (!encryptedString) return null;

  const trimmed = encryptedString.trim();

  // Backward compatibility check for plain JSON strings or primitives
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('[') ||
    trimmed.startsWith('"') ||
    trimmed === 'true' ||
    trimmed === 'false' ||
    !isNaN(Number(trimmed))
  ) {
    try {
      return JSON.parse(encryptedString) as T;
    } catch {
      return encryptedString as unknown as T;
    }
  }

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedString, SECRET_KEY);
    const decryptedString = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedString) {
      // Fallback if decryption result is empty
      return JSON.parse(encryptedString) as T;
    }
    return JSON.parse(decryptedString) as T;
  } catch (err) {
    // If decryption fails, attempt plain JSON parse as fallback
    try {
      return JSON.parse(encryptedString) as T;
    } catch {
      console.warn('Decryption failed, returning null for key value:', err);
      return null;
    }
  }
};

/**
 * Saves encrypted data to localStorage
 */
export const setEncryptedItem = (key: string, value: any): void => {
  try {
    if (value === undefined || value === null) {
      localStorage.removeItem(key);
      return;
    }
    const cipherText = encryptData(value);
    localStorage.setItem(key, cipherText);
  } catch (err) {
    console.error(`Failed to set encrypted item in localStorage [key: ${key}]:`, err);
  }
};

/**
 * Retrieves and decrypts data from localStorage with auto-migration of plain text
 */
export const getDecryptedItem = <T = any>(key: string, defaultValue?: T): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue !== undefined ? defaultValue : null;

    const decrypted = decryptData<T>(raw);

    // Auto-migrate legacy plain text in localStorage to AES-256 encrypted
    if (raw.trim().startsWith('{') || raw.trim().startsWith('[')) {
      if (decrypted !== null) {
        setEncryptedItem(key, decrypted);
      }
    }

    return decrypted !== null ? decrypted : (defaultValue !== undefined ? defaultValue : null);
  } catch (err) {
    console.error(`Failed to get decrypted item from localStorage [key: ${key}]:`, err);
    return defaultValue !== undefined ? defaultValue : null;
  }
};

/**
 * Removes an item from localStorage
 */
export const removeEncryptedItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.error(`Failed to remove item from localStorage [key: ${key}]:`, err);
  }
};

// Aliasing for flexibility
export const getStorage = getDecryptedItem;
export const setStorage = setEncryptedItem;
export const removeStorage = removeEncryptedItem;
