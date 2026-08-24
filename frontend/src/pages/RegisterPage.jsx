import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  User,
  Mail,
  Lock,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Settings,
} from 'lucide-react';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const { signUp, isConfigured } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [successInfo, setSuccessInfo] = useState(null);

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      errs.email = 'Email address is required.';
    } else if (!emailRegex.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (!formData.confirmPassword) {
      errs.confirmPassword = 'Confirmation password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: null });
    }
    if (authError) {
      setAuthError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    setSuccessInfo(null);

    if (!validate()) return;

    setSubmitting(true);
    const result = await signUp(formData.email, formData.password, {
      full_name: formData.fullName.trim(),
    });
    setSubmitting(false);

    if (!result.success) {
      setAuthError(result.error);
    } else if (result.requiresEmailConfirmation) {
      setSuccessInfo(
        'Account created successfully! Please check your email inbox to confirm your registration before logging in.'
      );
    } else {
      // Auto-authenticated by Supabase
      navigate('/dashboard');
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
            Create SecureDrop Account
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Register your cryptographic identity with Supabase Auth
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
              Please set <code className="font-mono text-amber-200">VITE_SUPABASE_URL</code> and{' '}
              <code className="font-mono text-amber-200">VITE_SUPABASE_ANON_KEY</code> in{' '}
              <code className="font-mono text-amber-200">frontend/.env</code> to enable live registration.
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

        {/* Success Confirmation */}
        {successInfo && (
          <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="font-medium text-white">{successInfo}</p>
              <Link
                to="/login"
                className="inline-flex items-center text-xs font-semibold text-emerald-400 underline hover:text-emerald-300"
              >
                Proceed to Login &rarr;
              </Link>
            </div>
          </div>
        )}

        {!successInfo && (
          <Card>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Full Name"
                name="fullName"
                placeholder="Alice Johnson"
                required
                icon={User}
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
              />

              <Input
                label="Email Address"
                name="email"
                type="email"
                placeholder="alice@example.com"
                required
                icon={Mail}
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
              />

              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Minimum 6 characters"
                required
                icon={Lock}
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
              />

              <Input
                label="Confirm Password"
                name="confirmPassword"
                type="password"
                placeholder="Repeat password"
                required
                icon={Lock}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
              />

              <div className="text-xs text-slate-400 pt-1">
                Account passwords are encrypted and managed securely by Supabase Auth.
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full"
                  icon={UserPlus}
                  loading={submitting}
                  disabled={submitting}
                >
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-emerald-400 hover:underline">
                Sign In
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
