// Vista 3D de la casa de ejemplo de Space Cat.
// Los datos salen del mismo archivo que trae la aplicación (scripts/casa_json.py → src/data/casa.json).
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import casa from '../data/casa.json';

const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
const LADO = 9.3; // terreno: 9 m de casa + muros exteriores

export function montar(raiz) {
  const lienzo = raiz.querySelector('.visor3d-lienzo');
  const tip = raiz.querySelector('.visor3d-tip');
  const lista = raiz.querySelector('.visor3d-lista');

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  } catch {
    raiz.classList.add('sin-webgl');
    return;
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  lienzo.appendChild(renderer.domElement);

  const escena = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(38, 1, 0.1, 200);
  const centro = new THREE.Vector3(LADO / 2 - 0.15, 2.4, LADO / 2 - 0.15);
  camara.position.set(centro.x + 7, 15.5, centro.z + 10.5);

  const controles = new OrbitControls(camara, renderer.domElement);
  controles.target.copy(centro);
  controles.enableDamping = true;
  controles.dampingFactor = 0.08;
  controles.minDistance = 7;
  controles.maxDistance = 42;
  controles.maxPolarAngle = Math.PI * 0.48;
  controles.enablePan = false;
  controles.autoRotate = !quieto;
  controles.autoRotateSpeed = 0.55;

  // ---------- Luz ----------
  escena.add(new THREE.HemisphereLight(0xdfeaff, 0x2a3a52, 1.15));
  const sol = new THREE.DirectionalLight(0xfff1d6, 2.4);
  sol.position.set(centro.x - 9, 16, centro.z + 11);
  sol.target.position.copy(centro);
  sol.castShadow = true;
  sol.shadow.mapSize.set(2048, 2048);
  Object.assign(sol.shadow.camera, { left: -11, right: 11, top: 11, bottom: -11, near: 1, far: 50 });
  sol.shadow.bias = -0.0004;
  sol.shadow.normalBias = 0.02;
  escena.add(sol, sol.target);

  // ---------- Materiales (uno por color y por piso, para poder atenuar un piso) ----------
  const cache = new Map();
  const mat = (color, lv, extra = {}) => {
    const k = `${color}|${lv}|${JSON.stringify(extra)}`;
    if (!cache.has(k)) {
      const m = new THREE.MeshStandardMaterial({ color, roughness: 0.85, metalness: 0, ...extra });
      m.userData.lv = lv;
      m.userData.opacidad = extra.opacity ?? 1;
      cache.set(k, m);
    }
    return cache.get(k);
  };
  const tono = (hex, l) => '#' + new THREE.Color(hex).offsetHSL(0, 0, l).getHexString();

  const caja = (w, h, d, material, x, y, z, sombra = true) => {
    const g = new THREE.BoxGeometry(w, h, d);
    g.translate(0, h / 2, 0); // origen en la base: así los muros "crecen" desde el piso
    const m = new THREE.Mesh(g, material);
    m.position.set(x, y, z);
    m.castShadow = sombra;
    m.receiveShadow = true;
    return m;
  };

  // piezas para la animación de armado
  const piezas = [];
  const pieza = (obj, t0, modo) => { obj.userData.armar = { t0, modo }; piezas.push(obj); return obj; };

  const pisos = new Map(); // nivel → grupo
  const suelos = []; // mallas del piso de cada ambiente, para el puntero
  const items = [];

  const niveles = Object.keys(casa.elev).map(Number);
  const nivelMax = Math.max(...niveles);

  // ---------- Terreno ----------
  const terreno = new THREE.Group();
  // el lote: un rectángulo de césped con su lindero en ámbar, como una maqueta sobre el tablero
  const LOTE = [-3.2, -3.6, 12.6, 14.2];
  const cesped = new THREE.Mesh(new THREE.PlaneGeometry(LOTE[2] - LOTE[0], LOTE[3] - LOTE[1]), mat('#5d8a5b', -1, { roughness: 1 }));
  cesped.rotation.x = -Math.PI / 2;
  cesped.position.set((LOTE[0] + LOTE[2]) / 2, -0.02, (LOTE[1] + LOTE[3]) / 2);
  cesped.receiveShadow = true;
  terreno.add(cesped);
  const lindero = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(LOTE[2] - LOTE[0], LOTE[3] - LOTE[1])), new THREE.LineBasicMaterial({ color: 0xffcf5c }));
  lindero.rotation.x = -Math.PI / 2;
  lindero.position.copy(cesped.position).setY(0);
  terreno.add(lindero);
  const rejilla = new THREE.GridHelper(40, 40, 0xf2f6fc, 0xf2f6fc);
  rejilla.material.transparent = true;
  rejilla.material.opacity = 0.12;
  rejilla.position.set(centro.x, -0.04, centro.z);
  terreno.add(rejilla);
  // vereda hasta la puerta de entrada (muro sur de la Entrada)
  const entrada = casa.rooms.find((r) => r.cuts.sur.some((c) => c[4] === 'entry'));
  if (entrada) {
    const c = entrada.cuts.sur.find((c) => c[4] === 'entry');
    const vx = entrada.x + c[0] + c[1] / 2;
    terreno.add(caja(1.4, 0.03, 4.6, mat('#c9c2b5', -1), vx, 0, entrada.z + entrada.l + entrada.t + 2.3, false));
  }
  // patio de piedra al norte, frente a la sala
  terreno.add(caja(5.2, 0.03, 2.2, mat('#b9b2a6', -1), centro.x - 0.6, 0, -1.25, false));
  // árboles
  const arbol = (x, z, s) => {
    const a = new THREE.Group();
    a.add(caja(0.18 * s, 1.2 * s, 0.18 * s, mat('#6d4c35', -1), 0, 0, 0));
    const copa = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95 * s, 0), mat('#3f7a4a', -1, { flatShading: true }));
    copa.position.y = 1.75 * s;
    copa.castShadow = true;
    a.add(copa);
    a.position.set(x, 0, z);
    return a;
  };
  [[-1.6, 12.2, 1.15], [11.3, 12.4, 1], [11.4, -2.2, 1.3], [-2.1, 1.4, 0.9]].forEach(([x, z, s], i) =>
    terreno.add(pieza(arbol(x, z, s), 0.15 + i * 0.12, 'brotar')));
  escena.add(terreno);

  // ---------- Muebles ----------
  const mueble = (tipo, w, d, h, color, lv) => {
    const g = new THREE.Group();
    const M = (c, e) => mat(c, lv, e);
    const base = M(color), oscuro = M(tono(color, -0.12)), claro = M(tono(color, 0.18));
    const blanco = M('#f4f2ee'), negro = M('#1f2328');
    const patas = (alto, grosor = 0.04, mm = oscuro) => {
      for (const sx of [-1, 1]) for (const sz of [-1, 1])
        g.add(caja(grosor, alto, grosor, mm, sx * (w / 2 - grosor), 0, sz * (d / 2 - grosor)));
    };
    switch (tipo) {
      case 'cama': {
        g.add(caja(w, h * 0.35, d, oscuro, 0, 0, 0));
        g.add(caja(w - 0.06, h * 0.22, d - 0.1, blanco, 0, h * 0.35, 0.03));
        g.add(caja(w, Math.max(h, 0.9), 0.08, base, 0, 0, -d / 2 + 0.04));
        g.add(caja(w - 0.1, 0.05, d * 0.55, base, 0, h * 0.57, d * 0.2));
        const almohadas = w > 1.2 ? [-w / 4, w / 4] : [0];
        almohadas.forEach((x) => g.add(caja(w / almohadas.length - 0.2, 0.12, 0.35, blanco, x, h * 0.57, -d / 2 + 0.32)));
        break;
      }
      case 'sillon': case 'sillon-1': {
        g.add(caja(w, h * 0.5, d, base, 0, 0, 0));
        g.add(caja(w, h, d * 0.25, oscuro, 0, 0, -d / 2 + d * 0.125));
        for (const s of [-1, 1]) g.add(caja(0.16, h * 0.68, d, oscuro, s * (w / 2 - 0.08), 0, 0));
        break;
      }
      case 'silla': case 'silla-oficina': {
        patas(0.45, 0.035);
        g.add(caja(w, 0.05, d, base, 0, 0.45, 0));
        g.add(caja(w, h - 0.45, 0.05, base, 0, 0.45, -d / 2 + 0.025));
        break;
      }
      case 'mesa': case 'mesa-centro': case 'escritorio': {
        patas(h - 0.04);
        g.add(caja(w, 0.04, d, base, 0, h - 0.04, 0));
        break;
      }
      case 'rack-tv': {
        g.add(caja(w, 0.5, d, base, 0, 0, 0));
        g.add(caja(w * 0.85, h - 0.6, 0.05, negro, 0, 0.6, -d / 2 + 0.08));
        break;
      }
      case 'cocina': case 'isla-cocina': {
        g.add(caja(w, h - 0.04, d, base, 0, 0, 0));
        g.add(caja(w + 0.02, 0.04, d + 0.02, M('#2e3238'), 0, h - 0.04, 0));
        break;
      }
      case 'refrigeradora': case 'ropero': case 'closet': case 'aparador': case 'estante': {
        g.add(caja(w, h, d, base, 0, 0, 0));
        g.add(caja(0.012, h * 0.9, 0.01, oscuro, 0, h * 0.05, d / 2 + 0.005, false));
        break;
      }
      case 'inodoro': {
        g.add(caja(w * 0.7, 0.4, d * 0.65, blanco, 0, 0, d * 0.12));
        g.add(caja(w, 0.75, d * 0.3, blanco, 0, 0, -d / 2 + d * 0.15));
        break;
      }
      case 'lavatorio': {
        g.add(caja(0.18, 0.75, 0.18, blanco, 0, 0, -d * 0.1));
        g.add(caja(w, 0.12, d, blanco, 0, 0.75, 0));
        break;
      }
      case 'tina': {
        g.add(caja(w, h, d, blanco, 0, 0, 0));
        g.add(caja(w - 0.16, 0.02, d - 0.16, M('#9cc8ff'), 0, h - 0.06, 0, false));
        break;
      }
      case 'ducha': {
        g.add(caja(w, 0.06, d, blanco, 0, 0, 0));
        g.add(caja(w, 1.9, 0.02, M('#cfe4ff', { transparent: true, opacity: 0.35 }), 0, 0.06, d / 2, false));
        break;
      }
      case 'planta': {
        g.add(caja(w * 0.55, h * 0.3, d * 0.55, M('#8a6a52'), 0, 0, 0));
        const hojas = new THREE.Mesh(new THREE.IcosahedronGeometry(Math.min(w, d) * 0.55, 0), M('#4f8a4f', { flatShading: true }));
        hojas.position.y = h * 0.62;
        hojas.castShadow = true;
        g.add(hojas);
        break;
      }
      case 'lampara-pie': {
        g.add(caja(0.28, 0.03, 0.28, negro, 0, 0, 0));
        g.add(caja(0.03, h - 0.3, 0.03, negro, 0, 0, 0));
        g.add(caja(w * 0.9, 0.3, d * 0.9, M('#fff1c9', { emissive: '#ffcf5c', emissiveIntensity: 0.6 }), 0, h - 0.3, 0, false));
        break;
      }
      case 'cuadro': {
        g.add(caja(w, Math.max(h, 0.5), Math.max(d, 0.03), base, 0, 1.25, 0));
        break;
      }
      case 'escalera': {
        const n = 14, paso = d / n, contra = h / n;
        for (let i = 0; i < n; i++)
          g.add(caja(w, contra * (i + 1), paso, i % 2 ? base : claro, 0, 0, -d / 2 + paso * (i + 0.5)));
        break;
      }
      default:
        g.add(caja(w, h, d, base, 0, 0, 0));
    }
    return g;
  };

  // ---------- Ambientes ----------
  const POCHE = '#24426e'; // cara superior del muro: el corte, como en un plano
  casa.rooms.forEach((R, i) => {
    const lv = R.lv, y0 = casa.elev[lv];
    if (!pisos.has(lv)) { const g = new THREE.Group(); g.userData.lv = lv; pisos.set(lv, g); escena.add(g); }
    const grupo = pisos.get(lv);
    const orden = casa.rooms.filter((r) => r.lv === lv).indexOf(R);
    const tNivel = lv * 1.45;
    const t = R.t;

    // losa bajo los pisos altos
    if (lv > 0) grupo.add(pieza(caja(R.w + 2 * t, casa.slab, R.l + 2 * t, mat('#c4cad3', lv), R.x + R.w / 2, y0 - casa.slab, R.z + R.l / 2), tNivel, 'crecer'));
    const suelo = caja(R.w, 0.03, R.l, mat(R.piso, lv), R.x + R.w / 2, y0, R.z + R.l / 2, false);
    suelo.userData.room = R;
    suelos.push(suelo);
    grupo.add(pieza(suelo, tNivel + orden * 0.05, 'extender'));

    // muros con sus vanos
    const muro = mat(R.pared, lv);
    const materialMuro = [muro, muro, mat(POCHE, lv), muro, muro, muro];
    const vidrio = mat('#9cc8ff', lv, { transparent: true, opacity: 0.32, roughness: 0.1 });
    for (const [lado, cortes] of Object.entries(R.cuts)) {
      const alongX = lado === 'norte' || lado === 'sur';
      const a0 = alongX ? -t : 0, a1 = alongX ? R.w + t : R.l;
      const fija = { norte: R.z - t / 2, sur: R.z + R.l + t / 2, oeste: R.x - t / 2, este: R.x + R.w + t / 2 }[lado];
      const seg = (s0, s1, y1, y2, m = materialMuro, grosor = t) => {
        if (s1 - s0 < 0.005 || y2 - y1 < 0.005) return;
        const largo = s1 - s0, mid = (s0 + s1) / 2;
        const [w, d, x, z] = alongX ? [largo, grosor, R.x + mid, fija] : [grosor, largo, fija, R.z + mid];
        const g = new THREE.BoxGeometry(w, y2 - y1, d);
        g.translate(0, (y2 - y1) / 2, 0);
        const malla = new THREE.Mesh(g, m);
        malla.position.set(x, y0 + y1, z);
        malla.castShadow = malla.receiveShadow = true;
        grupo.add(pieza(malla, tNivel + 0.3 + orden * 0.07 + y1 * 0.12, 'crecer'));
      };
      let cursor = a0;
      for (const [off, ancho, sill, alto, tipo] of [...cortes].sort((p, q) => p[0] - q[0])) {
        seg(cursor, off, 0, R.h);
        seg(off, off + ancho, 0, sill);
        seg(off, off + ancho, sill + alto, R.h);
        if (tipo === 'window') seg(off, off + ancho, sill, sill + alto, vidrio, 0.02);
        cursor = Math.max(cursor, off + ancho);
      }
      seg(cursor, a1, 0, R.h);
    }

    // muebles
    R.muebles.forEach(([tipo, x, z, rot, w, d, h, color], k) => {
      const m = mueble(tipo, w, d, h, color, lv);
      m.position.set(R.x + x, y0 + 0.03, R.z + z);
      m.rotation.y = (rot * Math.PI) / 180;
      grupo.add(pieza(m, tNivel + 0.8 + orden * 0.06 + k * 0.035, 'caer'));
    });

    // lista de ambientes
    const li = document.createElement('li');
    li.innerHTML = `<button type="button"><b>${R.n}</b><span>${R.w.toFixed(2)} × ${R.l.toFixed(2)} m</span></button>`;
    li.dataset.lv = lv;
    li.firstChild.addEventListener('mouseenter', () => resaltar(R));
    li.firstChild.addEventListener('mouseleave', () => resaltar(null));
    li.firstChild.addEventListener('focus', () => resaltar(R));
    li.firstChild.addEventListener('blur', () => resaltar(null));
    li.firstChild.addEventListener('click', () => { verPiso(String(lv)); resaltar(R); });
    R._li = li;
    items.push(li);
    void i;
  });
  if (lista) {
    for (const lv of niveles) {
      const h = document.createElement('li');
      h.className = 'visor3d-nivel';
      h.textContent = `Piso ${lv + 1}`;
      h.dataset.lv = lv;
      lista.appendChild(h);
      items.filter((li) => li.dataset.lv == lv).forEach((li) => lista.appendChild(li));
    }
  }

  // ---------- Techo ----------
  const b = casa.rooms.reduce((a, r) => [Math.min(a[0], r.x - r.t), Math.min(a[1], r.z - r.t), Math.max(a[2], r.x + r.w + r.t), Math.max(a[3], r.z + r.l + r.t)], [1e9, 1e9, -1e9, -1e9]);
  const altoTecho = casa.elev[nivelMax] + Math.max(...casa.rooms.filter((r) => r.lv === nivelMax).map((r) => r.h));
  const techo = new THREE.Group();
  techo.add(caja(b[2] - b[0] + 0.5, 0.2, b[3] - b[1] + 0.5, mat('#6b6f73', 99), (b[0] + b[2]) / 2, altoTecho, (b[1] + b[3]) / 2));
  const parapeto = mat('#e8e4dc', 99);
  techo.add(caja(b[2] - b[0] + 0.5, 0.45, 0.12, parapeto, (b[0] + b[2]) / 2, altoTecho + 0.2, b[1] - 0.19));
  techo.add(caja(b[2] - b[0] + 0.5, 0.45, 0.12, parapeto, (b[0] + b[2]) / 2, altoTecho + 0.2, b[3] + 0.19));
  techo.add(caja(0.12, 0.45, b[3] - b[1] + 0.5, parapeto, b[0] - 0.19, altoTecho + 0.2, (b[1] + b[3]) / 2));
  techo.add(caja(0.12, 0.45, b[3] - b[1] + 0.5, parapeto, b[2] + 0.19, altoTecho + 0.2, (b[1] + b[3]) / 2));
  techo.visible = false;
  escena.add(techo);

  // ---------- Cotas en 3D (ámbar, como en la aplicación) ----------
  const cotas = [];
  const linea = new THREE.LineBasicMaterial({ color: 0xffcf5c, transparent: true, opacity: 0.95 });
  const cota = (p0, p1, desfase, texto) => {
    const a = p0.clone().add(desfase), c = p1.clone().add(desfase);
    const pts = [p0, a, a, c, c, p1];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const l = new THREE.LineSegments(geo, linea);
    escena.add(l);
    const et = document.createElement('span');
    et.className = 'visor3d-cota';
    et.textContent = texto;
    raiz.querySelector('.visor3d-escenario').appendChild(et);
    cotas.push({ l, et, pos: a.clone().add(c).multiplyScalar(0.5) });
  };
  cota(new THREE.Vector3(b[0], 0.02, b[3]), new THREE.Vector3(b[2], 0.02, b[3]), new THREE.Vector3(0, 0, 1.4), `${(b[2] - b[0]).toFixed(2)} m`);
  cota(new THREE.Vector3(b[2], 0.02, b[1]), new THREE.Vector3(b[2], 0.02, b[3]), new THREE.Vector3(1.4, 0, 0), `${(b[3] - b[1]).toFixed(2)} m`);
  cotas.forEach((c) => (c.l.visible = false, c.et.hidden = true));

  // ---------- Pisos visibles ----------
  let vista = 'todo';
  const botones = raiz.querySelectorAll('[data-vista]');
  function verPiso(v) {
    vista = v;
    botones.forEach((bt) => bt.setAttribute('aria-pressed', String(bt.dataset.vista === v)));
    for (const [lv, g] of pisos) {
      const fantasma = v !== 'todo' && Number(v) > lv;
      g.visible = v === 'todo' || Number(v) >= lv;
      for (const m of cache.values()) {
        if (m.userData.lv !== lv) continue;
        m.transparent = fantasma || m.userData.opacidad < 1;
        m.opacity = fantasma ? 0.14 : m.userData.opacidad;
        m.depthWrite = !fantasma;
        m.needsUpdate = true;
      }
      g.traverse((o) => { if (o.isMesh) o.castShadow = !fantasma; });
    }
    techo.visible = v === 'todo' && techoActivo;
    items.forEach((li) => li.classList.toggle('apagado', v !== 'todo' && li.dataset.lv !== v));
    const y = v === 'todo' ? 2.4 : casa.elev[Number(v)] + 1.2;
    objetivoY = y;
  }
  let objetivoY = centro.y;
  botones.forEach((bt) => bt.addEventListener('click', () => verPiso(bt.dataset.vista)));

  let techoActivo = false;
  const btTecho = raiz.querySelector('[data-techo]');
  btTecho?.addEventListener('click', () => {
    techoActivo = !techoActivo;
    btTecho.setAttribute('aria-pressed', String(techoActivo));
    if (techoActivo && vista !== 'todo') verPiso('todo');
    techo.visible = techoActivo;
  });
  const btGirar = raiz.querySelector('[data-girar]');
  btGirar?.setAttribute('aria-pressed', String(controles.autoRotate));
  btGirar?.addEventListener('click', () => {
    controles.autoRotate = !controles.autoRotate;
    btGirar.setAttribute('aria-pressed', String(controles.autoRotate));
  });
  controles.addEventListener('start', () => {
    if (controles.autoRotate) { controles.autoRotate = false; btGirar?.setAttribute('aria-pressed', 'false'); }
  });

  // ---------- Resaltar un ambiente ----------
  const marca = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: 0xffcf5c, transparent: true, opacity: 0.38, depthWrite: false }));
  marca.rotation.x = -Math.PI / 2;
  marca.visible = false;
  escena.add(marca);
  const borde = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1)), new THREE.LineBasicMaterial({ color: 0xffcf5c }));
  borde.rotation.x = -Math.PI / 2;
  escena.add(borde);
  borde.visible = false;
  let actual = null;
  function resaltar(R) {
    actual = R;
    items.forEach((li) => li.classList.remove('activo'));
    if (!R) { marca.visible = borde.visible = false; return; }
    R._li?.classList.add('activo');
    for (const o of [marca, borde]) {
      o.visible = true;
      o.scale.set(R.w, R.l, 1);
      o.position.set(R.x + R.w / 2, casa.elev[R.lv] + 0.045, R.z + R.l / 2);
    }
  }

  // puntero sobre el piso de cada ambiente
  const rayo = new THREE.Raycaster();
  const puntero = new THREE.Vector2();
  renderer.domElement.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    const r = renderer.domElement.getBoundingClientRect();
    puntero.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    rayo.setFromCamera(puntero, camara);
    const visibles = suelos.filter((s) => s.parent.visible && s.material.opacity > 0.5);
    const hit = rayo.intersectObjects(visibles, false)[0];
    const R = hit?.object.userData.room ?? null;
    if (R !== actual) resaltar(R);
    if (R) {
      tip.hidden = false;
      tip.innerHTML = `<b>${R.n}</b><span>${R.w.toFixed(2)} m × ${R.l.toFixed(2)} m = ${(R.w * R.l).toFixed(2)} m²</span><small>Piso ${R.lv + 1}, ${R.muebles.length} ${R.muebles.length === 1 ? 'mueble' : 'muebles'}</small>`;
      tip.style.transform = `translate(${e.clientX - r.left + 16}px, ${e.clientY - r.top + 16}px)`;
    } else tip.hidden = true;
  });
  renderer.domElement.addEventListener('pointerleave', () => { tip.hidden = true; resaltar(null); });

  // ---------- Armado animado ----------
  const ease = (x) => 1 - Math.pow(1 - x, 3);
  const rebote = (x) => { const c = 1.6; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  piezas.forEach((p) => { p.userData.y = p.position.y; });
  const DUR = { crecer: 0.55, extender: 0.5, caer: 0.5, brotar: 0.7 };
  const fin = Math.max(...piezas.map((p) => p.userData.armar.t0 + DUR[p.userData.armar.modo]));
  let inicio = null, armado = quieto;
  function aplicarArmado(t) {
    for (const p of piezas) {
      const { t0, modo } = p.userData.armar;
      const x = Math.min(1, Math.max(0, (t - t0) / DUR[modo]));
      p.visible = x > 0;
      if (modo === 'crecer') p.scale.y = Math.max(0.001, ease(x));
      else if (modo === 'extender') { const s = Math.max(0.001, ease(x)); p.scale.set(s, 1, s); }
      else if (modo === 'brotar') p.scale.setScalar(Math.max(0.001, rebote(x)));
      else { p.position.y = p.userData.y + (1 - ease(x)) * 1.2; p.scale.setScalar(Math.max(0.001, ease(x))); }
    }
  }
  if (!quieto) aplicarArmado(0); else mostrarCotas();
  function mostrarCotas() { cotas.forEach((c) => { c.l.visible = true; c.et.hidden = false; }); raiz.classList.add('armado'); }

  // ---------- Tamaño y bucle ----------
  // La cámara se aleja lo justo para que la casa y el lote entren en el visor (también en el móvil).
  let tocado = false;
  controles.addEventListener('start', () => { tocado = true; });
  const direccion = camara.position.clone().sub(centro).normalize();
  function encuadrar() {
    const radio = 8.6;
    const vfov = THREE.MathUtils.degToRad(camara.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * camara.aspect);
    const dist = radio / Math.sin(Math.min(vfov, hfov) / 2);
    camara.position.copy(controles.target).addScaledVector(direccion, Math.min(dist, controles.maxDistance));
  }
  const escenario = raiz.querySelector('.visor3d-escenario');
  const ajustar = () => {
    const { width, height } = escenario.getBoundingClientRect();
    renderer.setSize(width, height, false);
    camara.aspect = width / height;
    camara.updateProjectionMatrix();
    if (!tocado) encuadrar();
  };
  new ResizeObserver(ajustar).observe(escenario);
  ajustar();

  let visible = false, raf = 0;
  const v = new THREE.Vector3();
  function cuadro(ms) {
    raf = requestAnimationFrame(cuadro);
    if (!armado) {
      if (inicio === null) inicio = ms;
      const t = (ms - inicio) / 1000;
      aplicarArmado(t);
      if (t > fin) { armado = true; mostrarCotas(); }
    }
    controles.target.y += (objetivoY - controles.target.y) * 0.08;
    controles.update();
    renderer.render(escena, camara);
    const { width, height } = escenario.getBoundingClientRect();
    for (const c of cotas) {
      if (c.et.hidden) continue;
      v.copy(c.pos).project(camara);
      c.et.style.transform = `translate(-50%, -50%) translate(${(v.x * 0.5 + 0.5) * width}px, ${(-v.y * 0.5 + 0.5) * height}px)`;
    }
  }
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(cuadro);
    if (!visible && raf) { cancelAnimationFrame(raf); raf = 0; }
  }, { threshold: 0.05 }).observe(escenario);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && raf) { cancelAnimationFrame(raf); raf = 0; }
    else if (!document.hidden && visible && !raf) raf = requestAnimationFrame(cuadro);
  });

  raiz.classList.add('listo');
  raiz.querySelector('[data-repetir]')?.addEventListener('click', () => {
    if (quieto) return;
    verPiso('todo');
    armado = false; inicio = null;
    cotas.forEach((c) => { c.l.visible = false; c.et.hidden = true; });
  });
}
