/* Модулия — „Създай кухня“: опростен конструктор в 5 стъпки.
   Готови кухни → размери → шкафове с влачене → цветове → готово. */
(function () {
  const M = window.M;
  const { $, $$, esc } = M;
  const S = M.S;
  const K = M.K;

  const STEPS = ['Начало', 'Размери', 'Шкафове', 'Цветове', 'Готово'];
  const B = { step: 0, wall: 'A', sel: null, view: null, thumbs: null, drag: null };

  /* ---------- Каталог за клиента ---------- */
  const ITEMS = [
    { type: 'base-door', name: 'Шкаф с врата', w: 600, widths: [300, 400, 450, 500, 600, 800, 900, 1000] },
    { type: 'base-drawers', name: 'Чекмеджета', w: 600, widths: [400, 450, 500, 600, 800, 900] },
    { type: 'base-sink', name: 'Мивка', w: 800, widths: [600, 800, 900] },
    { type: 'base-oven', name: 'Фурна и плот', w: 600, widths: [600] },
    { type: 'base-dw', name: 'Съдомиялна', w: 600, widths: [450, 600] },
    { type: 'base-bottle', name: 'Бутилиера', w: 300, widths: [150, 200, 300] },
    { type: 'tall-fridge', name: 'Хладилник', w: 600, widths: [600] },
    { type: 'tall-oven', name: 'Фурна в колона', w: 600, widths: [600] },
    { type: 'tall-oven2', name: 'Колона 2 уреда', w: 600, widths: [600] },
    { type: 'tall-pantry', name: 'Колона килер', w: 600, widths: [450, 500, 600, 900] },
    { type: 'wall-door', name: 'Горен шкаф', w: 600, widths: [300, 400, 450, 500, 600, 800, 900] },
    { type: 'wall-hood', name: 'Аспиратор', w: 600, widths: [600, 900] },
    { type: 'gap', name: 'Свободно място', w: 600, widths: [200, 300, 400, 600, 800, 1000, 1200], any: true },
  ];
  const item = (t) => ITEMS.find((i) => i.type === t);
  const rowOf = (t) => (t === 'wall-door' || t === 'wall-hood' ? 'wall' : 'base');

  const THEMES = [
    { name: 'Бяло и дъб', mats: { frontType: 'mdf-mat', frontColor: 'white', carcass: 'egger-w1000', worktop: 'wt-oak', handle: 'bar' } },
    { name: 'Маслинено', mats: { frontType: 'mdf-mat', frontColor: 'sage', carcass: 'egger-w1000', worktop: 'wt-oak', handle: 'bar' } },
    { name: 'Графит', mats: { frontType: 'mdf-mat', frontColor: 'graphite', carcass: 'egger-u708', worktop: 'wt-oak', handle: 'knob' } },
    { name: 'Топло дърво', mats: { frontType: 'pdch', frontDecor: 'egger-h1145', carcass: 'egger-w1000', worktop: 'wt-marble', handle: 'tipon' } },
    { name: 'Нощно синьо', mats: { frontType: 'mdf-mat', frontColor: 'navy', carcass: 'egger-w1000', worktop: 'wt-marble', handle: 'bar' } },
    { name: 'Кашмир', mats: { frontType: 'mdf-mat', frontColor: 'cashmere', carcass: 'egger-w1000', worktop: 'wt-concrete', handle: 'knob' } },
  ];
  const FRONTS = [
    ...M.CATALOG.paintColors.map((c) => ({ key: 'p:' + c.key, name: c.name, color: c.color, set: { frontType: 'mdf-mat', frontColor: c.key } })),
    { key: 'd:egger-h3734', name: 'Орех Дижон', color: M.board('egger-h3734').color, grain: true, set: { frontType: 'pdch', frontDecor: 'egger-h3734' } },
    { key: 'd:egger-u702', name: 'Кашмир сив', color: M.board('egger-u702').color, set: { frontType: 'pdch', frontDecor: 'egger-u702' } },
    { key: 'd:egger-h1145', name: 'Дъб Бардолино', color: M.board('egger-h1145').color, grain: true, set: { frontType: 'pdch', frontDecor: 'egger-h1145' } },
    { key: 'd:egger-h3303', name: 'Дъб Хамилтън', color: M.board('egger-h3303').color, grain: true, set: { frontType: 'pdch', frontDecor: 'egger-h3303' } },
    { key: 'd:krono-sonoma', name: 'Дъб Сонома', color: M.board('krono-sonoma').color, grain: true, set: { frontType: 'pdch', frontDecor: 'krono-sonoma' } },
    { key: 'd:egger-u999', name: 'Черно', color: M.board('egger-u999').color, set: { frontType: 'pdch', frontDecor: 'egger-u999' } },
  ];
  const CARCASS = ['egger-w1000', 'egger-u708', 'kasta-anthracite', 'egger-h1145', 'egger-h3734'];

  // Готови кухни
  const win = (wall, x, w) => ({ id: M.uid('f'), type: 'window', wall, x, w, sill: 1000, h: 1300 });
  const pt = (type, wall, x) => ({ id: M.uid('f'), type, wall, x });
  const TEMPLATES = [
    {
      name: 'Модерен орех',
      sub: 'Права · 4,4 м · до тавана',
      room: { shape: 'I', wallA: 4400, wallB: 2400, height: 2700, features: [pt('water', 'A', 2800), pt('hood', 'A', 1500)] },
      opts: { fridge: true, ovenTall: true, dishwasher: true, uppers: true, wallH: 'ceil' },
      modules: [
        ['base', 'tall-fridge', 600],
        ['base', 'tall-pantry', 600],
        ['base', 'base-drawers', 600, true],
        ['base', 'base-drawers', 600],
        ['base', 'base-sink', 800],
        ['base', 'base-dw', 600],
        ['base', 'tall-oven2', 600],
        ['wall', 'wall-hood', 600],
        ['wall', 'wall-door', 600],
        ['wall', 'wall-door', 700],
        ['wall', 'wall-door', 700],
      ],
      mats: { frontType: 'pdch', frontDecor: 'egger-h3734', surface: 'flat', zones: { wall: { frontType: 'mdf-mat', frontColor: 'sand', surface: 'fluted' } }, carcass: 'egger-w1000', worktop: 'wt-ceramic', handle: 'gola' },
      look: { splash: 'slab', spots: true, pendant: true, dining: true, decor: false, led: true },
    },
    { name: 'Компактна', sub: 'Права · 2,4 м', room: { shape: 'I', wallA: 2400, wallB: 2400, features: [pt('water', 'A', 700), pt('hood', 'A', 1750)] }, opts: { fridge: false, ovenTall: false, dishwasher: false, uppers: true }, mats: THEMES[0].mats },
    { name: 'Класическа права', sub: 'Права · 3,6 м · хладилник', room: { shape: 'I', wallA: 3600, wallB: 2400, features: [win('A', 900, 1100), pt('water', 'A', 1450), pt('hood', 'A', 2650)] }, opts: { fridge: true, ovenTall: false, dishwasher: true, uppers: true }, mats: THEMES[1].mats },
    { name: 'Ъглова', sub: 'Ъглова · 3,0 × 2,4 м', room: { shape: 'L', wallA: 3000, wallB: 2400, features: [win('A', 700, 1000), pt('water', 'A', 1200), pt('hood', 'B', 1200)] }, opts: { fridge: true, ovenTall: false, dishwasher: true, uppers: true }, mats: THEMES[5].mats },
    { name: 'Голяма ъглова', sub: 'Ъглова · 4,2 × 3,0 м · 2 колони', room: { shape: 'L', wallA: 4200, wallB: 3000, features: [win('A', 1300, 1200), pt('water', 'A', 1900), pt('hood', 'B', 1300)] }, opts: { fridge: true, ovenTall: true, dishwasher: true, uppers: true }, mats: THEMES[2].mats },
    { name: 'Без горни шкафове', sub: 'Права · 3,2 м · светла', room: { shape: 'I', wallA: 3200, wallB: 2400, features: [win('A', 1000, 1200), pt('water', 'A', 1600), pt('hood', 'A', 2600)] }, opts: { fridge: true, ovenTall: false, dishwasher: true, uppers: false }, mats: THEMES[4].mats },
    { name: 'Дървена ъглова', sub: 'Ъглова · 3,6 × 2,8 м', room: { shape: 'L', wallA: 3600, wallB: 2800, features: [win('A', 1100, 1100), pt('water', 'A', 1650), pt('hood', 'B', 1400)] }, opts: { fridge: true, ovenTall: false, dishwasher: true, uppers: true }, mats: THEMES[3].mats },
  ];

  function templateProject(t) {
    const base = M.defaultProject();
    const room = JSON.parse(JSON.stringify(Object.assign({}, base.room, t.room)));
    room.height = (t.room && t.room.height) || 2600;
    room.opts = Object.assign({}, base.room.opts, t.opts);
    const mats = Object.assign({}, base.mats, JSON.parse(JSON.stringify(t.mats)));
    const p = { id: base.id, name: t.name, auto: true, room, modules: [], mats, look: Object.assign({}, M.DEFAULT_LOOK, t.look || {}) };
    if (t.modules) {
      const idx = { base: 0, wall: 0 };
      p.modules = t.modules.map(([row, type, w, hob]) => ({ id: M.uid(), wall: 'A', row, type, w, x: idx[row]++, hob: !!hob || type === 'base-oven' }));
      p.auto = false;
      M.pack(room, p.modules);
    } else {
      p.modules = M.autoLayout(room).modules;
      toManual(p);
    }
    return p;
  }
  // от автоматично към ръчно подреждане: махаме празните места над колоните (пакетирането ги заобикаля само)
  M.toManual = (p) => toManual(p);
  M.builderView = () => B.view;
  function toManual(p) {
    const talls = p.modules.filter((m) => M.isTall(m.type));
    p.modules = p.modules.filter((m) => !(m.type === 'gap' && m.row === 'wall' && talls.some((t) => t.wall === m.wall && Math.abs(t.x - m.x) < 2)));
    p.auto = false;
  }

  /* ---------- Пиктограми ---------- */
  function frontFill(z = 'base') {
    return M.frontColorHex(S.project.mats, z);
  }
  const lum = (hex) => {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  };
  const zoneOfType = (t) => (t.startsWith('tall') ? 'tall' : t.startsWith('wall') ? 'wall' : 'base');
  // Изглед отпред на шкаф (viewBox = w × h в мм), в цвета и повърхността на зоната му
  function pict(type, w, h, opt = {}) {
    const mats = S.project.mats;
    const zone = opt.zone || zoneOfType(type);
    const zm = M.zone(mats, zone);
    const fill = opt.fill || M.frontColorHex(mats, zone);
    const surface = zm.surface;
    const hs = opt.handle || mats.handle;
    const line = lum(fill) < 0.45 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.22)';
    const golaBase = hs === 'gola' && zone === 'base';
    const black = hs === 'barblack' || hs === 'long' || (hs === 'gola' && zone === 'tall');
    const hc = black || hs === 'knob' ? '#1f1f22' : '#9a9ca0';
    const H = (x, y, vert, room = 400) => {
      if (hs === 'tipon' || (hs === 'gola' && zone !== 'tall')) return '';
      if (hs === 'knob') return `<circle cx="${x}" cy="${y}" r="16" fill="${hc}"/>`;
      const len = hs === 'long' || hs === 'gola' ? Math.min(vert ? 900 : 560, room * 0.7) : 140;
      return vert ? `<rect x="${x - 7}" y="${y - len / 2}" width="14" height="${len}" rx="7" fill="${hc}"/>` : `<rect x="${x - len / 2}" y="${y - 7}" width="${len}" height="14" rx="7" fill="${hc}"/>`;
    };
    const R = (x, y, ww, hh) => {
      let r = `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" rx="6" fill="${fill}" stroke="${line}" stroke-width="4"/>`;
      if (surface === 'fluted') for (let fx = x + 25; fx < x + ww - 10; fx += 25) r += `<line x1="${fx}" y1="${y + 6}" x2="${fx}" y2="${y + hh - 6}" stroke="${line}" stroke-width="3"/>`;
      if (surface === 'shaker' && ww > 200 && hh > 200) r += `<rect x="${x + 55}" y="${y + 55}" width="${ww - 110}" height="${hh - 110}" rx="4" fill="none" stroke="${line}" stroke-width="5"/>`;
      if (golaBase) r += `<rect x="${x}" y="${y}" width="${ww}" height="30" fill="#2a2a2d"/>`;
      return r;
    };
    let g = '';
    if (type === 'gap') return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="14" fill="none" stroke="currentColor" stroke-opacity=".35" stroke-width="6" stroke-dasharray="26 20"/></svg>`;
    const oven = (y, hh) => `<rect x="4" y="${y}" width="${w - 8}" height="${hh}" rx="8" fill="#1d1d1f"/><rect x="${w * 0.14}" y="${y + hh * 0.22}" width="${w * 0.72}" height="${hh * 0.6}" rx="10" fill="#3a3a3c"/><rect x="${w * 0.2}" y="${y + 18}" width="${w * 0.6}" height="12" rx="6" fill="#8e8e93"/>`;
    if (type === 'base-drawers') {
      const hs3 = [0.25, 0.375, 0.375];
      let y = 4;
      hs3.forEach((k) => {
        const hh = (h - 16) * k;
        g += R(4, y, w - 8, hh - 4) + H(w / 2, y + 50, false, w);
        y += hh + 4;
      });
    } else if (type === 'base-oven') {
      g += R(4, 4, w - 8, h * 0.17) + H(w / 2, 4 + h * 0.08, false, w) + oven(h * 0.2, h * 0.78);
    } else if (type === 'base-dw') {
      g += R(4, 4, w - 8, h - 8) + (golaBase || hs === 'tipon' ? '' : `<rect x="${w * 0.2}" y="40" width="${w * 0.6}" height="14" rx="7" fill="${hc}"/>`);
    } else if (type === 'wall-hood') {
      g += R(4, 4, w - 8, h - 190) + H(w / 2, h - 240, false, w) + `<rect x="10" y="${h - 180}" width="${w - 20}" height="176" rx="8" fill="#a1a1a6"/>`;
    } else if (type === 'tall-fridge') {
      const top = h - 1790;
      g += R(4, 4, w - 8, top - 6) + R(4, top + 2, w - 8, h - top - 6) + H(w - 50, top + 600, true, 1700);
    } else if (type === 'tall-oven') {
      g += R(4, 4, w - 8, h - 1351 - 8) + oven(h - 1351, 595) + R(4, h - 720, w - 8, 716) + H(w - 50, h - 360, true, 700);
    } else if (type === 'tall-oven2') {
      const yTop = h - (720 + 18 + 595 + 18 + 455 + 18);
      g += (yTop > 150 ? R(4, 4, w - 8, yTop - 6) : '') + oven(yTop + 2, 455) + oven(yTop + 475, 595) + R(4, h - 718, w - 8, 355) + R(4, h - 360, w - 8, 356) + H(w / 2, h - 690, false, w) + H(w / 2, h - 330, false, w);
    } else if (type === 'tall-pantry') {
      const ySplit = Math.min(h - 360, 1480);
      const two = w > 600;
      const col = (x0, dw, hx) => R(x0, 4, dw, h - ySplit - 8) + R(x0, h - ySplit + 2, dw, ySplit - 6) + H(hx, h - ySplit + 500, true, 1400);
      if (two) {
        const dw = (w - 12) / 2;
        g += col(4, dw, 4 + dw - 40) + col(8 + dw, dw, 8 + dw + 40);
      } else g += col(4, w - 8, w - 50);
    } else {
      // врати (+ горен ред при шкафове до тавана)
      const two = w > 600 && type !== 'base-bottle';
      const top = type.startsWith('wall');
      const split = top && h > 1000 ? 380 : 0;
      const doorRow = (y0, hh, hy) => {
        if (two) {
          const dw = (w - 12) / 2;
          return R(4, y0, dw, hh) + R(8 + dw, y0, dw, hh) + H(4 + dw - 40, hy, true, hh) + H(8 + dw + 40, hy, true, hh);
        }
        return R(4, y0, w - 8, hh) + H(type === 'base-bottle' ? w / 2 : w - 50, type === 'base-bottle' ? y0 + 50 : hy, type !== 'base-bottle', hh);
      };
      if (split) g += doorRow(4, split - 8, split - 110) + doorRow(split + 2, h - split - 6, h - 110);
      else g += doorRow(4, h - 8, top ? h - 110 : 110);
      if (type === 'base-sink') g += `<path d="M${w / 2 - 40} ${-2} v-46 a30 30 0 0 1 60 0 v18" fill="none" stroke="#8e8e93" stroke-width="12" stroke-linecap="round"/>`;
    }
    return `<svg viewBox="0 ${type === 'base-sink' ? -80 : 0} ${w} ${h + (type === 'base-sink' ? 80 : 0)}" preserveAspectRatio="none">${g}</svg>`;
  }

  /* ---------- Рамка: стъпки, 3D, цена ---------- */
  function go(step) {
    B.step = Math.max(0, Math.min(4, step));
    B.sel = null;
    render();
    const main = $('#bMain');
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(main, { opacity: 0, x: 16 }, { opacity: 1, x: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  M.builderGo = go;

  function render() {
    $('#bSteps').innerHTML = STEPS.map((s, i) => `<button data-s="${i}" aria-current="${i === B.step ? 'step' : 'false'}" class="${i < B.step ? 'done' : ''}"><span>${i < B.step ? '✓' : i + 1}</span>${s}</button>`).join('');
    $$('#bSteps button').forEach((b) => b.addEventListener('click', () => go(+b.dataset.s)));
    $('#bBack').hidden = B.step === 0;
    $('#bNext').hidden = B.step === 0 || B.step === 4;
    $('#bNext').innerHTML = `${['', 'Към шкафовете', 'Към цветовете', 'Готово', ''][B.step]} <svg class="ic"><use href="#i-arrow"/></svg>`;
    [renderStart, renderSize, renderCabinets, renderColors, renderDone][B.step]();
    renderSide();
  }

  function renderSide() {
    if (!S.pr) return;
    M.countTo($('#bPrice'), S.pr.gross);
    const n = S.project.modules.filter((m) => m.type !== 'gap').length;
    const r = S.project.room;
    $('#bSum').textContent = `${r.shape === 'L' ? 'Ъглова' : 'Права'} · ${r.wallA / 10}${r.shape === 'L' ? ' × ' + r.wallB / 10 : ''} см · ${n} шкафа`;
  }

  function ensureView() {
    if (B.view) return;
    try {
      B.view = new M.View3D($('#b3d'), { bg: '#eef0f4' });
    } catch (e) {}
  }
  let lastKey = '';
  function update3d() {
    if (S.view !== 'builder' || !B.view || !S.built) return;
    const r = S.project.room;
    const key = r.shape + r.wallA + 'x' + r.wallB;
    B.view.setProject(S.project, S.built, { keepCamera: key === lastKey, look: { spin: false } });
    lastKey = key;
  }

  function apply(fn, opts = {}) {
    if (S.project.auto) toManual(S.project);
    fn(S.project);
    S.project.auto = false;
    if (M.syncRoomForm) M.syncRoomForm();
    M.recompute(opts);
    renderSide();
  }

  /* ---------- 1. Начало ---------- */
  function renderStart() {
    $('#bMain').innerHTML = `<div class="stack"><div><h2>С какво започваме?</h2><p class="muted" style="margin:6px 0 0">Избери готова кухня и я промени, или започни от празна стена.</p></div>
      <div class="tgrid" id="bTpl">
        <button class="card tcard zero" data-t="zero"><span class="tz"><svg class="ic lg"><use href="#i-room"/></svg></span><b>Започни от нулата</b><span class="muted small">Въведи размерите си и подреди шкафовете сам</span></button>
        <button class="card tcard zero photo" data-t="photo"><span class="tz"><svg class="ic lg"><use href="#i-sparkles"/></svg></span><b>Кухня от снимка</b><span class="muted small">Качи снимка на кухня, която харесваш, и виж я в своята стая</span></button>
        ${TEMPLATES.map((t, i) => `<button class="card tcard" data-t="${i}"><span class="timg">${B.thumbs && B.thumbs[i] ? `<img src="${B.thumbs[i].img}" alt="">` : '<span class="shimmer" style="display:block;height:100%"></span>'}</span><span class="tmeta"><b>${esc(t.name)}</b><span class="muted small">${esc(t.sub)}</span></span>${B.thumbs && B.thumbs[i] ? `<span class="tprice">от ${M.eur(B.thumbs[i].price)}</span>` : ''}</button>`).join('')}
      </div></div>`;
    $$('#bTpl [data-t]').forEach((b) =>
      b.addEventListener('click', () => {
        if (b.dataset.t === 'photo') return M.setView('photo');
        if (b.dataset.t === 'zero') {
          const p = M.defaultProject();
          p.room.features = [];
          p.room.shape = 'I';
          p.room.wallA = 3000;
          p.modules = [];
          p.auto = false;
          p.look = Object.assign({}, M.DEFAULT_LOOK);
          M.loadProject(p, { stay: true });
          go(1);
        } else {
          M.loadProject(templateProject(TEMPLATES[+b.dataset.t]), { stay: true });
          M.toast('Кухнята е заредена. Промени каквото искаш.');
          go(2);
        }
      })
    );
    if (!B.thumbs) makeThumbs();
  }

  function makeThumbs() {
    B.thumbs = [];
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;left:-6000px;top:0;width:480px;height:340px';
    document.body.appendChild(div);
    let v;
    try {
      v = new M.View3D(div, { size: [480, 340], lowRes: true, bg: '#eef0f4' });
    } catch (e) {
      return;
    }
    const prices = M.prices();
    let i = 0;
    const next = () => {
      if (i >= TEMPLATES.length) {
        v.dispose();
        div.remove();
        return;
      }
      const p = templateProject(TEMPLATES[i]);
      M.pack(p.room, p.modules);
      const built = M.buildProject(p);
      const pr = M.price(p, built, M.materialGroups(p, built), prices);
      v.setProject(p, built, { look: { spin: false, decor: true } });
      B.thumbs[i] = { img: v.snapshot('image/jpeg', 0.82), price: pr.gross };
      const slot = $(`#bTpl [data-t="${i}"]`);
      if (slot) {
        slot.querySelector('.timg').innerHTML = `<img src="${B.thumbs[i].img}" alt="">`;
        if (!slot.querySelector('.tprice')) slot.insertAdjacentHTML('beforeend', `<span class="tprice">от ${M.eur(pr.gross)}</span>`);
      }
      i++;
      setTimeout(next, 30);
    };
    setTimeout(next, 50);
  }

  /* ---------- 2. Размери ---------- */
  function renderSize() {
    const r = S.project.room;
    const w = r.features.find((f) => f.type === 'window' && f.wall === 'A');
    const step = (id, label, val, min, max) => `<div class="stepper"><span class="lbl">${label}</span><div class="stp"><button data-d="-10" data-k="${id}" aria-label="По-малко">−</button><input id="bs_${id}" inputmode="numeric" value="${val / 10}" aria-label="${label}"><span class="u">см</span><button data-d="10" data-k="${id}" aria-label="Повече">+</button></div></div>`;
    $('#bMain').innerHTML = `<div class="stack"><div><h2>Какви са размерите?</h2><p class="muted" style="margin:6px 0 0">Измери стените, на които ще е кухнята. Може и приблизително, после се коригира.</p></div>
      <div class="shapepick">
        <button data-shape="I" aria-pressed="${r.shape === 'I'}"><svg viewBox="0 0 120 80"><rect x="10" y="14" width="100" height="16" rx="3"/><line x1="10" y1="10" x2="110" y2="10"/></svg><b>Права</b><span class="small muted">по една стена</span></button>
        <button data-shape="L" aria-pressed="${r.shape === 'L'}"><svg viewBox="0 0 120 80"><path d="M10 14h100v58h-16V30H10z"/><path d="M10 10h104v62" fill="none"/></svg><b>Ъглова</b><span class="small muted">по две стени</span></button>
      </div>
      <div class="steppers">
        ${step('wallA', r.shape === 'L' ? 'Стена A (основна)' : 'Дължина на стената', r.wallA)}
        ${r.shape === 'L' ? step('wallB', 'Стена B (вдясно)', r.wallB) : ''}
        ${step('height', 'Височина на тавана', r.height)}
      </div>
      <div class="row"><span class="lbl" style="width:130px">Горни шкафове</span><div class="seg" id="bUpH">${[
        ['none', 'Без'],
        ['720', '72 см'],
        ['900', '90 см'],
        ['ceil', 'До тавана'],
      ]
        .map(([k, n]) => `<button data-k="${k}" aria-pressed="${r.opts.uppers === false ? k === 'none' : String(r.opts.wallH || 720) === k}">${n}</button>`)
        .join('')}</div></div>
      <div class="card pad stack" style="box-shadow:none;background:var(--fill)">
        <label class="switch" style="padding:0">Има прозорец на стена A<input type="checkbox" id="bWin" ${w ? 'checked' : ''}></label>
        ${w ? `<div class="row"><span class="lbl" style="width:90px">Къде</span><div class="seg" id="bWinPos">${[['Вляво', 0.15], ['В средата', 0.5], ['Вдясно', 0.85]].map(([n, k]) => `<button data-k="${k}" aria-pressed="${Math.abs(w.x + w.w / 2 - r.wallA * k) < r.wallA * 0.12}">${n}</button>`).join('')}</div></div>
        <div class="row"><span class="lbl" style="width:90px">Широк</span><div class="seg" id="bWinW">${[80, 100, 120, 140].map((c) => `<button data-w="${c * 10}" aria-pressed="${w.w === c * 10}">${c} см</button>`).join('')}</div></div>` : ''}
      </div></div>`;
    $$('.shapepick button').forEach((b) =>
      b.addEventListener('click', () => {
        apply((p) => {
          p.room.shape = b.dataset.shape;
          if (p.room.shape === 'L') {
            if (!p.modules.some((m) => m.type === 'base-corner')) p.modules.push({ id: M.uid(), wall: 'A', row: 'base', type: 'base-corner', x: 1e9, w: K.cornerW });
          } else {
            p.modules = p.modules.filter((m) => m.wall === 'A' && m.type !== 'base-corner');
            p.room.features = p.room.features.filter((f) => f.wall === 'A');
          }
        }, { reframe: true });
        renderSize();
      })
    );
    const setDim = (k, v) => {
      const lim = k === 'height' ? [2200, 4000] : [1200, 8000];
      v = Math.max(lim[0], Math.min(lim[1], Math.round(v / 10) * 10));
      apply((p) => {
        p.room[k] = v;
        p.room.features.forEach((f) => {
          const len = f.wall === 'A' ? p.room.wallA : p.room.wallB;
          if (f.type === 'window') f.x = Math.min(f.x, Math.max(0, len - f.w));
          else f.x = Math.min(f.x, len - 100);
        });
      }, { reframe: true });
      const inp = $('#bs_' + k);
      if (inp) inp.value = v / 10;
    };
    $$('.stp button').forEach((b) => b.addEventListener('click', () => setDim(b.dataset.k, S.project.room[b.dataset.k] + +b.dataset.d * 10)));
    $$('.stp input').forEach((inp) => inp.addEventListener('change', () => setDim(inp.id.slice(3), (parseFloat(inp.value.replace(',', '.')) || 0) * 10)));
    $$('#bUpH button').forEach((b) =>
      b.addEventListener('click', () => {
        const k = b.dataset.k;
        apply((p) => {
          if (k === 'none') {
            p.room.opts.uppers = false;
            p.modules = p.modules.filter((m) => m.row !== 'wall');
          } else {
            p.room.opts.uppers = true;
            p.room.opts.wallH = k === 'ceil' ? 'ceil' : +k;
          }
        });
        if (k !== 'none' && !S.project.modules.some((m) => m.row === 'wall')) M.toast('Добави горни шкафове в стъпка „Шкафове“');
        renderSize();
      })
    );
    $('#bWin').addEventListener('change', (e) => {
      apply((p) => {
        p.room.features = p.room.features.filter((f) => !(f.type === 'window' && f.wall === 'A'));
        if (e.target.checked) p.room.features.push(win('A', Math.round(p.room.wallA / 2 - 550), 1100));
      });
      renderSize();
    });
    $$('#bWinPos button').forEach((b) =>
      b.addEventListener('click', () => {
        apply((p) => {
          const f = p.room.features.find((f) => f.type === 'window' && f.wall === 'A');
          f.x = Math.max(0, Math.min(p.room.wallA - f.w, Math.round((p.room.wallA * +b.dataset.k - f.w / 2) / 10) * 10));
        });
        renderSize();
      })
    );
    $$('#bWinW button').forEach((b) =>
      b.addEventListener('click', () => {
        apply((p) => {
          const f = p.room.features.find((f) => f.type === 'window' && f.wall === 'A');
          const c = f.x + f.w / 2;
          f.w = +b.dataset.w;
          f.x = Math.max(0, Math.min(p.room.wallA - f.w, Math.round(c - f.w / 2)));
        });
        renderSize();
      })
    );
  }

  /* ---------- 3. Шкафове ---------- */
  function rowList(wall, row) {
    return S.project.modules.filter((m) => m.wall === wall && m.row === row && m.type !== 'base-corner').sort((a, b) => a.x - b.x);
  }
  function reorder(wall, row, list) {
    list.forEach((m, i) => (m.x = i));
  }
  function capacity(wall, row) {
    const r = S.project.room;
    const len = wall === 'A' ? r.wallA : r.wallB;
    const range = M.rowRange(r, wall, row);
    let avail = range[1] - range[0];
    if (row === 'base' && r.shape === 'L' && wall === 'A') avail -= K.cornerW;
    if (row === 'wall') avail -= S.project.modules.filter((m) => m.wall === wall && M.isTall(m.type)).reduce((a, m) => a + m.w, 0);
    const used = rowList(wall, row).reduce((a, m) => a + m.w, 0);
    return { avail, used, free: avail - used, len };
  }

  function renderCabinets() {
    const r = S.project.room;
    if (r.shape !== 'L') B.wall = 'A';
    $('#bMain').innerHTML = `<div class="stack">
      <div class="row" style="justify-content:space-between;align-items:flex-end"><div><h2>Подреди шкафовете</h2><p class="muted" style="margin:6px 0 0">Плъзни шкаф върху стената или го докосни, за да се добави. Натисни шкаф, за да смениш ширината.</p></div>
      ${r.shape === 'L' ? `<div class="seg" id="bWall"><button data-w="A" aria-pressed="${B.wall === 'A'}">Стена A</button><button data-w="B" aria-pressed="${B.wall === 'B'}">Стена B</button></div>` : ''}</div>
      <div class="boardwrap"><div class="board" id="bBoard"></div></div>
      <div id="bCap" class="capbar"></div>
      <div id="bSel"></div>
      <div class="palette" id="bPal">
        <div class="pgroup"><span class="lbl">Долни шкафове и уреди</span><div class="pitems">${ITEMS.filter((i) => rowOf(i.type) === 'base').map((i) => palCard(i)).join('')}</div></div>
        <div class="pgroup"><span class="lbl">Горни шкафове</span><div class="pitems">${ITEMS.filter((i) => rowOf(i.type) === 'wall' || i.any).map((i) => palCard(i, i.any ? 'wall' : null)).join('')}</div></div>
      </div>
      <div class="row">
        <button class="btn" id="bAuto"><svg class="ic"><use href="#i-sparkles"/></svg>Подреди автоматично</button>
        <button class="btn" id="bFill">Запълни празното</button>
        <button class="btn link" id="bClear">Изчисти стената</button>
      </div></div>`;
    $$('#bWall button').forEach((b) =>
      b.addEventListener('click', () => {
        B.wall = b.dataset.w;
        B.sel = null;
        renderCabinets();
      })
    );
    $$('#bPal .pcard').forEach(bindPalette);
    $('#bAuto').addEventListener('click', () => {
      S.project.auto = true;
      M.recompute({ instant: true });
      toManual(S.project);
      M.recompute();
      renderCabinets();
      M.toast('Шкафовете са подредени автоматично');
    });
    $('#bFill').addEventListener('click', fillFree);
    $('#bClear').addEventListener('click', () => {
      apply((p) => (p.modules = p.modules.filter((m) => m.wall !== B.wall || m.type === 'base-corner')));
      B.sel = null;
      renderCabinets();
    });
    drawBoard();
  }

  function palCard(i, forceRow) {
    const h = i.type.startsWith('tall') ? 2060 : 720;
    return `<button class="pcard" data-type="${i.type}" data-row="${forceRow || rowOf(i.type)}" title="${esc(i.name)}"><span class="pv ${i.type.startsWith('tall') ? 'tall' : ''}">${pict(i.type, i.w, h)}</span><span class="pn">${esc(i.name)}</span><span class="pw">${i.w / 10} см</span></button>`;
  }

  function addModule(type, row, index) {
    const it = item(type);
    apply((p) => {
      const list = rowList(B.wall, row);
      const m = { id: M.uid(), wall: B.wall, row, type, x: 0, w: it.w, hob: type === 'base-oven' };
      list.splice(index == null ? list.length : index, 0, m);
      p.modules.push(m);
      reorder(B.wall, row, list);
      B.sel = m.id;
    });
    drawBoard();
  }

  function fillFree() {
    apply((p) => {
      for (const row of ['base', 'wall']) {
        if (row === 'wall' && !p.room.opts.uppers && !rowList(B.wall, 'wall').length) continue;
        const c = capacity(B.wall, row);
        let g = c.free;
        if (g < 150) continue;
        const list = rowList(B.wall, row);
        if (row === 'wall' && !list.length) {
          for (const it of upperPlan(p)) list.push({ id: M.uid(), wall: B.wall, row, type: it.type, x: 0, w: it.w });
          list.forEach((m) => p.modules.push(m));
          reorder(B.wall, row, list);
          continue;
        }
        let n = Math.max(1, Math.round(g / 600));
        while (n > 1 && g / n < 300) n--;
        const w = Math.floor(g / n / 10) * 10;
        for (let i = 0; i < n; i++) list.push({ id: M.uid(), wall: B.wall, row, type: row === 'wall' ? 'wall-door' : 'base-door', x: 0, w: i === n - 1 ? g - w * (n - 1) : w });
        list.forEach((m) => {
          if (!p.modules.includes(m)) p.modules.push(m);
        });
        reorder(B.wall, row, list);
      }
    });
    drawBoard();
    M.toast('Празното място е запълнено с шкафове');
  }

  // горен ред от нулата: шкафове навсякъде освен над прозореца (колоните се заобикалят при подреждането)
  function upperPlan(p) {
    const r = p.room;
    const d = M.dims(r);
    const range = M.rowRange(r, B.wall, 'wall');
    const obs = [];
    p.modules.filter((m) => m.wall === B.wall && M.isTall(m.type)).forEach((m) => obs.push({ a: m.x, b: m.x + m.w, win: false }));
    r.features
      .filter((f) => f.type === 'window' && f.wall === B.wall && f.sill < d.upperBottom + d.wallH && f.sill + f.h > d.upperBottom + 40)
      .forEach((f) => obs.push({ a: Math.max(range[0], f.x - 50), b: Math.min(range[1], f.x + f.w + 50), win: true }));
    obs.sort((x, y) => x.a - y.a);
    const out = [];
    const seg = (g) => {
      if (g < 20) return;
      if (g < 250) return out.push({ type: 'gap', w: g });
      let n = Math.max(1, Math.round(g / 600));
      while (n > 1 && g / n < 300) n--;
      const w = Math.floor(g / n / 10) * 10;
      for (let i = 0; i < n; i++) out.push({ type: 'wall-door', w: i === n - 1 ? g - w * (n - 1) : w });
    };
    let cur = range[0];
    for (const o of obs) {
      if (o.b <= cur) continue;
      const a = Math.max(cur, o.a);
      seg(a - cur);
      if (o.win) out.push({ type: 'gap', w: o.b - a });
      cur = o.b;
    }
    seg(range[1] - cur);
    return out;
  }

  // мащаб и разположение на дъската
  function geom() {
    const r = S.project.room;
    const len = B.wall === 'A' ? r.wallA : r.wallB;
    const wrapW = Math.max(300, ($('.boardwrap') || {}).clientWidth || 700);
    const s = Math.min((wrapW - 20) / len, 400 / r.height);
    return { s, len, H: r.height, W: len * s, Hp: r.height * s, d: M.dims(r) };
  }

  function drawBoard() {
    const board = $('#bBoard');
    if (!board) return;
    const P = S.project;
    const r = P.room;
    const g = geom();
    const { s, H, d } = g;
    board.style.width = g.W + 'px';
    board.style.height = g.Hp + 'px';
    const Y = (mm) => (H - mm) * s;
    const wt = M.worktop(P.mats.worktop);
    let html = '';
    // зони за пускане
    html += `<div class="zone" data-zone="wall" style="left:0;width:${g.W}px;top:${Y(d.upperBottom + d.wallH)}px;height:${d.wallH * s}px"></div>`;
    html += `<div class="zone" data-zone="base" style="left:0;width:${g.W}px;top:${Y(K.plinth + K.baseH)}px;height:${K.baseH * s}px"></div>`;
    // прозорци
    for (const f of r.features.filter((f) => f.type === 'window' && f.wall === B.wall)) html += `<div class="bwin" style="left:${f.x * s}px;width:${f.w * s}px;top:${Y(f.sill + f.h)}px;height:${f.h * s}px"></div>`;
    // ъгъл
    if (r.shape === 'L' && B.wall === 'B') html += `<div class="bcorner" style="left:0;width:${581 * s}px;top:${Y(K.plinth + K.baseH + K.worktop)}px;height:${(K.plinth + K.baseH + K.worktop) * s}px"><span>ъгъл</span></div>`;
    // плот
    const wth = wt.thin ? 12 : K.worktop;
    for (const run of M.worktopRuns(P).filter((x) => x.wall === B.wall)) html += `<div class="bwt" style="left:${run.x0 * s}px;width:${(run.x1 - run.x0) * s}px;top:${Y(K.plinth + K.baseH + wth)}px;height:${Math.max(3, wth * s)}px;background:${wt.color}"></div>`;
    // шкафове
    for (const m of P.modules.filter((m) => m.wall === B.wall)) {
      const box = M.moduleBox(m, r);
      const corner = m.type === 'base-corner';
      const t = corner ? 'base-door' : m.type;
      html += `<div class="bcab${B.sel === m.id ? ' sel' : ''}${corner ? ' fixed' : ''}${m.type === 'gap' ? ' gapc' : ''}" data-id="${m.id}" style="left:${m.x * s}px;width:${m.w * s}px;top:${Y(box.y0 + box.h)}px;height:${box.h * s}px" title="${esc(corner ? 'Ъглов шкаф' : (item(m.type) || {}).name || '')} · ${m.w / 10} см">${pict(t, m.w, box.h)}<span class="bw">${corner ? 'ъгъл' : m.w / 10}</span></div>`;
    }
    html += `<div class="bfloor"></div><div class="marker" id="bMarker" hidden></div>`;
    board.innerHTML = html;
    $$('.bcab', board).forEach(bindCab);
    // капацитет
    const cap = (row) => {
      const c = capacity(B.wall, row);
      const pct = Math.min(100, (c.used / Math.max(1, c.avail)) * 100);
      const over = c.free < -5;
      return `<div class="cap"><div class="row" style="justify-content:space-between"><span>${row === 'base' ? 'Долен ред' : 'Горен ред'}</span><b class="${over ? 'bad' : c.free < 30 ? 'okc' : ''}">${over ? `Излиза с ${Math.round(-c.free / 10)} см` : c.free < 30 ? 'Запълнен ✓' : `Свободни ${Math.round(c.free / 10)} см`}</b></div><div class="capt"><i style="width:${pct}%;background:${over ? 'var(--bad)' : c.free < 30 ? 'var(--ok)' : 'var(--accent)'}"></i></div></div>`;
    };
    $('#bCap').innerHTML = cap('base') + cap('wall');
    renderSel();
  }

  function renderSel() {
    const host = $('#bSel');
    if (!host) return;
    const m = S.project.modules.find((x) => x.id === B.sel);
    if (!m || m.type === 'base-corner') return (host.innerHTML = '');
    const it = item(m.type) || { name: M.typeLabel(m.type), widths: [m.w] };
    const widths = [...new Set([...it.widths, m.w])].sort((a, b) => a - b);
    const swaps = ITEMS.filter((i) => (i.any || rowOf(i.type) === m.row) && i.type !== m.type);
    host.innerHTML = `<div class="selbar"><div class="row" style="gap:10px"><b>${esc(it.name)}</b><span class="pill">${m.code || ''}</span></div>
      <div class="row"><span class="lbl">Ширина</span><div class="wchips">${widths.map((w) => `<button data-w="${w}" aria-pressed="${w === m.w}">${w / 10}</button>`).join('')}</div><span class="small muted">см</span></div>
      <div class="row"><span class="lbl">Смени на</span><select class="inp" id="bSwap" style="width:auto"><option value="">—</option>${swaps.map((i) => `<option value="${i.type}">${esc(i.name)}</option>`).join('')}</select>
      <button class="btn sm" id="bLeft" aria-label="Наляво">←</button><button class="btn sm" id="bRight" aria-label="Надясно">→</button>
      <button class="btn sm" id="bDel" style="color:var(--bad)">Премахни</button></div></div>`;
    $$('.wchips button', host).forEach((b) =>
      b.addEventListener('click', () => {
        apply(() => (m.w = +b.dataset.w));
        drawBoard();
      })
    );
    $('#bSwap').addEventListener('change', (e) => {
      if (!e.target.value) return;
      const ni = item(e.target.value);
      apply(() => {
        m.type = ni.type;
        m.hob = ni.type === 'base-oven';
        if (!ni.widths.includes(m.w)) m.w = ni.w;
      });
      drawBoard();
    });
    const move = (d) => {
      const list = rowList(m.wall, m.row);
      const i = list.indexOf(m);
      const j = i + d;
      if (j < 0 || j >= list.length) return;
      list.splice(i, 1);
      list.splice(j, 0, m);
      apply(() => reorder(m.wall, m.row, list));
      drawBoard();
    };
    $('#bLeft').addEventListener('click', () => move(-1));
    $('#bRight').addEventListener('click', () => move(1));
    $('#bDel').addEventListener('click', () => {
      apply((p) => (p.modules = p.modules.filter((x) => x !== m)));
      B.sel = null;
      drawBoard();
    });
  }

  /* ---------- Влачене ---------- */
  function insertIndex(row, clientX) {
    const board = $('#bBoard');
    const rect = board.getBoundingClientRect();
    const s = geom().s;
    const list = rowList(B.wall, row).filter((m) => !B.drag || m.id !== B.drag.id);
    let idx = 0;
    for (const m of list) if (rect.left + (m.x + m.w / 2) * s < clientX) idx++;
    return { idx, list };
  }
  function overZone(row, x, y) {
    const z = $(`#bBoard .zone[data-zone="${row}"]`);
    if (!z) return false;
    const r = z.getBoundingClientRect();
    return x >= r.left - 30 && x <= r.right + 30 && y >= r.top - 60 && y <= r.bottom + 60;
  }
  function showMarker(row, clientX) {
    const mk = $('#bMarker');
    const z = $(`#bBoard .zone[data-zone="${row}"]`);
    if (!mk || !z) return;
    const { idx, list } = insertIndex(row, clientX);
    const s = geom().s;
    const r = S.project.room;
    let x = list.length ? (idx < list.length ? list[idx].x : list[list.length - 1].x + list[list.length - 1].w) : M.rowRange(r, B.wall, row)[0];
    mk.hidden = false;
    mk.style.left = x * s - 2 + 'px';
    mk.style.top = z.style.top;
    mk.style.height = z.style.height;
  }

  function startDrag(e, data, ghostHtml, onTap) {
    const sx = e.clientX,
      sy = e.clientY;
    let ghost = null;
    let active = false;
    const el = e.currentTarget;
    el.setPointerCapture && el.setPointerCapture(e.pointerId);
    const move = (ev) => {
      if (!active && Math.hypot(ev.clientX - sx, ev.clientY - sy) < 7) return;
      if (!active) {
        active = true;
        B.drag = data;
        ghost = document.createElement('div');
        ghost.className = 'ghost';
        ghost.innerHTML = ghostHtml;
        document.body.appendChild(ghost);
        $$('#bBoard .zone').forEach((z) => z.classList.toggle('on', z.dataset.zone === data.row));
        $('#bTrash') && data.id && ($('#bTrash').hidden = false);
      }
      ev.preventDefault();
      ghost.style.transform = `translate(${ev.clientX - 40}px, ${ev.clientY - 40}px)`;
      if (overZone(data.row, ev.clientX, ev.clientY)) showMarker(data.row, ev.clientX);
      else $('#bMarker') && ($('#bMarker').hidden = true);
    };
    const up = (ev) => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerup', up);
      el.removeEventListener('pointercancel', up);
      if (!active) {
        onTap();
        return;
      }
      ghost.remove();
      $$('#bBoard .zone').forEach((z) => z.classList.remove('on'));
      const drop = overZone(data.row, ev.clientX, ev.clientY);
      if (drop) {
        const { idx, list } = insertIndex(data.row, ev.clientX);
        if (data.id) {
          const m = S.project.modules.find((x) => x.id === data.id);
          list.splice(idx, 0, m);
          apply(() => reorder(B.wall, data.row, list));
        } else addModule(data.type, data.row, idx);
      } else if (data.id && !$('#bBoard').contains(document.elementFromPoint(ev.clientX, ev.clientY))) {
        apply((p) => (p.modules = p.modules.filter((x) => x.id !== data.id)));
        B.sel = null;
        M.toast('Шкафът е премахнат');
      }
      B.drag = null;
      drawBoard();
    };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
  }

  function bindPalette(btn) {
    btn.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const type = btn.dataset.type,
        row = btn.dataset.row;
      startDrag(e, { type, row }, btn.querySelector('.pv').outerHTML, () => {
        addModule(type, row);
        const el = $(`#bBoard .bcab[data-id="${B.sel}"]`);
        if (el && window.gsap) gsap.from(el, { y: -30, opacity: 0, duration: 0.45, ease: 'back.out(1.6)' });
      });
    });
  }
  function bindCab(el) {
    if (el.classList.contains('fixed')) return;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      const m = S.project.modules.find((x) => x.id === el.dataset.id);
      if (!m) return;
      startDrag(e, { id: m.id, row: m.row }, el.innerHTML, () => {
        B.sel = B.sel === m.id ? null : m.id;
        drawBoard();
      });
    });
  }

  /* ---------- 4. Цветове и стил ---------- */
  const STYLES = [
    {
      name: 'Модерен орех',
      sub: 'Орех, рифелен пясъчен МДФ, мраморна плоча, без дръжки',
      mats: { frontType: 'pdch', frontDecor: 'egger-h3734', surface: 'flat', zones: { wall: { frontType: 'mdf-mat', frontColor: 'sand', surface: 'fluted' } }, carcass: 'egger-w1000', worktop: 'wt-ceramic', handle: 'gola' },
      look: { splash: 'slab', spots: true, pendant: true, dining: true, decor: false, led: true },
      wallH: 'ceil',
    },
    {
      name: 'Японди',
      sub: 'Светъл дъб и крем, бял плот, без дръжки',
      mats: { frontType: 'pdch', frontDecor: 'egger-h1145', surface: 'flat', zones: { wall: { frontType: 'mdf-mat', frontColor: 'cream', surface: 'flat' } }, carcass: 'egger-w1000', worktop: 'wt-white', handle: 'gola' },
      look: { splash: 'slab', spots: true, pendant: false, dining: true, decor: true, led: true },
      wallH: 'ceil',
    },
    {
      name: 'Черно и орех',
      sub: 'Черен мат, колони от орех, керамичен плот',
      mats: { frontType: 'mdf-mat', frontColor: 'black', surface: 'flat', zones: { tall: { frontType: 'pdch', frontDecor: 'egger-h3734' } }, carcass: 'kasta-anthracite', worktop: 'wt-ceramic', handle: 'long' },
      look: { splash: 'slab', spots: true, pendant: true, dining: true, decor: false, led: true },
      wallH: 900,
    },
    {
      name: 'Зелено и дъб',
      sub: 'Маслинено рифелено, крем горе, дъбов плот',
      mats: { frontType: 'mdf-mat', frontColor: 'sage', surface: 'fluted', zones: { wall: { frontType: 'mdf-mat', frontColor: 'cream', surface: 'flat' } }, carcass: 'egger-w1000', worktop: 'wt-oak', handle: 'knob' },
      look: { splash: 'subway', spots: true, pendant: false, dining: false, decor: true, led: true },
      wallH: 720,
    },
    {
      name: 'Скандинавско',
      sub: 'Бяло, дъбов плот, метро плочки',
      mats: { frontType: 'mdf-mat', frontColor: 'white', surface: 'flat', zones: {}, carcass: 'egger-w1000', worktop: 'wt-oak', handle: 'barblack' },
      look: { splash: 'subway', spots: true, pendant: false, dining: false, decor: true, led: true },
      wallH: 720,
    },
    {
      name: 'Класика с рамка',
      sub: 'Нощно синьо и крем, мрамор, кръгли дръжки',
      mats: { frontType: 'mdf-mat', frontColor: 'navy', surface: 'shaker', zones: { wall: { frontType: 'mdf-mat', frontColor: 'cream', surface: 'shaker' } }, carcass: 'egger-w1000', worktop: 'wt-marble', handle: 'knob' },
      look: { splash: 'marble', spots: true, pendant: false, dining: false, decor: true, led: true },
      wallH: 720,
    },
  ];

  // палитрата + цветът от снимката, ако има такъв
  function frontsFor(zm) {
    const list = FRONTS.slice();
    if (M.frontType(zm.frontType).painted && String(zm.frontColor || '')[0] === '#') list.unshift({ key: 'p:' + zm.frontColor, name: 'Цвят от снимката', color: zm.frontColor, set: { frontType: 'mdf-mat', frontColor: zm.frontColor } });
    return list;
  }
  M.STYLES = STYLES;

  // Бързи корекции (за прегледа върху снимка): стил, цвят по зони, плот, дръжки
  M.quickPanel = function (host) {
    if (!host) return;
    const mt = S.project.mats;
    const z = B.qzone || 'base';
    const zm = M.zone(mt, z);
    const cur = M.frontType(zm.frontType).painted ? 'p:' + zm.frontColor : 'd:' + zm.frontDecor;
    const sw = (key, color, grain, name, pressed) => `<button class="sw" data-k="${key}" aria-pressed="${pressed}" title="${esc(name)}" aria-label="${esc(name)}" style="background:${grain ? `repeating-linear-gradient(90deg, ${color}, ${color} 3px, color-mix(in srgb, ${color} 82%, #3a2210) 4px, ${color} 6px)` : color}"></button>`;
    host.innerHTML = `<div class="stack" style="gap:12px">
      <div><div class="lbl" style="margin-bottom:6px">Стил</div><div class="row" id="qStyles">${STYLES.map((st, i) => `<button class="btn sm" data-i="${i}">${esc(st.name)}</button>`).join('')}</div></div>
      <div><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="lbl">Фронтове</span><div class="seg" id="qZone">${Object.entries(M.ZONES).map(([k, n]) => `<button data-z="${k}" aria-pressed="${k === z}">${n}</button>`).join('')}</div></div>
      <div class="swatches" id="qFronts">${frontsFor(zm).map((f) => sw(f.key, f.color, f.grain, f.name, f.key === cur)).join('')}</div><div class="small muted" style="margin-top:6px">${esc(M.frontName(mt, z))}</div></div>
      <div><div class="lbl" style="margin-bottom:6px">Плот</div><div class="swatches" id="qWt">${M.CATALOG.worktops.map((w) => sw(w.key, w.color, w.grain, w.name, w.key === mt.worktop)).join('')}</div></div>
      <div><div class="lbl" style="margin-bottom:6px">Дръжки</div><div class="seg" id="qHandle">${[['gola', 'Gola'], ['long', 'Дълга'], ['barblack', 'Черна'], ['bar', 'Инокс'], ['knob', 'Кръгла'], ['tipon', 'Без']].map(([k, n]) => `<button data-k="${k}" aria-pressed="${mt.handle === k}">${n}</button>`).join('')}</div></div>
      <div class="row"><button class="btn sm" id="qCabs">Промени шкафовете</button><button class="btn sm" id="qMore">Всички цветове</button></div>
    </div>`;
    const redo = () => M.quickPanel(host);
    $$('#qStyles button', host).forEach((b) => b.addEventListener('click', () => (applyStyle(+b.dataset.i), redo())));
    $$('#qZone button', host).forEach((b) => b.addEventListener('click', () => ((B.qzone = b.dataset.z), redo())));
    $$('#qFronts .sw', host).forEach((b) =>
      b.addEventListener('click', () => {
        const f = frontsFor(zm).find((x) => x.key === b.dataset.k);
        apply((p) => {
          if (z === 'base') Object.assign(p.mats, f.set);
          else {
            p.mats.zones = p.mats.zones || {};
            p.mats.zones[z] = Object.assign(M.zone(p.mats, z), p.mats.zones[z] || {}, f.set);
          }
        });
        redo();
      })
    );
    $$('#qWt .sw', host).forEach((b) => b.addEventListener('click', () => (apply((p) => (p.mats.worktop = b.dataset.k)), redo())));
    $$('#qHandle button', host).forEach((b) => b.addEventListener('click', () => (apply((p) => (p.mats.handle = b.dataset.k)), redo())));
    $('#qCabs', host).addEventListener('click', () => (M.setView('builder'), go(2)));
    $('#qMore', host).addEventListener('click', () => (M.setView('builder'), go(3)));
  };

  function styledProject(st) {
    const p = JSON.parse(JSON.stringify(S.project));
    p.mats = Object.assign({}, p.mats, JSON.parse(JSON.stringify(st.mats)));
    p.look = Object.assign({}, M.DEFAULT_LOOK, p.look, st.look);
    if (p.room.opts.uppers !== false && p.modules.some((m) => m.row === 'wall')) p.room.opts.wallH = st.wallH;
    return p;
  }
  function applyStyle(i) {
    const st = STYLES[i];
    const p = styledProject(st);
    apply((P) => {
      P.mats = p.mats;
      P.look = p.look;
      P.room.opts.wallH = p.room.opts.wallH;
    }, { instant: true });
    if (M.renderMaterials) M.renderMaterials();
    if (M.syncLook) M.syncLook();
    M.toast('Стил „' + st.name + '“');
    if (S.view === 'builder' && B.step === 3) renderColors();
  }
  M.applyStyle = applyStyle;

  let styleShots = { key: '', imgs: [] };
  function renderStyleShots() {
    const key = JSON.stringify([S.project.room, S.project.modules.map((m) => [m.type, m.w, m.row, m.wall])]);
    if (styleShots.key === key && styleShots.imgs.length === STYLES.length) return;
    styleShots = { key, imgs: [] };
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;left:-6000px;top:0;width:420px;height:300px';
    document.body.appendChild(div);
    let v;
    try {
      v = new M.View3D(div, { size: [420, 300], lowRes: true, bg: '#eef0f4' });
    } catch (e) {
      return;
    }
    let i = 0;
    const next = () => {
      if (i >= STYLES.length || styleShots.key !== key) {
        v.dispose();
        div.remove();
        return;
      }
      const p = styledProject(STYLES[i]);
      M.pack(p.room, p.modules);
      const built = M.buildProject(p);
      v.setProject(p, built, { look: { spin: false } });
      styleShots.imgs[i] = v.snapshot('image/jpeg', 0.82);
      const slot = $(`#bStyles [data-i="${i}"] .simg`);
      if (slot) slot.innerHTML = `<img src="${styleShots.imgs[i]}" alt="">`;
      i++;
      setTimeout(next, 30);
    };
    setTimeout(next, 60);
  }

  function renderColors() {
    const mt = S.project.mats;
    const look = Object.assign({}, M.DEFAULT_LOOK, S.project.look);
    const z = B.zone || 'base';
    const zm = M.zone(mt, z);
    const ft = M.frontType(zm.frontType);
    const same = z !== 'base' && !(mt.zones && mt.zones[z]);
    const curFront = ft.painted ? 'p:' + zm.frontColor : 'd:' + zm.frontDecor;
    const sw = (key, color, grain, name, pressed) => `<button class="sw big" data-k="${key}" aria-pressed="${pressed}" title="${esc(name)}" aria-label="${esc(name)}" style="background:${grain ? `repeating-linear-gradient(90deg, ${color}, ${color} 3px, color-mix(in srgb, ${color} 82%, #3a2210) 4px, ${color} 6px)` : color}"></button>`;
    const tog = (id, label, on) => `<label class="switch">${label}<input type="checkbox" id="${id}" ${on ? 'checked' : ''}></label>`;
    $('#bMain').innerHTML = `<div class="stack"><div><h2>Стил и цветове</h2><p class="muted" style="margin:6px 0 0">Виж своята кухня в модерните стилове. Избери един и промени детайлите.</p></div>
      <div class="styles" id="bStyles">${STYLES.map((st, i) => `<button class="card stylec" data-i="${i}"><span class="simg">${styleShots.imgs[i] ? `<img src="${styleShots.imgs[i]}" alt="">` : '<span class="shimmer" style="display:block;height:100%;border-radius:0"></span>'}</span><span class="smeta"><b>${esc(st.name)}</b><span class="small muted">${esc(st.sub)}</span></span></button>`).join('')}</div>
      <div class="card pad stack colorbox">
        <div class="row" style="justify-content:space-between"><b>Фронтове</b><div class="seg" id="bZone">${Object.entries(M.ZONES).map(([k, n]) => `<button data-z="${k}" aria-pressed="${k === z}">${n}</button>`).join('')}</div></div>
        ${z !== 'base' ? `<label class="switch" style="padding-top:0">Като долните<input type="checkbox" id="bSame" ${same ? 'checked' : ''}></label>` : ''}
        <div ${same ? 'hidden' : ''}>
          <div class="swatches" id="bFronts">${frontsFor(zm).map((f) => sw(f.key, f.color, f.grain, f.name, f.key === curFront)).join('')}</div>
          <div class="small muted" style="margin-top:8px">${esc(M.frontName(mt, z))}</div>
          ${ft.painted ? `<div class="row" style="margin-top:12px"><div class="seg" id="bSurface">${M.CATALOG.surfaces.map((s) => `<button data-k="${s.key}" aria-pressed="${zm.surface === s.key}">${s.name}</button>`).join('')}</div><div class="seg" id="bFinish"><button data-k="mdf-mat" aria-pressed="${zm.frontType === 'mdf-mat'}">Мат</button><button data-k="mdf-gloss" aria-pressed="${zm.frontType === 'mdf-gloss'}">Гланц</button></div></div>` : ''}
        </div>
        <div><div class="row" style="justify-content:space-between"><b>Работен плот</b><span class="small muted">${esc(M.worktop(mt.worktop).name)}</span></div><div class="swatches" id="bWt" style="margin-top:10px">${M.CATALOG.worktops.map((w) => sw(w.key, w.color, w.grain, w.name, w.key === mt.worktop)).join('')}</div></div>
        <div><b>Дръжки</b><div class="handles" id="bHandles">${[
          ['gola', 'Gola', `<rect x="6" y="6" width="52" height="7" fill="#2a2a2d"/>`],
          ['long', 'Дълга', `<rect x="44" y="14" width="4" height="34" rx="2" fill="#1f1f22"/>`],
          ['barblack', 'Черна', `<rect x="16" y="27" width="32" height="5" rx="2.5" fill="#1f1f22"/>`],
          ['bar', 'Инокс', `<rect x="16" y="27" width="32" height="5" rx="2.5" fill="#9a9ca0"/>`],
          ['knob', 'Кръгла', `<circle cx="32" cy="30" r="5" fill="#1f1f22"/>`],
          ['tipon', 'Без', `<path d="M26 30h12" stroke="#c7c7cc" stroke-width="2" stroke-dasharray="3 3"/>`],
        ]
          .map(([k, n, svg]) => `<button data-k="${k}" aria-pressed="${mt.handle === k}"><svg viewBox="0 0 64 60"><rect x="6" y="6" width="52" height="48" rx="6" fill="${frontFill()}" stroke="rgba(0,0,0,.15)"/>${svg}</svg><span>${n}</span></button>`)
          .join('')}</div></div>
        <div><b>Облицовка на стената</b><div class="seg" id="bSplash" style="margin-top:10px">${M.SPLASH.map((x) => `<button data-k="${x.key}" aria-pressed="${look.splash === x.key}">${x.name}</button>`).join('')}</div></div>
        <div><b>Атмосфера</b><div style="margin-top:4px">${tog('bkSpots', 'Лунички в тавана', look.spots)}${tog('bkLed', 'LED под горните шкафове', look.led)}${tog('bkPend', 'Лампа-пръстен', look.pendant)}${tog('bkDining', 'Маса със столове', look.dining)}${tog('bkEve', 'Вечерно осветление', look.evening)}</div></div>
        <div><div class="row" style="justify-content:space-between"><b>Корпус (отвътре)</b><span class="small muted">${esc(M.board(mt.carcass).brand + ' ' + M.board(mt.carcass).name)}</span></div><div class="swatches" id="bCarc" style="margin-top:10px">${CARCASS.map((k) => {
          const b = M.board(k);
          return sw(k, b.color, b.grain, b.brand + ' ' + b.name, k === mt.carcass);
        }).join('')}</div></div>
      </div></div>`;
    renderStyleShots();
    const reRender = () => {
      if (M.renderMaterials) M.renderMaterials();
      if (M.syncLook) M.syncLook();
      renderColors();
    };
    const setZone = (o) => {
      apply((p) => {
        if (z === 'base') Object.assign(p.mats, o);
        else {
          p.mats.zones = p.mats.zones || {};
          p.mats.zones[z] = Object.assign(M.zone(p.mats, z), p.mats.zones[z] || {}, o);
        }
      });
      reRender();
    };
    const set = (o) => {
      apply((p) => Object.assign(p.mats, o));
      reRender();
    };
    const setLook = (o) => {
      apply((p) => (p.look = Object.assign({}, M.DEFAULT_LOOK, p.look, o)), { instant: true });
      reRender();
    };
    $$('.stylec').forEach((b) => b.addEventListener('click', () => applyStyle(+b.dataset.i)));
    $$('#bZone button').forEach((b) =>
      b.addEventListener('click', () => {
        B.zone = b.dataset.z;
        renderColors();
      })
    );
    const sameEl = $('#bSame');
    if (sameEl)
      sameEl.addEventListener('change', (e) => {
        apply((p) => {
          p.mats.zones = p.mats.zones || {};
          if (e.target.checked) delete p.mats.zones[z];
          else p.mats.zones[z] = M.zone(p.mats, 'base');
        });
        reRender();
      });
    $$('#bFronts .sw').forEach((b) =>
      b.addEventListener('click', () => {
        const f = frontsFor(zm).find((x) => x.key === b.dataset.k);
        const o = Object.assign({}, f.set);
        if (o.frontType === 'mdf-mat' && zm.frontType === 'mdf-gloss') o.frontType = 'mdf-gloss';
        setZone(o);
      })
    );
    $$('#bSurface button').forEach((b) => b.addEventListener('click', () => setZone({ surface: b.dataset.k })));
    $$('#bFinish button').forEach((b) => b.addEventListener('click', () => setZone({ frontType: b.dataset.k })));
    $$('#bWt .sw').forEach((b) => b.addEventListener('click', () => set({ worktop: b.dataset.k })));
    $$('#bHandles button').forEach((b) => b.addEventListener('click', () => set({ handle: b.dataset.k })));
    $$('#bCarc .sw').forEach((b) => b.addEventListener('click', () => set({ carcass: b.dataset.k })));
    $$('#bSplash button').forEach((b) => b.addEventListener('click', () => setLook({ splash: b.dataset.k })));
    for (const [id, k] of [
      ['bkSpots', 'spots'],
      ['bkLed', 'led'],
      ['bkPend', 'pendant'],
      ['bkDining', 'dining'],
      ['bkEve', 'evening'],
    ])
      $('#' + id).addEventListener('change', (e) => setLook({ [k]: e.target.checked }));
  }

  /* ---------- 5. Готово ---------- */
  function renderDone() {
    const P = S.project;
    const r = P.room;
    const mt = P.mats;
    const ft = M.frontType(mt.frontType);
    const cur = FRONTS.find((f) => f.key === (ft.painted ? 'p:' + mt.frontColor : 'd:' + mt.frontDecor));
    const count = (t) => P.modules.filter((m) => m.type === t).length;
    const mods = P.modules.filter((m) => m.type !== 'gap' && m.type !== 'filler');
    const warns = (S.checks || []).filter((c) => c.lvl === 'warn');
    const user = M.platform && M.platform.user;
    $('#bMain').innerHTML = `<div class="stack"><div><h2>Кухнята ти е готова</h2><p class="muted" style="margin:6px 0 0">Провери обобщението и изпрати заявка. Цехът ще дойде на оглед и ще даде точна цена.</p></div>
      <div class="card pad donebox"><div class="bigprice"><span class="muted">Ориентировъчна цена с ДДС</span><b>${M.eur(S.pr.gross)}</b><span class="small muted">без уредите и мивката</span></div>
      <ul class="facts">
        <li><span>Форма</span><b>${r.shape === 'L' ? 'Ъглова' : 'Права'}, ${r.wallA / 10}${r.shape === 'L' ? ' × ' + r.wallB / 10 : ''} см</b></li>
        <li><span>Шкафове</span><b>${mods.length} бр.${count('tall-fridge') ? ' · хладилник в колона' : ''}${count('base-dw') ? ' · съдомиялна' : ''}</b></li>
        <li><span>Фронтове</span><b>${esc(M.frontsSummary(mt))}</b></li>
        <li><span>Плот</span><b>${esc(M.worktop(mt.worktop).name.replace('Ламиниран плот 38 мм, ', ''))}</b></li>
        <li><span>Дръжки</span><b>${esc(M.handle(mt.handle).name)}</b></li>
        <li><span>Монтаж</span><b>~ ${S.hours || '—'} часа</b></li>
      </ul></div>
      ${warns.length ? `<div class="checks">${warns.map((c) => `<div class="chk"><i>!</i><span>${esc(c.t)}</span></div>`).join('')}</div>` : ''}
      <div class="row">
        <button class="btn primary lg" data-go="request">Изпрати заявка към цех <svg class="ic"><use href="#i-arrow"/></svg></button>
        <button class="btn lg" id="bSave">${user ? 'Запази в акаунта' : 'Влез и запази'}</button>
        <button class="btn lg" data-real="builder"><svg class="ic"><use href="#i-sparkles"/></svg>Фотореалистично</button>
        <button class="btn lg" id="bShot"><svg class="ic"><use href="#i-camera"/></svg>Снимка</button>
      </div>
      <div class="row small"><button class="btn link sm" data-go="ar">Виж я в стаята си (AR)</button><button class="btn link sm" data-go="project">Разширен редактор за цехове</button></div></div>`;
    $$('#bMain [data-go]').forEach((b) => b.addEventListener('click', () => M.setView(b.dataset.go)));
    $('#bSave').addEventListener('click', () => {
      const pl = M.platform;
      if (!pl) return;
      if (pl.user) pl.saveNow ? pl.saveNow() : M.toast('Проектът се пази автоматично');
      else pl.openAuth('signup');
    });
    $('#bShot').addEventListener('click', async () => {
      if (!B.view) return;
      const blob = await fetch(B.view.snapshot('image/jpeg', 0.92)).then((r) => r.blob());
      M.saveFile('modulia-kuhnia.jpg', blob, 'image/jpeg');
    });
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.from('.facts li', { opacity: 0, y: 8, stagger: 0.05, duration: 0.3 });
  }

  /* ---------- Свързване ---------- */
  M.on('ready', () => {
    $('#bBack').addEventListener('click', () => go(B.step - 1));
    $('#bNext').addEventListener('click', () => go(B.step + 1));
    M.on('view', (v) => {
      if (v !== 'builder') return;
      ensureView();
      if (B.view) B.view.resize();
      lastKey = '';
      update3d();
      render();
    });
    M.on('changed', () => {
      update3d();
      if (S.view === 'builder') renderSide();
    });
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => S.view === 'builder' && B.step === 2 && drawBoard(), 150);
    });
  });
})();
