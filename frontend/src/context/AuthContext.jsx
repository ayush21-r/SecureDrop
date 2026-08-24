import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext({
  user: null,
  session: null,
  loading: true,
  isConfigured: false,
  signUp: async () => {},
  signIn: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Check initial active session
    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching Supabase session:', error.message);
        } else {
          setSession(data?.session || null);
          setUser(data?.session?.user || null);
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for authentication state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const formatAuthError = (error) => {
    if (!error) return null;
    const msg = error.message || '';
    if (msg.includes('Invalid login credentials')) {
      return 'Invalid email address or password. Please try again.';
    }
    if (msg.includes('User already registered') || msg.includes('already registered')) {
      return 'An account with this email address already exists.';
    }
    if (msg.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (msg.includes('Email not confirmed')) {
      return 'Please verify your email address before logging in.';
    }
    if (msg.includes('rate limit') || msg.includes('over_email_send_rate_limit')) {
      return 'Too many requests. Please wait a moment and try again.';
    }
    return msg || 'An unexpected authentication error occurred.';
  };

  const signUp = async (email, password, metadata = {}) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error:
          'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      return {
        success: true,
        user: data.user,
        session: data.session,
        requiresEmailConfirmation: !data.session,
      };
    } catch (err) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const signIn = async (email, password) => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        error:
          'Supabase credentials are not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in frontend/.env.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      return { success: true, user: data.user, session: data.session };
    } catch (err) {
      return { success: false, error: err.message || 'Login failed.' };
    }
  };

  const signOut = async () => {
    if (!isSupabaseConfigured) {
      setUser(null);
      setSession(null);
      return { success: true };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error.message);
      }
      setUser(null);
      setSession(null);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    session,
    loading,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
