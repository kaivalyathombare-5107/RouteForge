// src/lib/providers/registry.ts
import { ProviderMeta, ProviderId } from './types';

export const CORE_PROVIDERS: ProviderMeta[] = [
  {
    id: 'irctc',
    name: 'IRCTC NextGen PRS',
    category: 'rail',
    sourceType: 'PARTNER_API',
    authMethod: 'irctc_bridge',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: true,
      cancellation: true,
      modification: false,
      refundStatus: true,
      tracking: true,
    },
    description: 'Indian Railways PRS direct booking, Tatkal availability tracking, live NTES telemetry, and automated statutory TDR filing.',
    badge: 'GOVT PRS BRIDGE',
    accentColor: '#3B82F6',
    websiteUrl: 'https://www.irctc.co.in',
  },
  {
    id: 'ixigo',
    name: 'ixigo Trains & Flights',
    category: 'aggregator',
    sourceType: 'PARTNER_API',
    authMethod: 'partner_auth',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: false,
      cancellation: false,
      modification: false,
      refundStatus: true,
      tracking: true,
    },
    description: 'Live train telemetry status, seat availability heatmaps, and multimodal rail-flight corridor search.',
    badge: 'LIVE TELEMETRY',
    accentColor: '#EC4899',
    websiteUrl: 'https://www.ixigo.com',
  },
  {
    id: 'redbus',
    name: 'redBus Luxury Intercity',
    category: 'bus',
    sourceType: 'PARTNER_API',
    authMethod: 'partner_auth',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: true,
      cancellation: true,
      modification: true,
      refundStatus: true,
      tracking: true,
    },
    description: 'Volvo 9600 Multi-Axle sleeper & electric intercity coaches connecting tier-1 airports to royal heritage retreats.',
    badge: 'GPS TRACKED',
    accentColor: '#EF4444',
    websiteUrl: 'https://www.redbus.in',
  },
  {
    id: 'uber',
    name: 'Uber Black & Airport Reserve',
    category: 'cab',
    sourceType: 'LIVE_API',
    authMethod: 'oauth',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: true,
      cancellation: true,
      modification: false,
      refundStatus: true,
      tracking: true,
    },
    description: 'Curbside VIP airport transfers at BOM T2, DEL T3, BLR, and HYD with flight-delay flight tracking integration.',
    badge: 'OFFICIAL OAUTH',
    accentColor: '#10B981',
    websiteUrl: 'https://www.uber.com',
  },
  {
    id: 'ola',
    name: 'Ola Prime & Outstation',
    category: 'cab',
    sourceType: 'PARTNER_API',
    authMethod: 'partner_auth',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: true,
      cancellation: true,
      modification: false,
      refundStatus: true,
      tracking: true,
    },
    description: 'Guaranteed Prime SUV transfers, intercity outstation routes (Mumbai-Pune, Delhi-Jaipur), and corporate billing.',
    badge: 'PARTNER API',
    accentColor: '#EAB308',
    websiteUrl: 'https://www.olacabs.com',
  },
  {
    id: 'rapido',
    name: 'Rapido City Auto & Cab',
    category: 'cab',
    sourceType: 'DEEP_LINK',
    authMethod: 'deep_link',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: false,
      cancellation: false,
      modification: false,
      refundStatus: false,
      tracking: false,
    },
    description: 'Instant local station-to-hotel transfers and rapid transit navigation for urban Indian railway corridors.',
    badge: 'DEEP LINK',
    accentColor: '#F59E0B',
    websiteUrl: 'https://www.rapido.bike',
  },
  {
    id: 'makemytrip',
    name: 'MakeMyTrip Bharat',
    category: 'air',
    sourceType: 'PARTNER_API',
    authMethod: 'partner_auth',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: true,
      cancellation: true,
      modification: true,
      refundStatus: true,
      tracking: true,
    },
    description: 'Full GDS inventory across Air India, IndiGo, Akasa, and SpiceJet with zero cancellation fee add-ons.',
    badge: 'PARTNER GDS',
    accentColor: '#EF4444',
    websiteUrl: 'https://www.makemytrip.com',
  },
  {
    id: 'goibibo',
    name: 'Goibibo Stays & Flights',
    category: 'aggregator',
    sourceType: 'DEEP_LINK',
    authMethod: 'deep_link',
    capabilities: {
      search: true,
      availability: true,
      pricing: true,
      booking: false,
      cancellation: false,
      modification: false,
      refundStatus: false,
      tracking: false,
    },
    description: 'Verified hotel ratings, boutique heritage palace reviews, and budget-optimized domestic airfares.',
    badge: 'DEEP LINK',
    accentColor: '#F97316',
    websiteUrl: 'https://www.goibibo.com',
  },
];

export class ProviderRegistry {
  private providers: Map<ProviderId, ProviderMeta> = new Map();

  constructor() {
    CORE_PROVIDERS.forEach(p => this.register(p));
  }

  register(provider: ProviderMeta): void {
    this.providers.set(provider.id, provider);
  }

  get(id: ProviderId): ProviderMeta | undefined {
    return this.providers.get(id);
  }

  getAll(): ProviderMeta[] {
    return Array.from(this.providers.values());
  }

  getByCategory(category: string): ProviderMeta[] {
    return this.getAll().filter(p => p.category === category);
  }
}

export const providerRegistry = new ProviderRegistry();
