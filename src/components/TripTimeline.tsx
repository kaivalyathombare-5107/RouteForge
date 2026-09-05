import React, { useEffect, useRef, useState } from 'react';
import { Plane, Train, Hotel, Ticket, Clock, Plus, RotateCcw, Sparkles } from 'lucide-react';
import { Booking, TripEdge } from '../types';
import { TiltCard } from './TiltCard';

interface TripTimelineProps {
  bookings: Booking[];
  edges: TripEdge[];
  selectedBookingId?: string | null;
  onSelectBooking: (id: string) => void;
  onAddPlan: () => void;
  onResetTimeline: () => void;
  isReset: boolean;
  isDisrupted: boolean;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({
  bookings,
  edges,
  selectedBookingId,
  onSelectBooking,
  onAddPlan,
  onResetTimeline,
  isReset,
  isDisrupted,
}) => {
  const [journeys, setJourneys] = useState<Array<{ id: string; label: string; bookings: Booking[] }>>([
    { id: 'journey-1', label: 'JOURNEY 01', bookings: isReset ? [] : bookings },
  ]);
  const [activeJourneyId, setActiveJourneyId] = useState('journey-1');
  const previousBookingsRef = useRef(bookings);
  const activeJourney = journeys.find((journey) => journey.id === activeJourneyId) || journeys[0];
  const activeBookings = activeJourney?.bookings || [];
  const activeBookingIds = new Set(activeBookings.map((booking) => booking.id));
  const activeEdges = edges.filter(
    (edge) => activeBookingIds.has(edge.fromBookingId) && activeBookingIds.has(edge.toBookingId)
  );

  useEffect(() => {
    if (isReset) {
      setJourneys([{ id: 'journey-1', label: 'JOURNEY 01', bookings: [] }]);
      setActiveJourneyId('journey-1');
      return;
    }

    if (previousBookingsRef.current !== bookings) {
      setJourneys((current) => current.map((journey, index) => (
        index === 0 ? { ...journey, bookings } : journey
      )));
      previousBookingsRef.current = bookings;
    }
  }, [bookings, isReset]);

  const resetJourney = () => {
    setJourneys([{ id: 'journey-1', label: 'JOURNEY 01', bookings: [] }]);
    setActiveJourneyId('journey-1');
    onSelectBooking('');
    onResetTimeline();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-3.5 h-3.5 text-[#D4AF37]" />;
      case 'train': return <Train className="w-3.5 h-3.5 text-[#E5C07B]" />;
      case 'hotel': return <Hotel className="w-3.5 h-3.5 text-[#F3E5AB]" />;
      case 'event': return <Ticket className="w-3.5 h-3.5 text-[#C5A880]" />;
      default: return <Clock className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  return (
    <div id="chronological-spatial-timeline" className="w-full p-5 sm:p-6 rounded-2xl bg-slate-950/85 border border-gold-subtle backdrop-blur-xl space-y-4 shadow-xl">
      <div className="flex flex-col gap-3 border-b border-gold-subtle pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <span className="text-xs font-cinzel font-semibold text-[#FCE7AC] uppercase tracking-wider">
            CHRONOLOGICAL SPATIAL TIMELINE & BUFFER GAUGES
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddPlan}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold-subtle px-2.5 py-1.5 text-[10px] font-cinzel font-semibold tracking-wider text-[#FCE7AC] transition-colors hover:border-gold-bright hover:bg-[#D4AF37]/10"
            title="Plan a new journey"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>ADD PLAN</span>
          </button>
          <button
            type="button"
            onClick={resetJourney}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-1.5 text-[10px] font-cinzel font-semibold tracking-wider text-slate-400 transition-colors hover:border-rose-400 hover:text-rose-300"
            title="Reset active journey"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {journeys.map((journey) => (
          <button
            key={journey.id}
            type="button"
            onClick={() => setActiveJourneyId(journey.id)}
            className={`rounded-lg border px-3 py-1.5 text-[10px] font-cinzel font-semibold tracking-wider transition-colors ${
              journey.id === activeJourneyId
                ? 'border-gold-bright bg-[#D4AF37]/15 text-[#FCE7AC]'
                : 'border-slate-700 text-slate-400 hover:border-gold-subtle hover:text-slate-200'
            }`}
          >
            {journey.label} ({journey.bookings.length})
          </button>
        ))}
        <span className="ml-auto text-[10px] font-sans-luxury text-slate-400">
          Click any card to orbit 3D camera
        </span>
      </div>

      {activeBookings.length === 0 ? (
        <button
          type="button"
          onClick={onAddPlan}
          className="flex min-h-44 w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gold-subtle bg-slate-950/40 text-[#FCE7AC] transition-colors hover:border-gold-bright hover:bg-[#D4AF37]/10"
          title="Plan a new journey"
        >
          <Plus className="h-8 w-8" />
          <span className="font-cinzel text-xs font-semibold tracking-wider">ADD PLAN</span>
          <span className="text-[11px] text-slate-400">Plan a new journey from the journey planner</span>
        </button>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5 relative">
        {activeBookings.map((booking) => {
          const edge = activeEdges.find(e => e.fromBookingId === booking.id);
          const isSelected = selectedBookingId === booking.id;
          const isDisruptedNode = booking.status === 'cancelled' || booking.status === 'delayed';
          const isImpactedNode = booking.status === 'impacted';

          let cardBorder = 'border-gold-subtle';
          let cardBg = 'bg-slate-950/60';
          if (isSelected) {
            cardBorder = 'border-gold-bright shadow-lg shadow-[#D4AF37]/15 scale-[1.01]';
            cardBg = 'bg-gradient-to-b from-[#D4AF37]/20 to-slate-950';
          } else if (isDisruptedNode || isImpactedNode) {
            cardBorder = 'border-rose-500/50 shadow-md shadow-rose-950/30';
            cardBg = 'bg-rose-950/20';
          } else if (booking.status === 'recovered') {
            cardBorder = 'border-emerald-500/50';
            cardBg = 'bg-emerald-950/20';
          }

          return (
            <TiltCard
              key={booking.id}
              maxTilt={8}
              onClick={() => onSelectBooking(booking.id)}
              className={`p-4 rounded-xl border ${cardBorder} ${cardBg} transition-all cursor-pointer space-y-2 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-cinzel mb-1.5">
                  <div className="flex items-center space-x-1.5 text-[#D4AF37]">
                    {getIcon(booking.type)}
                    <span className="font-bold uppercase tracking-wider">{booking.type}</span>
                  </div>
                  <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    isDisruptedNode || isImpactedNode ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                    booking.status === 'recovered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-slate-900 text-[#E5C07B] border border-gold-subtle'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <div className="font-serif-display font-bold text-slate-100 text-sm truncate">
                  {booking.title}
                </div>
                <div className="text-[11px] font-sans-luxury text-slate-400 truncate mt-0.5">
                  {booking.origin}
                </div>
              </div>

              <div className="pt-2 border-t border-gold-subtle flex items-center justify-between text-xs font-mono">
                <span className="text-[#F3E5AB] font-semibold">{booking.departureTime}</span>
                <span className="text-slate-300 font-serif-display font-bold">₹{booking.price.toLocaleString('en-IN')}</span>
              </div>

              {/* Edge Buffer Summary */}
              {edge && (
                <div className="mt-1 pt-1.5 border-t border-slate-900 text-[10px] font-mono flex items-center justify-between">
                  <span className="text-slate-500">Transit buffer:</span>
                  <span className={`font-bold ${
                    edge.status === 'broken' ? 'text-rose-400 animate-pulse' :
                    edge.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {edge.status === 'broken' ? 'CRITICAL (-90m)' : `${edge.actualBufferMinutes}m window`}
                  </span>
                </div>
              )}
            </TiltCard>
          );
        })}
        </div>
      )}
    </div>
  );
};
