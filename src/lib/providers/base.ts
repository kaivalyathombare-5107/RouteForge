// src/lib/providers/base.ts
import { ProviderId, ProviderCategory, ProviderSourceType, ProviderCapabilities } from './types';

export interface AdapterResponse<T> {
  success: boolean;
  providerId: ProviderId;
  sourceType: ProviderSourceType;
  timestamp: string;
  latencyMs: number;
  data: T;
  provenance: {
    source: string;
    verifiedAt: string;
    expiresAt?: string;
    apiEndpoint?: string;
  };
  error?: string;
}

export interface ProviderSearchParams {
  origin: string;
  destination: string;
  departDate: string;
  returnDate?: string;
  travelers?: number;
  cabinClass?: string;
  budgetTier?: string;
}

export interface ProviderAdapter {
  id: ProviderId;
  name: string;
  category: ProviderCategory;
  sourceType: ProviderSourceType;
  capabilities: ProviderCapabilities;

  search(params: ProviderSearchParams): Promise<AdapterResponse<any[]>>;
  getAvailability?(referenceId: string): Promise<AdapterResponse<any>>;
  getPricing?(referenceId: string): Promise<AdapterResponse<any>>;
  createBooking?(bookingRequest: any): Promise<AdapterResponse<any>>;
  cancelBooking?(bookingId: string, reason?: string): Promise<AdapterResponse<any>>;
  getRefundStatus?(bookingId: string): Promise<AdapterResponse<any>>;
  getTracking?(referenceId: string): Promise<AdapterResponse<any>>;
  generateDeepLink?(params: any): string;
}
