import React from 'react';

export type SidebarCategory = 'home' | 'flights' | 'trains' | 'stays' | 'experiences' | 'vip_services';

interface VerticalSidebarDockProps {
  activeCategory?: SidebarCategory;
  onSelectCategory?: (cat: SidebarCategory) => void;
  onPrevSlide: () => void;
  onNextSlide: () => void;
  currentSlideIndex: number;
  totalSlides: number;
}

export const VerticalSidebarDock: React.FC<VerticalSidebarDockProps> = () => {
  return null;
};
