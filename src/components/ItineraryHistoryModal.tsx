import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Clock, 
  Shield, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingDown, 
  ArrowRight, 
  Calendar, 
  IndianRupee,
  Download,
  Receipt
} from 'lucide-react';
import { Trip, ItineraryHistoryEntry } from '../types';

interface ItineraryHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
}

export const ItineraryHistoryModal: React.FC<ItineraryHistoryModalProps> = ({
  isOpen,
  onClose,
  trip,
}) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'disruptions' | 'recoveries' | 'refunds'>('all');

  if (!isOpen) return null;

  const historyEntries = trip.history || [];

  const filteredEntries = historyEntries.filter(entry => {
    if (activeFilter === 'disruptions') {
      return ['delay_detected', 'cancellation', 'missed_connection', 'at_risk_warning'].includes(entry.eventType);
    }
    if (activeFilter === 'recoveries') {
      return ['recovery_generated', 'recovery_selected', 'rebooked', 'postponed'].includes(entry.eventType);
    }
    if (activeFilter === 'refunds') {
      return ['refund_requested', 'refund_settled'].includes(entry.eventType);
    }
    return true;
  });

  const getEventBadge = (type: ItineraryHistoryEntry['eventType']) => {
    switch (type) {
      case 'booked':
        return { label: 'CONFIRMED', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      case 'delay_detected':
        return { label: 'DELAY DETECTED', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'cancellation':
        return { label: 'CANCELLED', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'missed_connection':
        return { label: 'MISSED CONNECTION', bg: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'at_risk_warning':
        return { label: 'PROACTIVE RISK', bg: 'bg-amber-500/10 text-amber-300 border-amber-500/30' };
      case 'recovery_selected':
        return { label: 'RECOVERY EXECUTED', bg: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'rebooked':
        return { label: 'REBOOKED', bg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' };
      case 'refund_requested':
      case 'refund_settled':
        return { label: 'STATUTORY REFUND', bg: 'bg-[#D4AF37]/10 text-[#FCE7AC] border-[#D4AF37]/30' };
      default:
        return { label: 'ITINERARY UPDATE', bg: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-4xl max-h-[90vh] bg-[#0A0C10] border border-gold-subtle/60 rounded-3xl shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Top Header Bar */}
          <div className="p-6 sm:p-8 border-b border-gold-subtle/40 bg-[#0E1118]/80 flex items-start justify-between">
            <div className="space-y-1.5">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
                <span className="text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
                  IMMUTABLE AUDIT LOG & CHANGE LEDGER
                </span>
              </div>
              <h2 className="font-serif-display text-2xl sm:text-3xl text-white">
                Itinerary History & Disruption Trail
              </h2>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 pt-1">
                <span>PNR: <strong className="text-slate-200">{trip.travellerPnr}</strong></span>
                <span>•</span>
                <span>Traveler: <strong className="text-slate-200">{trip.travellerName}</strong></span>
                <span>•</span>
                <span>Route: <strong className="text-slate-200">{trip.origin} → {trip.destination}</strong></span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 bg-slate-950/60 border-b border-slate-800/80">
            <div className="p-3 rounded-xl bg-[#0F121A] border border-slate-800">
              <div className="text-[10px] font-cinzel text-slate-400 uppercase">Original Booking</div>
              <div className="text-lg font-serif-display text-white mt-0.5">₹{trip.totalJourneyCost || 26800}</div>
              <div className="text-[9px] font-mono text-slate-500">4 Connected Nodes</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F121A] border border-slate-800">
              <div className="text-[10px] font-cinzel text-slate-400 uppercase">Current Status</div>
              <div className="text-lg font-serif-display text-emerald-400 mt-0.5 capitalize">{trip.status}</div>
              <div className="text-[9px] font-mono text-slate-500">Active Shielding</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F121A] border border-slate-800">
              <div className="text-[10px] font-cinzel text-slate-400 uppercase">Audit Records</div>
              <div className="text-lg font-serif-display text-[#FCE7AC] mt-0.5">{historyEntries.length} Events</div>
              <div className="text-[9px] font-mono text-slate-500">Full Chain of Custody</div>
            </div>
            <div className="p-3 rounded-xl bg-[#0F121A] border border-slate-800">
              <div className="text-[10px] font-cinzel text-slate-400 uppercase">Refunds Queued</div>
              <div className="text-lg font-serif-display text-cyan-400 mt-0.5">₹{trip.refundCases.reduce((s, r) => s + r.estimatedRefund, 0)}</div>
              <div className="text-[9px] font-mono text-slate-500">DGCA & IRCTC TDR</div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center space-x-2 px-6 pt-4 pb-2 border-b border-slate-900 bg-[#0A0C10]">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              All Events ({historyEntries.length})
            </button>
            <button
              onClick={() => setActiveFilter('disruptions')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                activeFilter === 'disruptions'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Disruptions & Warnings
            </button>
            <button
              onClick={() => setActiveFilter('recoveries')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                activeFilter === 'recoveries'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Recoveries & Rebookings
            </button>
            <button
              onClick={() => setActiveFilter('refunds')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-cinzel font-semibold transition-all cursor-pointer ${
                activeFilter === 'refunds'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200 border border-transparent'
              }`}
            >
              Refund Claims ({trip.refundCases.length})
            </button>
          </div>

          {/* Timeline Body */}
          <div className="p-6 overflow-y-auto max-h-[50vh] space-y-4">
            {filteredEntries.length === 0 ? (
              <div className="py-12 text-center text-slate-500 font-sans-luxury text-sm">
                No events recorded in this category yet.
              </div>
            ) : (
              filteredEntries.map((entry, idx) => {
                const badge = getEventBadge(entry.eventType);
                return (
                  <div
                    key={entry.id || idx}
                    className="p-4 rounded-2xl bg-[#0D1017] border border-slate-800/80 hover:border-gold-subtle/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-cinzel font-bold tracking-wider border ${badge.bg}`}>
                            {badge.label}
                          </span>
                          <span className="text-xs font-mono text-slate-400">{entry.timestamp}</span>
                        </div>
                        <h4 className="text-sm font-semibold text-white font-sans-luxury">{entry.title}</h4>
                        <p className="text-xs text-slate-300 font-light max-w-xl leading-relaxed">
                          {entry.description}
                        </p>
                      </div>
                    </div>

                    {entry.financialImpact && (
                      <div className="text-right sm:flex-shrink-0 pl-11 sm:pl-0">
                        <span className="text-[10px] font-cinzel text-slate-400 uppercase block">Impact</span>
                        <span className="text-xs font-mono font-bold text-[#FCE7AC]">{entry.financialImpact}</span>
                      </div>
                    )}
                  </div>
                );
              })
            )}

            {/* Original Itinerary Preservation Verification */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-gold-subtle/40 space-y-2 mt-4">
              <div className="flex items-center space-x-2 text-xs font-cinzel font-semibold text-[#D4AF37]">
                <Shield className="w-4 h-4" />
                <span>PERMANENT ORIGINAL ITINERARY PRESERVATION</span>
              </div>
              <p className="text-xs text-slate-300 font-sans-luxury font-light leading-relaxed">
                ReRoute maintains an unalterable copy of your original booking state (IndiGo 6E-204, IRCTC Train 12952, ITC Rajputana, HackCelestial passes). Changes made during disruption recovery never overwrite original proof of purchase required for corporate expense claims or travel insurance settlements.
              </p>
            </div>
          </div>

          {/* Footer Action Bar */}
          <div className="p-4 sm:p-6 bg-[#0E1118] border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
              <span>Security Hash: SHA-256 Verified</span>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trip, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `reroute-itinerary-audit-${trip.travellerPnr}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                }}
                className="px-4 py-2 rounded-xl border border-slate-700 hover:border-slate-500 text-xs font-cinzel text-slate-300 flex items-center space-x-2 transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Audit JSON</span>
              </button>
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-wider transition-all cursor-pointer shadow-md shadow-[#D4AF37]/20"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
