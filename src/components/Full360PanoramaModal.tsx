import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { X, Compass, Sun, Moon, Info, Sparkles, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { DestinationItem } from './DestinationTiltCards';

interface Full360PanoramaModalProps {
  destination: DestinationItem;
  isOpen: boolean;
  onClose: () => void;
}

export const Full360PanoramaModal: React.FC<Full360PanoramaModalProps> = ({
  destination,
  isOpen,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);

  const [activeHotspot, setActiveHotspot] = useState<string | null>(null);
  const [ambientLightMode, setAmbientLightMode] = useState<'golden_hour' | 'twilight' | 'midday'>('golden_hour');

  const lonRef = useRef(180);
  const latRef = useRef(0);
  const isDraggingRef = useRef(false);
  const prevMousePos = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(70, width / height, 0.1, 1000);
    camera.position.set(0, 0, 0.1);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = ambientLightMode === 'golden_hour' ? 1.2 : ambientLightMode === 'twilight' ? 0.9 : 1.4;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const sphereGeo = new THREE.SphereGeometry(100, 60, 40);
    sphereGeo.scale(-1, 1, 1);

    const loader = new THREE.TextureLoader();
    loader.load(destination.panoramaImage, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      const sphereMat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      scene.add(sphereMesh);
      sphereMeshRef.current = sphereMesh;
    });

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!isDraggingRef.current) {
        lonRef.current += 0.03;
      }

      const phi = THREE.MathUtils.degToRad(90 - latRef.current);
      const theta = THREE.MathUtils.degToRad(lonRef.current);

      const target = new THREE.Vector3(
        500 * Math.sin(phi) * Math.cos(theta),
        500 * Math.cos(phi),
        500 * Math.sin(phi) * Math.sin(theta)
      );

      if (cameraRef.current) cameraRef.current.lookAt(target);
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };

    animate();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      sphereGeo.dispose();
    };
  }, [isOpen, destination.panoramaImage]);

  if (!isOpen) return null;

  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - prevMousePos.current.x;
    const deltaY = e.clientY - prevMousePos.current.y;
    prevMousePos.current = { x: e.clientX, y: e.clientY };

    lonRef.current -= deltaX * 0.16;
    latRef.current = Math.max(-85, Math.min(85, latRef.current + deltaY * 0.16));
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  const handlePan = (dir: 'up' | 'down' | 'left' | 'right') => {
    if (dir === 'left') lonRef.current -= 20;
    if (dir === 'right') lonRef.current += 20;
    if (dir === 'up') latRef.current = Math.min(85, latRef.current + 15);
    if (dir === 'down') latRef.current = Math.max(-85, latRef.current - 15);
  };

  const hotspots = [
    { id: 'terrace', label: 'Infinity Cliffside Terrace', desc: 'Direct views of the Tyrrhenian sunset & Positano bay.' },
    { id: 'suite', label: 'Master King Alcove', desc: 'Hand-woven Italian linens, bespoke walnut cabinetry.' },
    { id: 'bath', label: 'Carrara Marble Spa Bath', desc: 'Freestanding soaking tub with heated limestone flooring.' },
    { id: 'chef', label: 'Private Sommelier & Chef Table', desc: 'Curated 7-course seasonal Amalfi seafood degustation.' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex flex-col justify-between overflow-hidden animate-fadeIn">
      {/* 360 Canvas */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Top Header Controls */}
      <div className="relative z-20 px-6 sm:px-12 py-6 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto flex items-center space-x-3 bg-slate-950/80 backdrop-blur-xl border border-gold-subtle rounded-2xl px-4 py-2.5 shadow-2xl">
          <Compass className="w-5 h-5 text-[#D4AF37] animate-spin-slow" />
          <div>
            <h2 className="font-serif-display text-lg text-white font-medium leading-tight">
              {destination.villaName}
            </h2>
            <span className="text-[10px] font-cinzel font-semibold text-[#D4AF37] tracking-widest block">
              360° SPATIAL SUITE EXPLORATION • {destination.villaLocation}
            </span>
          </div>
        </div>

        <div className="pointer-events-auto flex items-center space-x-3">
          {/* Lighting mood toggle */}
          <div className="hidden sm:flex items-center space-x-1 bg-slate-950/80 backdrop-blur-xl border border-gold-subtle rounded-full p-1 text-xs font-mono">
            <button
              onClick={() => setAmbientLightMode('golden_hour')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                ambientLightMode === 'golden_hour' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Golden Hour
            </button>
            <button
              onClick={() => setAmbientLightMode('twilight')}
              className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                ambientLightMode === 'twilight' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
              }`}
            >
              Twilight
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-slate-950/80 border border-gold-subtle hover:border-[#D4AF37] flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer shadow-2xl"
            title="Close 360 Preview"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Hotspots & Spatial Pad */}
      <div className="relative z-20 px-6 sm:px-12 py-6 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 pointer-events-none">
        {/* Hotspot Pills */}
        <div className="pointer-events-auto flex flex-wrap gap-2 max-w-2xl">
          {hotspots.map((h) => (
            <button
              key={h.id}
              onClick={() => setActiveHotspot(activeHotspot === h.id ? null : h.id)}
              className={`px-3.5 py-1.5 rounded-full border text-xs font-cinzel tracking-wider backdrop-blur-xl transition-all cursor-pointer shadow-lg flex items-center space-x-1.5 ${
                activeHotspot === h.id
                  ? 'border-gold-bright bg-[#D4AF37] text-slate-950 font-bold'
                  : 'border-gold-subtle bg-slate-950/80 text-slate-300 hover:border-[#D4AF37] hover:text-white'
              }`}
            >
              <Sparkles className="w-3 h-3 text-[#D4AF37] group-hover:text-slate-950" />
              <span>{h.label}</span>
            </button>
          ))}
        </div>

        {/* Spatial Pan Controller */}
        <div className="pointer-events-auto relative w-16 h-16 rounded-full bg-slate-950/90 backdrop-blur-xl border border-[#D4AF37] shadow-2xl flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full border border-[#D4AF37] flex items-center justify-center">
            <span className="w-1.5 h-1.5 bg-[#D4AF37] rounded-full" />
          </div>
          <button onClick={() => handlePan('up')} className="absolute top-1 text-[#D4AF37] hover:text-white p-0.5"><ChevronUp className="w-4 h-4" /></button>
          <button onClick={() => handlePan('down')} className="absolute bottom-1 text-[#D4AF37] hover:text-white p-0.5"><ChevronDown className="w-4 h-4" /></button>
          <button onClick={() => handlePan('left')} className="absolute left-1 text-[#D4AF37] hover:text-white p-0.5"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => handlePan('right')} className="absolute right-1 text-[#D4AF37] hover:text-white p-0.5"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Selected Hotspot Detail Toast */}
      {activeHotspot && (
        <div className="absolute bottom-24 left-6 sm:left-12 z-30 max-w-md p-4 rounded-2xl bg-slate-950/95 border border-gold-bright shadow-2xl backdrop-blur-2xl animate-slideUp">
          <div className="flex items-center justify-between pb-1 mb-1 border-b border-[#D4AF37]/30">
            <span className="text-xs font-cinzel font-bold text-[#FCE7AC]">
              {hotspots.find((h) => h.id === activeHotspot)?.label}
            </span>
            <button onClick={() => setActiveHotspot(null)} className="text-slate-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-sans-luxury text-slate-300">
            {hotspots.find((h) => h.id === activeHotspot)?.desc}
          </p>
        </div>
      )}
    </div>
  );
};
