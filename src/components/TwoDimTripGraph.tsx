import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Maximize2, 
  Compass, 
  Plane, 
  Train, 
  Layers, 
  MapPin, 
  X, 
  Navigation, 
  ExternalLink,
  Info,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Radio
} from 'lucide-react';
import { Booking, TripEdge, RecoveryOption } from '../types';
import { JourneyMode } from './HeroJourneySection';
import { 
  resolveLocationToGeoPoint, 
  calculateHaversineDistance, 
  GeoPoint 
} from '../utils/geoCoordinates';

interface TwoDimTripGraphProps {
  bookings?: Booking[];
  edges?: TripEdge[];
  selectedBookingId?: string | null;
  onSelectBooking?: (bookingId: string) => void;
  hoveredRecoveryOption?: RecoveryOption | null;
  activeRecoveryPlan?: RecoveryOption | null;
  isDisrupted?: boolean;
  reducedMotion?: boolean;
  searchOrigin?: string;
  searchDestination?: string;
  searchMode?: JourneyMode;
  hasUserEntered?: boolean;
  onSelectRoute?: (origin: string, dest: string, mode: JourneyMode) => void;
  onClearRoute?: () => void;
}

// Major international and domestic hubs with coordinates [lon, lat]
const WORLD_HUBS: { name: string; code: string; lon: number; lat: number; type: 'flight' | 'train' | 'hub' }[] = [
  { name: 'Mumbai', code: 'BOM', lon: 72.8656, lat: 19.0896, type: 'hub' },
  { name: 'New Delhi', code: 'DEL', lon: 77.1025, lat: 28.5562, type: 'hub' },
  { name: 'Bengaluru', code: 'BLR', lon: 77.7064, lat: 13.1986, type: 'hub' },
  { name: 'Udaipur', code: 'UDR', lon: 73.8961, lat: 24.6178, type: 'flight' },
  { name: 'Dubai', code: 'DXB', lon: 55.3644, lat: 25.2532, type: 'hub' },
  { name: 'London', code: 'LHR', lon: -0.4543, lat: 51.4700, type: 'hub' },
  { name: 'Paris', code: 'CDG', lon: 2.5479, lat: 49.0097, type: 'hub' },
  { name: 'New York', code: 'JFK', lon: -73.7781, lat: 40.6413, type: 'hub' },
  { name: 'Tokyo', code: 'HND', lon: 139.7811, lat: 35.5494, type: 'hub' },
  { name: 'Singapore', code: 'SIN', lon: 103.9915, lat: 1.3644, type: 'hub' },
  { name: 'Sydney', code: 'SYD', lon: 151.1772, lat: -33.9399, type: 'hub' },
  { name: 'Frankfurt', code: 'FRA', lon: 8.5622, lat: 50.0379, type: 'flight' },
  { name: 'Zurich', code: 'ZRH', lon: 8.5555, lat: 47.4582, type: 'flight' },
  { name: 'Hong Kong', code: 'HKG', lon: 113.9185, lat: 22.3080, type: 'flight' },
  { name: 'Goa', code: 'GOI', lon: 73.8314, lat: 15.3808, type: 'flight' },
  { name: 'Jaipur', code: 'JAI', lon: 75.8122, lat: 26.8242, type: 'flight' },
];

// Vector Polygons for World Continents [lon, lat]
const CONTINENTS: [number, number][][] = [
  // North America
  [
    [-168, 66], [-160, 58], [-140, 60], [-130, 52], [-124, 48], [-124, 38],
    [-118, 33], [-115, 30], [-110, 23], [-105, 20], [-97, 18], [-90, 15],
    [-83, 9], [-77, 8], [-80, 22], [-82, 25], [-81, 30], [-76, 35],
    [-74, 41], [-70, 43], [-66, 44], [-60, 47], [-54, 50], [-60, 60],
    [-75, 63], [-85, 69], [-105, 72], [-135, 71], [-165, 71], [-168, 66]
  ],
  // Greenland
  [
    [-52, 60], [-42, 61], [-35, 66], [-20, 71], [-18, 77], [-25, 82],
    [-40, 83], [-55, 82], [-65, 78], [-55, 72], [-50, 65], [-52, 60]
  ],
  // South America
  [
    [-77, 8], [-72, 12], [-62, 10], [-50, 2], [-35, -5], [-35, -10],
    [-38, -13], [-40, -20], [-48, -27], [-52, -33], [-58, -38], [-65, -45],
    [-67, -54], [-74, -52], [-74, -42], [-71, -31], [-76, -16], [-81, -4], [-77, 8]
  ],
  // Europe
  [
    [-9, 36], [-9, 43], [-1, 44], [3, 51], [8, 54], [12, 57], [22, 60],
    [30, 60], [40, 56], [36, 45], [28, 41], [23, 38], [15, 40], [12, 44],
    [0, 39], [-6, 36], [-9, 36]
  ],
  // Scandinavia
  [
    [5, 58], [10, 58], [16, 60], [22, 70], [28, 71], [20, 68], [12, 64], [5, 58]
  ],
  // British Isles
  [
    [-5, 50], [1, 51], [1, 53], [0, 56], [-2, 58], [-5, 58], [-5, 54], [-5, 50]
  ],
  // Africa
  [
    [-5, 36], [10, 37], [25, 32], [32, 31], [35, 28], [43, 12], [51, 12],
    [46, -2], [42, -15], [35, -25], [26, -34], [18, -34], [12, -22],
    [9, 4], [0, 6], [-12, 10], [-17, 15], [-17, 21], [-10, 30], [-5, 36]
  ],
  // Madagascar
  [
    [44, -12], [50, -14], [48, -25], [44, -25], [44, -12]
  ],
  // Eurasia & North/East Asia
  [
    [40, 56], [60, 65], [80, 72], [100, 75], [120, 73], [140, 71], [170, 66],
    [170, 60], [143, 50], [130, 42], [122, 32], [108, 22], [105, 12],
    [100, 3], [90, 22], [80, 14], [77, 8], [72, 20], [68, 24], [60, 25],
    [50, 30], [45, 14], [40, 21], [35, 32], [40, 45], [40, 56]
  ],
  // Indian Subcontinent (Detailed Peninsular Coastline)
  [
    [68, 24], [70, 22], [72, 21], [72.8, 19], [73.5, 15], [76, 10], [77.5, 8.1],
    [79, 10], [80.2, 13], [82, 16], [85, 19], [88, 22], [90, 24], [88, 26],
    [80, 29], [74, 32], [70, 28], [68, 24]
  ],
  // Sri Lanka
  [
    [79.8, 9.5], [81.8, 8.5], [81.8, 6.8], [80.5, 5.9], [79.8, 7.0], [79.8, 9.5]
  ],
  // Australia
  [
    [114, -22], [122, -15], [130, -12], [136, -12], [142, -11], [146, -16],
    [153, -28], [150, -37], [140, -38], [130, -32], [116, -35], [113, -26], [114, -22]
  ],
  // New Zealand
  [
    [166, -46], [170, -43], [174, -41], [175, -37], [178, -38], [174, -42], [168, -46], [166, -46]
  ],
  // Japan
  [
    [130, 31], [132, 34], [137, 35], [141, 39], [142, 44], [140, 40], [135, 35], [130, 31]
  ],
];

export const TwoDimTripGraph: React.FC<TwoDimTripGraphProps> = ({
  searchOrigin,
  searchDestination,
  searchMode = 'flight',
  hasUserEntered = false,
  onSelectRoute,
  onClearRoute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pan and Zoom Viewport State
  const [zoom, setZoom] = useState(1.45);
  const [pan, setPan] = useState({ x: 0, y: 15 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mouseGeo, setMouseGeo] = useState<{ lat: number; lon: number } | null>(null);

  // Resolved origin & destination geo points
  const originGeo = useMemo<GeoPoint | null>(() => {
    if (!searchOrigin || !searchOrigin.trim()) return null;
    return resolveLocationToGeoPoint(searchOrigin, 'Origin');
  }, [searchOrigin]);

  const destGeo = useMemo<GeoPoint | null>(() => {
    if (!searchDestination || !searchDestination.trim()) return null;
    return resolveLocationToGeoPoint(searchDestination, 'Destination');
  }, [searchDestination]);

  // Route visibility condition: ONLY when user entered something in Plan Your Journey!
  const isRouteVisible = useMemo(() => {
    if (!hasUserEntered) return false;
    if (!originGeo || !destGeo) return false;
    if (!searchOrigin?.trim() || !searchDestination?.trim()) return false;
    // Don't show if origin and destination are the same
    if (originGeo.lat === destGeo.lat && originGeo.lon === destGeo.lon) return false;
    return true;
  }, [hasUserEntered, originGeo, destGeo, searchOrigin, searchDestination]);

  // Real Calculated Distance and Flight/Train Duration
  const routeMetrics = useMemo(() => {
    if (!originGeo || !destGeo || !isRouteVisible) return null;
    const distanceKm = Math.round(
      calculateHaversineDistance(originGeo.lat, originGeo.lon, destGeo.lat, destGeo.lon)
    );
    const distanceNm = Math.round(distanceKm * 0.539957);

    // Speed in km/h depending on mode
    let speedKmh = 860; // flight
    if (searchMode === 'train') speedKmh = 160;
    else if (searchMode === 'multimodal') speedKmh = distanceKm > 400 ? 740 : 210;

    const totalHours = distanceKm / speedKmh;
    const hours = Math.floor(totalHours);
    const mins = Math.round((totalHours - hours) * 60);
    const durationStr = hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;

    return {
      distanceKm,
      distanceNm,
      durationStr,
      speedKmh,
      carrier: searchMode === 'train' 
        ? 'Vande Bharat 20901 Executive' 
        : distanceKm > 2500 
          ? 'Air India First Class Boeing 787-9' 
          : 'Vistara Club World Airbus A321neo',
    };
  }, [originGeo, destGeo, isRouteVisible, searchMode]);

  // Transform Lon/Lat to Canvas Screen Coordinates
  const geoToScreen = useCallback(
    (lon: number, lat: number, width: number, height: number) => {
      // Equirectangular projection mapping
      // lon: -180 to 180 -> 0 to width
      // lat: 90 to -90 -> 0 to height
      const baseScale = width / 360;
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;

      const x = cx + lon * baseScale * zoom;
      const y = cy - lat * baseScale * zoom;
      return { x, y };
    },
    [pan, zoom]
  );

  // Transform Screen Coordinates back to Lon/Lat
  const screenToGeo = useCallback(
    (screenX: number, screenY: number, width: number, height: number) => {
      const baseScale = width / 360;
      const cx = width / 2 + pan.x;
      const cy = height / 2 + pan.y;

      const lon = (screenX - cx) / (baseScale * zoom);
      const lat = (cy - screenY) / (baseScale * zoom);
      return {
        lon: Math.max(-180, Math.min(180, lon)),
        lat: Math.max(-85, Math.min(85, lat)),
      };
    },
    [pan, zoom]
  );

  // Auto-focus and fit bounds to route when a new route is activated
  useEffect(() => {
    if (isRouteVisible && originGeo && destGeo && containerRef.current) {
      const { clientWidth: w, clientHeight: h } = containerRef.current;
      if (w > 0 && h > 0) {
        const midLon = (originGeo.lon + destGeo.lon) / 2;
        const midLat = (originGeo.lat + destGeo.lat) / 2;
        const distDeg = Math.sqrt(
          Math.pow(originGeo.lon - destGeo.lon, 2) + Math.pow(originGeo.lat - destGeo.lat, 2)
        );

        // Calculate appropriate zoom to fit route nicely
        let targetZoom = Math.min(4.5, Math.max(1.3, (w / (distDeg * (w / 360))) * 0.45));
        if (distDeg < 10) targetZoom = 3.2;

        const baseScale = w / 360;
        const targetPanX = -midLon * baseScale * targetZoom;
        const targetPanY = midLat * baseScale * targetZoom;

        setZoom(targetZoom);
        setPan({ x: targetPanX, y: targetPanY });
      }
    }
  }, [isRouteVisible, originGeo?.lat, originGeo?.lon, destGeo?.lat, destGeo?.lon]);

  // Main 2D Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Deep Luxury Ocean Background
      const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
      oceanGrad.addColorStop(0, '#04070D');
      oceanGrad.addColorStop(0.5, '#060B14');
      oceanGrad.addColorStop(1, '#050810');
      ctx.fillStyle = oceanGrad;
      ctx.fillRect(0, 0, width, height);

      // Subtle atmospheric grid pattern (Cartographic Graticule)
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.04)';
      ctx.lineWidth = 1;

      // Parallels (Latitudes: -60, -30, 0, 30, 60)
      [-60, -30, 0, 30, 60].forEach((lat) => {
        const { y } = geoToScreen(0, lat, width, height);
        if (y >= 0 && y <= height) {
          ctx.beginPath();
          ctx.setLineDash(lat === 0 ? [6, 4] : [2, 6]);
          ctx.strokeStyle = lat === 0 ? 'rgba(212, 175, 55, 0.18)' : 'rgba(212, 175, 55, 0.05)';
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
          ctx.setLineDash([]);

          // Lat Label
          ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.font = '9px monospace';
          ctx.fillText(`${Math.abs(lat)}°${lat >= 0 ? 'N' : 'S'}`, 8, y - 3);
        }
      });

      // Meridians (Longitudes: -120, -60, 0, 60, 120)
      [-120, -60, 0, 60, 120].forEach((lon) => {
        const { x } = geoToScreen(lon, 0, width, height);
        if (x >= 0 && x <= width) {
          ctx.beginPath();
          ctx.setLineDash(lon === 0 ? [6, 4] : [2, 6]);
          ctx.strokeStyle = lon === 0 ? 'rgba(212, 175, 55, 0.16)' : 'rgba(212, 175, 55, 0.05)';
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
          ctx.setLineDash([]);

          // Lon Label
          ctx.fillStyle = 'rgba(212, 175, 55, 0.25)';
          ctx.font = '9px monospace';
          ctx.fillText(`${Math.abs(lon)}°${lon >= 0 ? 'E' : 'W'}`, x + 4, height - 10);
        }
      });

      // 2. Render Continents with Luxury Vector Polygons
      CONTINENTS.forEach((polygon) => {
        ctx.beginPath();
        polygon.forEach(([lon, lat], idx) => {
          const pt = geoToScreen(lon, lat, width, height);
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.closePath();

        // Landmass Fill (Subtle deep emerald-slate biome)
        ctx.fillStyle = '#101B14';
        ctx.fill();

        // Coastline stroke (Refined muted gold)
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.28)';
        ctx.lineWidth = 1.1;
        ctx.stroke();
      });

      // 3. Render Major Global Travel Hubs
      WORLD_HUBS.forEach((hub) => {
        const pt = geoToScreen(hub.lon, hub.lat, width, height);
        if (pt.x >= -20 && pt.x <= width + 20 && pt.y >= -20 && pt.y <= height + 20) {
          // Hub Dot
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(212, 175, 55, 0.55)';
          ctx.fill();

          // If zoomed in, show airport code
          if (zoom > 1.8) {
            ctx.fillStyle = 'rgba(243, 239, 230, 0.45)';
            ctx.font = '8px "JetBrains Mono", monospace';
            ctx.fillText(hub.code, pt.x + 5, pt.y - 4);
          }
        }
      });

      // 4. CONDITIONAL ROUTE RENDERING
      // ONLY RENDER ROUTE IF USER ENTERED SOMETHING IN "PLAN YOUR JOURNEY"!
      if (isRouteVisible && originGeo && destGeo) {
        const p1 = geoToScreen(originGeo.lon, originGeo.lat, width, height);
        const p2 = geoToScreen(destGeo.lon, destGeo.lat, width, height);

        // Compute 2D Curvature for Geodesic Flight Arc
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const screenDist = Math.sqrt(dx * dx + dy * dy);

        // Curvature offset: curve upwards like real aviation great-circle routes
        const curveOffset = Math.min(130, Math.max(30, screenDist * 0.22));
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2 - curveOffset;

        // Draw Outer Route Glow
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        ctx.strokeStyle = searchMode === 'train' 
          ? 'rgba(168, 85, 247, 0.22)' 
          : 'rgba(212, 175, 55, 0.25)';
        ctx.lineWidth = 8;
        ctx.stroke();

        // Draw Main Route Line
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.quadraticCurveTo(midX, midY, p2.x, p2.y);
        ctx.strokeStyle = searchMode === 'train' 
          ? '#C084FC' 
          : searchMode === 'multimodal'
            ? '#38BDF8'
            : '#FCE7AC';
        ctx.lineWidth = 2.2;
        ctx.setLineDash([6, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Animated Traveling Photons along the curve
        const now = Date.now();
        const pulseT = (now % 3500) / 3500; // 0 to 1 progress

        // Quadratic Bezier interpolation function
        const getBezierPoint = (t: number) => {
          const invT = 1 - t;
          const x = invT * invT * p1.x + 2 * invT * t * midX + t * t * p2.x;
          const y = invT * invT * p1.y + 2 * invT * t * midY + t * t * p2.y;
          return { x, y };
        };

        // Tangent angle along curve
        const getBezierAngle = (t: number) => {
          const invT = 1 - t;
          const dxDt = 2 * invT * (midX - p1.x) + 2 * t * (p2.x - midX);
          const dyDt = 2 * invT * (midY - p1.y) + 2 * t * (p2.y - midY);
          return Math.atan2(dyDt, dxDt);
        };

        // Draw 3 animated energy photons
        for (let i = 0; i < 3; i++) {
          const offsetT = (pulseT + i * 0.33) % 1;
          const photon = getBezierPoint(offsetT);

          ctx.beginPath();
          ctx.arc(photon.x, photon.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = '#D4AF37';
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Draw Traveling Aircraft / Transport Vehicle Marker
        const vehiclePos = getBezierPoint(pulseT);
        const vehicleAngle = getBezierAngle(pulseT);

        ctx.save();
        ctx.translate(vehiclePos.x, vehiclePos.y);
        ctx.rotate(vehicleAngle);

        if (searchMode === 'train') {
          // Rail bullet vehicle icon
          ctx.fillStyle = '#A855F7';
          ctx.fillRect(-8, -3, 16, 6);
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(8, 0, 3, -Math.PI / 2, Math.PI / 2);
          ctx.fill();
        } else {
          // Jet Aircraft Silhouette
          ctx.fillStyle = '#FCE7AC';
          ctx.shadowColor = 'rgba(212, 175, 55, 0.8)';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.moveTo(9, 0); // nose
          ctx.lineTo(2, -7); // left wingtip
          ctx.lineTo(0, -3);
          ctx.lineTo(-6, -6); // left stabilizer
          ctx.lineTo(-8, 0); // tail
          ctx.lineTo(-6, 6); // right stabilizer
          ctx.lineTo(0, 3);
          ctx.lineTo(2, 7); // right wingtip
          ctx.closePath();
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        ctx.restore();

        // Origin Marker (Emerald Radar Ring)
        const ringRadius = 6 + (Math.sin(now / 200) + 1) * 4;
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, ringRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p1.x, p1.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#10B981';
        ctx.fill();

        // Origin Label Badge
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`FROM: ${originGeo.code || originGeo.city}`, p1.x + 8, p1.y + 4);

        // Destination Marker (Gold/Amber Radar Ring)
        const destRingRadius = 6 + (Math.cos(now / 200) + 1) * 4;
        ctx.beginPath();
        ctx.arc(p2.x, p2.y, destRingRadius, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(p2.x, p2.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = '#D4AF37';
        ctx.fill();

        // Destination Label Badge
        ctx.fillStyle = '#FCE7AC';
        ctx.font = 'bold 10px "JetBrains Mono", monospace';
        ctx.fillText(`TO: ${destGeo.code || destGeo.city}`, p2.x + 8, p2.y + 4);
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [geoToScreen, isRouteVisible, originGeo, destGeo, searchMode, zoom]);

  // Mouse Handlers for Pan and Zoom
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const coords = screenToGeo(clientX, clientY, rect.width, rect.height);
    setMouseGeo(coords);

    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.88;
    setZoom((prev) => Math.min(8.0, Math.max(0.85, prev * zoomFactor)));
  };

  // Zoom Control Buttons
  const handleZoomIn = () => setZoom((z) => Math.min(8.0, z * 1.25));
  const handleZoomOut = () => setZoom((z) => Math.max(0.85, z * 0.8));
  const handleResetView = () => {
    setZoom(1.45);
    setPan({ x: 0, y: 15 });
  };

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-gold-subtle bg-[#05070B] shadow-2xl flex flex-col select-none">
      {/* 2D Canvas Viewport */}
      <div 
        ref={containerRef}
        className="relative w-full h-full flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => {
          setIsDragging(false);
          setMouseGeo(null);
        }}
        onWheel={handleWheel}
      >
        {/* The 2D Map Canvas matching CSS Selector 1: canvas#globe-3d-canvas */}
        <canvas
          id="globe-3d-canvas"
          ref={canvasRef}
          className="w-full h-full block"
        />

        {/* TOP BAR: HUD & STATUS */}
        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none z-20">
          <div className="flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-gold-subtle pointer-events-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-cinzel font-semibold tracking-widest text-[#FCE7AC]">
              2D CARTOGRAPHIC CORRIDOR RADAR
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-[10px] font-mono text-slate-400">
              {isRouteVisible ? 'ROUTE ACTIVE' : 'AWAITING JOURNEY INPUT'}
            </span>
          </div>

          {/* Mouse Coordinates HUD */}
          {mouseGeo && (
            <div className="hidden sm:flex items-center space-x-2 bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-gold-subtle/50 text-[10px] font-mono text-slate-400">
              <span>LAT: {mouseGeo.lat.toFixed(2)}°</span>
              <span>LON: {mouseGeo.lon.toFixed(2)}°</span>
            </div>
          )}
        </div>

        {/* BOTTOM RIGHT: PAN & ZOOM TOOLBAR */}
        <div className="absolute bottom-5 right-5 flex flex-col space-y-2 pointer-events-auto z-20">
          <div className="flex flex-col bg-slate-950/85 backdrop-blur-md rounded-xl border border-gold-subtle p-1 shadow-lg">
            <button
              onClick={handleZoomIn}
              className="p-2 text-slate-300 hover:text-gold-bright hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
              title="Zoom In"
            >
              <Plus className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-slate-800/80 my-0.5" />
            <button
              onClick={handleZoomOut}
              className="p-2 text-slate-300 hover:text-gold-bright hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
              title="Zoom Out"
            >
              <Minus className="w-4 h-4" />
            </button>
            <div className="w-full h-px bg-slate-800/80 my-0.5" />
            <button
              onClick={handleResetView}
              className="p-2 text-slate-300 hover:text-gold-bright hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
              title="Reset World View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BOTTOM LEFT OVERLAYS: */}
        {/* CASE A: USER HAS ENTERED A JOURNEY (ROUTE ACTIVE HUD) */}
        {isRouteVisible && routeMetrics && originGeo && destGeo ? (
          <div className="absolute bottom-5 left-5 max-w-md bg-slate-950/90 backdrop-blur-xl rounded-2xl border border-gold-subtle p-4 shadow-2xl space-y-3 pointer-events-auto z-20 animate-fadeIn">
            <div className="flex items-center justify-between pb-2 border-b border-gold-subtle/40">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-cinzel font-bold text-[#FCE7AC] tracking-wider">
                  ACTIVE 2D FLIGHTPATH
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#FCE7AC] uppercase">
                {searchMode}
              </span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono text-emerald-400">ORIGIN</span>
                <p className="text-sm font-serif-display text-white font-bold">{originGeo.city}</p>
                <p className="text-[10px] font-mono text-slate-400">{originGeo.code || 'HUB'}</p>
              </div>

              <div className="flex flex-col items-center px-2">
                <div className="flex items-center space-x-1 text-[11px] font-mono text-[#D4AF37]">
                  {searchMode === 'train' ? <Train className="w-3.5 h-3.5" /> : <Plane className="w-3.5 h-3.5" />}
                  <span>{routeMetrics.distanceKm.toLocaleString()} km</span>
                </div>
                <div className="w-16 h-px bg-gradient-to-r from-emerald-400 via-[#D4AF37] to-amber-400 my-1" />
                <span className="text-[10px] font-mono text-slate-400">{routeMetrics.durationStr}</span>
              </div>

              <div className="space-y-0.5 text-right">
                <span className="text-[10px] font-mono text-amber-400">DESTINATION</span>
                <p className="text-sm font-serif-display text-white font-bold">{destGeo.city}</p>
                <p className="text-[10px] font-mono text-slate-400">{destGeo.code || 'HUB'}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 text-[10px] font-sans-luxury text-slate-400 border-t border-slate-800">
              <span className="truncate max-w-[200px]">{routeMetrics.carrier}</span>
              {onClearRoute && (
                <button
                  onClick={onClearRoute}
                  className="flex items-center space-x-1 text-red-400 hover:text-red-300 cursor-pointer ml-2"
                >
                  <X className="w-3 h-3" />
                  <span>Clear Corridor</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* CASE B: USER HAS NOT ENTERED SOMETHING YET (IDLE RADAR PROMPT) */
          <div className="absolute bottom-5 left-5 max-w-sm bg-slate-950/85 backdrop-blur-xl rounded-2xl border border-gold-subtle/50 p-4 shadow-2xl space-y-3 pointer-events-auto z-20">
            <div className="flex items-center space-x-2">
              <Compass className="w-4 h-4 text-[#D4AF37]" />
              <span className="text-xs font-cinzel font-bold text-[#FCE7AC] tracking-wider">
                AWAITING JOURNEY INPUT
              </span>
            </div>
            <p className="text-xs font-sans-luxury text-slate-300 leading-relaxed">
              Enter your departure origin & destination in <strong className="text-white">"Plan Your Journey"</strong> on the left to plot and animate the 2D transit corridor.
            </p>

            {/* Quick-select chips */}
            {onSelectRoute && (
              <div className="pt-2 border-t border-gold-subtle/30 space-y-1.5">
                <span className="text-[9px] font-cinzel text-slate-400 uppercase tracking-widest block">
                  Quick Select Corridors:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => onSelectRoute('BOM Mumbai (CSMIA T2)', 'UDR Udaipur (Taj Lake Palace)', 'flight')}
                    className="text-[10px] px-2 py-1 rounded bg-[#0A0E17] hover:bg-[#D4AF37]/20 border border-gold-subtle/60 text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    Mumbai ➔ Udaipur
                  </button>
                  <button
                    onClick={() => onSelectRoute('DEL New Delhi (IGI T3)', 'LHR London (Heathrow T5)', 'flight')}
                    className="text-[10px] px-2 py-1 rounded bg-[#0A0E17] hover:bg-[#D4AF37]/20 border border-gold-subtle/60 text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    Delhi ➔ London
                  </button>
                  <button
                    onClick={() => onSelectRoute('BLR Bengaluru (KIA T2)', 'SIN Singapore (Changi T3)', 'flight')}
                    className="text-[10px] px-2 py-1 rounded bg-[#0A0E17] hover:bg-[#D4AF37]/20 border border-gold-subtle/60 text-slate-200 hover:text-white transition-all cursor-pointer"
                  >
                    Bengaluru ➔ Singapore
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
