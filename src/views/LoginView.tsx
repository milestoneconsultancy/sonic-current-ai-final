import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { Sparkles, Music, Lock, Mail, ArrowRight, UserCheck, ShieldCheck } from 'lucide-react';

interface LoginViewProps {
  onSwitchToSignup: () => void;
  onContinueAsGuest: () => void;
  onSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onSwitchToSignup,
  onContinueAsGuest,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      onSuccess();
    } catch (err: any) {
      let msg = 'Failed to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please try again.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-10 px-4 sm:px-6">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-8 shadow-xl space-y-6">
        {/* Brand & Header */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 font-black text-2xl">
            ⚡
          </div>
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-950 tracking-tight">FREE MUSIC</h1>
            <p className="text-[11px] font-extrabold text-amber-700 tracking-wider uppercase">
              SURAJ KHANDAGALE
            </p>
          </div>
          <p className="text-xs font-medium text-slate-500 pt-1">
            Sign in to sync your favorites, playlists & listening history across devices.
          </p>
        </div>

        {/* Form Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block ml-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block ml-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-sm shadow-md shadow-slate-950/10 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Actions & Guest Mode */}
        <div className="space-y-3 pt-2 text-center border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToSignup}
              className="font-bold text-amber-700 hover:text-amber-800 underline ml-1 cursor-pointer"
            >
              Create Account
            </button>
          </p>

          <button
            onClick={onContinueAsGuest}
            className="w-full py-2.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-500" />
            Continue as Guest (No Account Required)
          </button>
        </div>

        {/* Footer Attribution */}
        <div className="text-center pt-2">
          <p className="text-[10px] font-bold text-slate-400">
            Designed & Developed by <span className="text-slate-600 font-black">Suraj Khandagle</span>
          </p>
        </div>
      </div>
    </div>
  );
};
