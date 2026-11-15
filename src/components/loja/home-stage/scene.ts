/**
 * Cena 3D da abertura da home (D-034): salada no pote "monte do seu jeito"
 * e o pote transparente da Farofa Nutritiva de Soja.
 * Tudo é gerado por código (sem modelos externos); só o rótulo e a textura da
 * farofa vêm de fotos reais em /public/fotos/3d.
 * Este arquivo só é baixado depois que a página já abriu (import dinâmico).
 */
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { STAGE_BEATS, STAGE_INGREDIENTS } from "./ingredients";

export type StageHandle = {
  setProgress(p: number): void;
  setActive(active: boolean): void;
  toggle(id: string): void;
  resize(): void;
  dispose(): void;
};

export type StageOptions = {
  assets: { labelA: string; labelB: string; farofa: string };
  reducedMotion: boolean;
  /** Avisa quais ingredientes estão no pote (mesma ordem de STAGE_INGREDIENTS). */
  onState: (inJar: boolean[]) => void;
};

type Piece = {
  rf: number;
  th: number;
  ly: number;
  q: THREE.Quaternion;
  s: number;
  delay: number;
  ax: THREE.Vector3;
  spin: number;
};

type Layer = {
  id: string;
  h: number;
  margin: number;
  inst: THREE.InstancedMesh | null;
  liquid: THREE.Mesh | null;
  pieces: Piece[];
  k: number;
  y: number;
  on: boolean;
  dirty: boolean;
};

const clamp = (x: number, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const smooth = (x: number) => {
  const t = clamp(x);
  return t * t * (3 - 2 * t);
};
/** Queda com gravidade e um quique curto no fim. */
const fall = (t: number) =>
  t < 0.82
    ? Math.pow(t / 0.82, 2)
    : 1 - 0.035 * Math.sin(((t - 0.82) / 0.18) * Math.PI);

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

/** Pinta a geometria inteira (ou por vértice) no atributo de cor. */
function paint(
  geo: THREE.BufferGeometry,
  color: string | ((x: number, y: number, z: number) => THREE.Color),
) {
  const pos = geo.attributes.position;
  const arr = new Float32Array(pos.count * 3);
  const fixed = typeof color === "string" ? new THREE.Color(color) : null;
  for (let i = 0; i < pos.count; i++) {
    const c =
      fixed ??
      (color as (x: number, y: number, z: number) => THREE.Color)(
        pos.getX(i),
        pos.getY(i),
        pos.getZ(i),
      );
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  geo.setAttribute("color", new THREE.BufferAttribute(arr, 3));
  return geo;
}

function canvasTexture(
  w: number,
  h: number,
  draw: (g: CanvasRenderingContext2D, w: number, h: number) => void,
) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  if (g) draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* ---------- geometrias dos ingredientes ---------- */

function chickpeaGeometry() {
  const g = new THREE.SphereGeometry(0.086, 18, 14);
  const p = g.attributes.position;
  const v = new THREE.Vector3();
  const beak = new THREE.Vector3(0, 0.92, 0.38).normalize();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const d = v.clone().normalize();
    let s =
      1 + 0.06 * Math.sin(d.x * 5 + 1) * Math.sin(d.y * 6) * Math.cos(d.z * 4);
    const ang = d.angleTo(beak);
    s += 0.2 * Math.exp(-(ang * ang) / 0.07); // o "biquinho"
    if (d.z > 0) s -= 0.06 * Math.exp(-Math.pow(d.x / 0.22, 2)); // o sulco
    p.setXYZ(i, v.x * s, v.y * s * 0.94, v.z * s);
  }
  g.computeVertexNormals();
  return g;
}

/** Tira fina e curva: cenoura ralada ou repolho fatiado. */
function shredGeometry(
  len: number,
  width: number,
  thick: number,
  curve: number,
  wave: number,
) {
  const g = new THREE.BoxGeometry(len, thick, width, 10, 1, 1);
  const p = g.attributes.position;
  const R = len / curve;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const a = (x / len) * curve;
    const yy = y + wave * Math.sin(x * 38) + (1 - Math.cos(a)) * R;
    const tw = a * 0.6;
    p.setXYZ(
      i,
      Math.sin(a) * R,
      yy * Math.cos(tw) - z * Math.sin(tw),
      yy * Math.sin(tw) + z * Math.cos(tw),
    );
  }
  g.computeVertexNormals();
  return g;
}

function floretGeometry(rand: () => number) {
  const parts: THREE.BufferGeometry[] = [];
  const stem = new THREE.CylinderGeometry(0.04, 0.03, 0.17, 8)
    .translate(0, -0.075, 0)
    .toNonIndexed();
  parts.push(paint(stem, "#a8c97a"));
  const greens = ["#2f6b2a", "#3a7d30", "#28591f", "#458a3a"];
  for (let i = 0; i < 11; i++) {
    const a = (i / 10) * Math.PI * 2;
    const ring = i === 10 ? 0 : 0.085;
    const lump = new THREE.IcosahedronGeometry(0.062 + rand() * 0.014, 1);
    const p = lump.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const x = p.getX(k);
      const y = p.getY(k);
      const z = p.getZ(k);
      const s =
        1 + 0.16 * Math.sin(x * 70 + i) * Math.cos(y * 64) * Math.sin(z * 58);
      p.setXYZ(k, x * s, y * s, z * s);
    }
    lump.translate(
      Math.cos(a) * ring,
      0.045 + (i === 10 ? 0.05 : rand() * 0.025),
      Math.sin(a) * ring,
    );
    lump.computeVertexNormals();
    parts.push(paint(lump, greens[i % greens.length]));
  }
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

/** Folha de alface crespa: estreita na base, larga e ondulada na ponta. */
function lettuceGeometry() {
  const g = new THREE.PlaneGeometry(1, 1, 12, 14);
  const p = g.attributes.position;
  const base = new THREE.Color("#f0f3c4");
  const mid = new THREE.Color("#8cc63f");
  const edge = new THREE.Color("#4f9a2c");
  const col = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i); // -0.5 a 0.5
    const v = p.getY(i) + 0.5; // 0 a 1
    const wv =
      0.14 +
      0.86 * Math.pow(Math.sin(Math.min(1, v * 1.15) * (Math.PI / 2)), 0.8);
    const x = u * wv * 0.78;
    const y = v * 0.74 - u * u * 4 * 0.11 * v;
    const d = Math.max(Math.abs(u) * 1.8, v);
    const ef = Math.pow(clamp((d - 0.4) / 0.6), 1.4);
    const z =
      0.085 * ef * Math.sin(u * 21 + v * 9) +
      0.035 * ef * Math.sin(u * 47 - v * 23) +
      0.45 * x * x +
      0.28 * (y - 0.3) * (y - 0.3);
    p.setXYZ(i, x, y, z);
    c.copy(base).lerp(mid, clamp(d * 1.25));
    c.lerp(edge, ef * 0.85);
    if (Math.abs(u) < 0.045) c.lerp(base, 0.55 * (1 - v)); // nervura
    col[i * 3] = c.r;
    col[i * 3 + 1] = c.g;
    col[i * 3 + 2] = c.b;
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

function tomatoGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  const red = new THREE.Color("#d3261b");
  const light = new THREE.Color("#ef5a3c");
  const body = new THREE.SphereGeometry(0.15, 26, 18)
    .scale(1, 0.93, 1)
    .toNonIndexed();
  parts.push(
    paint(body, (_x, y) => red.clone().lerp(light, clamp((y + 0.02) / 0.3))),
  );
  for (let i = 0; i < 5; i++) {
    const leaf = new THREE.ConeGeometry(0.02, 0.1, 4)
      .rotateZ(Math.PI / 2 - 0.25)
      .translate(0.05, 0.142, 0)
      .rotateY((i / 5) * Math.PI * 2)
      .toNonIndexed();
    parts.push(paint(leaf, "#3f7a2a"));
  }
  const stalk = new THREE.CylinderGeometry(0.008, 0.01, 0.05, 5)
    .translate(0, 0.165, 0)
    .toNonIndexed();
  parts.push(paint(stalk, "#4c8a30"));
  const merged = mergeGeometries(parts);
  parts.forEach((g) => g.dispose());
  return merged;
}

/* ---------- cena ---------- */

export function createStage(
  canvas: HTMLCanvasElement,
  opts: StageOptions,
): StageHandle {
  const rand = rng(20161115);
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  let dpr = Math.min(window.devicePixelRatio || 1, 1.75);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envMap = pmrem.fromScene(room, 0.04).texture;
  scene.environment = envMap;
  scene.environmentIntensity = 0.8;
  room.dispose();
  pmrem.dispose();

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);
  camera.position.set(0, 0.5, 10);

  const key = new THREE.DirectionalLight(0xfff2dc, 2.1);
  key.position.set(3.2, 6.5, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -2.6;
  key.shadow.camera.right = 2.6;
  key.shadow.camera.top = 3.2;
  key.shadow.camera.bottom = -2.6;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 20;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.PointLight(0xfed216, 14, 18);
  rim.position.set(-4, 1.8, -2.5);
  scene.add(rim);

  /* fundo: gradiente verde-floresta com um brilho atrás do objeto */
  let bgTex: THREE.Texture | null = null;
  function paintBackground(cx: number, cy: number) {
    bgTex?.dispose();
    bgTex = canvasTexture(256, 256, (g, w, h) => {
      const r = g.createRadialGradient(
        cx * w,
        cy * h,
        0,
        cx * w,
        cy * h,
        w * 0.85,
      );
      r.addColorStop(0, "#35583f");
      r.addColorStop(0.42, "#1b3023");
      r.addColorStop(1, "#0e1912");
      g.fillStyle = r;
      g.fillRect(0, 0, w, h);
    });
    scene.background = bgTex;
  }

  const shadowTex = canvasTexture(128, 128, (g, w, h) => {
    const r = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    r.addColorStop(0, "rgba(0,0,0,.6)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, w, h);
  });
  function contactShadow(size: number) {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(size, size),
      new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // Plástico transparente: película quase invisível que só aparece pelo reflexo.
  // (Sem "transmission": custa uma renderização a mais e escurecia o copo.)
  const clearPlastic = (roughness: number) =>
    new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      roughness,
      metalness: 0,
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
      side: THREE.DoubleSide,
      envMapIntensity: 4,
      clearcoat: 1,
    });

  /* ===== pote da salada ===== */
  const H = 2.7;
  const R0 = 0.82;
  const R1 = 1.12;
  const rad = (y: number) => R0 + clamp(y / H) * (R1 - R0);
  const jar = new THREE.Group();
  const jarBody = new THREE.Group();
  jarBody.position.y = -H / 2;
  jar.add(jarBody);
  const cupMat = clearPlastic(0.05);
  const cup = new THREE.Mesh(
    new THREE.CylinderGeometry(R1, R0, H, 64, 1, true).translate(0, H / 2, 0),
    cupMat,
  );
  jarBody.add(cup);
  const cupBase = new THREE.Mesh(new THREE.CircleGeometry(R0, 48), cupMat);
  cupBase.rotation.x = -Math.PI / 2;
  cupBase.position.y = 0.002;
  jarBody.add(cupBase);
  const rimMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.15,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const cupRim = new THREE.Mesh(
    new THREE.TorusGeometry(R1 + 0.01, 0.03, 10, 64),
    rimMat,
  );
  cupRim.rotation.x = Math.PI / 2;
  cupRim.position.y = H;
  jarBody.add(cupRim);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(R1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2).scale(
      1,
      0.46,
      1,
    ),
    cupMat,
  );
  jarBody.add(dome);
  const jarShadow = contactShadow(4.4);
  jarShadow.position.y = -0.02;
  jarBody.add(jarShadow);

  const dummy = new THREE.Object3D();
  const tmpQ = new THREE.Quaternion();
  const UP = new THREE.Vector3(0, 1, 0);
  const col = new THREE.Color();

  function piece(
    rf: number,
    th: number,
    ly: number,
    q: THREE.Quaternion,
    s = 1,
  ): Piece {
    return {
      rf,
      th,
      ly,
      q,
      s,
      delay: 0,
      ax: new THREE.Vector3(
        rand() - 0.5,
        rand() - 0.5,
        rand() - 0.5,
      ).normalize(),
      spin: 2.5 + rand() * 5,
    };
  }
  const randQ = () =>
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(rand() * 6.28, rand() * 6.28, rand() * 6.28),
    );

  /** Espalha peças pelo volume da camada sem deixar duas no mesmo lugar. */
  function fill(
    n: number,
    h: number,
    minDist: number,
    pad: number,
    make: (rf: number, th: number, ly: number) => Piece,
  ) {
    const out: Piece[] = [];
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < n; i++) {
      for (let tries = 0; tries < 40; tries++) {
        const rf = Math.sqrt(rand());
        const th = rand() * Math.PI * 2;
        const ly = pad + rand() * Math.max(0.001, h - pad * 2);
        const v = new THREE.Vector3(
          Math.sin(th) * rf * 0.92,
          ly,
          Math.cos(th) * rf * 0.92,
        );
        if (pts.every((o) => o.distanceToSquared(v) > minDist * minDist)) {
          pts.push(v);
          out.push(make(rf, th, ly));
          break;
        }
      }
    }
    return out;
  }

  function instanced(
    geo: THREE.BufferGeometry,
    mat: THREE.Material | THREE.Material[],
    pieces: Piece[],
    colors: string[] | null,
  ) {
    const m = new THREE.InstancedMesh(geo, mat, pieces.length);
    m.frustumCulled = false;
    m.castShadow = true;
    m.receiveShadow = true;
    if (colors) {
      pieces.forEach((_, i) => {
        col.set(colors[Math.floor(rand() * colors.length)]);
        col.offsetHSL(0, 0, (rand() - 0.5) * 0.06);
        m.setColorAt(i, col);
      });
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
    m.visible = false;
    jarBody.add(m);
    return m;
  }

  const layers: Layer[] = [];
  function addLayer(
    id: string,
    h: number,
    margin: number,
    pieces: Piece[],
    inst: THREE.InstancedMesh | null,
    liquid: THREE.Mesh | null = null,
  ) {
    const maxLy = Math.max(0.001, ...pieces.map((p) => p.ly));
    pieces.forEach((p) => {
      p.delay = clamp((p.ly / maxLy) * 0.6 + rand() * 0.4);
    });
    layers.push({
      id,
      h,
      margin,
      inst,
      liquid,
      pieces,
      k: 0,
      y: 0,
      on: true,
      dirty: true,
    });
  }

  // molho
  {
    const h = 0.16;
    const sauce = new THREE.Mesh(
      new THREE.CylinderGeometry(rad(h) - 0.03, rad(0) - 0.03, h, 48).translate(
        0,
        h / 2,
        0,
      ),
      new THREE.MeshPhysicalMaterial({
        color: 0xc8860f,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.1,
      }),
    );
    sauce.position.y = 0.01;
    sauce.visible = false;
    sauce.receiveShadow = true;
    jarBody.add(sauce);
    addLayer("molho", h, 0, [], null, sauce);
  }
  // grão-de-bico
  {
    const h = 0.36;
    const ps = fill(215, h, 0.15, 0.08, (rf, th, ly) =>
      piece(rf, th, ly, randQ(), 0.9 + rand() * 0.25),
    );
    const inst = instanced(
      chickpeaGeometry(),
      new THREE.MeshStandardMaterial({ roughness: 0.72 }),
      ps,
      ["#e3c588", "#d9b771", "#ecd29a", "#cfa962"],
    );
    addLayer("grao", h, 0.14, ps, inst);
  }
  // tiras: cenoura ralada e repolho roxo
  function shreds(n: number, h: number, len: number) {
    const ps: Piece[] = [];
    for (let i = 0; i < n; i++) {
      const rf = Math.min(0.94, Math.sqrt(rand()) * 1.02);
      const th = rand() * Math.PI * 2;
      const yaw = rf > 0.6 ? th + (rand() - 0.5) * 0.9 : rand() * 6.28;
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler((rand() - 0.5) * 0.8, yaw, (rand() - 0.5) * 0.5, "YXZ"),
      );
      ps.push(
        piece(
          rf * (1 - len * 0.12),
          th,
          0.03 + rand() * (h - 0.06),
          q,
          0.8 + rand() * 0.45,
        ),
      );
    }
    return ps;
  }
  {
    const h = 0.28;
    const ps = shreds(440, h, 0.34);
    const inst = instanced(
      shredGeometry(0.34, 0.036, 0.022, 1.3, 0),
      new THREE.MeshStandardMaterial({ roughness: 0.5 }),
      ps,
      ["#f07f14", "#fb9627", "#e56f0c", "#ffa63d"],
    );
    addLayer("cenoura", h, 0.07, ps, inst);
  }
  {
    const h = 0.24;
    const ps = shreds(300, h, 0.42);
    const inst = instanced(
      shredGeometry(0.42, 0.07, 0.012, 2.1, 0.012),
      new THREE.MeshStandardMaterial({
        roughness: 0.45,
        side: THREE.DoubleSide,
      }),
      ps,
      ["#6d2a72", "#7f3586", "#5a2262", "#8e479a", "#d8b5dc"],
    );
    addLayer("repolho", h, 0.07, ps, inst);
  }
  // pepino em rodelas
  {
    const h = 0.34;
    const face = canvasTexture(256, 256, (g, w) => {
      const c = w / 2;
      const rg = g.createRadialGradient(c, c, 8, c, c, c);
      rg.addColorStop(0, "#eef5d2");
      rg.addColorStop(0.62, "#dcebb4");
      rg.addColorStop(0.9, "#c4dc92");
      rg.addColorStop(1, "#7fae4c");
      g.fillStyle = rg;
      g.fillRect(0, 0, w, w);
      for (let lobe = 0; lobe < 3; lobe++) {
        const a0 = (lobe / 3) * Math.PI * 2 + 0.5;
        g.fillStyle = "rgba(190,214,140,.55)";
        g.beginPath();
        g.ellipse(
          c + Math.cos(a0) * 46,
          c + Math.sin(a0) * 46,
          40,
          26,
          a0 + Math.PI / 2,
          0,
          7,
        );
        g.fill();
        for (let s = 0; s < 6; s++) {
          const a = a0 + (s - 2.5) * 0.2;
          const rr = 36 + (s % 2) * 18;
          g.fillStyle = "#f6f8e2";
          g.strokeStyle = "#b9cf8a";
          g.lineWidth = 1.5;
          g.beginPath();
          g.ellipse(
            c + Math.cos(a) * rr,
            c + Math.sin(a) * rr,
            9,
            4.5,
            a,
            0,
            7,
          );
          g.fill();
          g.stroke();
        }
      }
    });
    const faceMat = new THREE.MeshStandardMaterial({
      map: face,
      roughness: 0.35,
    });
    const ps: Piece[] = [];
    const wall = 15;
    for (let i = 0; i < wall; i++) {
      const th = (i / wall) * Math.PI * 2 + rand() * 0.1;
      const out = new THREE.Vector3(
        Math.sin(th),
        0.1 + (rand() - 0.5) * 0.2,
        Math.cos(th),
      ).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(UP, out);
      ps.push(
        piece(0.99, th, 0.17 + (rand() - 0.5) * 0.04, q, 0.95 + rand() * 0.1),
      );
    }
    for (let i = 0; i < 20; i++) {
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (rand() - 0.5) * 0.7,
          rand() * 6.28,
          (rand() - 0.5) * 0.7,
        ),
      );
      ps.push(
        piece(
          Math.sqrt(rand()) * 0.72,
          rand() * 6.28,
          0.04 + rand() * 0.26,
          q,
          0.9 + rand() * 0.2,
        ),
      );
    }
    const inst = instanced(
      new THREE.CylinderGeometry(0.165, 0.165, 0.04, 30),
      [
        new THREE.MeshStandardMaterial({ color: 0x2f6a2b, roughness: 0.4 }),
        faceMat,
        faceMat,
      ],
      ps,
      null,
    );
    addLayer("pepino", h, 0.09, ps, inst);
  }
  // brócolis
  {
    const h = 0.36;
    const ps = fill(48, h, 0.23, 0.13, (rf, th, ly) => {
      const out = new THREE.Vector3(
        Math.sin(th) * rf,
        0.5 + rand() * 0.6,
        Math.cos(th) * rf,
      ).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(UP, out);
      q.multiply(tmpQ.setFromAxisAngle(UP, rand() * 6.28));
      return piece(rf, th, ly, q.clone(), 0.95 + rand() * 0.35);
    });
    const inst = instanced(
      floretGeometry(rand),
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.85,
        flatShading: true,
      }),
      ps,
      null,
    );
    addLayer("brocolis", h, 0.17, ps, inst);
  }
  // alface
  {
    const h = 0.36;
    const ps: Piece[] = [];
    const X = new THREE.Vector3();
    const Y = new THREE.Vector3();
    const Z = new THREE.Vector3();
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < 34; i++) {
      const inner = i >= 22;
      const th = (i / (inner ? 12 : 22)) * Math.PI * 2 + rand() * 0.3;
      const elev = inner ? 1.0 + rand() * 0.4 : 0.35 + rand() * 0.5;
      Y.set(
        Math.sin(th) * Math.cos(elev),
        Math.sin(elev),
        Math.cos(th) * Math.cos(elev),
      ).normalize();
      X.set(Math.cos(th), 0, -Math.sin(th));
      Z.crossVectors(X, Y).normalize();
      X.crossVectors(Y, Z).normalize();
      const q = new THREE.Quaternion().setFromRotationMatrix(
        m4.makeBasis(X, Y, Z),
      );
      q.multiply(tmpQ.setFromAxisAngle(UP, (rand() - 0.5) * 0.9));
      ps.push(
        piece(
          inner ? 0.12 + rand() * 0.16 : 0.34 + rand() * 0.2,
          th,
          0.03 + rand() * 0.14,
          q.clone(),
          0.85 + rand() * 0.4,
        ),
      );
    }
    const inst = instanced(
      lettuceGeometry(),
      new THREE.MeshStandardMaterial({
        vertexColors: true,
        roughness: 0.55,
        side: THREE.DoubleSide,
      }),
      ps,
      null,
    );
    addLayer("alface", h, 0.1, ps, inst);
  }
  // tomate-cereja
  {
    const ps: Piece[] = [];
    for (let i = 0; i < 8; i++) {
      const th = (i / 8) * Math.PI * 2 + rand() * 0.4;
      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          (rand() - 0.5) * 1.4,
          rand() * 6.28,
          (rand() - 0.5) * 1.4,
        ),
      );
      ps.push(
        piece(
          i % 3 === 0 ? 0.22 : 0.62 + rand() * 0.14,
          th,
          0.14 + rand() * 0.06,
          q,
          0.9 + rand() * 0.25,
        ),
      );
    }
    const inst = instanced(
      tomatoGeometry(),
      new THREE.MeshPhysicalMaterial({
        vertexColors: true,
        roughness: 0.22,
        clearcoat: 0.7,
        clearcoatRoughness: 0.15,
      }),
      ps,
      null,
    );
    addLayer("tomate", 0.12, 0.2, ps, inst);
  }
  scene.add(jar);

  /* ===== pote da Farofa (embalagem transparente) ===== */
  const PH = 1.9;
  const PT = 1.08;
  const PB = 0.86;
  const prad = (y: number) => PB + (y / PH) * (PT - PB);
  const pot = new THREE.Group();
  const potBody = new THREE.Group();
  potBody.position.y = -PH / 2;
  pot.add(potBody);
  const potMat = clearPlastic(0.1);
  potBody.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(PT, PB, PH, 72, 1, true).translate(
        0,
        PH / 2,
        0,
      ),
      potMat,
    ),
  );
  const potBase = new THREE.Mesh(new THREE.CircleGeometry(PB, 56), potMat);
  potBase.rotation.x = -Math.PI / 2;
  potBody.add(potBase);
  const potLip = new THREE.Mesh(
    new THREE.TorusGeometry(PT + 0.015, 0.035, 10, 72),
    rimMat,
  );
  potLip.rotation.x = Math.PI / 2;
  potLip.position.y = PH;
  potBody.add(potLip);

  const loader = new THREE.TextureLoader();
  const farofaTex = loader.load(opts.assets.farofa, () => {
    needsRender = true;
  });
  farofaTex.colorSpace = THREE.SRGBColorSpace;
  farofaTex.wrapS = farofaTex.wrapT = THREE.MirroredRepeatWrapping;
  farofaTex.anisotropy = 4;
  const farofaSide = farofaTex.clone();
  farofaSide.repeat.set(6, 1.4);
  const farofaTop = farofaTex.clone();
  farofaTop.repeat.set(1.6, 1.6);
  const FILL = PH * 0.84;
  const fillSide = new THREE.Mesh(
    new THREE.CylinderGeometry(
      prad(FILL) - 0.025,
      PB - 0.025,
      FILL - 0.02,
      64,
      1,
      true,
    ).translate(0, FILL / 2 + 0.01, 0),
    new THREE.MeshStandardMaterial({
      map: farofaSide,
      bumpMap: farofaSide,
      bumpScale: 2,
      roughness: 1,
      envMapIntensity: 0.5,
    }),
  );
  fillSide.receiveShadow = true;
  potBody.add(fillSide);
  // superfície da farofa: um monte irregular, não um disco liso
  const topR = prad(FILL) - 0.025;
  const mound = new THREE.BufferGeometry();
  {
    const rings = 14;
    const seg = 56;
    const pos: number[] = [];
    const uv: number[] = [];
    const idx: number[] = [];
    const bump = (x: number, z: number) =>
      0.03 * Math.sin(x * 9.1 + 1.3) * Math.cos(z * 8.3) +
      0.018 * Math.sin(x * 21 + z * 17) +
      0.012 * Math.cos(x * 33 - z * 29);
    for (let r = 0; r <= rings; r++) {
      for (let s = 0; s <= seg; s++) {
        const rr = (r / rings) * topR;
        const a = (s / seg) * Math.PI * 2;
        const x = Math.cos(a) * rr;
        const z = Math.sin(a) * rr;
        const edge = 1 - Math.pow(rr / topR, 2);
        pos.push(x, 0.11 * edge + bump(x, z) * (0.35 + 0.65 * edge), z);
        uv.push(x / topR / 2 + 0.5, z / topR / 2 + 0.5);
      }
    }
    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < seg; s++) {
        const a = r * (seg + 1) + s;
        const b = a + seg + 1;
        idx.push(a, a + 1, b, b, a + 1, b + 1);
      }
    }
    mound.setIndex(idx);
    mound.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    mound.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    mound.computeVertexNormals();
  }
  const fillTop = new THREE.Mesh(
    mound,
    new THREE.MeshStandardMaterial({
      map: farofaTop,
      bumpMap: farofaTop,
      bumpScale: 3,
      roughness: 1,
      envMapIntensity: 0.5,
    }),
  );
  fillTop.position.y = FILL;
  fillTop.receiveShadow = true;
  potBody.add(fillTop);
  // grumos soltos por cima
  {
    const g = new THREE.IcosahedronGeometry(0.03, 0);
    const n = 150;
    const crumbs = new THREE.InstancedMesh(
      g,
      new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
      n,
    );
    const tones = ["#f2c230", "#e8b21c", "#f7d24a", "#eebc28", "#8a5a2a"];
    for (let i = 0; i < n; i++) {
      const rr = Math.sqrt(rand()) * topR * 0.94;
      const a = rand() * 6.28;
      dummy.position.set(
        Math.cos(a) * rr,
        FILL + 0.11 * (1 - Math.pow(rr / topR, 2)) + 0.012,
        Math.sin(a) * rr,
      );
      dummy.rotation.set(rand() * 6, rand() * 6, rand() * 6);
      const s = 0.5 + rand() * 1.1;
      dummy.scale.set(s, s * 0.8, s);
      dummy.updateMatrix();
      crumbs.setMatrixAt(i, dummy.matrix);
      crumbs.setColorAt(
        i,
        col.set(tones[i % 9 === 0 ? 4 : Math.floor(rand() * 4)]),
      );
    }
    crumbs.castShadow = true;
    potBody.add(crumbs);
  }
  // rótulo real, colado por fora
  const labelCanvas = document.createElement("canvas");
  labelCanvas.width = 2048;
  labelCanvas.height = 640;
  const labelTex = new THREE.CanvasTexture(labelCanvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  labelTex.anisotropy = 8;
  const label = new THREE.Mesh(
    new THREE.CylinderGeometry(
      PT + 0.006,
      PB + 0.006,
      PH,
      72,
      1,
      true,
    ).translate(0, PH / 2, 0),
    new THREE.MeshStandardMaterial({
      map: labelTex,
      transparent: true,
      alphaTest: 0.5,
      roughness: 0.4,
      side: THREE.DoubleSide,
    }),
  );
  potBody.add(label);
  [opts.assets.labelA, opts.assets.labelB].forEach((src, i) => {
    const img = new Image();
    img.onload = () => {
      const g = labelCanvas.getContext("2d");
      if (!g) return;
      const cx = 512 + i * 1024;
      const cy = 350;
      const r = 250;
      g.save();
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.clip();
      g.drawImage(img, cx - r * 1.04, cy - r * 1.04, r * 2.08, r * 2.08);
      g.restore();
      labelTex.needsUpdate = true;
      needsRender = true;
    };
    img.src = src;
  });
  // tampa transparente
  const lid = new THREE.Group();
  lid.add(
    new THREE.Mesh(
      new THREE.CylinderGeometry(PT + 0.06, PT + 0.06, 0.1, 72, 1, true),
      potMat,
    ),
    new THREE.Mesh(
      new THREE.CircleGeometry(PT + 0.06, 72)
        .rotateX(-Math.PI / 2)
        .translate(0, 0.05, 0),
      potMat,
    ),
  );
  const lidRing = new THREE.Mesh(
    new THREE.TorusGeometry(PT + 0.06, 0.02, 8, 72),
    rimMat,
  );
  lidRing.rotation.x = Math.PI / 2;
  lidRing.position.y = 0.05;
  lid.add(lidRing);
  potBody.add(lid);
  const potShadow = contactShadow(4.2);
  potShadow.position.y = -0.02;
  potBody.add(potShadow);
  pot.visible = false;
  scene.add(pot);

  /* ===== folhas flutuando ===== */
  const leafShape = new THREE.Shape();
  leafShape.moveTo(0, -0.5);
  leafShape.quadraticCurveTo(0.34, 0, 0, 0.5);
  leafShape.quadraticCurveTo(-0.34, 0, 0, -0.5);
  const LEAVES = 30;
  const leaves = new THREE.InstancedMesh(
    new THREE.ShapeGeometry(leafShape, 8),
    new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7 }),
    LEAVES,
  );
  leaves.frustumCulled = false;
  const leafData = Array.from({ length: LEAVES }, (_, i) => {
    leaves.setColorAt(
      i,
      col.set(["#739251", "#8fb26c", "#4f6b3a", "#a9c98a"][i % 4]),
    );
    return {
      x: (rand() - 0.5) * 13,
      y: (rand() - 0.5) * 10,
      z: -7 + rand() * 6,
      s: 0.22 + rand() * 0.36,
      rx: rand() * 6,
      rz: rand() * 6,
      v: 0.05 + rand() * 0.12,
      w: (rand() - 0.5) * 0.5,
    };
  });
  scene.add(leaves);

  /* ===== estado ===== */
  let P = 0;
  let active = true;
  let disposed = false;
  let needsRender = true;
  let raf = 0;
  let forceAll = false;
  let lidK = 0;
  let lastState = "";
  let baseX = 0;
  let baseY = 0;
  let baseS = 1;
  let visW = 4;
  let drag = 0;
  let dragV = 0;
  let down = false;
  let lastX = 0;
  let px = 0;
  let py = 0;

  const order = STAGE_INGREDIENTS.map((i) => i.id);
  const byId = (id: string) => layers.find((l) => l.id === id);

  function revealed(i: number) {
    if (forceAll) return true;
    const q =
      (P - STAGE_BEATS.assembleStart) /
      (STAGE_BEATS.assembleEnd - STAGE_BEATS.assembleStart);
    return q > (i / layers.length) * 0.96 + 0.02;
  }

  function emitState() {
    const st = order.map((id) => {
      const i = layers.findIndex((l) => l.id === id);
      return i >= 0 && layers[i].on && revealed(i);
    });
    const sig = st.map((b) => (b ? 1 : 0)).join("");
    if (sig !== lastState) {
      lastState = sig;
      opts.onState(st);
    }
  }

  function writeLayer(L: Layer) {
    if (L.liquid) {
      L.liquid.visible = L.k > 0.001;
      L.liquid.scale.y = Math.max(0.001, ease(L.k));
      return;
    }
    const m = L.inst;
    if (!m) return;
    m.visible = L.k > 0.001;
    if (!m.visible) return;
    for (let i = 0; i < L.pieces.length; i++) {
      const p = L.pieces[i];
      const t = clamp((L.k - p.delay * 0.55) / 0.45);
      const e = fall(t);
      const yT = L.y + p.ly;
      const y0 = H + 0.45 + p.delay * 0.9;
      const r =
        p.rf * (rad(yT) - L.margin) * (0.4 + 0.6 * Math.min(1, e * 1.4));
      dummy.position.set(
        Math.sin(p.th) * r,
        y0 + (yT - y0) * e,
        Math.cos(p.th) * r,
      );
      dummy.quaternion.copy(p.q);
      if (t < 1)
        dummy.quaternion.multiply(
          tmpQ.setFromAxisAngle(p.ax, (1 - e) * p.spin),
        );
      const s = p.s * Math.min(1, t / 0.1);
      dummy.scale.setScalar(Math.max(s, 0.0001));
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }

  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const visH = 2 * 10 * Math.tan((16 * Math.PI) / 180);
    visW = visH * camera.aspect;
    if (w >= 768 && camera.aspect > 1) {
      baseX = visW * 0.23;
      baseY = -0.1;
      baseS = Math.min(1.05, (visH * 0.64) / 3.3);
      paintBackground(0.73, 0.5);
    } else {
      baseX = 0;
      baseY = -visH * 0.185;
      baseS = Math.min((visH * 0.39) / 3.3, (visW * 0.84) / 2.4);
      paintBackground(0.5, 0.66);
    }
    needsRender = true;
  }

  const onDown = (e: PointerEvent) => {
    down = true;
    lastX = e.clientX;
  };
  const onUp = () => {
    down = false;
  };
  const onMove = (e: PointerEvent) => {
    px = (e.clientX / window.innerWidth - 0.5) * 2;
    py = (e.clientY / window.innerHeight - 0.5) * 2;
    if (down) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      dragV = dx * 0.011;
      drag += dragV;
    }
    needsRender = true;
  };
  canvas.addEventListener("pointerdown", onDown);
  window.addEventListener("pointerup", onUp);
  window.addEventListener("pointercancel", onUp);
  window.addEventListener("pointermove", onMove, { passive: true });

  let last = performance.now();
  let t0 = last;
  let slowFrames = 0;
  let measured = 0;

  function frame(now: number) {
    raf = 0;
    if (disposed) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const idle = opts.reducedMotion ? 0 : (now - t0) / 1000;

    // qualidade adaptável: se o aparelho não acompanha, tira sombra e resolução
    if (measured < 50 && now - t0 > 1500) {
      measured++;
      if (dt > 0.034) slowFrames++;
      if (measured === 50 && slowFrames > 25) {
        key.castShadow = false;
        dpr = 1;
        renderer.setPixelRatio(dpr);
        resize();
      }
    }

    if (!down) {
      drag += dragV;
      dragV *= 0.93;
    }

    /* salada */
    let stackY = 0;
    let animating = false;
    for (let i = 0; i < layers.length; i++) {
      const L = layers[i];
      const want = L.on && revealed(i) ? 1 : 0;
      if (L.k !== want) {
        const step = dt / (want ? 0.95 : 0.55);
        L.k = want ? Math.min(1, L.k + step) : Math.max(0, L.k - step);
        L.dirty = true;
        animating = true;
      }
      const yTarget = L.id === "molho" ? 0.01 : stackY + 0.01;
      if (Math.abs(L.y - yTarget) > 0.0005) {
        L.y += (yTarget - L.y) * Math.min(1, dt * 7);
        L.dirty = true;
        animating = true;
      } else L.y = yTarget;
      if (want) stackY += L.id === "tomate" ? 0 : L.h;
      if (L.dirty) {
        writeLayer(L);
        L.dirty = false;
      }
    }
    emitState();

    const out = ease((P - STAGE_BEATS.swapStart) / 0.1);
    jar.visible = out < 1;
    if (jar.visible) {
      jar.position.set(
        baseX - out * visW * 1.15,
        baseY + Math.sin(idle * 0.9) * 0.04,
        0,
      );
      jar.scale.setScalar(baseS * (1 - out * 0.2));
      jar.rotation.set(
        0.16 + py * 0.04,
        P * 4.5 + idle * 0.1 + drag,
        -out * 0.35,
      );
      const full = revealed(layers.length - 1) && !animating;
      const lidWant = full ? 1 : 0;
      lidK += (lidWant - lidK) * Math.min(1, dt * (lidWant ? 4 : 9));
      if (Math.abs(lidWant - lidK) > 0.002) animating = true;
      dome.visible = lidK > 0.01;
      dome.position.y = H + (1 - smooth(lidK)) * 1.5;
    }

    /* farofa */
    const inn = ease((P - (STAGE_BEATS.swapStart + 0.03)) / 0.1);
    pot.visible = inn > 0;
    if (pot.visible) {
      const open = smooth(
        (P - STAGE_BEATS.lidStart) /
          (STAGE_BEATS.lidEnd - STAGE_BEATS.lidStart),
      );
      pot.position.set(
        baseX + (1 - inn) * visW * 1.15,
        baseY + 0.05 + Math.sin(idle * 0.9 + 1) * 0.04,
        0,
      );
      pot.scale.setScalar(baseS * 1.06 * (0.8 + 0.2 * inn));
      pot.rotation.set(
        0.2 + open * 0.42 + py * 0.05,
        -Math.PI / 2 +
          (1 - inn) * 2 -
          (P - 0.8) * 3.2 +
          Math.sin(idle * 0.5) * 0.1 +
          drag,
        (1 - inn) * 0.3,
      );
      lid.position.set(open * 0.5, PH + 0.02 + open * 0.7, -open * 0.9);
      lid.rotation.set(-open * 0.9, 0, -open * 0.25);
    }

    /* folhas */
    for (let i = 0; i < LEAVES; i++) {
      const l = leafData[i];
      if (!opts.reducedMotion) {
        l.y += l.v * dt;
        l.rx += l.w * dt;
        l.rz += l.w * 0.7 * dt;
        if (l.y > 5.4) l.y -= 10.8;
      }
      let y = l.y + P * 3.5;
      y = ((((y + 5.4) % 10.8) + 10.8) % 10.8) - 5.4;
      dummy.position.set(l.x - px * 0.3, y, l.z);
      dummy.rotation.set(l.rx, l.rz * 0.5, l.rz);
      dummy.scale.setScalar(l.s);
      dummy.updateMatrix();
      leaves.setMatrixAt(i, dummy.matrix);
    }
    leaves.instanceMatrix.needsUpdate = true;

    camera.position.x = px * 0.22;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);

    needsRender = animating || !opts.reducedMotion || Math.abs(dragV) > 0.0005;
    if (active && needsRender) raf = requestAnimationFrame(frame);
  }
  function kick() {
    if (!raf && active && !disposed) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  resize();
  t0 = performance.now();
  kick();

  return {
    setProgress(p) {
      P = clamp(p);
      if (P < 0.06) forceAll = false;
      needsRender = true;
      kick();
    },
    setActive(a) {
      active = a;
      if (a) kick();
    },
    toggle(id) {
      const L = byId(id);
      if (!L) return;
      const i = layers.indexOf(L);
      // tocar num ingrediente que ainda não caiu coloca o pote inteiro de uma vez
      if (!revealed(i)) forceAll = true;
      else L.on = !L.on;
      needsRender = true;
      kick();
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
      window.removeEventListener("pointercancel", onUp);
      window.removeEventListener("pointermove", onMove);
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mats = Array.isArray(m.material)
          ? m.material
          : m.material
            ? [m.material]
            : [];
        mats.forEach((mat) => mat.dispose());
      });
      [
        bgTex,
        shadowTex,
        farofaTex,
        farofaSide,
        farofaTop,
        labelTex,
        envMap,
      ].forEach((t) => t?.dispose());
      renderer.dispose();
    },
  };
}
