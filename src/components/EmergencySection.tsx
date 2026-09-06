import React, { useState, useMemo, useRef } from 'react';
import {
  EMERGENCY_COUNTRIES,
  CountryEmergencyData,
  EmergencyContact,
  EmergencyWebsite,
} from '../data/emergencyContactsData';
import {
  Phone,
  Globe,
  Search,
  ShieldAlert,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  Flame,
  HeartPulse,
  Crosshair,
  Compass,
  Building2,
  Car,
  Users,
  ChevronRight,
  X,
  PhoneCall,
} from 'lucide-react';

interface EmergencySectionProps {
  initialCountryId?: string;
  onNavigateSection?: (section: string) => void;
}

export const EmergencySection: React.FC<EmergencySectionProps> = ({
  initialCountryId = 'in',
}) => {
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('All');
  const [selectedCountryId, setSelectedCountryId] = useState<string>(initialCountryId);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Filter countries based on region and search query
  const filteredCountries = useMemo(() => {
    const query = activeSearchTerm.trim().toLowerCase();

    return EMERGENCY_COUNTRIES.filter((country) => {
      // Region filter
      if (selectedRegion !== 'All' && country.region !== selectedRegion) {
        return false;
      }

      // Search term filter
      if (!query) return true;

      const matchesName = country.name.toLowerCase().includes(query);
      const matchesNative = country.nativeName.toLowerCase().includes(query);
      const matchesCode = country.id.toLowerCase() === query;
      const matchesDialCode = country.dialCode.includes(query);
      const matchesUniversal = country.universalSos.includes(query);
      const matchesContacts = country.contacts.some(
        (c) => c.number.includes(query) || c.label.toLowerCase().includes(query)
      );
      const matchesWebsites = country.websites.some(
        (w) => w.name.toLowerCase().includes(query) || w.url.toLowerCase().includes(query)
      );

      return (
        matchesName ||
        matchesNative ||
        matchesCode ||
        matchesDialCode ||
        matchesUniversal ||
        matchesContacts ||
        matchesWebsites
      );
    });
  }, [activeSearchTerm, selectedRegion]);

  // Active selected country object
  const activeCountry: CountryEmergencyData = useMemo(() => {
    const found = EMERGENCY_COUNTRIES.find((c) => c.id === selectedCountryId);
    if (found) return found;
    return filteredCountries[0] || EMERGENCY_COUNTRIES[0];
  }, [selectedCountryId, filteredCountries]);

  // Handle Search Button Click
  const handleExecuteSearch = (termToSearch?: string) => {
    const term = termToSearch !== undefined ? termToSearch : searchQuery;
    setActiveSearchTerm(term);

    // If exact match found, select it
    const trimmed = term.trim().toLowerCase();
    if (trimmed) {
      const exactMatch = EMERGENCY_COUNTRIES.find(
        (c) =>
          c.name.toLowerCase() === trimmed ||
          c.id.toLowerCase() === trimmed ||
          c.nativeName.toLowerCase().includes(trimmed)
      );
      if (exactMatch) {
        setSelectedCountryId(exactMatch.id);
      }
    }

    // Scroll smoothly to results area
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setActiveSearchTerm('');
  };

  // Handle Copy to Clipboard
  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  // Icon selector based on contact type
  const getContactIcon = (type: EmergencyContact['type']) => {
    switch (type) {
      case 'sos':
        return <ShieldAlert className="w-5 h-5 text-red-400" />;
      case 'medical':
        return <HeartPulse className="w-5 h-5 text-emerald-400" />;
      case 'fire':
        return <Flame className="w-5 h-5 text-amber-500" />;
      case 'police':
        return <Crosshair className="w-5 h-5 text-blue-400" />;
      case 'tourist':
        return <Compass className="w-5 h-5 text-[#D4AF37]" />;
      case 'disaster':
        return <AlertTriangle className="w-5 h-5 text-orange-400" />;
      case 'road':
        return <Car className="w-5 h-5 text-purple-400" />;
      case 'women':
        return <Users className="w-5 h-5 text-pink-400" />;
      default:
        return <Phone className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div id="emergency-section" className="space-y-12 animate-fadeIn w-full">
      {/* Top Banner: Global Emergency Intelligence & Rapid SOS */}
      <div className="p-5 sm:p-8 rounded-3xl bg-gradient-to-br from-[#120708] via-[#0C0E14] to-[#08090C] border-2 border-red-500/40 backdrop-blur-xl shadow-2xl relative overflow-hidden h-auto min-h-fit">
        {/* Subtle background emergency beacon glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex items-center space-x-2.5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-cinzel font-bold tracking-[0.16em] sm:tracking-[0.25em] text-red-400 uppercase break-words">
                GLOBAL EMERGENCY DIRECTORY & INSTANT DIALER
              </span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-4xl lg:text-5xl text-white break-words">
              Emergency Contacts & Official Assistance
            </h1>
            <p className="text-xs sm:text-sm font-sans-luxury text-slate-300 font-light max-w-3xl leading-relaxed break-words">
              Official verified emergency dispatch hotlines, tourist police helplines, disaster management portals, and consular services across all countries.
              <strong className="text-[#FCE7AC] font-medium ml-1">
                Tapping any phone number automatically opens your mobile phone dialpad prefilled with the number.
              </strong>
            </p>
          </div>

          {/* Quick SOS Card for the active country */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-red-500/50 flex flex-col items-center justify-center text-center space-y-3 min-w-[240px] sm:min-w-[260px] max-w-full shadow-lg shadow-red-950/40 h-auto min-h-fit">
            <div className="flex items-center space-x-2">
              <span className="text-2xl shrink-0">{activeCountry.flag}</span>
              <div className="text-left min-w-0">
                <div className="text-[10px] font-cinzel text-slate-400 tracking-wider">SELECTED NATION</div>
                <div className="text-sm font-bold text-white break-words">{activeCountry.name}</div>
              </div>
            </div>

            {/* Instant Mobile Call Button */}
            <a
              id="rapid-universal-sos-btn"
              href={`tel:${activeCountry.universalSos.replace(/[^0-9+]/g, '')}`}
              className="w-full py-3 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-cinzel text-xs font-bold tracking-wider sm:tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer transform active:scale-95 h-auto min-h-[44px]"
              title={`Call Universal SOS ${activeCountry.universalSos} in ${activeCountry.name}`}
            >
              <PhoneCall className="w-4 h-4 animate-bounce shrink-0" />
              <span className="break-words">TAP TO CALL SOS: {activeCountry.universalSos}</span>
            </a>

            <span className="text-[10px] text-slate-400 font-mono break-words">
              Redirects to native mobile dialpad with {activeCountry.universalSos} prefilled
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTER BAR WITH DEDICATED SEARCH BUTTON */}
      <div className="p-6 rounded-2xl bg-[#0B0D13] border border-gold-subtle/50 backdrop-blur-xl space-y-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Input field */}
          <div className="relative flex-grow">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="emergency-country-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleExecuteSearch();
              }}
              placeholder="Search country by name, code (e.g. India, USA, France, IN, US, +91), or emergency number (112, 911)..."
              className="w-full bg-[#050608] text-white pl-11 pr-10 py-3.5 rounded-xl border border-gold-subtle/40 focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-xs sm:text-sm font-sans-luxury outline-none placeholder:text-slate-500 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Explicit SEARCH BUTTON as requested */}
          <button
            id="emergency-country-search-button"
            onClick={() => handleExecuteSearch()}
            className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#D4AF37] via-[#FCE7AC] to-[#D4AF37] hover:opacity-90 text-slate-950 font-cinzel text-xs font-bold tracking-widest flex items-center justify-center space-x-2 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer flex-shrink-0 active:scale-95"
            title="Search for country emergency numbers and websites"
          >
            <Search className="w-4 h-4 text-slate-950 stroke-[2.5]" />
            <span>SEARCH COUNTRY</span>
          </button>
        </div>

        {/* Popular Quick-Select Country Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gold-subtle/20">
          <span className="text-[10px] font-cinzel text-slate-400 uppercase tracking-wider mr-1">
            Quick Jump:
          </span>
          {[
            { id: 'in', name: 'India', flag: '🇮🇳' },
            { id: 'us', name: 'United States', flag: '🇺🇸' },
            { id: 'gb', name: 'United Kingdom', flag: '🇬🇧' },
            { id: 'ae', name: 'UAE', flag: '🇦🇪' },
            { id: 'fr', name: 'France', flag: '🇫🇷' },
            { id: 'jp', name: 'Japan', flag: '🇯🇵' },
            { id: 'ch', name: 'Switzerland', flag: '🇨🇭' },
            { id: 'th', name: 'Thailand', flag: '🇹🇭' },
            { id: 'sg', name: 'Singapore', flag: '🇸🇬' },
            { id: 'au', name: 'Australia', flag: '🇦🇺' },
            { id: 'mv', name: 'Maldives', flag: '🇲🇻' },
            { id: 'de', name: 'Germany', flag: '🇩🇪' },
            { id: 'it', name: 'Italy', flag: '🇮🇹' },
            { id: 'sa', name: 'Saudi Arabia', flag: '🇸🇦' },
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCountryId(c.id);
                setSearchQuery(c.name);
                handleExecuteSearch(c.name);
              }}
              className={`px-2.5 py-1 rounded-full text-xs font-sans-luxury flex items-center space-x-1.5 border transition-all cursor-pointer ${
                activeCountry.id === c.id
                  ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#FCE7AC] font-semibold shadow-sm'
                  : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
              }`}
            >
              <span>{c.flag}</span>
              <span className="text-[11px]">{c.name}</span>
            </button>
          ))}
        </div>

        {/* Region Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2">
          {['All', 'Asia', 'Europe', 'Americas', 'Middle East', 'Oceania', 'Africa'].map((reg) => (
            <button
              key={reg}
              onClick={() => {
                setSelectedRegion(reg);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel tracking-wider transition-all cursor-pointer ${
                selectedRegion === reg
                  ? 'bg-[#D4AF37] text-slate-950 font-bold shadow-md shadow-[#D4AF37]/20'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-800'
              }`}
            >
              {reg === 'All' ? 'All Regions' : reg}
            </button>
          ))}
          <span className="ml-auto text-[11px] text-slate-400 font-mono">
            Showing {filteredCountries.length} countries
          </span>
        </div>
      </div>

      {/* DETAILED ACTIVE COUNTRY SPOTLIGHT */}
      <div
        id="country-details-spotlight"
        className="p-6 sm:p-8 rounded-3xl bg-[#0D0F16] border border-gold-subtle shadow-2xl space-y-8"
      >
        {/* Country Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gold-subtle/30">
          <div className="flex items-center space-x-3.5">
            <span className="text-4xl sm:text-5xl">{activeCountry.flag}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-serif-display text-2xl sm:text-3xl text-white font-bold">
                  {activeCountry.name}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-[#D4AF37]/10 text-[#D4AF37] border border-[#D4AF37]/30 font-mono">
                  {activeCountry.dialCode}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-cinzel">
                  {activeCountry.region}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans-luxury mt-0.5">
                Native: {activeCountry.nativeName}
                {activeCountry.notes && <span className="ml-2 text-slate-300 italic">• {activeCountry.notes}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 self-start sm:self-center">
            {/* Direct SOS Button */}
            <a
              id={`dial-sos-${activeCountry.id}`}
              href={`tel:${activeCountry.universalSos.replace(/[^0-9+]/g, '')}`}
              className="px-4 py-2 rounded-xl bg-red-600/90 hover:bg-red-500 text-white text-xs font-cinzel font-bold tracking-wider flex items-center space-x-2 shadow-lg shadow-red-950 transition-all cursor-pointer"
              title="Opens mobile dialer with universal SOS number"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>DIAL SOS ({activeCountry.universalSos})</span>
            </a>
          </div>
        </div>

        {/* Section A: Emergency Contacts Grid (Prefilled Dialpad on Mobile) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-serif-display text-lg sm:text-xl text-white">
                Emergency Phone Contacts
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Tapping opens phone dialpad prefilled on iOS & Android
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCountry.contacts.map((contact, idx) => {
              const sanitizedNumber = contact.number.replace(/[^0-9+]/g, '');
              const isCopied = copiedNumber === contact.number;

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 transition-all min-h-[160px] h-auto ${
                    contact.isPrimary
                      ? 'bg-gradient-to-br from-red-950/40 via-[#0B0E14] to-[#0A0D13] border-red-500/50 shadow-md shadow-red-950/30'
                      : 'bg-[#090B10] border-gold-subtle/30 hover:border-gold-subtle hover:bg-slate-900/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                      <div className="p-2 rounded-xl bg-black/50 border border-slate-800 shrink-0">
                        {getContactIcon(contact.type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-white leading-tight break-words">
                          {contact.label}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400 uppercase break-words">
                          {contact.type.toUpperCase()}
                        </span>
                      </div>
                    </div>

                    {contact.isPrimary && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-cinzel font-bold bg-red-600/30 text-red-300 border border-red-500/40 shrink-0 whitespace-nowrap">
                        PRIMARY SOS
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-400 font-sans-luxury leading-relaxed flex-grow break-words">
                    {contact.description}
                  </p>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                    {/* The Primary Interactive Call Button (Opens Dialpad on Mobile) */}
                    <a
                      id={`call-contact-${activeCountry.id}-${idx}`}
                      href={`tel:${sanitizedNumber}`}
                      className={`flex-grow py-2.5 px-3 rounded-xl text-xs font-cinzel font-bold tracking-wider flex items-center justify-center space-x-2 transition-all cursor-pointer shadow-md h-auto min-h-[40px] ${
                        contact.isPrimary
                          ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-900/30'
                          : 'bg-slate-900 hover:bg-[#D4AF37] text-white hover:text-slate-950 border border-gold-subtle/50'
                      }`}
                      title={`Open phone dialpad with ${contact.number}`}
                    >
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span className="break-words">DIAL {contact.number}</span>
                    </a>

                    {/* Copy button */}
                    <button
                      onClick={() => handleCopyNumber(contact.number)}
                      className="p-2.5 rounded-xl bg-black/60 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0 h-auto min-h-[40px]"
                      title="Copy phone number to clipboard"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section B: Verified Government Emergency Websites (Direct Redirection) */}
        <div className="space-y-4 pt-4 border-t border-gold-subtle/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#D4AF37]" />
              <h3 className="font-serif-display text-lg sm:text-xl text-white">
                Official Emergency Portals & Websites
              </h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
              Clicking redirects to official portal in new tab
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCountry.websites.map((website, idx) => (
              <a
                key={idx}
                id={`website-link-${activeCountry.id}-${idx}`}
                href={website.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-2xl bg-[#090B10] border border-gold-subtle/40 hover:border-[#D4AF37] hover:bg-slate-900/50 transition-all flex flex-col justify-between space-y-3 cursor-pointer group shadow-lg min-h-[140px] h-auto"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white group-hover:text-[#FCE7AC] transition-colors leading-tight break-words">
                        {website.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-500 break-words">
                        {new URL(website.url).hostname}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-[#D4AF37] transition-colors shrink-0" />
                </div>

                <p className="text-xs text-slate-400 font-sans-luxury leading-relaxed break-words">
                  {website.description}
                </p>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between flex-wrap gap-1">
                  <span className="text-[10px] font-cinzel text-slate-500 uppercase tracking-widest break-words">
                    VERIFIED OFFICIAL SERVICE
                  </span>
                  <span className="text-[11px] text-[#D4AF37] font-cinzel font-semibold flex items-center space-x-1 group-hover:translate-x-1 transition-transform shrink-0">
                    <span>Visit Portal</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ALL COUNTRIES EXPLORER LIST & QUICK JUMP */}
      <div ref={resultsRef} className="space-y-4">
        <div className="flex items-center justify-between border-b border-gold-subtle/40 pb-3">
          <div>
            <h3 className="font-serif-display text-xl sm:text-2xl text-white">
              Global Country Directory
            </h3>
            <p className="text-xs text-slate-400 font-sans-luxury">
              Select any country below to view full contact numbers, mobile dialpads, and government emergency sites.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {filteredCountries.length} countries matched
          </span>
        </div>

        {filteredCountries.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-[#0D0F16] border border-gold-subtle/30 space-y-4">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-lg font-serif-display text-white">No countries matched your search</h4>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                No matching country found for "{activeSearchTerm}". Try searching for another country like "India", "United States", "France", "Japan", or "Germany".
              </p>
            </div>
            <button
              onClick={handleClearSearch}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-cinzel text-xs cursor-pointer"
            >
              Reset Search Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredCountries.map((c) => {
              const isSelected = c.id === activeCountry.id;
              const sanitizedSos = c.universalSos.replace(/[^0-9+]/g, '');

              return (
                <div
                  key={c.id}
                  id={`country-card-${c.id}`}
                  onClick={() => {
                    setSelectedCountryId(c.id);
                    document.getElementById('country-details-spotlight')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 min-h-[190px] h-auto ${
                    isSelected
                      ? 'bg-[#121520] border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-xl'
                      : 'bg-[#0A0C12] border-slate-800/80 hover:border-gold-subtle/60 hover:bg-slate-900/60'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl">{c.flag}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                        {c.dialCode}
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-white break-words">{c.name}</h4>
                    <p className="text-[11px] text-slate-400 font-mono break-words">{c.nativeName}</p>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Universal SOS:</span>
                      <span className="font-bold font-mono text-red-400">{c.universalSos}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{c.contacts.length} Hotlines</span>
                      <span>{c.websites.length} Portals</span>
                    </div>

                    {/* Quick Call Button right on the card */}
                    <div className="flex items-center space-x-2 pt-1">
                      <a
                        href={`tel:${sanitizedSos}`}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-200 border border-red-800/60 text-[11px] font-cinzel font-semibold flex items-center justify-center space-x-1 transition-all"
                        title={`Dial ${c.universalSos} in ${c.name} on mobile dialer`}
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Dial {c.universalSos}</span>
                      </a>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCountryId(c.id);
                          document.getElementById('country-details-spotlight')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        className="py-1.5 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-[11px] font-cinzel"
                      >
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EMERGENCY PROTOCOL MEMO */}
      <div className="p-6 rounded-2xl bg-[#090B10] border border-gold-subtle/30 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-white font-cinzel tracking-wider">
            ReRoute Privé Emergency Guarantee
          </h4>
          <p className="text-xs text-slate-400 max-w-2xl font-sans-luxury">
            In any disruption, accident, or flight cancellation, ReRoute automatically activates statutory passenger recovery under DGCA & IATA treaties, files immediate IRCTC TDR refunds, and coordinates emergency airport ground transfers.
          </p>
        </div>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <a
            href="tel:112"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] text-white text-xs font-cinzel tracking-wider transition-all"
          >
            Universal 112
          </a>
          <a
            href="tel:911"
            className="px-4 py-2 rounded-xl bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] text-white text-xs font-cinzel tracking-wider transition-all"
          >
            Universal 911
          </a>
        </div>
      </div>
    </div>
  );
};
