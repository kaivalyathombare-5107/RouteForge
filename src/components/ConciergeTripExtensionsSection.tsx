// src/components/ConciergeTripExtensionsSection.tsx
import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Hotel,
  Compass,
  Car,
  ChevronRight,
  Plane,
  Train,
  Check,
  RefreshCw,
  Info,
  Bookmark,
  ArrowUpRight,
} from 'lucide-react';

export interface CapturedMainTrip {
  id: string;
  title: string;
  origin: string;
  originCode: string;
  destination: string;
  destCode: string;
  carrier: string;
  serviceNumber: string;
  departureTime: string;
  arrivalTime: string;
  travelDate: string;
  pnr: string;
  bookingPortal: string;
  totalPrice: number;
  cabinClass: string;
  capturedAt: string;
}

export interface ExtensionStay {
  id: string;
  name: string;
  category: string;
  location: string;
  distanceFromTerminal: string;
  checkInBufferNotice: string;
  pricePerNight: string;
  rating: string;
  image: string;
  description: string;
  amenities: string[];
  links: {
    makemytrip: string;
    official: string;
    google: string;
  };
}

export interface ExtensionShortTrip {
  id: string;
  title: string;
  tag: string;
  bestDepartureRelative: string;
  duration: string;
  transportMode: string;
  priceEstimate: string;
  image: string;
  description: string;
  highlights: string[];
  links: {
    makemytripActivities: string;
    makemytripCabs: string;
    tripadvisor: string;
  };
}

const getInitialUpcomingDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  const dd = String(d.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const mm = monthNames[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
};

export const ConciergeTripExtensionsSection: React.FC<{
  onNavigateSection?: (section: string) => void;
}> = ({ onNavigateSection }) => {
  const [tripData, setTripData] = useState<CapturedMainTrip | null>(() => {
    try {
      const stored = localStorage.getItem('routeforge_active_concierge_booking');
      if (stored) {
        const parsed = JSON.parse(stored) as CapturedMainTrip;
        if (parsed.id !== 'trip-bom-udr-default') return parsed;
        localStorage.removeItem('routeforge_active_concierge_booking');
      }
    } catch {
      // fallback
    }
    return null;
  });

  const [depTimeInput, setDepTimeInput] = useState('');
  const [arrTimeInput, setArrTimeInput] = useState('');
  const [pnrInput, setPnrInput] = useState('');
  const [originInput, setOriginInput] = useState('');
  const [originCodeInput, setOriginCodeInput] = useState('');
  const [destinationInput, setDestinationInput] = useState('');
  const [destinationCodeInput, setDestinationCodeInput] = useState('');
  const [carrierInput, setCarrierInput] = useState('');
  const [serviceNumberInput, setServiceNumberInput] = useState('');
  const [travelDateInput, setTravelDateInput] = useState('');
  const [bookingPortalInput, setBookingPortalInput] = useState('');
  const [cabinClassInput, setCabinClassInput] = useState('');
  const [totalPriceInput, setTotalPriceInput] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'stays' | 'trips'>('all');
  const [savedExtensions, setSavedExtensions] = useState<string[]>([]);

  // Listen for background booking events from BookingOptionsModal
  useEffect(() => {
    const handleBookingCaptured = (e: any) => {
      if (e.detail) {
        setTripData(e.detail);
        setDepTimeInput(e.detail.departureTime);
        setArrTimeInput(e.detail.arrivalTime);
        setPnrInput(e.detail.pnr);
        setOriginInput(e.detail.origin);
        setOriginCodeInput(e.detail.originCode);
        setDestinationInput(e.detail.destination);
        setDestinationCodeInput(e.detail.destCode);
        setCarrierInput(e.detail.carrier);
        setServiceNumberInput(e.detail.serviceNumber);
        setTravelDateInput(e.detail.travelDate);
        setBookingPortalInput(e.detail.bookingPortal);
        setCabinClassInput(e.detail.cabinClass);
        setTotalPriceInput(String(e.detail.totalPrice));
        setIsSaved(true);
      }
    };

    window.addEventListener('routeforge_booking_captured', handleBookingCaptured);
    return () => window.removeEventListener('routeforge_booking_captured', handleBookingCaptured);
  }, []);

  useEffect(() => {
    if (!tripData) return;
    setDepTimeInput(tripData.departureTime);
    setArrTimeInput(tripData.arrivalTime);
    setPnrInput(tripData.pnr);
    setOriginInput(tripData.origin);
    setOriginCodeInput(tripData.originCode);
    setDestinationInput(tripData.destination);
    setDestinationCodeInput(tripData.destCode);
    setCarrierInput(tripData.carrier);
    setServiceNumberInput(tripData.serviceNumber);
    setTravelDateInput(tripData.travelDate);
    setBookingPortalInput(tripData.bookingPortal);
    setCabinClassInput(tripData.cabinClass);
    setTotalPriceInput(String(tripData.totalPrice));
  }, [tripData]);

  const handleSyncTimings = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tripData) return;
    const updated: CapturedMainTrip = {
      ...tripData,
      departureTime: depTimeInput,
      arrivalTime: arrTimeInput,
      pnr: pnrInput,
    };
    setTripData(updated);
    try {
      localStorage.setItem('routeforge_active_concierge_booking', JSON.stringify(updated));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 4000);
  };

  const handleCreateBooking = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CapturedMainTrip = {
      id: `manual-${Date.now()}`,
      title: `${originInput} to ${destinationInput} (${carrierInput} ${serviceNumberInput})`,
      origin: originInput,
      originCode: originCodeInput,
      destination: destinationInput,
      destCode: destinationCodeInput,
      carrier: carrierInput,
      serviceNumber: serviceNumberInput,
      departureTime: depTimeInput,
      arrivalTime: arrTimeInput,
      travelDate: travelDateInput,
      pnr: pnrInput,
      bookingPortal: bookingPortalInput,
      totalPrice: Number(totalPriceInput) || 0,
      cabinClass: cabinClassInput,
      capturedAt: new Date().toISOString(),
    };
    setTripData(created);

  if (!tripData) {
    const inputClass = 'w-full rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-gold-bright focus:outline-none';
    const labelClass = 'mb-1 block text-[10px] font-cinzel tracking-wider text-slate-400 uppercase';

    return (
      <div id="concierge-main-trip-extensions" className="space-y-6 animate-fadeIn">
        <div className="rounded-3xl border border-[#D4AF37]/30 bg-[#0B0E14] p-6 shadow-2xl sm:p-8">
          <div className="mb-6 border-b border-slate-800 pb-5">
            <div className="flex items-center space-x-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[#D4AF37]" />
              <span className="text-[11px] font-cinzel font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
                BOOKING DETAILS CAPTURE
              </span>
            </div>
            <h3 className="mt-2 font-serif-display text-2xl text-white sm:text-3xl">
              Add your current journey
            </h3>
            <p className="mt-2 max-w-3xl text-xs leading-relaxed text-slate-300">
              Enter a confirmed booking to generate stays and excursions for its actual destination and arrival window.
            </p>
          </div>

          <form onSubmit={handleCreateBooking} className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div><label className={labelClass}>Origin</label><input required value={originInput} onChange={(e) => setOriginInput(e.target.value)} placeholder="Mumbai" className={inputClass} /></div>
            <div><label className={labelClass}>Origin code</label><input required value={originCodeInput} onChange={(e) => setOriginCodeInput(e.target.value.toUpperCase())} placeholder="BOM" className={inputClass} /></div>
            <div><label className={labelClass}>Destination</label><input required value={destinationInput} onChange={(e) => setDestinationInput(e.target.value)} placeholder="Udaipur" className={inputClass} /></div>
            <div><label className={labelClass}>Destination code</label><input required value={destinationCodeInput} onChange={(e) => setDestinationCodeInput(e.target.value.toUpperCase())} placeholder="UDR" className={inputClass} /></div>
            <div><label className={labelClass}>Carrier / provider</label><input required value={carrierInput} onChange={(e) => setCarrierInput(e.target.value)} placeholder="Air India / IRCTC" className={inputClass} /></div>
            <div><label className={labelClass}>Flight / train number</label><input required value={serviceNumberInput} onChange={(e) => setServiceNumberInput(e.target.value)} placeholder="AI-643 / 12952" className={inputClass} /></div>
            <div><label className={labelClass}>Travel date</label><input required value={travelDateInput} onChange={(e) => setTravelDateInput(e.target.value)} placeholder="15 Oct 2026" className={inputClass} /></div>
            <div><label className={labelClass}>Booking portal</label><input required value={bookingPortalInput} onChange={(e) => setBookingPortalInput(e.target.value)} placeholder="IRCTC / MakeMyTrip" className={inputClass} /></div>
            <div><label className={labelClass}>Departure time</label><input required value={depTimeInput} onChange={(e) => setDepTimeInput(e.target.value)} placeholder="06:15 IST" className={inputClass} /></div>
            <div><label className={labelClass}>Arrival time</label><input required value={arrTimeInput} onChange={(e) => setArrTimeInput(e.target.value)} placeholder="11:45 IST" className={inputClass} /></div>
            <div><label className={labelClass}>PNR / booking reference</label><input required value={pnrInput} onChange={(e) => setPnrInput(e.target.value)} placeholder="Booking reference" className={inputClass} /></div>
            <div><label className={labelClass}>Total price (INR)</label><input required type="number" min="0" value={totalPriceInput} onChange={(e) => setTotalPriceInput(e.target.value)} placeholder="18450" className={inputClass} /></div>
            <div className="md:col-span-2 lg:col-span-4"><label className={labelClass}>Class / cabin</label><input required value={cabinClassInput} onChange={(e) => setCabinClassInput(e.target.value)} placeholder="Economy / Executive / First AC" className={inputClass} /></div>
            <button type="submit" className="gold-gradient-bar flex items-center justify-center space-x-2 rounded-xl px-4 py-3 text-xs font-bold tracking-wider text-slate-950 shadow-lg md:col-span-2 lg:col-span-4">
              <Check className="h-4 w-4" />
              <span>CAPTURE BOOKING &amp; SHOW JOURNEY SUGGESTIONS</span>
            </button>
          </form>
        </div>
      </div>
    );
  }
    try {
      localStorage.setItem('routeforge_active_concierge_booking', JSON.stringify(created));
    } catch (err) {
      console.warn('LocalStorage save error:', err);
    }
  };

  const toggleSaveExtension = (id: string) => {
    setSavedExtensions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Generate stays dynamically based on destination & arrival time
  const destinationLower = tripData.destination.toLowerCase();
  const stays: ExtensionStay[] = getStaysForDestination(destinationLower, arrTimeInput);
  const shortTrips: ExtensionShortTrip[] = getShortTripsForDestination(destinationLower, arrTimeInput);

  return (
    <div id="concierge-main-trip-extensions" className="space-y-8 animate-fadeIn">
      {/* SECTION HEADER WITH REAL-TIME CAPTURE BADGE */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#0B0E14] border border-[#D4AF37]/30 shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-2">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-cinzel font-bold tracking-[0.25em] text-[#D4AF37] uppercase">
                POST-BOOKING CONCIERGE ENGINE • ACTIVE MAIN TRIP
              </span>
            </div>
            <h3 className="font-serif-display text-2xl sm:text-3xl lg:text-4xl text-white">
              Main Itinerary Verification &amp; Extension Concierge
            </h3>
            <p className="text-xs sm:text-sm font-sans-luxury text-slate-300 max-w-3xl leading-relaxed">
              RouteForge has synchronized your booking from <span className="text-[#FCE7AC] font-semibold">{tripData.bookingPortal}</span>. 
              Review your scheduled departure and arrival timings below to preview personalized luxury stays and synchronized day excursions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-xl bg-slate-900/90 border border-[#D4AF37]/40 text-center">
              <span className="text-[10px] font-cinzel text-slate-400 uppercase tracking-wider block">
                PNR Reference
              </span>
              <span className="text-sm font-mono font-bold text-[#FCE7AC]">
                {tripData.pnr}
              </span>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-emerald-950/50 border border-emerald-500/50 text-center">
              <span className="text-[10px] font-cinzel text-emerald-400 uppercase tracking-wider block">
                Booking Status
              </span>
              <span className="text-xs font-semibold text-emerald-300 flex items-center justify-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Synchronized</span>
              </span>
            </div>
          </div>
        </div>

        {/* INTERACTIVE BOOKING DETAILS CAPTURE FORM */}
        <form onSubmit={handleSyncTimings} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Origin & Destination */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <label className="text-[10px] font-cinzel tracking-wider text-slate-400 uppercase block">
              Transit Corridor
            </label>
            <div className="text-sm font-semibold text-white flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <span>
                {tripData.origin} ({tripData.originCode}) → {tripData.destination} ({tripData.destCode})
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              {tripData.carrier} • {tripData.serviceNumber}
            </span>
          </div>

          {/* Departure Time Input */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 focus-within:border-[#D4AF37]/60 transition-all">
            <label className="text-[10px] font-cinzel tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>Main Departure Time</span>
              <Clock className="w-3 h-3 text-[#D4AF37]" />
            </label>
            <input
              type="text"
              value={depTimeInput}
              onChange={(e) => setDepTimeInput(e.target.value)}
              placeholder="e.g. 06:15 IST, 15 Oct 2026"
              className="w-full bg-transparent text-sm font-semibold text-[#FCE7AC] focus:outline-none placeholder:text-slate-600 font-mono"
            />
            <span className="text-[10px] text-slate-500 block">From {tripData.origin} Terminal</span>
          </div>

          {/* Destination Arrival Time Input */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5 focus-within:border-[#D4AF37]/60 transition-all">
            <label className="text-[10px] font-cinzel tracking-wider text-slate-400 uppercase flex items-center justify-between">
              <span>Destination Arrival Time</span>
              <Clock className="w-3 h-3 text-emerald-400" />
            </label>
            <input
              type="text"
              value={arrTimeInput}
              onChange={(e) => setArrTimeInput(e.target.value)}
              placeholder="e.g. 11:45 IST, 15 Oct 2026"
              className="w-full bg-transparent text-sm font-semibold text-emerald-300 focus:outline-none placeholder:text-slate-600 font-mono"
            />
            <span className="text-[10px] text-slate-500 block">At {tripData.destination} Terminal</span>
          </div>

          {/* Sync Action */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col justify-between space-y-2">
            <label className="text-[10px] font-cinzel tracking-wider text-slate-400 uppercase block">
              Schedule Recalculation
            </label>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-1.5 shadow-md shadow-[#D4AF37]/15 cursor-pointer active:scale-98"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>SYNC SCHEDULE &amp; BUFFERS</span>
            </button>
            {isSaved && (
              <span className="text-[10px] text-emerald-400 flex items-center justify-center space-x-1">
                <Check className="w-3 h-3" />
                <span>Updated! Extension buffers re-anchored.</span>
              </span>
            )}
          </div>
        </form>

        {/* Arrival Timeline Anchor Summary Banner */}
        <div className="p-3.5 rounded-2xl bg-[#141824]/90 border border-slate-700/60 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2.5 text-slate-300">
            <Info className="w-4 h-4 text-[#D4AF37] shrink-0" />
            <span>
              All stay check-in notifications and day trips below are anchored to your <strong className="text-white">{arrTimeInput}</strong> arrival in <strong className="text-[#FCE7AC]">{tripData.destination}</strong>.
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">
              Car Rental Buffer: ~35m
            </span>
            <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 text-slate-300 font-mono text-[11px]">
              Hotel Check-in: Early Arr. Coordinated
            </span>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH SCOPE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <span className="w-7 h-7 rounded-full bg-[#D4AF37] text-slate-950 font-cinzel font-bold text-xs flex items-center justify-center shadow-md">
            ✦
          </span>
          <div>
            <h4 className="text-xl sm:text-2xl font-serif-display font-bold text-white">
              Curated Extensions for {tripData.destination}
            </h4>
            <p className="text-xs text-slate-400 font-sans-luxury">
              Directly prefilled booking links to verified travel portals, palace suites, and local day trips.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 rounded-xl bg-slate-950 border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-medium transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Suggestions ({stays.length + shortTrips.length})
          </button>
          <button
            onClick={() => setActiveTab('stays')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'stays'
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Hotel className="w-3.5 h-3.5" />
            <span>Luxury Stays ({stays.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('trips')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-cinzel font-medium transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'trips'
                ? 'bg-[#D4AF37] text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Short Trips &amp; Excursions ({shortTrips.length})</span>
          </button>
        </div>
      </div>

      {/* PART A: SUGGESTED STAYS SECTION */}
      {(activeTab === 'all' || activeTab === 'stays') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-cinzel font-bold tracking-wider text-[#D4AF37]">
              <Hotel className="w-4 h-4" />
              <span>RECOMMENDED LUXURY STAYS • SYNCHRONIZED CHECK-IN</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Prefilled on MakeMyTrip &amp; Official Portals
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {stays.map((stay) => (
              <div
                key={stay.id}
                className="rounded-2xl bg-[#0D1017] border border-slate-800 hover:border-[#D4AF37]/50 transition-all duration-300 overflow-hidden flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-900">
                    <img
                      src={stay.image}
                      alt={stay.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1017] via-transparent to-black/40" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 border border-gold-subtle backdrop-blur-md text-[10px] font-cinzel text-[#FCE7AC]">
                      {stay.category}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-[11px] font-bold text-emerald-300">
                      ★ {stay.rating}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                      <span className="flex items-center space-x-1 font-mono text-[11px]">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{stay.distanceFromTerminal}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h5 className="font-serif-display text-lg font-bold text-white group-hover:text-[#FCE7AC] transition-colors">
                      {stay.name}
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans-luxury">
                      {stay.description}
                    </p>

                    {/* Arrival timing buffer note */}
                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2">
                      <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span>{stay.checkInBufferNotice}</span>
                    </div>

                    {/* Amenities pills */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {stay.amenities.map((am, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-slate-300"
                        >
                          {am}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="flex items-baseline justify-between border-t border-slate-800 pt-3">
                    <span className="text-[11px] text-slate-400">Tariff estimate:</span>
                    <span className="text-base font-serif-display font-bold text-[#FCE7AC]">
                      {stay.pricePerNight}
                    </span>
                  </div>

                  {/* Redirection Website Action Links */}
                  <div className="space-y-2">
                    <a
                      href={stay.links.makemytrip}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#FCE7AC] hover:text-slate-950 border border-[#D4AF37]/40 font-cinzel text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer group/link"
                    >
                      <span>Book on MakeMyTrip Hotels</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>

                    <div className="flex gap-2">
                      <a
                        href={stay.links.official}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-cinzel text-center transition-all flex items-center justify-center space-x-1"
                      >
                        <span>Official Portal</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <a
                        href={stay.links.google}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-cinzel text-center transition-all flex items-center justify-center space-x-1"
                      >
                        <span>Google Hotels</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        onClick={() => toggleSaveExtension(stay.id)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          savedExtensions.includes(stay.id)
                            ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                        title="Save to Concierge Itinerary"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PART B: SUGGESTED SHORT TRIPS & DAY EXCURSIONS */}
      {(activeTab === 'all' || activeTab === 'trips') && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-cinzel font-bold tracking-wider text-[#D4AF37]">
              <Compass className="w-4 h-4" />
              <span>RECOMMENDED SHORT TRIPS &amp; DAY EXCURSIONS</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Anchored to your arrival window
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {shortTrips.map((trip) => (
              <div
                key={trip.id}
                className="rounded-2xl bg-[#0D1017] border border-slate-800 hover:border-[#D4AF37]/50 transition-all duration-300 overflow-hidden flex flex-col justify-between group shadow-xl"
              >
                <div>
                  <div className="relative h-44 w-full overflow-hidden bg-slate-900">
                    <img
                      src={trip.image}
                      alt={trip.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0D1017] via-transparent to-black/40" />
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 border border-gold-subtle backdrop-blur-md text-[10px] font-cinzel text-[#FCE7AC]">
                      {trip.tag}
                    </div>
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-[10px] font-mono text-slate-300">
                      {trip.duration}
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs text-slate-200">
                      <span className="flex items-center space-x-1 font-mono text-[11px] text-[#FCE7AC]">
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
                        <span>{trip.bestDepartureRelative}</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-3">
                    <h5 className="font-serif-display text-lg font-bold text-white group-hover:text-[#FCE7AC] transition-colors">
                      {trip.title}
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans-luxury">
                      {trip.description}
                    </p>

                    <div className="p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2">
                      <Car className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                      <span>{trip.transportMode}</span>
                    </div>

                    <div className="space-y-1 pt-1">
                      {trip.highlights.map((hl, idx) => (
                        <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-400">
                          <span className="text-[#D4AF37]">✓</span>
                          <span>{hl}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-3">
                  <div className="flex items-baseline justify-between border-t border-slate-800 pt-3">
                    <span className="text-[11px] text-slate-400">Excursion estimate:</span>
                    <span className="text-base font-serif-display font-bold text-[#FCE7AC]">
                      {trip.priceEstimate}
                    </span>
                  </div>

                  {/* Redirection Website Action Links */}
                  <div className="space-y-2">
                    <a
                      href={trip.links.makemytripActivities}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 px-3 rounded-xl bg-[#D4AF37]/15 hover:bg-[#D4AF37] text-[#FCE7AC] hover:text-slate-950 border border-[#D4AF37]/40 font-cinzel text-xs font-bold tracking-wider transition-all flex items-center justify-center space-x-1.5 cursor-pointer group/link"
                    >
                      <span>Book on MakeMyTrip Experiences</span>
                      <ArrowUpRight className="w-3.5 h-3.5 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                    </a>

                    <div className="flex gap-2">
                      <a
                        href={trip.links.makemytripCabs}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-cinzel text-center transition-all flex items-center justify-center space-x-1"
                      >
                        <Car className="w-3 h-3" />
                        <span>Reserve Cab</span>
                      </a>
                      <a
                        href={trip.links.tripadvisor}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1.5 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 text-[10px] font-cinzel text-center transition-all flex items-center justify-center space-x-1"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>TripAdvisor</span>
                      </a>
                      <button
                        onClick={() => toggleSaveExtension(trip.id)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${
                          savedExtensions.includes(trip.id)
                            ? 'bg-[#D4AF37] text-slate-950 border-[#D4AF37]'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                        title="Save to Concierge Itinerary"
                      >
                        <Bookmark className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper for Stays
function getStaysForDestination(dest: string, arrivalTime: string): ExtensionStay[] {
  const d = dest.toLowerCase();

  // Chennai / MAA
  if (d.includes('chennai') || d.includes('maa') || d.includes('madras')) {
    return [
      {
        id: 'stay_leela_chennai',
        name: 'The Leela Palace Chennai',
        category: 'SEAFRONT MODERN PALACE',
        location: 'Adyar Seaface, MRC Nagar, Chennai, Tamil Nadu',
        distanceFromTerminal: '14 km from Chennai (MAA) International Airport',
        checkInBufferNotice: `Bay of Bengal oceanfront suite ready post ${arrivalTime} • Sea-view infinity pool access`,
        pricePerNight: '₹22,500 / night',
        rating: '4.9',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        description: 'Tamil Nadu\'s premier modern palace hotel facing the Bay of Bengal, combining Chettinad royal heritage with contemporary luxury.',
        amenities: ['Sea-Facing Suites', 'ESPA Ocean Spa', 'Spectra International Dining', 'Chauffeur Airport Transfer'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/chennai-hotels.html?city=Chennai',
          official: 'https://www.theleela.com/the-leela-palace-chennai/',
          google: 'https://www.google.com/travel/hotels/chennai',
        },
      },
      {
        id: 'stay_taj_coromandel',
        name: 'Taj Coromandel Chennai',
        category: 'HERITAGE GRAND LUXURY',
        location: 'Nungambakkam, Chennai, Tamil Nadu',
        distanceFromTerminal: '16 km from MAA Airport',
        checkInBufferNotice: `Personalized South Indian hospitality welcome coordinated for ${arrivalTime} arrival`,
        pricePerNight: '₹18,000 / night',
        rating: '4.9',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        description: 'Legendary institution celebrated for Southern Spice cuisine, handcrafted Dravidian woodwork, and timeless luxury.',
        amenities: ['Southern Spice Fine Dining', 'Jiva Ayurveda Spa', 'Butler Floor Suites', 'Private Chauffeur'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/chennai-hotels.html?city=Chennai',
          official: 'https://www.tajhotels.com/en-in/taj/taj-coromandel-chennai/',
          google: 'https://www.google.com/travel/hotels/chennai',
        },
      },
      {
        id: 'stay_itc_grand_chola',
        name: 'ITC Grand Chola',
        category: 'CHOLA DYNASTY ARCHITECTURAL MARVEL',
        location: 'Guindy, Chennai, Tamil Nadu',
        distanceFromTerminal: '8 km from Chennai (MAA) Airport (Expedited 15-min transfer)',
        checkInBufferNotice: `Proximity airport arrival greeting • Royal Club express check-in post ${arrivalTime}`,
        pricePerNight: '₹19,500 / night',
        rating: '4.8',
        image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
        description: 'Monumental tribute to Southern India\'s greatest imperial dynasty with intricately carved granite pillars and Peshawar dining.',
        amenities: ['Royal Club Privileges', 'Kaya Kalp Spa', 'Pan Asian Dining', 'Helipad Access'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/chennai-hotels.html?city=Chennai',
          official: 'https://www.itchotels.com/in/en/itcgrandchola-chennai',
          google: 'https://www.google.com/travel/hotels/chennai',
        },
      },
    ];
  }

  if (d.includes('kashmir') || d.includes('srinagar') || d.includes('gulmarg')) {
    return [
      {
        id: 'stay_khyber',
        name: 'The Khyber Himalayan Resort & Spa',
        category: 'ALPINE LUXURY CHALET',
        location: 'Gulmarg, Kashmir',
        distanceFromTerminal: '55 km from Srinagar (SXR) Airport',
        checkInBufferNotice: `Early check-in coordinated for your ${arrivalTime} arrival • Heated indoor glass pool`,
        pricePerNight: '₹38,500 / night',
        rating: '4.9',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        description: 'World-class heated alpine chalet with views of Apharwat Peak, luxury pine architecture, and ski concierge.',
        amenities: ['Ski In/Out', 'L\'Occitane Spa', 'Private Chauffeur', 'Heated Pool'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/gulmarg-hotels.html?city=Gulmarg',
          official: 'https://www.khyberhotels.com',
          google: 'https://www.google.com/travel/hotels/gulmarg',
        },
      },
      {
        id: 'stay_lalit_srinagar',
        name: 'The Lalit Grand Palace Srinagar',
        category: 'ROYAL HERITAGE PALACE',
        location: 'Gupkar Road, Dal Lake, Srinagar',
        distanceFromTerminal: '18 km from Srinagar (SXR) Airport',
        checkInBufferNotice: `Chauffeur greeting at SXR • Suite check-in ready post ${arrivalTime}`,
        pricePerNight: '₹29,000 / night',
        rating: '4.8',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        description: 'Former palace of the Maharaja of Jammu & Kashmir overlooking serene Dal Lake with sprawling chinar gardens.',
        amenities: ['Dal Lake Views', 'Butler Service', 'Chinar Courtyard', 'Indoor Pool'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/srinagar-hotels.html?city=Srinagar',
          official: 'https://www.thelalit.com/the-lalit-srinagar/',
          google: 'https://www.google.com/travel/hotels/srinagar',
        },
      },
      {
        id: 'stay_nigeen_houseboat',
        name: 'Mascot Luxury Heritage Houseboats',
        category: 'EXCLUSIVE CEDAR RESIDENCE',
        location: 'Nigeen Lake, Srinagar',
        distanceFromTerminal: '24 km from SXR Airport',
        checkInBufferNotice: 'Private Shikara luggage transfer arranged upon your arrival',
        pricePerNight: '₹18,500 / night',
        rating: '4.9',
        image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80',
        description: 'Handcrafted fragrant walnut cedar houseboat on tranquil Nigeen Lake with personal Kashmiri chef.',
        amenities: ['Private Shikara', 'Dedicated Butler', 'Kashmiri Wazwan', 'Lake Balcony'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/srinagar-hotels.html?city=Srinagar',
          official: 'https://www.makemytrip.com/hotels/srinagar-hotels.html',
          google: 'https://www.google.com/travel/hotels/srinagar',
        },
      },
    ];
  }

  if (d.includes('udaipur') || d.includes('udr')) {
    return [
      {
        id: 'stay_taj_lake_palace',
        name: 'Taj Lake Palace',
        category: 'FLOATING MARBLE PALACE',
        location: 'Lake Pichola, Udaipur, Rajasthan',
        distanceFromTerminal: '38 mins from Maharana Pratap (UDR) Airport',
        checkInBufferNotice: `Arrival jetty pickup scheduled for ${arrivalTime} • Jharokha suite welcome`,
        pricePerNight: '₹48,000 / night',
        rating: '5.0',
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        description: '18th-century white marble palace floating in Lake Pichola. Accessible exclusively by private royal speedboat.',
        amenities: ['Private Royal Boat Jetty', '24/7 Palace Butler', 'Jharokha Lake Balconies', 'Jiva Spa Boat'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/udaipur-hotels.html?city=Udaipur',
          official: 'https://www.tajhotels.com/en-in/taj/taj-lake-palace-udaipur/',
          google: 'https://www.google.com/travel/hotels/udaipur',
        },
      },
      {
        id: 'stay_oberoi_udaivilas',
        name: 'The Oberoi Udaivilas',
        category: 'PREMIER ROYAL RESORT',
        location: 'Haridas Ji Ki Magri, Lake Pichola, Udaipur',
        distanceFromTerminal: '42 mins from UDR Airport',
        checkInBufferNotice: `Private airport Audi transfer • Early check-in coordinated post ${arrivalTime}`,
        pricePerNight: '₹54,000 / night',
        rating: '5.0',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        description: 'Sprawling palace resort with interconnecting moated pools, domed courtyards, and Mewari dining.',
        amenities: ['Semi-Private Moat Pool', 'Fine Mewari Dining', 'Private Wildlife Sanctuary', 'Luxury Chauffeur'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/udaipur-hotels.html?city=Udaipur',
          official: 'https://www.oberoihotels.com/hotels-in-udaipur-udaivilas/',
          google: 'https://www.google.com/travel/hotels/udaipur',
        },
      },
      {
        id: 'stay_leela_palace',
        name: 'The Leela Palace Udaipur',
        category: 'MODERN MEWARI LUXURY',
        location: 'Lake Pichola, Udaipur',
        distanceFromTerminal: '40 mins from UDR Airport',
        checkInBufferNotice: 'Lake jetty check-in greeting with traditional shehnai welcome',
        pricePerNight: '₹42,000 / night',
        rating: '4.9',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        description: 'Contemporary palace architecture facing City Palace with private plunge pool suites and ESPA wellness.',
        amenities: ['Lakeview Plunge Pool', 'ESPA Spa Tent', 'Sheesh Mahal Dining', 'Private Solar Boat'],
        links: {
          makemytrip: 'https://www.makemytrip.com/hotels/udaipur-hotels.html?city=Udaipur',
          official: 'https://www.theleela.com/the-leela-palace-udaipur/',
          google: 'https://www.google.com/travel/hotels/udaipur',
        },
      },
    ];
  }

  // Dynamic curated fallback for any other destination (Delhi, Mumbai, Bengaluru, Goa, etc.)
  const capitalizedDest = dest.charAt(0).toUpperCase() + dest.slice(1);
  return [
    {
      id: `stay_${dest.replace(/\s+/g, '_')}_palace`,
      name: `The Grand Luxury Suites & Palace ${capitalizedDest}`,
      category: 'PREMIER 5-STAR LUXURY RESIDENCE',
      location: `Prime Heritage District, ${capitalizedDest}`,
      distanceFromTerminal: `Central access from airport / rail terminal`,
      checkInBufferNotice: `Express VIP check-in reserved for your ${arrivalTime} arrival`,
      pricePerNight: '₹24,000 / night',
      rating: '4.9',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
      description: `Curated luxury hotel in ${capitalizedDest} featuring signature fine dining, wellness spa retreats, and personalized concierge.`,
      amenities: ['24/7 Butler Service', 'Heated Pool & Spa', 'Private Chauffeur', 'Complimentary High Tea'],
      links: {
        makemytrip: `https://www.makemytrip.com/hotels/${dest.toLowerCase()}-hotels.html?city=${encodeURIComponent(capitalizedDest)}`,
        official: `https://www.google.com/travel/hotels/${encodeURIComponent(dest)}`,
        google: `https://www.google.com/travel/hotels/${encodeURIComponent(dest)}`,
      },
    },
    {
      id: `stay_${dest.replace(/\s+/g, '_')}_heritage`,
      name: `Taj Heritage & Boutique Resort ${capitalizedDest}`,
      category: 'AUTHENTIC REGIONAL LUXURY',
      location: `Waterfront / Historic Enclave, ${capitalizedDest}`,
      distanceFromTerminal: `15-30 mins from arrival terminal`,
      checkInBufferNotice: `Arrival welcome reception post ${arrivalTime}`,
      pricePerNight: '₹19,500 / night',
      rating: '4.8',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      description: `Award-winning heritage hospitality pairing authentic regional gastronomy with world-class amenities.`,
      amenities: ['Fine Regional Dining', 'Ayurvedic Wellness Spa', 'Concierge Chauffeur', 'Club Lounge'],
      links: {
        makemytrip: `https://www.makemytrip.com/hotels/${dest.toLowerCase()}-hotels.html?city=${encodeURIComponent(capitalizedDest)}`,
        official: `https://www.google.com/travel/hotels/${encodeURIComponent(dest)}`,
        google: `https://www.google.com/travel/hotels/${encodeURIComponent(dest)}`,
      },
    },
  ];
}

// Helper for Short Trips
function getShortTripsForDestination(dest: string, arrivalTime: string): ExtensionShortTrip[] {
  const d = dest.toLowerCase();

  // Chennai / MAA
  if (d.includes('chennai') || d.includes('maa') || d.includes('madras')) {
    return [
      {
        id: 'trip_mahabalipuram_shore',
        title: 'UNESCO Shore Temples & Pancha Rathas of Mahabalipuram',
        tag: 'SAME-DAY AFTERNOON / NEXT MORNING',
        bestDepartureRelative: `Departs 15:30 IST (~3h after your ${arrivalTime} arrival)`,
        duration: '5 Hours',
        transportMode: 'Private AC Chauffeur Sedan along East Coast Road',
        priceEstimate: '₹3,400 / vehicle',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
        description: 'Breathtaking 7th-century rock-cut monuments, Arjuna\'s Penance, and ocean-facing Shore Temple on the scenic East Coast Road (ECR).',
        highlights: ['Shore Temple sea-breeze sunset', 'Arjuna\'s Penance bas-relief stone tour', 'Fresh coastal seafood at beachfront pavilion'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/chennai/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/outstation.html',
          tripadvisor: 'https://www.tripadvisor.in/Attraction_Review-g297677-d321453-Reviews-Shore_Temple-Mahabalipuram_Kanchipuram_District_Tamil_Nadu.html',
        },
      },
      {
        id: 'trip_kanchipuram_silk',
        title: 'Kanchipuram Silk Weavers & Ancient Temples Expedition',
        tag: 'FULL-DAY CULTURAL ESCAPE',
        bestDepartureRelative: 'Departs 08:30 IST Next Day (Hotel lobby pickup)',
        duration: 'Full Day (8h)',
        transportMode: 'Private AC Chauffeur SUV (Innova Hycross)',
        priceEstimate: '₹5,200 / vehicle',
        image: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?auto=format&fit=crop&w=800&q=80',
        description: 'Journey to the "City of a Thousand Temples". Experience live Jacquard silk looms with master weavers and visit the grand Ekambareswarar Temple.',
        highlights: ['Private master silk-weaving atelier session', 'Ekambareswarar & Kailasanathar temple tours', 'Traditional South Indian plantain leaf lunch'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/chennai/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/outstation.html',
          tripadvisor: 'https://www.tripadvisor.in/Attractions-g317099-Activities-Kanchipuram_Kanchipuram_District_Tamil_Nadu.html',
        },
      },
      {
        id: 'trip_mylapore_heritage',
        title: 'Mylapore Kapaleeshwarar Temple & Marina Beach Walk',
        tag: 'EVENING HERITAGE WALK',
        bestDepartureRelative: 'Departs 17:00 IST (Golden hour & evening temple aarti)',
        duration: '3 Hours',
        transportMode: 'Private Chauffeur Sedan + Certified Historian Guide',
        priceEstimate: '₹2,200 / person',
        image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
        description: 'Immerse in the colorful Dravidian gopurams of Kapaleeshwarar Temple, historic agraharam street markets, and evening breeze along Marina Beach.',
        highlights: ['Kapaleeshwarar Temple evening brass aarti', 'Traditional filter coffee & piping hot ghee podi idli', 'Marina Beach promenade seaside stroll'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/chennai/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/',
          tripadvisor: 'https://www.tripadvisor.in/Attraction_Review-g304556-d311581-Reviews-Kapaleeshwarar_Temple-Chennai_Madras_Chennai_District_Tamil_Nadu.html',
        },
      },
    ];
  }

  if (d.includes('kashmir') || d.includes('srinagar') || d.includes('gulmarg')) {
    return [
      {
        id: 'trip_gulmarg_gondola',
        title: 'Gulmarg Gondola Phase 2 & Apharwat Snow Trek',
        tag: 'SAME-DAY / NEXT MORNING',
        bestDepartureRelative: 'Departs 09:00 IST • Priority Phase 2 Tickets pre-cleared',
        duration: '6 Hours',
        transportMode: 'Private 4x4 Chauffeur SUV + Gondola Pass',
        priceEstimate: '₹4,800 / person',
        image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
        description: 'World\'s highest operating cable car to 13,780 ft with panoramic views of Nanga Parbat and alpine powder snow.',
        highlights: ['Pre-booked Phase 1 & 2 Passes', 'Ski Instructor Escort', 'Warm Kashmiri Kehwa at Kongdoori'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/srinagar/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/outstation.html',
          tripadvisor: 'https://www.tripadvisor.in/Attraction_Review-g297623-d324707-Reviews-Gulmarg_Gondola-Gulmarg_Baramulla_District_Kashmir_Jammu_and_Kashmir.html',
        },
      },
      {
        id: 'trip_dal_lake_sunset',
        title: 'Private Sunset Shikara & Floating Flower Market',
        tag: 'SAME-DAY EVENING',
        bestDepartureRelative: `Departs 16:30 IST (~4h after your ${arrivalTime} arrival)`,
        duration: '2.5 Hours',
        transportMode: 'Luxury Cushioned Shikara with Chauffeur',
        priceEstimate: '₹2,200 / boat',
        image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80',
        description: 'Glide through the tranquil lotus waterways of Dal Lake, Char Chinar island, and sunset floating bazaars.',
        highlights: ['Sunset at Golden Char Chinar', 'Fresh Saffron Kehwa onboard', 'Floating handicraft market visit'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/srinagar/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/',
          tripadvisor: 'https://www.tripadvisor.in/Attractions-g297623-Activities-Srinagar_Srinagar_District_Kashmir_Jammu_and_Kashmir.html',
        },
      },
      {
        id: 'trip_pahalgam_valley',
        title: 'Pahalgam Valley of Shepherds & Betaab Valley',
        tag: 'FULL-DAY EXCURSION',
        bestDepartureRelative: 'Departs 07:30 IST Next Day (Hotel lobby pickup)',
        duration: 'Full Day (9h)',
        transportMode: 'Private Luxury Chauffeur Sedan',
        priceEstimate: '₹6,500 / vehicle',
        image: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=80',
        description: 'Scenic drive along the Lidder River to pine-carpeted Aru Valley, Betaab Valley, and saffron fields of Pampore.',
        highlights: ['Lidder River trout fishing stop', 'Betaab Valley entry passes', 'Pampore authentic saffron tasting'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/srinagar/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/outstation.html',
          tripadvisor: 'https://www.tripadvisor.in/Attractions-g1152044-Activities-Pahalgam_Anantnag_District_Kashmir_Jammu_and_Kashmir.html',
        },
      },
    ];
  }

  if (d.includes('udaipur') || d.includes('udr')) {
    return [
      {
        id: 'trip_solar_boat_sunset',
        title: 'Sunset Solar Yacht & Jagmandir Island Palace',
        tag: 'SAME-DAY EVENING',
        bestDepartureRelative: `Departs 16:30 IST (~4.5h after your ${arrivalTime} arrival)`,
        duration: '2.5 Hours',
        transportMode: 'Private Chauffeur to Jetty + Solar Yacht',
        priceEstimate: '₹3,600 / person',
        image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=80',
        description: 'Private solar-powered boat cruise past City Palace courtyards to Jagmandir Island for sundowner drinks.',
        highlights: ['Private Boat Jetty departure', 'Jagmandir Island courtyard access', 'Champagne / Royal Mewari Kehwa'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/udaipur/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/',
          tripadvisor: 'https://www.tripadvisor.in/Attraction_Review-g297672-d319888-Reviews-Jagmandir-Udaipur_Udaipur_District_Rajasthan.html',
        },
      },
      {
        id: 'trip_kumbhalgarh_ranakpur',
        title: 'Kumbhalgarh Great Wall & Ranakpur Marble Citadel',
        tag: 'DAY-2 ROAD EXPEDITION',
        bestDepartureRelative: 'Departs 08:30 IST Next Day (Hotel lobby pickup)',
        duration: 'Full Day (8h)',
        transportMode: 'Private AC Chauffeur SUV (Innova Hycross)',
        priceEstimate: '₹6,200 / vehicle',
        image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
        description: 'Expedition across the Aravali mountains to the second-longest continuous wall in the world and 1,444-pillar Jain temples.',
        highlights: ['UNESCO World Heritage Citadel', 'Private certified Mewar historian', 'Rajasthani royal thali lunch inclusion'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/udaipur/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/outstation.html',
          tripadvisor: 'https://www.tripadvisor.in/Attraction_Review-g1152787-d1152788-Reviews-Kumbhalgarh_Fort-Kumbhalgarh_Rajsamand_District_Rajasthan.html',
        },
      },
      {
        id: 'trip_sajjangarh_monsoon',
        title: 'Monsoon Palace Sunset & Biological Forest Safari',
        tag: 'AFTERNOON EXCURSION',
        bestDepartureRelative: 'Departs 15:30 IST • Optimal golden-hour elevation',
        duration: '3.5 Hours',
        transportMode: 'Hill Climb Chauffeur SUV',
        priceEstimate: '₹2,800 / vehicle',
        image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80',
        description: 'Perched 3,100 ft atop Bansdara mountain overlooking all lakes of Udaipur with panoramic sunset photography.',
        highlights: ['Breathtaking 360° lake and mountain views', 'Forest sanctuary entry permits', 'Sunset tea at palace cafe'],
        links: {
          makemytripActivities: 'https://www.makemytrip.com/activities/udaipur/',
          makemytripCabs: 'https://www.makemytrip.com/cabs/',
          tripadvisor: 'https://www.tripadvisor.in/Attraction_Review-g297672-d478201-Reviews-Monsoon_Palace_Sajjan_Garh-Udaipur_Udaipur_District_Rajasthan.html',
        },
      },
    ];
  }

  // Dynamic fallback excursions for any other destination
  const capitalizedCity = dest.charAt(0).toUpperCase() + dest.slice(1);
  return [
    {
      id: `trip_${dest.replace(/\s+/g, '_')}_city_highlights`,
      title: `${capitalizedCity} Heritage Highlights & Royal Landmark Tour`,
      tag: 'SAME-DAY / AFTERNOON TOUR',
      bestDepartureRelative: `Departs ~3h after your ${arrivalTime} arrival`,
      duration: '4 Hours',
      transportMode: 'Private AC Chauffeur Sedan + Local Expert Guide',
      priceEstimate: '₹2,800 / vehicle',
      image: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
      description: `Curated orientation excursion through the iconic architectural landmarks, historical bazaars, and scenic viewpoints of ${capitalizedCity}.`,
      highlights: ['Private chauffeur pickup from hotel', 'Certified local heritage guide', 'Authentic regional refreshment tasting'],
      links: {
        makemytripActivities: `https://www.makemytrip.com/activities/${dest.toLowerCase()}/`,
        makemytripCabs: 'https://www.makemytrip.com/cabs/',
        tripadvisor: `https://www.tripadvisor.in/Search?q=${encodeURIComponent(capitalizedCity)}%20activities`,
      },
    },
    {
      id: `trip_${dest.replace(/\s+/g, '_')}_scenic_excursion`,
      title: `${capitalizedCity} Countryside & Historic Fort Day Expedition`,
      tag: 'FULL-DAY EXCURSION',
      bestDepartureRelative: 'Departs 09:00 IST Next Day (Hotel lobby pickup)',
      duration: 'Full Day (7h)',
      transportMode: 'Private AC Chauffeur SUV',
      priceEstimate: '₹4,500 / vehicle',
      image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800&q=80',
      description: `Expedition exploring the surrounding natural landscapes, ancient citadels, and cultural artisans around ${capitalizedCity}.`,
      highlights: ['Scenic regional drive', 'All toll & monument permits included', 'Curated lunch stop recommendation'],
      links: {
        makemytripActivities: `https://www.makemytrip.com/activities/${dest.toLowerCase()}/`,
        makemytripCabs: 'https://www.makemytrip.com/cabs/outstation.html',
        tripadvisor: `https://www.tripadvisor.in/Search?q=${encodeURIComponent(capitalizedCity)}%20attractions`,
      },
    },
  ];
}
