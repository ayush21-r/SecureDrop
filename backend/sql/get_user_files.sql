-- ====================================================================
-- SecureDrop: RPC Function to fetch user's received & sent files
-- ====================================================================
-- Purpose: Safely retrieve file records belonging to the authenticated user
-- along with sender and receiver names/emails without weakening profiles RLS.
-- ====================================================================

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
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure caller is an authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to retrieve files';
  END IF;

  -- 2. Return files where caller is either the sender or receiver
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
