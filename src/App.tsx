import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  INITIAL_TRIP,
  INITIAL_BOOKINGS,
  INITIAL_EDGES,
  INITIAL_REFUND_CASES,
  INITIAL_USER_PREFERENCES,
  DISRUPTION_SCENARIOS,
} from './lib/demo-data';
import {
  Trip,
  Booking,
  TripEdge,
  RecoveryOption,
  PriorityPreference,
  RefundCase,
} from './types';
import {
  propagateDisruption,
  generateRecoveryOptions,
  calculateIRCTCRefund,
  calculateFlightRefund,
} from './lib/deterministic-engines';
import { playSound } from './lib/sound-effects';

// Vogue & ReRoute Editorial Components
import { ReRouteNavigation, ReRouteSection } from './components/ReRouteNavigation';
import { VerticalSidebarDock, SidebarCategory } from './components/VerticalSidebarDock';
import { HeroJourneySection, JourneyMode } from './components/HeroJourneySection';
import { DestinationTiltCards, FEATURED_DESTINATIONS, DestinationItem } from './components/DestinationTiltCards';
import { ValuePropositionBar } from './components/ValuePropositionBar';
import { Full360PanoramaModal } from './components/Full360PanoramaModal';
import { ReRouteSignInModal } from './components/ReRouteSignInModal';
import { JourneySearchResultsModal } from './components/JourneySearchResultsModal';
import { JourneySearchParams } from './types/journey';
import { useAuth } from './hooks/useAuth';
import { TravellerProfileModal } from './components/TravellerProfileModal';
import { ProviderConnectionModal } from './components/ProviderConnectionModal';
import { AccountDetailsModal } from './components/AccountDetailsModal';
import { fetchTravellerProfile } from './lib/api/profile';
import { TravellerProfile } from './types/profile';
import { fetchUserBookings } from './lib/api/bookings';
import { createDisruption, executeRecovery } from './lib/api/disruptions';
import { cancelBooking } from './lib/api/refunds';

// Disruption & 2D Spatial Systems
import { TwoDimTripGraph } from './components/TwoDimTripGraph';
import { TripTimeline } from './components/TripTimeline';
import { SpatialNodeInspector } from './components/SpatialNodeInspector';
import { DisruptionCascadeView } from './components/DisruptionCascadeView';
import { RecoveryPlannerSection } from './components/RecoveryPlannerSection';
import { RefundIntelligenceSection } from './components/RefundIntelligenceSection';
import { ProviderAdapterSection } from './components/ProviderAdapterSection';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ConciergeTripExtensionsSection } from './components/ConciergeTripExtensionsSection';
import { ActionConfirmationModal } from './components/ActionConfirmationModal';
import { ReportMidJourneyProblemModal } from './components/ReportMidJourneyProblemModal';
import { EmergencySection } from './components/EmergencySection';
import { LiveTranslatorSection } from './components/LiveTranslatorSection';

import { PlanJourneyWidget } from './components/PlanJourneyWidget';
import { Sparkles, Shield, AlertCircle, ArrowDown } from 'lucide-react';

export default function App() {
  // Navigation & Category States
  const [activeSection, setActiveSection] = useState<ReRouteSection>('destinations');
  const [activeCategory, setActiveCategory] = useState<SidebarCategory>('home');
  const [selectedCurrency, setSelectedCurrency] = useState('INR');

  // Destination & Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const currentDestination = FEATURED_DESTINATIONS[currentSlideIndex];

  // Modals & Overlays
  const [isFullPanoramaOpen, setIsFullPanoramaOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [hasUserEnteredJourney, setHasUserEnteredJourney] = useState<boolean>(false);
  const [searchParams, setSearchParams] = useState<JourneySearchParams>({
    origin: '',
    destination: '',
    departDate: '15 Oct, 2026',
    returnDate: '22 Oct, 2026',
    travelers: '2 Adults, 2 Children (Family Holiday)',
    cabinClass: 'Vande Bharat Executive / Anubhuti',
    mode: 'flight',
  });

  // Canonical Trip & Recovery State (Engine Core)
  const [trip, setTrip] = useState<Trip>(INITIAL_TRIP);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDisrupted, setIsDisrupted] = useState<boolean>(false);
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOption[]>([]);
  const [hoveredRecoveryOption, setHoveredRecoveryOption] = useState<RecoveryOption | null>(null);
  const [activeRecoveryPlan, setActiveRecoveryPlan] = useState<RecoveryOption | null>(null);
  const [modalOptionToExecute, setModalOptionToExecute] = useState<RecoveryOption | null>(null);
  const [isInfeasibleState, setIsInfeasibleState] = useState<boolean>(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('flight_delay_90');
  const [isReportProblemOpen, setIsReportProblemOpen] = useState<boolean>(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Authentication & Onboarding
  const { user, loading } = useAuth();
  const [travellerProfile, setTravellerProfile] = useState<TravellerProfile | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [isProviderConnectionOpen, setIsProviderConnectionOpen] = useState<boolean>(false);
  const [isAccountDetailsOpen, setIsAccountDetailsOpen] = useState<boolean>(false);

  // Check profile upon authentication (Spec Section 1 & 2: First-time user onboarding)
  useEffect(() => {
    if (!user) {
      setTravellerProfile(null);
      setIsOnboardingOpen(false);
      setIsProviderConnectionOpen(false);
      return;
    }

    let isMounted = true;
    fetchTravellerProfile(user.uid, user.email || undefined).then((res) => {
      if (!isMounted) return;
      if (res.success && res.profile && res.profile.isComplete) {
        setTravellerProfile(res.profile);
        setIsOnboardingOpen(false);
      } else {
        // First-time user onboarding: Profile -> Provider Connections -> Plan Your Journey
        setIsOnboardingOpen(true);
      }
    }).catch((err) => {
      console.warn('[App] Profile fetch error, opening onboarding:', err);
      if (isMounted) setIsOnboardingOpen(true);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Spec requirement: First-time user: Google login → Traveller Profile → Provider Connections → Plan Your Journey
  const handleProfileComplete = (profile: TravellerProfile) => {
    playSound('success', soundEnabled);
    setTravellerProfile(profile);
    setIsOnboardingOpen(false);
    if (isEditingProfile) {
      setIsEditingProfile(false);
      setIsAccountDetailsOpen(true);
    } else {
      setIsProviderConnectionOpen(true);
    }
  };

  const handleCloseProfileModal = () => {
    setIsOnboardingOpen(false);
    if (isEditingProfile) {
      setIsEditingProfile(false);
      setIsAccountDetailsOpen(true);
    }
  };

  const handleProviderConnectionComplete = () => {
    playSound('success', soundEnabled);
    setIsProviderConnectionOpen(false);
    setActiveSection('journeys');
  };

  // Sync Booking Vault with Trip Graph for authenticated user (Sections 10, 18, 21)
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const syncVault = async () => {
      try {
        const idToken = await user.getIdToken();
        const res = await fetchUserBookings(idToken, user.uid);
        if (isMounted && res.success && res.bookings && res.bookings.length > 0) {
          const vaultBookings = res.bookings;
          const graphBookings: Booking[] = [];
          const graphEdges: TripEdge[] = [];

          vaultBookings.forEach((vb: any, bIdx: number) => {
            const segments = vb.segments || [];
            segments.forEach((seg: any, sIdx: number) => {
              const nodeX = -6 + (bIdx * 3 + sIdx) * 3;
              graphBookings.push({
                id: seg.id || `vb_${vb.id}_${sIdx}`,
                type: (seg.transportType || 'flight') as any,
                provider: seg.operator || vb.provider || 'MakeMyTrip Bharat',
                providerCode: seg.serviceNumber || 'MMT-RES',
                title: `${seg.operator || vb.title} (${seg.origin} → ${seg.destination})`,
                referenceCode: seg.pnr || vb.bookingReference,
                seatOrRoom: seg.seatClass || 'Confirmed Class',
                origin: seg.origin || 'BOM',
                destination: seg.destination || 'DEL',
                departureTime: seg.depTime || '10:15 IST',
                arrivalTime: seg.arrTime || '12:20 IST',
                departureTimestamp: Date.now() + 3600000 * (sIdx + 1),
                arrivalTimestamp: Date.now() + 3600000 * (sIdx + 3),
                price: Math.round(vb.totalPrice / (segments.length || 1)),
                currency: vb.currency || 'INR',
                status: (vb.status === 'DISRUPTED' ? 'delayed' : vb.status === 'CANCELLED' ? 'cancelled' : vb.status === 'RECOVERED' ? 'recovered' : 'normal') as any,
                location: {
                  city: seg.origin,
                  venue: `${seg.origin} Terminal`,
                  code: seg.origin.slice(0, 3).toUpperCase(),
                  x: nodeX,
                  y: 0,
                  z: 0,
                },
                riskLevel: (vb.status === 'DISRUPTED' || vb.status === 'CANCELLED' ? 'critical' : 'none') as any,
                delayMinutes: vb.disruption?.delayMinutes || 0,
                downstreamImpactIds: [],
                lastVerifiedAt: new Date().toLocaleTimeString('en-IN') + ' IST',
                isImportedStatus: false,
                policy: {
                  ruleId: 'DGCA_CAR_SEC3',
                  policyVersion: 'DGCA_2025_REV',
                  cancellationCutoffHours: 24,
                  baseDeduction: 0,
                  percentageDeduction: 0,
                  tdrEligible: false,
                  tdrWindowHours: 0,
                  termsSummary: vb.disruptionShield || '100% full statutory refund on carrier schedule disruption under DGCA CAR.',
                },
              });
            });
          });

          // Connect sequential segments with edges
          for (let i = 0; i < graphBookings.length - 1; i++) {
            graphEdges.push({
              id: `edge_vault_${i}`,
              fromBookingId: graphBookings[i].id,
              toBookingId: graphBookings[i + 1].id,
              minimumBufferMinutes: 45,
              actualBufferMinutes: 75,
              transferTimeMinutes: 30,
              dependencyType: 'connecting_service',
              status: 'safe',
              bufferWarningThresholdMinutes: 30,
            });
          }

          if (graphBookings.length > 0) {
            setTrip((prev) => ({
              ...prev,
              name: `${vaultBookings[0].title} Live Mission Graph`,
              bookings: graphBookings,
              edges: graphEdges,
            }));
          }
        }
      } catch (err) {
        console.warn('[App] Could not sync vault to trip graph:', err);
      }
    };

    syncVault();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Autoplay Carousel Effect
  useEffect(() => {
    if (!isAutoplay) return;
    const interval = setInterval(() => {
      setCurrentSlideIndex((prev) => (prev + 1) % FEATURED_DESTINATIONS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoplay]);

  const handlePrevSlide = () => {
    playSound('click', soundEnabled);
    setCurrentSlideIndex((prev) => (prev - 1 + FEATURED_DESTINATIONS.length) % FEATURED_DESTINATIONS.length);
  };

  const handleNextSlide = () => {
    playSound('click', soundEnabled);
    setCurrentSlideIndex((prev) => (prev + 1) % FEATURED_DESTINATIONS.length);
  };

  const handleSelectDestination = (dest: DestinationItem) => {
    playSound('click', soundEnabled);
    const idx = FEATURED_DESTINATIONS.findIndex((d) => d.id === dest.id);
    if (idx !== -1) setCurrentSlideIndex(idx);
  };

  const handleSearchSubmit = (params: any) => {
    playSound('click', soundEnabled);
    setSearchParams(params);
    setIsSearchResultsOpen(true);
  };

  // Disruption Ingestion & Propagation Handler (Sections 14, 20)
  const handleSimulateDisruption = async (
    scenarioId: string = 'flight_delay_90',
    customDetails?: {
      type: 'delay' | 'cancellation' | 'missed_connection';
      delayMinutes: number;
      reason: string;
      mode: string;
    }
  ) => {
    playSound('disruption', soundEnabled);
    setIsDisrupted(true);
    setActiveScenarioId(scenarioId);

    const scenarioDef = DISRUPTION_SCENARIOS.find((s) => s.id === scenarioId);

    let rootBookingId = scenarioDef?.rootBookingId || trip.bookings[0]?.id || 'bkg_flight_01';
    let rootType: 'cancellation' | 'delay' | 'missed_connection' = scenarioDef?.disruptionType || 'delay';
    let delayMinutes = scenarioDef?.delayMinutes ?? 90;
    let rootCause = scenarioDef?.reason || 'Air traffic control congestion at BOM Runway 27';

    if (customDetails) {
      rootType = customDetails.type;
      delayMinutes = customDetails.delayMinutes;
      rootCause = customDetails.reason;
      const match = trip.bookings.find((b) => b.type === customDetails.mode);
      if (match) rootBookingId = match.id;
    }

    const rootBooking = trip.bookings.find((b) => b.id === rootBookingId) || trip.bookings[0];

    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const res = await createDisruption(
        {
          bookingId: rootBookingId,
          provider: rootBooking?.provider || 'makemytrip',
          disruptionType: rootType === 'missed_connection' ? 'delay' : (rootType as 'cancellation' | 'delay'),
          delayMinutes,
          rootCause,
          source: 'LIVE_TELEMETRY',
        },
        idToken,
        user?.uid
      );

      if (res.success && res.disruption) {
        // Also propagate in-memory graph
        const propagationResult = propagateDisruption(trip.bookings, trip.edges, rootBookingId, rootType, delayMinutes, rootCause);
        const updatedBookings = trip.bookings.map((b) => propagationResult.updatedBookings.find((ib) => ib.id === b.id) || b);
        const generatedOptions = res.recoveryOptions || generateRecoveryOptions(rootBooking || updatedBookings[0], {
          ...trip,
          bookings: updatedBookings,
          edges: propagationResult.updatedEdges,
        });

        setTrip((prev) => ({
          ...prev,
          status: 'disrupted',
          bookings: updatedBookings,
          edges: propagationResult.updatedEdges,
        }));
        setRecoveryOptions(generatedOptions);
        return;
      }
    } catch (err) {
      console.warn('[Disruption] Backend disruption call notice, executing client deterministic engine:', err);
    }

    // Client fallback
    const propagationResult = propagateDisruption(trip.bookings, trip.edges, rootBookingId, rootType, delayMinutes, rootCause);
    const updatedBookings = trip.bookings.map((b) => propagationResult.updatedBookings.find((ib) => ib.id === b.id) || b);
    const generatedOptions = generateRecoveryOptions(rootBooking || updatedBookings[0], {
      ...trip,
      bookings: updatedBookings,
      edges: propagationResult.updatedEdges,
    });

    setTrip((prev) => ({
      ...prev,
      status: 'disrupted',
      bookings: updatedBookings,
      edges: propagationResult.updatedEdges,
    }));
    setRecoveryOptions(generatedOptions);
  };

  const handleResetTrip = () => {
    playSound('click', soundEnabled);
    setIsDisrupted(false);
    setActiveScenarioId('flight_delay_90');
    setRecoveryOptions([]);
    setHoveredRecoveryOption(null);
    setActiveRecoveryPlan(null);
    setSelectedBookingId(null);
    setTrip({
      ...INITIAL_TRIP,
      bookings: INITIAL_BOOKINGS.map((b) => ({ ...b })),
      edges: INITIAL_EDGES.map((e) => ({ ...e })),
      refundCases: INITIAL_REFUND_CASES.map((rc) => ({ ...rc })),
      preferences: { ...INITIAL_USER_PREFERENCES },
      status: 'monitoring',
    });
  };

  // Recovery Execution Handler (Sections 15, 20)
  const handleConfirmRecoveryExecution = async (executedOption: RecoveryOption) => {
    playSound('success', soundEnabled);
    setActiveRecoveryPlan(executedOption);

    const rootBooking = trip.bookings.find((b) => b.status === 'cancelled' || b.status === 'delayed') || trip.bookings[0];

    try {
      const idToken = user ? await user.getIdToken() : undefined;
      await executeRecovery(
        {
          bookingId: rootBooking?.id || 'bkg_flight_01',
          selectedOptionId: executedOption.id,
          optionTitle: executedOption.title,
          strategy: executedOption.strategy,
          netFinancialImpact: executedOption.netFinancialImpact,
          additionalCost: executedOption.additionalCost,
          refundRecoveryAmount: executedOption.refundRecoveryAmount,
        },
        idToken,
        user?.uid
      );
    } catch (err) {
      console.warn('[Recovery] Backend recovery execute sync notice:', err);
    }

    const recoveredBookings = trip.bookings.map((b) => ({
      ...b,
      status: 'recovered' as const,
      riskLevel: 'none' as const,
    }));

    setTrip((prev) => ({
      ...prev,
      status: 'recovered',
      bookings: recoveredBookings,
    }));

    setModalOptionToExecute(null);
  };

  const handleCancelBooking = async (bookingId: string) => {
    playSound('click', soundEnabled);
    try {
      const idToken = user ? await user.getIdToken() : undefined;
      const res = await cancelBooking(
        { bookingId, reason: 'Passenger voluntary cancellation' },
        idToken,
        user?.uid || 'usr_kaivalya_default'
      );

      setTrip((prev) => {
        const targetBooking = prev.bookings.find((b) => b.id === bookingId);
        const newRefundCases: RefundCase[] = res.refundCase
          ? [
              {
                id: res.refundCase.id,
                bookingId: res.refundCase.bookingId,
                bookingTitle: targetBooking?.title || 'Cancelled Segment',
                provider: res.refundCase.provider,
                bookingType: (targetBooking?.type || 'train') as any,
                ticketAmount: res.refundCase.originalAmount,
                estimatedRefund: res.refundCase.expectedRefund,
                deductionAmount: Math.max(0, res.refundCase.originalAmount - res.refundCase.expectedRefund),
                tdrRequired: res.refundCase.provider === 'irctc',
                tdrReasonCode: res.refundCase.tdrReference || 'VOLUNTARY_CANCEL',
                tdrWindowDescription: 'Direct settlement to original payment source',
                ruleId: res.refundCase.ruleId,
                policyVersion: res.refundCase.policyVersion,
                deterministicReason: res.refundCase.reason,
                aiExplanation: 'Statutory cancellation registered directly with partner carrier.',
                breakdown: {
                  baseFare: res.refundCase.originalAmount,
                  clerkageFee: 0,
                  cancellationCharges: Math.max(0, res.refundCase.originalAmount - res.refundCase.expectedRefund),
                  gstAdjustment: 0,
                  agentConvenienceFeeDeducted: 0,
                },
                status: res.refundCase.status as any,
                timestamp: new Date().toLocaleTimeString('en-IN') + ' IST',
                verifiedSource: 'IRCTC_PRSN_V2',
                isImportedStatus: false,
              },
              ...prev.refundCases,
            ]
          : prev.refundCases;

        return {
          ...prev,
          bookings: prev.bookings.map((b) => (b.id === bookingId ? { ...b, status: 'cancelled' as any } : b)),
          refundCases: newRefundCases,
        };
      });

      playSound('success', soundEnabled);
    } catch (err: any) {
      console.error('[API] Failed to cancel booking:', err);
    }
  };

  const selectedBooking = trip.bookings.find((b) => b.id === selectedBookingId) || null;

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F3EFE6] relative overflow-x-hidden font-sans-luxury selection:bg-[#D4AF37]/30 selection:text-[#FCE7AC]">
      {/* Loading Screen */}
      {loading && (
        <div className="fixed inset-0 z-[9999] bg-[#08090C] flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-2 border-[#D4AF37]/30 border-t-[#D4AF37] rounded-full animate-spin mx-auto" />
            <p className="text-xs font-cinzel tracking-[0.25em] text-[#D4AF37]/60 uppercase">Loading ReRoute</p>
          </div>
        </div>
      )}

      {/* Top Fixed ReRoute Navigation Header */}
      <ReRouteNavigation
        activeSection={activeSection}
        onSelectSection={(sec) => {
          playSound('click', soundEnabled);
          setActiveSection(sec);
        }}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onOpenProviders={() => setIsProviderConnectionOpen(true)}
        onOpenAccount={() => setIsAccountDetailsOpen(true)}
        user={user}
        onOpenSearch={() => {
          setSearchParams({
            origin: 'JFK New York',
            destination: currentDestination.name,
            departDate: '24 May, 2025',
            returnDate: '31 May, 2025',
            travelers: '2 Adults',
            cabinClass: 'Business',
            mode: 'flight',
          });
          setIsSearchResultsOpen(true);
        }}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setSelectedCurrency}
      />

      {/* Left Floating Category Dock & Vertical "SCROLL TO EXPLORE" */}
      <VerticalSidebarDock
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          playSound('click', soundEnabled);
          setActiveCategory(cat);
          if (cat === 'stays') setIsFullPanoramaOpen(true);
          if (cat === 'vip_services') setIsSignInOpen(true);
          if (cat === 'flights' || cat === 'trains') {
            setSearchParams({
              origin: 'JFK New York',
              destination: currentDestination.name,
              departDate: '24 May, 2025',
              returnDate: '31 May, 2025',
              travelers: '2 Adults',
              cabinClass: 'First Class',
              mode: cat === 'trains' ? 'train' : 'flight',
            });
            setIsSearchResultsOpen(true);
          }
        }}
        onPrevSlide={handlePrevSlide}
        onNextSlide={handleNextSlide}
        currentSlideIndex={currentSlideIndex}
        totalSlides={FEATURED_DESTINATIONS.length}
      />

      {/* Main Content Viewport */}
      <main
        id="main-content"
        className="w-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 xl:pl-28 xl:pr-12 pt-24 pb-28 space-y-16 transition-all duration-300 relative z-10"
      >
        {/* SECTION 1: DESTINATIONS & EDITORIAL PORTAL */}
        {activeSection === 'destinations' && (
          <div className="space-y-10 animate-fadeIn">
            {/* Hero Panoramic Depth-Shader Banner & "PLAN YOUR JOURNEY" Card */}
            <HeroJourneySection
              currentDestination={currentDestination}
              slideIndex={currentSlideIndex}
              totalSlides={FEATURED_DESTINATIONS.length}
              isPlaying={isAutoplay}
              onTogglePlay={() => setIsAutoplay(!isAutoplay)}
              onExploreJourneys={() => {
                playSound('click', soundEnabled);
                setActiveSection('journeys');
                setSearchParams(prev => ({
                  ...prev,
                  destination: currentDestination.name,
                }));
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSearchSubmit={handleSearchSubmit}
              reducedMotion={reducedMotion}
            />

            {/* Featured Destinations: 3D Interactive Tilt Cards Deck (Full Width) */}
            <div className="w-full space-y-4">
              <DestinationTiltCards
                selectedDestinationId={currentDestination.id}
                onSelectDestination={handleSelectDestination}
                reducedMotion={reducedMotion}
              />
            </div>

            {/* Bottom: 4 Value Propositions Bar */}
            <ValuePropositionBar
              onSelectFeature={(feat) => {
                if (feat === 'concierge') setActiveSection('concierge');
                if (feat === 'vip') setIsSignInOpen(true);
                if (feat === 'seamless') setActiveSection('journeys');
                if (feat === 'guarantee') setActiveSection('journeys');
              }}
            />
          </div>
        )}

        {/* SECTION 2: JOURNEYS & 2D SPATIAL CORRIDORS */}
        {activeSection === 'journeys' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gold-subtle pb-4">
              <div>
                <span className="text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
                  2D CARTOGRAPHIC CORRIDORS & TRIP GRAPH
                </span>
                <h2 className="font-serif-display text-3xl sm:text-4xl text-white mt-1">
                  Living Multi-Modal Transit Corridors
                </h2>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleSimulateDisruption('flight_cancel')}
                  className="px-4 py-2 rounded-full border border-amber-500/50 bg-amber-500/10 hover:bg-amber-500/20 text-xs font-cinzel text-amber-300 transition-all cursor-pointer"
                >
                  ⚡ Simulate Disruption
                </button>
                {isDisrupted && (
                  <button
                    onClick={handleResetTrip}
                    className="px-4 py-2 rounded-full border border-slate-700 hover:border-slate-500 text-xs font-cinzel text-slate-300 cursor-pointer"
                  >
                    Reset Corridor
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              {/* Left Column: Plan Journey Widget */}
              <div className="xl:col-span-4">
                <PlanJourneyWidget
                  initialOrigin={searchParams?.origin || ''}
                  initialDestination={searchParams?.destination || ''}
                  onRouteChange={(orig, dest, mode) => {
                    const hasEntered = Boolean(orig?.trim() && dest?.trim());
                    setHasUserEnteredJourney(hasEntered);
                    setSearchParams(prev => ({
                      ...prev,
                      origin: orig,
                      destination: dest,
                      mode: mode,
                    }));
                  }}
                  onSearchSubmit={(params) => {
                    setHasUserEnteredJourney(Boolean(params.origin?.trim() && params.destination?.trim()));
                    setSearchParams(params);
                    setIsSearchResultsOpen(true);
                  }}
                />
              </div>

              {/* Right Column: 2D Real-Time World Map & Transport Animation Canvas */}
              <div className="xl:col-span-8 space-y-8">
                <div className="relative w-full h-[540px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-gold-subtle bg-slate-950">
                  <TwoDimTripGraph
                    bookings={trip.bookings}
                    edges={trip.edges}
                    selectedBookingId={selectedBookingId}
                    onSelectBooking={(id) => {
                      playSound('click', soundEnabled);
                      setSelectedBookingId(id);
                    }}
                    hoveredRecoveryOption={hoveredRecoveryOption}
                    activeRecoveryPlan={activeRecoveryPlan}
                    isDisrupted={isDisrupted}
                    reducedMotion={reducedMotion}
                    searchOrigin={searchParams?.origin || ''}
                    searchDestination={searchParams?.destination || ''}
                    searchMode={searchParams?.mode || 'flight'}
                    hasUserEntered={hasUserEnteredJourney}
                    onSelectRoute={(orig, dest, mode) => {
                      setHasUserEnteredJourney(true);
                      setSearchParams(prev => ({
                        ...prev,
                        origin: orig,
                        destination: dest,
                        mode: mode,
                      }));
                    }}
                    onClearRoute={() => {
                      setHasUserEnteredJourney(false);
                      setSearchParams(prev => ({
                        ...prev,
                        origin: '',
                        destination: '',
                      }));
                    }}
                  />

                  {/* Spatial Node Inspector Floating Panel */}
                  <AnimatePresence>
                    {selectedBooking && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.2 }}
                      >
                        <SpatialNodeInspector
                          booking={selectedBooking}
                          edges={trip.edges}
                          onClose={() => setSelectedBookingId(null)}
                          onNavigateToRefunds={() => setActiveSection('concierge')}
                          onSimulateNodeDisruption={() => handleSimulateDisruption('flight_delay_90')}
                          onCancelBooking={handleCancelBooking}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Timeline */}
                <TripTimeline
                  bookings={trip.bookings}
                  edges={trip.edges}
                  selectedBookingId={selectedBookingId}
                  onSelectBooking={(id) => {
                    playSound('click', soundEnabled);
                    setSelectedBookingId(id);
                  }}
                  isDisrupted={isDisrupted}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 3: EMERGENCY ASSISTANCE & GLOBAL DIRECTORY */}
        {activeSection === 'emergency' && (
          <EmergencySection onNavigateSection={(sec) => setActiveSection(sec as ReRouteSection)} />
        )}

        {/* SECTION 4: CONCIERGE & DISRUPTION RECOVERY */}
        {activeSection === 'concierge' && (
          <div className="space-y-16 animate-fadeIn w-full">
            {/* Top Concierge Hero & Quick Jump Navigation Bar */}
            <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0D13]/90 border border-gold-subtle backdrop-blur-xl shadow-2xl space-y-6">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-6 border-b border-gold-subtle/40">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37] uppercase">
                      24/7 AUTONOMOUS RECOVERY INTELLIGENCE
                    </span>
                  </div>
                  <h2 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl text-white">
                    Concierge Disruption Shield & Statutory Engine
                  </h2>
                  <p className="text-xs sm:text-sm font-sans-luxury text-slate-300 font-light max-w-3xl leading-relaxed">
                    Continuous real-time itinerary surveillance across air, rail, and royal stays. Guaranteed 100% deterministic refund recoveries under DGCA Civil Aviation Requirements and IRCTC PRS rules.
                  </p>
                </div>

                {/* Status KPI Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 self-stretch xl:self-auto flex-shrink-0">
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-gold-subtle text-center">
                    <div className="text-[10px] font-cinzel text-slate-400 uppercase tracking-wider">ITINERARY SHIELD</div>
                    <div className="text-base sm:text-lg font-serif-display font-bold text-emerald-400 mt-0.5">100% Active</div>
                    <div className="text-[9px] font-mono text-slate-400">DGCA CAR & IRCTC</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-gold-subtle text-center">
                    <div className="text-[10px] font-cinzel text-slate-400 uppercase tracking-wider">MANDATED REFUND</div>
                    <div className="text-base sm:text-lg font-serif-display font-bold text-[#FCE7AC] mt-0.5">₹7,060</div>
                    <div className="text-[9px] font-mono text-slate-400">Auto-Queued TDR</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-gold-subtle text-center col-span-2 sm:col-span-1">
                    <div className="text-[10px] font-cinzel text-slate-400 uppercase tracking-wider">PALACE CURFEW</div>
                    <div className="text-base sm:text-lg font-serif-display font-bold text-slate-100 mt-0.5">12:20 IST</div>
                    <div className="text-[9px] font-mono text-emerald-400">Option A Secured</div>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Scroll Anchor Links */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <div className="flex items-center space-x-2 text-xs font-cinzel text-slate-400">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>SCROLL DOWN OR DIRECT JUMP:</span>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    onClick={() => setIsReportProblemOpen(true)}
                    className="px-4 py-2 rounded-full bg-rose-950/40 hover:bg-rose-900/60 border border-rose-500/80 hover:border-rose-400 text-xs font-cinzel font-semibold text-rose-200 hover:text-white transition-all cursor-pointer flex items-center space-x-2 shadow-lg shadow-rose-950/40"
                  >
                    <span className="w-4 h-4 rounded-full border border-rose-400 flex items-center justify-center text-[10px] font-bold font-mono">!</span>
                    <span>🚨 REPORT MID-JOURNEY PROBLEM</span>
                  </button>
                  <button
                    onClick={() => document.getElementById('concierge-ai-terminal')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 rounded-full bg-slate-950/90 hover:bg-[#D4AF37]/10 border border-gold-subtle hover:border-gold-bright text-xs font-cinzel font-semibold text-slate-200 hover:text-[#FCE7AC] transition-all cursor-pointer"
                  >
                    1. AI CONCIERGE TERMINAL
                  </button>
                  <button
                    onClick={() => document.getElementById('concierge-cascade-radar')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 rounded-full bg-slate-950/90 hover:bg-[#D4AF37]/10 border border-gold-subtle hover:border-gold-bright text-xs font-cinzel font-semibold text-slate-200 hover:text-[#FCE7AC] transition-all cursor-pointer"
                  >
                    1B. CASCADE RADAR
                  </button>
                  <button
                    onClick={() => document.getElementById('concierge-recovery-planner')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 rounded-full bg-slate-950/90 hover:bg-[#D4AF37]/10 border border-gold-subtle hover:border-gold-bright text-xs font-cinzel font-semibold text-slate-200 hover:text-[#FCE7AC] transition-all cursor-pointer"
                  >
                    2. MULTI-MODAL RECOVERY PLANS ({recoveryOptions.length > 0 ? recoveryOptions.length : 3})
                  </button>
                  <button
                    onClick={() => document.getElementById('concierge-refund-engine')?.scrollIntoView({ behavior: 'smooth' })}
                    className="px-4 py-2 rounded-full bg-slate-950/90 hover:bg-[#D4AF37]/10 border border-gold-subtle hover:border-gold-bright text-xs font-cinzel font-semibold text-slate-200 hover:text-[#FCE7AC] transition-all cursor-pointer"
                  >
                    3. STATUTORY REFUND & TDR INTELLIGENCE
                  </button>
                </div>
              </div>
            </div>

            {/* PART 0: POST-BOOKING CAPTURE & EXTENSIONS (STAYS & DAY TRIPS) */}
            <section id="concierge-extensions-hub" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-gold-subtle/50 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-slate-950 font-cinzel font-bold text-xs flex items-center justify-center shadow-md">
                    00
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white">
                      Captured Booking Telemetry & Trip Extensions
                    </h3>
                    <p className="text-xs text-slate-400 font-sans-luxury">
                      Synchronized departure and destination arrival times with curated luxury stays and short excursions with redirected booking links.
                    </p>
                  </div>
                </div>
              </div>

              <ConciergeTripExtensionsSection
                onNavigateSection={(sec) => setActiveSection(sec as any)}
              />
            </section>

            {/* PART 1: AI CONCIERGE TERMINAL (WIDE & SPACIOUS) */}
            <section id="concierge-ai-terminal" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-gold-subtle/50 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-slate-950 font-cinzel font-bold text-xs flex items-center justify-center shadow-md">
                    01
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white">
                      ReRoute Privé AI Concierge Terminal
                    </h3>
                    <p className="text-xs text-slate-400 font-sans-luxury">
                      Natural language travel assistant grounded strictly in verified itinerary facts, IRCTC rules, and palace coordination.
                    </p>
                  </div>
                </div>
              </div>

              <AIAssistantDrawer
                trip={trip}
                isDisrupted={isDisrupted}
                recoveryOptions={recoveryOptions}
                onSelectOption={(opt) => setModalOptionToExecute(opt)}
                onNavigateTab={(tab) => {
                  if (tab === 'command_center') setActiveSection('journeys');
                  if (tab === 'translator') setActiveSection('translator');
                  if (tab === 'recovery_planner') {
                    document.getElementById('concierge-recovery-planner')?.scrollIntoView({ behavior: 'smooth' });
                  }
                  if (tab === 'refund_intelligence') {
                    document.getElementById('concierge-refund-engine')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              />
            </section>

            {/* PART 1B: CASCADE RADAR & DISRUPTION PROPAGATION (RADAR GRAPH) */}
            <section id="concierge-cascade-radar" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-gold-subtle/50 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-rose-500 text-white font-cinzel font-bold text-xs flex items-center justify-center shadow-md shadow-rose-950/50">
                    1B
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white">
                      Cascade Radar & Disruption Propagation Engine
                    </h3>
                    <p className="text-xs text-slate-400 font-sans-luxury">
                      Simulate 8 curated operational disruptions or report live incidents to inspect mathematical cascade effects across connecting bookings.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsReportProblemOpen(true)}
                  className="px-3.5 py-1.5 rounded-full bg-rose-950/60 hover:bg-rose-900/80 border border-rose-500/70 text-xs font-cinzel font-semibold text-rose-200 transition-all cursor-pointer flex items-center space-x-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                  <span>Report Disruption</span>
                </button>
              </div>

              <DisruptionCascadeView
                bookings={trip.bookings}
                edges={trip.edges}
                isDisrupted={isDisrupted}
                proactiveWarnings={trip.proactiveWarnings}
                onSimulateScenario={(scId) => handleSimulateDisruption(scId)}
                onReset={handleResetTrip}
                onOpenRecovery={() => {
                  document.getElementById('concierge-recovery-planner')?.scrollIntoView({ behavior: 'smooth' });
                }}
                onSelectBooking={(id) => setSelectedBookingId(id)}
                activeScenarioId={activeScenarioId}
              />
            </section>

            {/* PART 2: AUTONOMOUS MULTI-MODAL RECOVERY PLANS (WIDE & SPACIOUS) */}
            <section id="concierge-recovery-planner" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-gold-subtle/50 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-slate-950 font-cinzel font-bold text-xs flex items-center justify-center shadow-md">
                    02
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white">
                      Autonomous Multi-Modal Recovery Plans ({recoveryOptions.length > 0 ? recoveryOptions.length : 3})
                    </h3>
                    <p className="text-xs text-slate-400 font-sans-luxury">
                      Compare feasible rebooking corridors with net financial impact, timing buffers, and royal comfort scores.
                    </p>
                  </div>
                </div>
              </div>

              <RecoveryPlannerSection
                recoveryOptions={recoveryOptions.length > 0 ? recoveryOptions : generateRecoveryOptions(trip.bookings[0], trip)}
                userPreferences={trip.preferences}
                onChangePriority={(newP) => {
                  const up = { ...trip.preferences, priority: newP };
                  setTrip((prev) => ({ ...prev, preferences: up }));
                  if (isDisrupted) {
                    setRecoveryOptions(generateRecoveryOptions(trip.bookings[0], { ...trip, preferences: up }));
                  }
                }}
                onHoverRecoveryOption={setHoveredRecoveryOption}
                onSelectRecoveryOption={(opt) => setModalOptionToExecute(opt)}
                selectedOptionId={activeRecoveryPlan?.id}
                isInfeasibleState={isInfeasibleState}
              />
            </section>

            {/* PART 3: DETERMINISTIC REFUND & STATUTORY TDR ENGINE (WIDE & SPACIOUS) */}
            <section id="concierge-refund-engine" className="scroll-mt-28 space-y-4">
              <div className="flex items-center justify-between border-b border-gold-subtle/50 pb-3">
                <div className="flex items-center space-x-3">
                  <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-slate-950 font-cinzel font-bold text-xs flex items-center justify-center shadow-md">
                    03
                  </span>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold font-serif-display text-white">
                      Statutory Refund & Deterministic TDR Intelligence
                    </h3>
                    <p className="text-xs text-slate-400 font-sans-luxury">
                      Automatic IRCTC TDR filing, DGCA Civil Aviation Requirements statutory audit, and live rulebook simulator.
                    </p>
                  </div>
                </div>
              </div>

              <RefundIntelligenceSection refundCases={trip.refundCases} />
            </section>
          </div>
        )}

        {/* SECTION: LIVE SPEECH & CONCIERGE TRANSLATOR */}
        {activeSection === 'translator' && (
          <LiveTranslatorSection
            onNavigateSection={(sec) => setActiveSection(sec as ReRouteSection)}
          />
        )}

        {/* SECTION 5: MEMBERSHIP */}
        {user && activeSection === 'membership' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto py-8">
            <div className="text-center space-y-3">
              <span className="text-[11px] font-cinzel font-semibold tracking-[0.35em] text-[#D4AF37] uppercase">
                RE ROUTE BHARAT PRIVÉ GUILD
              </span>
              <h2 className="font-serif-display text-4xl sm:text-5xl text-white">
                India's Premier Travel Intelligence & Royal Guild
              </h2>
              <p className="text-sm font-sans-luxury text-slate-300 max-w-2xl mx-auto font-light">
                Engineered for Indian families, executives, and connoisseurs. Zero disruption anxiety, guaranteed IRCTC & DGCA statutory refund recoveries, and bespoke hospitality.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-8 rounded-3xl bg-[#0E1017] border border-gold-subtle space-y-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-cinzel font-bold tracking-widest bg-slate-800 text-[#FCE7AC]">
                  BHARAT PRIVÉ VOYAGER
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif-display text-3xl text-white">₹18,500 / year</h3>
                  <p className="text-xs text-[#D4AF37] font-cinzel tracking-wider">Ideal for Indian Families & Executives</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 font-sans-luxury">
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>100% Automated IRCTC TDR filing & DGCA airline refund recovery directly to UPI</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Vande Bharat & Shatabdi priority rebooking & tatkal confirmation tracking</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Domestic airport lounge guarantee at BOM T2, DEL T3, BLR, HYD</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>24/7 dedicated WhatsApp desk with verified Pure Veg & Jain dining care</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>15% privilege benefits at Taj, ITC & Oberoi partner heritage hotels</span>
                  </li>
                </ul>
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="w-full py-3 rounded-xl border border-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-white hover:text-slate-950 font-cinzel text-xs font-bold tracking-widest transition-all cursor-pointer"
                >
                  APPLY FOR BHARAT PRIVÉ
                </button>
              </div>

              <div className="p-8 rounded-3xl bg-[#0E1017] border border-gold-bright space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl" />
                <span className="px-3 py-1 rounded-full text-[10px] font-cinzel font-bold tracking-widest bg-[#D4AF37] text-slate-950">
                  ROYAL MAHARAJA CIRCLE
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif-display text-3xl text-white">₹85,000 / year</h3>
                  <p className="text-xs text-[#D4AF37] font-cinzel tracking-wider">For Elite Families, Founders & HNIs</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 font-sans-luxury">
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Unlimited Autonomous Air & Rail Disruption Reroutes with instant cash advances</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Guaranteed private airport transfers in BMW / Mercedes / Fortuner</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Priority private jet & helicopter charter access (Udaipur, Goa, Kashmir)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Direct WhatsApp & phone line to ReRoute Chief Concierge (English & Hindi)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Exclusive access to unpublished grand suites at Taj Lake Palace & Oberoi</span>
                  </li>
                </ul>
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="w-full py-3 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-widest transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                >
                  ENTER MAHARAJA PORTAL
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Fullscreen 360 Panorama Modal */}
      <Full360PanoramaModal
        destination={currentDestination}
        isOpen={isFullPanoramaOpen}
        onClose={() => setIsFullPanoramaOpen(false)}
      />

      {/* ReRoute Privé Sign In Modal */}
      <ReRouteSignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
      />

      {/* First-Login Traveller Profile & Onboarding Modal */}
      {user && (
        <TravellerProfileModal
          isOpen={isOnboardingOpen}
          userId={user.uid}
          userEmail={user.email || ''}
          defaultName={user.displayName || ''}
          initialProfile={travellerProfile}
          isEditing={isEditingProfile}
          onClose={handleCloseProfileModal}
          onComplete={handleProfileComplete}
        />
      )}

      {/* Provider Connection Center Modal */}
      {user && (
        <ProviderConnectionModal
          isOpen={isProviderConnectionOpen}
          userId={user.uid}
          onClose={() => setIsProviderConnectionOpen(false)}
          onContinueToJourneys={handleProviderConnectionComplete}
          isInitialOnboarding={isOnboardingOpen === false}
        />
      )}

      {/* Account Details & Profile Dossier Modal */}
      {user && (
        <AccountDetailsModal
          isOpen={isAccountDetailsOpen}
          onClose={() => setIsAccountDetailsOpen(false)}
          onOpenEditProfile={() => {
            setIsAccountDetailsOpen(false);
            setIsEditingProfile(true);
            setIsOnboardingOpen(true);
          }}
          onOpenProviders={() => setIsProviderConnectionOpen(true)}
        />
      )}

      {/* Curated Journey Search Results Modal */}
      <JourneySearchResultsModal
        isOpen={isSearchResultsOpen}
        onClose={() => setIsSearchResultsOpen(false)}
        params={searchParams}
        destinationItem={currentDestination}
        onNavigateToConcierge={() => setActiveSection('concierge')}
      />

      {/* Report Mid-Journey Problem Modal */}
      <ReportMidJourneyProblemModal
        isOpen={isReportProblemOpen}
        onClose={() => setIsReportProblemOpen(false)}
        onTriggerDisruption={(scenarioId, customDetails) => {
          handleSimulateDisruption(scenarioId, customDetails);
          setTimeout(() => {
            document.getElementById('concierge-cascade-radar')?.scrollIntoView({ behavior: 'smooth' });
          }, 250);
        }}
      />

      {/* 5-Stage Mission Execution Modal */}
      <ActionConfirmationModal
        option={modalOptionToExecute}
        isOpen={!!modalOptionToExecute}
        onClose={() => setModalOptionToExecute(null)}
        onConfirmSuccess={handleConfirmRecoveryExecution}
        playSound={(type) => playSound(type, soundEnabled)}
      />

      {/* ReRoute Editorial Footer */}
      <footer className="w-full border-t border-gold-subtle py-8 text-center text-xs font-cinzel text-slate-400 bg-[#06070A]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <span className="text-[#D4AF37] font-serif-display font-medium text-base tracking-widest">
              RE ROUTE
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400 text-[11px] font-sans-luxury">
              Vogue Travel & 3D Panorama • Curated Luxury Portals
            </span>
          </div>
          <div className="text-slate-500 text-[10px] tracking-widest font-mono">
            PARIS • MILAN • TOKYO • NEW YORK • AMALFI
          </div>
        </div>
      </footer>
    </div>
  );
}
