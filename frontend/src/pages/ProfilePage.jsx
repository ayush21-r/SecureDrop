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
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import {
  initializeCryptoIdentity,
  runRSASelfTest,
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
        description="Manage your persistent RSA cryptographic identity, credentials, and local vault security."
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
          {/* Missing Private Key Alert */}
          {cryptoState.status === 'private_key_missing' && (
            <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold text-amber-200">
                  Private Key Not Found on This Browser:
                </span>
                <p className="text-[11px] text-amber-300 leading-relaxed">
                  Your public key is registered in Supabase, but your private key is not in this device's IndexedDB. Generating a new key is disabled to prevent previous files from becoming undecryptable.
                </p>
              </div>
            </div>
          )}

          {/* Cryptography Initialization Error Alert */}
          {cryptoState.error && cryptoState.status !== 'private_key_missing' && (
            <div className="mb-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between">
              <span>{cryptoState.error}</span>
              <Button variant="outline" size="sm" onClick={loadIdentity}>
                Retry
              </Button>
            </div>
          )}

          <div className="space-y-4">
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
                  Private keys are isolated in browser IndexedDB and never transmitted over the network.
                </div>
              </div>
              <StatusBadge status="ready" label="Enforced" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">Public Key Registration</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Public keys are registered in Supabase for peer recipient lookup.
                </div>
              </div>
              <StatusBadge status="ready" label="Synced" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
