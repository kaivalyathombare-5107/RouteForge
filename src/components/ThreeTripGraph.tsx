import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import { Booking, TripEdge, RecoveryOption } from '../types';
import { JourneyMode } from './HeroJourneySection';
import { 
  latLonToVector3, 
  vector3ToLatLon,
  generateJourneyCorridor, 
  TransportRouteSegment, 
  GLOBE_RADIUS 
} from '../utils/geoCoordinates';
import { 
  createWorldMapTexture, 
  createAirplaneMesh, 
  createTrainMesh, 
  createCarMesh, 
  createBoatMesh, 
  createDestinationPinMesh 
} from '../utils/globeMeshBuilder';
import { 
  Plane, 
  Train, 
  Car, 
  Ship, 
  RotateCw, 
  Search, 
  Sparkles, 
  Navigation, 
  Radio, 
  Clock, 
  Eye, 
  ChevronRight,
  Maximize2
} from 'lucide-react';
import { LOCATION_SUGGESTIONS } from '../data/locations';

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
  const animFrameIdRef = useRef<number | null>(null);

  // Active destinations and transport segments
  const [activeOrigin, setActiveOrigin] = useState(searchOrigin);
  const [activeDestination, setActiveDestination] = useState(searchDestination);
  const [activeMode, setActiveMode] = useState<JourneyMode>(searchMode);
  
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

  // Camera targets & smooth damping
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.5, 12.5));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraAngleRef = useRef({ phi: 0.25, theta: -1.2 }); // Centered toward India / Eurasia

  // Pointer drag tracking
  const pointerDownRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });

  // References to active 3D transport vehicles and animated particles
  const vehiclesRef = useRef<Map<string, {
    mesh: THREE.Group;
    segment: TransportRouteSegment;
    progress: number;
    speed: number;
    contrailPoints?: THREE.Vector3[];
    contrailLine?: THREE.Line;
  }>>(new Map());

  // Generate multi-modal segments based on current origin & destination
  const routeSegments = useMemo(() => {
    return generateJourneyCorridor(activeOrigin, activeDestination, activeMode);
  }, [activeOrigin, activeDestination, activeMode]);

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
    camera.position.set(0, 3.5, 12.5);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Luxury Lighting
    const ambientLight = new THREE.AmbientLight(0x1F2430, 2.5);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xFDF8E2, 3.0);
    sunLight.position.set(12, 14, 10);
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

    // 1. 3D Earth Sphere with Procedural Luxury Dark Map Texture
    const earthGeo = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);
    const worldTexture = createWorldMapTexture();
    const earthMat = new THREE.MeshStandardMaterial({
      map: worldTexture,
      roughness: 0.45,
      metalness: 0.15,
      emissive: 0x05070A,
      emissiveIntensity: 0.2,
    });
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.name = 'earthSphere';
    globeGroup.add(earthMesh);

    // 2. Atmospheric Fresnel Glow Aura Sphere
    const atmosGeo = new THREE.SphereGeometry(GLOBE_RADIUS * 1.022, 64, 64);
    const atmosMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.12,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
    });
    const atmosMesh = new THREE.Mesh(atmosGeo, atmosMat);
    globeGroup.add(atmosMesh);

    // 3. Orbital Latitude/Longitude Equatorial Halo Ring
    const orbitRingGeo = new THREE.RingGeometry(GLOBE_RADIUS * 1.15, GLOBE_RADIUS * 1.16, 64);
    const orbitRingMat = new THREE.MeshBasicMaterial({
      color: 0xD4AF37,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.22,
    });
    const orbitRing = new THREE.Mesh(orbitRingGeo, orbitRingMat);
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
      const newDist = Math.max(7.5, Math.min(20, currentDist + e.deltaY * 0.01));
      targetCamPos.current.normalize().multiplyScalar(newDist);
    };
    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      container.removeEventListener('wheel', handleWheel);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Populate Routes, Waypoint Pins & Animated Vehicles on the 3D Globe
  useEffect(() => {
    if (!globeGroupRef.current || !sceneRef.current) return;
    const globeGroup = globeGroupRef.current;

    // Remove existing routes, pins, and vehicles (keep the earth sphere and atmosphere)
    const toRemove: THREE.Object3D[] = [];
    globeGroup.children.forEach((child) => {
      if (child.name !== 'earthSphere' && child.type !== 'Points') {
        toRemove.push(child);
      }
    });
    toRemove.forEach((obj) => globeGroup.remove(obj));

    vehiclesRef.current.clear();

    const uniqueWaypoints = new Map<string, { pos: THREE.Vector3; name: string; type: string; isEndpoint: boolean }>();

    // 1. Render Multi-Modal Transportation Routes
    routeSegments.forEach((segment) => {
      // Check filter
      if (filterMode !== 'all' && segment.mode !== filterMode) return;

      const curve = segment.curve;
      const points = curve.getPoints(80);

      // Distinct Route Geometry based on Transportation System
      if (segment.mode === 'flight') {
        // High-Altitude Parabolic Aviation Corridor (Golden Glowing Tube)
        const tubeGeo = new THREE.TubeGeometry(curve, 80, 0.045, 8, false);
        const tubeMat = new THREE.MeshStandardMaterial({
          color: segment.color,
          emissive: segment.color,
          emissiveIntensity: 0.65,
          metalness: 0.8,
          roughness: 0.2,
          transparent: true,
          opacity: 0.85,
        });
        const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
        globeGroup.add(tubeMesh);

        // Dashed flightpath radar pulses
        const flightLineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const flightLineMat = new THREE.LineDashedMaterial({
          color: 0xFCE7AC,
          dashSize: 0.3,
          gapSize: 0.15,
          transparent: true,
          opacity: 0.9,
        });
        const flightLine = new THREE.Line(flightLineGeo, flightLineMat);
        flightLine.computeLineDistances();
        globeGroup.add(flightLine);

        // Create Animated Airplane Mesh
        const planeMesh = createAirplaneMesh();
        globeGroup.add(planeMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: planeMesh,
          segment,
          progress: 0.0,
          speed: 0.0018 * simSpeed,
        });
      } else if (segment.mode === 'train') {
        // Surface High-Speed Rail Corridor (Dual Rail Tracks with Neon Sleeper Ties)
        const railTubeGeo = new THREE.TubeGeometry(curve, 60, 0.035, 6, false);
        const railTubeMat = new THREE.MeshStandardMaterial({
          color: 0xA78BFA,
          emissive: 0x8B5CF6,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9,
        });
        const railMesh = new THREE.Mesh(railTubeGeo, railTubeMat);
        globeGroup.add(railMesh);

        // Create Animated High-Speed Train
        const trainMesh = createTrainMesh();
        globeGroup.add(trainMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: trainMesh,
          segment,
          progress: 0.15,
          speed: 0.0022 * simSpeed,
        });
      } else if (segment.mode === 'car') {
        // VIP Chauffeur Highway Ribbon (Cyan / Royal Blue)
        const roadTubeGeo = new THREE.TubeGeometry(curve, 40, 0.03, 6, false);
        const roadMat = new THREE.MeshStandardMaterial({
          color: 0x38BDF8,
          emissive: 0x0284C7,
          emissiveIntensity: 0.75,
          transparent: true,
          opacity: 0.9,
        });
        const roadMesh = new THREE.Mesh(roadTubeGeo, roadMat);
        globeGroup.add(roadMesh);

        // Create Animated Luxury Limousine
        const carMesh = createCarMesh();
        globeGroup.add(carMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: carMesh,
          segment,
          progress: 0.35,
          speed: 0.0025 * simSpeed,
        });
      } else if (segment.mode === 'boat') {
        // Royal Shikara / Waterway Path (Emerald Green / Turquoise)
        const waterTubeGeo = new THREE.TubeGeometry(curve, 30, 0.025, 6, false);
        const waterMat = new THREE.MeshStandardMaterial({
          color: 0x34D399,
          emissive: 0x059669,
          emissiveIntensity: 0.8,
          transparent: true,
          opacity: 0.9,
        });
        const waterMesh = new THREE.Mesh(waterTubeGeo, waterMat);
        globeGroup.add(waterMesh);

        // Create Animated Boat
        const boatMesh = createBoatMesh();
        globeGroup.add(boatMesh);

        vehiclesRef.current.set(segment.id, {
          mesh: boatMesh,
          segment,
          progress: 0.5,
          speed: 0.002 * simSpeed,
        });
      }

      // Collect Waypoints
      const fromKey = `${segment.from.lat}_${segment.from.lon}`;
      const toKey = `${segment.to.lat}_${segment.to.lon}`;
      if (!uniqueWaypoints.has(fromKey)) {
        uniqueWaypoints.set(fromKey, {
          pos: latLonToVector3(segment.from.lat, segment.from.lon),
          name: segment.from.name,
          type: segment.from.type,
          isEndpoint: true,
        });
      }
      if (!uniqueWaypoints.has(toKey)) {
        uniqueWaypoints.set(toKey, {
          pos: latLonToVector3(segment.to.lat, segment.to.lon),
          name: segment.to.name,
          type: segment.to.type,
          isEndpoint: true,
        });
      }
    });

    // 2. Render Destination Holographic Beacons on the Sphere Surface
    uniqueWaypoints.forEach((wp) => {
      const pinColor = wp.type === 'palace' ? 0xF59E0B : wp.type === 'airport' ? 0xD4AF37 : 0x10B981;
      const pinMesh = createDestinationPinMesh(wp.name, pinColor, wp.isEndpoint);

      // Position on the surface of the globe
      pinMesh.position.copy(wp.pos);

      // Orient pin normal to sphere surface so it stands straight out from Earth
      const normal = wp.pos.clone().normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, normal);
      pinMesh.quaternion.copy(quat);

      globeGroup.add(pinMesh);
    });

    // Auto-focus camera smoothly to view the active route on the globe
    if (routeSegments.length > 0) {
      const firstSegment = routeSegments[0];
      const midPoint = firstSegment.waypoints[Math.floor(firstSegment.waypoints.length / 2)];
      if (midPoint) {
        const viewDir = midPoint.clone().normalize();
        targetCamPos.current.copy(viewDir.multiplyScalar(12.5));
        targetLookAt.current.set(0, 0, 0);
      }
    }
  }, [routeSegments, filterMode, simSpeed]);

  // Main 60 FPS Render & Animation Loop
  useEffect(() => {
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Smooth Camera Damping
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.05);
        currentLookAt.current.lerp(targetLookAt.current, 0.05);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // 1. Animate All Active Transport Vehicles Along Their 3D Geospatial Curves
      vehiclesRef.current.forEach((vehicle, segmentId) => {
        const { mesh, segment, progress } = vehicle;
        const curve = segment.curve;

        // Advance parametric progress
        let newProgress = progress + vehicle.speed;
        if (newProgress > 1.0) newProgress = 0.0;
        vehicle.progress = newProgress;

        // Current position on the curve
        const currentPt = curve.getPointAt(newProgress);
        mesh.position.copy(currentPt);

        // Next point for forward heading orientation (tangent)
        const tangentProgress = Math.min(1.0, newProgress + 0.015);
        const forwardPt = curve.getPointAt(tangentProgress);

        // Orient vehicle to face direction of travel along the geodesic curve
        mesh.lookAt(forwardPt);

        // Special dynamic tilt/banking for Airplane
        if (segment.mode === 'flight') {
          // Subtle climb / descent pitch and bank roll
          const climbRate = Math.cos(newProgress * Math.PI) * 0.2;
          mesh.rotation.x += climbRate;
          mesh.rotation.z += Math.sin(newProgress * Math.PI * 4) * 0.08;

          // Strobe blink effect
          const beacon = mesh.children.find(c => c.type === 'Mesh' && (c as THREE.Mesh).position.y > 0.3);
          if (beacon) {
            beacon.visible = Math.floor(Date.now() / 250) % 2 === 0;
          }
        }

        // Real-Time Radar Telemetry Tracking
        if (!activeTelemetry || activeTelemetry.segmentId === segmentId || followVehicleId === segmentId) {
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

        // Camera Follow Mode: Ride alongside the aircraft or train in 3D chase cam!
        if (followVehicleId === segmentId && cameraRef.current) {
          const chaseOffset = currentPt.clone().normalize().multiplyScalar(2.8);
          targetCamPos.current.copy(currentPt.clone().add(chaseOffset));
          targetLookAt.current.copy(currentPt);
        }
      });

      // 2. Animate Destination Pin Rings & Jewel Rotations
      if (globeGroupRef.current) {
        globeGroupRef.current.children.forEach((child) => {
          if (child.name !== 'earthSphere' && child.children.length > 0) {
            const jewel = child.getObjectByName('pinJewel');
            const ring = child.getObjectByName('pinRing');
            const groundPulse = child.getObjectByName('groundPulse');
            if (jewel) jewel.rotation.y += 0.02;
            if (ring) ring.rotation.z += 0.015;
            if (groundPulse) {
              const scale = 1 + Math.sin(Date.now() * 0.004) * 0.15;
              groundPulse.scale.set(scale, scale, scale);
            }
          }
        });
      }

      // 3. Gentle Auto-Orbit if Enabled and not dragging or following a vehicle
      if (isAutoRotate && !pointerDownRef.current && !followVehicleId && !reducedMotion) {
        cameraAngleRef.current.theta += 0.0012;
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
  }, [isAutoRotate, followVehicleId, simSpeed, reducedMotion]);

  // Pointer Drag Rotation Controls on the Globe
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = true;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    setFollowVehicleId(null); // Release vehicle lock on manual drag
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

  // Handle Preset Route Click
  const handleSelectPreset = (preset: typeof PRESET_CIRCUITS[0]) => {
    setActiveOrigin(preset.orig);
    setActiveDestination(preset.dest);
    setActiveMode(preset.mode);
    setFollowVehicleId(null);
    onSelectRoute?.(preset.orig, preset.dest, preset.mode);
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

      {/* TOP BAR: Real-Time World Map Header & Live Route Search Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
        {/* Title HUD Badge */}
        <div className="pointer-events-auto flex items-center space-x-2.5 px-4 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-gold-subtle shadow-xl">
          <div className="flex items-center space-x-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-cinzel text-xs font-bold text-[#FCE7AC] tracking-wider">
              3D REAL-TIME WORLD MAP & TRANSPORT NETWORK
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400 hidden md:inline">
            • {routeSegments.length} ACTIVE MULTI-MODAL VECTORS
          </span>
        </div>

        {/* Search / Add Any Destination Input */}
        <div className="pointer-events-auto relative w-full sm:w-72">
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-[#D4AF37] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Enter any world destination..."
              className="w-full pl-9 pr-8 py-2 rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-gold-subtle text-xs font-sans-luxury text-slate-100 placeholder-slate-400 focus:outline-none focus:border-gold-bright transition-all shadow-lg"
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
            <div className="absolute top-full mt-1.5 left-0 right-0 z-30 rounded-2xl bg-slate-950/95 backdrop-blur-2xl border border-gold-bright shadow-2xl overflow-hidden py-1 max-h-56 overflow-y-auto">
              {filteredSuggestions.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => {
                    setActiveDestination(`${loc.city} (${loc.code})`);
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                    onSelectRoute?.(activeOrigin, `${loc.city} (${loc.code})`, activeMode);
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-[#D4AF37]/15 flex items-center justify-between text-xs transition-colors cursor-pointer border-b border-gold-subtle/20 last:border-none"
                >
                  <div className="flex items-center space-x-2 truncate">
                    {loc.type === 'flight' ? (
                      <Plane className="w-3 h-3 text-[#D4AF37] flex-shrink-0" />
                    ) : (
                      <Train className="w-3 h-3 text-purple-400 flex-shrink-0" />
                    )}
                    <span className="font-sans-luxury text-slate-200 font-medium truncate">{loc.city}</span>
                    <span className="text-[10px] text-slate-400">({loc.code})</span>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">{loc.country}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* TOP-LEFT PRESET CIRCUITS CHIPS */}
      <div className="absolute top-16 left-4 z-10 hidden lg:flex flex-wrap gap-1.5 pointer-events-auto max-w-xl">
        {PRESET_CIRCUITS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectPreset(p)}
            className={`px-3 py-1 rounded-full text-[10px] font-cinzel tracking-wider border transition-all cursor-pointer shadow-md backdrop-blur-md ${
              activeDestination.includes(p.dest.split(' ')[0])
                ? 'bg-[#D4AF37]/25 border-gold-bright text-[#FCE7AC]'
                : 'bg-slate-950/80 border-gold-subtle/60 text-slate-300 hover:text-white hover:border-gold-subtle'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* BOTTOM-RIGHT: LIVE RADAR TELEMETRY & TRANSPORT INSPECTOR HUD */}
      {activeTelemetry && (
        <div className="absolute bottom-4 right-4 z-10 w-80 sm:w-96 rounded-3xl bg-[#090C12]/95 backdrop-blur-2xl border border-gold-bright/60 shadow-2xl p-4 sm:p-5 pointer-events-auto space-y-3 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gold-subtle/40 pb-2.5">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-lg bg-[#D4AF37]/20 text-[#FCE7AC]">
                {activeTelemetry.mode === 'flight' ? (
                  <Plane className="w-4 h-4 text-[#D4AF37]" />
                ) : activeTelemetry.mode === 'train' ? (
                  <Train className="w-4 h-4 text-purple-400" />
                ) : activeTelemetry.mode === 'car' ? (
                  <Car className="w-4 h-4 text-sky-400" />
                ) : (
                  <Ship className="w-4 h-4 text-emerald-400" />
                )}
              </div>
              <div>
                <div className="text-[10px] font-cinzel font-bold text-[#D4AF37] uppercase tracking-wider">
                  LIVE TELEMETRY RADAR
                </div>
                <div className="text-xs font-serif-display font-bold text-white truncate max-w-[190px]">
                  {activeTelemetry.carrier}
                </div>
              </div>
            </div>

            {/* Chase Camera Toggle */}
            <button
              onClick={() => {
                if (followVehicleId === activeTelemetry.segmentId) {
                  setFollowVehicleId(null);
                } else {
                  setFollowVehicleId(activeTelemetry.segmentId);
                  setIsAutoRotate(false);
                }
              }}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-cinzel font-semibold flex items-center space-x-1 border transition-all cursor-pointer ${
                followVehicleId === activeTelemetry.segmentId
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                  : 'bg-slate-900 border-gold-subtle text-slate-300 hover:text-white'
              }`}
            >
              <Eye className="w-3 h-3" />
              <span>{followVehicleId === activeTelemetry.segmentId ? 'COCKPIT CAM' : 'FOLLOW'}</span>
            </button>
          </div>

          {/* Real-Time Flight & Ground Metrics Grid */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-gold-subtle/30">
              <div className="text-[9px] font-cinzel text-slate-400">SPEED</div>
              <div className="text-xs font-mono font-bold text-[#FCE7AC] mt-0.5">
                {activeTelemetry.speedKmh} <span className="text-[8px]">km/h</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-gold-subtle/30">
              <div className="text-[9px] font-cinzel text-slate-400">ALTITUDE</div>
              <div className="text-xs font-mono font-bold text-slate-200 mt-0.5">
                {activeTelemetry.altitudeFt.toLocaleString()} <span className="text-[8px]">ft</span>
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-gold-subtle/30">
              <div className="text-[9px] font-cinzel text-slate-400">PROGRESS</div>
              <div className="text-xs font-mono font-bold text-emerald-400 mt-0.5">
                {activeTelemetry.progress}%
              </div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/80 border border-gold-subtle/30">
              <div className="text-[9px] font-cinzel text-slate-400">EST. TIME</div>
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
            <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-gold-subtle/30">
              <div
                className="h-full bg-gradient-to-r from-[#D4AF37] via-emerald-400 to-[#FCE7AC] rounded-full transition-all duration-300"
                style={{ width: `${activeTelemetry.progress}%` }}
              />
            </div>
          </div>

          {/* Live Coordinates Footer */}
          <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-gold-subtle/20">
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
        {/* Reset Camera */}
        <button
          onClick={() => {
            targetLookAt.current.set(0, 0, 0);
            targetCamPos.current.set(0, 3.5, 12.5);
            setFollowVehicleId(null);
            setIsAutoRotate(true);
          }}
          className="px-3.5 py-1.5 rounded-xl bg-slate-950/90 border border-gold-subtle text-xs font-cinzel text-slate-300 hover:text-[#FCE7AC] hover:border-gold-bright transition-all cursor-pointer shadow-lg flex items-center space-x-1.5"
        >
          <RotateCw className="w-3 h-3 text-[#D4AF37]" />
          <span>RESET GLOBE</span>
        </button>

        {/* Orbit Toggle */}
        <button
          onClick={() => {
            setIsAutoRotate(!isAutoRotate);
            setFollowVehicleId(null);
          }}
          className={`px-3 py-1.5 rounded-xl border text-xs font-cinzel transition-all cursor-pointer shadow-lg ${
            isAutoRotate
              ? 'bg-[#D4AF37]/20 border-gold-bright text-[#FCE7AC]'
              : 'bg-slate-950/90 border-gold-subtle text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAutoRotate ? 'AUTO-ORBIT: ON' : 'AUTO-ORBIT: OFF'}
        </button>

        {/* Speed Multiplier */}
        <div className="flex items-center space-x-1 bg-slate-950/90 border border-gold-subtle p-1 rounded-xl text-[10px] font-mono text-slate-300 shadow-lg">
          <span className="px-1.5 text-slate-400 font-cinzel text-[9px]">SPEED:</span>
          {[1, 2, 5].map((spd) => (
            <button
              key={spd}
              onClick={() => setSimSpeed(spd)}
              className={`px-2 py-0.5 rounded-lg cursor-pointer transition-all ${
                simSpeed === spd
                  ? 'bg-[#D4AF37] text-slate-950 font-bold'
                  : 'hover:bg-slate-800 text-slate-400'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Mode Filter Selector */}
        <div className="hidden sm:flex items-center space-x-1 bg-slate-950/90 border border-gold-subtle p-1 rounded-xl text-[10px] font-cinzel shadow-lg">
          {(['all', 'flight', 'train', 'car', 'boat'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setFilterMode(m)}
              className={`px-2.5 py-1 rounded-lg uppercase transition-all cursor-pointer ${
                filterMode === m
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#A88325] text-slate-950 font-bold shadow-sm'
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
