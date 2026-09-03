import React from 'react';
import { Search, User, Compass } from 'lucide-react';

export type ReRouteSection = 'destinations' | 'journeys' | 'experiences' | 'concierge' | 'membership';

interface ReRouteNavigationProps {
  activeSection: ReRouteSection;
  onSelectSection: (section: ReRouteSection) => void;
  onOpenSignIn: () => void;
  onOpenSearch: () => void;
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
}

export const ReRouteNavigation: React.FC<ReRouteNavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenSignIn,
  onOpenSearch,
  selectedCurrency,
  onSelectCurrency
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#06070A]/80 backdrop-blur-xl border-b border-gold-subtle/30 z-50 px-4 sm:px-8 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectSection('destinations')}>
        <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
          <Compass className="w-5 h-5 text-slate-950" />
        </div>
        <div className="flex flex-col">
          <span className="font-serif-display text-lg tracking-[0.2em] text-white">
            RE ROUTE
          </span>
          <span className="text-[9px] font-cinzel tracking-widest text-[#D4AF37] uppercase">
            Bharat Privé Edition
          </span>
        </div>
      </div>

      {/* Navigation Links (Desktop) */}
      <nav className="hidden lg:flex items-center space-x-1 border border-slate-800 bg-slate-950/50 p-1 rounded-full">
        <button
          onClick={() => onSelectSection('destinations')}
          className={`px-5 py-2 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all ${
            activeSection === 'destinations'
              ? 'bg-[#D4AF37]/10 text-[#D4AF37] shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Destinations
        </button>
        <button
          onClick={() => onSelectSection('journeys')}
          className={`px-5 py-2 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all ${
            activeSection === 'journeys'
              ? 'bg-[#D4AF37]/10 text-[#D4AF37] shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Journeys
        </button>
        <button
          onClick={() => onSelectSection('experiences')}
          className={`px-5 py-2 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all ${
            activeSection === 'experiences'
              ? 'bg-[#D4AF37]/10 text-[#D4AF37] shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Experiences
        </button>
        <button
          onClick={() => onSelectSection('concierge')}
          className={`px-5 py-2 rounded-full text-xs font-cinzel font-semibold tracking-wider transition-all ${
            activeSection === 'concierge'
              ? 'bg-[#D4AF37]/10 text-[#D4AF37] shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Concierge
        </button>
      </nav>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        {/* Currency Selector */}
        <select
          value={selectedCurrency}
          onChange={(e) => onSelectCurrency(e.target.value)}
          className="hidden sm:block bg-transparent text-slate-300 text-xs font-mono font-medium outline-none cursor-pointer border border-transparent hover:border-slate-800 rounded px-2 py-1 transition-all"
        >
          <option value="INR">INR ₹ (India)</option>
          <option value="USD">USD $ (Global)</option>
          <option value="AED">AED د.إ (UAE)</option>
          <option value="EUR">EUR € (Europe)</option>
          <option value="GBP">GBP £ (UK)</option>
        </select>

        <button
          onClick={onOpenSearch}
          className="w-10 h-10 rounded-full border border-slate-800 hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-[#D4AF37] transition-colors"
        >
          <Search className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSignIn}
          className="hidden sm:flex items-center space-x-2 px-5 py-2.5 rounded-full gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-[11px] font-bold tracking-[0.2em] transition-all shadow-lg shadow-[#D4AF37]/20"
        >
          <User className="w-3.5 h-3.5" />
          <span>SIGN IN</span>
        </button>
      </div>
    </header>
  );
};
