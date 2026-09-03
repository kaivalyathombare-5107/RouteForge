import * as THREE from 'three';
import { LOCATION_SUGGESTIONS, LocationSuggestion } from '../data/locations';
import { JourneyMode } from '../components/HeroJourneySection';

export interface GeoPoint {
  name: string;
  code: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  type: 'airport' | 'railway' | 'palace' | 'city' | 'waterway';
}

export interface TransportRouteSegment {
  id: string;
  from: GeoPoint;
  to: GeoPoint;
  mode: 'flight' | 'train' | 'car' | 'boat' | 'helicopter';
  title: string;
  carrierOrLine: string;
  distanceKm: number;
  durationStr: string;
  speedKmh: number;
  altitudeFt: number;
  curve: THREE.Curve<THREE.Vector3>;
  waypoints: THREE.Vector3[];
  color: number;
  status: 'on_schedule' | 'delayed' | 'impacted' | 'active';
}

// Earth Globe radius in Three.js world units
export const GLOBE_RADIUS = 5.0;

// Convert Latitude and Longitude to 3D Cartesian coordinates on a sphere of radius R
export function latLonToVector3(lat: number, lon: number, radius = GLOBE_RADIUS): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);

  return new THREE.Vector3(x, y, z);
}

// Convert 3D Vector on sphere back to Latitude and Longitude
export function vector3ToLatLon(v: THREE.Vector3): { lat: number; lon: number } {
  const norm = v.clone().normalize();
  const lat = 90 - (Math.acos(norm.y) * 180) / Math.PI;
  const lon = ((Math.atan2(norm.z, -norm.x) * 180) / Math.PI) - 180;
  return { lat, lon: lon < -180 ? lon + 360 : lon > 180 ? lon - 360 : lon };
}

// Haversine formula to compute great circle distance in km
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Famous World & Indian City Fallback Coordinates
const CITY_COORDINATES_MAP: { [key: string]: [number, number, 'airport' | 'railway' | 'palace' | 'city' | 'waterway'] } = {
  // India
  'mumbai': [72.8656, 19.0896, 'airport'],
  'bombay': [72.8656, 19.0896, 'airport'],
  'bom': [72.8656, 19.0896, 'airport'],
  'delhi': [77.1025, 28.5562, 'airport'],
  'new delhi': [77.1025, 28.5562, 'airport'],
  'del': [77.1025, 28.5562, 'airport'],
  'udaipur': [73.7125, 24.5854, 'palace'],
  'udr': [73.8961, 24.6178, 'airport'],
  'taj lake palace': [73.6800, 24.5750, 'palace'],
  'lake pichola': [73.6780, 24.5730, 'waterway'],
  'jagmandir': [73.6785, 24.5680, 'palace'],
  'srinagar': [74.7742, 34.0837, 'airport'],
  'kashmir': [74.7973, 34.0837, 'city'],
  'dal lake': [74.8724, 34.1130, 'waterway'],
  'gulmarg': [74.3805, 34.0484, 'city'],
  'bengaluru': [77.7064, 13.1986, 'airport'],
  'bangalore': [77.7064, 13.1986, 'airport'],
  'blr': [77.7064, 13.1986, 'airport'],
  'hyderabad': [78.4294, 17.2403, 'airport'],
  'hyd': [78.4294, 17.2403, 'airport'],
  'chennai': [80.1709, 12.9941, 'airport'],
  'kolkata': [88.4467, 22.6547, 'airport'],
  'goa': [73.8315, 15.3800, 'airport'],
  'jaipur': [75.8122, 26.8286, 'airport'],
  'varanasi': [82.8593, 25.4524, 'airport'],
  'agra': [78.0081, 27.1767, 'palace'],
  'kochi': [76.4019, 10.1556, 'airport'],
  'amritsar': [74.7973, 31.7096, 'airport'],

  // International Premier Hubs & Luxury Destinations
  'zurich': [8.5417, 47.3769, 'airport'],
  'zrh': [8.5492, 47.4581, 'airport'],
  'interlaken': [7.8632, 46.6863, 'railway'],
  'geneva': [6.1432, 46.2044, 'airport'],
  'zermatt': [7.7491, 45.9765, 'railway'],
  'switzerland': [8.5417, 47.3769, 'airport'],
  'amalfi': [14.6027, 40.6340, 'waterway'],
  'amalfi coast': [14.6027, 40.6340, 'waterway'],
  'rome': [12.4964, 41.9028, 'airport'],
  'fco': [12.2389, 41.8003, 'airport'],
  'naples': [14.2681, 40.8518, 'railway'],
  'positano': [14.4850, 40.6281, 'waterway'],
  'capri': [14.2433, 40.5507, 'waterway'],
  'tokyo': [139.6917, 35.6895, 'airport'],
  'hnd': [139.7798, 35.5494, 'airport'],
  'nrt': [140.3929, 35.7720, 'airport'],
  'kyoto': [135.7681, 35.0116, 'railway'],
  'osaka': [135.5023, 34.6937, 'airport'],
  'london': [0.1278, 51.5074, 'airport'],
  'lhr': [-0.4543, 51.4700, 'airport'],
  'paris': [2.3522, 48.8566, 'airport'],
  'cdg': [2.5479, 49.0097, 'airport'],
  'dubai': [55.2708, 25.2048, 'airport'],
  'dxb': [55.3644, 25.2532, 'airport'],
  'abu dhabi': [54.3773, 24.4539, 'airport'],
  'doha': [51.5310, 25.2854, 'airport'],
  'singapore': [103.8198, 1.3521, 'airport'],
  'sin': [103.9915, 1.3644, 'airport'],
  'new york': [-74.0060, 40.7128, 'airport'],
  'jfk': [-73.7781, 40.6413, 'airport'],
  'san francisco': [-122.4194, 37.7749, 'airport'],
  'los angeles': [-118.2437, 34.0522, 'airport'],
  'sydney': [151.2093, -33.8688, 'airport'],
  'maldives': [73.5089, 4.1755, 'waterway'],
  'male': [73.5292, 4.1918, 'waterway'],
  'santorini': [25.4312, 36.3932, 'waterway'],
  'mykonos': [25.3289, 37.4467, 'waterway'],
};

// Resolve any query string or booking location to a structured GeoPoint
export function resolveLocationToGeoPoint(query: string, defaultFallbackName = 'Destination'): GeoPoint {
  if (!query || !query.trim()) {
    return {
      name: 'Mumbai',
      code: 'BOM',
      city: 'Mumbai',
      country: 'India',
      lat: 19.0896,
      lon: 72.8656,
      type: 'airport',
    };
  }

  const q = query.toLowerCase().trim();

  // 1. Direct match in LOCATION_SUGGESTIONS
  const matchedSuggestion = LOCATION_SUGGESTIONS.find(
    (loc) =>
      loc.city.toLowerCase() === q ||
      loc.code.toLowerCase() === q ||
      q.includes(loc.city.toLowerCase()) ||
      q.includes(loc.code.toLowerCase())
  );

  if (matchedSuggestion && matchedSuggestion.coordinates) {
    return {
      name: `${matchedSuggestion.city} (${matchedSuggestion.code})`,
      code: matchedSuggestion.code,
      city: matchedSuggestion.city,
      country: matchedSuggestion.country,
      lon: matchedSuggestion.coordinates[0],
      lat: matchedSuggestion.coordinates[1],
      type: matchedSuggestion.type === 'train' ? 'railway' : matchedSuggestion.type === 'flight' ? 'airport' : 'city',
    };
  }

  // 2. Lookup in city coordinates fallback dictionary
  for (const [key, [lon, lat, type]] of Object.entries(CITY_COORDINATES_MAP)) {
    if (q.includes(key) || key.includes(q)) {
      const code = key.length === 3 ? key.toUpperCase() : key.substring(0, 3).toUpperCase();
      const capitalized = key.charAt(0).toUpperCase() + key.slice(1);
      return {
        name: query,
        code,
        city: capitalized,
        country: ['zurich', 'interlaken', 'geneva', 'zermatt'].includes(key) ? 'Switzerland' : ['rome', 'amalfi', 'positano', 'capri', 'naples'].includes(key) ? 'Italy' : ['tokyo', 'kyoto', 'osaka'].includes(key) ? 'Japan' : ['dubai', 'abu dhabi'].includes(key) ? 'UAE' : 'Global',
        lon,
        lat,
        type,
      };
    }
  }

  // 3. Fallback: derive pseudo-deterministic lat/lon from string hash so any custom entered city works smoothly
  let hash = 0;
  for (let i = 0; i < query.length; i++) {
    hash = (hash << 5) - hash + query.charCodeAt(i);
    hash |= 0;
  }
  const pseudoLat = 15 + (Math.abs(hash % 450) / 10);
  const pseudoLon = 40 + (Math.abs((hash >> 3) % 900) / 10);

  return {
    name: query,
    code: query.slice(0, 3).toUpperCase(),
    city: query,
    country: 'International',
    lat: pseudoLat,
    lon: pseudoLon,
    type: 'city',
  };
}

// Generate high-altitude parabolic geodesic curve between two sphere coordinates
export function createGreatCircleParabolicCurve(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  maxAltitudeFraction = 0.35,
  steps = 80,
  radius = GLOBE_RADIUS
): { curve: THREE.CatmullRomCurve3; points: THREE.Vector3[] } {
  const points: THREE.Vector3[] = [];
  const v1 = p1.clone().normalize();
  const v2 = p2.clone().normalize();

  // Angular distance between two vectors in radians
  const angle = v1.angleTo(v2);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;

    // Slerp (Spherical Linear Interpolation)
    const sinAngle = Math.sin(angle);
    let slerped: THREE.Vector3;
    if (sinAngle < 0.0001) {
      slerped = v1.clone().lerp(v2, t).normalize();
    } else {
      const a = Math.sin((1 - t) * angle) / sinAngle;
      const b = Math.sin(t * angle) / sinAngle;
      slerped = new THREE.Vector3(
        v1.x * a + v2.x * b,
        v1.y * a + v2.y * b,
        v1.z * a + v2.z * b
      ).normalize();
    }

    // Parabolic elevation peak at midpoint
    const arcHeight = Math.sin(Math.PI * t) * (radius * maxAltitudeFraction);
    const rCurrent = radius + arcHeight;
    points.push(slerped.multiplyScalar(rCurrent));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  return { curve, points };
}

// Surface-hugging curve for railway / road / water with slight elevation above terrain
export function createSurfaceCurve(
  p1: THREE.Vector3,
  p2: THREE.Vector3,
  surfaceOffset = 0.05,
  steps = 60,
  radius = GLOBE_RADIUS
): { curve: THREE.CatmullRomCurve3; points: THREE.Vector3[] } {
  const points: THREE.Vector3[] = [];
  const v1 = p1.clone().normalize();
  const v2 = p2.clone().normalize();
  const angle = v1.angleTo(v2);

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const sinAngle = Math.sin(angle);
    let slerped: THREE.Vector3;
    if (sinAngle < 0.0001) {
      slerped = v1.clone().lerp(v2, t).normalize();
    } else {
      const a = Math.sin((1 - t) * angle) / sinAngle;
      const b = Math.sin(t * angle) / sinAngle;
      slerped = new THREE.Vector3(
        v1.x * a + v2.x * b,
        v1.y * a + v2.y * b,
        v1.z * a + v2.z * b
      ).normalize();
    }

    // Constant offset from sphere surface
    points.push(slerped.multiplyScalar(radius + surfaceOffset));
  }

  const curve = new THREE.CatmullRomCurve3(points);
  return { curve, points };
}

// Generate realistic multi-modal journey legs between any entered origin and destination
export function generateJourneyCorridor(
  originQuery: string,
  destinationQuery: string,
  preferredMode: JourneyMode = 'multimodal'
): TransportRouteSegment[] {
  const origin = resolveLocationToGeoPoint(originQuery, 'Origin');
  const destination = resolveLocationToGeoPoint(destinationQuery, 'Destination');
  const dist = calculateHaversineDistance(origin.lat, origin.lon, destination.lat, destination.lon);

  const segments: TransportRouteSegment[] = [];

  const originVec = latLonToVector3(origin.lat, origin.lon);
  const destVec = latLonToVector3(destination.lat, destination.lon);

  // SCENARIO 1: Intercity / Long Distance (> 350 km) or Preferred Flight
  if (dist > 350 || preferredMode === 'flight') {
    // 1. Air Flight Leg
    const flightCurve = createGreatCircleParabolicCurve(originVec, destVec, Math.min(0.45, Math.max(0.12, dist / 8000)));
    segments.push({
      id: `flight-${origin.code}-${destination.code}`,
      from: origin,
      to: destination,
      mode: 'flight',
      title: `${origin.city} to ${destination.city} Aviation Corridor`,
      carrierOrLine: dist > 2500 ? 'Air India Boeing 787-9 Dreamliner (First Class Suite)' : 'Vistara Club World Airbus A321neo',
      distanceKm: dist,
      durationStr: `${Math.floor(dist / 750)}h ${Math.round((dist % 750) / 12)}m`,
      speedKmh: 890,
      altitudeFt: 36000,
      curve: flightCurve.curve,
      waypoints: flightCurve.points,
      color: 0xD4AF37, // Royal Champagne Gold
      status: 'active',
    });

    // If destination has a palace/waterway or is Udaipur/Amalfi/Kashmir, add luxury ground and royal water transfer
    const destLower = destination.city.toLowerCase();
    if (destLower.includes('udaipur') || destLower.includes('taj lake palace')) {
      const airportVec = latLonToVector3(24.6178, 73.8961);
      const jettyVec = latLonToVector3(24.5730, 73.6780);
      const palaceVec = latLonToVector3(24.5750, 73.6800);

      const roadCurve = createSurfaceCurve(airportVec, jettyVec, 0.04);
      segments.push({
        id: `road-udaipur-transfer`,
        from: { ...destination, name: 'Dabok Airport', city: 'Udaipur Dabok', lat: 24.6178, lon: 73.8961, type: 'airport' },
        to: { ...destination, name: 'Bansi Ghat Private Pier', city: 'Lake Pichola', lat: 24.5730, lon: 73.6780, type: 'waterway' },
        mode: 'car',
        title: 'VIP Chauffeur Transfer (Mercedes-Maybach S-Class)',
        carrierOrLine: 'ReRoute Privé Escorted Royal Chauffeur',
        distanceKm: 24,
        durationStr: '32 min',
        speedKmh: 75,
        altitudeFt: 1900,
        curve: roadCurve.curve,
        waypoints: roadCurve.points,
        color: 0x38BDF8, // Cyan Blue
        status: 'on_schedule',
      });

      const boatCurve = createSurfaceCurve(jettyVec, palaceVec, 0.02);
      segments.push({
        id: `boat-pichola-shikara`,
        from: { ...destination, name: 'Bansi Ghat Pier', city: 'Lake Pichola', lat: 24.5730, lon: 73.6780, type: 'waterway' },
        to: { ...destination, name: 'Taj Lake Palace Royal Arrival Portal', city: 'Jag Niwas Island', lat: 24.5750, lon: 73.6800, type: 'palace' },
        mode: 'boat',
        title: 'Private Royal Shikara Lake Pichola Cruise',
        carrierOrLine: 'Taj Lake Palace Imperial Royal Boat',
        distanceKm: 2,
        durationStr: '12 min',
        speedKmh: 18,
        altitudeFt: 1880,
        curve: boatCurve.curve,
        waypoints: boatCurve.points,
        color: 0x10B981, // Emerald green
        status: 'on_schedule',
      });
    } else if (destLower.includes('amalfi') || destLower.includes('positano') || destLower.includes('capri')) {
      const naplesVec = latLonToVector3(40.8518, 14.2681);
      const amalfiVec = latLonToVector3(40.6340, 14.6027);
      const roadCurve = createSurfaceCurve(naplesVec, amalfiVec, 0.04);
      segments.push({
        id: `road-amalfi-corniche`,
        from: { name: 'Napoli Centrale', code: 'NAP', city: 'Naples', country: 'Italy', lat: 40.8518, lon: 14.2681, type: 'railway' },
        to: { name: 'Amalfi Marina Grande', code: 'AML', city: 'Amalfi', country: 'Italy', lat: 40.6340, lon: 14.6027, type: 'waterway' },
        mode: 'boat',
        title: 'Riva Superaquarama Private Yacht Transfer',
        carrierOrLine: 'Amalfi Coast Luxury Marine Charter',
        distanceKm: 38,
        durationStr: '45 min',
        speedKmh: 45,
        altitudeFt: 0,
        curve: roadCurve.curve,
        waypoints: roadCurve.points,
        color: 0x06B6D4, // Cyan
        status: 'on_schedule',
      });
    } else if (destLower.includes('srinagar') || destLower.includes('kashmir')) {
      const airportVec = latLonToVector3(34.0837, 74.7742);
      const dalLakeVec = latLonToVector3(34.1130, 74.8724);
      const boatCurve = createSurfaceCurve(airportVec, dalLakeVec, 0.03);
      segments.push({
        id: `boat-dal-lake-shikara`,
        from: { name: 'Sheikh ul-Alam Airport', code: 'SXR', city: 'Srinagar', country: 'India', lat: 34.0837, lon: 74.7742, type: 'airport' },
        to: { name: 'The Lalit Grand Palace & Dal Lake', code: 'DAL', city: 'Srinagar', country: 'India', lat: 34.1130, lon: 74.8724, type: 'palace' },
        mode: 'boat',
        title: 'Dal Lake Royal Shikara Sunset Flotilla',
        carrierOrLine: 'Kashmir Luxury Waterways',
        distanceKm: 16,
        durationStr: '28 min',
        speedKmh: 20,
        altitudeFt: 5200,
        curve: boatCurve.curve,
        waypoints: boatCurve.points,
        color: 0x10B981,
        status: 'on_schedule',
      });
    }
  } else {
    // SCENARIO 2: Medium/Short Distance (< 350 km) or Preferred Train
    const railCurve = createSurfaceCurve(originVec, destVec, 0.05);
    segments.push({
      id: `rail-${origin.code}-${destination.code}`,
      from: origin,
      to: destination,
      mode: 'train',
      title: `${origin.city} to ${destination.city} High-Speed Express`,
      carrierOrLine: 'Vande Bharat 20901 / Shinkansen Executive Express',
      distanceKm: dist,
      durationStr: `${Math.floor(dist / 140)}h ${Math.round((dist % 140) / 2.3)}m`,
      speedKmh: 160,
      altitudeFt: 850,
      curve: railCurve.curve,
      waypoints: railCurve.points,
      color: 0x8B5CF6, // Royal Purple / Neon Violet
      status: 'active',
    });

    // Local VIP Chauffeur link
    const carCurve = createSurfaceCurve(destVec, destVec.clone().add(new THREE.Vector3(0.08, 0.04, 0.05)), 0.03);
    segments.push({
      id: `car-final-mile`,
      from: destination,
      to: { ...destination, name: `${destination.city} Presidential Suite` },
      mode: 'car',
      title: 'Private Chauffeur Final Mile Transfer',
      carrierOrLine: 'ReRoute Concierge Luxury Sedan',
      distanceKm: 12,
      durationStr: '18 min',
      speedKmh: 65,
      altitudeFt: 850,
      curve: carCurve.curve,
      waypoints: carCurve.points,
      color: 0x38BDF8,
      status: 'on_schedule',
    });
  }

  return segments;
}
