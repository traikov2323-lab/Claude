/* Модулия: двигател: автоматично подреждане, детайли, кантиране, разкрой, цени, проверки.
   Всички размери са в милиметри. Координати на стена: x от левия край на стената (гледана отпред),
   y нагоре от пода, z навън от стената. При Г-образна кухня ъгълът е в десния край на стена A,
   а стена B започва от ъгъла. */
(function () {
  const M = (window.M = window.M || {});

  const K = (M.K = {
    T: 18, // ПДЧ
    HDF: 3,
    plinth: 100,
    baseH: 720,
    baseD: 560,
    wallD: 320,
    worktop: 38,
    gap: 3,
    cornerW: 1000,
    cornerDoor: 350,
  });

  let _id = 0;
  const uid = (p = 'm') => p + Date.now().toString(36).slice(-4) + (++_id).toString(36);
  M.uid = uid;

  M.TYPE_INFO = {
    'base-door': { label: 'Долен шкаф с врати', row: 'base' },
    'base-drawers': { label: 'Долен шкаф с 3 чекмеджета', row: 'base' },
    'base-sink': { label: 'Шкаф за мивка', row: 'base' },
    'base-oven': { label: 'Шкаф за фурна под плот', row: 'base' },
    'base-dw': { label: 'Съдомиялна (фронт)', row: 'base' },
    'base-bottle': { label: 'Бутилиера', row: 'base' },
    'base-corner': { label: 'Ъглов долен шкаф', row: 'base' },
    'tall-fridge': { label: 'Колона за вграден хладилник', row: 'base', tall: true },
    'tall-oven': { label: 'Колона за фурна', row: 'base', tall: true },
    'tall-oven2': { label: 'Колона за фурна и микровълнова', row: 'base', tall: true },
    'tall-pantry': { label: 'Колона килер', row: 'base', tall: true },
    'wall-door': { label: 'Горен шкаф с врати', row: 'wall' },
    'wall-hood': { label: 'Горен шкаф с вграден аспиратор', row: 'wall' },
    filler: { label: 'Планка', row: 'any' },
    gap: { label: 'Свободно място', row: 'any' },
  };
  M.typeLabel = (t) => (M.TYPE_INFO[t] || { label: t }).label;
  M.isTall = (t) => !!(M.TYPE_INFO[t] || {}).tall;

  /* ---------- Размери според настройките на стаята ---------- */
  M.dims = function (room) {
    const upperBottom = room.opts.upperBottom || 1440;
    const wallH = room.opts.wallH === 'ceil' ? Math.max(720, Math.min(1400, room.height - upperBottom)) : +room.opts.wallH || 720;
    return {
      wallH,
      upperBottom,
      tallH: upperBottom + wallH - K.plinth,
      counterTop: K.plinth + K.baseH + K.worktop,
    };
  };

  M.moduleBox = function (mod, room) {
    const d = M.dims(room);
    if (mod.row === 'wall') return { y0: d.upperBottom, h: d.wallH, d: K.wallD };
    if (M.isTall(mod.type)) return { y0: K.plinth, h: d.tallH, d: K.baseD };
    return { y0: K.plinth, h: K.baseH, d: K.baseD };
  };

  /* ---------- Диапазони по стени ---------- */
  M.rowRange = function (room, wall, row) {
    const L = room.shape === 'L';
    const len = wall === 'A' ? room.wallA : room.wallB;
    if (row === 'base') return wall === 'B' ? [K.baseD + K.HDF + K.T, len] : [0, len];
    return wall === 'B' ? [K.wallD + K.HDF, len] : [0, len];
  };

  function overlaps(a0, a1, b0, b1) {
    return a0 < b1 - 0.5 && b0 < a1 - 0.5;
  }

  function windowBlocks(room, wall, row) {
    const d = M.dims(room);
    const out = [];
    for (const f of room.features) {
      if (f.wall !== wall || f.type !== 'window') continue;
      const top = f.sill + f.h;
      if (row === 'wall' && top > d.upperBottom + 40 && f.sill < d.upperBottom + d.wallH) out.push([f.x - 50, f.x + f.w + 50]);
      if (row === 'tall' && f.sill < d.upperBottom + d.wallH) out.push([f.x - 50, f.x + f.w + 50]);
    }
    return out;
  }

  // Най-близката свободна позиция за модул с ширина w до желания център
  function placeAnchor(range, occupied, center, w) {
    const desired = center - w / 2;
    const cands = [desired, range[0], range[1] - w];
    for (const o of occupied) cands.push(o[1], o[0] - w);
    let best = null;
    for (let x of cands) {
      x = Math.round(x);
      if (x < range[0] - 0.5 || x + w > range[1] + 0.5) continue;
      if (occupied.some((o) => overlaps(x, x + w, o[0], o[1]))) continue;
      const score = Math.abs(x - desired);
      if (!best || score < best.score) best = { x, score };
    }
    return best ? best.x : null;
  }

  function gapsOf(range, occupied) {
    const occ = occupied.slice().sort((a, b) => a[0] - b[0]);
    const gaps = [];
    let cur = range[0];
    for (const o of occ) {
      if (o[0] > cur + 0.5) gaps.push([cur, o[0]]);
      cur = Math.max(cur, o[1]);
    }
    if (range[1] > cur + 0.5) gaps.push([cur, range[1]]);
    return gaps;
  }

  function splitWidths(g, min, ideal, max) {
    let n = Math.max(Math.ceil(g / max), Math.round(g / ideal));
    n = Math.max(1, n);
    while (n > 1 && g / n < min) n--;
    const w = Math.floor(g / n);
    const arr = new Array(n).fill(w);
    arr[n - 1] += g - w * n;
    return arr;
  }

  /* ---------- Автоматично подреждане ---------- */
  M.autoLayout = function (room) {
    const o = room.opts;
    const L = room.shape === 'L';
    const walls = L ? ['A', 'B'] : ['A'];
    const notes = [];
    const mods = [];
    const occ = { A: { base: [], wall: [] }, B: { base: [], wall: [] } };
    const range = {};
    for (const w of walls) range[w] = { base: M.rowRange(room, w, 'base'), wall: M.rowRange(room, w, 'wall') };
    if (L) range.A.base = [0, room.wallA - K.cornerW];

    const add = (m) => {
      m.id = uid();
      mods.push(m);
      if (m.row === 'base') occ[m.wall].base.push([m.x, m.x + m.w]);
      else occ[m.wall].wall.push([m.x, m.x + m.w]);
      if (M.isTall(m.type)) occ[m.wall].wall.push([m.x, m.x + m.w]);
      return m;
    };

    if (L) add({ wall: 'A', row: 'base', type: 'base-corner', x: room.wallA - K.cornerW, w: K.cornerW });

    // Колони: хладилник и фурна
    const tallWall = L ? 'B' : 'A';
    const tr = range[tallWall].base;
    const tallCount = (o.fridge ? 1 : 0) + (o.ovenTall ? 1 : 0);
    if (tallCount) {
      const need = tallCount * 600;
      const winR = windowBlocks(room, tallWall, 'tall');
      let start = tr[1] - need;
      if (winR.some((b) => overlaps(start, tr[1], b[0], b[1]))) {
        if (!L && !winR.some((b) => overlaps(tr[0], tr[0] + need, b[0], b[1]))) start = tr[0];
        else notes.push({ lvl: 'warn', t: 'Колоната застъпва прозорец. Премести прозореца или колоната.' });
      }
      const atEnd = start > tr[0];
      const order = [];
      if (o.fridge) order.push('tall-fridge');
      if (o.ovenTall) order.push('tall-oven');
      if (atEnd) order.reverse();
      order.forEach((t, i) => add({ wall: tallWall, row: 'base', type: t, x: start + i * 600, w: 600 }));
    }

    // Мивка
    const water = room.features.find((f) => f.type === 'water' && walls.includes(f.wall));
    const hood = room.features.find((f) => f.type === 'hood' && walls.includes(f.wall));
    const power = room.features.find((f) => f.type === 'power' && walls.includes(f.wall));
    let sink = null;
    {
      const wall = water ? water.wall : 'A';
      const r = range[wall].base;
      const c = water ? water.x : r[0] + (r[1] - r[0]) * 0.35;
      if (!water) notes.push({ lvl: 'info', t: 'Не е отбелязана вода. Мивката е поставена автоматично.' });
      for (const w of [800, 600]) {
        const x = placeAnchor(r, occ[wall].base, c, w);
        if (x !== null) {
          sink = add({ wall, row: 'base', type: 'base-sink', x, w });
          break;
        }
      }
      if (!sink) notes.push({ lvl: 'warn', t: 'Няма място за шкаф за мивка.' });
      else if (water && Math.abs(sink.x + sink.w / 2 - water.x) > 250)
        notes.push({ lvl: 'warn', t: `Мивката е отместена с ${Math.round(Math.abs(sink.x + sink.w / 2 - water.x) / 10)} см от водата. Ще трябва удължаване на ВиК.` });
    }

    // Плот за готвене
    let cook = null;
    {
      const ref = hood || power;
      const wall = ref ? ref.wall : walls[walls.length - 1];
      const r = range[wall].base;
      const c = ref ? ref.x : r[0] + (r[1] - r[0]) * 0.7;
      const type = o.ovenTall ? 'base-drawers' : 'base-oven';
      const x = placeAnchor(r, occ[wall].base, c, 600);
      if (x !== null) {
        cook = add({ wall, row: 'base', type, x, w: 600, hob: true });
        if (hood && Math.abs(x + 300 - hood.x) > 120)
          notes.push({ lvl: 'warn', t: 'Абсорбаторът не е над плочата. Аспираторът е поставен над плочата.' });
      } else notes.push({ lvl: 'warn', t: 'Няма място за плот за готвене.' });
    }

    // Съдомиялна до мивката
    if (o.dishwasher && sink) {
      const r = range[sink.wall].base;
      const pos = [sink.x + sink.w, sink.x - 600];
      let placed = false;
      for (const x of pos) {
        if (x < r[0] || x + 600 > r[1]) continue;
        if (occ[sink.wall].base.some((oc) => overlaps(x, x + 600, oc[0], oc[1]))) continue;
        add({ wall: sink.wall, row: 'base', type: 'base-dw', x, w: 600 });
        placed = true;
        break;
      }
      if (!placed) notes.push({ lvl: 'warn', t: 'Няма място за съдомиялна до мивката.' });
    }

    // Запълване на долния ред
    for (const wall of walls) {
      for (const [g0, g1] of gapsOf(range[wall].base, occ[wall].base)) {
        const g = g1 - g0;
        if (g < 20) continue;
        if (g < 150) {
          add({ wall, row: 'base', type: 'filler', x: g0, w: g });
          continue;
        }
        if (g < 300) {
          add({ wall, row: 'base', type: 'base-bottle', x: g0, w: g });
          continue;
        }
        let x = g0;
        const widths = splitWidths(g, 300, 600, 900);
        widths.forEach((w, i) => {
          const nextToCook = cook && cook.wall === wall && ((i === widths.length - 1 && Math.abs(g1 - cook.x) < 1) || (i === 0 && Math.abs(g0 - (cook.x + cook.w)) < 1));
          const type = nextToCook && w <= 900 ? 'base-drawers' : 'base-door';
          add({ wall, row: 'base', type, x, w });
          x += w;
        });
      }
    }

    // Горен ред
    if (o.uppers) {
      if (cook) {
        const wall = cook.wall;
        const x = placeAnchor(range[wall].wall, occ[wall].wall, cook.x + 300, 600);
        if (x !== null) add({ wall, row: 'wall', type: 'wall-hood', x, w: 600 });
      }
      for (const wall of walls) {
        const blocks = windowBlocks(room, wall, 'wall').map((b) => [Math.max(b[0], range[wall].wall[0]), Math.min(b[1], range[wall].wall[1])]).filter((b) => b[1] > b[0]);
        for (const b of blocks) {
          const free = gapsOf(b, occ[wall].wall);
          for (const [a0, a1] of free) add({ wall, row: 'wall', type: 'gap', x: a0, w: a1 - a0 });
        }
        // над колоните няма горни шкафове · пазим мястото, за да работи ръчното подреждане
        for (const t of mods.filter((m) => m.wall === wall && M.isTall(m.type))) add({ wall, row: 'wall', type: 'gap', x: t.x, w: t.w });
        for (const [g0, g1] of gapsOf(range[wall].wall, occ[wall].wall)) {
          const g = g1 - g0;
          if (g < 20) continue;
          if (g < 250) {
            add({ wall, row: 'wall', type: 'gap', x: g0, w: g });
            continue;
          }
          let x = g0;
          for (const w of splitWidths(g, 250, 600, 900)) {
            add({ wall, row: 'wall', type: 'wall-door', x, w });
            x += w;
          }
        }
      }
    }

    // Колоните присъстват и в горния ред като свободно място
    const sorted = M.sortModules(mods);
    M.codeModules(sorted);
    return { modules: sorted, notes };
  };

  M.sortModules = function (mods) {
    const rowOrder = { base: 0, wall: 1 };
    return mods.slice().sort((a, b) => (a.wall < b.wall ? -1 : a.wall > b.wall ? 1 : rowOrder[a.row] - rowOrder[b.row] || a.x - b.x));
  };

  M.codeModules = function (mods) {
    const cnt = {};
    for (const m of mods) {
      if (m.type === 'gap') {
        m.code = '';
        continue;
      }
      const letter = M.isTall(m.type) ? 'К' : m.row === 'wall' ? 'Г' : 'Д';
      const k = m.wall + letter;
      cnt[k] = (cnt[k] || 0) + 1;
      m.code = k + cnt[k];
    }
    return mods;
  };

  // Ръчен режим: подрежда модулите плътно по реда им
  M.pack = function (room, mods) {
    const notes = [];
    const walls = room.shape === 'L' ? ['A', 'B'] : ['A'];
    for (const m of mods) if (!walls.includes(m.wall)) m.wall = 'A';
    // при права кухня няма ъглов шкаф
    if (room.shape !== 'L') for (let i = mods.length - 1; i >= 0; i--) if (mods[i].type === 'base-corner') mods.splice(i, 1);
    for (const wall of walls) {
      const len = wall === 'A' ? room.wallA : room.wallB;
      for (const row of ['base', 'wall']) {
        const all = mods.filter((m) => m.wall === wall && m.row === row).sort((a, b) => a.x - b.x);
        const r = M.rowRange(room, wall, row);
        let end = r[1];
        // ъгловият шкаф стои винаги в края на стена A
        const corner = all.find((m) => m.type === 'base-corner');
        if (corner) {
          corner.w = K.cornerW;
          corner.x = len - K.cornerW;
          end = corner.x;
        }
        const list = all.filter((m) => m !== corner);
        // горните шкафове заобикалят високите колони
        const talls = row === 'wall' ? mods.filter((m) => m.wall === wall && M.isTall(m.type)).map((m) => [m.x, m.x + m.w]).sort((a, b) => a[0] - b[0]) : [];
        let x = r[0];
        for (const m of list) {
          let moved = true;
          while (moved) {
            moved = false;
            for (const t of talls)
              if (x < t[1] - 0.5 && x + m.w > t[0] + 0.5) {
                x = t[1];
                moved = true;
              }
          }
          m.x = x;
          x += m.w;
        }
        const limit = row === 'wall' ? r[1] : end;
        if (x > limit + 0.5) notes.push({ lvl: 'warn', t: `Стена ${wall}, ${row === 'base' ? 'долен' : 'горен'} ред: шкафовете излизат с ${Math.round((x - limit) / 10)} см извън стената.` });
      }
    }
    M.codeModules(M.sortModules(mods));
    return notes;
  };

  /* ---------- Детайли на модул ---------- */
  // part: name, mat ('carcass'|'front'|'hdf'), L, W, grain, edges {L1,L2,W1,W2}, box [x0,y0,z0,x1,y1,z1] (локално), role
  function P(name, mat, L, W, box, opts = {}) {
    return Object.assign({ name, mat, L: Math.round(L * 10) / 10, W: Math.round(W * 10) / 10, box, edges: { L1: 0, L2: 0, W1: 0, W2: 0 }, grain: mat !== 'hdf', role: 'carcass' }, opts);
  }
  const E = (L1 = 0, L2 = 0, W1 = 0, W2 = 0) => ({ L1, L2, W1, W2 });

  M.moduleParts = function (mod, room, mats) {
    const { T, HDF, gap } = K;
    const box = M.moduleBox(mod, room);
    const w = mod.w,
      h = box.h,
      d = box.d;
    const z0 = HDF,
      z1 = HDF + d; // корпус
    const zf0 = z1,
      zf1 = z1 + T; // фронт
    const zone = M.zoneOf(mod);
    const zm = M.zone(mats, zone);
    const frontPDCH = zm.frontType === 'pdch';
    const fe = frontPDCH ? E(2, 2, 2, 2) : E();
    const parts = [];
    const hw = {};
    const steps = [];
    const addHw = (k, q) => (hw[k] = (hw[k] || 0) + q);
    const visuals = [];
    const t = mod.type;
    if (t === 'gap') return { parts, hw, steps, visuals, box };

    const front = (name, x0, y0, x1, y1, role = 'door') =>
      parts.push(P(name, 'front', y1 - y0, x1 - x0, [x0, y0, zf0, x1, y1, zf1], { edges: Object.assign({}, fe), role, zone }));

    if (t === 'filler') {
      const zz = mod.row === 'wall' ? [K.HDF + K.wallD, K.HDF + K.wallD + T] : [zf0, zf1];
      parts.push(P('Планка', 'front', h - 4, w, [0, 2, zz[0], w, h - 2, zz[1]], { edges: Object.assign({}, fe), role: 'filler', zone }));
      addHw('screw', 4);
      steps.push({ t: 'Захвани планката към съседния шкаф с 4 винта 4×16 отвътре.', p: [0], hw: { screw: 4 } });
      return { parts, hw, steps, visuals, box };
    }

    if (t === 'base-dw') {
      front('Фронт съдомиялна', gap / 2, 2, w - gap / 2, h - 2);
      addHw('screw', 8);
      addHw('handle', mats.handle === 'tipon' ? 0 : 1);
      visuals.push({ kind: 'appliance', box: [10, -K.plinth + 10, 10, w - 10, h - 4, z1 - 4], color: '#9aa0a6' });
      steps.push({ t: 'Монтирай съдомиялната в нишата и я нивелирай.', p: [], hw: {} });
      steps.push({ t: 'Закачи фронта към вратата на машината по шаблона на производителя (8 винта 4×16).', p: [0], hw: { screw: 8 } });
      return { parts, hw, steps, visuals, box };
    }

    const isWall = mod.row === 'wall';
    const tall = M.isTall(t);

    // Страници
    parts.push(P('Страница лява', 'carcass', h, d, [0, 0, z0, T, h, z1], { edges: E(0.8) }));
    parts.push(P('Страница дясна', 'carcass', h, d, [w - T, 0, z0, w, h, z1], { edges: E(0.8) }));
    const iS = [0, 1];
    const inner = w - 2 * T;
    // Дъно
    parts.push(P('Дъно', 'carcass', inner, d, [T, 0, z0, w - T, T, z1], { edges: E(0.8) }));
    const iBottom = parts.length - 1;
    let iTop = [];
    if (isWall || tall) {
      if (t !== 'wall-hood' || true) {
        parts.push(P('Таван', 'carcass', inner, d, [T, h - T, z0, w - T, h, z1], { edges: E(0.8) }));
        iTop = [parts.length - 1];
      }
    } else {
      parts.push(P('Бленда предна', 'carcass', inner, 100, [T, h - T, z1 - 100, w - T, h, z1], { edges: E(0.8) }));
      parts.push(P('Бленда задна', 'carcass', inner, 100, [T, h - T, z0, w - T, h, z0 + 100], { edges: E() }));
      iTop = [parts.length - 2, parts.length - 1];
    }
    // Гръб
    const backH = t === 'wall-hood' ? h - 300 : h;
    const backY0 = t === 'wall-hood' ? 300 : 0;
    let iBack = null;
    if (t !== 'base-oven') {
      parts.push(P('Гръб', 'hdf', backH - 4, w - 4, [2, backY0 + 2, 0, w - 2, backY0 + backH - 2, HDF], { grain: false, edges: E(), role: 'back' }));
      iBack = parts.length - 1;
    }

    const conf = isWall || tall ? 12 : 14;
    addHw('confirmat', conf + (tall ? 8 : 0));
    addHw('nail', iBack !== null ? Math.round(((backH + w) * 2) / 150) : 0);

    const shelfIdx = [];
    const shelf = (y, name = 'Рафт', fixed = false) => {
      const sd = fixed ? d : d - 20;
      parts.push(P(name, 'carcass', fixed ? inner : inner - 2, sd, [T + (fixed ? 0 : 1), y, z0, w - T - (fixed ? 0 : 1), y + T, z0 + sd], { edges: E(0.8) }));
      shelfIdx.push(parts.length - 1);
      if (!fixed) addHw('shelfPin', 4);
      else addHw('confirmat', 4);
    };

    const doorsCount = w > 600 ? 2 : 1;
    const hingesFor = (hh) => (hh <= 1000 ? 2 : hh <= 1600 ? 3 : 4);
    const fronts = [];
    const doors = (y0, y1, label = 'Врата') => {
      const ih = y1 - y0;
      if (doorsCount === 1) {
        front(label, gap / 2, y0, w - gap / 2, y1);
        fronts.push(parts.length - 1);
      } else {
        const dw = (w - gap * 2) / 2;
        front(label + ' лява', gap / 2, y0, gap / 2 + dw, y1);
        front(label + ' дясна', w - gap / 2 - dw, y0, w - gap / 2, y1);
        fronts.push(parts.length - 2, parts.length - 1);
      }
      const hn = hingesFor(ih) * doorsCount;
      addHw('hinge', hn);
      addHw('screw', hn * 4);
      return hn;
    };

    let hingeCount = 0;
    let drawerParts = [];
    let drawerCount = 0;
    const handleCount = () => fronts.length;

    switch (t) {
      case 'base-door':
        shelf(340);
        hingeCount = doors(2, h - 2);
        break;
      case 'base-sink':
        hingeCount = doors(2, h - 2);
        visuals.push({ kind: 'sink', cx: w / 2 });
        break;
      case 'base-corner': {
        shelf(340);
        front('Врата', gap / 2, 2, gap / 2 + K.cornerDoor, h - 2);
        fronts.push(parts.length - 1);
        front('Сляп фронт', K.cornerDoor + gap, 2, w - gap / 2, h - 2, 'blind');
        addHw('hinge', 2);
        addHw('screw', 8 + 6);
        hingeCount = 2;
        break;
      }
      case 'base-bottle': {
        front('Фронт бутилиера', gap / 2, 2, w - gap / 2, h - 2);
        fronts.push(parts.length - 1);
        addHw('pullout', 1);
        addHw('screw', 12);
        visuals.push({ kind: 'basket', box: [T + 5, T + 40, z0 + 20, w - T - 5, h - 60, z1 - 20] });
        break;
      }
      case 'base-drawers': {
        const fh = [176, 267, 267];
        const sys = M.CATALOG.drawerSystems[mats.hardware] || M.CATALOG.drawerSystems.blum;
        let y = 2;
        const bodyH = [84, 140, 140];
        fh.forEach((hh, i) => {
          const y0 = h - 2 - fh.slice(0, i + 1).reduce((a, b) => a + b, 0) - gap * i;
          front(`Чело чекмедже ${i + 1}`, gap / 2, y0, w - gap / 2, y0 + hh, 'drawer');
          fronts.push(parts.length - 1);
          const by = y0 + 30;
          parts.push(P(`Дъно чекмедже ${i + 1}`, 'carcass', inner - sys.bottomW, sys.nl - sys.bottomL, [T + 20, by, z1 - sys.nl - 10, w - T - 20, by + 16, z1 - 10 - sys.bottomL], { edges: E(), role: 'drawer' }));
          parts.push(P(`Гръб чекмедже ${i + 1}`, 'carcass', inner - sys.backW, bodyH[i] - 16, [T + 26, by + 16, z1 - sys.nl - 10, w - T - 26, by + bodyH[i], z1 - sys.nl + 6], { edges: E(), role: 'drawer' }));
          drawerParts.push(parts.length - 2, parts.length - 1);
          visuals.push({ kind: 'drawerSide', box: [T + 2, by, z1 - sys.nl - 10, T + 16, by + bodyH[i], z1 - 12] });
          visuals.push({ kind: 'drawerSide', box: [w - T - 16, by, z1 - sys.nl - 10, w - T - 2, by + bodyH[i], z1 - 12] });
        });
        drawerCount = 3;
        addHw('drawer', 3);
        addHw('screw', 3 * 12);
        if (mod.hob) visuals.push({ kind: 'hob' });
        break;
      }
      case 'base-oven': {
        shelf(102, 'Рафт за фурна', true);
        front('Чело чекмедже', gap / 2, 2, w - gap / 2, 118, 'drawer');
        fronts.push(parts.length - 1);
        addHw('drawer', 1);
        addHw('screw', 12);
        drawerCount = 1;
        visuals.push({ kind: 'oven', box: [T + 2, 120, z1 - 540, w - T - 2, h - 4, z1 + T + 2] });
        if (mod.hob) visuals.push({ kind: 'hob' });
        break;
      }
      case 'tall-fridge': {
        shelf(1790, 'Рафт неподвижен', true);
        const yF = 1790;
        front('Фронт хладилник', gap / 2, 2, w - gap / 2, yF - gap / 2, 'door');
        front('Фронт горен', gap / 2, yF + gap / 2, w - gap / 2, h - 2, 'door');
        fronts.push(parts.length - 2, parts.length - 1);
        addHw('hinge', 4 + 2);
        addHw('screw', 6 * 4 + 8);
        hingeCount = 6;
        visuals.push({ kind: 'appliance', box: [T + 4, T + 4, z0 + 10, w - T - 4, yF - 10, z1 - 10], color: '#dfe2e5' });
        break;
      }
      case 'tall-oven': {
        shelf(720, 'Рафт неподвижен', true);
        shelf(720 + 18 + 595, 'Рафт неподвижен', true);
        shelf(360);
        const yTop = 720 + 18 + 595 + 18;
        front('Врата долна', gap / 2, 2, w - gap / 2, 718, 'door');
        front('Врата горна', gap / 2, yTop + gap, w - gap / 2, h - 2, 'door');
        fronts.push(parts.length - 2, parts.length - 1);
        addHw('hinge', 2 + hingesFor(h - 2 - yTop - gap));
        addHw('screw', 20);
        hingeCount = 2 + hingesFor(h - 2 - yTop - gap);
        visuals.push({ kind: 'oven', box: [T + 2, 738, z1 - 540, w - T - 2, 738 + 595, z1 + T + 2] });
        break;
      }
      case 'wall-door':
        if (h > 1000) {
          // до тавана: основни врати + горен ред врати (мезонет)
          const yS = h - 380;
          shelf(Math.round(yS / 2) - 9);
          shelf(yS - T, 'Рафт неподвижен', true);
          hingeCount = doors(2, yS - gap / 2, 'Врата') + doors(yS + gap / 2, h - 2, 'Врата горна');
        } else {
          shelf(Math.round(h / 2) - 9);
          if (h > 800) shelf(Math.round(h * 0.72));
          hingeCount = doors(2, h - 2);
        }
        break;
      case 'tall-pantry': {
        const ySplit = Math.min(h - 360, 1480);
        [360, 720, 1080].forEach((y) => shelf(y));
        shelf(ySplit, 'Рафт неподвижен', true);
        if (h - ySplit > 700) shelf(ySplit + Math.round((h - ySplit) / 2));
        hingeCount = doors(2, ySplit - gap / 2, 'Врата') + doors(ySplit + gap / 2, h - 2, 'Врата горна');
        break;
      }
      case 'tall-oven2': {
        // фурна 595 мм + компактна фурна/микровълнова 455 мм една над друга
        shelf(720, 'Рафт неподвижен', true);
        const y2 = 720 + 18 + 595;
        shelf(y2, 'Рафт неподвижен', true);
        const y3 = y2 + 18 + 455;
        shelf(y3, 'Рафт неподвижен', true);
        front('Чело чекмедже', gap / 2, 2, w - gap / 2, 357, 'drawer');
        front('Чело чекмедже 2', gap / 2, 360, w - gap / 2, 718, 'drawer');
        fronts.push(parts.length - 2, parts.length - 1);
        addHw('drawer', 2);
        drawerCount = 2;
        if (h - 2 - (y3 + 18 + gap) > 150) {
          front('Врата горна', gap / 2, y3 + 18 + gap, w - gap / 2, h - 2, 'door');
          fronts.push(parts.length - 1);
          addHw('hinge', 2);
          hingeCount = 2;
        }
        addHw('screw', 32);
        visuals.push({ kind: 'oven', box: [T + 2, 738, z1 - 540, w - T - 2, 738 + 595, z1 + T + 2] });
        visuals.push({ kind: 'oven', box: [T + 2, y2 + 18, z1 - 540, w - T - 2, y2 + 18 + 455, z1 + T + 2], compact: true });
        break;
      }
      case 'wall-hood': {
        shelf(282, 'Рафт над аспиратора', true);
        front('Врата', gap / 2, 182, w - gap / 2, h - 2);
        fronts.push(parts.length - 1);
        addHw('hinge', 2);
        addHw('screw', 8);
        hingeCount = 2;
        visuals.push({ kind: 'hood', box: [T + 2, 0, z0 + 10, w - T - 2, 180, z1 + T + 4] });
        break;
      }
    }

    if (mats.handle === 'gola' && tall) addHw('handleLong', fronts.filter((i) => parts[i].role === 'door').length);
    else addHw('handle', fronts.length);
    addHw('screw', fronts.length * 2);

    if (isWall) {
      addHw('hanger', 2);
      addHw('rail', w / 1000);
    } else {
      const legs = w > 600 ? 6 : 4;
      addHw('leg', legs);
      addHw('plinthClip', w > 600 ? 3 : 2);
      addHw('screw', legs * 4);
    }

    // Стъпки за сглобяване
    const s = (text, p, h2) => steps.push({ t: text, p, hw: h2 || {} });
    s('Подреди детайлите по етикетите. Провери кантовете: кантираният ръб винаги е отпред.', parts.map((_, i) => i).filter((i) => parts[i].mat === 'carcass' && parts[i].role === 'carcass'), {});
    if (isWall || tall) {
      s('Постави дъното и тавана между двете страници. Пробий и затегни по 3 конфирмата 7×50 на всеки ъгъл.', [iS[0], iS[1], iBottom, ...iTop], { confirmat: 12 });
    } else {
      s('Постави дъното между страниците (кант отпред) и затегни с по 3 конфирмата 7×50 от всяка страна.', [iS[0], iS[1], iBottom], { confirmat: 6 });
      s('Монтирай предната и задната бленда горе: по 2 конфирмата във всеки край.', [...iTop], { confirmat: 8 });
    }
    const fixedShelves = shelfIdx.filter((i) => /неподвижен|фурна|аспиратора/.test(parts[i].name));
    if (fixedShelves.length) s('Монтирай неподвижните рафтове с по 2 конфирмата от всяка страна.', fixedShelves, { confirmat: fixedShelves.length * 4 });
    if (iBack !== null) s('Провери диагоналите (трябва да са равни) и закови гърба със скоби през 15 см.', [iBack], { nail: Math.round(((backH + w) * 2) / 150) });
    if (!isWall) s(`Монтирай ${w > 600 ? 6 : 4} регулируеми крачета на дъното, на 50 мм от ръбовете.`, [iBottom], { leg: w > 600 ? 6 : 4 });
    else s('Монтирай 2 окачвача в горните ъгли. Окачи шкафа на шината и нивелирай с винтовете на окачвачите.', [iS[0], iS[1]], { hanger: 2 });
    const movable = shelfIdx.filter((i) => !fixedShelves.includes(i));
    if (movable.length) s('Постави рафтоносачите (по 4 на рафт) и рафтовете.', movable, { shelfPin: movable.length * 4 });
    if (drawerCount) s(`Монтирай водачите и сглоби ${drawerCount === 1 ? 'чекмеджето' : drawerCount + ' чекмеджета'}: дъно + гръб + метални страници.`, drawerParts.length ? drawerParts : [], { drawer: drawerCount, screw: drawerCount * 12 });
    if (hingeCount) s(`Монтирай ${hingeCount} панти и закачи вратите. Регулирай фугите на 3 мм.`, fronts.filter((i) => parts[i].role === 'door'), { hinge: hingeCount });
    if (fronts.some((i) => parts[i].role === 'drawer')) s('Закачи челата на чекмеджетата и ги регулирай по височина и наклон.', fronts.filter((i) => parts[i].role === 'drawer'), {});
    if (t === 'base-bottle') s('Монтирай механизма за бутилиера и закачи фронта към него.', fronts, { pullout: 1 });
    if (t === 'base-corner') s('Захвани слепия фронт към страницата отвътре. Той остава зад съседния шкаф на стена B.', [parts.findIndex((p) => p.role === 'blind')], { screw: 6 });
    if (fronts.length) s(mats.handle === 'tipon' ? 'Монтирай механизмите „натисни-отвори“.' : 'Пробий и монтирай дръжките по шаблон.', fronts, { handle: fronts.length });

    return { parts, hw, steps, visuals, box };
  };

  /* ---------- Целият проект ---------- */
  M.buildProject = function (project) {
    const { room, modules, mats } = project;
    const all = [];
    const perModule = {};
    let pid = 0;
    for (const m of modules) {
      const res = M.moduleParts(m, room, mats);
      res.parts.forEach((p) => {
        p.pid = 'P' + String(++pid).padStart(3, '0');
        p.module = m.code;
        p.moduleId = m.id;
        all.push(p);
      });
      perModule[m.id] = res;
    }
    // Цокъл по стени
    const walls = room.shape === 'L' ? ['A', 'B'] : ['A'];
    const plinths = [];
    for (const wall of walls) {
      const runs = [];
      const list = modules.filter((m) => m.wall === wall && m.row === 'base' && m.type !== 'gap').sort((a, b) => a.x - b.x);
      let cur = null;
      for (const m of list) {
        if (cur && Math.abs(cur[1] - m.x) < 1) cur[1] = m.x + m.w;
        else {
          cur = [m.x, m.x + m.w];
          runs.push(cur);
        }
      }
      for (const [a, b] of runs) {
        let len = b - a;
        let x = a;
        while (len > 0) {
          const piece = Math.min(len, 2700);
          const p = P('Цокъл', 'carcass', piece, K.plinth - 3, null, { edges: E(0.8), role: 'plinth' });
          p.pid = 'P' + String(++pid).padStart(3, '0');
          p.module = 'Цокъл ' + wall;
          p.wall = wall;
          p.wx = x;
          all.push(p);
          plinths.push(p);
          x += piece;
          len -= piece;
        }
      }
    }
    return { parts: all, perModule, plinths };
  };

  /* ---------- Разкрой (гилотинно нареждане) ---------- */
  M.SHEET = { L: 2800, W: 2070, trim: 10, kerf: 4 };

  M.nest = function (items, sheet = M.SHEET) {
    const k = sheet.kerf;
    const UW = sheet.L - 2 * sheet.trim + k;
    const UH = sheet.W - 2 * sheet.trim + k;
    const sheets = [];
    const tooBig = [];
    const sorted = items.slice().sort((a, b) => Math.max(b.L, b.W) - Math.max(a.L, a.W) || b.L * b.W - a.L * a.W);
    const newSheet = () => {
      const s = { free: [{ x: 0, y: 0, w: UW, h: UH }], placed: [] };
      sheets.push(s);
      return s;
    };
    for (const it of sorted) {
      const orients = [{ l: it.L, w: it.W, rot: false }];
      if (!it.grain) orients.push({ l: it.W, w: it.L, rot: true });
      const tryPlace = (list) => {
        let best = null;
        for (const s of list)
          for (let fi = 0; fi < s.free.length; fi++) {
            const fr = s.free[fi];
            for (const o of orients) {
              const pl = o.l + k,
                pw = o.w + k;
              if (pl <= fr.w + 0.01 && pw <= fr.h + 0.01) {
                const score = Math.min(fr.w - pl, fr.h - pw);
                if (!best || score < best.score) best = { s, fi, fr, o, pl, pw, score };
              }
            }
          }
        return best;
      };
      let best = tryPlace(sheets);
      if (!best) {
        const s = newSheet();
        best = tryPlace([s]);
        if (!best) {
          sheets.pop();
          tooBig.push(it);
          continue;
        }
      }
      const { s, fi, fr, o, pl, pw } = best;
      s.placed.push({ item: it, x: fr.x + sheet.trim, y: fr.y + sheet.trim, l: o.l, w: o.w, rot: o.rot });
      s.free.splice(fi, 1);
      const rw = fr.w - pl,
        rh = fr.h - pw;
      if (rw < rh) {
        if (rw > 0) s.free.push({ x: fr.x + pl, y: fr.y, w: rw, h: pw });
        if (rh > 0) s.free.push({ x: fr.x, y: fr.y + pw, w: fr.w, h: rh });
      } else {
        if (rw > 0) s.free.push({ x: fr.x + pl, y: fr.y, w: rw, h: fr.h });
        if (rh > 0) s.free.push({ x: fr.x, y: fr.y + pw, w: pl, h: rh });
      }
    }
    const area = sheet.L * sheet.W;
    for (const s of sheets) {
      s.used = s.placed.reduce((a, p) => a + p.l * p.w, 0);
      s.util = s.used / area;
    }
    return { sheets, tooBig, util: sheets.length ? sheets.reduce((a, s) => a + s.used, 0) / (sheets.length * area) : 0 };
  };

  // Групи материали за разкрой
  M.materialGroups = function (project, built) {
    const { mats } = project;
    const groups = {};
    const g = (key, label, kind, grain, extra) => (groups[key] = groups[key] || Object.assign({ key, label, kind, grain, items: [] }, extra || {}));
    for (const p of built.parts) {
      let key;
      if (p.mat === 'hdf') {
        key = 'hdf';
        g(key, M.CATALOG.hdf.name, 'hdf', false);
      } else if (p.mat === 'front' && M.frontType(M.zone(mats, p.zone).frontType).painted) {
        const zm = M.zone(mats, p.zone);
        const ft = M.frontType(zm.frontType);
        const sf = M.surface(zm.surface);
        key = 'mdf:' + zm.frontType + ':' + zm.frontColor + ':' + sf.key;
        g(key, `${ft.name}${sf.key !== 'flat' ? ', ' + sf.name.toLowerCase() : ''} · ${M.paint(zm.frontColor).name}`, 'mdf', false, { frontType: zm.frontType, surface: sf.key });
      } else {
        const bk = p.mat === 'front' ? M.zone(mats, p.zone).frontDecor : mats.carcass;
        const b = M.board(bk);
        key = 'board:' + bk;
        g(key, `ПДЧ 18 мм ${b.brand} ${b.name}`, 'board', b.grain);
      }
      groups[key].items.push(Object.assign({}, p, { grain: groups[key].grain && p.grain }));
    }
    for (const gr of Object.values(groups)) {
      if (gr.kind === 'mdf') {
        gr.area = gr.items.reduce((a, p) => a + (p.L * p.W) / 1e6, 0);
        continue;
      }
      gr.nest = M.nest(gr.items);
    }
    return groups;
  };

  M.edgeTotals = function (parts) {
    let e08 = 0,
      e2 = 0;
    for (const p of parts) {
      for (const [k, v] of Object.entries(p.edges)) {
        const len = k[0] === 'L' ? p.L : p.W;
        if (v === 0.8) e08 += len;
        if (v === 2) e2 += len;
      }
    }
    // +5 % за обработка
    return { e08: (e08 / 1000) * 1.05, e2: (e2 / 1000) * 1.05 };
  };

  M.worktopRuns = function (project) {
    const { room, modules } = project;
    const runs = [];
    const walls = room.shape === 'L' ? ['A', 'B'] : ['A'];
    for (const wall of walls) {
      const list = modules.filter((m) => m.wall === wall && m.row === 'base' && !M.isTall(m.type) && m.type !== 'gap').sort((a, b) => a.x - b.x);
      let cur = null;
      for (const m of list) {
        if (cur && Math.abs(cur.x1 - m.x) < 1) cur.x1 = m.x + m.w;
        else {
          cur = { wall, x0: m.x, x1: m.x + m.w };
          runs.push(cur);
        }
      }
    }
    // Стена B: плотът продължава до ъгъла
    if (room.shape === 'L') {
      const b = runs.find((r) => r.wall === 'B' && r.x0 <= M.rowRange(room, 'B', 'base')[0] + 1);
      if (b) b.x0 = 600;
    }
    return runs;
  };

  /* ---------- Цени ---------- */
  M.price = function (project, built, groups, prices) {
    const pv = (k) => (prices[k] ? +prices[k].v : 0);
    const { mats, modules } = project;
    const lines = [];
    const L = (cat, label, qty, unit, unitPrice) => {
      const total = qty * unitPrice;
      lines.push({ cat, label, qty, unit, unitPrice, total });
      return total;
    };
    // Материали
    let matCost = 0;
    const groupCost = {};
    for (const g of Object.values(groups)) {
      let c = 0;
      if (g.kind === 'board') {
        const b = M.board(g.key.split(':')[1]);
        c += L('Материали', g.label, g.nest.sheets.length, 'лист', b.price);
        c += L('Услуги', 'Разкрой · ' + b.brand + ' ' + b.name, g.nest.sheets.length, 'лист', pv('cutSheet'));
      } else if (g.kind === 'hdf') {
        c += L('Материали', g.label, g.nest.sheets.length, 'лист', M.CATALOG.hdf.price);
        c += L('Услуги', 'Разкрой HDF', g.nest.sheets.length, 'лист', pv('cutHdf'));
      } else if (g.kind === 'mdf') {
        c += L('Материали', 'Фронтове ' + g.label, Math.round(g.area * 100) / 100, 'м²', M.frontType(g.frontType).perM2 + M.surface(g.surface).extra);
      }
      groupCost[g.key] = c;
      matCost += c;
    }
    const edges = M.edgeTotals(built.parts);
    const edgeCost = L('Материали', 'Кант 0,8 мм', Math.round(edges.e08 * 10) / 10, 'м', pv('kant08')) + L('Материали', 'Кант 2 мм', Math.round(edges.e2 * 10) / 10, 'м', pv('kant2')) + L('Услуги', 'Кантиране', Math.round((edges.e08 + edges.e2) * 10) / 10, 'м', pv('bandService'));

    // Обков
    const hwTot = {};
    for (const m of modules) {
      const r = built.perModule[m.id];
      if (!r) continue;
      for (const [k, q] of Object.entries(r.hw)) hwTot[k] = (hwTot[k] || 0) + q;
    }
    const hwPrice = (k) => {
      if (k === 'hinge') return pv('hinge_' + mats.hardware);
      if (k === 'drawer') return pv('drawer_' + mats.hardware);
      if (k === 'handle') return pv('handle_' + mats.handle);
      if (k === 'handleLong') return pv('handle_long');
      return pv(k);
    };
    const hwName = (k) => {
      if (k === 'hinge') return prices['hinge_' + mats.hardware].label;
      if (k === 'drawer') return prices['drawer_' + mats.hardware].label;
      if (k === 'handle') return prices['handle_' + mats.handle].label;
      if (k === 'handleLong') return prices.handle_long.label;
      return prices[k] ? prices[k].label : k;
    };
    let hwCost = 0;
    for (const [k, q] of Object.entries(hwTot)) {
      if (!q) continue;
      hwCost += L('Обков', hwName(k), k === 'rail' ? Math.round(q * 10) / 10 : q, prices[k] ? prices[k].unit : 'бр', hwPrice(k));
    }

    // Плот
    const wt = M.worktop(mats.worktop);
    const runs = M.worktopRuns(project);
    const wtLen = runs.reduce((a, r) => a + (r.x1 - r.x0), 0) / 1000;
    const cutouts = modules.filter((m) => m.type === 'base-sink' || m.hob).length;
    let wtCost = L('Плот', wt.name, Math.round(wtLen * 100) / 100, 'л.м', wt.perM) + L('Плот', 'Изрязване за мивка и плот', cutouts, 'бр', pv('cutout'));

    // Труд
    const realMods = modules.filter((m) => m.type !== 'gap' && m.type !== 'filler');
    const laborCost = L('Труд', 'Изработка и сглобяване', realMods.length, 'модул', pv('laborModule'));
    const runM = modules.filter((m) => m.row === 'base' && m.type !== 'gap').reduce((a, m) => a + m.w, 0) / 1000;
    const installCost = L('Труд', 'Монтаж на място', Math.round(runM * 100) / 100, 'л.м', pv('install'));

    const cost = matCost + edgeCost + hwCost + wtCost + laborCost + installCost;
    const markup = pv('markup') / 100;
    const net = cost * (1 + markup);
    const vat = net * (pv('vat') / 100);
    const gross = net + vat;

    // Цена по модули (за офертата)
    const totalArea = {};
    for (const p of built.parts) {
      const g = Object.values(groups).find((gr) => gr.items.some((it) => it.pid === p.pid));
      if (!g) continue;
      totalArea[g.key] = (totalArea[g.key] || 0) + p.L * p.W;
    }
    const modulePrice = {};
    const sharedEdge = edgeCost / Math.max(1, built.parts.length);
    for (const m of modules) {
      const r = built.perModule[m.id];
      if (!r || m.type === 'gap') continue;
      let c = 0;
      for (const p of built.parts.filter((pp) => pp.moduleId === m.id)) {
        const g = Object.values(groups).find((gr) => gr.items.some((it) => it.pid === p.pid));
        if (g) c += (groupCost[g.key] * (p.L * p.W)) / totalArea[g.key];
        c += sharedEdge;
      }
      for (const [k, q] of Object.entries(r.hw)) c += q * hwPrice(k);
      if (m.type !== 'filler') c += pv('laborModule');
      modulePrice[m.id] = c * (1 + markup);
    }
    // цокълът се разпределя пропорционално към модулите
    let plinthCost = 0;
    for (const p of built.plinths) {
      const g = groups['board:' + mats.carcass];
      if (g) plinthCost += (groupCost[g.key] * (p.L * p.W)) / totalArea[g.key] + sharedEdge;
    }

    return {
      lines,
      cost,
      net,
      vat,
      gross,
      markup,
      parts: { mat: matCost + edgeCost, hw: hwCost, wt: wtCost, labor: laborCost, install: installCost },
      modulePrice,
      extras: { worktop: wtCost * (1 + markup), install: installCost * (1 + markup), plinth: plinthCost * (1 + markup) },
      wtLen,
      hwTot,
      edges,
    };
  };

  /* ---------- Проверки ---------- */
  M.checks = function (project) {
    const { room, modules } = project;
    const out = [];
    const d = M.dims(room);
    const sinks = modules.filter((m) => m.type === 'base-sink');
    const hobs = modules.filter((m) => m.hob);
    for (const h of hobs) {
      for (const s of sinks.filter((s) => s.wall === h.wall)) {
        const dist = h.x > s.x ? h.x - (s.x + s.w) : s.x - (h.x + h.w);
        if (dist < 300) out.push({ lvl: 'warn', t: `Плочата е на ${Math.max(0, Math.round(dist / 10))} см от мивката. Препоръчително е поне 30 см работна площ между тях.` });
      }
      for (const t of modules.filter((m) => m.wall === h.wall && M.isTall(m.type))) {
        const dist = h.x > t.x ? h.x - (t.x + t.w) : t.x - (h.x + h.w);
        if (dist < 300) out.push({ lvl: 'warn', t: `Плочата е на ${Math.max(0, Math.round(dist / 10))} см от висока колона. Препоръчително е поне 30 см.` });
      }
    }
    for (const f of room.features.filter((f) => f.type === 'window')) {
      if (f.sill < d.counterTop + 20 && modules.some((m) => m.wall === f.wall && m.row === 'base' && m.type !== 'gap' && overlaps(m.x, m.x + m.w, f.x, f.x + f.w)))
        out.push({ lvl: 'warn', t: `Перваза (${f.sill} мм) е по-нисък от плота (${d.counterTop} мм). Прозорецът няма да се отваря свободно.` });
    }
    for (const f of room.features.filter((f) => f.type === 'window')) {
      const top = f.sill + f.h;
      for (const m of modules.filter((m) => m.wall === f.wall && m.row === 'wall' && m.type !== 'gap'))
        if (overlaps(m.x, m.x + m.w, f.x, f.x + f.w) && top > d.upperBottom + 40 && f.sill < d.upperBottom + d.wallH)
          out.push({ lvl: 'warn', t: `Горният шкаф ${m.code} закрива прозореца. Сложи „Свободно място“ над прозореца.` });
    }
    if (room.height < d.upperBottom + d.wallH + 30) out.push({ lvl: 'warn', t: `Горните шкафове (до ${d.upperBottom + d.wallH} мм) не се побират под тавана (${room.height} мм).` });
    if (!modules.some((m) => m.type === 'base-sink')) out.push({ lvl: 'info', t: 'В проекта няма шкаф за мивка.' });
    if (!hobs.length) out.push({ lvl: 'info', t: 'В проекта няма място за плот за готвене.' });
    return out;
  };

  M.fmt = (n, dec = 2) => new Intl.NumberFormat('bg-BG', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
  M.eur = (n) => M.fmt(n, 2) + ' €';
})();
