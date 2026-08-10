import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { syncUserProfile } from '../lib/cloudStore';
import { Mail, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';

interface SignupViewProps {
  onSwitchToLogin: () => void;
  onContinueAsGuest: () => void;
  onSuccess: () => void;
}

export const SignupView: React.FC<SignupViewProps> = ({
  onSwitchToLogin,
  onContinueAsGuest,
  onSuccess,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !confirmPassword) {
      setError('Please fill out all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = res.user;

      if (displayName.trim()) {
        await updateProfile(user, { displayName: displayName.trim() });
      }

      await syncUserProfile(user.uid, user.email || '', displayName.trim() || user.email?.split('@')[0]);
      onSuccess();
    } catch (err: any) {
      let msg = 'Failed to create account. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email address already exists.';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
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
            Create a personal account to sync your music library across all devices.
          </p>
        </div>

        {/* Form Error */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-center">
            {error}
          </div>
        )}

        {/* Signup Form */}
        <form onSubmit={handleSignup} className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block ml-1">Your Name</label>
            <div className="relative flex items-center">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Alex Morgan"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block ml-1">Email Address</label>
            <div className="relative flex items-center">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block ml-1">Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 block ml-1">Confirm Password</label>
            <div className="relative flex items-center">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm font-semibold text-slate-900 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-sm shadow-md shadow-amber-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Actions & Guest Mode */}
        <div className="space-y-3 pt-2 text-center border-t border-slate-100">
          <p className="text-xs font-medium text-slate-600">
            Already have an account?{' '}
            <button
              onClick={onSwitchToLogin}
              className="font-bold text-amber-700 hover:text-amber-800 underline ml-1 cursor-pointer"
            >
              Sign In
            </button>
          </p>

          <button
            onClick={onContinueAsGuest}
            className="w-full py-2 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
          >
            Continue as Guest
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
