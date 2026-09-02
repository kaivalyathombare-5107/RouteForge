import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, ArrowRight, ShieldAlert, Sparkles, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';
import { Booking, TripEdge, RecoveryOption } from '../types';

interface HeroLandingProps {
  onEnterCommandCenter: () => void;
  onSimulateDisruption: () => void;
  isDisrupted: boolean;
  onOpenRecovery: () => void;
  recoveryOptions: RecoveryOption[];
}

const STORY_SCENES = [
  {
    step: 1,
    title: 'Connected Ecosystem',
    headline: '1. My journey is connected',
    description: 'Every flight, train, hotel, and event booking is tracked as a living dependency node in a 3D graph.',
    badge: 'NORMAL STATE',
    badgeColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-950/40',
  },
  {
    step: 2,
    title: 'Disruption Detected',
    headline: '2. Something goes wrong',
    description: 'Aviation or rail telemetry reports a cancellation. The system flags the root cause instantly.',
    badge: 'DISRUPTION DETECTED',
    badgeColor: 'text-red-400 border-red-500/40 bg-red-950/40',
  },
  {
    step: 3,
    title: 'Cascade Propagation',
    headline: '3. The system understands consequences',
    description: 'Graph dependency traversal computes exact buffer shrinkage, missed connections, and hotel curfew risks.',
    badge: '3 BOOKINGS AT RISK',
    badgeColor: 'text-amber-400 border-amber-500/40 bg-amber-950/40',
  },
  {
    step: 4,
    title: 'Deterministic Refunds',
    headline: '4. It calculates refunds',
    description: 'Deterministic DGCA & IRCTC policy engines compute statutory refunds and TDR filing eligibility.',
    badge: '₹7,060 ELIGIBLE',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
  },
  {
    step: 5,
    title: 'Multi-Objective Recovery',
    headline: '5. It finds recovery options',
    description: 'Generates Fastest, Flexible, and Lowest Cost alternative routes preserving downstream commitments.',
    badge: '3 RECOVERY PATHS',
    badgeColor: 'text-blue-400 border-blue-500/40 bg-blue-950/40',
  },
  {
    step: 6,
    title: 'User Choice',
    headline: '6. You choose',
    description: 'Inspect net cost differences, refund credits, and 3D route branches before one-click approval.',
    badge: 'ONE-CLICK APPROVE',
    badgeColor: 'text-purple-400 border-purple-500/40 bg-purple-950/40',
  },
  {
    step: 7,
    title: 'Rebuilt Journey',
    headline: '7. My journey is rebuilt',
    description: 'Adapters confirm alternative bookings, file automated TDRs, and stabilize the 3D trip graph.',
    badge: 'MISSION RESOLVED',
    badgeColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-950/40',
  },
];

export const HeroLanding: React.FC<HeroLandingProps> = ({
  onEnterCommandCenter,
  onSimulateDisruption,
  isDisrupted,
  onOpenRecovery,
  recoveryOptions,
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
    <div className="relative w-full py-8 lg:py-12 flex flex-col items-center">
      {/* Background ambient glow circles */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-blue-600/10 via-cyan-500/15 to-purple-600/10 blur-3xl pointer-events-none rounded-full" />

      {/* Main Cinematic Header */}
      <div className="relative z-10 text-center max-w-4xl px-4 sm:px-6">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/80 border border-cyan-500/30 text-cyan-300 text-xs font-mono mb-6 shadow-lg shadow-cyan-950/40">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>AI-POWERED TRIP GRAPH & RECOVERY ORCHESTRATION</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white uppercase font-display leading-[1.1] mb-5">
          WHEN YOUR JOURNEY BREAKS, <br />
          <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-emerald-400 bg-clip-text text-transparent">
            WE REBUILD IT.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto font-light leading-relaxed mb-8">
          One disruption. Every consequence. One intelligent recovery. <br className="hidden sm:inline" />
          Transforming isolated travel bookings into a living, self-healing 3D digital twin.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            id="hero-btn-build-journey"
            onClick={onEnterCommandCenter}
            className="px-6 py-3.5 rounded-xl font-mono text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-xl shadow-cyan-500/25 flex items-center space-x-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <span>ENTER 3D COMMAND CENTER</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {!isDisrupted ? (
            <button
              id="hero-btn-simulate-disruption"
              onClick={onSimulateDisruption}
              className="px-5 py-3.5 rounded-xl font-mono text-sm font-medium bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-500/50 shadow-lg shadow-red-950/40 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <ShieldAlert className="w-4 h-4 text-red-400 animate-pulse" />
              <span>SIMULATE LIVE DISRUPTION</span>
            </button>
          ) : (
            <button
              id="hero-btn-open-recovery"
              onClick={onOpenRecovery}
              className="px-5 py-3.5 rounded-xl font-mono text-sm font-medium bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-500/50 shadow-lg shadow-emerald-950/40 flex items-center space-x-2 transition-all cursor-pointer animate-pulse"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>VIEW RECOVERY OPTIONS ({recoveryOptions.length})</span>
            </button>
          )}

          <button
            id="hero-btn-see-how-it-works"
            onClick={() => setAutoPlayStory(!autoPlayStory)}
            className="px-4 py-3.5 rounded-xl font-mono text-xs text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 bg-slate-950/50 flex items-center space-x-2 transition-colors cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${autoPlayStory ? 'text-cyan-400' : ''}`} />
            <span>{autoPlayStory ? 'PAUSE STORY' : 'SEE HOW IT WORKS'}</span>
          </button>
        </div>
      </div>

      {/* Visual Storytelling Stepper: 7-Scene Interactive Narrative */}
      <div className="relative z-10 w-full max-w-5xl mt-12 px-4">
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl shadow-2xl">
          {/* Stepper Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
            {STORY_SCENES.map((scene, idx) => (
              <button
                key={scene.step}
                onClick={() => {
                  setActiveSceneIdx(idx);
                  setAutoPlayStory(false);
                }}
                className={`text-left p-2.5 rounded-lg border transition-all text-xs font-mono cursor-pointer ${
                  activeSceneIdx === idx
                    ? 'bg-cyan-950/70 border-cyan-500/70 text-cyan-300 shadow-md'
                    : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] opacity-70">SCENE 0{scene.step}</span>
                  {activeSceneIdx === idx && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />}
                </div>
                <div className="font-semibold truncate">{scene.title}</div>
              </button>
            ))}
          </div>

          {/* Active Scene Spotlight */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 p-5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${activeScene.badgeColor}`}>
                  {activeScene.badge}
                </span>
                <span className="text-xs font-mono text-slate-500">Step {activeScene.step} of 7</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-display text-slate-100">
                {activeScene.headline}
              </h3>
              <p className="text-sm text-slate-400 font-light max-w-2xl">
                {activeScene.description}
              </p>
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto justify-end">
              <button
                onClick={() => setActiveSceneIdx(prev => (prev > 0 ? prev - 1 : STORY_SCENES.length - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs font-mono text-slate-400 hover:text-slate-200"
              >
                Prev
              </button>
              <button
                onClick={() => setActiveSceneIdx(prev => (prev + 1) % STORY_SCENES.length)}
                className="px-4 py-1.5 rounded-lg border border-cyan-500/40 bg-cyan-950/40 text-xs font-mono text-cyan-300 hover:bg-cyan-900/50 flex items-center space-x-1"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
