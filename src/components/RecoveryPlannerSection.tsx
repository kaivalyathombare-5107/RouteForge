import React from 'react';
import { ShieldCheck, Zap, DollarSign, Clock, ArrowRight, CheckCircle2, Sliders, Info, Sparkles } from 'lucide-react';
import { RecoveryOption, UserPreferences, PriorityPreference } from '../types';

interface RecoveryPlannerSectionProps {
  recoveryOptions: RecoveryOption[];
  userPreferences: UserPreferences;
  onChangePriority: (priority: PriorityPreference) => void;
  onHoverRecoveryOption: (option: RecoveryOption | null) => void;
  onSelectRecoveryOption: (option: RecoveryOption) => void;
  selectedOptionId?: string | null;
  isInfeasibleState?: boolean;
}

export const RecoveryPlannerSection: React.FC<RecoveryPlannerSectionProps> = ({
  recoveryOptions,
  userPreferences,
  onChangePriority,
  onHoverRecoveryOption,
  onSelectRecoveryOption,
  selectedOptionId,
  isInfeasibleState = false,
}) => {
  const priorities: { id: PriorityPreference; label: string; desc: string }[] = [
    { id: 'fastest', label: 'FASTEST', desc: 'Minimal arrival delta' },
    { id: 'cheapest', label: 'MAX SURPLUS', desc: 'Max refund recovery' },
    { id: 'maximum_flexibility', label: 'MAX FLEXIBILITY', desc: '100% refundable & wide buffer' },
    { id: 'fewest_changes', label: 'FEWEST CHANGES', desc: 'Preserves existing trains' },
    { id: 'comfort', label: 'ROYAL COMFORT', desc: 'Executive / Maharaja suite' },
  ];

  if (isInfeasibleState) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 rounded-3xl bg-rose-950/20 border border-rose-500/40 backdrop-blur-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex items-center justify-center mx-auto text-rose-300">
          <Zap className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-serif-display text-white mb-2">
            No Feasible Autonomous Corridor For Current Parameters
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-sans-luxury font-light">
            No scheduled commercial train or scheduled flight can reach the royal palace prior to the check-in curfew with the current departure window.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onChangePriority('fastest')}
            className="px-5 py-2.5 rounded-full font-cinzel text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#A88325] text-slate-950 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
          >
            SWITCH TO EXPEDITED FLIGHT
          </button>
          <button
            onClick={() => alert('VIP Concierge hold request transmitted to the heritage hotel front desk.')}
            className="px-5 py-2.5 rounded-full font-cinzel text-xs text-[#FCE7AC] bg-slate-950/80 hover:bg-slate-900 border border-gold-subtle transition-colors cursor-pointer"
          >
            EXTEND HOTEL CHECK-IN WINDOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8">
      {/* Preferences Bar */}
      <div className="p-6 rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gold-subtle/50 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-xs font-cinzel font-semibold text-[#FCE7AC] uppercase tracking-wider">
              MULTI-OBJECTIVE OPTIMIZATION PREFERENCES
            </span>
          </div>
          <span className="text-[11px] font-sans-luxury text-slate-400">
            Current Priority: <strong className="text-[#D4AF37] font-cinzel uppercase">{userPreferences.priority}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {priorities.map(p => (
            <button
              key={p.id}
              onClick={() => onChangePriority(p.id)}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                userPreferences.priority === p.id
                  ? 'bg-gradient-to-b from-[#D4AF37]/25 to-slate-950 border-gold-bright text-[#FCE7AC] shadow-lg shadow-[#D4AF37]/10'
                  : 'bg-slate-950/60 border-gold-subtle/50 text-slate-400 hover:border-gold-subtle hover:text-slate-200'
              }`}
            >
              <div className="font-cinzel text-xs font-bold mb-1 tracking-wider">{p.label}</div>
              <div className="text-[11px] text-slate-400 font-sans-luxury font-light">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recovery Plans Comparative Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold font-serif-display text-white flex items-center space-x-2">
            <span>FEASIBLE RECOVERY PLANS</span>
            <span className="text-xs font-cinzel px-2.5 py-0.5 rounded-full bg-slate-950 border border-gold-subtle text-[#D4AF37]">
              {recoveryOptions.length} OPTIONS
            </span>
          </h3>
          <span className="text-xs font-sans-luxury text-slate-400 hidden sm:inline">
            Hover any option to trace its living 3D flightpath
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {recoveryOptions.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isRankOne = idx === 0;

            return (
              <div
                key={option.id}
                onMouseEnter={() => onHoverRecoveryOption(option)}
                onMouseLeave={() => onHoverRecoveryOption(null)}
                className={`p-6 rounded-3xl border transition-all flex flex-col justify-between relative overflow-hidden backdrop-blur-xl ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/80 shadow-2xl shadow-emerald-950/40 scale-[1.01]'
                    : isRankOne
                    ? 'bg-[#0E1017]/95 border-gold-bright shadow-xl shadow-[#D4AF37]/10'
                    : 'bg-[#0B0D13]/90 border-gold-subtle hover:border-gold-bright/60'
                }`}
              >
                {/* Rank #1 Recommendation Badge */}
                {isRankOne && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-[#D4AF37] to-[#A88325] text-slate-950 font-cinzel text-[10px] font-bold rounded-bl-xl flex items-center space-x-1 shadow-md">
                    <Sparkles className="w-3 h-3" />
                    <span>#1 RECOMMENDED</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-cinzel uppercase px-2.5 py-1 rounded-full bg-slate-950 border border-gold-subtle text-[#D4AF37] font-semibold">
                      {option.strategy}
                    </span>
                    <h4 className="text-base font-bold font-serif-display text-white mt-2.5 leading-snug">
                      {option.title}
                    </h4>
                    <p className="text-xs text-slate-300 font-sans-luxury font-light mt-1.5 leading-relaxed">
                      {option.description}
                    </p>
                  </div>

                  {/* Key Comparison Badges */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-950/70 border border-gold-subtle/30 text-[10px] font-mono">
                    <div>
                      <span className="text-slate-500 block">Changes:</span>
                      <span className="text-slate-200 font-bold">{option.numberOfChanges !== undefined ? `${option.numberOfChanges} Transfer` : '1 Transfer'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Arrival Delta:</span>
                      <span className={option.arrivalDeltaMinutes <= 30 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        +{option.arrivalDeltaMinutes}m
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Convenience:</span>
                      <span className="text-[#FCE7AC] font-bold">{option.convenienceRating || 9.2}/10</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Risk Level:</span>
                      <span className="text-cyan-300 font-bold capitalize">{option.riskLevel || 'low'}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {option.tags.map((tag, i) => (
                      <span key={i} className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-slate-950 border border-gold-subtle/40 text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Financial Reconciliation Box */}
                  <div className="p-3 rounded-2xl bg-slate-950/90 border border-gold-subtle space-y-1.5 text-xs font-mono">
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Rebooking Cost:</span>
                      <span className="text-slate-200 font-semibold">₹{option.additionalCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Refund Credit:</span>
                      <span className="text-emerald-400 font-semibold">-₹{option.refundRecoveryAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t border-gold-subtle/30 pt-1.5 flex justify-between font-bold text-xs">
                      <span className="text-slate-300">Net Impact:</span>
                      <span className={option.netFinancialImpact <= 0 ? 'text-emerald-400' : 'text-[#FCE7AC]'}>
                        {option.netFinancialImpact < 0 ? `-₹${Math.abs(option.netFinancialImpact)} (Surplus)` : `+₹${option.netFinancialImpact}`}
                      </span>
                    </div>
                  </div>

                  {/* Step Sequence Preview */}
                  <div className="space-y-1.5">
                    <div className="text-[10px] font-cinzel text-[#D4AF37] uppercase tracking-wider">SEQUENCE:</div>
                    {option.steps.slice(0, 2).map((step, sIdx) => (
                      <div key={step.id} className="text-xs p-2 rounded-xl bg-slate-950/60 border border-gold-subtle/30 flex items-start space-x-2">
                        <span className="text-[#D4AF37] font-cinzel font-bold text-[10px]">0{sIdx + 1}</span>
                        <div className="leading-tight">
                          <div className="text-slate-200 font-sans-luxury text-[11px] font-medium truncate">{step.title}</div>
                          <div className="text-[9px] font-mono text-slate-400">{step.timing} • {step.provider}</div>
                        </div>
                      </div>
                    ))}
                    {option.steps.length > 2 && (
                      <div className="text-[10px] font-mono text-slate-500 pl-2">
                        +{option.steps.length - 2} more coordinated step(s)
                      </div>
                    )}
                  </div>
                </div>

                {/* Select CTA */}
                <div className="mt-5 pt-3 border-t border-gold-subtle/40">
                  <div className="text-[10px] font-sans-luxury text-slate-400 mb-2.5 italic line-clamp-2">
                    {option.matchReason}
                  </div>
                  <button
                    id={`btn-select-plan-${option.id}`}
                    onClick={() => onSelectRecoveryOption(option)}
                    className="w-full py-2.5 rounded-full font-cinzel text-xs font-bold bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
                  >
                    <span>SELECT THIS PLAN</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
