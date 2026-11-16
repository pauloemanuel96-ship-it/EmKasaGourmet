/**
 * Cena 3D da página de Natal (D-035): árvore com enfeites, pisca-pisca,
 * estrela, presentes que abrem e neve. Tudo gerado por código.
 * Só é baixada depois que a página abriu (import dinâmico).
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type NatalHandle = {
  cycleLights(): LightMode;
  setActive(active: boolean): void;
  resize(): void;
  dispose(): void;
};
export type LightMode = "quentes" | "coloridas" | "apagadas";

const MODES: LightMode[] = ["quentes", "coloridas", "apagadas"];
const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);

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

function dotTexture(inner: string, outer: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  if (g) {
    const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    r.addColorStop(0, inner);
    r.addColorStop(0.35, outer);
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, 64, 64);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createNatalScene(
  canvas: HTMLCanvasElement,
  opts: { reducedMotion: boolean },
): NatalHandle {
  const rand = rng(20261225);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.45;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const moon = new THREE.DirectionalLight(0xcfe0ff, 1.3);
  moon.position.set(-4, 8, 6);
  moon.castShadow = true;
  moon.shadow.mapSize.set(1024, 1024);
  moon.shadow.camera.left = -4;
  moon.shadow.camera.right = 4;
  moon.shadow.camera.top = 7;
  moon.shadow.camera.bottom = -2;
  moon.shadow.bias = -0.001;
  moon.shadow.normalBias = 0.03;
  scene.add(moon);
  const glow = new THREE.PointLight(0xffb86b, 0, 14);
  glow.position.set(0, 2.4, 1.6);
  scene.add(glow);

  const world = new THREE.Group();
  scene.add(world);
  const tree = new THREE.Group();
  world.add(tree);

  /* chão de neve */
  const groundGeo = new THREE.CircleGeometry(4.2, 64);
  {
    const p = groundGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i);
      const y = p.getY(i);
      const d = Math.hypot(x, y) / 4.2;
      p.setZ(
        i,
        0.16 * (1 - d * d) + 0.03 * Math.sin(x * 2.3) * Math.cos(y * 1.9),
      );
    }
    groundGeo.computeVertexNormals();
  }
  const ground = new THREE.Mesh(
    groundGeo,
    new THREE.MeshStandardMaterial({ color: 0xeef3f6, roughness: 0.95 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  world.add(ground);

  /* árvore: camadas de cone com a barra recortada e as pontas mais claras */
  const TIERS = 6;
  const tiers: { y0: number; y1: number; r: number }[] = [];
  const dark = new THREE.Color("#0f3d24");
  const tip = new THREE.Color("#2f7a45");
  const frost = new THREE.Color("#dfeee6");
  const treeMat = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    flatShading: true,
  });
  for (let i = 0; i < TIERS; i++) {
    const f = i / (TIERS - 1);
    const r = 1.85 - f * 1.35;
    const h = 1.35 - f * 0.35;
    const y0 = 0.75 + i * 0.72;
    const g = new THREE.ConeGeometry(r, h, 44, 6, true);
    const p = g.attributes.position;
    const colors = new Float32Array(p.count * 3);
    const c = new THREE.Color();
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const y = p.getY(k);
      const z = p.getZ(k);
      const a = Math.atan2(z, x);
      const low = clamp((h / 2 - y) / h); // 0 no topo, 1 na barra
      const wob =
        1 +
        low * (0.1 * Math.sin(a * 11 + i) + 0.06 * Math.sin(a * 23 + i * 2));
      p.setXYZ(
        k,
        x * wob,
        y - low * low * 0.12 * (1 + Math.sin(a * 11 + i)),
        z * wob,
      );
      c.copy(dark).lerp(tip, low * 0.85);
      if (low > 0.86) c.lerp(frost, (low - 0.86) * 4.5);
      colors[k * 3] = c.r;
      colors[k * 3 + 1] = c.g;
      colors[k * 3 + 2] = c.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    g.computeVertexNormals();
    const m = new THREE.Mesh(g, treeMat);
    m.position.y = y0 + h / 2;
    m.castShadow = true;
    m.receiveShadow = true;
    tree.add(m);
    tiers.push({ y0, y1: y0 + h, r });
  }
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.26, 0.9, 12),
    new THREE.MeshStandardMaterial({ color: 0x5b3a22, roughness: 0.9 }),
  );
  trunk.position.y = 0.45;
  trunk.castShadow = true;
  tree.add(trunk);
  const TOP = tiers[TIERS - 1].y1;

  /** Ponto na superfície da árvore: t de 0 (base) a 1 (topo), a = ângulo. */
  const surf = new THREE.Vector3();
  function onTree(t: number, a: number, push = 0.02) {
    const i = Math.min(TIERS - 1, Math.floor(t * TIERS));
    const tr = tiers[i];
    const k = clamp(t * TIERS - i, 0.12, 0.8);
    const r = tr.r * (1 - k) + push;
    return surf.set(
      Math.cos(a) * r,
      tr.y0 + k * (tr.y1 - tr.y0) * 0.9,
      Math.sin(a) * r,
    );
  }

  /* enfeites */
  const dummy = new THREE.Object3D();
  const col = new THREE.Color();
  const BALLS = 54;
  const balls = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.105, 24, 18),
    new THREE.MeshPhysicalMaterial({
      metalness: 0.85,
      roughness: 0.16,
      clearcoat: 1,
      envMapIntensity: 2.4,
    }),
    BALLS,
  );
  const ballTones = [
    "#c5162c",
    "#e2b33a",
    "#f4ead2",
    "#c5162c",
    "#e2b33a",
    "#1f6f4a",
  ];
  const ballData = Array.from({ length: BALLS }, (_, i) => {
    const t = 0.03 + (i / BALLS) * 0.9;
    const a = i * 2.39996 + rand() * 0.4;
    const p = onTree(t, a, 0.05).clone();
    balls.setColorAt(i, col.set(ballTones[i % ballTones.length]));
    return { p, s: 0.8 + rand() * 0.5 * (1 - t * 0.5), bounce: 0 };
  });
  balls.castShadow = true;
  tree.add(balls);
  function writeBall(i: number) {
    const b = ballData[i];
    dummy.position.copy(b.p);
    dummy.position.y += Math.sin(b.bounce * 9) * 0.08 * b.bounce;
    dummy.rotation.set(0, 0, Math.sin(b.bounce * 14) * 0.5 * b.bounce);
    dummy.scale.setScalar(b.s * (1 + b.bounce * 0.5));
    dummy.updateMatrix();
    balls.setMatrixAt(i, dummy.matrix);
  }
  ballData.forEach((_, i) => writeBall(i));

  /* pisca-pisca: lâmpadas em espiral, com brilho aditivo por cima */
  const BULBS = 90;
  const bulbs = new THREE.InstancedMesh(
    new THREE.SphereGeometry(0.038, 10, 8),
    new THREE.MeshBasicMaterial({ toneMapped: false }),
    BULBS,
  );
  const haloPos = new Float32Array(BULBS * 3);
  const haloCol = new Float32Array(BULBS * 3);
  const bulbData = Array.from({ length: BULBS }, (_, i) => {
    const t = 0.02 + (i / BULBS) * 0.95;
    const p = onTree(t, t * Math.PI * 2 * 7.5, 0.07).clone();
    dummy.position.copy(p);
    dummy.rotation.set(0, 0, 0);
    dummy.scale.setScalar(1);
    dummy.updateMatrix();
    bulbs.setMatrixAt(i, dummy.matrix);
    haloPos.set([p.x, p.y, p.z], i * 3);
    return { phase: rand() * 6.28, speed: 1.2 + rand() * 2.4 };
  });
  tree.add(bulbs);
  const haloTex = dotTexture("rgba(255,255,255,1)", "rgba(255,255,255,.35)");
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute("position", new THREE.BufferAttribute(haloPos, 3));
  haloGeo.setAttribute("color", new THREE.BufferAttribute(haloCol, 3));
  const halos = new THREE.Points(
    haloGeo,
    new THREE.PointsMaterial({
      map: haloTex,
      size: 0.42,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  tree.add(halos);
  const WARM = [new THREE.Color("#ffd27a"), new THREE.Color("#ffe6a8")];
  const MULTI = ["#ff4d4d", "#ffd23f", "#4dd6ff", "#6bff8a", "#ff8ad8"].map(
    (c) => new THREE.Color(c),
  );

  /* estrela */
  const starShape = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? 0.14 : 0.34;
    const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
    if (i === 0) starShape.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    else starShape.lineTo(Math.cos(a) * r, Math.sin(a) * r);
  }
  starShape.closePath();
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xf2c94c,
    emissive: 0xffc94a,
    emissiveIntensity: 0.4,
    metalness: 0.7,
    roughness: 0.25,
  });
  const star = new THREE.Mesh(
    new THREE.ExtrudeGeometry(starShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.02,
      bevelSegments: 2,
    }).translate(0, 0, -0.04),
    starMat,
  );
  star.position.y = TOP + 0.3;
  tree.add(star);
  const starHalo = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: dotTexture("rgba(255,236,170,1)", "rgba(255,200,90,.45)"),
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  starHalo.position.copy(star.position);
  tree.add(starHalo);

  /* presentes */
  type Gift = {
    lid: THREE.Group;
    open: number;
    want: number;
    root: THREE.Group;
    top: number;
  };
  const gifts: Gift[] = [];
  const giftHit: THREE.Mesh[] = [];
  function gift(
    x: number,
    z: number,
    w: number,
    h: number,
    box: number,
    ribbon: number,
    rot: number,
  ) {
    const root = new THREE.Group();
    root.position.set(x, 0.12, z);
    root.rotation.y = rot;
    const paper = new THREE.MeshStandardMaterial({
      color: box,
      roughness: 0.55,
    });
    const band = new THREE.MeshStandardMaterial({
      color: ribbon,
      roughness: 0.3,
      metalness: 0.5,
    });
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), paper);
    body.position.y = h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    body.userData.gift = gifts.length;
    root.add(body);
    giftHit.push(body);
    const v1 = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.16, h * 1.005, w * 1.01),
      band,
    );
    v1.position.y = h / 2;
    const v2 = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.01, h * 1.005, w * 0.16),
      band,
    );
    v2.position.y = h / 2;
    root.add(v1, v2);
    const lid = new THREE.Group();
    const lidBox = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.1, h * 0.2, w * 1.1),
      paper,
    );
    lidBox.castShadow = true;
    lidBox.userData.gift = gifts.length;
    giftHit.push(lidBox);
    const l1 = new THREE.Mesh(
      new THREE.BoxGeometry(w * 0.17, h * 0.21, w * 1.11),
      band,
    );
    const l2 = new THREE.Mesh(
      new THREE.BoxGeometry(w * 1.11, h * 0.21, w * 0.17),
      band,
    );
    const bow = new THREE.Mesh(
      new THREE.TorusKnotGeometry(w * 0.11, w * 0.035, 48, 8, 2, 3),
      band,
    );
    bow.position.y = h * 0.16;
    bow.rotation.x = Math.PI / 2;
    lid.add(lidBox, l1, l2, bow);
    lid.position.y = h + h * 0.1;
    root.add(lid);
    world.add(root);
    gifts.push({ lid, open: 0, want: 0, root, top: h + h * 0.1 });
  }
  gift(1.75, 1.15, 0.75, 0.62, 0xb3202a, 0xe8c66a, 0.4);
  gift(-1.7, 1.3, 0.62, 0.5, 0xf2ead8, 0xb3202a, -0.5);
  gift(0.55, 2.0, 0.5, 0.42, 0x1f6f4a, 0xe8c66a, 0.9);

  /* faíscas (enfeite tocado ou presente aberto) */
  const SPARKS = 160;
  const sparkPos = new Float32Array(SPARKS * 3);
  const sparkVel = new Float32Array(SPARKS * 3);
  const sparkLife = new Float32Array(SPARKS);
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(
    sparkGeo,
    new THREE.PointsMaterial({
      map: dotTexture("rgba(255,244,200,1)", "rgba(255,200,90,.5)"),
      size: 0.16,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  );
  sparks.frustumCulled = false;
  scene.add(sparks);
  let sparkNext = 0;
  function burst(at: THREE.Vector3, n: number, power: number) {
    for (let k = 0; k < n; k++) {
      const i = sparkNext++ % SPARKS;
      sparkPos.set([at.x, at.y, at.z], i * 3);
      sparkVel.set(
        [(rand() - 0.5) * power, rand() * power * 1.2, (rand() - 0.5) * power],
        i * 3,
      );
      sparkLife[i] = 0.7 + rand() * 0.7;
    }
  }
  for (let i = 0; i < SPARKS; i++) sparkPos[i * 3 + 1] = -99;

  /* neve */
  const FLAKES = 420;
  const snowPos = new Float32Array(FLAKES * 3);
  const snowSeed = new Float32Array(FLAKES);
  for (let i = 0; i < FLAKES; i++) {
    snowPos.set(
      [(rand() - 0.5) * 16, rand() * 11 - 1, (rand() - 0.5) * 12 - 1],
      i * 3,
    );
    snowSeed[i] = rand() * 6.28;
  }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute("position", new THREE.BufferAttribute(snowPos, 3));
  const snow = new THREE.Points(
    snowGeo,
    new THREE.PointsMaterial({
      map: dotTexture("rgba(255,255,255,1)", "rgba(255,255,255,.55)"),
      size: 0.11,
      transparent: true,
      opacity: 0.9,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  snow.frustumCulled = false;
  scene.add(snow);

  /* estado e interação */
  let mode = 0;
  let lightK = 0;
  let active = true;
  let disposed = false;
  let raf = 0;
  let spin = 0.5;
  let spinV = 0;
  let down = false;
  let moved = 0;
  let lastX = 0;
  let px = 0;
  let py = 0;
  let wind = 0;
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tmp = new THREE.Vector3();

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const wide = w >= 768 && camera.aspect > 1.05;
    const tan = Math.tan((16 * Math.PI) / 180);
    if (wide) {
      // Computador: árvore à direita do texto.
      const dist = 12.5;
      camera.position.set(0, 3.2, dist);
      camera.lookAt(0, 2.5, 0);
      world.position.x = dist * tan * camera.aspect * 0.42;
    } else {
      // Celular: o palco é alto e a árvore ocupa a metade de baixo, sob o texto.
      const visH = Math.max(6.2 / 0.44, 4.4 / camera.aspect);
      const dist = visH / (2 * tan);
      const lookY = visH * 0.37;
      camera.position.set(0, lookY + 0.6, dist);
      camera.lookAt(0, lookY, 0);
      world.position.x = 0;
    }
  }

  function tap(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    ndc.set(
      ((e.clientX - r.left) / r.width) * 2 - 1,
      -((e.clientY - r.top) / r.height) * 2 + 1,
    );
    ray.setFromCamera(ndc, camera);
    const hitGift = ray.intersectObjects(giftHit, false)[0];
    const hitBall = ray.intersectObject(balls, false)[0];
    if (hitGift && (!hitBall || hitGift.distance < hitBall.distance)) {
      const g = gifts[hitGift.object.userData.gift as number];
      g.want = g.want ? 0 : 1;
      if (g.want) {
        g.root.getWorldPosition(tmp);
        tmp.y += g.top;
        burst(tmp, 46, 2.6);
      }
    } else if (hitBall && hitBall.instanceId !== undefined) {
      ballData[hitBall.instanceId].bounce = 1;
      burst(hitBall.point, 14, 1.4);
    }
    kick();
  }
  const onDown = (e: PointerEvent) => {
    down = true;
    moved = 0;
    lastX = e.clientX;
  };
  const onUp = (e: PointerEvent) => {
    if (down && moved < 6 && e.target === canvas) tap(e);
    down = false;
  };
  const onCancel = () => {
    down = false;
  };
  const onMove = (e: PointerEvent) => {
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
    if (down) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      spinV = dx * 0.01;
      spin += spinV;
      wind = clamp(wind + dx * 0.004, -1.5, 1.5);
    }
  };
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onCancel);
  window.addEventListener("pointermove", onMove, { passive: true });

  let last = performance.now();
  const t0 = last;
  function frame(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const t = (now - t0) / 1000;
    const still = opts.reducedMotion;

    if (!down) {
      spin += spinV + (still ? 0 : dt * 0.12);
      spinV *= 0.94;
    }
    wind *= 0.97;
    tree.rotation.y = spin;
    world.rotation.y = px * 0.06;
    world.rotation.x = py * 0.02;

    // luzes: acendem sozinhas logo que a cena abre
    const lit = MODES[mode] !== "apagadas" && t > 0.5 ? 1 : 0;
    lightK += (lit - lightK) * Math.min(1, dt * 3);
    const multi = MODES[mode] === "coloridas";
    for (let i = 0; i < BULBS; i++) {
      const b = bulbData[i];
      const tw = still ? 1 : 0.55 + 0.45 * Math.sin(t * b.speed + b.phase);
      const base = multi ? MULTI[i % MULTI.length] : WARM[i % 2];
      const k = 0.06 + lightK * tw;
      col.copy(base).multiplyScalar(k);
      bulbs.setColorAt(i, col);
      haloCol[i * 3] = base.r * lightK * tw * 0.7;
      haloCol[i * 3 + 1] = base.g * lightK * tw * 0.7;
      haloCol[i * 3 + 2] = base.b * lightK * tw * 0.7;
    }
    if (bulbs.instanceColor) bulbs.instanceColor.needsUpdate = true;
    haloGeo.attributes.color.needsUpdate = true;
    glow.intensity = lightK * 9;
    starMat.emissiveIntensity =
      0.25 + lightK * (1.3 + (still ? 0 : 0.3 * Math.sin(t * 2.2)));
    starHalo.scale.setScalar(
      0.6 + lightK * (1.25 + (still ? 0 : 0.15 * Math.sin(t * 2.2))),
    );
    star.rotation.y = -spin + (still ? 0 : Math.sin(t * 0.8) * 0.5);

    // enfeites tocados balançam
    let dirty = false;
    for (let i = 0; i < BALLS; i++) {
      const b = ballData[i];
      if (b.bounce > 0) {
        b.bounce = Math.max(0, b.bounce - dt * 1.1);
        writeBall(i);
        dirty = true;
      }
    }
    if (dirty) balls.instanceMatrix.needsUpdate = true;

    // presentes
    for (const g of gifts) {
      g.open += (g.want - g.open) * Math.min(1, dt * 6);
      g.lid.position.y = g.top + g.open * 0.55;
      g.lid.rotation.z = g.open * 0.5;
      g.lid.position.x = g.open * 0.18;
    }

    // faíscas
    for (let i = 0; i < SPARKS; i++) {
      if (sparkLife[i] <= 0) continue;
      sparkLife[i] -= dt;
      sparkVel[i * 3 + 1] -= dt * 2.6;
      sparkPos[i * 3] += sparkVel[i * 3] * dt;
      sparkPos[i * 3 + 1] += sparkVel[i * 3 + 1] * dt;
      sparkPos[i * 3 + 2] += sparkVel[i * 3 + 2] * dt;
      if (sparkLife[i] <= 0) sparkPos[i * 3 + 1] = -99;
    }
    sparkGeo.attributes.position.needsUpdate = true;

    // neve: cai devagar e segue o "vento" de quem arrasta
    if (!still) {
      for (let i = 0; i < FLAKES; i++) {
        snowPos[i * 3 + 1] -= dt * (0.45 + (i % 7) * 0.06);
        snowPos[i * 3] +=
          dt * (Math.sin(t * 0.6 + snowSeed[i]) * 0.25 + wind * 2.2);
        if (snowPos[i * 3 + 1] < -1) snowPos[i * 3 + 1] += 11;
        if (snowPos[i * 3] > 8) snowPos[i * 3] -= 16;
        if (snowPos[i * 3] < -8) snowPos[i * 3] += 16;
      }
      snowGeo.attributes.position.needsUpdate = true;
    }

    renderer.render(scene, camera);
    if (active) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && active && !disposed) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }
  resize();
  kick();

  return {
    cycleLights() {
      mode = (mode + 1) % MODES.length;
      if (MODES[mode] !== "apagadas") {
        star.getWorldPosition(tmp);
        burst(tmp, 30, 2);
      }
      kick();
      return MODES[mode];
    },
    setActive(a) {
      active = a;
      if (a) kick();
    },
    resize() {
      resize();
      kick();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mats = Array.isArray(m.material)
          ? m.material
          : m.material
            ? [m.material]
            : [];
        mats.forEach((mat) => {
          (mat as THREE.PointsMaterial).map?.dispose();
          mat.dispose();
        });
      });
      envMap.dispose();
      renderer.dispose();
    },
  };
}
