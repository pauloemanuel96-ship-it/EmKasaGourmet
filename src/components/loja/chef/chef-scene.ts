/**
 * Cena 3D do Chef Emkasa (D-049): mesa posta, prato da cozinha natural sob a
 * tampa de inox (cloche), vapor ao abrir, luzes âmbar ao fundo e o anel
 * dourado da marca. Tudo gerado por código; baixada só depois que a página
 * abriu (import dinâmico).
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type ChefHandle = {
  /** Abre ou fecha a tampa; devolve se ficou aberta. */
  toggle(): boolean;
  setActive(active: boolean): void;
  resize(): void;
  dispose(): void;
};

const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softDot(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, inner);
    r.addColorStop(0.4, outer);
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Veio de madeira desenhado em canvas, para o tampo da mesa. */
function woodTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 512;
  const g = c.getContext("2d");
  const rand = rng(7);
  if (g) {
    g.fillStyle = "#5a3a24";
    g.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 140; i++) {
      const y = rand() * 512;
      g.strokeStyle = `rgba(${30 + rand() * 40},${18 + rand() * 20},${10 + rand() * 10},${0.15 + rand() * 0.25})`;
      g.lineWidth = 1 + rand() * 3;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= 512; x += 32) {
        g.lineTo(x, y + Math.sin(x * 0.02 + i) * (3 + rand() * 4));
      }
      g.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

export function createChefScene(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean; onOpen?: (open: boolean) => void },
): ChefHandle {
  const rand = rng(2026);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.6;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 60);
  const key = new THREE.DirectionalLight(0xffe2bd, 2.2);
  key.position.set(-3, 6, 4);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2.5;
  key.shadow.camera.right = 2.5;
  key.shadow.camera.top = 2.5;
  key.shadow.camera.bottom = -2.5;
  key.shadow.bias = -0.0008;
  key.shadow.normalBias = 0.02;
  scene.add(key);
  const warm = new THREE.PointLight(0xffa64d, 3, 8, 1.6);
  warm.position.set(1.8, 1.6, -1.2);
  scene.add(warm);
  scene.add(new THREE.HemisphereLight(0x3a2a1c, 0x0b0907, 0.6));

  const world = new THREE.Group();
  scene.add(world);

  /* mesa */
  const wood = woodTexture();
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.6, 2.6, 0.12, 96),
    new THREE.MeshStandardMaterial({
      map: wood,
      roughness: 0.55,
      metalness: 0.02,
    }),
  );
  table.position.y = -0.06;
  table.receiveShadow = true;
  world.add(table);

  /* jogo americano de linho */
  const mat = new THREE.Mesh(
    new THREE.CylinderGeometry(1.15, 1.15, 0.01, 64),
    new THREE.MeshStandardMaterial({ color: 0x9c8b72, roughness: 0.95 }),
  );
  mat.position.y = 0.005;
  mat.receiveShadow = true;
  world.add(mat);

  /* prato de cerâmica (perfil girado) */
  const profile = [
    new THREE.Vector2(0, 0.012),
    new THREE.Vector2(0.5, 0.012),
    new THREE.Vector2(0.56, 0.03),
    new THREE.Vector2(0.62, 0.05),
    new THREE.Vector2(0.86, 0.085),
    new THREE.Vector2(0.9, 0.095),
    new THREE.Vector2(0.88, 0.1),
    new THREE.Vector2(0.62, 0.065),
    new THREE.Vector2(0.55, 0.04),
    new THREE.Vector2(0, 0.04),
  ];
  const plate = new THREE.Mesh(
    new THREE.LatheGeometry(profile, 96),
    new THREE.MeshPhysicalMaterial({
      color: 0xf6f2ea,
      roughness: 0.18,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    }),
  );
  plate.castShadow = true;
  plate.receiveShadow = true;
  world.add(plate);

  /* comida: base de grãos, legumes assados, brócolis, tomate-cereja, folhas e molho */
  const food = new THREE.Group();
  food.position.y = 0.04;
  food.scale.setScalar(1.35);
  world.add(food);
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();

  const grainCount = 520;
  const grains = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.018, 6, 5),
    new THREE.MeshStandardMaterial({ roughness: 0.7 }),
    grainCount,
  );
  for (let i = 0; i < grainCount; i++) {
    const r = Math.sqrt(rand()) * 0.36;
    const a = rand() * Math.PI * 2;
    const h = 0.05 * (1 - (r / 0.36) ** 2) + rand() * 0.02;
    dummy.position.set(Math.cos(a) * r - 0.08, h, Math.sin(a) * r);
    dummy.scale.set(1.3, 0.8, 1);
    dummy.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    dummy.updateMatrix();
    grains.setMatrixAt(i, dummy.matrix);
    grains.setColorAt(i, col.setHSL(0.1, 0.35, 0.62 + rand() * 0.12));
  }
  grains.castShadow = true;
  food.add(grains);

  // Batata-doce assada em cubos.
  const cubes = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.075, 0.06, 0.07),
    new THREE.MeshStandardMaterial({ roughness: 0.5 }),
    14,
  );
  for (let i = 0; i < 14; i++) {
    const a = rand() * Math.PI * 2;
    const r = 0.1 + rand() * 0.2;
    dummy.position.set(0.12 + Math.cos(a) * r * 0.6, 0.08, Math.sin(a) * r);
    dummy.rotation.set(rand() * 0.6, rand() * 3, rand() * 0.6);
    dummy.scale.setScalar(0.85 + rand() * 0.35);
    dummy.updateMatrix();
    cubes.setMatrixAt(i, dummy.matrix);
    cubes.setColorAt(i, col.setHSL(0.07, 0.75, 0.42 + rand() * 0.08));
  }
  cubes.castShadow = true;
  food.add(cubes);

  // Brócolis: buquês de bolinhas sobre um talo.
  const floretMat = new THREE.MeshStandardMaterial({
    color: 0x2f6b2a,
    roughness: 0.85,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x8fb36a,
    roughness: 0.7,
  });
  for (let b = 0; b < 4; b++) {
    const g = new THREE.Group();
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.028, 0.08, 8),
      stemMat,
    );
    stem.position.y = 0.04;
    g.add(stem);
    for (let k = 0; k < 9; k++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.03 + rand() * 0.01, 8, 6),
        floretMat,
      );
      s.position.set(
        (rand() - 0.5) * 0.08,
        0.09 + rand() * 0.03,
        (rand() - 0.5) * 0.08,
      );
      s.castShadow = true;
      g.add(s);
    }
    const a = -0.6 + b * 0.55;
    g.position.set(-0.3 + Math.cos(a) * 0.12, 0.03, -0.18 + Math.sin(a) * 0.1);
    g.rotation.z = (rand() - 0.5) * 0.6;
    food.add(g);
  }

  // Tomate-cereja cortado ao meio.
  const tomatoMat = new THREE.MeshPhysicalMaterial({
    color: 0xc8261b,
    roughness: 0.25,
    clearcoat: 0.6,
  });
  const tomatoCut = new THREE.MeshStandardMaterial({
    color: 0xef6a4c,
    roughness: 0.6,
  });
  for (let i = 0; i < 6; i++) {
    const t = new THREE.Group();
    const half = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2),
      tomatoMat,
    );
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), tomatoCut);
    face.rotation.x = Math.PI / 2;
    t.add(half, face);
    t.rotation.x = Math.PI;
    t.rotation.z = (rand() - 0.5) * 0.8;
    const a = 1.6 + i * 0.35;
    t.position.set(Math.cos(a) * 0.28, 0.1, Math.sin(a) * 0.3);
    t.traverse((m) => (m.castShadow = true));
    food.add(t);
  }

  // Folhinhas (brotos) por cima.
  const leafGeo = new THREE.PlaneGeometry(0.06, 0.03);
  leafGeo.translate(0.03, 0, 0);
  const leaves = new THREE.InstancedMesh(
    leafGeo,
    new THREE.MeshStandardMaterial({
      color: 0x6fae3c,
      roughness: 0.6,
      side: THREE.DoubleSide,
    }),
    26,
  );
  for (let i = 0; i < 26; i++) {
    dummy.position.set(
      (rand() - 0.5) * 0.3,
      0.11 + rand() * 0.04,
      (rand() - 0.5) * 0.3,
    );
    dummy.rotation.set(-0.6 - rand() * 0.6, rand() * Math.PI * 2, 0.3);
    dummy.scale.setScalar(0.7 + rand() * 0.6);
    dummy.updateMatrix();
    leaves.setMatrixAt(i, dummy.matrix);
  }
  food.add(leaves);

  // Fio de molho de ervas em volta.
  const sauceCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 24 }, (_, i) => {
      const a = (i / 24) * Math.PI * 1.6 + 0.4;
      const r = 0.48 + Math.sin(i * 1.7) * 0.02;
      return new THREE.Vector3(Math.cos(a) * r, 0.008, Math.sin(a) * r);
    }),
  );
  const sauce = new THREE.Mesh(
    new THREE.TubeGeometry(sauceCurve, 120, 0.012, 6),
    new THREE.MeshPhysicalMaterial({
      color: 0x5e8f2d,
      roughness: 0.15,
      clearcoat: 1,
    }),
  );
  sauce.scale.y = 0.4;
  food.add(sauce);

  /* copo d'água */
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(0.17, 0.15, 0.48, 48, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness: 0.04,
      transmission: 0,
      transparent: true,
      opacity: 0.18,
      envMapIntensity: 2.4,
      side: THREE.DoubleSide,
    }),
  );
  glass.position.set(1.0, 0.24, -0.7);
  world.add(glass);
  const water = new THREE.Mesh(
    new THREE.CylinderGeometry(0.155, 0.145, 0.3, 48),
    new THREE.MeshPhysicalMaterial({
      color: 0xdfeff2,
      roughness: 0.05,
      transparent: true,
      opacity: 0.22,
      envMapIntensity: 2,
    }),
  );
  water.position.set(1.0, 0.16, -0.7);
  world.add(water);

  /* tampa de inox (cloche) */
  const cloche = new THREE.Group();
  const steel = new THREE.MeshStandardMaterial({
    color: 0xd8d8d6,
    metalness: 1,
    roughness: 0.14,
    envMapIntensity: 1.4,
  });
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(0.82, 72, 36, 0, Math.PI * 2, 0, Math.PI / 2),
    steel,
  );
  dome.scale.y = 0.72;
  dome.castShadow = true;
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.018, 12, 96),
    steel,
  );
  rim.rotation.x = Math.PI / 2;
  const knobStem = new THREE.Mesh(
    new THREE.CylinderGeometry(0.03, 0.05, 0.08, 24),
    steel,
  );
  knobStem.position.y = 0.62;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.075, 32, 16), steel);
  knob.scale.y = 0.6;
  knob.position.y = 0.68;
  cloche.add(dome, rim, knobStem, knob);
  cloche.position.y = 0.1;
  world.add(cloche);

  /* anel dourado da marca, fino, girando em volta do prato */
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.006, 8, 160),
    new THREE.MeshBasicMaterial({
      color: 0xfed216,
      transparent: true,
      opacity: 0,
    }),
  );
  ring.rotation.x = Math.PI / 2;
  ring.position.y = 0.32;
  world.add(ring);
  const ringGlow = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: softDot("rgba(254,210,22,0.9)", "rgba(254,210,22,0.25)"),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    }),
  );
  ringGlow.scale.setScalar(0.22);
  world.add(ringGlow);

  /* vapor */
  const STEAM = 46;
  const steamMat = new THREE.SpriteMaterial({
    map: softDot("rgba(255,255,255,0.55)", "rgba(255,255,255,0.12)"),
    transparent: true,
    depthWrite: false,
    opacity: 0,
  });
  const steam = Array.from({ length: STEAM }, () => {
    const s = new THREE.Sprite(steamMat.clone());
    s.userData = {
      seed: rand(),
      x: (rand() - 0.5) * 0.5,
      z: (rand() - 0.5) * 0.4,
    };
    world.add(s);
    return s;
  });

  /* luzes âmbar desfocadas ao fundo, como na cozinha da foto */
  const bokehTex = softDot("rgba(255,196,120,0.95)", "rgba(255,160,70,0.35)");
  const bokeh = Array.from({ length: 22 }, () => {
    const s = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: bokehTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        opacity: 0.35 + rand() * 0.45,
      }),
    );
    s.position.set((rand() - 0.5) * 14, 1.6 + rand() * 2.6, -4 - rand() * 4);
    s.scale.setScalar(0.35 + rand() * 0.7);
    s.userData = { seed: rand() * 6 };
    scene.add(s);
    return s;
  });

  /* interação: arrastar gira a mesa; tocar no prato abre ou fecha */
  let open = false;
  let openT = opts.reducedMotion ? 1 : 0;
  let spin = 0;
  let targetSpin = 0;
  let dragging = false;
  let lastX = 0;
  let moved = 0;
  const onDown = (e: PointerEvent) => {
    dragging = true;
    moved = 0;
    lastX = e.clientX;
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    lastX = e.clientX;
    moved += Math.abs(dx);
    targetSpin = clamp(targetSpin + dx * 0.006, -0.9, 0.9);
  };
  const onUp = () => {
    if (dragging && moved < 6) handle.toggle();
    dragging = false;
  };
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointermove", onMove);
  window.addEventListener("pointerup", onUp);

  /* enquadramento: prato à direita no computador, centralizado no celular */
  function frame() {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const narrow = camera.aspect < 1;
    camera.fov = narrow ? 36 : 30;
    camera.position.set(0, narrow ? 3.1 : 2.7, narrow ? 5.6 : 5.3);
    camera.lookAt(0, narrow ? 0.45 : 0.4, 0);
    camera.updateProjectionMatrix();
  }
  frame();

  let active = true;
  let raf = 0;
  let last = performance.now();
  const startAt = last;
  let autoOpened = opts.reducedMotion;
  if (opts.reducedMotion) {
    open = true;
    opts.onOpen?.(true);
  }

  function render(now: number) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const t = (now - startAt) / 1000;

    // Primeira visita: a tampa sobe sozinha depois de um instante.
    if (!autoOpened && t > 1.4) {
      autoOpened = true;
      open = true;
      opts.onOpen?.(true);
    }
    const goal = open ? 1 : 0;
    openT += (goal - openT) * (opts.reducedMotion ? 1 : Math.min(1, dt * 2.6));
    const o = ease(openT);

    cloche.position.set(-0.75 * o, 0.1 + 0.95 * o, -0.95 * o);
    cloche.rotation.z = 0.35 * o;
    cloche.rotation.x = -0.5 * o;

    spin += (targetSpin - spin) * Math.min(1, dt * 4);
    const idle = opts.reducedMotion ? 0 : Math.sin(t * 0.25) * 0.08;
    world.rotation.y = spin + idle;

    // Anel dourado aparece com a comida e gira devagar.
    const ringMat = ring.material as THREE.MeshBasicMaterial;
    ringMat.opacity = 0.85 * o;
    ring.rotation.z = opts.reducedMotion ? 0 : t * 0.35;
    const ga = (opts.reducedMotion ? 0.6 : t * 0.9) % (Math.PI * 2);
    ringGlow.position.set(Math.cos(ga) * 1.08, 0.32, Math.sin(ga) * 1.08);
    (ringGlow.material as THREE.SpriteMaterial).opacity = 0.9 * o;

    // Vapor sobe só com a tampa aberta.
    for (const s of steam) {
      const d = s.userData as { seed: number; x: number; z: number };
      const life = opts.reducedMotion ? d.seed : (t * 0.35 + d.seed) % 1;
      s.position.set(
        d.x + Math.sin(life * 6 + d.seed * 9) * 0.06,
        0.2 + life * 1.1,
        d.z,
      );
      s.scale.setScalar(0.12 + life * 0.35);
      (s.material as THREE.SpriteMaterial).opacity =
        o * 0.28 * Math.sin(Math.PI * life);
    }

    for (const b of bokeh) {
      const m = b.material as THREE.SpriteMaterial;
      if (!opts.reducedMotion) {
        m.opacity = 0.45 + 0.25 * Math.sin(t * 0.6 + b.userData.seed);
      }
    }

    renderer.render(scene, camera);
    if (active && !opts.reducedMotion) raf = requestAnimationFrame(render);
  }
  raf = requestAnimationFrame(render);

  const handle: ChefHandle = {
    toggle() {
      open = !open;
      autoOpened = true;
      opts.onOpen?.(open);
      if (opts.reducedMotion) {
        openT = open ? 1 : 0;
        requestAnimationFrame(render);
      }
      return open;
    },
    setActive(next) {
      if (next === active) return;
      active = next;
      cancelAnimationFrame(raf);
      if (active) {
        last = performance.now();
        raf = requestAnimationFrame(render);
      }
    },
    resize() {
      frame();
      if (opts.reducedMotion) requestAnimationFrame(render);
    },
    dispose() {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      scene.traverse((obj) => {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mt of mats) {
          if (!mt) continue;
          const tex = (mt as THREE.MeshStandardMaterial).map;
          tex?.dispose();
          mt.dispose();
        }
      });
      scene.environment?.dispose();
      renderer.dispose();
    },
  };
  return handle;
}
