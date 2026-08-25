import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LayoutDashboard, Home } from 'lucide-react';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

export default function NotFoundPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 shadow-lg">
          <ShieldAlert className="w-12 h-12" />
        </div>

        <div>
          <div className="inline-block px-3 py-1 rounded-full text-xs font-mono font-semibold bg-slate-900 border border-slate-800 text-rose-400 mb-3">
            HTTP 404
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Page Not Found
          </h1>
          <p className="mt-2 text-sm text-slate-400 leading-relaxed">
            The secure route or resource you are trying to access does not exist or has been relocated.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {user ? (
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button icon={LayoutDashboard} size="md" className="w-full">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <Link to="/login" className="w-full sm:w-auto">
              <Button icon={LayoutDashboard} size="md" className="w-full">
                Sign In
              </Button>
            </Link>
          )}

          <Link to="/" className="w-full sm:w-auto">
            <Button variant="secondary" icon={Home} size="md" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
