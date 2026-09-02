import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface DepthShaderHeroCanvasProps {
  imageUrl: string;
  depthIntensity?: number;
  reducedMotion?: boolean;
}

export const DepthShaderHeroCanvas: React.FC<DepthShaderHeroCanvasProps> = ({
  imageUrl,
  depthIntensity = 0.025,
  reducedMotion = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const textureLoaderRef = useRef<THREE.TextureLoader>(new THREE.TextureLoader());
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // Scene & Orthographic Camera for full-screen quad
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Vertex & Fragment Shaders for Parallax & Distortion Waves
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform sampler2D uTexture;
      uniform vec2 uMouse;
      uniform vec2 uResolution;
      uniform vec2 uImageResolution;
      uniform float uTime;
      uniform float uIntensity;
      varying vec2 vUv;

      void main() {
        // Aspect-ratio cover calculation
        vec2 ratio = vec2(
          min((uResolution.x / uResolution.y) / (uImageResolution.x / uImageResolution.y), 1.0),
          min((uResolution.y / uResolution.x) / (uImageResolution.y / uImageResolution.x), 1.0)
        );
        vec2 uv = vec2(
          vUv.x * ratio.x + (1.0 - ratio.x) * 0.5,
          vUv.y * ratio.y + (1.0 - ratio.y) * 0.5
        );

        // Distance from center for radial depth
        float distFromCenter = length(uv - vec2(0.5, 0.5));
        
        // Depth-map estimation from luminance & radial gradient
        vec4 baseColor = texture2D(uTexture, uv);
        float luma = dot(baseColor.rgb, vec3(0.299, 0.587, 0.114));
        float depth = clamp(luma * 0.6 + (1.0 - distFromCenter) * 0.4, 0.1, 1.0);

        // Subtle water/heat distortion wave at bottom
        float wave = sin(uv.y * 30.0 + uTime * 1.5) * cos(uv.x * 20.0 + uTime * 1.2) * 0.002 * smoothstep(0.7, 1.0, uv.y);

        // Parallax displacement based on mouse offset & depth
        vec2 offset = uMouse * depth * uIntensity + vec2(wave, wave * 0.5);
        vec2 displacedUv = uv + offset;

        // Sample with chromatic aberration for cinematic luxury lens
        float r = texture2D(uTexture, displacedUv + offset * 0.12).r;
        float g = texture2D(uTexture, displacedUv).g;
        float b = texture2D(uTexture, displacedUv - offset * 0.12).b;

        // Cinematic vignette & warm golden twilight grade
        vec3 finalColor = vec3(r, g, b);
        float vignette = smoothstep(1.2, 0.4, length(vUv - 0.5));
        finalColor *= vignette * 0.95 + 0.05;

        // Subtle golden hour warm tone lift
        finalColor.r += 0.02 * (1.0 - uv.y);
        finalColor.g += 0.01 * (1.0 - uv.y);

        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTexture: { value: null },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uResolution: { value: new THREE.Vector2(width, height) },
        uImageResolution: { value: new THREE.Vector2(2400, 1350) },
        uTime: { value: 0 },
        uIntensity: { value: depthIntensity },
      },
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    // Load initial texture
    textureLoaderRef.current.load(imageUrl, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      if (materialRef.current) {
        materialRef.current.uniforms.uTexture.value = tex;
        materialRef.current.needsUpdate = true;
      }
    });

    // Resize observer
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !materialRef.current) return;
      const w = containerRef.current.clientWidth || window.innerWidth;
      const h = containerRef.current.clientHeight || window.innerHeight;
      rendererRef.current.setSize(w, h);
      materialRef.current.uniforms.uResolution.value.set(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let clock = new THREE.Clock();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (!reducedMotion) {
        // Smooth lerp mouse coordinates
        mouseRef.current.x += (mouseRef.current.targetX - mouseRef.current.x) * 0.05;
        mouseRef.current.y += (mouseRef.current.targetY - mouseRef.current.y) * 0.05;
      } else {
        mouseRef.current.x = 0;
        mouseRef.current.y = 0;
      }

      if (materialRef.current) {
        materialRef.current.uniforms.uMouse.value.set(mouseRef.current.x, mouseRef.current.y);
        materialRef.current.uniforms.uTime.value = clock.getElapsedTime();
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
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Update texture when imageUrl changes
  useEffect(() => {
    if (!materialRef.current) return;
    textureLoaderRef.current.load(imageUrl, (tex) => {
      tex.minFilter = THREE.LinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = false;
      if (materialRef.current) {
        materialRef.current.uniforms.uTexture.value = tex;
        materialRef.current.needsUpdate = true;
      }
    });
  }, [imageUrl]);

  // Track cursor movement for interactive 3D parallax
  const handlePointerMove = (e: React.PointerEvent) => {
    if (reducedMotion) return;
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = -(e.clientY / window.innerHeight) * 2 + 1;
    mouseRef.current.targetX = x;
    mouseRef.current.targetY = y;
  };

  return (
    <div
      ref={containerRef}
      onPointerMove={handlePointerMove}
      className="absolute inset-0 w-full h-full pointer-events-auto overflow-hidden select-none"
    />
  );
};
