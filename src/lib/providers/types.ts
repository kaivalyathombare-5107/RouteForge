// src/lib/providers/types.ts

export type ProviderId = 
  | 'irctc'
  | 'ixigo'
  | 'redbus'
  | 'uber'
  | 'ola'
  | 'rapido'
  | 'makemytrip'
  | 'goibibo'
  | string;

export type ProviderCategory = 'rail' | 'air' | 'bus' | 'cab' | 'hotel' | 'aggregator';

export type ProviderConnectionState = 
  | 'NOT_CONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'EXPIRED'
  | 'REAUTH_REQUIRED'
  | 'PARTNER_REQUIRED'
  | 'UNAVAILABLE';

export type ProviderSourceType = 
  | 'LIVE_API'
  | 'PARTNER_API'
  | 'DEEP_LINK'
  | 'IMPORTED'
  | 'MOCK'
  | 'UNAVAILABLE';

export type AuthMethod = 
  | 'oauth' 
  | 'partner_auth' 
  | 'api_credential' 
  | 'deep_link' 
  | 'irctc_bridge';

export interface ProviderCapabilities {
  search: boolean;
  availability: boolean;
  pricing: boolean;
  booking: boolean;
  cancellation: boolean;
  modification: boolean;
  refundStatus: boolean;
  tracking: boolean;
}

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  category: ProviderCategory;
  sourceType: ProviderSourceType;
  authMethod: AuthMethod;
  capabilities: ProviderCapabilities;
  description: string;
  badge: string;
  accentColor: string;
  websiteUrl: string;
}

export interface UserProviderConnection {
  providerId: ProviderId;
  state: ProviderConnectionState;
  connectedAt?: string;
  expiresAt?: string;
  accountIdentifier?: string; // e.g., masked phone or username; NEVER passwords
  scopes?: string[];
  lastSyncAt?: string;
}

export interface ProviderWithStatus extends ProviderMeta {
  connectionState: ProviderConnectionState;
  accountIdentifier?: string;
  lastSyncAt?: string;
}
