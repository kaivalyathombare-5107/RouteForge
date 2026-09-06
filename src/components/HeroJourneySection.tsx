import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  MapPin,
  ArrowRight
} from 'lucide-react';
import { DestinationItem } from './DestinationTiltCards';
import { DepthShaderHeroCanvas } from './DepthShaderHeroCanvas';

export type JourneyMode = 'flight' | 'train' | 'bus' | 'uber' | 'car' | 'multimodal';

interface HeroJourneySectionProps {
  currentDestination: DestinationItem;
  slideIndex: number;
  totalSlides: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExploreJourneys?: () => void;
  onSearchSubmit: (params: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate: string;
    travelers: string;
    cabinClass: string;
    mode: JourneyMode;
  }) => void;
  reducedMotion?: boolean;
}

export const HeroJourneySection: React.FC<HeroJourneySectionProps> = ({
  currentDestination,
  slideIndex,
  totalSlides,
  isPlaying,
  onTogglePlay,
  onExploreJourneys,
  onSearchSubmit,
  reducedMotion = false,
}) => {
  return (
    <div 
      data-theme-preserve="dark"
      className="hero-journey-section preserve-dark-theme relative w-full min-h-[680px] lg:min-h-[740px] rounded-3xl overflow-hidden border border-gold-subtle shadow-2xl flex items-center justify-between p-6 sm:p-10 lg:p-14"
    >
      {/* 3D Depth-Map Parallax Shader Canvas Background */}
      <DepthShaderHeroCanvas
        imageUrl={currentDestination.heroImage}
        depthIntensity={0.03}
        reducedMotion={reducedMotion}
      />

      {/* Cinematic Vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col items-start justify-end h-full mt-24 lg:mt-32">
        {/* Editorial Masterpiece Typography & Narrative */}
        <div className="w-full lg:max-w-3xl space-y-6">
          {/* Eyebrow */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-cinzel font-semibold tracking-[0.35em] text-[#D4AF37] uppercase drop-shadow">
              DESIGNED FOR TRAVELERS • AIR • RAIL • ROAD
            </span>
          </div>

          {/* Headline with Staggered Visual Typography */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-serif-display font-light text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-[0.95] drop-shadow-2xl">
              <span className="block font-normal text-white">EXPLORE</span>
              <span className="block italic text-[#FCE7AC]">THE</span>
              <span className="block font-normal text-white">UNSEEN</span>
            </h1>
          </div>

          {/* Subtitle Description */}
          <p className="max-w-xl text-sm sm:text-base font-sans-luxury text-slate-200 font-light leading-relaxed drop-shadow-md">
            {currentDestination.description}
          </p>

          {/* Action Button & Slider Controls */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2">
            {onExploreJourneys && (
              <button
                id="hero-explore-journeys-btn"
                onClick={onExploreJourneys}
                className="px-6 py-3 rounded-full border border-[#D4AF37]/60 hover:border-gold-bright bg-black/60 hover:bg-[#D4AF37]/20 backdrop-blur-md text-xs font-cinzel font-bold tracking-[0.2em] text-[#FCE7AC] hover:text-white flex items-center space-x-2.5 shadow-xl shadow-black/50 transition-all cursor-pointer transform active:scale-95 group"
                title="Explore Journeys"
              >
                <span>EXPLORE JOURNEYS</span>
                <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:translate-x-1 transition-transform" />
              </button>
            )}

            <div className="flex items-center space-x-3 text-xs font-mono text-slate-300">
              <span className="text-[#D4AF37] font-semibold">
                — {String(slideIndex + 1).padStart(2, '0')}
              </span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400">
                {String(totalSlides).padStart(2, '0')}
              </span>

              <button
                onClick={onTogglePlay}
                className="w-7 h-7 rounded-full border border-gold-subtle bg-slate-950/60 flex items-center justify-center text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all ml-2 cursor-pointer shadow-md"
                title={isPlaying ? 'Pause Autoplay' : 'Resume Autoplay'}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 translate-x-0.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
