import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  Train, 
  ArrowRightLeft, 
  Calendar, 
  Users, 
  ChevronDown, 
  ArrowRight, 
  Play, 
  Pause, 
  Sparkles,
  Layers,
  MapPin
} from 'lucide-react';
import { DestinationItem } from './DestinationTiltCards';
import { DepthShaderHeroCanvas } from './DepthShaderHeroCanvas';
import { LocationAutocomplete } from './LocationAutocomplete';

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
  // Booking engine form state
  const [mode, setMode] = useState<JourneyMode>('flight');
  const [origin, setOrigin] = useState('BOM Mumbai (CSMIA T2)');
  const [destinationCity, setDestinationCity] = useState('UDR Udaipur (Taj Lake Palace)');
  const [departDate, setDepartDate] = useState('15 Oct, 2025');
  const [returnDate, setReturnDate] = useState('22 Oct, 2025');
  const [travelers, setTravelers] = useState('2 Adults, 1 Child (Family)');
  const [cabinClass, setCabinClass] = useState('Business / Club Class');

  const [showTravelerDropdown, setShowTravelerDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  const swapCities = () => {
    const temp = origin;
    setOrigin(destinationCity);
    setDestinationCity(temp);
  };

  const handleSearchClick = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchSubmit({
      origin,
      destination: destinationCity,
      departDate,
      returnDate,
      travelers,
      cabinClass,
      mode,
    });
  };

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
      <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-12">
        {/* Left: Editorial Masterpiece Typography & Narrative */}
        <div className="w-full lg:w-7/12 space-y-6">
          {/* Eyebrow */}
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-cinzel font-semibold tracking-[0.35em] text-[#D4AF37] uppercase">
              CURATED • IMMERSIVE • EXTRAORDINARY
            </span>
          </div>

          {/* Headline with Staggered Visual Typography */}
          <div className="space-y-1 sm:space-y-2">
            <h1 className="font-serif-display font-light text-5xl sm:text-6xl md:text-7xl lg:text-8xl tracking-tight text-white leading-[0.95] drop-shadow-2xl">
              <span className="block font-normal">JOURNEYS</span>
              <span className="block italic text-[#FCE7AC]">BEYOND</span>
              <span className="block font-normal">BOUNDARIES</span>
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
              <span>EXPLORE JOURNEYS</span>
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

        {/* Right: "PLAN YOUR JOURNEY" Booking & Itinerary Engine (matching reference image) */}
        <div className="w-full lg:w-5/12 max-w-md">
          <div className="rounded-2xl bg-[#0B0D13]/90 backdrop-blur-2xl border border-gold-subtle p-6 shadow-2xl space-y-4">
            {/* Card Header Title */}
            <div className="flex items-center justify-between pb-1 border-b border-gold-subtle/50">
              <h2 className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.25em] text-[#FCE7AC]">
                PLAN YOUR JOURNEY
              </h2>
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            </div>

            {/* Mode Selector Tabs (FLIGHT, TRAIN, MULTI-MODAL) */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-gold-subtle/40 text-[10px] font-cinzel font-semibold tracking-wider">
              <button
                type="button"
                onClick={() => setMode('flight')}
                className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  mode === 'flight'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Plane className="w-3 h-3" />
                <span>FLIGHT</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('train')}
                className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  mode === 'train'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Train className="w-3 h-3" />
                <span>TRAIN</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('multimodal')}
                className={`py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all cursor-pointer ${
                  mode === 'multimodal'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-gold-bright shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-3 h-3" />
                <span>MULTI-MODAL</span>
              </button>
            </div>

            {/* City Origin and Destination Input Rows with Location Suggestions and Swap Icon */}
            <div className="space-y-2">
              {/* FROM - Location Autocomplete with suggestions */}
              <LocationAutocomplete
                id="journey-origin"
                label="FROM"
                value={origin}
                onChange={setOrigin}
                placeholder="e.g. JFK New York"
                mode={mode}
                otherLocationValue={destinationCity}
              />

              {/* Swap Button divider */}
              <div className="relative flex items-center justify-center -my-2.5 z-10">
                <button
                  id="swap-journey-locations-btn"
                  type="button"
                  onClick={swapCities}
                  className="w-7 h-7 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-300 hover:text-[#D4AF37] hover:rotate-180 transition-all cursor-pointer shadow-md"
                  title="Swap Origin and Destination"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              </div>

              {/* TO - Location Autocomplete with suggestions */}
              <LocationAutocomplete
                id="journey-destination"
                label="TO"
                value={destinationCity}
                onChange={setDestinationCity}
                placeholder="e.g. CDG Paris"
                mode={mode}
                otherLocationValue={origin}
              />
            </div>

            {/* Dates: DEPART and RETURN */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 focus-within:border-[#D4AF37] px-3 py-2 transition-colors">
                <div className="flex items-center justify-between text-[9px] font-cinzel font-semibold tracking-widest text-[#D4AF37]">
                  <span>DEPART</span>
                  <Calendar className="w-2.5 h-2.5" />
                </div>
                <input
                  type="text"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-sans-luxury text-slate-200 outline-none mt-0.5"
                />
              </div>

              <div className="rounded-xl bg-slate-950/60 border border-slate-800 focus-within:border-[#D4AF37] px-3 py-2 transition-colors">
                <div className="flex items-center justify-between text-[9px] font-cinzel font-semibold tracking-widest text-[#D4AF37]">
                  <span>RETURN</span>
                  <Calendar className="w-2.5 h-2.5" />
                </div>
                <input
                  type="text"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-transparent text-xs font-sans-luxury text-slate-200 outline-none mt-0.5"
                />
              </div>
            </div>

            {/* Travelers & Class selectors */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Travelers */}
              <div className="relative">
                <div
                  onClick={() => setShowTravelerDropdown(!showTravelerDropdown)}
                  className="rounded-xl bg-slate-950/60 border border-slate-800 hover:border-[#D4AF37] px-3 py-2 transition-colors cursor-pointer"
                >
                  <span className="block text-[9px] font-cinzel font-semibold tracking-widest text-[#D4AF37]">
                    TRAVELERS
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-sans-luxury text-slate-200">{travelers}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {showTravelerDropdown && (
                  <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#0F1117] border border-gold-subtle rounded-xl py-1 shadow-2xl z-30 text-xs font-mono">
                    {[
                      '1 Adult (Solo Luxury)',
                      '2 Adults (Couple)',
                      '2 Adults, 1 Child (Family)',
                      '2 Adults, 2 Children (Family)',
                      'Joint Family (6+ Guests)',
                      'VIP Private Delegation'
                    ].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setTravelers(t);
                          setShowTravelerDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#1A1E29] text-slate-200 hover:text-[#D4AF37]"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Class */}
              <div className="relative">
                <div
                  onClick={() => setShowClassDropdown(!showClassDropdown)}
                  className="rounded-xl bg-slate-950/60 border border-slate-800 hover:border-[#D4AF37] px-3 py-2 transition-colors cursor-pointer"
                >
                  <span className="block text-[9px] font-cinzel font-semibold tracking-widest text-[#D4AF37]">
                    CLASS
                  </span>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-xs font-sans-luxury text-slate-200">{cabinClass}</span>
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  </div>
                </div>

                {showClassDropdown && (
                  <div className="absolute bottom-full mb-1 left-0 right-0 bg-[#0F1117] border border-gold-subtle rounded-xl py-1 shadow-2xl z-30 text-xs font-mono">
                    {[
                      'Business / Club Class',
                      'First / Maharaja Suite',
                      'Vande Bharat Executive',
                      'Premium Economy / Stretch',
                      'Private Charter / Helitransfer'
                    ].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setCabinClass(c);
                          setShowClassDropdown(false);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-[#1A1E29] text-slate-200 hover:text-[#D4AF37]"
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* SEARCH JOURNEYS Submit Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleSearchClick}
                className="w-full py-3 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.25em] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/40"
              >
                <span>SEARCH JOURNEYS</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
