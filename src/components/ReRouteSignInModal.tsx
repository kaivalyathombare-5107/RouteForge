import React, { useState } from 'react';
import { X, Crown, Sparkles, ShieldCheck, Check, ArrowRight, Lock } from 'lucide-react';

interface ReRouteSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ReRouteSignInModal: React.FC<ReRouteSignInModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [membershipId, setMembershipId] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => {
      onClose();
      setIsSubmitted(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-8 overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
            <Crown className="w-4 h-4" />
            <span>RE ROUTE PRIVÉ ACCESS</span>
          </div>
          <h2 className="font-serif-display font-medium text-2xl sm:text-3xl text-white">
            Clientele & VIP Membership
          </h2>
          <p className="text-xs font-sans-luxury text-slate-300 font-light">
            Access private jet charters, 24/7 dedicated AI concierge disruption recovery, and suite upgrades worldwide.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-8 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37] text-center space-y-3 animate-fadeIn">
            <div className="w-12 h-12 rounded-full bg-[#D4AF37] text-slate-950 flex items-center justify-center mx-auto shadow-lg">
              <Check className="w-6 h-6 stroke-[3]" />
            </div>
            <h3 className="font-serif-display font-medium text-xl text-[#FCE7AC]">
              Welcome Back, ReRoute Member
            </h3>
            <p className="text-xs text-slate-300 font-sans-luxury">
              Your credentials are authenticated. Disruption shield and 24/7 concierge are active.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-cinzel font-semibold tracking-widest text-[#D4AF37] block">
                EMAIL ADDRESS
              </label>
              <input
                type="email"
                required
                placeholder="client@luxury-domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-[#D4AF37] text-sm text-white outline-none font-sans-luxury transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-cinzel font-semibold tracking-widest text-[#D4AF37] block">
                MEMBERSHIP KEY / PASSPORT NUMBER
              </label>
              <input
                type="password"
                required
                placeholder="••••••••••••••••"
                value={membershipId}
                onChange={(e) => setMembershipId(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 focus:border-[#D4AF37] text-sm text-white outline-none font-mono transition-colors"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.25em] transition-all flex items-center justify-center space-x-2 shadow-lg shadow-[#D4AF37]/25 cursor-pointer"
              >
                <Lock className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>AUTHENTICATE & ENTER</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 font-mono">
              <span className="flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>256-bit Swiss Encrypted</span>
              </span>
              <a href="#apply" onClick={(e) => { e.preventDefault(); alert("VIP Membership application initiated. A ReRoute private concierge will contact your office."); }} className="text-[#D4AF37] hover:underline">
                Apply for ReRoute Black Tier
              </a>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
