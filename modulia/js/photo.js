/* Модулия: „Кухня от снимка“: AI разпознава стила от снимка на харесвана кухня,
   разчита стаята на клиента от неговата снимка, нанася новата кухня върху нея и позволява корекции на живо. */
(function () {
  const M = window.M;
  const { $, $$, esc } = M;
  const S = M.S;
  const PH = { insp: null, room: null, ctl: null, view: null, last: null };
  M.photoView = () => PH.view;

  const WOOD = { walnut: 'egger-h3734', dark_wood: 'egger-h3734', oak: 'egger-h3303', natural_oak: 'egger-h1145', light_oak: 'krono-sonoma', grey: 'egger-u702', black: 'egger-u999' };
  const CARC = { white: 'egger-w1000', grey: 'egger-u708', anthracite: 'kasta-anthracite' };
  const HANDLES = ['gola', 'long', 'barblack', 'bar', 'knob', 'tipon'];

  function stylePrompt(notes) {
    return `The image shows a kitchen the client LIKES (inspiration). Describe its design so we can recreate it with our cabinet system. Use only the allowed values.

Zones: "base" = lower cabinet fronts, "wall" = upper wall cabinet fronts, "tall" = full-height columns (fridge, ovens, pantry). Use null for "wall" or "tall" if the kitchen has none or they look the same as "base".
Each zone: {"kind":"wood"|"paint", "wood":"walnut"|"oak"|"natural_oak"|"light_oak"|"dark_wood"|"grey"|"black" (only when kind is wood), "color":"#RRGGBB" (for paint: the front colour sampled from the photo, realistic and slightly desaturated; for wood: the average wood tone), "surface":"flat"|"fluted"|"shaker", "finish":"mat"|"gloss"}.
fluted = vertical ribs or grooves; shaker = framed panel doors.
worktop: "wt-oak" (wood), "wt-marble" (thick, white marble look), "wt-concrete" (grey stone or concrete), "wt-compact" (thin black), "wt-white" (thin plain white), "wt-ceramic" (thin white with marble veins).
handle: "gola" (no handles, recessed channel), "tipon" (completely flat, push to open), "long" (long vertical bar handles), "barblack" (short black bar), "bar" (short steel bar), "knob" (round knobs).
splash: "slab" (one large stone or ceramic slab), "marble" (marble tiles), "subway" (small rectangular tiles), "paint" (plain wall).
uppers: "none" | "standard" | "tall" | "ceiling" (upper cabinets reach the ceiling).
carcass: "white" | "grey" | "anthracite" | "wood".
Booleans: fridge_column, oven_column (ovens built into a tall column), double_oven (two ovens stacked), spots (recessed ceiling lights), pendant (pendant lamp), dining (dining table in view).

Client notes (Bulgarian, may be empty): ${notes || '-'}

Reply with ONLY this JSON:
{"style_name":"кратко име на стила","summary":"едно изречение какво е характерното","base":{"kind":"wood","wood":"walnut","color":"#7e5d45","surface":"flat","finish":"mat"},"wall":{"kind":"paint","color":"#e1d8c9","surface":"fluted","finish":"mat"},"tall":null,"worktop":"wt-ceramic","handle":"gola","splash":"slab","uppers":"ceiling","carcass":"white","fridge_column":true,"oven_column":true,"double_oven":true,"spots":true,"pendant":true,"dining":true}`;
  }

  function roomPrompt(notes) {
    return `The image is a photo (or hand sketch) of the client's OWN kitchen or empty room where a new kitchen will be installed. Estimate the room so we can design the new kitchen and overlay it on this photo.

Rules:
- Wall A is the main wall the camera faces, where the kitchen stands. If cabinets should also run along the side wall on the RIGHT, shape is "L" and wall B is that right wall; otherwise shape is "I". If the second wall is on the left, still call it B and measure from the corner.
- Positions on wall A: mm from its LEFT end. Positions on wall B: mm from the corner.
- Estimate lengths from references: a base cabinet is about 600 mm wide, a countertop about 900 mm high, a door about 800 x 2000 mm, a standard ceiling 2600 mm, floor tiles often 600 mm.
- features: window (x = left edge, w, sill, h), water (sink centre), power (cooktop centre), hood (extractor centre). Only those visible or clearly implied.
- corners: normalized image coordinates (0..1, origin top-left) of the two points where the floor meets wall A at its LEFT and RIGHT ends, i.e. the line where the new cabinets will stand. If an end is hidden by furniture, extrapolate along the floor line.

Client notes (Bulgarian, may be empty): ${notes || '-'}

Reply with ONLY this JSON:
{"shape":"I","wallA":3600,"wallB":null,"height":2600,"features":[{"type":"window","wall":"A","x":1200,"w":1100,"sill":950,"h":1300},{"type":"water","wall":"A","x":1750}],"corners":{"left":[0.12,0.78],"right":[0.86,0.80]},"confidence":"medium","notes":"кратко какво е прието"}`;
  }

  // AI отговор → нашите материали
  function zoneFrom(z) {
    if (!z || typeof z !== 'object') return null;
    if (z.kind === 'wood') return { frontType: 'pdch', frontDecor: WOOD[z.wood] || 'egger-h1145', surface: 'flat' };
    const hex = /^#[0-9a-f]{6}$/i.test(String(z.color)) ? String(z.color).toLowerCase() : '#e1d8c9';
    return { frontType: z.finish === 'gloss' ? 'mdf-gloss' : 'mdf-mat', frontColor: hex, surface: ['flat', 'fluted', 'shaker'].includes(z.surface) ? z.surface : 'flat' };
  }

  M.applyPhotoStyle = function (st) {
    const P = S.project;
    if (P.auto) M.toManual(P);
    const base = zoneFrom(st.base) || M.zone(P.mats, 'base');
    const wall = zoneFrom(st.wall);
    const tall = zoneFrom(st.tall);
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    Object.assign(P.mats, base);
    P.mats.zones = {};
    if (wall && !same(wall, base)) P.mats.zones.wall = wall;
    if (tall && !same(tall, base)) P.mats.zones.tall = tall;
    if (M.CATALOG.worktops.some((w) => w.key === st.worktop)) P.mats.worktop = st.worktop;
    if (HANDLES.includes(st.handle)) P.mats.handle = st.handle;
    P.mats.carcass = st.carcass === 'wood' ? (base.frontType === 'pdch' ? base.frontDecor : 'egger-h1145') : CARC[st.carcass] || P.mats.carcass;
    P.look = Object.assign({}, M.DEFAULT_LOOK, P.look, {
      splash: M.SPLASH.some((x) => x.key === st.splash) ? st.splash : P.look && P.look.splash,
      spots: st.spots !== false,
      pendant: !!st.pendant,
      dining: !!st.dining,
      led: true,
    });
    if (st.uppers === 'none') {
      P.room.opts.uppers = false;
      P.modules = P.modules.filter((m) => m.row !== 'wall');
    } else if (P.modules.some((m) => m.row === 'wall')) {
      P.room.opts.wallH = st.uppers === 'ceiling' ? 'ceil' : st.uppers === 'tall' ? 900 : 720;
    }
    if (st.double_oven) P.modules.forEach((m) => m.type === 'tall-oven' && (m.type = 'tall-oven2'));
    P.auto = false;
    if (M.syncRoomForm) M.syncRoomForm();
    if (M.renderMaterials) M.renderMaterials();
    if (M.syncLook) M.syncLook();
    M.recompute({ instant: true });
  };

  /* ---------- Изглед ---------- */
  function setImg(which, blob) {
    PH[which] = blob;
    const img = $(which === 'insp' ? '#phInspImg' : '#phRoomImg');
    img.src = URL.createObjectURL(blob);
    img.hidden = false;
    $(which === 'insp' ? '#phInspTxt' : '#phRoomTxt').innerHTML = `<span class="small muted">${which === 'insp' ? '1. Кухня, която харесваш' : '2. Твоята кухня'} · натисни за смяна</span>`;
  }

  function renderResult(st, rm, demo) {
    const P = S.project;
    const mt = P.mats;
    const chip = (label, val, color) => `<li><span>${label}</span><b>${color ? `<i class="dot" style="background:${color}"></i>` : ''}${esc(val)}</b></li>`;
    const hasWall = P.modules.some((m) => m.row === 'wall');
    const hasTall = P.modules.some((m) => M.isTall(m.type));
    $('#phResult').innerHTML = `<div class="stack" style="gap:10px">
      <div class="row" style="justify-content:space-between"><h3 style="font-size:20px">${esc((st && st.style_name) || 'Твоята нова кухня')}</h3>${demo ? '<span class="pill">пример</span>' : '<span class="pill blue">разпознато от снимката</span>'}</div>
      ${st && st.summary ? `<p class="muted" style="margin:0">${esc(st.summary)}</p>` : ''}
      <ul class="facts">
        ${chip('Долни фронтове', M.frontName(mt, 'base'), M.frontColorHex(mt, 'base'))}
        ${hasWall ? chip('Горни фронтове', M.frontName(mt, 'wall'), M.frontColorHex(mt, 'wall')) : ''}
        ${hasTall ? chip('Колони', M.frontName(mt, 'tall'), M.frontColorHex(mt, 'tall')) : ''}
        ${chip('Плот', M.worktop(mt.worktop).name.replace(/^(Ламиниран|Компакт|Керамичен) плот (38|12) мм, /, ''), M.worktop(mt.worktop).color)}
        ${chip('Дръжки', M.handle(mt.handle).name.split(',')[0])}
        ${rm ? chip('Стая', `${P.room.shape === 'L' ? 'Ъглова' : 'Права'}, ${P.room.wallA / 10}${P.room.shape === 'L' ? ' × ' + P.room.wallB / 10 : ''} см`) : ''}
        ${chip('Цена с ДДС', M.eur(S.pr.gross))}
      </ul>
      ${rm && rm.notes ? `<p class="small muted" style="margin:0">${esc(rm.notes)}</p>` : ''}
      <div class="row">
        ${PH.room && rm ? `<button class="btn primary" id="phAr"><svg class="ic"><use href="#i-ar"/></svg>Виж в моята кухня</button>` : ''}
        <button class="btn ${PH.room && rm ? '' : 'primary'}" data-real="${PH.room && rm ? 'room' : 'photo'}"><svg class="ic"><use href="#i-sparkles"/></svg>${PH.room && rm ? 'Реалистично в моята снимка' : 'Фотореалистичен рендер'}</button>
        <button class="btn" id="phColors">Промени цветовете</button>
        <button class="btn" id="phCabs">Промени шкафовете</button>
        <button class="btn" data-go="request">Изпрати заявка</button>
      </div></div>`;
    const ar = $('#phAr');
    if (ar) ar.addEventListener('click', () => M.setView('ar'));
    $('#phColors').addEventListener('click', () => (M.setView('builder'), M.builderGo(3)));
    $('#phCabs').addEventListener('click', () => (M.setView('builder'), M.builderGo(2)));
    $$('#phResult [data-go]').forEach((b) => b.addEventListener('click', () => M.setView(b.dataset.go)));
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.from('#phResult .facts li', { opacity: 0, x: -10, stagger: 0.05, duration: 0.3 });
  }

  function ensureView() {
    if (PH.view) return;
    try {
      PH.view = new M.View3D($('#ph3d'), { bg: '#eef0f4' });
    } catch (e) {}
  }
  function update3d(reframe) {
    if (S.view !== 'photo' || !PH.view || !S.built) return;
    PH.view.setProject(S.project, S.built, { keepCamera: !reframe });
  }

  async function run() {
    const st = $('#phStatus');
    if (!PH.insp && !PH.room) return (st.textContent = 'Качи поне снимка на кухня, която харесваш.');
    const mode = await M.aiMode();
    if (!mode) return (st.innerHTML = `${esc(M.aiError({ code: 'unavailable' }))} Натисни „Пример: Модерен орех“, за да видиш как работи.`);
    const btn = $('#phRun');
    btn.disabled = true;
    PH.ctl = new AbortController();
    st.innerHTML = '<span class="spinner"></span> AI разглежда снимките. Обикновено отнема 15 до 40 секунди.';
    try {
      const notes = $('#phNotes').value.trim();
      const [sty, rm] = await Promise.all([PH.insp ? M.aiJSON('style', stylePrompt(notes), PH.insp, PH.ctl.signal) : null, PH.room ? M.aiJSON('room', roomPrompt(notes), PH.room, PH.ctl.signal) : null]);
      if (rm && rm.wallA) {
        const room = M.cleanRoom(rm);
        room.opts = Object.assign({}, S.project.room.opts, {
          uppers: sty ? sty.uppers !== 'none' : true,
          fridge: sty ? !!sty.fridge_column : true,
          ovenTall: sty ? !!sty.oven_column : false,
          dishwasher: true,
        });
        const p = M.defaultProject();
        p.room = room;
        p.mats = Object.assign({}, S.project.mats);
        p.look = Object.assign({}, M.DEFAULT_LOOK, S.project.look);
        p.auto = true;
        p.modules = M.autoLayout(room).modules;
        M.toManual(p);
        M.loadProject(p, { stay: true });
      }
      if (sty) M.applyPhotoStyle(sty);
      PH.last = { sty, rm };
      renderResult(sty, rm && rm.wallA ? rm : null, false);
      update3d(true);
      if (PH.room && rm && rm.wallA) {
        M.arLoad(PH.room, rm.corners);
        st.textContent = 'Готово. Натисни „Виж в моята кухня“, за да видиш новата кухня върху снимката си.';
      } else st.textContent = 'Готово. Можеш да промениш цветовете и шкафовете.';
    } catch (e) {
      st.textContent = M.aiError(e);
    } finally {
      btn.disabled = false;
    }
  }

  M.on('ready', () => {
    $('#phInsp').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (f) try {
        setImg('insp', await M.shrinkImage(f));
      } catch (err) {
        M.toast(M.photoError(err), 5000);
      }
    });
    $('#phRoom').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (f) try {
        setImg('room', await M.shrinkImage(f));
      } catch (err) {
        M.toast(M.photoError(err), 5000);
      }
    });
    $('#phRun').addEventListener('click', run);
    $('#phDemo').addEventListener('click', () => {
      M.applyStyle(0);
      renderResult({ style_name: 'Модерен орех', summary: 'Орехови фронтове и колони до тавана, рифелени пясъчни горни шкафове, мраморна плоча и кухня без дръжки.' }, null, true);
      update3d(true);
      $('#phStatus').textContent = 'Приложен е примерният стил. С твоя снимка AI ще разпознае стила сам.';
    });
    M.on('view', (v) => {
      if (v === 'photo') {
        ensureView();
        if (PH.view) PH.view.resize();
        update3d(true);
      }
      if (v === 'ar' && M.quickPanel) M.quickPanel($('#arQuick'));
    });
    M.on('changed', () => update3d(false));
  });
})();
