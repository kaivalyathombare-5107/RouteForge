import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Compass, Layers, ShieldAlert, Menu, X, Languages } from 'lucide-react';

export type ReRouteSection = 'destinations' | 'journeys' | 'emergency' | 'concierge' | 'translator' | 'membership';

interface ReRouteNavigationProps {
  activeSection: ReRouteSection;
  onSelectSection: (section: ReRouteSection) => void;
  onOpenSignIn: () => void;
  onOpenSearch: () => void;
  onOpenProviders?: () => void;
  onOpenAccount?: () => void;
  user?: any;
  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;
}

export const ReRouteNavigation: React.FC<ReRouteNavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenSignIn,
  onOpenSearch,
  onOpenProviders,
  onOpenAccount,
  user,
  selectedCurrency,
  onSelectCurrency
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-20 bg-[#06070A]/80 backdrop-blur-xl border-b border-gold-subtle/30 z-50 px-4 sm:px-8 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectSection('destinations')}>
        <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
          <Compass className="w-5 h-5 text-slate-950" />
        </div>
        <div className="flex flex-col">
          <span className="font-serif-display text-lg tracking-[0.2em] text-white">
            RouteForge
          </span>
          <span className="text-[9px] font-cinzel tracking-widest text-[#D4AF37] uppercase">
            Bharat Privé Edition
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-3 sm:space-x-4 ml-auto mr-2.5 sm:mr-3.5">
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

        {/* Account Tab */}
        {user ? (
          <button
            id="nav-account-tab"
            onClick={onOpenAccount}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-[#D4AF37]/50 bg-[#0B0D13] hover:bg-[#D4AF37]/10 text-[#D4AF37] hover:text-[#FCE7AC] font-cinzel text-[11px] sm:text-xs font-bold tracking-[0.18em] transition-all cursor-pointer hover:border-gold-bright hover:shadow-lg hover:shadow-[#D4AF37]/15"
          >
            <User className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>ACCOUNT</span>
          </button>
        ) : (
          <button
            id="nav-signin-tab"
            onClick={onOpenSignIn}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-[11px] sm:text-xs font-bold tracking-[0.18em] transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
          >
            <User className="w-3.5 h-3.5" />
            <span>SIGN IN</span>
          </button>
        )}
      </div>

      {/* Navigation Links - Contracted Menu Button */}
      <nav
        ref={menuRef}
        id="header-nav-menu"
        className="relative flex items-center shrink-0"
      >
        <div className="relative">
          <button
            id="nav-mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex items-center space-x-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full border border-gold-subtle/50 bg-[#0A0C14]/90 hover:bg-[#121520] text-slate-200 hover:text-[#FCE7AC] hover:border-[#D4AF37] transition-all cursor-pointer shadow-md"
            title="Toggle Menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-4 h-4 text-[#D4AF37]" />
            ) : (
              <Menu className="w-4 h-4 text-[#D4AF37]" />
            )}
            <span className="text-[10px] sm:text-[11px] font-cinzel font-bold tracking-[0.2em] text-[#FCE7AC]">
              MENU
            </span>
          </button>

          {/* Dropdown Panel */}
          {isMobileMenuOpen && (
            <div className="absolute right-0 mt-3 w-56 sm:w-60 rounded-2xl bg-[#090B10]/95 border border-gold-subtle/60 backdrop-blur-2xl shadow-2xl p-2 z-50 flex flex-col space-y-1 animate-fadeIn">
              <button
                onClick={() => {
                  onSelectSection('destinations');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all cursor-pointer ${
                  activeSection === 'destinations'
                    ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Destinations
              </button>
              <button
                onClick={() => {
                  onSelectSection('journeys');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all cursor-pointer ${
                  activeSection === 'journeys'
                    ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Journeys
              </button>
              <button
                id="nav-emergency-button"
                onClick={() => {
                  onSelectSection('emergency');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSection === 'emergency'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/40 font-bold'
                    : 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span>Emergency</span>
              </button>
              <button
                onClick={() => {
                  onSelectSection('concierge');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all cursor-pointer ${
                  activeSection === 'concierge'
                    ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                Disruption Shield
              </button>
              <button
                id="nav-translator-button"
                onClick={() => {
                  onSelectSection('translator');
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
                  activeSection === 'translator'
                    ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Languages className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>Live Translator</span>
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
};
