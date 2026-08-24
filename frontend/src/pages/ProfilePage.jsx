import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  KeyRound,
  ShieldCheck,
  Calendar,
  Copy,
  LogOut,
  Fingerprint,
  Info,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const displayName =
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

  const dummyPublicKey = `-----BEGIN PUBLIC KEY-----
MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0J8h7Yq5z0rGZpQ8N
w8v+3V7s8d9k0fG2H1j4K...[RSA-4096 Public Key Placeholder]...
-----END PUBLIC KEY-----`;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Account & Security Profile"
        description="Manage your cryptographic credentials and identity within SecureDrop."
        badge={<StatusBadge status="active" label="Authenticated (Supabase Auth)" />}
        action={
          <Button variant="danger" size="sm" icon={LogOut} onClick={handleLogout}>
            Sign Out
          </Button>
        }
      />

      <div className="space-y-8">
        {/* User Identity Information */}
        <Card title="User Identity" subtitle="Account credentials managed by Supabase Auth">
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

        {/* Cryptographic Key Information Placeholder */}
        <Card
          title="RSA Public Key"
          subtitle="Peers use this public key to encrypt AES symmetric session keys for you"
          action={<StatusBadge status="verified" label="Key Registered" />}
        >
          <div className="mb-4 p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
            <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Phase 1 Architecture Placeholder: </span>
              In-browser Web Crypto key pair generation (RSA-OAEP 4096) will be implemented in Phase 3.
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Algorithm</div>
                <div className="text-white mt-1">RSA-OAEP</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Key Length</div>
                <div className="text-white mt-1">4096 bits</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-slate-400 text-[11px]">Fingerprint</div>
                <div className="text-emerald-400 mt-1 truncate" title="SHA256:7f9e8a3b2c1d0e4f...">
                  SHA256:7f9e8a...4f
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 font-sans">
                Public Key Block (PEM)
              </label>
              <div className="relative">
                <pre className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
                  {dummyPublicKey}
                </pre>
                <button
                  type="button"
                  onClick={() => alert("Public key copied to clipboard (demo mode)")}
                  className="absolute top-2.5 right-2.5 p-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                  title="Copy public key"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </Card>

        {/* Security Preferences */}
        <Card title="Security & Device Controls">
          <div className="space-y-4 text-xs text-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <div className="font-medium text-white">Local Key Storage</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Private keys are stored in encrypted IndexedDB client storage.
                </div>
              </div>
              <StatusBadge status="verified" label="Secure" />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-white">SHA-256 Hash Verification</div>
                <div className="text-slate-400 text-[11px] mt-0.5">
                  Automatically verify checksum before saving decrypted files.
                </div>
              </div>
              <StatusBadge status="verified" label="Enforced" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
