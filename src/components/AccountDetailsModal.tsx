// src/components/AccountDetailsModal.tsx
import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Sparkles, 
  LogOut, 
  Edit3, 
  Layers, 
  Briefcase, 
  HeartHandshake, 
  CreditCard,
  Crown,
  RefreshCw,
  Utensils
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { fetchTravellerProfile } from '../lib/api/profile';
import { TravellerProfile } from '../types/profile';

interface AccountDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenEditProfile: () => void;
  onOpenProviders: () => void;
}

const FORMAT_LABELS: Record<string, string> = {
  // Budget
  economy: 'Smart Economy',
  premium: 'Premium Leisure',
  luxury: 'Bharat Privé Luxury',
  ultra_hni: 'Royal Maharaja Circle',
  // Transport
  multimodal: 'Seamless Multi-Modal',
  flight: 'Aviation Priority',
  train: 'Royal Indian Railways',
  private_charter: 'Private Charters',
  // Cabin
  vande_bharat_exec: 'Vande Bharat Executive / Anubhuti',
  business: 'Business Class',
  first: 'First Class / Maharaja Coupe',
  premium_economy: 'Premium Economy',
  // Seat
  window: 'Window View',
  aisle: 'Aisle (Easy Access)',
  coupe: 'Private Family Coupe',
  extra_legroom: 'Extra Legroom',
  // Hotel
  heritage_palace: 'Taj Lake Palace & Heritage',
  '5_star_luxury': '5-Star Luxury (Oberoi/ITC)',
  boutique_resort: 'Curated Boutique Villas',
  business_executive: 'Central Business Hotel',
  // Departure
  morning: 'Morning (08:00 – 12:00)',
  early_morning: 'Early Dawn (04:00 – 08:00)',
  afternoon: 'Afternoon (12:00 – 17:00)',
  evening: 'Evening (17:00 – 21:00)',
  night: 'Overnight (21:00 – 04:00)',
  // Flexibility
  moderate: 'Moderate (±2h buffer)',
  strict: 'Strict (Exact schedules)',
  high: 'High (Optimal AI)',
  // Food
  pure_veg: 'Pure Vegetarian (Strict)',
  jain: 'Jain Meal (No Root/Onion/Garlic)',
  non_veg: 'Standard Non-Vegetarian',
  halal: 'Halal Certified',
  kosher: 'Kosher',
  diabetic: 'Diabetic / Low Glycemic',
  none: 'No Specific Preference',
};

const formatValue = (val?: string | null): string => {
  if (!val || val === 'SELECT' || val.trim() === '') return 'SELECT';
  return FORMAT_LABELS[val] || val;
};

export const AccountDetailsModal: React.FC<AccountDetailsModalProps> = ({
  isOpen,
  onClose,
  onOpenEditProfile,
  onOpenProviders,
}) => {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<TravellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    let isMounted = true;
    setIsLoading(true);

    fetchTravellerProfile(user.uid, user.email || undefined)
      .then((res) => {
        if (isMounted && res.profile) {
          setProfile(res.profile);
        }
      })
      .catch((err) => console.warn('[AccountDetailsModal] Error fetching profile:', err))
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleSignOut = async () => {
    try {
      await signOut();
      onClose();
    } catch (err) {
      console.error('[AccountDetailsModal] Sign out error:', err);
    }
  };

  const displayName = profile?.fullName || user.displayName || user.email?.split('@')[0] || 'Privé Traveler';
  const userInitials = displayName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const prefs = (profile?.preferences || (profile as any)?.travelPreferences || {}) as any;
  const emergency = profile?.emergencyContact || (profile as any)?.emergencyContactName ? {
    name: profile?.emergencyContact?.name || (profile as any)?.emergencyContactName,
    relation: profile?.emergencyContact?.relation || (profile as any)?.emergencyContactRelation || 'Family',
    phone: profile?.emergencyContact?.phone || (profile as any)?.emergencyContactPhone,
  } : null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#0C0E14] border border-gold-bright shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        {/* Ambient Gold Glow */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between border-b border-gold-subtle/40 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Crown className="w-3.5 h-3.5" />
              <span>ROUTEFORGE PRIVÉ • ACCOUNT DOSSIER</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-white font-medium mt-1">
              Account &amp; Traveller Details
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Member Profile Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#171B26] to-[#0E1118] border border-[#D4AF37]/40 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-5">
          {/* Avatar */}
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={displayName}
              className="w-16 h-16 rounded-full border-2 border-gold-bright object-cover shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#8C6D23] text-slate-950 font-cinzel font-bold text-xl flex items-center justify-center border-2 border-gold-bright shadow-lg">
              {userInitials}
            </div>
          )}

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="font-serif-display text-xl text-white font-medium">
                {displayName}
              </h3>
              <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-semibold">
                ✓ GOOGLE VERIFIED CLIENTELE
              </span>
            </div>

            <p className="text-xs font-mono text-slate-300 flex items-center justify-center sm:justify-start space-x-1.5">
              <Mail className="w-3 h-3 text-[#D4AF37]" />
              <span>{user.email}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                MEMBERSHIP: PRIVÉ ELITE #{user.uid.slice(0, 8).toUpperCase()}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-800/60 text-amber-300">
                CURRENCY: {formatValue(profile?.preferredCurrency) === 'SELECT' ? 'INR (₹)' : formatValue(profile?.preferredCurrency)}
              </span>
            </div>
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="py-6 flex items-center justify-center space-y-2">
            <RefreshCw className="w-5 h-5 text-[#D4AF37] animate-spin" />
            <span className="text-xs font-mono text-slate-400 ml-2">Loading profile dossier...</span>
          </div>
        )}

        {/* Detailed Preferences Grid */}
        {!isLoading && profile && (
          <div className="space-y-4">
            {/* Identity & Origin Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Primary Contact Phone</span>
                <p className="font-medium text-white flex items-center space-x-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{profile.phoneNumber || 'SELECT'}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">Home City &amp; Age</span>
                <p className="font-medium text-white flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{profile.homeCity || 'SELECT'} • {formatValue(profile.ageGroup)}</span>
                </p>
              </div>
            </div>

            {/* Travel Style & Cabin */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-cinzel font-semibold tracking-wider text-[#D4AF37] uppercase">
                  TRAVEL STYLIST &amp; CABIN PREFERENCES
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {formatValue(prefs.flexibilityPreference) !== 'SELECT' ? `${formatValue(prefs.flexibilityPreference)} Flexibility` : 'FLEXIBILITY: SELECT'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] font-sans-luxury text-slate-300">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">BUDGET TIER</span>
                  <span className={`font-medium ${formatValue(prefs.travelBudget) === 'SELECT' ? 'text-slate-500' : 'text-white'}`}>
                    {formatValue(prefs.travelBudget)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">PREFERRED CABIN</span>
                  <span className={`font-medium ${formatValue(prefs.preferredCabinClass) === 'SELECT' ? 'text-slate-500' : 'text-white'}`}>
                    {formatValue(prefs.preferredCabinClass)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">SEAT SELECTION</span>
                  <span className={`font-medium ${formatValue(prefs.seatPreference) === 'SELECT' ? 'text-slate-500' : 'text-white'}`}>
                    {formatValue(prefs.seatPreference)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">TRANSPORT MODE</span>
                  <span className={`font-medium ${formatValue(prefs.preferredTransport) === 'SELECT' ? 'text-slate-500' : 'text-white'}`}>
                    {formatValue(prefs.preferredTransport)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">HOTEL CATEGORY</span>
                  <span className={`font-medium ${formatValue(prefs.hotelCategory) === 'SELECT' ? 'text-slate-500' : 'text-white'}`}>
                    {formatValue(prefs.hotelCategory)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                  <span className="text-slate-500 block text-[10px]">DEPARTURE TIME</span>
                  <span className={`font-medium ${formatValue(prefs.preferredDepartureTime) === 'SELECT' ? 'text-slate-500' : 'text-white'}`}>
                    {formatValue(prefs.preferredDepartureTime)}
                  </span>
                </div>
              </div>
            </div>

            {/* Dietary & Loyalty */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-wider text-[#D4AF37] uppercase">
                <Utensils className="w-3.5 h-3.5" />
                <span>INDIAN DIETARY &amp; LOYALTY PROFILE</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-sans-luxury text-slate-300">
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">DIETARY REQUIREMENTS</span>
                  <span className={`font-medium ${formatValue(profile.foodPreference) === 'SELECT' ? 'text-slate-500' : 'text-white'}`}>
                    {formatValue(profile.foodPreference)}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">ACCESSIBILITY</span>
                  <span className="font-medium text-white">{profile.accessibilityRequirements || 'None specified'}</span>
                </div>
              </div>

              {/* Frequent Traveller Numbers */}
              {profile.frequentTravellerIdentifiers && Object.values(profile.frequentTravellerIdentifiers).some(Boolean) && (
                <div className="pt-1 flex flex-wrap gap-2 text-[10px] font-mono text-amber-300/90">
                  {profile.frequentTravellerIdentifiers.airIndia && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      Air India: {profile.frequentTravellerIdentifiers.airIndia}
                    </span>
                  )}
                  {profile.frequentTravellerIdentifiers.indigo && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      IndiGo 6E: {profile.frequentTravellerIdentifiers.indigo}
                    </span>
                  )}
                  {profile.frequentTravellerIdentifiers.irctc && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      IRCTC: {profile.frequentTravellerIdentifiers.irctc}
                    </span>
                  )}
                  {profile.frequentTravellerIdentifiers.tajInnerCircle && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                      Taj TIC: {profile.frequentTravellerIdentifiers.tajInnerCircle}
                    </span>
                  )}
                </div>
              )}

              {/* Emergency Safeguard */}
              {emergency && emergency.name && (
                <div className="pt-1 text-[10px] font-mono text-slate-400">
                  Emergency Contact: {emergency.name} ({emergency.relation}) • {emergency.phone || 'N/A'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Shortcuts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <button
            onClick={() => {
              onClose();
              onOpenEditProfile();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full border border-gold-subtle hover:border-[#D4AF37] text-xs font-cinzel text-slate-300 hover:text-[#FCE7AC] transition-all cursor-pointer bg-slate-950/60"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>EDIT TRAVELLER PREFERENCES</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenProviders();
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 rounded-full border border-gold-subtle hover:border-[#D4AF37] text-xs font-cinzel text-slate-300 hover:text-[#FCE7AC] transition-all cursor-pointer bg-slate-950/60"
          >
            <Layers className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>MANAGE CONNECTED PROVIDERS</span>
          </button>
        </div>

        {/* Footer & Sign Out */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-500">
            SESSION: ACTIVE (SWISS 256-BIT ENCRYPTED)
          </span>

          <button
            onClick={handleSignOut}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-full border border-rose-900/60 bg-rose-950/30 hover:bg-rose-900/50 text-rose-300 text-xs font-cinzel transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>SIGN OUT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
