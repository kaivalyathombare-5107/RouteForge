import React from 'react';
import { Plane, Train, Hotel, Ticket, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Booking, TripEdge } from '../types';

interface TripTimelineProps {
  bookings: Booking[];
  edges: TripEdge[];
  selectedBookingId?: string | null;
  onSelectBooking: (id: string) => void;
  isDisrupted: boolean;
}

export const TripTimeline: React.FC<TripTimelineProps> = ({
  bookings,
  edges,
  selectedBookingId,
  onSelectBooking,
  isDisrupted,
}) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'flight': return <Plane className="w-4 h-4" />;
      case 'train': return <Train className="w-4 h-4" />;
      case 'hotel': return <Hotel className="w-4 h-4" />;
      case 'event': return <Ticket className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono font-semibold text-slate-200 uppercase tracking-wider">
            CHRONOLOGICAL SPATIAL TIMELINE & BUFFER GAUGES
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-400">
          Click any card to focus 3D camera
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
        {bookings.map((booking, idx) => {
          const edge = edges.find(e => e.fromBookingId === booking.id);
          const isSelected = selectedBookingId === booking.id;
          const isDisruptedNode = booking.status === 'cancelled' || booking.status === 'delayed';
          const isImpactedNode = booking.status === 'impacted';

          let cardBorder = 'border-slate-800';
          let cardBg = 'bg-slate-950/70';
          if (isSelected) {
            cardBorder = 'border-cyan-500 shadow-md shadow-cyan-950/60 scale-[1.01]';
            cardBg = 'bg-cyan-950/40';
          } else if (isDisruptedNode || isImpactedNode) {
            cardBorder = 'border-red-500/50 shadow-md shadow-red-950/30';
            cardBg = 'bg-red-950/20';
          } else if (booking.status === 'recovered') {
            cardBorder = 'border-emerald-500/50';
            cardBg = 'bg-emerald-950/20';
          }

          return (
            <div
              key={booking.id}
              onClick={() => onSelectBooking(booking.id)}
              className={`p-4 rounded-xl border ${cardBorder} ${cardBg} transition-all cursor-pointer space-y-2 flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between text-xs font-mono mb-1">
                  <div className="flex items-center space-x-1.5 text-cyan-400">
                    {getIcon(booking.type)}
                    <span className="font-bold uppercase">{booking.type}</span>
                  </div>
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    isDisruptedNode || isImpactedNode ? 'bg-red-950 text-red-300 border border-red-800' :
                    booking.status === 'recovered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    'bg-slate-900 text-slate-400'
                  }`}>
                    {booking.status}
                  </span>
                </div>

                <div className="font-semibold text-slate-100 text-sm truncate">
                  {booking.title}
                </div>
                <div className="text-[11px] font-mono text-slate-400 truncate">
                  {booking.origin}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
                <span className="text-slate-300 font-semibold">{booking.departureTime}</span>
                <span className="text-slate-400">₹{booking.price}</span>
              </div>

              {/* Edge Buffer Summary */}
              {edge && (
                <div className="mt-1 pt-1.5 border-t border-slate-850 text-[10px] font-mono flex items-center justify-between">
                  <span className="text-slate-500">Transfer buffer:</span>
                  <span className={`font-bold ${
                    edge.status === 'broken' ? 'text-red-400 animate-pulse' :
                    edge.status === 'warning' ? 'text-amber-400' : 'text-emerald-400'
                  }`}>
                    {edge.status === 'broken' ? 'VIOLATED' : `${edge.actualBufferMinutes}m`}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
