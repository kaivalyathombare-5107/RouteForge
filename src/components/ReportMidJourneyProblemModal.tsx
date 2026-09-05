import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertOctagon,
  AlertTriangle,
  X,
  ShieldAlert,
  Plane,
  Train,
  Building2,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { DISRUPTION_SCENARIOS } from '../lib/demo-data';

interface ReportMidJourneyProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerDisruption: (scenarioId: string, customDetails?: {
    type: 'delay' | 'cancellation' | 'missed_connection';
    delayMinutes: number;
    reason: string;
    mode: string;
  }) => void;
}

export const ReportMidJourneyProblemModal: React.FC<ReportMidJourneyProblemModalProps> = ({
  isOpen,
  onClose,
  onTriggerDisruption,
}) => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('flight_delay_90');
  const [activeTab, setActiveTab] = useState<'curated' | 'custom'>('curated');
  
  // Custom incident state
  const [customMode, setCustomMode] = useState<'flight' | 'train' | 'hotel' | 'transit'>('flight');
  const [customType, setCustomType] = useState<'delay' | 'cancellation' | 'missed_connection'>('delay');
  const [customDelayMinutes, setCustomDelayMinutes] = useState<number>(90);
  const [customReason, setCustomReason] = useState<string>('Incoming aircraft delay and severe runway congestion');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleTriggerCurated = (scenarioId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onTriggerDisruption(scenarioId);
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  const handleTriggerCustom = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onTriggerDisruption('custom', {
        type: customType,
        delayMinutes: customType === 'cancellation' ? 0 : customDelayMinutes,
        reason: customReason || 'Mid-journey disruption reported by traveller',
        mode: customMode,
      });
      setIsSubmitting(false);
      onClose();
    }, 300);
  };

  const activeCuratedScenario = DISRUPTION_SCENARIOS.find((s) => s.id === selectedScenarioId) || DISRUPTION_SCENARIOS[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative w-full max-w-2xl rounded-3xl bg-[#0C0E14] border border-rose-500/40 p-6 sm:p-8 shadow-2xl shadow-rose-950/40 z-10 space-y-6 my-auto max-h-[92vh] flex flex-col justify-between overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between border-b border-rose-500/20 pb-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/60 flex items-center justify-center text-rose-300 shadow-lg shadow-rose-950/50 flex-shrink-0">
                <AlertOctagon className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-cinzel font-bold tracking-widest px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/50 text-rose-300 uppercase">
                    EMERGENCY SHIELD DISPATCH
                  </span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                </div>
                <h3 className="text-xl sm:text-2xl font-serif-display font-bold text-white mt-1">
                  Report Mid-Journey Problem
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Subtitle description */}
          <p className="text-xs sm:text-sm font-sans-luxury text-slate-300 leading-relaxed font-light">
            Instantly deploy the <strong className="text-white font-medium">ReRoute Disruption Shield</strong>. The autonomous statutory engine calculates your DGCA/IRCTC mandated refund, evaluates downstream palace arrival curfews, and synthesizes 3 verified recovery corridors.
          </p>

          {/* Tab Selector: Curated Fast Presets vs Custom Incident */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800 text-xs font-cinzel">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('curated');
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'curated'
                  ? 'bg-rose-950/70 border border-rose-500/40 text-rose-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ⚡ Verified Fast Scenarios ({DISRUPTION_SCENARIOS.length})
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveTab('custom');
              }}
              className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'custom'
                  ? 'bg-rose-950/70 border border-rose-500/40 text-rose-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              ✍️ Custom Incident Report
            </button>
          </div>

          {/* Tab 1: Curated Fast Scenarios */}
          {activeTab === 'curated' && (
            <div className="space-y-4">
              <label className="text-[11px] font-cinzel text-[#D4AF37] tracking-wider uppercase block">
                Select Active Disruption Scenario
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                {DISRUPTION_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenarioId === sc.id;
                  return (
                    <button
                      key={sc.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedScenarioId(sc.id);
                      }}
                      className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-rose-950/50 border-rose-500/80 text-white shadow-md shadow-rose-950/30'
                          : 'bg-slate-900/50 hover:bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[9px] font-cinzel font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-[#FCE7AC]">
                          {sc.badge}
                        </span>
                        <span className="text-[10px] font-mono text-rose-300 font-semibold">
                          {sc.disruptionType === 'cancellation' ? 'CANCELLED' : `+${sc.delayMinutes}m DELAY`}
                        </span>
                      </div>
                      <div className="text-xs font-semibold font-serif-display text-white line-clamp-1">
                        {sc.name.split(':')[1] || sc.name}
                      </div>
                      <div className="text-[10px] font-sans-luxury text-slate-400 line-clamp-2 mt-1">
                        {sc.reason}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Statutory Entitlement Preview for selected */}
              {activeCuratedScenario && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-gold-subtle/50 space-y-2">
                  <div className="flex items-center justify-between text-xs font-cinzel">
                    <span className="text-[#D4AF37] font-bold flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>STATUTORY RECOVERY AUDIT</span>
                    </span>
                    <span className="text-emerald-400 font-mono font-bold">100% Guaranteed</span>
                  </div>
                  <p className="text-[11px] font-sans-luxury text-slate-300 leading-relaxed">
                    Under <strong className="text-white">DGCA CAR Section 3</strong> & <strong className="text-white">IRCTC PRS Rule 73A</strong>, ReRoute will automatically queue a full fare refund of <strong className="text-[#FCE7AC]">₹7,060</strong> while synthesising express detour routes.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Custom Incident Report */}
          {activeTab === 'custom' && (
            <div className="space-y-4">
              {/* Segment Type Selector */}
              <div>
                <label className="text-[11px] font-cinzel text-[#D4AF37] tracking-wider uppercase block mb-2">
                  Affected Segment Type
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'flight', label: 'Flight', icon: Plane },
                    { id: 'train', label: 'Train', icon: Train },
                    { id: 'hotel', label: 'Hotel', icon: Building2 },
                    { id: 'transit', label: 'Cab / Shuttle', icon: Clock },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setCustomMode(item.id as any)}
                        className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                          customMode === item.id
                            ? 'bg-[#D4AF37]/20 border-gold-bright text-[#FCE7AC]'
                            : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-[10px] font-cinzel font-bold">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Problem Nature */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-cinzel text-slate-300 tracking-wider uppercase block mb-1">
                    Problem Nature
                  </label>
                  <select
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-sans-luxury text-white focus:outline-none focus:border-gold-bright"
                  >
                    <option value="delay">Flight / Train Delay</option>
                    <option value="cancellation">Carrier Operational Cancellation</option>
                    <option value="missed_connection">Missed Connecting Transfer</option>
                  </select>
                </div>

                {customType !== 'cancellation' && (
                  <div>
                    <label className="text-[11px] font-cinzel text-slate-300 tracking-wider uppercase block mb-1">
                      Reported Delay: <span className="text-[#D4AF37] font-bold">{customDelayMinutes} mins</span>
                    </label>
                    <input
                      type="range"
                      min={15}
                      max={360}
                      step={15}
                      value={customDelayMinutes}
                      onChange={(e) => setCustomDelayMinutes(Number(e.target.value))}
                      className="w-full accent-[#D4AF37] cursor-pointer mt-2"
                    />
                  </div>
                )}
              </div>

              {/* Problem Description */}
              <div>
                <label className="text-[11px] font-cinzel text-slate-300 tracking-wider uppercase block mb-1">
                  Incident Note / Carrier Explanation
                </label>
                <input
                  type="text"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder="e.g., Gate agent announced flight grounded due to technical snag..."
                  className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-gold-bright"
                />
              </div>
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-cinzel text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              CANCEL
            </button>

            {activeTab === 'curated' ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTriggerCurated(selectedScenarioId, e);
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-full font-cinzel text-xs font-bold bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl shadow-rose-950/60 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isSubmitting ? 'ENGAGING SHIELD...' : 'DEPLOY DISRUPTION SHIELD'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleTriggerCustom(e);
                }}
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-full font-cinzel text-xs font-bold bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-xl shadow-rose-950/60 transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                <span>{isSubmitting ? 'CALCULATING CASCADE...' : 'SUBMIT & ACTIVATE RECOVERY'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
