import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  INITIAL_TRIP,
  INITIAL_BOOKINGS,
  INITIAL_EDGES,
  INITIAL_REFUND_CASES,
  INITIAL_USER_PREFERENCES,
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
import { ImmersiveStayCard } from './components/ImmersiveStayCard';
import { ValuePropositionBar } from './components/ValuePropositionBar';
import { Full360PanoramaModal } from './components/Full360PanoramaModal';
import { ReRouteSignInModal } from './components/ReRouteSignInModal';
import { JourneySearchResultsModal } from './components/JourneySearchResultsModal';

// Disruption & 3D Spatial Systems
import { ThreeTripGraph } from './components/ThreeTripGraph';
import { TripTimeline } from './components/TripTimeline';
import { SpatialNodeInspector } from './components/SpatialNodeInspector';
import { DisruptionCascadeView } from './components/DisruptionCascadeView';
import { RecoveryPlannerSection } from './components/RecoveryPlannerSection';
import { RefundIntelligenceSection } from './components/RefundIntelligenceSection';
import { ProviderAdapterSection } from './components/ProviderAdapterSection';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ActionConfirmationModal } from './components/ActionConfirmationModal';
import { PanoramicSuiteViewer } from './components/PanoramicSuiteViewer';

export default function App() {
  // Navigation & Category States
  const [activeSection, setActiveSection] = useState<ReRouteSection>('destinations');
  const [activeCategory, setActiveCategory] = useState<SidebarCategory>('home');
  const [selectedCurrency, setSelectedCurrency] = useState('USD');

  // Destination & Carousel State
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);
  const currentDestination = FEATURED_DESTINATIONS[currentSlideIndex];

  // Modals & Overlays
  const [isFullPanoramaOpen, setIsFullPanoramaOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSearchResultsOpen, setIsSearchResultsOpen] = useState(false);
  const [searchParams, setSearchParams] = useState<any>(null);

  // Canonical Trip & Recovery State (Engine Core)
  const [trip, setTrip] = useState<Trip>(INITIAL_TRIP);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDisrupted, setIsDisrupted] = useState<boolean>(false);
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOption[]>([]);
  const [hoveredRecoveryOption, setHoveredRecoveryOption] = useState<RecoveryOption | null>(null);
  const [activeRecoveryPlan, setActiveRecoveryPlan] = useState<RecoveryOption | null>(null);
  const [modalOptionToExecute, setModalOptionToExecute] = useState<RecoveryOption | null>(null);
  const [isInfeasibleState, setIsInfeasibleState] = useState<boolean>(false);

  // Settings
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

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

  // Disruption Simulation Handler
  const handleSimulateDisruption = (scenario: 'flight_cancel' | 'flight_delay_90' = 'flight_cancel') => {
    playSound('disruption', soundEnabled);
    setIsDisrupted(true);
    const rootBookingId = 'bk_flight_1';
    const rootType = scenario === 'flight_cancel' ? 'cancellation' : 'delay';
    const delayMinutes = scenario === 'flight_delay_90' ? 90 : 180;

    const propagationResult = propagateDisruption(trip.bookings, trip.edges, rootBookingId, rootType, delayMinutes);
    const updatedBookings = trip.bookings.map((b) => propagationResult.updatedBookings.find((ib) => ib.id === b.id) || b);

    const rootBooking = updatedBookings.find((b) => b.id === rootBookingId) || updatedBookings[0];
    const generatedOptions = generateRecoveryOptions(rootBooking, {
      ...trip,
      bookings: updatedBookings,
      edges: propagationResult.updatedEdges,
    });

    setTrip((prev) => ({
      ...prev,
      status: 'impacted',
      bookings: updatedBookings,
      edges: propagationResult.updatedEdges,
    }));
    setRecoveryOptions(generatedOptions);
  };

  const handleResetTrip = () => {
    playSound('click', soundEnabled);
    setIsDisrupted(false);
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
      disruptionSummary: null,
    });
  };

  const handleConfirmRecoveryExecution = (executedOption: RecoveryOption) => {
    playSound('success', soundEnabled);
    setActiveRecoveryPlan(executedOption);

    const recoveredBookings = trip.bookings.map((b) => ({
      ...b,
      status: 'recovered' as const,
      riskLevel: 'nominal' as const,
    }));

    setTrip((prev) => ({
      ...prev,
      status: 'recovered',
      bookings: recoveredBookings,
    }));

    setModalOptionToExecute(null);
  };

  const selectedBooking = trip.bookings.find((b) => b.id === selectedBookingId) || null;

  return (
    <div className="min-h-screen bg-[#08090C] text-[#F3EFE6] relative overflow-x-hidden font-sans-luxury selection:bg-[#D4AF37]/30 selection:text-[#FCE7AC]">
      {/* Top Fixed ReRoute Navigation Header */}
      <ReRouteNavigation
        activeSection={activeSection}
        onSelectSection={(sec) => {
          playSound('click', soundEnabled);
          setActiveSection(sec);
        }}
        onOpenSignIn={() => setIsSignInOpen(true)}
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
      <main className="w-full max-w-[1440px] mx-auto px-4 sm:px-8 xl:pl-28 xl:pr-12 pt-24 pb-16 space-y-12">
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
              onSearchSubmit={handleSearchSubmit}
              reducedMotion={reducedMotion}
            />

            {/* Showcase Row: 3D Tilt Cards (Amalfi, Santorini, Kyoto, Machu Picchu) + 360° Immersive Stay */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              {/* Left: 3D Interactive Tilt Cards Deck */}
              <div className="xl:col-span-6 space-y-4">
                <DestinationTiltCards
                  selectedDestinationId={currentDestination.id}
                  onSelectDestination={handleSelectDestination}
                  reducedMotion={reducedMotion}
                />
              </div>

              {/* Right: Immersive Stay 360° Panorama with 4-Way Spatial Control Pad */}
              <div className="xl:col-span-6 space-y-4">
                <ImmersiveStayCard
                  destination={currentDestination}
                  onOpenFullPanorama={() => setIsFullPanoramaOpen(true)}
                  reducedMotion={reducedMotion}
                />
              </div>
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

        {/* SECTION 2: JOURNEYS & 3D SPATIAL CORRIDORS */}
        {activeSection === 'journeys' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-gold-subtle pb-4">
              <div>
                <span className="text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
                  3D SPATIAL CORRIDORS & TRIP GRAPH
                </span>
                <h2 className="font-serif-display text-3xl sm:text-4xl text-white mt-1">
                  Living Multi-Modal Flightpaths
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

            {/* 3D Catmull-Rom WebGL Spatial Canvas */}
            <div className="relative w-full h-[540px] sm:h-[620px] rounded-3xl overflow-hidden shadow-2xl border border-gold-subtle bg-slate-950">
              <ThreeTripGraph
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
        )}

        {/* SECTION 3: EXPERIENCES & PANORAMAS */}
        {activeSection === 'experiences' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-gold-subtle pb-4">
              <span className="text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
                CURATED EXPERIENCES & PRIVATE RESIDENCES
              </span>
              <h2 className="font-serif-display text-3xl sm:text-4xl text-white mt-1">
                Virtual Suite Panoramas & Private Charters
              </h2>
            </div>
            <PanoramicSuiteViewer />
          </div>
        )}

        {/* SECTION 4: CONCIERGE & DISRUPTION RECOVERY */}
        {activeSection === 'concierge' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="border-b border-gold-subtle pb-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
                  24/7 AUTONOMOUS RECOVERY INTELLIGENCE
                </span>
                <h2 className="font-serif-display text-3xl sm:text-4xl text-white mt-1">
                  Concierge Disruption Shield & Statutory Refund Engine
                </h2>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-7">
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
              </div>

              <div className="xl:col-span-5 space-y-6">
                <RefundIntelligenceSection refundCases={trip.refundCases} />
                <AIAssistantDrawer
                  trip={trip}
                  isDisrupted={isDisrupted}
                  recoveryOptions={recoveryOptions}
                  onSelectOption={(opt) => setModalOptionToExecute(opt)}
                  onNavigateTab={(tab) => {
                    if (tab === 'command_center') setActiveSection('journeys');
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION 5: MEMBERSHIP */}
        {activeSection === 'membership' && (
          <div className="space-y-8 animate-fadeIn max-w-4xl mx-auto py-8">
            <div className="text-center space-y-3">
              <span className="text-[11px] font-cinzel font-semibold tracking-[0.35em] text-[#D4AF37] uppercase">
                RE ROUTE PRIVÉ MEMBERSHIP
              </span>
              <h2 className="font-serif-display text-4xl sm:text-5xl text-white">
                The World's Most Exclusive Travel Guild
              </h2>
              <p className="text-sm font-sans-luxury text-slate-300 max-w-2xl mx-auto font-light">
                Uncompromising luxury, instant disruption protection, private aviation access, and bespoke Michelin dining allocations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <div className="p-8 rounded-3xl bg-[#0E1017] border border-gold-subtle space-y-6">
                <span className="px-3 py-1 rounded-full text-[10px] font-cinzel font-bold tracking-widest bg-slate-800 text-slate-300">
                  BLACK TIER PRIVÉ
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif-display text-3xl text-white">$12,000 / year</h3>
                  <p className="text-xs text-[#D4AF37] font-cinzel tracking-wider">Invitation or Board Approval</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 font-sans-luxury">
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Guaranteed private jet standby charter allocations</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>24/7 dedicated Human + AI Disruption Response team</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>100% Statutory Refund Recovery & Liquidity Advances</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Complimentary 360° Villa Previews & Sommelier Tastings</span>
                  </li>
                </ul>
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="w-full py-3 rounded-xl border border-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37] text-white hover:text-slate-950 font-cinzel text-xs font-bold tracking-widest transition-all cursor-pointer"
                >
                  SIGN IN TO PRIVÉ
                </button>
              </div>

              <div className="p-8 rounded-3xl bg-[#0E1017] border border-gold-bright space-y-6 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#D4AF37]/10 rounded-full blur-2xl" />
                <span className="px-3 py-1 rounded-full text-[10px] font-cinzel font-bold tracking-widest bg-[#D4AF37] text-slate-950">
                  OBSIDIAN FOUNDER CIRCLE
                </span>
                <div className="space-y-1">
                  <h3 className="font-serif-display text-3xl text-white">By Invitation Only</h3>
                  <p className="text-xs text-[#D4AF37] font-cinzel tracking-wider">Limited to 100 Patrons Globally</p>
                </div>
                <ul className="space-y-3 text-xs text-slate-300 font-sans-luxury">
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Unlimited Autonomous Air & Rail Disruption Reroutes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Direct WhatsApp line to ReRoute Chief Concierge</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Private superyacht docking privileges along Amalfi & French Riviera</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-[#D4AF37]">✦</span>
                    <span>Exclusive access to unpublished grand suites</span>
                  </li>
                </ul>
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className="w-full py-3 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-widest transition-all cursor-pointer shadow-lg shadow-[#D4AF37]/20"
                >
                  ENTER FOUNDER PORTAL
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

      {/* Curated Journey Search Results Modal */}
      <JourneySearchResultsModal
        isOpen={isSearchResultsOpen}
        onClose={() => setIsSearchResultsOpen(false)}
        params={searchParams}
        destinationItem={currentDestination}
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
