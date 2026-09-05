import React from 'react';
import { 
  AlertOctagon, 
  ArrowDown, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  ArrowRight, 
  Zap, 
  CheckCircle,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Booking, TripEdge, DisruptionEvent, ProactiveWarning } from '../types';
import { DISRUPTION_SCENARIOS } from '../lib/demo-data';

interface DisruptionCascadeViewProps {
  bookings: Booking[];
  edges: TripEdge[];
  isDisrupted: boolean;
  proactiveWarnings?: ProactiveWarning[];
  onSimulateScenario: (scenarioId: string) => void;
  onReset: () => void;
  onOpenRecovery: () => void;
  onSelectBooking: (id: string) => void;
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
  onSelectBooking,
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

      {/* Main Cascade Visualization: Node by Node Downstream Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cascade Flow Diagram */}
        <div className="lg:col-span-8 space-y-4">
          {bookings.map((booking, idx) => {
            const edge = edges.find(e => e.fromBookingId === booking.id);
            const isDisruptedRoot = booking.status === 'cancelled' || booking.status === 'delayed';
            const isImpacted = booking.status === 'impacted' || booking.status === 'missed';
            const isAtRisk = booking.status === 'at_risk';

            let statusBorder = 'border-slate-800';
            let statusBg = 'bg-slate-900/50';
            let statusTextColor = 'text-cyan-400';

            if (isDisruptedRoot) {
              statusBorder = 'border-red-500/60 shadow-lg shadow-red-950/30';
              statusBg = 'bg-red-950/30';
              statusTextColor = 'text-red-400';
            } else if (isImpacted) {
              statusBorder = 'border-red-500/40';
              statusBg = 'bg-red-950/20';
              statusTextColor = 'text-red-400';
            } else if (isAtRisk) {
              statusBorder = 'border-amber-500/40';
              statusBg = 'bg-amber-950/20';
              statusTextColor = 'text-amber-400';
            } else if (booking.status === 'recovered') {
              statusBorder = 'border-emerald-500/40';
              statusBg = 'bg-emerald-950/20';
              statusTextColor = 'text-emerald-400';
            }

            return (
              <React.Fragment key={booking.id}>
                <div
                  onClick={() => onSelectBooking(booking.id)}
                  className={`p-5 rounded-2xl border ${statusBorder} ${statusBg} backdrop-blur-md transition-all hover:scale-[1.01] cursor-pointer relative overflow-hidden`}
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-950 flex items-center justify-center font-mono font-bold text-xs text-slate-300 border border-slate-800">
                        0{idx + 1}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-slate-100">{booking.title}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                            {booking.providerCode}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {booking.origin} → {booking.destination}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <div className="text-right">
                        <div className="text-xs font-mono text-slate-300 font-semibold">
                          {booking.departureTime}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">
                          ₹{booking.price.toLocaleString('en-IN')}
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md uppercase border ${
                        booking.status === 'cancelled' || booking.status === 'impacted' || booking.status === 'missed' ? 'bg-red-950/80 border-red-500/50 text-red-300' :
                        booking.status === 'delayed' || booking.status === 'at_risk' ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' :
                        booking.status === 'recovered' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300' :
                        'bg-cyan-950/80 border-cyan-500/50 text-cyan-300'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>

                  {/* Impact explanation note if disrupted or impacted */}
                  {booking.notes && (
                    <div className="mt-2 text-xs font-mono p-2.5 rounded-lg bg-slate-950/70 border border-slate-800/80 text-slate-300 flex items-start space-x-2">
                      <span className="text-amber-400 font-bold">ℹ</span>
                      <span>{booking.notes}</span>
                    </div>
                  )}
                </div>

                {/* Connecting Edge Buffer Gauge */}
                {edge && (
                  <div className="flex items-center justify-center my-1 relative">
                    <div className="flex items-center space-x-3 px-4 py-1.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono shadow-md">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-400">Connection Buffer:</span>
                      <span className={`font-bold ${
                        edge.status === 'broken' || edge.actualBufferMinutes < 0 ? 'text-red-400 animate-pulse' :
                        edge.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {edge.actualBufferMinutes < 0
                          ? `BROKEN (${Math.abs(edge.actualBufferMinutes)}m DEFICIT)`
                          : edge.status === 'broken'
                          ? 'BROKEN / VIOLATED'
                          : `${edge.actualBufferMinutes} MINS`}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        (min {edge.minimumBufferMinutes}m required)
                      </span>
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Right Column: Mathematical Impact Assessment & Immediate Recovery Action */}
        <div className="lg:col-span-4 space-y-6">
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
          <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-3">
            <div className="text-cyan-400 font-semibold flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4" />
              <span>DETERMINISTIC COMPLIANCE AUDIT</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Calculations are enforced via versioned rules engines: <br />
              • <strong className="text-slate-200">DGCA CAR Sec 3 Series M IV</strong>: Mandatory 100% airline refund on cancellation. <br />
              • <strong className="text-slate-200">IRCTC PRS Rule 73A</strong>: Connecting ticket full refund via online TDR.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

