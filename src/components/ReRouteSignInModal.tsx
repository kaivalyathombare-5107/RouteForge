// src/components/ReRouteSignInModal.tsx
import React, { useState } from 'react';
import { X, Crown, Lock, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ReRouteSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReRouteSignInModal: React.FC<ReRouteSignInModalProps> = ({ isOpen, onClose }) => {
  const { user, loading, signIn } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      const res = await signIn();
      if (res && 'user' in res && res.user) {
        onClose();
      }
    } catch (e: any) {
      console.error("[ReRouteSignInModal] Sign-in error:", e);
      const code = e?.code || '';
      if (code === 'auth/configuration-not-found' || code === 'auth/operation-not-allowed') {
        setError('Google Sign-In is not enabled yet in your Firebase Console. Please go to Firebase Console → Authentication → Sign-in method → Enable Google.');
      } else if (code === 'auth/popup-blocked') {
        setError('Browser popup was blocked. Please allow popups for localhost:3000 in your address bar.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled (Google sign-in popup was closed before completing).');
      } else if (code === 'auth/unauthorized-domain') {
        setError('This domain (localhost) is not authorized in Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (code === 'auth/invalid-api-key') {
        setError('Invalid Firebase API key in .env configuration.');
      } else {
        setError(e?.message || 'Sign-in window could not be opened. Check console for details.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (user) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-8 overflow-hidden">
          <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
            <X className="w-4 h-4" />
          </button>
          <div className="space-y-2 mb-6">
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Crown className="w-4 h-4" />
              <span>RE ROUTE PRIVÉ ACCESS</span>
            </div>
            <h2 className="font-serif-display font-medium text-2xl sm:text-3xl text-white">Welcome Back</h2>
            <p className="text-xs font-sans-luxury text-slate-300 font-light">You are signed in as {user.email}. Private features are now available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        <div className="space-y-2 mb-6">
          <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
            <Crown className="w-4 h-4" />
            <span>RE ROUTE PRIVÉ ACCESS</span>
          </div>
          <h2 className="font-serif-display font-medium text-2xl sm:text-3xl text-white">Clientele &amp; VIP Membership</h2>
          <p className="text-xs font-sans-luxury text-slate-300 font-light">Access private jet charters, 24/7 dedicated AI concierge disruption recovery, and suite upgrades worldwide.</p>
        </div>

        {/* Error / Alert Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 font-sans-luxury leading-relaxed">{error}</p>
          </div>
        )}

        <button
          onClick={handleGoogleSignIn}
          disabled={loading || signingIn}
          className="w-full py-3.5 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.25em] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#D4AF37]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{signingIn ? 'CONNECTING TO GOOGLE...' : 'SIGN IN WITH GOOGLE'}</span>
        </button>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 font-mono mt-4">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>256‑bit Swiss Encrypted</span>
          </span>
          <a href="#apply" onClick={(e) => { e.preventDefault(); alert('VIP Membership application initiated. A ReRoute private concierge will contact your office.'); }} className="text-[#D4AF37] hover:underline">Apply for ReRoute Black Tier</a>
        </div>
      </div>
    </div>
  );
};
