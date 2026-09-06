import React, { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback } from 'react';
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
  TreePine,
  Zap
} from 'lucide-react';
import { LOCATION_SUGGESTIONS, LocationSuggestion } from '../data/locations';
import { INDIAN_CITIES, IndianCityEntry } from '../data/indian-cities';
import { JourneyMode } from './HeroJourneySection';
import { executeVectorCitySearch, VectorMatchResult } from '../lib/city-vector-search';

interface LocationAutocompleteProps {
  id: string;
  label: 'FROM' | 'TO';
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  mode?: JourneyMode;
  otherLocationValue?: string;
}

export type TabCategory = 
  | 'All Destinations' 
  | 'Major Cities Outside India' 
  | 'India (All Cities)' 
  | 'Metros (Tier 1)'
  | 'Major Cities (Tier 2)' 
  | 'Minor Cities (Tier 3)' 
  | 'Europe & Americas' 
  | 'Middle East & Asia' 
  | 'Hill Stations & Pilgrimage' 
  | 'Vande Bharat / Rail';

export type ZoneFilter = 
  | 'All Zones' 
  | 'North India' 
  | 'South India' 
  | 'West India' 
  | 'East India' 
  | 'Central India' 
  | 'North-East India' 
  | 'Himalayan & Islands';

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  id,
  label,
  value,
  onChange,
  placeholder = 'Search major world cities (Dubai, London, NYC...) or any Indian city & town...',
  mode = 'flight',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabCategory>('All Destinations');
  const [selectedZone, setSelectedZone] = useState<ZoneFilter>('All Zones');
  const [selectedState, setSelectedState] = useState<string>('All States');
  const [selectedGlobalRegion, setSelectedGlobalRegion] = useState<string>('All Global');
  const [liveResults, setLiveResults] = useState<LocationSuggestion[]>([]);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeQueryRef = useRef<string>('');

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
    const trimmed = searchQuery.trim();
    activeQueryRef.current = trimmed;

    if (!trimmed || trimmed.length < 2) {
      setLiveResults([]);
      setIsLoadingLive(false);
      return;
    }

    setIsLoadingLive(true);
    try {
      const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(trimmed)}&limit=12`);
      if (!res.ok) throw new Error('Global search request failed');
      
      // Guard against stale response if user continued typing
      if (activeQueryRef.current !== trimmed) {
        return;
      }

      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        const queryLower = trimmed.toLowerCase();
        const parsed: LocationSuggestion[] = data.features
          .map((item: any, idx: number) => {
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
          })
          // Filter to ensure relevance to current query
          .filter((loc: LocationSuggestion) => {
            const cLower = loc.city.toLowerCase();
            const sLower = (loc.state || '').toLowerCase();
            const tLower = loc.terminal.toLowerCase();
            return cLower.includes(queryLower) || sLower.includes(queryLower) || tLower.includes(queryLower);
          });

        // Filter out duplicate names
        const unique = parsed.filter((loc, index, self) => 
          index === self.findIndex((t) => t.city.toLowerCase() === loc.city.toLowerCase() && t.country.toLowerCase() === loc.country.toLowerCase())
        );

        if (activeQueryRef.current === trimmed) {
          setLiveResults(unique);
        }
      }
    } catch (err) {
      console.warn('Global places lookup notice:', err);
    } finally {
      if (activeQueryRef.current === trimmed) {
        setIsLoadingLive(false);
      }
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

  // Lookup map for fast retrieval of Indian City metadata (tier, zone)
  const indianCityMap = useMemo(() => {
    const map = new Map<string, IndianCityEntry>();
    INDIAN_CITIES.forEach((c) => {
      map.set(c.id, c);
      map.set(c.code.toLowerCase(), c);
      map.set(c.city.toLowerCase(), c);
    });
    return map;
  }, []);

  // Available states for filtering
  const availableStates = useMemo(() => {
    const states = new Set<string>();
    INDIAN_CITIES.forEach((c) => {
      if (c.state) states.add(c.state);
    });
    return ['All States', ...Array.from(states).sort()];
  }, []);

  // Vector search and suggestion partitioning
  const { matchedResults, otherSuggestions } = useMemo(() => {
    // 1. Base list: All locations with tier and zone enriched
    const list = LOCATION_SUGGESTIONS.map((loc) => {
      const entry = indianCityMap.get(loc.id) || indianCityMap.get(loc.code.toLowerCase()) || indianCityMap.get(loc.city.toLowerCase());
      return {
        ...loc,
        zone: entry?.zone,
        tier: entry?.tier,
      };
    });

    const query = value.trim();

    const passesFilter = (l: LocationSuggestion): boolean => {
      if (activeTab === 'All Destinations') {
        // Keep both major cities outside India and all Indian cities
      } else if (activeTab === 'Major Cities Outside India') {
        if (l.country === 'India') return false;
        if (selectedGlobalRegion === 'Middle East') {
          if (!(l.region === 'Middle East & Africa' && (l.country === 'United Arab Emirates' || l.country === 'Qatar' || l.country === 'Saudi Arabia'))) return false;
        } else if (selectedGlobalRegion === 'Europe') {
          if (l.region !== 'Europe') return false;
        } else if (selectedGlobalRegion === 'Americas') {
          if (l.region !== 'Americas') return false;
        } else if (selectedGlobalRegion === 'Asia-Pacific') {
          if (!(l.region === 'Asia & Pacific' && l.country !== 'India')) return false;
        }
      } else if (activeTab === 'Europe & Americas') {
        if (l.region !== 'Europe' && l.region !== 'Americas') return false;
      } else if (activeTab === 'Middle East & Asia') {
        if (!((l.region === 'Middle East & Africa' || l.region === 'Asia & Pacific') && l.country !== 'India')) return false;
      } else if (activeTab === 'India (All Cities)') {
        if (l.country !== 'India' && l.region !== 'India & Subcontinent') return false;
      } else if (activeTab === 'Metros (Tier 1)') {
        if (l.tier !== 'Major Metro (Tier 1)') return false;
      } else if (activeTab === 'Major Cities (Tier 2)') {
        if (l.tier !== 'Major City (Tier 2)') return false;
      } else if (activeTab === 'Minor Cities (Tier 3)') {
        if (l.tier !== 'Minor City / Town (Tier 3)') return false;
      } else if (activeTab === 'Hill Stations & Pilgrimage') {
        if (l.tier !== 'Hill Station' && l.tier !== 'Heritage & Pilgrimage') return false;
      } else if (activeTab === 'Vande Bharat / Rail') {
        if (!(l.type === 'train' || l.code.startsWith('VB') || l.terminal.toLowerCase().includes('vande bharat') || l.terminal.toLowerCase().includes('rail'))) return false;
      }

      if (selectedZone !== 'All Zones') {
        if (l.zone !== selectedZone) return false;
      }

      if (selectedState !== 'All States') {
        if (!l.state?.toLowerCase().includes(selectedState.toLowerCase())) return false;
      }

      return true;
    };

    if (!query) {
      return {
        matchedResults: [] as VectorMatchResult[],
        otherSuggestions: list.filter(passesFilter),
      };
    }

    // Execute high-performance vector search across all locations
    const { matchedResults: rawMatches, otherSuggestions: rawOthers } = executeVectorCitySearch(query, list);

    // Filter live geocoded results to ensure they don't duplicate rawMatches and match the query
    const rawMatchCityNames = new Set(rawMatches.map((m) => m.location.city.toLowerCase()));
    
    const liveMatches: VectorMatchResult[] = liveResults
      .filter((lr) => !rawMatchCityNames.has(lr.city.toLowerCase()))
      .map((lr) => ({
        location: lr,
        similarity: 0.85,
        matchPercentage: 85,
        isDirectMatch: true,
        matchReason: 'Live Global Geocoded Result',
      }));

    // Curated vector matches FIRST, then live geocoded matches
    const allMatches = [...rawMatches, ...liveMatches];

    // Strictly sort so that matching query prefix or exact city name is always #1
    const qLower = query.toLowerCase();
    allMatches.sort((a, b) => {
      const aExact = a.location.city.toLowerCase() === qLower || a.location.code.toLowerCase() === qLower;
      const bExact = b.location.city.toLowerCase() === qLower || b.location.code.toLowerCase() === qLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aPrefix = a.location.city.toLowerCase().startsWith(qLower) || a.location.code.toLowerCase().startsWith(qLower);
      const bPrefix = b.location.city.toLowerCase().startsWith(qLower) || b.location.code.toLowerCase().startsWith(qLower);
      if (aPrefix && !bPrefix) return -1;
      if (!aPrefix && bPrefix) return 1;

      // Higher similarity first
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }

      // Curated over live geocoded
      if (!a.location.isLiveResult && b.location.isLiveResult) return -1;
      if (a.location.isLiveResult && !b.location.isLiveResult) return 1;

      return 0;
    });

    const filteredMatches = allMatches.filter((m) => passesFilter(m.location));
    const seenMatchIds = new Set<string>();
    const deduplicatedMatches = filteredMatches.filter((m) => {
      if (seenMatchIds.has(m.location.id)) return false;
      seenMatchIds.add(m.location.id);
      return true;
    });

    const matchedIdSet = new Set(deduplicatedMatches.map((m) => m.location.id));

    // Whichever city matches that ONLY should show in search; OTHER add in suggestions
    const seenOtherIds = new Set<string>();
    const filteredOthers = rawOthers.filter((l) => {
      if (matchedIdSet.has(l.id)) return false;
      if (!passesFilter(l)) return false;
      if (seenOtherIds.has(l.id)) return false;
      seenOtherIds.add(l.id);
      return true;
    });

    return {
      matchedResults: deduplicatedMatches,
      otherSuggestions: filteredOthers,
    };
  }, [value, liveResults, activeTab, selectedZone, selectedState, selectedGlobalRegion, indianCityMap]);

  // Reset scroll to top whenever user enters input, results change, or opens dropdown
  useLayoutEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
    const frame = requestAnimationFrame(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    });
    return () => cancelAnimationFrame(frame);
  }, [value, isOpen, matchedResults.length]);


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

  const renderLocationCard = (
    loc: LocationSuggestion,
    matchMeta?: {
      matchPercentage: number;
      isDirectMatch: boolean;
      matchReason?: string;
    },
    uniqueKeySuffix?: string | number
  ) => {
    const isCurrent =
      value.toLowerCase().includes(loc.city.toLowerCase()) ||
      (loc.code && loc.code !== 'MAP' && value.toLowerCase().includes(loc.code.toLowerCase()));

    const cardKey = uniqueKeySuffix !== undefined
      ? `${loc.id}-${matchMeta ? 'match' : 'sugg'}-${uniqueKeySuffix}`
      : `${loc.id}-${matchMeta ? 'match' : 'sugg'}`;

    return (
      <div
        key={cardKey}
        id={`suggestion-${id}-${loc.id}${uniqueKeySuffix !== undefined ? `-${uniqueKeySuffix}` : ''}`}
        onClick={() => handleSelect(loc)}
        className={`group flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer min-h-[48px] h-auto ${
          isCurrent
            ? 'bg-[#D4AF37]/20 border-[#D4AF37]/60 shadow-md'
            : matchMeta
            ? 'bg-slate-950/70 border-slate-800/90 hover:border-emerald-500/50 hover:bg-slate-900/95'
            : 'bg-slate-950/40 border-slate-900/80 hover:border-gold-subtle hover:bg-slate-900/80'
        }`}
      >
        <div className="flex items-center space-x-3 min-w-0 flex-1">
          {/* Icon & Code Badge */}
          <div className="flex items-center space-x-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 group-hover:border-[#D4AF37]/50 shrink-0">
            {getItemIcon(loc.type)}
            <span className="font-mono text-[11px] font-bold text-[#FCE7AC]">
              {loc.code}
            </span>
          </div>

          {/* City, State, Country & Tier/Zone/Match tags */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center flex-wrap gap-1.5">
              <span className="text-xs font-semibold text-slate-100 group-hover:text-white break-words">
                {loc.city}
              </span>
              {loc.state && (
                <span className="text-[10px] font-sans text-slate-400 break-words">
                  {loc.state},
                </span>
              )}
              <span className="text-[10px] font-sans-luxury text-slate-300 break-words">
                {loc.country}
              </span>

              {/* Vector Match Badge vs Suggestion Badge */}
              {matchMeta ? (
                <span
                  className={`text-[7px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase flex items-center space-x-1 ${
                    matchMeta.matchReason?.includes('Theme')
                      ? 'bg-purple-950/80 text-purple-300 border-purple-700/60'
                      : matchMeta.isDirectMatch
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-600/60'
                      : 'bg-cyan-950/80 text-cyan-300 border-cyan-700/60'
                  }`}
                >
                  <Zap className="w-2 h-2 text-emerald-400" />
                  <span>{matchMeta.matchReason || `${matchMeta.matchPercentage}% Vector Match`}</span>
                </span>
              ) : (
                <span className="text-[7px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase bg-slate-900 text-slate-400 border-slate-800">
                  Suggested
                </span>
              )}

              {/* International Region & Gateway Badges for cities outside India */}
              {loc.country !== 'India' && (
                <>
                  <span className="text-[7px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase bg-sky-950/80 text-sky-300 border-sky-700/60">
                    {loc.region || 'Global Hub'}
                  </span>
                  {loc.popular && (
                    <span className="text-[7px] font-mono px-1.5 py-0.2 rounded border font-bold uppercase bg-amber-950/60 text-amber-300 border-amber-600/50">
                      Major Global Hub
                    </span>
                  )}
                </>
              )}

              {/* Tier Badge */}
              {(loc as any).tier && (
                <span
                  className={`text-[7px] font-mono px-1.5 py-0.2 rounded border font-semibold uppercase ${
                    (loc as any).tier.includes('Tier 1')
                      ? 'bg-amber-950/80 text-amber-300 border-amber-700/60'
                      : (loc as any).tier.includes('Tier 2')
                      ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700/60'
                      : (loc as any).tier.includes('Hill')
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60'
                      : (loc as any).tier.includes('Heritage')
                      ? 'bg-rose-950/80 text-rose-300 border-rose-700/60'
                      : 'bg-slate-900 text-slate-300 border-slate-700/60'
                  }`}
                >
                  {(loc as any).tier}
                </span>
              )}

              {/* Zone Badge */}
              {(loc as any).zone && (
                <span className="text-[7px] font-mono px-1 py-0.2 bg-slate-900/90 text-slate-400 border border-slate-800 rounded">
                  {(loc as any).zone}
                </span>
              )}

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
            className="absolute left-0 right-0 top-full mt-2 z-50 bg-[#0B0D14]/98 backdrop-blur-2xl border border-gold-subtle/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_35px_rgba(212,175,55,0.18)] overflow-hidden p-3.5 ring-1 ring-gold-subtle/40"
            style={{ maxHeight: '520px' }}
          >


            {/* Live Search Indicator Banner when typing */}
            {value.trim().length > 0 && (
              <div className="flex items-center justify-between px-2.5 py-1.5 mb-2 bg-[#121624] border border-gold-subtle/30 rounded-lg text-[9px] font-mono text-slate-300">
                <span className="flex items-center space-x-1.5">
                  <NavIcon className="w-2.5 h-2.5 text-[#D4AF37]" />
                  <span>Vector Searching for: <strong className="text-[#FCE7AC]">&quot;{value}&quot;</strong></span>
                </span>
                <span className="text-[8px] text-emerald-400 flex items-center space-x-1 uppercase tracking-wider font-semibold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Showing Matches First • Others in Suggestions</span>
                </span>
              </div>
            )}

            {/* Quick Iconic Hubs & Vector Vibe Chips (when input is empty) */}
            {value.length === 0 && (
              <div className="py-2 mb-2 border-b border-slate-800/80 space-y-2">
                {/* Curated Travel Experiences Quick Search */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-cinzel text-[#FCE7AC] tracking-widest uppercase font-semibold flex items-center space-x-1">
                      <Compass className="w-2.5 h-2.5 text-[#D4AF37]" />
                      <span>CURATED TRAVEL ESCAPES</span>
                    </span>
                    <span className="text-[7px] font-mono text-slate-400">
                      Hand-Selected Journeys
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { label: '🏖️ Beaches & Coastal', query: 'beach' },
                      { label: '🏔️ Snow & Mountains', query: 'snow' },
                      { label: '🛕 Temples & Pilgrimage', query: 'temple' },
                      { label: '🏰 Royal Heritage', query: 'palace' },
                      { label: '💼 Tech Hubs', query: 'tech' },
                      { label: '🌆 Megacities', query: 'metro' },
                      { label: '☕ Tea & Backwaters', query: 'backwaters' },
                      { label: '🦁 Safari & Wildlife', query: 'safari' },
                    ].map((vibe) => (
                      <button
                        key={vibe.query}
                        type="button"
                        onClick={() => {
                          onChange(vibe.query);
                          inputRef.current?.focus();
                        }}
                        className="px-2 py-0.5 rounded-md bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/50 hover:border-purple-500/70 text-[8px] font-mono text-purple-200 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span>{vibe.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Major Cities Outside India */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-cinzel text-sky-400 tracking-widest uppercase font-semibold flex items-center space-x-1">
                      <span>MAJOR CITIES OUTSIDE INDIA (GLOBAL HUBS)</span>
                    </span>
                    <span className="text-[7px] font-mono text-slate-500">
                      Instant 1-Click Select
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { code: 'DXB', city: 'Dubai' },
                      { code: 'LHR', city: 'London' },
                      { code: 'JFK', city: 'New York' },
                      { code: 'SIN', city: 'Singapore' },
                      { code: 'CDG', city: 'Paris' },
                      { code: 'HND', city: 'Tokyo' },
                      { code: 'ZRH', city: 'Zurich' },
                      { code: 'FRA', city: 'Frankfurt' },
                      { code: 'SYD', city: 'Sydney' },
                      { code: 'BKK', city: 'Bangkok' },
                      { code: 'DOH', city: 'Doha' },
                    ].map((loc) => (
                      <button
                        key={loc.code}
                        type="button"
                        onClick={() => {
                          onChange(`${loc.code} ${loc.city}`);
                          setIsOpen(false);
                        }}
                        className="px-2 py-0.5 rounded-md bg-sky-950/40 hover:bg-sky-900/60 border border-sky-800/50 hover:border-sky-500/70 text-[9px] font-mono text-sky-200 hover:text-white transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span className="font-bold text-sky-400">{loc.code}</span>
                        <span className="text-slate-500">•</span>
                        <span>{loc.city}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Major Cities & Metros in India */}
                <div className="pt-0.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[8px] font-cinzel text-[#E5C158] tracking-widest uppercase font-semibold">
                      MAJOR CITIES & METROS IN INDIA
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { code: 'BOM', city: 'Mumbai' },
                      { code: 'DEL', city: 'Delhi NCR' },
                      { code: 'BLR', city: 'Bengaluru' },
                      { code: 'HYD', city: 'Hyderabad' },
                      { code: 'MAA', city: 'Chennai' },
                      { code: 'CCU', city: 'Kolkata' },
                      { code: 'AMD', city: 'Ahmedabad' },
                      { code: 'PNQ', city: 'Pune' },
                      { code: 'GOI', city: 'Goa' },
                      { code: 'SXR', city: 'Srinagar' },
                      { code: 'JAI', city: 'Jaipur' },
                      { code: 'COK', city: 'Kochi' },
                      { code: 'VNS', city: 'Varanasi' },
                      { code: 'AYJ', city: 'Ayodhya' },
                    ].map((loc) => (
                      <button
                        key={loc.code}
                        type="button"
                        onClick={() => {
                          onChange(`${loc.code} ${loc.city}`);
                          setIsOpen(false);
                        }}
                        className="px-2 py-0.5 rounded-md bg-slate-900 hover:bg-[#D4AF37]/20 border border-slate-800 hover:border-[#D4AF37]/50 text-[9px] font-mono text-slate-300 hover:text-[#FCE7AC] transition-all cursor-pointer flex items-center space-x-1"
                      >
                        <span className="font-bold text-[#D4AF37]">{loc.code}</span>
                        <span className="text-slate-500">•</span>
                        <span>{loc.city}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Scrollable Container with Vector Search Matches and Other Suggestions */}
            <div
              ref={scrollContainerRef}
              id={`${id}-scroll-container`}
              className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar scroll-smooth"
            >
              {value.trim().length > 0 ? (
                <>
                  {/* SECTION 1: SEARCH MATCHES ONLY (Whichever city matches that ONLY shows in search) */}
                  <div
                    id={`${id}-search-matches-division`}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded-lg shadow-sm">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center">
                          <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                        </div>
                        <span className="text-[10px] font-cinzel font-bold text-emerald-300 tracking-wider">
                          SEARCH MATCHES ({matchedResults.length} FOUND)
                        </span>
                        <span className="text-[7px] font-mono px-1.5 py-0.2 bg-emerald-900/80 text-emerald-200 border border-emerald-600/60 rounded font-semibold uppercase">
                          PRIORITIZED TOP
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        {isLoadingLive && (
                          <div className="w-2.5 h-2.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        )}
                        <span className="text-[8px] font-mono text-emerald-300/90 font-medium">
                          Exact & semantic matches
                        </span>
                      </div>
                    </div>

                    {matchedResults.length > 0 ? (
                      matchedResults.map((match, idx) =>
                        renderLocationCard(
                          match.location,
                          {
                            matchPercentage: match.matchPercentage,
                            isDirectMatch: match.isDirectMatch,
                            matchReason: match.matchReason,
                          },
                          `match-${idx}`
                        )
                      )
                    ) : (
                      <div className="py-4 px-3 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center space-y-1">
                        <p className="text-xs font-mono text-slate-300">
                          No direct search matches for &quot;<span className="text-[#FCE7AC] font-semibold">{value}</span>&quot;
                        </p>
                        <p className="text-[9px] font-mono text-slate-400">
                          Browse all available destinations in the suggestions list below ↓
                        </p>
                      </div>
                    )}
                  </div>

                  {/* SECTION 2: OTHER SUGGESTIONS & POPULAR DESTINATIONS (Other add in suggestions) */}
                  <div
                    id={`${id}-other-suggestions-division`}
                    className="pt-2 border-t border-slate-800/90 space-y-1.5"
                  >
                    <div className="flex items-center justify-between px-2.5 py-1.5 bg-slate-900/80 border border-slate-800 rounded-lg">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-4 h-4 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 flex items-center justify-center">
                          <Compass className="w-2.5 h-2.5 text-[#D4AF37]" />
                        </div>
                        <span className="text-[9px] font-cinzel font-bold text-[#FCE7AC] tracking-wider">
                          OTHER SUGGESTIONS ({otherSuggestions.length} AVAILABLE)
                        </span>
                        <span className="text-[7px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 border border-slate-700 rounded font-semibold uppercase">
                          Directory
                        </span>
                      </div>
                      <span className="text-[8px] font-mono text-slate-400">
                        Remaining cities
                      </span>
                    </div>

                    {otherSuggestions.slice(0, 40).map((loc, idx) =>
                      renderLocationCard(loc, undefined, `other-${idx}`)
                    )}
                  </div>
                </>
              ) : (
                /* When search input is empty, show the full directory */
                otherSuggestions.length > 0 ? (
                  otherSuggestions.map((loc, idx) => renderLocationCard(loc, undefined, `dir-${idx}`))
                ) : (
                  <div className="py-7 text-center text-slate-400 space-y-2">
                    <Globe className="w-6 h-6 mx-auto text-[#D4AF37]/60 animate-pulse mb-1" />
                    <p className="text-xs font-mono text-slate-200">
                      No destinations found under selected filter
                    </p>
                  </div>
                )
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
