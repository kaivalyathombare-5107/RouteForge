import React from 'react';
import { Compass, Plane, Train, Building2, Gem, Crown, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export type SidebarCategory = 'home' | 'flights' | 'trains' | 'stays' | 'experiences' | 'vip_services';

interface VerticalSidebarDockProps {
  activeCategory: SidebarCategory;
  onSelectCategory: (cat: SidebarCategory) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  currentSlideIndex: number;
  totalSlides: number;
}

export const VerticalSidebarDock: React.FC<VerticalSidebarDockProps> = ({
  activeCategory,
  onSelectCategory,
  onPrevSlide,
  onNextSlide,
  currentSlideIndex,
  totalSlides,
}) => {
  const navItems: { id: SidebarCategory; label: string; icon: React.ReactNode }[] = [
    {
      id: 'home',
      label: 'HOME',
      icon: <Compass className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'flights',
      label: 'FLIGHTS',
      icon: <Plane className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'trains',
      label: 'TRAINS',
      icon: <Train className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'stays',
      label: 'STAYS',
      icon: <Building2 className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'experiences',
      label: 'EXPERIENCES',
      icon: <Gem className="w-4 h-4 stroke-[1.5]" />,
    },
    {
      id: 'vip_services',
      label: 'VIP SERVICES',
      icon: <Crown className="w-4 h-4 stroke-[1.5]" />,
    },
  ];

  return (
    <div className="fixed left-6 top-24 bottom-6 z-40 hidden xl:flex flex-col justify-between pointer-events-none w-16">
      {/* Top Vertical Category Pill Dock */}
      <div className="pointer-events-auto rounded-2xl bg-[#090A0E]/85 backdrop-blur-xl border border-gold-subtle shadow-2xl p-2 flex flex-col items-center space-y-3">
        {navItems.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectCategory(item.id)}
              className={`w-12 py-2.5 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer group relative ${
                isActive
                  ? 'bg-gradient-to-b from-[#D4AF37]/25 to-slate-950 text-[#FCE7AC] border border-gold-bright shadow-lg shadow-[#D4AF37]/15'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <div className={`transition-transform group-hover:scale-110 ${isActive ? 'text-[#D4AF37]' : 'text-slate-400'}`}>
                {item.icon}
              </div>
              <span className={`text-[8px] font-cinzel font-semibold tracking-wider mt-1.5 leading-tight ${isActive ? 'text-[#FCE7AC]' : 'text-slate-400'}`}>
                {item.label}
              </span>

              {/* Active gold dot indicator */}
              {isActive && (
                <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-[#D4AF37] shadow-sm shadow-[#D4AF37]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Middle: Vertical SCROLL TO EXPLORE Pill */}
      <div className="pointer-events-auto my-auto flex flex-col items-center">
        <div className="px-2 py-4 rounded-full bg-[#090A0E]/70 border border-gold-subtle backdrop-blur-md flex flex-col items-center space-y-3">
          <span
            className="text-[9px] font-cinzel font-medium text-slate-400 tracking-[0.25em] uppercase [writing-mode:vertical-lr] rotate-180 select-none"
          >
            SCROLL TO EXPLORE
          </span>
          <div className="w-[1.5px] h-10 bg-gradient-to-b from-[#D4AF37] via-[#FCE7AC] to-transparent animate-pulse" />
        </div>
      </div>

      {/* Bottom: Carousel Arrow Controls */}
      <div className="pointer-events-auto flex items-center space-x-2">
        <button
          onClick={onPrevSlide}
          className="w-8 h-8 rounded-full bg-slate-950/80 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer shadow-lg"
          title="Previous Destination"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onNextSlide}
          className="w-8 h-8 rounded-full bg-slate-950/80 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-900 transition-all cursor-pointer shadow-lg"
          title="Next Destination"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
