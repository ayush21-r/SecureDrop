import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Mail,
  Lock,
  LogIn,
  AlertCircle,
  Settings,
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { signIn, isConfigured } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);

    if (!result.success) {
      setAuthError(result.error);
    } else {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Sign In to SecureDrop
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access your encrypted file vault & key store
          </p>
        </div>

        {/* Supabase Not Configured Warning */}
        {!isConfigured && (
          <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1.5">
            <div className="flex items-center space-x-2 font-semibold text-amber-200">
              <Settings className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Supabase Configuration Required</span>
            </div>
            <p>
              Please configure <code className="font-mono text-amber-200">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-amber-200">VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code className="font-mono text-amber-200">frontend/.env</code>.
            </p>
          </div>
        )}

        {/* Auth Error Banner */}
        {authError && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{authError}</span>
          </div>
        )}

        <Card>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="user@example.com"
              required
              icon={Mail}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: null });
                if (authError) setAuthError(null);
              }}
              error={errors.email}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••••••"
              required
              icon={Lock}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: null });
                if (authError) setAuthError(null);
              }}
              error={errors.password}
            />

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full"
                icon={LogIn}
                loading={submitting}
                disabled={submitting}
              >
                {submitting ? 'Authenticating...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-emerald-400 hover:underline">
              Create one now
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
