-- ====================================================================
-- SecureDrop: Table & RLS for Encrypted RSA Private Key Backups
-- ====================================================================
-- Purpose: Store client-side encrypted RSA private keys for zero-knowledge
-- multi-device recovery. Plaintext private keys and passphrases NEVER touch
-- this database or the network.
-- ====================================================================

-- 1. Create encrypted key backups table
CREATE TABLE IF NOT EXISTS public.user_key_backups (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_private_key TEXT NOT NULL,
  backup_salt TEXT NOT NULL,
  backup_iv TEXT NOT NULL,
  kdf_algorithm TEXT NOT NULL DEFAULT 'PBKDF2-SHA256',
  kdf_iterations INTEGER NOT NULL DEFAULT 250000,
  encryption_algorithm TEXT NOT NULL DEFAULT 'AES-GCM-256',
  backup_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable Row-Level Security
ALTER TABLE public.user_key_backups ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Users can only SELECT their own encrypted key backup
DROP POLICY IF EXISTS "Allow users to read their own key backup" ON public.user_key_backups;
CREATE POLICY "Allow users to read their own key backup"
ON public.user_key_backups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Policy: Users can only INSERT their own encrypted key backup
DROP POLICY IF EXISTS "Allow users to insert their own key backup" ON public.user_key_backups;
CREATE POLICY "Allow users to insert their own key backup"
ON public.user_key_backups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. Policy: Users can only UPDATE their own encrypted key backup
DROP POLICY IF EXISTS "Allow users to update their own key backup" ON public.user_key_backups;
CREATE POLICY "Allow users to update their own key backup"
ON public.user_key_backups
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 6. Policy: Users can only DELETE their own encrypted key backup
DROP POLICY IF EXISTS "Allow users to delete their own key backup" ON public.user_key_backups;
CREATE POLICY "Allow users to delete their own key backup"
ON public.user_key_backups
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 7. Trigger to automatically maintain updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_user_key_backups_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_user_key_backups_updated_at ON public.user_key_backups;
CREATE TRIGGER set_user_key_backups_updated_at
BEFORE UPDATE ON public.user_key_backups
FOR EACH ROW
EXECUTE FUNCTION public.handle_user_key_backups_updated_at();
