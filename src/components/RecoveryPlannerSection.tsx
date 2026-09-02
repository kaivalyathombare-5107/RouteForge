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
    { id: 'cheapest', label: 'CHEAPEST', desc: 'Max refund surplus' },
    { id: 'maximum_flexibility', label: 'MAX FLEXIBILITY', desc: '100% refundable & wide buffer' },
    { id: 'fewest_changes', label: 'FEWEST CHANGES', desc: 'Preserves existing trains' },
    { id: 'comfort', label: 'COMFORT', desc: 'Executive / wide-body' },
  ];

  if (isInfeasibleState) {
    return (
      <div className="w-full max-w-5xl mx-auto p-8 rounded-2xl bg-red-950/30 border border-red-500/50 backdrop-blur-xl text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-950 border border-red-500/60 flex items-center justify-center mx-auto text-red-400">
          <Zap className="w-8 h-8 animate-pulse" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-display text-white mb-2">
            NO FEASIBLE RECOVERY FOUND FOR CURRENT CONSTRAINTS
          </h2>
          <p className="text-slate-300 text-sm max-w-xl mx-auto font-light">
            No available train or air corridor can reach Jaipur prior to the 20:30 IST HackCelestial keynote entry curfew with the current departure window.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
          <button
            onClick={() => onChangePriority('fastest')}
            className="px-4 py-2.5 rounded-xl font-mono text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-slate-950 transition-colors"
          >
            SWITCH TO EARLIER FLIGHT (AI-864)
          </button>
          <button
            onClick={() => alert('Front desk hold request sent for late check-in at ITC Rajputana.')}
            className="px-4 py-2.5 rounded-xl font-mono text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors"
          >
            EXTEND HOTEL CHECK-IN WINDOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Preferences Bar */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
              MULTI-OBJECTIVE OPTIMIZATION PREFERENCES
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Current priority: <strong className="text-cyan-400 uppercase">{userPreferences.priority}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {priorities.map(p => (
            <button
              key={p.id}
              onClick={() => onChangePriority(p.id)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                userPreferences.priority === p.id
                  ? 'bg-cyan-950/80 border-cyan-500/80 text-cyan-200 shadow-md shadow-cyan-950/50'
                  : 'bg-slate-950/50 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-mono text-xs font-bold mb-0.5">{p.label}</div>
              <div className="text-[10px] text-slate-400 font-light truncate">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Recovery Plans Comparative Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold font-display text-slate-100 flex items-center space-x-2">
            <span>FEASIBLE RECOVERY PLANS</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
              {recoveryOptions.length} OPTIONS
            </span>
          </h3>
          <span className="text-xs font-mono text-slate-400 hidden sm:inline">
            Hover an option to view its 3D route branch
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {recoveryOptions.map((option, idx) => {
            const isSelected = selectedOptionId === option.id;
            const isRankOne = idx === 0;

            return (
              <div
                key={option.id}
                onMouseEnter={() => onHoverRecoveryOption(option)}
                onMouseLeave={() => onHoverRecoveryOption(null)}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden backdrop-blur-xl ${
                  isSelected
                    ? 'bg-emerald-950/40 border-emerald-500 shadow-xl shadow-emerald-950/50 scale-[1.02]'
                    : isRankOne
                    ? 'bg-slate-900/80 border-cyan-500/60 shadow-lg shadow-cyan-950/30'
                    : 'bg-slate-900/50 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Rank #1 Recommendation Badge */}
                {isRankOne && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-l from-cyan-500 to-blue-600 text-slate-950 font-mono text-[10px] font-bold rounded-bl-xl flex items-center space-x-1 shadow">
                    <Sparkles className="w-3 h-3" />
                    <span>#1 RECOMMENDED</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-400 font-semibold">
                      {option.strategy}
                    </span>
                    <h4 className="text-lg font-bold font-display text-slate-100 mt-2">
                      {option.title}
                    </h4>
                    <p className="text-xs text-slate-300 font-light mt-1 leading-relaxed">
                      {option.description}
                    </p>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {option.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800 text-slate-300">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Financial Reconciliation Box */}
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-slate-400">
                      <span>Alternate Rebooking Cost:</span>
                      <span className="text-slate-200 font-semibold">₹{option.additionalCost.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Mandated Refund Credit:</span>
                      <span className="text-emerald-400 font-semibold">-₹{option.refundRecoveryAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="border-t border-slate-800 pt-1.5 flex justify-between font-bold">
                      <span className="text-slate-300">Net Financial Impact:</span>
                      <span className={option.netFinancialImpact <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                        {option.netFinancialImpact < 0 ? `-₹${Math.abs(option.netFinancialImpact)} (Surplus)` : `+₹${option.netFinancialImpact}`}
                      </span>
                    </div>
                  </div>

                  {/* Step Sequence Preview */}
                  <div className="space-y-2">
                    <div className="text-[11px] font-mono text-slate-400 uppercase">Execution Steps:</div>
                    {option.steps.map((step, sIdx) => (
                      <div key={step.id} className="text-xs font-mono p-2 rounded-lg bg-slate-950/40 border border-slate-850 flex items-start space-x-2">
                        <span className="text-cyan-400 font-bold">0{sIdx + 1}</span>
                        <div className="leading-tight">
                          <div className="text-slate-200 font-medium">{step.title}</div>
                          <div className="text-[10px] text-slate-500">{step.timing} • {step.provider}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Select CTA */}
                <div className="mt-6 pt-4 border-t border-slate-800">
                  <div className="text-[11px] font-mono text-slate-400 mb-3 italic">
                    {option.matchReason}
                  </div>
                  <button
                    id={`btn-select-plan-${option.id}`}
                    onClick={() => onSelectRecoveryOption(option)}
                    className="w-full py-3 rounded-xl font-mono text-xs font-bold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-950/50 flex items-center justify-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
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
