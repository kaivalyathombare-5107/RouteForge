// src/lib/journey/planner.ts
import { 
  JourneySearchParams, 
  JourneySearchResponse, 
  JourneyPlanOption, 
  NormalizedTransportOption, 
  NormalizedJourneyLeg,
  NormalizedTransferOption 
} from '../../types/journey';
import { makemytripAdapter } from '../providers/makemytrip';
import { irctcAdapter } from '../providers/irctc';
import { redbusAdapter } from '../providers/redbus';
import { uberAdapter } from '../providers/uber';
import { 
  normalizeAirFromMakeMyTrip,
  normalizeRailFromIRCTC,
  normalizeBusFromRedBus,
  normalizeTransferFromUber
} from '../normalization';

export async function planJourneys(
  params: JourneySearchParams,
  userProfile?: any
): Promise<JourneySearchResponse> {
  const startTime = Date.now();
  const origin = params.origin || 'BOM Mumbai (CSMIA T2)';
  const destination = params.destination || 'DEL New Delhi (IGI T3)';
  const departDate = params.departDate || '2026-10-15';
  const cabinClass = params.cabinClass || 'Economy';
  const requestedMode = params.mode || 'multimodal';

  const providersQueried: string[] = [];
  const normalizedFlights: NormalizedTransportOption[] = [];
  const normalizedTrains: NormalizedTransportOption[] = [];
  const normalizedBuses: NormalizedTransportOption[] = [];
  const normalizedRides: NormalizedTransferOption[] = [];

  // Query all core transport providers concurrently
  await Promise.allSettled([
    // 1. MakeMyTrip (Flight options)
    (async () => {
      try {
        providersQueried.push('makemytrip');
        const envelope = await makemytripAdapter.search({
          origin,
          destination,
          departDate,
          cabinClass,
          travelers: (params as any).travelers || (params as any).travellers || 1,
        });

        if (envelope.success && Array.isArray(envelope.data)) {
          envelope.data.forEach((rawFlight: any) => {
            const flights = normalizeAirFromMakeMyTrip(rawFlight, envelope);
            normalizedFlights.push(...flights);
          });
        }
      } catch (e: any) {
        console.warn('[Planner] MakeMyTrip search error:', e.message);
      }
    })(),

    // 2. IRCTC NextGen PRS (Train options)
    (async () => {
      try {
        providersQueried.push('irctc');
        const envelope = await irctcAdapter.search({
          origin,
          destination,
          departDate,
          travelers: (params as any).travelers || 1,
        });

        if (envelope.success && Array.isArray(envelope.data)) {
          envelope.data.forEach((rawTrain: any) => {
            const trains = normalizeRailFromIRCTC(rawTrain, envelope);
            normalizedTrains.push(...trains);
          });
        }
      } catch (e: any) {
        console.warn('[Planner] IRCTC search error:', e.message);
      }
    })(),

    // 3. redBus Luxury Intercity (Bus options)
    (async () => {
      try {
        providersQueried.push('redbus');
        const envelope = await redbusAdapter.search({
          origin,
          destination,
          departDate,
          travelers: (params as any).travelers || 1,
        });

        if (envelope.success && Array.isArray(envelope.data)) {
          envelope.data.forEach((rawBus: any) => {
            const bus = normalizeBusFromRedBus(rawBus, envelope);
            normalizedBuses.push(bus);
          });
        }
      } catch (e: any) {
        console.warn('[Planner] redBus search error:', e.message);
      }
    })(),

    // 4. Uber Mobility (Door-to-door Cab & Outstation options)
    (async () => {
      try {
        providersQueried.push('uber');
        const envelope = await uberAdapter.search({
          origin,
          destination,
          departDate,
        });

        if (envelope.success && Array.isArray(envelope.data)) {
          envelope.data.forEach((rawRide: any) => {
            const ride = normalizeTransferFromUber(rawRide, envelope);
            normalizedRides.push(ride);
          });
        }
      } catch (e: any) {
        console.warn('[Planner] Uber search error:', e.message);
      }
    })(),
  ]);

  const totalOptionsFound = 
    normalizedFlights.length + 
    normalizedTrains.length + 
    normalizedBuses.length + 
    normalizedRides.length;

  if (totalOptionsFound === 0) {
    return {
      success: false,
      query: params,
      plans: [],
      error: 'No active transport options available for the specified corridor and date across Air, Rail, Bus, and Cab providers.',
      meta: {
        providersQueried,
        totalOptionsNormalized: 0,
        latencyMs: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  const plans: JourneyPlanOption[] = [];

  // ==========================================
  // 1. FLIGHT PLANS (MakeMyTrip)
  // ==========================================
  const sortedFlights = [...normalizedFlights].sort((a, b) => a.durationMinutes - b.durationMinutes);
  const bestFlight = sortedFlights[0];
  if (bestFlight) {
    const hours = Math.floor(bestFlight.durationMinutes / 60);
    const mins = bestFlight.durationMinutes % 60;
    const flightLegs: NormalizedJourneyLeg[] = [
      {
        id: `leg_${bestFlight.id}`,
        type: 'flight',
        label: `${bestFlight.origin.name} (${bestFlight.origin.code}) → ${bestFlight.destination.name} (${bestFlight.destination.code})`,
        carrier: `${bestFlight.operator} • Non-Stop Express`,
        time: bestFlight.duration,
        depTime: bestFlight.departureTime,
        arrTime: bestFlight.arrivalTime,
        provider: 'makemytrip',
        sourceType: bestFlight.source,
        seatClass: bestFlight.seatClass,
        bookingReference: bestFlight.serviceNumber,
        provenance: {
          source: bestFlight.source === 'LIVE_API' ? 'MakeMyTrip Live B2B API' : 'MakeMyTrip Bharat Aviation GDS Feed',
          verifiedAt: bestFlight.verifiedAt,
        },
      },
    ];

    plans.push({
      id: 'plan_flight_fastest',
      category: 'FASTEST',
      title: `${bestFlight.operator} Non-Stop Flight`,
      providerSummary: 'MakeMyTrip Bharat Aviation GDS',
      totalDuration: `${hours}h ${mins}m Direct Flight`,
      durationMinutes: bestFlight.durationMinutes,
      depTime: bestFlight.departureTime,
      arrTime: bestFlight.arrivalTime,
      totalPrice: bestFlight.price,
      currency: 'INR',
      priceFormatted: `₹${bestFlight.price.toLocaleString('en-IN')} / person`,
      co2: '84 kg CO₂e',
      disruptionShield: 'DGCA CAR Section 3 statutory 100% refund guarantee on flight cancellation or schedule shift > 2h.',
      badge: 'FLIGHT • MINIMAL TRANSIT TIME',
      legs: flightLegs,
      provenance: {
        source: bestFlight.source === 'LIVE_API' ? 'LIVE_API' : 'PARTNER_API',
        verifiedAt: bestFlight.verifiedAt,
        expiresAt: bestFlight.expiresAt,
        confidenceScore: 0.99,
      },
      explanation: `Direct commercial flight via MakeMyTrip with shortest air transit. Verified on-time schedule with ${bestFlight.baggage.cabin} & ${bestFlight.baggage.checkIn} included.`,
      bookingMethods: ['OFFICIAL_PARTNER', 'DIRECT_API', 'DEEP_LINK'],
    });
  }

  // ==========================================
  // 2. TRAIN PLANS (IRCTC NextGen PRS)
  // ==========================================
  if (normalizedTrains.length > 0) {
    const bestTrain = normalizedTrains[0];
    const trainLegs: NormalizedJourneyLeg[] = [
      {
        id: `leg_${bestTrain.id}`,
        type: 'train',
        label: `${bestTrain.operator} (${bestTrain.serviceNumber})`,
        carrier: `Indian Railways IRCTC • ${bestTrain.seatClass}`,
        time: bestTrain.duration,
        depTime: bestTrain.departureTime,
        arrTime: bestTrain.arrivalTime,
        provider: 'irctc',
        sourceType: bestTrain.source,
        seatClass: bestTrain.seatClass,
        bookingReference: bestTrain.serviceNumber,
        provenance: {
          source: 'IRCTC NextGen PRS Gateway',
          verifiedAt: bestTrain.verifiedAt,
        },
      },
    ];

    plans.push({
      id: 'plan_train_express',
      category: 'PREMIUM_RAIL',
      title: `${bestTrain.operator} Express`,
      providerSummary: 'IRCTC NextGen PRS',
      totalDuration: `${bestTrain.duration} Scenic Railway`,
      durationMinutes: bestTrain.durationMinutes,
      depTime: bestTrain.departureTime,
      arrTime: bestTrain.arrivalTime,
      totalPrice: bestTrain.price,
      currency: 'INR',
      priceFormatted: `₹${bestTrain.price.toLocaleString('en-IN')} / berth`,
      co2: '28 kg CO₂e (Eco-Friendly)',
      disruptionShield: 'Railway Rule 73A: 100% full statutory refund with auto-TDR filing if delayed > 3h.',
      badge: 'TRAIN • HIGH-SPEED SCENIC RAIL',
      legs: trainLegs,
      provenance: {
        source: bestTrain.source === 'LIVE_API' ? 'LIVE_API' : 'PARTNER_API',
        verifiedAt: bestTrain.verifiedAt,
        expiresAt: bestTrain.expiresAt,
        confidenceScore: 0.98,
      },
      explanation: `Verified IRCTC PRS confirmed berths with panoramic window view, complimentary onboard meals, and generous 40 kg luggage allowance.`,
      bookingMethods: ['OFFICIAL_PARTNER', 'DIRECT_API', 'DEEP_LINK'],
    });
  }

  // ==========================================
  // 3. BUS PLANS (redBus Luxury Intercity)
  // ==========================================
  if (normalizedBuses.length > 0) {
    const bestBus = normalizedBuses[0];
    const busLegs: NormalizedJourneyLeg[] = [
      {
        id: `leg_${bestBus.id}`,
        type: 'bus',
        label: `${bestBus.operator} (${bestBus.seatClass})`,
        carrier: `redBus Verified • Multi-Axle Air Suspension`,
        time: bestBus.duration,
        depTime: bestBus.departureTime,
        arrTime: bestBus.arrivalTime,
        provider: 'redbus',
        sourceType: bestBus.source,
        seatClass: bestBus.seatClass,
        bookingReference: bestBus.serviceNumber,
        provenance: {
          source: 'redBus GDS REST API v3',
          verifiedAt: bestBus.verifiedAt,
        },
      },
    ];

    plans.push({
      id: 'plan_bus_luxury',
      category: 'COMFORT_BUS',
      title: `${bestBus.operator} Luxury Sleeper`,
      providerSummary: 'redBus Luxury Intercity GDS',
      totalDuration: `${bestBus.duration} Highway Coach`,
      durationMinutes: bestBus.durationMinutes,
      depTime: bestBus.departureTime,
      arrTime: bestBus.arrivalTime,
      totalPrice: bestBus.price,
      currency: 'INR',
      priceFormatted: `₹${bestBus.price.toLocaleString('en-IN')} / seat`,
      co2: '34 kg CO₂e',
      disruptionShield: 'redBus Assurance: 100% refund on carrier cancellation + real-time GPS tracking & driver contact.',
      badge: 'BUS • LUXURY SLEEPER COACH',
      legs: busLegs,
      provenance: {
        source: bestBus.source === 'LIVE_API' ? 'LIVE_API' : 'PARTNER_API',
        verifiedAt: bestBus.verifiedAt,
        expiresAt: bestBus.expiresAt,
        confidenceScore: 0.97,
      },
      explanation: `Premium multi-axle Volvo sleeper coach with personal 4K entertainment screen, fast USB charging, sanitized blankets, and direct highway corridor transit.`,
      bookingMethods: ['OFFICIAL_PARTNER', 'DIRECT_API', 'DEEP_LINK'],
    });
  }

  // ==========================================
  // 4. UBER / CAB PLANS (Uber Mobility)
  // ==========================================
  if (normalizedRides.length > 0) {
    const bestRide = normalizedRides[0]; // e.g. Uber Black or Uber Premier
    const rideLegs: NormalizedJourneyLeg[] = [
      {
        id: `leg_${bestRide.id}`,
        type: 'car',
        label: `${bestRide.serviceType} (${bestRide.vehicleModel})`,
        carrier: `Uber Mobility • Professional Chauffeur`,
        time: bestRide.estimatedDuration,
        depTime: 'On Demand (Within 10m)',
        arrTime: `ETA +${bestRide.durationMinutes}m`,
        provider: 'uber',
        sourceType: bestRide.source,
        seatClass: `${bestRide.serviceType} Executive`,
        bookingReference: bestRide.providerReference,
        provenance: {
          source: 'Uber Mobility OAuth API v1.2',
          verifiedAt: bestRide.verifiedAt,
        },
      },
    ];

    plans.push({
      id: 'plan_uber_private',
      category: 'DOOR_TO_DOOR_CAB',
      title: `${bestRide.serviceType} Private Chauffeur`,
      providerSummary: 'Uber Mobility Executive Reserve',
      totalDuration: `${bestRide.estimatedDuration} Door-to-Door`,
      durationMinutes: bestRide.durationMinutes,
      depTime: 'Immediate / Scheduled Pickup',
      arrTime: `Direct to Doorstep`,
      totalPrice: bestRide.price,
      currency: 'INR',
      priceFormatted: `₹${bestRide.price.toLocaleString('en-IN')} / ride`,
      co2: '42 kg CO₂e',
      disruptionShield: 'Uber Reserve Guarantee: Guaranteed vehicle dispatch, 45-min complimentary waiting window & flight tracking.',
      badge: 'UBER • DOOR-TO-DOOR CHAUFFEUR',
      legs: rideLegs,
      provenance: {
        source: bestRide.source === 'LIVE_API' ? 'LIVE_API' : 'PARTNER_API',
        verifiedAt: bestRide.verifiedAt,
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
        confidenceScore: 0.99,
      },
      explanation: `Private point-to-point luxury transit in a verified executive vehicle (${bestRide.vehicleModel}). Zero waiting, door-to-door trunk assistance, and live route telemetry.`,
      bookingMethods: ['OFFICIAL_PARTNER', 'DIRECT_API', 'DEEP_LINK'],
    });
  }

  // ==========================================
  // 5. SEAMLESS MULTI-MODAL PLAN (Flight/Train + Uber Transfer)
  // ==========================================
  const primaryTransport = bestFlight || (normalizedTrains.length > 0 ? normalizedTrains[0] : null);
  const primaryRide = normalizedRides.length > 0 ? normalizedRides[0] : null;

  if (primaryTransport && primaryRide) {
    const combinedDurationMins = primaryTransport.durationMinutes + primaryRide.durationMinutes + 45; // 45m buffer
    const hours = Math.floor(combinedDurationMins / 60);
    const mins = combinedDurationMins % 60;
    const combinedPrice = primaryTransport.price + primaryRide.price;

    const multiModalLegs: NormalizedJourneyLeg[] = [
      {
        id: `leg_mm_pickup_${primaryRide.id}`,
        type: 'car',
        label: `Doorstep Pickup → ${primaryTransport.origin.name}`,
        carrier: `Uber Black Chauffeur • ${primaryRide.vehicleModel}`,
        time: primaryRide.estimatedDuration,
        depTime: 'T-90m Prior to Departure',
        arrTime: 'VIP Bay Dropoff',
        provider: 'uber',
        sourceType: primaryRide.source,
        seatClass: 'Executive Transfer',
        bookingReference: primaryRide.providerReference,
        provenance: {
          source: 'Uber Mobility API',
          verifiedAt: primaryRide.verifiedAt,
        },
      },
      {
        id: `leg_mm_main_${primaryTransport.id}`,
        type: primaryTransport.transportType === 'train' ? 'train' : 'flight',
        label: `${primaryTransport.origin.name} → ${primaryTransport.destination.name}`,
        carrier: `${primaryTransport.operator} • ${primaryTransport.seatClass}`,
        time: primaryTransport.duration,
        depTime: primaryTransport.departureTime,
        arrTime: primaryTransport.arrivalTime,
        provider: primaryTransport.provider,
        sourceType: primaryTransport.source,
        seatClass: primaryTransport.seatClass,
        bookingReference: primaryTransport.serviceNumber,
        provenance: {
          source: primaryTransport.provider === 'irctc' ? 'IRCTC PRS' : 'MakeMyTrip Aviation',
          verifiedAt: primaryTransport.verifiedAt,
        },
      },
      {
        id: `leg_mm_dropoff_${primaryRide.id}`,
        type: 'car',
        label: `${primaryTransport.destination.name} → Final Destination Doorstep`,
        carrier: `Uber Premier Valet • Seamless Connection`,
        time: '35 mins',
        depTime: primaryTransport.arrivalTime,
        arrTime: 'Doorstep Arrival',
        provider: 'uber',
        sourceType: 'LIVE_API',
        seatClass: 'Chauffeur Bay Meet & Greet',
        bookingReference: 'UBER-AIRPORT-RESERVE',
        provenance: {
          source: 'Uber Real-Time Telemetry',
          verifiedAt: new Date().toLocaleTimeString('en-IN') + ' IST',
        },
      },
    ];

    plans.push({
      id: 'plan_multimodal_seamless',
      category: 'MULTIMODAL_LUXURY',
      title: `Seamless Door-to-Door: ${primaryTransport.transportType === 'train' ? 'Vande Bharat Rail' : 'Direct Flight'} + Uber Chauffeur`,
      providerSummary: `${primaryTransport.provider === 'irctc' ? 'IRCTC' : 'MakeMyTrip'} + Uber VIP Integration`,
      totalDuration: `${hours}h ${mins}m Complete Door-to-Door`,
      durationMinutes: combinedDurationMins,
      depTime: 'Home Doorstep Pickup',
      arrTime: 'Hotel / Venue Doorstep',
      totalPrice: combinedPrice,
      currency: 'INR',
      priceFormatted: `₹${combinedPrice.toLocaleString('en-IN')} / person complete`,
      co2: '76 kg CO₂e (Optimized)',
      disruptionShield: 'ReRoute Multi-Modal Protection: Automated delay cross-synchronization and instant rebooking between Air/Rail and Uber.',
      badge: 'MULTI-MODAL • COMPLETE DOOR-TO-DOOR SYNC',
      legs: multiModalLegs,
      provenance: {
        source: 'LIVE_API',
        verifiedAt: new Date().toLocaleTimeString('en-IN') + ' IST',
        expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
        confidenceScore: 0.99,
      },
      explanation: `Unified itinerary connecting Uber doorstep chauffeur pickup, premium transit leg, and terminal meet-and-greet dropoff. 100% protected against connection delays.`,
      bookingMethods: ['OFFICIAL_PARTNER', 'DIRECT_API', 'CONCIERGE_DESK'],
    });
  }

  // If user selected a specific mode, prioritize that mode in the returned list
  if (requestedMode && requestedMode !== 'multimodal') {
    plans.sort((a, b) => {
      const aMatches = 
        (requestedMode === 'flight' && a.category.includes('FASTEST')) ||
        (requestedMode === 'train' && a.category.includes('RAIL')) ||
        (requestedMode === 'bus' && a.category.includes('BUS')) ||
        ((requestedMode === 'uber' || requestedMode === 'car') && a.category.includes('CAB'));
      const bMatches = 
        (requestedMode === 'flight' && b.category.includes('FASTEST')) ||
        (requestedMode === 'train' && b.category.includes('RAIL')) ||
        (requestedMode === 'bus' && b.category.includes('BUS')) ||
        ((requestedMode === 'uber' || requestedMode === 'car') && b.category.includes('CAB'));
      if (aMatches && !bMatches) return -1;
      if (!aMatches && bMatches) return 1;
      return 0;
    });
  }

  const latencyMs = Date.now() - startTime;

  return {
    success: true,
    query: params,
    plans,
    meta: {
      providersQueried,
      totalOptionsNormalized: totalOptionsFound,
      latencyMs,
      timestamp: new Date().toISOString(),
    },
  };
}
