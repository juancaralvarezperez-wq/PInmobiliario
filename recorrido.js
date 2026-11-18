import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

const escenario = document.getElementById('escenario');
const pantallaInicio = document.getElementById('pantallaInicio');
const botonIniciar = document.getElementById('iniciar');
const aviso = document.getElementById('aviso');
const error = document.getElementById('error');

const params = new URLSearchParams(window.location.search);
const propiedad = params.get('propiedad') || 'residencia';
const nombres = {
  residencia: 'Residencia moderna · Ciudad de México',
  guadalajara: 'Casa en venta · Guadalajara',
  pachuca: 'Propiedad en renta · Pachuca'
};
document.getElementById('nombrePropiedad').textContent = nombres[propiedad] || 'Recorrido virtual';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc7d9e8);
scene.fog = new THREE.Fog(0xc7d9e8, 18, 45);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.65, 7);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
escenario.prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xffffff, 0x7b8790, 2.0));
const sol = new THREE.DirectionalLight(0xffffff, 2.2);
sol.position.set(-5, 10, 7);
sol.castShadow = true;
scene.add(sol);

const controls = new PointerLockControls(camera, renderer.domElement);
controls.pointerSpeed = 0.7;

const materiales = {
  piso: new THREE.MeshStandardMaterial({ color: 0xb38b61, roughness: 0.85 }),
  pared: new THREE.MeshStandardMaterial({ color: 0xf0e9dc, roughness: 0.95 }),
  paredOscura: new THREE.MeshStandardMaterial({ color: 0x9daeb5, roughness: 0.9 }),
  madera: new THREE.MeshStandardMaterial({ color: 0x68452f, roughness: 0.75 }),
  sofa: new THREE.MeshStandardMaterial({ color: 0x526b68, roughness: 0.95 }),
  tela: new THREE.MeshStandardMaterial({ color: 0xd8c8ae, roughness: 0.95 }),
  vidrio: new THREE.MeshStandardMaterial({ color: 0x8dc5df, metalness: 0.1, roughness: 0.2 }),
  blanco: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }),
  negro: new THREE.MeshStandardMaterial({ color: 0x242a2c, roughness: 0.6 })
};

const colisiones = [];
function caja(w, h, d, x, y, z, material, colision = false) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  scene.add(mesh);
  if (colision) colisiones.push({ minX: x-w/2, maxX: x+w/2, minZ: z-d/2, maxZ: z+d/2 });
  return mesh;
}

// Casa de demostración: planta abierta con sala, cocina y dos habitaciones.
// Medidas aproximadas en unidades 3D.
caja(18, 0.2, 14, 0, -0.12, 0, materiales.piso);
caja(18, 0.25, 14, 0, 3.1, 0, materiales.blanco); // techo alto
// Paredes exteriores con entrada abierta al frente
caja(18, 3.1, 0.25, 0, 1.45, -7, materiales.pared, true);
caja(0.25, 3.1, 14, -9, 1.45, 0, materiales.pared, true);
caja(0.25, 3.1, 14, 9, 1.45, 0, materiales.pared, true);
caja(5.8, 3.1, 0.25, -6.1, 1.45, 7, materiales.pared, true);
caja(5.8, 3.1, 0.25, 6.1, 1.45, 7, materiales.pared, true);
// Paredes interiores separan habitaciones dejando huecos de paso
caja(0.18, 2.8, 8.8, -2.2, 1.35, -2.3, materiales.paredOscura, true);
caja(0.18, 2.8, 3.0, -2.2, 1.35, 5.5, materiales.paredOscura, true);
caja(6.0, 2.8, 0.18, 4.8, 1.35, 1.0, materiales.pared, true);
caja(0.18, 2.8, 4.5, 2.0, 1.35, -4.7, materiales.pared, true);

// Ventanas visuales en la pared trasera
caja(3.2, 1.2, 0.06, -5.5, 1.9, -6.84, materiales.vidrio);
caja(2.5, 1.2, 0.06, 5.4, 1.9, -6.84, materiales.vidrio);

// Sala: sofá, mesa, alfombra y lámpara
caja(3.4, 0.75, 1.0, 4.6, 0.55, 4.2, materiales.sofa);
caja(3.4, 0.45, 0.25, 4.6, 0.95, 4.55, materiales.sofa);
caja(0.25, 0.5, 1.0, 2.95, 0.65, 4.2, materiales.sofa);
caja(0.25, 0.5, 1.0, 6.25, 0.65, 4.2, materiales.sofa);
caja(2.0, 0.18, 1.0, 4.5, 0.42, 2.3, materiales.madera);
caja(2.3, 0.04, 1.3, 4.5, 0.12, 2.3, materiales.tela);
caja(0.08, 0.8, 0.08, 3.7, 0.0, 2.0, materiales.negro);
caja(0.08, 0.8, 0.08, 5.3, 0.0, 2.0, materiales.negro);
// Cocina
caja(3.4, 0.9, 0.7, 5.7, 0.5, -4.9, materiales.blanco);
caja(3.4, 0.08, 0.75, 5.7, 0.98, -4.9, materiales.negro);
caja(0.9, 0.9, 0.7, 7.5, 0.5, -4.0, materiales.madera);
// Isla
caja(2.1, 0.9, 0.9, 4.0, 0.5, -2.8, materiales.madera);
caja(2.2, 0.08, 1.0, 4.0, 0.98, -2.8, materiales.blanco);
// Habitación izquierda
caja(2.6, 0.45, 3.0, -5.5, 0.35, -3.7, materiales.madera);
caja(2.5, 0.18, 2.8, -5.5, 0.65, -3.7, materiales.tela);
caja(2.6, 0.7, 0.25, -5.5, 0.95, -5.05, materiales.blanco);
caja(1.1, 0.18, 0.6, -6.2, 0.82, -5.7, materiales.blanco);
caja(1.1, 0.18, 0.6, -4.8, 0.82, -5.7, materiales.blanco);
// Habitación frontal izquierda / decoración
caja(1.6, 0.7, 0.65, -5.4, 0.4, 3.8, materiales.madera);
caja(1.5, 0.06, 0.6, -5.4, 0.78, 3.8, materiales.blanco);

// Exterior simple visible desde la entrada
caja(30, 0.1, 24, 0, -0.3, 0, new THREE.MeshStandardMaterial({ color: 0x7b9b70, roughness: 1 }));
// Reponer suelo interior por encima del terreno exterior
caja(18, 0.12, 14, 0, -0.08, 0, materiales.piso);

// Luz decorativa
const point = new THREE.PointLight(0xffe0b2, 18, 9);
point.position.set(4.5, 2.6, 3.0);
scene.add(point);

// Movimiento y colisiones básicas contra paredes/cajas marcadas
const teclas = { w: false, a: false, s: false, d: false };
const velocidad = 3.2;
const radio = 0.28;

function choca(x, z) {
  for (const c of colisiones) {
    if (x + radio > c.minX && x - radio < c.maxX &&
        z + radio > c.minZ && z - radio < c.maxZ) return true;
  }
  return false;
}
window.addEventListener('keydown', e => {
  const k = e.key.toLowerCase();
  if (k in teclas) teclas[k] = true;
});
window.addEventListener('keyup', e => {
  const k = e.key.toLowerCase();
  if (e.key.toLowerCase() in teclas) teclas[e.key.toLowerCase()] = false;
});
botonIniciar.addEventListener('click', () => controls.lock());
controls.addEventListener('lock', () => { pantallaInicio.style.display = 'none'; aviso.style.display = 'none'; });
controls.addEventListener('unlock', () => { pantallaInicio.style.display = 'block'; });

const reloj = new THREE.Clock();
function animar() {
  requestAnimationFrame(animar);
  const dt = Math.min(reloj.getDelta(), 0.05);
  if (controls.isLocked) {
    const adelante = Number(teclas.w) - Number(teclas.s);
    const lado = Number(teclas.d) - Number(teclas.a);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    dir.y = 0;
    dir.normalize();
    const derecha = new THREE.Vector3().crossVectors(dir, camera.up).negate().normalize();
    let nx = camera.position.x + (dir.x * adelante + derecha.x * lado) * velocidad * dt;
    let nz = camera.position.z + (dir.z * adelante + derecha.z * lado) * velocidad * dt;
    nx = THREE.MathUtils.clamp(nx, -8.35, 8.35);
    nz = THREE.MathUtils.clamp(nz, -6.35, 6.35);
    if (!choca(nx, camera.position.z)) camera.position.x = nx;
    if (!choca(camera.position.x, nz)) camera.position.z = nz;
    camera.position.y = 1.65;
  }
  renderer.render(scene, camera);
}
animar();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

aviso.style.display = 'none';
