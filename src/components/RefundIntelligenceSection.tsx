import React, { useState } from 'react';
import { ShieldCheck, ArrowRight, FileText, CheckCircle2, Clock, Info, Calculator, ExternalLink } from 'lucide-react';
import { RefundCase } from '../types';
import { calculateIRCTCRefund, calculateFlightRefund, IRCTC_POLICY_VERSION, DGCA_CAR_VERSION } from '../lib/deterministic-engines';

interface RefundIntelligenceSectionProps {
  refundCases: RefundCase[];
}

export const RefundIntelligenceSection: React.FC<RefundIntelligenceSectionProps> = ({ refundCases }) => {
  // Policy Simulator Sandbox State
  const [calcType, setCalcType] = useState<'train' | 'flight'>('train');
  const [ticketAmount, setTicketAmount] = useState<number>(1860);
  const [ticketClass, setTicketClass] = useState<'1A' | '2A' | '3A' | 'SL' | 'CC' | 'EC'>('2A');
  const [trainScenario, setTrainScenario] = useState<any>('FULL_TRAIN_CANCELLED');
  const [flightScenario, setFlightScenario] = useState<any>('AIRLINE_CANCELLED');

  const customCalc = calcType === 'train'
    ? calculateIRCTCRefund(ticketAmount, ticketClass, trainScenario, 24)
    : calculateFlightRefund(ticketAmount, flightScenario);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header & Total Eligible Summary */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-semibold">
              STATUTORY ENGINE
            </span>
            <span className="text-xs font-mono text-slate-400">IRCTC PRS & DGCA CAR COMPLIANT</span>
          </div>
          <h2 className="text-2xl font-bold font-display text-slate-100">
            Deterministic Refund & TDR Intelligence
          </h2>
          <p className="text-xs text-slate-400 font-light mt-1">
            Zero hallucinations. All refunds are computed strictly by deterministic rulebooks; AI only contextualizes the result.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 text-right self-stretch md:self-auto">
          <div className="text-[11px] font-mono text-slate-400 uppercase">Total Mandated Refund Value</div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            ₹{refundCases.reduce((acc, c) => acc + c.estimatedRefund, 0).toLocaleString('en-IN')}
          </div>
          <div className="text-[10px] font-mono text-slate-500">100% Eligible Under Government Charters</div>
        </div>
      </div>

      {/* Visual Refund Pipeline Stages */}
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-xl">
        <div className="text-xs font-mono text-slate-400 uppercase mb-4">Refund Lifecycle Pipeline</div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { step: '01', title: 'Ticket', status: 'Booked', active: true },
            { step: '02', title: 'Disruption', status: 'Carrier Trigger', active: true },
            { step: '03', title: 'Eligibility', status: '100% Mandated', active: true },
            { step: '04', title: 'TDR Filing', status: 'Auto-Queued', active: true },
            { step: '05', title: 'Processing', status: 'IRCTC / GDS Gateway', active: true },
            { step: '06', title: 'Refund Settled', status: 'Target: 24-48h', active: false },
          ].map(stage => (
            <div
              key={stage.step}
              className={`p-3 rounded-xl border font-mono text-xs ${
                stage.active
                  ? 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="text-[10px] text-slate-500">{stage.step}</div>
              <div className="font-bold text-slate-200">{stage.title}</div>
              <div className="text-[10px] text-slate-400 truncate">{stage.status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Live Canonical Refund Cases */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold font-display text-slate-100">
          Canonical Case Records (Trip: Mumbai → Delhi → Jaipur)
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {refundCases.map(c => (
            <div
              key={c.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-slate-100">{c.bookingTitle}</span>
                      {c.isImportedStatus && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-cyan-400 border border-cyan-800">
                          Imported status
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-slate-400 mt-0.5">
                      Provider: {c.provider} • Verified {c.timestamp}
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/40 uppercase">
                    {c.status}
                  </span>
                </div>

                {/* Numbers Grid */}
                <div className="grid grid-cols-3 gap-2 p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono">
                  <div>
                    <div className="text-slate-500 text-[10px]">Ticket Cost</div>
                    <div className="font-bold text-slate-200">₹{c.ticketAmount}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Estimated Refund</div>
                    <div className="font-bold text-emerald-400">₹{c.estimatedRefund}</div>
                  </div>
                  <div>
                    <div className="text-slate-500 text-[10px]">Deduction</div>
                    <div className="font-bold text-slate-300">₹{c.deductionAmount}</div>
                  </div>
                </div>

                {/* Audit Rule Tags */}
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    Rule: <strong className="text-slate-200">{c.ruleId}</strong>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                    Policy: <strong className="text-slate-200">{c.policyVersion}</strong>
                  </span>
                  <span className={`px-2 py-0.5 rounded border ${
                    c.tdrRequired
                      ? 'bg-amber-950/80 border-amber-500/40 text-amber-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}>
                    TDR: {c.tdrRequired ? 'Required (Online Filing)' : 'Not Required (Auto-Credit)'}
                  </span>
                </div>

                {/* Deterministic Legal Reason */}
                <div className="text-xs font-mono p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300">
                  <span className="text-cyan-400 font-semibold">Statutory Basis: </span>
                  {c.deterministicReason}
                </div>

                {/* Grounded AI Explanation */}
                <div className="text-xs font-mono p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 text-purple-200">
                  <span className="text-purple-400 font-semibold">AI Regulatory Context: </span>
                  {c.aiExplanation}
                </div>
              </div>

              {c.tdrRequired && (
                <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-amber-400">{c.tdrWindowDescription}</span>
                  <button
                    onClick={() => alert(`TDR Ticket queued under code ${c.tdrReasonCode}. Auto-submission active.`)}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors cursor-pointer"
                  >
                    FILE TDR NOW
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Deterministic Rulebook Sandbox / Auditor */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5">
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <h3 className="text-base font-bold font-display text-slate-100 uppercase tracking-wide">
            Interactive Statutory Rulebook Auditor & Calculator
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Provider Service</label>
            <select
              value={calcType}
              onChange={e => setCalcType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
            >
              <option value="train">IRCTC Indian Railways</option>
              <option value="flight">DGCA Civil Aviation (Flights)</option>
            </select>
          </div>

          {/* Ticket Amount */}
          <div>
            <label className="text-[11px] font-mono text-slate-400 block mb-1">Ticket Fare (₹ INR)</label>
            <input
              type="number"
              value={ticketAmount}
              onChange={e => setTicketAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
            />
          </div>

          {/* Scenario Selection */}
          {calcType === 'train' ? (
            <>
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Travel Class</label>
                <select
                  value={ticketClass}
                  onChange={e => setTicketClass(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                >
                  <option value="1A">1A (AC First Class)</option>
                  <option value="2A">2A (AC 2-Tier)</option>
                  <option value="3A">3A (AC 3-Tier)</option>
                  <option value="CC">CC (AC Chair Car)</option>
                  <option value="SL">SL (Sleeper Class)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Cancellation Clause</label>
                <select
                  value={trainScenario}
                  onChange={e => setTrainScenario(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
                >
                  <option value="FULL_TRAIN_CANCELLED">Full Train Cancelled (Auto-Refund)</option>
                  <option value="CONFIRMED_MORE_THAN_48H">Confirmed (&gt;48h before departure)</option>
                  <option value="CONFIRMED_12_TO_48H">Confirmed (12 to 48h before)</option>
                  <option value="CONFIRMED_4_TO_12H">Confirmed (4 to 12h pre-charting)</option>
                  <option value="CONFIRMED_LESS_THAN_4H_AFTER_CHART">Chart Prepared (&lt;4h before)</option>
                  <option value="RAC_OR_WAITLIST_CANCELLED">RAC / Waitlisted Ticket</option>
                  <option value="TRAIN_DIVERTED_NOT_TRAVELLED">Train Diverted / No Travel</option>
                </select>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2">
              <label className="text-[11px] font-mono text-slate-400 block mb-1">Aviation Disruption Condition</label>
              <select
                value={flightScenario}
                onChange={e => setFlightScenario(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-200"
              >
                <option value="AIRLINE_CANCELLED">Airline Cancelled Flight (100% Full Waiver)</option>
                <option value="AIRLINE_DELAY_GT_3H">Airline Delay &gt; 3 Hours (Full Waiver)</option>
                <option value="VOLUNTARY_CANCEL_GT_24H">Passenger Voluntary Cancel (&gt;24h)</option>
                <option value="VOLUNTARY_CANCEL_LT_24H">Passenger Urgent Voluntary Cancel (&lt;24h)</option>
              </select>
            </div>
          )}
        </div>

        {/* Auditor Output */}
        <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-cyan-400">{customCalc.ruleId}</span>
              <span className="text-[10px] font-mono text-slate-500">• {customCalc.policyVersion}</span>
            </div>
            <p className="text-xs font-mono text-slate-300 max-w-2xl">{customCalc.reason}</p>
          </div>

          <div className="flex items-center space-x-4 self-end sm:self-center font-mono">
            <div className="text-right">
              <div className="text-[10px] text-slate-500">Deduction</div>
              <div className="text-sm font-semibold text-slate-300">₹{customCalc.deductionAmount}</div>
            </div>
            <div className="text-right pl-4 border-l border-slate-800">
              <div className="text-[10px] text-slate-500">Estimated Refund</div>
              <div className="text-lg font-bold text-emerald-400">₹{customCalc.estimatedRefund}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
