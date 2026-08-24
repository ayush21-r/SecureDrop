import React, { useState } from 'react';
import {
  FileText,
  Download,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Inbox,
  Clock,
  Eye,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

export default function FilesPage() {
  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent' | 'empty_demo'
  const [searchQuery, setSearchQuery] = useState('');

  const receivedFiles = [
    {
      id: 'rf-1',
      name: 'financial_audit_q3.pdf',
      size: '2.4 MB',
      sender: 'alice@securedrop.io',
      receivedAt: 'Today at 2:45 PM',
      encryption: 'AES-256-GCM',
      status: 'verified',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    },
    {
      id: 'rf-2',
      name: 'production_database_schema.sql',
      size: '1.1 MB',
      sender: 'dave@securedrop.io',
      receivedAt: 'Yesterday at 5:12 PM',
      encryption: 'AES-256-GCM',
      status: 'encrypted',
      sha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    },
    {
      id: 'rf-3',
      name: 'confidential_contract_v2.docx',
      size: '3.8 MB',
      sender: 'legal@securedrop.io',
      receivedAt: 'Aug 20, 2026',
      encryption: 'AES-256-GCM',
      status: 'verified',
      sha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    },
  ];

  const filteredFiles = receivedFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Encrypted Files Vault"
        description="View and decrypt files received from your peers or inspect transmitted payloads."
      />

      {/* Tabs & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Tab Buttons */}
        <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('received')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'received'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Received Files ({receivedFiles.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sent')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'sent'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sent Transfers
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('empty_demo')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'empty_demo'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Empty State Demo
          </button>
        </div>

        {/* Search */}
        {activeTab === 'received' && (
          <div className="w-full sm:w-72">
            <Input
              placeholder="Search by file or sender..."
              icon={Search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'received' && (
        <Card>
          {filteredFiles.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-800">
                    <th className="pb-3 font-medium">File Name</th>
                    <th className="pb-3 font-medium">Size</th>
                    <th className="pb-3 font-medium">Sender</th>
                    <th className="pb-3 font-medium">Received At</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-slate-800 text-emerald-400 shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-mono font-medium text-white truncate max-w-[180px] sm:max-w-xs">
                              {file.name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate max-w-[180px] sm:max-w-xs" title={file.sha256}>
                              SHA256: {file.sha256.substring(0, 16)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 text-slate-300 font-mono">{file.size}</td>
                      <td className="py-4 text-slate-300">{file.sender}</td>
                      <td className="py-4 text-slate-400">{file.receivedAt}</td>
                      <td className="py-4">
                        <StatusBadge status={file.status} />
                      </td>
                      <td className="py-4 text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          icon={Download}
                          onClick={() => alert("Decryption will be connected in Phase 4.")}
                        >
                          Decrypt & Download
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No matching files found"
              description="Try adjusting your search query or clear the filter."
              actionLabel="Clear Search"
              onAction={() => setSearchQuery('')}
            />
          )}
        </Card>
      )}

      {activeTab === 'sent' && (
        <Card>
          <div className="p-4 text-center text-slate-400 text-sm">
            Sent files log will list outgoing encrypted packages in Phase 3 & 4.
          </div>
        </Card>
      )}

      {activeTab === 'empty_demo' && (
        <Card>
          <EmptyState
            icon={Inbox}
            title="No secure files yet"
            description="Files you receive will appear here. When another user sends you an encrypted file, it will be listed in this vault."
            actionLabel="Send a File"
            onAction={() => window.location.href = '/send'}
          />
        </Card>
      )}
    </div>
  );
}
