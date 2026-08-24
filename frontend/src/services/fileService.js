import { supabase, isSupabaseConfigured } from '../lib/supabase';

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
 * Upload a file to the private Supabase Storage bucket and persist metadata in public.files.
 * Handles automatic rollback/cleanup if the database insertion fails.
 *
 * @param {Object} params
 * @param {File} params.file - Browser File object
 * @param {string} params.senderId - Authenticated sender UUID
 * @param {string} params.receiverId - Selected receiver UUID
 * @returns {Promise<{ success: boolean, data?: Object, error?: string }>}
 */
export async function uploadAndSendFile({ file, senderId, receiverId }) {
  if (!isSupabaseConfigured) {
    return {
      success: false,
      error: 'Supabase credentials are not configured.',
    };
  }

  // 1. Validation
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

  // 2. Generate unique storage path conforming to RLS: <sender_id>/<unique_filename>
  const sanitizedOriginalName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniquePrefix = `${Date.now()}_${crypto.randomUUID().substring(0, 8)}`;
  const uniqueFileName = `${uniquePrefix}_${sanitizedOriginalName}`;
  const storagePath = `${senderId}/${uniqueFileName}`;
  const contentType = file.type || 'application/octet-stream';

  let storageUploadSuccess = false;

  try {
    // 3. Upload file to Supabase Storage bucket
    const { data: storageData, error: storageError } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(storagePath, file, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      });

    if (storageError) {
      console.error('Storage upload error:', storageError.message);
      return {
        success: false,
        error: `Storage upload failed: ${storageError.message}`,
      };
    }

    storageUploadSuccess = true;

    // 4. Insert file metadata record into public.files
    const { data: fileRecord, error: dbError } = await supabase
      .from('files')
      .insert([
        {
          sender_id: senderId,
          receiver_id: receiverId,
          original_filename: file.name,
          content_type: contentType,
          file_size: file.size,
          storage_path: storagePath,
          status: 'available',
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error('Database metadata insertion error:', dbError.message);

      // 5. Automatic cleanup: delete the uploaded storage object to prevent orphan files
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
    console.error('Unexpected error during file send:', err);

    // Rollback storage file if error occurred after upload
    if (storageUploadSuccess) {
      try {
        await supabase.storage.from(STORAGE_BUCKET_NAME).remove([storagePath]);
      } catch (cleanupErr) {
        console.error('Failed to remove uploaded file during unexpected error rollback:', cleanupErr);
      }
    }

    return {
      success: false,
      error: err.message || 'An unexpected error occurred during file upload.',
    };
  }
}
