export type BookingType = 'flight' | 'train' | 'hotel' | 'event' | 'bus' | 'transfer';

export type BookingStatus = 
  | 'normal' 
  | 'delayed' 
  | 'cancelled' 
  | 'at_risk' 
  | 'impacted' 
  | 'missed' 
  | 'requires_action' 
  | 'recovered';

export type DisruptionScenarioType = 
  | 'flight_delay_90'
  | 'flight_cancel'
  | 'missed_connection'
  | 'train_cancel'
  | 'hotel_cancel'
  | 'activity_cancel'
  | 'transfer_failure'
  | 'weather_disruption'
  | 'traveler_change';

export type DependencyStatus = 'safe' | 'warning' | 'critical' | 'broken';

export interface Location3D {
  city: string;
  venue: string;
  code: string;
  x: number; // 3D coordinates for spatial graph
  y: number;
  z: number;
}

export interface PolicyDetails {
  ruleId: string;
  policyVersion: string;
  cancellationCutoffHours: number;
  baseDeduction: number;
  percentageDeduction: number;
  tdrEligible: boolean;
  tdrWindowHours: number;
  termsSummary: string;
}

export interface Booking {
  id: string;
  type: BookingType;
  provider: string;
  providerCode: string;
  title: string;
  referenceCode: string; // PNR, Ticket No, Booking ID
  seatOrRoom?: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  departureTimestamp: number; // epoch ms
  arrivalTimestamp: number;
  price: number; // INR
  currency: string;
  status: BookingStatus;
  location: Location3D;
  riskLevel: 'none' | 'low' | 'medium' | 'high' | 'critical';
  delayMinutes: number;
  downstreamImpactIds: string[];
  cancellationReason?: string;
  lastVerifiedAt: string;
  isImportedStatus: boolean;
  policy: PolicyDetails;
  notes?: string;
}

export interface TripEdge {
  id: string;
  fromBookingId: string;
  toBookingId: string;
  minimumBufferMinutes: number;
  actualBufferMinutes: number;
  transferTimeMinutes: number;
  dependencyType: 'tight_transfer' | 'checkin_window' | 'event_curfew' | 'connecting_service';
  status: DependencyStatus;
  bufferWarningThresholdMinutes: number;
}

export interface DisruptionEvent {
  id: string;
  bookingId: string;
  type: 'delay' | 'cancellation' | 'diversion' | 'short_termination';
  severity: 'low' | 'medium' | 'high' | 'critical';
  delayMinutes: number;
  timestamp: string;
  source: 'IRCTC_TELEMETRY' | 'DGCA_NOTAM' | 'AIRLINE_FEED' | 'SIMULATION';
  title: string;
  description: string;
  affectedBookingIds: string[];
}

export type PriorityPreference = 
  | 'fastest' 
  | 'cheapest' 
  | 'fewest_changes' 
  | 'maximum_flexibility' 
  | 'comfort';

export interface UserPreferences {
  priority: PriorityPreference;
  maxBudget: number;
  maxAcceptableDelayMinutes: number;
  preferredProvider: string;
  requireFullRefundability: boolean;
}

export interface RecoveryStep {
  id: string;
  action: 'cancel_existing' | 'book_alternative' | 'modify_checkin' | 'request_tdr';
  title: string;
  provider: string;
  timing: string;
  estimatedCostOrRefund: number; // positive = cost, negative = refund
  details: string;
}

export interface RecoveryOption {
  id: string;
  title: string;
  strategy: string;
  description: string;
  tags: string[];
  newArrivalTimestamp: number;
  arrivalDeltaMinutes: number; // e.g. -20 = 20 mins earlier, +180 = 3h delay
  additionalCost: number; // INR
  refundRecoveryAmount: number; // INR
  netFinancialImpact: number; // additionalCost - refundRecoveryAmount
  provider: string;
  changesSummary: string;
  steps: RecoveryStep[];
  matchReason: string;
  score: number; // 0 - 100
  feasibility: 'feasible' | 'tight' | 'infeasible';
  color: string;
  replacementBookings: Partial<Booking>[];
  branchWaypoints: [number, number, number][]; // 3D coordinates for spatial alternative route
  // Recovery comparison metrics
  numberOfChanges: number;
  affectedBookingsCount: number;
  totalJourneyCost: number;
  travelDurationString: string;
  convenienceRating: 'High' | 'Very High' | 'Executive VIP';
  riskLevel: 'Minimal' | 'Low' | 'Moderate';
  recommendationReason: string;
  preservedBookings: string[];
  cancelledBookingIds: string[];
}

export interface ItineraryHistoryEntry {
  id: string;
  timestamp: string;
  eventType: 
    | 'booked' 
    | 'delay_detected' 
    | 'cancellation' 
    | 'missed_connection' 
    | 'at_risk_warning' 
    | 'recovery_generated' 
    | 'recovery_selected' 
    | 'rebooked' 
    | 'postponed' 
    | 'refund_requested' 
    | 'refund_settled';
  title: string;
  description: string;
  bookingId?: string;
  previousStatus?: string;
  newStatus?: string;
  financialImpact?: string;
  badgeColor?: string;
}

export interface ProactiveWarning {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  recommendation: string;
  bookingId?: string;
  edgeId?: string;
  bufferRemainingMinutes?: number;
  timestamp: string;
}

export interface RefundBreakdown {
  baseFare: number;
  clerkageFee: number;
  cancellationCharges: number;
  gstAdjustment: number;
  agentConvenienceFeeDeducted: number;
}

export interface RefundCase {
  id: string;
  bookingId: string;
  bookingTitle: string;
  provider: string;
  bookingType: BookingType;
  ticketAmount: number;
  estimatedRefund: number;
  deductionAmount: number;
  tdrRequired: boolean;
  tdrReasonCode?: string;
  tdrWindowDescription?: string;
  ruleId: string;
  policyVersion: string;
  status: 'eligible' | 'processing' | 'approved' | 'settled' | 'not_eligible';
  deterministicReason: string;
  aiExplanation: string;
  breakdown: RefundBreakdown;
  timestamp: string;
  verifiedSource: 'IRCTC_PRSN_V2' | 'GDS_AMADEUS' | 'AIRLINE_DIRECT';
  isImportedStatus: boolean;
}

export interface Trip {
  id: string;
  name: string;
  travellerName: string;
  travellerPnr: string;
  origin: string;
  destination: string;
  startDate: string;
  status: 'monitoring' | 'disrupted' | 'recovering' | 'recovered';
  bookings: Booking[];
  edges: TripEdge[];
  disruptions: DisruptionEvent[];
  recoveryPlans: RecoveryOption[];
  refundCases: RefundCase[];
  preferences: UserPreferences;
  history: ItineraryHistoryEntry[];
  proactiveWarnings: ProactiveWarning[];
  originalBookings?: Booking[];
  totalJourneyCost?: number;
  totalRefundEstimated?: number;
  activeRecoveryPlanId?: string;
  lastUpdated: string;
}

export interface ProviderAdapterResult<T> {
  success: boolean;
  data: T;
  timestamp: string;
  source: 'LIVE_API' | 'MOCK_ADAPTER' | 'CACHE';
  latencyMs: number;
}
