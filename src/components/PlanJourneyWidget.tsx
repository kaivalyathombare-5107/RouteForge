import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowRightLeft,
  Calendar,
  ArrowRight,
  Sparkles,
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
  initialOrigin?: string;
  initialDestination?: string;
  onRouteChange?: (origin: string, destination: string, mode: JourneyMode) => void;
}

export const PlanJourneyWidget: React.FC<PlanJourneyWidgetProps> = ({
  onSearchSubmit,
  initialOrigin = '',
  initialDestination = '',
  onRouteChange
}) => {
  const [mode, setMode] = useState<JourneyMode>('flight');
  const [origin, setOrigin] = useState(initialOrigin);
  const [destinationCity, setDestinationCity] = useState(initialDestination);
  const [departDate, setDepartDate] = useState('15 Oct, 2026');
  const [returnDate, setReturnDate] = useState('22 Oct, 2026');
  const [travelers] = useState('2 Adults, 2 Children (Family Holiday)');
  const [cabinClass] = useState('Vande Bharat Executive / Anubhuti');

  const lastNotifiedRef = useRef<{ origin: string; destination: string; mode: string }>({
    origin: '',
    destination: '',
    mode: '',
  });
  const onRouteChangeRef = useRef(onRouteChange);

  useEffect(() => {
    onRouteChangeRef.current = onRouteChange;
  }, [onRouteChange]);

  // Keep destination city in sync when initialDestination prop updates from the carousel
  useEffect(() => {
    if (initialDestination) {
      setDestinationCity(initialDestination);
    }
  }, [initialDestination]);

  // Notify parent in real-time when destination, origin or mode updates, strictly guarded against re-render loops
  useEffect(() => {
    if (
      lastNotifiedRef.current.origin !== origin ||
      lastNotifiedRef.current.destination !== destinationCity ||
      lastNotifiedRef.current.mode !== mode
    ) {
      lastNotifiedRef.current = { origin, destination: destinationCity, mode };
      onRouteChangeRef.current?.(origin, destinationCity, mode);
    }
  }, [origin, destinationCity, mode]);

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
    <div id="plan-your-journey" className="rounded-2xl bg-[#0B0D13]/90 backdrop-blur-2xl border border-gold-subtle p-5 sm:p-6 shadow-2xl space-y-4 w-full h-auto min-h-fit">
      {/* Card Header Title */}
      <div className="flex items-center justify-between pb-1 border-b border-gold-subtle/50 gap-2">
        <div className="flex flex-col min-w-0 flex-1">
          <h2 className="font-cinzel text-xs sm:text-sm font-bold tracking-[0.18em] sm:tracking-[0.25em] text-[#FCE7AC] break-words">
            PLAN YOUR JOURNEY
          </h2>
          <span className="text-[9px] font-sans-luxury text-slate-400 break-words">
            Curated for Indian Families, Executives & VIPs
          </span>
        </div>
        <Sparkles className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
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
          placeholder="e.g. UDR Udaipur, LHR London, DXB Dubai"
          mode={mode}
          otherLocationValue={origin}
        />
      </div>

      {/* Popular Corridor Quick Chips & Clear Button */}
      <div className="flex items-center justify-between gap-1 flex-wrap text-[10px] font-sans-luxury">
        <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
          <span className="text-[9px] font-cinzel text-slate-400">Popular:</span>
          <button
            type="button"
            onClick={() => {
              setOrigin('BOM Mumbai (CSMIA T2)');
              setDestinationCity('UDR Udaipur (Taj Lake Palace)');
              setMode('flight');
            }}
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-gold-subtle/40 text-slate-300 hover:text-white hover:border-[#D4AF37] transition-all cursor-pointer"
          >
            Mumbai ➔ Udaipur
          </button>
          <button
            type="button"
            onClick={() => {
              setOrigin('DEL New Delhi (IGI T3)');
              setDestinationCity('LHR London (Heathrow T5)');
              setMode('flight');
            }}
            className="text-[9px] px-1.5 py-0.5 rounded bg-slate-900 border border-gold-subtle/40 text-slate-300 hover:text-white hover:border-[#D4AF37] transition-all cursor-pointer"
          >
            Delhi ➔ London
          </button>
        </div>

        {(origin || destinationCity) && (
          <button
            type="button"
            onClick={() => {
              setOrigin('');
              setDestinationCity('');
            }}
            className="text-[9px] font-cinzel text-slate-400 hover:text-rose-400 flex items-center space-x-1 cursor-pointer transition-colors"
            title="Clear current route"
          >
            <span>Reset</span>
          </button>
        )}
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

      {/* SEARCH JOURNEYS Submit Button */}
      <div className="pt-1">
        <button
          type="button"
          onClick={handleSearchClick}
          className="w-full py-3 px-4 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.18em] sm:tracking-[0.25em] transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#D4AF37]/25 hover:shadow-[#D4AF37]/40 h-auto min-h-[44px]"
        >
          <span className="break-words">SEARCH JOURNEYS</span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5] shrink-0" />
        </button>
      </div>
    </div>
  );
};
