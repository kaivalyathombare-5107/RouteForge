import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';

export interface DestinationItem {
  id: string;
  name: string;
  country: string;
  heroImage: string;
  cardImage: string;
  panoramaImage: string;
  description: string;
  subtitle: string;
  villaName: string;
  villaLocation: string;
  villaDescription: string;
  coordinates: string;
  priceEstimate: string;
}

export const FEATURED_DESTINATIONS: DestinationItem[] = [
  {
    id: 'udaipur',
    name: 'Udaipur',
    country: 'RAJASTHAN, INDIA',
    heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=90',
    description: 'Floating marble palaces, sun-drenched Aravali hills, royal Mewari courtyards, and sunset boat rides on Lake Pichola.',
    subtitle: 'Timeless Mewar heritage and royal hospitality on Lake Pichola.',
    villaName: 'TAJ LAKE PALACE & OBEROI UDAIVILAS',
    villaLocation: 'LAKE PICHOLA, UDAIPUR, INDIA',
    villaDescription: '18th-century white marble palace floating in serene waters, reached by royal boat with 24/7 private butler and Jharokha views.',
    coordinates: '24.5764° N, 73.6806° E',
    priceEstimate: 'From ₹48,000 / night',
  },
  {
    id: 'kashmir',
    name: 'Kashmir & Gulmarg',
    country: 'JAMMU & KASHMIR, INDIA',
    heroImage: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=90',
    description: 'Paradise on Earth: snow-capped Apharwat peaks, world-class ski gondolas, fragrant pine valleys, and Dal Lake luxury houseboats.',
    subtitle: 'Alpine powder snow, luxury pine chalets, and saffron kehwa.',
    villaName: 'THE KHYBER HIMALAYAN RESORT & SPA',
    villaLocation: 'GULMARG, KASHMIR, INDIA',
    villaDescription: 'Premier luxury Himalayan chalet at 8,825 ft overlooking Apharwat Peak with heated indoor glass-clad pool and L\'Occitane spa.',
    coordinates: '34.0484° N, 74.3805° E',
    priceEstimate: 'From ₹38,500 / night',
  },
  {
    id: 'kerala',
    name: 'Kerala Backwaters',
    country: 'KERALA, INDIA',
    heroImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=90',
    description: 'Palm-fringed tranquil lagoons, private luxury Kettuvallam houseboats, emerald Munnar tea hills, and authentic Ayurvedic rejuvenation.',
    subtitle: 'God\'s Own Country: slow living along Vembanad Lake & spice gardens.',
    villaName: 'KUMARAKOM LAKE RESORT & MEANDER SUITES',
    villaLocation: 'KUMARAKOM, KERALA, INDIA',
    villaDescription: '16th-century recreated heritage manas with direct private meandering pool access, traditional Panchakarma, and sunset cruises.',
    coordinates: '9.6175° N, 76.4300° E',
    priceEstimate: 'From ₹29,500 / night',
  },
  {
    id: 'switzerland',
    name: 'Swiss Alps (Interlaken)',
    country: 'SWITZERLAND',
    heroImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=90',
    description: 'The quintessential dream European vacation: Jungfraujoch Top of Europe, Glacier Express panoramic rail, crystal lakes, and alpine luxury.',
    subtitle: 'Iconic alpine peaks, Swiss chocolate ateliers, and mountain railways.',
    villaName: 'VICTORIA-JUNGFRAU GRAND HOTEL & SPA',
    villaLocation: 'INTERLAKEN, SWITZERLAND',
    villaDescription: 'Belle Époque palace facing the Jungfrau massif with premier thermal wellness, gourmet dining, and private alpine excursions.',
    coordinates: '46.6863° N, 7.8632° E',
    priceEstimate: 'From ₹82,000 / night (CHF 880)',
  },
];

interface DestinationTiltCardsProps {
  selectedDestinationId: string;
  onSelectDestination: (dest: DestinationItem) => void;
  reducedMotion?: boolean;
}

export const DestinationTiltCards: React.FC<DestinationTiltCardsProps> = ({
  selectedDestinationId,
  onSelectDestination,
  reducedMotion = false,
}) => {
  return (
    <div className="w-full space-y-3">
      <div className="flex items-center space-x-2 text-xs font-cinzel font-semibold tracking-[0.2em] text-[#D4AF37]">
        <span>FEATURED DESTINATIONS</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {FEATURED_DESTINATIONS.map((dest) => (
          <SingleDestinationCard
            key={dest.id}
            dest={dest}
            isSelected={selectedDestinationId === dest.id}
            onClick={() => onSelectDestination(dest)}
            reducedMotion={reducedMotion}
          />
        ))}
      </div>
    </div>
  );
};

const SingleDestinationCard: React.FC<{
  dest: DestinationItem;
  isSelected: boolean;
  onClick: () => void;
  reducedMotion: boolean;
}> = ({ dest, isSelected, onClick, reducedMotion }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, glareX: 50, glareY: 50 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (reducedMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = -((y - centerY) / centerY) * 10;
    const rotateY = ((x - centerX) / centerX) * 10;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ x: rotateX, y: rotateY, glareX, glareY });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0, glareX: 50, glareY: 50 });
  };

  return (
    <div
      ref={cardRef}
      onClick={onClick}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: tilt.x === 0 ? 'transform 0.4s ease-out' : 'none',
      }}
      className={`relative h-56 sm:h-64 rounded-2xl overflow-hidden cursor-pointer group shadow-2xl transition-all select-none border ${
        isSelected
          ? 'border-gold-bright ring-1 ring-[#D4AF37]/50 shadow-gold-glow scale-[1.02]'
          : 'border-gold-subtle hover:border-[#D4AF37]/60'
      }`}
    >
      {/* Background Image with subtle zoom */}
      <img
        src={dest.cardImage}
        alt={dest.name}
        referrerPolicy="no-referrer"
        className="absolute inset-0 w-full h-full object-cover object-center transform group-hover:scale-110 transition-transform duration-700 ease-out"
      />

      {/* Dark Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#08090C] via-[#08090C]/30 to-transparent" />

      {/* Dynamic Metallic Glare Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(252, 231, 172, 0.4) 0%, transparent 60%)`,
        }}
      />

      {/* Card Header & Country Tag in Structured Glass Box */}
      <div className="relative z-10 p-3 sm:p-3.5 h-full flex flex-col justify-between">
        <div className="p-2.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-gold-subtle/60 shadow-lg space-y-0.5">
          <h3 className="font-serif-display font-medium text-base sm:text-lg text-white tracking-wide leading-tight group-hover:text-[#F3E5AB] transition-colors">
            {dest.name}
          </h3>
          <span className="text-[9px] font-cinzel font-semibold tracking-[0.2em] text-slate-300 block truncate">
            {dest.country}
          </span>
        </div>

        {/* Bottom Price Tag Box and Action Icon */}
        <div className="flex items-center justify-between pt-2">
          <div className="px-2 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-gold-subtle/60 text-[10px] font-sans-luxury text-[#FCE7AC] font-medium shadow-md">
            {dest.priceEstimate.split(' ')[1] || dest.priceEstimate}
          </div>
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/40 scale-105'
              : 'border border-gold-subtle bg-slate-950/80 text-slate-300 group-hover:bg-[#D4AF37] group-hover:text-slate-950 group-hover:border-[#D4AF37]'
          }`}>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
