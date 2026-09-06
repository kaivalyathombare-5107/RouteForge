import React from 'react';
import { Headphones, ShieldCheck, Sparkles, Crown } from 'lucide-react';

interface ValuePropositionBarProps {
  onSelectFeature?: (feature: string) => void;
}

export const ValuePropositionBar: React.FC<ValuePropositionBarProps> = ({ onSelectFeature }) => {
  const pillars = [
    {
      id: 'concierge',
      title: '24/7 DEDICATED CONCIERGE',
      subtitle: 'WhatsApp desk & Pure Veg/Jain care',
      icon: <Headphones className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'guarantee',
      title: 'DGCA & IRCTC SHIELD',
      subtitle: 'Instant auto-TDR & zero-loss refunds',
      icon: <ShieldCheck className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'seamless',
      title: 'HERITAGE & ROYAL LUXURY',
      subtitle: 'Taj, Oberoi, ITC & private havelis',
      icon: <Sparkles className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'vip',
      title: 'VIP AIRPORT & LOUNGE',
      subtitle: 'T2/T3 Meet & Greet, fast-track entry',
      icon: <Crown className="w-4 h-4 stroke-[1.5]" />,
    },
  ];

  return (
    <div className="w-full rounded-2xl bg-[#090A0E]/90 border border-gold-subtle backdrop-blur-xl p-4 sm:p-5 shadow-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D4AF37]/15">
        {pillars.map((item, idx) => (
          <div
            key={item.id}
            onClick={() => onSelectFeature?.(item.id)}
            className={`flex items-center space-x-3.5 px-3 py-2.5 cursor-pointer group hover:bg-[#D4AF37]/5 rounded-xl transition-colors h-auto min-h-[64px] ${
              idx > 0 ? 'sm:pl-5' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-full border border-gold-subtle bg-slate-950/80 flex items-center justify-center text-[#D4AF37] group-hover:border-[#D4AF37] group-hover:scale-105 transition-all shadow-sm shrink-0">
              {item.icon}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-cinzel font-semibold tracking-wider text-[#FCE7AC] group-hover:text-white transition-colors break-words">
                {item.title}
              </span>
              <span className="text-xs font-sans-luxury text-slate-400 font-light break-words">
                {item.subtitle}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
