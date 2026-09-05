// src/components/BookingOptionsModal.tsx
import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  ExternalLink, 
  CreditCard, 
  Zap, 
  CheckCircle2, 
  ArrowRight, 
  Lock, 
  FileText, 
  Clock, 
  Sparkles,
  Luggage,
  Building2,
  AlertCircle
} from 'lucide-react';
import { JourneyPlanOption } from '../types/journey';
import { createBookingIntent, createBooking } from '../lib/api/bookings';
import { useAuth } from '../hooks/useAuth';

interface BookingOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan: JourneyPlanOption | null;
  onBookingSuccess?: (booking: any) => void;
}

export const BookingOptionsModal: React.FC<BookingOptionsModalProps> = ({
  isOpen,
  onClose,
  plan,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const [selectedMethodIndex, setSelectedMethodIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !plan) return null;

  // 2-3 actual booking options conforming to Section 8
  const bookingFulfillmentOptions = [
    {
      id: 'opt_partner',
      method: 'OFFICIAL_PARTNER' as const,
      name: 'MakeMyTrip Official Partner API & Concierge Shield',
      provider: 'MakeMyTrip Bharat GDS',
      price: plan.totalPrice,
      gst: Math.round(plan.totalPrice * 0.05),
      conciergeShieldFee: 450,
      totalPayable: plan.totalPrice + Math.round(plan.totalPrice * 0.05) + 450,
      badge: 'RECOMMENDED • AUTOMATED STATUTORY REFUND SHIELD',
      description: 'Direct API reservation through certified MakeMyTrip Corporate Aviation GDS token bridge.',
      features: [
        'Pre-filled passenger identity & seat preference from Profile',
        'Automatic DGCA CAR Section 3 statutory refund filing on delay > 2h',
        'Direct digital ticket & airline PNR issued into Booking Vault',
      ],
      icon: ShieldCheck,
      accentColor: 'border-[#D4AF37] bg-gradient-to-r from-[#171B26] to-[#0E1118]',
    },
    {
      id: 'opt_direct_api',
      method: 'DIRECT_API' as const,
      name: 'MakeMyTrip MyBiz Corporate Instant Reserve',
      provider: 'MakeMyTrip Corporate Engine',
      price: plan.totalPrice,
      gst: Math.round(plan.totalPrice * 0.05),
      conciergeShieldFee: 0,
      totalPayable: plan.totalPrice + Math.round(plan.totalPrice * 0.05),
      badge: 'DIRECT INTEGRATION • ZERO MARKUP',
      description: 'Zero-intermediary reservation dispatched directly into MakeMyTrip corporate inventory.',
      features: [
        'Instant airline PNR & e-ticket generation with GST corporate invoice',
        'Free corporate date change up to 24h before departure',
        'Real-time flight radar telemetry synchronized with RouteForge Trip Graph',
      ],
      icon: Zap,
      accentColor: 'border-cyan-500/50 bg-slate-950/80',
    },
    {
      id: 'opt_deep_link',
      method: 'DEEP_LINK' as const,
      name: 'MakeMyTrip Verified Deep Link Checkout',
      provider: 'MakeMyTrip Official Portal',
      price: plan.totalPrice,
      gst: 0,
      conciergeShieldFee: 0,
      totalPayable: plan.totalPrice,
      badge: 'HONEST PROVENANCE',
      description: 'Redirects directly to MakeMyTrip flight checkout. Parameters prefilled where officially supported.',
      features: [
        'Authentic MakeMyTrip checkout with official airline rates & bank offers',
        'Intent logged in RouteForge Booking Vault before redirect',
        'Pre-populated origin, destination, travel date & passenger count',
      ],
      icon: ExternalLink,
      accentColor: 'border-slate-700 bg-slate-950/80',
    },
  ];

  const activeOption = bookingFulfillmentOptions[selectedMethodIndex] || bookingFulfillmentOptions[0];

  const handleExecuteBooking = async () => {
    if (!user) {
      setError('Please sign in to confirm and persist your booking in the Vault.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const idToken = await user.getIdToken();

      // Step 1: Create Booking Intent (Section 9)
      const intentRes = await createBookingIntent(
        {
          journeyId: plan.id,
          provider: plan.providerSummary,
          selectedOption: plan,
          providerReference: plan.legs[0]?.bookingReference,
          bookingMethod: activeOption.method,
          requestedParameters: {
            title: plan.title,
            legs: plan.legs,
            totalPrice: activeOption.totalPayable,
          },
        },
        idToken,
        user.uid
      );

      // If deep-link: open in new tab
      if (activeOption.method === 'DEEP_LINK' && intentRes.deepLinkUrl) {
        window.open(intentRes.deepLinkUrl, '_blank', 'noopener,noreferrer');
      }

      // Step 2: Post-Booking Vault Persistence (Section 10)
      const bookingRes = await createBooking(
        {
          intentId: intentRes.intentId,
          provider: plan.providerSummary,
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
        setConfirmedBooking(bookingRes.booking);
        onBookingSuccess?.(bookingRes.booking);
      }
    } catch (err: any) {
      console.error('[BookingOptions] Execution error:', err);
      setError(err.message || 'Failed to process booking intent.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-3xl bg-[#0C0E14] border border-gold-bright shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        {/* Glow */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-gold-subtle/40 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>BOOKING FULFILLMENT MATRIX (SECTION 8)</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-white font-medium mt-1">
              Select Booking Method
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

        {/* Confirmed Booking State */}
        {confirmedBooking ? (
          <div className="p-8 rounded-2xl bg-[#121620] border border-emerald-500/50 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-emerald-950/80 border border-emerald-500 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-mono px-3 py-1 rounded bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 font-semibold uppercase tracking-widest">
                PERSISTED IN BOOKING VAULT (SECTION 10)
              </span>
              <h3 className="font-serif-display text-2xl text-white mt-2">
                Booking Confirmed &amp; Protected
              </h3>
              <p className="text-xs font-mono text-[#D4AF37]">
                PNR REFERENCE: <span className="font-bold text-lg text-white">{confirmedBooking.bookingReference}</span>
              </p>
              <p className="text-xs font-sans-luxury text-slate-400 max-w-md mx-auto">
                All segments have been committed to the RouteForge Trip Graph with real-time disruption monitoring.
              </p>
            </div>

            <div className="pt-3">
              <button
                onClick={onClose}
                className="px-8 py-3 rounded-full gold-gradient-bar text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] shadow-xl hover:opacity-95 cursor-pointer"
              >
                RETURN TO TRIP COMMAND CENTER
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Error Banner */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800/60 text-xs text-rose-200 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Options Selector Cards */}
            <div className="space-y-3">
              {bookingFulfillmentOptions.map((opt, idx) => {
                const isSelected = selectedMethodIndex === idx;
                const Icon = opt.icon;
                return (
                  <div
                    key={opt.id}
                    onClick={() => setSelectedMethodIndex(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative ${
                      isSelected
                        ? 'border-gold-bright bg-gradient-to-r from-[#171B26] to-[#0D1017] shadow-lg shadow-[#D4AF37]/10'
                        : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-[#D4AF37]/20 text-[#FCE7AC] border border-[#D4AF37]/40' : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}>
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
                              <li key={fIdx} className="text-[11px] font-sans-luxury text-slate-300 flex items-center space-x-1.5">
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
                        <span className="text-[10px] font-mono text-slate-400 block">incl. taxes &amp; fees</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Price Transparency Breakdown (Section 8) */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-400">
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

            {/* Actions */}
            <div className="pt-2 flex items-center justify-between">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full border border-slate-700 hover:border-slate-500 text-xs font-cinzel text-slate-300 cursor-pointer"
              >
                CANCEL
              </button>

              <button
                onClick={handleExecuteBooking}
                disabled={isProcessing}
                className="px-8 py-3 rounded-full gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] shadow-xl shadow-[#D4AF37]/20 flex items-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-slate-950/40 border-t-slate-950 rounded-full animate-spin" />
                    <span>REGISTERING INTENT IN VAULT...</span>
                  </>
                ) : (
                  <>
                    <span>CONFIRM &amp; DISPATCH BOOKING INTENT</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
