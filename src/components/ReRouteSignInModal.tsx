// src/components/ReRouteSignInModal.tsx
import React, { useState } from 'react';
import { X, Crown, Lock, ShieldCheck, AlertTriangle, LogOut, CheckCircle2, Mail, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ReRouteSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReRouteSignInModal: React.FC<ReRouteSignInModalProps> = ({ isOpen, onClose }) => {
  const { user, loading, signIn, signInWithDemo, signOut, isFirebaseReady } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

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
        setError('This domain is not authorized in Firebase Console → Authentication → Settings → Authorized domains.');
      } else if (code === 'auth/invalid-api-key') {
        setError('Firebase API key is unconfigured or invalid in .env. Click "Instant VIP Demo Access" below to continue.');
      } else {
        setError(e?.message || 'Sign-in window could not be opened. Click "Instant VIP Demo Access" below to proceed.');
      }
    } finally {
      setSigningIn(false);
    }
  };

  const handleDemoSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      await signInWithDemo();
      onClose();
    } catch (e: any) {
      console.error("[ReRouteSignInModal] Demo sign-in error:", e);
      setError(e?.message || 'Failed to initialize demo session.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    setError(null);
    setSigningOut(true);
    try {
      await signOut();
      onClose();
    } catch (e: any) {
      console.error("[ReRouteSignInModal] Sign-out error:", e);
      setError(e?.message || 'Failed to sign out.');
    } finally {
      setSigningOut(false);
    }
  };

  // Account Details View when User is Signed In
  if (user) {
    const memberId = user.uid ? `RF-${user.uid.slice(0, 8).toUpperCase()}` : 'RF-PRIVÉ-001';
    const memberName = user.displayName || user.email?.split('@')[0] || 'Distinguished Member';
    const initials = memberName.slice(0, 2).toUpperCase();

    return (
      <div 
        className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-xl rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-8 overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="space-y-2 mb-6">
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Crown className="w-4 h-4" />
              <span>ROUTEFORGE PRIVÉ ACCOUNT</span>
            </div>
            <h2 className="font-serif-display font-medium text-2xl sm:text-3xl text-white">
              Account Details
            </h2>
            <p className="text-xs font-sans-luxury text-slate-300 font-light">
              Authenticated VIP Travel Profile &amp; Intelligent Disruption Shield
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-200 font-sans-luxury leading-relaxed">{error}</p>
            </div>
          )}

          {/* Member Profile Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-[#161922] to-[#0D0F16] border border-gold-subtle space-y-4 mb-6">
            <div className="flex items-center space-x-4">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={memberName}
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/20"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-[#D4AF37]/15 border-2 border-[#D4AF37] flex items-center justify-center text-[#FCE7AC] font-cinzel text-lg font-bold shadow-lg shadow-[#D4AF37]/20">
                  {initials}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif-display font-semibold text-lg text-white truncate">
                    {memberName}
                  </h3>
                  <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-[10px] font-cinzel font-semibold text-emerald-400 tracking-wider">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>VERIFIED</span>
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 truncate flex items-center space-x-1 mt-0.5">
                  <Mail className="w-3 h-3 text-slate-500 inline mr-1" />
                  {user.email}
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[#D4AF37]">
                    KEY: {memberId}
                  </span>
                  <span className="text-[9px] font-cinzel font-bold tracking-widest px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#FCE7AC] border border-[#D4AF37]/30">
                    BLACK PRIVÉ TIER
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Protection & Privileges Grid */}
          <div className="space-y-2 mb-6">
            <span className="text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
              Active Privileges &amp; Shield
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-200 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Disruption Shield</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans-luxury">
                  Real-time IRCTC &amp; DGCA statutory claims auto-monitored.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-200 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>24/7 Travel Concierge</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans-luxury">
                  Priority recovery with alternative flights, trains, &amp; transfers.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-200 font-medium">
                  <Crown className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>3D Spatial Corridors</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans-luxury">
                  Unrestricted access to Google Earth 3D trajectory visualization.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs text-slate-200 font-medium">
                  <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                  <span>VIP Lounge &amp; Stays</span>
                </div>
                <p className="text-[11px] text-slate-400 font-sans-luxury">
                  Preferred check-in at partnered heritage palaces &amp; luxury suites.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full py-3 rounded-xl border border-red-500/30 hover:bg-red-950/40 text-red-300 hover:text-red-200 font-cinzel text-xs font-semibold tracking-wider transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>{signingOut ? 'SIGNING OUT...' : 'SIGN OUT OF ACCOUNT'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.25em] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#D4AF37]/25 cursor-pointer"
            >
              <span>RETURN TO ROUTEFORGE</span>
            </button>
          </div>

          <div className="flex items-center justify-center space-x-1.5 text-[10px] text-slate-400 pt-4 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Authenticated via Google • 256-bit Swiss Encrypted Vault</span>
          </div>
        </div>
      </div>
    );
  }

  // Sign-In View when User is Not Signed In
  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-8 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <button onClick={onClose} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        <div className="space-y-2 mb-6">
          <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
            <Crown className="w-4 h-4" />
            <span>ROUTEFORGE PRIVÉ ACCESS</span>
          </div>
          <h2 className="font-serif-display font-medium text-2xl sm:text-3xl text-white">Clientele &amp; VIP Membership</h2>
          <p className="text-xs font-sans-luxury text-slate-300 font-light">Access private jet charters, 24/7 dedicated concierge disruption recovery, and suite upgrades worldwide.</p>
        </div>

        {/* Error / Alert Message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 flex items-start space-x-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-200 font-sans-luxury leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleGoogleSignIn}
            disabled={loading || signingIn}
            className="w-full py-3.5 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.25em] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#D4AF37]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{signingIn ? 'CONNECTING TO GOOGLE...' : 'SIGN IN WITH GOOGLE'}</span>
          </button>

          <button
            type="button"
            onClick={handleDemoSignIn}
            disabled={loading || signingIn}
            className="w-full py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800/80 border border-gold-subtle/50 text-[#D4AF37] font-cinzel text-[11px] font-semibold tracking-[0.2em] transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Crown className="w-3 h-3" />
            <span>INSTANT PRIVÉ VIP ACCESS (KAIVALYA THOMBARE)</span>
          </button>
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 font-mono mt-4">
          <span className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>256‑bit Swiss Encrypted</span>
          </span>
          <a href="#apply" onClick={(e) => { e.preventDefault(); alert('VIP Membership application initiated. A RouteForge private concierge will contact your office.'); }} className="text-[#D4AF37] hover:underline">Apply for RouteForge Black Tier</a>
        </div>
      </div>
    </div>
  );
};

