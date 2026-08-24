import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  File,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  Loader2,
  Users,
  HardDrive,
  Shield,
  RefreshCw,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';
import { fetchReceivers, uploadAndSendFile, MAX_FILE_SIZE_BYTES } from '../services/fileService';

export default function SendFilePage() {
  const { user } = useAuth();

  const [receivers, setReceivers] = useState([]);
  const [loadingReceivers, setLoadingReceivers] = useState(true);
  const [selectedReceiverId, setSelectedReceiverId] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const loadReceivers = async () => {
    if (!user) return;
    setLoadingReceivers(true);
    setErrorMessage(null);
    const result = await fetchReceivers(user.id);
    setLoadingReceivers(false);

    if (result.success) {
      setReceivers(result.data || []);
    } else {
      setErrorMessage(result.error);
    }
  };

  useEffect(() => {
    loadReceivers();
  }, [user]);

  const handleFileChange = (e) => {
    setErrorMessage(null);
    setSuccessData(null);

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size === 0) {
        setErrorMessage('Empty files (0 bytes) cannot be uploaded.');
        setSelectedFile(null);
        return;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setErrorMessage(
          `File size exceeds 50 MB limit (${(file.size / (1024 * 1024)).toFixed(2)} MB).`
        );
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setErrorMessage(null);
  };

  const handleResetForm = () => {
    setSelectedFile(null);
    setSelectedReceiverId('');
    setSuccessData(null);
    setErrorMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (uploading) return; // Prevent duplicate uploads

    setErrorMessage(null);
    setSuccessData(null);

    if (!selectedFile) {
      setErrorMessage('Please select a file to send.');
      return;
    }

    if (!selectedReceiverId) {
      setErrorMessage('Please select a recipient from the list.');
      return;
    }

    setUploading(true);

    const result = await uploadAndSendFile({
      file: selectedFile,
      senderId: user.id,
      receiverId: selectedReceiverId,
    });

    setUploading(false);

    if (result.success) {
      const recipientProfile = receivers.find((r) => r.id === selectedReceiverId);
      setSuccessData({
        fileRecord: result.data,
        originalFilename: selectedFile.name,
        fileSize: selectedFile.size,
        recipientName: recipientProfile?.name || recipientProfile?.full_name || 'Recipient',
        recipientEmail: recipientProfile?.email || '',
      });
      // Clear inputs
      setSelectedFile(null);
      setSelectedReceiverId('');
    } else {
      setErrorMessage(result.error);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  const selectedReceiverObj = receivers.find((r) => r.id === selectedReceiverId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Send File"
        description="Select a registered recipient and upload a file to the secure storage vault."
        badge={<StatusBadge status="active" label="Phase 2.2 — Storage & Metadata" />}
      />

      {/* Success Banner */}
      {successData && (
        <div className="mb-6 p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 shadow-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-semibold text-white">
                  File Uploaded and Sent Successfully!
                </h3>
                <p className="text-xs text-emerald-300 mt-1">
                  Your file has been safely uploaded to the <code className="font-mono text-emerald-200">secure-files</code> storage bucket and registered in the database.
                </p>

                <div className="mt-4 p-3 rounded-lg bg-slate-950/60 border border-emerald-500/20 text-xs font-mono space-y-1 text-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400">File:</span>
                    <span className="text-white font-medium">{successData.originalFilename}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Size:</span>
                    <span>{formatFileSize(successData.fileSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Recipient:</span>
                    <span className="text-emerald-400">
                      {successData.recipientName} ({successData.recipientEmail})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="text-emerald-400 uppercase font-semibold">
                      {successData.fileRecord?.status || 'available'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Storage Path:</span>
                    <span className="truncate max-w-[260px] text-slate-300" title={successData.fileRecord?.storage_path}>
                      {successData.fileRecord?.storage_path}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleResetForm}
              className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium cursor-pointer"
            >
              Send Another
            </button>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold text-rose-200">Upload Failed: </span>
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-rose-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Form Column (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. Recipient Selection */}
            <Card
              title="1. Select Recipient"
              subtitle="Choose a registered user from the profiles database"
              action={
                <button
                  type="button"
                  onClick={loadReceivers}
                  disabled={loadingReceivers}
                  className="inline-flex items-center space-x-1 text-xs text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
                  title="Reload users list"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingReceivers ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              }
            >
              {loadingReceivers ? (
                <div className="flex items-center space-x-2 text-xs text-slate-400 py-3">
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  <span>Loading registered users from profiles table...</span>
                </div>
              ) : receivers.length === 0 ? (
                <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    No other registered users found in the system yet. Register a second test user account to send files to.
                  </span>
                </div>
              ) : (
                <div className="space-y-2">
                  <label htmlFor="receiver-select" className="block text-xs font-medium text-slate-300">
                    Recipient User <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      id="receiver-select"
                      value={selectedReceiverId}
                      onChange={(e) => {
                        setSelectedReceiverId(e.target.value);
                        setErrorMessage(null);
                      }}
                      required
                      disabled={uploading}
                      className="w-full rounded-lg bg-slate-900/90 border border-slate-800 text-slate-100 text-sm px-3.5 py-2.5 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 cursor-pointer disabled:opacity-50"
                    >
                      <option value="">-- Choose a recipient --</option>
                      {receivers.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name || r.full_name || 'User'} ({r.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedReceiverObj && (
                    <div className="mt-2 p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between text-slate-300">
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                        <span className="font-medium text-white">{selectedReceiverObj.name || selectedReceiverObj.full_name || 'User'}</span>
                        <span className="text-slate-400">({selectedReceiverObj.email})</span>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        Selected
                      </span>
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* 2. File Selection */}
            <Card title="2. Select File" subtitle="Choose a document or binary file to transmit (Max 50 MB)">
              {!selectedFile ? (
                <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-900/30 transition-colors group">
                  <div className="p-3 rounded-full bg-slate-800/80 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 mb-3 transition-colors">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    Click to browse or drop file here
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Up to 50 MB &bull; Stored under your private UUID prefix
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={uploading}
                  />
                </label>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-mono font-medium text-white truncate" title={selectedFile.name}>
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5">
                        {formatFileSize(selectedFile.size)} &bull; {selectedFile.type || 'application/octet-stream'}
                      </div>
                    </div>
                  </div>

                  {!uploading && (
                    <button
                      type="button"
                      onClick={handleClearFile}
                      className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors rounded-lg hover:bg-slate-800"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </Card>

            {/* 3. Send Action */}
            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                icon={uploading ? Loader2 : Send}
                loading={uploading}
                disabled={!selectedFile || !selectedReceiverId || uploading}
              >
                {uploading ? 'Uploading to Secure Storage...' : 'Send File'}
              </Button>
            </div>
          </form>
        </div>

        {/* Storage & Architecture Details Column (1 Col) */}
        <div className="space-y-6">
          <Card title="Upload Pipeline" subtitle="Supabase Storage & Metadata">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                  <HardDrive className="w-4 h-4 text-emerald-400" />
                  <span>Bucket</span>
                </div>
                <span className="font-mono text-emerald-400">secure-files</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span>Access Control</span>
                </div>
                <span className="font-mono text-slate-300">Sender / Receiver RLS</span>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                  <UserCheck className="w-4 h-4 text-purple-400" />
                  <span>Authenticated Sender</span>
                </div>
                <span className="font-mono text-slate-300 truncate max-w-[110px]" title={user?.id}>
                  {user?.id ? `${user.id.substring(0, 8)}...` : 'Active'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">File Status</span>
                <StatusBadge status="ready" label="Available" />
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5 leading-relaxed">
              <div className="font-medium text-slate-300">Security & Isolation:</div>
              <div>&bull; Stored path: <code className="font-mono text-emerald-400">&lt;sender_id&gt;/&lt;file&gt;</code></div>
              <div>&bull; Automatic orphan rollback on database error</div>
              <div>&bull; RLS strictly enforces sender &amp; receiver isolation</div>
            </div>
          </Card>

          <Card title="Future Phase Note">
            <p className="text-xs text-slate-400 leading-relaxed">
              In subsequent phases, client-side AES symmetric file encryption and RSA key encapsulation will be layered directly over this upload pipeline before files touch the storage bucket.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
