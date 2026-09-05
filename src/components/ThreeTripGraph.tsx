import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Booking, TripEdge, RecoveryOption } from '../types';
import { JourneyMode } from './HeroJourneySection';
import { 
  latLonToVector3, 
  vector3ToLatLon,
  generateJourneyCorridor, 
  generateGlobalAirCorridors,
  resolveLocationToGeoPoint,
  calculateHaversineDistance,
  createSurfaceCurve,
  GLOBAL_RADAR_HUBS,
  TransportRouteSegment, 
  GLOBE_RADIUS 
} from '../utils/geoCoordinates';
import { 
  createWorldMapTexture, 
  createGoogleTerrainTexture,
  createGoogleRoadHybridTexture,
  createCloudSphereMesh,
  createAtmosphereGlowMesh,
  createHubBeaconMesh,
  createAirplaneMesh, 
  createTrainMesh, 
  createCarMesh, 
  createBoatMesh, 
  createGoogleMapsPinMesh
} from '../utils/globeMeshBuilder';
import { 
  Plane, 
  Train, 
  Car, 
  Ship, 
  RotateCw, 
  Search, 
  Navigation, 
  Radio, 
  Eye, 
  Compass,
  Layers,
  Crosshair,
  MapPin,
  Plus,
  Minus
} from 'lucide-react';
import { LOCATION_SUGGESTIONS } from '../data/locations';

/**
 * Calculates optimal Google Maps / Earth 3D camera positioning and oblique angle
 * for whichever route the user is currently planning.
 */
export function computePlannedTripCamera(originQuery: string, destQuery: string) {
  const p1 = resolveLocationToGeoPoint(originQuery, 'Origin');
  const p2 = resolveLocationToGeoPoint(destQuery, 'Destination');
  const v1 = latLonToVector3(p1.lat, p1.lon);
  const v2 = latLonToVector3(p2.lat, p2.lon);
  const mid = v1.clone().add(v2).normalize();
  const dist = calculateHaversineDistance(p1.lat, p1.lon, p2.lat, p2.lon);

  // Surface travel direction vector
  const travelDir = v2.clone().sub(v1).normalize();

  // Optimal camera distance to frame the user's journey in Google Earth 3D style
  let radius = 12.0;
  if (dist < 400) {
    radius = 7.5; // High zoom ground & terrain
  } else if (dist < 1200) {
    radius = 8.4; // Regional route (e.g. Mumbai to Udaipur ~620 km)
  } else if (dist < 3000) {
    radius = 10.0;
  } else {
    radius = 12.8; // Continental / Transatlantic
  }

  // Google Maps / Earth 3D oblique aerial angle:
  // Position camera slightly offset behind the midpoint toward origin, looking along the path toward destination
  const camPos = mid.clone().multiplyScalar(radius);
  if (travelDir.lengthSq() > 0.001 && dist > 100) {
    camPos.sub(travelDir.clone().multiplyScalar(radius * 0.22));
    camPos.normalize().multiplyScalar(radius);
  }

  const lookAt = mid.clone().multiplyScalar(GLOBE_RADIUS * 0.95);
  return { camPos, lookAt, dist, p1, p2 };
}

interface ThreeTripGraphProps {
  bookings: Booking[];
  edges: TripEdge[];
  selectedBookingId?: string | null;
  onSelectBooking: (bookingId: string) => void;
  hoveredRecoveryOption?: RecoveryOption | null;
  activeRecoveryPlan?: RecoveryOption | null;
  isDisrupted: boolean;
  reducedMotion?: boolean;
  searchOrigin?: string;
  searchDestination?: string;
  searchMode?: JourneyMode;
  onSelectRoute?: (origin: string, dest: string, mode: JourneyMode) => void;
}

export const ThreeTripGraph: React.FC<ThreeTripGraphProps> = ({
  bookings,
  edges,
  selectedBookingId,
  onSelectBooking,
  hoveredRecoveryOption,
  activeRecoveryPlan,
  isDisrupted,
  reducedMotion = false,
  searchOrigin = 'BOM Mumbai (CSMIA T2)',
  searchDestination = 'UDR Udaipur (Taj Lake Palace)',
  searchMode = 'multimodal',
  onSelectRoute,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const globeGroupRef = useRef<THREE.Group | null>(null);
  const earthMeshRef = useRef<THREE.Mesh | null>(null);
  const cloudsMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Active destinations and transport segments
  const [activeOrigin, setActiveOrigin] = useState(searchOrigin);
  const [activeDestination, setActiveDestination] = useState(searchDestination);
  const [activeMode, setActiveMode] = useState<JourneyMode>(searchMode);

  // Google Map Type: Photorealistic Satellite 3D, Topographic Terrain 3D, or Dark Road Map 3D
  const [mapType, setMapType] = useState<'satellite' | 'terrain' | 'hybrid'>('satellite');

  // Keep in sync with parent props when updated from PlanJourneyWidget
  useEffect(() => {
    if (searchOrigin) setActiveOrigin(searchOrigin);
  }, [searchOrigin]);

  useEffect(() => {
    if (searchDestination) setActiveDestination(searchDestination);
  }, [searchDestination]);

  useEffect(() => {
    if (searchMode) setActiveMode(searchMode);
  }, [searchMode]);

  // Simulation controls
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<'all' | 'flight' | 'train' | 'car' | 'boat'>('all');
  const [isAutoRotate, setIsAutoRotate] = useState(!reducedMotion);
  const [followVehicleId, setFollowVehicleId] = useState<string | null>(null);
  const [activeTelemetry, setActiveTelemetry] = useState<{
    segmentId: string;
    title: string;
    mode: string;
    carrier: string;
    lat: number;
    lon: number;
    speedKmh: number;
    altitudeFt: number;
    progress: number;
    etaMinutes: number;
  } | null>(null);

  // Quick destination search input on map
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Camera targets: Start directly focused on the user's planned trip in 3D Google Earth angle!
  const initialCam = useMemo(() => {
    return computePlannedTripCamera(searchOrigin, searchDestination);
  }, [searchOrigin, searchDestination]);

  const targetCamPos = useRef<THREE.Vector3>(initialCam.camPos.clone());
  const targetLookAt = useRef<THREE.Vector3>(initialCam.lookAt.clone());
  const currentLookAt = useRef<THREE.Vector3>(initialCam.lookAt.clone());
  const cameraAngleRef = useRef({ phi: 0.28, theta: 0.65 });

  // HUD & Layer controls
  const labelsOverlayRef = useRef<HTMLDivElement>(null);
  const [showClouds, setShowClouds] = useState(true);
  const [compassHeading, setCompassHeading] = useState(0);
  const [is3DView, setIs3DView] = useState(true);

  // Pointer drag tracking
  const pointerDownRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });

  // References to active 3D transport vehicles and animated particles
  const vehiclesRef = useRef<Map<string, {
    mesh: THREE.Group;
    segment: TransportRouteSegment;
    progress: number;
    speed: number;
  }>>(new Map());
  const lastTelemetryTimeRef = useRef<number>(0);
  const activeTelemetrySegmentRef = useRef<string | null>(null);

  // Generate multi-modal segments based on current origin & destination
  const userPlannedSegments = useMemo(() => {
    return generateJourneyCorridor(activeOrigin, activeDestination, activeMode);
  }, [activeOrigin, activeDestination, activeMode]);

  const globalCorridors = useMemo(() => {
    return generateGlobalAirCorridors();
  }, []);

  // Smoothly Fly Camera to User's Planned Trip whenever origin or destination changes
  useEffect(() => {
    const cam = computePlannedTripCamera(activeOrigin, activeDestination);
    targetCamPos.current.copy(cam.camPos);
    targetLookAt.current.copy(cam.lookAt);
    setFollowVehicleId(null);
  }, [activeOrigin, activeDestination]);

  // Recenter on Planned Route button handler
  const handleRecenterPlannedRoute = () => {
    const cam = computePlannedTripCamera(activeOrigin, activeDestination);
    targetCamPos.current.copy(cam.camPos);
    targetLookAt.current.copy(cam.lookAt);
    setFollowVehicleId(null);
  };

  // Switch Map Type Texture dynamically on Earth Sphere
  useEffect(() => {
    if (!earthMeshRef.current) return;
    let newTexture: THREE.CanvasTexture;
    if (mapType === 'terrain') {
      newTexture = createGoogleTerrainTexture();
    } else if (mapType === 'hybrid') {
      newTexture = createGoogleRoadHybridTexture();
    } else {
      newTexture = createWorldMapTexture();
    }
    const mat = earthMeshRef.current.material as THREE.MeshStandardMaterial;
    mat.map = newTexture;
    mat.needsUpdate = true;
  }, [mapType]);

  // Iconic preset circuits for instant discovery
  const PRESET_CIRCUITS = [
    { label: 'Mumbai → Udaipur', orig: 'Mumbai BOM', dest: 'Udaipur (Taj Lake Palace)', mode: 'multimodal' as JourneyMode, desc: 'Flight + Maybach + Royal Shikara' },
    { label: 'Delhi → Kashmir', orig: 'Delhi DEL', dest: 'Srinagar (Dal Lake)', mode: 'flight' as JourneyMode, desc: 'Aviation Corridor + Dal Lake Flotilla' },
    { label: 'Mumbai → Zurich', orig: 'Mumbai BOM', dest: 'Zurich ZRH (Swiss Alps)', mode: 'flight' as JourneyMode, desc: 'Dreamliner Jet + Alpine Glacier Rail' },
    { label: 'London → Amalfi', orig: 'London LHR', dest: 'Amalfi Coast (Positano)', mode: 'multimodal' as JourneyMode, desc: 'Eurostar + Frecciarossa + Riva Yacht' },
    { label: 'Mumbai → Tokyo', orig: 'Mumbai BOM', dest: 'Tokyo HND (Kyoto)', mode: 'flight' as JourneyMode, desc: 'Intercontinental Jet + Shinkansen Bullet' },
    { label: 'Dubai → Udaipur', orig: 'Dubai DXB', dest: 'Udaipur (Jagmandir)', mode: 'multimodal' as JourneyMode, desc: 'Emirates Royal Link + Palace Shuttle' },
  ];

  // Initialize Three.js Scene with 3D Earth Globe
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070B);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.copy(initialCam.camPos);
    camera.lookAt(initialCam.lookAt);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.domElement.id = 'globe-3d-canvas';
    renderer.domElement.className = 'w-full h-full block object-cover outline-none select-none';
    renderer.domElement.style.touchAction = 'none';
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting (Direct sunlight from Northeast + ambient space light)
    const ambientLight = new THREE.AmbientLight(0x1F2430, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFDF8E2, 3.2);
    sunLight.position.set(14, 12, 10);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38BDF8, 1.8);
    rimLight.position.set(-12, -6, -8);
    scene.add(rimLight);

    // Stardust Particles (Champagne Gold & Azure)
    const starCount = 600;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      starPos[i] = (Math.random() - 0.5) * 50;
      starPos[i + 1] = (Math.random() - 0.5) * 40;
      starPos[i + 2] = (Math.random() - 0.5) * 50;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xE5C07B,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Main Globe Group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);
    globeGroupRef.current = globeGroup;

    // 1. 3D Earth Sphere
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const initialTexture = mapType === 'terrain' 
      ? createGoogleTerrainTexture() 
      : mapType === 'hybrid' 
      ? createGoogleRoadHybridTexture() 
      : createWorldMapTexture();

    const earthMat = new THREE.MeshStandardMaterial({
      map: initialTexture,
      roughness: 0.45,
      metalness: 0.15,
      emissive: 0x05070A,
      emissiveIntensity: 0.2,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.name = 'earthSphere';
    globeGroup.add(earthMesh);
    earthMeshRef.current = earthMesh;

    // 2. Photorealistic 3D Cloud Sphere
    const cloudMesh = createCloudSphereMesh(GLOBE_RADIUS);
    globeGroup.add(cloudMesh);
    cloudsMeshRef.current = cloudMesh;

    // 3. Atmospheric Fresnel Rim Glow
    const atmosMesh = createAtmosphereGlowMesh(GLOBE_RADIUS);
    globeGroup.add(atmosMesh);

    // 4. Orbital Latitude/Longitude Equatorial Halo Ring
    const orbitRingGeo = new THREE.RingGeometry(GLOBE_RADIUS * 1.15, GLOBE_RADIUS * 1.16, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0x4285F4,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.25,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
    orbitRing.name = 'orbitRing';
    orbitRing.rotation.x = Math.PI / 2;
    globeGroup.add(orbitRing);

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Wheel zoom handling
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      const currentDist = targetCamPos.current.length();
      const newDist = Math.max(6.8, Math.min(22, currentDist + e.deltaY * 0.008));
      targetCamPos.current.normalize().multiplyScalar(newDist);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      container.removeEventListener('wheel', handleWheel);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      renderer.dispose();
    };
  }, []);

  // Populate Routes, Google Maps Pins & Animated Vehicles on the 3D Globe
  useEffect(() => {
    if (!globeGroupRef.current || !sceneRef.current) return;
    const globeGroup = globeGroupRef.current;

    // Remove existing routes, pins, and vehicles (keep earth sphere, clouds, atmosphere, halo)
    const toRemove: THREE.Object3D[] = [];
    globeGroup.children.forEach((child) => {
      if (
        child.name !== 'earthSphere' && 
        child.name !== 'cloudSphere' && 
        child.name !== 'atmosphereGlow' && 
        child.name !== 'orbitRing' && 
        child.type !== 'Points'
      ) {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => globeGroup.remove(obj));

    vehiclesRef.current.clear();

    // 1. RENDER USER'S PLANNED TRANSPORTATION CORRIDOR (Top Visual Hierarchy)
    userPlannedSegments.forEach((segment) => {
      if (filterMode !== 'all' && segment.mode !== filterMode) return;

      const curve = segment.curve;

      if (segment.mode === 'flight') {
        // High-Altitude Parabolic Aviation Corridor (Google Maps Blue / Glowing Tube)
        const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.065, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: 0x4285F4, // Google Maps Navigation Blue
          emissive: 0x2563EB,
          emissiveIntensity: 0.85,
          metalness: 0.8,
          roughness: 0.2,
          transparent: true,
          opacity: 0.95,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        globeGroup.add(tubeMesh);

        // Ground Projection Trail (surface-hugging dashed line underneath flight path)
        const p1 = latLonToVector3(segment.from.lat, segment.from.lon);
        const p2 = latLonToVector3(segment.to.lat, segment.to.lon);
        const { points: groundPoints } = createSurfaceCurve(p1, p2, 0.02, 60);
        const groundGeo = new THREE.BufferGeometry().setFromPoints(groundPoints);
        const groundMat = new THREE.LineDashedMaterial({
          color: 0x60A5FA,
          dashSize: 0.25,
          gapSize: 0.12,
          transparent: true,
          opacity: 0.85,
        });
        const groundLine = new THREE.Line(groundGeo, groundMat);
        groundLine.computeLineDistances();
        globeGroup.add(groundLine);

        // Animated Airplane Mesh
        const planeMesh = createAirplaneMesh(0x4285F4);
        globeGroup.add(planeMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: planeMesh,
          segment,
          progress: 0.2,
          speed: 0.0022 * simSpeed,
        });
      } else if (segment.mode === 'train') {
        // High-Speed Rail Corridor
        const railGeo = new THREE.TubeGeometry(curve, 60, 0.045, 6, false);
        const railMat = new THREE.MeshStandardMaterial({
          color: 0xA78BFA,
          emissive: 0x7C3AED,
          emissiveIntensity: 0.9,
          transparent: true,
          opacity: 0.95,
        });
        const railMesh = new THREE.Mesh(railGeo, railMat);
        globeGroup.add(railMesh);

        const trainMesh = createTrainMesh();
        globeGroup.add(trainMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: trainMesh,
          segment,
          progress: 0.35,
          speed: 0.0025 * simSpeed,
        });
      } else if (segment.mode === 'car') {
        // VIP Highway Ribbon
        const roadGeo = new THREE.TubeGeometry(curve, 40, 0.04, 6, false);
        const roadMat = new THREE.MeshStandardMaterial({
          color: 0x38BDF8,
          emissive: 0x0284C7,
          emissiveIntensity: 0.85,
          transparent: true,
          opacity: 0.95,
        });
        const roadMesh = new THREE.Mesh(roadGeo, roadMat);
        globeGroup.add(roadMesh);

        const carMesh = createCarMesh();
        globeGroup.add(carMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: carMesh,
          segment,
          progress: 0.45,
          speed: 0.0028 * simSpeed,
        });
      } else if (segment.mode === 'boat') {
        // Waterway Route
        const waterGeo = new THREE.TubeGeometry(curve, 30, 0.035, 6, false);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x34D399,
          emissive: 0x059669,
          emissiveIntensity: 0.85,
          transparent: true,
          opacity: 0.95,
        });
        const waterMesh = new THREE.Mesh(waterGeo, waterMat);
        globeGroup.add(waterMesh);

        const boatMesh = createBoatMesh();
        globeGroup.add(boatMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: boatMesh,
          segment,
          progress: 0.6,
          speed: 0.002 * simSpeed,
        });
      }
    });

    // 2. RENDER ICONIC GOOGLE MAPS 3D PINS FOR THE PLANNED TRIP
    if (userPlannedSegments.length > 0) {
      // Origin Pin (Google Maps Departure Marker: White Circle with Green Core)
      const origWp = userPlannedSegments[0].from;
      const origPin = createGoogleMapsPinMesh('origin', origWp.name);
      const origPos = latLonToVector3(origWp.lat, origWp.lon);
      origPin.position.copy(origPos);
      const origNormal = origPos.clone().normalize();
      origPin.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), origNormal));
      globeGroup.add(origPin);

      // Destination Pin (Iconic Google Maps Red Drop Pin with White Eye & Ripple)
      const destWp = userPlannedSegments[userPlannedSegments.length - 1].to;
      const destPin = createGoogleMapsPinMesh('destination', destWp.name);
      const destPos = latLonToVector3(destWp.lat, destWp.lon);
      destPin.position.copy(destPos);
      const destNormal = destPos.clone().normalize();
      destPin.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), destNormal));
      globeGroup.add(destPin);

      // Intermediate Waypoints (Transfer Station / Jetty)
      if (userPlannedSegments.length > 1) {
        for (let i = 0; i < userPlannedSegments.length - 1; i++) {
          const midWp = userPlannedSegments[i].to;
          const wpPin = createGoogleMapsPinMesh('waypoint', midWp.name);
          const wpPos = latLonToVector3(midWp.lat, midWp.lon);
          wpPin.position.copy(wpPos);
          const wpNormal = wpPos.clone().normalize();
          wpPin.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), wpNormal));
          globeGroup.add(wpPin);
        }
      }
    }

    // 3. AMBIENT GLOBAL AIR CORRIDORS (Subtle Background Life)
    globalCorridors.forEach((segment) => {
      if (userPlannedSegments.some(us => us.id === segment.id)) return;
      const tubeGeo = new THREE.TubeGeometry(segment.curve, 50, 0.02, 6, false);
      const tubeMat = new THREE.MeshBasicMaterial({
        color: 0x38BDF8,
        transparent: true,
        opacity: 0.2,
      });
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      globeGroup.add(tube);
    });

    // 4. Global Radar Hubs
    GLOBAL_RADAR_HUBS.forEach((hub) => {
      const beacon = createHubBeaconMesh(hub.name, hub.isMainHub, hub.isMainHub ? 0x06B6D4 : 0x22D3EE);
      const pos = latLonToVector3(hub.lat, hub.lon);
      beacon.position.copy(pos);
      const normal = pos.clone().normalize();
      beacon.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal));
      beacon.name = 'hubBeacon';
      globeGroup.add(beacon);
    });

  }, [userPlannedSegments, globalCorridors, filterMode, simSpeed]);

  // Main 60 FPS Render & Animation Loop
  useEffect(() => {
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Smooth Camera Damping
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.05);
        currentLookAt.current.lerp(targetLookAt.current, 0.05);
        cameraRef.current.lookAt(currentLookAt.current);

        // Update compass heading based on camera azimuth
        const camDir = cameraRef.current.position.clone().sub(currentLookAt.current).normalize();
        const headingDeg = Math.round((Math.atan2(camDir.x, camDir.z) * 180) / Math.PI);
        setCompassHeading(headingDeg);
      }

      // 1. Animate Active Transport Vehicles along their 3D curves
      vehiclesRef.current.forEach((vehicle, segmentId) => {
        const { mesh, segment, progress } = vehicle;
        const curve = segment.curve;

        let newProgress = progress + vehicle.speed;
        if (newProgress > 1.0) newProgress = 0.0;
        vehicle.progress = newProgress;

        const currentPt = curve.getPointAt(newProgress);
        mesh.position.copy(currentPt);

        const tangentProgress = Math.min(1.0, newProgress + 0.015);
        const forwardPt = curve.getPointAt(tangentProgress);
        mesh.lookAt(forwardPt);

        // Dynamic pitch and banking
        if (segment.mode === 'flight') {
          const climbRate = Math.cos(newProgress * Math.PI) * 0.2;
          mesh.rotation.x += climbRate;
          mesh.rotation.z += Math.sin(newProgress * Math.PI * 4) * 0.08;
        }

        // Real-Time Telemetry Tracking
        const now = performance.now();
        if (now - lastTelemetryTimeRef.current > 300) {
          if (!activeTelemetrySegmentRef.current || activeTelemetrySegmentRef.current === segmentId || followVehicleId === segmentId) {
            lastTelemetryTimeRef.current = now;
            activeTelemetrySegmentRef.current = segmentId;
            const latLon = vector3ToLatLon(currentPt);
            const remainingPct = (1 - newProgress);
            const remainingDist = Math.round(segment.distanceKm * remainingPct);
            const etaMins = Math.round((remainingDist / segment.speedKmh) * 60);

            setActiveTelemetry({
              segmentId,
              title: segment.title,
              mode: segment.mode,
              carrier: segment.carrierOrLine,
              lat: Number(latLon.lat.toFixed(3)),
              lon: Number(latLon.lon.toFixed(3)),
              speedKmh: segment.speedKmh,
              altitudeFt: Math.round(segment.altitudeFt * (0.3 + 0.7 * Math.sin(Math.PI * newProgress))),
              progress: Math.round(newProgress * 100),
              etaMinutes: etaMins,
            });
          }
        }

        // Follow Vehicle / 3D Cockpit Fly-Along Mode
        if (followVehicleId === segmentId && cameraRef.current) {
          const tangent = curve.getTangentAt(newProgress).normalize();
          const normal = currentPt.clone().normalize();
          // Position camera behind and above vehicle looking forward along trajectory
          const chaseCam = currentPt.clone()
            .sub(tangent.clone().multiplyScalar(1.2))
            .add(normal.clone().multiplyScalar(0.6));

          targetCamPos.current.copy(chaseCam);
          targetLookAt.current.copy(currentPt.clone().add(tangent.clone().multiplyScalar(1.5)));
        }
      });

      // 2. Animate Clouds
      if (cloudsMeshRef.current && showClouds) {
        cloudsMeshRef.current.rotation.y += 0.00016;
      }

      // 3. Animate Google Maps Pins and Radar Rings
      if (globeGroupRef.current) {
        globeGroupRef.current.children.forEach((child) => {
          if (child.name === 'hubBeacon') {
            const pulse = child.getObjectByName('outerPulseRing');
            if (pulse) {
              const s = 1 + Math.sin(Date.now() * 0.0035) * 0.14;
              pulse.scale.set(s, s, s);
            }
          } else if (child.children.length > 0) {
            const jewel = child.getObjectByName('pinJewel');
            const groundPulse = child.getObjectByName('groundPulse');
            if (jewel && jewel.name === 'pinJewel') {
              jewel.position.y += Math.sin(Date.now() * 0.004) * 0.0008;
            }
            if (groundPulse) {
              const scale = 1 + Math.sin(Date.now() * 0.004) * 0.18;
              groundPulse.scale.set(scale, scale, scale);
            }
          }
        });
      }

      // 4. Update 2D Screen-Projected Floating Google Maps Hub Badges
      if (cameraRef.current && containerRef.current && labelsOverlayRef.current) {
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        const camPos = cameraRef.current.position;
        const labelEls = labelsOverlayRef.current.children;

        // Display labels for the planned departure and destination
        if (userPlannedSegments.length > 0) {
          const origWp = userPlannedSegments[0].from;
          const destWp = userPlannedSegments[userPlannedSegments.length - 1].to;
          const displayPoints = [
            { name: origWp.name, type: 'Origin', lat: origWp.lat, lon: origWp.lon },
            { name: destWp.name, type: 'Destination', lat: destWp.lat, lon: destWp.lon },
          ];

          displayPoints.forEach((pt, idx) => {
            const el = labelEls[idx] as HTMLElement | undefined;
            if (!el) return;
            const worldPos = latLonToVector3(pt.lat, pt.lon);
            const normal = worldPos.clone().normalize();
            const toCam = camPos.clone().sub(worldPos).normalize();
            const dot = normal.dot(toCam);

            if (dot > 0.05) {
              const screenPos = worldPos.clone().project(cameraRef.current!);
              const x = (screenPos.x * 0.5 + 0.5) * w;
              const y = (-(screenPos.y * 0.5) + 0.5) * h;
              el.style.transform = `translate3d(${Math.round(x + 10)}px, ${Math.round(y - 20)}px, 0)`;
              el.style.display = 'flex';
            } else {
              el.style.display = 'none';
            }
          });
        }
      }

      // 5. Gentle Auto-Orbit if Enabled and not dragging or following a vehicle
      if (isAutoRotate && !pointerDownRef.current && !followVehicleId && !reducedMotion) {
        cameraAngleRef.current.theta += 0.0008;
        const currentDist = targetCamPos.current.length();
        targetCamPos.current.x = currentDist * Math.sin(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
        targetCamPos.current.z = currentDist * Math.cos(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
        targetCamPos.current.y = currentDist * Math.sin(cameraAngleRef.current.phi);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [isAutoRotate, followVehicleId, simSpeed, reducedMotion, userPlannedSegments]);

  // Pointer Drag Rotation Controls on the Globe
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = true;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    setFollowVehicleId(null);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDownRef.current) return;
    const deltaX = e.clientX - pointerPosRef.current.x;
    const deltaY = e.clientY - pointerPosRef.current.y;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };

    cameraAngleRef.current.theta -= deltaX * 0.005;
    cameraAngleRef.current.phi = Math.max(-1.1, Math.min(1.1, cameraAngleRef.current.phi + deltaY * 0.005));

    const currentDist = targetCamPos.current.length();
    targetCamPos.current.x = currentDist * Math.sin(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
    targetCamPos.current.y = currentDist * Math.sin(cameraAngleRef.current.phi);
    targetCamPos.current.z = currentDist * Math.cos(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);

    setIsAutoRotate(false);
  };

  const handlePointerUp = () => {
    pointerDownRef.current = false;
  };

  // Preset Route Click
  const handleSelectPreset = (preset: typeof PRESET_CIRCUITS[0]) => {
    setActiveOrigin(preset.orig);
    setActiveDestination(preset.dest);
    setActiveMode(preset.mode);
    setFollowVehicleId(null);
    onSelectRoute?.(preset.orig, preset.dest, preset.mode);
  };

  // Quick Mode Switcher right on the 3D Map
  const handleSwitchMode = (newMode: JourneyMode) => {
    setActiveMode(newMode);
    onSelectRoute?.(activeOrigin, activeDestination, newMode);
  };

  // Filter autocomplete suggestions for the map search input
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) return [];
    const q = searchQuery.toLowerCase();
    return LOCATION_SUGGESTIONS.filter(
      (loc) =>
        loc.city.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery]);

  return (
    <div className="relative w-full h-full rounded-3xl overflow-hidden border border-gold-subtle bg-[#05070B] shadow-2xl flex flex-col select-none">
      {/* 3D WebGL Canvas Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* 2D Projected Floating Google Maps Hub Badges */}
      <div
        ref={labelsOverlayRef}
        className="absolute inset-0 pointer-events-none overflow-hidden z-10 select-none"
      >
        {/* Origin Departure Badge */}
        <div className="absolute top-0 left-0 hidden flex-col select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-emerald-400/70">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-white text-[11px] font-bold tracking-tight font-sans">
              {activeOrigin.split(' ')[0]}
            </span>
          </div>
          <span className="text-emerald-400 text-[9px] font-mono font-semibold uppercase tracking-wider">
            DEPARTURE
          </span>
        </div>

        {/* Destination Red Pin Badge */}
        <div className="absolute top-0 left-0 hidden flex-col select-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] bg-slate-950/85 backdrop-blur-md px-2.5 py-1 rounded-xl border border-[#EA4335]/80">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#EA4335] animate-ping" />
            <span className="text-white text-[11px] font-bold tracking-tight font-sans">
              {activeDestination.split('(')[0].trim()}
            </span>
          </div>
          <span className="text-[#EA4335] text-[9px] font-mono font-semibold uppercase tracking-wider">
            DESTINATION
          </span>
        </div>
      </div>

      {/* TOP FLOATING GOOGLE MAPS 3D NAVIGATION HEADER */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 pointer-events-none">
        {/* Left: Google Maps 3D Live Trip Navigation Card */}
        <div className="pointer-events-auto flex flex-col sm:flex-row items-start sm:items-center gap-3 p-2.5 sm:px-4 sm:py-2.5 rounded-2xl bg-slate-950/92 backdrop-blur-2xl border border-gold-bright/40 shadow-2xl">
          {/* Google 4-Color Identity Emblem & Title */}
          <div className="flex items-center space-x-2.5 pr-2 sm:border-r border-slate-800">
            <div className="flex items-center space-x-1 bg-white/10 p-1.5 rounded-xl">
              <span className="w-2 h-2 rounded-full bg-[#4285F4]" />
              <span className="w-2 h-2 rounded-full bg-[#EA4335]" />
              <span className="w-2 h-2 rounded-full bg-[#FBBC04]" />
              <span className="w-2 h-2 rounded-full bg-[#34A853]" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-sans-luxury text-xs font-bold text-white tracking-wide">
                  Google Maps 3D
                </span>
                <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  LIVE
                </span>
              </div>
              <div className="text-[10px] font-mono text-slate-400 flex items-center space-x-1">
                <Navigation className="w-2.5 h-2.5 text-blue-400" />
                <span className="truncate max-w-[200px] text-slate-300">
                  {activeOrigin.split(' ')[0]} ➔ {activeDestination.split('(')[0].trim()}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Transportation Mode Switcher (Flight, Train, Car, Multimodal) */}
          <div className="flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => handleSwitchMode('flight')}
              title="View Planned Route as Flight"
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                activeMode === 'flight'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Plane className="w-3 h-3" />
              <span>Flight</span>
            </button>

            <button
              onClick={() => handleSwitchMode('train')}
              title="View Planned Route as High-Speed Rail"
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                activeMode === 'train'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Train className="w-3 h-3" />
              <span>Rail</span>
            </button>

            <button
              onClick={() => handleSwitchMode('car')}
              title="View Planned Route as Highway Drive"
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                activeMode === 'car'
                  ? 'bg-sky-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Car className="w-3 h-3" />
              <span>Drive</span>
            </button>

            <button
              onClick={() => handleSwitchMode('multimodal')}
              title="View Planned Route as Multimodal Corridor"
              className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold flex items-center space-x-1 transition-all cursor-pointer ${
                activeMode === 'multimodal'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Navigation className="w-3 h-3" />
              <span>Multi-Modal</span>
            </button>
          </div>

          {/* Map Layer Style Switcher: Satellite / Terrain / Road Map */}
          <div className="hidden xl:flex items-center space-x-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setMapType('satellite')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                mapType === 'satellite' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapType('terrain')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                mapType === 'terrain' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Terrain 3D
            </button>
            <button
              onClick={() => setMapType('hybrid')}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all cursor-pointer ${
                mapType === 'hybrid' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              Road 3D
            </button>
          </div>
        </div>

        {/* Right: Search Destination on 3D Globe */}
        <div className="pointer-events-auto relative w-full sm:w-64">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-blue-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search destination on 3D map..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-700 text-xs font-sans text-slate-100 placeholder-slate-400 focus:outline-none focus:border-blue-400 transition-all shadow-lg"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showSearchDropdown && filteredSuggestions.length > 0 && (
            <div className="absolute top-full mt-1.5 left-0 right-0 z-30 rounded-2xl bg-slate-950/98 backdrop-blur-2xl border border-blue-500/50 shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto">
              {filteredSuggestions.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setActiveDestination(`${loc.city} (${loc.code})`);
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                    onSelectRoute?.(activeOrigin, `${loc.city} (${loc.code})`, activeMode);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-blue-600/20 flex items-center justify-between text-xs transition-colors cursor-pointer border-b border-slate-800 last:border-none"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {loc.type === 'flight' ? (
                      <Plane className="w-3 h-3 text-blue-400 flex-shrink-0" />
                    ) : (
                      <Train className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    )}
                    <span className="text-slate-200 font-medium truncate">{loc.city}</span>
                    <span className="text-[10px] text-slate-400">({loc.code})</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">{loc.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT 3D NAVIGATION CONTROLS: Dynamic Compass, Recenter Route, 3D Mode, Clouds & Zoom */}
      <div className="absolute top-24 right-4 z-20 flex flex-col space-y-2 pointer-events-auto">
        {/* Dynamic Compass Needle */}
        <button
          onClick={() => {
            cameraAngleRef.current.phi = 0.28;
            cameraAngleRef.current.theta = 0.65;
            const currentDist = targetCamPos.current.length();
            targetCamPos.current.x = currentDist * Math.sin(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
            targetCamPos.current.y = currentDist * Math.sin(cameraAngleRef.current.phi);
            targetCamPos.current.z = currentDist * Math.cos(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
            targetLookAt.current.set(0, 0, 0);
          }}
          title="Reset North Orientation"
          className="w-10 h-10 rounded-full bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 hover:border-blue-400 text-slate-200 hover:text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer group"
        >
          <div 
            className="w-5 h-5 flex items-center justify-center transition-transform duration-150"
            style={{ transform: `rotate(${-compassHeading}deg)` }}
          >
            <Compass className="w-5 h-5 text-blue-400 group-hover:text-white" />
          </div>
        </button>

        {/* Recenter on User's Planned Route */}
        <button
          onClick={handleRecenterPlannedRoute}
          title="Recenter Camera on Planned Route"
          className="w-10 h-10 rounded-full bg-slate-950/90 backdrop-blur-xl border border-blue-500/60 hover:border-blue-400 text-blue-400 hover:text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer shadow-blue-950/50"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        {/* 3D Perspective Mode / Tilt Toggle */}
        <button
          onClick={() => {
            const next3D = !is3DView;
            setIs3DView(next3D);
            cameraAngleRef.current.phi = next3D ? 0.28 : 0.85;
            const currentDist = targetCamPos.current.length();
            targetCamPos.current.x = currentDist * Math.sin(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
            targetCamPos.current.y = currentDist * Math.sin(cameraAngleRef.current.phi);
            targetCamPos.current.z = currentDist * Math.cos(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
          }}
          title="Toggle 3D / 2D Tilt Angle"
          className="w-10 h-10 rounded-full bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 hover:border-blue-400 text-slate-200 hover:text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer font-bold text-xs"
        >
          <span className="font-mono text-[11px] text-blue-400">{is3DView ? '3D' : '2D'}</span>
        </button>

        {/* Clouds / Weather Layer Toggle */}
        <button
          onClick={() => {
            if (cloudsMeshRef.current) {
              cloudsMeshRef.current.visible = !cloudsMeshRef.current.visible;
              setShowClouds(cloudsMeshRef.current.visible);
            }
          }}
          title={showClouds ? 'Hide Cloud Formations' : 'Show Cloud Formations'}
          className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-2xl transition-all cursor-pointer ${
            showClouds
              ? 'bg-slate-950/95 border-blue-400 text-blue-400 shadow-blue-950/50'
              : 'bg-slate-950/70 border-slate-700/60 text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Zoom In */}
        <button
          onClick={() => {
            const currentDist = targetCamPos.current.length();
            const newDist = Math.max(6.8, currentDist * 0.85);
            targetCamPos.current.normalize().multiplyScalar(newDist);
          }}
          title="Zoom In"
          className="w-10 h-10 rounded-full bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 hover:border-blue-400 text-slate-200 hover:text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 text-slate-300" />
        </button>

        {/* Zoom Out */}
        <button
          onClick={() => {
            const currentDist = targetCamPos.current.length();
            const newDist = Math.min(22, currentDist * 1.15);
            targetCamPos.current.normalize().multiplyScalar(newDist);
          }}
          title="Zoom Out"
          className="w-10 h-10 rounded-full bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 hover:border-blue-400 text-slate-200 hover:text-white flex items-center justify-center shadow-2xl transition-all cursor-pointer"
        >
          <Minus className="w-4 h-4 text-slate-300" />
        </button>
      </div>

      {/* TOP-LEFT PRESET CIRCUITS CHIPS */}
      <div className="absolute top-20 left-4 z-10 hidden lg:flex flex-wrap gap-1.5 pointer-events-auto max-w-xl">
        {PRESET_CIRCUITS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(p)}
            className={`px-3 py-1 rounded-full text-[10px] font-sans tracking-wide border transition-all cursor-pointer shadow-md backdrop-blur-md ${
              activeDestination.includes(p.dest.split(' ')[0])
                ? 'bg-blue-600/30 border-blue-400 text-blue-200 font-semibold'
                : 'bg-slate-950/80 border-slate-700/60 text-slate-300 hover:text-white hover:border-slate-500'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* BOTTOM-RIGHT: GOOGLE MAPS 3D TELEMETRY & CHASE CAM HUD */}
      {activeTelemetry && (
        <div className="absolute bottom-4 right-4 z-10 w-80 sm:w-96 rounded-3xl bg-[#090C12]/95 backdrop-blur-2xl border border-blue-500/50 shadow-2xl p-4 sm:p-5 pointer-events-auto space-y-3 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-blue-500/20 text-blue-400">
                {activeTelemetry.mode === 'flight' ? (
                  <Plane className="w-4 h-4 text-blue-400" />
                ) : activeTelemetry.mode === 'train' ? (
                  <Train className="w-4 h-4 text-purple-400" />
                ) : activeTelemetry.mode === 'car' ? (
                  <Car className="w-4 h-4 text-sky-400" />
                ) : (
                  <Ship className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider">
                  GOOGLE 3D NAVIGATION
                </div>
                <div className="text-xs font-bold text-white truncate max-w-[190px]">
                  {activeTelemetry.carrier}
                </div>
              </div>
            </div>

            {/* Chase Camera / Fly-Along Toggle */}
            <button
              onClick={() => {
                if (followVehicleId === activeTelemetry.segmentId) {
                  setFollowVehicleId(null);
                } else {
                  setFollowVehicleId(activeTelemetry.segmentId);
                  setIsAutoRotate(false);
                }
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-semibold flex items-center space-x-1 border transition-all cursor-pointer ${
                followVehicleId === activeTelemetry.segmentId
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>{followVehicleId === activeTelemetry.segmentId ? 'COCKPIT CAM' : 'CHASE CAM'}</span>
            </button>
          </div>

          {/* Real-Time Flight & Ground Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[9px] text-slate-400">SPEED</div>
              <div className="text-xs font-mono font-bold text-blue-300 mt-0.5">
                {activeTelemetry.speedKmh} <span className="text-[8px]">km/h</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[9px] text-slate-400">ALTITUDE</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {activeTelemetry.altitudeFt.toLocaleString()} <span className="text-[8px]">ft</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[9px] text-slate-400">PROGRESS</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {activeTelemetry.progress}%
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <div className="text-[9px] text-slate-400">EST. TIME</div>
              <div className="text-xs font-mono font-bold text-amber-300 mt-0.5">
                {activeTelemetry.etaMinutes} <span className="text-[8px]">min</span>
              </div>
            </div>
          </div>

          {/* Progress Bar Corridor */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
              <span className="truncate max-w-[140px]">{activeOrigin}</span>
              <span className="truncate max-w-[140px] text-right">{activeDestination}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-blue-500 via-emerald-400 to-amber-300 rounded-full transition-all duration-300"
                style={{ width: `${activeTelemetry.progress}%` }}
              />
            </div>
          </div>

          {/* Live Coordinates Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
            <span>GEO: {activeTelemetry.lat}°N, {activeTelemetry.lon}°E</span>
            <span className="text-emerald-400 flex items-center space-x-1">
              <Radio className="w-2.5 h-2.5 animate-pulse" />
              <span>SATELLITE SYNC</span>
            </span>
          </div>
        </div>
      )}

      {/* BOTTOM-LEFT: SIMULATION CONTROLS & CAMERA CONTROLS */}
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 pointer-events-auto">
        {/* Recenter on Planned Trip */}
        <button
          onClick={handleRecenterPlannedRoute}
          className="px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-blue-500/50 text-xs font-semibold text-blue-300 hover:text-white hover:border-blue-400 transition-all cursor-pointer shadow-lg flex items-center space-x-1.5"
        >
          <Crosshair className="w-3 h-3 text-blue-400" />
          <span>RECENTER ROUTE</span>
        </button>

        {/* Orbit Toggle */}
        <button
          onClick={() => {
            setIsAutoRotate(!isAutoRotate);
            setFollowVehicleId(null);
          }}
          className={`px-3 py-1.5 rounded-xl border text-xs transition-all cursor-pointer shadow-lg ${
            isAutoRotate
              ? 'bg-blue-600/20 border-blue-400 text-blue-200'
              : 'bg-slate-950/90 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAutoRotate ? 'AUTO-ORBIT: ON' : 'AUTO-ORBIT: OFF'}
        </button>

        {/* Simulation Speed */}
        <div className="flex items-center space-x-1 bg-slate-950/90 border border-slate-700 p-1 rounded-xl text-[10px] font-mono text-slate-300 shadow-lg">
          <span className="px-1.5 text-slate-400 text-[9px]">SPEED:</span>
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimSpeed(spd)}
              className={`px-2 py-0.5 rounded-lg cursor-pointer transition-all ${
                simSpeed === spd
                  ? 'bg-blue-600 text-white font-bold'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Mode Filter Selector */}
        <div className="hidden sm:flex items-center space-x-1 bg-slate-950/90 border border-slate-700 p-1 rounded-xl text-[10px] shadow-lg">
          {(['all', 'flight', 'train', 'car', 'boat'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-2.5 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                filterMode === m
                  ? 'bg-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {m === 'all' ? 'ALL MODES' : m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
