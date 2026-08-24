import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  fetchPublicKeyFromSupabase,
  importPublicKeyPEM,
  generateAESGCMKey,
  generateRandomIV,
  encryptFileWithAES,
  encryptAESKeyWithRSA,
  bufferToBase64,
} from './cryptoService';

// 50 MB standard maximum upload limit
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const STORAGE_BUCKET_NAME = 'secure-files';

/**
 * Fetch all registered user profiles excluding the currently authenticated user.
 * @param {string} currentUserId - Authenticated user's UUID.
 * @returns {Promise<{ success: boolean, data?: Array, error?: string }>}
 */
export async function fetchReceivers(currentUserId) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase credentials are not configured in environment variables.',
    };
  }

  try {
    // Call the security definer RPC function to fetch other registered receivers
    const { data, error } = await supabase.rpc('get_receivers');

    if (error) {
      console.error('Error fetching receiver profiles via RPC:', error.message);
      return { success: false, error: error.message };
    }

    // Defensively filter out the current user if present
    const receiversList = (data || []).filter(
      (profile) => !currentUserId || profile.id !== currentUserId
    );

    return { success: true, data: receiversList };
  } catch (err) {
    console.error('Unexpected error fetching receivers:', err);
    return { success: false, error: err.message || 'Failed to load recipient list.' };
  }
}

/**
 * Upload and send a file using client-side Hybrid Cryptography (AES-256-GCM + RSA-OAEP 2048-bit).
 *
 * Flow:
 * 1. Validate file and recipient identity.
 * 2. Retrieve recipient's RSA-OAEP public key from Supabase.
 * 3. Generate a cryptographically random 256-bit AES-GCM key and 12-byte IV.
 * 4. Encrypt the file using AES-GCM.
 * 5. Encrypt the AES key using recipient's RSA-OAEP public key.
 * 6. Upload encrypted ciphertext blob to private Supabase Storage bucket.
 * 7. Store encryption metadata (encrypted key, IV, algorithms) in public.files.
 * 8. Automatic rollback/cleanup if database insertion fails.
 *
 * @param {Object} params
 * @param {File} params.file - Browser File object
 * @param {string} params.senderId - Authenticated sender UUID
 * @param {string} params.receiverId - Selected receiver UUID
 * @param {Function} [params.onProgressStage] - Callback for UI status transitions
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function uploadAndSendFile({ file, senderId, receiverId, onProgressStage }) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase credentials are not configured.',
    };
  }

  // 1. Validations
  if (!file) {
    return { success: false, error: 'Please select a file to send.' };
  }

  if (!senderId) {
    return { success: false, error: 'User session not found. Please log in again.' };
  }

  if (!receiverId) {
    return { success: false, error: 'Please select a valid recipient.' };
  }

  if (senderId === receiverId) {
    return { success: false, error: 'You cannot send a file to yourself.' };
  }

  if (file.size === 0) {
    return { success: false, error: 'Empty files (0 bytes) cannot be uploaded.' };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      success: false,
      error: `File size exceeds the 50 MB limit (Selected: ${(file.size / (1024 * 1024)).toFixed(2)} MB).`,
    };
  }

  let storageUploadSuccess = false;
  let storagePath = '';

  try {
    // 2. Fetch Recipient's RSA Public Key from Supabase
    if (onProgressStage) onProgressStage('fetching_key');

    const keyResult = await fetchPublicKeyFromSupabase(receiverId);
    if (!keyResult.success || !keyResult.data?.public_key) {
      return {
        success: false,
        error:
          'Recipient has not registered their cryptographic identity (RSA public key). The file cannot be securely encrypted.',
      };
    }

    const recipientPublicKey = await importPublicKeyPEM(keyResult.data.public_key);

    // 3. Generate AES-GCM-256 Key and 12-byte IV
    if (onProgressStage) onProgressStage('encrypting_file');

    const fileBuffer = await file.arrayBuffer();
    const aesKey = await generateAESGCMKey();
    const iv = generateRandomIV();

    // 4. Encrypt file with AES-GCM
    const ciphertextBuffer = await encryptFileWithAES(fileBuffer, aesKey, iv);

    // 5. Encapsulate AES key with recipient's RSA-OAEP Public Key
    if (onProgressStage) onProgressStage('protecting_key');

    const rawAesKeyBuffer = await window.crypto.subtle.exportKey('raw', aesKey);
    const encryptedAesKeyBuffer = await encryptAESKeyWithRSA(rawAesKeyBuffer, recipientPublicKey);

    const encryptedKeyBase64 = bufferToBase64(encryptedAesKeyBuffer);
    const ivBase64 = bufferToBase64(iv);

    // 6. Prepare encrypted Blob for upload
    const encryptedBlob = new Blob([ciphertextBuffer], { type: 'application/octet-stream' });

    // Generate unique storage path conforming to RLS: <sender_id>/<timestamp>_<uuid>_<filename>.enc
    const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const uniquePrefix = `${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
    const uniqueFileName = `${uniquePrefix}_${sanitizedOriginalName}.enc`;
    storagePath = `${senderId}/${uniqueFileName}`;

    // 7. Upload encrypted ciphertext blob to Supabase Storage bucket
    if (onProgressStage) onProgressStage('uploading_encrypted');

    const { data: storageData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(storagePath, encryptedBlob, {
        contentType: 'application/octet-stream',
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      console.error('Encrypted storage upload error:', storageError.message);
      return {
        success: false,
        error: `Storage upload failed: ${storageError.message}`,
      };
    }

    storageUploadSuccess = true;

    // 8. Insert metadata and encryption records into public.files
    if (onProgressStage) onProgressStage('saving_metadata');

    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          original_filename: file.name,
          content_type: file.type || 'application/octet-stream',
          file_size: file.size, // Original plaintext file size for display
          storage_path: storagePath,
          status: 'available',
          encrypted_key: encryptedKeyBase64,
          iv: ivBase64,
          encryption_algorithm: 'AES-GCM-256',
          key_encryption_algorithm: 'RSA-OAEP-2048',
          is_encrypted: true,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database metadata insertion error:', dbError.message);

      // Automatic cleanup: delete the uploaded storage object to prevent orphan files
      try {
        await supabase.storage.from(STORAGE_BUCKET_NAME).remove([storagePath]);
        console.log(`Cleaned up orphaned storage object at ${storagePath}`);
      } catch (cleanupErr) {
        console.error('Failed to clean up orphaned storage file:', cleanupErr);
      }

      return {
        success: false,
        error: `Database record creation failed: ${dbError.message}. Upload was reverted.`,
      };
    }

    return {
      success: true,
      data: fileRecord,
    };
  } catch (err) {
    console.error('Unexpected error during hybrid file send:', err);

    // Rollback storage file if error occurred after upload
    if (storageUploadSuccess && storagePath) {
      try {
        await supabase.storage.from(STORAGE_BUCKET_NAME).remove([storagePath]);
      } catch (cleanupErr) {
        console.error('Failed to remove uploaded file during unexpected error rollback:', cleanupErr);
      }
    }

    return {
      success: false,
      error: err.message || 'An unexpected error occurred during hybrid encryption and upload.',
    };
  }
}

/**
 * Fetch all files where the current authenticated user is either the receiver or the sender.
 * Uses the get_user_files RPC for full sender/receiver names and encryption metadata.
 *
 * @param {string} currentUserId - Authenticated user UUID
 * @returns {Promise<{ success: boolean, receivedFiles?: Array, sentFiles?: Array, error?: string }>}
 */
export async function fetchUserFiles(currentUserId) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase credentials are not configured.',
      receivedFiles: [],
      sentFiles: [],
    };
  }

  if (!currentUserId) {
    return {
      success: false,
      error: 'User not authenticated.',
      receivedFiles: [],
      sentFiles: [],
    };
  }

  try {
    // 1. Attempt to call secure RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_files');

    let allFiles = [];

    if (!rpcError && rpcData) {
      allFiles = rpcData;
    } else {
      console.warn(
        'get_user_files RPC unavailable or returned error, falling back to direct files query:',
        rpcError?.message
      );

      // Fallback: direct query on public.files (protected by files RLS)
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('files')
        .select('*')
        .order('created_at', { ascending: false });

      if (fallbackError) {
        return {
          success: false,
          error: fallbackError.message,
          receivedFiles: [],
          sentFiles: [],
        };
      }

      allFiles = fallbackData || [];
    }

    const receivedFiles = allFiles.filter((f) => f.receiver_id === currentUserId);
    const sentFiles = allFiles.filter((f) => f.sender_id === currentUserId);

    return {
      success: true,
      receivedFiles,
      sentFiles,
    };
  } catch (err) {
    console.error('Error fetching user files:', err);
    return {
      success: false,
      error: err.message || 'Failed to load files.',
      receivedFiles: [],
      sentFiles: [],
    };
  }
}

/**
 * Download a private file from the secure-files Supabase Storage bucket.
 * Triggers a browser file download using the file's original_filename.
 *
 * @param {Object} params
 * @param {string} params.storagePath - Path inside secure-files bucket
 * @param {string} params.originalFilename - Clean original filename to save as
 * @param {string} params.status - File status (e.g. 'available', 'deleted')
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function downloadFile({ storagePath, originalFilename, status }) {
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Supabase credentials are not configured.' };
  }

  if (status === 'deleted') {
    return { success: false, error: 'File is no longer available.' };
  }

  if (!storagePath) {
    return { success: false, error: 'Invalid file storage path.' };
  }

  try {
    // 1. Download file blob from private bucket
    const { data: blob, error: downloadError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .download(storagePath);

    if (downloadError) {
      console.error('Storage download error:', downloadError.message);
      return {
        success: false,
        error: `Download failed: ${downloadError.message || 'Access denied or file not found.'}`,
      };
    }

    if (!blob) {
      return { success: false, error: 'Empty file payload received from storage.' };
    }

    // 2. Trigger browser download using original filename
    const objectUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = originalFilename || 'downloaded_file';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // 3. Clean up object URL
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 100);

    return { success: true };
  } catch (err) {
    console.error('Unexpected download error:', err);
    return {
      success: false,
      error: err.message || 'Failed to download file.',
    };
  }
}
