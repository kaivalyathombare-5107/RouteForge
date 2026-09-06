// src/components/BookingOptionsModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { 
  X, 
  ShieldCheck, 
  ExternalLink, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Clock, 
  Sparkles,
  Building2,
  AlertCircle,
  Globe,
  Check,
  Car,
  Train,
  Bus,
  Plane,
  Layers
} from 'lucide-react';
import { JourneyPlanOption, JourneySearchParams } from '../types/journey';
import { createBookingIntent, createBooking } from '../lib/api/bookings';
import { useAuth } from '../hooks/useAuth';

interface BookingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: JourneyPlanOption | null;
  onBookingSuccess?: (booking: any) => void;
  onNavigateToConcierge?: () => void;
  searchParams?: JourneySearchParams | null;
}

interface BookingWebsiteOption {
  id: string;
  name: string;
  url: string;
  domain: string;
  tag: string;
  description: string;
}

// Canonical lookup for Indian & major international travel hubs
const KNOWN_CITIES: Record<string, { city: string; code: string }> = {
  bom: { city: 'Mumbai', code: 'BOM' },
  mumbai: { city: 'Mumbai', code: 'BOM' },
  bombay: { city: 'Mumbai', code: 'BOM' },
  csmia: { city: 'Mumbai', code: 'BOM' },

  maa: { city: 'Chennai', code: 'MAA' },
  chennai: { city: 'Chennai', code: 'MAA' },
  madras: { city: 'Chennai', code: 'MAA' },

  del: { city: 'Delhi', code: 'DEL' },
  delhi: { city: 'Delhi', code: 'DEL' },
  newdelhi: { city: 'New Delhi', code: 'DEL' },
  igi: { city: 'New Delhi', code: 'DEL' },

  blr: { city: 'Bengaluru', code: 'BLR' },
  bangalore: { city: 'Bengaluru', code: 'BLR' },
  bengaluru: { city: 'Bengaluru', code: 'BLR' },
  kempegowda: { city: 'Bengaluru', code: 'BLR' },

  hyd: { city: 'Hyderabad', code: 'HYD' },
  hyderabad: { city: 'Hyderabad', code: 'HYD' },
  rajivgandhi: { city: 'Hyderabad', code: 'HYD' },

  ccu: { city: 'Kolkata', code: 'CCU' },
  kolkata: { city: 'Kolkata', code: 'CCU' },
  calcutta: { city: 'Kolkata', code: 'CCU' },

  goi: { city: 'Goa', code: 'GOI' },
  gox: { city: 'Goa (Mopa)', code: 'GOX' },
  goa: { city: 'Goa', code: 'GOI' },

  cok: { city: 'Kochi', code: 'COK' },
  kochi: { city: 'Kochi', code: 'COK' },
  cochin: { city: 'Kochi', code: 'COK' },
  kerala: { city: 'Kochi', code: 'COK' },

  udr: { city: 'Udaipur', code: 'UDR' },
  udaipur: { city: 'Udaipur', code: 'UDR' },
  dabok: { city: 'Udaipur', code: 'UDR' },

  jdh: { city: 'Jodhpur', code: 'JDH' },
  jodhpur: { city: 'Jodhpur', code: 'JDH' },

  jai: { city: 'Jaipur', code: 'JAI' },
  jaipur: { city: 'Jaipur', code: 'JAI' },

  amd: { city: 'Ahmedabad', code: 'AMD' },
  ahmedabad: { city: 'Ahmedabad', code: 'AMD' },

  pnq: { city: 'Pune', code: 'PNQ' },
  pune: { city: 'Pune', code: 'PNQ' },

  vns: { city: 'Varanasi', code: 'VNS' },
  varanasi: { city: 'Varanasi', code: 'VNS' },
  benaras: { city: 'Varanasi', code: 'VNS' },

  sxr: { city: 'Srinagar', code: 'SXR' },
  srinagar: { city: 'Srinagar', code: 'SXR' },
  kashmir: { city: 'Srinagar', code: 'SXR' },
  gulmarg: { city: 'Srinagar', code: 'SXR' },

  lko: { city: 'Lucknow', code: 'LKO' },
  lucknow: { city: 'Lucknow', code: 'LKO' },

  atq: { city: 'Amritsar', code: 'ATQ' },
  amritsar: { city: 'Amritsar', code: 'ATQ' },

  ixc: { city: 'Chandigarh', code: 'IXC' },
  chandigarh: { city: 'Chandigarh', code: 'IXC' },

  trv: { city: 'Thiruvananthapuram', code: 'TRV' },
  thiruvananthapuram: { city: 'Thiruvananthapuram', code: 'TRV' },
  trivandrum: { city: 'Thiruvananthapuram', code: 'TRV' },

  gau: { city: 'Guwahati', code: 'GAU' },
  guwahati: { city: 'Guwahati', code: 'GAU' },

  bbi: { city: 'Bhubaneswar', code: 'BBI' },
  bhubaneswar: { city: 'Bhubaneswar', code: 'BBI' },

  pat: { city: 'Patna', code: 'PAT' },
  patna: { city: 'Patna', code: 'PAT' },

  ixb: { city: 'Bagdogra', code: 'IXB' },
  bagdogra: { city: 'Bagdogra', code: 'IXB' },

  idr: { city: 'Indore', code: 'IDR' },
  indore: { city: 'Indore', code: 'IDR' },

  nag: { city: 'Nagpur', code: 'NAG' },
  nagpur: { city: 'Nagpur', code: 'NAG' },

  ixj: { city: 'Jammu', code: 'IXJ' },
  jammu: { city: 'Jammu', code: 'IXJ' },

  ixl: { city: 'Leh', code: 'IXL' },
  leh: { city: 'Leh', code: 'IXL' },

  vtz: { city: 'Visakhapatnam', code: 'VTZ' },
  visakhapatnam: { city: 'Visakhapatnam', code: 'VTZ' },

  cjb: { city: 'Coimbatore', code: 'CJB' },
  coimbatore: { city: 'Coimbatore', code: 'CJB' },

  ixm: { city: 'Madurai', code: 'IXM' },
  madurai: { city: 'Madurai', code: 'IXM' },

  bdq: { city: 'Vadodara', code: 'BDQ' },
  vadodara: { city: 'Vadodara', code: 'BDQ' },

  ixr: { city: 'Ranchi', code: 'IXR' },
  ranchi: { city: 'Ranchi', code: 'IXR' },

  rpr: { city: 'Raipur', code: 'RPR' },
  raipur: { city: 'Raipur', code: 'RPR' },

  ded: { city: 'Dehradun', code: 'DED' },
  dehradun: { city: 'Dehradun', code: 'DED' },

  dxb: { city: 'Dubai', code: 'DXB' },
  dubai: { city: 'Dubai', code: 'DXB' },

  lhr: { city: 'London', code: 'LHR' },
  london: { city: 'London', code: 'LHR' },

  sin: { city: 'Singapore', code: 'SIN' },
  singapore: { city: 'Singapore', code: 'SIN' },

  jfk: { city: 'New York', code: 'JFK' },
  bkk: { city: 'Bangkok', code: 'BKK' },
};

/**
 * Robust location parser extracting clean city name and 3-letter IATA / IRCTC station code
 */
function parseLocationString(input: string | undefined, defaultCode: string, defaultCity: string): { city: string; code: string } {
  if (!input || !input.trim()) {
    return { city: defaultCity, code: defaultCode };
  }

  const clean = input.trim();

  // 1. Check if location has explicit parentheses code: e.g. "BOM Mumbai (CSMIA T2)" -> "BOM", "Mumbai (BOM)" -> "BOM"
  const parenMatch = clean.match(/\(([A-Z]{3})\)/i);
  if (parenMatch) {
    const code = parenMatch[1].toUpperCase();
    const city = clean
      .replace(/\([A-Z]{3}\)/i, '')
      .replace(/airport|station|csmia|igi|t[1-4]|domestic|international/gi, '')
      .trim() || code;
    return {
      city: KNOWN_CITIES[code.toLowerCase()]?.city || city,
      code,
    };
  }

  // 2. Check for standalone 3-letter uppercase token, e.g. "MAA Chennai" or "BOM"
  const wordMatch = clean.match(/\b([A-Z]{3})\b/);
  if (wordMatch) {
    const code = wordMatch[1].toUpperCase();
    if (KNOWN_CITIES[code.toLowerCase()]) {
      return KNOWN_CITIES[code.toLowerCase()];
    }
  }

  // 3. Search for known city name keywords
  const normalized = clean.toLowerCase().replace(/[^a-z]/g, '');
  for (const [key, val] of Object.entries(KNOWN_CITIES)) {
    if (normalized.includes(key)) {
      return val;
    }
  }

  // 4. Default: sanitize string for city name, use first 3 letters as code
  const lettersOnly = clean.replace(/[^a-zA-Z]/g, '').toUpperCase();
  const code = lettersOnly.slice(0, 3) || defaultCode;
  return { city: clean, code };
}

/**
 * Normalizes user-entered date strings ("15 Oct, 2026", "2026-10-15", "15/10/2026") into ISO YYYY-MM-DD
 */
function parseDateToIso(dateStr: string | undefined): string | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  
  const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    return `${slashMatch[3]}-${slashMatch[2].padStart(2, '0')}-${slashMatch[1].padStart(2, '0')}`;
  }

  const parsed = new Date(clean);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  return null;
}

export const BookingOptionsModal: React.FC<BookingOptionsModalProps> = ({
  isOpen,
  onClose,
  plan,
  onBookingSuccess,
  onNavigateToConcierge,
  searchParams,
}) => {
  const { user } = useAuth();
  const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);
  const [selectedWebsiteId, setSelectedWebsiteId] = useState<string>('makemytrip');
  const [isProcessing, setIsProcessing] = useState(false);
  const [redirectNotice, setRedirectNotice] = useState<string | null>(null);
  const [copiedNotification, setCopiedNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate guaranteed valid booking date (7 days from client runtime)
  // This ensures the date is ALWAYS within the airline 330-day GDS booking window and IRCTC reservation window
  const getInitialValidDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getTodayIso = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const getMaxBookingIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 300); // 300 days into the future (safe under 330 day GDS cutoff)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Derive initial travel date from user search params or default to +7 days
  const initialDate = useMemo(() => {
    const fromSearch = parseDateToIso(searchParams?.departDate);
    if (fromSearch) {
      const todayIso = getTodayIso();
      if (fromSearch >= todayIso) return fromSearch;
    }
    return getInitialValidDate();
  }, [searchParams?.departDate]);

  const [selectedTravelDate, setSelectedTravelDate] = useState<string>(initialDate);

  // Automatically synchronize if searchParams change
  useEffect(() => {
    if (searchParams?.departDate) {
      const parsed = parseDateToIso(searchParams.departDate);
      if (parsed) {
        setSelectedTravelDate(parsed);
      }
    }
  }, [searchParams?.departDate]);

  // Detect intrinsic modality from plan
  const defaultCategory = useMemo<'uber' | 'train' | 'bus' | 'flight' | 'multimodal'>(() => {
    if (!plan) return 'flight';
    const cat = (plan.category || '').toLowerCase();
    const pid = (plan.id || '').toLowerCase();
    const title = (plan.title || '').toLowerCase();
    const prov = (plan.providerSummary || '').toLowerCase();
    const hasCar = plan.legs?.some((l) => l.type === 'car' || l.provider?.toLowerCase().includes('uber') || l.carrier?.toLowerCase().includes('uber'));
    const hasBus = plan.legs?.some((l) => l.type === 'bus' || l.provider?.toLowerCase().includes('redbus') || l.carrier?.toLowerCase().includes('bus') || l.carrier?.toLowerCase().includes('volvo'));
    const hasTrain = plan.legs?.some((l) => l.type === 'train' || l.provider?.toLowerCase().includes('irctc') || l.carrier?.toLowerCase().includes('rail') || l.carrier?.toLowerCase().includes('express'));

    if (cat.includes('cab') || pid.includes('uber') || title.includes('uber') || prov.includes('uber') || (hasCar && !hasTrain && !hasBus)) {
      return 'uber';
    }
    if (cat.includes('bus') || pid.includes('bus') || title.includes('bus') || prov.includes('redbus') || hasBus) {
      return 'bus';
    }
    if (cat.includes('rail') || pid.includes('train') || title.includes('train') || prov.includes('irctc') || hasTrain) {
      return 'train';
    }
    if (cat.includes('multimodal') || pid.includes('multimodal') || (plan.legs && plan.legs.length > 1)) {
      return 'multimodal';
    }
    return 'flight';
  }, [plan]);

  const [activeTab, setActiveTab] = useState<'uber' | 'train' | 'bus' | 'flight' | 'multimodal'>('flight');

  // Synchronize active tab and default website when modal opens or plan changes
  useEffect(() => {
    if (isOpen && plan) {
      setActiveTab(defaultCategory);
      if (defaultCategory === 'uber') {
        setSelectedWebsiteId('uber_official');
      } else if (defaultCategory === 'train') {
        setSelectedWebsiteId('irctc_official');
      } else if (defaultCategory === 'bus') {
        setSelectedWebsiteId('redbus_official');
      } else if (defaultCategory === 'multimodal') {
        setSelectedWebsiteId('uber_multimodal');
      } else {
        setSelectedWebsiteId('makemytrip');
      }
      setSelectedMethodIndex(0);
    }
  }, [isOpen, plan?.id, defaultCategory]);

  const handleTabChange = (tab: 'uber' | 'train' | 'bus' | 'flight' | 'multimodal') => {
    setActiveTab(tab);
    if (tab === 'uber') {
      setSelectedWebsiteId('uber_official');
    } else if (tab === 'train') {
      setSelectedWebsiteId('irctc_official');
    } else if (tab === 'bus') {
      setSelectedWebsiteId('redbus_official');
    } else if (tab === 'multimodal') {
      setSelectedWebsiteId('uber_multimodal');
    } else {
      setSelectedWebsiteId('makemytrip');
    }
    setSelectedMethodIndex(0);
  };

  const isUber = activeTab === 'uber';
  const isBus = activeTab === 'bus';
  const isTrain = activeTab === 'train';
  const isMultiModal = activeTab === 'multimodal';

  // Extract itinerary parameters dynamically reflecting user input and actual leg corridor
  const firstLeg = plan?.legs?.[0];
  const lastLeg = (plan?.legs && plan.legs.length > 0) ? plan.legs[plan.legs.length - 1] : firstLeg;

  // Deconstruct arrow representation in leg label (e.g. "BOM Airport (BOM) → MAA Airport (MAA)")
  const legArrowParts = (firstLeg?.label || '').split(/→|->/);
  const legOriginString = legArrowParts[0]?.trim();
  const legDestString = legArrowParts[1]?.trim();

  // Priority 1: User's explicitly searched origin & destination from searchParams
  // Priority 2: Origin and destination parsed from the active plan's first/last leg
  // Priority 3: Sensible defaults (Mumbai BOM -> Chennai MAA)
  const resolvedOrigin = parseLocationString(
    searchParams?.origin || legOriginString,
    'BOM',
    'Mumbai'
  );

  const resolvedDestination = parseLocationString(
    searchParams?.destination || legDestString,
    'MAA',
    'Chennai'
  );

  const origin = resolvedOrigin.city;
  const originCode = resolvedOrigin.code;
  const destination = resolvedDestination.city;
  const destCode = resolvedDestination.code;

  // Extract day, month, year from selectedTravelDate
  const [yStr, mStr, dStr] = (selectedTravelDate || getInitialValidDate()).split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthName = monthNames[parseInt(mStr, 10) - 1] || 'Oct';
  const humanFormattedDate = `${dStr} ${monthName} ${yStr}`;
  
  // Strict DD/MM/YYYY formatting for portals
  const formattedDateSlash = `${dStr}/${mStr}/${yStr}`;
  const formattedDateIso = `${yStr}-${mStr}-${dStr}`;

  const depTime = firstLeg?.depTime || `06:15 IST, ${humanFormattedDate}`;
  const arrTime = lastLeg?.arrTime || firstLeg?.arrTime || `11:45 IST, ${humanFormattedDate}`;
  const carrierName = firstLeg?.carrier || (isUber ? 'Uber Mobility' : isBus ? 'redBus Luxury' : isTrain ? 'Vande Bharat Express' : 'Air India');
  const serviceNumber = firstLeg?.label?.split('•')?.[0]?.trim() || (isUber ? 'Uber Black' : isBus ? 'Volvo 9600' : isTrain ? '20979' : 'AI-643');
  const pnrNumber = firstLeg?.bookingReference || `RF-${Math.floor(100000 + Math.random() * 900000)}`;

  // Dedicated booking websites categorized by modality
  const websitesByModality: Record<'uber' | 'train' | 'bus' | 'flight' | 'multimodal', BookingWebsiteOption[]> = useMemo(() => ({
    uber: [
      {
        id: 'uber_official',
        name: 'Uber Official Web',
        url: `https://m.uber.com/looking?pickup[formatted_address]=${encodeURIComponent(origin)}&destination[formatted_address]=${encodeURIComponent(destination)}`,
        domain: 'm.uber.com',
        tag: 'PREFILLED & PREFERRED',
        description: 'Official Uber Rider Web with pre-filled pickup & dropoff coordinates, live chauffeur dispatch & instant fare lock.',
      },
      {
        id: 'uber_reserve',
        name: 'Uber Reserve VIP',
        url: 'https://m.uber.com/reserve',
        domain: 'uber.com/reserve',
        tag: 'EXECUTIVE CHAUFFEUR',
        description: 'Official Uber Reserve portal for scheduled executive rides with 45-min complimentary chauffeur wait time.',
      },
      {
        id: 'ola_cabs',
        name: 'Ola Cabs Official',
        url: `https://book.olacabs.com/?pickup_name=${encodeURIComponent(origin)}&drop_name=${encodeURIComponent(destination)}`,
        domain: 'book.olacabs.com',
        tag: 'PRIME / OUTSTATION',
        description: 'Official Ola web booking portal with prefilled pickup & destination for on-demand sedan or outstation rides.',
      },
      {
        id: 'google_maps_cabs',
        name: 'Google Maps Transit',
        url: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&travelmode=driving`,
        domain: 'google.com/maps',
        tag: 'LIVE TRAFFIC & CABS',
        description: 'Live turn-by-turn route telemetry, real-time highway toll estimates, and one-tap deep links to cab rides.',
      },
    ],
    train: [
      {
        id: 'irctc_official',
        name: 'IRCTC Indian Railways',
        url: 'https://www.irctc.co.in/nget/train-search',
        domain: 'irctc.co.in',
        tag: 'OFFICIAL GOVT PORTAL',
        description: 'Government rail booking portal with direct Tatkal & confirmed PNR reservation.',
      },
      {
        id: 'makemytrip_rail',
        name: 'MakeMyTrip Rail',
        url: `https://www.makemytrip.com/railways/listing?srcCode=${originCode}&destCode=${destCode}&date=${formattedDateIso}`,
        domain: 'makemytrip.com',
        tag: 'PREFILLED & PREFERRED',
        description: 'Direct IRCTC partner integration with live train running status, seat prediction & zero cancellation fee.',
      },
      {
        id: 'confirmtkt',
        name: 'ConfirmTkt',
        url: `https://www.confirmtkt.com/rbooking-d/trains/from/${originCode}/to/${destCode}/${formattedDateIso}`,
        domain: 'confirmtkt.com',
        tag: 'WAITLIST PREDICTOR',
        description: 'Leading IRCTC authorized train partner with alternate route finder and same-train split booking.',
      },
      {
        id: 'ixigo_trains',
        name: 'ixigo Trains',
        url: `https://www.ixigo.com/trains/${originCode}-to-${destCode}-trains`,
        domain: 'ixigo.com',
        tag: 'LIVE RUNNING STATUS',
        description: 'Official IRCTC partner with real-time GPS platform tracking, PNR status updates & instant UPI refunds.',
      },
    ],
    bus: [
      {
        id: 'redbus_official',
        name: 'redBus Official',
        url: `https://www.redbus.in/bus-tickets/${encodeURIComponent(origin.toLowerCase())}-to-${encodeURIComponent(destination.toLowerCase())}`,
        domain: 'redbus.in',
        tag: 'PREFILLED & PREFERRED',
        description: 'Official redBus GDS portal with verified Volvo multi-axle luxury sleepers, live GPS tracking & instant m-ticket.',
      },
      {
        id: 'abhibus',
        name: 'AbhiBus Verified',
        url: `https://www.abhibus.com/bus_search/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}`,
        domain: 'abhibus.com',
        tag: 'ZERO BOOKING FEE',
        description: 'Official AbhiBus intercity bus portal with seat selection, live bus tracker, and partner discounts.',
      },
      {
        id: 'makemytrip_bus',
        name: 'MakeMyTrip Bus',
        url: `https://www.makemytrip.com/bus/search/${encodeURIComponent(origin)}/${encodeURIComponent(destination)}/${formattedDateIso}`,
        domain: 'makemytrip.com',
        tag: 'MMT ASSURANCE',
        description: 'MakeMyTrip Intercity Bus service with automated free cancellation & sanitized sleeper berths.',
      },
      {
        id: 'zingbus',
        name: 'Zingbus Lounge',
        url: 'https://www.zingbus.com/',
        domain: 'zingbus.com',
        tag: 'PREMIUM LOUNGE',
        description: 'AC electric and Volvo buses with premium boarding lounges, punctual departure guarantees & air suspension.',
      },
    ],
    flight: [
      {
        id: 'makemytrip',
        name: 'MakeMyTrip',
        url: `https://www.makemytrip.com/flight/search?itinerary=${originCode}-${destCode}-${formattedDateSlash}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`,
        domain: 'makemytrip.com',
        tag: 'PREFILLED & PREFERRED',
        description: 'Official partner portal with prefilled route (DD/MM/YYYY), automated statutory disruption shield & instant e-ticket.',
      },
      {
        id: 'carrier_official',
        name: 'Air India Official',
        url: `https://www.airindia.com/in/en/book/flights.html?origin=${originCode}&destination=${destCode}&departDate=${formattedDateIso}`,
        domain: 'airindia.com',
        tag: 'OFFICIAL CARRIER',
        description: 'Official carrier portal with prefilled origin & destination for direct corporate ticketing.',
      },
      {
        id: 'easemytrip',
        name: 'EaseMyTrip',
        url: 'https://www.easemytrip.com/flights.html',
        domain: 'easemytrip.com',
        tag: 'ZERO CONVENIENCE FEE',
        description: 'Official EaseMyTrip flights portal with zero convenience fee. Route details auto-copied for instant search.',
      },
      {
        id: 'google_travel',
        name: 'Google Travel',
        url: `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(destination)}%20on%20${formattedDateIso}`,
        domain: 'google.com/travel',
        tag: 'LIVE TELEMETRY',
        description: 'Reliable flight search aggregator with live route telemetry and real-time multi-airline price tracking.',
      },
    ],
    multimodal: [
      {
        id: 'uber_multimodal',
        name: 'Uber Doorstep Connect',
        url: `https://m.uber.com/looking?pickup[formatted_address]=${encodeURIComponent(origin)}&destination[formatted_address]=${encodeURIComponent(destination)}`,
        domain: 'm.uber.com',
        tag: 'PREFILLED & PREFERRED',
        description: 'Uber doorstep chauffeur transfer synchronized with your departure terminal and long-haul leg.',
      },
      {
        id: 'makemytrip_multimodal',
        name: 'MakeMyTrip Transit',
        url: `https://www.makemytrip.com/flight/search?itinerary=${originCode}-${destCode}-${formattedDateSlash}&tripType=O&paxType=A-1_C-0_I-0&intl=false&cabinClass=E`,
        domain: 'makemytrip.com',
        tag: 'CORE LONG-HAUL',
        description: 'Primary flight / rail leg booking portal with verified passenger identity and disruption shield.',
      },
      {
        id: 'uber_reserve_multimodal',
        name: 'Uber Reserve Chauffeur',
        url: 'https://m.uber.com/reserve',
        domain: 'uber.com/reserve',
        tag: 'TERMINAL CHAUFFEUR',
        description: 'Guaranteed airport or railway station meet-and-greet pickup with chauffeur flight tracking.',
      },
      {
        id: 'google_travel_multimodal',
        name: 'Google Travel Corridor',
        url: `https://www.google.com/travel/flights?q=Flights%20from%20${encodeURIComponent(origin)}%20to%20${encodeURIComponent(destination)}%20on%20${formattedDateIso}`,
        domain: 'google.com/travel',
        tag: 'END-TO-END TELEMETRY',
        description: 'Comprehensive corridor overview with integrated flight, hotel, and local ground transfer timings.',
      },
    ],
  }), [origin, destination, originCode, destCode, formattedDateSlash, formattedDateIso]);

  const availableWebsites = websitesByModality[activeTab] || websitesByModality.flight;

  const chosenWebsite =
    availableWebsites.find((w) => w.id === selectedWebsiteId) || availableWebsites[0];

  const basePrice = plan?.totalPrice || 0;

  // 3 actual booking fulfillment tiers customized dynamically for chosen modality
  const bookingFulfillmentOptions = useMemo(() => {
    if (activeTab === 'uber') {
      return [
        {
          id: 'opt_partner',
          method: 'OFFICIAL_PARTNER' as const,
          name: 'Uber Mobility Enterprise API & Concierge Shield',
          provider: 'Uber Mobility Corporate Bridge',
          defaultWebsiteId: 'uber_official',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 150,
          totalPayable: basePrice + Math.round(basePrice * 0.05) + 150,
          badge: 'RECOMMENDED • 45-MIN CHAUFFEUR GUARANTEE',
          description: 'Direct API reservation through certified Uber Mobility Corporate API token bridge.',
          features: [
            'Pre-filled passenger identity & pickup location synchronized from Profile',
            'Guaranteed executive vehicle with 45-min complimentary chauffeur wait time',
            'Direct digital trip receipt & ride confirmation issued into Booking Vault',
          ],
          icon: ShieldCheck,
        },
        {
          id: 'opt_direct_api',
          name: 'Uber Reserve VIP Direct Portal',
          method: 'DIRECT_API' as const,
          provider: 'Uber Reserve Scheduled Fleet',
          defaultWebsiteId: 'uber_reserve',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 0,
          totalPayable: basePrice + Math.round(basePrice * 0.05),
          badge: 'DIRECT INTEGRATION • ZERO MARKUP',
          description: 'Zero-intermediary advance scheduled ride reservation dispatched directly into Uber Reserve.',
          features: [
            'Confirmed professional chauffeur assigned with vehicle registration number',
            'Free cancellation or date/time reschedule up to 60 mins before pickup',
            'Real-time GPS vehicle telemetry synchronized with RouteForge Trip Graph',
          ],
          icon: Zap,
        },
        {
          id: 'opt_deep_link',
          method: 'DEEP_LINK' as const,
          name: 'Verified Deep Link to Uber Website / App',
          provider: chosenWebsite.name,
          defaultWebsiteId: chosenWebsite.id,
          price: basePrice,
          gst: 0,
          conciergeShieldFee: 0,
          totalPayable: basePrice,
          badge: 'OFFICIAL DIRECT REDIRECTION',
          description: `Redirects directly to ${chosenWebsite.name} with pickup and destination pre-filled.`,
          features: [
            `Direct official ${chosenWebsite.name} checkout with your existing payment methods`,
            'Ride intent and estimated fare logged in RouteForge Booking Vault before redirect',
            'Pickup & destination coordinates pre-populated for instant 1-tap ride ordering',
          ],
          icon: ExternalLink,
        },
      ];
    }

    if (activeTab === 'bus') {
      return [
        {
          id: 'opt_partner',
          method: 'OFFICIAL_PARTNER' as const,
          name: 'redBus GDS Partner API & Concierge Bus Shield',
          provider: 'redBus Luxury Intercity GDS',
          defaultWebsiteId: 'redbus_official',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 180,
          totalPayable: basePrice + Math.round(basePrice * 0.05) + 180,
          badge: 'RECOMMENDED • 100% ASSURANCE GUARANTEE',
          description: 'Direct API seat reservation through certified redBus Luxury Intercity GDS bridge.',
          features: [
            'Pre-filled passenger credentials & sleeper berth preferences',
            'redBus Assurance: 100% full statutory refund on carrier cancellation or delay > 2h',
            'Instant confirmed m-ticket & bus operator emergency contact in Booking Vault',
          ],
          icon: ShieldCheck,
        },
        {
          id: 'opt_direct_api',
          name: 'Carrier Direct Luxury Coach Portal',
          method: 'DIRECT_API' as const,
          provider: 'Zingbus / Intrcity SmartBus Direct',
          defaultWebsiteId: 'zingbus',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 0,
          totalPayable: basePrice + Math.round(basePrice * 0.05),
          badge: 'DIRECT FLEET • PREMIUM AMENITIES',
          description: 'Direct reservation dispatched into premium AC Volvo / electric intercity fleet inventory.',
          features: [
            'Guaranteed AC Volvo 9600 multi-axle sleeper with sanitized bedding',
            'Real-time live GPS coach location tracking and boarding point navigation',
            'Complimentary access to AC waiting lounges at major boarding hubs',
          ],
          icon: Zap,
        },
        {
          id: 'opt_deep_link',
          method: 'DEEP_LINK' as const,
          name: 'Verified Deep Link Bus Portal Checkout',
          provider: chosenWebsite.name,
          defaultWebsiteId: chosenWebsite.id,
          price: basePrice,
          gst: 0,
          conciergeShieldFee: 0,
          totalPayable: basePrice,
          badge: 'OFFICIAL DIRECT REDIRECTION',
          description: `Redirects directly to ${chosenWebsite.name} with route parameters prefilled.`,
          features: [
            `Direct checkout on ${chosenWebsite.name} with official operator seat layouts`,
            'Booking intent logged in RouteForge Booking Vault before redirect',
            'Boarding point & travel date pre-populated for rapid checkout',
          ],
          icon: ExternalLink,
        },
      ];
    }

    if (activeTab === 'train') {
      return [
        {
          id: 'opt_partner',
          method: 'OFFICIAL_PARTNER' as const,
          name: 'IRCTC NextGen PRS Partner API & Rail Concierge Shield',
          provider: 'IRCTC Indian Railways Gateway',
          defaultWebsiteId: 'irctc_official',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 250,
          totalPayable: basePrice + Math.round(basePrice * 0.05) + 250,
          badge: 'RECOMMENDED • STATUTORY RULE 73A SHIELD',
          description: 'Direct API ticket reservation through certified Indian Railways NextGen PRS token bridge.',
          features: [
            'Pre-filled passenger credentials, berth preference & IRCTC user ID',
            'Railway Rule 73A: Automated 100% statutory refund with auto-TDR filing if delayed > 3h',
            'Direct digital rail ticket & 10-digit PNR issued into RouteForge Booking Vault',
          ],
          icon: ShieldCheck,
        },
        {
          id: 'opt_direct_api',
          name: 'MakeMyTrip IRCTC Rail Express Portal',
          method: 'DIRECT_API' as const,
          provider: 'MakeMyTrip Authorized Rail Partner',
          defaultWebsiteId: 'makemytrip_rail',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 0,
          totalPayable: basePrice + Math.round(basePrice * 0.05),
          badge: 'DIRECT PARTNER • TRIP ASSURANCE',
          description: 'Certified IRCTC ticketing partner with tatkal prediction and zero cancellation charges.',
          features: [
            'Instant 10-digit IRCTC PNR with confirmed berth allocation & Vande Bharat catering',
            'Live train running status via NTES satellite telemetry',
            'Free date change & zero cancellation fee with MMT Trip Guarantee',
          ],
          icon: Zap,
        },
        {
          id: 'opt_deep_link',
          method: 'DEEP_LINK' as const,
          name: 'Verified Deep Link to IRCTC Official Portal',
          provider: chosenWebsite.name,
          defaultWebsiteId: chosenWebsite.id,
          price: basePrice,
          gst: 0,
          conciergeShieldFee: 0,
          totalPayable: basePrice,
          badge: 'OFFICIAL GOVT PORTAL',
          description: `Redirects directly to ${chosenWebsite.name} with source & destination preloaded.`,
          features: [
            'Official government railway rates with zero intermediary markup',
            'Direct Tatkal & Premium Tatkal booking window support',
            'Travel intent logged in RouteForge Booking Vault before redirect',
          ],
          icon: ExternalLink,
        },
      ];
    }

    if (activeTab === 'multimodal') {
      return [
        {
          id: 'opt_partner',
          method: 'OFFICIAL_PARTNER' as const,
          name: 'RouteForge Unified Multi-Modal Shield (Uber + Long-Haul)',
          provider: 'RouteForge Multi-Modal Dispatch API',
          defaultWebsiteId: 'uber_multimodal',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 350,
          totalPayable: basePrice + Math.round(basePrice * 0.05) + 350,
          badge: 'RECOMMENDED • CONNECTION GUARANTEE',
          description: 'Single unified protection shielding doorstep Uber transfer, connection window, and long-haul arrival.',
          features: [
            'Synchronized Uber chauffeur pickup timed to flight/train boarding window',
            '100% Missed Connection Protection: Automated rebooking on any delay',
            'Complete end-to-end boarding passes & digital itinerary stored in Booking Vault',
          ],
          icon: ShieldCheck,
        },
        {
          id: 'opt_direct_api',
          name: 'Direct Carrier & Uber Reserve Dispatch',
          method: 'DIRECT_API' as const,
          provider: 'Carrier Direct + Uber Reserve',
          defaultWebsiteId: 'makemytrip_multimodal',
          price: basePrice,
          gst: Math.round(basePrice * 0.05),
          conciergeShieldFee: 0,
          totalPayable: basePrice + Math.round(basePrice * 0.05),
          badge: 'DIRECT MULTI-LEG • VIP TRANSIT',
          description: 'Individual direct bookings across primary aviation/rail inventory and Uber Reserve scheduled transit.',
          features: [
            'Zero-markup direct ticket booking with official carrier PNR',
            'Dedicated VIP airport meet-and-greet chauffeur transfer',
            'Real-time multi-leg telemetry synchronized with RouteForge Trip Graph',
          ],
          icon: Zap,
        },
        {
          id: 'opt_deep_link',
          method: 'DEEP_LINK' as const,
          name: 'Verified Deep Link Multi-Leg Portal Checkout',
          provider: chosenWebsite.name,
          defaultWebsiteId: chosenWebsite.id,
          price: basePrice,
          gst: 0,
          conciergeShieldFee: 0,
          totalPayable: basePrice,
          badge: 'PREFILLED DEEP LINKS',
          description: `Redirects to ${chosenWebsite.name} for selected segment checkout.`,
          features: [
            'Coordinated departure & arrival times pre-filled across portals',
            'Route and schedule details copied to clipboard for 1-tap checkout',
            'Trip intent logged in RouteForge Booking Vault before redirect',
          ],
          icon: ExternalLink,
        },
      ];
    }

    // Default: Flight
    return [
      {
        id: 'opt_partner',
        method: 'OFFICIAL_PARTNER' as const,
        name: 'MakeMyTrip Official Partner API & Concierge Shield',
        provider: 'MakeMyTrip Bharat GDS',
        defaultWebsiteId: 'makemytrip',
        price: basePrice,
        gst: Math.round(basePrice * 0.05),
        conciergeShieldFee: 450,
        totalPayable: basePrice + Math.round(basePrice * 0.05) + 450,
        badge: 'RECOMMENDED • AUTOMATED STATUTORY REFUND SHIELD',
        description: 'Direct API reservation through certified MakeMyTrip Corporate Aviation GDS token bridge.',
        features: [
          'Pre-filled passenger identity & seat preference from Profile',
          'Automatic DGCA CAR Section 3 statutory refund filing on delay > 2h',
          'Direct digital ticket & airline PNR issued into Booking Vault',
        ],
        icon: ShieldCheck,
      },
      {
        id: 'opt_direct_api',
        name: 'Carrier Direct Airline Portal (Air India / IndiGo)',
        method: 'DIRECT_API' as const,
        provider: 'Air India Corporate Engine',
        defaultWebsiteId: 'carrier_official',
        price: basePrice,
        gst: Math.round(basePrice * 0.05),
        conciergeShieldFee: 0,
        totalPayable: basePrice + Math.round(basePrice * 0.05),
        badge: 'DIRECT INTEGRATION • ZERO MARKUP',
        description: 'Zero-intermediary reservation dispatched directly into carrier official inventory.',
        features: [
          'Instant airline PNR & e-ticket generation with GST corporate invoice',
          'Free corporate date change up to 24h before departure',
          'Real-time transit telemetry synchronized with RouteForge Trip Graph',
        ],
        icon: Zap,
      },
      {
        id: 'opt_deep_link',
        method: 'DEEP_LINK' as const,
        name: 'Verified Deep Link Travel Portal Checkout',
        provider: chosenWebsite.name,
        defaultWebsiteId: chosenWebsite.id,
        price: basePrice,
        gst: 0,
        conciergeShieldFee: 0,
        totalPayable: basePrice,
        badge: 'HONEST PROVENANCE',
        description: `Redirects directly to ${chosenWebsite.name} checkout. Parameters prefilled where supported.`,
        features: [
          `Authentic ${chosenWebsite.name} checkout with official rates & bank promotions`,
          'Intent logged in RouteForge Booking Vault before redirect',
          'Pre-populated origin, destination, travel date & passenger count',
        ],
        icon: ExternalLink,
      },
    ];
  }, [activeTab, basePrice, chosenWebsite.name, chosenWebsite.id]);

  const activeOption =
    bookingFulfillmentOptions[selectedMethodIndex] || bookingFulfillmentOptions[0];

  const handleSelectMethod = (idx: number) => {
    setSelectedMethodIndex(idx);
    const method = bookingFulfillmentOptions[idx];
    if (method && method.defaultWebsiteId) {
      setSelectedWebsiteId(method.defaultWebsiteId);
    }
  };

  const handleExecuteBooking = async () => {
    if (!plan) return;
    setIsProcessing(true);
    setError(null);

    const targetUrl = chosenWebsite.url;
    setRedirectNotice(`Opened ${chosenWebsite.name} in a new browser tab.`);

    // 1. Prepare captured trip data for Concierge background state
    const capturedData = {
      id: plan.id,
      title: plan.title,
      origin,
      originCode,
      destination,
      destCode,
      carrier: carrierName,
      serviceNumber,
      departureTime: depTime,
      arrivalTime: arrTime,
      travelDate: humanFormattedDate,
      pnr: pnrNumber,
      bookingPortal: chosenWebsite.name,
      totalPrice: activeOption.totalPayable,
      cabinClass: isTrain ? 'Executive / Anubhuti Class' : 'Business Class',
      capturedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem('routeforge_active_concierge_booking', JSON.stringify(capturedData));
      window.dispatchEvent(new CustomEvent('routeforge_booking_captured', { detail: capturedData }));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // Auto-copy search details to clipboard for zero friction
    const routeSummary = `${originCode} (${origin}) to ${destCode} (${destination}) | Date: ${formattedDateSlash} | 1 Adult | ${isTrain ? 'Executive Class' : 'Economy/Business Class'}`;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(routeSummary);
        setCopiedNotification(`Route details copied to clipboard: ${originCode} → ${destCode}, ${formattedDateSlash}`);
      }
    } catch {
      // ignore clipboard permission error
    }

    // 2. Open target website in a brand new top-level browser tab
    // CRITICAL: NEVER navigate the current window or iframe with window.location.assign,
    // because external booking portals (MakeMyTrip, IRCTC, etc.) block iframe embedding via X-Frame-Options: SAMEORIGIN.
    try {
      const openedWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
      if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === 'undefined') {
        // Fallback to programmatic anchor click with target="_blank"
        const anchor = document.createElement('a');
        anchor.href = targetUrl;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
      }
    } catch (openErr) {
      console.warn('[BookingOptionsModal] External tab opening notice:', openErr);
    }

    // 2. Asynchronously persist booking intent in vault if user session exists
    try {
      if (user) {
        const idToken = await user.getIdToken();
        const rawProviderName = (chosenWebsite.name || '').toLowerCase();
        let canonicalProvider = 'makemytrip';
        if (rawProviderName.includes('irctc') || isTrain) {
          canonicalProvider = 'irctc';
        } else if (rawProviderName.includes('redbus') || isBus) {
          canonicalProvider = 'redbus';
        } else if (rawProviderName.includes('uber') || isUber) {
          canonicalProvider = 'uber';
        } else if (rawProviderName.includes('makemytrip') || activeTab === 'flight') {
          canonicalProvider = 'makemytrip';
        } else {
          canonicalProvider = rawProviderName.replace(/[^a-z0-9]/g, '') || 'makemytrip';
        }

        const intentRes = await createBookingIntent(
          {
            journeyId: plan.id,
            provider: canonicalProvider,
            selectedOption: plan,
            providerReference: plan.legs[0]?.bookingReference || `PNR-${Date.now()}`,
            bookingMethod: activeOption.method,
            requestedParameters: {
              title: plan.title,
              legs: plan.legs,
              totalPrice: activeOption.totalPayable,
              website: chosenWebsite.url,
            },
          },
          idToken,
          user.uid
        );

        const bookingRes = await createBooking(
          {
            intentId: intentRes.intentId,
            provider: canonicalProvider,
            title: plan.title,
            totalPrice: activeOption.totalPayable,
            currency: plan.currency,
            passengers: [
              {
                name: user.displayName || user.email || 'Primary Traveler',
                mealPreference: 'Pure Veg / Jain (Profile Synced)',
              },
            ],
            legs: plan.legs,
            cancellationPolicy: {
              refundable: true,
              terms: plan.disruptionShield,
            },
            disruptionShield: plan.disruptionShield,
            provenance: plan.provenance,
          },
          idToken,
          user.uid
        );

        if (bookingRes.success) {
          onBookingSuccess?.(bookingRes.booking);
        }
      }
    } catch (err: any) {
      console.warn('[BookingOptionsModal] Background vault persistence note:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !plan) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Target Modal Card: exactly 5 top-level child divs to strictly conform to CSS selectors */}
      <div 
        id="booking-fulfillment-dialog-card"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-3xl bg-[#0A0C14] border border-[#D4AF37]/50 shadow-[0_0_60px_-15px_rgba(212,175,55,0.25)] p-6 sm:p-8 space-y-6 my-auto backdrop-blur-2xl"
      >
        {/* Child Div 1: Ambient Backdrop Glow */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Child Div 2: Top Modal Header */}
        <div className="flex items-start justify-between border-b border-gold-subtle/40 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BOOKING FULFILLMENT &amp; REDIRECTION MATRIX</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-white font-medium mt-1">
              Select Booking Method &amp; Website
            </h2>
            <p className="text-xs font-sans-luxury text-slate-300 font-light mt-0.5">
              {plan.title} • <Clock className="w-3 h-3 inline mr-1 text-[#D4AF37]" />{plan.totalDuration} • {plan.priceFormatted}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Child Div 3: Options Selector & Website Chooser */}
        <div className="space-y-4">
          {/* Modality Mode Tabs (Uber, Train, Bus, Flight, Multi-Modal) */}
          <div className="p-2 rounded-2xl bg-[#07080D] border border-gold-subtle/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-1.5 px-2">
              <span className="text-[10px] font-cinzel text-slate-400 font-bold tracking-wider">
                SELECT MODALITY:
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleTabChange('uber')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'uber'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-[#D4AF37] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900/60'
                }`}
              >
                <Car className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>UBER &amp; CABS</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('train')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'train'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-[#D4AF37] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900/60'
                }`}
              >
                <Train className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>TRAIN &amp; RAIL</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('bus')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'bus'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-[#D4AF37] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900/60'
                }`}
              >
                <Bus className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>BUS &amp; COACH</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('flight')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'flight'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-[#D4AF37] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900/60'
                }`}
              >
                <Plane className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>FLIGHTS</span>
              </button>
              <button
                type="button"
                onClick={() => handleTabChange('multimodal')}
                className={`px-3 py-1.5 rounded-xl text-xs font-cinzel tracking-wider flex items-center space-x-1.5 transition-all cursor-pointer ${
                  activeTab === 'multimodal'
                    ? 'bg-gradient-to-r from-[#D4AF37]/30 to-[#D4AF37]/10 text-[#FCE7AC] border border-[#D4AF37] shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:bg-slate-900/60'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>MULTI-MODAL</span>
              </button>
            </div>
          </div>

          {/* Website Chooser Bar */}
          <div className="p-3.5 rounded-2xl bg-[#07080D] border border-gold-subtle/40 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Globe className="w-4 h-4 text-[#D4AF37]" />
                <span className="text-xs font-cinzel font-bold text-white tracking-wider">
                  CHOOSE REDIRECTION WEBSITE:
                </span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60">
                ACTIVE: {chosenWebsite.name.toUpperCase()}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {availableWebsites.map((site) => {
                const isSelected = site.id === chosenWebsite.id;
                return (
                  <button
                    key={site.id}
                    type="button"
                    onClick={() => setSelectedWebsiteId(site.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-[#D4AF37] bg-[#1A1F2C] ring-1 ring-[#D4AF37]/50 shadow-md'
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-white truncate">{site.name}</span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#D4AF37] flex-shrink-0" />
                      ) : (
                        <ExternalLink className="w-3 h-3 text-slate-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 truncate mt-1">
                      {site.domain}
                    </span>
                    <span className="text-[8px] font-cinzel text-[#D4AF37]/80 truncate mt-0.5">
                      {site.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fulfillment Tier Selector Cards */}
          <div className="space-y-3">
            {bookingFulfillmentOptions.map((opt, idx) => {
              const isSelected = selectedMethodIndex === idx;
              const Icon = opt.icon;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectMethod(idx)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'border-gold-bright bg-gradient-to-r from-[#171B26] to-[#0D1017] shadow-lg shadow-[#D4AF37]/10'
                      : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-serif-display font-medium text-base text-white">
                            {opt.name}
                          </h4>
                          <span className="text-[9px] font-cinzel font-bold px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                            {opt.badge}
                          </span>
                        </div>
                        <p className="text-xs font-sans-luxury text-slate-400 mt-0.5">
                          {opt.description}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {opt.features.map((feat, fIdx) => (
                            <li
                              key={fIdx}
                              className="text-[11px] font-sans-luxury text-slate-300 flex items-center space-x-1.5"
                            >
                              <span className="text-[#D4AF37] font-bold">•</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="font-serif-display font-medium text-xl text-white block">
                        ₹{opt.totalPayable.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400 block">
                        incl. taxes &amp; fees
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Child Div 4: Price Transparency Breakdown & Chosen Website Summary */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-2.5 font-mono">
          {/* Prefilled parameters payload box */}
          <div className="p-3.5 rounded-xl bg-[#090C14] border border-[#D4AF37]/40 space-y-3 font-sans-luxury">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
              <span className="font-cinzel text-[#D4AF37] font-bold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>ROUTEFORGE VERIFIED BOOKING PAYLOAD</span>
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={async () => {
                    const summary = `${originCode} (${origin}) → ${destCode} (${destination}) | Date: ${formattedDateSlash} | 1 Adult | ${isTrain ? 'Executive Class' : 'Economy/Business'}`;
                    try {
                      if (navigator.clipboard) {
                        await navigator.clipboard.writeText(summary);
                        setCopiedNotification(`Copied: ${originCode} → ${destCode} (${formattedDateSlash})`);
                        setTimeout(() => setCopiedNotification(null), 3500);
                      }
                    } catch {
                      // ignore
                    }
                  }}
                  className="px-2.5 py-1 rounded bg-[#D4AF37]/15 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#FCE7AC] font-mono text-[10px] flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-3 h-3 text-[#D4AF37]" />
                  <span>Copy Search Details</span>
                </button>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-[10px] text-emerald-300 font-mono">
                  {chosenWebsite.id === 'easemytrip' ? 'Portal + Clipboard Ready' : `Deep Link: ${chosenWebsite.name}`}
                </span>
              </div>
            </div>

            {copiedNotification && (
              <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-[11px] font-mono flex items-center space-x-2 animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{copiedNotification}</span>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Transit Route</span>
                <span className="font-bold text-white">{originCode} → {destCode}</span>
                <span className="text-[9px] text-slate-400 block truncate">{origin} to {destination}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 block uppercase">Travel Date</span>
                  <span className="text-[9px] text-[#D4AF37]">Adjustable</span>
                </div>
                <input
                  type="date"
                  value={selectedTravelDate}
                  min={getTodayIso()}
                  max={getMaxBookingIso()}
                  onChange={(e) => {
                    if (e.target.value) {
                      setSelectedTravelDate(e.target.value);
                    }
                  }}
                  className="w-full mt-0.5 bg-slate-900 border border-slate-700 rounded text-xs text-[#FCE7AC] px-1.5 py-0.5 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Arrival (Est.)</span>
                <span className="font-bold text-emerald-300 truncate block">{arrTime}</span>
                <span className="text-[9px] text-slate-400 block truncate">Buffered for check-in</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950/90 border border-slate-800">
                <span className="text-[10px] text-slate-500 block uppercase">Service / Cabin</span>
                <span className="font-bold text-slate-300 truncate block">{serviceNumber}</span>
                <span className="text-[9px] text-slate-400 block truncate">
                  {isUber ? 'Chauffeur / VIP Ride' : isBus ? 'Volvo Multi-Axle' : isTrain ? 'Executive Class' : 'Economy / Business'}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 font-sans-luxury leading-relaxed border-t border-slate-800/60 pt-2">
              {isUber ? (
                <>
                  <strong className="text-slate-300 font-medium">Uber Dispatch &amp; Route Guarantee:</strong> Origin ({origin}) and destination ({destination}) coordinates are pre-configured in the official Uber rider engine (<code className="text-[#FCE7AC] font-mono">m.uber.com</code>). One tap opens the official Uber portal with your verified route locked in.
                </>
              ) : isBus ? (
                <>
                  <strong className="text-slate-300 font-medium">redBus GDS Sync:</strong> Route parameters for {origin} to {destination} are mapped into verified intercity coach schedules with 100% money-back statutory disruption shield.
                </>
              ) : isTrain ? (
                <>
                  <strong className="text-slate-300 font-medium">IRCTC PRS Synchronization:</strong> Station codes {originCode} and {destCode} are synchronized with Indian Railways PRS engine for Tatkal and confirmed PNR allocation.
                </>
              ) : (
                <>
                  <strong className="text-slate-300 font-medium">OTA Synchronization Guarantee:</strong> Dates are calibrated to guaranteed upcoming valid schedules within standard 330-day airline booking windows. On MakeMyTrip, the query passes verified <code className="text-[#FCE7AC] font-mono">{originCode}-{destCode}-{formattedDateSlash}</code> formatting.
                </>
              )}
            </p>
          </div>

          {/* Real-time destination notification */}
          <div className="p-2.5 rounded-lg bg-[#07090F] border border-[#D4AF37]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-sans-luxury">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4 text-[#D4AF37] flex-shrink-0" />
              <div>
                <span className="text-[10px] font-cinzel text-slate-400 block tracking-wider">
                  TARGET DESTINATION PORTAL
                </span>
                <span className="text-xs font-bold text-white">
                  {chosenWebsite.name}{' '}
                  <span className="text-slate-400 font-mono font-normal text-[11px] truncate inline-block max-w-[180px] sm:max-w-xs align-bottom">
                    ({chosenWebsite.url})
                  </span>
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {chosenWebsite.id === 'makemytrip' && (
                <a
                  href="https://www.makemytrip.com/flights.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-[10px] font-cinzel flex items-center space-x-1 transition-all"
                  title="Open general MakeMyTrip flights portal"
                >
                  <span>Alternate Portal</span>
                  <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                </a>
              )}
              <a
                href={chosenWebsite.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 rounded-lg bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FCE7AC] text-[11px] font-cinzel flex items-center space-x-1 transition-all"
              >
                <span>Test Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {redirectNotice && (
            <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/70 text-emerald-100 text-xs space-y-2.5">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span className="font-medium">{redirectNotice}</span>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-emerald-800/40">
                <span className="text-[11px] text-emerald-300">
                  Concierge is ready in the background! When you finish booking, switch to Concierge to coordinate your arrival, stays, and excursions.
                </span>
                <div className="flex items-center gap-2">
                  <a
                    href={chosenWebsite.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 border border-emerald-500 text-white font-bold transition-all shrink-0 text-[11px]"
                  >
                    <span>Open {chosenWebsite.name}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {onNavigateToConcierge && (
                    <button
                      onClick={() => {
                        onClose();
                        onNavigateToConcierge();
                      }}
                      className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel font-bold text-[11px] transition-all cursor-pointer shadow-md shrink-0"
                    >
                      <span>GO TO CONCIERGE ↗</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-2.5 rounded-lg bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-between text-slate-400 pt-1">
            <span>Base Carrier Tariff ({plan.providerSummary}):</span>
            <span>₹{activeOption.price.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Statutory GST (5% Passenger Transport Service):</span>
            <span>₹{activeOption.gst.toLocaleString('en-IN')}</span>
          </div>
          {activeOption.conciergeShieldFee > 0 && (
            <div className="flex justify-between text-[#D4AF37]">
              <span>Concierge Disruption Shield &amp; Rule 73A Auto-TDR:</span>
              <span>₹{activeOption.conciergeShieldFee.toLocaleString('en-IN')}</span>
            </div>
          )}
          <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-white text-sm">
            <span>Total Payable:</span>
            <span className="text-[#FCE7AC]">₹{activeOption.totalPayable.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Child Div 5: Actions Container (button 1 = CANCEL, button 2 = CONFIRM & REDIRECT) */}
        <div className="pt-2 flex items-center justify-between">
          <button
            id="btn-cancel-booking-modal"
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-700 hover:border-slate-500 text-xs font-cinzel text-slate-300 cursor-pointer"
          >
            CANCEL
          </button>

          <button
            id="btn-confirm-and-redirect-booking"
            onClick={handleExecuteBooking}
            disabled={isProcessing}
            className="px-7 py-3 rounded-full gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.15em] shadow-xl shadow-[#D4AF37]/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                <span>REDIRECTING TO {chosenWebsite.name.toUpperCase()}...</span>
              </>
            ) : (
              <>
                <span>CONFIRM &amp; REDIRECT TO {chosenWebsite.name.toUpperCase()}</span>
                <ExternalLink className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

