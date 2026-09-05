// src/types/journey.ts
import { ProviderId, ProviderSourceType } from '../lib/providers/types';
import { JourneyMode } from '../components/HeroJourneySection';

export interface JourneySearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  travelers?: string | number;
  cabinClass?: string;
  mode?: JourneyMode;
  budgetTier?: 'STANDARD' | 'PREMIUM' | 'LUXURY_ROYAL';
}

export interface NormalizedPolicy {
  refundable?: boolean;
  terms: string;
  allowed?: boolean;
  penaltyAmount?: number;
  freeCancellationUntil?: string;
}

export interface NormalizedTransportOption {
  id: string;
  provider: ProviderId;
  providerReference: string;
  transportType: 'flight' | 'train' | 'bus';
  operator: string;
  serviceNumber: string; // Flight number (e.g. AI-887) or Train number (e.g. 22436)
  origin: {
    name: string;
    code: string;
    terminal?: string;
  };
  destination: {
    name: string;
    code: string;
    terminal?: string;
  };
  departureTime: string;
  arrivalTime: string;
  duration: string;
  durationMinutes: number;
  price: number;
  currency: string;
  availability: {
    status: string; // e.g. 'AVAILABLE-0042', 'CONFIRMED (92%)', 'RAC'
    seatsLeft?: number;
    isWaitlist?: boolean;
  };
  baggage: {
    cabin: string;
    checkIn: string;
  };
  seatClass: string;
  cancellationPolicy: NormalizedPolicy;
  modificationPolicy: NormalizedPolicy;
  source: ProviderSourceType;
  verifiedAt: string;
  expiresAt: string;
  deepLink?: string;
}

export interface NormalizedTransferOption {
  id: string;
  provider: ProviderId;
  providerReference: string;
  serviceType: string;
  vehicleModel: string;
  pickup: string;
  dropoff: string;
  estimatedDuration: string;
  durationMinutes: number;
  price: number;
  currency: string;
  guaranteedBufferMinutes: number;
  source: ProviderSourceType;
  verifiedAt: string;
  deepLink?: string;
}

export interface NormalizedStayOption {
  id: string;
  provider: ProviderId;
  providerReference: string;
  hotelName: string;
  location: string;
  roomType: string;
  pricePerNight: number;
  currency: string;
  checkInTime: string;
  checkOutTime: string;
  rating: number;
  amenities: string[];
  cancellationPolicy: NormalizedPolicy;
  source: ProviderSourceType;
  verifiedAt: string;
  deepLink?: string;
}

export interface NormalizedJourneyLeg {
  id: string;
  type: 'flight' | 'train' | 'bus' | 'transfer' | 'car' | 'stay';
  label: string;
  carrier: string;
  time: string;
  depTime: string;
  arrTime: string;
  provider: ProviderId;
  sourceType: ProviderSourceType;
  seatClass?: string;
  provenance: {
    source: string;
    verifiedAt: string;
  };
  bookingReference?: string;
  rawDetails?: any;
}

export type JourneyPlanCategory = 
  | 'FASTEST' 
  | 'CHEAPEST' 
  | 'BEST_BALANCE' 
  | 'MOST_FLEXIBLE' 
  | 'PREMIUM_RAIL' 
  | 'COMFORT_BUS' 
  | 'DOOR_TO_DOOR_CAB' 
  | 'MULTIMODAL_LUXURY' 
  | string;

export interface JourneyPlanOption {
  id: string;
  category: JourneyPlanCategory;
  title: string;
  providerSummary: string;
  totalDuration: string;
  durationMinutes: number;
  depTime: string;
  arrTime: string;
  totalPrice: number;
  currency: string;
  priceFormatted: string;
  co2: string;
  disruptionShield: string;
  badge: string;
  legs: NormalizedJourneyLeg[];
  provenance: {
    source: ProviderSourceType;
    verifiedAt: string;
    expiresAt: string;
    apiEndpoint?: string;
    confidenceScore: number;
  };
  explanation: string;
  bookingMethods: ('OFFICIAL_PARTNER' | 'DIRECT_API' | 'DEEP_LINK' | 'CONCIERGE_DESK')[];
}

export interface JourneySearchResponse {
  success: boolean;
  query: JourneySearchParams;
  plans: JourneyPlanOption[];
  meta: {
    providersQueried: string[];
    totalOptionsNormalized: number;
    latencyMs: number;
    timestamp: string;
  };
  error?: string;
}
