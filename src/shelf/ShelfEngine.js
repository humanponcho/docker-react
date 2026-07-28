// ShelfEngine — the Three.js core of The Complete Shelf.
//
// A warm editorial library: clothbound hardcovers stand spine-out along a continuous
// walnut shelf against cream paper. Browse the shelf (drag / wheel / arrow keys /
// buttons / position markers); pull the selected book forward into an orbit / pan /
// zoom inspection view.
//
// Design notes
// ------------
// * Books are plain THREE.Mesh boxes with per-face materials (front cover, spine,
//   boards, pages). Textures are procedural (see covers.js) unless a Mint manifest
//   overrides them (see mintManifest.js).
// * There is one camera. A `camBlend` value in [0,1] eases the whole view between the
//   fixed browse pose and the orbit inspection pose, so pulling a book forward is a
//   single continuous motion.
// * `prefers-reduced-motion` collapses every easing to an instant snap.

import * as THREE from 'three';
import { CATALOG } from './catalog';
import {
  makeFrontCover,
  makeSpine,
  makeBoards,
  makePages,
} from './covers';
import { loadMintManifest, loadTexture } from './mintManifest';

// ---- world constants -----------------------------------------------------------------

const SHELF_TOP_Y = -1.0; // books stand on this height
const BOOK_GAP = 0.055; // spacing between spines along X
const BROWSE_CAM = new THREE.Vector3(0, 0.05, 4.9);
const BROWSE_LOOK = new THREE.Vector3(0, -0.08, 0);
const INSPECT_ANCHOR = new THREE.Vector3(0, -0.05, 1.5); // where a book floats to
const DRAG_THRESHOLD = 6; // px before a press counts as a drag, not a click

// Face material order for BoxGeometry: [+X, -X, +Y, -Y, +Z, -Z]
//   +X front cover · -X back boards · ±Y pages · +Z spine · -Z fore-edge pages

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const lerp = (a, b, t) => a + (b - a) * t;

export default class ShelfEngine {
  constructor(canvas, { onChange, reducedMotion = false } = {}) {
    this.canvas = canvas;
    this.onChange = onChange || (() => {});
    this.reducedMotion = reducedMotion;

    this.mode = 'browse'; // 'browse' | 'inspect'
    this.selectedIndex = 0;
    this.books = [];

    // browse scrolling
    this.scrollX = 0;
    this.targetScrollX = 0;
    this.dragging = false;
    this.dragMoved = false;

    // inspection orbit state
    this.orbit = { radius: 3.0, theta: 0, phi: Math.PI / 2 };
    this.pan = new THREE.Vector3();
    this.camBlend = 0; // 0 = browse, 1 = inspect

    this._pointer = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
    this._clock = new THREE.Clock();
    this._disposables = [];
    this._running = true;

    this._initRenderer();
    this._initScene();
    this._buildEnvironment();
    this._buildBooks();
    this._bindEvents();

    this._layoutSlots();
    this.selectIndex(0, true);
    this._loadMintOverrides(); // async, non-blocking

    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);
    this._emit();
  }

  // ---- setup -------------------------------------------------------------------------

  _initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer = renderer;
  }

  _initScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#efe7d8'); // cream paper
    scene.fog = new THREE.Fog('#efe7d8', 14, 30);
    this.scene = scene;

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.copy(BROWSE_CAM);
    camera.lookAt(BROWSE_LOOK);
    this.camera = camera;
    this._resize();
  }

  _buildEnvironment() {
    // Warm lighting: cream hemisphere + walnut bounce, a soft key, and a spot that
    // rises during inspection to pool light on the pulled-forward book.
    this.hemi = new THREE.HemisphereLight('#fff6e6', '#6b5238', 1.0);
    this.scene.add(this.hemi);

    this.ambient = new THREE.AmbientLight('#fbeecf', 0.5);
    this.scene.add(this.ambient);

    const key = new THREE.DirectionalLight('#ffe9c7', 1.15);
    key.position.set(-3.2, 4.5, 5.5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -6;
    key.shadow.camera.right = 6;
    key.shadow.camera.top = 5;
    key.shadow.camera.bottom = -3;
    key.shadow.bias = -0.0004;
    key.shadow.radius = 4;
    this.scene.add(key);
    this.key = key;

    const fill = new THREE.DirectionalLight('#d9e4ff', 0.25);
    fill.position.set(4, 2, 3);
    this.scene.add(fill);

    this.inspectSpot = new THREE.SpotLight('#fff2d8', 0, 12, Math.PI / 7, 0.5, 1.2);
    this.inspectSpot.position.set(0, 3.2, 4.2);
    this.inspectSpot.target.position.copy(INSPECT_ANCHOR);
    this.scene.add(this.inspectSpot);
    this.scene.add(this.inspectSpot.target);

    // Cream paper backdrop — flat and bright (unshaded) for an airy editorial page.
    const wallMat = new THREE.MeshBasicMaterial({ color: '#efe7d8' });
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), wallMat);
    wall.position.set(0, 3, -3.4);
    this.scene.add(wall);
    this._track(wall.geometry, wallMat);

    // Walnut shelf: a single board the books stand on, plus a low back lip for depth.
    const walnut = new THREE.MeshStandardMaterial({
      map: this._makeWoodTexture(),
      color: '#7a5230',
      roughness: 0.6,
      metalness: 0.04,
    });
    this.walnut = walnut;

    const board = new THREE.Mesh(new THREE.BoxGeometry(80, 0.36, 2.4), walnut);
    board.position.set(0, SHELF_TOP_Y - 0.18, -0.2);
    board.castShadow = true;
    board.receiveShadow = true;
    this.scene.add(board);
    this._track(board.geometry);

    const lip = new THREE.Mesh(new THREE.BoxGeometry(80, 0.7, 0.16), walnut);
    lip.position.set(0, SHELF_TOP_Y + 0.35, -1.05);
    lip.receiveShadow = true;
    this.scene.add(lip);
    this._track(lip.geometry);
  }

  _makeWoodTexture() {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#6f4a2b';
    ctx.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 90; i++) {
      const y = Math.random() * 128;
      ctx.strokeStyle = `rgba(${40 + Math.random() * 40}, ${25 + Math.random() * 25}, 12, ${
        0.08 + Math.random() * 0.12
      })`;
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(170, y + (Math.random() - 0.5) * 8, 340, y + (Math.random() - 0.5) * 8, 512, y);
      ctx.stroke();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(8, 1);
    this._disposables.push(tex);
    return tex;
  }

  _buildBooks() {
    const pages = makePages(this.renderer);
    this._disposables.push(pages);
    const pageMat = new THREE.MeshStandardMaterial({ map: pages, roughness: 0.9 });
    this._track(null, pageMat);

    CATALOG.forEach((data, index) => {
      const front = makeFrontCover(data, this.renderer);
      const spine = makeSpine(data, this.renderer);
      const boards = makeBoards(data, this.renderer);
      this._disposables.push(front, spine, boards);

      const frontMat = new THREE.MeshStandardMaterial({ map: front, roughness: 0.78 });
      const spineMat = new THREE.MeshStandardMaterial({ map: spine, roughness: 0.78 });
      const boardsMat = new THREE.MeshStandardMaterial({ map: boards, roughness: 0.8 });
      this._track(null, frontMat, spineMat, boardsMat);

      const materials = [frontMat, boardsMat, pageMat, pageMat, spineMat, pageMat];
      const geo = new THREE.BoxGeometry(data.width, data.height, data.depth);
      this._track(geo);

      const mesh = new THREE.Mesh(geo, materials);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.index = index;

      this.scene.add(mesh);
      this.books.push({ data, mesh, frontMat, spineMat, index, slotX: 0, offset: 0 });
    });
  }

  _layoutSlots() {
    let x = 0;
    this.books.forEach((b) => {
      x += b.data.width / 2;
      b.slotX = x;
      x += b.data.width / 2 + BOOK_GAP;
    });
    this.shelfSpan = x;
  }

  async _loadMintOverrides() {
    const manifest = await loadMintManifest();
    if (!manifest || !Object.keys(manifest).length) return;
    const loader = new THREE.TextureLoader();
    for (const b of this.books) {
      const entry = manifest[b.data.id];
      if (!entry) continue;
      if (entry.front) {
        try {
          const tex = await loadTexture(loader, entry.front, this.renderer);
          b.frontMat.map = tex;
          b.frontMat.needsUpdate = true;
          this._disposables.push(tex);
        } catch (_) {
          /* keep procedural cover */
        }
      }
      if (entry.spine) {
        try {
          const tex = await loadTexture(loader, entry.spine, this.renderer);
          b.spineMat.map = tex;
          b.spineMat.needsUpdate = true;
          this._disposables.push(tex);
        } catch (_) {
          /* keep procedural spine */
        }
      }
    }
  }

  // ---- public API (called by React) --------------------------------------------------

  next() {
    if (this.mode !== 'browse') return;
    this.selectIndex(Math.min(this.selectedIndex + 1, this.books.length - 1));
  }

  prev() {
    if (this.mode !== 'browse') return;
    this.selectIndex(Math.max(this.selectedIndex - 1, 0));
  }

  selectIndex(i, instant = false) {
    this.selectedIndex = clamp(i, 0, this.books.length - 1);
    this.targetScrollX = this.books[this.selectedIndex].slotX;
    if (instant || this.reducedMotion) this.scrollX = this.targetScrollX;
    this._emit();
  }

  inspect() {
    if (this.mode === 'inspect') return;
    this.mode = 'inspect';
    this.targetScrollX = this.books[this.selectedIndex].slotX; // centre it
    this.resetView(true);
    this._emit();
  }

  closeInspect() {
    if (this.mode === 'browse') return;
    this.mode = 'browse';
    this._emit();
  }

  toggleInspect() {
    this.mode === 'inspect' ? this.closeInspect() : this.inspect();
  }

  zoom(delta) {
    // delta > 0 zooms in.
    this.orbit.radius = clamp(this.orbit.radius - delta * 0.5, 1.5, 6);
  }

  resetView(instant = false) {
    this.orbit.radius = 3.0;
    this.orbit.theta = 0;
    this.orbit.phi = Math.PI / 2;
    this.pan.set(0, 0, 0);
    if (instant) {
      // snap orbit only; camBlend still eases in unless reduced motion
    }
  }

  setReducedMotion(v) {
    this.reducedMotion = v;
  }

  getMode() {
    return this.mode;
  }

  // ---- events ------------------------------------------------------------------------

  _bindEvents() {
    this._onDown = this._pointerDown.bind(this);
    this._onMove = this._pointerMove.bind(this);
    this._onUp = this._pointerUp.bind(this);
    this._onWheel = this._wheel.bind(this);
    this._onKey = this._key.bind(this);
    this._onResize = this._resize.bind(this);
    this._onContext = (e) => e.preventDefault();

    this.canvas.addEventListener('pointerdown', this._onDown);
    window.addEventListener('pointermove', this._onMove);
    window.addEventListener('pointerup', this._onUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    this.canvas.addEventListener('contextmenu', this._onContext);
    window.addEventListener('keydown', this._onKey);
    window.addEventListener('resize', this._onResize);
  }

  _pointerDown(e) {
    this.dragging = true;
    this.dragMoved = false;
    this._downX = e.clientX;
    this._downY = e.clientY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    this._downScroll = this.scrollX;
    this._rightBtn = e.button === 2 || e.shiftKey;
    this.canvas.setPointerCapture?.(e.pointerId);
  }

  _pointerMove(e) {
    if (!this.dragging) return;
    const dx = e.clientX - this._lastX;
    const dy = e.clientY - this._lastY;
    this._lastX = e.clientX;
    this._lastY = e.clientY;
    if (Math.hypot(e.clientX - this._downX, e.clientY - this._downY) > DRAG_THRESHOLD) {
      this.dragMoved = true;
    }

    if (this.mode === 'browse') {
      // Drag scrubs the shelf. Screen-right → shelf moves right → earlier books.
      const worldPerPx = this._worldPerPixel();
      this.scrollX = this._downScroll - (e.clientX - this._downX) * worldPerPx;
      this.scrollX = clamp(this.scrollX, this.books[0].slotX, this.books[this.books.length - 1].slotX);
      this.targetScrollX = this.scrollX;
    } else if (this._rightBtn) {
      // Pan.
      const s = this.orbit.radius * 0.0016;
      const right = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(this.camera.matrixWorld, 1);
      this.pan.addScaledVector(right, -dx * s);
      this.pan.addScaledVector(up, dy * s);
    } else {
      // Orbit.
      this.orbit.theta -= dx * 0.008;
      this.orbit.phi = clamp(this.orbit.phi - dy * 0.008, 0.2, Math.PI - 0.2);
    }
  }

  _pointerUp(e) {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.mode === 'browse') {
      if (this.dragMoved) {
        this._snapToNearest();
      } else {
        this._clickSelect(e);
      }
    }
  }

  _snapToNearest() {
    let best = 0;
    let bestD = Infinity;
    this.books.forEach((b, i) => {
      const d = Math.abs(b.slotX - this.scrollX);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    this.selectIndex(best);
  }

  _clickSelect(e) {
    const hit = this._raycastBook(e);
    if (hit == null) return;
    if (hit === this.selectedIndex) {
      this.inspect(); // click the centred book → open it
    } else {
      this.selectIndex(hit);
    }
  }

  _raycastBook(e) {
    const rect = this.canvas.getBoundingClientRect();
    this._pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this._pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._pointer, this.camera);
    const meshes = this.books.map((b) => b.mesh);
    const hits = this._raycaster.intersectObjects(meshes, false);
    return hits.length ? hits[0].object.userData.index : null;
  }

  _wheel(e) {
    e.preventDefault();
    if (this.mode === 'inspect') {
      this.zoom(-Math.sign(e.deltaY) * 0.5);
    } else {
      const worldPerPx = this._worldPerPixel();
      const amount = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * worldPerPx;
      this.scrollX = clamp(
        this.scrollX + amount,
        this.books[0].slotX,
        this.books[this.books.length - 1].slotX,
      );
      this.targetScrollX = this.scrollX;
      clearTimeout(this._wheelIdle);
      this._wheelIdle = setTimeout(() => this._snapToNearest(), 140);
    }
  }

  _key(e) {
    if (this.mode === 'browse') {
      if (e.key === 'ArrowRight') {
        this.next();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        this.prev();
        e.preventDefault();
      } else if (e.key === 'ArrowUp' || e.key === 'Enter') {
        this.inspect();
        e.preventDefault();
      }
    } else {
      if (e.key === 'Escape' || e.key === 'ArrowDown') {
        this.closeInspect();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft') {
        this.orbit.theta += 0.12;
      } else if (e.key === 'ArrowRight') {
        this.orbit.theta -= 0.12;
      } else if (e.key === 'ArrowUp') {
        this.orbit.phi = clamp(this.orbit.phi - 0.1, 0.2, Math.PI - 0.2);
      } else if (e.key === '+' || e.key === '=') {
        this.zoom(0.6);
      } else if (e.key === '-' || e.key === '_') {
        this.zoom(-0.6);
      }
    }
  }

  _worldPerPixel() {
    // world units per screen pixel at the shelf plane (z≈0).
    const dist = this.camera.position.z;
    const vh = 2 * Math.tan((this.camera.fov * Math.PI) / 360) * dist;
    return vh / this.canvas.clientHeight;
  }

  // ---- frame loop --------------------------------------------------------------------

  _animate() {
    if (!this._running) return;
    const dt = Math.min(this._clock.getDelta(), 0.05);
    const ease = this.reducedMotion ? 1 : 1 - Math.pow(0.0015, dt); // frame-rate independent

    // scroll toward target
    this.scrollX = lerp(this.scrollX, this.targetScrollX, ease);

    // camBlend toward mode
    const blendTarget = this.mode === 'inspect' ? 1 : 0;
    this.camBlend = this.reducedMotion ? blendTarget : lerp(this.camBlend, blendTarget, ease);
    if (Math.abs(this.camBlend - blendTarget) < 0.001) this.camBlend = blendTarget;

    this._updateBooks(dt);
    this._updateCamera();
    this._updateLights();

    this.renderer.render(this.scene, this.camera);
    this._raf = requestAnimationFrame(this._animate);
  }

  _updateBooks(dt) {
    const t = performance.now() / 1000;
    this.books.forEach((b) => {
      const homeX = b.slotX - this.scrollX;
      const isSel = b.index === this.selectedIndex;
      const centered = clamp(1 - Math.abs(homeX) / 0.5, 0, 1); // 1 when near centre

      // Selected book blends from its shelf slot to the inspection anchor.
      const blend = isSel ? this.camBlend : 0;

      // Browse-time forward nudge for the centred book (spine peeks out).
      const nudgeZ = isSel ? centered * 0.22 : 0;
      const nudgeY = isSel ? centered * 0.03 : 0;

      const slotY = SHELF_TOP_Y + b.data.height / 2;
      const bx = lerp(homeX, INSPECT_ANCHOR.x, blend);
      const by = lerp(slotY + nudgeY, INSPECT_ANCHOR.y, blend);
      const bz = lerp(nudgeZ, INSPECT_ANCHOR.z, blend);

      b.mesh.position.set(bx, by, bz);
      // Rotate from spine-out (0) to cover-out (-90°) as it comes forward.
      let ry = lerp(0, -Math.PI / 2, blend);
      if (isSel && this.mode === 'inspect' && this.camBlend > 0.98 && !this.reducedMotion) {
        ry += Math.sin(t * 0.6) * 0.04; // gentle idle sway while inspecting
      }
      b.mesh.rotation.y = ry;

      // Non-selected books recede slightly while inspecting.
      if (!isSel) {
        b.mesh.position.z -= this.camBlend * 0.25;
      }
      b.mesh.visible = true;
    });
  }

  _updateCamera() {
    // Browse pose.
    const browsePos = BROWSE_CAM;
    const browseLook = BROWSE_LOOK;

    // Inspect pose from spherical orbit around (anchor + pan).
    const target = INSPECT_ANCHOR.clone().add(this.pan);
    const { radius, theta, phi } = this.orbit;
    const inspectPos = new THREE.Vector3(
      target.x + radius * Math.sin(phi) * Math.sin(theta),
      target.y + radius * Math.cos(phi),
      target.z + radius * Math.sin(phi) * Math.cos(theta),
    );

    const b = this.camBlend;
    this.camera.position.set(
      lerp(browsePos.x, inspectPos.x, b),
      lerp(browsePos.y, inspectPos.y, b),
      lerp(browsePos.z, inspectPos.z, b),
    );
    this._look = this._look || new THREE.Vector3();
    this._look.set(
      lerp(browseLook.x, target.x, b),
      lerp(browseLook.y, target.y, b),
      lerp(browseLook.z, target.z, b),
    );
    this.camera.lookAt(this._look);
  }

  _updateLights() {
    const b = this.camBlend;
    this.hemi.intensity = lerp(1.0, 0.6, b);
    this.ambient.intensity = lerp(0.5, 0.32, b);
    this.inspectSpot.intensity = lerp(0, 2.2, b);
  }

  // ---- housekeeping ------------------------------------------------------------------

  _emit() {
    this.onChange({
      mode: this.mode,
      selectedIndex: this.selectedIndex,
      book: this.books[this.selectedIndex]?.data || null,
      count: this.books.length,
    });
  }

  _resize() {
    const w = this.canvas.clientWidth || window.innerWidth;
    const h = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _track(geometry, ...materials) {
    if (geometry) this._disposables.push(geometry);
    materials.forEach((m) => m && this._disposables.push(m));
  }

  dispose() {
    this._running = false;
    cancelAnimationFrame(this._raf);
    clearTimeout(this._wheelIdle);
    this.canvas.removeEventListener('pointerdown', this._onDown);
    window.removeEventListener('pointermove', this._onMove);
    window.removeEventListener('pointerup', this._onUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    this.canvas.removeEventListener('contextmenu', this._onContext);
    window.removeEventListener('keydown', this._onKey);
    window.removeEventListener('resize', this._onResize);
    this._disposables.forEach((d) => d?.dispose?.());
    this.renderer.dispose();
  }
}
