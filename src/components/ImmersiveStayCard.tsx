import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Sparkles, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye, Maximize2, MapPin } from 'lucide-react';
import { DestinationItem } from './DestinationTiltCards';

interface ImmersiveStayCardProps {
  destination: DestinationItem;
  onOpenFullPanorama: () => void;
  reducedMotion?: boolean;
}

export const ImmersiveStayCard: React.FC<ImmersiveStayCardProps> = ({
  destination,
  onOpenFullPanorama,
  reducedMotion = false,
}) => {
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());

  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const lonRef = useRef(180);
  const latRef = useRef(0);
  const animFrameRef = useRef<number | null>(null);

  // 360 WebGL sphere initialization
  useEffect(() => {
    if (!canvasContainerRef.current) return;
    const container = canvasContainerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(65, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Sphere geometry for equirectangular 360 panorama projection
    const sphereGeo = new THREE.SphereGeometry(50, 60, 40);
    sphereGeo.scale(-1, 1, 1); // Invert faces inward

    const sphereMat = new THREE.MeshBasicMaterial({
      color: 0xFFFFFF,
      side: THREE.DoubleSide,
    });
    const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
    scene.add(sphereMesh);
    sphereMeshRef.current = sphereMesh;

    // Load initial panoramic texture
    textureLoaderRef.current.load(destination.panoramaImage, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if (sphereMeshRef.current) {
        (sphereMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
        (sphereMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    });

    const handleResize = () => {
      if (!canvasContainerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = canvasContainerRef.current.clientWidth;
      const h = canvasContainerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Render loop
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!isDraggingRef.current && !reducedMotion) {
        lonRef.current += 0.04; // Gentle slow pan
      }

      // Convert Spherical Angles to Cartesian LookAt vector
      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);

      const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      if (cameraRef.current) {
        cameraRef.current.lookAt(target);
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      resizeObserver.disconnect();
      renderer.dispose();
      sphereGeo.dispose();
      sphereMat.dispose();
    };
  }, []);

  // Update texture when destination changes
  useEffect(() => {
    if (!sphereMeshRef.current) return;
    textureLoaderRef.current.load(destination.panoramaImage, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      if (sphereMeshRef.current) {
        (sphereMeshRef.current.material as THREE.MeshBasicMaterial).map = tex;
        (sphereMeshRef.current.material as THREE.MeshBasicMaterial).needsUpdate = true;
      }
    });
  }, [destination.panoramaImage]);

  // Drag interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    lonRef.current -= deltaX * 0.18;
    latRef.current = Math.max(-85, Math.min(85, latRef.current + deltaY * 0.18));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  // 4-Way Spatial Control Pad adjustments
  const handlePan = (direction: 'up' | 'down' | 'left' | 'right') => {
    if (direction === 'left') lonRef.current -= 15;
    if (direction === 'right') lonRef.current += 15;
    if (direction === 'up') latRef.current = Math.min(85, latRef.current + 12);
    if (direction === 'down') latRef.current = Math.max(-85, latRef.current - 12);
  };

  return (
    <div className="relative w-full rounded-2xl bg-gradient-to-r from-[#0E1017]/95 via-[#0B0C10]/95 to-[#08090C]/95 border border-gold-subtle backdrop-blur-2xl shadow-2xl p-5 sm:p-6 lg:p-7 flex flex-col lg:flex-row items-stretch justify-between gap-6 overflow-hidden">
      {/* Background soft gold glow */}
      <div className="absolute top-0 right-1/4 w-80 h-80 bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Left Details Panel */}
      <div className="w-full lg:w-5/12 space-y-3.5 z-10 flex flex-col justify-between">
        {/* Box 1: Header Category & Status Badge */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-950/80 border border-gold-subtle/50 text-[10px] font-cinzel font-semibold tracking-[0.2em] text-[#D4AF37]">
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>IMMERSIVE STAY</span>
          </div>
          <span className="text-[9px] text-[#FCE7AC] px-2 py-0.5 rounded-full bg-[#D4AF37]/15 border border-gold-bright/30">
            VERIFIED RESIDENCE
          </span>
        </div>

        {/* Box 2: Residence Title & Location Box */}
        <div className="p-3.5 rounded-xl bg-[#090B10]/95 border border-gold-subtle shadow-md space-y-1.5">
          <div className="text-[9px] font-cinzel font-bold tracking-widest text-slate-400 uppercase">
            ROYAL PALACE & HERITAGE SUITE
          </div>
          <h3 className="font-serif-display font-medium text-xl sm:text-2xl text-white tracking-wide leading-snug">
            {destination.villaName}
          </h3>
          <div className="flex items-center space-x-1.5 pt-0.5 text-[11px] font-cinzel font-semibold tracking-wider text-[#E5C07B]">
            <MapPin className="w-3 h-3 text-[#D4AF37] shrink-0" />
            <span>{destination.villaLocation}</span>
          </div>
        </div>

        {/* Box 3: Description Narrative Box */}
        <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs font-sans-luxury text-slate-300 font-light leading-relaxed space-y-1">
          <div className="text-[9px] font-cinzel font-bold tracking-widest text-[#D4AF37] uppercase">
            EXPERIENCE NARRATIVE
          </div>
          <p>{destination.villaDescription}</p>
        </div>

        {/* Box 4: Dual Key Metrics Box (Tariff & GPS Coordinates) */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-gold-subtle/60">
            <span className="text-[9px] font-cinzel font-bold text-slate-400 block uppercase tracking-wider">
              ROYAL TARIFF
            </span>
            <span className="text-xs sm:text-[13px] font-sans-luxury font-bold text-[#FCE7AC] block mt-0.5">
              {destination.priceEstimate}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950/80 border border-gold-subtle/60">
            <span className="text-[9px] font-cinzel font-bold text-slate-400 block uppercase tracking-wider">
              GPS POSITION
            </span>
            <span className="text-[11px] font-mono font-medium text-slate-300 block mt-0.5 truncate" title={destination.coordinates}>
              {destination.coordinates}
            </span>
          </div>
        </div>

        {/* Box 5: Privilege Highlight Chips */}
        <div className="flex flex-wrap gap-1.5 pt-0.5">
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-gold-subtle/40 text-[10px] font-cinzel text-slate-300">
            ✦ 24/7 Butler Service
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-gold-subtle/40 text-[10px] font-cinzel text-slate-300">
            ✦ Heritage Courtyard
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-slate-950/90 border border-gold-subtle/40 text-[10px] font-cinzel text-slate-300">
            ✦ 360° Living View
          </span>
        </div>

        {/* Box 6: Action Button Container */}
        <div className="pt-1.5">
          <button
            onClick={onOpenFullPanorama}
            className="w-full px-5 py-2.5 rounded-full border border-gold-bright bg-gradient-to-r from-slate-950 to-slate-900 hover:from-[#D4AF37] hover:to-[#B89628] text-slate-200 hover:text-slate-950 font-cinzel text-xs font-bold tracking-widest transition-all flex items-center justify-center space-x-2 cursor-pointer shadow-lg shadow-[#D4AF37]/10 group"
          >
            <Compass className="w-3.5 h-3.5 text-[#D4AF37] group-hover:text-slate-950 transition-colors" />
            <span>EXPLORE FULL 360° PANORAMA</span>
          </button>
        </div>
      </div>

      {/* Right Interactive 360 Panorama Viewport */}
      <div className="w-full lg:w-7/12 min-h-[380px] sm:min-h-[460px] lg:min-h-[500px] lg:h-auto lg:self-stretch relative rounded-xl overflow-hidden border border-gold-subtle/80 bg-slate-950 shadow-inner group flex-1">
        {/* WebGL Canvas */}
        <div
          ref={canvasContainerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />

        {/* 360 Watermark Badge */}
        <div className="absolute top-3 left-3 pointer-events-none px-2.5 py-1 rounded-full bg-slate-950/80 border border-gold-subtle text-[9px] font-cinzel tracking-widest text-[#F3E5AB] backdrop-blur-md flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
          <span>VIRTUAL SUITE PREVIEW</span>
        </div>

        {/* Fullscreen Expand Button */}
        <button
          onClick={onOpenFullPanorama}
          className="absolute top-3 right-3 p-2 rounded-full bg-slate-950/80 border border-gold-subtle hover:border-[#D4AF37] text-slate-300 hover:text-[#F3E5AB] transition-colors cursor-pointer"
          title="Fullscreen 360 Experience"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* 4-Way Spatial Navigation Overlay Widget (as in reference image) */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center justify-center">
          <div className="relative w-14 h-14 rounded-full bg-slate-950/85 backdrop-blur-md border border-[#D4AF37]/50 shadow-2xl flex items-center justify-center">
            {/* Center Reticle */}
            <div className="w-3 h-3 rounded-full border border-[#D4AF37] flex items-center justify-center pointer-events-none">
              <span className="w-1 h-1 bg-[#D4AF37] rounded-full" />
            </div>

            {/* Up arrow */}
            <button
              onClick={() => handlePan('up')}
              className="absolute top-0.5 text-[#D4AF37] hover:text-white p-0.5 cursor-pointer"
              title="Pan Up"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            {/* Down arrow */}
            <button
              onClick={() => handlePan('down')}
              className="absolute bottom-0.5 text-[#D4AF37] hover:text-white p-0.5 cursor-pointer"
              title="Pan Down"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>

            {/* Left arrow */}
            <button
              onClick={() => handlePan('left')}
              className="absolute left-0.5 text-[#D4AF37] hover:text-white p-0.5 cursor-pointer"
              title="Pan Left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {/* Right arrow */}
            <button
              onClick={() => handlePan('right')}
              className="absolute right-0.5 text-[#D4AF37] hover:text-white p-0.5 cursor-pointer"
              title="Pan Right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
