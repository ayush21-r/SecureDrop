import React from 'react';
import { Link } from 'react-router-dom';
import {
  Send,
  Download,
  ShieldCheck,
  KeyRound,
  FileText,
  ArrowUpRight,
  PlusCircle,
  FileLock2,
  HardDrive,
  UserCheck,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

export default function DashboardPage() {
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'User';

  const metrics = [
    {
      title: 'Files Sent',
      value: '12',
      detail: 'Encrypted via AES-256',
      icon: Send,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
    },
    {
      title: 'Files Received',
      value: '8',
      detail: 'Verified via SHA-256',
      icon: Download,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      title: 'RSA Key Status',
      value: '4096-bit',
      detail: 'Active public key registered',
      icon: KeyRound,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10',
    },
    {
      title: 'Vault Storage',
      value: '24.8 MB',
      detail: 'Encrypted blob storage',
      icon: HardDrive,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
    },
  ];

  const recentFiles = [
    {
      id: 'f-1',
      name: 'financial_audit_q3.pdf',
      size: '2.4 MB',
      recipient: 'bob@securedrop.io',
      date: 'Today, 2:45 PM',
      status: 'encrypted',
      direction: 'sent',
    },
    {
      id: 'f-2',
      name: 'system_architecture_spec.docx',
      size: '5.1 MB',
      recipient: 'carol@securedrop.io',
      date: 'Yesterday, 11:20 AM',
      status: 'verified',
      direction: 'received',
    },
    {
      id: 'f-3',
      name: 'client_keys_backup.tar.gz',
      size: '14.2 MB',
      recipient: 'dev-team@securedrop.io',
      date: 'Aug 21, 2026',
      status: 'encrypted',
      direction: 'sent',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <PageHeader
        title={`Welcome back, ${displayName}`}
        description={`Logged in as ${user?.email || 'authenticated user'}. Monitor your encrypted transfers, cryptographic keys, and received files.`}
        badge={
          <StatusBadge
            status="active"
            label="Authenticated (Supabase Auth)"
          />
        }
        action={
          <Link to="/send">
            <Button icon={PlusCircle} size="md">
              Send Secure File
            </Button>
          </Link>
        }
      />

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metrics.map((m, idx) => {
          const Icon = m.icon;
          return (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-900/50 p-5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">{m.title}</span>
                <div className={`p-2 rounded-lg ${m.bg} ${m.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-white tracking-tight">{m.value}</div>
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
            subtitle="Encrypted file transfers and verifications"
            action={
              <Link
                to="/files"
                className="text-xs text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1"
              >
                <span>View All</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3 font-medium">File Name</th>
                    <th className="pb-3 font-medium">Size</th>
                    <th className="pb-3 font-medium">Peer / Target</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 font-mono text-slate-200 flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[160px] sm:max-w-xs">{file.name}</span>
                      </td>
                      <td className="py-3 text-slate-400 font-mono">{file.size}</td>
                      <td className="py-3 text-slate-300">{file.recipient}</td>
                      <td className="py-3 text-slate-400">{file.date}</td>
                      <td className="py-3">
                        <StatusBadge status={file.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Security & System Status (1 Col) */}
        <div className="space-y-6">
          <Card title="Security Status" subtitle="Hybrid Cryptography Architecture">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400">Authentication</span>
                <span className="font-mono text-emerald-400 flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Supabase JWT Auth</span>
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400">File Encryption</span>
                <span className="font-mono text-emerald-400 flex items-center space-x-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>AES-256-GCM</span>
                </span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-slate-400">Key Protection</span>
                <span className="font-mono text-purple-400 flex items-center space-x-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>RSA-OAEP 4096</span>
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Integrity Check</span>
                <span className="font-mono text-blue-400 flex items-center space-x-1">
                  <FileLock2 className="w-3.5 h-3.5" />
                  <span>SHA-256 Digest</span>
                </span>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
              Zero-knowledge key management active. Private keys never leave the client device.
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
