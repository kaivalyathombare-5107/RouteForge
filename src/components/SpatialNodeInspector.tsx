import React from 'react';
import { X, ShieldCheck, Clock, MapPin, Tag, ExternalLink, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { Booking, TripEdge } from '../types';

interface SpatialNodeInspectorProps {
  booking: Booking | null;
  edges: TripEdge[];
  onClose: () => void;
  onNavigateToRefunds: () => void;
  onSimulateNodeDisruption: (bookingId: string) => void;
  onCancelBooking?: (bookingId: string) => void;
}

export const SpatialNodeInspector: React.FC<SpatialNodeInspectorProps> = ({
  booking,
  edges,
  onClose,
  onNavigateToRefunds,
  onSimulateNodeDisruption,
  onCancelBooking,
}) => {
  if (!booking) return null;

  const incomingEdge = edges.find(e => e.toBookingId === booking.id);
  const outgoingEdge = edges.find(e => e.fromBookingId === booking.id);

  const isDisrupted = booking.status === 'cancelled' || booking.status === 'delayed' || booking.status === 'impacted';

  return (
    <div className="absolute top-4 right-4 z-20 w-full max-w-sm p-5 rounded-2xl bg-[#0B0D13]/95 backdrop-blur-2xl border border-gold-bright shadow-2xl space-y-4 text-slate-100 font-sans-luxury animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-gold-subtle pb-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase font-cinzel font-bold px-2 py-0.5 rounded bg-slate-950 text-[#D4AF37] border border-gold-subtle">
              {booking.type}
            </span>
            {booking.isImportedStatus && (
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                Imported Status
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold font-serif-display text-white mt-1">
            {booking.title}
          </h3>
          <div className="text-xs font-mono text-slate-400">
            {booking.provider} • {booking.referenceCode}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-slate-950 border border-gold-subtle text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Status & Fare Card */}
      <div className="p-3 rounded-xl bg-slate-950/90 border border-gold-subtle space-y-2 text-xs font-mono">
        <div className="flex justify-between">
          <span className="text-slate-400">Live Telemetry:</span>
          <span className={`font-bold uppercase ${
            isDisrupted ? 'text-rose-400' : booking.status === 'recovered' ? 'text-emerald-400' : 'text-[#D4AF37]'
          }`}>
            {booking.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Verified Timestamp:</span>
          <span className="text-slate-300">{booking.lastVerifiedAt}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Reserved Berth / Seat:</span>
          <span className="text-slate-200 font-semibold">{booking.seatOrRoom || 'Guaranteed'}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-slate-400">Published Tariff:</span>
          <span className="text-[#FCE7AC] font-serif-display font-bold text-sm">₹{booking.price.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Spatial Location & Schedule */}
      <div className="space-y-2 text-xs text-slate-300">
        <div className="flex items-start space-x-2">
          <MapPin className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5" />
          <div className="leading-tight">
            <span className="text-slate-400 text-[10px] block">Location Venue:</span>
            <div className="text-slate-200">{booking.location.venue} ({booking.location.city})</div>
          </div>
        </div>
        <div className="flex items-start space-x-2">
          <Clock className="w-3.5 h-3.5 text-[#D4AF37] mt-0.5" />
          <div className="leading-tight">
            <span className="text-slate-400 text-[10px] block">Timing Schedule:</span>
            <div className="text-[#F3E5AB] font-mono">{booking.departureTime} → {booking.arrivalTime}</div>
          </div>
        </div>
      </div>

      {/* Statutory Policy Summary */}
      {booking.policy && (
        <div className="p-3 rounded-xl bg-slate-950/70 border border-gold-subtle space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[10px] text-[#D4AF37] font-cinzel font-bold">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3 h-3" />
              <span>{booking.policy.ruleId}</span>
            </span>
            <span>{booking.policy.policyVersion}</span>
          </div>
          <p className="text-[11px] font-sans-luxury text-slate-400 leading-snug">
            {booking.policy.termsSummary}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-2 border-t border-gold-subtle flex flex-col gap-2">
        <button
          onClick={onNavigateToRefunds}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-gold-subtle text-xs font-cinzel text-[#FCE7AC] flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
        >
          <span>VIEW STATUTORY REFUND RULES</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#D4AF37]" />
        </button>

        {!isDisrupted && (
          <button
            onClick={() => onSimulateNodeDisruption(booking.id)}
            className="w-full py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/40 border border-rose-500/40 text-xs font-cinzel text-rose-300 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>TRIGGER DELAY ON THIS NODE</span>
          </button>
        )}

        {booking.status !== 'cancelled' && onCancelBooking && (
          <button
            onClick={() => onCancelBooking(booking.id)}
            className="w-full py-2 rounded-xl bg-slate-950 hover:bg-slate-900 border border-gold-subtle text-xs font-cinzel text-slate-300 hover:text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
          >
            <span>CANCEL BOOKING (OFFICIAL PARTNER)</span>
          </button>
        )}
      </div>
    </div>
  );
};
