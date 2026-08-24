-- ====================================================================
-- SecureDrop: Table & RLS for User RSA Public Keys
-- ====================================================================
-- Purpose: Securely store and distribute RSA public keys for user identity
-- and future hybrid key exchange. Private keys are NEVER stored here.
-- ====================================================================

-- 1. Create public keys table
CREATE TABLE IF NOT EXISTS public.user_public_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  public_key TEXT NOT NULL,
  algorithm TEXT NOT NULL DEFAULT 'RSA-OAEP-2048',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row-Level Security
ALTER TABLE public.user_public_keys ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated users can view public keys (needed for file sharing)
DROP POLICY IF EXISTS "Allow authenticated users to read public keys" ON public.user_public_keys;
CREATE POLICY "Allow authenticated users to read public keys"
ON public.user_public_keys
FOR SELECT
TO authenticated
USING (true);

-- 4. Policy: Users can only insert their own public key
DROP POLICY IF EXISTS "Allow users to insert their own public key" ON public.user_public_keys;
CREATE POLICY "Allow users to insert their own public key"
ON public.user_public_keys
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Users can only update their own public key
DROP POLICY IF EXISTS "Allow users to update their own public key" ON public.user_public_keys;
CREATE POLICY "Allow users to update their own public key"
ON public.user_public_keys
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Optional: Trigger to update updated_at on change
CREATE OR REPLACE FUNCTION public.handle_user_public_keys_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_public_keys_updated_at ON public.user_public_keys;
CREATE TRIGGER set_user_public_keys_updated_at
BEFORE UPDATE ON public.user_public_keys
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_public_keys_updated_at();
