import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Calendar,
  Copy,
  Check,
  LogOut,
  Fingerprint,
  Shield,
  KeyRound,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Play,
  RefreshCw,
  Lock,
  CloudUpload,
  DownloadCloud,
  Eye,
  EyeOff,
  ShieldCheck,
  Key,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  initializeCryptoIdentity,
  runRSASelfTest,
  createEncryptedKeyBackup,
  fetchKeyBackupMetadata,
  restorePrivateKeyFromBackup,
} from '../services/cryptoService';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [cryptoState, setCryptoState] = useState({
    loading: true,
    status: 'initializing',
    publicKeyPem: null,
    fingerprint: null,
    publicKey: null,
    privateKey: null,
    error: null,
  });

  const [copied, setCopied] = useState(false);
  const [testingCrypto, setTestingCrypto] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Backup & Recovery state
  const [backupMeta, setBackupMeta] = useState({
    loading: true,
    hasBackup: false,
    data: null,
  });

  const [showBackupModal, setShowBackupModal] = useState(false);
  const [backupPassphrase, setBackupPassphrase] = useState('');
  const [backupConfirmPassphrase, setBackupConfirmPassphrase] = useState('');
  const [showBackupPass, setShowBackupPass] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [backupError, setBackupError] = useState(null);
  const [backupSuccess, setBackupSuccess] = useState(null);

  // Restore state (for new devices)
  const [restorePassphrase, setRestorePassphrase] = useState('');
  const [showRestorePass, setShowRestorePass] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [restoreSuccess, setRestoreSuccess] = useState(null);

  const loadIdentity = async () => {
    if (!user) return;
    setCryptoState((prev) => ({ ...prev, loading: true, error: null }));

    const result = await initializeCryptoIdentity(user.id);
    setCryptoState({
      loading: false,
      status: result.status,
      publicKeyPem: result.publicKeyPem || null,
      fingerprint: result.fingerprint || null,
      publicKey: result.publicKey || null,
      privateKey: result.privateKey || null,
      error: result.error || null,
    });

    // Check backup metadata
    loadBackupStatus();
  };

  const loadBackupStatus = async () => {
    if (!user) return;
    setBackupMeta((prev) => ({ ...prev, loading: true }));
    const result = await fetchKeyBackupMetadata(user.id);
    setBackupMeta({
      loading: false,
      hasBackup: result.hasBackup,
      data: result.data || null,
    });
  };

  useEffect(() => {
    loadIdentity();
  }, [user]);

  const handleCopyKey = () => {
    if (cryptoState.publicKeyPem) {
      navigator.clipboard.writeText(cryptoState.publicKeyPem);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleRunSelfTest = async () => {
    if (!cryptoState.publicKey || !cryptoState.privateKey) {
      setTestResult({
        success: false,
        error: 'Cannot run self-test: RSA key pair is not fully available on this device.',
      });
      return;
    }

    setTestingCrypto(true);
    setTestResult(null);

    const result = await runRSASelfTest(cryptoState.publicKey, cryptoState.privateKey);
    setTestingCrypto(false);
    setTestResult(result);
  };

  const handleCreateBackup = async (e) => {
    e.preventDefault();
    setBackupError(null);
    setBackupSuccess(null);

    if (!backupPassphrase || backupPassphrase.length < 8) {
      setBackupError('Recovery passphrase must be at least 8 characters long.');
      return;
    }

    if (backupPassphrase !== backupConfirmPassphrase) {
      setBackupError('Passphrases do not match.');
      return;
    }

    if (!cryptoState.privateKey) {
      setBackupError('Local private key is not accessible.');
      return;
    }

    setBackingUp(true);
    const result = await createEncryptedKeyBackup(user.id, cryptoState.privateKey, backupPassphrase);
    setBackingUp(false);

    if (result.success) {
      setBackupSuccess('Encrypted private key backup created successfully! You can now restore on other devices.');
      setBackupPassphrase('');
      setBackupConfirmPassphrase('');
      setShowBackupModal(false);
      loadBackupStatus();
      setTimeout(() => setBackupSuccess(null), 7000);
    } else {
      setBackupError(result.error || 'Failed to create encrypted backup.');
    }
  };

  const handleRestoreKey = async (e) => {
    e.preventDefault();
    setRestoreError(null);
    setRestoreSuccess(null);

    if (!restorePassphrase) {
      setRestoreError('Please enter your recovery passphrase.');
      return;
    }

    setRestoring(true);
    const result = await restorePrivateKeyFromBackup(user.id, restorePassphrase);
    setRestoring(false);

    if (result.success) {
      setRestoreSuccess('Private key successfully verified and restored to this device!');
      setRestorePassphrase('');
      // Reload cryptographic identity
      await loadIdentity();
    } else {
      setRestoreError(result.error);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const userEmail = user?.email || 'N/A';
  const joinedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'Active Session';

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Account & Cryptographic Identity"
        description="Manage your persistent RSA cryptographic identity, multi-device key backup, and local vault security."
        badge={<StatusBadge status="active" label="Supabase Auth Active" />}
        action={
          <Button variant="danger" size="sm" icon={LogOut} onClick={handleLogout}>
            Sign Out
          </Button>
        }
      />

      <div className="space-y-8">
        {/* User Identity Information */}
        <Card title="User Identity" subtitle="Account credentials authenticated by Supabase">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
                <User className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs text-slate-400">Full Name</div>
                <div className="text-sm font-semibold text-white truncate">{displayName}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
                <Mail className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs text-slate-400">Email Address</div>
                <div className="text-sm font-semibold text-white truncate">{userEmail}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400">Account Created</div>
                <div className="text-sm font-semibold text-white">{joinedDate}</div>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
              <div className="p-2.5 rounded-lg bg-slate-800 text-slate-300">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="truncate">
                <div className="text-xs text-slate-400">Supabase User UID</div>
                <div className="text-xs font-mono text-slate-300 truncate" title={user?.id}>
                  {user?.id ? `${user.id.substring(0, 16)}...` : 'Active Session'}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Multi-Device Recovery / Missing Key Alert */}
        {cryptoState.status === 'private_key_missing' && (
          <Card
            title="Private Key Recovery (New Device)"
            subtitle="Restore your RSA identity from an encrypted cloud backup"
          >
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-amber-200">
                    Private Key Missing on This Device:
                  </span>
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    Your public key is registered in Supabase, but your private key is isolated on your other device's IndexedDB. To decrypt files here, restore your key using your recovery passphrase.
                  </p>
                </div>
              </div>

              {backupMeta.hasBackup ? (
                <form onSubmit={handleRestoreKey} className="space-y-4 pt-2">
                  <Input
                    label="Recovery Passphrase"
                    name="restorePassphrase"
                    type={showRestorePass ? 'text' : 'password'}
                    placeholder="Enter the passphrase you used during backup"
                    required
                    icon={Key}
                    value={restorePassphrase}
                    onChange={(e) => {
                      setRestorePassphrase(e.target.value);
                      if (restoreError) setRestoreError(null);
                    }}
                    error={restoreError}
                    endAdornment={
                      <button
                        type="button"
                        onClick={() => setShowRestorePass(!showRestorePass)}
                        className="text-slate-400 hover:text-slate-200 p-1"
                        aria-label={showRestorePass ? 'Hide passphrase' : 'Show passphrase'}
                      >
                        {showRestorePass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  />

                  {restoreSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{restoreSuccess}</span>
                    </div>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    icon={DownloadCloud}
                    loading={restoring}
                    disabled={restoring}
                  >
                    {restoring ? 'Decrypting & Verifying Key...' : 'Restore Private Key'}
                  </Button>
                </form>
              ) : (
                <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="font-semibold text-white flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-emerald-400" />
                    <span>No Cloud Backup Found</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    You have not yet created an encrypted key backup for this account. To use this device, please log in on your original device (where your private key is active) and create a backup under <strong>Account & Cryptographic Identity</strong>.
                  </p>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Cryptographic Identity Card */}
        <Card
          title="Cryptographic Identity"
          subtitle="Your persistent RSA-OAEP 2048-bit key pair for asymmetric security"
          action={
            cryptoState.loading ? (
              <span className="inline-flex items-center space-x-1.5 text-xs text-slate-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                <span>Initializing Key Pair...</span>
              </span>
            ) : cryptoState.status === 'active' ? (
              <StatusBadge status="ready" label="🔐 RSA Key Pair Active" />
            ) : cryptoState.status === 'private_key_missing' ? (
              <StatusBadge status="error" label="⚠️ Private Key Missing" />
            ) : (
              <StatusBadge status="pending" label="Identity Pending" />
            )
          }
        >
          {/* Success / Error Alerts */}
          {backupSuccess && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{backupSuccess}</span>
            </div>
          )}

          {cryptoState.error && cryptoState.status !== 'private_key_missing' && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
              <span>{cryptoState.error}</span>
              <Button variant="outline" size="sm" onClick={loadIdentity}>
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-6">
            {/* Key Properties Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px] font-sans">Algorithm</div>
                <div className="text-white font-semibold mt-1">RSA-OAEP</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px] font-sans">Key Length &amp; Hash</div>
                <div className="text-white font-semibold mt-1">2048-bit (SHA-256)</div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px] font-sans">Public Key Fingerprint</div>
                <div
                  className="text-emerald-400 font-semibold mt-1 truncate"
                  title={cryptoState.fingerprint || 'Generating...'}
                >
                  {cryptoState.fingerprint || 'Initializing...'}
                </div>
              </div>
            </div>

            {/* Zero-Knowledge Encrypted Key Backup Section */}
            {cryptoState.status === 'active' && (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-white">
                        Multi-Device Encrypted Key Backup
                      </span>
                      {backupMeta.hasBackup ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Backup Available</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 font-mono">
                          <span>Not Backed Up</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Encrypts your RSA private key client-side with PBKDF2 (250,000 rounds) + AES-GCM-256 for secure recovery across devices.
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    icon={CloudUpload}
                    onClick={() => setShowBackupModal(!showBackupModal)}
                  >
                    {backupMeta.hasBackup ? 'Update Key Backup' : 'Create Key Backup'}
                  </Button>
                </div>

                {/* Backup Input Modal / Drawer */}
                {showBackupModal && (
                  <form
                    onSubmit={handleCreateBackup}
                    className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-3 pt-3 mt-2"
                  >
                    <div className="text-xs font-semibold text-slate-200">
                      Set Recovery Passphrase
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Choose a strong passphrase. If forgotten, your encrypted private key backup cannot be recovered.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        label="Passphrase (min 8 characters)"
                        name="backupPassphrase"
                        type={showBackupPass ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        required
                        icon={Lock}
                        value={backupPassphrase}
                        onChange={(e) => setBackupPassphrase(e.target.value)}
                      />

                      <Input
                        label="Confirm Passphrase"
                        name="backupConfirmPassphrase"
                        type={showBackupPass ? 'text' : 'password'}
                        placeholder="••••••••••••"
                        required
                        icon={Lock}
                        value={backupConfirmPassphrase}
                        onChange={(e) => setBackupConfirmPassphrase(e.target.value)}
                        endAdornment={
                          <button
                            type="button"
                            onClick={() => setShowBackupPass(!showBackupPass)}
                            className="text-slate-400 hover:text-slate-200 p-1"
                            aria-label={showBackupPass ? 'Hide passphrase' : 'Show passphrase'}
                          >
                            {showBackupPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        }
                      />
                    </div>

                    {backupError && (
                      <p className="text-xs text-rose-400">{backupError}</p>
                    )}

                    <div className="flex items-center space-x-2 pt-2">
                      <Button
                        type="submit"
                        size="sm"
                        icon={CloudUpload}
                        loading={backingUp}
                        disabled={backingUp}
                      >
                        {backingUp ? 'Encrypting & Uploading...' : 'Save Encrypted Backup'}
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowBackupModal(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Public Key Display */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-300 font-sans">
                  Registered RSA Public Key (PEM)
                </label>
                <span className="text-[11px] text-slate-400 font-sans">
                  Stored in <code className="font-mono text-emerald-400">user_public_keys</code>
                </span>
              </div>
              <div className="relative">
                <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-h-44">
                  {cryptoState.publicKeyPem || (
                    <span className="text-slate-400 italic">Loading registered public key...</span>
                  )}
                </pre>
                {cryptoState.publicKeyPem && (
                  <button
                    type="button"
                    onClick={handleCopyKey}
                    className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-850 hover:bg-slate-800 text-slate-300 transition-colors border border-slate-750 flex items-center space-x-1 text-[11px]"
                    title="Copy Public Key PEM"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-sans">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="font-sans">Copy</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Self-Test Verification Section */}
            <div className="pt-2 border-t border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white">
                    Web Crypto RSA Self-Test
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Encrypts a sample payload with your public key and decrypts it with your local private key.
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={testingCrypto ? Loader2 : Play}
                  loading={testingCrypto}
                  disabled={testingCrypto || cryptoState.status !== 'active'}
                  onClick={handleRunSelfTest}
                >
                  {testingCrypto ? 'Testing...' : 'Run RSA Self-Test'}
                </Button>
              </div>

              {/* Test Result Display */}
              {testResult && (
                <div
                  className={`mt-3 p-3.5 rounded-lg border text-xs flex items-start space-x-2.5 ${
                    testResult.success
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <span className="font-semibold text-white">
                      {testResult.success
                        ? '✓ RSA Web Crypto Test Passed'
                        : 'RSA Test Failed'}
                    </span>
                    <p className="text-[11px] leading-relaxed">
                      {testResult.success
                        ? `Successfully encrypted test payload "${testResult.testMessage}" with RSA-OAEP 2048-bit public key and decrypted back with private key.`
                        : testResult.error}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Security & Device Controls */}
        <Card title="Security & Device Controls">
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-medium text-white">Local IndexedDB Key Isolation</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Private keys are isolated in browser IndexedDB and never transmitted over the network in plaintext.
                </div>
              </div>
              <StatusBadge status="ready" label="Enforced" />
            </div>

            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-medium text-white">Public Key Registration</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Public keys are registered in Supabase for peer recipient lookup.
                </div>
              </div>
              <StatusBadge status="ready" label="Synced" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">Zero-Knowledge Cloud Backup</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Backups are wrapped in PBKDF2 (250,000 rounds) + AES-GCM-256 before storage.
                </div>
              </div>
              <StatusBadge
                status={backupMeta.hasBackup ? 'ready' : 'pending'}
                label={backupMeta.hasBackup ? 'Available' : 'Pending'}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
