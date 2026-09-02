import { Booking, RefundCase, ProviderAdapterResult } from '../../types';
import { calculateIRCTCRefund, calculateFlightRefund, IRCTC_POLICY_VERSION, DGCA_CAR_VERSION } from '../deterministic-engines';

export interface BaseProviderAdapter {
  providerName: string;
  providerType: 'rail' | 'air' | 'hotel' | 'event';
  version: string;
  getStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; delayMinutes: number; telemetryNote: string }>>;
  getCancellationPolicy(bookingId: string): Promise<ProviderAdapterResult<{ policyVersion: string; summary: string }>>;
  estimateRefund(booking: Booking, scenario: string): Promise<ProviderAdapterResult<Partial<RefundCase>>>;
  cancelBooking(bookingId: string, reason: string): Promise<ProviderAdapterResult<{ cancelled: boolean; confirmationCode: string; refundTicket: string }>>;
  getRefundStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; lastVerified: string; isImported: boolean; reference: string }>>;
}

/**
 * IRCTC Train Provider Adapter (Simulates Indian Railways PRS / NTES API)
 */
export class IRCTCTrainAdapter implements BaseProviderAdapter {
  providerName = 'IRCTC Passenger Reservation System (PRS)';
  providerType: 'rail' = 'rail';
  version = 'v2.4-SOAP-REST-BRIDGE';

  async getStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; delayMinutes: number; telemetryNote: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 142,
      data: {
        status: 'ON_TIME',
        delayMinutes: 0,
        telemetryNote: 'Train 12952 NDLS-MMCT Rajdhani scheduled from Platform 4 at NDLS.',
      },
    };
  }

  async getCancellationPolicy(bookingId: string): Promise<ProviderAdapterResult<{ policyVersion: string; summary: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 85,
      data: {
        policyVersion: IRCTC_POLICY_VERSION,
        summary: 'Subject to Gazette of India Ministry of Railways cancellation & refund rules 2015 amendment 2026.',
      },
    };
  }

  async estimateRefund(booking: Booking, scenario: string): Promise<ProviderAdapterResult<Partial<RefundCase>>> {
    const calc = calculateIRCTCRefund(
      booking.price,
      '2A',
      scenario as any || 'CONFIRMED_MORE_THAN_48H',
      52
    );

    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 110,
      data: {
        bookingId: booking.id,
        provider: 'IRCTC (Indian Railways)',
        bookingType: 'train',
        ticketAmount: booking.price,
        estimatedRefund: calc.estimatedRefund,
        deductionAmount: calc.deductionAmount,
        tdrRequired: calc.tdrRequired,
        tdrReasonCode: calc.tdrReasonCode,
        tdrWindowDescription: calc.tdrWindowDescription,
        ruleId: calc.ruleId,
        policyVersion: calc.policyVersion,
        status: 'eligible',
        deterministicReason: calc.reason,
        breakdown: calc.breakdown,
        isImportedStatus: false,
      },
    };
  }

  async cancelBooking(bookingId: string, reason: string): Promise<ProviderAdapterResult<{ cancelled: boolean; confirmationCode: string; refundTicket: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 310,
      data: {
        cancelled: true,
        confirmationCode: `IRCTC-CAN-${Math.floor(100000 + Math.random() * 900000)}`,
        refundTicket: `TDR-REF-${Date.now().toString().slice(-6)}`,
      },
    };
  }

  async getRefundStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; lastVerified: string; isImported: boolean; reference: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 95,
      data: {
        status: 'PROCESSING_PAYMENT_GATEWAY',
        lastVerified: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        isImported: false,
        reference: 'SBI-EPAY-REF-992140',
      },
    };
  }
}

/**
 * IRCTC Air / DGCA Aviation Adapter
 */
export class IRCTCAirAdapter implements BaseProviderAdapter {
  providerName = 'IRCTC Air / Amadeus GDS Gateway';
  providerType: 'air' = 'air';
  version = 'v3.1-GDS-NDC';

  async getStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; delayMinutes: number; telemetryNote: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 220,
      data: {
        status: 'DISRUPTED_CANCELLED',
        delayMinutes: 999,
        telemetryNote: 'IndiGo Flight 6E-204 cancelled due to dense airspace congestion and ATC slot restriction at BOM.',
      },
    };
  }

  async getCancellationPolicy(bookingId: string): Promise<ProviderAdapterResult<{ policyVersion: string; summary: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 90,
      data: {
        policyVersion: DGCA_CAR_VERSION,
        summary: 'DGCA Civil Aviation Requirements Section 3 Series M Part IV: 100% full refund on airline cancellation.',
      },
    };
  }

  async estimateRefund(booking: Booking, scenario: string = 'AIRLINE_CANCELLED'): Promise<ProviderAdapterResult<Partial<RefundCase>>> {
    const calc = calculateFlightRefund(booking.price, scenario as any);

    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 130,
      data: {
        bookingId: booking.id,
        provider: 'IRCTC Air (IndiGo Carrier)',
        bookingType: 'flight',
        ticketAmount: booking.price,
        estimatedRefund: calc.estimatedRefund,
        deductionAmount: calc.deductionAmount,
        tdrRequired: false,
        ruleId: calc.ruleId,
        policyVersion: calc.policyVersion,
        status: 'processing',
        deterministicReason: calc.reason,
        breakdown: calc.breakdown,
        isImportedStatus: true, // As specified in prompt guidelines for IRCTC Air
      },
    };
  }

  async cancelBooking(bookingId: string, reason: string): Promise<ProviderAdapterResult<{ cancelled: boolean; confirmationCode: string; refundTicket: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 280,
      data: {
        cancelled: true,
        confirmationCode: `6E-WVR-${Math.floor(10000 + Math.random() * 90000)}`,
        refundTicket: `AIR-RET-${Date.now().toString().slice(-6)}`,
      },
    };
  }

  async getRefundStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; lastVerified: string; isImported: boolean; reference: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'MOCK_ADAPTER',
      latencyMs: 140,
      data: {
        status: 'PROCESSING',
        lastVerified: '13:42 IST',
        isImported: true, // Prompt requirement: If imported status, show "Imported status"
        reference: 'GDS-AMAD-789021',
      },
    };
  }
}

/**
 * Hotel Provider Adapter
 */
export class HotelAdapter implements BaseProviderAdapter {
  providerName = 'ITC Rajputana & SynXis CRS';
  providerType: 'hotel' = 'hotel';
  version = 'v4.0-OPEN-HOTEL-API';

  async getStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; delayMinutes: number; telemetryNote: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 160,
      data: {
        status: 'CONFIRMED',
        delayMinutes: 0,
        telemetryNote: 'Deluxe Heritage Room held until 23:59 IST with guaranteed late check-in flag.',
      },
    };
  }

  async getCancellationPolicy(bookingId: string): Promise<ProviderAdapterResult<{ policyVersion: string; summary: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 70,
      data: {
        policyVersion: 'ITC_FLEX_RATE_2026',
        summary: 'Free date modification up to 6 hours prior to check-in with rate differential.',
      },
    };
  }

  async estimateRefund(booking: Booking, scenario: string): Promise<ProviderAdapterResult<Partial<RefundCase>>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 100,
      data: {
        bookingId: booking.id,
        provider: 'ITC Rajputana Luxury Collection',
        bookingType: 'hotel',
        ticketAmount: booking.price,
        estimatedRefund: booking.price,
        deductionAmount: 0,
        tdrRequired: false,
        ruleId: 'HOTEL_FLEX_MOD_01',
        policyVersion: 'ITC_FLEX_RATE_2026',
        status: 'eligible',
        deterministicReason: 'Itinerary disruption waiver honored; zero cancellation fee for room hold adjustment.',
        breakdown: {
          baseFare: booking.price,
          clerkageFee: 0,
          cancellationCharges: 0,
          gstAdjustment: 0,
          agentConvenienceFeeDeducted: 0,
        },
        isImportedStatus: false,
      },
    };
  }

  async cancelBooking(bookingId: string, reason: string): Promise<ProviderAdapterResult<{ cancelled: boolean; confirmationCode: string; refundTicket: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 190,
      data: {
        cancelled: true,
        confirmationCode: `ITC-RES-${Math.floor(100000 + Math.random() * 900000)}`,
        refundTicket: `HOTEL-MOD-SAFE`,
      },
    };
  }

  async getRefundStatus(bookingId: string): Promise<ProviderAdapterResult<{ status: string; lastVerified: string; isImported: boolean; reference: string }>> {
    return {
      success: true,
      timestamp: new Date().toISOString(),
      source: 'LIVE_API',
      latencyMs: 110,
      data: {
        status: 'HOLD_CONFIRMED',
        lastVerified: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        isImported: false,
        reference: 'ITC-JPR-99824',
      },
    };
  }
}

// Registry Singleton
export const providerAdapters = {
  irctcTrain: new IRCTCTrainAdapter(),
  irctcAir: new IRCTCAirAdapter(),
  hotel: new HotelAdapter(),
};
