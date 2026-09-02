import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export type SidebarCategory = 'home' | 'flights' | 'trains' | 'stays' | 'experiences' | 'vip_services';

interface VerticalSidebarDockProps {
  activeCategory?: SidebarCategory;
  onSelectCategory?: (cat: SidebarCategory) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  currentSlideIndex: number;
  totalSlides: number;
}

export const VerticalSidebarDock: React.FC<VerticalSidebarDockProps> = ({
  onPrevSlide,
  onNextSlide,
}) => {
  return (
    <div className="fixed left-6 top-24 bottom-6 z-40 hidden xl:flex flex-col justify-end items-center space-y-6 pointer-events-none w-16 pb-2">
      {/* Middle: Vertical SCROLL TO EXPLORE Pill */}
      <div className="pointer-events-auto flex flex-col items-center">
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
