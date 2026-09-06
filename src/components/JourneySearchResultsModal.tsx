// src/components/JourneySearchResultsModal.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
  ShieldAlert,
  Layers,
  Compass
} from 'lucide-react';
import { DestinationItem } from './DestinationTiltCards';
import { JourneyPlanOption, JourneySearchParams } from '../types/journey';
export type { JourneySearchParams };
import { searchJourneys } from '../lib/api/journeys';
import { useAuth } from '../hooks/useAuth';
import { BookingOptionsModal } from './BookingOptionsModal';

interface JourneySearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: JourneySearchParams | null;
  destinationItem: DestinationItem;
  onSelectRecoverySolution?: (solutionName: string) => void;
  onNavigateToConcierge?: () => void;
  onPlanConfirmed?: (plan: JourneyPlanOption) => void;
}

type ModeFilterType = 'all' | 'flight' | 'train' | 'bus' | 'uber' | 'multimodal';

export const JourneySearchResultsModal: React.FC<JourneySearchResultsModalProps> = ({
  isOpen,
  onClose,
  params,
  destinationItem,
  onSelectRecoverySolution,
  onNavigateToConcierge,
  onPlanConfirmed,
}) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<JourneyPlanOption[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [filterMode, setFilterMode] = useState<ModeFilterType>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchMeta, setSearchMeta] = useState<any>(null);
  const [isBookingOptionsOpen, setIsBookingOptionsOpen] = useState(false);

  const originCity = params?.origin || 'BOM Mumbai';
  const destCity = params?.destination || destinationItem.name;

  useEffect(() => {
    if (!isOpen || !params) return;

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // If user specifically picked a mode in the widget, initialize filter to that mode if applicable
    if (params.mode && ['flight', 'train', 'bus', 'uber', 'car', 'multimodal'].includes(params.mode)) {
      if (params.mode === 'car' || params.mode === 'uber') {
        setFilterMode('uber');
      } else {
        setFilterMode(params.mode as ModeFilterType);
      }
    } else {
      setFilterMode('all');
    }

    const executeSearch = async () => {
      try {
        const idToken = user ? await user.getIdToken() : undefined;
        const res = await searchJourneys(params, idToken);
        if (isMounted) {
          if (res.success && res.plans && res.plans.length > 0) {
            setPlans(res.plans);
            setSearchMeta(res.meta);
            setSelectedPlanId(res.plans[0].id);
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

  // Counts of each modality
  const counts = useMemo(() => {
    const flightCount = plans.filter(p => 
      p.category === 'FASTEST' || 
      p.category === 'CHEAPEST' || 
      p.category === 'BEST_BALANCE' || 
      (p.legs.length === 1 && p.legs[0].type === 'flight')
    ).length;

    const trainCount = plans.filter(p => 
      p.category.includes('RAIL') || 
      (p.legs.length === 1 && p.legs[0].type === 'train')
    ).length;

    const busCount = plans.filter(p => 
      p.category.includes('BUS') || 
      (p.legs.length === 1 && p.legs[0].type === 'bus')
    ).length;

    const uberCount = plans.filter(p => 
      p.category.includes('CAB') || 
      (p.legs.length === 1 && p.legs[0].type === 'car')
    ).length;

    const multiCount = plans.filter(p => 
      p.category.includes('MULTIMODAL') || 
      p.legs.length > 1
    ).length;

    return {
      all: plans.length,
      flight: flightCount,
      train: trainCount,
      bus: busCount,
      uber: uberCount,
      multimodal: multiCount
    };
  }, [plans]);

  // Filtered list of plans
  const filteredPlans = useMemo(() => {
    if (filterMode === 'all') return plans;
    return plans.filter(opt => {
      if (filterMode === 'flight') {
        return opt.category === 'FASTEST' || 
               opt.category === 'CHEAPEST' || 
               opt.category === 'BEST_BALANCE' || 
               (opt.legs.length === 1 && opt.legs[0].type === 'flight');
      }
      if (filterMode === 'train') {
        return opt.category.includes('RAIL') || 
               (opt.legs.length === 1 && opt.legs[0].type === 'train');
      }
      if (filterMode === 'bus') {
        return opt.category.includes('BUS') || 
               (opt.legs.length === 1 && opt.legs[0].type === 'bus');
      }
      if (filterMode === 'uber') {
        return opt.category.includes('CAB') || 
               (opt.legs.length === 1 && opt.legs[0].type === 'car');
      }
      if (filterMode === 'multimodal') {
        return opt.category.includes('MULTIMODAL') || opt.legs.length > 1;
      }
      return true;
    });
  }, [plans, filterMode]);

  const activePlan = useMemo(() => {
    return plans.find(p => p.id === selectedPlanId) || filteredPlans[0] || plans[0];
  }, [plans, selectedPlanId, filteredPlans]);

  if (!isOpen) return null;

  const handleBook = () => {
    setIsBookingOptionsOpen(true);
  };

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        {/* Modal Dialog Card - Selected Element for Style Changes */}
        <div 
          id="journey-planner-dialog-card"
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-4xl rounded-3xl bg-[#0A0C12] border border-[#D4AF37]/50 shadow-[0_0_60px_-15px_rgba(212,175,55,0.25)] p-6 sm:p-8 space-y-5 my-auto backdrop-blur-2xl"
        >
          {/* Ambient Glow */}
          <div className="absolute top-0 right-10 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Header Bar */}
          <div className="flex items-start justify-between border-b border-gold-subtle/40 pb-4">
            <div>
              <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>RE ROUTE MULTI-MODAL TRIP PLANNER</span>
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
                      {searchMeta.providersQueried?.length} Core Providers (Air, Rail, Bus & Cab) • {searchMeta.latencyMs}ms
                    </span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title="Close Trip Planner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mode Selector Tabs inside Modal: Flight, Train, Bus, Uber, Multi-Modal */}
          {!isLoading && plans.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-950/80 border border-gold-subtle/40">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>ALL OPTIONS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                  {counts.all}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('flight')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  filterMode === 'flight'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plane className="w-3.5 h-3.5" />
                <span>FLIGHT</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                  {counts.flight}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('train')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  filterMode === 'train'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Train className="w-3.5 h-3.5" />
                <span>TRAIN</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                  {counts.train}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('bus')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  filterMode === 'bus'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bus className="w-3.5 h-3.5" />
                <span>BUS</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                  {counts.bus}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('uber')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  filterMode === 'uber'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Car className="w-3.5 h-3.5" />
                <span>UBER</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                  {counts.uber}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFilterMode('multimodal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  filterMode === 'multimodal'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>MULTI-MODAL</span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-900/80 text-slate-300 border border-slate-700">
                  {counts.multimodal}
                </span>
              </button>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="py-16 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin" />
              <div className="text-center space-y-1">
                <p className="text-xs font-cinzel tracking-[0.25em] text-[#D4AF37] uppercase">
                  Querying Core Travel Adapters...
                </p>
                <p className="text-[11px] font-sans-luxury text-slate-400">
                  Connecting to IRCTC NextGen PRS, MakeMyTrip GDS, redBus Luxury & Uber Mobility
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

          {/* Filter Empty State */}
          {!isLoading && !error && filteredPlans.length === 0 && plans.length > 0 && (
            <div className="p-8 rounded-2xl bg-slate-950/60 border border-slate-800 text-center space-y-3">
              <Compass className="w-8 h-8 text-[#D4AF37] mx-auto" />
              <h3 className="font-serif-display text-lg text-white">No options found for this specific mode</h3>
              <p className="text-xs font-sans-luxury text-slate-400">
                Options are available under other modes. Tap below to see all choices.
              </p>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="inline-flex items-center space-x-2 px-5 py-2 rounded-full border border-[#D4AF37] bg-[#D4AF37]/10 text-xs font-cinzel text-[#FCE7AC] hover:bg-[#D4AF37]/20 transition-all cursor-pointer"
              >
                <span>SHOW ALL {plans.length} AVAILABLE TRAVEL OPTIONS</span>
              </button>
            </div>
          )}

          {/* Itinerary Cards List (Scrollable) */}
          {!isLoading && !error && filteredPlans.length > 0 && (
            <div className="max-h-[56vh] overflow-y-auto pr-1.5 space-y-3.5 scrollbar-thin scrollbar-thumb-gold-subtle/50">
              {filteredPlans.map((opt) => {
                const isSelected = activePlan?.id === opt.id;
                const isTrain = opt.category.includes('RAIL') || opt.legs.every(l => l.type === 'train');
                const isBus = opt.category.includes('BUS') || opt.legs.every(l => l.type === 'bus');
                const isUber = opt.category.includes('CAB') || opt.legs.every(l => l.type === 'car');
                const isMulti = opt.category.includes('MULTIMODAL') || opt.legs.length > 1;

                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedPlanId(opt.id)}
                    className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                      isSelected
                        ? 'border-gold-bright bg-gradient-to-r from-[#141824] to-[#0D1018] shadow-xl shadow-[#D4AF37]/10'
                        : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Badge & Price Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        {/* Modality Icon Pill */}
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-cinzel font-bold tracking-widest bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FCE7AC] flex items-center space-x-1">
                          {isMulti ? (
                            <Layers className="w-3 h-3 text-[#D4AF37]" />
                          ) : isTrain ? (
                            <Train className="w-3 h-3 text-[#D4AF37]" />
                          ) : isBus ? (
                            <Bus className="w-3 h-3 text-[#D4AF37]" />
                          ) : isUber ? (
                            <Car className="w-3 h-3 text-[#D4AF37]" />
                          ) : (
                            <Plane className="w-3 h-3 text-[#D4AF37]" />
                          )}
                          <span>{opt.badge}</span>
                        </span>

                        {/* Truthful Provenance Badge */}
                        <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider bg-slate-900 border border-slate-700 text-cyan-300">
                          PROVIDER: {opt.providerSummary}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-serif-display font-medium text-2xl text-white">
                          {opt.priceFormatted}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 block">
                          {isUber ? 'direct ride total' : isBus ? 'per seat' : isTrain ? 'per berth' : 'per traveler'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Timing Summary */}
                    <div className="space-y-1 mb-3">
                      <h3 className="font-serif-display font-medium text-lg text-white">
                        {opt.title}
                      </h3>
                      <p className="text-xs font-sans-luxury text-slate-400">
                        {opt.providerSummary} • <Clock className="w-3 h-3 inline mr-1 text-[#D4AF37]" />{opt.totalDuration} • Departure: {opt.depTime}
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

                    {/* Explainability Callout */}
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
          {!isLoading && !error && filteredPlans.length > 0 && (
            <div className="pt-2 border-t border-gold-subtle/30 flex flex-col sm:flex-row items-center justify-between gap-3">
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
                <span>BOOK {activePlan?.title ? `"${activePlan.title.toUpperCase()}"` : 'SELECTED PLAN'}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Booking Fulfillment Matrix Modal */}
      <BookingOptionsModal
        isOpen={isBookingOptionsOpen}
        onClose={() => setIsBookingOptionsOpen(false)}
        plan={activePlan}
        searchParams={params}
        onBookingSuccess={() => {
          setIsBookingOptionsOpen(false);
          if (activePlan) onPlanConfirmed?.(activePlan);
          onClose();
        }}
        onNavigateToConcierge={() => {
          setIsBookingOptionsOpen(false);
          onClose();
          onNavigateToConcierge?.();
        }}
      />
    </>
  );
};
