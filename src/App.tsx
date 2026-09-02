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

import { Navigation, ActiveTab } from './components/Navigation';
import { HeroLanding } from './components/HeroLanding';
import { ThreeTripGraph } from './components/ThreeTripGraph';
import { TripTimeline } from './components/TripTimeline';
import { SpatialNodeInspector } from './components/SpatialNodeInspector';
import { DisruptionCascadeView } from './components/DisruptionCascadeView';
import { RecoveryPlannerSection } from './components/RecoveryPlannerSection';
import { RefundIntelligenceSection } from './components/RefundIntelligenceSection';
import { ProviderAdapterSection } from './components/ProviderAdapterSection';
import { AIAssistantDrawer } from './components/AIAssistantDrawer';
import { ActionConfirmationModal } from './components/ActionConfirmationModal';

export default function App() {
  // Canonical Trip State
  const [trip, setTrip] = useState<Trip>(INITIAL_TRIP);
  const [activeTab, setActiveTab] = useState<ActiveTab>('command_center');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  // Recovery & Disruption States
  const [isDisrupted, setIsDisrupted] = useState<boolean>(false);
  const [disruptionScenario, setDisruptionScenario] = useState<string>('none');
  const [recoveryOptions, setRecoveryOptions] = useState<RecoveryOption[]>([]);
  const [hoveredRecoveryOption, setHoveredRecoveryOption] = useState<RecoveryOption | null>(null);
  const [activeRecoveryPlan, setActiveRecoveryPlan] = useState<RecoveryOption | null>(null);
  const [modalOptionToExecute, setModalOptionToExecute] = useState<RecoveryOption | null>(null);
  const [isInfeasibleState, setIsInfeasibleState] = useState<boolean>(false);

  // Preferences & UX Controls
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [currentIstTime, setCurrentIstTime] = useState<string>('13:42:00 IST');

  // Live IST Clock
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      const istString = d.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' IST';
      setCurrentIstTime(istString);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Trigger Deterministic Disruption Scenario
  const handleSimulateDisruption = (
    scenario: 'flight_cancel' | 'flight_delay_90' | 'train_divert' | 'infeasible_curfew' = 'flight_cancel'
  ) => {
    playSound('disruption', soundEnabled);
    setIsDisrupted(true);
    setDisruptionScenario(scenario);
    setActiveRecoveryPlan(null);
    setIsInfeasibleState(scenario === 'infeasible_curfew');

    const rootBookingId = scenario === 'train_divert' ? 'bkg_train_02' : 'bkg_flight_01';
    const disType = scenario === 'flight_delay_90' ? 'delay' : 'cancellation';
    const delayMins = scenario === 'flight_delay_90' ? 90 : 999;

    // Execute Deterministic Graph Propagation
    const propagation = propagateDisruption(
      INITIAL_BOOKINGS,
      INITIAL_EDGES,
      rootBookingId,
      disType,
      delayMins
    );

    // Update Bookings with contextual notes
    const updatedBookings = propagation.updatedBookings.map(b => {
      if (b.id === 'bkg_flight_01') {
        return {
          ...b,
          notes: scenario === 'flight_delay_90'
            ? 'IndiGo 6E-204 delayed by 90 mins (New ETA: 13:10 IST). Violates 80m Delhi Airport Express metro transfer buffer.'
            : 'IndiGo 6E-204 cancelled due to airspace congestion at BOM. Mandatory DGCA 100% full refund.',
        };
      }
      if (b.id === 'bkg_train_02') {
        return {
          ...b,
          notes: scenario === 'train_divert'
            ? 'Train 12952 diverted via Mathura bypass. TDR filing required within 72h window under IRCTC Rule 73A.'
            : 'Train departs NDLS at 13:00. Upstream flight link broken; transfer buffer shrunk to -90 mins (Missed Train).',
        };
      }
      if (b.id === 'bkg_hotel_03') {
        return {
          ...b,
          notes: 'Standard check-in window (18:15 IST) violated due to upstream missed connection. Front desk late hold advisory generated.',
        };
      }
      if (b.id === 'bkg_event_04') {
        return {
          ...b,
          notes: 'HackCelestial 3.0 keynote has strict entry barrier at 20:30 IST. Re-routing must arrive before curfew.',
        };
      }
      return b;
    });

    const rootDisruptedBooking = updatedBookings.find(b => b.id === rootBookingId) || updatedBookings[0];

    // Generate Scored Recovery Options
    const options = generateRecoveryOptions(rootDisruptedBooking, {
      ...trip,
      bookings: updatedBookings,
      edges: propagation.updatedEdges,
    });

    setRecoveryOptions(options);

    setTrip(prev => ({
      ...prev,
      status: 'disrupted',
      bookings: updatedBookings,
      edges: propagation.updatedEdges,
      recoveryPlans: options,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    }));

    setSelectedBookingId(rootBookingId);
  };

  // Reset Trip to Pristine State
  const handleResetTrip = () => {
    playSound('radar', soundEnabled);
    setIsDisrupted(false);
    setDisruptionScenario('none');
    setRecoveryOptions([]);
    setHoveredRecoveryOption(null);
    setActiveRecoveryPlan(null);
    setSelectedBookingId(null);
    setIsInfeasibleState(false);

    setTrip({
      ...INITIAL_TRIP,
      bookings: INITIAL_BOOKINGS,
      edges: INITIAL_EDGES,
      refundCases: INITIAL_REFUND_CASES,
      status: 'monitoring',
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    });
  };

  // Change Recovery Multi-Objective Priority Preference
  const handleChangePriority = (priority: PriorityPreference) => {
    playSound('click', soundEnabled);
    const updatedPrefs = { ...trip.preferences, priority };

    const rootDisrupted = trip.bookings.find(b => b.status === 'cancelled' || b.status === 'delayed') || trip.bookings[0];
    const options = generateRecoveryOptions(rootDisrupted, { ...trip, preferences: updatedPrefs });

    setRecoveryOptions(options);
    setTrip(prev => ({ ...prev, preferences: updatedPrefs }));
  };

  // Confirm and Execute Selected Recovery Option
  const handleConfirmRecoveryExecution = (chosenOption: RecoveryOption) => {
    playSound('success', soundEnabled);
    setActiveRecoveryPlan(chosenOption);

    // Update canonical trip state to recovered
    const recoveredBookings = trip.bookings.map(b => {
      if (b.id === 'bkg_flight_01') {
        return {
          ...b,
          title: 'Flight AI-864 (Air India Replacement)',
          provider: 'Air India',
          providerCode: 'AI-864',
          referenceCode: 'PNR-AI-RECOV-9921',
          departureTime: '10:15 IST',
          arrivalTime: '12:20 IST',
          status: 'recovered' as const,
          riskLevel: 'none' as const,
          notes: 'Replaced IndiGo flight with Air India AI-864. Arriving DEL at 12:20 IST with 40m Metro connection to NDLS Train.',
        };
      }
      return {
        ...b,
        status: 'recovered' as const,
        riskLevel: 'none' as const,
      };
    });

    const recoveredEdges = trip.edges.map(e => ({
      ...e,
      status: 'safe' as const,
      actualBufferMinutes: 40,
    }));

    setTrip(prev => ({
      ...prev,
      status: 'recovered',
      bookings: recoveredBookings,
      edges: recoveredEdges,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    }));

    setActiveTab('command_center');
  };

  const selectedBooking = trip.bookings.find(b => b.id === selectedBookingId) || null;

  return (
    <div className="min-h-screen bg-[#05070B] text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Header Navigation */}
      <Navigation
        activeTab={activeTab}
        setActiveTab={tab => {
          playSound('click', soundEnabled);
          setActiveTab(tab);
        }}
        isDisrupted={isDisrupted}
        onSimulateDisruption={() => handleSimulateDisruption('flight_cancel')}
        onResetTrip={handleResetTrip}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        reducedMotion={reducedMotion}
        setReducedMotion={setReducedMotion}
        currentIstTime={currentIstTime}
      />

      {/* Main App Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* VIEW 1: 3D TRIP COMMAND CENTER */}
        {activeTab === 'command_center' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Cinematic Hero Landing & Story narrative stepper */}
            <HeroLanding
              onEnterCommandCenter={() => {
                const graphEl = document.getElementById('section-3d-graph');
                graphEl?.scrollIntoView({ behavior: 'smooth' });
              }}
              onSimulateDisruption={() => handleSimulateDisruption('flight_cancel')}
              isDisrupted={isDisrupted}
              onOpenRecovery={() => {
                playSound('click', soundEnabled);
                setActiveTab('recovery_planner');
              }}
              recoveryOptions={recoveryOptions}
            />

            {/* Central 3D Trip Graph & Spatial Viewport */}
            <div id="section-3d-graph" className="relative w-full h-[520px] lg:h-[620px]">
              <ThreeTripGraph
                bookings={trip.bookings}
                edges={trip.edges}
                selectedBookingId={selectedBookingId}
                onSelectBooking={id => {
                  playSound('click', soundEnabled);
                  setSelectedBookingId(id);
                }}
                hoveredRecoveryOption={hoveredRecoveryOption}
                activeRecoveryPlan={activeRecoveryPlan}
                isDisrupted={isDisrupted}
                reducedMotion={reducedMotion}
              />

              {/* Spatial HUD Node Inspector overlay */}
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
                      onNavigateToRefunds={() => {
                        playSound('click', soundEnabled);
                        setActiveTab('refund_intelligence');
                      }}
                      onSimulateNodeDisruption={() => handleSimulateDisruption('flight_delay_90')}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Spatial Chronological Timeline & Buffer Gauges */}
            <TripTimeline
              bookings={trip.bookings}
              edges={trip.edges}
              selectedBookingId={selectedBookingId}
              onSelectBooking={id => {
                playSound('click', soundEnabled);
                setSelectedBookingId(id);
              }}
              isDisrupted={isDisrupted}
            />
          </div>
        )}

        {/* VIEW 2: DISRUPTION CASCADE & PROPAGATION */}
        {activeTab === 'disruption_cascade' && (
          <div className="animate-fadeIn">
            <DisruptionCascadeView
              bookings={trip.bookings}
              edges={trip.edges}
              isDisrupted={isDisrupted}
              onSimulateScenario={scen => handleSimulateDisruption(scen)}
              onReset={handleResetTrip}
              onOpenRecovery={() => {
                playSound('click', soundEnabled);
                setActiveTab('recovery_planner');
              }}
              onSelectBooking={id => {
                playSound('click', soundEnabled);
                setSelectedBookingId(id);
                setActiveTab('command_center');
              }}
            />
          </div>
        )}

        {/* VIEW 3: RECOVERY PLANNER */}
        {activeTab === 'recovery_planner' && (
          <div className="animate-fadeIn">
            <RecoveryPlannerSection
              recoveryOptions={recoveryOptions.length > 0 ? recoveryOptions : generateRecoveryOptions(trip.bookings[0], trip)}
              userPreferences={trip.preferences}
              onChangePriority={handleChangePriority}
              onHoverRecoveryOption={setHoveredRecoveryOption}
              onSelectRecoveryOption={opt => {
                playSound('click', soundEnabled);
                setModalOptionToExecute(opt);
              }}
              selectedOptionId={activeRecoveryPlan?.id}
              isInfeasibleState={isInfeasibleState}
            />
          </div>
        )}

        {/* VIEW 4: REFUND INTELLIGENCE & RULE AUDITOR */}
        {activeTab === 'refund_intelligence' && (
          <div className="animate-fadeIn">
            <RefundIntelligenceSection refundCases={trip.refundCases} />
          </div>
        )}

        {/* VIEW 5: PROVIDER ARCHITECTURE & ADAPTER HARNESS */}
        {activeTab === 'provider_architecture' && (
          <div className="animate-fadeIn">
            <ProviderAdapterSection />
          </div>
        )}

        {/* VIEW 6: GROUNDED AI ASSISTANT COPILOT */}
        {activeTab === 'ai_assistant' && (
          <div className="animate-fadeIn">
            <AIAssistantDrawer
              trip={trip}
              isDisrupted={isDisrupted}
              recoveryOptions={recoveryOptions}
              onSelectOption={opt => {
                playSound('click', soundEnabled);
                setModalOptionToExecute(opt);
              }}
              onNavigateTab={tab => {
                playSound('click', soundEnabled);
                setActiveTab(tab);
              }}
            />
          </div>
        )}
      </main>

      {/* 5-Stage Mission Execution Modal */}
      <ActionConfirmationModal
        option={modalOptionToExecute}
        isOpen={!!modalOptionToExecute}
        onClose={() => setModalOptionToExecute(null)}
        onConfirmSuccess={handleConfirmRecoveryExecution}
        playSound={type => playSound(type, soundEnabled)}
      />

      {/* Minimal Footer with Hackathon Attribution */}
      <footer className="w-full border-t border-slate-900/80 py-6 mt-16 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            JOURNEY//X • AI-Powered Disruption-Aware Travel Orchestration & Recovery Platform
          </div>
          <div className="text-slate-400">
            HackCelestial 3.0 • Built with Three.js WebGL, React, & Gemini AI
          </div>
        </div>
      </footer>
    </div>
  );
}
