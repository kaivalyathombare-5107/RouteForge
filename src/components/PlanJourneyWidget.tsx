import React, { useState, useEffect } from 'react';
import { 
  Plane, 
  Train, 
  ArrowRightLeft, 
  Calendar, 
  ChevronDown, 
  ArrowRight, 
  Sparkles,
  Layers
} from 'lucide-react';
import { LocationAutocomplete } from './LocationAutocomplete';
import { JourneyMode } from './HeroJourneySection';

interface PlanJourneyWidgetProps {
  onSearchSubmit: (params: {
    origin: string;
    destination: string;
    departDate: string;
    returnDate: string;
    travelers: string;
    cabinClass: string;
    mode: JourneyMode;
  }) => void;
  initialDestination?: string;
  onRouteChange?: (origin: string, destination: string, mode: JourneyMode) => void;
}

export const PlanJourneyWidget: React.FC<PlanJourneyWidgetProps> = ({
  onSearchSubmit,
  initialDestination = 'UDR Udaipur (Taj Lake Palace)',
  onRouteChange
}) => {
  const [mode, setMode] = useState<JourneyMode>('flight');
  const [origin, setOrigin] = useState('BOM Mumbai (CSMIA T2)');
  const [destinationCity, setDestinationCity] = useState(initialDestination);
  const [departDate, setDepartDate] = useState('15 Oct, 2026');
  const [returnDate, setReturnDate] = useState('22 Oct, 2026');
  const [travelers, setTravelers] = useState('2 Adults, 2 Children (Family Holiday)');
  const [cabinClass, setCabinClass] = useState('Vande Bharat Executive / Anubhuti');

  const [showTravelerDropdown, setShowTravelerDropdown] = useState(false);
  const [showClassDropdown, setShowClassDropdown] = useState(false);

  // Notify parent in real-time when destination, origin or mode updates
  useEffect(() => {
    onRouteChange?.(origin, destinationCity, mode);
  }, [origin, destinationCity, mode, onRouteChange]);

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
    <div className="rounded-2xl bg-[#0B0D13]/90 backdrop-blur-2xl border border-gold-subtle p-6 shadow-2xl space-y-4 w-full">
      {/* Card Header Title */}
      <div className="flex items-center justify-between pb-1 border-b border-gold-subtle/50">
        <div className="flex flex-col">
          <h2 className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.25em] text-[#FCE7AC]">
            PLAN YOUR JOURNEY
          </h2>
          <span className="text-[9px] font-sans-luxury text-slate-400">
            Curated for Indian Families, Executives & VIPs
          </span>
        </div>
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
                '2 Adults, 2 Children (Family Holiday)',
                '2 Adults, 1 Child (Family Vacation)',
                'Joint Family & Elders (4-8 Guests)',
                '2 Adults (Couple / Honeymoon)',
                '1 Adult (Corporate / Solo)',
                'Wedding Party & VIP Delegation'
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
                'Vande Bharat Executive / Anubhuti',
                'Business Class / 6E Stretch',
                'First AC (1A) / Tejas Deluxe',
                'Premium Economy / AC 2-Tier (2A)',
                'Maharaja Express Suite / Private Charter'
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
  );
};
