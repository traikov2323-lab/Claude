/* Модулия — интерфейс: състояние, проект, чертеж, материали, модули, разкрой, оферта, цени. */
(function () {
  const M = (window.M = window.M || {});
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  M.$ = $;
  M.$$ = $$;
  M.esc = esc;

  const LS = 'modulia.v1';
  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(LS + '.' + k);
        return v ? JSON.parse(v) : d;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(LS + '.' + k, JSON.stringify(v));
      } catch (e) {}
    },
  };
  M.store = store;

  M.CITIES = ['София', 'Пловдив', 'Варна', 'Бургас', 'Русе', 'Стара Загора', 'Плевен', 'Сливен', 'Добрич', 'Шумен', 'Перник', 'Хасково', 'Ямбол', 'Пазарджик', 'Благоевград', 'Велико Търново', 'Враца', 'Габрово', 'Друг град'];

  M.defaultProject = function () {
    return {
      id: 'K' + Date.now().toString(36).toUpperCase().slice(-6),
      name: 'Кухня',
      auto: true,
      room: {
        shape: 'L',
        wallA: 3600,
        wallB: 3000,
        height: 2600,
        features: [
          { id: 'f1', type: 'window', wall: 'A', x: 1100, w: 1100, sill: 1000, h: 1350 },
          { id: 'f2', type: 'water', wall: 'A', x: 1650 },
          { id: 'f3', type: 'power', wall: 'B', x: 1500 },
          { id: 'f4', type: 'hood', wall: 'B', x: 1500 },
        ],
        opts: { fridge: true, ovenTall: false, dishwasher: true, uppers: true, wallH: 720, upperBottom: 1440 },
      },
      modules: [],
      mats: { carcass: 'egger-w1000', frontType: 'mdf-mat', frontColor: 'sage', frontDecor: 'egger-h1145', hardware: 'blum', handle: 'bar', worktop: 'wt-oak' },
    };
  };

  const FEAT = {
    window: { label: 'Прозорец', color: '#4a86b8', icon: '▭' },
    water: { label: 'Вода (ВиК)', color: '#2a7de1', icon: '💧' },
    power: { label: 'Ток за плот', color: '#d99400', icon: '⚡' },
    hood: { label: 'Абсорбатор', color: '#6b7280', icon: '⌂' },
  };
  M.FEAT = FEAT;

  /* ---------- Състояние ---------- */
  const S = (M.S = {
    project: store.get('project', null) || M.defaultProject(),
    pricesV: store.get('prices', null),
    catalogPrices: store.get('catalogPrices', null),
    profile: store.get('profile', { name: 'Мебелен цех', city: 'София', phone: '', email: '', lead: '4–6 седмици' }),
    mode: store.get('mode', 'client'),
    view: 'project',
    selFeature: null,
    selModule: null,
    notes: [],
  });

  // цени
  M.prices = function () {
    const p = JSON.parse(JSON.stringify(M.DEFAULT_PRICES));
    if (S.pricesV) for (const [k, v] of Object.entries(S.pricesV)) if (p[k]) p[k].v = v;
    return p;
  };
  const baseCatalog = JSON.parse(JSON.stringify(M.CATALOG));
  M.applyCatalogPrices = function () {
    const cp = S.catalogPrices || {};
    M.CATALOG.boards.forEach((b, i) => (b.price = cp['b:' + b.key] ?? baseCatalog.boards[i].price));
    M.CATALOG.frontTypes.forEach((f, i) => (f.perM2 = cp['f:' + f.key] ?? baseCatalog.frontTypes[i].perM2));
    M.CATALOG.worktops.forEach((w, i) => (w.perM = cp['w:' + w.key] ?? baseCatalog.worktops[i].perM));
    M.CATALOG.hdf.price = cp['hdf'] ?? baseCatalog.hdf.price;
  };
  M.applyCatalogPrices();

  /* ---------- Изчисляване ---------- */
  let view3d = null;
  let rebuildTimer = 0;
  M.recompute = function (opts = {}) {
    const P = S.project;
    if (P.auto || !P.modules.length) {
      const r = M.autoLayout(P.room);
      P.modules = r.modules;
      S.notes = r.notes;
    } else {
      S.notes = M.pack(P.room, P.modules);
    }
    S.built = M.buildProject(P);
    S.groups = M.materialGroups(P, S.built);
    S.pr = M.price(P, S.built, S.groups, M.prices());
    S.checks = S.notes.concat(M.checks(P));
    store.set('project', P);
    renderLight();
    clearTimeout(rebuildTimer);
    const do3d = () => {
      if (view3d) view3d.setProject(P, S.built, { keepCamera: !opts.reframe });
      S.shot = null;
      M.emit('changed');
    };
    if (opts.instant) do3d();
    else rebuildTimer = setTimeout(do3d, opts.fast ? 30 : 90);
  };

  // прост event bus
  const subs = {};
  M.on = (e, f) => (subs[e] = subs[e] || []).push(f);
  M.emit = (e, d) => (subs[e] || []).forEach((f) => f(d));

  function renderLight() {
    if (!S.built) return;
    renderTopPrice();
    renderDimBadge();
    renderFeatures();
    renderElevations();
    renderChecks();
    renderSummary();
    if (S.mode === 'pro') renderModList();
    if (S.view === 'cut') M.renderCut();
    if (S.view === 'request') M.renderRequest();
  }

  /* ---------- Тост ---------- */
  let tt = 0;
  M.toast = function (msg, ms = 2600) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('on'), ms);
  };

  /* ---------- Режим и раздели ---------- */
  const PRO_VIEWS = ['cut', 'offer', 'inbox', 'prices'];
  const CLIENT_VIEWS = ['request'];
  function setMode(mode) {
    S.mode = mode;
    store.set('mode', mode);
    document.body.dataset.mode = mode;
    $('#modeClient').setAttribute('aria-pressed', mode === 'client');
    $('#modePro').setAttribute('aria-pressed', mode === 'pro');
    if ((mode === 'client' && PRO_VIEWS.includes(S.view)) || (mode === 'pro' && CLIENT_VIEWS.includes(S.view))) setView('project');
    renderLight();
  }
  M.setMode = setMode;

  function setView(v, push = true) {
    if (!$('#view-' + v)) v = 'project';
    if (S.mode === 'client' && PRO_VIEWS.includes(v)) setMode('pro');
    if (S.mode === 'pro' && CLIENT_VIEWS.includes(v)) setMode('client');
    S.view = v;
    $$('.view').forEach((s) => s.classList.toggle('on', s.id === 'view-' + v));
    $$('#tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.view === v));
    if (push && location.hash !== '#' + v) {
      try {
        history.replaceState(null, '', '#' + v);
      } catch (e) {
        location.hash = v;
      }
    }
    if (v === 'project' && view3d) view3d.resize();
    if (v === 'cut') M.renderCut();
    if (v === 'offer') M.renderOffer();
    if (v === 'request') M.renderRequest();
    if (v === 'prices') renderPrices();
    M.emit('view', v);
    window.scrollTo({ top: 0 });
  }
  M.setView = setView;

  /* ---------- Горна цена и значка ---------- */
  function renderTopPrice() {
    $('#priceTop').textContent = S.pr ? M.eur(S.pr.gross) : '—';
  }
  function renderDimBadge() {
    const r = S.project.room;
    $('#dimBadge').textContent = (r.shape === 'L' ? 'Г-образна' : 'Права') + ` · A ${r.wallA}` + (r.shape === 'L' ? ` · B ${r.wallB}` : '') + ` · H ${r.height} мм`;
  }

  /* ---------- Стая ---------- */
  function bindRoom() {
    const r = () => S.project.room;
    const sync = () => {
      $('#shapeI').setAttribute('aria-pressed', r().shape === 'I');
      $('#shapeL').setAttribute('aria-pressed', r().shape === 'L');
      $('#wallBField').style.visibility = r().shape === 'L' ? 'visible' : 'hidden';
      $('#wallA').value = r().wallA;
      $('#wallB').value = r().wallB;
      $('#roomH').value = r().height;
      const o = r().opts;
      $('#optFridge').checked = o.fridge;
      $('#optOvenTall').checked = o.ovenTall;
      $('#optDw').checked = o.dishwasher;
      $('#optUppers').checked = o.uppers;
      $('#optWallH').value = o.wallH;
      $('#optUpperBottom').value = o.upperBottom;
      $('#optAuto').checked = S.project.auto;
    };
    M.syncRoomForm = sync;
    sync();
    $$('[data-shape]').forEach((b) =>
      b.addEventListener('click', () => {
        r().shape = b.dataset.shape;
        if (r().shape === 'I') r().features.forEach((f) => (f.wall = 'A'));
        S.project.auto = true;
        sync();
        M.recompute({ reframe: true });
      })
    );
    const num = (id, key, min, max) =>
      $(id).addEventListener('change', (e) => {
        let v = Math.round(+e.target.value || 0);
        v = Math.max(min, Math.min(max, v));
        r()[key] = v;
        e.target.value = v;
        r().features.forEach((f) => {
          const len = f.wall === 'A' ? r().wallA : r().wallB;
          if (f.type === 'window') f.x = Math.min(f.x, Math.max(0, len - f.w));
          else f.x = Math.min(f.x, len - 100);
        });
        S.project.auto = true;
        sync();
        M.recompute({ reframe: true });
      });
    num('#wallA', 'wallA', 1200, 8000);
    num('#wallB', 'wallB', 1200, 8000);
    num('#roomH', 'height', 2200, 4000);
    const opt = (id, key, conv = (x) => x) =>
      $(id).addEventListener('change', (e) => {
        r().opts[key] = e.target.type === 'checkbox' ? e.target.checked : conv(e.target.value);
        S.project.auto = true;
        sync();
        M.recompute();
      });
    opt('#optFridge', 'fridge');
    opt('#optOvenTall', 'ovenTall');
    opt('#optDw', 'dishwasher');
    opt('#optUppers', 'uppers');
    opt('#optWallH', 'wallH', Number);
    opt('#optUpperBottom', 'upperBottom', Number);
    $('#optAuto').addEventListener('change', (e) => {
      S.project.auto = e.target.checked;
      M.recompute();
    });
    $('#btnRelayout').addEventListener('click', () => {
      S.project.auto = true;
      sync();
      M.recompute();
      M.toast('Модулите са подредени наново');
    });
    $$('[data-add]').forEach((b) =>
      b.addEventListener('click', () => {
        const type = b.dataset.add;
        const wall = r().shape === 'L' && type !== 'window' && r().features.some((f) => f.type === type && f.wall === 'A') ? 'B' : 'A';
        const len = wall === 'A' ? r().wallA : r().wallB;
        const f = { id: M.uid('f'), type, wall, x: Math.round(len * (type === 'water' ? 0.4 : 0.65)) };
        if (type === 'window') Object.assign(f, { x: Math.round(len * 0.3), w: 1000, sill: 1000, h: 1300 });
        // една точка вода, ток и абсорбатор
        if (type !== 'window') r().features = r().features.filter((x) => x.type !== type);
        r().features.push(f);
        S.selFeature = f.id;
        S.project.auto = true;
        M.recompute();
      })
    );
  }

  function renderFeatures() {
    const r = S.project.room;
    const list = $('#featList');
    list.innerHTML = '';
    if (!r.features.length) list.innerHTML = '<div class="empty small">Добави прозорец, вода, ток и абсорбатор.</div>';
    for (const f of r.features) {
      const b = document.createElement('button');
      b.className = 'feat';
      b.setAttribute('aria-pressed', S.selFeature === f.id);
      const info = f.type === 'window' ? `${f.x}–${f.x + f.w}` : `x ${f.x}`;
      b.innerHTML = `<span class="dot" style="background:${FEAT[f.type].color}"></span><span>${FEAT[f.type].label}</span><span class="pill">${f.wall}</span><span class="mono">${info}</span>`;
      b.addEventListener('click', () => {
        S.selFeature = S.selFeature === f.id ? null : f.id;
        renderFeatures();
        renderElevations();
      });
      list.appendChild(b);
    }
    const ed = $('#featEdit');
    const f = r.features.find((x) => x.id === S.selFeature);
    if (!f) {
      ed.innerHTML = '';
      return;
    }
    const fld = (k, label) => `<div class="field"><label for="fe_${k}">${label}</label><input id="fe_${k}" type="number" step="10" value="${f[k]}"></div>`;
    ed.innerHTML = `<div class="card pad stack" style="box-shadow:none;background:var(--panel-2)">
      <div class="row" style="justify-content:space-between"><b>${FEAT[f.type].label}</b><button class="btn sm ghost" id="fe_del">Премахни</button></div>
      <div class="grid2">
        ${r.shape === 'L' ? `<div class="field"><label for="fe_wall">Стена</label><select id="fe_wall"><option ${f.wall === 'A' ? 'selected' : ''}>A</option><option ${f.wall === 'B' ? 'selected' : ''}>B</option></select></div>` : ''}
        ${fld('x', f.type === 'window' ? 'От ляво, мм' : 'Център от ляво, мм')}
        ${f.type === 'window' ? fld('w', 'Ширина, мм') + fld('sill', 'Перваз от пода, мм') + fld('h', 'Височина, мм') : ''}
      </div></div>`;
    $('#fe_del').addEventListener('click', () => {
      r.features = r.features.filter((x) => x.id !== f.id);
      S.selFeature = null;
      S.project.auto = true;
      M.recompute();
    });
    for (const k of ['x', 'w', 'sill', 'h']) {
      const el = $('#fe_' + k);
      if (!el) continue;
      el.addEventListener('change', () => {
        f[k] = Math.max(0, Math.round(+el.value || 0));
        S.project.auto = true;
        M.recompute();
      });
    }
    const wsel = $('#fe_wall');
    if (wsel)
      wsel.addEventListener('change', () => {
        f.wall = wsel.value;
        S.project.auto = true;
        M.recompute();
      });
  }

  /* ---------- Чертеж по стени ---------- */
  function renderElevations() {
    const P = S.project;
    const r = P.room;
    const host = $('#elev');
    const walls = r.shape === 'L' ? ['A', 'B'] : ['A'];
    host.innerHTML = '';
    const d = M.dims(r);
    for (const wall of walls) {
      const len = wall === 'A' ? r.wallA : r.wallB;
      const H = r.height;
      const padL = 120,
        padR = 120,
        padT = 230,
        padB = 420;
      const fy = (y) => H - y; // обръщане
      const svgNS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('viewBox', `${-padL} ${-padT} ${len + padL + padR} ${H + padT + padB}`);
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', `Чертеж на стена ${wall}`);
      let h = '';
      const T = (x, y, s, cls = 'txt', anchor = 'middle', size = 62) => `<text x="${x}" y="${y}" class="${cls}" font-size="${size}" text-anchor="${anchor}">${esc(s)}</text>`;
      // мрежа през 500 мм
      for (let x = 500; x < len; x += 500) h += `<line class="grid" x1="${x}" y1="0" x2="${x}" y2="${H}" vector-effect="non-scaling-stroke"/>`;
      h += `<rect class="wall" x="0" y="0" width="${len}" height="${H}" vector-effect="non-scaling-stroke"/>`;
      h += T(-60, -150, `СТЕНА ${wall}`, 'code', 'start', 78);
      h += T(len, -150, `${len} мм`, 'txt', 'end', 66);
      // общ размер
      h += `<line class="dim" x1="0" y1="-60" x2="${len}" y2="-60" vector-effect="non-scaling-stroke"/><line class="dim" x1="0" y1="-90" x2="0" y2="-30" vector-effect="non-scaling-stroke"/><line class="dim" x1="${len}" y1="-90" x2="${len}" y2="-30" vector-effect="non-scaling-stroke"/>`;
      // ъгъл на Г
      if (r.shape === 'L') {
        const cw = wall === 'B' ? [0, 581] : [len - 581, len];
        h += `<rect x="${cw[0]}" y="${fy(d.counterTop)}" width="${cw[1] - cw[0]}" height="${d.counterTop}" fill="url(#hatch${wall})" stroke="none"/>`;
        h += `<defs><pattern id="hatch${wall}" width="60" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="60" style="stroke:var(--line)" stroke-width="14"/></pattern></defs>`;
      }
      // прозорци
      for (const f of r.features.filter((f) => f.wall === wall && f.type === 'window')) {
        h += `<g class="mk${S.selFeature === f.id ? ' sel' : ''}" data-f="${f.id}"><rect class="win halo" x="${f.x}" y="${fy(f.sill + f.h)}" width="${f.w}" height="${f.h}" vector-effect="non-scaling-stroke"/>`;
        h += `<line x1="${f.x + f.w / 2}" y1="${fy(f.sill + f.h)}" x2="${f.x + f.w / 2}" y2="${fy(f.sill)}" stroke="#4a86b8" vector-effect="non-scaling-stroke"/>`;
        h += T(f.x + f.w / 2, fy(f.sill + f.h) + 90, `${f.w}×${f.h}`, 'txt', 'middle', 56) + T(f.x + f.w / 2, fy(f.sill) - 30, `перваз ${f.sill}`, 'txt', 'middle', 50) + '</g>';
      }
      // модули
      const mods = P.modules.filter((m) => m.wall === wall && m.type !== 'gap');
      for (const m of mods) {
        const res = S.built.perModule[m.id];
        const box = M.moduleBox(m, r);
        const y0 = box.y0,
          hh = box.h;
        const sel = S.selModule === m.id;
        h += `<g data-m="${m.id}" style="cursor:pointer"><rect class="mod${sel ? ' sel' : ''}" x="${m.x}" y="${fy(y0 + hh)}" width="${m.w}" height="${hh}" vector-effect="non-scaling-stroke"/>`;
        if (res)
          for (const p of res.parts.filter((p) => p.mat === 'front')) {
            const b = p.box;
            h += `<rect class="front" x="${m.x + b[0]}" y="${fy(y0 + b[4])}" width="${b[3] - b[0]}" height="${b[4] - b[1]}" vector-effect="non-scaling-stroke"/>`;
          }
        if (m.code) h += T(m.x + m.w / 2, fy(y0 + hh / 2) + 22, m.code, 'code', 'middle', m.w < 300 ? 44 : 60);
        h += '</g>';
      }
      // плот
      for (const run of M.worktopRuns(P).filter((x) => x.wall === wall)) h += `<rect class="wt" x="${run.x0}" y="${fy(d.counterTop)}" width="${run.x1 - run.x0}" height="${M.K.worktop}"/>`;
      // верижни размери на долния ред
      const base = mods.filter((m) => m.row === 'base').sort((a, b) => a.x - b.x);
      const dy = H + 110;
      for (const m of base) {
        h += `<line class="dim" x1="${m.x}" y1="${dy - 40}" x2="${m.x}" y2="${dy + 20}" vector-effect="non-scaling-stroke"/>`;
        h += T(m.x + m.w / 2, dy - 12, m.w, 'txt', 'middle', m.w < 300 ? 44 : 54);
      }
      if (base.length) {
        const last = base[base.length - 1];
        h += `<line class="dim" x1="${last.x + last.w}" y1="${dy - 40}" x2="${last.x + last.w}" y2="${dy + 20}" vector-effect="non-scaling-stroke"/><line class="dim" x1="${base[0].x}" y1="${dy}" x2="${last.x + last.w}" y2="${dy}" vector-effect="non-scaling-stroke"/>`;
      }
      // точки
      for (const f of r.features.filter((f) => f.wall === wall && f.type !== 'window')) {
        const yy = f.type === 'water' ? 520 : f.type === 'power' ? 1150 : 1720;
        const c = FEAT[f.type].color;
        const sel = S.selFeature === f.id ? ' sel' : '';
        h += `<g class="mk${sel}" data-f="${f.id}">`;
        h += `<line x1="${f.x}" y1="${fy(yy) + 70}" x2="${f.x}" y2="${H + 260}" stroke="${c}" stroke-dasharray="20 16" vector-effect="non-scaling-stroke"/>`;
        if (f.type === 'hood') h += `<path class="halo" d="M${f.x - 300} ${fy(yy - 90)} L${f.x + 300} ${fy(yy - 90)} L${f.x + 120} ${fy(yy + 160)} L${f.x - 120} ${fy(yy + 160)} Z" fill="${c}" fill-opacity=".85" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
        else h += `<circle class="halo" cx="${f.x}" cy="${fy(yy)}" r="75" fill="${c}" stroke="#fff" stroke-width="2" vector-effect="non-scaling-stroke"/>`;
        h += T(f.x, fy(yy) + 24, f.type === 'water' ? 'В' : f.type === 'power' ? 'Т' : '', 'code', 'middle', 62).replace('class="code"', 'class="code" fill="#fff" style="fill:#fff"');
        h += T(f.x, H + (f.type === 'hood' ? 370 : 300), `${FEAT[f.type].label.split(' ')[0]} ${f.x}`, 'txt', 'middle', 52) + '</g>';
      }
      svg.innerHTML = h;
      const wrap = document.createElement('div');
      wrap.appendChild(svg);
      host.appendChild(wrap);
      bindDrag(svg, wall, len);
    }
  }

  function bindDrag(svg, wall, len) {
    const r = S.project.room;
    svg.dataset.wall = wall;
    const toX = (ev) => {
      const cur = document.querySelector(`#elev svg[data-wall="${wall}"]`) || svg;
      const pt = cur.createSVGPoint();
      pt.x = ev.clientX;
      pt.y = ev.clientY;
      return pt.matrixTransform(cur.getScreenCTM().inverse()).x;
    };
    svg.addEventListener('pointerdown', (ev) => {
      const g = ev.target.closest('[data-f]');
      const gm = ev.target.closest('[data-m]');
      if (!g) {
        if (gm) {
          S.selModule = gm.dataset.m;
          renderElevations();
          if (S.mode === 'pro') renderModList();
        }
        return;
      }
      const f = r.features.find((x) => x.id === g.dataset.f);
      if (!f) return;
      ev.preventDefault();
      S.selFeature = f.id;
      const off = toX(ev) - f.x;
      let raf = 0;
      const move = (e) => {
        e.preventDefault();
        let x = Math.round((toX(e) - off) / 10) * 10;
        const max = f.type === 'window' ? len - f.w : len - 50;
        x = Math.max(f.type === 'window' ? 0 : 50, Math.min(max, x));
        if (x === f.x) return;
        f.x = x;
        S.project.auto = true;
        if (!raf)
          raf = requestAnimationFrame(() => {
            raf = 0;
            M.recompute({ fast: true });
          });
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        window.removeEventListener('pointercancel', up);
        M.recompute();
      };
      window.addEventListener('pointermove', move, { passive: false });
      window.addEventListener('pointerup', up);
      window.addEventListener('pointercancel', up);
    });
  }

  function renderChecks() {
    const host = $('#checks');
    const list = S.checks || [];
    host.innerHTML = list.map((c) => `<div class="chk ${c.lvl}"><i>${c.lvl === 'warn' ? '!' : 'i'}</i><span>${esc(c.t)}</span></div>`).join('');
  }

  function renderSummary() {
    const P = S.project;
    const g = Object.values(S.groups || {});
    const sheets = g.filter((x) => x.kind === 'board').reduce((a, x) => a + x.nest.sheets.length, 0);
    const mods = P.modules.filter((m) => m.type !== 'gap').length;
    const items = [
      ['Модули', mods],
      ['Детайли', S.built.parts.length],
      ['Листа ПДЧ', sheets],
      ['Кант', M.fmt(S.pr.edges.e08 + S.pr.edges.e2, 1) + ' м'],
      ['Плот', M.fmt(S.pr.wtLen, 2) + ' м'],
    ];
    $('#sumline').innerHTML =
      items.map(([a, b], i) => `<div class="${i >= 1 && i <= 3 ? 'pro-only' : ''}"><span>${a}</span><b>${b}</b></div>`).join('') +
      `<div><span>Без ДДС</span><b>${M.eur(S.pr.net)}</b></div><div><span>С ДДС</span><b style="color:var(--accent)">${M.eur(S.pr.gross)}</b></div>`;
  }

  /* ---------- Материали ---------- */
  function bindMaterials() {
    const C = M.CATALOG;
    const mats = () => S.project.mats;
    const swatch = (host, items, sel, onPick, nameEl, nameFn) => {
      host.innerHTML = '';
      for (const it of items) {
        const b = document.createElement('button');
        b.className = 'sw';
        b.title = nameFn(it);
        b.setAttribute('aria-label', nameFn(it));
        b.setAttribute('aria-pressed', it.key === sel);
        b.style.background = it.grain ? `repeating-linear-gradient(90deg, ${it.color}, ${it.color} 3px, color-mix(in srgb, ${it.color} 80%, #5a3a1a) 4px, ${it.color} 6px)` : it.color;
        b.addEventListener('click', () => onPick(it.key));
        host.appendChild(b);
      }
      const cur = items.find((i) => i.key === sel);
      nameEl.textContent = cur ? nameFn(cur) : '';
    };
    const render = () => {
      const m = mats();
      swatch($('#swCarcass'), C.boards, m.carcass, (k) => ((m.carcass = k), changed()), $('#swCarcassName'), (b) => `${b.brand} ${b.name}`);
      const seg = $('#segFront');
      seg.innerHTML = C.frontTypes.map((f) => `<button data-k="${f.key}" aria-pressed="${f.key === m.frontType}">${f.key === 'pdch' ? 'ПДЧ' : f.gloss ? 'МДФ гланц' : 'МДФ мат'}</button>`).join('');
      $$('button', seg).forEach((b) => b.addEventListener('click', () => ((m.frontType = b.dataset.k), changed())));
      const ft = M.frontType(m.frontType);
      if (ft.painted) swatch($('#swFront'), C.paintColors, m.frontColor, (k) => ((m.frontColor = k), changed()), $('#swFrontName'), (c) => c.name + (ft.gloss ? ', гланц' : ', мат'));
      else swatch($('#swFront'), C.boards, m.frontDecor, (k) => ((m.frontDecor = k), changed()), $('#swFrontName'), (b) => `${b.brand} ${b.name}`);
      const hw = $('#segHw');
      hw.innerHTML = C.hardwareBrands.map((h) => `<button data-k="${h.key}" aria-pressed="${h.key === m.hardware}">${h.name}</button>`).join('');
      $$('button', hw).forEach((b) => b.addEventListener('click', () => ((m.hardware = b.dataset.k), changed())));
      $('#hwNote').textContent = C.hardwareBrands.find((h) => h.key === m.hardware).note;
      $('#selHandle').innerHTML = C.handles.map((h) => `<option value="${h.key}" ${h.key === m.handle ? 'selected' : ''}>${h.name}</option>`).join('');
      swatch($('#swWorktop'), C.worktops, m.worktop, (k) => ((m.worktop = k), changed()), $('#swWorktopName'), (w) => w.name);
    };
    const changed = () => {
      render();
      M.recompute();
    };
    $('#selHandle').addEventListener('change', (e) => ((mats().handle = e.target.value), changed()));
    M.renderMaterials = render;
    render();
  }

  /* ---------- Модули (цех) ---------- */
  function renderModList() {
    const P = S.project;
    const host = $('#modList');
    const types = Object.keys(M.TYPE_INFO);
    const walls = P.room.shape === 'L' ? ['A', 'B'] : ['A'];
    $('#addModWall').innerHTML = walls.map((w) => `<option value="${w}">Стена ${w}</option>`).join('');
    if (!$('#addModType').options.length) $('#addModType').innerHTML = types.filter((t) => t !== 'gap').map((t) => `<option value="${t}">${M.typeLabel(t)}</option>`).join('');
    host.innerHTML = '';
    for (const wall of walls)
      for (const row of ['base', 'wall']) {
        const list = P.modules.filter((m) => m.wall === wall && m.row === row);
        if (!list.length) continue;
        const h = document.createElement('div');
        h.className = 'lbl';
        h.textContent = `Стена ${wall} · ${row === 'base' ? 'долен ред и колони' : 'горен ред'}`;
        host.appendChild(h);
        for (const m of list) {
          const okTypes = types.filter((t) => {
            const r = M.TYPE_INFO[t].row;
            return r === 'any' || r === row;
          });
          const div = document.createElement('div');
          div.className = 'modrow' + (S.selModule === m.id ? ' sel' : '');
          div.innerHTML = `<span class="code">${m.code || '—'}</span>
            <select aria-label="Тип">${okTypes.map((t) => `<option value="${t}" ${t === m.type ? 'selected' : ''}>${M.typeLabel(t)}</option>`).join('')}</select>
            <input type="number" aria-label="Ширина" value="${m.w}" min="50" max="1200" step="1">
            <button class="iconbtn" aria-label="Премахни" title="Премахни">✕</button>`;
          const [sel, inp, del] = [div.querySelector('select'), div.querySelector('input'), div.querySelector('button')];
          div.addEventListener('click', () => {
            S.selModule = m.id;
            $$('.modrow', host).forEach((x) => x.classList.toggle('sel', x === div));
            renderElevations();
          });
          sel.addEventListener('change', () => {
            m.type = sel.value;
            m.hob = m.type === 'base-oven' || (m.hob && m.type === 'base-drawers');
            if (m.type === 'base-dw' || M.isTall(m.type)) m.w = 600;
            if (m.type === 'base-corner') m.w = M.K.cornerW;
            P.auto = false;
            M.syncRoomForm();
            M.recompute();
          });
          inp.addEventListener('change', () => {
            m.w = Math.max(50, Math.min(1200, Math.round(+inp.value || m.w)));
            P.auto = false;
            M.syncRoomForm();
            M.recompute();
          });
          del.addEventListener('click', (e) => {
            e.stopPropagation();
            P.modules = P.modules.filter((x) => x !== m);
            P.auto = false;
            M.syncRoomForm();
            M.recompute();
          });
          host.appendChild(div);
        }
      }
  }
  function bindModAdd() {
    $('#btnAddMod').addEventListener('click', () => {
      const P = S.project;
      const type = $('#addModType').value;
      const wall = $('#addModWall').value || 'A';
      const info = M.TYPE_INFO[type];
      const row = info.row === 'wall' ? 'wall' : 'base';
      const w = type === 'base-corner' ? M.K.cornerW : M.isTall(type) || type === 'base-dw' ? 600 : type === 'filler' ? 50 : 600;
      const m = { id: M.uid(), wall, row, type, x: 99999, w, hob: type === 'base-oven' };
      P.modules.push(m);
      P.auto = false;
      S.selModule = m.id;
      M.syncRoomForm();
      M.recompute();
    });
  }

  /* ---------- Разкрой ---------- */
  S.cutGroup = null;
  M.renderCut = function () {
    if (!S.groups) return;
    const groups = Object.values(S.groups).filter((g) => g.nest);
    const boards = groups.filter((g) => g.kind === 'board');
    const sheets = boards.reduce((a, g) => a + g.nest.sheets.length, 0);
    const util = boards.length ? boards.reduce((a, g) => a + g.nest.util * g.nest.sheets.length, 0) / Math.max(1, sheets) : 0;
    const mdf = Object.values(S.groups).find((g) => g.kind === 'mdf');
    $('#cutStats').innerHTML = [
      ['Листа ПДЧ', sheets],
      ['Използване', Math.round(util * 100) + '%'],
      ['Кант 0,8 мм', M.fmt(S.pr.edges.e08, 1) + ' м'],
      ['Кант 2 мм', M.fmt(S.pr.edges.e2, 1) + ' м'],
      ['Листа HDF', (S.groups.hdf ? S.groups.hdf.nest.sheets.length : 0)],
      ['Фронтове МДФ', mdf ? M.fmt(mdf.area, 2) + ' м²' : '—'],
      ['Детайли', S.built.parts.length],
      ['Обков', M.eur(S.pr.parts.hw)],
    ]
      .map(([a, b]) => `<div class="card stat"><span>${a}</span><b>${b}</b></div>`)
      .join('');
    if (!S.cutGroup || !groups.find((g) => g.key === S.cutGroup)) S.cutGroup = groups[0] && groups[0].key;
    $('#cutGroups').innerHTML = groups.map((g) => `<button class="chip" data-g="${esc(g.key)}" aria-pressed="${g.key === S.cutGroup}" style="font-family:var(--f-body)">${esc(g.label)} · ${g.nest.sheets.length} л.</button>`).join('');
    $$('#cutGroups .chip').forEach((b) =>
      b.addEventListener('click', () => {
        S.cutGroup = b.dataset.g;
        M.renderCut();
      })
    );
    const g = groups.find((x) => x.key === S.cutGroup);
    const modIdx = {};
    S.project.modules.forEach((m, i) => (modIdx[m.code] = i));
    const color = (p) => `hsl(${((modIdx[p.module] ?? 7) * 47) % 360} 55% 80%)`;
    $('#cutSheets').innerHTML = g
      ? g.nest.sheets
          .map((s, si) => {
            let h = `<rect x="0" y="0" width="2800" height="2070" style="fill:var(--panel-2);stroke:var(--ink)" stroke-width="4"/>`;
            for (const pl of s.placed) {
              const it = pl.item;
              h += `<rect class="pc" x="${pl.x}" y="${pl.y}" width="${pl.l}" height="${pl.w}" fill="${color(it)}"/>`;
              if (pl.l > 260 && pl.w > 90) h += `<text class="pl" x="${pl.x + 14}" y="${pl.y + 42}">${it.pid} · ${it.module}</text>`;
              if (pl.l > 420 && pl.w > 150) h += `<text class="pl" x="${pl.x + 14}" y="${pl.y + 84}" opacity=".7">${Math.round(it.L)}×${Math.round(it.W)}</text>`;
              if (g.grain && pl.l > 200 && pl.w > 140) h += `<path d="M${pl.x + pl.l - 120} ${pl.y + pl.w - 40} h90 m-20 -14 l20 14 l-20 14" style="stroke:var(--ink)" stroke-width="5" fill="none" opacity=".5"/>`;
            }
            return `<div class="card sheet"><div class="row" style="justify-content:space-between;margin-bottom:6px"><b>Лист ${si + 1}</b><span class="pill ${s.util > 0.75 ? 'ok' : s.util < 0.45 ? 'warn' : ''}">${Math.round(s.util * 100)}% · ${s.placed.length} дет.</span></div><svg viewBox="-10 -10 2820 2090">${h}</svg></div>`;
          })
          .join('')
      : '<div class="empty">Няма детайли за разкрой.</div>';
    // таблица
    const kant = (v) => (v === 2 ? '<span class="kant k2">2</span>' : v === 0.8 ? '<span class="kant k08">0,8</span>' : '<span class="kant">—</span>');
    const rows = S.built.parts.map((p) => {
      const gr = Object.values(S.groups).find((x) => x.items.some((i) => i.pid === p.pid));
      return `<tr><td class="mono">${p.pid}</td><td>${esc(p.name)}</td><td class="mono">${esc(p.module)}</td><td>${esc(gr ? gr.label : '')}</td><td class="num">${Math.round(p.L)}</td><td class="num">${Math.round(p.W)}</td><td>${gr && gr.grain && p.grain ? '↕ по Д' : '—'}</td><td>${kant(p.edges.L1)} ${kant(p.edges.L2)}</td><td>${kant(p.edges.W1)} ${kant(p.edges.W2)}</td></tr>`;
    });
    $('#cutTable').innerHTML = `<thead><tr><th>№</th><th>Детайл</th><th>Модул</th><th>Материал</th><th class="num">Дълж.</th><th class="num">Шир.</th><th>Шарка</th><th>Кант Д1 Д2</th><th>Кант Ш1 Ш2</th></tr></thead><tbody>${rows.join('')}</tbody>`;
    const P = M.prices();
    const hwRows = S.pr.lines.filter((l) => l.cat === 'Обков');
    $('#hwTable').innerHTML = `<thead><tr><th>Артикул</th><th class="num">Количество</th><th>Мярка</th><th class="num">Ед. цена</th><th class="num">Сума</th></tr></thead><tbody>${hwRows
      .map((l) => `<tr><td>${esc(l.label)}</td><td class="num">${M.fmt(l.qty, l.unit === 'м' ? 1 : 0)}</td><td>${l.unit}</td><td class="num">${M.fmt(l.unitPrice)}</td><td class="num">${M.fmt(l.total)}</td></tr>`)
      .join('')}</tbody>`;
  };

  /* ---------- Оферта ---------- */
  M.offerHTML = function (shot) {
    const P = S.project,
      pr = S.pr,
      pf = S.profile;
    const r = P.room;
    const m = P.mats;
    const b = M.board(m.carcass);
    const ft = M.frontType(m.frontType);
    const front = ft.painted ? `${ft.name}, ${M.paint(m.frontColor).name}` : `${ft.name}, ${M.board(m.frontDecor).brand} ${M.board(m.frontDecor).name}`;
    const hwb = M.CATALOG.hardwareBrands.find((h) => h.key === m.hardware);
    const no = 'О-' + new Date().getFullYear() + '-' + P.id.slice(-4);
    const date = new Date().toLocaleDateString('bg-BG');
    const vatK = 1 + (M.prices().vat.v || 0) / 100;
    let rows = '';
    let sum = 0;
    for (const mod of P.modules) {
      if (mod.type === 'gap') continue;
      const v = pr.modulePrice[mod.id] || 0;
      sum += v;
      const box = M.moduleBox(mod, r);
      rows += `<tr><td class="r" style="text-align:left">${mod.code}</td><td>${esc(M.typeLabel(mod.type))}${mod.hob ? ' (под плота за готвене)' : ''}</td><td class="r">${mod.w}×${box.h}×${box.d + 21}</td><td class="r">${M.fmt(v)}</td></tr>`;
    }
    const ex = [
      ['Цокъл', pr.extras.plinth],
      [M.worktop(m.worktop).name + `, ${M.fmt(pr.wtLen, 2)} л.м, с изрязвания`, pr.extras.worktop],
      ['Доставка и монтаж на място', pr.extras.install],
    ];
    for (const [l, v] of ex) {
      sum += v;
      rows += `<tr><td></td><td>${esc(l)}</td><td></td><td class="r">${M.fmt(v)}</td></tr>`;
    }
    const vat = sum * (vatK - 1);
    return `<div class="paper" id="offerPaper">
      <div class="ph"><div><h1>Оферта</h1><div class="meta">№ ${no} · ${date} · валидна 14 дни</div></div>
      <div class="meta" style="text-align:right"><b style="color:#1b1e1c;font-size:14px">${esc(pf.name)}</b><br>${esc(pf.city)}${pf.phone ? ' · ' + esc(pf.phone) : ''}${pf.email ? '<br>' + esc(pf.email) : ''}</div></div>
      <div class="two"><div><h3>Клиент</h3>${esc($('#offerClient') ? $('#offerClient').value : '') || '—'}</div><div><h3>Обект</h3>${r.shape === 'L' ? 'Г-образна кухня' : 'Права кухня'} · стена A ${r.wallA} мм${r.shape === 'L' ? ' · стена B ' + r.wallB + ' мм' : ''} · височина ${r.height} мм</div></div>
      ${shot ? `<img class="shot" src="${shot}" alt="3D изглед на кухнята">` : ''}
      <div class="two">
        <div><h3>Материали</h3>Корпус: ПДЧ 18 мм ${esc(b.brand + ' ' + b.name)}<br>Фронтове: ${esc(front)}<br>Плот: ${esc(M.worktop(m.worktop).name)}</div>
        <div><h3>Обков</h3>${esc(hwb.name)} — ${esc(hwb.note)}<br>Дръжки: ${esc(M.handle(m.handle).name)}<br>Кант: 0,8 мм корпус${ft.painted ? '' : ', 2 мм фронтове'}</div>
      </div>
      <h3>Спецификация</h3>
      <table><thead><tr><th>Код</th><th>Описание</th><th class="r">Ш×В×Д, мм</th><th class="r">Цена, €</th></tr></thead><tbody>${rows}</tbody></table>
      <table class="tot" style="width:auto;margin-left:auto"><tbody>
        <tr><td>Общо без ДДС</td><td class="r">${M.eur(sum)}</td></tr>
        <tr><td>ДДС ${M.prices().vat.v}%</td><td class="r">${M.eur(vat)}</td></tr>
        <tr class="g"><td>Общо</td><td class="r">${M.eur(sum + vat)}</td></tr>
      </tbody></table>
      <div class="two"><div><h3>Срок</h3>${esc(pf.lead || '—')} след оглед и капаро</div><div><h3>Не са включени</h3>Уреди, мивка, смесител, електро- и ВиК работи.</div></div>
      <p class="fine">Цената е ориентировъчна до оглед на място. Размерите се уточняват при оглед. Изготвено с Модулия.</p>
    </div>`;
  };
  M.renderOffer = function () {
    if (!S.shot && view3d) S.shot = view3d.snapshot();
    $('#offerDoc').innerHTML = M.offerHTML(S.shot);
  };

  /* ---------- Запитване (клиент) ---------- */
  M.renderRequest = function () {
    if (!S.shot && view3d) S.shot = view3d.snapshot();
    const P = S.project,
      m = P.mats;
    const ft = M.frontType(m.frontType);
    $('#reqSummary').innerHTML = `${S.shot ? `<img src="${S.shot}" alt="Твоята кухня" style="width:100%;border-radius:8px">` : ''}
      <div class="row" style="justify-content:space-between"><h3>Твоята кухня</h3><span class="big">${M.eur(S.pr.gross)}</span></div>
      <div class="small muted">${P.room.shape === 'L' ? 'Г-образна' : 'Права'}, ${P.modules.filter((x) => x.type !== 'gap').length} модула · корпус ${esc(M.board(m.carcass).brand + ' ' + M.board(m.carcass).name)} · фронтове ${esc(ft.painted ? M.paint(m.frontColor).name + ' ' + (ft.gloss ? 'гланц' : 'мат') : M.board(m.frontDecor).name)} · обков ${esc(m.hardware.toUpperCase())}</div>
      <div class="note">Цената е ориентировъчна, с ДДС, без уредите. Точната оферта идва след оглед.</div>`;
  };

  /* ---------- Цени ---------- */
  function renderPrices() {
    const P = M.prices();
    const C = M.CATALOG;
    let rows = '';
    const row = (id, label, unit, v) => `<tr><td>${esc(label)}</td><td>${unit}</td><td class="num"><input class="inp num" style="width:100px;text-align:right" data-p="${id}" type="number" step="0.01" value="${v}"></td></tr>`;
    rows += `<tr><th colspan="3">Плочи и фронтове</th></tr>`;
    C.boards.forEach((b) => (rows += row('b:' + b.key, `ПДЧ 18 мм ${b.brand} ${b.name}`, 'лист', b.price)));
    rows += row('hdf', C.hdf.name, 'лист', C.hdf.price);
    C.frontTypes.filter((f) => f.painted).forEach((f) => (rows += row('f:' + f.key, 'Фронтове ' + f.name, 'м²', f.perM2)));
    C.worktops.forEach((w) => (rows += row('w:' + w.key, w.name, 'л.м', w.perM)));
    rows += `<tr><th colspan="3">Услуги, обков и труд</th></tr>`;
    for (const [k, p] of Object.entries(P)) rows += row(k, p.label, p.unit, p.v);
    $('#priceTable').innerHTML = `<thead><tr><th>Позиция</th><th>Мярка</th><th class="num">Цена, €</th></tr></thead><tbody>${rows}</tbody>`;
    $$('#priceTable input').forEach((inp) =>
      inp.addEventListener('change', () => {
        const id = inp.dataset.p;
        const v = +inp.value;
        if (/^(b|f|w):|^hdf$/.test(id)) {
          S.catalogPrices = Object.assign({}, S.catalogPrices, { [id]: v });
          store.set('catalogPrices', S.catalogPrices);
          M.applyCatalogPrices();
        } else {
          S.pricesV = Object.assign({}, S.pricesV, { [id]: v });
          store.set('prices', S.pricesV);
        }
        M.recompute({ instant: true });
        M.toast('Цената е запазена');
      })
    );
    const pf = S.profile;
    for (const [id, k] of [
      ['#pfName', 'name'],
      ['#pfCity', 'city'],
      ['#pfPhone', 'phone'],
      ['#pfEmail', 'email'],
      ['#pfLead', 'lead'],
    ]) {
      const el = $(id);
      el.value = pf[k] || '';
      el.onchange = () => {
        pf[k] = el.value;
        store.set('profile', pf);
      };
    }
  }

  /* ---------- Старт ---------- */
  function init() {
    document.body.dataset.mode = S.mode;
    $('#modeClient').addEventListener('click', () => setMode('client'));
    $('#modePro').addEventListener('click', () => setMode('pro'));
    $$('#tabs button').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    $$('[data-go]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.go)));
    $('#rqCity').innerHTML = M.CITIES.map((c) => `<option>${c}</option>`).join('');
    bindRoom();
    bindMaterials();
    bindModAdd();
    $('#pricesReset').addEventListener('click', () => {
      S.pricesV = null;
      S.catalogPrices = null;
      store.set('prices', null);
      store.set('catalogPrices', null);
      M.applyCatalogPrices();
      renderPrices();
      M.recompute({ instant: true });
      M.toast('Върнати са примерните цени');
    });
    $('#offerClient').addEventListener('input', () => M.renderOffer());
    $('#offerRefresh').addEventListener('click', () => {
      S.shot = view3d ? view3d.snapshot() : null;
      M.renderOffer();
    });
    try {
      view3d = M.view3d = new M.View3D($('#view3d'));
    } catch (e) {
      $('#view3d').insertAdjacentHTML('beforeend', '<div class="empty" style="position:absolute;inset:40px">3D изгледът не може да се зареди в този браузър.</div>');
    }
    $('#btnResetCam').addEventListener('click', () => {
      if (view3d) {
        view3d.frame(S.project.room);
        view3d.render();
      }
    });
    setMode(S.mode);
    M.recompute({ instant: true, reframe: true });
    const h = (location.hash || '').slice(1);
    if (h) setView(h, false);
    window.addEventListener('hashchange', () => {
      const v = location.hash.slice(1);
      if (v && v !== S.view) setView(v, false);
    });
    M.emit('ready');
  }
  M.on('init', init);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(() => M.emit('init')));
  else setTimeout(() => M.emit('init'));
})();
