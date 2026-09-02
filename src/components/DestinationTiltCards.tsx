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
    id: 'amalfi',
    name: 'Amalfi Coast',
    country: 'ITALY',
    heroImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=2000&q=90',
    description: 'Handpicked destinations, seamless travel, and unforgettable experiences crafted for you.',
    subtitle: 'Perched cliffs, pastel palazzos, and azure Tyrrhenian waters.',
    villaName: 'VILLA TRE VILLE',
    villaLocation: 'AMALFI COAST, ITALY',
    villaDescription: 'Perched above the Mediterranean with breathtaking views, infinity pools, and timeless elegance.',
    coordinates: '40.6333° N, 14.6029° E',
    priceEstimate: 'From $1,450 / night',
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'GREECE',
    heroImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=2000&q=90',
    description: 'Iconic cobalt domes perched upon volcanic calderas bathed in Aegean sunsets.',
    subtitle: 'Cycladic architecture overlooking endless azure horizons.',
    villaName: 'CANAVES OIA SUITES',
    villaLocation: 'OIA, SANTORINI, GREECE',
    villaDescription: 'Carved into the volcanic cliffside with private plunge pools and panoramic Aegean sunsets.',
    coordinates: '36.3932° N, 25.4615° E',
    priceEstimate: 'From $1,800 / night',
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'JAPAN',
    heroImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=2000&q=90',
    description: 'Ancient cedar shrines, zen stone sanctuaries, and whispering bamboo groves in twilight.',
    subtitle: 'Timeless imperial grace and Michelin kaiseki dining.',
    villaName: 'HOSHINOYA KYOTO',
    villaLocation: 'ARASHIYAMA, KYOTO, JAPAN',
    villaDescription: 'Riverside imperial pavilion reached by traditional cedar boat along the Oi River.',
    coordinates: '35.0116° N, 135.7681° E',
    priceEstimate: 'From $2,100 / night',
  },
  {
    id: 'machu_picchu',
    name: 'Machu Picchu',
    country: 'PERU',
    heroImage: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1526392060635-9d6019884377?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=2000&q=90',
    description: 'Sacred Incan citadel veiled in Andean clouds above emerald mountain terraces.',
    subtitle: 'Mystical sanctuary of the sun high above the Urubamba valley.',
    villaName: 'BELMOND SANCTUARY LODGE',
    villaLocation: 'MACHU PICCHU, PERU',
    villaDescription: 'The only luxury retreat adjacent to the ancient citadel with exclusive sunrise access.',
    coordinates: '13.1631° S, 72.5450° W',
    priceEstimate: 'From $1,950 / night',
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

      {/* Card Header & Country Tag */}
      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div className="space-y-0.5">
          <h3 className="font-serif-display font-medium text-lg sm:text-xl text-white tracking-wide leading-tight group-hover:text-[#F3E5AB] transition-colors">
            {dest.name}
          </h3>
          <span className="text-[10px] font-cinzel font-semibold tracking-[0.25em] text-slate-300 block">
            {dest.country}
          </span>
        </div>

        {/* Bottom Action Icon */}
        <div className="flex items-center justify-end">
          <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
            isSelected
              ? 'bg-[#D4AF37] text-slate-950 shadow-md shadow-[#D4AF37]/40 scale-105'
              : 'border border-gold-subtle bg-slate-950/60 text-slate-300 group-hover:bg-[#D4AF37] group-hover:text-slate-950 group-hover:border-[#D4AF37]'
          }`}>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
};
