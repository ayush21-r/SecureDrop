import { supabase, isSupabaseConfigured } from '../lib/supabase';

const DB_NAME = 'SecureDropKeyStore';
const STORE_NAME = 'rsa_keys';
const DB_VERSION = 1;

export const RSA_CONFIG = {
  name: 'RSA-OAEP',
  modulusLength: 2048,
  publicExponent: new Uint8Array([1, 0, 1]), // 65537
  hash: 'SHA-256',
};

export const AES_CONFIG = {
  name: 'AES-GCM',
  length: 256,
};

// In-flight promise map to avoid race conditions during concurrent component renders
const activeInitializations = new Map();

/**
 * Open or upgrade the local IndexedDB database for private key storage.
 * @returns {Promise<IDBDatabase>}
 */
function openKeyDatabase() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this browser.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'userId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Store the user's RSA private key locally in IndexedDB.
 * The private key NEVER leaves the client device.
 *
 * @param {string} userId - Authenticated user UUID
 * @param {CryptoKey} privateKey - Web Crypto private key
 * @param {CryptoKey} [publicKey] - Optional corresponding public key
 * @returns {Promise<void>}
 */
export async function storePrivateKeyLocally(userId, privateKey, publicKey = null) {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    const record = {
      userId,
      privateKey,
      publicKey,
      createdAt: new Date().toISOString(),
    };

    const request = store.put(record);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve the user's local RSA private key from IndexedDB.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{ privateKey: CryptoKey, publicKey: CryptoKey } | null>}
 */
export async function getPrivateKeyLocally(userId) {
  const db = await openKeyDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(userId);

    request.onsuccess = () => {
      if (request.result && request.result.privateKey) {
        resolve({
          privateKey: request.result.privateKey,
          publicKey: request.result.publicKey || null,
        });
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * Generate a new RSA-OAEP 2048-bit key pair using native Web Crypto API.
 * @returns {Promise<CryptoKeyPair>}
 */
export async function generateRSAKeyPair() {
  return await window.crypto.subtle.generateKey(
    RSA_CONFIG,
    true, // extractable
    ['encrypt', 'decrypt']
  );
}

/**
 * Export a CryptoKey public key to standard PEM string format.
 * @param {CryptoKey} publicKey
 * @returns {Promise<string>}
 */
export async function exportPublicKeyPEM(publicKey) {
  const spkiBuffer = await window.crypto.subtle.exportKey('spki', publicKey);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(spkiBuffer)));
  // Split into 64-char lines for standard PEM formatting
  const formatted = base64.match(/.{1,64}/g)?.join('\n') || base64;
  return `-----BEGIN PUBLIC KEY-----\n${formatted}\n-----END PUBLIC KEY-----`;
}

/**
 * Import a PEM formatted string back into a Web Crypto CryptoKey for RSA-OAEP encryption.
 * @param {string} pemString
 * @returns {Promise<CryptoKey>}
 */
export async function importPublicKeyPEM(pemString) {
  const cleanBase64 = pemString
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/[\r\n\s]/g, '');

  const binaryString = atob(cleanBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return await window.crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    {
      name: 'RSA-OAEP',
      hash: 'SHA-256',
    },
    true,
    ['encrypt']
  );
}

/**
 * Calculate the SHA-256 fingerprint of a public key PEM.
 * @param {string} pemString
 * @returns {Promise<string>}
 */
export async function calculateKeyFingerprint(pemString) {
  const encoder = new TextEncoder();
  const data = encoder.encode(pemString);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `SHA256:${hex.substring(0, 8)}...${hex.substring(hex.length - 8)}`;
}

/**
 * Fetch a user's registered public key from Supabase user_public_keys table.
 * @param {string} userId
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function fetchPublicKeyFromSupabase(userId) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { data, error } = await supabase
      .from('user_public_keys')
      .select('user_id, public_key, algorithm, created_at, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Register or update the user's public key in Supabase user_public_keys table.
 * @param {string} userId
 * @param {string} publicKeyPem
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function registerPublicKeyInSupabase(userId, publicKeyPem) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase
      .from('user_public_keys')
      .upsert(
        {
          user_id: userId,
          public_key: publicKeyPem,
          algorithm: 'RSA-OAEP-2048',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ====================================================================
// Phase 3.2: AES-GCM Key Generation & Hybrid Encryption Utilities
// ====================================================================

/**
 * Generate a cryptographically secure random AES-GCM 256-bit key.
 * @returns {Promise<CryptoKey>}
 */
export async function generateAESGCMKey() {
  return await window.crypto.subtle.generateKey(
    AES_CONFIG,
    true, // extractable to wrap with RSA
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a cryptographically secure 96-bit (12-byte) random IV for AES-GCM.
 * @returns {Uint8Array}
 */
export function generateRandomIV() {
  const iv = new Uint8Array(12);
  window.crypto.getRandomValues(iv);
  return iv;
}

/**
 * Encrypt binary buffer using AES-GCM 256-bit.
 * @param {ArrayBuffer} arrayBuffer - Plaintext file data
 * @param {CryptoKey} aesKey - 256-bit AES-GCM key
 * @param {Uint8Array} iv - 12-byte initialization vector
 * @returns {Promise<ArrayBuffer>} Ciphertext with appended 128-bit authentication tag
 */
export async function encryptFileWithAES(arrayBuffer, aesKey, iv) {
  return await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    arrayBuffer
  );
}

/**
 * Encrypt the raw AES key bytes using the recipient's RSA-OAEP public key.
 * @param {ArrayBuffer} rawAesKeyBuffer - Raw 32-byte AES key
 * @param {CryptoKey} recipientPublicKey - Recipient's RSA-OAEP public key
 * @returns {Promise<ArrayBuffer>} RSA-OAEP encrypted AES key
 */
export async function encryptAESKeyWithRSA(rawAesKeyBuffer, recipientPublicKey) {
  return await window.crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    recipientPublicKey,
    rawAesKeyBuffer
  );
}

/**
 * Convert ArrayBuffer or Uint8Array to standard Base64 string.
 * @param {ArrayBuffer | Uint8Array} buffer
 * @returns {string}
 */
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer.
 * @param {string} base64
 * @returns {ArrayBuffer}
 */
export function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Run a native Web Crypto RSA-OAEP encryption and decryption self-test cycle.
 * @param {CryptoKey} publicKey
 * @param {CryptoKey} privateKey
 * @returns {Promise<{ success: boolean, testMessage?: string, decryptedMessage?: string, error?: string }>}
 */
export async function runRSASelfTest(publicKey, privateKey) {
  try {
    const testMessage = `SecureDrop-SelfTest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const encodedPayload = encoder.encode(testMessage);

    // 1. Encrypt test payload with RSA Public Key
    const ciphertext = await window.crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      encodedPayload
    );

    // 2. Decrypt ciphertext with RSA Private Key
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      privateKey,
      ciphertext
    );

    const decryptedMessage = decoder.decode(decryptedBuffer);

    if (decryptedMessage === testMessage) {
      return {
        success: true,
        testMessage,
        decryptedMessage,
      };
    } else {
      return {
        success: false,
        error: 'Decrypted message does not match original plaintext.',
      };
    }
  } catch (err) {
    console.error('RSA Self-Test Failed:', err);
    return {
      success: false,
      error: err.message || 'RSA encryption/decryption test failed.',
    };
  }
}

/**
 * Run complete AES-256-GCM + RSA-OAEP hybrid encryption self-test.
 * Verifies full cycle: AES file encryption -> RSA key wrapping -> RSA key unwrapping -> AES file decryption.
 *
 * @returns {Promise<{ success: boolean, details?: string, error?: string }>}
 */
export async function runHybridCryptoSelfTest() {
  try {
    const samplePlaintext = 'SecureDrop Hybrid Cryptography Self-Test Verification Payload ' + Date.now();
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    const plaintextBuffer = encoder.encode(samplePlaintext);

    // 1. Generate RSA key pair
    const rsaPair = await generateRSAKeyPair();

    // 2. Generate random AES-256 key and IV
    const aesKey = await generateAESGCMKey();
    const iv = generateRandomIV();

    // 3. Encrypt payload with AES-GCM
    const ciphertext = await encryptFileWithAES(plaintextBuffer, aesKey, iv);

    // 4. Export raw AES key bytes
    const rawAesKey = await window.crypto.subtle.exportKey('raw', aesKey);

    // 5. Encrypt AES key with RSA Public Key
    const encryptedAesKey = await encryptAESKeyWithRSA(rawAesKey, rsaPair.publicKey);

    // 6. Decrypt AES key with RSA Private Key
    const decryptedRawAesKey = await window.crypto.subtle.decrypt(
      { name: 'RSA-OAEP' },
      rsaPair.privateKey,
      encryptedAesKey
    );

    // 7. Import recovered AES key
    const recoveredAesKey = await window.crypto.subtle.importKey(
      'raw',
      decryptedRawAesKey,
      AES_CONFIG,
      true,
      ['decrypt']
    );

    // 8. Decrypt ciphertext with recovered AES key
    const decryptedPlaintextBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      recoveredAesKey,
      ciphertext
    );

    const recoveredText = decoder.decode(decryptedPlaintextBuffer);

    if (recoveredText === samplePlaintext) {
      return {
        success: true,
        details: 'AES-GCM 256-bit + RSA-OAEP 2048-bit hybrid encryption cycle verified successfully.',
      };
    } else {
      return {
        success: false,
        error: 'Recovered plaintext does not match original sample.',
      };
    }
  } catch (err) {
    console.error('Hybrid Cryptography Self-Test Error:', err);
    return {
      success: false,
      error: err.message || 'Hybrid cryptography self-test failed.',
    };
  }
}

/**
 * Initialize or restore the authenticated user's persistent RSA Cryptographic Identity.
 *
 * @param {string} userId - Authenticated user UUID
 * @returns {Promise<{
 *   status: 'active' | 'private_key_missing' | 'error',
 *   publicKeyPem?: string,
 *   fingerprint?: string,
 *   privateKey?: CryptoKey,
 *   publicKey?: CryptoKey,
 *   error?: string
 * }>}
 */
export async function initializeCryptoIdentity(userId) {
  if (!userId) {
    return { status: 'error', error: 'User ID is required.' };
  }

  // Prevent duplicate simultaneous initializations for the same user
  if (activeInitializations.has(userId)) {
    return activeInitializations.get(userId);
  }

  const initPromise = (async () => {
    try {
      // 1. Check local IndexedDB
      const localKeys = await getPrivateKeyLocally(userId);

      // 2. Check Supabase public key
      const remoteKeyResult = await fetchPublicKeyFromSupabase(userId);
      const remotePublicKeyPem = remoteKeyResult.data?.public_key || null;

      // Case A: Both exist
      if (localKeys && remotePublicKeyPem) {
        let pubKey = localKeys.publicKey;
        if (!pubKey) {
          pubKey = await importPublicKeyPEM(remotePublicKeyPem);
        }
        const fingerprint = await calculateKeyFingerprint(remotePublicKeyPem);
        return {
          status: 'active',
          publicKeyPem: remotePublicKeyPem,
          fingerprint,
          privateKey: localKeys.privateKey,
          publicKey: pubKey,
        };
      }

      // Case B: Local exists, remote missing -> Re-register public key in Supabase
      if (localKeys && !remotePublicKeyPem) {
        let pubKey = localKeys.publicKey;
        if (!pubKey) {
          throw new Error('Local public key reference missing.');
        }
        const pem = await exportPublicKeyPEM(pubKey);
        await registerPublicKeyInSupabase(userId, pem);
        const fingerprint = await calculateKeyFingerprint(pem);
        return {
          status: 'active',
          publicKeyPem: pem,
          fingerprint,
          privateKey: localKeys.privateKey,
          publicKey: pubKey,
        };
      }

      // Case C: Remote exists, local missing -> User logged in on new device / cleared IndexedDB
      if (!localKeys && remotePublicKeyPem) {
        const fingerprint = await calculateKeyFingerprint(remotePublicKeyPem);
        return {
          status: 'private_key_missing',
          publicKeyPem: remotePublicKeyPem,
          fingerprint,
          error:
            'Your public key is registered in Supabase, but your private key is missing on this browser. Do not regenerate keys if you have previous encrypted files.',
        };
      }

      // Case D: Neither exists -> Fresh account, generate new key pair
      console.log('Generating initial RSA-OAEP 2048-bit key pair for user:', userId);
      const keyPair = await generateRSAKeyPair();
      const pem = await exportPublicKeyPEM(keyPair.publicKey);

      // Store private key in IndexedDB locally (NEVER SENT TO NETWORK)
      await storePrivateKeyLocally(userId, keyPair.privateKey, keyPair.publicKey);

      // Register public key in Supabase
      await registerPublicKeyInSupabase(userId, pem);

      const fingerprint = await calculateKeyFingerprint(pem);

      return {
        status: 'active',
        publicKeyPem: pem,
        fingerprint,
        privateKey: keyPair.privateKey,
        publicKey: keyPair.publicKey,
      };
    } catch (err) {
      console.error('Error initializing cryptographic identity:', err);
      return {
        status: 'error',
        error: err.message || 'Failed to initialize RSA key identity.',
      };
    } finally {
      activeInitializations.delete(userId);
    }
  })();

  activeInitializations.set(userId, initPromise);
  return initPromise;
}
