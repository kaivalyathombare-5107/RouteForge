// src/components/JourneySearchResultsModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  Plane, 
  Train, 
  Car, 
  Bus,
  ShieldCheck, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { JourneyMode } from './HeroJourneySection';
import { DestinationItem } from './DestinationTiltCards';
import { JourneyPlanOption, JourneySearchParams } from '../types/journey';
import { searchJourneys } from '../lib/api/journeys';
import { useAuth } from '../hooks/useAuth';
import { BookingOptionsModal } from './BookingOptionsModal';

interface JourneySearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: JourneySearchParams | null;
  destinationItem: DestinationItem;
  onSelectRecoverySolution?: (solutionName: string) => void;
}

export const JourneySearchResultsModal: React.FC<JourneySearchResultsModalProps> = ({
  isOpen,
  onClose,
  params,
  destinationItem,
  onSelectRecoverySolution,
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<JourneyPlanOption[]>([]);
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [isBookingOptionsOpen, setIsBookingOptionsOpen] = useState(false);

  const originCity = params?.origin || 'BOM Mumbai';
  const destCity = params?.destination || destinationItem.name;

  useEffect(() => {
    if (!isOpen || !params) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const executeSearch = async () => {
      try {
        const idToken = user ? await user.getIdToken() : undefined;
        const res = await searchJourneys(params, idToken);
        if (isMounted) {
          if (res.success && res.plans && res.plans.length > 0) {
            setPlans(res.plans);
            setSearchMeta(res.meta);
            setSelectedPlanIndex(0);
          } else {
            setError(res.error || 'No realistic travel options found for the selected corridor.');
          }
        }
      } catch (err: any) {
        if (isMounted) {
          console.error('[JourneySearch] Search error:', err);
          setError(err.message || 'Failed to connect to provider search service.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    executeSearch();

    return () => {
      isMounted = false;
    };
  }, [isOpen, params, user]);

  if (!isOpen) return null;

  const handleBook = () => {
    setIsBookingOptionsOpen(true);
  };

  const activePlan = plans[selectedPlanIndex] || plans[0];

  return (
    <>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0C0E14] border border-gold-bright shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        {/* Background glow */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-start justify-between border-b border-gold-subtle/40 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RE ROUTE CANONICAL MULTI-MODAL PLANNER</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-white font-medium mt-1">
              {originCity} <span className="text-[#D4AF37]">→</span> {destCity}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs font-sans-luxury text-slate-300 font-light mt-0.5">
              <span>Dates: {params?.departDate || '15 Oct, 2026'}</span>
              <span>•</span>
              <span>{params?.travelers || '2 Adults'}</span>
              <span>•</span>
              <span className="font-mono text-[#FCE7AC]">{params?.cabinClass || 'Executive Class'}</span>
              {searchMeta && (
                <>
                  <span>•</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {searchMeta.providersQueried?.length} Providers Queried in {searchMeta.latencyMs}ms
                  </span>
                </>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-cinzel tracking-[0.25em] text-[#D4AF37] uppercase">
                Querying Live Provider Adapters...
              </p>
              <p className="text-[11px] font-sans-luxury text-slate-400">
                Fetching IRCTC PRS, MakeMyTrip GDS, Uber Mobility & redBus corridors without fictional data
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-800/60 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
            <h3 className="font-serif-display text-lg text-rose-200">Travel Corridor Error</h3>
            <p className="text-xs font-sans-luxury text-slate-300 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-full border border-rose-700 bg-rose-900/50 text-xs font-cinzel text-rose-200 hover:bg-rose-900"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Search</span>
            </button>
          </div>
        )}

        {/* Itinerary Cards List */}
        {!isLoading && !error && plans.length > 0 && (
          <div className="space-y-4">
            {plans.map((opt, idx) => {
              const isSelected = selectedPlanIndex === idx;
              return (
                <div
                  key={opt.id}
                  onClick={() => setSelectedPlanIndex(idx)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'border-gold-bright bg-gradient-to-r from-[#141822] to-[#0D0F16] shadow-xl shadow-[#D4AF37]/10'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  {/* Badge & Price Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-cinzel font-bold tracking-widest bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FCE7AC]">
                        {opt.badge}
                      </span>
                      {/* Truthful Provenance Badge (Section 6 & 24) */}
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider bg-slate-900 border border-slate-700 text-cyan-300">
                        SOURCE: {opt.provenance?.source || 'PARTNER_API'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="font-serif-display font-medium text-2xl text-white">
                        {opt.priceFormatted}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">per traveler</span>
                    </div>
                  </div>

                  {/* Title & Timing Summary */}
                  <div className="space-y-1 mb-3">
                    <h3 className="font-serif-display font-medium text-lg text-white">
                      {opt.title}
                    </h3>
                    <p className="text-xs font-sans-luxury text-slate-400">
                      {opt.providerSummary} • <Clock className="w-3 h-3 inline mr-1 text-[#D4AF37]" />{opt.totalDuration} • Departure {opt.depTime}
                    </p>
                  </div>

                  {/* Legs breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                    {opt.legs.map((leg, lIdx) => (
                      <div key={leg.id || lIdx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center space-x-3">
                        <div className="w-7 h-7 rounded-lg bg-slate-950 border border-gold-subtle flex items-center justify-center text-[#D4AF37] shrink-0">
                          {leg.type === 'flight' ? (
                            <Plane className="w-3.5 h-3.5" />
                          ) : leg.type === 'train' ? (
                            <Train className="w-3.5 h-3.5" />
                          ) : leg.type === 'bus' ? (
                            <Bus className="w-3.5 h-3.5" />
                          ) : (
                            <Car className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="font-medium text-white block truncate">{leg.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono block truncate">
                            {leg.carrier} • {leg.time}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Explainability Callout (Section 7: AI/Algorithmic explanation without inventing facts) */}
                  {opt.explanation && (
                    <p className="text-[11px] font-sans-luxury text-slate-400 italic mb-3">
                      "{opt.explanation}"
                    </p>
                  )}

                  {/* Disruption Shield Guarantee */}
                  <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 text-slate-300 pr-2">
                      <ShieldCheck className="w-4 h-4 text-[#D4AF37] shrink-0" />
                      <span className="font-sans-luxury font-light text-[11px]">{opt.disruptionShield}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#D4AF37] font-semibold shrink-0">100% COVERED</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        {!isLoading && !error && plans.length > 0 && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full border border-slate-700 hover:border-slate-500 text-xs font-cinzel text-slate-300 cursor-pointer"
            >
              BACK TO EXPLORE
            </button>

            <button
              onClick={handleBook}
              className="w-full sm:w-auto px-8 py-3 rounded-full gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] shadow-xl shadow-[#D4AF37]/20 flex items-center justify-center space-x-2 cursor-pointer"
            >
              <span>SELECT &amp; PROCEED WITH CONCIERGE SHIELD</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </div>

    {/* Booking Fulfillment Matrix Modal (Section 8, 9, 10) */}
    <BookingOptionsModal
      isOpen={isBookingOptionsOpen}
      onClose={() => setIsBookingOptionsOpen(false)}
      plan={activePlan}
      onBookingSuccess={() => {
        setIsBookingOptionsOpen(false);
        onClose();
      }}
    />
  </>
);
};

