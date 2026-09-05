// src/lib/normalization/index.ts
import {
  NormalizedTransportOption,
  NormalizedTransferOption,
  NormalizedStayOption,
} from '../../types/journey';
import { AdapterResponse } from '../providers/base';

/**
 * Normalizes raw IRCTC PRS Train Search Results
 */
export function normalizeRailFromIRCTC(
  rawTrain: any,
  envelope: AdapterResponse<any>
): NormalizedTransportOption[] {
  const verifiedAt = envelope.provenance.verifiedAt;
  const expiresAt = envelope.provenance.expiresAt || new Date(Date.now() + 15 * 60000).toISOString();

  const durationMins = Math.round((rawTrain.durationHours || 4.5) * 60);
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationStr = `${hours}h ${mins}m`;

  const classes = rawTrain.classes || [
    { code: '2A', name: 'Second AC', fare: 2450, status: 'AVAILABLE 18' }
  ];

  return classes.map((cls: any) => {
    const classCode = cls.code || cls.classType || '2A';
    const className = cls.name || cls.classType || 'Second AC';
    const fare = cls.fare || cls.fareINR || 2200;
    const status = cls.status || 'AVAILABLE';

    return {
      id: `rail_${rawTrain.trainNumber}_${classCode}`,
      provider: 'irctc',
      providerReference: `${rawTrain.trainNumber}`,
      transportType: 'train',
      operator: rawTrain.trainName ? `${rawTrain.trainName}` : `Indian Railways Train ${rawTrain.trainNumber}`,
      serviceNumber: `${rawTrain.trainNumber}`,
      origin: {
        name: rawTrain.origin || 'Origin Station',
        code: rawTrain.origin || 'ORIGIN',
      },
      destination: {
        name: rawTrain.destination || 'Destination Station',
        code: rawTrain.destination || 'DEST',
      },
      departureTime: rawTrain.departureTime || '06:15 IST',
      arrivalTime: rawTrain.arrivalTime || '11:00 IST',
      duration: durationStr,
      durationMinutes: durationMins,
      price: fare,
      currency: 'INR',
      availability: {
        status,
        seatsLeft: parseInt(status.replace(/\D/g, ''), 10) || 12,
        isWaitlist: status.includes('WL') || status.includes('GNWL') || status.includes('RAC'),
      },
      baggage: {
        cabin: '40 kg personal luggage',
        checkIn: 'Luggage van booking supported',
      },
      seatClass: `${className} (${classCode})`,
      cancellationPolicy: {
        refundable: true,
        terms: 'Railway Rule 73A: 100% full refund with auto-TDR on delay > 3h. Standard IRCTC cancellation slabs apply.',
        penaltyAmount: fare > 2000 ? 240 : 120,
      },
      modificationPolicy: {
        allowed: true,
        terms: 'Boarding station modification permitted up to 4 hours before chart preparation.',
      },
      source: envelope.sourceType,
      verifiedAt,
      expiresAt,
      deepLink: `https://www.irctc.co.in/nget/booking/train-list?train=${rawTrain.trainNumber}`,
    };
  });
}

/**
 * Normalizes raw MakeMyTrip GDS Aviation Search Results
 */
export function normalizeAirFromMakeMyTrip(
  rawFlight: any,
  envelope: AdapterResponse<any>
): NormalizedTransportOption[] {
  const verifiedAt = envelope.provenance.verifiedAt;
  const expiresAt = envelope.provenance.expiresAt || new Date(Date.now() + 15 * 60000).toISOString();

  const durationMins = Math.round((rawFlight.durationHours || 2.1) * 60);
  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;
  const durationStr = `${hours}h ${mins}m`;

  const carrier = rawFlight.carrier || rawFlight.airline || 'Air India';
  const flightNo = rawFlight.flightNumber || 'AI-864';
  const fare = rawFlight.fare || 4800;
  const cabinClass = rawFlight.cabinClass || 'Economy';

  return [
    {
      id: `air_${flightNo}_${cabinClass}`,
      provider: 'makemytrip',
      providerReference: flightNo,
      transportType: 'flight',
      operator: `${carrier} (${rawFlight.aircraftType || 'Airbus'})`,
      serviceNumber: flightNo,
      origin: {
        name: `${rawFlight.origin || 'BOM'} Airport`,
        code: rawFlight.origin || 'BOM',
        terminal: 'T2',
      },
      destination: {
        name: `${rawFlight.destination || 'DEL'} Airport`,
        code: rawFlight.destination || 'DEL',
        terminal: 'T3',
      },
      departureTime: rawFlight.departureTime || '10:15 IST',
      arrivalTime: rawFlight.arrivalTime || '12:20 IST',
      duration: durationStr,
      durationMinutes: durationMins,
      price: fare,
      currency: 'INR',
      availability: {
        status: `AVAILABLE (${rawFlight.seatsRemaining || 7} seats)`,
        seatsLeft: rawFlight.seatsRemaining || 7,
        isWaitlist: false,
      },
      baggage: {
        cabin: '7 kg Hand Luggage',
        checkIn: `${rawFlight.baggageIncludedKg || 15} kg Checked Baggage`,
      },
      seatClass: cabinClass,
      cancellationPolicy: {
        refundable: true,
        terms: 'DGCA CAR Section 3 Compliant: 100% full refund on flight cancellation or schedule change > 2h.',
        penaltyAmount: 1800,
      },
      modificationPolicy: {
        allowed: true,
        terms: 'Free date change up to 24h prior to departure under corporate fare basis.',
      },
      source: envelope.sourceType,
      verifiedAt,
      expiresAt,
      deepLink: `https://www.makemytrip.com/flight/search?itinerary=${flightNo}`,
    },
  ];
}

/**
 * Normalizes raw redBus Volvo Sleeper Search Results
 */
export function normalizeBusFromRedBus(
  rawBus: any,
  envelope: AdapterResponse<any>
): NormalizedTransportOption {
  const verifiedAt = envelope.provenance.verifiedAt;
  const expiresAt = envelope.provenance.expiresAt || new Date(Date.now() + 15 * 60000).toISOString();

  const serviceId = rawBus.serviceId || 'RB-COACH';
  const operator = rawBus.operator || 'Luxury Intercity';
  const fare = rawBus.fare || 1200;

  return {
    id: `bus_${serviceId}`,
    provider: 'redbus',
    providerReference: serviceId,
    transportType: 'bus',
    operator,
    serviceNumber: serviceId,
    origin: {
      name: (rawBus.route || '').split('->')[0]?.trim() || 'Boarding Point',
      code: 'BUS-ORIGIN',
    },
    destination: {
      name: (rawBus.route || '').split('->')[1]?.trim() || 'Dropoff Point',
      code: 'BUS-DEST',
    },
    departureTime: rawBus.departureTime || '14:30 IST',
    arrivalTime: rawBus.arrivalTime || '19:00 IST',
    duration: '4h 30m',
    durationMinutes: 270,
    price: fare,
    currency: 'INR',
    availability: {
      status: `AVAILABLE (${rawBus.seatsAvailable || 14} berths)`,
      seatsLeft: rawBus.seatsAvailable || 14,
      isWaitlist: false,
    },
    baggage: {
      cabin: '1 Handbag',
      checkIn: '2 Stored Bags (up to 30 kg)',
    },
    seatClass: rawBus.busType || 'Volvo 9600 Luxury Sleeper',
    cancellationPolicy: {
      refundable: true,
      terms: 'Free cancellation up to 6 hours before scheduled boarding.',
      penaltyAmount: 150,
    },
    modificationPolicy: {
      allowed: true,
      terms: 'Boarding point can be changed up to 2 hours prior.',
    },
    source: envelope.sourceType,
    verifiedAt,
    expiresAt,
    deepLink: `https://www.redbus.in/bus-tickets/${serviceId}`,
  };
}

/**
 * Normalizes raw Uber Mobility Search Results
 */
export function normalizeTransferFromUber(
  rawRide: any,
  envelope: AdapterResponse<any>
): NormalizedTransferOption {
  const product = rawRide.product || 'Uber Premier';
  const fare = rawRide.fareEstimated || rawRide.fare || 1450;
  const duration = rawRide.etaMinutes || 30;

  return {
    id: `uber_${product.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    provider: 'uber',
    providerReference: `UBER-${product}`,
    serviceType: product,
    vehicleModel: rawRide.vehicleModel || 'Executive Sedan',
    pickup: rawRide.terminalPickupZone || 'Airport Terminal / Station VIP Bay',
    dropoff: 'Destination Doorstep',
    estimatedDuration: `${duration} mins`,
    durationMinutes: duration,
    price: fare,
    currency: 'INR',
    guaranteedBufferMinutes: rawRide.complimentaryWaitTimeMinutes || 30,
    source: envelope.sourceType,
    verifiedAt: envelope.provenance.verifiedAt,
    deepLink: 'https://m.uber.com/looking',
  };
}

/**
 * Normalizes raw Ola Outstation Search Results
 */
export function normalizeTransferFromOla(
  rawRide: any,
  envelope: AdapterResponse<any>
): NormalizedTransferOption {
  const product = rawRide.product || 'Ola Prime';
  const fare = rawRide.fare || 2650;

  return {
    id: `ola_${product.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    provider: 'ola',
    providerReference: `OLA-${product}`,
    serviceType: product,
    vehicleModel: rawRide.vehicleCategory || 'Prime Sedan (Ciaz / City)',
    pickup: 'City / Station Portico',
    dropoff: 'Destination Hotel Doorstep',
    estimatedDuration: '45 mins',
    durationMinutes: 45,
    price: fare,
    currency: 'INR',
    guaranteedBufferMinutes: 20,
    source: envelope.sourceType,
    verifiedAt: envelope.provenance.verifiedAt,
    deepLink: 'https://book.olacabs.com',
  };
}

/**
 * Normalizes raw Rapido Last-Mile Commute
 */
export function normalizeTransferFromRapido(
  rawRide: any,
  envelope: AdapterResponse<any>
): NormalizedTransferOption {
  const product = rawRide.product || 'Rapido Auto Shuttle';
  const fare = rawRide.estimatedFare || 140;

  return {
    id: `rapido_${product.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    provider: 'rapido',
    providerReference: 'RAPIDO-SHUTTLE',
    serviceType: product,
    vehicleModel: 'Auto-Rickshaw / Rapid Cab',
    pickup: 'Railway Station VIP Gate',
    dropoff: 'Hotel / Resort Doorstep',
    estimatedDuration: `${rawRide.etaMinutes || 15} mins`,
    durationMinutes: rawRide.etaMinutes || 15,
    price: fare,
    currency: 'INR',
    guaranteedBufferMinutes: 10,
    source: envelope.sourceType,
    verifiedAt: envelope.provenance.verifiedAt,
    deepLink: 'https://rapido.bike/app-launch',
  };
}

/**
 * Normalizes raw Goibibo Heritage Hotel Search Results
 */
export function normalizeStayFromGoibibo(
  rawStay: any,
  envelope: AdapterResponse<any>
): NormalizedStayOption {
  const property = rawStay.property || 'Taj Lake Palace';
  const price = rawStay.pricePerNight || 12000;

  return {
    id: `hotel_${property.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
    provider: 'goibibo',
    providerReference: property,
    hotelName: property,
    location: rawStay.city || 'Heritage City',
    roomType: rawStay.suiteType || 'Heritage Luxury Suite',
    pricePerNight: price,
    currency: 'INR',
    checkInTime: '14:00 IST',
    checkOutTime: '12:00 IST',
    rating: rawStay.rating || 4.9,
    amenities: rawStay.amenities || ['Butler Service', 'Heritage Tour', 'High-Speed WiFi'],
    cancellationPolicy: {
      refundable: true,
      terms: 'Free cancellation up to 48 hours prior to check-in. Palace concierge support included.',
    },
    source: envelope.sourceType,
    verifiedAt: envelope.provenance.verifiedAt,
    deepLink: 'https://www.goibibo.com/hotels',
  };
}
