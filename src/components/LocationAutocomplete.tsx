import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plane, 
  Train, 
  Layers, 
  MapPin, 
  X, 
  Check, 
  Search, 
  Sparkles, 
  Globe, 
  Compass, 
  Navigation as NavIcon,
  Loader2,
  Building,
  TreePine
} from 'lucide-react';
import { LOCATION_SUGGESTIONS, LocationSuggestion } from '../data/locations';
import { JourneyMode } from './HeroJourneySection';

interface LocationAutocompleteProps {
  id: string;
  label: 'FROM' | 'TO';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  mode?: JourneyMode;
  otherLocationValue?: string;
}

type TabCategory = 'All' | 'Worldwide Live' | 'Popular' | 'Europe' | 'Americas' | 'Asia & Pacific' | 'Middle East & Africa' | 'Oceania';

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Search any city, town, or airport worldwide...',
  mode = 'flight',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabCategory>('All');
  const [liveResults, setLiveResults] = useState<LocationSuggestion[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Worldwide live search engine querying global maps geocoding API for every city, town, village, and airport
  const fetchGlobalLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setLiveResults([]);
      setIsLoadingLive(false);
      return;
    }

    setIsLoadingLive(true);
    try {
      const trimmed = searchQuery.trim();
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=12`);
      if (!res.ok) throw new Error('Global search request failed');
      
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        const parsed: LocationSuggestion[] = data.features.map((item: any, idx: number) => {
          const props = item.properties || {};
          const coords = item.geometry?.coordinates || [0, 0];
          const name = props.name || props.city || props.town || trimmed;
          const state = props.state || props.county || '';
          const country = props.country || '';
          const osmValue = props.osm_value || props.type || 'place';
          
          // Generate a representative 3-letter code or tag
          let derivedCode = props.countrycode ? props.countrycode.toUpperCase() : 'MAP';
          if (props.osm_key === 'aeroway' || osmValue === 'aerodrome' || osmValue === 'airport') {
            derivedCode = 'AIR';
          } else if (props.osm_key === 'railway' || osmValue === 'station') {
            derivedCode = 'RAIL';
          } else if (name.length >= 3) {
            derivedCode = name.substring(0, 3).toUpperCase();
          }

          let itemType: LocationSuggestion['type'] = 'city';
          if (osmValue === 'town' || props.osm_key === 'place' && osmValue === 'town') {
            itemType = 'town';
          } else if (osmValue === 'village' || osmValue === 'hamlet') {
            itemType = 'village';
          } else if (osmValue === 'aerodrome' || osmValue === 'airport' || props.osm_key === 'aeroway') {
            itemType = 'flight';
          } else if (osmValue === 'station' || props.osm_key === 'railway') {
            itemType = 'train';
          }

          // Determine approximate continent/region
          let region: LocationSuggestion['region'] = 'Europe';
          const lon = coords[0];
          const lat = coords[1];
          if (lon < -30 && lon > -170 && lat > -60 && lat < 80) {
            region = 'Americas';
          } else if (lon >= 60 && lon <= 180 && lat >= 0) {
            region = 'Asia & Pacific';
          } else if (lon >= 100 && lat < 0) {
            region = 'Oceania';
          } else if (lon >= -20 && lon <= 55 && lat >= -35 && lat <= 38) {
            region = 'Middle East & Africa';
          }

          const terminalDescription = [
            props.district || props.suburb || props.county,
            state,
            country,
            `[${coords[1]?.toFixed(2)}°, ${coords[0]?.toFixed(2)}°]`
          ].filter(Boolean).join(' • ');

          return {
            id: `global-${props.osm_id || idx}-${name}`,
            code: derivedCode,
            city: name,
            state: state,
            country: country,
            terminal: terminalDescription || `Global Map Location (${country})`,
            type: itemType,
            popular: false,
            region: region,
            coordinates: [coords[0], coords[1]],
            isLiveResult: true,
          };
        });

        // Filter out duplicate names
        const unique = parsed.filter((loc, index, self) => 
          index === self.findIndex((t) => t.city === loc.city && t.country === loc.country && t.state === loc.state)
        );

        setLiveResults(unique);
      }
    } catch (err) {
      console.warn('Global places lookup notice:', err);
    } finally {
      setIsLoadingLive(false);
    }
  }, []);

  // Debounce user input for worldwide live search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.trim().length >= 2) {
      setIsLoadingLive(true);
      searchTimeoutRef.current = setTimeout(() => {
        fetchGlobalLocations(value);
      }, 280);
    } else {
      setLiveResults([]);
      setIsLoadingLive(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [value, fetchGlobalLocations]);

  // Combine curated high-fidelity dataset with live worldwide geocoding results
  const combinedSuggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    
    // 1. Filter curated locations
    const curatedMatches = LOCATION_SUGGESTIONS.filter((loc) => {
      if (query.length > 0) {
        const fullStr = `${loc.code} ${loc.city} ${loc.state || ''} ${loc.country} ${loc.terminal}`.toLowerCase();
        return fullStr.includes(query);
      }
      return true;
    });

    // 2. Merge with live results if search query is present
    let merged: LocationSuggestion[] = [];
    if (query.length >= 2) {
      // Prioritize exact or curated matches first, then live global map discoveries
      merged = [...curatedMatches, ...liveResults];
    } else {
      merged = curatedMatches;
    }

    // 3. Tab filtering
    if (activeTab === 'Worldwide Live') {
      return liveResults.length > 0 ? liveResults : merged;
    }
    if (activeTab === 'Popular') {
      return merged.filter((l) => l.popular);
    }
    if (activeTab === 'Europe') {
      return merged.filter((l) => l.region === 'Europe');
    }
    if (activeTab === 'Americas') {
      return merged.filter((l) => l.region === 'Americas');
    }
    if (activeTab === 'Asia & Pacific') {
      return merged.filter((l) => l.region === 'Asia & Pacific');
    }
    if (activeTab === 'Middle East & Africa') {
      return merged.filter((l) => l.region === 'Middle East & Africa');
    }
    if (activeTab === 'Oceania') {
      return merged.filter((l) => l.region === 'Oceania');
    }

    return merged;
  }, [value, liveResults, activeTab]);

  const handleSelect = (loc: LocationSuggestion) => {
    // Format full clean descriptive name
    let formatted = '';
    if (loc.isLiveResult) {
      const parts = [loc.city, loc.state, loc.country].filter(Boolean);
      formatted = parts.join(', ');
    } else {
      formatted = `${loc.code} ${loc.city}`;
    }
    onChange(formatted);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setLiveResults([]);
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const getItemIcon = (type: LocationSuggestion['type']) => {
    switch (type) {
      case 'train':
        return <Train className="w-3.5 h-3.5 text-[#E5C158]" />;
      case 'multimodal':
        return <Layers className="w-3.5 h-3.5 text-[#FCE7AC]" />;
      case 'town':
        return <Building className="w-3.5 h-3.5 text-[#E0C068]" />;
      case 'village':
        return <TreePine className="w-3.5 h-3.5 text-emerald-400" />;
      case 'city':
        return <Compass className="w-3.5 h-3.5 text-[#D4AF37]" />;
      case 'flight':
      default:
        return <Plane className="w-3.5 h-3.5 text-[#D4AF37]" />;
    }
  };

  return (
    <div
      id={`${id}-container`}
      ref={containerRef}
      className="relative rounded-xl bg-slate-950/80 border border-slate-800 hover:border-gold-subtle focus-within:border-[#D4AF37] px-3.5 py-2.5 transition-all shadow-inner"
    >
      {/* Label and Global Mode Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <span className="block text-[9px] font-cinzel font-semibold tracking-widest text-[#D4AF37]">
            {label}
          </span>
          <span className="flex items-center space-x-1 text-[8px] font-mono text-gold-subtle/80 uppercase tracking-widest">
            <Globe className="w-2.5 h-2.5 text-[#D4AF37]" />
            <span>GLOBAL ATLAS</span>
          </span>
        </div>
        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">
          {mode === 'flight' ? 'ANY CITY / AIRPORT' : mode === 'train' ? 'ANY STATION / REGION' : 'EVERY GLOBAL LOCATION'}
        </span>
      </div>

      {/* Input Field & Clear Button */}
      <div className="flex items-center space-x-2 mt-1">
        <MapPin className="w-3.5 h-3.5 text-gold-bright flex-shrink-0 opacity-90" />
        <input
          id={`${id}-input`}
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-transparent text-sm font-sans-luxury font-medium text-white outline-none placeholder:text-slate-500"
          placeholder={placeholder}
          autoComplete="off"
        />

        {/* Loading Spinner for Global Live Search */}
        {isLoadingLive && (
          <Loader2 className="w-3.5 h-3.5 text-[#D4AF37] animate-spin flex-shrink-0" />
        )}

        {value.length > 0 && !isLoadingLive && (
          <button
            id={`${id}-clear-btn`}
            type="button"
            onClick={handleClear}
            className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer"
            title="Clear location"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={`${id}-suggestions-panel`}
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0B0D14]/98 backdrop-blur-2xl border border-gold-subtle/80 rounded-2xl shadow-2xl overflow-hidden p-3.5 ring-1 ring-gold-subtle/30"
            style={{ maxHeight: '420px' }}
          >
            {/* Header with Global Google Maps & OpenStreetMap Database Coverage */}
            <div className="flex items-center justify-between pb-2.5 border-b border-gold-subtle/40 mb-2.5">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/60 flex items-center justify-center">
                  <Globe className="w-3 h-3 text-[#D4AF37]" />
                </div>
                <div>
                  <div className="flex items-center space-x-1.5 text-[10px] font-cinzel font-semibold tracking-wider text-[#FCE7AC]">
                    <span>WORLD MAP & CITY DIRECTORY</span>
                    <span className="px-1.5 py-0.2 text-[7px] font-mono font-bold bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40 rounded-full">
                      GLOBAL COVERAGE
                    </span>
                  </div>
                  <p className="text-[8px] font-mono text-slate-400">
                    Search every city, town, village & airport worldwide
                  </p>
                </div>
              </div>

              {isLoadingLive ? (
                <div className="flex items-center space-x-1 text-[9px] font-mono text-[#FCE7AC]">
                  <Loader2 className="w-3 h-3 animate-spin text-[#D4AF37]" />
                  <span>Searching globe...</span>
                </div>
              ) : (
                <span className="text-[9px] font-mono text-slate-400">
                  {combinedSuggestions.length} locations
                </span>
              )}
            </div>

            {/* Filter Tabs by Region & Live Global Search */}
            <div className="flex items-center space-x-1 pb-2 overflow-x-auto scrollbar-none text-[9px] font-mono">
              {(['All', 'Worldwide Live', 'Popular', 'Europe', 'Americas', 'Asia & Pacific', 'Middle East & Africa', 'Oceania'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-[#D4AF37]/25 text-[#FCE7AC] border border-[#D4AF37]/70 font-semibold shadow-sm'
                      : 'bg-slate-900/70 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  {tab === 'Worldwide Live' ? '🌍 Live World Map' : tab}
                </button>
              ))}
            </div>

            {/* Global Search Hint Banner when typing */}
            {value.trim().length > 0 && (
              <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 bg-[#121624] border border-gold-subtle/30 rounded-lg text-[9px] font-mono text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <NavIcon className="w-2.5 h-2.5 text-[#D4AF37]" />
                  <span>Searching global database for: <strong className="text-[#FCE7AC]">&quot;{value}&quot;</strong></span>
                </span>
                <span className="text-[8px] text-slate-400 uppercase tracking-wider">
                  Type any town or city
                </span>
              </div>
            )}

            {/* Quick Iconic Hubs Chips (when input is empty) */}
            {value.length === 0 && (
              <div className="py-2 mb-2 border-b border-slate-800/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[8px] font-cinzel text-slate-400 tracking-widest uppercase">
                    FEATURED GLOBAL HUBS & VISTAS
                  </span>
                  <span className="text-[8px] font-mono text-slate-500">
                    Click to select instantly
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {LOCATION_SUGGESTIONS.slice(0, 7).map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelect(loc)}
                      className="px-2 py-0.5 rounded-md bg-slate-900/90 hover:bg-[#D4AF37]/20 border border-slate-800 hover:border-[#D4AF37]/50 text-[10px] font-mono text-slate-300 hover:text-[#FCE7AC] transition-all cursor-pointer flex items-center space-x-1"
                    >
                      <span className="font-bold text-[#D4AF37]">{loc.code}</span>
                      <span>•</span>
                      <span>{loc.city}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Scrollable Suggestions & Global Results List */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {combinedSuggestions.length > 0 ? (
                combinedSuggestions.map((loc) => {
                  const isCurrent = value.toLowerCase().includes(loc.city.toLowerCase()) || 
                                    (loc.code && loc.code !== 'MAP' && value.toLowerCase().includes(loc.code.toLowerCase()));
                  return (
                    <div
                      key={loc.id}
                      id={`suggestion-${id}-${loc.id}`}
                      onClick={() => handleSelect(loc)}
                      className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 shadow-md'
                          : 'bg-slate-950/50 border-slate-900 hover:border-gold-subtle hover:bg-slate-900/90'
                      }`}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {/* Icon & Code Badge */}
                        <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 group-hover:border-[#D4AF37]/50 flex-shrink-0">
                          {getItemIcon(loc.type)}
                          <span className="font-mono text-[11px] font-bold text-[#FCE7AC]">
                            {loc.code}
                          </span>
                        </div>

                        {/* City, State, Country & Details info */}
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-semibold text-slate-100 group-hover:text-white truncate">
                              {loc.city}
                            </span>
                            {loc.state && (
                              <span className="text-[10px] font-sans text-slate-400 truncate">
                                {loc.state},
                              </span>
                            )}
                            <span className="text-[10px] font-sans-luxury text-slate-300 truncate">
                              {loc.country}
                            </span>
                            {loc.isLiveResult && (
                              <span className="text-[7px] font-mono px-1 py-0.2 bg-sky-950/80 text-sky-300 border border-sky-800/60 rounded uppercase">
                                Live Map
                              </span>
                            )}
                          </div>
                          <p className="text-[9px] font-mono text-slate-400 truncate leading-tight mt-0.5">
                            {loc.terminal}
                          </p>
                        </div>
                      </div>

                      {/* Right Indicator / Select Check */}
                      <div className="flex-shrink-0 pl-2">
                        {isCurrent ? (
                          <div className="w-5 h-5 rounded-full bg-[#D4AF37]/25 border border-[#D4AF37] flex items-center justify-center">
                            <Check className="w-3 h-3 text-[#D4AF37]" />
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1 text-[9px] font-cinzel text-slate-500 group-hover:text-[#D4AF37] opacity-0 group-hover:opacity-100 transition-opacity">
                            <span>SELECT</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-7 text-center text-slate-400 space-y-2">
                  <Globe className="w-6 h-6 mx-auto text-[#D4AF37]/60 animate-pulse mb-1" />
                  <p className="text-xs font-mono text-slate-200">
                    {isLoadingLive ? 'Searching entire world map database...' : 'No exact match found in current filter'}
                  </p>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Type any city name, small town, state, or country anywhere in the world (e.g. &quot;Zermatt&quot;, &quot;Positano&quot;, &quot;Aspen&quot;, &quot;Kyoto&quot;, &quot;Banff&quot;)
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
