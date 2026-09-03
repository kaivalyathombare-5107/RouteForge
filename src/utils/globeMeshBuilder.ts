import * as THREE from 'three';

/**
 * Generates an ultra-crisp, high-contrast luxury dark cartographic world map texture
 * using an off-screen HTML5 Canvas. Includes continents, borders, graticules, and city lights.
 */
export function createWorldMapTexture(): THREE.CanvasTexture {
  const width = 2048;
  const height = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    // Fallback simple canvas
    return new THREE.CanvasTexture(canvas);
  }

  // 1. Deep Obsidian Ocean Base
  const oceanGrad = ctx.createLinearGradient(0, 0, 0, height);
  oceanGrad.addColorStop(0, '#040508');
  oceanGrad.addColorStop(0.5, '#07090F');
  oceanGrad.addColorStop(1, '#040508');
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to convert lat/lon to canvas x, y (Equirectangular projection)
  const toX = (lon: number) => ((lon + 180) / 360) * width;
  const toY = (lat: number) => ((90 - lat) / 180) * height;

  // 2. Graticule Lat/Lon Grid Lines
  ctx.lineWidth = 1;
  ctx.strokeStyle = '#181E2E';
  ctx.setLineDash([4, 6]);

  // Longitude Meridians every 30 degrees
  for (let lon = -180; lon <= 180; lon += 30) {
    ctx.beginPath();
    ctx.moveTo(toX(lon), 0);
    ctx.lineTo(toX(lon), height);
    ctx.stroke();
  }

  // Latitude Parallels every 15 degrees
  for (let lat = -75; lat <= 75; lat += 15) {
    ctx.beginPath();
    ctx.moveTo(0, toY(lat));
    ctx.lineTo(width, toY(lat));
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Equator in Champagne Gold
  ctx.strokeStyle = '#6A5323';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(0, toY(0));
  ctx.lineTo(width, toY(0));
  ctx.stroke();

  // Tropic of Cancer (23.5° N) & Tropic of Capricorn (23.5° S)
  ctx.strokeStyle = '#3E341A';
  ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(0, toY(23.43));
  ctx.lineTo(width, toY(23.43));
  ctx.moveTo(0, toY(-23.43));
  ctx.lineTo(width, toY(-23.43));
  ctx.stroke();
  ctx.setLineDash([]);

  // 3. Draw Continental Landmass Polygons
  const continents: [number, number][][] = [
    // Eurasia (Europe + Russia + Asia + India)
    [
      [-9, 36], [-9, 43], [0, 43], [2, 51], [8, 55], [10, 57], [25, 71], [40, 68],
      [60, 70], [80, 73], [100, 76], [120, 73], [140, 72], [170, 66], [170, 60],
      [143, 50], [130, 42], [122, 30], [108, 20], [105, 10], [100, 2], [98, 8],
      [90, 22], [80, 13], [77, 8], [72, 19], [68, 24], [60, 25], [50, 30], [45, 13],
      [40, 20], [35, 32], [28, 41], [15, 40], [12, 44], [0, 38], [-5, 36], [-9, 36]
    ],
    // Indian Subcontinent Detail Accent
    [
      [68, 24], [72, 21], [73, 15], [76, 10], [77, 8], [80, 10], [82, 16],
      [88, 22], [90, 24], [88, 26], [80, 29], [74, 32], [70, 28], [68, 24]
    ],
    // Africa
    [
      [-5, 36], [10, 37], [25, 32], [32, 31], [43, 12], [51, 12], [45, -5],
      [35, -25], [26, -34], [18, -34], [12, -18], [9, 4], [0, 6], [-17, 15],
      [-17, 21], [-10, 30], [-5, 36]
    ],
    // North America
    [
      [-168, 65], [-160, 56], [-140, 60], [-130, 50], [-124, 38], [-117, 32],
      [-105, 20], [-90, 15], [-82, 9], [-77, 8], [-80, 25], [-82, 30],
      [-75, 35], [-70, 42], [-64, 45], [-55, 50], [-60, 60], [-80, 68],
      [-100, 70], [-130, 70], [-165, 71], [-168, 65]
    ],
    // South America
    [
      [-77, 8], [-70, 12], [-60, 8], [-50, 0], [-35, -5], [-37, -12],
      [-42, -22], [-50, -30], [-55, -35], [-65, -45], [-68, -55], [-75, -50],
      [-72, -40], [-72, -30], [-76, -15], [-80, -2], [-77, 8]
    ],
    // Australia
    [
      [114, -22], [122, -15], [130, -12], [136, -12], [142, -11], [146, -16],
      [153, -28], [150, -37], [140, -38], [130, -32], [116, -35], [113, -26], [114, -22]
    ],
    // Japan
    [
      [130, 31], [132, 34], [137, 35], [141, 39], [142, 44], [140, 40], [135, 35], [130, 31]
    ],
    // British Isles
    [
      [-5, 50], [1, 51], [0, 55], [-2, 58], [-5, 58], [-5, 55], [-5, 50]
    ],
    // Madagascar
    [
      [44, -12], [50, -14], [48, -25], [44, -25], [44, -12]
    ],
    // Scandinavia
    [
      [5, 58], [10, 58], [18, 60], [25, 70], [18, 68], [10, 64], [5, 58]
    ]
  ];

  // Draw landmass fills and glowing coastlines
  continents.forEach((polygon) => {
    ctx.beginPath();
    polygon.forEach(([lon, lat], idx) => {
      const x = toX(lon);
      const y = toY(lat);
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Landmass interior
    ctx.fillStyle = '#0D111A';
    ctx.fill();

    // Glowing cartographic coastline
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 1.8;
    ctx.shadowColor = '#FCE7AC';
    ctx.shadowBlur = 4;
    ctx.stroke();

    // Secondary inner border
    ctx.strokeStyle = '#233045';
    ctx.lineWidth = 0.8;
    ctx.shadowBlur = 0;
    ctx.stroke();
  });

  // 4. Stippled Geographic Radar Points (Holographic Tech Vibe)
  ctx.fillStyle = '#D4AF37';
  const dotCount = 850;
  for (let i = 0; i < dotCount; i++) {
    const lon = -180 + Math.random() * 360;
    const lat = -60 + Math.random() * 120;
    const x = toX(lon);
    const y = toY(lat);

    // Subtle random density check for land areas
    if (
      (lon > 60 && lon < 140 && lat > 5 && lat < 60) || // Asia & India
      (lon > -10 && lon < 40 && lat > 35 && lat < 65) || // Europe
      (lon > -130 && lon < -65 && lat > 20 && lat < 55) || // North America
      (lon > 10 && lon < 40 && lat > -30 && lat < 30) // Africa
    ) {
      ctx.globalAlpha = 0.25 + Math.random() * 0.45;
      ctx.beginPath();
      ctx.arc(x, y, 0.8 + Math.random() * 1.0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1.0;

  // 5. Major World Metropolis Night Lights (Golden Radiance)
  const majorCities = [
    { name: 'Mumbai', lon: 72.87, lat: 19.07, size: 4.5, color: '#FCE7AC' },
    { name: 'Delhi', lon: 77.10, lat: 28.55, size: 4.0, color: '#FCE7AC' },
    { name: 'Udaipur', lon: 73.71, lat: 24.58, size: 3.5, color: '#D4AF37' },
    { name: 'Zurich', lon: 8.54, lat: 47.38, size: 3.5, color: '#E2E8F0' },
    { name: 'London', lon: -0.13, lat: 51.51, size: 4.0, color: '#FCE7AC' },
    { name: 'Paris', lon: 2.35, lat: 48.86, size: 4.0, color: '#FCE7AC' },
    { name: 'Rome', lon: 12.50, lat: 41.90, size: 3.5, color: '#FCE7AC' },
    { name: 'Dubai', lon: 55.27, lat: 25.20, size: 4.5, color: '#FCE7AC' },
    { name: 'Tokyo', lon: 139.69, lat: 35.69, size: 4.5, color: '#FCE7AC' },
    { name: 'Singapore', lon: 103.82, lat: 1.35, size: 4.0, color: '#FCE7AC' },
    { name: 'New York', lon: -74.01, lat: 40.71, size: 4.5, color: '#FCE7AC' },
    { name: 'Srinagar', lon: 74.80, lat: 34.08, size: 3.2, color: '#34D399' },
  ];

  majorCities.forEach((city) => {
    const cx = toX(city.lon);
    const cy = toY(city.lat);

    // Halo gradient
    const halo = ctx.createRadialGradient(cx, cy, 1, cx, cy, city.size * 3.5);
    halo.addColorStop(0, city.color);
    halo.addColorStop(0.4, '#D4AF3788');
    halo.addColorStop(1, 'transparent');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(cx, cy, city.size * 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Center jewel core
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(cx, cy, 1.2, 0, Math.PI * 2);
    ctx.fill();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.anisotropy = 4;
  return texture;
}

/**
 * Creates an aerodynamic 3D Commercial/Private Jet Model in Three.js
 */
export function createAirplaneMesh(): THREE.Group {
  const plane = new THREE.Group();
  plane.scale.set(0.35, 0.35, 0.35);

  // 1. Fuselage
  const fuselageGeo = new THREE.ConeGeometry(0.32, 2.4, 16);
  fuselageGeo.rotateX(Math.PI / 2);
  const fuselageMat = new THREE.MeshStandardMaterial({
    color: 0xF8FAFC,
    metalness: 0.85,
    roughness: 0.15,
  });
  const fuselage = new THREE.Mesh(fuselageGeo, fuselageMat);
  fuselage.position.z = -0.2;
  plane.add(fuselage);

  // Cockpit Tinted Window
  const cockpitGeo = new THREE.BoxGeometry(0.24, 0.14, 0.4);
  const cockpitMat = new THREE.MeshBasicMaterial({ color: 0x0EA5E9 });
  const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
  cockpit.position.set(0, 0.16, 0.5);
  plane.add(cockpit);

  // 2. Swept Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0.6);
  wingShape.lineTo(2.4, -0.4);
  wingShape.lineTo(2.3, -0.7);
  wingShape.lineTo(0, -0.2);
  wingShape.lineTo(-2.3, -0.7);
  wingShape.lineTo(-2.4, -0.4);
  wingShape.closePath();

  const extrudeSettings = { depth: 0.04, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: 0.02, bevelThickness: 0.02 };
  const wingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  wingGeo.rotateX(Math.PI / 2);
  const wingMat = new THREE.MeshStandardMaterial({
    color: 0xD4AF37, // Champagne Gold Wing Accents
    metalness: 0.9,
    roughness: 0.2,
  });
  const wings = new THREE.Mesh(wingGeo, wingMat);
  wings.position.set(0, 0, 0.1);
  plane.add(wings);

  // 3. Vertical Stabilizer (Tail fin)
  const tailShape = new THREE.Shape();
  tailShape.moveTo(0, 0);
  tailShape.lineTo(0, 0.85);
  tailShape.lineTo(-0.45, 0.7);
  tailShape.lineTo(-0.7, 0);
  tailShape.closePath();
  const tailGeo = new THREE.ExtrudeGeometry(tailShape, { depth: 0.04, bevelEnabled: false });
  const tailMat = new THREE.MeshStandardMaterial({ color: 0x991B1B }); // Royal Red Tail Flag
  const tail = new THREE.Mesh(tailGeo, tailMat);
  tail.position.set(0, 0.15, -1.0);
  tail.rotation.y = Math.PI / 2;
  plane.add(tail);

  // 4. Wingtip Navigation Lights (Port Red, Starboard Green, Flashing White)
  const portNavGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const portNavMat = new THREE.MeshBasicMaterial({ color: 0xEF4444 }); // Left Red
  const portNav = new THREE.Mesh(portNavGeo, portNavMat);
  portNav.position.set(-2.4, 0, -0.5);
  plane.add(portNav);

  const stbdNavGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const stbdNavMat = new THREE.MeshBasicMaterial({ color: 0x10B981 }); // Right Green
  const stbdNav = new THREE.Mesh(stbdNavGeo, stbdNavMat);
  stbdNav.position.set(2.4, 0, -0.5);
  plane.add(stbdNav);

  // Beacon Light (White Strobe)
  const beaconGeo = new THREE.SphereGeometry(0.08, 8, 8);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0xFFFFFF });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(0, 0.35, 0);
  plane.add(beacon);

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
