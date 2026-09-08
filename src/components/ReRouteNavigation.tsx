import React, { useState, useRef, useEffect } from 'react';
import { User, Compass, Layers, ShieldAlert, Menu, X, Languages, Sparkles, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ReRouteSection = 'destinations' | 'journeys' | 'emergency' | 'concierge' | 'translator' | 'membership' | 'recovery' | 'signin';

interface ReRouteNavigationProps {
  activeSection: ReRouteSection;
  onSelectSection: (section: ReRouteSection) => void;
  onOpenSignIn: () => void;
  onOpenProviders?: () => void;
  onOpenAccount?: () => void;
  user?: any;
}

export const ReRouteNavigation: React.FC<ReRouteNavigationProps> = ({
  activeSection,
  onSelectSection,
  onOpenSignIn,
  onOpenProviders,
  onOpenAccount,
  user
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLElement>(null);
  const { theme, toggleTheme, isDark } = useTheme();

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
    <header className="fixed top-0 left-0 right-0 min-h-[5rem] h-auto bg-[#06070A]/85 backdrop-blur-xl border-b border-gold-subtle/30 z-50 px-3 sm:px-8 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
      {/* Brand */}
      <div 
        className="flex items-center space-x-2.5 sm:space-x-3 cursor-pointer shrink-0 min-w-0" 
        onClick={() => onSelectSection('destinations')}
      >
        <div className="w-8 h-8 rounded-full bg-[#D4AF37] flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 shrink-0">
          <Compass className="w-5 h-5 text-slate-950" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="font-serif-display text-base sm:text-lg tracking-[0.2em] sm:tracking-[0.35em] text-white leading-tight truncate sm:overflow-visible">
            RouteForge
          </span>
          <span className="text-[8px] sm:text-[9px] font-cinzel tracking-wider text-[#D4AF37] uppercase leading-tight">
            Unleashing your Journey
          </span>
        </div>
      </div>

      {/* Luxury Desktop Menu Bar: Sections + Theme Change (Dark / Bright) */}
      <nav
        id="desktop-nav-menu-bar"
        className="hidden lg:flex items-center space-x-1 bg-[#0B0D14]/85 p-1.5 rounded-full border border-gold-subtle/50 text-xs font-cinzel backdrop-blur-md shadow-lg"
      >
        <button
          id="menu-bar-tab-destinations"
          onClick={() => onSelectSection('destinations')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSection === 'destinations'
              ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-[#D4AF37]/50 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <span className="text-xs">🗺️</span>
          <span>Destinations</span>
        </button>
        <button
          id="menu-bar-tab-journeys"
          onClick={() => onSelectSection('journeys')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSection === 'journeys'
              ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-[#D4AF37]/50 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <span className="text-xs">✈️</span>
          <span>Journeys</span>
        </button>
        <button
          id="menu-bar-tab-concierge"
          onClick={() => onSelectSection('concierge')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSection === 'concierge'
              ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-[#D4AF37]/50 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <span className="text-xs">🛡️</span>
          <span>Disruption Shield</span>
        </button>
        <button
          id="menu-bar-tab-recovery"
          onClick={() => onSelectSection('recovery')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSection === 'recovery'
              ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-[#D4AF37]/50 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Recovery Plans</span>
        </button>
        <button
          id="menu-bar-tab-translator"
          onClick={() => onSelectSection('translator')}
          className={`px-3.5 py-1.5 rounded-full transition-all flex items-center space-x-1.5 cursor-pointer ${
            activeSection === 'translator'
              ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-[#D4AF37]/50 font-bold shadow-sm'
              : 'text-slate-300 hover:text-white hover:bg-slate-900/50'
          }`}
        >
          <Languages className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Live Translator</span>
        </button>

        {/* Subtle Divider in Menu Bar */}
        <div className="h-4 w-px bg-gold-subtle/40 mx-1.5" />

        {/* Theme Change (Dark / Bright) on Menu Bar */}
        <button
          id="menu-bar-theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={isDark ? "Switch to Bright Theme" : "Switch to Dark Theme"}
          title={isDark ? "Switch to Bright Theme" : "Switch to Dark Theme"}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full border border-gold-subtle/50 bg-[#121522]/90 hover:bg-[#1A1F30] text-slate-200 hover:text-[#FCE7AC] transition-all cursor-pointer text-[11px] font-cinzel font-semibold shadow-inner"
        >
          {isDark ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#FCE7AC] transition-transform hover:rotate-45" />
              <span className="text-[#FCE7AC]">BRIGHT</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-[#8C6B1B] transition-transform hover:-rotate-12" />
              <span className="text-[#8C6B1B] font-bold">DARK</span>
            </>
          )}
        </button>
      </nav>

      {/* Header Actions: Emergency SOS Button + Account / Sign In + Menu */}
      <div className="flex items-center space-x-2 sm:space-x-3.5 shrink-0 ml-auto">
        {/* Emergency App Button in Header: In mobile view, shows ONLY the 🚨 Emoji */}
        <button
          id="header-emergency-btn"
          onClick={() => {
            onSelectSection('emergency');
            setIsMobileMenuOpen(false);
          }}
          aria-label="Emergency Assistance"
          title="Emergency Directory & Rapid SOS"
          className={`flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border transition-all cursor-pointer shadow-lg shrink-0 ${
            activeSection === 'emergency'
              ? 'bg-red-600/30 border-red-500 text-red-200 shadow-red-500/30 ring-1 ring-red-400'
              : 'bg-red-950/50 hover:bg-red-900/70 border-red-500/50 hover:border-red-400 text-red-300 hover:text-white shadow-red-950/40'
          }`}
        >
          <span className="text-base sm:text-lg leading-none select-none" role="img" aria-label="Emergency">
            🚨
          </span>
        </button>

        {/* Account Tab */}
        {user ? (
          <button
            id="nav-account-tab"
            onClick={onOpenAccount}
            className="flex items-center space-x-1.5 sm:space-x-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border border-[#D4AF37]/60 bg-[#0B0D13] hover:bg-[#D4AF37]/15 text-[#D4AF37] hover:text-[#FCE7AC] font-cinzel text-[10px] sm:text-xs font-bold tracking-[0.14em] sm:tracking-[0.18em] transition-all cursor-pointer hover:border-gold-bright hover:shadow-lg hover:shadow-[#D4AF37]/20 h-auto min-h-[36px] shrink-0"
            title={user.displayName || user.email || 'My Account'}
          >
            {user.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName || 'User Profile'}
                referrerPolicy="no-referrer"
                className="w-6 h-6 sm:w-6 sm:h-6 rounded-full border border-gold-bright object-cover shrink-0 shadow-sm"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-slate-950 font-cinzel font-bold text-[10px] flex items-center justify-center border border-gold-bright shrink-0 shadow-sm">
                {(user.displayName || user.email || 'U')
                  .split(' ')
                  .map((w: string) => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <span className="hidden xs:inline">ACCOUNT</span>
          </button>
        ) : (
          <button
            id="nav-signin-tab"
            onClick={onOpenSignIn}
            className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-[10px] sm:text-xs font-bold tracking-[0.14em] sm:tracking-[0.18em] transition-all shadow-lg shadow-[#D4AF37]/20 cursor-pointer h-auto min-h-[36px] shrink-0"
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>SIGN IN</span>
          </button>
        )}

        {/* Navigation Menu Button & Dropdown (Emergency removed from menu) */}
        <nav
          ref={menuRef}
          id="header-nav-menu"
          className="relative flex items-center shrink-0"
        >
          <div className="relative">
            <button
              id="nav-mobile-menu-btn"
              aria-label="Navigation Menu"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gold-subtle/50 bg-[#0A0C14]/90 hover:bg-[#121520] text-slate-200 hover:text-[#FCE7AC] hover:border-[#D4AF37] transition-all cursor-pointer shadow-md shrink-0"
              title="Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4AF37]" />
              )}
            </button>

            {/* Dropdown Panel (Emergency is taken out of menu) */}
            {isMobileMenuOpen && (
              <div className="absolute right-0 mt-3 w-56 sm:w-60 rounded-2xl bg-[#090B10]/95 border border-gold-subtle/60 backdrop-blur-2xl shadow-2xl p-2 z-50 flex flex-col space-y-1 animate-fadeIn">
                <button
                  onClick={() => {
                    onSelectSection('destinations');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
                    activeSection === 'destinations'
                      ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="text-xs">🗺️</span>
                  <span>Destinations</span>
                </button>
                <button
                  onClick={() => {
                    onSelectSection('journeys');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
                    activeSection === 'journeys'
                      ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="text-xs">✈️</span>
                  <span>Journeys</span>
                </button>
                <button
                  id="nav-concierge-shield-button"
                  onClick={() => {
                    onSelectSection('concierge');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
                    activeSection === 'concierge'
                      ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <span className="text-xs">🛡️</span>
                  <span>Disruption Shield</span>
                </button>
                <button
                  id="nav-recovery-plans-button"
                  onClick={() => {
                    onSelectSection('recovery');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center space-x-2 cursor-pointer ${
                    activeSection === 'recovery'
                      ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40 font-bold'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>Recovery Plans</span>
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

                {/* Theme Switch in Dropdown */}
                <div className="pt-1 mt-1 border-t border-gold-subtle/30">
                  <button
                    onClick={() => {
                      toggleTheme();
                    }}
                    className="w-full text-left px-4 py-2.5 rounded-xl text-xs font-cinzel font-semibold tracking-wider transition-all flex items-center justify-between text-slate-300 hover:bg-slate-900 hover:text-white cursor-pointer"
                  >
                    <span className="flex items-center space-x-2">
                      {isDark ? <Sun className="w-3.5 h-3.5 text-[#FCE7AC]" /> : <Moon className="w-3.5 h-3.5 text-[#8C6B1B]" />}
                      <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#D4AF37] uppercase">{theme}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
};
