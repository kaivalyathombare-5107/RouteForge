import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, RefreshCw, ShieldCheck, ArrowRight, X, AlertCircle, Sparkles } from 'lucide-react';
import { RecoveryOption } from '../types';

interface ActionConfirmationModalProps {
  option: RecoveryOption | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmSuccess: (option: RecoveryOption) => void;
  playSound: (type: any) => void;
}

export const ActionConfirmationModal: React.FC<ActionConfirmationModalProps> = ({
  option,
  isOpen,
  onClose,
  onConfirmSuccess,
  playSound,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isComplete, setIsComplete] = useState<boolean>(false);

  const executionStages = [
    { label: 'STAGE 1: INVENTORY & SEAT LOCK', desc: 'Validating real-time GDS seat allocation & fare class lock' },
    { label: 'STAGE 2: TRANSACTION COMMERCE', desc: 'Applying ₹5,200 statutory airline waiver directly against new fare' },
    { label: 'STAGE 3: STATUTORY TDR FILING', desc: 'Auto-filing Indian Railways TDR citing connecting flight disruption' },
    { label: 'STAGE 4: HOTEL & EVENT LINKING', desc: 'Transmitting late-arrival notice to ITC Rajputana front desk' },
    { label: 'STAGE 5: GRAPH RE-ANCHORING', desc: 'Rebuilding living 3D trip topology & restoring safe buffer gauges' },
  ];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(0);
      setIsExecuting(false);
      setIsComplete(false);
    }
  }, [isOpen]);

  const handleStartExecution = () => {
    setIsExecuting(true);
    playSound('radar');

    let step = 0;
    const timer = setInterval(() => {
      step++;
      setCurrentStep(step);
      playSound('click');

      if (step >= executionStages.length) {
        clearInterval(timer);
        setIsExecuting(false);
        setIsComplete(true);
        playSound('success');

        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06B6D4', '#10B981', '#38BDF8'],
          });
        } catch (e) {}
      }
    }, 900);
  };

  if (!isOpen || !option) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={(e) => {
        if (!isExecuting && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl p-6 sm:p-8 rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl space-y-6 text-slate-100 font-sans-luxury"
      >
        {/* Close Button */}
        {!isExecuting && (
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-slate-950 border border-gold-subtle text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Modal Header */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-xs font-cinzel text-[#D4AF37]">
            <ShieldCheck className="w-4 h-4" />
            <span>VIP EXECUTION PROTOCOL // 1-CLICK AUTONOMOUS RECOVERY</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white">
            {option.title}
          </h3>
          <p className="text-xs text-slate-300 font-light">
            Strategy: <strong className="text-[#FCE7AC] font-cinzel uppercase">{option.strategy}</strong> • Net Financial Impact: <strong className="text-emerald-400">{option.netFinancialImpact <= 0 ? `₹${Math.abs(option.netFinancialImpact)} Refund Surplus` : `+₹${option.netFinancialImpact}`}</strong>
          </p>
        </div>

        {/* 5-Stage Execution Progress Stepper */}
        <div className="space-y-3 p-4 rounded-2xl bg-slate-950/90 border border-gold-subtle">
          <div className="text-[11px] font-cinzel uppercase text-slate-400 flex justify-between">
            <span>Autonomous Multi-Provider Execution</span>
            <span>{isComplete ? '100% COMPLETE' : isExecuting ? `STAGE 0${currentStep + 1} OF 05` : 'STANDBY'}</span>
          </div>

          <div className="space-y-2">
            {executionStages.map((stg, idx) => {
              const isPassed = currentStep > idx || isComplete;
              const isCurrent = currentStep === idx && isExecuting;

              return (
                <div
                  key={idx}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    isPassed
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : isCurrent
                      ? 'bg-[#D4AF37]/15 border-gold-bright text-[#FCE7AC] shadow-md shadow-[#D4AF37]/10 scale-[1.01]'
                      : 'bg-slate-950/40 border-gold-subtle/20 text-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {isPassed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isCurrent ? (
                      <RefreshCw className="w-4 h-4 text-[#D4AF37] animate-spin" />
                    ) : (
                      <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[9px]">
                        {idx + 1}
                      </div>
                    )}
                    <div>
                      <div className="font-bold text-slate-200">{stg.label}</div>
                      <div className="text-[10px] text-slate-400 opacity-80">{stg.desc}</div>
                    </div>
                  </div>

                  <span className="text-[10px] font-cinzel font-bold uppercase">
                    {isPassed ? 'VERIFIED' : isCurrent ? 'RUNNING' : 'QUEUED'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cryptographic Confirmation Codes upon completion */}
        {isComplete && (
          <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/60 text-xs space-y-2 animate-fadeIn">
            <div className="text-emerald-300 font-bold flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>TRANSACTION CONFIRMED & VERIFIED ACROSS ALL GDS NETWORKS</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-gold-subtle">
                <span className="text-slate-400 block text-[10px] font-cinzel">Air India Maharaja PNR:</span>
                <span className="text-[#FCE7AC] font-bold font-mono">AI-864-CNF-99218</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-gold-subtle">
                <span className="text-slate-400 block text-[10px] font-cinzel">IRCTC TDR Reference:</span>
                <span className="text-[#D4AF37] font-bold font-mono">TDR-2026-784019</span>
              </div>
            </div>
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          {!isComplete ? (
            <>
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="px-5 py-2.5 rounded-full border border-gold-subtle bg-slate-950 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-execute-recovery"
                onClick={handleStartExecution}
                disabled={isExecuting}
                className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#A88325] hover:from-[#FCE7AC] hover:to-[#D4AF37] text-slate-950 font-cinzel font-bold text-xs flex items-center space-x-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
              >
                {isExecuting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ORCHESTRATING RECOVERY...</span>
                  </>
                ) : (
                  <>
                    <span>APPROVE & EXECUTE RECOVERY</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              id="btn-finalize-and-return-to-graph"
              onClick={() => {
                onConfirmSuccess(option);
                onClose();
              }}
              className="w-full py-3.5 rounded-full font-cinzel bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs sm:text-sm flex items-center justify-center space-x-2 shadow-xl shadow-emerald-950/50 cursor-pointer transition-all transform active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>VIEW CONFIRMED RECOVERY PLAN (DETAILED)</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
