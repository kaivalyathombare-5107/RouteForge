import React, { useState } from 'react';
import { 
  X, 
  Plane, 
  Train, 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Flame,
  Zap
} from 'lucide-react';
import { JourneyMode } from './HeroJourneySection';
import { DestinationItem } from './DestinationTiltCards';

interface JourneySearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate: string;
  travelers: string;
  cabinClass: string;
  mode: JourneyMode;
}

interface JourneySearchResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: JourneySearchParams | null;
  destinationItem: DestinationItem;
  onSelectRecoverySolution?: (solutionName: string) => void;
}

export const JourneySearchResultsModal: React.FC<JourneySearchResultsModalProps> = ({
  isOpen,
  onClose,
  params,
  destinationItem,
  onSelectRecoverySolution,
}) => {
  const [selectedPlanIndex, setSelectedPlanIndex] = useState(0);
  const [isBooked, setIsBooked] = useState(false);

  if (!isOpen) return null;

  const originCity = params?.origin || 'JFK New York';
  const destCity = params?.destination || destinationItem.name;

  const itineraryOptions = [
    {
      id: 'opt-1',
      title: 'Ultralux Direct Flight + Private Helitransfer',
      provider: 'Emirates First Class + ReRoute Air Helo',
      time: '7h 45m Total',
      depTime: '18:30',
      arrTime: '08:15 (+1)',
      price: '$4,280',
      co2: '185 kg',
      disruptionShield: 'Auto-Reroute via Swiss First & 100% Refund Bond included',
      legs: [
        { type: 'flight', label: `${originCity} → Rome FCO`, carrier: 'Boeing 777-300ER First Suite', time: '6h 40m' },
        { type: 'transfer', label: `Rome FCO → ${destCity} Helipad`, carrier: 'Airbus H130 Luxury Helicopter', time: '45m' },
      ],
      badge: 'TOP CONCIERGE RECOMMENDATION',
    },
    {
      id: 'opt-2',
      title: 'Venice Simplon-Orient-Express + High-Speed Frecciarossa',
      provider: 'Belmond Orient Express & Trenitalia Executive',
      time: '14h 20m Scenic',
      depTime: '11:15',
      arrTime: '01:35 (+1)',
      price: '$3,650',
      co2: '28 kg (92% Lower Carbon)',
      disruptionShield: 'Guaranteed private Mercedes S-Class fallback on rail delays',
      legs: [
        { type: 'train', label: 'Grand Continental Scenic Rail', carrier: 'Belmond Orient-Express Private Cabin', time: '9h 10m' },
        { type: 'train', label: `Milano Centrale → ${destCity}`, carrier: 'Frecciarossa 1000 Executive Class', time: '3h 30m' },
      ],
      badge: 'SCENIC & SUSTAINABLE',
    },
    {
      id: 'opt-3',
      title: 'Multi-Modal Sea & Sky Panorama',
      provider: 'Air France La Première + Riva Yacht Charter',
      time: '9h 10m Total',
      depTime: '20:10',
      arrTime: '11:20 (+1)',
      price: '$5,100',
      co2: '190 kg',
      disruptionShield: 'Pre-reserved backup flight slot on Lufthansa Private Flight',
      legs: [
        { type: 'flight', label: `${originCity} → Naples International`, carrier: 'La Première A350-900', time: '7h 15m' },
        { type: 'yacht', label: `Naples Marina → ${destCity} Private Pier`, carrier: 'Riva Rivale 52ft Motor Yacht', time: '1h 15m' },
      ],
      badge: 'PRIVATE MARITIME ARRIVAL',
    },
  ];

  const handleBook = () => {
    setIsBooked(true);
    setTimeout(() => {
      setIsBooked(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl bg-[#0C0E14] border border-gold-bright shadow-2xl p-6 sm:p-8 space-y-6 my-auto">
        {/* Background glow */}
        <div className="absolute top-0 right-10 w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar */}
        <div className="flex items-start justify-between border-b border-gold-subtle/40 pb-4">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-cinzel font-semibold tracking-[0.25em] text-[#D4AF37]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>RE ROUTE CURATED ITINERARIES</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-3xl text-white font-medium mt-1">
              {originCity} <span className="text-[#D4AF37]">→</span> {destCity}
            </h2>
            <p className="text-xs font-sans-luxury text-slate-300 font-light mt-0.5">
              Dates: {params?.departDate || '24 May 2025'} — {params?.returnDate || '31 May 2025'} • {params?.travelers || '2 Adults'} • {params?.cabinClass || 'Business'}
            </p>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-900 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Itinerary Cards List */}
        <div className="space-y-4">
          {itineraryOptions.map((opt, idx) => {
            const isSelected = selectedPlanIndex === idx;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedPlanIndex(idx)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                  isSelected
                    ? 'border-gold-bright bg-gradient-to-r from-[#141822] to-[#0D0F16] shadow-xl shadow-[#D4AF37]/10'
                    : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
                }`}
              >
                {/* Badge */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-cinzel font-bold tracking-widest bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#FCE7AC]">
                    {opt.badge}
                  </span>
                  <div className="text-right">
                    <span className="font-serif-display font-medium text-2xl text-white">
                      {opt.price}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 block">per traveler</span>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  <h3 className="font-serif-display font-medium text-lg text-white">
                    {opt.title}
                  </h3>
                  <p className="text-xs font-sans-luxury text-slate-400">
                    {opt.provider} • <Clock className="w-3 h-3 inline mr-1 text-[#D4AF37]" />{opt.time} • Departure {opt.depTime}
                  </p>
                </div>

                {/* Legs breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                  {opt.legs.map((leg, lIdx) => (
                    <div key={lIdx} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs flex items-center space-x-3">
                      <div className="w-7 h-7 rounded-lg bg-slate-950 border border-gold-subtle flex items-center justify-center text-[#D4AF37]">
                        {leg.type === 'flight' ? <Plane className="w-3.5 h-3.5" /> : leg.type === 'train' ? <Train className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <span className="font-medium text-white block">{leg.label}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{leg.carrier} • {leg.time}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Disruption Shield Guarantee */}
                <div className="p-2.5 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                    <span className="font-sans-luxury font-light">{opt.disruptionShield}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#D4AF37] font-semibold">100% COVERED</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full border border-slate-700 hover:border-slate-500 text-xs font-cinzel text-slate-300"
          >
            BACK TO EXPLORE
          </button>

          <button
            onClick={handleBook}
            className="px-8 py-3 rounded-full gold-gradient-bar hover:opacity-95 text-slate-950 font-cinzel text-xs font-bold tracking-[0.2em] shadow-xl shadow-[#D4AF37]/20 flex items-center space-x-2 cursor-pointer"
          >
            {isBooked ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>CONFIRMED & PROTECTED</span>
              </>
            ) : (
              <>
                <span>RESERVE WITH CONCIERGE DISRUPTION SHIELD</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
