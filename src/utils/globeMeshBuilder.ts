import * as THREE from 'three';

/**
 * Generates an ultra-crisp, photorealistic satellite Earth texture with
 * ocean depth gradients, coastal turquoise continental shelves, realistic biomes,
 * and glowing golden-amber metropolitan night lights matching the reference image.
 */
export function createWorldMapTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Deep Ocean Base with realistic marine bathymetry gradient
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#010814');   // Polar deep ocean
  oceanGrad.addColorStop(0.2, '#03142c');
  oceanGrad.addColorStop(0.5, '#061c3b'); // Mid-latitude deep abyss
  oceanGrad.addColorStop(0.8, '#03142c');
  oceanGrad.addColorStop(1, '#010814');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to convert lat/lon to canvas x, y (Equirectangular projection)
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 2. Coastal Turquoise Shelf Waters (Bahamas, Caribbean, Florida, Mediterranean, North Sea)
  const shelfAreas = [
    { lon: -78, lat: 25, rx: 65, ry: 45 }, // Bahamas & Florida shelf
    { lon: -65, lat: 18, rx: 55, ry: 35 }, // Caribbean
    { lon: -90, lat: 26, rx: 80, ry: 45 }, // Gulf of Mexico
    { lon: 2, lat: 54, rx: 60, ry: 40 },   // North Sea
    { lon: 15, lat: 36, rx: 70, ry: 30 },  // Mediterranean
    { lon: 38, lat: 22, rx: 35, ry: 50 },  // Red Sea
    { lon: 51, lat: 26, rx: 40, ry: 30 },  // Persian Gulf
    { lon: -48, lat: -1, rx: 50, ry: 40 }, // Amazon Delta
  ];

  shelfAreas.forEach(({ lon, lat, rx, ry }) => {
    const x = toX(lon);
    const y = toY(lat);
    const shelfGrad = ctx.createRadialGradient(x, y, 2, x, y, rx);
    shelfGrad.addColorStop(0, 'rgba(8, 145, 178, 0.45)');
    shelfGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.25)');
    shelfGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = shelfGrad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 3. High-Fidelity Continental Polygons with Satellite Biome Color Gradients
  const continentsData: {
    polygon: [number, number][];
    fill: string;
    stroke: string;
    type: 'temperate' | 'desert' | 'tropical' | 'ice' | 'eurasia';
  }[] = [
    // North America (Lush East, Prairies, Rocky Mountains, Sonoran Desert)
    {
      type: 'temperate',
      fill: '#1c3622',
      stroke: '#2a5234',
      polygon: [
        [-168, 66], [-160, 58], [-140, 60], [-130, 52], [-124, 48], [-124, 38],
        [-118, 33], [-115, 30], [-110, 23], [-105, 20], [-97, 18], [-90, 15],
        [-83, 9], [-77, 8], [-80, 22], [-82, 25], [-81, 30], [-76, 35],
        [-74, 41], [-70, 43], [-66, 44], [-60, 47], [-54, 50], [-60, 60],
        [-75, 63], [-85, 69], [-105, 72], [-135, 71], [-165, 71], [-168, 66]
      ]
    },
    // Greenland Ice Sheet (Pure White Glacial Ice)
    {
      type: 'ice',
      fill: '#EDF2F7',
      stroke: '#CBD5E1',
      polygon: [
        [-52, 60], [-42, 61], [-35, 66], [-20, 71], [-18, 77], [-25, 82],
        [-40, 83], [-55, 82], [-65, 78], [-55, 72], [-50, 65], [-52, 60]
      ]
    },
    // South America (Lush Amazon, Andes Ridge, Pampas)
    {
      type: 'tropical',
      fill: '#12371d',
      stroke: '#1f522d',
      polygon: [
        [-77, 8], [-72, 12], [-62, 10], [-50, 2], [-35, -5], [-35, -10],
        [-38, -13], [-40, -20], [-48, -27], [-52, -33], [-58, -38], [-65, -45],
        [-67, -54], [-74, -52], [-74, -42], [-71, -31], [-76, -16], [-81, -4], [-77, 8]
      ]
    },
    // Europe (Temperate Green Forests & Plains)
    {
      type: 'temperate',
      fill: '#22462a',
      stroke: '#2f603a',
      polygon: [
        [-9, 36], [-9, 43], [-1, 44], [3, 51], [8, 54], [12, 57], [22, 60],
        [30, 60], [40, 56], [36, 45], [28, 41], [23, 38], [15, 40], [12, 44],
        [0, 39], [-6, 36], [-9, 36]
      ]
    },
    // Scandinavia
    {
      type: 'temperate',
      fill: '#183420',
      stroke: '#264a2f',
      polygon: [
        [5, 58], [10, 58], [16, 60], [22, 70], [28, 71], [20, 68], [12, 64], [5, 58]
      ]
    },
    // British Isles
    {
      type: 'temperate',
      fill: '#214729',
      stroke: '#32673d',
      polygon: [
        [-5, 50], [1, 51], [1, 53], [0, 56], [-2, 58], [-5, 58], [-5, 54], [-5, 50]
      ]
    },
    // Africa (Golden Sahara Desert, Sahel, Congo Rainforest, South Africa)
    {
      type: 'desert',
      fill: '#a8824f',
      stroke: '#c1995e',
      polygon: [
        [-5, 36], [10, 37], [25, 32], [32, 31], [35, 28], [43, 12], [51, 12],
        [46, -2], [42, -15], [35, -25], [26, -34], [18, -34], [12, -22],
        [9, 4], [0, 6], [-12, 10], [-17, 15], [-17, 21], [-10, 30], [-5, 36]
      ]
    },
    // Madagascar
    {
      type: 'tropical',
      fill: '#1e4426',
      stroke: '#2c5f36',
      polygon: [
        [44, -12], [50, -14], [48, -25], [44, -25], [44, -12]
      ]
    },
    // Eurasia & Russia
    {
      type: 'eurasia',
      fill: '#274b2f',
      stroke: '#35633e',
      polygon: [
        [40, 56], [60, 65], [80, 72], [100, 75], [120, 73], [140, 71], [170, 66],
        [170, 60], [143, 50], [130, 42], [122, 32], [108, 22], [105, 12],
        [100, 3], [90, 22], [80, 14], [77, 8], [72, 20], [68, 24], [60, 25],
        [50, 30], [45, 14], [40, 21], [35, 32], [40, 45], [40, 56]
      ]
    },
    // Indian Subcontinent
    {
      type: 'tropical',
      fill: '#24482b',
      stroke: '#36683e',
      polygon: [
        [68, 24], [72, 21], [73, 15], [76, 10], [77, 8], [80, 10], [82, 16],
        [88, 22], [90, 24], [88, 26], [80, 29], [74, 32], [70, 28], [68, 24]
      ]
    },
    // Australia
    {
      type: 'desert',
      fill: '#9d7442',
      stroke: '#b88950',
      polygon: [
        [114, -22], [122, -15], [130, -12], [136, -12], [142, -11], [146, -16],
        [153, -28], [150, -37], [140, -38], [130, -32], [116, -35], [113, -26], [114, -22]
      ]
    },
    // Japan
    {
      type: 'temperate',
      fill: '#204728',
      stroke: '#30643b',
      polygon: [
        [130, 31], [132, 34], [137, 35], [141, 39], [142, 44], [140, 40], [135, 35], [130, 31]
      ]
    },
  ];

  // Draw each continent landmass
  continentsData.forEach(({ polygon, fill, stroke }) => {
    ctx.beginPath();
    polygon.forEach(([lon, lat], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    ctx.fillStyle = fill;
    ctx.fill();

    // Natural coastline outline
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // 4. Biome Texturing: Golden Sahara Dune Gradient on Africa
  const saharaX = toX(15);
  const saharaY = toY(24);
  const saharaGrad = ctx.createRadialGradient(saharaX, saharaY, 10, saharaX, saharaY, 180);
  saharaGrad.addColorStop(0, '#c79f64');
  saharaGrad.addColorStop(0.5, '#ad844b');
  saharaGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = saharaGrad;
  ctx.beginPath();
  ctx.arc(saharaX, saharaY, 180, 0, Math.PI * 2);
  ctx.fill();

  // Arabian Desert golden sands
  const arabiaX = toX(45);
  const arabiaY = toY(23);
  const arabiaGrad = ctx.createRadialGradient(arabiaX, arabiaY, 5, arabiaX, arabiaY, 70);
  arabiaGrad.addColorStop(0, '#c79f64');
  arabiaGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = arabiaGrad;
  ctx.beginPath();
  ctx.arc(arabiaX, arabiaY, 70, 0, Math.PI * 2);
  ctx.fill();

  // Lush Amazon Rainforest deep emerald shading
  const amazonX = toX(-60);
  const amazonY = toY(-4);
  const amazonGrad = ctx.createRadialGradient(amazonX, amazonY, 10, amazonX, amazonY, 140);
  amazonGrad.addColorStop(0, '#0d2d17');
  amazonGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = amazonGrad;
  ctx.beginPath();
  ctx.arc(amazonX, amazonY, 140, 0, Math.PI * 2);
  ctx.fill();

  // Central Africa Congo Basin emerald shading
  const congoX = toX(22);
  const congoY = toY(0);
  const congoGrad = ctx.createRadialGradient(congoX, congoY, 10, congoX, congoY, 90);
  congoGrad.addColorStop(0, '#0f3219');
  congoGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = congoGrad;
  ctx.beginPath();
  ctx.arc(congoX, congoY, 90, 0, Math.PI * 2);
  ctx.fill();

  // 5. Major World Metropolis Night Lights (Glowing Golden/Amber Clusters)
  // Matching the bright city clusters seen in the reference image across North America, Europe, etc.
  const cityClusters: { lon: number; lat: number; radius: number; intensity: number }[] = [
    // US BosWash Mega-Corridor (New York, Boston, Philadelphia, DC)
    { lon: -74.0, lat: 40.7, radius: 9, intensity: 1.0 },   // New York
    { lon: -71.0, lat: 42.3, radius: 6, intensity: 0.85 },  // Boston
    { lon: -75.1, lat: 39.9, radius: 6, intensity: 0.85 },  // Philadelphia
    { lon: -77.0, lat: 38.9, radius: 7, intensity: 0.9 },   // Washington DC
    // US Midwest & South
    { lon: -87.6, lat: 41.8, radius: 8, intensity: 0.95 },  // Chicago
    { lon: -83.0, lat: 42.3, radius: 5, intensity: 0.75 },  // Detroit
    { lon: -84.3, lat: 33.7, radius: 6, intensity: 0.8 },   // Atlanta
    { lon: -80.2, lat: 25.7, radius: 6, intensity: 0.85 },  // Miami
    { lon: -96.8, lat: 32.7, radius: 6, intensity: 0.8 },   // Dallas
    { lon: -95.3, lat: 29.7, radius: 6, intensity: 0.8 },   // Houston
    // US West Coast
    { lon: -122.4, lat: 37.7, radius: 8, intensity: 0.95 }, // San Francisco Bay
    { lon: -118.2, lat: 34.0, radius: 9, intensity: 1.0 },  // Los Angeles
    { lon: -117.1, lat: 32.7, radius: 5, intensity: 0.75 }, // San Diego
    { lon: -122.3, lat: 47.6, radius: 6, intensity: 0.8 },  // Seattle
    // Europe Megalopolis (London, Paris, Benelux, Ruhr, Madrid, Rome)
    { lon: -0.1, lat: 51.5, radius: 9, intensity: 1.0 },    // London
    { lon: 2.3, lat: 48.8, radius: 8, intensity: 0.95 },    // Paris
    { lon: 4.4, lat: 50.8, radius: 7, intensity: 0.9 },     // Brussels / Benelux
    { lon: 4.9, lat: 52.3, radius: 6, intensity: 0.85 },    // Amsterdam
    { lon: 7.0, lat: 51.2, radius: 8, intensity: 0.95 },    // Rhine-Ruhr Germany
    { lon: 13.4, lat: 52.5, radius: 6, intensity: 0.8 },    // Berlin
    { lon: -3.7, lat: 40.4, radius: 7, intensity: 0.85 },   // Madrid
    { lon: 2.1, lat: 41.3, radius: 6, intensity: 0.8 },     // Barcelona
    { lon: 9.1, lat: 45.4, radius: 7, intensity: 0.85 },    // Milan
    { lon: 12.5, lat: 41.9, radius: 6, intensity: 0.85 },   // Rome
    // South America
    { lon: -46.6, lat: -23.5, radius: 9, intensity: 0.95 }, // Sao Paulo
    { lon: -43.1, lat: -22.9, radius: 7, intensity: 0.9 },  // Rio de Janeiro
    { lon: -58.3, lat: -34.6, radius: 7, intensity: 0.85 }, // Buenos Aires
    // Africa
    { lon: 31.2, lat: 30.0, radius: 8, intensity: 0.95 },   // Cairo & Nile River
    { lon: 18.4, lat: -33.9, radius: 6, intensity: 0.85 },  // Cape Town
    { lon: 28.0, lat: -26.2, radius: 7, intensity: 0.9 },   // Johannesburg
    { lon: 3.3, lat: 6.5, radius: 6, intensity: 0.8 },      // Lagos
    // India & Middle East
    { lon: 72.8, lat: 19.0, radius: 9, intensity: 1.0 },    // Mumbai
    { lon: 77.1, lat: 28.5, radius: 8, intensity: 0.95 },   // Delhi
    { lon: 77.5, lat: 12.9, radius: 7, intensity: 0.85 },   // Bangalore
    { lon: 55.2, lat: 25.2, radius: 8, intensity: 0.95 },   // Dubai
  ];

  // Draw warm golden/amber glow for city clusters
  cityClusters.forEach(({ lon, lat, radius, intensity }) => {
    const cx = toX(lon);
    const cy = toY(lat);

    // Wide atmospheric light dome (warm amber)
    const halo = ctx.createRadialGradient(cx, cy, 0.5, cx, cy, radius * 3.2);
    halo.addColorStop(0, `rgba(254, 240, 138, ${0.9 * intensity})`);
    halo.addColorStop(0.35, `rgba(245, 158, 11, ${0.65 * intensity})`);
    halo.addColorStop(0.7, `rgba(217, 119, 6, ${0.25 * intensity})`);
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 3.2, 0, Math.PI * 2);
    ctx.fill();

    // Intense brilliant white core
    ctx.fillStyle = `rgba(255, 255, 255, ${0.95 * intensity})`;
    ctx.beginPath();
    ctx.arc(cx, cy, Math.max(1.2, radius * 0.3), 0, Math.PI * 2);
    ctx.fill();
  });

  // Secondary fine stippled city points (hundreds of smaller towns)
  ctx.fillStyle = 'rgba(251, 191, 36, 0.65)';
  const smallCities = [
    // US Interior
    [-80, 35], [-86, 36], [-82, 40], [-89, 43], [-93, 45], [-94, 39], [-97, 35], [-104, 39],
    // Europe interior
    [4, 45], [11, 43], [16, 48], [19, 50], [21, 52], [14, 46], [23, 37],
    // South America coast
    [-48, -25], [-44, -20], [-38, -12], [-35, -7],
    // India interior
    [75, 26], [78, 22], [80, 13], [85, 25], [88, 22],
  ];

  smallCities.forEach(([lon, lat]) => {
    const x = toX(lon);
    const y = toY(lat);
    ctx.beginPath();
    ctx.arc(x, y, 1.4, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Generates an ultra-realistic 3D Weather & Cloud Texture with the signature
 * Atlantic Hurricane / Cyclonic Swirl visible in the reference image.
 */
export function createCloudMapTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return new THREE.CanvasTexture(canvas);
  }

  // Clear transparent canvas
  ctx.clearRect(0, 0, width, height);

  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 1. THE SIGNATURE ATLANTIC HURRICANE / CYCLONIC SPIRAL (centered at ~27°N, -42°W)
  // Perfectly replicating the storm vortex seen in the reference image!
  const hX = toX(-42);
  const hY = toY(27);

  // Storm central eye and spiraling arms
  for (let arm = 0; arm < 4; arm++) {
    const armOffset = (arm * Math.PI) / 2;
    for (let r = 8; r < 140; r += 2) {
      const theta = armOffset + (r / 22);
      const px = hX + r * Math.cos(theta);
      const py = hY + r * 0.8 * Math.sin(theta);
      const alpha = Math.max(0, 0.7 - (r / 150)) * (0.5 + 0.5 * Math.sin(r * 0.15));

      const cloudGrad = ctx.createRadialGradient(px, py, 1, px, py, 18);
      cloudGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
      cloudGrad.addColorStop(0.6, `rgba(240, 245, 255, ${alpha * 0.6})`);
      cloudGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = cloudGrad;
      ctx.beginPath();
      ctx.arc(px, py, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Hurricane Eye Core (calm clear center surrounded by dense eyewall)
  const eyewallGrad = ctx.createRadialGradient(hX, hY, 8, hX, hY, 32);
  eyewallGrad.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
  eyewallGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.85)');
  eyewallGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = eyewallGrad;
  ctx.beginPath();
  ctx.arc(hX, hY, 32, 0, Math.PI * 2);
  ctx.fill();

  // 2. Intertropical Convergence Zone (ITCZ) equatorial wispy cloud bands
  for (let lon = -160; lon <= 160; lon += 6) {
    const cx = toX(lon);
    const cy = toY(5 + Math.sin(lon * 0.05) * 8);
    const r = 24 + Math.random() * 22;
    const alpha = 0.25 + Math.random() * 0.35;

    const itczGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    itczGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    itczGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = itczGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Mid-Latitude Weather Fronts over North Atlantic and Pacific
  const frontPaths = [
    // North Atlantic storm track
    [[-65, 38], [-45, 48], [-25, 54], [-5, 60], [15, 62]],
    // Arctic front
    [[-90, 65], [-60, 68], [-30, 66], [0, 70], [30, 68]],
    // South Pacific / Roaring Forties
    [[-120, -45], [-90, -48], [-60, -52], [-30, -50], [0, -46]],
  ];

  frontPaths.forEach((path) => {
    for (let i = 0; i < path.length - 1; i++) {
      const [lon1, lat1] = path[i];
      const [lon2, lat2] = path[i + 1];
      for (let step = 0; step < 12; step++) {
        const t = step / 12;
        const lon = lon1 + (lon2 - lon1) * t;
        const lat = lat1 + (lat2 - lat1) * t + Math.sin(t * Math.PI) * 4;
        const cx = toX(lon);
        const cy = toY(lat);
        const r = 28 + Math.random() * 25;
        const alpha = 0.2 + Math.random() * 0.35;

        const fGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
        fGrad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
        fGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = fGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

/**
 * Creates a dedicated 3D Cloud Sphere Mesh hovering slightly above the Earth surface
 */
export function createCloudSphereMesh(radius: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius * 1.008, 64, 64);
  const texture = createCloudMapTexture();
  const mat = new THREE.MeshStandardMaterial({
    map: texture,
    transparent: true,
    opacity: 0.85,
    blending: THREE.NormalBlending,
    roughness: 0.9,
    metalness: 0.05,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'cloudSphere';
  return mesh;
}

/**
 * Creates the photorealistic Atmospheric Rim Glow Mesh with the signature
 * Golden Sun Terminator on top-right and Azure Rayleigh scattering along the limb.
 */
export function createAtmosphereGlowMesh(radius: number): THREE.Mesh {
  const geo = new THREE.SphereGeometry(radius * 1.028, 64, 64);

  const customShader = {
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      void main() {
        // Fresnel rim effect
        float viewDot = dot(vNormal, vec3(0.0, 0.0, 1.0));
        float intensity = pow(0.75 - viewDot, 2.6);

        // Sun terminator vector from top-right / Northeast (+X, +Y, +Z)
        vec3 sunDir = normalize(vec3(0.7, 0.7, 0.4));
        vec3 normPos = normalize(vWorldPos);
        float sunAngle = dot(normPos, sunDir);
        float sunFactor = smoothstep(-0.1, 0.85, sunAngle);

        // Colors matching the reference image:
        // Blinding golden sunset/sunrise rim on sunlit edge, deep azure Rayleigh on dark edge
        vec3 sunGolden = vec3(0.98, 0.78, 0.38); // Golden amber rim
        vec3 rayleighCyan = vec3(0.12, 0.68, 0.98); // Electric azure atmosphere

        vec3 finalColor = mix(rayleighCyan, sunGolden, sunFactor);
        gl_FragColor = vec4(finalColor, intensity * 0.95);
      }
    `,
  };

  const mat = new THREE.ShaderMaterial({
    vertexShader: customShader.vertexShader,
    fragmentShader: customShader.fragmentShader,
    blending: THREE.AdditiveBlending,
    side: THREE.BackSide,
    transparent: true,
  });

  const mesh = new THREE.Mesh(geo, mat);
  mesh.name = 'atmosphereGlow';
  return mesh;
}

/**
 * Creates a Concentric Holographic Beacon Ring on the globe surface
 * matching the target markers at New York, London, Mumbai, etc. in the reference image.
 */
export function createHubBeaconMesh(
  title: string,
  isMainHub = false,
  colorHex = 0x22D3EE
): THREE.Group {
  const group = new THREE.Group();

  // 1. Central glowing core jewel
  const coreGeo = new THREE.SphereGeometry(isMainHub ? 0.07 : 0.05, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.y = 0.02;
  group.add(core);

  // 2. Inner high-intensity ring
  const innerRingGeo = new THREE.RingGeometry(isMainHub ? 0.08 : 0.06, isMainHub ? 0.12 : 0.09, 32);
  const innerRingMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.95,
  });
  const innerRing = new THREE.Mesh(innerRingGeo, innerRingMat);
  innerRing.rotation.x = Math.PI / 2;
  innerRing.position.y = 0.015;
  group.add(innerRing);

  // 3. Outer pulsating target ring
  const outerRingGeo = new THREE.RingGeometry(isMainHub ? 0.16 : 0.12, isMainHub ? 0.20 : 0.15, 32);
  const outerRingMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: isMainHub ? 0.85 : 0.65,
  });
  const outerRing = new THREE.Mesh(outerRingGeo, outerRingMat);
  outerRing.rotation.x = Math.PI / 2;
  outerRing.position.y = 0.01;
  outerRing.name = 'outerPulseRing';
  group.add(outerRing);

  // 4. If Main Hub (New York), add extra wide halo target ring
  if (isMainHub) {
    const wideRingGeo = new THREE.RingGeometry(0.24, 0.27, 32);
    const wideRingMat = new THREE.MeshBasicMaterial({
      color: 0x38BDF8,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const wideRing = new THREE.Mesh(wideRingGeo, wideRingMat);
    wideRing.rotation.x = Math.PI / 2;
    wideRing.position.y = 0.008;
    wideRing.name = 'wideTargetRing';
    group.add(wideRing);
  }

  return group;
}

/**
 * Creates an aerodynamic 3D Commercial/Private Jet Model in Three.js
 * with wings and body color-coded to the route (Cyan or Amber) as in the reference image.
 */
export function createAirplaneMesh(colorHex = 0x22D3EE): THREE.Group {
  const plane = new THREE.Group();
  plane.scale.set(0.38, 0.38, 0.38);

  // 1. Sleek Fuselage
  const fuselageGeo = new THREE.ConeGeometry(0.28, 2.2, 16);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0xFFFFFF,
    metalness: 0.9,
    roughness: 0.15,
    emissive: colorHex,
    emissiveIntensity: 0.3,
  });
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  fuselage.position.z = -0.2;
  plane.add(fuselage);

  // Cockpit Tinted Window
  const cockpitGeo = new THREE.BoxGeometry(0.22, 0.14, 0.4);
  const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x0EA5E9 });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.15, 0.45);
  plane.add(cockpit);

  // 2. Swept Wings glowing with the route color
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.6);
  wingShape.lineTo(2.3, -0.4);
  wingShape.lineTo(2.2, -0.7);
  wingShape.lineTo(0, -0.2);
  wingShape.lineTo(-2.2, -0.7);
  wingShape.lineTo(-2.3, -0.4);
  wingShape.closePath();

  const extrudeSettings = { depth: 0.035, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  wingGeo.rotateX(Math.PI / 2);
  const wingMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.7,
    metalness: 0.8,
    roughness: 0.2,
  });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, 0, 0.1);
  plane.add(wings);

  // 3. Twin Jet Engines under wings
  [-0.9, 0.9].forEach((engineX) => {
    const engineGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.45, 12);
    engineGeo.rotateX(Math.PI / 2);
    const engineMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 });
    const engine = new THREE.Mesh(engineGeo, engineMat);
    engine.position.set(engineX, -0.1, -0.15);
    plane.add(engine);

    // Glowing Jet Exhaust
    const exhaustGeo = new THREE.ConeGeometry(0.07, 0.2, 8);
    exhaustGeo.rotateX(-Math.PI / 2);
    const exhaustMat = new THREE.MeshBasicMaterial({ color: colorHex });
    const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaust.position.set(engineX, -0.1, -0.45);
    plane.add(exhaust);
  });

  // 4. Vertical Stabilizer (Tail fin)
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0, 0.8);
  tailShape.lineTo(-0.45, 0.65);
  tailShape.lineTo(-0.65, 0);
  tailShape.closePath();
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.03, bevelEnabled: false });
  const tailMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: 0.5,
  });
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.position.set(0, 0.14, -0.95);
  tail.rotation.y = Math.PI / 2;
  plane.add(tail);

  // 5. Forward Headlight / Strobe
  const noseLightGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const noseLightMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const noseLight = new THREE.Mesh(noseLightGeo, noseLightMat);
  noseLight.position.set(0, 0, 0.9);
  plane.add(noseLight);

  return plane;
}


/**
 * Creates an aerodynamic High-Speed Bullet Train / Vande Bharat Express Mesh
 */
export function createTrainMesh(): THREE.Group {
  const train = new THREE.Group();
  train.scale.set(0.3, 0.3, 0.3);

  // 3-Car Streamlined Train Set
  for (let carIdx = 0; carIdx < 3; carIdx++) {
    const car = new THREE.Group();
    car.position.z = -carIdx * 1.5;

    // Body
    const bodyGeo = new THREE.BoxGeometry(0.42, 0.35, 1.35);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xF1F5F9,
      metalness: 0.8,
      roughness: 0.2,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    car.add(body);

    // Cobalt Blue & Gold Belt Stripe
    const stripeGeo = new THREE.BoxGeometry(0.44, 0.08, 1.35);
    const stripeMat = new THREE.MeshBasicMaterial({ color: 0x1E3A8A });
    const stripe = new THREE.Mesh(stripeGeo, stripeMat);
    stripe.position.y = -0.02;
    car.add(stripe);

    // Glowing Windows
    const winGeo = new THREE.BoxGeometry(0.45, 0.09, 1.1);
    const winMat = new THREE.MeshBasicMaterial({ color: 0xFEF08A });
    const win = new THREE.Mesh(winGeo, winMat);
    win.position.y = 0.08;
    car.add(win);

    // Aerodynamic Nose Cone for the lead locomotive
    if (carIdx === 0) {
      const noseGeo = new THREE.ConeGeometry(0.3, 0.7, 16);
      noseGeo.rotateX(Math.PI / 2);
      const noseMat = new THREE.MeshStandardMaterial({ color: 0xF1F5F9, metalness: 0.85 });
      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.position.z = 0.85;
      car.add(nose);

      // Dual High-Intensity Headlights
      const lightGeo = new THREE.SphereGeometry(0.06, 8, 8);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0xFFFBEB });
      const leftLight = new THREE.Mesh(lightGeo, lightMat);
      leftLight.position.set(-0.12, -0.02, 1.15);
      car.add(leftLight);

      const rightLight = new THREE.Mesh(lightGeo, lightMat);
      rightLight.position.set(0.12, -0.02, 1.15);
      car.add(rightLight);
    }

    train.add(car);
  }

  return train;
}

/**
 * Creates a VIP Luxury Chauffeur Limousine / Sedan Mesh
 */
export function createCarMesh(): THREE.Group {
  const car = new THREE.Group();
  car.scale.set(0.25, 0.25, 0.25);

  // Chassis
  const bodyGeo = new THREE.BoxGeometry(0.5, 0.22, 1.1);
  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0x090D16, // Obsidian Black Maybach
    metalness: 0.95,
    roughness: 0.1,
  });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  car.add(body);

  // Cabin & Windshield
  const cabinGeo = new THREE.BoxGeometry(0.42, 0.18, 0.6);
  const cabinMat = new THREE.MeshStandardMaterial({
    color: 0x1E293B,
    metalness: 0.9,
    roughness: 0.1,
  });
  const cabin = new THREE.Mesh(cabinGeo, cabinMat);
  cabin.position.set(0, 0.16, -0.05);
  car.add(cabin);

  // Headlights
  const hlGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const hlMat = new THREE.MeshBasicMaterial({ color: 0xFEF08A });
  const leftHl = new THREE.Mesh(hlGeo, hlMat);
  leftHl.position.set(-0.18, 0, 0.56);
  car.add(leftHl);

  const rightHl = new THREE.Mesh(hlGeo, hlMat);
  rightHl.position.set(0.18, 0, 0.56);
  car.add(rightHl);

  // Tail Lights
  const tlGeo = new THREE.SphereGeometry(0.05, 8, 8);
  const tlMat = new THREE.MeshBasicMaterial({ color: 0xDC2626 });
  const leftTl = new THREE.Mesh(tlGeo, tlMat);
  leftTl.position.set(-0.18, 0, -0.56);
  car.add(leftTl);

  const rightTl = new THREE.Mesh(tlGeo, tlMat);
  rightTl.position.set(0.18, 0, -0.56);
  car.add(rightTl);

  return car;
}

/**
 * Creates a Royal Shikara / Private Luxury Boat Mesh
 */
export function createBoatMesh(): THREE.Group {
  const boat = new THREE.Group();
  boat.scale.set(0.28, 0.28, 0.28);

  // Hull
  const hullGeo = new THREE.ConeGeometry(0.38, 1.4, 16);
  hullGeo.rotateX(Math.PI / 2);
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x78350F, // Teak Wood / Imperial Mahogany
    metalness: 0.4,
    roughness: 0.6,
  });
  const hull = new THREE.Mesh(hullGeo, hullMat);
  boat.add(hull);

  // Royal Golden Canopy / Cabin
  const canopyGeo = new THREE.BoxGeometry(0.32, 0.28, 0.65);
  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37,
    metalness: 0.85,
    roughness: 0.2,
  });
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.2, -0.1);
  boat.add(canopy);

  // Lantern Light
  const lanternGeo = new THREE.SphereGeometry(0.07, 8, 8);
  const lanternMat = new THREE.MeshBasicMaterial({ color: 0xFDE047 });
  const lantern = new THREE.Mesh(lanternGeo, lanternMat);
  lantern.position.set(0, 0.25, 0.6);
  boat.add(lantern);

  return boat;
}

/**
 * Creates a Holographic 3D Destination Pin Beacon
 */
export function createDestinationPinMesh(
  title: string,
  colorHex = 0xD4AF37,
  isSelected = false
): THREE.Group {
  const pinGroup = new THREE.Group();

  // Diamond Octahedron Jewel
  const jewelGeo = new THREE.OctahedronGeometry(isSelected ? 0.28 : 0.2, 0);
  const jewelMat = new THREE.MeshStandardMaterial({
    color: colorHex,
    emissive: colorHex,
    emissiveIntensity: isSelected ? 0.9 : 0.6,
    metalness: 0.85,
    roughness: 0.15,
  });
  const jewel = new THREE.Mesh(jewelGeo, jewelMat);
  jewel.position.y = 0.45;
  jewel.name = 'pinJewel';
  pinGroup.add(jewel);

  // Orbital Holographic Ring
  const ringGeo = new THREE.TorusGeometry(isSelected ? 0.45 : 0.32, 0.02, 16, 32);
  const ringMat = new THREE.MeshBasicMaterial({
    color: isSelected ? 0xFCE7AC : colorHex,
    transparent: true,
    opacity: isSelected ? 0.9 : 0.6,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 3;
  ring.position.y = 0.45;
  ring.name = 'pinRing';
  pinGroup.add(ring);

  // Light Beam Needle to Globe Surface
  const needleGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.45, 8);
  const needleMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    transparent: true,
    opacity: 0.75,
  });
  const needle = new THREE.Mesh(needleGeo, needleMat);
  needle.position.y = 0.225;
  pinGroup.add(needle);

  // Ground Wave Rings
  const groundRingGeo = new THREE.RingGeometry(0.1, 0.18, 24);
  const groundRingMat = new THREE.MeshBasicMaterial({
    color: colorHex,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });
  const groundRing = new THREE.Mesh(groundRingGeo, groundRingMat);
  groundRing.rotation.x = Math.PI / 2;
  groundRing.position.y = 0.01;
  groundRing.name = 'groundPulse';
  pinGroup.add(groundRing);

  return pinGroup;
}

/**
 * Creates an iconic Google Maps 3D Drop Pin (Red Destination Pin or White/Green Origin Marker)
 * matching official Google Maps / Google Earth 3D aesthetic.
 */
export function createGoogleMapsPinMesh(
  type: 'origin' | 'destination' | 'waypoint',
  title: string,
  accentColor = 0xEA4335
): THREE.Group {
  const pinGroup = new THREE.Group();

  if (type === 'destination') {
    // 1. Google Maps Iconic 3D Red Teardrop Pin
    const pinColor = 0xEA4335; // Google Maps Red
    
    // Top spherical dome of the pin
    const headGeo = new THREE.SphereGeometry(0.18, 20, 20);
    const headMat = new THREE.MeshStandardMaterial({
      color: pinColor,
      roughness: 0.25,
      metalness: 0.15,
      emissive: pinColor,
      emissiveIntensity: 0.25,
    });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 0.52;
    head.name = 'pinJewel';
    pinGroup.add(head);

    // Inverted cone tapering down to point on surface
    const coneGeo = new THREE.ConeGeometry(0.18, 0.42, 20);
    coneGeo.rotateX(Math.PI);
    const cone = new THREE.Mesh(coneGeo, headMat);
    cone.position.y = 0.31;
    pinGroup.add(cone);

    // White center eye dot badge (Google Maps inner circular dot)
    const eyeGeo = new THREE.CylinderGeometry(0.075, 0.075, 0.38, 16);
    eyeGeo.rotateZ(Math.PI / 2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.y = 0.52;
    pinGroup.add(eye);

    // Inner dark center pupil
    const pupilGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.39, 16);
    pupilGeo.rotateZ(Math.PI / 2);
    const pupilMat = new THREE.MeshBasicMaterial({ color: 0xB91C1C });
    const pupil = new THREE.Mesh(pupilGeo, pupilMat);
    pupil.position.y = 0.52;
    pinGroup.add(pupil);

    // Ground Contact Shadow Disc
    const shadowGeo = new THREE.RingGeometry(0.02, 0.14, 24);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.rotation.x = Math.PI / 2;
    shadow.position.y = 0.005;
    pinGroup.add(shadow);

    // Radiating radar pulse wave rings
    const pulseGeo = new THREE.RingGeometry(0.16, 0.24, 32);
    const pulseMat = new THREE.MeshBasicMaterial({
      color: 0xEA4335,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    pulse.rotation.x = Math.PI / 2;
    pulse.position.y = 0.01;
    pulse.name = 'groundPulse';
    pinGroup.add(pulse);

  } else if (type === 'origin') {
    // 2. Google Maps Origin Departure Marker (Circular White Badge with Green / Blue Core)
    const originColor = 0x0F9D58; // Google Maps Green / Departure

    // White outer disk badge
    const badgeGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.05, 24);
    badgeGeo.rotateX(Math.PI / 2);
    const badgeMat = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.2,
      metalness: 0.1,
    });
    const badge = new THREE.Mesh(badgeGeo, badgeMat);
    badge.position.y = 0.42;
    badge.name = 'pinJewel';
    pinGroup.add(badge);

    // Green / Blue center ring
    const ringGeo = new THREE.TorusGeometry(0.12, 0.025, 16, 24);
    const ringMat = new THREE.MeshBasicMaterial({ color: originColor });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.42;
    pinGroup.add(ring);

    // Inner letter / departure icon marker
    const centerCoreGeo = new THREE.SphereGeometry(0.055, 12, 12);
    const centerCoreMat = new THREE.MeshBasicMaterial({ color: originColor });
    const centerCore = new THREE.Mesh(centerCoreGeo, centerCoreMat);
    centerCore.position.y = 0.42;
    pinGroup.add(centerCore);

    // Vertical stem down to surface
    const stemGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.42, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.21;
    pinGroup.add(stem);

    // Ground wave
    const groundGeo = new THREE.RingGeometry(0.08, 0.18, 24);
    const groundMat = new THREE.MeshBasicMaterial({
      color: originColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = 0.01;
    ground.name = 'groundPulse';
    pinGroup.add(ground);

  } else {
    // 3. Google Maps Transit Stop / Waypoint Dot
    const dotGeo = new THREE.SphereGeometry(0.1, 16, 16);
    const dotMat = new THREE.MeshStandardMaterial({
      color: 0xFBBC04, // Google Maps Amber
      emissive: 0xF59E0B,
      emissiveIntensity: 0.6,
      roughness: 0.3,
    });
    const dot = new THREE.Mesh(dotGeo, dotMat);
    dot.position.y = 0.25;
    dot.name = 'pinJewel';
    pinGroup.add(dot);

    const stemGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.25, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xFBBC04 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.125;
    pinGroup.add(stem);

    const groundGeo = new THREE.RingGeometry(0.05, 0.12, 16);
    const groundMat = new THREE.MeshBasicMaterial({
      color: 0xFBBC04,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = Math.PI / 2;
    ground.position.y = 0.01;
    ground.name = 'groundPulse';
    pinGroup.add(ground);
  }

  return pinGroup;
}

/**
 * Generates an authentic Google Maps 3D Topographic Terrain Texture
 * with elevation relief hillshades, contour greens, mountain ridges, and pale blue waterways.
 */
export function createGoogleTerrainTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // 1. Google Maps Pale Azure Sea / Water Base
  ctx.fillStyle = '#A5C9EB';
  ctx.fillRect(0, 0, width, height);

  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 2. Continental Lowlands (Google Maps Warm Sage Green)
  const terrainContinents: [number, number][][] = [
    // Eurasia & Africa
    [
      [-10, 36], [0, 42], [5, 48], [10, 54], [25, 60], [30, 70], [60, 72], [100, 75],
      [140, 70], [170, 65], [140, 50], [130, 40], [120, 32], [115, 22], [105, 10],
      [100, 2], [90, 22], [80, 10], [70, 22], [60, 25], [50, 30], [35, 32], [32, 28],
      [44, 12], [50, 10], [40, -5], [35, -20], [28, -34], [18, -34], [12, -15],
      [8, 5], [-5, 5], [-15, 12], [-17, 22], [-10, 30], [-10, 36]
    ],
    // North America
    [
      [-168, 66], [-140, 60], [-124, 48], [-118, 33], [-110, 23], [-97, 18], [-83, 9],
      [-77, 8], [-80, 22], [-76, 35], [-70, 43], [-54, 50], [-60, 60], [-85, 69],
      [-135, 71], [-168, 66]
    ],
    // South America
    [
      [-77, 8], [-62, 10], [-50, 2], [-35, -5], [-38, -13], [-48, -27], [-58, -38],
      [-67, -54], [-74, -42], [-71, -31], [-81, -4], [-77, 8]
    ],
    // Australia
    [
      [115, -22], [125, -15], [135, -12], [145, -15], [152, -25], [150, -38],
      [138, -36], [125, -34], [115, -34], [115, -22]
    ]
  ];

  terrainContinents.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = '#D6EAC8'; // Google Maps soft terrain green
    ctx.fill();
    ctx.strokeStyle = '#B4D2A2';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // 3. Topographic Mountain Shading (Himalayas, Rockies, Alps, Andes)
  const mountainChains = [
    { lon: 82, lat: 29, rx: 110, ry: 45, color: '#E4D5B7' }, // Himalayas
    { lon: 74, lat: 21, rx: 45, ry: 65, color: '#E0CEAC' },  // Western Ghats / Aravalli
    { lon: 10, lat: 46, rx: 50, ry: 25, color: '#E6D7BA' },  // European Alps
    { lon: -115, lat: 45, rx: 70, ry: 130, color: '#E2D1B0' }, // Rockies
    { lon: -70, lat: -25, rx: 35, ry: 180, color: '#DECDB0' }, // Andes
  ];

  mountainChains.forEach(({ lon, lat, rx, ry, color }) => {
    const x = toX(lon);
    const y = toY(lat);
    const grad = ctx.createRadialGradient(x, y, 5, x, y, Math.max(rx, ry));
    grad.addColorStop(0, color);
    grad.addColorStop(0.5, '#EAE1CC');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  });

  // 4. Subtle Vector Country Boundary Lines
  ctx.strokeStyle = 'rgba(120, 144, 156, 0.45)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  terrainContinents.forEach((poly) => {
    ctx.beginPath();
    poly.forEach(([lon, lat], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });
  ctx.setLineDash([]);

  return new THREE.CanvasTexture(canvas);
}

/**
 * Generates a Google Maps Dark Vector Navigation Texture
 * with glowing yellow highways, blue arterial roads, and city nodes.
 */
export function createGoogleRoadHybridTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return new THREE.CanvasTexture(canvas);

  // Dark Navigation Base (Google Maps Dark Mode)
  ctx.fillStyle = '#1A1F2C';
  ctx.fillRect(0, 0, width, height);

  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // Land Mass Contours in Slate Grey
  ctx.fillStyle = '#222836';
  ctx.strokeStyle = '#333D4F';
  ctx.lineWidth = 1;

  // Draw Highway Network (Golden Yellow & Cyan Routes)
  const highways: [number, number][][] = [
    // India Golden Quadrilateral & NH48 (Delhi - Jaipur - Udaipur - Ahmedabad - Mumbai - Bangalore - Chennai - Kolkata - Delhi)
    [[77.1, 28.6], [75.8, 26.8], [73.7, 24.6], [72.6, 23.0], [72.8, 19.1], [77.6, 13.0], [80.2, 13.0], [88.4, 22.6], [82.8, 25.4], [77.1, 28.6]],
    // US Interstates (I-95 East Coast, I-80 Transcontinental, I-5 West Coast)
    [[-73.8, 40.7], [-77.0, 38.9], [-80.8, 35.2], [-84.4, 33.7], [-80.2, 25.8]],
    [[-122.4, 37.8], [-111.9, 40.7], [-104.9, 39.7], [-87.6, 41.8], [-73.8, 40.7]],
    [[-122.4, 37.8], [-118.2, 34.0], [-117.1, 32.7]],
    // European Motorway Spine (London - Paris - Milan - Rome)
    [[-0.1, 51.5], [2.3, 48.8], [6.1, 46.2], [9.2, 45.5], [12.5, 41.9]]
  ];

  ctx.strokeStyle = '#FFD166'; // Google Maps Yellow Highway
  ctx.lineWidth = 3;
  highways.forEach((hwy) => {
    ctx.beginPath();
    hwy.forEach(([lon, lat], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  });

  // Glowing city metropolitan hub dots
  const metroCities = [
    { lon: 72.86, lat: 19.09, name: 'Mumbai' },
    { lon: 73.71, lat: 24.58, name: 'Udaipur' },
    { lon: 77.10, lat: 28.56, name: 'Delhi' },
    { lon: -73.78, lat: 40.64, name: 'New York' },
    { lon: -0.45, lat: 51.47, name: 'London' },
    { lon: 2.35, lat: 48.85, name: 'Paris' },
    { lon: 139.7, lat: 35.68, name: 'Tokyo' },
  ];

  metroCities.forEach(({ lon, lat }) => {
    const x = toX(lon);
    const y = toY(lat);
    ctx.fillStyle = '#4285F4'; // Google Blue
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  return new THREE.CanvasTexture(canvas);
}
