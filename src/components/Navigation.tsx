import React from 'react';
import { Plane, AlertTriangle, ShieldCheck, Cpu, Bot, RotateCcw, Zap, Volume2, VolumeX, Eye, Compass, Sparkles, Building, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export type ActiveTab = 'command_center' | 'panoramic_suites' | 'disruption_cascade' | 'recovery_planner' | 'refund_intelligence' | 'provider_architecture' | 'ai_assistant';

interface NavigationProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isDisrupted: boolean;
  onSimulateDisruption: () => void;
  onResetTrip: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  reducedMotion: boolean;
  setReducedMotion: (val: boolean) => void;
  currentIstTime: string;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  isDisrupted,
  onSimulateDisruption,
  onResetTrip,
  soundEnabled,
  setSoundEnabled,
  reducedMotion,
  setReducedMotion,
  currentIstTime,
}) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#08090C]/90 backdrop-blur-xl border-b border-gold-subtle px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Luxe Title */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            id="brand-logo-btn"
            onClick={() => setActiveTab('command_center')}
            className="cursor-pointer flex items-center space-x-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#FCE7AC] via-[#D4AF37] to-[#8C6B1B] flex items-center justify-center text-slate-950 font-bold font-cinzel text-xs shadow-md shadow-[#D4AF37]/20 group-hover:scale-105 transition-transform">
              R/F
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif-display font-bold text-lg sm:text-xl tracking-wider text-champagne-gradient group-hover:text-[#F3E5AB] transition-colors">
                  RouteForge
                </span>
                <span className="text-[9px] font-cinzel px-2 py-0.5 rounded bg-slate-950 text-[#D4AF37] border border-gold-subtle hidden sm:inline-block">
                  L'ÉDITION VOYAGE
                </span>
              </div>
              <p className="text-[10px] font-sans-luxury text-slate-400 leading-tight hidden sm:block">
                3D WebGL Flight Corridors & 360° Panorama Suites
              </p>
            </div>
          </div>
        </div>

        {/* Center: Core Views Luxury Navigation Tabs */}
        <nav className="hidden lg:flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-gold-subtle text-xs font-cinzel">
          <button
            id="nav-tab-command-center"
            onClick={() => setActiveTab('command_center')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'command_center'
                ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-gold-bright shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>3D Itinerary</span>
          </button>

          <button
            id="nav-tab-panoramic"
            onClick={() => setActiveTab('panoramic_suites')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'panoramic_suites'
                ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-gold-bright shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5C07B]" />
            <span>360° Suites</span>
          </button>

          <button
            id="nav-tab-cascade"
            onClick={() => setActiveTab('disruption_cascade')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'disruption_cascade'
                ? 'bg-rose-950/50 text-rose-300 border border-rose-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Cascade</span>
          </button>

          <button
            id="nav-tab-recovery"
            onClick={() => setActiveTab('recovery_planner')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'recovery_planner'
                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Concierge Recovery</span>
          </button>

          <button
            id="nav-tab-refunds"
            onClick={() => setActiveTab('refund_intelligence')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'refund_intelligence'
                ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            <span>Refund Audit</span>
          </button>

          <button
            id="nav-tab-adapters"
            onClick={() => setActiveTab('provider_architecture')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'provider_architecture'
                ? 'bg-blue-950/50 text-blue-300 border border-blue-500/40 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5 text-blue-400" />
            <span>Adapters</span>
          </button>

          <button
            id="nav-tab-travel-concierge"
            onClick={() => setActiveTab('ai_assistant')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'ai_assistant'
                ? 'bg-amber-950/50 text-[#FCE7AC] border border-[#D4AF37]/50 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Travel Concierge</span>
          </button>

          <button
            id="nav-tab-theme-toggle"
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer text-slate-400 hover:text-slate-200 border border-gold-subtle/30 hover:border-gold-subtle"
            title={isDark ? 'Switch to Bright Theme' : 'Switch to Dark Theme'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-[#FCE7AC]" /> : <Moon className="w-3.5 h-3.5 text-[#8C6B1B]" />}
            <span>{isDark ? 'Bright' : 'Dark'}</span>
          </button>
        </nav>

        {/* Right: Simulation Actions & Telemetry Controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Telemetry Clock */}
          <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-950 border border-gold-subtle text-[11px] font-mono text-[#F3E5AB]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            <span>{currentIstTime}</span>
          </div>

          {/* Simulate Disruption Action Button */}
          {!isDisrupted ? (
            <button
              id="btn-simulate-disruption"
              onClick={onSimulateDisruption}
              className="px-3.5 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-gradient-to-r from-rose-900 to-amber-900 hover:from-rose-800 hover:to-amber-800 text-rose-100 shadow-md shadow-rose-950/50 flex items-center space-x-1.5 transition-all cursor-pointer border border-rose-500/40"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-300 animate-pulse" />
              <span>SIMULATE DELAY</span>
            </button>
          ) : (
            <button
              id="btn-reset-trip"
              onClick={onResetTrip}
              className="px-3 py-1.5 rounded-xl text-xs font-cinzel font-bold bg-slate-950 hover:bg-slate-900 text-[#D4AF37] border border-gold-bright flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET PRISTINE</span>
            </button>
          )}

          {/* Audio Chime & Reduced Motion Toggles */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-gold-subtle">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                soundEnabled ? 'text-[#D4AF37] hover:text-white' : 'text-slate-600 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Acoustic Feedback: Enabled' : 'Acoustic Feedback: Muted'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setReducedMotion(!reducedMotion)}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                reducedMotion ? 'text-amber-400 bg-amber-950/40' : 'text-slate-400 hover:text-white'
              }`}
              title={reducedMotion ? 'Reduced Motion: Active (a11y)' : 'Dynamic Animations: Active'}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Horizontal Subnav */}
      <div className="lg:hidden flex items-center overflow-x-auto space-x-2 pt-2 border-t border-gold-subtle mt-2 pb-1 no-scrollbar text-xs font-cinzel">
        <button
          id="mobile-nav-theme-toggle"
          onClick={toggleTheme}
          className="px-2.5 py-1 rounded-lg shrink-0 text-[#D4AF37] border border-gold-subtle/40 flex items-center space-x-1"
        >
          {isDark ? <Sun className="w-3 h-3 text-[#FCE7AC]" /> : <Moon className="w-3 h-3 text-[#8C6B1B]" />}
          <span>{isDark ? 'Bright Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={() => setActiveTab('command_center')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'command_center' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          3D Itinerary
        </button>
        <button
          onClick={() => setActiveTab('panoramic_suites')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'panoramic_suites' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-slate-400'}`}
        >
          360° Suites
        </button>
        <button
          onClick={() => setActiveTab('disruption_cascade')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'disruption_cascade' ? 'bg-rose-900 text-rose-100 font-bold' : 'text-slate-400'}`}
        >
          Cascade
        </button>
        <button
          onClick={() => setActiveTab('recovery_planner')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'recovery_planner' ? 'bg-emerald-900 text-emerald-100 font-bold' : 'text-slate-400'}`}
        >
          Recovery
        </button>
        <button
          onClick={() => setActiveTab('refund_intelligence')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'refund_intelligence' ? 'bg-amber-900 text-amber-100 font-bold' : 'text-slate-400'}`}
        >
          Refunds
        </button>
        <button
          onClick={() => setActiveTab('ai_assistant')}
          className={`px-2.5 py-1 rounded-lg shrink-0 ${activeTab === 'ai_assistant' ? 'bg-amber-900 text-amber-100 font-bold' : 'text-slate-400'}`}
        >
          Travel Concierge
        </button>
      </div>
    </header>
  );
};
