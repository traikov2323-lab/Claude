/* Модулия — 3D сцена (three.js r147). Мерните единици в сцената са метри. */
(function () {
  const M = (window.M = window.M || {});
  const mm = (v) => v / 1000;

  // Процедурна текстура на дърво (шарка по вертикалата на текстурата)
  const texCache = {};
  function woodTexture(hex) {
    if (texCache[hex]) return texCache[hex];
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = hex;
    g.fillRect(0, 0, 512, 512);
    let seed = parseInt(hex.slice(1), 16) || 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) {
      const x = rnd() * 512;
      const w = 0.5 + rnd() * 2.5;
      const dark = rnd() < 0.62;
      g.strokeStyle = dark ? `rgba(60,35,15,${0.05 + rnd() * 0.12})` : `rgba(255,240,215,${0.04 + rnd() * 0.08})`;
      g.lineWidth = w;
      g.beginPath();
      const amp = 2 + rnd() * 6;
      const ph = rnd() * 6;
      for (let y = 0; y <= 512; y += 16) {
        const xx = x + Math.sin(y / 70 + ph) * amp;
        if (y === 0) g.moveTo(xx, y);
        else g.lineTo(xx, y);
      }
      g.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = 4;
    texCache[hex] = t;
    return t;
  }

  // Кутия с UV, мащабирани по размера (за реалистичен мащаб на шарката)
  function boxGeo(sx, sy, sz) {
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
    const S = 0.9;
    for (let f = 0; f < 6; f++) {
      let [au, av] = faceAxes[f];
      if (au === grain) [au, av] = [av, au];
      for (let v = 0; v < 4; v++) {
        const i = f * 4 + v;
        const p = [pos.getX(i), pos.getY(i), pos.getZ(i)];
        uv.setXY(i, (p[au] + 5) / S, (p[av] + 5) / S);
      }
    }
    uv.needsUpdate = true;
    return geo;
  }

  class View3D {
    constructor(el, opts = {}) {
      this.el = el;
      this.opts = opts;
      const r = (this.renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: !!opts.transparent }));
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputEncoding = THREE.sRGBEncoding;
      r.shadowMap.enabled = !opts.transparent;
      r.shadowMap.type = THREE.PCFSoftShadowMap;
      if (opts.transparent) r.setClearColor(0x000000, 0);
      el.appendChild(r.domElement);
      this.scene = new THREE.Scene();
      if (!opts.transparent) this.scene.background = new THREE.Color(opts.bg || '#e9ebe6');
      if (opts.ortho) this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 100);
      else this.camera = new THREE.PerspectiveCamera(38, 1, 0.05, 100);
      if (!opts.noControls) {
        this.controls = new THREE.OrbitControls(this.camera, r.domElement);
        this.controls.enableDamping = false;
        this.controls.maxPolarAngle = Math.PI * 0.52;
        this.controls.minDistance = 0.4;
        this.controls.maxDistance = 14;
        this.controls.addEventListener('change', () => this.render());
      }
      const hemi = new THREE.HemisphereLight(0xffffff, 0xb9ab98, 0.72);
      this.scene.add(hemi);
      const sun = (this.sun = new THREE.DirectionalLight(0xfff6ea, 0.78));
      sun.position.set(2.5, 4.5, 4);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      const sc = sun.shadow.camera;
      sc.left = -5;
      sc.right = 5;
      sc.top = 5;
      sc.bottom = -5;
      sc.near = 0.5;
      sc.far = 20;
      sun.shadow.bias = -0.0005;
      this.scene.add(sun);
      this.scene.add(sun.target);
      this.scene.add(new THREE.AmbientLight(0xffffff, 0.18));
      this.root = new THREE.Group();
      this.scene.add(this.root);
      this._ro = new ResizeObserver(() => this.resize());
      this._ro.observe(el);
      this.resize();
    }

    resize() {
      const w = this.opts.size ? this.opts.size[0] : this.el.clientWidth || 300,
        h = this.opts.size ? this.opts.size[1] : this.el.clientHeight || 200;
      this.renderer.setSize(w, h, false);
      this.renderer.domElement.style.width = w + 'px';
      this.renderer.domElement.style.height = h + 'px';
      if (this.camera.isPerspectiveCamera) this.camera.aspect = w / h;
      else if (this._orthoFit) this._applyOrtho();
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

    clear() {
      this.root.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
      });
      this.scene.remove(this.root);
      this.root = new THREE.Group();
      this.scene.add(this.root);
    }

    materials(project) {
      const { mats } = project;
      const b = M.board(mats.carcass);
      const ft = M.frontType(mats.frontType);
      const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ roughness: 0.72, metalness: 0 }, o));
      const boardMat = (bb) => (bb.grain ? std({ color: '#ffffff', map: woodTexture(bb.color), roughness: 0.68 }) : std({ color: bb.color, roughness: 0.6 }));
      let front;
      if (ft.painted) {
        const col = M.paint(mats.frontColor).color;
        front = ft.gloss ? new THREE.MeshPhysicalMaterial({ color: col, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 }) : std({ color: col, roughness: 0.82 });
      } else front = boardMat(M.board(mats.frontDecor));
      const wt = M.worktop(mats.worktop);
      return {
        carcass: boardMat(b),
        front,
        hdf: std({ color: '#ecebe6', roughness: 0.9 }),
        worktop: wt.grain ? std({ color: '#ffffff', map: woodTexture(wt.color), roughness: 0.5 }) : std({ color: wt.color, roughness: wt.key === 'wt-marble' ? 0.25 : 0.55 }),
        steel: std({ color: '#c3c6c9', metalness: 0.85, roughness: 0.32 }),
        darkSteel: std({ color: '#5b5f63', metalness: 0.7, roughness: 0.4 }),
        blackGlass: new THREE.MeshPhysicalMaterial({ color: '#0e0f11', roughness: 0.08, metalness: 0.1, clearcoat: 1 }),
        appliance: std({ color: '#c9ccd0', metalness: 0.3, roughness: 0.5 }),
        wall: std({ color: '#f2efe9', roughness: 0.95 }),
        floor: std({ color: '#ffffff', map: woodTexture('#cdb79a'), roughness: 0.8 }),
        frame: std({ color: '#f7f7f5', roughness: 0.5 }),
        glass: new THREE.MeshPhysicalMaterial({ color: '#cfe6f5', transparent: true, opacity: 0.28, roughness: 0.05, metalness: 0 }),
        sky: new THREE.MeshBasicMaterial({ color: '#cfe3ef' }),
        handle: std({ color: mats.handle === 'knob' ? '#1d1e20' : '#b9bcbf', metalness: 0.9, roughness: 0.28 }),
        ring: std({ color: '#3a3c40', roughness: 0.6 }),
        leg: std({ color: '#2b2c2f', roughness: 0.6 }),
      };
    }

    box(parent, b, mat, cast = true) {
      const sx = mm(b[3] - b[0]),
        sy = mm(b[4] - b[1]),
        sz = mm(b[5] - b[2]);
      if (sx <= 0 || sy <= 0 || sz <= 0) return null;
      const mesh = new THREE.Mesh(boxGeo(sx, sy, sz), mat);
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

    // Изгражда модул в локални координати
    moduleGroup(mod, res, mtl, project, opt = {}) {
      const g = new THREE.Group();
      const meshes = [];
      res.parts.forEach((p, i) => {
        let mat = mtl[p.mat] || mtl.carcass;
        if (opt.highlight && opt.highlight.size) {
          if (opt.highlight.has(i)) mat = mtl.hl;
          else mat = p.mat === 'front' ? mtl.ghostFront : mtl.ghost;
        }
        const mesh = this.box(g, p.box, mat);
        meshes.push(mesh);
      });
      // визуални елементи
      const z1 = M.K.HDF + res.box.d;
      for (const v of res.visuals) {
        if (v.kind === 'appliance') this.box(g, v.box, mtl.appliance);
        if (v.kind === 'drawerSide') this.box(g, v.box, mtl.steel);
        if (v.kind === 'basket') {
          const m = this.box(g, v.box, mtl.steel);
          if (m) {
            m.material = mtl.steel.clone();
            m.material.transparent = true;
            m.material.opacity = 0.45;
          }
        }
        if (v.kind === 'oven') {
          const b = v.box;
          this.box(g, [b[0], b[1], b[2], b[3], b[4], b[5] - 22], mtl.darkSteel);
          this.box(g, [b[0], b[1], b[5] - 22, b[3], b[4], b[5]], mtl.blackGlass);
          this.box(g, [b[0] + 60, b[4] - 70, b[5], b[3] - 60, b[4] - 55, b[5] + 30], mtl.steel);
        }
        if (v.kind === 'hood') {
          const b = v.box;
          this.box(g, [b[0], b[1] + 140, b[2], b[3], b[4], b[5]], mtl.darkSteel);
          this.box(g, [b[0], b[1], b[5] - 260, b[3], b[1] + 140, b[5]], mtl.steel);
        }
      }
      // дръжки
      if (project.mats.handle !== 'tipon' && !opt.noHandles) {
        res.parts.forEach((p) => {
          if (p.mat !== 'front' || !['door', 'drawer'].includes(p.role)) return;
          const [x0, y0, , x1, y1, zf] = p.box;
          const isWall = mod.row === 'wall';
          const knob = project.mats.handle === 'knob';
          let hb;
          if (p.role === 'drawer') {
            const cx = (x0 + x1) / 2,
              cy = y1 - 40;
            hb = knob ? [cx - 12, cy - 12, zf, cx + 12, cy + 12, zf + 28] : [cx - 80, cy - 6, zf + 12, cx + 80, cy + 6, zf + 28];
          } else {
            const left = /дясна/.test(p.name);
            const hx = left ? x0 + 40 : x1 - 40;
            const h = y1 - y0;
            let cy = isWall ? y0 + 90 : M.isTall(mod.type) ? (y1 - y0 > 1000 ? y0 + 1050 : y0 + 90) : y1 - 110;
            if (h < 400) cy = y0 + h / 2;
            hb = knob ? [hx - 12, cy - 12, zf, hx + 12, cy + 12, zf + 28] : [hx - 6, cy - 80, zf + 12, hx + 6, cy + 80, zf + 28];
          }
          this.box(g, hb, mtl.handle, false);
        });
      }
      // крачета
      if (mod.row === 'base' && opt.legs !== false && mod.type !== 'filler' && mod.type !== 'base-dw') {
        const z0 = M.K.HDF;
        const xs = mod.w > 600 ? [60, mod.w / 2, mod.w - 60] : [60, mod.w - 60];
        for (const x of xs)
          for (const z of [z0 + 60, z1 - 90]) {
            const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, mm(M.K.plinth), 10), mtl.leg);
            leg.position.set(mm(x), -mm(M.K.plinth) / 2, mm(z));
            g.add(leg);
          }
      }
      g.userData.meshes = meshes;
      return g;
    }

    // Цялата кухня
    setProject(project, built, opts = {}) {
      this.clear();
      const { room, modules } = project;
      const mtl = this.materials(project);
      const LA = room.wallA,
        LB = room.shape === 'L' ? room.wallB : 0;
      const H = room.height;
      const showRoom = opts.room !== false;
      this.cabinets = new THREE.Group();
      this.root.add(this.cabinets);

      if (showRoom) {
        const fw = mm(LA) + 1.8,
          fd = mm(Math.max(LB, 2400)) + 1.2;
        const floor = new THREE.Mesh(new THREE.PlaneGeometry(fw, fd), mtl.floor);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(mm(LA) / 2 - (room.shape === 'L' ? 0.4 : 0), 0, fd / 2);
        floor.geometry.attributes.uv.array.forEach((v, i, arr) => (arr[i] = v * (i % 2 ? fd : fw) * 0.9));
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
      // цокъл
      for (const p of built.plinths) {
        const fr = this.wallFrame(room, p.wall, p.wx, 0);
        const z = M.K.HDF + M.K.baseD - 60;
        this.box(fr, [0, 0, z - 18, p.L, M.K.plinth - 3, z], mtl.carcass);
        this.cabinets.add(fr);
      }
      // плот, мивка, плоча
      const ct = M.K.plinth + M.K.baseH;
      for (const r of M.worktopRuns(project)) {
        const fr = this.wallFrame(room, r.wall, r.x0, ct);
        const th = project.mats.worktop === 'wt-compact' ? 12 : M.K.worktop;
        this.box(fr, [0, 0, 0, r.x1 - r.x0, th, 600], mtl.worktop);
        this.cabinets.add(fr);
      }
      const topY = ct + (project.mats.worktop === 'wt-compact' ? 12 : M.K.worktop);
      for (const m of modules) {
        if (m.type === 'base-sink') {
          const fr = this.wallFrame(room, m.wall, m.x, topY);
          const cx = m.w / 2,
            bw = Math.min(m.w - 120, 760);
          this.box(fr, [cx - bw / 2, 0, 90, cx + bw / 2, 4, 560], mtl.steel);
          this.box(fr, [cx - bw / 2 + 30, 1, 120, cx + bw / 2 - 30, 5, 520], mtl.darkSteel, false);
          const tap = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.28, 16), mtl.steel);
          tap.position.set(mm(cx), 0.14, mm(70));
          fr.add(tap);
          const spout = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 12), mtl.steel);
          spout.rotation.x = Math.PI / 2;
          spout.position.set(mm(cx), 0.27, mm(170));
          fr.add(spout);
          this.cabinets.add(fr);
        }
        if (m.hob) {
          const fr = this.wallFrame(room, m.wall, m.x, topY);
          const cx = m.w / 2;
          this.box(fr, [cx - 290, 0, 50, cx + 290, 6, 560], mtl.blackGlass);
          const rings = [
            [-140, 170, 95],
            [140, 170, 75],
            [-140, 420, 75],
            [140, 420, 95],
          ];
          for (const [dx, dz, rr] of rings) {
            const t = new THREE.Mesh(new THREE.TorusGeometry(mm(rr), 0.0025, 6, 40), mtl.ring);
            t.rotation.x = Math.PI / 2;
            t.position.set(mm(cx + dx), mm(7), mm(dz));
            fr.add(t);
          }
          this.cabinets.add(fr);
        }
      }

      // слънце и камера
      const cx = mm(LA) / 2,
        cz = room.shape === 'L' ? mm(LB) / 2 : 0.4;
      this.sun.position.set(cx - 1.5, 4.2, cz + 3.5);
      this.sun.target.position.set(cx, 0.8, cz * 0.6);
      if (!opts.keepCamera || !this._framed) this.frame(room);
      this.render();
    }

    wallMesh(wall, len, H, room, mtl) {
      const shape = new THREE.Shape();
      const ext = wall === 'A' ? (room.shape === 'L' ? 0 : 0.6) : 0;
      shape.moveTo(-ext, 0);
      shape.lineTo(mm(len), 0);
      shape.lineTo(mm(len), mm(H));
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
        const d = 0.25;
        const X0 = x0 * 1000,
          X1 = x1 * 1000,
          Y0 = y0 * 1000,
          Y1 = y1 * 1000;
        // ниша
        this.box(fr, [X0, Y0 - 1, -d * 1000, X1, Y0, 0], mtl.wall, false);
        this.box(fr, [X0, Y1, -d * 1000, X1, Y1 + 1, 0], mtl.wall, false);
        this.box(fr, [X0 - 1, Y0, -d * 1000, X0, Y1, 0], mtl.wall, false);
        this.box(fr, [X1, Y0, -d * 1000, X1 + 1, Y1, 0], mtl.wall, false);
        // каса и стъкло
        const z = -120;
        const fw = 60;
        this.box(fr, [X0, Y0, z - 70, X1, Y0 + fw, z], mtl.frame, false);
        this.box(fr, [X0, Y1 - fw, z - 70, X1, Y1, z], mtl.frame, false);
        this.box(fr, [X0, Y0, z - 70, X0 + fw, Y1, z], mtl.frame, false);
        this.box(fr, [X1 - fw, Y0, z - 70, X1, Y1, z], mtl.frame, false);
        if (X1 - X0 > 900) this.box(fr, [(X0 + X1) / 2 - 35, Y0, z - 70, (X0 + X1) / 2 + 35, Y1, z], mtl.frame, false);
        this.box(fr, [X0, Y0, z - 40, X1, Y1, z - 30], mtl.glass, false);
        this.box(fr, [X0 - 30, Y0 - 20, -40, X1 + 30, Y0, 30], mtl.frame, false);
        const sky = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 + 0.4, y1 - y0 + 0.4), mtl.sky);
        sky.position.set((x0 + x1) / 2, (y0 + y1) / 2, -d - 0.05);
        fr.add(sky);
      }
      const mesh = new THREE.Mesh(new THREE.ShapeGeometry(shape), mtl.wall);
      mesh.receiveShadow = true;
      fr.add(mesh);
      this.root.add(fr);
    }

    frame(room) {
      const LA = mm(room.wallA),
        LB = room.shape === 'L' ? mm(room.wallB) : 0;
      const span = Math.max(LA, LB, 2.4);
      if (this.camera.isPerspectiveCamera) {
        const target = new THREE.Vector3(LA / 2 + (LB ? 0.25 : 0), 1.15, LB ? LB / 2.6 : 0.3);
        const pos = LB ? new THREE.Vector3(LA * 0.22, 1.75, LB + span * 0.95) : new THREE.Vector3(LA / 2 - span * 0.12, 1.65, span * 1.25);
        this.camera.position.copy(pos);
        if (this.controls) {
          this.controls.target.copy(target);
          this.controls.update();
        } else this.camera.lookAt(target);
      }
      this._framed = true;
    }

    // Само един модул (за сглобяване), с разглобяване
    showModule(project, mod, res, opts = {}) {
      this.clear();
      const mtl = this.materials(project);
      mtl.hl = new THREE.MeshStandardMaterial({ color: '#2f5bea', emissive: '#1b3aa8', emissiveIntensity: 0.35, roughness: 0.5 });
      mtl.ghost = new THREE.MeshStandardMaterial({ color: '#d8dbd6', transparent: true, opacity: 0.22, depthWrite: false });
      mtl.ghostFront = new THREE.MeshStandardMaterial({ color: '#cfd3cd', transparent: true, opacity: 0.12, depthWrite: false });
      const g = this.moduleGroup(mod, res, mtl, project, { highlight: opts.highlight, noHandles: false, legs: mod.row === 'base' });
      const box = res.box;
      const c = new THREE.Vector3(mm(mod.w) / 2, mm(box.h) / 2, mm(box.d) / 2);
      const ex = opts.explode || 0;
      if (ex > 0)
        g.children.forEach((ch) => {
          const d = ch.position.clone().sub(c);
          ch.position.add(new THREE.Vector3(d.x * ex * 1.2, d.y * ex * 0.6, d.z * ex * 1.6));
        });
      this.root.add(g);
      const floor = new THREE.Mesh(new THREE.CircleGeometry(1.6, 48), new THREE.MeshStandardMaterial({ color: '#e3e5df', roughness: 1 }));
      floor.rotation.x = -Math.PI / 2;
      floor.position.y = mod.row === 'base' ? -mm(M.K.plinth) : -0.02;
      floor.receiveShadow = true;
      this.root.add(floor);
      this.sun.position.set(1.5, 3, 2.5);
      this.sun.target.position.copy(c);
      if (!opts.keepCamera) {
        const r = Math.max(mm(mod.w), mm(box.h), 0.8);
        this.camera.position.set(c.x + r * 1.1, c.y + r * 0.7, c.z + r * 1.9);
        this.controls.target.copy(c);
        this.controls.update();
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
      this.renderer.dispose();
      this.el.innerHTML = '';
    }
  }

  M.View3D = View3D;
})();
