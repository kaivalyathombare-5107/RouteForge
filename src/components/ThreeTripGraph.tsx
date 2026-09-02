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
  const [isOrbiting, setIsOrbiting] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);

  // Camera targets
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 3, 14));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const currentLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));

  // Pointer drag tracking
  const pointerDownRef = useRef(false);
  const pointerPosRef = useRef({ x: 0, y: 0 });
  const cameraRotationRef = useRef({ phi: 0.2, theta: 0 });

  // Map status to semantic colors
  const getStatusColor = (status: string, riskLevel: string): number => {
    if (status === 'cancelled' || status === 'impacted' || riskLevel === 'critical') return 0xEF4444; // Red
    if (status === 'delayed' || status === 'at_risk' || riskLevel === 'high') return 0xF59E0B; // Amber
    if (status === 'recovered') return 0x10B981; // Emerald
    return 0x06B6D4; // Electric Cyan
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05070B);
    scene.fog = new THREE.FogExp2(0x05070B, 0.035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3, 14);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0x0E172A, 2.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x38BDF8, 1.5);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Deep grid floor plane
    const gridHelper = new THREE.GridHelper(40, 40, 0x1E293B, 0x0B1222);
    gridHelper.position.y = -2.5;
    scene.add(gridHelper);

    // Background particle dust / starfield
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 400;
    const particlePos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i += 3) {
      particlePos[i] = (Math.random() - 0.5) * 35;
      particlePos[i + 1] = (Math.random() - 0.5) * 20;
      particlePos[i + 2] = (Math.random() - 0.5) * 30;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      color: 0x38BDF8,
      transparent: true,
      opacity: 0.4,
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

  // Update 3D Nodes and Edges when state changes
  useEffect(() => {
    if (!sceneRef.current || !nodesGroupRef.current || !edgesGroupRef.current) return;

    const nodesGroup = nodesGroupRef.current;
    const edgesGroup = edgesGroupRef.current;

    // Clear previous
    while (nodesGroup.children.length > 0) {
      const obj = nodesGroup.children[0];
      nodesGroup.remove(obj);
    }
    while (edgesGroup.children.length > 0) {
      const obj = edgesGroup.children[0];
      edgesGroup.remove(obj);
    }

    const nodePositions = new Map<string, THREE.Vector3>();

    // Build 3D Nodes
    bookings.forEach((booking, idx) => {
      const pos = new THREE.Vector3(booking.location.x, booking.location.y, booking.location.z);
      nodePositions.set(booking.id, pos);

      const colorHex = getStatusColor(booking.status, booking.riskLevel);
      const isSelected = selectedBookingId === booking.id;
      const isDisruptedNode = booking.status === 'cancelled' || booking.status === 'delayed';

      const nodeWrapper = new THREE.Group();
      nodeWrapper.position.copy(pos);
      nodeWrapper.userData = { bookingId: booking.id, booking };

      // Core sphere geometry
      const sphereGeo = new THREE.SphereGeometry(isSelected ? 0.6 : 0.45, 32, 32);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        emissive: colorHex,
        emissiveIntensity: isDisruptedNode ? 1.8 : 0.8,
        metalness: 0.3,
        roughness: 0.2,
      });
      const sphere = new THREE.Mesh(sphereGeo, sphereMat);
      nodeWrapper.add(sphere);

      // Inner glowing core
      const innerCoreGeo = new THREE.SphereGeometry(0.2, 16, 16);
      const innerCoreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
      const innerCore = new THREE.Mesh(innerCoreGeo, innerCoreMat);
      nodeWrapper.add(innerCore);

      // Orbital Holographic Ring
      const ringGeo = new THREE.TorusGeometry(isSelected ? 0.95 : 0.75, 0.02, 16, 64);
      const ringMat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: isSelected ? 0.9 : 0.6,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 3;
      ring.name = 'orbitalRing';
      nodeWrapper.add(ring);

      // Secondary vertical orbital ring for selected or disrupted node
      if (isSelected || isDisruptedNode) {
        const outerRingGeo = new THREE.TorusGeometry(1.15, 0.015, 16, 64);
        const outerRingMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          transparent: true,
          opacity: 0.4,
        });
        const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
        outerRing.rotation.y = Math.PI / 2;
        outerRing.name = 'outerRing';
        nodeWrapper.add(outerRing);
      }

      // Point light per node for localized spatial radiance
      const pointLight = new THREE.PointLight(colorHex, isDisruptedNode ? 2.5 : 1.2, 5);
      nodeWrapper.add(pointLight);

      // Pedestal connector to grid floor
      const lineGeo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, -2.5 - pos.y, 0),
      ]);
      const lineMat = new THREE.LineDashedMaterial({
        color: colorHex,
        dashSize: 0.15,
        gapSize: 0.1,
        transparent: true,
        opacity: 0.25,
      });
      const pedestal = new THREE.Line(lineGeo, lineMat);
      pedestal.computeLineDistances();
      nodeWrapper.add(pedestal);

      nodesGroup.add(nodeWrapper);
    });

    // Build 3D Connecting Edges (Bezier Curves with Status Glow)
    edges.forEach((edge) => {
      const fromPos = nodePositions.get(edge.fromBookingId);
      const toPos = nodePositions.get(edge.toBookingId);
      if (!fromPos || !toPos) return;

      const midPoint = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
      // Elevation arch
      midPoint.y += 1.2;

      const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
      const points = curve.getPoints(50);
      const curveGeo = new THREE.BufferGeometry().setFromPoints(points);

      let edgeColor = 0x06B6D4; // Safe / Normal Cyan
      let edgeOpacity = 0.7;

      if (edge.status === 'broken') {
        edgeColor = 0xEF4444; // Broken Red
        edgeOpacity = 0.85;
      } else if (edge.status === 'warning') {
        edgeColor = 0xF59E0B; // Amber Warning
        edgeOpacity = 0.8;
      }

      const curveMat = new THREE.LineBasicMaterial({
        color: edgeColor,
        transparent: true,
        opacity: edgeOpacity,
        linewidth: 2,
      });

      const edgeLine = new THREE.Line(curveGeo, curveMat);
      edgeLine.userData = { edge, curve };
      edgesGroup.add(edgeLine);
    });
  }, [bookings, edges, selectedBookingId]);

  // Update Alternative Recovery Branches in 3D space
  useEffect(() => {
    if (!recoveryBranchesRef.current) return;
    const recoveryGroup = recoveryBranchesRef.current;

    while (recoveryGroup.children.length > 0) {
      const obj = recoveryGroup.children[0];
      recoveryGroup.remove(obj);
    }

    const branchToDraw = hoveredRecoveryOption || activeRecoveryPlan;
    if (branchToDraw && branchToDraw.branchWaypoints && branchToDraw.branchWaypoints.length >= 2) {
      const pts = branchToDraw.branchWaypoints.map(w => new THREE.Vector3(w[0], w[1], w[2]));
      const curve = new THREE.CatmullRomCurve3(pts);
      const points = curve.getPoints(60);
      const geo = new THREE.BufferGeometry().setFromPoints(points);

      const branchColor = branchToDraw.color ? parseInt(branchToDraw.color.replace('#', '0x'), 16) : 0x10B981;

      const mat = new THREE.LineDashedMaterial({
        color: branchColor,
        dashSize: 0.25,
        gapSize: 0.12,
        transparent: true,
        opacity: 0.95,
      });

      const line = new THREE.Line(geo, mat);
      line.computeLineDistances();
      recoveryGroup.add(line);

      // Waypoint glowing indicators
      pts.forEach((pt, i) => {
        if (i > 0 && i < pts.length - 1) {
          const wpGeo = new THREE.OctahedronGeometry(0.28, 0);
          const wpMat = new THREE.MeshStandardMaterial({
            color: branchColor,
            emissive: branchColor,
            emissiveIntensity: 1.5,
            wireframe: true,
          });
          const wpMesh = new THREE.Mesh(wpGeo, wpMat);
          wpMesh.position.copy(pt);
          recoveryGroup.add(wpMesh);
        }
      });
    }
  }, [hoveredRecoveryOption, activeRecoveryPlan]);

  // Smooth Camera Lerping & Animation Loop
  useEffect(() => {
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Camera lerp
      if (cameraRef.current) {
        if (autoRotate && !pointerDownRef.current && !selectedBookingId) {
          cameraRotationRef.current.theta += delta * 0.15;
          const radius = 13.5;
          targetCamPos.current.x = Math.sin(cameraRotationRef.current.theta) * radius;
          targetCamPos.current.z = Math.cos(cameraRotationRef.current.theta) * radius;
          targetCamPos.current.y = 2.8 + Math.sin(time * 0.5) * 0.6;
        }

        cameraRef.current.position.lerp(targetCamPos.current, 0.05);
        currentLookAt.current.lerp(targetLookAt.current, 0.05);
        cameraRef.current.lookAt(currentLookAt.current);
      }

      // Rotate orbital rings
      if (nodesGroupRef.current) {
        nodesGroupRef.current.children.forEach((node) => {
          const ring = node.getObjectByName('orbitalRing');
          if (ring) {
            ring.rotation.z += delta * 0.8;
          }
          const outerRing = node.getObjectByName('outerRing');
          if (outerRing) {
            outerRing.rotation.x += delta * 0.6;
          }

          // Disruption pulse effect
          const bkg = (node.userData as any)?.booking as Booking;
          if (bkg && (bkg.status === 'cancelled' || bkg.status === 'impacted')) {
            const scale = 1 + Math.sin(time * 6) * 0.08;
            node.scale.set(scale, scale, scale);
          }
        });
      }

      // Rotate recovery waypoints
      if (recoveryBranchesRef.current) {
        recoveryBranchesRef.current.children.forEach((child) => {
          if (child instanceof THREE.Mesh) {
            child.rotation.y += delta * 1.5;
            child.rotation.x += delta * 0.8;
          }
        });
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, [autoRotate, selectedBookingId]);

  // Handle Selected Booking Camera Focus
  useEffect(() => {
    if (!selectedBookingId) {
      targetCamPos.current.set(0, 3, 14);
      targetLookAt.current.set(0, 0, 0);
      return;
    }

    const selectedBooking = bookings.find(b => b.id === selectedBookingId);
    if (selectedBooking) {
      const { x, y, z } = selectedBooking.location;
      targetLookAt.current.set(x, y, z);
      targetCamPos.current.set(x + 1.8, y + 2.2, z + 6.5);
      setAutoRotate(false);
    }
  }, [selectedBookingId, bookings]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDownRef.current = true;
    pointerPosRef.current = { x: e.clientX, y: e.clientY };
    setIsOrbiting(true);
    setAutoRotate(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current || !cameraRef.current || !nodesGroupRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(mouseX, mouseY);

    // Orbit Camera on Drag
    if (pointerDownRef.current) {
      const dx = e.clientX - pointerPosRef.current.x;
      const dy = e.clientY - pointerPosRef.current.y;
      pointerPosRef.current = { x: e.clientX, y: e.clientY };

      cameraRotationRef.current.theta -= dx * 0.008;
      cameraRotationRef.current.phi = Math.max(-0.4, Math.min(1.2, cameraRotationRef.current.phi + dy * 0.008));

      const radius = 13.5;
      targetCamPos.current.x = targetLookAt.current.x + Math.sin(cameraRotationRef.current.theta) * radius * Math.cos(cameraRotationRef.current.phi);
      targetCamPos.current.z = targetLookAt.current.z + Math.cos(cameraRotationRef.current.theta) * radius * Math.cos(cameraRotationRef.current.phi);
      targetCamPos.current.y = targetLookAt.current.y + Math.sin(cameraRotationRef.current.phi) * radius;
    } else {
      // Raycast on hover
      raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
      const intersects = raycasterRef.current.intersectObjects(nodesGroupRef.current.children, true);

      if (intersects.length > 0) {
        let parentGroup: THREE.Object3D | null = intersects[0].object;
        while (parentGroup && !parentGroup.userData?.bookingId && parentGroup.parent) {
          parentGroup = parentGroup.parent;
        }

        if (parentGroup && parentGroup.userData?.booking) {
          const b = parentGroup.userData.booking as Booking;
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
      setHoveredNode(null);
    }
  };

  const handlePointerUp = () => {
    pointerDownRef.current = false;
    setIsOrbiting(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!containerRef.current || !cameraRef.current || !nodesGroupRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    mouseRef.current.set(mouseX, mouseY);

    raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
    const intersects = raycasterRef.current.intersectObjects(nodesGroupRef.current.children, true);

    if (intersects.length > 0) {
      let parentGroup: THREE.Object3D | null = intersects[0].object;
      while (parentGroup && !parentGroup.userData?.bookingId && parentGroup.parent) {
        parentGroup = parentGroup.parent;
      }
      if (parentGroup && parentGroup.userData?.bookingId) {
        onSelectBooking(parentGroup.userData.bookingId);
      }
    }
  };

  const resetCamera = () => {
    targetCamPos.current.set(0, 3, 14);
    targetLookAt.current.set(0, 0, 0);
    cameraRotationRef.current = { phi: 0.2, theta: 0 };
    setAutoRotate(true);
    onSelectBooking('');
  };

  return (
    <div className="relative w-full h-full min-h-[460px] overflow-hidden select-none bg-[#05070B] rounded-2xl border border-slate-800/80 shadow-2xl">
      {/* WebGL Canvas Container */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onClick={handleClick}
      />

      {/* Spatial HUD Overlay: Floating telemetry coordinates & quick controls */}
      <div className="absolute top-4 left-4 z-10 flex items-center space-x-3 pointer-events-none">
        <div className="px-3 py-1.5 rounded-lg bg-slate-950/80 backdrop-blur-md border border-cyan-500/30 text-xs font-mono text-cyan-400 flex items-center space-x-2 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>3D DIGITAL TWIN // LIVE ENGINE</span>
        </div>
        <div className="px-2.5 py-1 rounded-md bg-slate-900/70 border border-slate-800 text-[11px] font-mono text-slate-400">
          NODES: {bookings.length} | EDGES: {edges.length}
        </div>
      </div>

      {/* Spatial Camera HUD Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <button
          id="btn-toggle-autorotate"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all border ${
            autoRotate
              ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300'
              : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Auto Rotation"
        >
          {autoRotate ? 'ROTATE: ON' : 'ROTATE: OFF'}
        </button>
        <button
          id="btn-reset-3d-camera"
          onClick={resetCamera}
          className="px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition-colors"
        >
          RESET CAM
        </button>
      </div>

      {/* Disruption Live Banner Overlay */}
      {isDisrupted && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-red-950/80 backdrop-blur-lg border border-red-500/60 text-red-200 text-xs font-mono flex items-center space-x-3 shadow-2xl animate-disruption-pulse">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="font-semibold tracking-wide uppercase">TRIP GRAPH DISRUPTION CASCADE ACTIVE</span>
          <span className="text-red-400 border-l border-red-500/40 pl-3">3 Downstream Dependencies Impacted</span>
        </div>
      )}

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className="absolute z-20 pointer-events-none -translate-x-1/2 -translate-y-12 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-cyan-500/40 text-xs font-mono text-slate-100 shadow-xl backdrop-blur-md whitespace-nowrap"
          style={{ left: hoveredNode.x, top: hoveredNode.y }}
        >
          <div className="font-semibold text-cyan-300">{hoveredNode.title}</div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between space-x-3">
            <span>{hoveredNode.city}</span>
            <span className={`uppercase font-bold ${
              hoveredNode.status === 'cancelled' || hoveredNode.status === 'impacted' ? 'text-red-400' :
              hoveredNode.status === 'delayed' || hoveredNode.status === 'at_risk' ? 'text-amber-400' :
              hoveredNode.status === 'recovered' ? 'text-emerald-400' : 'text-cyan-400'
            }`}>
              {hoveredNode.status}
            </span>
          </div>
        </div>
      )}

      {/* Spatial Legend in Bottom Left */}
      <div className="absolute bottom-4 left-4 z-10 hidden sm:flex items-center space-x-3 text-[11px] font-mono text-slate-400 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
        <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span><span>Normal</span></span>
        <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span><span>At Risk</span></span>
        <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-red-500"></span><span>Disrupted</span></span>
        <span className="flex items-center space-x-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span><span>Recovered</span></span>
      </div>
    </div>
  );
};
