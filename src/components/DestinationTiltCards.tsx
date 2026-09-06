import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

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
    description: 'The quintessential dream European vacation for Indian families: Bollywood Yash Chopra trails, Jungfraujoch Top of Europe, Glacier Express panoramic rail, and alpine luxury with pure veg dining.',
    subtitle: 'Iconic Yash Chopra alpine trails, Jungfraujoch Top of Europe, and scenic mountain railways.',
    villaName: 'VICTORIA-JUNGFRAU GRAND HOTEL & SPA',
    villaLocation: 'INTERLAKEN, SWITZERLAND',
    villaDescription: 'Belle Époque palace facing the Jungfrau massif with premier thermal wellness, gourmet Indian cuisine on request, and private alpine excursions.',
    coordinates: '46.6863° N, 7.8632° E',
    priceEstimate: 'From ₹82,000 / night (CHF 880)',
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    country: 'RAJASTHAN, INDIA',
    heroImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=2000&q=90',
    description: 'Rose-pink palaces, jewel-box bazaars, candlelit courtyards, and private dawn visits to Amber Fort in the Aravallis.',
    subtitle: 'The Pink City through palace doors, craft ateliers, and desert-gold evenings.',
    villaName: 'RAMBAGH PALACE & 28 KOTHI',
    villaLocation: 'C-SCHEME, JAIPUR, INDIA',
    villaDescription: 'Former royal residence with Mughal gardens, private dining terraces, and bespoke excursions through Jaipur\'s artisan quarters.',
    coordinates: '26.9124° N, 75.7873° E',
    priceEstimate: 'From ₹42,000 / night',
  },
  {
    id: 'varanasi',
    name: 'Varanasi',
    country: 'UTTAR PRADESH, INDIA',
    heroImage: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1561361058-c24cecae35ca?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=2000&q=90',
    description: 'Dawn on the Ganges, ancient ghats, silk ateliers, and intimate evenings of music and ceremony in the spiritual heart of India.',
    subtitle: 'Sacred river mornings, living music, and centuries of luminous craft.',
    villaName: 'BRIJRAMA PALACE & TAJ NADESAR PALACE',
    villaLocation: 'DARBHANGA GHAT, VARANASI, INDIA',
    villaDescription: 'Heritage stays overlooking the Ganges with private boat arrivals, curated temple walks, and classical music evenings.',
    coordinates: '25.3176° N, 82.9739° E',
    priceEstimate: 'From ₹31,000 / night',
  },
  {
    id: 'goa',
    name: 'Goa Coast',
    country: 'GOA, INDIA',
    heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&w=2000&q=90',
    description: 'Quiet palm-lined beaches, Portuguese heritage villas, spice gardens, and private sunset sails along the Konkan coast.',
    subtitle: 'Barefoot luxury, coastal kitchens, and slow afternoons beneath coconut palms.',
    villaName: 'TAJ EXOTICA RESORT & SPA GOA',
    villaLocation: 'BENAULIM, SOUTH GOA, INDIA',
    villaDescription: 'Mediterranean-inspired coastal retreat with secluded gardens, a private beach approach, and bespoke yacht charters.',
    coordinates: '15.2637° N, 73.9222° E',
    priceEstimate: 'From ₹27,500 / night',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'UNITED ARAB EMIRATES',
    heroImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1518684079-3c830dcef090?auto=format&fit=crop&w=2000&q=90',
    description: 'Skyline horizons, desert camps, old souks, and private seaplane or helicopter connections across the Gulf.',
    subtitle: 'A polished city-and-desert interlude shaped around your own pace.',
    villaName: 'BURJ AL ARAB JUMEIRAH',
    villaLocation: 'JUMEIRAH, DUBAI, UAE',
    villaDescription: 'Iconic sail-shaped suite hotel with private beach access, chauffeur service, and tailored desert expeditions.',
    coordinates: '25.1972° N, 55.2744° E',
    priceEstimate: 'From ₹95,000 / night (AED 4,200)',
  },
  {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'JAPAN',
    heroImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=2000&q=90',
    description: 'Lantern-lit machiya lanes, moss gardens, quiet tea houses, and private seasonal journeys through Japan\'s cultural capital.',
    subtitle: 'A graceful rhythm of tea, temple gardens, and intimate seasonal rituals.',
    villaName: 'AMAN KYOTO & THE RITZ-CARLTON KYOTO',
    villaLocation: 'HIGASHIYAMA, KYOTO, JAPAN',
    villaDescription: 'Forest-edge hideaway and riverside grand hotel pairing private tea ceremony, kaiseki, and temple access before opening hours.',
    coordinates: '35.0116° N, 135.7681° E',
    priceEstimate: 'From ₹78,000 / night (JPY 135,000)',
  },
  {
    id: 'santorini',
    name: 'Santorini',
    country: 'GREECE',
    heroImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=2400&q=90',
    cardImage: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=800&q=85',
    panoramaImage: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=2000&q=90',
    description: 'Volcanic cliffs, whitewashed cave suites, caldera sailing, and long blue-hour dinners above the Aegean.',
    subtitle: 'Caldera light, island vineyards, and unhurried Aegean days.',
    villaName: 'KATIKIES SANTORINI',
    villaLocation: 'OIA, SANTORINI, GREECE',
    villaDescription: 'Cliffside suite retreat with private plunge pools, sunset sailing, and a cellar-led tour of Santorini\'s volcanic vineyards.',
    coordinates: '36.4618° N, 25.3753° E',
    priceEstimate: 'From ₹64,000 / night (EUR 720)',
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
      <div 
        id="featured-destinations-header"
        className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-gold-subtle/50 text-xs font-cinzel font-semibold tracking-[0.2em] text-[#D4AF37]"
      >
        <div className="flex items-center space-x-2">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>FEATURED DESTINATIONS • BHARAT &amp; BEYOND</span>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-gold-subtle text-[10px] text-slate-400 tracking-widest font-mono">
          {FEATURED_DESTINATIONS.length} CURATED ROYAL SANCTUARIES
        </span>
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
      className={`destination-tilt-card relative min-h-[14rem] sm:min-h-[16rem] h-auto rounded-2xl overflow-hidden cursor-pointer group shadow-2xl transition-all select-none border flex flex-col justify-between ${
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

      {/* Subtle Bottom Vignette (dark mode only; stripped in light mode so full photo is 100% visible) */}
      <div className="destination-card-vignette absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

      {/* Dynamic Metallic Glare Layer */}
      <div
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-40 transition-opacity duration-300"
        style={{
          background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(252, 231, 172, 0.4) 0%, transparent 60%)`,
        }}
      />

      {/* Card Header & Country Tag in Structured Glass Box */}
      <div className="relative z-10 p-3 sm:p-3.5 w-full flex flex-col justify-start">
        <div className="p-2.5 rounded-xl bg-slate-950/85 backdrop-blur-md border border-gold-subtle/60 shadow-lg space-y-0.5 w-full">
          <h3 className="font-serif-display font-medium text-base sm:text-lg text-white tracking-wide leading-tight group-hover:text-[#F3E5AB] transition-colors break-words">
            {dest.name}
          </h3>
          <span className="text-[9px] font-cinzel font-semibold tracking-[0.16em] sm:tracking-[0.2em] text-slate-300 block break-words">
            {dest.country}
          </span>
        </div>
      </div>
    </div>
  );
};
