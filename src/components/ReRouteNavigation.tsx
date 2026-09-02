import React, { useState } from 'react';
import { Search, Globe, User, X, Sparkles, ShieldCheck } from 'lucide-react';

export type ReRouteSection = 'destinations' | 'experiences' | 'journeys' | 'concierge' | 'membership';

interface ReRouteNavigationProps {
  activeSection: ReRouteSection;
  onSelectSection: (section: ReRouteSection) => void;
  onOpenSignIn: () => void;
  onOpenSearch: () => void;
  selectedCurrency: string;
  onSelectCurrency: (curr: string) => void;
}

export const ReRouteNavigation: React.FC<ReRouteNavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenSignIn,
  onOpenSearch,
  selectedCurrency,
  onSelectCurrency,
}) => {
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)', 'INR (₹)', 'JPY (¥)'];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full px-6 lg:px-12 py-5 flex items-center justify-between pointer-events-none">
      {/* Background soft blur gradient on scroll */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#08090C]/90 via-[#08090C]/60 to-transparent backdrop-blur-md pointer-events-none -z-10" />

      {/* Left: Brand Monogram & Luxury Title */}
      <div
        onClick={() => onSelectSection('destinations')}
        className="pointer-events-auto flex items-center space-x-3.5 cursor-pointer group"
        id="reroute-brand-logo"
      >
        {/* Regal "R" Monogram Logo */}
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 border border-[#D4AF37] rounded-sm flex items-center justify-center bg-gradient-to-br from-[#1C1A14] to-[#0A0B0E] shadow-lg shadow-[#D4AF37]/15 group-hover:border-[#FCE7AC] transition-all">
            <span className="font-serif-display font-normal text-xl text-[#F3E5AB] tracking-tighter leading-none italic">
              R
            </span>
          </div>
          {/* Subtle gold diamond accent corner */}
          <span className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-[#D4AF37] rotate-45" />
        </div>

        {/* Brand Text */}
        <div className="flex flex-col">
          <span className="font-serif-display font-medium text-lg sm:text-xl tracking-[0.25em] text-[#F3E5AB] group-hover:text-white transition-colors">
            RE ROUTE
          </span>
        </div>
      </div>

      {/* Center: Navigation Links */}
      <nav className="pointer-events-auto hidden md:flex items-center space-x-8 text-[11px] font-cinzel font-medium tracking-[0.2em] text-slate-300">
        <button
          onClick={() => onSelectSection('destinations')}
          className={`transition-all py-1 cursor-pointer relative hover:text-white ${
            activeSection === 'destinations' ? 'text-[#F3E5AB] font-bold' : ''
          }`}
        >
          <span>DESTINATIONS</span>
          {activeSection === 'destinations' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-[#D4AF37]" />
          )}
        </button>

        <button
          onClick={() => onSelectSection('experiences')}
          className={`transition-all py-1 cursor-pointer relative hover:text-white ${
            activeSection === 'experiences' ? 'text-[#F3E5AB] font-bold' : ''
          }`}
        >
          <span>EXPERIENCES</span>
          {activeSection === 'experiences' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-[#D4AF37]" />
          )}
        </button>

        <button
          onClick={() => onSelectSection('journeys')}
          className={`transition-all py-1 cursor-pointer relative hover:text-white ${
            activeSection === 'journeys' ? 'text-[#F3E5AB] font-bold' : ''
          }`}
        >
          <span>JOURNEYS</span>
          {activeSection === 'journeys' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-[#D4AF37]" />
          )}
        </button>

        <button
          onClick={() => onSelectSection('concierge')}
          className={`transition-all py-1 cursor-pointer relative hover:text-white ${
            activeSection === 'concierge' ? 'text-[#F3E5AB] font-bold' : ''
          }`}
        >
          <span>CONCIERGE</span>
          {activeSection === 'concierge' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-[#D4AF37]" />
          )}
        </button>

        <button
          onClick={() => onSelectSection('membership')}
          className={`transition-all py-1 cursor-pointer relative hover:text-white ${
            activeSection === 'membership' ? 'text-[#F3E5AB] font-bold' : ''
          }`}
        >
          <span>MEMBERSHIP</span>
          {activeSection === 'membership' && (
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[1px] bg-[#D4AF37]" />
          )}
        </button>
      </nav>

      {/* Right: Search, Globe, User & Sign In */}
      <div className="pointer-events-auto flex items-center space-x-4 sm:space-x-5">
        {/* Search button / input */}
        <div className="relative flex items-center">
          {isSearchOpen ? (
            <div className="flex items-center bg-slate-950/90 border border-[#D4AF37]/50 rounded-full px-3 py-1.5 shadow-xl text-xs">
              <Search className="w-3.5 h-3.5 text-[#D4AF37] mr-2" />
              <input
                type="text"
                autoFocus
                placeholder="Search Amalfi, Kyoto, Paris..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    onOpenSearch();
                    setIsSearchOpen(false);
                  }
                }}
                className="bg-transparent border-none outline-none text-white text-xs w-36 sm:w-48 placeholder-slate-500 font-sans-luxury"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsSearchOpen(true)}
              className="text-slate-300 hover:text-[#F3E5AB] transition-colors p-1.5 cursor-pointer"
              title="Search Destinations & Journeys"
            >
              <Search className="w-4 h-4 stroke-[1.5]" />
            </button>
          )}
        </div>

        {/* Currency / Region Globe */}
        <div className="relative">
          <button
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            className="text-slate-300 hover:text-[#F3E5AB] transition-colors p-1.5 cursor-pointer flex items-center space-x-1"
            title="Select Region & Currency"
          >
            <Globe className="w-4 h-4 stroke-[1.5]" />
          </button>

          {showCurrencyDropdown && (
            <div className="absolute right-0 mt-2 w-32 rounded-xl bg-[#0F1117] border border-gold-subtle shadow-2xl py-1 text-xs font-mono z-50">
              {currencies.map((curr) => (
                <button
                  key={curr}
                  onClick={() => {
                    onSelectCurrency(curr.split(' ')[0]);
                    setShowCurrencyDropdown(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 hover:bg-[#1A1E29] transition-colors flex items-center justify-between ${
                    selectedCurrency === curr.split(' ')[0] ? 'text-[#D4AF37] font-bold' : 'text-slate-300'
                  }`}
                >
                  <span>{curr}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account Circle */}
        <button
          onClick={onOpenSignIn}
          className="w-7 h-7 rounded-full border border-slate-700 bg-slate-900/80 flex items-center justify-center text-slate-300 hover:text-white hover:border-[#D4AF37] transition-all cursor-pointer"
          title="Account Profile"
        >
          <User className="w-3.5 h-3.5 stroke-[1.5]" />
        </button>

        {/* Sign In Luxury Button */}
        <button
          onClick={onOpenSignIn}
          className="px-4 py-1.5 rounded-full border border-slate-700 hover:border-[#D4AF37] bg-slate-950/60 hover:bg-[#D4AF37]/10 text-xs font-cinzel tracking-widest text-slate-200 hover:text-[#F3E5AB] transition-all cursor-pointer"
        >
          SIGN IN
        </button>
      </div>
    </header>
  );
};
