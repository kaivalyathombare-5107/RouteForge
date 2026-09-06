import React, { useState } from 'react';
import {
  ShieldCheck,
  Zap,
  DollarSign,
  Clock,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Sparkles,
  Check,
  Download,
  Phone,
  MessageSquare,
  Building,
  Car,
  RefreshCw,
} from 'lucide-react';
import { RecoveryOption, UserPreferences, PriorityPreference } from '../types';

interface RecoveryPlannerSectionProps {
  recoveryOptions: RecoveryOption[];
  userPreferences: UserPreferences;
  onChangePriority: (priority: PriorityPreference) => void;
  onHoverRecoveryOption: (option: RecoveryOption | null) => void;
  onSelectRecoveryOption: (option: RecoveryOption) => void;
  onConfirmPlanDirectly?: (option: RecoveryOption) => void;
  confirmedPlan?: RecoveryOption | null;
  onResetConfirmedPlan?: () => void;
  onNavigateToTimeline?: () => void;
  selectedOptionId?: string | null;
  isInfeasibleState?: boolean;
}

export const RecoveryPlannerSection: React.FC<RecoveryPlannerSectionProps> = ({
  recoveryOptions,
  userPreferences,
  onChangePriority,
  onHoverRecoveryOption,
  onSelectRecoveryOption,
  onConfirmPlanDirectly,
  confirmedPlan,
  onResetConfirmedPlan,
  onNavigateToTimeline,
  selectedOptionId,
  isInfeasibleState = false,
}) => {
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);
  const [copiedDesk, setCopiedDesk] = useState<boolean>(false);

  const priorities: { id: PriorityPreference; label: string; desc: string }[] = [
    { id: 'fastest', label: 'FASTEST', desc: 'Minimal arrival delta' },
    { id: 'cheapest', label: 'MAX SURPLUS', desc: 'Max refund recovery' },
    { id: 'maximum_flexibility', label: 'MAX FLEXIBILITY', desc: '100% refundable & wide buffer' },
    { id: 'fewest_changes', label: 'FEWEST CHANGES', desc: 'Preserves existing trains' },
    { id: 'comfort', label: 'ROYAL COMFORT', desc: 'Executive / Maharaja suite' },
  ];

  // Derive active confirmed plan
  const activePlan = confirmedPlan || null;

  const handleDownloadDossier = () => {
    if (!activePlan) return;
    setDownloadSuccess(true);
    const content = `=====================================================
RE ROUTE PRIVÉ // OFFICIAL RECOVERY CORRIDOR DOSSIER
Mission Reference: RR-CORRIDOR-${activePlan.id.toUpperCase()}-CONFIRMED
Strategy: ${activePlan.strategy.toUpperCase()}
Generated: ${new Date().toLocaleString('en-IN')} IST
=====================================================

CORRIDOR TITLE: ${activePlan.title}
MATCH RATIONALE: ${activePlan.matchReason || activePlan.description}

OPERATIONAL METRICS:
- Arrival Delta: ${activePlan.arrivalDeltaMinutes <= 0 ? `${activePlan.arrivalDeltaMinutes}m (Early)` : `+${activePlan.arrivalDeltaMinutes}m`}
- Transfers / Changes: ${activePlan.numberOfChanges !== undefined ? activePlan.numberOfChanges : 1}
- Convenience Rating: ${activePlan.convenienceRating || 9.5}/10
- Risk Level: ${activePlan.riskLevel || 'Minimal'} (Zero penalty shield applied)

FINANCIAL RECONCILIATION:
- Additional Rebooking Fare: INR ${activePlan.additionalCost.toLocaleString('en-IN')}
- Statutory Refund Recovery: -INR ${activePlan.refundRecoveryAmount.toLocaleString('en-IN')} (DGCA CAR / IRCTC TDR)
- Net Settled Impact: INR ${activePlan.netFinancialImpact.toLocaleString('en-IN')}

COORDINATED ITINERARY STEPS:
${activePlan.steps.map((s, idx) => `[0${idx + 1}] ${s.title}
    Provider: ${s.provider} | Timing: ${s.timing}
    Details: ${s.details}
    Status: CONFIRMED & SEAT LOCKED`).join('\n\n')}

PALACE & CONCIERGE PROTECTIONS:
- Taj Lake Palace Udaipur: Late check-in waiver secured (Arrival valid till 23:59 IST)
- Airport Chauffeur: Mercedes-Benz E-Class assigned with flight gate tracking
- Chief Concierge Desk: 24/7 Priority Emergency WhatsApp line active

=====================================================
Certified 100% compliant with DGCA CAR Sec 3 Series M & IRCTC Charter.
=====================================================`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ReRoute_Corridor_Dossier_${activePlan.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);

    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleCopyConciergeChannel = () => {
    navigator.clipboard?.writeText('+91 98200 88200 (ReRoute Privé Concierge WhatsApp)');
    setCopiedDesk(true);
    setTimeout(() => setCopiedDesk(false), 3000);
  };

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
      <div className="p-6 sm:p-7 rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gold-subtle/50 pb-3">
          <div className="flex items-center space-x-2">
            {activePlan ? (
              <>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-cinzel font-semibold text-emerald-400 uppercase tracking-wider">
                  ACTIVE RECOVERY CORRIDOR LOCKED & MONITORED
                </span>
              </>
            ) : (
              <>
                <Sliders className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-cinzel font-semibold text-[#FCE7AC] uppercase tracking-wider">
                  MULTI-OBJECTIVE OPTIMIZATION PREFERENCES
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] sm:text-xs font-sans-luxury text-slate-400">
              Active Optimization: <strong className="text-[#D4AF37] font-cinzel uppercase">{userPreferences.priority}</strong>
            </span>
            {activePlan && onResetConfirmedPlan && (
              <button
                id="btn-re-evaluate-other-corridors"
                onClick={onResetConfirmedPlan}
                className="px-3 py-1 rounded-full bg-slate-900 hover:bg-slate-800 border border-gold-subtle/50 text-[10px] font-cinzel text-[#FCE7AC] hover:text-white transition-all flex items-center space-x-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3 h-3 text-[#D4AF37]" />
                <span>COMPARE OTHER PLANS</span>
              </button>
            )}
          </div>
        </div>

        {/* Priority preference selectors (visible when not confirmed or for fine-tuning) */}
        {!activePlan ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {priorities.map(p => (
              <button
                key={p.id}
                onClick={() => onChangePriority(p.id)}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer min-h-[84px] h-auto flex flex-col justify-between break-words ${
                  userPreferences.priority === p.id
                    ? 'bg-gradient-to-b from-[#D4AF37]/25 to-slate-950 border-gold-bright text-[#FCE7AC] shadow-lg shadow-[#D4AF37]/10'
                    : 'bg-slate-950/60 border-gold-subtle/50 text-slate-400 hover:border-gold-subtle hover:text-slate-200'
                }`}
              >
                <div className="font-cinzel text-xs font-bold mb-1 tracking-wider leading-snug break-words">{p.label}</div>
                <div className="text-[11px] text-slate-400 font-sans-luxury font-light leading-relaxed break-words">{p.desc}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs font-sans-luxury">
            <div className="flex items-center space-x-3 text-emerald-300">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span>
                Autonomous disruption shield is actively orchestrating this corridor. All other hypothetical suggestions have been dismissed to maintain focus on your active journey.
              </span>
            </div>
            {onResetConfirmedPlan && (
              <button
                onClick={onResetConfirmedPlan}
                className="text-xs font-cinzel text-[#D4AF37] hover:underline shrink-0 cursor-pointer"
              >
                Need to change plan? Click here
              </button>
            )}
          </div>
        )}
      </div>

      {/* Recovery Plans Comparative Cards / Confirmed Detailed Master Dossier */}
      <div className="space-y-6">
        {activePlan ? (
          /* =========================================================================
             CONFIRMED PLAN ONLY: DETAILED MASTER RECOVERY EXECUTION DOSSIER
             ========================================================================= */
          <div className="w-full space-y-6 animate-fadeIn">
            {/* Master Header Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-slate-900/95 to-[#0B0D13]/95 border-2 border-emerald-500/60 backdrop-blur-2xl shadow-2xl shadow-emerald-950/40 relative overflow-hidden space-y-6">
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gold-subtle/30 pb-6">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/60 text-emerald-300 font-cinzel text-xs font-bold flex items-center space-x-2 shadow-sm">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span>CONFIRMED & ACTIVE CORRIDOR</span>
                    </span>
                    <span className="px-3 py-1 rounded-full bg-slate-950 border border-gold-subtle text-[#D4AF37] font-cinzel text-[11px] font-semibold uppercase tracking-wider">
                      STRATEGY: {activePlan.strategy}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      DOSSIER ID: RR-CORRIDOR-{activePlan.id.toUpperCase()}-CONFIRMED
                    </span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-serif-display text-white leading-tight">
                    {activePlan.title}
                  </h2>

                  <p className="text-sm sm:text-base text-slate-300 font-sans-luxury font-light leading-relaxed max-w-3xl">
                    {activePlan.description}
                  </p>

                  {activePlan.matchReason && (
                    <div className="p-3.5 rounded-2xl bg-black/50 border border-gold-subtle/30 text-xs sm:text-sm text-[#FCE7AC] font-sans-luxury italic flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span>{activePlan.matchReason}</span>
                    </div>
                  )}
                </div>

                {/* Primary Executive Actions */}
                <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
                  <button
                    id="btn-download-corridor-dossier"
                    onClick={handleDownloadDossier}
                    className="px-5 py-3 rounded-full font-cinzel text-xs sm:text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] text-slate-950 shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center space-x-2 transition-all transform active:scale-98 cursor-pointer"
                  >
                    {downloadSuccess ? (
                      <>
                        <Check className="w-4 h-4 text-slate-950" />
                        <span>DOSSIER DOWNLOADED</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 text-slate-950" />
                        <span>DOWNLOAD CORRIDOR DOSSIER</span>
                      </>
                    )}
                  </button>

                  {onNavigateToTimeline && (
                    <button
                      id="btn-view-on-3d-timeline"
                      onClick={onNavigateToTimeline}
                      className="px-5 py-3 rounded-full font-cinzel text-xs sm:text-sm font-bold bg-slate-950/90 hover:bg-slate-900 border border-gold-subtle text-slate-200 hover:text-white flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md"
                    >
                      <span>VIEW LIVING 3D TIMELINE</span>
                      <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
                    </button>
                  )}

                  {onResetConfirmedPlan && (
                    <button
                      id="btn-change-confirmed-plan"
                      onClick={onResetConfirmedPlan}
                      className="px-4 py-2 rounded-full font-cinzel text-[11px] text-slate-400 hover:text-[#FCE7AC] hover:bg-slate-950/60 border border-transparent hover:border-gold-subtle/40 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>MODIFY / SWITCH PLAN</span>
                    </button>
                  )}
                </div>
              </div>

              {/* 4 Telemetry Performance Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-gold-subtle/40 space-y-1.5">
                  <div className="text-[11px] font-cinzel text-slate-400 uppercase tracking-wider">Arrival Schedule Delta</div>
                  <div className="text-xl sm:text-2xl font-bold font-serif-display text-emerald-400">
                    {activePlan.arrivalDeltaMinutes <= 0 ? `${activePlan.arrivalDeltaMinutes}m (Early)` : `+${activePlan.arrivalDeltaMinutes}m delay mitigated`}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans-luxury">Palace check-in curfew safely preserved</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-gold-subtle/40 space-y-1.5">
                  <div className="text-[11px] font-cinzel text-slate-400 uppercase tracking-wider">Convenience & Luxury Rating</div>
                  <div className="text-xl sm:text-2xl font-bold font-serif-display text-[#FCE7AC]">
                    {activePlan.convenienceRating || '9.5 / 10'}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans-luxury">Seamless interline luggage transit</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-gold-subtle/40 space-y-1.5">
                  <div className="text-[11px] font-cinzel text-slate-400 uppercase tracking-wider">Route Structure</div>
                  <div className="text-xl sm:text-2xl font-bold font-serif-display text-slate-100">
                    {activePlan.numberOfChanges !== undefined ? `${activePlan.numberOfChanges} Transfer` : '1 Seamless Transfer'}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans-luxury">Optimized connecting buffer window</p>
                </div>

                <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-gold-subtle/40 space-y-1.5">
                  <div className="text-[11px] font-cinzel text-slate-400 uppercase tracking-wider">Net Financial Balance</div>
                  <div className="text-xl sm:text-2xl font-bold font-serif-display text-emerald-400 font-mono">
                    {activePlan.netFinancialImpact <= 0
                      ? `-₹${Math.abs(activePlan.netFinancialImpact).toLocaleString('en-IN')} (Surplus Credit)`
                      : `+₹${activePlan.netFinancialImpact.toLocaleString('en-IN')}`}
                  </div>
                  <p className="text-[11px] text-slate-400 font-sans-luxury">Statutory waiver directly credited</p>
                </div>
              </div>
            </div>

            {/* Coordinated Step Sequence Dossier */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-gold-subtle/40 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-cinzel font-semibold text-[#D4AF37] uppercase tracking-wider">
                    DETAILED EXECUTION BLUEPRINT
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white">
                    Sequential Mission Steps ({activePlan.steps.length} Confirmed Segments)
                  </h3>
                </div>
                <span className="text-xs font-cinzel px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 font-bold hidden sm:inline-block">
                  ALL LEGS REBOOKED & LOCKED
                </span>
              </div>

              <div className="space-y-4">
                {activePlan.steps.map((step, sIdx) => (
                  <div
                    key={step.id || sIdx}
                    className="p-5 sm:p-6 rounded-2xl bg-slate-950/90 border border-gold-subtle/50 hover:border-emerald-500/60 transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden"
                  >
                    <div className="flex items-start space-x-4 min-w-0 flex-1">
                      <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-[#D4AF37] to-[#A88325] text-slate-950 flex items-center justify-center font-cinzel font-extrabold text-sm shadow-md">
                        0{sIdx + 1}
                      </div>

                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-[#D4AF37]/15 border border-[#D4AF37]/40 text-[#FCE7AC] font-cinzel text-[10px] font-semibold uppercase">
                            {step.provider || 'Carrier Service'}
                          </span>
                          <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Confirmed & Issued</span>
                          </span>
                        </div>

                        <h4 className="text-base sm:text-lg font-bold font-serif-display text-white break-words">
                          {step.title}
                        </h4>

                        <div className="text-xs font-mono text-slate-300 flex flex-wrap items-center gap-2">
                          <span className="text-[#D4AF37]">{step.timing}</span>
                          {step.estimatedCostOrRefund !== undefined && (
                            <span className={step.estimatedCostOrRefund <= 0 ? 'text-emerald-400' : 'text-slate-400'}>
                              • {step.estimatedCostOrRefund <= 0 ? `Refund Credit: ₹${Math.abs(step.estimatedCostOrRefund).toLocaleString('en-IN')}` : `Fare: ₹${step.estimatedCostOrRefund.toLocaleString('en-IN')}`}
                            </span>
                          )}
                        </div>

                        <p className="text-xs sm:text-sm text-slate-300 font-sans-luxury font-light leading-relaxed pt-1 break-words">
                          {step.details}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 self-stretch md:self-center flex md:flex-col items-center justify-between md:justify-center p-3 rounded-xl bg-black/60 border border-white/10 text-right min-w-[140px]">
                      <span className="text-[10px] font-cinzel text-slate-400 uppercase">Boarding Status</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">SEAT RESERVED</span>
                      <span className="text-[9px] font-mono text-slate-500 hidden md:block">Priority Baggage Tag</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Two-Column Financial Reconciliation & Concierge Protections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Financial Ledger Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl shadow-xl space-y-5">
                <div className="flex items-center space-x-2.5 text-[#D4AF37] border-b border-gold-subtle/30 pb-3">
                  <DollarSign className="w-5 h-5" />
                  <h3 className="font-serif-display text-xl font-bold text-white">
                    Statutory Refund & Rebooking Settlement
                  </h3>
                </div>

                <div className="space-y-3 font-mono text-xs sm:text-sm">
                  <div className="flex justify-between items-center text-slate-300 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <span>Rebooking Fare Allocation:</span>
                    <span className="font-bold text-slate-100">₹{activePlan.additionalCost.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <span>DGCA CAR / IRCTC Statutory Refund:</span>
                    <span className="font-bold text-emerald-400">-₹{activePlan.refundRecoveryAmount.toLocaleString('en-IN')}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300 p-2.5 rounded-xl bg-slate-950/60 border border-white/5">
                    <span>Disruption Shield Privilege Waiver:</span>
                    <span className="font-bold text-[#FCE7AC]">100% Zero-Deduction</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-black/80 border border-gold-subtle flex justify-between items-center font-bold text-sm sm:text-base">
                    <span className="text-slate-200">Net Settled Balance:</span>
                    <span className={activePlan.netFinancialImpact <= 0 ? 'text-emerald-400 font-bold' : 'text-[#FCE7AC]'}>
                      {activePlan.netFinancialImpact <= 0
                        ? `-₹${Math.abs(activePlan.netFinancialImpact).toLocaleString('en-IN')} (Surplus Credit Refund)`
                        : `+₹${activePlan.netFinancialImpact.toLocaleString('en-IN')}`}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-950 border border-emerald-500/30 text-[11px] text-slate-400 font-sans-luxury leading-relaxed flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Settlement verified in accordance with DGCA Civil Aviation Requirements Section 3, Series M, Part IV and IRCTC Passenger Cancellation Charters.
                  </span>
                </div>
              </div>

              {/* Concierge & Royal Palace Protections Card */}
              <div className="p-6 sm:p-7 rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl shadow-xl space-y-5">
                <div className="flex items-center space-x-2.5 text-[#D4AF37] border-b border-gold-subtle/30 pb-3">
                  <ShieldCheck className="w-5 h-5" />
                  <h3 className="font-serif-display text-xl font-bold text-white">
                    Palace Concierge & Ground Protection Desk
                  </h3>
                </div>

                <div className="space-y-3 font-sans-luxury text-xs sm:text-sm">
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-gold-subtle/40 space-y-1">
                    <div className="font-cinzel text-xs font-bold text-[#FCE7AC] flex items-center space-x-1.5">
                      <Building className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>HERITAGE PALACE CHECK-IN GUARANTEE</span>
                    </div>
                    <p className="text-slate-300 font-light text-xs leading-relaxed">
                      Taj Lake Palace front desk has confirmed unconditional hold on your Grand Royal Suite. Late arrival reception registered until midnight with complimentary lake boat transfer.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-gold-subtle/40 space-y-1">
                    <div className="font-cinzel text-xs font-bold text-[#FCE7AC] flex items-center space-x-1.5">
                      <Car className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>DEDICATED VIP CHAUFFEUR DISPATCH</span>
                    </div>
                    <p className="text-slate-300 font-light text-xs leading-relaxed">
                      Mercedes E-Class Chauffeur assigned. Chauffeur tracks live aircraft telemetry and will meet you directly at the VIP arrival gate with digital nameboard.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-gold-subtle/40 space-y-1">
                    <div className="font-cinzel text-xs font-bold text-[#FCE7AC] flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>CHIEF CONCIERGE DIRECT LINE</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-mono font-bold">24/7 ACTIVE</span>
                    </div>
                    <p className="text-slate-300 font-light text-xs leading-relaxed">
                      Lead Concierge: Rajendra Rathore (Lead Concierge, Bharat Privé Desk).
                    </p>
                    <button
                      onClick={handleCopyConciergeChannel}
                      className="mt-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-[11px] font-cinzel text-emerald-200 transition-colors cursor-pointer flex items-center space-x-1.5"
                    >
                      <Phone className="w-3 h-3 text-emerald-400" />
                      <span>{copiedDesk ? 'NUMBER COPIED TO CLIPBOARD' : 'CONNECT TO CONCIERGE DESK (WHATSAPP)'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
             UNCONFIRMED STATE: COMPARATIVE RECOVERY PLANS SUGGESTIONS GRID
             ========================================================================= */
          <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gold-subtle/30 pb-3">
              <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white flex items-center space-x-2.5">
                <span>FEASIBLE RECOVERY PLANS</span>
                <span className="text-xs font-cinzel px-3 py-0.5 rounded-full bg-slate-950 border border-gold-subtle text-[#D4AF37]">
                  {recoveryOptions.length} OPTIONS AVAILABLE
                </span>
              </h3>
              <span className="text-xs font-sans-luxury text-slate-400">
                Hover any option to trace living 3D flightpaths • Confirm a plan to execute immediately
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-7">
              {recoveryOptions.map((option, idx) => {
                const isSelected = selectedOptionId === option.id;
                const isRankOne = idx === 0;

                return (
                  <div
                    key={option.id}
                    onMouseEnter={() => onHoverRecoveryOption(option)}
                    onMouseLeave={() => onHoverRecoveryOption(null)}
                    className={`p-6 sm:p-7 rounded-3xl border transition-all flex flex-col justify-between relative overflow-visible backdrop-blur-xl h-auto ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/80 shadow-2xl shadow-emerald-950/40 scale-[1.01]'
                        : isRankOne
                        ? 'bg-gradient-to-b from-[#141824] to-[#0B0D13] border-gold-bright shadow-2xl shadow-[#D4AF37]/15'
                        : 'bg-[#0B0D13]/90 border-gold-subtle hover:border-gold-bright/60 hover:bg-[#121520]'
                    }`}
                  >
                    {/* Rank #1 Recommendation Badge */}
                    {isRankOne && (
                      <div className="absolute -top-3 right-5 px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-[#A88325] text-slate-950 font-cinzel text-[10px] font-extrabold rounded-full flex items-center space-x-1 shadow-lg z-10">
                        <Sparkles className="w-3 h-3" />
                        <span>#1 RECOMMENDED</span>
                      </div>
                    )}

                    <div className="space-y-5">
                      <div>
                        <span className="inline-block text-[10px] sm:text-[11px] font-cinzel uppercase px-3 py-1 rounded-full bg-slate-950 border border-gold-subtle text-[#D4AF37] font-semibold tracking-wider">
                          {option.strategy}
                        </span>
                        <h4 className="text-lg sm:text-xl font-bold font-serif-display text-white mt-3 leading-snug break-words">
                          {option.title}
                        </h4>
                        <p className="text-xs sm:text-[13px] text-slate-300 font-sans-luxury font-light mt-2 leading-relaxed break-words">
                          {option.description}
                        </p>
                      </div>

                      {/* Key Comparison Badges */}
                      <div className="grid grid-cols-2 gap-2.5 p-3 sm:p-3.5 rounded-2xl bg-slate-950/80 border border-gold-subtle/40 text-[11px] font-mono">
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-center min-h-[50px]">
                          <span className="text-slate-400 text-[10px] block font-sans-luxury">Changes</span>
                          <span className="text-slate-100 font-bold break-words">
                            {option.numberOfChanges !== undefined ? `${option.numberOfChanges} Transfer` : '1 Transfer'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-center min-h-[50px]">
                          <span className="text-slate-400 text-[10px] block font-sans-luxury">Arrival Delta</span>
                          <span className={option.arrivalDeltaMinutes <= 30 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                            {option.arrivalDeltaMinutes <= 0 ? `${option.arrivalDeltaMinutes}m (Early)` : `+${option.arrivalDeltaMinutes}m`}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-center min-h-[50px]">
                          <span className="text-slate-400 text-[10px] block font-sans-luxury">Convenience</span>
                          <span className="text-[#FCE7AC] font-bold">{option.convenienceRating || 9.2}/10</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex flex-col justify-center min-h-[50px]">
                          <span className="text-slate-400 text-[10px] block font-sans-luxury">Risk Level</span>
                          <span className="text-cyan-300 font-bold capitalize">{option.riskLevel || 'Low'}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {option.tags.map((tag, i) => (
                          <span key={i} className="text-[10px] font-mono px-2.5 py-1 rounded-lg bg-slate-950/90 border border-gold-subtle/40 text-slate-300 break-words">
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Financial Reconciliation Box */}
                      <div className="p-4 sm:p-4.5 rounded-2xl bg-slate-950/90 border border-gold-subtle/50 space-y-2 text-xs font-mono w-full h-auto">
                        <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs">
                          <span>Rebooking Cost:</span>
                          <span className="text-slate-200 font-semibold font-mono">₹{option.additionalCost.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex items-center justify-between text-slate-400 text-[11px] sm:text-xs">
                          <span>Refund Recovery:</span>
                          <span className="text-emerald-400 font-semibold font-mono">-₹{option.refundRecoveryAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="border-t border-gold-subtle/30 pt-2 flex items-center justify-between font-bold text-xs sm:text-sm">
                          <span className="text-slate-300">Net Impact:</span>
                          <span className={option.netFinancialImpact <= 0 ? 'text-emerald-400' : 'text-[#FCE7AC]'}>
                            {option.netFinancialImpact < 0 ? `-₹${Math.abs(option.netFinancialImpact).toLocaleString('en-IN')} (Surplus Credit)` : `+₹${option.netFinancialImpact.toLocaleString('en-IN')}`}
                          </span>
                        </div>
                      </div>

                      {/* Step Sequence Preview (Auto-Expanding Box Height & Word Wrapping) */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] sm:text-[11px] font-cinzel text-[#D4AF37] uppercase tracking-wider font-bold">
                            COORDINATED STEP SEQUENCE:
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {option.steps.length} {option.steps.length === 1 ? 'Step' : 'Steps'}
                          </span>
                        </div>
                        <div className="space-y-2.5">
                          {option.steps.map((step, sIdx) => (
                            <div
                              key={step.id || sIdx}
                              className="w-full min-h-[64px] h-auto p-3.5 sm:p-4 rounded-2xl bg-slate-950/80 border border-gold-subtle/40 hover:border-gold-subtle/70 flex items-start gap-3 transition-all box-border overflow-visible"
                            >
                              <span className="shrink-0 w-6 h-6 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/35 flex items-center justify-center text-[#D4AF37] font-cinzel font-bold text-xs mt-0.5 shadow-sm">
                                0{sIdx + 1}
                              </span>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="text-slate-100 font-sans-luxury text-xs sm:text-[13px] font-semibold leading-relaxed break-words whitespace-normal">
                                  {step.title}
                                </div>
                                <div className="text-[10px] sm:text-[11px] font-mono text-slate-400 leading-normal break-words flex flex-wrap items-center gap-1.5 pt-0.5">
                                  <span className="text-slate-300">{step.timing}</span>
                                  {step.provider && (
                                    <span className="text-[#D4AF37] font-medium">
                                      • {step.provider}
                                    </span>
                                  )}
                                </div>
                                {step.details && (
                                  <div className="text-[10px] sm:text-[11px] text-slate-400 font-sans-luxury leading-relaxed break-words pt-1 border-t border-white/5 mt-1">
                                    {step.details}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Execution Button */}
                    <div className="mt-6 pt-4 border-t border-gold-subtle/40 space-y-3">
                      {option.matchReason && (
                        <div className="text-xs font-sans-luxury text-slate-400 italic leading-relaxed break-words">
                          {option.matchReason}
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          id={`btn-select-plan-${option.id}`}
                          onClick={() => {
                            if (onConfirmPlanDirectly) {
                              onConfirmPlanDirectly(option);
                            } else {
                              onSelectRecoveryOption(option);
                            }
                          }}
                          className="flex-1 py-3 px-4 rounded-full font-cinzel text-xs sm:text-sm font-bold bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] text-slate-950 shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center space-x-2 transition-all transform active:scale-98 cursor-pointer"
                        >
                          <span>CONFIRM THIS PLAN</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectRecoveryOption(option)}
                          className="px-3.5 py-3 rounded-full font-cinzel text-xs text-[#FCE7AC] hover:text-white bg-slate-950/80 hover:bg-slate-900 border border-gold-subtle/50 transition-colors cursor-pointer"
                          title="Preview 5-stage verification audit"
                        >
                          5-Stage Audit
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
