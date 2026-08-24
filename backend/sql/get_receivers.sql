-- ====================================================================
-- SecureDrop: RPC Function to fetch available receivers
-- ====================================================================
-- Purpose: Safely retrieve list of registered users for recipient selection
-- without making the public.profiles table globally readable under RLS.
-- ====================================================================

CREATE OR REPLACE FUNCTION public.get_receivers()
RETURNS TABLE (
  id UUID,
  name TEXT,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Ensure caller is an authenticated user
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required to retrieve receivers';
  END IF;

  -- 2. Return other registered user profiles (excluding the caller)
  RETURN QUERY
  SELECT 
    p.id,
    p.name,
    p.email
  FROM public.profiles p
  WHERE p.id != auth.uid()
  ORDER BY p.name ASC;
END;
$$;

-- Grant execution permissions strictly to authenticated users
REVOKE EXECUTE ON FUNCTION public.get_receivers() FROM public;
GRANT EXECUTE ON FUNCTION public.get_receivers() TO authenticated;
