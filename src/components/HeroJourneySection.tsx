import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowRight, 
  Play, 
  Pause, 
  MapPin
} from 'lucide-react';
import { DestinationItem } from './DestinationTiltCards';
import { DepthShaderHeroCanvas } from './DepthShaderHeroCanvas';

export type JourneyMode = 'flight' | 'train' | 'multimodal';

interface HeroJourneySectionProps {
  currentDestination: DestinationItem;
  slideIndex: number;
  totalSlides: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExploreJourneys: () => void;
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
    <div className="relative w-full min-h-[680px] lg:min-h-[740px] rounded-3xl overflow-hidden border border-gold-subtle shadow-2xl flex items-center justify-between p-6 sm:p-10 lg:p-14">
      {/* 3D Depth-Map Parallax Shader Canvas Background */}
      <DepthShaderHeroCanvas
        imageUrl={currentDestination.heroImage}
        depthIntensity={0.03}
        reducedMotion={reducedMotion}
      />

      {/* Cinematic Dark Gradient & Golden Twilight Vignette */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#08090C]/90 via-[#08090C]/40 to-[#08090C]/85 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-transparent to-transparent pointer-events-none" />

      {/* Content Container */}
      <div className="relative z-10 w-full flex flex-col items-start justify-end h-full mt-24 lg:mt-32">
        {/* Editorial Masterpiece Typography & Narrative */}
        <div className="w-full lg:max-w-3xl space-y-6">
          {/* Eyebrow */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-cinzel font-semibold tracking-[0.35em] text-[#D4AF37] uppercase">
              DESIGNED FOR INDIAN TRAVELERS • AIR • RAIL • HERITAGE
            </span>
          </div>

          {/* Headline with Staggered Visual Typography */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-serif-display font-light text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-[0.95] drop-shadow-2xl">
              <span className="block font-normal">TIMELESS</span>
              <span className="block italic text-[#FCE7AC]">BHARAT</span>
              <span className="block font-normal">& BEYOND</span>
            </h1>
          </div>

          {/* Subtitle Description */}
          <p className="max-w-xl text-sm sm:text-base font-sans-luxury text-slate-200 font-light leading-relaxed">
            {currentDestination.description}
          </p>

          {/* CTAs and Pagination controls */}
          <div className="flex flex-wrap items-center gap-6 pt-2">
            {/* Gold bordered Glass Button */}
            <button
              onClick={onExploreJourneys}
              className="px-6 py-3 rounded-full border border-gold-bright bg-slate-950/70 hover:bg-[#D4AF37] text-slate-100 hover:text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] transition-all flex items-center space-x-2.5 cursor-pointer shadow-xl shadow-[#D4AF37]/15 group"
            >
              <span>EXPLORE INDIAN & GLOBAL JOURNEYS</span>
              <ArrowRight className="w-4 h-4 text-[#D4AF37] group-hover:text-slate-950 group-hover:translate-x-1 transition-all" />
            </button>

            {/* Slider Progress & Play/Pause */}
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
                className="w-7 h-7 rounded-full border border-gold-subtle bg-slate-950/60 flex items-center justify-center text-slate-300 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all ml-2 cursor-pointer"
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
