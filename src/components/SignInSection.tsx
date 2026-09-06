// src/components/SignInSection.tsx
import React, { useState } from 'react';
import { 
  Lock, 
  Crown, 
  ShieldCheck, 
  Sparkles, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  Compass, 
  ShieldAlert,
  Languages
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ReRouteSection } from './ReRouteNavigation';

interface SignInSectionProps {
  targetSection: ReRouteSection;
  onNavigateBack: () => void;
  onSignInSuccess?: () => void;
}

const SECTION_CONFIG: Record<string, { title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = {
  recovery: {
    title: 'Autonomous Multi-Modal Recovery Plans',
    subtitle: 'Real-time corridor rebooking algorithms, dynamic timing buffers, and royal comfort scores require authenticated travel credentials.',
    icon: Sparkles,
  },
  concierge: {
    title: 'Concierge Disruption Shield & Refund Engine',
    subtitle: 'Continuous PNR surveillance, statutory IRCTC TDR filing, and mandatory 100% DGCA refund claims require member authorization.',
    icon: ShieldCheck,
  },
  journeys: {
    title: 'Living Multi-Modal Transit Corridors',
    subtitle: 'Interactive 2D/3D spatial cartography, connection risk buffers, and personalized itineraries require authenticated member dossiers.',
    icon: Compass,
  },
  emergency: {
    title: 'Emergency Assistance & Global Directory',
    subtitle: 'Priority SOS dispatch, verified embassy helplines, and rapid consular intervention require an authenticated VIP travel profile.',
    icon: ShieldAlert,
  },
  translator: {
    title: 'Live Speech & Concierge Translator',
    subtitle: 'Low-latency bilingual audio translation and real-time transit vocabulary assistance require authenticated session tokens.',
    icon: Languages,
  },
  membership: {
    title: 'Bharat Privé Guild & VIP Membership Tier',
    subtitle: 'Access royal palace suite allocations, private chauffeur fleets, and bespoke domestic flight charters.',
    icon: Crown,
  },
  signin: {
    title: 'RouteForge Privé Member Portal',
    subtitle: 'Sign in to access your secure travel vault, multi-modal disruption shield, and statutory compensation engines.',
    icon: Lock,
  },
};

export const SignInSection: React.FC<SignInSectionProps> = ({
  targetSection,
  onNavigateBack,
  onSignInSuccess,
}) => {
  const { signIn, signInWithDemo, isFirebaseReady } = useAuth();
  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentConfig = SECTION_CONFIG[targetSection] || {
    title: 'Restricted Privé Division',
    subtitle: 'This division is reserved for authenticated RouteForge Privé travelers.',
    icon: Lock,
  };

  const IconComponent = currentConfig.icon;

  const handleGoogleSignIn = async () => {
    setError(null);
    setSigningIn(true);
    try {
      const res = await signIn();
      if (res && 'user' in res && res.user) {
        onSignInSuccess?.();
      }
    } catch (e: any) {
      console.error('[SignInSection] Google sign-in error:', e);
      const code = e?.code || '';
      if (code === 'auth/popup-blocked') {
        setError('Browser popup was blocked. Please enable popups or use Instant Privé VIP Access below.');
      } else if (code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please click below to try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setError('This app URL is not authorized in Firebase. Add localhost to Firebase Console → Authentication → Settings → Authorized domains, then reload this page.');
      } else {
        setError(e?.message || 'Google sign-in window could not be opened. You can use Instant Privé VIP Access below.');
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
      onSignInSuccess?.();
    } catch (e: any) {
      console.error('[SignInSection] Demo sign-in error:', e);
      setError(e?.message || 'Failed to initialize VIP session.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onNavigateBack();
        }
      }}
    >
      {/* Pop-up Window Container */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-8 overflow-hidden my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onNavigateBack}
          aria-label="Close sign in dialog"
          className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-all cursor-pointer shadow-md"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ambient Glow Elements */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Gate Header */}
        <div className="relative z-10 text-center space-y-2.5 mb-6 pr-6 sm:pr-0">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/40 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
            <Crown className="w-3.5 h-3.5" />
            <span>ROUTEFORGE PRIVÉ • MEMBER SIGN IN</span>
          </div>

          <div className="flex items-center justify-center pt-1">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37]/25 to-slate-900 border-2 border-[#D4AF37] flex items-center justify-center shadow-xl shadow-[#D4AF37]/20">
              <IconComponent className="w-7 h-7 text-[#FCE7AC]" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-serif-display font-bold text-white tracking-wide">
            Sign In to Access {currentConfig.title}
          </h2>

          <p className="text-xs font-sans-luxury text-slate-300 max-w-lg mx-auto font-light leading-relaxed">
            {currentConfig.subtitle}
          </p>
        </div>

        {/* Error Alert Display */}
        {error && (
          <div className="relative z-10 mb-5 p-3.5 rounded-2xl bg-red-950/60 border border-red-500/50 flex items-start space-x-3">
            <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5 text-xs font-sans-luxury">
              <p className="font-semibold text-red-200">Authentication Alert</p>
              <p className="text-red-300">{error}</p>
            </div>
          </div>
        )}

        {/* Authentication Action Container - Clean Single Action without Demo Button */}
        <div className="relative z-10 max-w-sm mx-auto space-y-3 mb-6">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full py-3.5 rounded-2xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs sm:text-sm font-bold tracking-[0.2em] transition-all flex items-center justify-center space-x-2.5 shadow-xl shadow-[#D4AF37]/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>{signingIn ? 'CONNECTING TO GOOGLE...' : 'SIGN IN WITH GOOGLE'}</span>
          </button>

          <p className="text-[10px] text-center text-slate-400 font-sans-luxury">
            Secure Google authentication grants instant access to your RouteForge travel vault.
          </p>
        </div>

        {/* Membership Privileges Shield Grid */}
        <div className="relative z-10 border-t border-gold-subtle/50 pt-5 mt-4">
          <div className="text-center mb-3">
            <span className="text-[9px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
              WHAT YOU UNLOCK UPON SIGNING IN
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#121520]/80 border border-gold-subtle/60 flex items-start space-x-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-white">Autonomous Disruption Reroutes</div>
                <p className="text-[10px] text-slate-400 font-sans-luxury leading-snug">
                  Instant recovery corridors pairing domestic flights, Vande Bharat, and express chauffeurs.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#121520]/80 border border-gold-subtle/60 flex items-start space-x-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-white">Statutory DGCA & IRCTC Claims</div>
                <p className="text-[10px] text-slate-400 font-sans-luxury leading-snug">
                  Automated IRCTC PRS Rule 73A TDR filing and DGCA Section 3 mandatory 100% airline refunds.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#121520]/80 border border-gold-subtle/60 flex items-start space-x-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-white">Living Multi-Modal Spatial Graph</div>
                <p className="text-[10px] text-slate-400 font-sans-luxury leading-snug">
                  Real-time dependency chain audit across all connecting legs with buffer safety gauges.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#121520]/80 border border-gold-subtle/60 flex items-start space-x-2.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="text-[11px] font-semibold text-white">24/7 Dedicated Travel Concierge</div>
                <p className="text-[10px] text-slate-400 font-sans-luxury leading-snug">
                  Personalized travel stewardship and dedicated multilingual ground support throughout your journey.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Security & Verification Footer */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] font-mono text-slate-400 pt-4 mt-4 border-t border-slate-800/80">
          <div className="flex items-center space-x-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>256-bit Swiss Banking Encryption • Zero Third-Party Reselling</span>
          </div>
          <div className="text-slate-500">
            RouteForge Privé ID Vault Protocol
          </div>
        </div>
      </div>
    </div>
  );
};
