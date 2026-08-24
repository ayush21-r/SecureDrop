-- ====================================================================
-- SecureDrop: Phase 3.2 Hybrid File Encryption Migration
-- ====================================================================
-- Purpose: Add encryption metadata columns to public.files and
-- update get_user_files() RPC to return hybrid encryption metadata.
-- ====================================================================

-- 1. Add encryption metadata columns to public.files
ALTER TABLE public.files
ADD COLUMN IF NOT EXISTS encrypted_key TEXT,
ADD COLUMN IF NOT EXISTS iv TEXT,
ADD COLUMN IF NOT EXISTS encryption_algorithm TEXT DEFAULT 'AES-GCM-256',
ADD COLUMN IF NOT EXISTS key_encryption_algorithm TEXT DEFAULT 'RSA-OAEP-2048',
ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT false;

-- 2. Update get_user_files() RPC function to include encryption metadata
CREATE OR REPLACE FUNCTION public.get_user_files()
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  receiver_id UUID,
  sender_name TEXT,
  sender_email TEXT,
  receiver_name TEXT,
  receiver_email TEXT,
  original_filename TEXT,
  content_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  status TEXT,
  encrypted_key TEXT,
  iv TEXT,
  encryption_algorithm TEXT,
  key_encryption_algorithm TEXT,
  is_encrypted BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure caller is an authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to retrieve files';
  END IF;

  RETURN QUERY
  SELECT 
    f.id,
    f.sender_id,
    f.receiver_id,
    sp.name AS sender_name,
    sp.email AS sender_email,
    rp.name AS receiver_name,
    rp.email AS receiver_email,
    f.original_filename,
    f.content_type,
    f.file_size,
    f.storage_path,
    f.status,
    f.encrypted_key,
    f.iv,
    f.encryption_algorithm,
    f.key_encryption_algorithm,
    COALESCE(f.is_encrypted, false) AS is_encrypted,
    f.created_at,
    f.updated_at
  FROM public.files f
  LEFT JOIN public.profiles sp ON sp.id = f.sender_id
  LEFT JOIN public.profiles rp ON rp.id = f.receiver_id
  WHERE f.sender_id = auth.uid() OR f.receiver_id = auth.uid()
  ORDER BY f.created_at DESC;
END;
$$;

-- Grant execution permissions strictly to authenticated users
REVOKE EXECUTE ON FUNCTION public.get_user_files() FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_files() TO authenticated;
