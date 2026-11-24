/* Модулия — 3D сцена (three.js r147). Мерните единици в сцената са метри.
   Реалистичен изглед: отражения (RoomEnvironment), ACES тонове, сенки, LED под горните шкафове,
   облицовка на стената, декорация, вечерен режим, камери с плавни преходи, анимирано сглобяване. */
(function () {
  const M = (window.M = window.M || {});
  const mm = (v) => v / 1000;
  const hasGsap = () => typeof window.gsap !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  M.DEFAULT_LOOK = { led: true, evening: false, decor: true, pendant: false, spots: true, dining: false, spin: false, splash: 'marble' };
  M.SPLASH = [
    { key: 'slab', name: 'Мраморна плоча' },
    { key: 'marble', name: 'Мрамор плочки' },
    { key: 'subway', name: 'Метро плочки' },
    { key: 'paint', name: 'Боя' },
  ];

  /* ---------- Процедурни текстури ---------- */
  const texCache = {};
  const canvasTex = (key, size, draw, srgb = true) => {
    if (texCache[key]) return texCache[key];
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (srgb) t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 8;
    texCache[key] = t;
    return t;
  };
  const rng = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);

  function woodTexture(hex) {
    return canvasTex('wood' + hex, 512, (g, n) => {
      g.fillStyle = hex;
      g.fillRect(0, 0, n, n);
      const rnd = rng(parseInt(hex.slice(1), 16) || 7);
      for (let i = 0; i < 280; i++) {
        const x = rnd() * n;
        const dark = rnd() < 0.62;
        g.strokeStyle = dark ? `rgba(60,35,15,${0.05 + rnd() * 0.13})` : `rgba(255,240,215,${0.04 + rnd() * 0.08})`;
        g.lineWidth = 0.5 + rnd() * 2.5;
        g.beginPath();
        const amp = 2 + rnd() * 6,
          ph = rnd() * 6;
        for (let y = 0; y <= n; y += 16) {
          const xx = x + Math.sin(y / 70 + ph) * amp;
          y === 0 ? g.moveTo(xx, y) : g.lineTo(xx, y);
        }
        g.stroke();
      }
    });
  }

  function floorTexture() {
    return canvasTex('floor', 1024, (g, n) => {
      const rnd = rng(42);
      const cols = 6,
        w = n / cols;
      for (let c = 0; c < cols; c++) {
        let y = -rnd() * n;
        while (y < n) {
          const len = n * (0.45 + rnd() * 0.5);
          const l = 62 + rnd() * 10,
            a = 0.25 + rnd() * 0.06;
          g.fillStyle = `hsl(32, ${34 + rnd() * 10}%, ${l}%)`;
          g.fillRect(c * w, y, w, len);
          for (let i = 0; i < 16; i++) {
            g.strokeStyle = `rgba(90,55,25,${0.05 + rnd() * a * 0.4})`;
            g.lineWidth = 0.6 + rnd() * 1.6;
            const x = c * w + rnd() * w;
            g.beginPath();
            g.moveTo(x, y);
            g.bezierCurveTo(x + rnd() * 6 - 3, y + len / 3, x + rnd() * 6 - 3, y + (2 * len) / 3, x + rnd() * 4 - 2, y + len);
            g.stroke();
          }
          g.fillStyle = 'rgba(60,35,15,.35)';
          g.fillRect(c * w, y + len - 1.5, w, 1.5);
          y += len;
        }
        g.fillStyle = 'rgba(60,35,15,.4)';
        g.fillRect(c * w + w - 1.5, 0, 1.5, n);
      }
    });
  }

  function marbleTexture() {
    return canvasTex('marble', 1024, (g, n) => {
      g.fillStyle = '#f1f0ed';
      g.fillRect(0, 0, n, n);
      const rnd = rng(9);
      for (let i = 0; i < 26; i++) {
        g.strokeStyle = `rgba(120,120,125,${0.05 + rnd() * 0.18})`;
        g.lineWidth = 0.6 + rnd() * 2.2;
        g.beginPath();
        let x = rnd() * n,
          y = rnd() * n;
        g.moveTo(x, y);
        for (let k = 0; k < 9; k++) {
          x += (rnd() - 0.3) * 140;
          y += (rnd() - 0.5) * 90;
          g.lineTo(x, y);
        }
        g.stroke();
      }
      // фуги на плочи 60×120
      g.strokeStyle = 'rgba(160,160,165,.55)';
      g.lineWidth = 2;
      for (let i = 0; i <= n; i += n / 1.5) {
        g.beginPath();
        g.moveTo(0, i);
        g.lineTo(n, i);
        g.stroke();
      }
      for (let i = 0; i <= n; i += n / 0.75) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, n);
        g.stroke();
      }
    });
  }

  function slabTexture() {
    return canvasTex('slab', 1024, (g, n) => {
      g.fillStyle = '#efeeea';
      g.fillRect(0, 0, n, n);
      const rnd = rng(23);
      for (let i = 0; i < 34; i++) {
        g.strokeStyle = `rgba(${110 + rnd() * 40},${105 + rnd() * 30},${100 + rnd() * 30},${0.05 + rnd() * 0.2})`;
        g.lineWidth = 0.5 + rnd() * 2.4;
        g.beginPath();
        let x = rnd() * n,
          y = rnd() * n;
        g.moveTo(x, y);
        for (let k = 0; k < 12; k++) {
          x += (rnd() - 0.35) * 120;
          y += (rnd() - 0.5) * 80;
          g.quadraticCurveTo(x - 30 * rnd(), y + 20 * rnd(), x, y);
        }
        g.stroke();
      }
    });
  }
  // Рифелен МДФ: 36 канала на 0,9 м (≈ 25 мм)
  function flutedTexture(bump) {
    return canvasTex(bump ? 'flutedB' : 'fluted', 512, (g, n) => {
      const per = n / 36;
      for (let x = 0; x < n; x++) {
        const v = 0.5 + 0.5 * Math.cos(((x % per) / per) * Math.PI * 2);
        const c = bump ? Math.round(255 * v) : Math.round(200 + 55 * Math.pow(v, 0.6));
        g.fillStyle = `rgb(${c},${c},${c})`;
        g.fillRect(x, 0, 1, n);
      }
    }, !bump);
  }

  function subwayTexture() {
    return canvasTex('subway', 512, (g, n) => {
      g.fillStyle = '#d9dcdf';
      g.fillRect(0, 0, n, n);
      const rows = 12,
        cols = 6,
        th = n / rows,
        tw = n / cols;
      for (let r = 0; r < rows; r++) {
        const off = r % 2 ? tw / 2 : 0;
        for (let c = -1; c <= cols; c++) {
          const x = c * tw + off;
          const grd = g.createLinearGradient(x, r * th, x, r * th + th);
          grd.addColorStop(0, '#ffffff');
          grd.addColorStop(1, '#eef0f2');
          g.fillStyle = grd;
          g.fillRect(x + 2, r * th + 2, tw - 4, th - 4);
        }
      }
    });
  }

  /* ---------- Геометрия ---------- */
  function boxGeo(sx, sy, sz, S = 0.9, noSwap = false) {
    const geo = new THREE.BoxGeometry(sx, sy, sz);
    const pos = geo.attributes.position;
    const uv = geo.attributes.uv;
    const dims = [sx, sy, sz];
    const grain = dims.indexOf(Math.max(...dims));
    const faceAxes = [
      [2, 1],
      [2, 1],
      [0, 2],
      [0, 2],
      [0, 1],
      [0, 1],
    ];
    for (let f = 0; f < 6; f++) {
      let [au, av] = faceAxes[f];
      if (au === grain && !noSwap) [au, av] = [av, au];
      for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        uv.setXY(i, (p[au] + 5) / S, (p[av] + 5) / S);
      }
    }
    uv.needsUpdate = true;
    return geo;
  }
  function planeUV(geo, sx, sy, S) {
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * sx) / S, (uv.getY(i) * sy) / S);
    uv.needsUpdate = true;
  }

  class View3D {
    constructor(el, opts = {}) {
      this.el = el;
      this.opts = opts;
      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: !!opts.transparent }));
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.lowRes ? 1.25 : 2));
      r.outputEncoding = THREE.sRGBEncoding;
      r.toneMapping = THREE.ACESFilmicToneMapping;
      r.toneMappingExposure = 1.0;
      r.shadowMap.enabled = !opts.transparent;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      if (opts.transparent) r.setClearColor(0x000000, 0);
      el.appendChild(r.domElement);
      this.scene = new THREE.Scene();
      if (!opts.transparent) this.scene.background = new THREE.Color(opts.bg || '#e6e9ef');
      if (THREE.RoomEnvironment) {
        try {
          const pm = new THREE.PMREMGenerator(r);
          this.scene.environment = pm.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
          pm.dispose();
        } catch (e) {}
      }
      this.camera = opts.ortho ? new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100) : new THREE.PerspectiveCamera(38, 1, 0.05, 100);
      if (!opts.noControls) {
        this.controls = new THREE.OrbitControls(this.camera, r.domElement);
        this.controls.enableDamping = false;
        this.controls.maxPolarAngle = Math.PI * 0.53;
        this.controls.minDistance = 0.4;
        this.controls.maxDistance = 14;
        this.controls.autoRotateSpeed = 0.6;
        this.controls.addEventListener('change', () => this.render());
        this.controls.addEventListener('start', () => this.emitUser && this.emitUser());
      }
      this.hemi = new THREE.HemisphereLight(0xffffff, 0xb9ab98, 0.45);
      this.scene.add(this.hemi);
      const sun = (this.sun = new THREE.DirectionalLight(0xfff2e0, 1.1));
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 0.5, far: 20 });
      sun.shadow.bias = -0.0004;
      sun.shadow.radius = 4;
      this.scene.add(sun, sun.target);
      this.amb = new THREE.AmbientLight(0xffffff, 0.12);
      this.scene.add(this.amb);
      this.root = new THREE.Group();
      this.scene.add(this.root);
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(el);
      this._visible = true;
      if ('IntersectionObserver' in window) {
        this._io = new IntersectionObserver((e) => {
          this._visible = e[0].isIntersecting;
          if (this._visible) this._kick();
        });
        this._io.observe(el);
      }
      this.resize();
    }

    resize() {
      const w = this.opts.size ? this.opts.size[0] : this.el.clientWidth || 300,
        h = this.opts.size ? this.opts.size[1] : this.el.clientHeight || 200;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = w + 'px';
      this.renderer.domElement.style.height = h + 'px';
      if (this.camera.isPerspectiveCamera) this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.render();
    }

    render() {
      if (this._raf) return;
      this._raf = requestAnimationFrame(() => {
        this._raf = 0;
        this.renderer.render(this.scene, this.camera);
      });
    }
    renderNow() {
      this.renderer.render(this.scene, this.camera);
    }

    // бавно въртене
    setSpin(on) {
      if (!this.controls) return;
      this.controls.autoRotate = !!on;
      this._kick();
    }
    _kick() {
      if (this._loop || !this.controls || !this.controls.autoRotate) return;
      const step = () => {
        if (!this.controls.autoRotate || !this._visible || document.hidden) {
          this._loop = 0;
          return;
        }
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
        this._loop = requestAnimationFrame(step);
      };
      this._loop = requestAnimationFrame(step);
    }

    clear() {
      this.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      this.scene.remove(this.root);
      this.root = new THREE.Group();
      this.scene.add(this.root);
    }

    materials(project, look) {
      const { mats } = project;
      const b = M.board(mats.carcass);
      const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.72, metalness: 0, envMapIntensity: 0.6 }, o));
      const boardMat = (bb) => (bb.grain ? std({ color: '#ffffff', map: woodTexture(bb.color), roughness: 0.62 }) : std({ color: bb.color, roughness: 0.55 }));
      const frontFor = (z) => {
        const zm = M.zone(mats, z);
        const ft = M.frontType(zm.frontType);
        if (!ft.painted) return boardMat(M.board(zm.frontDecor));
        const col = M.paint(zm.frontColor).color;
        const fl = zm.surface === 'fluted' ? { map: flutedTexture(false), bumpMap: flutedTexture(true), bumpScale: 0.006 } : {};
        return ft.gloss ? new THREE.MeshPhysicalMaterial(Object.assign({ color: col, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 1 }, fl)) : std(Object.assign({ color: col, roughness: 0.78, envMapIntensity: 0.4 }, fl));
      };
      const front = frontFor('base');
      const frontWall = frontFor('wall');
      const frontTall = frontFor('tall');
      const wt = M.worktop(mats.worktop);
      const night = look && look.evening;
      const out = {
        carcass: boardMat(b),
        front,
        hdf: std({ color: '#ecebe6', roughness: 0.9 }),
        front_base: front,
        front_wall: frontWall,
        front_tall: frontTall,
        worktop: wt.grain ? std({ color: '#ffffff', map: woodTexture(wt.color), roughness: 0.45 }) : wt.key === 'wt-marble' ? std({ color: '#ffffff', map: marbleTexture(), roughness: 0.18, envMapIntensity: 0.9 }) : wt.marble ? std({ color: '#ffffff', map: slabTexture(), roughness: 0.15, envMapIntensity: 0.9 }) : std({ color: wt.color, roughness: 0.4 }),
        splashSlab: std({ color: '#ffffff', map: slabTexture(), roughness: 0.18, envMapIntensity: 0.8 }),
        handleBlack: std({ color: '#1a1a1c', metalness: 0.6, roughness: 0.35 }),
        gola: std({ color: '#2a2a2d', metalness: 0.5, roughness: 0.5 }),
        ceiling: std({ color: night ? '#9b978f' : '#f6f5f2', roughness: 1, envMapIntensity: 0.2 }),
        spot: new THREE.MeshBasicMaterial({ color: '#fffaf0' }),
        fabric: std({ color: '#3f5673', roughness: 0.95, envMapIntensity: 0.2 }),
        groove: new THREE.MeshBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22, depthWrite: false }),
        tableWood: std({ color: '#ffffff', map: woodTexture('#7a5133'), roughness: 0.5 }),
        darkWood: std({ color: '#3b2a1e', roughness: 0.6 }),
        steel: std({ color: '#cfd2d6', metalness: 0.95, roughness: 0.22, envMapIntensity: 1.2 }),
        darkSteel: std({ color: '#55595e', metalness: 0.8, roughness: 0.35, envMapIntensity: 1 }),
        blackGlass: new THREE.MeshPhysicalMaterial({ color: '#0b0c0e', roughness: 0.05, metalness: 0.2, clearcoat: 1, envMapIntensity: 1.2 }),
        appliance: std({ color: '#c9ccd0', metalness: 0.5, roughness: 0.35 }),
        wall: std({ color: night ? '#b9b2a8' : '#f3efe8', roughness: 0.95, envMapIntensity: 0.3 }),
        floor: std({ color: '#ffffff', map: floorTexture(), roughness: 0.55, envMapIntensity: 0.5 }),
        frame: std({ color: '#f7f7f5', roughness: 0.4 }),
        glass: new THREE.MeshPhysicalMaterial({ color: '#cfe6f5', transparent: true, opacity: 0.22, roughness: 0.02, metalness: 0, envMapIntensity: 1.5 }),
        sky: new THREE.MeshBasicMaterial({ color: night ? '#1a2848' : '#d6e8f5' }),
        handle: std({ color: mats.handle === 'knob' ? '#1d1e20' : '#c4c7ca', metalness: 0.95, roughness: 0.25, envMapIntensity: 1.2 }),
        ring: std({ color: '#3a3c40', roughness: 0.6 }),
        leg: std({ color: '#2b2c2f', roughness: 0.6 }),
        splashMarble: std({ color: '#ffffff', map: marbleTexture(), roughness: 0.2, envMapIntensity: 0.8 }),
        splashSubway: std({ color: '#ffffff', map: subwayTexture(), roughness: 0.15, envMapIntensity: 0.9 }),
        led: new THREE.MeshBasicMaterial({ color: '#fff4dc' }),
        leaf: std({ color: '#4f7a3a', roughness: 0.6 }),
        leaf2: std({ color: '#3f6a2f', roughness: 0.6 }),
        pot: std({ color: '#f4f1ea', roughness: 0.35 }),
        terracotta: std({ color: '#b5654a', roughness: 0.8 }),
        fruit1: std({ color: '#e2a531', roughness: 0.45 }),
        fruit2: std({ color: '#8fbf3a', roughness: 0.45 }),
        fruit3: std({ color: '#c8342b', roughness: 0.4 }),
        bowl: std({ color: '#2f3135', roughness: 0.3, metalness: 0.2 }),
        board: std({ color: '#ffffff', map: woodTexture('#b98756'), roughness: 0.6 }),
        lamp: std({ color: '#1c1d20', roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }),
        bulb: new THREE.MeshBasicMaterial({ color: '#fff1d0' }),
        cord: std({ color: '#111', roughness: 0.8 }),
      };
      const k = night ? 0.08 : 0.55;
      for (const m of Object.values(out)) if (m && m.envMapIntensity !== undefined) m.envMapIntensity *= k;
      return out;
    }

    box(parent, b, mat, cast = true, noSwap = false) {
      const sx = mm(b[3] - b[0]),
        sy = mm(b[4] - b[1]),
        sz = mm(b[5] - b[2]);
      if (sx <= 0 || sy <= 0 || sz <= 0) return null;
      const mesh = new THREE.Mesh(boxGeo(sx, sy, sz, 0.9, noSwap), mat);
      mesh.position.set(mm(b[0]) + sx / 2, mm(b[1]) + sy / 2, mm(b[2]) + sz / 2);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }

    wallFrame(room, wall, x, y) {
      const g = new THREE.Group();
      if (wall === 'A') g.position.set(mm(x), mm(y), 0);
      else {
        g.position.set(mm(room.wallA), mm(y), mm(x));
        g.rotation.y = -Math.PI / 2;
      }
      return g;
    }

    // Модул в локални координати. Всеки mesh носи userData: pi (индекс на детайл) или tag (обков/уред).
    moduleGroup(mod, res, mtl, project, opt = {}) {
      const g = new THREE.Group();
      res.parts.forEach((p, i) => {
        let mat = p.mat === 'front' ? mtl['front_' + (p.zone || 'base')] || mtl.front : mtl[p.mat] || mtl.carcass;
        if (opt.highlight && opt.highlight.size) {
          if (opt.highlight.has(i)) mat = mtl.hl;
          else if (opt.ghost) mat = p.mat === 'front' ? mtl.ghostFront : mtl.ghost;
        }
        const mesh = this.box(g, p.box, mat, true, p.mat === 'front');
        if (mesh) mesh.userData.pi = i;
        if (mesh && p.mat === 'front' && M.zone(project.mats, p.zone).surface === 'shaker' && ['door', 'drawer'].includes(p.role)) {
          const [x0, y0, , x1, y1, zf] = p.box;
          const f = Math.min(70, (x1 - x0) / 5, (y1 - y0) / 4);
          if (f > 25)
            for (const b of [
              [x0, y0, zf, x0 + f, y1, zf + 5],
              [x1 - f, y0, zf, x1, y1, zf + 5],
              [x0 + f, y0, zf, x1 - f, y0 + f, zf + 5],
              [x0 + f, y1 - f, zf, x1 - f, y1, zf + 5],
            ]) {
              const fm = this.box(g, b, mat, false, true);
              if (fm) fm.userData.pi = i;
            }
          // тъмна фуга по вътрешния ръб на рамката
          if (f > 25 && !(opt.highlight && opt.highlight.size))
            for (const b of [
              [x0 + f, y0 + f, zf + 5, x0 + f + 5, y1 - f, zf + 5.6],
              [x1 - f - 5, y0 + f, zf + 5, x1 - f, y1 - f, zf + 5.6],
              [x0 + f, y0 + f, zf + 5, x1 - f, y0 + f + 5, zf + 5.6],
              [x0 + f, y1 - f - 5, zf + 5, x1 - f, y1 - f, zf + 5.6],
            ])
              this.box(g, b, mtl.groove, false, true);
        }
      });
      const z1 = M.K.HDF + res.box.d;
      const tag = (m, t) => m && (m.userData.tag = t);
      for (const v of res.visuals) {
        if (v.kind === 'appliance') tag(this.box(g, v.box, mtl.appliance), 'final');
        if (v.kind === 'drawerSide') tag(this.box(g, v.box, mtl.steel), 'drawer');
        if (v.kind === 'basket') {
          const m = this.box(g, v.box, mtl.steel.clone());
          if (m) {
            m.material.transparent = true;
            m.material.opacity = 0.45;
            tag(m, 'pullout');
          }
        }
        if (v.kind === 'oven') {
          const b = v.box;
          if (v.compact) {
            tag(this.box(g, [b[0], b[1], b[2], b[3], b[4], b[5] - 22], mtl.darkSteel), 'final');
            tag(this.box(g, [b[0], b[1], b[5] - 22, b[3], b[4], b[5]], mtl.blackGlass), 'final');
            tag(this.box(g, [b[0] + 60, b[4] - 60, b[5], b[3] - 60, b[4] - 48, b[5] + 24], mtl.steel), 'final');
            continue;
          }
          tag(this.box(g, [b[0], b[1], b[2], b[3], b[4], b[5] - 22], mtl.darkSteel), 'final');
          tag(this.box(g, [b[0], b[1], b[5] - 22, b[3], b[4], b[5]], mtl.blackGlass), 'final');
          tag(this.box(g, [b[0] + 60, b[4] - 70, b[5], b[3] - 60, b[4] - 55, b[5] + 30], mtl.steel), 'final');
        }
        if (v.kind === 'hood') {
          const b = v.box;
          tag(this.box(g, [b[0], b[1] + 140, b[2], b[3], b[4], b[5]], mtl.darkSteel), 'final');
          tag(this.box(g, [b[0], b[1], b[5] - 260, b[3], b[1] + 140, b[5]], mtl.steel), 'final');
        }
      }
      const hs = project.mats.handle;
      if (hs !== 'tipon') {
        const isWall = mod.row === 'wall';
        const tall = M.isTall(mod.type);
        res.parts.forEach((p) => {
          if (p.mat !== 'front' || !['door', 'drawer'].includes(p.role)) return;
          const [x0, y0, , x1, y1, zf] = p.box;
          const h = y1 - y0;
          const left = /дясна/.test(p.name);
          const hx = left ? x0 + 40 : x1 - 40;
          const bar = (cx, cy, len, vert, mat) => {
            const b = vert ? [cx - 7, cy - len / 2, zf + 12, cx + 7, cy + len / 2, zf + 26] : [cx - len / 2, cy - 7, zf + 12, cx + len / 2, cy + 7, zf + 26];
            tag(this.box(g, b, mat, false), 'handle');
            for (const t of [-1, 1]) {
              const px = vert ? cx : cx + (t * len) / 2.6,
                py = vert ? cy + (t * len) / 2.6 : cy;
              tag(this.box(g, [px - 5, py - 5, zf, px + 5, py + 5, zf + 13], mat, false), 'handle');
            }
          };
          if (hs === 'gola' || hs === 'long') {
            if (tall || hs === 'long') {
              if (p.role === 'drawer') bar((x0 + x1) / 2, y1 - 45, Math.min(600, x1 - x0 - 120), false, mtl.handleBlack);
              else bar(hx, isWall ? y0 + Math.min(h / 2, 220) : tall ? y0 + Math.min(h * 0.55, 1000) : y1 - Math.min(h / 2, 220), Math.min(tall ? 1000 : 360, h * 0.7), true, mtl.handleBlack);
            } else if (!isWall) {
              // Gola: тъмен канал над всяко чело / врата
              tag(this.box(g, [x0 - 1.5, y1 - 40, zf - 20, x1 + 1.5, y1 + 2, zf + 0.6], mtl.gola, false), 'handle');
            }
            return;
          }
          const mat = hs === 'barblack' ? mtl.handleBlack : mtl.handle;
          const knob = hs === 'knob';
          let hb;
          if (p.role === 'drawer') {
            const cx = (x0 + x1) / 2,
              cy = y1 - 40;
            hb = knob ? [cx - 12, cy - 12, zf, cx + 12, cy + 12, zf + 28] : [cx - 80, cy - 6, zf + 12, cx + 80, cy + 6, zf + 28];
          } else {
            let cy = isWall ? y0 + 90 : tall ? (h > 1000 ? y0 + 1050 : y0 + 90) : y1 - 110;
            if (h < 400) cy = y0 + h / 2;
            hb = knob ? [hx - 12, cy - 12, zf, hx + 12, cy + 12, zf + 28] : [hx - 6, cy - 80, zf + 12, hx + 6, cy + 80, zf + 28];
          }
          tag(this.box(g, hb, mat, false), 'handle');
        });
      }
      if (mod.row === 'base' && opt.legs !== false && mod.type !== 'filler' && mod.type !== 'base-dw') {
        const z0 = M.K.HDF;
        const xs = mod.w > 600 ? [60, mod.w / 2, mod.w - 60] : [60, mod.w - 60];
        for (const x of xs)
          for (const z of [z0 + 60, z1 - 90]) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, mm(M.K.plinth), 12), mtl.leg);
            leg.position.set(mm(x), -mm(M.K.plinth) / 2, mm(z));
            leg.userData.tag = 'leg';
            g.add(leg);
          }
      }
      return g;
    }

    /* ---------- Цялата кухня ---------- */
    setProject(project, built, opts = {}) {
      this.clear();
      this.project = project;
      this.built = built;
      const look = (this.look = Object.assign({}, M.DEFAULT_LOOK, project.look || {}, opts.look || {}));
      const { room, modules } = project;
      const mtl = this.materials(project, look);
      const LA = room.wallA,
        LB = room.shape === 'L' ? room.wallB : 0;
      const H = room.height;
      const showRoom = opts.room !== false;
      const d = M.dims(room);
      this.cabinets = new THREE.Group();
      this.root.add(this.cabinets);
      this.extras = new THREE.Group();
      this.root.add(this.extras);

      if (showRoom) {
        const fw = mm(LA) + 2.2,
          fd = mm(Math.max(LB, 2400)) + 1.6;
        const fgeo = new THREE.PlaneGeometry(fw, fd);
        planeUV(fgeo, fw, fd, 1.3);
        const floor = new THREE.Mesh(fgeo, mtl.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(mm(LA) / 2 - (room.shape === 'L' ? 0.5 : 0), 0, fd / 2);
        floor.receiveShadow = true;
        this.root.add(floor);
        this.wallMesh('A', LA, H, room, mtl);
        if (room.shape === 'L') this.wallMesh('B', LB, H, room, mtl);
      }

      for (const m of modules) {
        const res = built.perModule[m.id];
        if (!res || m.type === 'gap') continue;
        const box = M.moduleBox(m, room);
        const fr = this.wallFrame(room, m.wall, m.x, box.y0);
        fr.add(this.moduleGroup(m, res, mtl, project));
        fr.userData.moduleId = m.id;
        this.cabinets.add(fr);
      }
      for (const p of built.plinths) {
        const fr = this.wallFrame(room, p.wall, p.wx, 0);
        const z = M.K.HDF + M.K.baseD - 60;
        this.box(fr, [0, 0, z - 18, p.L, M.K.plinth - 3, z], mtl.carcass);
        this.cabinets.add(fr);
      }
      const ct = M.K.plinth + M.K.baseH;
      const th = M.worktop(project.mats.worktop).thin ? 12 : M.K.worktop;
      const runs = M.worktopRuns(project);
      for (const r of runs) {
        const fr = this.wallFrame(room, r.wall, r.x0, ct);
        this.box(fr, [0, 0, 0, r.x1 - r.x0, th, 600], mtl.worktop);
        this.cabinets.add(fr);
      }
      const topY = ct + th;
      for (const m of modules) {
        if (m.type === 'base-sink') {
          const fr = this.wallFrame(room, m.wall, m.x, topY);
          const cx = m.w / 2,
            bw = Math.min(m.w - 120, 760);
          this.box(fr, [cx - bw / 2, 0, 90, cx + bw / 2, 4, 560], mtl.steel);
          this.box(fr, [cx - bw / 2 + 30, 1, 120, cx + bw / 2 - 30, 5, 520], mtl.darkSteel, false);
          const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 0.3, 20), mtl.steel);
          tap.position.set(mm(cx), 0.15, mm(70));
          tap.castShadow = true;
          fr.add(tap);
          const arc = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.011, 10, 24, Math.PI), mtl.steel);
          arc.rotation.y = Math.PI / 2;
          arc.position.set(mm(cx), 0.3, mm(70) + 0.09);
          arc.castShadow = true;
          fr.add(arc);
          this.cabinets.add(fr);
        }
        if (m.hob) {
          const fr = this.wallFrame(room, m.wall, m.x, topY);
          const cx = m.w / 2;
          this.box(fr, [cx - 290, 0, 50, cx + 290, 6, 560], mtl.blackGlass);
          for (const [dx, dz, rr] of [
            [-140, 170, 95],
            [140, 170, 75],
            [-140, 420, 75],
            [140, 420, 95],
          ]) {
            const t = new THREE.Mesh(new THREE.TorusGeometry(mm(rr), 0.0025, 6, 40), mtl.ring);
            t.rotation.x = Math.PI / 2;
            t.position.set(mm(cx + dx), mm(7), mm(dz));
            fr.add(t);
          }
          this.cabinets.add(fr);
        }
      }

      if (showRoom) {
        this.backsplash(project, runs, topY, mtl, look);
        if (look.led) this.ledStrips(project, mtl, look);
        if (look.decor) this.decor(project, topY, mtl);
        if (look.spots) this.ceilingSpots(project, mtl, look);
        if (look.dining) this.dining(project, mtl);
        if (look.pendant) this.pendants(project, mtl, look);
      }

      // светлина: ден / вечер
      const night = look.evening && showRoom;
      if (!this.opts.transparent) this.scene.background = new THREE.Color(night ? '#141c30' : this.opts.bg || '#e6e9ef');
      this.hemi.intensity = night ? 0.04 : 0.32;
      this.sun.intensity = night ? 0.03 : 0.95;
      this.amb.intensity = night ? 0.02 : 0.08;
      this.renderer.toneMappingExposure = night ? 0.95 : 0.8;
      const cx = mm(LA) / 2,
        cz = room.shape === 'L' ? mm(LB) / 2 : 0.4;
      this.sun.position.set(cx - 1.6, 4.2, cz + 3.8);
      this.sun.target.position.set(cx, 0.8, cz * 0.6);
      if (!opts.keepCamera || !this._framed) this.frame(room);
      this.setSpin(look.spin);
      this.render();
    }

    backsplash(project, runs, topY, mtl, look) {
      const { room } = project;
      const d = M.dims(room);
      const mat = look.splash === 'subway' ? mtl.splashSubway : look.splash === 'marble' ? mtl.splashMarble : look.splash === 'slab' ? mtl.splashSlab : null;
      if (!mat) return;
      for (const r of runs) {
        const wins = room.features.filter((f) => f.type === 'window' && f.wall === r.wall && f.sill < d.upperBottom);
        const cuts = [r.x0];
        for (const w of wins) cuts.push(w.x, w.x + w.w);
        cuts.push(r.x1);
        const xs = [...new Set(cuts.filter((x) => x >= r.x0 && x <= r.x1))].sort((a, b) => a - b);
        for (let i = 0; i < xs.length - 1; i++) {
          const a = xs[i],
            b = xs[i + 1];
          if (b - a < 5) continue;
          const mid = (a + b) / 2;
          const w = wins.find((w) => mid > w.x && mid < w.x + w.w);
          const top = w ? w.sill - 20 : d.upperBottom;
          if (top - topY < 30) continue;
          const fr = this.wallFrame(room, r.wall, a, topY);
          this.box(fr, [0, 0, 0, b - a, top - topY, 8], mat, false);
          this.extras.add(fr);
        }
      }
    }

    ledStrips(project, mtl, look) {
      const { room, modules } = project;
      const d = M.dims(room);
      const walls = room.shape === 'L' ? ['A', 'B'] : ['A'];
      let lights = 0;
      for (const wall of walls) {
        const list = modules.filter((m) => m.wall === wall && m.row === 'wall' && m.type !== 'gap' && m.type !== 'filler').sort((a, b) => a.x - b.x);
        const runs = [];
        for (const m of list) {
          const last = runs[runs.length - 1];
          if (last && Math.abs(last[1] - m.x) < 2) last[1] = m.x + m.w;
          else runs.push([m.x, m.x + m.w]);
        }
        for (const [a, b] of runs) {
          const fr = this.wallFrame(room, wall, a, d.upperBottom);
          this.box(fr, [25, -6, M.K.wallD - 40, b - a - 25, 0, M.K.wallD - 20], mtl.led, false);
          const n = Math.max(1, Math.round((b - a) / 1100));
          for (let i = 0; i < n && lights < 8; i++, lights++) {
            const pl = new THREE.PointLight(0xffdfaa, look.evening ? 1.1 : 0.6, 1.5, 2);
            pl.position.set(mm(((b - a) * (i + 0.5)) / n), -0.05, mm(M.K.wallD - 60));
            fr.add(pl);
          }
          this.extras.add(fr);
        }
      }
    }

    decor(project, topY, mtl) {
      const { room, modules } = project;
      const free = modules.filter((m) => m.row === 'base' && (m.type === 'base-door' || m.type === 'base-drawers') && !m.hob && m.w >= 400);
      if (!free.length) return;
      const plantAt = (m, xoff) => {
        const fr = this.wallFrame(room, m.wall, m.x, topY);
        const g = new THREE.Group();
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.16, 28), mtl.pot);
        pot.position.y = 0.08;
        pot.castShadow = true;
        g.add(pot);
        const rnd = rng(m.x + 17);
        for (let i = 0; i < 14; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), i % 2 ? mtl.leaf : mtl.leaf2);
          leaf.scale.set(0.35, 2.4 + rnd(), 0.9);
          const a = (i / 14) * Math.PI * 2;
          leaf.position.set(Math.cos(a) * 0.04, 0.24 + rnd() * 0.06, Math.sin(a) * 0.04);
          leaf.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5);
          leaf.castShadow = true;
          g.add(leaf);
        }
        g.position.set(mm(xoff), 0, 0.17);
        fr.add(g);
        this.extras.add(fr);
      };
      plantAt(free[0], Math.min(free[0].w - 120, 140));
      const m2 = free.length > 1 ? free[free.length - 1] : null;
      if (m2) {
        const fr = this.wallFrame(room, m2.wall, m2.x, topY);
        const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mtl.bowl);
        bowl.rotation.x = Math.PI;
        bowl.position.set(mm(m2.w / 2), 0.13, 0.32);
        bowl.castShadow = true;
        fr.add(bowl);
        const fr2 = [mtl.fruit1, mtl.fruit2, mtl.fruit3, mtl.fruit1, mtl.fruit3];
        fr2.forEach((mat, i) => {
          const s = new THREE.Mesh(new THREE.SphereGeometry(0.038, 18, 12), mat);
          s.position.set(mm(m2.w / 2) + Math.cos(i * 1.3) * 0.05, 0.05 + (i > 2 ? 0.05 : 0), 0.32 + Math.sin(i * 1.3) * 0.05);
          s.castShadow = true;
          fr.add(s);
        });
        // дъска за рязане до стената
        const board = new THREE.Mesh(boxGeo(0.34, 0.24, 0.018), mtl.board);
        board.position.set(mm(m2.w / 2) - 0.05, 0.12, 0.05);
        board.rotation.x = -0.18;
        board.castShadow = true;
        fr.add(board);
        this.extras.add(fr);
      }
      // растение на горен шкаф
      const up = modules.find((m) => m.row === 'wall' && m.type === 'wall-door');
      if (up) {
        const d = M.dims(room);
        const fr = this.wallFrame(room, up.wall, up.x, d.upperBottom + d.wallH);
        const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.13, 24), mtl.terracotta);
        pot.position.set(0.15, 0.065, 0.16);
        fr.add(pot);
        for (let i = 0; i < 9; i++) {
          const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), mtl.leaf);
          const a = i * 0.7;
          leaf.scale.set(0.6, 0.6, 2.6);
          leaf.position.set(0.15 + Math.cos(a) * 0.07, 0.13 - (i % 3) * 0.05, 0.16 + Math.sin(a) * 0.07);
          leaf.rotation.y = a;
          leaf.rotation.x = 0.6;
          fr.add(leaf);
        }
        this.extras.add(fr);
      }
    }

    tableSpot(room) {
      const LA = mm(room.wallA);
      const L = room.shape === 'L';
      const LB = L ? mm(room.wallB) : 0;
      return L ? { x: Math.min(LA * 0.4, LA - 1.8), z: Math.max(1.85, LB * 0.62) } : { x: LA * 0.68, z: 2.35 };
    }

    ceilingSpots(project, mtl, look) {
      const { room } = project;
      const LA = mm(room.wallA),
        H = mm(room.height);
      const L = room.shape === 'L';
      const LB = L ? mm(room.wallB) : 0;
      const fw = LA + 2.2,
        fd = Math.max(LB, 2.4) + 1.6;
      const ceil = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), mtl.ceiling);
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(LA / 2 - (L ? 0.5 : 0), H, fd / 2);
      this.extras.add(ceil);
      const pts = [];
      const nA = Math.max(2, Math.round(LA / 1.1));
      for (let i = 0; i < nA; i++) pts.push([(LA * (i + 0.5)) / nA, 0.8]);
      if (L) {
        const nB = Math.max(1, Math.round((LB - 1.2) / 1.1));
        for (let i = 0; i < nB; i++) pts.push([LA - 0.8, 1.3 + ((LB - 1.3) * (i + 0.5)) / nB]);
      }
      for (const [x, z] of pts) {
        const ring = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.006, 24), mtl.gola);
        ring.position.set(x, H - 0.003, z);
        const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.008, 24), mtl.spot);
        lamp.position.set(x, H - 0.006, z);
        this.extras.add(ring, lamp);
      }
      for (const [x, z] of pts.filter((_, i) => i % 2 === 0).slice(0, 4)) {
        const pl = new THREE.PointLight(0xfff1dc, look.evening ? 0.55 : 0.18, 3, 2);
        pl.position.set(x, H - 0.25, z);
        this.extras.add(pl);
      }
    }

    dining(project, mtl) {
      const t = this.tableSpot(project.room);
      const g = new THREE.Group();
      g.position.set(t.x, 0, t.z);
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.035, 72), mtl.tableWood);
      top.scale.set(1.7, 1, 1);
      top.position.y = 0.745;
      top.castShadow = top.receiveShadow = true;
      g.add(top);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.3, 0.73, 48), mtl.tableWood);
      base.position.y = 0.365;
      base.castShadow = true;
      g.add(base);
      const chair = (x, z, rot) => {
        const c = new THREE.Group();
        c.position.set(x, 0, z);
        c.rotation.y = rot;
        const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.22, 0.08, 32), mtl.fabric);
        seat.position.y = 0.47;
        seat.castShadow = true;
        c.add(seat);
        const back = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.23, 0.36, 32, 1, true, Math.PI * 0.15, Math.PI * 0.7), mtl.fabric);
        back.material = mtl.fabric.clone();
        back.material.side = THREE.DoubleSide;
        back.position.y = 0.68;
        back.castShadow = true;
        c.add(back);
        for (const [lx, lz] of [
          [0.14, 0.14],
          [-0.14, 0.14],
          [0.14, -0.14],
          [-0.14, -0.14],
        ]) {
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.009, 0.45, 8), mtl.darkWood);
          leg.position.set(lx * 1.1, 0.225, lz * 1.1);
          leg.rotation.set(lz > 0 ? 0.08 : -0.08, 0, lx > 0 ? -0.08 : 0.08);
          c.add(leg);
        }
        g.add(c);
      };
      // облегалката гледа навън от масата
      chair(-0.42, -0.62, Math.PI);
      chair(0.42, -0.62, Math.PI);
      chair(-0.42, 0.62, 0);
      chair(0.42, 0.62, 0);
      chair(-1.08, 0, -Math.PI / 2);
      chair(1.08, 0, Math.PI / 2);
      this.extras.add(g);
    }

    pendants(project, mtl, look) {
      // линейна LED лампа-пръстен над масата (или пред кухнята)
      const { room } = project;
      const H = mm(room.height);
      const t = this.tableSpot(room);
      const z = look.dining ? t.z : room.shape === 'L' ? 1.3 : 1.15;
      const x = look.dining ? t.x : mm(room.wallA) / 2;
      const y = look.dining ? 1.62 : 1.85;
      const g = new THREE.Group();
      g.position.set(x, 0, z);
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.035, 0.06), mtl.lamp);
      bar.position.y = H - 0.02;
      g.add(bar);
      for (const dx of [-0.3, 0.3]) {
        const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0025, 0.0025, H - y, 6), mtl.cord);
        w.position.set(dx, (H + y) / 2, 0);
        g.add(w);
      }
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.016, 12, 96), mtl.lamp);
      ring.rotation.x = Math.PI / 2;
      ring.scale.set(1.55, 1, 1);
      ring.position.y = y;
      ring.castShadow = true;
      g.add(ring);
      const led = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.007, 8, 96), mtl.bulb);
      led.rotation.x = Math.PI / 2;
      led.scale.set(1.55, 1, 1);
      led.position.y = y - 0.014;
      g.add(led);
      const pl = new THREE.PointLight(0xffe2b5, look.evening ? 1.1 : 0.3, 3.5, 2);
      pl.position.y = y - 0.08;
      g.add(pl);
      this.extras.add(g);
    }

    wallMesh(wall, len, H, room, mtl) {
      const shape = new THREE.Shape();
      const ext = wall === 'A' ? (room.shape === 'L' ? 0 : 0.8) : 0;
      shape.moveTo(-ext, 0);
      shape.lineTo(mm(len) + (wall === 'A' && room.shape !== 'L' ? 0.8 : 0), 0);
      shape.lineTo(mm(len) + (wall === 'A' && room.shape !== 'L' ? 0.8 : 0), mm(H));
      shape.lineTo(-ext, mm(H));
      shape.lineTo(-ext, 0);
      const fr = this.wallFrame(room, wall, 0, 0);
      for (const f of room.features.filter((f) => f.wall === wall && f.type === 'window')) {
        const x0 = mm(Math.max(10, f.x)),
          x1 = mm(Math.min(len - 10, f.x + f.w)),
          y0 = mm(f.sill),
          y1 = mm(Math.min(H - 20, f.sill + f.h));
        if (x1 <= x0 || y1 <= y0) continue;
        const hole = new THREE.Path();
        hole.moveTo(x0, y0);
        hole.lineTo(x0, y1);
        hole.lineTo(x1, y1);
        hole.lineTo(x1, y0);
        hole.lineTo(x0, y0);
        shape.holes.push(hole);
        const D = 250;
        const X0 = x0 * 1000,
          X1 = x1 * 1000,
          Y0 = y0 * 1000,
          Y1 = y1 * 1000;
        this.box(fr, [X0, Y0 - 1, -D, X1, Y0, 0], mtl.wall, false);
        this.box(fr, [X0, Y1, -D, X1, Y1 + 1, 0], mtl.wall, false);
        this.box(fr, [X0 - 1, Y0, -D, X0, Y1, 0], mtl.wall, false);
        this.box(fr, [X1, Y0, -D, X1 + 1, Y1, 0], mtl.wall, false);
        const z = -120,
          fw = 60;
        this.box(fr, [X0, Y0, z - 70, X1, Y0 + fw, z], mtl.frame, false);
        this.box(fr, [X0, Y1 - fw, z - 70, X1, Y1, z], mtl.frame, false);
        this.box(fr, [X0, Y0, z - 70, X0 + fw, Y1, z], mtl.frame, false);
        this.box(fr, [X1 - fw, Y0, z - 70, X1, Y1, z], mtl.frame, false);
        if (X1 - X0 > 900) this.box(fr, [(X0 + X1) / 2 - 35, Y0, z - 70, (X0 + X1) / 2 + 35, Y1, z], mtl.frame, false);
        this.box(fr, [X0, Y0, z - 40, X1, Y1, z - 30], mtl.glass, false);
        this.box(fr, [X0 - 30, Y0 - 20, -40, X1 + 30, Y0, 30], mtl.frame, false);
        const sky = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.6, y1 - y0 + 0.6), mtl.sky);
        sky.position.set((x0 + x1) / 2, (y0 + y1) / 2, -mm(D) - 0.05);
        fr.add(sky);
      }
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mtl.wall);
      mesh.receiveShadow = true;
      fr.add(mesh);
      this.root.add(fr);
    }

    /* ---------- Камери ---------- */
    presets(room) {
      const LA = mm(room.wallA),
        LB = room.shape === 'L' ? mm(room.wallB) : 0;
      const span = Math.max(LA, LB, 2.4);
      const L = !!LB;
      const out = [];
      out.push({ key: 'main', label: 'Общ', pos: L ? [LA * 0.22, 1.75, LB + span * 0.95] : [LA / 2 - span * 0.12, 1.65, span * 1.25], target: [LA / 2 + (L ? 0.25 : 0), 1.15, L ? LB / 2.6 : 0.3] });
      out.push({ key: 'front', label: 'Стена A', pos: [LA / 2, 1.45, Math.max(2.6, LA * 0.95)], target: [LA / 2, 1.2, 0.3] });
      if (L) out.push({ key: 'wallb', label: 'Стена B', pos: [LA - Math.max(2.6, LB * 0.95), 1.45, LB / 2 + 0.3], target: [LA - 0.3, 1.2, LB / 2 + 0.3] });
      out.push({ key: 'detail', label: 'Детайл', pos: [LA * 0.55, 1.3, 1.6], target: [LA * 0.62, 0.95, 0.2] });
      out.push({ key: 'top', label: 'Отгоре', pos: [LA / 2, 4.6, (L ? LB : 1.2) * 0.75 + 0.9], target: [LA / 2, 0.4, L ? LB / 2.5 : 0.3] });
      return out;
    }

    frame(room) {
      const p = this.presets(room)[0];
      this.camera.position.set(...p.pos);
      if (this.controls) {
        this.controls.target.set(...p.target);
        this.controls.update();
      } else this.camera.lookAt(new THREE.Vector3(...p.target));
      this._framed = true;
    }

    flyTo(preset, dur = 1.1) {
      if (!preset) return;
      if (!hasGsap() || !this.controls) {
        this.camera.position.set(...preset.pos);
        if (this.controls) {
          this.controls.target.set(...preset.target);
          this.controls.update();
        }
        this.render();
        return;
      }
      const c = this.camera.position,
        t = this.controls.target;
      gsap.to(c, { x: preset.pos[0], y: preset.pos[1], z: preset.pos[2], duration: dur, ease: 'power3.inOut', onUpdate: () => (this.controls.update(), this.render()) });
      gsap.to(t, { x: preset.target[0], y: preset.target[1], z: preset.target[2], duration: dur, ease: 'power3.inOut' });
    }

    // Малки снимки от всяка камера
    thumbnails(room, w = 160, h = 108) {
      const saveP = this.camera.position.clone();
      const saveT = this.controls ? this.controls.target.clone() : null;
      const src = this.renderer.domElement;
      const out = [];
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      const g = c.getContext('2d');
      for (const p of this.presets(room)) {
        this.camera.position.set(...p.pos);
        this.camera.lookAt(new THREE.Vector3(...p.target));
        this.renderer.render(this.scene, this.camera);
        const sw = src.width,
          sh = src.height;
        const k = Math.max(w / sw, h / sh);
        g.drawImage(src, (w - sw * k) / 2, (h - sh * k) / 2, sw * k, sh * k);
        out.push({ preset: p, url: c.toDataURL('image/jpeg', 0.7) });
      }
      this.camera.position.copy(saveP);
      if (saveT) {
        this.controls.target.copy(saveT);
        this.controls.update();
      }
      this.renderNow();
      return out;
    }

    /* ---------- Сглобяване ---------- */
    // opts: step (0 = всички детайли разглобени), animate, explode, highlight (Set), keepCamera
    showModule(project, mod, res, opts = {}) {
      this.clear();
      const mtl = this.materials(project, {});
      mtl.hl = new THREE.MeshStandardMaterial({ color: '#1f5cff', emissive: '#2f6bff', emissiveIntensity: 0.95, roughness: 0.4 });
      mtl.ghost = new THREE.MeshStandardMaterial({ color: '#d8dbd6', transparent: true, opacity: 0.18, depthWrite: false });
      mtl.ghostFront = new THREE.MeshStandardMaterial({ color: '#cfd3cd', transparent: true, opacity: 0.1, depthWrite: false });
      const steps = res.steps;
      const step = Math.max(0, Math.min(steps.length - 1, opts.step || 0));
      // първа стъпка за всеки детайл (без стъпка 0 — подреждане)
      const first = res.parts.map((_, i) => {
        for (let s = 1; s < steps.length; s++) if (steps[s].p.includes(i)) return s;
        return steps.length - 1;
      });
      const hwStep = (key) => {
        for (let s = 1; s < steps.length; s++) if (steps[s].hw && steps[s].hw[key]) return s;
        return steps.length - 1;
      };
      const tagStep = { leg: hwStep('leg'), handle: hwStep('handle'), drawer: hwStep('drawer'), pullout: hwStep('pullout'), final: steps.length - 1 };
      const highlight = opts.highlight || new Set(step === 0 ? [] : steps[step].p);
      const g = this.moduleGroup(mod, res, mtl, project, { highlight, ghost: opts.part !== undefined && opts.part !== null, legs: mod.row === 'base' });
      const box = res.box;
      const c = new THREE.Vector3(mm(mod.w) / 2, mm(box.h) / 2, mm(box.d) / 2);
      const partSel = opts.part !== undefined && opts.part !== null;
      const ex = step === 0 && !partSel ? Math.max(0.6, opts.explode || 0) : opts.explode || 0;
      const fresh = [];
      g.children.forEach((ch) => {
        const pi = ch.userData.pi;
        let vis = true;
        let isNew = false;
        if (step > 0 && !partSel) {
          if (pi !== undefined) {
            vis = first[pi] <= step;
            isNew = first[pi] === step;
          } else if (ch.userData.tag) {
            vis = tagStep[ch.userData.tag] <= step;
            isNew = tagStep[ch.userData.tag] === step;
          }
        }
        ch.visible = vis;
        const dvec = ch.position.clone().sub(c);
        if (ex > 0) ch.position.add(new THREE.Vector3(dvec.x * ex * 1.2, dvec.y * ex * 0.6, dvec.z * ex * 1.6));
        if (vis && isNew && opts.animate) fresh.push({ ch, dvec });
      });
      this.root.add(g);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(1.8, 64), new THREE.MeshStandardMaterial({ color: '#e4e7ee', roughness: 1 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = mod.row === 'base' ? -mm(M.K.plinth) : -0.02;
      floor.receiveShadow = true;
      this.root.add(floor);
      this.scene.background = new THREE.Color(this.opts.bg || '#eef0f5');
      this.hemi.intensity = 0.38;
      this.sun.intensity = 1.0;
      this.amb.intensity = 0.08;
      this.renderer.toneMappingExposure = 0.85;
      this.sun.position.set(1.5, 3, 2.5);
      this.sun.target.position.copy(c);
      if (!opts.keepCamera) {
        const r = Math.max(mm(mod.w), mm(box.h), 0.8);
        this.camera.position.set(c.x + r * 1.15, c.y + r * 0.75, c.z + r * 1.9);
        this.controls.target.copy(c);
        this.controls.update();
      }
      if (fresh.length && hasGsap()) {
        fresh.forEach(({ ch, dvec }, i) => {
          const dir = dvec.lengthSq() > 1e-6 ? dvec.clone().normalize() : new THREE.Vector3(0, 1, 0);
          const to = ch.position.clone();
          ch.position.add(dir.multiplyScalar(0.45)).add(new THREE.Vector3(0, 0.25, 0.15));
          gsap.to(ch.position, { x: to.x, y: to.y, z: to.z, duration: 0.95, delay: i * 0.07, ease: 'back.out(1.5)', onUpdate: () => this.render() });
          ch.rotation.z = (i % 2 ? 1 : -1) * 0.25;
          gsap.to(ch.rotation, { z: 0, duration: 0.95, delay: i * 0.07, ease: 'power2.out' });
        });
      }
      this.render();
    }

    snapshot(type = 'image/jpeg', q = 0.9) {
      this.renderNow();
      return this.renderer.domElement.toDataURL(type, q);
    }

    exportGLB() {
      return new Promise((resolve, reject) => {
        const ex = new THREE.GLTFExporter();
        ex.parse(this.cabinets, (res) => resolve(new Blob([res], { type: 'model/gltf-binary' })), reject, { binary: true });
      });
    }

    dispose() {
      this._ro.disconnect();
      if (this._io) this._io.disconnect();
      this.renderer.dispose();
      this.el.innerHTML = '';
    }
  }

  M.View3D = View3D;
})();
