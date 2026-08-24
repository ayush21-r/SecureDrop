import React, { useState } from 'react';
import {
  UploadCloud,
  File,
  UserCheck,
  Lock,
  KeyRound,
  FileCheck2,
  AlertCircle,
  X,
  Send,
  Info,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import StatusBadge from '../components/StatusBadge';

export default function SendFilePage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [recipient, setRecipient] = useState('');
  const [note, setNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleClearFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile || !recipient) return;
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Send Secure File"
        description="Select a recipient and upload a file to encrypt and transmit using hybrid cryptography."
      />

      <div className="mb-6 p-3.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start space-x-3 text-xs text-slate-300">
        <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-white">Phase 1 UI Preview: </span>
          File encryption (AES), key exchange (RSA), and Supabase Storage uploads will be connected in subsequent phases.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Form Column (2 Cols) */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Recipient Selection */}
            <Card title="1. Recipient Information" subtitle="Specify who will receive the decrypted file">
              <Input
                label="Recipient Email Address"
                placeholder="colleague@securedrop.io"
                type="email"
                required
                icon={UserCheck}
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                helperText="SecureDrop will query the recipient's RSA public key to wrap the AES file key."
              />
            </Card>

            {/* File Dropzone / Selection */}
            <Card title="2. File Selection" subtitle="Choose the document or binary payload to encrypt">
              {!selectedFile ? (
                <label className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer bg-slate-900/30 transition-colors group">
                  <div className="p-3 rounded-full bg-slate-800/80 group-hover:bg-emerald-500/10 text-slate-400 group-hover:text-emerald-400 mb-3 transition-colors">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <span className="text-sm font-medium text-slate-200">
                    Click to browse or drop file here
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    Any file type up to 100 MB (Encrypted client-side before upload)
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-3 truncate">
                    <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-mono font-medium text-white truncate">
                        {selectedFile.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB &bull; {selectedFile.type || 'Binary file'}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </Card>

            {/* Optional Note */}
            <Card title="3. Transfer Note (Optional)">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Message for Recipient
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Confidential files for Q3 review..."
                  className="w-full rounded-lg bg-slate-900/80 border border-slate-800 text-slate-100 text-sm placeholder:text-slate-500 p-3 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </Card>

            <div className="pt-2">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                icon={Send}
                disabled={!selectedFile || !recipient}
              >
                Encrypt & Send File
              </Button>
            </div>

            {submitted && (
              <div className="p-3 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-300 text-center">
                Send form submitted in UI preview mode. Live hybrid encryption pipeline will activate in Phase 4.
              </div>
            )}
          </form>
        </div>

        {/* Pipeline & Encryption Status Column (1 Col) */}
        <div className="space-y-6">
          <Card title="Encryption Pipeline" subtitle="Hybrid Cryptography Status">
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>AES-256 File Encryption</span>
                </div>
                <StatusBadge status="pending" label="Pending" />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                  <KeyRound className="w-4 h-4 text-purple-400" />
                  <span>RSA-4096 Key Protection</span>
                </div>
                <StatusBadge status="pending" label="Pending" />
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-2 text-slate-300">
                  <FileCheck2 className="w-4 h-4 text-blue-400" />
                  <span>SHA-256 Integrity Digest</span>
                </div>
                <StatusBadge status="pending" label="Pending" />
              </div>
            </div>

            <div className="mt-5 p-3 rounded-lg bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-400 font-mono space-y-1">
              <div>Cipher: AES-256-GCM</div>
              <div>Key Wrap: RSA-OAEP</div>
              <div>Hash: SHA-256 (256-bit)</div>
            </div>
          </Card>

          <Card title="Security Note">
            <p className="text-xs text-slate-400 leading-relaxed">
              Files are encrypted inside your browser before transmission. The backend server never receives the plaintext file or the unencrypted symmetric key.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
