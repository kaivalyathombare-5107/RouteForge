import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, Compass, Eye, ShieldCheck, MapPin, Clock } from 'lucide-react';
import { TiltCard } from './TiltCard';
import { RecoveryOption } from '../types';

interface HeroLandingProps {
  onEnterCommandCenter: () => void;
  onSimulateDisruption: () => void;
  isDisrupted: boolean;
  onOpenRecovery: () => void;
  recoveryOptions: RecoveryOption[];
  onOpenPanorama?: () => void;
}

const STORY_SCENES = [
  {
    step: 1,
    roman: 'I',
    title: 'Connected Ecosystem',
    headline: '1. My journey is connected',
    description: 'Every flight, first-class train, palace hotel, and summit keynote is tracked as an interrelated living node in a 3D Catmull-Rom spatial graph.',
    badge: 'PRISTINE STATE',
    badgeColor: 'text-[#D4AF37] border-[#D4AF37]/40 bg-[#D4AF37]/10',
  },
  {
    step: 2,
    roman: 'II',
    title: 'Disruption Detected',
    headline: '2. Something goes wrong',
    description: 'Live airline feed reports a cancellation at Mumbai T2. The autonomous concierge flags root causality within 12 milliseconds.',
    badge: 'DISRUPTION DETECTED',
    badgeColor: 'text-rose-400 border-rose-500/40 bg-rose-950/40',
  },
  {
    step: 3,
    roman: 'III',
    title: 'Cascade Propagation',
    headline: '3. The system understands consequences',
    description: 'Spatial dependency traversal computes the 80m Delhi Airport Express buffer deficit, missed Jaipur train link, and hotel late check-in notice.',
    badge: '3 BOOKINGS AT RISK',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
  },
  {
    step: 4,
    roman: 'IV',
    title: 'Deterministic Refunds',
    headline: '4. It calculates refunds',
    description: 'Audited DGCA Civil Aviation Requirements and IRCTC PRS Rulebook engines calculate exact statutory refunds (₹7,060) without penalty deductions.',
    badge: '₹7,060 STATUTORY REFUND',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
  },
  {
    step: 5,
    roman: 'V',
    title: 'Multi-Objective Recovery',
    headline: '5. It finds recovery options',
    description: 'Synthesizes ranked alternative routes (Fastest Air India AI-864 replacement, Flexible luxury bypass, and Net Surplus rebooking).',
    badge: '3 RECOVERY PATHS',
    badgeColor: 'text-amber-300 border-amber-500/40 bg-amber-950/40',
  },
  {
    step: 6,
    roman: 'VI',
    title: 'Curated Traveler Choice',
    headline: '6. You choose',
    description: 'Inspect net cost variations, refund offset credits, and 3D Catmull-Rom route branches before one-click biometric mission authorization.',
    badge: 'ONE-CLICK APPROVE',
    badgeColor: 'text-[#F5E6B3] border-[#D4AF37]/50 bg-[#D4AF37]/20',
  },
  {
    step: 7,
    roman: 'VII',
    title: 'Rebuilt Itinerary',
    headline: '7. My journey is rebuilt',
    description: 'Live adapters confirm alternative tickets, execute automated TDR claims with Indian Railways, and restore the spatial itinerary.',
    badge: 'JOURNEY RESOLVED',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
  },
];

const LUXURY_DESTINATIONS = [
  {
    title: 'Mumbai Chhatrapati Shivaji',
    subtitle: 'Terminal 2 • Departure Hub',
    time: '09:30 IST',
    type: 'Flight 6E-204',
    status: 'Scheduled',
    tag: 'FIRST / BIZ',
    bgGradient: 'from-amber-950/40 to-slate-950/80',
    border: 'border-gold-subtle',
  },
  {
    title: 'New Delhi Railway Junction',
    subtitle: 'Platform 4 • Express Link',
    time: '13:00 IST',
    type: 'Train 12952 Superfast',
    status: 'Connecting',
    tag: 'AC FIRST',
    bgGradient: 'from-slate-900/60 to-slate-950/80',
    border: 'border-gold-subtle',
  },
  {
    title: 'ITC Rajputana Resort',
    subtitle: 'Heritage Suite #304 • Jaipur',
    time: '18:15 IST',
    type: 'Palace Wing Grand Suite',
    status: 'Guaranteed',
    tag: 'VOGUE 360°',
    bgGradient: 'from-[#D4AF37]/15 to-slate-950/80',
    border: 'border-gold-bright',
  },
];

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onEnterCommandCenter,
  onSimulateDisruption,
  isDisrupted,
  onOpenRecovery,
  recoveryOptions,
  onOpenPanorama,
}) => {
  const [activeSceneIdx, setActiveSceneIdx] = useState(0);
  const [autoPlayStory, setAutoPlayStory] = useState(false);

  useEffect(() => {
    if (!autoPlayStory) return;
    const interval = setInterval(() => {
      setActiveSceneIdx(prev => (prev + 1) % STORY_SCENES.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [autoPlayStory]);

  const activeScene = STORY_SCENES[activeSceneIdx];

  return (
    <div className="relative w-full py-8 lg:py-14 flex flex-col items-center">
      {/* Ambient background gold aura */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-gradient-to-r from-[#D4AF37]/10 via-[#F5E6B3]/10 to-[#997825]/10 blur-3xl pointer-events-none rounded-full" />

      {/* Editorial Cover Header */}
      <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6 space-y-4">
        {/* Issue Subtitle */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-slate-950/90 border border-gold-subtle text-[#E5C07B] text-xs font-cinzel tracking-widest shadow-xl">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>L'ÉDITION VOYAGE // AUTUMN / WINTER 2026</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-300">ISSUE NO. 26</span>
        </div>

        {/* Main Editorial Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif-display font-normal text-champagne-gradient tracking-tight leading-[1.08]">
          The Art of Continuous Travel, <br />
          <span className="italic font-light text-gold-gradient">Flawlessly Reconstructed.</span>
        </h1>

        {/* Lead paragraph */}
        <p className="max-w-2xl mx-auto text-base sm:text-lg font-sans-luxury text-slate-300 font-light leading-relaxed">
          An ultra-luxe editorial orchestrator pairing <strong className="text-white font-normal">3D Catmull-Rom route corridors</strong>, immersive <strong className="text-[#F3E5AB] font-normal">360° panoramic suite explorers</strong>, and deterministic statutory refund intelligence.
        </p>

        {/* Action Button Deck */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
          <button
            onClick={onEnterCommandCenter}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#E5C07B] to-[#A88325] text-slate-950 font-cinzel font-bold text-xs sm:text-sm hover:brightness-110 shadow-lg shadow-[#D4AF37]/25 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>EXPLORE 3D TRIP GRAPH</span>
          </button>

          {!isDisrupted ? (
            <button
              onClick={onSimulateDisruption}
              className="px-5 py-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/40 text-rose-200 font-cinzel font-semibold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-rose-950/20"
            >
              <ShieldAlert className="w-4 h-4 text-rose-400 animate-pulse" />
              <span>TEST SIMULATED DISRUPTION</span>
            </button>
          ) : (
            <button
              onClick={onOpenRecovery}
              className="px-5 py-3 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 font-cinzel font-semibold text-xs sm:text-sm transition-all flex items-center space-x-2 cursor-pointer shadow-lg shadow-emerald-950/40 animate-bounce"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>REVIEW CONCIERGE RECOVERY ({recoveryOptions.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* 3D Tilt Cards Destination Spotlight Deck */}
      <div className="w-full max-w-6xl mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 px-4 sm:px-6">
        {LUXURY_DESTINATIONS.map((dest, i) => (
          <TiltCard
            key={i}
            maxTilt={12}
            highlightColor="rgba(212, 175, 55, 0.2)"
            className={`p-5 rounded-2xl border ${dest.border} bg-gradient-to-b ${dest.bgGradient} backdrop-blur-xl shadow-xl flex flex-col justify-between space-y-4 min-h-[220px] h-auto`}
          >
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs font-cinzel mb-2 flex-wrap gap-1">
                <span className="text-[#D4AF37] font-semibold">{dest.tag}</span>
                <span className="text-[10px] uppercase px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-gold-subtle">
                  {dest.status}
                </span>
              </div>
              <h3 className="text-lg sm:text-xl font-serif-display font-bold text-white leading-snug break-words">
                {dest.title}
              </h3>
              <p className="text-xs font-sans-luxury text-slate-400 mt-1 break-words">
                {dest.subtitle}
              </p>
            </div>

            <div className="pt-3 border-t border-gold-subtle flex items-center justify-between text-xs font-mono flex-wrap gap-2">
              <div className="flex items-center space-x-1.5 text-[#F3E5AB]">
                <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{dest.time}</span>
              </div>
              <span className="text-slate-400">{dest.type}</span>
            </div>
          </TiltCard>
        ))}
      </div>

      {/* Interactive 7-Stage Editorial Narrative Stepper */}
      <div className="w-full max-w-5xl mt-12 p-6 sm:p-8 rounded-3xl bg-slate-950/80 border border-gold-subtle backdrop-blur-2xl shadow-2xl space-y-6">
        {/* Stepper Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold-subtle pb-4">
          <div>
            <div className="flex items-center space-x-2 text-xs font-cinzel text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>THE 7 ESSENTIAL CHAPTERS OF RECOVERY</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif-display font-bold text-champagne-gradient mt-0.5">
              How RouteForge Restores Disrupted Travel
            </h3>
          </div>

          <button
            onClick={() => setAutoPlayStory(prev => !prev)}
            className={`px-3.5 py-1.5 rounded-xl border text-xs font-cinzel transition-all cursor-pointer flex items-center space-x-1.5 ${
              autoPlayStory
                ? 'bg-[#D4AF37] text-slate-950 border-gold-bright font-bold'
                : 'bg-slate-900 border-gold-subtle text-slate-300 hover:text-white'
            }`}
          >
            <Play className={`w-3.5 h-3.5 ${autoPlayStory ? 'fill-current' : ''}`} />
            <span>{autoPlayStory ? 'AUTOPLAY: ON' : 'PLAY CHAPTER TOUR'}</span>
          </button>
        </div>

        {/* Step Numbers Ribbon */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {STORY_SCENES.map((scene, idx) => {
            const isActive = activeSceneIdx === idx;
            return (
              <button
                key={scene.step}
                onClick={() => {
                  setActiveSceneIdx(idx);
                  setAutoPlayStory(false);
                }}
                className={`py-2 px-1 rounded-xl border transition-all text-center cursor-pointer flex flex-col items-center justify-center ${
                  isActive
                    ? 'border-gold-bright bg-gradient-to-b from-[#D4AF37]/30 to-slate-950 shadow-lg scale-105'
                    : 'border-gold-subtle bg-slate-950/50 hover:bg-slate-900 text-slate-400'
                }`}
              >
                <span className={`text-xs sm:text-sm font-serif-display font-bold ${isActive ? 'text-[#FCE7AC]' : 'text-slate-400'}`}>
                  {scene.roman}
                </span>
                <span className="text-[9px] font-mono hidden sm:inline-block truncate max-w-full text-slate-400">
                  {scene.title.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Scene Content Panel with Staggered Transition */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeScene.step}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="p-6 rounded-2xl bg-gradient-to-r from-slate-900/90 to-slate-950/90 border border-gold-subtle flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-cinzel font-bold px-2.5 py-0.5 rounded-full border ${activeScene.badgeColor}`}>
                  {activeScene.badge}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  CHAPTER {activeScene.roman} OF VII
                </span>
              </div>
              <h4 className="text-xl sm:text-2xl font-serif-display font-bold text-white">
                {activeScene.headline}
              </h4>
              <p className="text-sm font-sans-luxury text-slate-300 leading-relaxed font-light">
                {activeScene.description}
              </p>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              <button
                onClick={() => setActiveSceneIdx((prev) => (prev + 1) % STORY_SCENES.length)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-gold-subtle text-xs font-cinzel text-slate-200 hover:text-white flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <span>NEXT CHAPTER</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#D4AF37]" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
