import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, Eye, Maximize2, Minimize2, Sparkles, Bed, ShieldCheck, Sun, Moon, Info, RotateCcw } from 'lucide-react';
import { playSound } from '../lib/sound-effects';

export interface SuiteOption {
  id: string;
  name: string;
  property: string;
  location: string;
  category: string;
  sqft: number;
  ratePerNight: number;
  description: string;
  decorTone: 'royal_gold' | 'sapphire_sky' | 'teak_heritage' | 'emerald_oasis';
  hotspots: {
    id: string;
    label: string;
    detail: string;
    lon: number; // longitude degrees -180 to 180
    lat: number; // latitude degrees -90 to 90
  }[];
}

export const LUXURY_SUITES: SuiteOption[] = [
  {
    id: 'suite_itc_rajputana',
    name: 'Maharaja Heritage Suite #304',
    property: 'ITC Rajputana, A Luxury Collection Hotel',
    location: 'Jaipur, Rajasthan',
    category: 'Palace Wing Grand Suite',
    sqft: 1450,
    ratePerNight: 28500,
    description: 'Carved Rajasthani jharokha lattice work overlooking royal fountains, Makrana white marble floors, private courtyard plunge pool, and dedicated Khansama dining.',
    decorTone: 'royal_gold',
    hotspots: [
      { id: 'h1', label: 'Private Courtyard & Plunge Pool', detail: 'Temperature controlled 28°C plunge pool with hand-chiseled pink sandstone jali screens.', lon: 0, lat: -5 },
      { id: 'h2', label: 'Royal Butler Call & Bar', detail: '24/7 dedicated butler service with single-origin teas and curated vintage cellar.', lon: 85, lat: 10 },
      { id: 'h3', label: 'Diwan Lounge & Silk Carpets', detail: 'Hand-knotted Kashmiri silk carpets and 24K gold foil ceiling accents.', lon: -95, lat: -15 },
      { id: 'h4', label: 'Hermès Terre d\'Hermès Amenities', detail: 'Full-size Parisian luxury apothecary collection with marble soaking tub.', lon: 170, lat: 5 },
    ],
  },
  {
    id: 'suite_sky_cabin',
    name: 'First Class Private Sky Suite',
    property: 'Boeing 777-300ER / First Royale',
    location: 'Mumbai (BOM) → New Delhi (DEL)',
    category: 'Enclosed Ultra-First Suite',
    sqft: 420,
    ratePerNight: 46000,
    description: 'Floor-to-ceiling sliding privacy doors, virtual high-definition windows, zero-gravity leather seating inspired by NASA telemetry, and B&O noise cancellation.',
    decorTone: 'sapphire_sky',
    hotspots: [
      { id: 'h1', label: 'Zero-Gravity Recline Bed', detail: 'Multi-posture orthopedic mattress with customized thread count Egyptian cotton linen.', lon: -15, lat: -10 },
      { id: 'h2', label: 'Personal Caviar & Champagne Bar', detail: 'Dom Pérignon Vintage 2013 and Imperial Ossetra caviar service at 38,000 ft.', lon: 70, lat: 15 },
      { id: 'h3', label: 'Virtual Skyline Optic Viewport', detail: 'Fiber-optic real-time external panoramic camera with night vision and star map.', lon: -100, lat: 20 },
    ],
  },
  {
    id: 'suite_belmond_carriage',
    name: 'Palace Royal Express State Carriage',
    property: 'The Maharajas\' Express Heritage Rail',
    location: 'New Delhi (NDLS) → Jaipur (JP)',
    category: 'Presidential Suite Carriage',
    sqft: 680,
    ratePerNight: 62000,
    description: 'Rich Burmese teakwood marquetry, Lalique crystal glass decor, panoramic observation bay, private ensuite shower, and continuous silver-service dining.',
    decorTone: 'teak_heritage',
    hotspots: [
      { id: 'h1', label: 'Marquetry Writing Desk', detail: 'Inlaid mother-of-pearl stationery bureau with satellite starlink terminal.', lon: 10, lat: -8 },
      { id: 'h2', label: 'Panoramic Trackside Saloon', detail: 'Double-glazed soundproof bay windows viewing the Aravalli hills and Thar landscape.', lon: -80, lat: 12 },
      { id: 'h3', label: 'Ensuite Marble Shower', detail: 'Pressurized rainfall shower with Kama Ayurveda botanical extracts.', lon: 110, lat: 0 },
    ],
  },
];

interface PanoramicSuiteViewerProps {
  soundEnabled?: boolean;
}

export const PanoramicSuiteViewer: React.FC<PanoramicSuiteViewerProps> = ({ soundEnabled = true }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sphereMeshRef = useRef<THREE.Mesh | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [activeSuiteIndex, setActiveSuiteIndex] = useState<number>(0);
  const [activeHotspot, setActiveHotspot] = useState<SuiteOption['hotspots'][0] | null>(null);
  const [isAutoRotating, setIsAutoRotating] = useState<boolean>(true);
  const [timeOfDay, setTimeOfDay] = useState<'sunset' | 'day' | 'night'>('sunset');
  const [fovZoom, setFovZoom] = useState<number>(75);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [webglFailed, setWebglFailed] = useState<boolean>(false);

  const activeSuite = LUXURY_SUITES[activeSuiteIndex];

  // Camera angles (lon, lat)
  const isPointerDownRef = useRef<boolean>(false);
  const onPointerDownPointerXRef = useRef<number>(0);
  const onPointerDownPointerYRef = useRef<number>(0);
  const onPointerDownLonRef = useRef<number>(0);
  const onPointerDownLatRef = useRef<number>(0);

  const lonRef = useRef<number>(0);
  const latRef = useRef<number>(0);
  const phiRef = useRef<number>(0);
  const thetaRef = useRef<number>(0);

  // Generate procedural equirectangular 360° luxury texture based on theme & time
  const generateProceduralEquirectangular = (tone: SuiteOption['decorTone'], time: 'sunset' | 'day' | 'night'): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d')!;

    // Base background gradient (ceiling to floor)
    let ceilingColor = '#10121A';
    let wallColor = '#1F2433';
    let floorColor = '#0A0C11';
    let accentGold = '#D4AF37';

    if (tone === 'royal_gold') {
      ceilingColor = time === 'night' ? '#120F0A' : time === 'sunset' ? '#2A1810' : '#2D2316';
      wallColor = time === 'night' ? '#1E1710' : time === 'sunset' ? '#3D2518' : '#3E301F';
      floorColor = '#140F0A';
      accentGold = '#E5C07B';
    } else if (tone === 'sapphire_sky') {
      ceilingColor = time === 'night' ? '#080C14' : time === 'sunset' ? '#1A182E' : '#142036';
      wallColor = time === 'night' ? '#0F1726' : time === 'sunset' ? '#261F3D' : '#1E2C4A';
      floorColor = '#06090F';
      accentGold = '#93C5FD';
    } else if (tone === 'teak_heritage') {
      ceilingColor = '#1A120B';
      wallColor = '#2E1E12';
      floorColor = '#120B06';
      accentGold = '#D4AF37';
    }

    // Sky / Ceiling
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGrad.addColorStop(0, ceilingColor);
    bgGrad.addColorStop(0.35, wallColor);
    bgGrad.addColorStop(0.65, wallColor);
    bgGrad.addColorStop(1, floorColor);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Architectural Panels & Windows
    ctx.lineWidth = 3;
    ctx.strokeStyle = `${accentGold}33`;

    // Horizontal architectural trims
    ctx.beginPath();
    ctx.moveTo(0, 360); ctx.lineTo(canvas.width, 360);
    ctx.moveTo(0, 680); ctx.lineTo(canvas.width, 680);
    ctx.stroke();

    // 8 Grand Arched Windows / Murals around the 360 sphere
    const numColumns = 8;
    const colWidth = canvas.width / numColumns;
    for (let i = 0; i < numColumns; i++) {
      const x = i * colWidth + 40;
      const w = colWidth - 80;
      const y = 370;
      const h = 300;

      // Window Frame & Glow
      const winGrad = ctx.createLinearGradient(x, y, x, y + h);
      if (time === 'sunset') {
        winGrad.addColorStop(0, 'rgba(245, 158, 11, 0.25)');
        winGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.15)');
        winGrad.addColorStop(1, 'rgba(30, 27, 75, 0.3)');
      } else if (time === 'night') {
        winGrad.addColorStop(0, 'rgba(15, 23, 42, 0.8)');
        winGrad.addColorStop(1, 'rgba(30, 58, 138, 0.2)');
      } else {
        winGrad.addColorStop(0, 'rgba(254, 240, 138, 0.35)');
        winGrad.addColorStop(1, 'rgba(56, 189, 248, 0.15)');
      }

      ctx.fillStyle = winGrad;
      ctx.fillRect(x, y, w, h);

      // Delicate Arch Top
      ctx.strokeStyle = `${accentGold}66`;
      ctx.strokeRect(x, y, w, h);
      
      // Jali lattice or glass grid
      ctx.lineWidth = 1;
      ctx.strokeStyle = `${accentGold}22`;
      for (let gx = x + 25; gx < x + w; gx += 25) {
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.lineTo(gx, y + h);
        ctx.stroke();
      }
      for (let gy = y + 25; gy < y + h; gy += 25) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + w, gy);
        ctx.stroke();
      }
    }

    // Floor Marble Inlay / Geometric Grid
    ctx.strokeStyle = `${accentGold}18`;
    for (let fx = 0; fx < canvas.width; fx += 80) {
      ctx.beginPath();
      ctx.moveTo(fx, 680);
      ctx.lineTo(fx, canvas.height);
      ctx.stroke();
    }

    // Chandelier / Ambient Golden Ceiling Star Rosette
    for (let c = 0; c < 4; c++) {
      const cx = (c * 2 + 1) * (canvas.width / 8);
      const cy = 200;
      const radGrad = ctx.createRadialGradient(cx, cy, 5, cx, cy, 140);
      radGrad.addColorStop(0, `${accentGold}99`);
      radGrad.addColorStop(0.3, `${accentGold}33`);
      radGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.fill();
    }

    // Warm Ambient Vignette
    const vignette = ctx.createRadialGradient(canvas.width / 2, canvas.height / 2, 200, canvas.width / 2, canvas.height / 2, canvas.width / 1.5);
    vignette.addColorStop(0, 'transparent');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = Math.max(1, container.clientWidth || window.innerWidth);
    const height = Math.max(1, container.clientHeight || window.innerHeight);

    let renderer: THREE.WebGLRenderer | null = null;
    let geometry: THREE.SphereGeometry | null = null;
    let material: THREE.MeshBasicMaterial | null = null;
    let texture: THREE.CanvasTexture | null = null;

    try {
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(fovZoom, width / height, 0.1, 1000);
      camera.position.set(0, 0, 0.1);
      cameraRef.current = camera;

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.1;
      container.innerHTML = '';
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Sphere geometry with inverted normals for inside-out 360 panoramic mapping
      geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1);

      texture = generateProceduralEquirectangular(activeSuite.decorTone, timeOfDay);
      material = new THREE.MeshBasicMaterial({ map: texture });
      const sphereMesh = new THREE.Mesh(geometry, material);
      scene.add(sphereMesh);
      sphereMeshRef.current = sphereMesh;

      // Animation Loop
      const animate = () => {
        animFrameIdRef.current = requestAnimationFrame(animate);

        if (isAutoRotating && !isPointerDownRef.current) {
          lonRef.current += 0.06;
        }

        latRef.current = Math.max(-85, Math.min(85, latRef.current));
        phiRef.current = THREE.MathUtils.degToRad(90 - latRef.current);
        thetaRef.current = THREE.MathUtils.degToRad(lonRef.current);

        const targetX = 500 * Math.sin(phiRef.current) * Math.cos(thetaRef.current);
        const targetY = 500 * Math.cos(phiRef.current);
        const targetZ = 500 * Math.sin(phiRef.current) * Math.sin(thetaRef.current);

        camera.lookAt(targetX, targetY, targetZ);
        if (rendererRef.current && sceneRef.current) {
          rendererRef.current.render(sceneRef.current, camera);
        }
      };

      animate();
    } catch (err) {
      console.warn('[PanoramicSuiteViewer] WebGL initialization fallback:', err);
      setWebglFailed(true);
    }

    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = Math.max(1, containerRef.current.clientWidth || window.innerWidth);
      const h = Math.max(1, containerRef.current.clientHeight || window.innerHeight);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      if (geometry) geometry.dispose();
      if (material) material.dispose();
      if (texture) texture.dispose();
      if (renderer) renderer.dispose();
    };
  }, [activeSuiteIndex, timeOfDay]);

  // Update FOV on zoom change
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = fovZoom;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [fovZoom]);

  // Pointer Interaction Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    isPointerDownRef.current = true;
    onPointerDownPointerXRef.current = e.clientX;
    onPointerDownPointerYRef.current = e.clientY;
    onPointerDownLonRef.current = lonRef.current;
    onPointerDownLatRef.current = latRef.current;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    lonRef.current = (onPointerDownPointerXRef.current - e.clientX) * 0.15 + onPointerDownLonRef.current;
    latRef.current = (e.clientY - onPointerDownPointerYRef.current) * 0.15 + onPointerDownLatRef.current;
  };

  const handlePointerUp = () => {
    isPointerDownRef.current = false;
  };

  // Jump camera to hotspot
  const jumpToHotspot = (hs: SuiteOption['hotspots'][0]) => {
    playSound('click', soundEnabled);
    lonRef.current = hs.lon;
    latRef.current = hs.lat;
    setActiveHotspot(hs);
    setIsAutoRotating(false);
  };

  return (
    <div className={`w-full rounded-2xl border border-gold-subtle bg-[#0B0D13] p-5 lg:p-7 space-y-6 shadow-2xl relative overflow-hidden transition-all ${isFullscreen ? 'fixed inset-0 z-50 rounded-none p-8 bg-[#08090C]' : ''}`}>
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gold-subtle pb-5">
        <div>
          <div className="flex items-center space-x-2 text-xs font-cinzel text-[#D4AF37] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>VOGUE PANORAMA // 3D SPATIAL SUITE & CARRIAGE VIEWER</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-display font-bold text-champagne-gradient tracking-tight">
            {activeSuite.name}
          </h2>
          <p className="text-xs sm:text-sm font-sans-luxury text-slate-400 mt-0.5">
            {activeSuite.property} • {activeSuite.location}
          </p>
        </div>

        {/* Suite Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-gold-subtle">
          {LUXURY_SUITES.map((suite, idx) => (
            <button
              key={suite.id}
              onClick={() => {
                playSound('click', soundEnabled);
                setActiveSuiteIndex(idx);
                setActiveHotspot(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-cinzel transition-all cursor-pointer ${
                activeSuiteIndex === idx
                  ? 'bg-gradient-to-r from-[#D4AF37] to-[#A88325] text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900'
              }`}
            >
              {suite.category.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main 360 WebGL Viewport Container */}
      <div className="relative w-full h-[400px] lg:h-[500px] rounded-xl overflow-hidden border border-gold-subtle bg-black cursor-grab active:cursor-grabbing group">
        <div
          ref={containerRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="w-full h-full"
        />

        {webglFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-slate-900 to-black z-20">
            <Bed className="w-12 h-12 text-[#D4AF37] mb-3 opacity-80" />
            <h3 className="text-lg font-cinzel font-bold text-white mb-1">{activeSuite.name}</h3>
            <p className="text-xs text-slate-400 max-w-md font-sans-luxury">{activeSuite.description}</p>
            <span className="mt-3 text-[11px] font-mono text-[#E5C07B] bg-slate-950/80 px-3 py-1 rounded border border-gold-subtle">
              360° Hardware acceleration unavailable • Direct Suite Preview Mode
            </span>
          </div>
        )}

        {/* Overlay Vignette */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/40" />

        {/* Top-Left Telemetry Badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gold-subtle text-xs font-mono">
          <Compass className={`w-4 h-4 text-[#D4AF37] ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
          <span className="text-slate-200">360° SPATIAL WEBGL CAMERA</span>
          <span className="text-[#D4AF37]">• DRAG TO EXPLORE</span>
        </div>

        {/* Top-Right Controls */}
        <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
          {/* Time of Day Switcher */}
          <div className="flex items-center bg-slate-950/85 backdrop-blur-md p-1 rounded-lg border border-gold-subtle text-xs">
            <button
              onClick={() => { playSound('click', soundEnabled); setTimeOfDay('sunset'); }}
              title="Golden Hour / Sunset"
              className={`p-1.5 rounded ${timeOfDay === 'sunset' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => { playSound('click', soundEnabled); setTimeOfDay('night'); }}
              title="Midnight Starlight"
              className={`p-1.5 rounded ${timeOfDay === 'night' ? 'bg-[#D4AF37] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Auto Rotate Toggle */}
          <button
            onClick={() => {
              playSound('click', soundEnabled);
              setIsAutoRotating(prev => !prev);
            }}
            className={`p-2 rounded-lg bg-slate-950/85 border border-gold-subtle text-xs flex items-center space-x-1.5 transition-colors cursor-pointer ${
              isAutoRotating ? 'text-[#D4AF37] border-gold-bright' : 'text-slate-400 hover:text-white'
            }`}
            title="Auto Panorama Orbit"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => {
              playSound('click', soundEnabled);
              setIsFullscreen(prev => !prev);
            }}
            className="p-2 rounded-lg bg-slate-950/85 border border-gold-subtle text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Hotspot Drawer HUD */}
        {activeHotspot && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md z-10 p-4 rounded-xl bg-slate-950/90 backdrop-blur-xl border border-gold-bright shadow-2xl text-slate-100 space-y-1.5 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-[#D4AF37] font-cinzel font-bold">
              <span className="flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>SUITE AMENITY SPOTLIGHT</span>
              </span>
              <button
                onClick={() => setActiveHotspot(null)}
                className="text-slate-400 hover:text-white text-xs font-mono"
              >
                ✕
              </button>
            </div>
            <h4 className="font-serif-display text-base font-bold text-white">
              {activeHotspot.label}
            </h4>
            <p className="text-xs font-sans-luxury text-slate-300 leading-relaxed">
              {activeHotspot.detail}
            </p>
          </div>
        )}

        {/* Zoom Slider Control at bottom-right */}
        <div className="absolute bottom-4 right-4 z-10 flex items-center space-x-2 bg-slate-950/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-gold-subtle text-xs font-mono">
          <span className="text-slate-400">FOV:</span>
          <input
            type="range"
            min="45"
            max="100"
            value={fovZoom}
            onChange={e => setFovZoom(Number(e.target.value))}
            className="w-20 accent-[#D4AF37] cursor-pointer"
          />
          <span className="text-[#D4AF37]">{fovZoom}°</span>
        </div>
      </div>

      {/* Hotspots & Suite Amenities Deck */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {activeSuite.hotspots.map(hs => {
          const isSelected = activeHotspot?.id === hs.id;
          return (
            <div
              key={hs.id}
              onClick={() => jumpToHotspot(hs)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                isSelected
                  ? 'border-gold-bright bg-gradient-to-br from-[#D4AF37]/20 to-slate-950 shadow-lg'
                  : 'border-gold-subtle bg-slate-950/50 hover:bg-slate-900/60 hover:border-[#D4AF37]/50'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-xs text-[#D4AF37] font-cinzel font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="truncate">{hs.label}</span>
              </div>
              <p className="text-[11px] font-sans-luxury text-slate-400 line-clamp-2 leading-snug">
                {hs.detail}
              </p>
              <div className="text-[10px] font-mono text-[#E5C07B] pt-1">
                Click to focus 360° lens →
              </div>
            </div>
          );
        })}
      </div>

      {/* Suite Specifications Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/70 border border-gold-subtle text-xs font-sans-luxury">
        <div className="flex items-center space-x-6">
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Suite Dimensions:</span>
            <span className="font-semibold text-slate-100">{activeSuite.sqft.toLocaleString()} sq ft Private Wing</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Complimentary Concierge:</span>
            <span className="text-[#D4AF37] font-semibold">24/7 Dedicated Royal Butler</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <span className="text-slate-400 text-[10px] uppercase font-mono block">Tariff:</span>
            <span className="font-serif-display text-lg font-bold text-[#E5C07B]">₹{activeSuite.ratePerNight.toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-400">/night</span></span>
          </div>
          <button
            onClick={() => playSound('success', soundEnabled)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#A88325] text-slate-950 font-cinzel font-bold hover:brightness-110 shadow-lg shadow-[#D4AF37]/20 transition-all cursor-pointer"
          >
            INSPECT SUITE DETAILS
          </button>
        </div>
      </div>
    </div>
  );
};
