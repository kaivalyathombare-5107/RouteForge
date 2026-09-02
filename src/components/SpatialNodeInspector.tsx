import React from 'react';
import { X, ShieldCheck, Clock, MapPin, Tag, ExternalLink, AlertTriangle, ArrowRight } from 'lucide-react';
import { Booking, TripEdge } from '../types';

interface SpatialNodeInspectorProps {
  booking: Booking | null;
  edges: TripEdge[];
  onClose: () => void;
  onNavigateToRefunds: () => void;
  onSimulateNodeDisruption: (bookingId: string) => void;
}

export const SpatialNodeInspector: React.FC<SpatialNodeInspectorProps> = ({
  booking,
  edges,
  onClose,
  onNavigateToRefunds,
  onSimulateNodeDisruption,
}) => {
  if (!booking) return null;

  const incomingEdge = edges.find(e => e.toBookingId === booking.id);
  const outgoingEdge = edges.find(e => e.fromBookingId === booking.id);

  const isDisrupted = booking.status === 'cancelled' || booking.status === 'delayed' || booking.status === 'impacted';

  return (
    <div className="absolute top-4 right-4 z-20 w-full max-w-sm p-5 rounded-2xl bg-[#05070B]/95 backdrop-blur-xl border border-cyan-500/40 shadow-2xl space-y-4 text-slate-100 font-mono animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-blue-950 text-cyan-400 border border-cyan-800">
              {booking.type}
            </span>
            {booking.isImportedStatus && (
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Imported status
              </span>
            )}
          </div>
          <h3 className="text-base font-bold font-display text-white mt-1">
            {booking.title}
          </h3>
          <div className="text-[11px] text-slate-400">
            {booking.provider} • {booking.referenceCode}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Telemetry Status Box */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
        <div className="flex justify-between">
          <span className="text-slate-500">Live Status:</span>
          <span className={`font-bold uppercase ${
            isDisrupted ? 'text-red-400' : booking.status === 'recovered' ? 'text-emerald-400' : 'text-cyan-400'
          }`}>
            {booking.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Last Verified:</span>
          <span className="text-slate-300">{booking.lastVerifiedAt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Seat / Allocation:</span>
          <span className="text-slate-200 font-semibold">{booking.seatOrRoom || 'Guaranteed'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-500">Ticket Fare:</span>
          <span className="text-emerald-400 font-bold">₹{booking.price.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Spatial Location & Times */}
      <div className="space-y-1.5 text-xs text-slate-300">
        <div className="flex items-start space-x-2">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 mt-0.5" />
          <div className="leading-tight">
            <span className="text-slate-400 text-[10px]">Location Venue:</span>
            <div>{booking.location.venue} ({booking.location.city})</div>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400 mt-0.5" />
          <div className="leading-tight">
            <span className="text-slate-400 text-[10px]">Timing Schedule:</span>
            <div>{booking.departureTime} → {booking.arrivalTime}</div>
          </div>
        </div>
      </div>

      {/* Statutory Policy Summary */}
      {booking.policy && (
        <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[10px] text-cyan-400 font-bold">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{booking.policy.ruleId}</span>
            </span>
            <span>{booking.policy.policyVersion}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-snug">
            {booking.policy.termsSummary}
          </p>
        </div>
      )}

      {/* Direct Quick Actions */}
      <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
        <button
          onClick={onNavigateToRefunds}
          className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-750 text-xs text-cyan-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
        >
          <span>VIEW APPLICABLE REFUND RULE</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {!isDisrupted && (
          <button
            onClick={() => onSimulateNodeDisruption(booking.id)}
            className="w-full py-2 rounded-xl bg-red-950/40 hover:bg-red-900/40 border border-red-500/30 text-xs text-red-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span>TRIGGER DELAY ON THIS NODE</span>
          </button>
        )}
      </div>
    </div>
  );
};
