import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { HEAT_RAMP, heatColor } from './heatRamp.js';

/**
 * @typedef {Object} FieldCity
 * @property {string} id
 * @property {string} name
 * @property {number} lat
 * @property {number} lon
 * @property {number | null} heat         heat stress index, 0–100
 * @property {number | null} [temperature]
 * @property {number | null} [humidity]
 */

const MAX_CITIES = 48;
const BACKGROUND = '#0f0d1a';

// One world unit is one degree of latitude, centred on the monitored cities.
const LAT0 = 22.5;
const LON0 = 80.5;
const LON_SCALE = Math.cos(THREE.MathUtils.degToRad(LAT0));

const MAX_HEIGHT = 6.5;
const MIN_HEIGHT = 0.4;
const NO_DATA_HEIGHT = 0.18;
const COLUMN_RADIUS = 0.4;

const CAMERA_TARGET = new THREE.Vector3(0, 1.4, 0.6);
const CAMERA_DISTANCE = 35;
const CAMERA_POLAR = 0.74;
const SWAY_LIMIT = 0.32;
const RISE_SECONDS = 1.1;
const PICK_RADIUS_PX = 16;

const project = (lat, lon) => ({ x: (lon - LON0) * LON_SCALE, z: LAT0 - lat });
const heightFor = (heat) => (heat === null ? NO_DATA_HEIGHT : MIN_HEIGHT + (heat / 100) * MAX_HEIGHT);
const easeOutCubic = (t) => 1 - (1 - t) ** 3;

// Colour as it should appear on screen, for the additive layers (ground glow, halos, motes):
// those are summed straight into the framebuffer and skip three's output conversion.
const displayColor = (hex) => new THREE.Color(hex).convertLinearToSRGB();

const groundVertex = /* glsl */ `
  varying vec2 vPos;
  void main() {
    vPos = position.xz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// The ground carries two things: a 5° latitude/longitude graticule, and the heat field
// itself, interpolated between cities (inverse-distance weighting) and faded out where
// no city is near enough to say anything about the heat there.
const groundFragment = /* glsl */ `
  uniform vec3 uCities[${MAX_CITIES}];
  uniform int uCount;
  uniform vec3 uRamp[${HEAT_RAMP.length}];
  uniform vec3 uLine;
  uniform float uTime;
  uniform float uReveal;
  varying vec2 vPos;

  vec3 ramp(float h) {
    float t = clamp((h - 0.1) / 0.2, 0.0, ${(HEAT_RAMP.length - 1).toFixed(1)});
    int i = int(min(floor(t), ${(HEAT_RAMP.length - 2).toFixed(1)}));
    return mix(uRamp[i], uRamp[i + 1], t - float(i));
  }

  float gridLine(float v) {
    float g = abs(fract(v / 5.0 - 0.5) - 0.5) / fwidth(v / 5.0);
    return 1.0 - min(g, 1.0);
  }

  void main() {
    float weights = 0.0;
    float weighted = 0.0;
    float nearest = 1000.0;
    vec3 cores = vec3(0.0);
    for (int i = 0; i < ${MAX_CITIES}; i++) {
      if (i >= uCount) break;
      vec3 city = uCities[i];
      if (city.z < 0.0) continue;
      float d = distance(vPos, city.xy);
      float w = 1.0 / (d * d + 0.8);
      weights += w;
      weighted += w * city.z;
      nearest = min(nearest, d);
      cores += ramp(city.z) * exp(-d * d * 2.4) * (0.1 + 0.3 * city.z);
    }

    float heat = weights > 0.0 ? weighted / weights : 0.0;
    float presence = smoothstep(7.0, 0.8, nearest);
    float haze = 0.5 + 0.5 * sin(vPos.x * 1.6 + uTime * 0.55 + sin(vPos.y * 1.2 - uTime * 0.35) * 1.4);
    vec3 field = ramp(heat) * presence * (0.04 + 0.2 * heat) * (0.86 + 0.14 * haze);

    float lon = vPos.x / ${LON_SCALE.toFixed(5)} + ${LON0.toFixed(1)};
    float lat = ${LAT0.toFixed(1)} - vPos.y;
    float line = max(gridLine(lon), gridLine(lat));

    float edge = smoothstep(24.0, 11.0, length(vPos));
    vec3 color = ((field + cores) * uReveal + uLine * line) * edge;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const columnVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aGlow;
  varying vec3 vColor;
  varying vec3 vNormal;
  varying float vY;
  varying float vGlow;
  void main() {
    vY = position.y;
    vColor = aColor;
    vGlow = aGlow;
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;

const columnFragment = /* glsl */ `
  varying vec3 vColor;
  varying vec3 vNormal;
  varying float vY;
  varying float vGlow;
  void main() {
    float lit = 0.5 + 0.5 * max(dot(normalize(vNormal), normalize(vec3(0.35, 0.55, 0.75))), 0.0);
    float rise = mix(0.2, 1.0, pow(vY, 1.3));
    vec3 color = vColor * rise * lit;
    color += vColor * vGlow * 0.3;
    color = mix(color, vColor * 1.12 + 0.03, smoothstep(0.97, 1.0, vY));
    gl_FragColor = vec4(color, 1.0);
    #include <colorspace_fragment>
  }
`;

const glowVertex = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  uniform float uScale;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const glowFragment = /* glsl */ `
  uniform float uReveal;
  varying vec3 vColor;
  void main() {
    float falloff = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vColor * falloff * falloff * 0.3 * uReveal, 1.0);
  }
`;

// Heat rising off the hotter cities: each mote loops upward from its column top.
const emberVertex = /* glsl */ `
  attribute vec3 aBase;
  attribute vec4 aSeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uScale;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float t = fract(aSeed.x + uTime * (0.05 + aSeed.y * 0.06));
    float angle = aSeed.z * 6.2832 + t * 2.6;
    vec3 p = vec3(aBase.x + cos(angle) * aSeed.w, aBase.y + t * 3.6, aBase.z + sin(angle) * aSeed.w);
    vColor = aColor;
    vAlpha = sin(t * 3.1416);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = 0.16 * uScale / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const emberFragment = /* glsl */ `
  uniform float uReveal;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float falloff = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5));
    gl_FragColor = vec4(vColor * falloff * vAlpha * 0.7 * uReveal, 1.0);
  }
`;

/**
 * Renders the national heat field: one column per monitored city, placed by latitude
 * and longitude, whose height and colour show the city's heat stress index.
 *
 * @param {HTMLElement} container
 * @param {{ onSelect?: (id: string) => void, reducedMotion?: boolean }} [options]
 */
export function createHeatField(container, { onSelect, reducedMotion = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const canvas = renderer.domElement;
  canvas.className = 'hf-canvas';
  container.appendChild(canvas);

  const labelLayer = document.createElement('div');
  labelLayer.className = 'hf-labels';
  container.appendChild(labelLayer);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  camera.position.copy(CAMERA_TARGET).add(new THREE.Vector3().setFromSphericalCoords(CAMERA_DISTANCE, CAMERA_POLAR, 0));

  const controls = new OrbitControls(camera, canvas);
  controls.target.copy(CAMERA_TARGET);
  controls.enableZoom = false; // leave the wheel to page scrolling
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.minPolarAngle = 0.35;
  controls.maxPolarAngle = 1.25;
  controls.minAzimuthAngle = -0.95;
  controls.maxAzimuthAngle = 0.95;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.3;
  canvas.style.touchAction = 'pan-y'; // vertical swipes still scroll the page

  /** @type {Array<FieldCity & { x: number, z: number, h: number, from: number, target: number, delay: number }>} */
  let cities = [];
  let selectedId = null;
  let hoverIndex = -1;
  let riseStart = null;
  let needsRender = true;
  let disposed = false;
  let frame = 0;
  let visible = true;
  let resumeSwayAt = 0;

  const shared = {
    uTime: { value: 0 },
    uReveal: { value: 0 },
    uScale: { value: 1 },
  };

  const additive = { blending: THREE.AdditiveBlending, depthWrite: false, transparent: true };

  // --- Ground ---
  const groundGeometry = new THREE.PlaneGeometry(56, 56).rotateX(-Math.PI / 2);
  const groundMaterial = new THREE.ShaderMaterial({
    vertexShader: groundVertex,
    fragmentShader: groundFragment,
    uniforms: {
      uCities: { value: Array.from({ length: MAX_CITIES }, () => new THREE.Vector3(0, 0, -1)) },
      uCount: { value: 0 },
      uRamp: { value: HEAT_RAMP.map((stop) => displayColor(stop.color)) },
      uLine: { value: displayColor('#2c2740') },
      uTime: shared.uTime,
      uReveal: shared.uReveal,
    },
    ...additive,
  });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.renderOrder = -1;
  scene.add(ground);

  // --- Columns ---
  const columnGeometry = new THREE.CylinderGeometry(COLUMN_RADIUS, COLUMN_RADIUS, 1, 6).translate(0, 0.5, 0);
  const columnColors = new THREE.InstancedBufferAttribute(new Float32Array(MAX_CITIES * 3), 3);
  const columnGlow = new THREE.InstancedBufferAttribute(new Float32Array(MAX_CITIES), 1);
  columnGeometry.setAttribute('aColor', columnColors);
  columnGeometry.setAttribute('aGlow', columnGlow);
  const columnMaterial = new THREE.ShaderMaterial({ vertexShader: columnVertex, fragmentShader: columnFragment });
  const columns = new THREE.InstancedMesh(columnGeometry, columnMaterial, MAX_CITIES);
  columns.count = 0;
  columns.frustumCulled = false;
  scene.add(columns);

  // --- Glow at each column top ---
  const glowGeometry = new THREE.BufferGeometry();
  const glowPositions = new THREE.BufferAttribute(new Float32Array(MAX_CITIES * 3), 3);
  const glowColors = new THREE.BufferAttribute(new Float32Array(MAX_CITIES * 3), 3);
  const glowSizes = new THREE.BufferAttribute(new Float32Array(MAX_CITIES), 1);
  glowGeometry.setAttribute('position', glowPositions);
  glowGeometry.setAttribute('aColor', glowColors);
  glowGeometry.setAttribute('aSize', glowSizes);
  glowGeometry.setDrawRange(0, 0);
  const glowMaterial = new THREE.ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: { uScale: shared.uScale, uReveal: shared.uReveal },
    ...additive,
  });
  const glow = new THREE.Points(glowGeometry, glowMaterial);
  glow.frustumCulled = false;
  scene.add(glow);

  // --- Rising heat ---
  const emberMaterial = new THREE.ShaderMaterial({
    vertexShader: emberVertex,
    fragmentShader: emberFragment,
    uniforms: { uTime: shared.uTime, uScale: shared.uScale, uReveal: shared.uReveal },
    ...additive,
  });
  let embers = null;

  // --- Selection ring ---
  const ringGeometry = new THREE.RingGeometry(0.72, 0.82, 64).rotateX(-Math.PI / 2);
  const makeRing = () => {
    const ring = new THREE.Mesh(
      ringGeometry,
      new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false })
    );
    ring.position.y = 0.03;
    ring.visible = false;
    scene.add(ring);
    return ring;
  };
  const selectionRing = makeRing();
  const pulseRing = makeRing();

  const dummy = new THREE.Object3D();
  const color = new THREE.Color();
  const point = new THREE.Vector3();

  function rebuildEmbers() {
    if (embers) {
      scene.remove(embers);
      embers.geometry.dispose();
      embers = null;
    }
    if (reducedMotion) return;

    const base = [];
    const seed = [];
    const colors = [];
    cities.forEach((city) => {
      if (city.heat === null || city.heat < 35) return;
      const count = Math.round((city.heat / 100) ** 2 * 16);
      const mote = displayColor(heatColor(city.heat));
      for (let i = 0; i < count; i++) {
        base.push(city.x, city.target, city.z);
        seed.push(Math.random(), Math.random(), Math.random(), 0.15 + Math.random() * 0.5);
        colors.push(mote.r, mote.g, mote.b);
      }
    });
    if (!base.length) return;

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(base, 3));
    geometry.setAttribute('aBase', new THREE.Float32BufferAttribute(base, 3));
    geometry.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 4));
    geometry.setAttribute('aColor', new THREE.Float32BufferAttribute(colors, 3));
    embers = new THREE.Points(geometry, emberMaterial);
    embers.frustumCulled = false;
    scene.add(embers);
  }

  function writeColumns() {
    cities.forEach((city, i) => {
      const emphasis = city.id === selectedId ? 1 : i === hoverIndex ? 0.6 : 0;
      const width = 1 + emphasis * 0.3;
      dummy.position.set(city.x, 0, city.z);
      dummy.scale.set(width, city.h, width);
      dummy.updateMatrix();
      columns.setMatrixAt(i, dummy.matrix);
      columnGlow.setX(i, emphasis);
      glowPositions.setXYZ(i, city.x, city.h, city.z);
    });
    columns.instanceMatrix.needsUpdate = true;
    columnGlow.needsUpdate = true;
    glowPositions.needsUpdate = true;
    needsRender = true;
  }

  function placeRings() {
    const city = cities.find((c) => c.id === selectedId);
    selectionRing.visible = Boolean(city);
    pulseRing.visible = Boolean(city) && !reducedMotion;
    if (!city) return;
    selectionRing.position.set(city.x, 0.03, city.z);
    pulseRing.position.set(city.x, 0.03, city.z);
  }

  // --- Labels: the hovered city, the selected city, then the hottest few ---
  /** @type {Map<number, HTMLDivElement>} */
  const labels = new Map();

  function labelIndices() {
    const order = [];
    if (hoverIndex >= 0) order.push(hoverIndex);
    const selected = cities.findIndex((c) => c.id === selectedId);
    if (selected >= 0) order.push(selected);
    cities
      .map((city, i) => ({ i, heat: city.heat ?? -1 }))
      .filter((entry) => entry.heat >= 0)
      .sort((a, b) => b.heat - a.heat)
      .slice(0, 4)
      .forEach((entry) => order.push(entry.i));
    return [...new Set(order)];
  }

  function syncLabels() {
    const wanted = labelIndices();
    labels.forEach((el, i) => {
      if (!wanted.includes(i)) {
        el.remove();
        labels.delete(i);
      }
    });
    wanted.forEach((i) => {
      const city = cities[i];
      let el = labels.get(i);
      if (!el) {
        el = document.createElement('div');
        el.className = 'hf-label';
        el.append(document.createElement('span'), document.createElement('span'), document.createElement('span'));
        labelLayer.appendChild(el);
        labels.set(i, el);
      }
      const [swatch, name, detail] = el.children;
      swatch.className = 'hf-label-swatch';
      swatch.style.background = heatColor(city.heat);
      name.className = 'hf-label-name';
      name.textContent = city.name;
      detail.className = 'hf-label-detail';
      if (city.heat === null) {
        detail.textContent = 'no reading';
      } else if (i === hoverIndex && city.temperature !== null && city.temperature !== undefined) {
        detail.textContent = `index ${Math.round(city.heat)}, ${city.temperature}°C, ${city.humidity}% humidity`;
      } else {
        detail.textContent = String(Math.round(city.heat));
      }
      el.classList.toggle('is-selected', city.id === selectedId);
      el.classList.toggle('is-hovered', i === hoverIndex);
    });
    needsRender = true;
  }

  function positionLabels() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const placed = [];
    labelIndices().forEach((i) => {
      const el = labels.get(i);
      const city = cities[i];
      if (!el || !city) return;
      point.set(city.x, city.h, city.z).project(camera);
      const x = (point.x * 0.5 + 0.5) * width;
      const y = (-point.y * 0.5 + 0.5) * height - 12;
      const w = el.offsetWidth || 80;
      const h = el.offsetHeight || 22;
      const box = { left: x - w / 2, right: x + w / 2, top: y - h, bottom: y };
      const offscreen = point.z > 1 || box.left < 4 || box.right > width - 4 || box.top < 4;
      const collides = placed.some(
        (other) => box.left < other.right && box.right > other.left && box.top < other.bottom && box.bottom > other.top
      );
      if (offscreen || collides) {
        el.style.visibility = 'hidden';
        return;
      }
      placed.push(box);
      el.style.visibility = 'visible';
      el.style.transform = `translate(${Math.round(box.left)}px, ${Math.round(box.top)}px)`;
    });
  }

  // --- Picking: nearest column to the pointer, measured on screen ---
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  function pick(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;
    let best = -1;
    let bestDistance = PICK_RADIUS_PX;
    cities.forEach((city, i) => {
      a.set(city.x, 0, city.z).project(camera);
      b.set(city.x, city.h, city.z).project(camera);
      const ax = (a.x * 0.5 + 0.5) * rect.width;
      const ay = (-a.y * 0.5 + 0.5) * rect.height;
      const bx = (b.x * 0.5 + 0.5) * rect.width;
      const by = (-b.y * 0.5 + 0.5) * rect.height;
      const lengthSq = (bx - ax) ** 2 + (by - ay) ** 2 || 1;
      const t = THREE.MathUtils.clamp(((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / lengthSq, 0, 1);
      const distance = Math.hypot(px - (ax + (bx - ax) * t), py - (ay + (by - ay) * t));
      if (distance < bestDistance) {
        bestDistance = distance;
        best = i;
      }
    });
    return best;
  }

  function setHover(index) {
    if (index === hoverIndex) return;
    hoverIndex = index;
    canvas.style.cursor = index >= 0 ? 'pointer' : 'grab';
    writeColumns();
    syncLabels();
  }

  let pressed = null;
  const onPointerMove = (event) => {
    if (pressed && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) > 6) return;
    setHover(pick(event.clientX, event.clientY));
  };
  const onPointerLeave = () => setHover(-1);
  const onPointerDown = (event) => {
    pressed = { x: event.clientX, y: event.clientY };
  };
  const onPointerUp = (event) => {
    const wasClick = pressed && Math.hypot(event.clientX - pressed.x, event.clientY - pressed.y) <= 6;
    pressed = null;
    if (!wasClick) return;
    const index = pick(event.clientX, event.clientY);
    if (index >= 0) onSelect?.(cities[index].id);
  };
  canvas.style.cursor = 'grab';
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerleave', onPointerLeave);
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  const onControlsStart = () => {
    controls.autoRotate = false;
  };
  const onControlsEnd = () => {
    resumeSwayAt = performance.now() + 4000;
  };
  const onControlsChange = () => {
    needsRender = true;
  };
  controls.addEventListener('start', onControlsStart);
  controls.addEventListener('end', onControlsEnd);
  controls.addEventListener('change', onControlsChange);

  function resize() {
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // Narrow viewports pull the camera back so the whole country stays in frame.
    const distance = CAMERA_DISTANCE * Math.max(1, 1.5 / camera.aspect);
    camera.position.sub(controls.target).setLength(distance).add(controls.target);
    // Wide layouts overlay text on the left, so the scene moves right to clear it.
    const shift = width >= 1024 ? Math.round(width * 0.14) : 0;
    camera.setViewOffset(width, height, -shift, 0, width, height);
    camera.updateProjectionMatrix();
    shared.uScale.value = (renderer.domElement.height * 0.5) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    needsRender = true;
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
  });
  intersectionObserver.observe(container);

  const clock = new THREE.Clock();
  function tick() {
    if (disposed) return;
    frame = requestAnimationFrame(tick);
    if (!visible || document.hidden) return;

    const now = performance.now();
    const delta = Math.min(clock.getDelta(), 0.1);

    if (riseStart !== null) {
      const elapsed = (now - riseStart) / 1000;
      let settled = true;
      cities.forEach((city) => {
        const t = THREE.MathUtils.clamp((elapsed - city.delay) / RISE_SECONDS, 0, 1);
        city.h = city.from + (city.target - city.from) * easeOutCubic(t);
        if (t < 1) settled = false;
      });
      shared.uReveal.value = Math.max(shared.uReveal.value, THREE.MathUtils.clamp(elapsed / RISE_SECONDS, 0, 1));
      writeColumns();
      if (settled) riseStart = null;
    }

    if (!reducedMotion) {
      shared.uTime.value += delta;
      if (!controls.autoRotate && resumeSwayAt && now > resumeSwayAt) {
        controls.autoRotate = true;
        resumeSwayAt = 0;
      }
      // Sway back and forth instead of spinning: north stays roughly up.
      const azimuth = controls.getAzimuthalAngle();
      if (azimuth > SWAY_LIMIT) controls.autoRotateSpeed = Math.abs(controls.autoRotateSpeed);
      if (azimuth < -SWAY_LIMIT) controls.autoRotateSpeed = -Math.abs(controls.autoRotateSpeed);

      const pulse = (shared.uTime.value % 2.2) / 2.2;
      pulseRing.scale.setScalar(1 + pulse * 1.6);
      pulseRing.material.opacity = 0.7 * (1 - pulse);
      needsRender = true;
    }

    controls.update(delta);
    if (!needsRender) return;
    needsRender = false;
    renderer.render(scene, camera);
    positionLabels();
  }
  frame = requestAnimationFrame(tick);

  return {
    /** @param {FieldCity[]} list */
    setCities(list) {
      const previous = new Map(cities.map((city) => [city.id, city.h]));
      const latitudes = list.map((city) => city.lat);
      const south = Math.min(...latitudes);
      const span = Math.max(...latitudes) - south || 1;

      cities = list.slice(0, MAX_CITIES).map((city) => ({
        ...city,
        ...project(city.lat, city.lon),
        target: heightFor(city.heat),
        from: previous.get(city.id) ?? 0.02,
        h: previous.get(city.id) ?? 0.02,
        // The first rise sweeps from the southern tip northwards.
        delay: previous.size ? 0 : ((city.lat - south) / span) * 0.7,
      }));

      columns.count = cities.length;
      glowGeometry.setDrawRange(0, cities.length);
      groundMaterial.uniforms.uCount.value = cities.length;
      cities.forEach((city, i) => {
        color.set(heatColor(city.heat));
        const halo = displayColor(heatColor(city.heat));
        columnColors.setXYZ(i, color.r, color.g, color.b);
        glowColors.setXYZ(i, halo.r, halo.g, halo.b);
        glowSizes.setX(i, city.heat === null ? 0 : 1.2 + (city.heat / 100) * 2.4);
        groundMaterial.uniforms.uCities.value[i].set(city.x, city.z, city.heat === null ? -1 : city.heat / 100);
      });
      columnColors.needsUpdate = true;
      glowColors.needsUpdate = true;
      glowSizes.needsUpdate = true;

      if (reducedMotion) {
        cities.forEach((city) => {
          city.h = city.target;
        });
        shared.uReveal.value = 1;
      } else {
        riseStart = performance.now();
      }
      hoverIndex = -1;
      labels.forEach((el) => el.remove());
      labels.clear();
      rebuildEmbers();
      writeColumns();
      placeRings();
      syncLabels();
    },

    /** @param {string | null} id */
    setSelected(id) {
      selectedId = id;
      writeColumns();
      placeRings();
      syncLabels();
    },

    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      controls.removeEventListener('start', onControlsStart);
      controls.removeEventListener('end', onControlsEnd);
      controls.removeEventListener('change', onControlsChange);
      controls.dispose();
      [groundGeometry, columnGeometry, glowGeometry, ringGeometry, embers?.geometry].forEach((g) => g?.dispose());
      [groundMaterial, columnMaterial, glowMaterial, emberMaterial, selectionRing.material, pulseRing.material].forEach(
        (m) => m.dispose()
      );
      columns.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      labelLayer.remove();
    },
  };
}
