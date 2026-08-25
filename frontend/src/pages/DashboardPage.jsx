import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Send,
  Download,
  ShieldCheck,
  KeyRound,
  FileText,
  ArrowUpRight,
  PlusCircle,
  HardDrive,
  UserCheck,
  Lock,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { fetchUserFiles } from '../services/fileService';
import { fetchPublicKeyFromSupabase } from '../services/cryptoService';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filesSentCount, setFilesSentCount] = useState(0);
  const [filesReceivedCount, setFilesReceivedCount] = useState(0);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [rsaKeyData, setRsaKeyData] = useState(null);
  const [recentTransfers, setRecentTransfers] = useState([]);

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const loadDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch user file records (both sent and received)
      const filesResult = await fetchUserFiles(user.id);

      // 2. Fetch RSA public key registration status
      const keyResult = await fetchPublicKeyFromSupabase(user.id);

      if (filesResult.success) {
        const received = filesResult.receivedFiles || [];
        const sent = filesResult.sentFiles || [];
        const allFiles = [...received, ...sent];

        // Deduplicate in case user sent file to themselves in test
        const uniqueFilesMap = new Map();
        allFiles.forEach((f) => uniqueFilesMap.set(f.id, f));
        const uniqueFiles = Array.from(uniqueFilesMap.values());

        // Sort by created_at descending
        uniqueFiles.sort(
          (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)
        );

        setFilesSentCount(sent.length);
        setFilesReceivedCount(received.length);

        // Calculate actual storage size
        const totalBytes = uniqueFiles.reduce(
          (sum, f) => sum + (Number(f.file_size) || 0),
          0
        );
        setTotalStorageBytes(totalBytes);
        setRecentTransfers(uniqueFiles.slice(0, 5));
      } else {
        console.warn('Could not fetch user files for dashboard:', filesResult.error);
        setError(filesResult.error || 'Failed to load user files.');
      }

      if (keyResult.success && keyResult.data) {
        setRsaKeyData(keyResult.data);
      } else {
        setRsaKeyData(null);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    if (kb >= 1) return `${kb.toFixed(2)} KB`;
    return `${bytes} B`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const metrics = [
    {
      title: 'Files Sent',
      value: loading ? '...' : filesSentCount.toString(),
      detail: 'Encrypted via AES-256-GCM',
      icon: Send,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Files Received',
      value: loading ? '...' : filesReceivedCount.toString(),
      detail: 'Decrypted client-side',
      icon: Download,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'RSA Key Status',
      value: loading
        ? '...'
        : rsaKeyData?.algorithm
        ? rsaKeyData.algorithm.replace('RSA-OAEP-', '') + '-bit'
        : '2048-bit',
      detail: rsaKeyData ? 'Active public key registered' : 'Key pending registration',
      icon: KeyRound,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Vault Storage',
      value: loading ? '...' : formatFileSize(totalStorageBytes),
      detail: 'Encrypted transfer volume',
      icon: HardDrive,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description={`Logged in as ${user?.email || 'authenticated user'}. Monitor your encrypted transfers, cryptographic keys, and received files.`}
        badge={<StatusBadge status="active" label="Supabase Auth Active" />}
        action={
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={loadDashboardData}
              disabled={loading}
              className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh dashboard metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <Link to="/send">
              <Button icon={PlusCircle} size="md">
                Send Secure File
              </Button>
            </Link>
          </div>
        }
      />

      {/* Error Alert if dashboard load fails */}
      {error && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Unable to load dashboard data: {error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadDashboardData}>
            Retry
          </Button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 flex flex-col justify-between shadow-sm transition-colors hover:border-slate-700/80"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{m.title}</span>
                <div className={`p-2 rounded-lg ${m.bg} ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
                  <span>{m.value}</span>
                  {loading && <Loader2 className="w-4 h-4 animate-spin text-slate-500" />}
                </div>
                <div className="text-xs text-slate-400 mt-1">{m.detail}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Files Table (2 Cols) */}
        <div className="lg:col-span-2">
          <Card
            title="Recent File Transfers"
            subtitle="Live encrypted file transfers associated with your account"
            action={
              <Link
                to="/files"
                className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1 font-medium transition-colors"
              >
                <span>View All Files</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            {loading ? (
              <div className="py-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Loading recent file transfers...</span>
              </div>
            ) : recentTransfers.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="pb-3 font-medium">File Name</th>
                      <th className="pb-3 font-medium">Size</th>
                      <th className="pb-3 font-medium">Peer</th>
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium text-right">Cipher</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {recentTransfers.map((file) => {
                      const isSender = file.sender_id === user?.id;
                      const peerLabel = isSender
                        ? `To: ${file.receiver_name || file.receiver_email || 'Recipient'}`
                        : `From: ${file.sender_name || file.sender_email || 'Sender'}`;

                      return (
                        <tr
                          key={file.id}
                          className="hover:bg-slate-900/40 transition-colors"
                        >
                          <td className="py-3 font-mono text-slate-200">
                            <div className="flex items-center space-x-2.5">
                              <div className="p-1.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                                <FileText className="w-3.5 h-3.5" />
                              </div>
                              <span
                                className="truncate max-w-[140px] sm:max-w-[200px] text-white font-medium"
                                title={file.original_filename}
                              >
                                {file.original_filename}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 text-slate-300 font-mono">
                            {formatFileSize(file.file_size)}
                          </td>
                          <td className="py-3 text-slate-300">
                            <div className="truncate max-w-[130px] sm:max-w-[170px]" title={peerLabel}>
                              {peerLabel}
                            </div>
                          </td>
                          <td className="py-3 text-slate-400 text-xs whitespace-nowrap">
                            {formatDate(file.created_at)}
                          </td>
                          <td className="py-3 text-right">
                            {file.is_encrypted ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-mono">
                                <Lock className="w-2.5 h-2.5" />
                                <span>AES-256</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 font-mono">
                                Legacy
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState
                icon={Inbox}
                title="No file transfers yet"
                description="When you send or receive encrypted files, your real transfer activity will appear here."
                actionLabel="Send Secure File"
                onAction={() => navigate('/send')}
              />
            )}
          </Card>
        </div>

        {/* Security & System Status (1 Col) */}
        <div className="space-y-6">
          <Card title="Security Architecture" subtitle="Verified Cryptographic Profile">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400">Authentication</span>
                <span className="font-mono text-emerald-400 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Supabase JWT</span>
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400">File Encryption</span>
                <span className="font-mono text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AES-GCM-256</span>
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400">Key Encapsulation</span>
                <span className="font-mono text-purple-400 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>RSA-OAEP-2048</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Storage Security</span>
                <span className="font-mono text-slate-300">Private Bucket RLS</span>
              </div>
            </div>

            <div className="mt-5 p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 leading-relaxed">
              Zero-knowledge client encryption active. Plaintext files and private keys are never transmitted to server storage.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
