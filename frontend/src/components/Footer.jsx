import React from 'react';
import { Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 bg-emerald-500/10 rounded border border-emerald-500/20 text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold text-slate-200 tracking-tight">
              SecureDrop
            </span>
            <span className="text-xs text-slate-500">
              &mdash; Hybrid Cryptography Platform
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-slate-400">
            <Link to="/" className="hover:text-slate-200 transition-colors">
              Home
            </Link>
            <Link to="/dashboard" className="hover:text-slate-200 transition-colors">
              Dashboard
            </Link>
            <Link to="/send" className="hover:text-slate-200 transition-colors">
              Send File
            </Link>
            <Link to="/files" className="hover:text-slate-200 transition-colors">
              My Files
            </Link>
            <Link to="/profile" className="hover:text-slate-200 transition-colors">
              Profile
            </Link>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>SecureDrop &copy; {new Date().getFullYear()} &mdash; Phase 1 Foundation.</p>
          <p className="font-mono text-[11px] text-slate-400">
            Engineered for AES-256 + RSA + SHA-256
          </p>
        </div>
      </div>
    </footer>
  );
}
