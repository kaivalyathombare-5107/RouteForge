import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronUp,
  ChevronLeft,
  ArrowRight,
  X
} from 'lucide-react';

interface TravelCalendarPickerProps {
  departDate: string; // Format: YYYY-MM-DD
  returnDate: string; // Format: YYYY-MM-DD or ''
  onChangeDepartDate: (date: string) => void;
  onChangeReturnDate: (date: string) => void;
  minDate?: string; // Optional minimum date (YYYY-MM-DD)
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const MONTH_NAMES_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

// Format YYYY-MM-DD into "15-Oct-2026", or "dd-----yyyy" if empty
export function formatCalendarDisplayDate(isoDate: string | undefined): string {
  if (!isoDate || isoDate.trim() === '') {
    return 'dd-----yyyy';
  }
  const parts = isoDate.split('-');
  if (parts.length !== 3) {
    return 'dd-----yyyy';
  }
  const year = parts[0];
  const monthIdx = parseInt(parts[1], 10) - 1;
  const day = parts[2].padStart(2, '0');
  const monthShort = MONTH_NAMES_SHORT[monthIdx] || 'Oct';
  return `${day}-${monthShort}-${year}`;
}

export const TravelCalendarPicker: React.FC<TravelCalendarPickerProps> = ({
  departDate,
  returnDate,
  onChangeDepartDate,
  onChangeReturnDate,
  minDate,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeField, setActiveField] = useState<'depart' | 'return'>('depart');

  // Initialize calendar view to the selected departDate month/year
  const initialParts = (departDate || '2026-10-15').split('-');
  const [viewYear, setViewYear] = useState<number>(() => parseInt(initialParts[0], 10) || 2026);
  const [viewMonth, setViewMonth] = useState<number>(() => (parseInt(initialParts[1], 10) || 10) - 1);

  const containerRef = useRef<HTMLDivElement>(null);

  // Close calendar popover on outside click
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handlePointerDown);
    }
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [isOpen]);

  // Navigate months
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  // Build the day grid for the current viewMonth / viewYear
  const calendarGrid = useMemo(() => {
    // Number of days in viewMonth
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    // Starting day of week for 1st of viewMonth (0 = Sunday, 1 = Monday ... 6 = Saturday)
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

    const blanks = Array.from({ length: firstDayOfWeek }, (_, i) => i);
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    return { blanks, days };
  }, [viewYear, viewMonth]);

  // Helper to format ISO string for a specific day
  const toIsoDate = (day: number): string => {
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${viewYear}-${mm}-${dd}`;
  };

  // Date selection handler
  const handleSelectDay = (day: number) => {
    const selectedIso = toIsoDate(day);

    if (activeField === 'depart') {
      onChangeDepartDate(selectedIso);
      // If return date is earlier than new depart date, bump return date
      if (returnDate && selectedIso > returnDate) {
        onChangeReturnDate(selectedIso);
      }
      // Automatically advance to select return date for seamless flow
      setActiveField('return');
    } else {
      // If user picks a return date earlier than depart date, set it as new depart date
      if (departDate && selectedIso < departDate) {
        onChangeDepartDate(selectedIso);
        onChangeReturnDate('');
        setActiveField('return');
      } else {
        onChangeReturnDate(selectedIso);
        setIsOpen(false);
      }
    }
  };

  const handleClearReturn = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChangeReturnDate('');
  };

  const openForField = (field: 'depart' | 'return') => {
    setActiveField(field);
    // Sync view month/year to selected date if present
    const targetDate = field === 'depart' ? departDate : (returnDate || departDate);
    if (targetDate) {
      const parts = targetDate.split('-');
      if (parts.length === 3) {
        setViewYear(parseInt(parts[0], 10));
        setViewMonth(parseInt(parts[1], 10) - 1);
      }
    }
    setIsOpen(true);
  };

  return (
    <div ref={containerRef} className="relative col-span-2 sm:col-span-2">
      {/* Dual Inputs: DEPART and RETURN (Matching Image 2) */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* DEPART BOX */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => openForField('depart')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openForField('depart'); }}
          className={`rounded-xl bg-slate-950/70 border transition-all cursor-pointer px-3.5 py-2.5 select-none ${
            isOpen && activeField === 'depart'
              ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/10'
              : 'border-slate-800 hover:border-[#D4AF37]/60'
          }`}
        >
          <div className="flex items-center justify-between text-[9px] font-cinzel font-semibold tracking-widest text-[#D4AF37]">
            <span>DEPART</span>
            <CalendarIcon className="w-3 h-3 text-[#D4AF37]" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs sm:text-sm font-semibold text-slate-100 font-sans-luxury tracking-wide">
              {formatCalendarDisplayDate(departDate)}
            </span>
            <CalendarIcon className="w-3.5 h-3.5 text-slate-500 opacity-60" />
          </div>
        </div>

        {/* RETURN BOX */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => openForField('return')}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openForField('return'); }}
          className={`rounded-xl bg-slate-950/70 border transition-all cursor-pointer px-3.5 py-2.5 select-none group relative ${
            isOpen && activeField === 'return'
              ? 'border-[#D4AF37] ring-1 ring-[#D4AF37]/50 shadow-lg shadow-[#D4AF37]/10'
              : 'border-slate-800 hover:border-[#D4AF37]/60'
          }`}
        >
          <div className="flex items-center justify-between text-[9px] font-cinzel font-semibold tracking-widest text-[#D4AF37]">
            <span>RETURN</span>
            <CalendarIcon className="w-3 h-3 text-[#D4AF37]" />
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-xs sm:text-sm font-semibold font-sans-luxury tracking-wide ${
              returnDate ? 'text-slate-100' : 'text-slate-400 font-mono'
            }`}>
              {formatCalendarDisplayDate(returnDate)}
            </span>
            {returnDate ? (
              <button
                type="button"
                onClick={handleClearReturn}
                title="Clear Return (One Way)"
                className="text-slate-400 hover:text-rose-400 transition-colors p-0.5 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <CalendarIcon className="w-3.5 h-3.5 text-slate-500 opacity-60" />
            )}
          </div>
        </div>
      </div>

      {/* Interactive Calendar Popover (Matching Image 1) */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 sm:right-auto sm:w-[330px] mt-2 z-50 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-fadeIn select-none">
          {/* Top Bar Header: "Travel Date ▴" (Matching Image 1) */}
          <div className="bg-[#EDF5FF] border-b border-blue-100 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center space-x-1 text-xs font-semibold text-slate-700">
              <span>Travel Date</span>
              <ChevronUp className="w-4 h-4 text-blue-600 stroke-[2.5]" />
            </div>

            {/* Field Switcher Pill (Depart vs Return) */}
            <div className="flex items-center bg-white/80 p-0.5 rounded-lg border border-blue-200/70 text-[10px] font-sans-luxury font-bold">
              <button
                type="button"
                onClick={() => setActiveField('depart')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeField === 'depart'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Depart
              </button>
              <button
                type="button"
                onClick={() => setActiveField('return')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  activeField === 'return'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Return
              </button>
            </div>
          </div>

          {/* Calendar Body */}
          <div className="p-4 sm:p-5">
            {/* Month & Navigation Header: e.g. "October 2026 ->" (Matching Image 1) */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                title="Previous Month"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2]" />
              </button>

              <h3 className="font-bold text-base text-slate-900 tracking-tight font-sans">
                {MONTH_NAMES_FULL[viewMonth]} {viewYear}
              </h3>

              <button
                type="button"
                onClick={handleNextMonth}
                className="w-8 h-8 rounded-full hover:bg-blue-50 flex items-center justify-center text-blue-600 hover:text-blue-700 transition-colors cursor-pointer"
                title="Next Month"
              >
                <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
              </button>
            </div>

            {/* Weekday Labels: Su Mo Tu We Th Fr Sa (Matching Image 1) */}
            <div className="grid grid-cols-7 mb-2 text-center text-xs font-semibold text-slate-400">
              {WEEKDAY_NAMES.map((w) => (
                <div key={w} className="py-1">
                  {w}
                </div>
              ))}
            </div>

            {/* Days Grid (Matching Image 1 layout for October 2026) */}
            <div className="grid grid-cols-7 gap-y-1 text-center text-sm font-medium">
              {/* Blank leading slots */}
              {calendarGrid.blanks.map((idx) => (
                <div key={`blank-${idx}`} className="h-9 w-9" />
              ))}

              {/* Month days */}
              {calendarGrid.days.map((day) => {
                const dayIso = toIsoDate(day);
                const isDepart = dayIso === departDate;
                const isReturn = dayIso === returnDate;
                const isInRange =
                  departDate &&
                  returnDate &&
                  dayIso > departDate &&
                  dayIso < returnDate;

                const isPastMin = minDate ? dayIso < minDate : false;
                const isBeforeDepart = activeField === 'return' && departDate ? dayIso < departDate : false;
                const isDisabled = isPastMin || isBeforeDepart;

                let buttonStyles = 'text-slate-800 hover:bg-blue-50 hover:text-blue-600 cursor-pointer';

                if (isDepart || isReturn) {
                  buttonStyles = 'bg-blue-600 text-white font-bold shadow-md hover:bg-blue-700 cursor-pointer';
                } else if (isInRange) {
                  buttonStyles = 'bg-blue-50 text-blue-800 font-semibold cursor-pointer';
                } else if (isDisabled) {
                  buttonStyles = 'text-slate-300 opacity-40 cursor-not-allowed';
                }

                return (
                  <div
                    key={day}
                    className={`flex items-center justify-center ${
                      isInRange ? 'bg-blue-50/60' : ''
                    }`}
                  >
                    <button
                      type="button"
                      disabled={isDisabled}
                      onClick={() => handleSelectDay(day)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center transition-all text-xs font-sans ${buttonStyles}`}
                    >
                      {day}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const year = now.getFullYear();
                  const month = String(now.getMonth() + 1).padStart(2, '0');
                  const day = String(now.getDate()).padStart(2, '0');
                  const todayIso = `${year}-${month}-${day}`;
                  if (activeField === 'depart') {
                    onChangeDepartDate(todayIso);
                    setActiveField('return');
                  } else {
                    onChangeReturnDate(todayIso);
                  }
                  setViewYear(now.getFullYear());
                  setViewMonth(now.getMonth());
                }}
                className="text-slate-600 hover:text-blue-600 font-medium cursor-pointer"
              >
                Today
              </button>

              {returnDate && (
                <>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={handleClearReturn}
                    className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                  >
                    One Way (No Return)
                  </button>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-sm transition-all cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
