import React from 'react';
import { 
  ShieldCheck, 
  ArrowRight, 
  ShieldAlert
} from 'lucide-react';
import { Booking, TripEdge, ProactiveWarning } from '../types';
import { DISRUPTION_SCENARIOS } from '../lib/demo-data';

interface DisruptionCascadeViewProps {
  bookings: Booking[];
  edges: TripEdge[];
  isDisrupted: boolean;
  proactiveWarnings?: ProactiveWarning[];
  onSimulateScenario: (scenarioId: string) => void;
  onReset: () => void;
  onOpenRecovery: () => void;
  onSelectBooking?: (id: string) => void;
  activeScenarioId?: string;
  isRecoveryOpen?: boolean;
}

export const DisruptionCascadeView: React.FC<DisruptionCascadeViewProps> = ({
  bookings,
  edges,
  isDisrupted,
  proactiveWarnings = [],
  onSimulateScenario,
  onReset,
  onOpenRecovery,
  activeScenarioId = 'flight_delay_90',
  isRecoveryOpen = false,
}) => {
  const disruptedCount = bookings.filter(b => b.status === 'cancelled' || b.status === 'delayed').length;
  const impactedCount = bookings.filter(b => b.status === 'impacted' || b.status === 'missed' || b.status === 'at_risk').length;
  const brokenEdgesCount = edges.filter(e => e.status === 'broken').length;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800/60 font-semibold">
                CASCADE ENGINE
              </span>
              <span className="text-xs font-mono text-slate-400">DISRUPTION & PROPAGATION ANALYSIS</span>
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-100">
              Itinerary Dependency Graph & Risk Radar
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            {isDisrupted && (
              <button
                id="scenario-btn-reset"
                onClick={onReset}
                className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
              >
                Reset Graph to Normal
              </button>
            )}
          </div>
        </div>

        {/* 8 Curated Disruption Scenarios Grid */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-cinzel font-semibold tracking-wider text-[#D4AF37]">
              SELECT TEST SCENARIO (8 CURATED TEST RUNS)
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              Simulates real-time multi-modal cascade across BOM → DEL → JPR
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {DISRUPTION_SCENARIOS.map((sc) => {
              const isActive = activeScenarioId === sc.id && isDisrupted;
              return (
                <button
                  key={sc.id}
                  id={`scenario-btn-${sc.id}`}
                  onClick={() => onSimulateScenario(sc.id)}
                  className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-rose-950/60 border-rose-500/80 text-rose-100 shadow-lg shadow-rose-950/40'
                      : 'bg-slate-950/50 hover:bg-slate-900 border-slate-800 hover:border-gold-subtle text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-cinzel font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[#FCE7AC]">
                      {sc.badge}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {sc.disruptionType === 'cancellation' ? 'CANCEL' : `+${sc.delayMinutes}m`}
                    </span>
                  </div>
                  <div className="text-xs font-semibold truncate text-white">{sc.name.split(':')[1] || sc.name}</div>
                  <div className="text-[10px] font-sans-luxury text-slate-400 line-clamp-2 mt-0.5 leading-snug">
                    {sc.reason}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Proactive Warnings Banner (if any) */}
      {proactiveWarnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/50 backdrop-blur-md space-y-2">
          <div className="flex items-center space-x-2 text-xs font-cinzel font-bold text-amber-300">
            <ShieldAlert className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>PROACTIVE RISK INTELLIGENCE & EARLY BUFFER AUDIT ({proactiveWarnings.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {proactiveWarnings.map((warn) => (
              <div key={warn.id} className="p-3 rounded-xl bg-slate-950/80 border border-amber-900/60 text-xs font-sans-luxury space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-200">{warn.title}</span>
                  <span className="text-[10px] font-mono text-slate-400">{warn.timestamp}</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">{warn.message}</p>
                <div className="text-[11px] text-[#FCE7AC] font-mono flex items-center space-x-1 pt-0.5">
                  <span>💡 Fix:</span>
                  <span>{warn.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Impact Assessment & Deterministic Compliance Verification */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Mathematical Impact Assessment & Immediate Recovery Action */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-xs font-mono text-slate-400 uppercase">Impact Assessment</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-400 border border-cyan-800">
              REAL-TIME SOLVER
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Root Disruption:</span>
              <span className="font-semibold text-red-400">
                {isDisrupted ? `${disruptedCount} Direct Booking(s)` : 'None (Active)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Downstream Impacted:</span>
              <span className="font-semibold text-slate-200">
                {isDisrupted ? `${impactedCount} Segments` : '0 Bookings'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Broken Connections:</span>
              <span className="font-semibold text-amber-400">
                {isDisrupted ? `${brokenEdgesCount} Violated Buffers` : '0 (Nominal)'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Statutory Refund Value:</span>
              <span className="font-semibold text-emerald-400">₹7,060 (100% Eligible)</span>
            </div>
          </div>

          <button
            id="btn-open-recovery-from-cascade"
            type="button"
            onClick={onOpenRecovery}
            className={`w-full py-3.5 rounded-xl font-mono text-xs font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-xl ${
              isRecoveryOpen
                ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-500/60 shadow-emerald-950/40'
                : isDisrupted
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 shadow-emerald-950/40 animate-pulse'
                : 'bg-gradient-to-r from-[#D4AF37] to-[#F3E5AB] hover:from-[#e5bd3c] hover:to-[#fff0bd] text-slate-950 shadow-gold-subtle/30'
            }`}
          >
            <span>{isRecoveryOpen ? 'RECOVERY PLANS ACTIVE ↓' : 'GENERATE RECOVERY OPTIONS'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* IRCTC & Aviation Compliance Rules Box */}
        <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="text-cyan-400 font-semibold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>DETERMINISTIC COMPLIANCE AUDIT</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Calculations are enforced via versioned statutory rules engines: <br />
              • <strong className="text-slate-200">DGCA CAR Sec 3 Series M IV</strong>: Mandatory 100% airline refund on cancellation. <br />
              • <strong className="text-slate-200">IRCTC PRS Rule 73A</strong>: Connecting ticket full refund via online TDR.
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[10px] text-slate-400">
            Audit status: <span className="text-emerald-400 font-bold">100% Deterministic Guarantee Active</span>
          </div>
        </div>
      </div>
    </div>
  );
};

