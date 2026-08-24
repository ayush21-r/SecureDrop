import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Inbox,
  Send,
  Loader2,
  RefreshCw,
  X,
  FileDown,
  Lock,
  Unlock,
  ShieldCheck,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { fetchUserFiles, downloadAndDecryptFile } from '../services/fileService';

export default function FilesPage() {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('received'); // 'received' | 'sent'
  const [searchQuery, setSearchQuery] = useState('');
  const [receivedFiles, setReceivedFiles] = useState([]);
  const [sentFiles, setSentFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(null);

  const loadFiles = async () => {
    if (!user) return;
    setLoading(true);
    setFetchError(null);

    const result = await fetchUserFiles(user.id);
    setLoading(false);

    if (result.success) {
      setReceivedFiles(result.receivedFiles || []);
      setSentFiles(result.sentFiles || []);
    } else {
      setFetchError(result.error);
    }
  };

  useEffect(() => {
    loadFiles();
  }, [user]);

  const handleDownload = async (file) => {
    if (downloadingId) return; // Prevent simultaneous downloads

    setDownloadError(null);
    setDownloadSuccess(null);

    if (file.status === 'deleted') {
      setDownloadError(`Cannot download "${file.original_filename}": File is no longer available.`);
      return;
    }

    setDownloadingId(file.id);

    const result = await downloadAndDecryptFile({
      fileRecord: file,
      currentUserId: user.id,
    });

    setDownloadingId(null);

    if (result.success) {
      if (file.is_encrypted) {
        setDownloadSuccess(`File "${file.original_filename}" decrypted and downloaded successfully.`);
      } else {
        setDownloadSuccess(`File "${file.original_filename}" downloaded successfully.`);
      }
      setTimeout(() => setDownloadSuccess(null), 6000);
    } else {
      setDownloadError(result.error);
    }
  };

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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  // Search filtering
  const currentList = activeTab === 'received' ? receivedFiles : sentFiles;
  const filteredFiles = currentList.filter((f) => {
    const q = searchQuery.toLowerCase();
    const filenameMatch = (f.original_filename || '').toLowerCase().includes(q);
    const peerNameMatch = (
      activeTab === 'received'
        ? f.sender_name || f.sender_email || ''
        : f.receiver_name || f.receiver_email || ''
    )
      .toLowerCase()
      .includes(q);
    return filenameMatch || peerNameMatch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My Files"
        description="Access, client-side decrypt, and securely download files received from your peers."
        badge={<StatusBadge status="ready" label="Phase 3.3 — Decrypt & Download" />}
        action={
          <button
            type="button"
            onClick={loadFiles}
            disabled={loading}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-colors disabled:opacity-50"
            title="Refresh files vault"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Vault</span>
          </button>
        }
      />

      {/* Decrypt & Download Success Alert */}
      {downloadSuccess && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium text-white">{downloadSuccess}</span>
          </div>
          <button
            type="button"
            onClick={() => setDownloadSuccess(null)}
            className="text-emerald-400 hover:text-emerald-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Download / Decrypt Error Alert */}
      {downloadError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-3 shadow-md">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1 space-y-1">
            <span className="font-semibold text-rose-200">Decryption Failed: </span>
            <p className="text-rose-300 leading-relaxed">
              {downloadError}
              {downloadError.includes('private key could not be found') && (
                <a
                  href="/profile"
                  className="block mt-1.5 font-semibold text-emerald-400 hover:text-emerald-300 underline"
                >
                  Go to Profile to restore your private key from encrypted backup &rarr;
                </a>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDownloadError(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Fetch Error Banner */}
      {fetchError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center justify-between shadow-md">
          <div className="flex items-center space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Failed to load files: {fetchError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadFiles}>
            Retry
          </Button>
        </div>
      )}

      {/* Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        {/* Tab Buttons */}
        <div className="inline-flex p-1 rounded-lg bg-slate-900 border border-slate-800">
          <button
            type="button"
            onClick={() => {
              setActiveTab('received');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'received'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileDown className="w-3.5 h-3.5 text-emerald-400" />
            <span>Received Files</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 font-mono text-slate-300">
              {receivedFiles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('sent');
              setSearchQuery('');
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer ${
              activeTab === 'sent'
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5 text-purple-400" />
            <span>Sent Files</span>
            <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-slate-950 font-mono text-slate-300">
              {sentFiles.length}
            </span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="w-full sm:w-80">
          <Input
            placeholder={
              activeTab === 'received'
                ? 'Search by filename or sender...'
                : 'Search by filename or recipient...'
            }
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Main Files Table Card */}
      <Card>
        {loading ? (
          <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-400" />
            <span>Loading files from secure vault...</span>
          </div>
        ) : filteredFiles.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-medium">File Name</th>
                  <th className="pb-3 font-medium">
                    {activeTab === 'received' ? 'Sender' : 'Recipient'}
                  </th>
                  <th className="pb-3 font-medium">Size</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredFiles.map((file) => {
                  const isDownloading = downloadingId === file.id;
                  const isDeleted = file.status === 'deleted';
                  const isEncrypted = Boolean(file.is_encrypted);

                  const peerName =
                    activeTab === 'received'
                      ? file.sender_name || 'Registered Sender'
                      : file.receiver_name || 'Registered Recipient';

                  const peerEmail =
                    activeTab === 'received'
                      ? file.sender_email || ''
                      : file.receiver_email || '';

                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-900/40 transition-colors group"
                    >
                      {/* File Name & Content Type & Encryption status */}
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2.5 rounded-lg bg-slate-800 text-emerald-400 shrink-0 border border-slate-700/60">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate max-w-[180px] sm:max-w-xs">
                            <div
                              className="font-mono font-medium text-white truncate"
                              title={file.original_filename}
                            >
                              {file.original_filename}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5 truncate">
                              <span>{file.content_type || 'application/octet-stream'}</span>
                              {isEncrypted ? (
                                <span className="inline-flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-mono">
                                  <Lock className="w-2.5 h-2.5" />
                                  <span>AES-GCM-256</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                                  Legacy (Unencrypted)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Peer (Sender or Receiver) */}
                      <td className="py-4">
                        <div className="text-slate-200 font-medium">
                          {peerName}
                        </div>
                        {peerEmail && (
                          <div className="text-[11px] text-slate-400 truncate max-w-[160px]">
                            {peerEmail}
                          </div>
                        )}
                      </td>

                      {/* File Size */}
                      <td className="py-4 text-slate-300 font-mono">
                        {formatFileSize(file.file_size)}
                      </td>

                      {/* Date */}
                      <td className="py-4 text-slate-400 text-xs">
                        {formatDate(file.created_at)}
                      </td>

                      {/* Status Badge */}
                      <td className="py-4">
                        <StatusBadge
                          status={
                            file.status === 'available'
                              ? 'ready'
                              : file.status === 'deleted'
                              ? 'error'
                              : 'pending'
                          }
                          label={
                            file.status === 'available'
                              ? 'Available'
                              : file.status === 'deleted'
                              ? 'Deleted'
                              : file.status || 'Pending'
                          }
                        />
                      </td>

                      {/* Action Button: Decrypt & Download or Download */}
                      <td className="py-4 text-right">
                        <Button
                          variant={
                            activeTab === 'received'
                              ? isEncrypted
                                ? 'primary'
                                : 'primary'
                              : 'secondary'
                          }
                          size="sm"
                          icon={
                            isDownloading
                              ? Loader2
                              : isEncrypted
                              ? Unlock
                              : Download
                          }
                          loading={isDownloading}
                          disabled={isDownloading || isDeleted}
                          onClick={() => handleDownload(file)}
                          title={
                            isDeleted
                              ? 'File is no longer available.'
                              : isEncrypted
                              ? `Decrypt and download ${file.original_filename}`
                              : `Download ${file.original_filename}`
                          }
                        >
                          {isDownloading
                            ? isEncrypted
                              ? 'Decrypting...'
                              : 'Downloading...'
                            : isDeleted
                            ? 'Unavailable'
                            : isEncrypted
                            ? 'Decrypt & Download'
                            : 'Download'}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={activeTab === 'received' ? Inbox : Send}
            title={
              searchQuery
                ? 'No matching files found'
                : activeTab === 'received'
                ? 'No received files yet'
                : 'No sent files yet'
            }
            description={
              searchQuery
                ? 'Try adjusting your search query or clear the filter.'
                : activeTab === 'received'
                ? 'Encrypted files sent to you by other registered users will appear here for client-side decryption.'
                : 'You have not sent any files yet. Use the Send File page to transfer encrypted files to other users.'
            }
            actionLabel={
              searchQuery
                ? 'Clear Search'
                : activeTab === 'received'
                ? null
                : 'Send a File'
            }
            onAction={
              searchQuery
                ? () => setSearchQuery('')
                : activeTab === 'received'
                ? null
                : () => (window.location.href = '/send')
            }
          />
        )}
      </Card>
    </div>
  );
}
