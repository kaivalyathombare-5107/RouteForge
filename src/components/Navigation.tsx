import React from 'react';
import { Plane, AlertTriangle, ShieldCheck, Cpu, Bot, RotateCcw, Zap, Volume2, VolumeX, Eye } from 'lucide-react';

export type ActiveTab = 'command_center' | 'disruption_cascade' | 'recovery_planner' | 'refund_intelligence' | 'provider_architecture' | 'ai_assistant';

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
  return (
    <header className="sticky top-0 z-40 w-full bg-[#05070B]/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-8 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Brand Identity & Hackathon Meta */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          <div
            id="brand-logo-btn"
            onClick={() => setActiveTab('command_center')}
            className="cursor-pointer flex items-center space-x-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold font-mono shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              J//X
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-display font-bold text-base sm:text-lg tracking-wider text-slate-100 group-hover:text-cyan-300 transition-colors">
                  RouteForge
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 leading-tight hidden sm:block">
                3D Travel Graph & Recovery Command Center
              </p>
            </div>
          </div>
        </div>

        {/* Center: Core Views Minimal Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-950/70 p-1 rounded-xl border border-slate-800/80 text-xs font-mono">
          <button
            id="nav-tab-command-center"
            onClick={() => setActiveTab('command_center')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'command_center'
                ? 'bg-blue-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>3D Command</span>
          </button>

          <button
            id="nav-tab-recovery"
            onClick={() => setActiveTab('recovery_planner')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'recovery_planner'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Recovery Engine</span>
          </button>

          <button
            id="nav-tab-refunds"
            onClick={() => setActiveTab('refund_intelligence')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'refund_intelligence'
                ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Refund Intelligence</span>
          </button>

          <button
            id="nav-tab-adapters"
            onClick={() => setActiveTab('provider_architecture')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'provider_architecture'
                ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Architecture</span>
          </button>

          <button
            id="nav-tab-ai-copilot"
            onClick={() => setActiveTab('ai_assistant')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all ${
              activeTab === 'ai_assistant'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
        </nav>

        {/* Right: Primary Simulation Triggers & System Telemetry */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Telemetry clock */}
          <div className="hidden xl:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>{currentIstTime}</span>
          </div>

          {/* Simulate Disruption Action Button */}
          {!isDisrupted ? (
            <button
              id="btn-simulate-disruption"
              onClick={onSimulateDisruption}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-lg shadow-red-950/50 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer border border-red-400/40"
            >
              <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
              <span>SIMULATE DISRUPTION</span>
            </button>
          ) : (
            <button
              id="btn-reset-simulation"
              onClick={onResetTrip}
              className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET TRIP</span>
            </button>
          )}

          {/* Sound toggle */}
          <button
            id="btn-toggle-sound"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title={soundEnabled ? 'Mute Interface Sound FX' : 'Enable Spatial Sound FX'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Reduced motion toggle */}
          <button
            id="btn-toggle-reduced-motion"
            onClick={() => setReducedMotion(!reducedMotion)}
            className={`p-1.5 rounded-lg border transition-colors ${
              reducedMotion ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' : 'bg-slate-900/80 border-slate-800 text-slate-400'
            }`}
            title="Toggle Reduced Motion"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile sub-tabs */}
      <div className="flex md:hidden items-center justify-between space-x-1 mt-2 pt-2 border-t border-slate-800/80 text-[11px] font-mono overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('command_center')}
          className={`px-2 py-1 rounded ${activeTab === 'command_center' ? 'bg-blue-900/60 text-cyan-300' : 'text-slate-400'}`}
        >
          3D Command
        </button>
        <button
          onClick={() => setActiveTab('recovery_planner')}
          className={`px-2 py-1 rounded ${activeTab === 'recovery_planner' ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-400'}`}
        >
          Recovery
        </button>
        <button
          onClick={() => setActiveTab('refund_intelligence')}
          className={`px-2 py-1 rounded ${activeTab === 'refund_intelligence' ? 'bg-amber-900/60 text-amber-300' : 'text-slate-400'}`}
        >
          Refunds
        </button>
        <button
          onClick={() => setActiveTab('provider_architecture')}
          className={`px-2 py-1 rounded ${activeTab === 'provider_architecture' ? 'bg-cyan-900/60 text-cyan-300' : 'text-slate-400'}`}
        >
          Architecture
        </button>
        <button
          onClick={() => setActiveTab('ai_assistant')}
          className={`px-2 py-1 rounded ${activeTab === 'ai_assistant' ? 'bg-purple-900/60 text-purple-300' : 'text-slate-400'}`}
        >
          AI Copilot
        </button>
      </div>
    </header>
  );
};
