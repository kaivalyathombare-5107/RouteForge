import React from 'react';
import { AlertOctagon, ArrowDown, Clock, ShieldCheck, AlertTriangle, ArrowRight, Zap, CheckCircle } from 'lucide-react';
import { Booking, TripEdge, DisruptionEvent } from '../types';

interface DisruptionCascadeViewProps {
  bookings: Booking[];
  edges: TripEdge[];
  isDisrupted: boolean;
  onSimulateScenario: (scenarioType: 'flight_cancel' | 'flight_delay_90' | 'train_divert' | 'infeasible_curfew') => void;
  onReset: () => void;
  onOpenRecovery: () => void;
  onSelectBooking: (id: string) => void;
}

export const DisruptionCascadeView: React.FC<DisruptionCascadeViewProps> = ({
  bookings,
  edges,
  isDisrupted,
  onSimulateScenario,
  onReset,
  onOpenRecovery,
  onSelectBooking,
}) => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Top Header & Simulation Controls */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl">
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

        {/* Quick Scenario Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="scenario-btn-flight-cancel"
            onClick={() => onSimulateScenario('flight_cancel')}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-red-950/70 hover:bg-red-900/70 border border-red-500/50 text-red-200 shadow-md transition-all cursor-pointer"
          >
            Aviation Cancel (Default)
          </button>
          <button
            id="scenario-btn-flight-delay"
            onClick={() => onSimulateScenario('flight_delay_90')}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-amber-950/70 hover:bg-amber-900/70 border border-amber-500/50 text-amber-200 shadow-md transition-all cursor-pointer"
          >
            Flight Delay +90m
          </button>
          <button
            id="scenario-btn-train-divert"
            onClick={() => onSimulateScenario('train_divert')}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-blue-950/70 hover:bg-blue-900/70 border border-blue-500/50 text-cyan-200 shadow-md transition-all cursor-pointer"
          >
            Train Diverted (TDR)
          </button>
          <button
            id="scenario-btn-reset"
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl text-xs font-mono font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all cursor-pointer"
          >
            Reset Graph
          </button>
        </div>
      </div>

      {/* Main Cascade Visualization: Node by Node Downstream Impact */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Cascade Flow Diagram */}
        <div className="lg:col-span-8 space-y-4">
          {bookings.map((booking, idx) => {
            const edge = edges.find(e => e.fromBookingId === booking.id);
            const isDisruptedRoot = booking.status === 'cancelled' || booking.status === 'delayed';
            const isImpacted = booking.status === 'impacted';
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
                        booking.status === 'cancelled' || booking.status === 'impacted' ? 'bg-red-950/80 border-red-500/50 text-red-300' :
                        booking.status === 'delayed' || booking.status === 'at_risk' ? 'bg-amber-950/80 border-amber-500/50 text-amber-300' :
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
                        edge.status === 'broken' ? 'text-red-400 animate-pulse' :
                        edge.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {edge.status === 'broken' ? 'BROKEN / VIOLATED' : `${edge.actualBufferMinutes} MINS`}
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
                <span className="font-semibold text-red-400">{isDisrupted ? 'Flight 6E-204 Cancelled' : 'None (Active)'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Downstream Impacted:</span>
                <span className="font-semibold text-slate-200">{isDisrupted ? '3 Bookings' : '0 Bookings'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Transfer Time Deficit:</span>
                <span className="font-semibold text-amber-400">{isDisrupted ? '-990 mins (Missed Train)' : 'Nominal (+80m)'}</span>
              </div>
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Statutory Refund Value:</span>
                <span className="font-semibold text-emerald-400">₹7,060 (100% Eligible)</span>
              </div>
            </div>

            {isDisrupted && (
              <button
                id="btn-open-recovery-from-cascade"
                onClick={onOpenRecovery}
                className="w-full py-3 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 flex items-center justify-center space-x-2 shadow-xl shadow-emerald-950/40 transition-all cursor-pointer"
              >
                <span>GENERATE RECOVERY OPTIONS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
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
