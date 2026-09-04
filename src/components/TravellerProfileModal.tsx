// src/components/TravellerProfileModal.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Crown, 
  ShieldCheck, 
  Sparkles, 
  User, 
  Phone, 
  MapPin, 
  CreditCard, 
  Plane, 
  Train, 
  Hotel, 
  Clock, 
  Compass, 
  HeartHandshake, 
  Utensils, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { 
  TravellerProfile, 
  AgeGroup, 
  PreferredCurrency, 
  TravelBudget, 
  PreferredTransport, 
  PreferredCabinClass, 
  SeatPreference, 
  HotelCategory, 
  PreferredDepartureTime, 
  FlexibilityPreference, 
  FoodPreference 
} from '../types/profile';
import { saveTravellerProfile } from '../lib/api/profile';

interface TravellerProfileModalProps {
  isOpen: boolean;
  userId: string;
  userEmail: string;
  defaultName?: string;
  onComplete: (profile: TravellerProfile) => void;
}

export const TravellerProfileModal: React.FC<TravellerProfileModalProps> = ({
  isOpen,
  userId,
  userEmail,
  defaultName = '',
  onComplete,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Form State
  const [fullName, setFullName] = useState(defaultName);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [homeCity, setHomeCity] = useState('Mumbai');
  const [ageGroup, setAgeGroup] = useState<AgeGroup>('26-35');
  const [preferredCurrency, setPreferredCurrency] = useState<PreferredCurrency>('INR');

  // Travel Preferences
  const [travelBudget, setTravelBudget] = useState<TravelBudget>('luxury');
  const [preferredTransport, setPreferredTransport] = useState<PreferredTransport>('multimodal');
  const [preferredCabinClass, setPreferredCabinClass] = useState<PreferredCabinClass>('vande_bharat_exec');
  const [seatPreference, setSeatPreference] = useState<SeatPreference>('window');
  const [hotelCategory, setHotelCategory] = useState<HotelCategory>('heritage_palace');
  const [preferredDepartureTime, setPreferredDepartureTime] = useState<PreferredDepartureTime>('morning');
  const [maxTravelDurationHours, setMaxTravelDurationHours] = useState(10);
  const [maxConnections, setMaxConnections] = useState(1);
  const [flexibilityPreference, setFlexibilityPreference] = useState<FlexibilityPreference>('moderate');

  // Optional Privé Personalization
  const [foodPreference, setFoodPreference] = useState<FoodPreference>('pure_veg');
  const [accessibilityRequirements, setAccessibilityRequirements] = useState('');
  const [airIndiaNumber, setAirIndiaNumber] = useState('');
  const [indigoNumber, setIndigoNumber] = useState('');
  const [irctcUserId, setIrctcUserId] = useState('');
  const [tajNumber, setTajNumber] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [emergencyRelation, setEmergencyRelation] = useState('');

  if (!isOpen) return null;

  const handleStep1Next = () => {
    if (!fullName.trim()) {
      setValidationError('Please enter your full legal name for ticket verification.');
      return;
    }
    if (!phoneNumber.trim()) {
      setValidationError('Please provide a mobile contact for SMS & WhatsApp disruption alerts.');
      return;
    }
    if (!homeCity.trim()) {
      setValidationError('Please specify your home city or base departure hub.');
      return;
    }
    setValidationError(null);
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    setValidationError(null);
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    setValidationError(null);
    setIsSubmitting(true);

    const profilePayload: TravellerProfile = {
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      homeCity: homeCity.trim(),
      ageGroup,
      preferredCurrency,
      preferences: {
        travelBudget,
        preferredTransport,
        preferredCabinClass,
        seatPreference,
        hotelCategory,
        preferredDepartureTime,
        maxTravelDurationHours,
        maxConnections,
        flexibilityPreference,
      },
      foodPreference,
      accessibilityRequirements: accessibilityRequirements.trim() || undefined,
      frequentTravellerIdentifiers: {
        airIndia: airIndiaNumber.trim() || undefined,
        indigo: indigoNumber.trim() || undefined,
        irctc: irctcUserId.trim() || undefined,
        tajInnerCircle: tajNumber.trim() || undefined,
      },
      emergencyContact: emergencyName.trim() ? {
        name: emergencyName.trim(),
        phone: emergencyPhone.trim(),
        relation: emergencyRelation.trim() || 'Family',
      } : undefined,
      isComplete: true,
    };

    try {
      const response = await saveTravellerProfile(userId, userEmail, profilePayload);
      if (response.success && response.profile) {
        onComplete(response.profile);
      } else {
        // Fallback local complete
        onComplete(profilePayload);
      }
    } catch (err: any) {
      console.warn('[TravellerProfileModal] Error during save, using memory profile:', err);
      onComplete(profilePayload);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9990] bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0B0D13] border border-gold-bright shadow-2xl p-6 sm:p-10 overflow-hidden my-auto">
        {/* Ambient Gold Glow Aura */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header Badge & Stepper */}
        <div className="relative space-y-3 mb-8 border-b border-gold-subtle/30 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Crown className="w-4 h-4 text-[#D4AF37]" />
              <span>RE ROUTE BHARAT PRIVÉ ONBOARDING</span>
            </div>
            <div className="text-[11px] font-mono text-[#D4AF37] px-2.5 py-0.5 rounded-full bg-slate-900 border border-gold-subtle">
              STEP {currentStep} OF 3
            </div>
          </div>

          <h2 className="font-serif-display text-2xl sm:text-3xl text-white">
            {currentStep === 1 && 'Configure Your Traveller Profile'}
            {currentStep === 2 && 'Calibrate Your Travel Corridors'}
            {currentStep === 3 && 'Privé Personalization & Loyalty'}
          </h2>

          <p className="text-xs font-sans-luxury text-slate-300 font-light">
            {currentStep === 1 && 'To automate IRCTC PRS and DGCA statutory recoveries, provide your verified contact credentials.'}
            {currentStep === 2 && 'Set your autonomous corridor tolerances across air, Vande Bharat rail, and royal palace stays.'}
            {currentStep === 3 && 'Tailor pure vegetarian dining, railway loyalty numbers, and 24/7 family emergency safeguards.'}
          </p>

          {/* Stepper Progress Bar */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            <div className={`h-1 rounded-full transition-all duration-300 ${currentStep >= 1 ? 'bg-[#D4AF37]' : 'bg-slate-800'}`} />
            <div className={`h-1 rounded-full transition-all duration-300 ${currentStep >= 2 ? 'bg-[#D4AF37]' : 'bg-slate-800'}`} />
            <div className={`h-1 rounded-full transition-all duration-300 ${currentStep === 3 ? 'bg-[#D4AF37]' : 'bg-slate-800'}`} />
          </div>
        </div>

        {/* Validation Error Banner */}
        {validationError && (
          <div className="mb-6 p-3.5 rounded-xl bg-red-950/60 border border-red-500/40 flex items-center space-x-2.5 text-xs text-red-200 font-sans-luxury">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{validationError}</span>
          </div>
        )}

        {/* STEP 1: MANDATORY IDENTITY FIELDS */}
        {currentStep === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300 flex items-center space-x-1.5">
                  <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>FULL LEGAL NAME *</span>
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kaivalya Thombare"
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300 flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>PHONE NUMBER (FOR TDR & SMS) *</span>
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>HOME CITY / BASE HUB *</span>
                </label>
                <input
                  type="text"
                  value={homeCity}
                  onChange={(e) => setHomeCity(e.target.value)}
                  placeholder="e.g. Mumbai / Delhi"
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">AGE GROUP *</label>
                <select
                  value={ageGroup}
                  onChange={(e) => setAgeGroup(e.target.value as AgeGroup)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="18-25">18 – 25 (Young Professional)</option>
                  <option value="26-35">26 – 35 (Executive / Explorer)</option>
                  <option value="36-50">36 – 50 (Family / Business Leader)</option>
                  <option value="51-65">51 – 65 (Senior Connoisseur)</option>
                  <option value="65+">65+ (Royal Heritage Patron)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300 flex items-center space-x-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>PREFERRED CURRENCY *</span>
                </label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value as PreferredCurrency)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="INR">INR ₹ (Indian Rupee)</option>
                  <option value="USD">USD $ (US Dollar)</option>
                  <option value="EUR">EUR € (Euro)</option>
                  <option value="GBP">GBP £ (British Pound)</option>
                  <option value="AED">AED د.إ (UAE Dirham)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={handleStep1Next}
                className="px-6 py-3 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] transition-all flex items-center space-x-2 shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
              >
                <span>CONTINUE TO CORRIDORS</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: TRAVEL PREFERENCES */}
        {currentStep === 2 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">TRAVEL BUDGET TIER</label>
                <select
                  value={travelBudget}
                  onChange={(e) => setTravelBudget(e.target.value as TravelBudget)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="economy">Smart Economy (Value & Reliability)</option>
                  <option value="premium">Premium Leisure (Air India & Vande Bharat)</option>
                  <option value="luxury">Bharat Privé Luxury (5-Star & Heritage Stays)</option>
                  <option value="ultra_hni">Royal Maharaja Circle (Private Charters)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">PREFERRED TRANSPORT MODE</label>
                <select
                  value={preferredTransport}
                  onChange={(e) => setPreferredTransport(e.target.value as PreferredTransport)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="multimodal">Seamless Multi-Modal (Flight + High-Speed Rail)</option>
                  <option value="flight">Aviation Priority (Direct Flights First)</option>
                  <option value="train">Royal Indian Railways (Vande Bharat & Tejas)</option>
                  <option value="private_charter">Private Helicopter & Jet Charters</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">CABIN / CLASS</label>
                <select
                  value={preferredCabinClass}
                  onChange={(e) => setPreferredCabinClass(e.target.value as PreferredCabinClass)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="vande_bharat_exec">Vande Bharat Executive / Anubhuti</option>
                  <option value="business">Business Class</option>
                  <option value="first">First Class / Maharaja Coupe</option>
                  <option value="premium_economy">Premium Economy</option>
                  <option value="economy">Economy</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">SEAT PREFERENCE</label>
                <select
                  value={seatPreference}
                  onChange={(e) => setSeatPreference(e.target.value as SeatPreference)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="window">Window View</option>
                  <option value="aisle">Aisle (Easy Access)</option>
                  <option value="coupe">Private Family Coupe (Rail)</option>
                  <option value="extra_legroom">Extra Legroom</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">HOTEL CATEGORY</label>
                <select
                  value={hotelCategory}
                  onChange={(e) => setHotelCategory(e.target.value as HotelCategory)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="heritage_palace">Taj Lake Palace & Heritage Palaces</option>
                  <option value="5_star_luxury">5-Star Luxury (Oberoi & ITC)</option>
                  <option value="boutique_resort">Curated Boutique Villas</option>
                  <option value="business_executive">Central Business Hotel</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">DEPARTURE WINDOW</label>
                <select
                  value={preferredDepartureTime}
                  onChange={(e) => setPreferredDepartureTime(e.target.value as PreferredDepartureTime)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="morning">Morning (08:00 – 12:00)</option>
                  <option value="early_morning">Early Dawn (04:00 – 08:00)</option>
                  <option value="afternoon">Afternoon (12:00 – 17:00)</option>
                  <option value="evening">Evening (17:00 – 21:00)</option>
                  <option value="night">Overnight (21:00 – 04:00)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">MAX DURATION (HOURS)</label>
                <input
                  type="number"
                  min={1}
                  max={48}
                  value={maxTravelDurationHours}
                  onChange={(e) => setMaxTravelDurationHours(Number(e.target.value) || 10)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300">FLEXIBILITY</label>
                <select
                  value={flexibilityPreference}
                  onChange={(e) => setFlexibilityPreference(e.target.value as FlexibilityPreference)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="moderate">Moderate (±2 hours buffer)</option>
                  <option value="strict">Strict (Exact schedules only)</option>
                  <option value="high">High (Open to optimal AI reroutes)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-cinzel text-xs flex items-center space-x-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>PREVIOUS</span>
              </button>
              <button
                type="button"
                onClick={handleStep2Next}
                className="px-6 py-3 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] transition-all flex items-center space-x-2 shadow-lg shadow-[#D4AF37]/20 cursor-pointer"
              >
                <span>PRIVÉ PERSONALIZATION</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OPTIONAL PRIVÉ & DIETARY CARE */}
        {currentStep === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300 flex items-center space-x-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>DIETARY / DINING CARE</span>
                </label>
                <select
                  value={foodPreference}
                  onChange={(e) => setFoodPreference(e.target.value as FoodPreference)}
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white focus:outline-none focus:border-[#D4AF37] cursor-pointer"
                >
                  <option value="pure_veg">Verified Pure Vegetarian (Strict)</option>
                  <option value="jain">Jain Meal (No Root Veg / Onion / Garlic)</option>
                  <option value="non_veg">Standard Non-Vegetarian</option>
                  <option value="halal">Halal Certified</option>
                  <option value="kosher">Kosher</option>
                  <option value="diabetic">Diabetic / Low Glycemic</option>
                  <option value="none">No Specific Preference</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-cinzel text-slate-300 flex items-center space-x-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>ACCESSIBILITY / SPECIAL ASSIST</span>
                </label>
                <input
                  type="text"
                  value={accessibilityRequirements}
                  onChange={(e) => setAccessibilityRequirements(e.target.value)}
                  placeholder="e.g. Wheelchair ramp, elderly assistance, infant cot"
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-4 py-3 text-xs sm:text-sm font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-cinzel font-semibold text-[#D4AF37]">
                FREQUENT TRAVELLER & LOYALTY NUMBERS (OPTIONAL)
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-cinzel text-slate-400">AIR INDIA FLYING</label>
                  <input
                    type="text"
                    value={airIndiaNumber}
                    onChange={(e) => setAirIndiaNumber(e.target.value)}
                    placeholder="AI-987654"
                    className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-cinzel text-slate-400">INDIGO 6E REWARDS</label>
                  <input
                    type="text"
                    value={indigoNumber}
                    onChange={(e) => setIndigoNumber(e.target.value)}
                    placeholder="6E-123456"
                    className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-cinzel text-slate-400">IRCTC USERNAME</label>
                  <input
                    type="text"
                    value={irctcUserId}
                    onChange={(e) => setIrctcUserId(e.target.value)}
                    placeholder="irctc_id"
                    className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-cinzel text-slate-400">TAJ INNERCIRCLE</label>
                  <input
                    type="text"
                    value={tajNumber}
                    onChange={(e) => setTajNumber(e.target.value)}
                    placeholder="TIC-99210"
                    className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <span className="text-[11px] font-cinzel font-semibold text-[#D4AF37]">
                EMERGENCY CONTACT (FOR 24/7 CONCIERGE RESCUE)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Contact Name"
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-3 py-2 text-xs font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="Contact Phone"
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-3 py-2 text-xs font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
                <input
                  type="text"
                  value={emergencyRelation}
                  onChange={(e) => setEmergencyRelation(e.target.value)}
                  placeholder="Relation (e.g. Spouse / Family)"
                  className="w-full bg-[#0E1017] border border-gold-subtle rounded-xl px-3 py-2 text-xs font-sans-luxury text-white placeholder-slate-500 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div className="pt-6 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-cinzel text-xs flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>PREVIOUS</span>
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-3.5 rounded-xl gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] transition-all flex items-center space-x-2 shadow-lg shadow-[#D4AF37]/20 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>SAVING PROFILE...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>COMPLETE ONBOARDING & ENTER JOURNEYS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Security Footer Notice */}
        <div className="pt-6 mt-6 border-t border-gold-subtle/20 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>PostgreSQL Encrypted • DGCA & IRCTC Automated Settlement</span>
          </div>
          <span>No Passport Required</span>
        </div>
      </div>
    </div>
  );
};
