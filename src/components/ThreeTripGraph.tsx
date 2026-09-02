import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Booking, TripEdge, RecoveryOption } from '../types';

interface ThreeTripGraphProps {
  bookings: Booking[];
  edges: TripEdge[];
  selectedBookingId?: string | null;
  onSelectBooking: (bookingId: string) => void;
  hoveredRecoveryOption?: RecoveryOption | null;
  activeRecoveryPlan?: RecoveryOption | null;
  isDisrupted: boolean;
  reducedMotion?: boolean;
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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const nodesGroupRef = useRef<THREE.Group | null>(null);
  const edgesGroupRef = useRef<THREE.Group | null>(null);
  const particlesGroupRef = useRef<THREE.Group | null>(null);
  const recoveryBranchesRef = useRef<THREE.Group | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Interaction refs
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2());
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const [hoveredNode, setHoveredNode] = useState<{ id: string; title: string; status: string; city: string; x: number; y: number } | null>(null);
  const [autoRotate, setAutoRotate] = useState(!reducedMotion);

  // Camera targets & smooth lerping
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 3.5, 13));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Pointer drag tracking
  const pointerDownRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ phi: 0.25, theta: 0 });

  // Map status to semantic colors (Muted Gold for normal/safe, Crimson for disrupted, Emerald for recovered)
  const getStatusColor = (status: string, riskLevel: string): number => {
    if (status === 'cancelled' || status === 'impacted' || riskLevel === 'critical') return 0xE11D48; // Crimson
    if (status === 'delayed' || status === 'at_risk' || riskLevel === 'high') return 0xF59E0B; // Amber Gold
    if (status === 'recovered') return 0x10B981; // Emerald
    return 0xD4AF37; // Muted Metallic Gold
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x08090C);
    scene.fog = new THREE.FogExp2(0x08090C, 0.038);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.5, 13);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lights with warm luxury tones
    const ambientLight = new THREE.AmbientLight(0x1A1510, 3.0);
    scene.add(ambientLight);

    const goldKeyLight = new THREE.DirectionalLight(0xFCE7AC, 2.2);
    goldKeyLight.position.set(6, 12, 8);
    scene.add(goldKeyLight);

    const warmFillLight = new THREE.PointLight(0xD4AF37, 1.8, 40);
    warmFillLight.position.set(-8, -2, 5);
    scene.add(warmFillLight);

    // Deep grid floor plane in dark bronze/obsidian
    const gridHelper = new THREE.GridHelper(40, 40, 0x4A3E25, 0x141720);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // Background stardust particles in champagne gold
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 450;
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 40;
      particlePos[i + 1] = (Math.random() - 0.5) * 22;
      particlePos[i + 2] = (Math.random() - 0.5) * 32;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0xE5C07B,
      transparent: true,
      opacity: 0.45,
      blending: THREE.AdditiveBlending,
    });
    const dustPoints = new THREE.Points(particleGeo, particleMat);
    scene.add(dustPoints);

    // Groups
    const nodesGroup = new THREE.Group();
    const edgesGroup = new THREE.Group();
    const particlesGroup = new THREE.Group();
    const recoveryGroup = new THREE.Group();

    scene.add(nodesGroup);
    scene.add(edgesGroup);
    scene.add(particlesGroup);
    scene.add(recoveryGroup);

    nodesGroupRef.current = nodesGroup;
    edgesGroupRef.current = edgesGroup;
    particlesGroupRef.current = particlesGroup;
    recoveryBranchesRef.current = recoveryGroup;

    // Resize handling
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

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      scene.clear();
    };
  }, []);

  // Populate 3D Nodes & Catmull-Rom Arcs
  useEffect(() => {
    if (!sceneRef.current || !nodesGroupRef.current || !edgesGroupRef.current || !particlesGroupRef.current) return;

    const nodesGroup = nodesGroupRef.current;
    const edgesGroup = edgesGroupRef.current;
    const particlesGroup = particlesGroupRef.current;

    // Clear previous geometries
    while (nodesGroup.children.length > 0) {
      const obj = nodesGroup.children[0] as THREE.Mesh;
      obj.geometry?.dispose();
      nodesGroup.remove(obj);
    }
    while (edgesGroup.children.length > 0) {
      const obj = edgesGroup.children[0] as THREE.Mesh;
      obj.geometry?.dispose();
      edgesGroup.remove(obj);
    }
    while (particlesGroup.children.length > 0) {
      const obj = particlesGroup.children[0] as THREE.Mesh;
      obj.geometry?.dispose();
      particlesGroup.remove(obj);
    }

    const nodePositions: { [id: string]: THREE.Vector3 } = {};

    // 1. Build Spatial Luxury Waypoint Nodes
    bookings.forEach((booking) => {
      const pos = new THREE.Vector3(booking.location.x, booking.location.y, booking.location.z);
      nodePositions[booking.id] = pos;

      const isSelected = selectedBookingId === booking.id;
      const nodeColorHex = getStatusColor(booking.status, booking.riskLevel);

      const nodeWrapper = new THREE.Group();
      nodeWrapper.position.copy(pos);
      nodeWrapper.name = `node_${booking.id}`;
      (nodeWrapper as any).userData = { bookingId: booking.id, bookingData: booking };

      // Core Diamond / Octahedron Jewel
      const coreGeo = new THREE.OctahedronGeometry(isSelected ? 0.75 : 0.55, 0);
      const coreMat = new THREE.MeshStandardMaterial({
        color: nodeColorHex,
        emissive: nodeColorHex,
        emissiveIntensity: isSelected ? 0.8 : 0.45,
        metalness: 0.85,
        roughness: 0.15,
      });
      const coreMesh = new THREE.Mesh(coreGeo, coreMat);
      coreMesh.castShadow = true;
      nodeWrapper.add(coreMesh);

      // Outer Holographic Orbital Ring
      const ringGeo = new THREE.TorusGeometry(isSelected ? 1.2 : 0.9, 0.025, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: isSelected ? 0xFCE7AC : nodeColorHex,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.45,
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.rotation.x = Math.PI / 3;
      nodeWrapper.add(ringMesh);

      // Base Waypoint Pedestal & Light Beam
      const beamGeo = new THREE.CylinderGeometry(0.04, 0.04, pos.y - (-2.5), 16);
      const beamMat = new THREE.MeshBasicMaterial({
        color: 0xD4AF37,
        transparent: true,
        opacity: 0.25,
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.y = -(pos.y - (-2.5)) / 2;
      nodeWrapper.add(beamMesh);

      // Pedestal Ground Circle
      const baseCircleGeo = new THREE.RingGeometry(0.3, 0.4, 32);
      const baseCircleMat = new THREE.MeshBasicMaterial({
        color: 0xD4AF37,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.35,
      });
      const baseCircleMesh = new THREE.Mesh(baseCircleGeo, baseCircleMat);
      baseCircleMesh.rotation.x = Math.PI / 2;
      baseCircleMesh.position.y = -pos.y - 2.48;
      nodeWrapper.add(baseCircleMesh);

      nodesGroup.add(nodeWrapper);
    });

    // 2. Build Catmull-Rom Arcs & Route Ribbons between Nodes
    edges.forEach((edge) => {
      const fromPos = nodePositions[edge.fromBookingId];
      const toPos = nodePositions[edge.toBookingId];
      if (!fromPos || !toPos) return;

      const midX = (fromPos.x + toPos.x) / 2;
      const midY = Math.max(fromPos.y, toPos.y) + 1.6;
      const midZ = (fromPos.z + toPos.z) / 2 + 0.4;
      const midPoint = new THREE.Vector3(midX, midY, midZ);

      // Smooth Catmull-Rom Curve
      const curve = new THREE.CatmullRomCurve3([fromPos, midPoint, toPos]);
      const points = curve.getPoints(60);

      const isBroken = edge.status === 'broken';
      const isWarning = edge.status === 'warning';
      const edgeColorHex = isBroken ? 0xE11D48 : isWarning ? 0xF59E0B : 0xD4AF37;

      // Tube ribbon geometry
      const tubeGeo = new THREE.TubeGeometry(curve, 60, isBroken ? 0.06 : 0.04, 8, false);
      const tubeMat = new THREE.MeshStandardMaterial({
        color: edgeColorHex,
        emissive: edgeColorHex,
        emissiveIntensity: isBroken ? 0.9 : 0.35,
        metalness: 0.8,
        roughness: 0.2,
        transparent: true,
        opacity: isBroken ? 0.95 : 0.75,
      });
      const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
      edgesGroup.add(tubeMesh);

      // Flowing route photon particles
      const photonCount = 5;
      for (let p = 0; p < photonCount; p++) {
        const photonGeo = new THREE.SphereGeometry(0.08, 12, 12);
        const photonMat = new THREE.MeshBasicMaterial({
          color: isBroken ? 0xFF3366 : 0xFFF3D0,
        });
        const photonMesh = new THREE.Mesh(photonGeo, photonMat);
        (photonMesh as any).userData = {
          curve,
          progress: (p / photonCount),
          speed: isBroken ? 0.003 : 0.006,
        };
        particlesGroup.add(photonMesh);
      }
    });

    // Camera Focus Target based on selected booking
    if (selectedBookingId && nodePositions[selectedBookingId]) {
      const selectedPos = nodePositions[selectedBookingId];
      targetLookAt.current.set(selectedPos.x, selectedPos.y, selectedPos.z);
      targetCamPos.current.set(selectedPos.x, selectedPos.y + 2, selectedPos.z + 7);
    } else {
      targetLookAt.current.set(0, 0, 0);
      targetCamPos.current.set(0, 3.5, 13);
    }
  }, [bookings, edges, selectedBookingId]);

  // Update Alternative Recovery Branches
  useEffect(() => {
    if (!recoveryBranchesRef.current || !sceneRef.current) return;
    const recGroup = recoveryBranchesRef.current;

    while (recGroup.children.length > 0) {
      const obj = recGroup.children[0] as THREE.Mesh;
      obj.geometry?.dispose();
      recGroup.remove(obj);
    }

    const optToRender = hoveredRecoveryOption || activeRecoveryPlan;
    if (optToRender && optToRender.branchWaypoints.length > 1) {
      const waypoints = optToRender.branchWaypoints.map(w => new THREE.Vector3(w[0], w[1], w[2]));
      const branchCurve = new THREE.CatmullRomCurve3(waypoints);
      const branchTubeGeo = new THREE.TubeGeometry(branchCurve, 50, 0.06, 8, false);
      const branchTubeMat = new THREE.MeshBasicMaterial({
        color: 0x10B981, // Emerald Recovery
        wireframe: false,
        transparent: true,
        opacity: 0.9,
      });
      const branchTubeMesh = new THREE.Mesh(branchTubeGeo, branchTubeMat);
      recGroup.add(branchTubeMesh);
    }
  }, [hoveredRecoveryOption, activeRecoveryPlan]);

  // Main Render & Smooth Camera Lerping Loop
  useEffect(() => {
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      // Damped Camera Position Lerping (smooth cinema crane)
      if (cameraRef.current) {
        cameraRef.current.position.lerp(targetCamPos.current, 0.04);
        currentLookAt.current.lerp(targetLookAt.current, 0.04);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Rotate nodes & orbit rings
      if (nodesGroupRef.current && !reducedMotion) {
        nodesGroupRef.current.children.forEach((child) => {
          const core = child.children[0];
          const ring = child.children[1];
          if (core) core.rotation.y += 0.015;
          if (ring) ring.rotation.z += 0.008;
        });
      }

      // Animate flowing photon particles along Catmull-Rom curves
      if (particlesGroupRef.current && !reducedMotion) {
        particlesGroupRef.current.children.forEach((pObj: any) => {
          if (pObj.userData && pObj.userData.curve) {
            pObj.userData.progress += pObj.userData.speed;
            if (pObj.userData.progress > 1) pObj.userData.progress = 0;
            const pt = pObj.userData.curve.getPointAt(pObj.userData.progress);
            if (pt) pObj.position.copy(pt);
          }
        });
      }

      // Gentle auto-pan if enabled
      if (autoRotate && !pointerDownRef.current && !selectedBookingId && !reducedMotion) {
        cameraAngleRef.current.theta += 0.0015;
        const radius = 13;
        targetCamPos.current.x = radius * Math.sin(cameraAngleRef.current.theta);
        targetCamPos.current.z = radius * Math.cos(cameraAngleRef.current.theta);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [autoRotate, selectedBookingId, reducedMotion]);

  // Pointer & Raycast Click Detection
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = true;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !cameraRef.current || !sceneRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    // Camera orbit drag
    if (pointerDownRef.current && !selectedBookingId) {
      const deltaX = e.clientX - pointerPosRef.current.x;
      const deltaY = e.clientY - pointerPosRef.current.y;
      pointerPosRef.current = { x: e.clientX, y: e.clientY };

      cameraAngleRef.current.theta -= deltaX * 0.005;
      cameraAngleRef.current.phi = Math.max(0.1, Math.min(1.2, cameraAngleRef.current.phi + deltaY * 0.005));

      const radius = 13;
      targetCamPos.current.x = radius * Math.sin(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
      targetCamPos.current.y = radius * Math.sin(cameraAngleRef.current.phi) + 2.5;
      targetCamPos.current.z = radius * Math.cos(cameraAngleRef.current.theta) * Math.cos(cameraAngleRef.current.phi);
      setAutoRotate(false);
    }

    // Raycast hover check
    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    if (nodesGroupRef.current) {
      const intersects = raycasterRef.current.intersectObjects(nodesGroupRef.current.children, true);
      if (intersects.length > 0) {
        let rootGroup: any = intersects[0].object;
        while (rootGroup && !rootGroup.userData?.bookingId && rootGroup.parent) {
          rootGroup = rootGroup.parent;
        }
        if (rootGroup && rootGroup.userData?.bookingData) {
          const b = rootGroup.userData.bookingData;
          setHoveredNode({
            id: b.id,
            title: b.title,
            status: b.status,
            city: b.location.city,
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
          });
          return;
        }
      }
    }
    setHoveredNode(null);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    pointerDownRef.current = false;
    if (!containerRef.current || !cameraRef.current || !nodesGroupRef.current) return;

    // Detect click selection
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const clickY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycasterRef.current.setFromCamera(new THREE.Vector2(clickX, clickY), cameraRef.current);

    const intersects = raycasterRef.current.intersectObjects(nodesGroupRef.current.children, true);
    if (intersects.length > 0) {
      let rootGroup: any = intersects[0].object;
      while (rootGroup && !rootGroup.userData?.bookingId && rootGroup.parent) {
        rootGroup = rootGroup.parent;
      }
      if (rootGroup && rootGroup.userData?.bookingId) {
        onSelectBooking(rootGroup.userData.bookingId);
      }
    }
  };

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gold-subtle bg-[#08090C] shadow-2xl">
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Luxury Cinematic HUD Overlay */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-gold-subtle text-xs font-cinzel">
        <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
        <span className="text-[#F3E5AB]">3D FLIGHT & RAIL SPATIAL TWIN</span>
        <span className="text-slate-400">• CATMULL-ROM ROUTE CORRIDOR</span>
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none p-3 rounded-xl bg-slate-950/90 backdrop-blur-xl border border-gold-bright shadow-2xl text-xs space-y-1 transform -translate-x-1/2 -translate-y-full mb-3 animate-fadeIn"
          style={{ left: hoveredNode.x, top: hoveredNode.y }}
        >
          <div className="font-serif-display font-bold text-white text-sm">
            {hoveredNode.title}
          </div>
          <div className="flex items-center space-x-2 text-[10px] font-mono">
            <span className="text-slate-400">{hoveredNode.city}</span>
            <span className={`px-1.5 py-0.5 rounded font-bold uppercase ${
              hoveredNode.status === 'cancelled' || hoveredNode.status === 'impacted'
                ? 'bg-red-950 text-red-300 border border-red-800'
                : hoveredNode.status === 'recovered'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                : 'bg-amber-950 text-amber-300 border border-amber-800'
            }`}>
              {hoveredNode.status}
            </span>
          </div>
        </div>
      )}

      {/* Camera Reset & Auto-Orbit Controls */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center space-x-2">
        <button
          onClick={() => {
            targetLookAt.current.set(0, 0, 0);
            targetCamPos.current.set(0, 3.5, 13);
            setAutoRotate(true);
          }}
          className="px-3 py-1.5 rounded-lg bg-slate-950/80 border border-gold-subtle text-xs font-cinzel text-slate-300 hover:text-white hover:border-[#D4AF37] transition-all cursor-pointer"
        >
          RESET 3D CAMERA
        </button>
        <button
          onClick={() => setAutoRotate(prev => !prev)}
          className={`px-3 py-1.5 rounded-lg border text-xs font-cinzel transition-all cursor-pointer ${
            autoRotate
              ? 'bg-[#D4AF37]/20 border-gold-bright text-[#FCE7AC]'
              : 'bg-slate-950/80 border-gold-subtle text-slate-400'
          }`}
        >
          {autoRotate ? 'ORBIT: ACTIVE' : 'ORBIT: PAUSED'}
        </button>
      </div>
    </div>
  );
};
