/* Модулия — Баня.
   Снимка на банята (на мазилка) → AI разчита размери, врата, прозорец и изводи →
   умно подреждане на душ, вана, тоалетна, мивка → схеми на плочките по стени, 3D →
   количествена сметка: м², кашони, лепило, фуга, хидроизолация, структури, смесители, душове, мивки → магазини. */
(function () {
  const M = window.M;
  const { $, $$, esc } = M;

  /* ================= Каталог ================= */
  // Ориентировъчни цени в евро с ДДС. size: [дълга, къса] страна в см. box: м² в кашон.
  const TILES = [
    { key: 'conc-60120', name: 'Бетон сив', type: 'Гранитогрес', look: 'concrete', color: '#a19e98', size: [120, 60], finish: 'мат, R10', thick: 9, box: 1.44, price: 29, use: 'fw', q: 'гранитогрес 60x120 бетон сив' },
    { key: 'conc-6060', name: 'Бетон светъл', type: 'Гранитогрес', look: 'concrete', color: '#cdc8bf', size: [60, 60], finish: 'мат, R10', thick: 9, box: 1.44, price: 19, use: 'fw', q: 'гранитогрес 60x60 бетон светъл' },
    { key: 'calacatta-60120', name: 'Мрамор Калаката', type: 'Гранитогрес', look: 'marble', color: '#f1eee9', color2: '#a39a8e', size: [120, 60], finish: 'полиран', thick: 9, box: 1.44, price: 35, use: 'fw', q: 'гранитогрес 60x120 калаката' },
    { key: 'statuario-slab', name: 'Мрамор Статуарио, голям формат', type: 'Гранитогрес', look: 'marble', color: '#f3f2ef', color2: '#86827c', size: [280, 120], finish: 'мат', thick: 6, box: 3.36, price: 79, use: 'w', q: 'гранитогрес 120x280 голям формат мрамор' },
    { key: 'travertine-60120', name: 'Травертин беж', type: 'Гранитогрес', look: 'travertine', color: '#d9c8ab', color2: '#b9a380', size: [120, 60], finish: 'мат, R10', thick: 9, box: 1.44, price: 32, use: 'fw', q: 'гранитогрес травертин 60x120' },
    { key: 'oak-20120', name: 'Дърво дъб натурален', type: 'Гранитогрес', look: 'wood', color: '#b48a60', size: [120, 20], finish: 'мат, R10', thick: 9, box: 1.44, price: 24, use: 'fw', q: 'гранитогрес дърво 20x120 дъб' },
    { key: 'terrazzo-6060', name: 'Тераццо светло', type: 'Гранитогрес', look: 'terrazzo', color: '#e7e2d9', size: [60, 60], finish: 'мат', thick: 9, box: 1.44, price: 27, use: 'fw', q: 'гранитогрес тераццо 60x60' },
    { key: 'anthracite-60120', name: 'Камък антрацит', type: 'Гранитогрес', look: 'stone', color: '#3e3f42', size: [120, 60], finish: 'мат, R10', thick: 9, box: 1.44, price: 31, use: 'fw', q: 'гранитогрес антрацит 60x120' },
    { key: 'sand-6060', name: 'Пясъчник противоплъзгащ', type: 'Гранитогрес', look: 'stone', color: '#cfc1a8', size: [60, 60], finish: 'мат, R11', thick: 9, box: 1.44, price: 21, use: 'fw', q: 'гранитогрес 60x60 r11 беж' },
    { key: 'white-3060', name: 'Бял гланц', type: 'Фаянс', look: 'solid', color: '#f5f5f3', size: [60, 30], finish: 'гланц', thick: 8, box: 1.44, price: 12, use: 'w', q: 'фаянс 30x60 бял гланц' },
    { key: 'white-3090', name: 'Бял мат, ректифициран', type: 'Фаянс', look: 'solid', color: '#efeeea', size: [90, 30], finish: 'мат', thick: 9, box: 1.62, price: 18, use: 'w', q: 'фаянс 30x90 бял мат' },
    { key: 'relief-3090', name: 'Релеф вълна бял', type: 'Фаянс', look: 'relief', color: '#f1f0ec', size: [90, 30], finish: 'мат, релефна структура', thick: 10, box: 1.08, price: 26, use: 'w', q: 'фаянс релефен 30x90 бял' },
    { key: 'subway-white', name: 'Метро бели', type: 'Фаянс', look: 'subway', color: '#f3f2ee', size: [15, 7.5], finish: 'гланц, фасет', thick: 7, box: 1, price: 16, use: 'w', q: 'плочки метро 7,5x15 бели' },
    { key: 'zellige-green', name: 'Зелиж маслинено зелено', type: 'Ръчна изработка', look: 'zellige', color: '#6f8a78', size: [15, 7.5], finish: 'гланц, неравна', thick: 9, box: 0.5, price: 58, use: 'w', q: 'плочки зелиж зелени' },
    { key: 'sage-7530', name: 'Шалфей мат', type: 'Фаянс', look: 'solid', color: '#a3ae97', size: [30, 7.5], finish: 'мат', thick: 8, box: 0.5, price: 29, use: 'w', q: 'плочки 7,5x30 зелени мат' },
    { key: 'hex-black', name: 'Мозайка шестоъгълник черна', type: 'Мозайка', look: 'hex', color: '#2c2c2e', size: [10, 10], finish: 'мат', thick: 6, box: 0.9, price: 34, use: 'fw', q: 'мозайка шестоъгълник черна' },
    { key: 'terracotta-2020', name: 'Теракота', type: 'Клинкер', look: 'zellige', color: '#b9744f', size: [20, 20], finish: 'мат', thick: 10, box: 1, price: 30, use: 'fw', q: 'плочки теракота 20x20' },
  ];
  const tile = (k) => TILES.find((t) => t.key === k) || TILES[0];

  const PATS = [
    ['straight', 'Права'],
    ['brick', 'Тухла'],
    ['vertical', 'Вертикално'],
    ['herringbone', 'Рибена кост'],
  ];
  const WASTE = { straight: 0.08, vertical: 0.08, brick: 0.1, herringbone: 0.15, hex: 0.1 };
  const GROUTS = [
    ['#f2f1ed', 'Бяла'],
    ['#c8c6c1', 'Светлосива'],
    ['#cbbca3', 'Бежова'],
    ['#55555a', 'Антрацит'],
    ['#1f1f21', 'Черна'],
  ];
  const FIN = {
    chrome: { name: 'Хром', color: '#dfe3e8', rough: 0.12, metal: 1, q: 'хром', k: 1, en: 'polished chrome' },
    black: { name: 'Черно мат', color: '#232325', rough: 0.55, metal: 0.4, q: 'черен мат', k: 1.2, en: 'matt black' },
    brushed: { name: 'Инокс', color: '#b9bdc1', rough: 0.35, metal: 1, q: 'инокс', k: 1.25, en: 'brushed stainless steel' },
    gold: { name: 'Злато шлайф', color: '#c8a96e', rough: 0.3, metal: 1, q: 'златен', k: 1.35, en: 'brushed gold' },
  };
  const VAN = {
    oak: { name: 'Дъб', color: '#b8905f', wood: true, en: 'natural oak wood' },
    walnut: { name: 'Орех', color: '#7a5a43', wood: true, en: 'dark walnut wood' },
    white: { name: 'Бял мат', color: '#efeeea', en: 'matt white' },
    graphite: { name: 'Графит', color: '#45474b', en: 'matt graphite grey' },
  };
  const TIERS = [
    ['eco', 'Икономичен'],
    ['std', 'Стандарт'],
    ['prem', 'Премиум'],
  ];
  // [цена €, примерни марки]
  const PROD = {
    frame: { name: 'Структура за вграждане (инсталационна рамка) за конзолна тоалетна + бутон', eco: [110, 'Cersanit, Kludi'], std: [195, 'Grohe Rapid SL, Geberit Duofix'], prem: [310, 'Geberit Duofix + бутон Sigma'], q: 'структура за вграждане конзолна тоалетна', fin: true },
    wc: { name: 'Конзолна тоалетна без ринг, със седалка soft-close', eco: [105, 'Cersanit'], std: [195, 'Ideal Standard, Vitra'], prem: [390, 'Villeroy & Boch, Duravit'], q: 'конзолна тоалетна rimless' },
    vanity: { name: 'Шкаф за баня с мивка', eco: [170, ''], std: [340, ''], prem: [690, ''], q: 'шкаф за баня с мивка' },
    sinkMix: { name: 'Смесител за мивка', eco: [45, 'Vidima'], std: [95, 'Grohe, Hansgrohe'], prem: [230, 'Hansgrohe, Grohe, за вграждане'], q: 'смесител за мивка', fin: true },
    shower: { name: 'Душ колона с термостат', eco: [150, 'Vidima, Kludi'], std: [330, 'Grohe, Hansgrohe, тропически душ 25 см'], prem: [690, 'вградена, Hansgrohe, Grohe, тропически душ 30 см'], q: 'душ система с термостат', fin: true },
    glass: { name: 'Стъклен панел walk-in, 8 мм', eco: [170, ''], std: [270, 'с профил'], prem: [440, 'без рамка или с черен профил'], q: 'стъклен панел walk-in 8 мм', fin: true },
    drain: { name: 'Линеен сифон', eco: [45, ''], std: [95, 'Viega, TECE'], prem: [190, 'за плочка, Geberit CleanLine'], q: 'линеен сифон баня', fin: true },
    bath: { name: 'Вана с панел и крака', eco: [190, 'акрил'], std: [330, 'акрил, Ravak, Kolo'], prem: [690, 'кварил, Villeroy & Boch'], q: 'вана 170x75 акрилна' },
    bathMix: { name: 'Смесител за вана с душ', eco: [55, 'Vidima'], std: [135, 'Grohe, Hansgrohe'], prem: [290, 'термостатен'], q: 'смесител за вана с душ', fin: true },
    washer: { name: 'Кран и сифон за пералня', eco: [18, ''], std: [28, ''], prem: [45, 'вграден'], q: 'сифон за пералня вграден' },
    radiator: { name: 'Лира за кърпи 50×80', eco: [70, ''], std: [150, ''], prem: [320, 'дизайнерска'], q: 'лира за баня', fin: true },
    mirror: { name: 'Огледало с LED осветление', eco: [55, ''], std: [125, 'с подгряване против запотяване'], prem: [270, 'с подгряване и сензор'], q: 'огледало с led осветление за баня' },
    fan: { name: 'Вентилатор за баня с таймер', eco: [25, ''], std: [60, 'с датчик за влага'], prem: [120, 'тих, с датчик за влага'], q: 'вентилатор за баня с таймер' },
    spot: { name: 'Луна за вграждане IP44', eco: [9, ''], std: [19, ''], prem: [38, ''], q: 'луна за вграждане ip44' },
    niche: { name: 'Ниша за вграждане, готова за плочки', eco: [35, ''], std: [60, ''], prem: [110, 'с LED'], q: 'ниша за вграждане баня' },
  };
  const LAB = { wall: 22, floor: 20, hydro: 9, frame: 90, vanity: 60, shower: 110, showerIn: 170, glass: 70, drain: 70, bath: 100, bathMix: 40, washer: 25, radiator: 40, mirror: 25, fan: 30, spot: 12, niche: 50 };
  const SHOPS = [
    ['Praktiker', 'praktiker.bg'],
    ['Mr. Bricolage', 'mr-bricolage.bg'],
    ['eMAG', 'emag.bg'],
  ];
  const shopLinks = (q) =>
    `<span class="shops">${SHOPS.map(([n, site]) => `<a href="https://www.google.com/search?q=${encodeURIComponent(q + ' site:' + site)}" target="_blank" rel="noopener">${n}</a>`).join('')}<a href="https://www.google.com/search?q=${encodeURIComponent(q + ' цена наличност')}" target="_blank" rel="noopener">Всички</a></span>`;

  const STYLES = [
    { name: 'Спокоен бетон', sub: 'бетон, дъб, черни смесители', floor: ['conc-60120', 'straight'], wall: ['conc-6060', 'straight'], accent: ['oak-20120', 'vertical'], acc: 'wet', ht: 'full', grout: '#c8c6c1', fin: 'black', van: 'oak', wet: 'shower' },
    { name: 'Бял мрамор', sub: 'Калаката, голям формат, злато', floor: ['calacatta-60120', 'straight'], wall: ['calacatta-60120', 'straight'], accent: ['statuario-slab', 'straight'], acc: 'wet', ht: 'full', grout: '#f2f1ed', fin: 'gold', van: 'walnut', wet: 'shower' },
    { name: 'Травертин', sub: 'топъл беж, инокс', floor: ['travertine-60120', 'straight'], wall: ['white-3090', 'straight'], accent: ['travertine-60120', 'straight'], acc: 'wet', ht: 'full', grout: '#cbbca3', fin: 'brushed', van: 'oak', wet: 'shower' },
    { name: 'Зелиж и дъб', sub: 'ръчни плочки, рибена кост', floor: ['oak-20120', 'herringbone'], wall: ['white-3060', 'straight'], accent: ['zellige-green', 'vertical'], acc: 'wet', ht: '120', grout: '#f2f1ed', fin: 'gold', van: 'oak', wet: 'shower' },
    { name: 'Черно и бяло', sub: 'мозайка и метро плочки', floor: ['hex-black', 'straight'], wall: ['subway-white', 'brick'], accent: null, acc: 'none', ht: '210', grout: '#55555a', fin: 'black', van: 'white', wet: 'bath' },
    { name: 'Скандинавско', sub: 'тераццо, шалфей, хром', floor: ['terrazzo-6060', 'straight'], wall: ['white-3090', 'vertical'], accent: ['sage-7530', 'vertical'], acc: 'wet', ht: 'full', grout: '#f2f1ed', fin: 'chrome', van: 'oak', wet: 'shower' },
  ];

  /* ================= Състояние ================= */
  const DEF = () => ({
    room: { L: 250, W: 180, H: 260 },
    door: { wall: 'S', x: 20, w: 80 },
    win: null,
    stack: { wall: 'N', x: 15 },
    hints: [],
    items: { wet: 'shower', wc: true, sink: 'single', washer: true, radiator: true, niche: true },
    tiles: { floor: { key: 'conc-60120', pat: 'straight' }, wall: { key: 'conc-6060', pat: 'straight' }, accent: { key: 'oak-20120', pat: 'vertical' }, acc: 'wet', ht: 'full', grout: '#c8c6c1', joint: 2 },
    fix: { tier: 'std', fin: 'black', van: 'oak' },
    labor: true,
    fx: [],
    vars: [],
    vi: 0,
    style: 0,
  });
  let B = Object.assign(DEF(), M.store.get('bath', {}) || {});
  ['room', 'items', 'tiles', 'fix', 'door', 'stack'].forEach((k) => (B[k] = Object.assign(DEF()[k], B[k] || {})));
  const PH = { photo: null, photoUrl: null, insp: null, inspUrl: null, view: null, surf: 'floor', tab: 'plan', ready: false };
  const save = () => {
    try {
      M.store.set('bath', Object.assign({}, B, { vars: [] }));
    } catch (e) {}
  };

  /* ================= Геометрия (см) ================= */
  // План: x по дължината L (наляво → надясно), y по ширината W (задна стена N горе, y = 0).
  // Всяка стена има ос u от левия ѝ край, гледано отвътре на банята.
  const WALLS = ['N', 'E', 'S', 'W'];
  const WNAME = { N: 'Задна стена', E: 'Дясна стена', S: 'Стена с вратата', W: 'Лява стена' };
  const WEN = { N: 'the back wall facing the camera', E: 'the right wall', S: 'the wall behind the camera', W: 'the left wall' };
  const NRM = { N: [0, 1], E: [-1, 0], S: [0, -1], W: [1, 0] };
  const TAN = { N: [1, 0], E: [0, 1], S: [-1, 0], W: [0, -1] };
  const ROT = { N: 0, E: -Math.PI / 2, S: Math.PI, W: Math.PI / 2 };
  const wlen = (k) => (k === 'N' || k === 'S' ? B.room.L : B.room.W);
  function wpt(k, u) {
    const { L, W } = B.room;
    return k === 'N' ? [u, 0] : k === 'E' ? [L, u] : k === 'S' ? [L - u, W] : [0, W - u];
  }
  function rectOn(k, u, w, d) {
    const a = wpt(k, u),
      b = wpt(k, u + w),
      n = NRM[k];
    const xs = [a[0], b[0], a[0] + n[0] * d, b[0] + n[0] * d],
      ys = [a[1], b[1], a[1] + n[1] * d, b[1] + n[1] * d];
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  const hit = (a, b) => a.x0 < b.x1 - 0.5 && b.x0 < a.x1 - 0.5 && a.y0 < b.y1 - 0.5 && b.y0 < a.y1 - 0.5;
  const inside = (r) => r.x0 >= -0.5 && r.y0 >= -0.5 && r.x1 <= B.room.L + 0.5 && r.y1 <= B.room.W + 0.5;
  const foot = (f) => rectOn(f.wall, f.u, f.w, f.d);
  const zone = (f) => rectOn(f.wall, f.u, f.w, f.d + (f.cl || 0));
  const doorZone = () => rectOn(B.door.wall, B.door.x, B.door.w, Math.min(B.door.w, 90) + 5);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const ctr = (f) => wpt(f.wall, f.u + f.w / 2);
  function touches(r, k) {
    const { L, W } = B.room;
    return k === 'N' ? r.y0 <= 0.5 : k === 'S' ? r.y1 >= W - 0.5 : k === 'W' ? r.x0 <= 0.5 : r.x1 >= L - 0.5;
  }
  function span(r, k) {
    const { L, W } = B.room;
    return k === 'N' ? [r.x0, r.x1] : k === 'E' ? [r.y0, r.y1] : k === 'S' ? [L - r.x1, L - r.x0] : [W - r.y1, W - r.y0];
  }
  function toWall(x, y) {
    const { L, W } = B.room;
    const d = { N: y, S: W - y, W: x, E: L - x };
    const k = WALLS.reduce((a, b) => (d[b] < d[a] ? b : a), 'N');
    return { k, u: k === 'N' ? x : k === 'E' ? y : k === 'S' ? L - x : W - y };
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ================= Подреждане ================= */
  const FXN = { bath: 'Вана', shower: 'Душ', wc: 'Тоалетна', sink: 'Мивка', washer: 'Пералня', radiator: 'Лира' };
  const CL = { bath: 70, shower: 60, wc: 60, sink: 70, washer: 60, radiator: 0 };
  const REQ = { bath: 1, shower: 1, wc: 1, sink: 1 };
  function sizesFor(t, len) {
    if (t === 'bath') return (len >= 150 && len <= 185 ? [[len, 75]] : []).concat([[170, 75], [160, 70], [180, 80], [150, 70]]);
    if (t === 'shower') return [[120, 90], [100, 90], [90, 90], [140, 90], [80, 80]];
    if (t === 'wc') return [[80, 65], [70, 62]];
    if (t === 'sink') return B.items.sink === 'double' ? [[120, 48], [100, 46]] : [[80, 46], [60, 46], [100, 46], [50, 40]];
    if (t === 'washer') return [[60, 60]];
    return [[50, 12]];
  }
  function types() {
    const it = [];
    if (B.items.wet === 'bath' || B.items.wet === 'both') it.push('bath');
    if (B.items.wet === 'shower' || B.items.wet === 'both') it.push('shower');
    if (B.items.wc) it.push('wc');
    if (B.items.sink !== 'none') it.push('sink');
    if (B.items.washer) it.push('washer');
    if (B.items.radiator) it.push('radiator');
    return it;
  }
  function valid(f, placed) {
    const fo = foot(f);
    if (!inside(fo) || hit(fo, doorZone())) return false;
    if (f.cl && !inside(zone(f))) return false;
    const soft = f.type === 'radiator';
    for (const g of placed) {
      const go = foot(g);
      if (hit(fo, go)) return false;
      if (soft || g.type === 'radiator') continue;
      if (f.cl && hit(zone(f), go)) return false;
      if (g.cl && hit(fo, zone(g))) return false;
    }
    return true;
  }
  const hintFor = (t) => {
    const want = { wc: ['wc'], sink: ['water'], shower: ['drain', 'water'], bath: ['drain', 'water'], washer: ['water'] }[t] || [];
    const h = (B.hints || []).find((p) => want.includes(p.kind) && WALLS.includes(p.wall));
    return h ? wpt(h.wall, clamp(+h.x || 0, 0, wlen(h.wall))) : null;
  };
  function cost(f, placed) {
    const c = ctr(f),
      len = wlen(f.wall);
    const sp = wpt(B.stack.wall, clamp(B.stack.x, 0, wlen(B.stack.wall)));
    const dc = wpt(B.door.wall, B.door.x + B.door.w / 2);
    const wt = { bath: 1, shower: 1.2, wc: 1.6, sink: 0.8, washer: 0.6, radiator: 0.15 }[f.type];
    let s = wt * dist(c, sp);
    const h = hintFor(f.type);
    if (h) s += 2 * dist(c, h);
    const corner = f.u < 1 || f.u + f.w > len - 1;
    if (f.type === 'bath' || f.type === 'shower') {
      s -= 0.6 * dist(c, dc) + (corner ? 120 : 0) + f.w * 3 + f.d * 1.5;
      if (f.type === 'bath' && Math.abs(f.w - len) < 1) s -= 200;
    }
    if (f.type === 'wc') {
      const opp = { N: 'S', S: 'N', E: 'W', W: 'E' }[B.door.wall];
      if (f.wall === opp && Math.abs(f.wall === 'N' || f.wall === 'S' ? c[0] - dc[0] : c[1] - dc[1]) < 50) s += 80;
    }
    if (f.type === 'sink') {
      s += 0.25 * dist(c, dc) - f.w * 0.6;
      if (B.win && B.win.wall === f.wall && B.win.x < f.u + f.w && f.u < B.win.x + B.win.w) s += 200;
    }
    if (f.type === 'washer' && corner) s -= 40;
    if (f.type === 'radiator') {
      const w = placed.find((p) => p.type === 'shower' || p.type === 'bath');
      if (w) s += 0.4 * dist(c, ctr(w));
    }
    return s;
  }
  function cands(t, placed, lim) {
    const out = [];
    for (const k of WALLS) {
      const len = wlen(k);
      for (const [w, d] of sizesFor(t, len)) {
        if (w > len + 0.1) continue;
        const us = new Set([0, len - w]);
        for (let u = 0; u <= len - w; u += 5) us.add(u);
        for (const u of us) {
          const f = { type: t, wall: k, u, w, d, cl: CL[t] };
          if (valid(f, placed)) out.push([cost(f, placed), f]);
        }
      }
    }
    out.sort((a, b) => a[0] - b[0]);
    return lim ? out.slice(0, lim) : out;
  }
  function beam(list, start) {
    let bm = [start];
    for (const t of list) {
      const next = [];
      for (const st of bm) {
        const cs = cands(t, st.placed, 8);
        if (!cs.length) next.push({ placed: st.placed, cost: st.cost + (REQ[t] ? 3000 : 400), skip: st.skip.concat(t) });
        for (const [c, f] of cs) next.push({ placed: st.placed.concat(f), cost: st.cost + c, skip: st.skip });
      }
      next.sort((a, b) => a.cost - b.cost);
      bm = next.slice(0, 24);
    }
    return bm[0];
  }
  function solve() {
    const list = types();
    if (!list.length) return [{ placed: [], cost: 0, skip: [] }];
    const [first, ...rest] = list;
    const starts = [];
    const seen = new Set();
    for (const [c, f] of cands(first, [])) {
      const sig = f.wall + (f.u < 1 ? 'L' : f.u + f.w > wlen(f.wall) - 1 ? 'R' : 'M') + f.w;
      if (seen.has(sig)) continue;
      seen.add(sig);
      starts.push({ placed: [f], cost: c, skip: [] });
      if (starts.length >= 10) break;
    }
    if (!starts.length) starts.push({ placed: [], cost: 3000, skip: [first] });
    const sols = starts.map((s) => beam(rest, s)).filter(Boolean);
    sols.sort((a, b) => a.cost - b.cost);
    const out = [],
      sigs = new Set();
    for (const s of sols) {
      const sig = s.placed
        .map((f) => f.type + f.wall)
        .sort()
        .join('|');
      if (sigs.has(sig)) continue;
      sigs.add(sig);
      out.push(s);
      if (out.length >= 3) break;
    }
    return out;
  }
  function relayout(keepIndex) {
    const sols = solve();
    B.vars = sols.map((s) => ({ fx: s.placed.map((f) => Object.assign({}, f)), skip: s.skip }));
    B.vi = keepIndex && B.vi < B.vars.length ? B.vi : 0;
    B.fx = B.vars[B.vi] ? B.vars[B.vi].fx.map((f) => Object.assign({}, f)) : [];
  }

  /* ---------- Проверки ---------- */
  function checks() {
    const bad = new Set(),
      msgs = [],
      ok = [];
    const fx = B.fx;
    for (const f of fx) {
      const nm = FXN[f.type];
      if (!inside(foot(f))) bad.add(f), msgs.push(`${nm} излиза извън стаята.`);
      else if (f.cl && !inside(zone(f))) bad.add(f), msgs.push(`Пред ${nm.toLowerCase()} няма ${f.cl} см свободно място.`);
      if (hit(foot(f), doorZone())) bad.add(f), msgs.push(`${nm} пречи на вратата да се отвори.`);
    }
    for (let i = 0; i < fx.length; i++)
      for (let j = i + 1; j < fx.length; j++) {
        const a = fx[i],
          b = fx[j];
        const soft = a.type === 'radiator' || b.type === 'radiator';
        if (hit(foot(a), foot(b)) || (!soft && ((a.cl && hit(zone(a), foot(b))) || (b.cl && hit(foot(a), zone(b)))))) {
          bad.add(a), bad.add(b);
          msgs.push(`${FXN[a.type]} и ${FXN[b.type].toLowerCase()} се застъпват или нямат място пред тях.`);
        }
      }
    const sp = wpt(B.stack.wall, clamp(B.stack.x, 0, wlen(B.stack.wall)));
    const wc = fx.find((f) => f.type === 'wc');
    if (wc) {
      const d = dist(ctr(wc), sp);
      if (d > 300) msgs.push(`Тоалетната е на ${M.fmt(d / 100, 1)} м от щранга. Каналът Ø110 иска наклон 2% (${Math.round(d * 0.02)} см денивелация) или помпа.`);
      else ok.push(`Тоалетната е на ${M.fmt(d / 100, 1)} м от щранга, наклон 2% = ${Math.max(1, Math.round(d * 0.02))} см.`);
    }
    const sh = fx.find((f) => f.type === 'shower');
    if (sh) ok.push('Подът в душа е с наклон 1,5–2% към линейния сифон. Нужни са поне 7 см от бетона до готовия под.');
    const sk = fx.find((f) => f.type === 'sink');
    if (sk && B.win && B.win.wall === sk.wall && B.win.x < sk.u + sk.w && sk.u < B.win.x + B.win.w) msgs.push('Мивката е под прозореца и няма място за огледало.');
    if (sh && B.win && touches(foot(sh), B.win.wall)) {
      const [a, b] = span(foot(sh), B.win.wall);
      if (B.win.x < b && a < B.win.x + B.win.w) msgs.push('Прозорецът е в зоната на душа. Нужна е PVC дограма и наклонен перваз с плочки.');
    }
    (B.vars[B.vi] && B.vars[B.vi].skip ? B.vars[B.vi].skip : []).forEach((t) => msgs.push(`${FXN[t]} не се побира. Пробвай по-малки размери или махни нещо.`));
    return { bad, msgs, ok };
  }

  /* ================= Плочки: рисуване ================= */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const h2r = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  function shade(h, k, a = 1) {
    const c = h2r(h).map((v) => (k < 0 ? v * (1 + k) : v + (255 - v) * k));
    return `rgba(${c.map((v) => Math.round(clamp(v, 0, 255))).join(',')},${a})`;
  }
  const laid = (t, pat) => (t.look === 'hex' ? [t.size[0], t.size[0]] : pat === 'vertical' ? [t.size[1], t.size[0]] : [t.size[0], t.size[1]]);
  function startOff(len, t) {
    if (len <= t) return { s: (len - t) / 2, edge: len };
    const jA = (len / 2) % t,
      eA = jA < 0.5 ? t : jA;
    const jB = ((len - t) / 2) % t,
      eB = jB < 0.5 ? t : jB;
    return eA >= eB ? { s: eA - t, edge: eA } : { s: eB - t, edge: eB };
  }
  const herringOK = (t) => t.look !== 'hex' && t.size[0] / t.size[1] >= 2;
  const patOf = (t, pat) => (t.look === 'hex' ? 'hex' : pat === 'herringbone' && !herringOK(t) ? 'straight' : pat);

  // Нарежда плочките върху повърхност W × H см (y надолу) и ги рисува. Връща информация за крайните парчета.
  function drawTiling(ctx, W, H, ppc, t, pat, opt) {
    pat = patOf(t, pat);
    const g = Math.max((opt.joint || 2) / 10, 0.9 / ppc);
    const R = rng(opt.seed || 7);
    ctx.save();
    ctx.fillStyle = opt.grout;
    ctx.fillRect(0, 0, W * ppc, H * ppc);
    const rects = [],
      polys = [];
    let info = {};
    if (pat === 'hex') {
      const r = t.size[0] / 2,
        hx = 1.5 * r,
        vy = Math.sqrt(3) * r;
      for (let i = -1; i * hx < W + r; i++)
        for (let j = -1; j * vy < H + vy; j++) {
          const cx = i * hx,
            cy = j * vy + (i & 1 ? vy / 2 : 0);
          const rr = r - g * 0.6;
          polys.push([0, 1, 2, 3, 4, 5].map((q) => [cx + rr * Math.cos((q * Math.PI) / 3), cy + rr * Math.sin((q * Math.PI) / 3)]));
        }
      info = { edge: null };
    } else if (pat === 'herringbone') {
      const Lg = t.size[0],
        Sh = t.size[1];
      const T = Math.ceil((W + H) / Lg) + 2,
        J = Math.ceil((W + H) / Sh) + 2;
      for (let j = -J; j <= J; j++)
        for (let k = -T; k <= T; k++) {
          const x = k * Lg + j * Sh,
            y = k * Lg - j * Sh;
          if (x > W + Lg || y > H + Lg || x < -2 * Lg || y < -2 * Lg) continue;
          rects.push({ x, y, w: Lg, h: Sh }, { x: x + Lg - Sh, y: y + Sh, w: Sh, h: Lg });
        }
      info = { edge: null };
    } else {
      const [tw, th] = laid(t, pat);
      const ox = startOff(W, tw);
      const oy = opt.centerY ? startOff(H, th) : { s: 0, edge: H % th < 0.5 ? th : H % th };
      info = { edge: ox.edge, top: oy.edge, tw, th };
      const shift = pat === 'brick' ? (tw >= 60 ? tw / 3 : tw / 2) : 0;
      let r = 0;
      for (let y = oy.s; y < H; y += th, r++) {
        let x0 = ox.s + (shift ? (r * shift) % tw : 0);
        if (x0 > 0) x0 -= tw;
        for (let x = x0; x < W; x += tw) rects.push({ x, y: opt.centerY ? y : H - y - th, w: tw, h: th });
      }
    }
    // плочки
    const gg = g / 2;
    for (const q of rects) {
      const x = (q.x + gg) * ppc,
        y = (q.y + gg) * ppc,
        w = (q.w - g) * ppc,
        h = (q.h - g) * ppc;
      if (x > W * ppc || y > H * ppc || x + w < 0 || y + h < 0) continue;
      fillTile(ctx, x, y, w, h, t, R, ppc);
    }
    for (const p of polys) {
      ctx.beginPath();
      p.forEach(([x, y], i) => (i ? ctx.lineTo(x * ppc, y * ppc) : ctx.moveTo(x * ppc, y * ppc)));
      ctx.closePath();
      ctx.fillStyle = shade(t.color, (R() - 0.5) * 0.1);
      ctx.fill();
    }
    // шарка през всички плочки (мрамор, бетон, травертин, тераццо)
    if (['marble', 'concrete', 'travertine', 'terrazzo', 'stone'].includes(t.look)) {
      ctx.beginPath();
      for (const q of rects) ctx.rect((q.x + gg) * ppc, (q.y + gg) * ppc, (q.w - g) * ppc, (q.h - g) * ppc);
      ctx.clip();
      overlay(ctx, W, H, ppc, t, R);
    }
    ctx.restore();
    return info;
  }
  function fillTile(ctx, x, y, w, h, t, R, ppc) {
    const amt = { zellige: 0.13, wood: 0.08, terrazzo: 0.02, subway: 0.02, solid: 0.015, relief: 0.01 }[t.look] ?? 0.03;
    ctx.fillStyle = shade(t.color, (R() - 0.5) * 2 * amt);
    ctx.fillRect(x, y, w, h);
    if (t.look === 'wood') {
      const hor = w >= h;
      ctx.strokeStyle = shade(t.color, -0.18, 0.35);
      ctx.lineWidth = Math.max(0.6, ppc * 0.12);
      const n = Math.max(3, Math.round((hor ? h : w) / (ppc * 1.6)));
      for (let i = 0; i < n; i++) {
        const o = (i + R() * 0.8) / n;
        ctx.beginPath();
        if (hor) {
          const yy = y + o * h;
          ctx.moveTo(x, yy);
          ctx.bezierCurveTo(x + w * 0.3, yy + (R() - 0.5) * ppc * 2, x + w * 0.7, yy + (R() - 0.5) * ppc * 2, x + w, yy + (R() - 0.5) * ppc);
        } else {
          const xx = x + o * w;
          ctx.moveTo(xx, y);
          ctx.bezierCurveTo(xx + (R() - 0.5) * ppc * 2, y + h * 0.3, xx + (R() - 0.5) * ppc * 2, y + h * 0.7, xx + (R() - 0.5) * ppc, y + h);
        }
        ctx.stroke();
      }
      if (R() < 0.35) {
        ctx.fillStyle = shade(t.color, -0.25, 0.25);
        ctx.beginPath();
        ctx.ellipse(x + w * (0.2 + R() * 0.6), y + h * (0.2 + R() * 0.6), Math.max(1, Math.min(w, h) * 0.12), Math.max(1, Math.min(w, h) * 0.06), 0, 0, 7);
        ctx.fill();
      }
    } else if (t.look === 'zellige' || t.look === 'subway') {
      const gr = ctx.createLinearGradient(x, y, x + w, y + h);
      gr.addColorStop(0, 'rgba(255,255,255,' + (t.look === 'zellige' ? 0.22 : 0.3) + ')');
      gr.addColorStop(0.45, 'rgba(255,255,255,0)');
      gr.addColorStop(1, 'rgba(0,0,0,' + (t.look === 'zellige' ? 0.16 : 0.08) + ')');
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w, h);
      if (t.look === 'zellige' && R() < 0.5) {
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.beginPath();
        ctx.ellipse(x + w * R(), y + h * R(), w * 0.25, h * 0.2, R(), 0, 7);
        ctx.fill();
      }
    } else if (t.look === 'relief') {
      const n = 3;
      for (let i = 0; i < n; i++) {
        const gr = ctx.createLinearGradient(x, y + (i * h) / n, x, y + ((i + 1) * h) / n);
        gr.addColorStop(0, 'rgba(255,255,255,.55)');
        gr.addColorStop(0.5, 'rgba(0,0,0,.06)');
        gr.addColorStop(1, 'rgba(0,0,0,.12)');
        ctx.fillStyle = gr;
        ctx.beginPath();
        ctx.moveTo(x, y + (i * h) / n);
        for (let s = 0; s <= 12; s++) ctx.lineTo(x + (s / 12) * w, y + (i * h) / n + Math.sin((s / 12) * Math.PI * 2) * h * 0.04);
        ctx.lineTo(x + w, y + ((i + 1) * h) / n);
        ctx.lineTo(x, y + ((i + 1) * h) / n);
        ctx.fill();
      }
    }
  }
  function overlay(ctx, W, H, ppc, t, R) {
    const A = (W * H) / 10000; // м²
    if (t.look === 'marble') {
      const veins = Math.round(5 + A * 5);
      for (let i = 0; i < veins; i++) {
        let x = R() * W,
          y = R() * H;
        const ang = (R() - 0.3) * 1.2 + 0.6;
        ctx.strokeStyle = shade(t.color2 || '#999999', 0, 0.12 + R() * 0.3);
        ctx.lineWidth = Math.max(0.5, ppc * (0.08 + R() * 0.35));
        ctx.beginPath();
        ctx.moveTo(x * ppc, y * ppc);
        for (let s = 0; s < 14; s++) {
          x += Math.cos(ang + (R() - 0.5) * 1.4) * 9;
          y += Math.sin(ang + (R() - 0.5) * 1.4) * 9;
          ctx.lineTo(x * ppc, y * ppc);
        }
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(255,255,255,.08)';
      for (let i = 0; i < A * 6; i++) {
        ctx.beginPath();
        ctx.ellipse(R() * W * ppc, R() * H * ppc, 30 * ppc * R(), 12 * ppc * R(), R() * 3, 0, 7);
        ctx.fill();
      }
    } else if (t.look === 'concrete' || t.look === 'stone') {
      for (let i = 0; i < A * 22; i++) {
        const r = (4 + R() * 22) * ppc;
        const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        const dark = R() < 0.5;
        gr.addColorStop(0, dark ? 'rgba(0,0,0,.045)' : 'rgba(255,255,255,.06)');
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.save();
        ctx.translate(R() * W * ppc, R() * H * ppc);
        ctx.fillStyle = gr;
        ctx.fillRect(-r, -r, 2 * r, 2 * r);
        ctx.restore();
      }
      ctx.fillStyle = t.look === 'stone' ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.1)';
      const n = Math.min(40000, A * 3000);
      for (let i = 0; i < n; i++) ctx.fillRect(R() * W * ppc, R() * H * ppc, Math.max(1, ppc * 0.12), Math.max(1, ppc * 0.12));
    } else if (t.look === 'travertine') {
      for (let i = 0; i < A * 90; i++) {
        const y = R() * H * ppc;
        ctx.strokeStyle = shade(t.color2 || '#b9a380', 0, 0.08 + R() * 0.18);
        ctx.lineWidth = Math.max(0.5, ppc * (0.1 + R() * 0.6));
        ctx.beginPath();
        const x = R() * W * ppc;
        ctx.moveTo(x, y);
        ctx.lineTo(x + (20 + R() * 80) * ppc, y + (R() - 0.5) * ppc * 2);
        ctx.stroke();
      }
      ctx.fillStyle = 'rgba(120,95,60,.25)';
      for (let i = 0; i < A * 300; i++) ctx.fillRect(R() * W * ppc, R() * H * ppc, ppc * (0.2 + R() * 0.8), ppc * 0.15);
    } else if (t.look === 'terrazzo') {
      const cols = ['#9a9286', '#c9b8a0', '#6f6a63', '#d8cfc0', '#b3a48d', '#8c9a92'];
      const n = Math.min(30000, A * 2200);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = cols[(R() * cols.length) | 0];
        ctx.beginPath();
        const r = ppc * (0.15 + R() * R() * 0.9);
        ctx.ellipse(R() * W * ppc, R() * H * ppc, Math.max(0.5, r), Math.max(0.5, r * (0.5 + R() * 0.5)), R() * 3, 0, 7);
        ctx.fill();
      }
    }
  }

  /* ---------- Зони с плочки по стени ---------- */
  const DOOR_H = 205;
  const wetFx = () => B.fx.filter((f) => f.type === 'shower' || f.type === 'bath');
  const tiledH = () => (B.tiles.ht === 'full' ? B.room.H : Math.min(B.room.H, +B.tiles.ht));
  const wetH = (f) => (B.tiles.ht === 'full' ? B.room.H : Math.min(B.room.H, f.type === 'shower' ? 210 : 200));
  function wetSpans(k) {
    const out = [];
    for (const f of wetFx()) {
      const r = foot(f);
      if (!touches(r, k)) continue;
      const [a, b] = span(r, k);
      if (b - a > 1) out.push({ a, b, h: wetH(f), f });
    }
    return out;
  }
  function complement(spans, len) {
    const s = spans.map((x) => [x.a, x.b]).sort((p, q) => p[0] - q[0]);
    const out = [];
    let c = 0;
    for (const [a, b] of s) {
      if (a > c) out.push([c, a]);
      c = Math.max(c, b);
    }
    if (c < len) out.push([c, len]);
    return out;
  }
  // правоъгълници [u0, u1, h0, h1] от пода нагоре
  function regions(k) {
    const len = wlen(k),
      ht = tiledH(),
      ws = wetSpans(k);
    const all = [[0, len, 0, ht]];
    ws.forEach((s) => s.h > ht && all.push([s.a, s.b, ht, s.h]));
    if (B.tiles.acc === k && B.tiles.accent.key) return { main: [], accent: all };
    if (B.tiles.acc === 'wet' && B.tiles.accent.key && ws.length) {
      const accent = ws.map((s) => [s.a, s.b, 0, Math.max(s.h, ht)]);
      const main = complement(ws, len).map(([a, b]) => [a, b, 0, ht]);
      return { main, accent };
    }
    return { main: all, accent: [] };
  }
  const ov = (r, o) => Math.max(0, Math.min(r[1], o[1]) - Math.max(r[0], o[0])) * Math.max(0, Math.min(r[3], o[3]) - Math.max(r[2], o[2]));
  function openings(k) {
    const o = [];
    if (B.door.wall === k) o.push([B.door.x, B.door.x + B.door.w, 0, DOOR_H]);
    if (B.win && B.win.wall === k) o.push([B.win.x, B.win.x + B.win.w, B.win.sill, B.win.sill + B.win.h]);
    // зад ваната не се лепи
    for (const f of B.fx.filter((x) => x.type === 'bath')) {
      const r = foot(f);
      if (touches(r, k)) {
        const [a, b] = span(r, k);
        if (b - a > 1) o.push([a, b, 0, 55]);
      }
    }
    return o;
  }
  const areaOf = (rects, k) => rects.reduce((s, r) => s + (r[1] - r[0]) * (r[3] - r[2]) - openings(k).reduce((t, o) => t + ov(r, o), 0), 0) / 10000;
  const nicheOn = () => {
    const sh = B.fx.find((f) => f.type === 'shower');
    return B.items.niche && sh ? { wall: sh.wall, u: sh.u + sh.w / 2 - 30, w: 60, h0: 120, h1: 150 } : null;
  };

  /* ---------- Стена като картина ---------- */
  const PAINT = '#eeece7';
  function wallCanvas(k, ppc) {
    const len = wlen(k),
      H = B.room.H;
    const cv = document.createElement('canvas');
    cv.width = Math.round(len * ppc);
    cv.height = Math.round(H * ppc);
    const ctx = cv.getContext('2d');
    ctx.fillStyle = PAINT;
    ctx.fillRect(0, 0, cv.width, cv.height);
    const reg = regions(k);
    const T = B.tiles;
    const info = {};
    const paint = (rects, tl, pat, seed) => {
      if (!rects.length) return null;
      ctx.save();
      ctx.beginPath();
      rects.forEach(([u0, u1, h0, h1]) => ctx.rect(u0 * ppc, (H - h1) * ppc, (u1 - u0) * ppc, (h1 - h0) * ppc));
      ctx.clip();
      const inf = drawTiling(ctx, len, H, ppc, tl, pat, { grout: T.grout, joint: T.joint, seed });
      ctx.restore();
      return inf;
    };
    info.main = paint(reg.main, tile(T.wall.key), T.wall.pat, 11 + WALLS.indexOf(k));
    info.accent = T.accent.key ? paint(reg.accent, tile(T.accent.key), T.accent.pat, 31 + WALLS.indexOf(k)) : null;
    // ниша
    const n = nicheOn();
    if (n && n.wall === k) {
      const x = n.u * ppc,
        y = (H - n.h1) * ppc,
        w = n.w * ppc,
        h = (n.h1 - n.h0) * ppc;
      const tl = tile(T.accent.key && T.acc === 'wet' ? T.accent.key : T.wall.key);
      ctx.fillStyle = shade(tl.color, -0.28);
      ctx.fillRect(x, y, w, h);
      const gr = ctx.createLinearGradient(x, y, x, y + h);
      gr.addColorStop(0, 'rgba(0,0,0,.35)');
      gr.addColorStop(0.35, 'rgba(0,0,0,.05)');
      gr.addColorStop(1, 'rgba(255,255,255,.08)');
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,226,170,.55)';
      ctx.fillRect(x + 2 * ppc, y + 1 * ppc, w - 4 * ppc, Math.max(1, 0.4 * ppc));
    }
    // врата
    if (B.door.wall === k) {
      const x = B.door.x * ppc,
        y = (H - DOOR_H) * ppc,
        w = B.door.w * ppc,
        h = DOOR_H * ppc;
      ctx.fillStyle = '#f4f3ef';
      ctx.fillRect(x - 4 * ppc, y - 4 * ppc, w + 8 * ppc, h + 4 * ppc);
      ctx.fillStyle = '#e9e6df';
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = 'rgba(0,0,0,.12)';
      ctx.lineWidth = Math.max(1, ppc * 0.3);
      ctx.strokeRect(x + 1 * ppc, y + 1 * ppc, w - 2 * ppc, h - 1 * ppc);
      ctx.fillStyle = FIN[B.fix.fin].color;
      ctx.fillRect(x + w - 12 * ppc, y + h * 0.52, 9 * ppc, 1.6 * ppc);
    }
    // прозорец
    if (B.win && B.win.wall === k) {
      const x = B.win.x * ppc,
        y = (H - B.win.sill - B.win.h) * ppc,
        w = B.win.w * ppc,
        h = B.win.h * ppc;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 3 * ppc, y - 3 * ppc, w + 6 * ppc, h + 6 * ppc);
      const gr = ctx.createLinearGradient(0, y, 0, y + h);
      gr.addColorStop(0, '#b9d4ec');
      gr.addColorStop(1, '#eef4f8');
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = 'rgba(255,255,255,.85)';
      ctx.fillRect(x + w / 2 - 2 * ppc, y, 4 * ppc, h);
    }
    return { cv, info };
  }
  function floorCanvas(ppc) {
    const { L, W } = B.room;
    const cv = document.createElement('canvas');
    cv.width = Math.round(L * ppc);
    cv.height = Math.round(W * ppc);
    const ctx = cv.getContext('2d');
    const inf = drawTiling(ctx, L, W, ppc, tile(B.tiles.floor.key), B.tiles.floor.pat, { grout: B.tiles.grout, joint: B.tiles.joint, seed: 3, centerY: true });
    return { cv, info: inf };
  }

  /* ================= Количествена сметка ================= */
  function bom() {
    const T = B.tiles,
      F = B.fix,
      fin = FIN[F.fin],
      tier = F.tier;
    const rows = [];
    const add = (sec, name, note, qty, unit, price, q) => qty > 0 && rows.push({ sec, name, note, qty, unit, price, total: qty * price, q });
    const { L, W } = B.room;
    // площи
    const bathFoot = B.fx.filter((f) => f.type === 'bath').reduce((s, f) => s + f.w * f.d, 0);
    const floorA = (L * W - bathFoot) / 10000;
    let wallA = 0,
      accA = 0;
    for (const k of WALLS) {
      const r = regions(k);
      wallA += areaOf(r.main, k);
      accA += areaOf(r.accent, k);
    }
    const n = nicheOn();
    if (n) {
      const nA = (2 * (n.w + (n.h1 - n.h0)) * 10) / 10000;
      if (T.acc === 'wet' && T.accent.key) accA += nA;
      else wallA += nA;
    }
    if (B.win) {
      const ht = Math.max(tiledH(), ...wetSpans(B.win.wall).map((s) => s.h));
      const hIn = clamp(ht - B.win.sill, 0, B.win.h);
      if (hIn > 0) wallA += ((2 * hIn + B.win.w) * 20) / 10000;
    }
    const surfaces = [
      ['Под', T.floor, floorA, 'floor'],
      ['Стени', T.wall, wallA, 'wall'],
    ];
    if (T.accent.key && accA > 0.05) surfaces.push(['Акцент', T.accent, accA, 'wall']);
    const tilesTot = { floor: 0, wall: 0 };
    let glueS1 = 0,
      glueStd = 0,
      groutKg = 0,
      clips = 0,
      labor = 0;
    for (const [lbl, sel, a, where] of surfaces) {
      if (a <= 0) continue;
      const tl = tile(sel.key),
        pat = patOf(tl, sel.pat);
      const waste = (WASTE[pat] || 0.1) + (tl.size[0] >= 120 ? 0.05 : 0);
      const need = a * (1 + waste);
      const boxes = Math.ceil(need / tl.box - 0.02);
      add('Плочки', `${lbl}: ${tl.type} ${tl.name} ${tl.size[1]}×${tl.size[0]} см`, `${M.fmt(a, 2)} м² + ${Math.round(waste * 100)}% фира · ${PATS.find((p) => p[0] === pat)?.[1] || 'шестоъгълници'} · ${tl.finish} · кашон ${M.fmt(tl.box, 2)} м²`, boxes, 'кашона', tl.price * tl.box, tl.q);
      tilesTot[where] += a;
      const big = Math.max(...tl.size);
      const kg = big <= 20 ? 3 : big <= 60 ? 4.5 : 6;
      if (where === 'floor' || big >= 60) glueS1 += a * kg;
      else glueStd += a * kg;
      const A = tl.size[0] * 10,
        Bm = tl.size[1] * 10;
      groutKg += a * ((A + Bm) / (A * Bm)) * tl.thick * T.joint * 1.6;
      if (big >= 60) clips += (a / ((tl.size[0] * tl.size[1]) / 10000)) * 3;
      let rate = where === 'floor' ? LAB.floor : LAB.wall;
      if (big >= 120) rate *= 1.3;
      if (pat === 'herringbone') rate *= 1.25;
      if (big <= 15 || tl.look === 'hex') rate *= 1.4;
      labor += a * rate;
      add('Труд', `Лепене на плочки: ${lbl.toLowerCase()}`, `${M.fmt(rate, 0)} €/м²`, Math.round(a * 100) / 100, 'м²', rate, null);
    }
    // материали
    const tiledTot = tilesTot.floor + tilesTot.wall;
    const perim = (2 * (L + W)) / 100;
    let hydroA = (L * W) / 10000 + perim * 0.2;
    let tape = perim;
    for (const k of WALLS) wetSpans(k).forEach((s) => (hydroA += ((s.b - s.a) * Math.max(0, s.h - 20)) / 10000));
    for (const f of wetFx()) tape += ((WALLS.filter((k) => touches(foot(f), k)).length - 1) * wetH(f)) / 100 + (f.type === 'bath' ? (f.w + 2 * f.d) / 100 : 0);
    const has = (t) => B.fx.some((f) => f.type === t);
    const pts = (has('wc') ? 2 : 0) + (has('sink') ? (B.items.sink === 'double' ? 4 : 2) : 0) + (has('shower') ? 3 : 0) + (has('bath') ? 3 : 0) + (has('washer') ? 2 : 0);
    add('Материали', 'Грунд дълбокопроникващ', '0,2 л/м² · кутия 5 л', Math.ceil((tiledTot * 0.2) / 5), 'бр.', 14, 'грунд дълбокопроникващ 5 л');
    add('Материали', 'Хидроизолация, течна мембрана', `${M.fmt(hydroA, 1)} м² × 1,4 кг · кофа 5 кг`, Math.ceil((hydroA * 1.4) / 5), 'бр.', 32, 'хидроизолация течна мембрана баня');
    add('Материали', 'Хидроизолационна лента за ъгли', `${M.fmt(tape, 1)} м · ролка 10 м`, Math.ceil(tape / 10), 'бр.', 16, 'хидроизолационна лента 10 м');
    add('Материали', 'Маншети за тръби и сифони', 'на всеки извод в мократа зона', pts + (has('shower') ? 1 : 0), 'бр.', 3, 'маншет хидроизолация тръба');
    add('Материали', 'Лепило C2TE S1, флексибилно', `${M.fmt(glueS1, 0)} кг · чувал 25 кг · за под и големи плочки`, Math.ceil(glueS1 / 25), 'бр.', 17, 'лепило за плочки c2te s1 25 кг');
    add('Материали', 'Лепило C2TE', `${M.fmt(glueStd, 0)} кг · чувал 25 кг`, Math.ceil(glueStd / 25), 'бр.', 11, 'лепило за плочки c2te 25 кг');
    const gName = GROUTS.find((g) => g[0] === T.grout)?.[1] || '';
    add('Материали', `Фугираща смес CG2WA, ${gName.toLowerCase()}`, `${M.fmt(groutKg, 1)} кг · фуга ${T.joint} мм · опаковка 2 кг`, Math.max(1, Math.ceil(groutKg / 2)), 'бр.', 8, 'фугираща смес ' + gName.toLowerCase());
    if (has('shower')) add('Материали', 'Епоксидна фуга за душа', 'не пуска вода и мръсотия · 2,5 кг', 1, 'бр.', 38, 'епоксидна фуга');
    if (clips > 0) add('Материали', 'Нивелираща система, клипси и клинове', 'за плочки от 60 см нагоре · 100 бр.', Math.ceil(clips / 100), 'пак.', 12, 'нивелираща система плочки клипси');
    let prof = 0;
    if (n) prof += 2 * (n.w + (n.h1 - n.h0));
    if (B.win) prof += 2 * B.win.h + B.win.w;
    if (has('wc')) prof += 60 + 2 * 112;
    if (prof) add('Материали', `Ъглов профил за плочки, ${fin.name.toLowerCase()}`, `${M.fmt(prof / 100, 1)} м · 2,5 м`, Math.ceil(prof / 250), 'бр.', 7, 'профил за плочки ' + fin.q);
    add('Материали', 'Санитарен силикон', 'фуги по ъглите, ваната и мивката', Math.max(2, Math.ceil(tape / 8)), 'бр.', 7, 'силикон санитарен');
    // санитария
    const P = (key, qty = 1, extra = '') => {
      const p = PROD[key],
        [pr, br] = p[tier];
      const price = Math.round(pr * (p.fin ? fin.k : 1));
      const nm = key === 'shower' && tier === 'prem' ? 'Вградена душ система с термостат' : p.name;
      add('Санитария', nm + (p.fin ? `, ${fin.name.toLowerCase()}` : '') + extra, br ? 'напр. ' + br : '', qty, 'бр.', price, p.q + (p.fin ? ' ' + fin.q : ''));
    };
    if (has('wc')) P('frame'), P('wc'), (labor += LAB.frame), add('Труд', 'Монтаж на структура и тоалетна', '', 1, 'бр.', LAB.frame, null);
    if (has('sink')) {
      const sk = B.fx.find((f) => f.type === 'sink');
      const dbl = B.items.sink === 'double';
      P('vanity', 1, ` ${sk.w} см, ${VAN[F.van].name.toLowerCase()}${dbl ? ', с 2 мивки' : ''}`);
      rows[rows.length - 1].price = Math.round(PROD.vanity[tier][0] * (sk.w / 80) * (dbl ? 1.25 : 1));
      rows[rows.length - 1].total = rows[rows.length - 1].price;
      P('sinkMix', dbl ? 2 : 1);
      P('mirror', 1);
      add('Труд', 'Монтаж на шкаф, мивка, смесител и огледало', '', 1, 'бр.', LAB.vanity + LAB.mirror, null);
    }
    if (has('shower')) {
      P('shower');
      P('glass');
      P('drain');
      add('Труд', 'Душ: система, линеен сифон и стъкло', '', 1, 'бр.', (tier === 'prem' ? LAB.showerIn : LAB.shower) + LAB.drain + LAB.glass, null);
      if (B.items.niche) P('niche'), add('Труд', 'Вграждане на ниша', '', 1, 'бр.', LAB.niche, null);
    }
    if (has('bath')) P('bath'), P('bathMix'), add('Труд', 'Монтаж на вана и смесител', '', 1, 'бр.', LAB.bath + LAB.bathMix, null);
    if (has('washer')) P('washer'), add('Труд', 'Извод за пералня', '', 1, 'бр.', LAB.washer, null);
    if (has('radiator')) P('radiator'), add('Труд', 'Монтаж на лира', '', 1, 'бр.', LAB.radiator, null);
    P('fan');
    const spots = Math.max(2, Math.round((L * W) / 10000 / 1.3));
    P('spot', spots);
    add('Труд', 'Вентилатор и осветление', '', 1, 'бр.', LAB.fan + spots * LAB.spot, null);
    add('Труд', 'Хидроизолация в 2 слоя', `${M.fmt(hydroA, 1)} м²`, Math.round(hydroA * 100) / 100, 'м²', LAB.hydro, null);
    const sum = (s) => rows.filter((r) => r.sec === s).reduce((a, r) => a + r.total, 0);
    const tot = { tiles: sum('Плочки'), mats: sum('Материали'), fix: sum('Санитария'), labor: sum('Труд') };
    tot.all = tot.tiles + tot.mats + tot.fix + (B.labor ? tot.labor : 0);
    return { rows, floorA, wallA, accA, tot };
  }

  /* ================= 2D план ================= */
  function fxShape(f, sel) {
    const w = f.w,
      d = f.d;
    const fill = 'var(--panel)';
    const st = `stroke="${sel ? '#ff3b30' : 'currentColor'}" stroke-width="${sel ? 1.6 : 0.9}"`;
    if (f.type === 'bath') return `<rect class="shape" x="0" y="0" width="${w}" height="${d}" rx="4" fill="#fff" ${st}/><rect x="7" y="7" width="${w - 14}" height="${d - 14}" rx="22" fill="#eef3f6" stroke="currentColor" stroke-width=".6"/><circle cx="${w - 22}" cy="${d / 2}" r="2.6" fill="none" stroke="currentColor" stroke-width=".7"/>`;
    if (f.type === 'shower') return `<rect class="shape" x="0" y="0" width="${w}" height="${d}" fill="rgba(0,113,227,.07)" ${st} stroke-dasharray="3 2"/><rect x="${w * 0.15}" y="4" width="${w * 0.7}" height="4" rx="1" fill="currentColor" opacity=".55"/><circle cx="${w / 2}" cy="${d / 2}" r="13" fill="none" stroke="currentColor" stroke-width=".6" stroke-dasharray="2 2"/>`;
    if (f.type === 'wc') return `<rect class="shape" x="${w / 2 - 30}" y="0" width="60" height="15" fill="rgba(0,0,0,.08)" ${st}/><ellipse cx="${w / 2}" cy="${15 + (d - 15) / 2}" rx="18" ry="${(d - 15) / 2}" fill="#fff" ${st}/><ellipse cx="${w / 2}" cy="${15 + (d - 15) / 2 + 3}" rx="11" ry="${(d - 15) / 2 - 9}" fill="none" stroke="currentColor" stroke-width=".6"/>`;
    if (f.type === 'sink') {
      const dbl = B.items.sink === 'double';
      const bs = (dbl ? [w * 0.27, w * 0.73] : [w / 2]).map((x) => `<ellipse cx="${x}" cy="${d / 2 + 2}" rx="${Math.min(20, w / (dbl ? 5 : 3))}" ry="13" fill="#fff" stroke="currentColor" stroke-width=".7"/>`).join('');
      return `<rect class="shape" x="0" y="0" width="${w}" height="${d}" rx="2" fill="${VAN[B.fix.van].color}" fill-opacity=".55" ${st}/>${bs}`;
    }
    if (f.type === 'washer') return `<rect class="shape" x="0" y="0" width="${w}" height="${d}" rx="3" fill="#fff" ${st}/><circle cx="${w / 2}" cy="${d / 2 + 3}" r="18" fill="none" stroke="currentColor" stroke-width=".8"/>`;
    return `<rect class="shape" x="0" y="0" width="${w}" height="${d}" fill="${FIN[B.fix.fin].color}" ${st}/>`;
  }
  function glassSeg(f) {
    // стъклото на walk-in душа: откъм свободната страна
    const len = wlen(f.wall);
    const L0 = f.u < 1,
      R0 = f.u + f.w > len - 1;
    if (L0 && R0) return [wpt(f.wall, f.u), wpt(f.wall, f.u + f.w - 60)].map((p) => [p[0] + NRM[f.wall][0] * f.d, p[1] + NRM[f.wall][1] * f.d]);
    const u = L0 ? f.u + f.w : f.u;
    const a = wpt(f.wall, u);
    return [a, [a[0] + NRM[f.wall][0] * f.d, a[1] + NRM[f.wall][1] * f.d]];
  }
  function planSVG(mini, idx) {
    const { L, W } = B.room;
    const fx = mini ? B.vars[idx].fx : B.fx;
    const chk = mini ? { bad: new Set() } : checks();
    const pad = mini ? 8 : 34;
    let s = `<svg viewBox="${-pad} ${-pad} ${L + 2 * pad} ${W + 2 * pad}" xmlns="http://www.w3.org/2000/svg" style="color:var(--ink)" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">`;
    s += `<rect x="-12" y="-12" width="${L + 24}" height="${W + 24}" fill="currentColor" opacity=".78" rx="2"/>`;
    if (!mini && PH.floorUrl) s += `<image href="${PH.floorUrl}" x="0" y="0" width="${L}" height="${W}" preserveAspectRatio="none"/>`;
    else s += `<rect x="0" y="0" width="${L}" height="${W}" fill="${tile(B.tiles.floor.key).color}"/>`;
    // врата
    const d0 = wpt(B.door.wall, B.door.x),
      d1 = wpt(B.door.wall, B.door.x + B.door.w),
      n = NRM[B.door.wall];
    const op = [d0, d1].map((p) => [p[0] - n[0] * 13, p[1] - n[1] * 13]);
    s += `<polygon points="${[d0, d1, op[1], op[0]].map((p) => p.join(',')).join(' ')}" fill="var(--panel)"/>`;
    const tip = [d0[0] + n[0] * B.door.w, d0[1] + n[1] * B.door.w];
    const sw = (tip[0] - d0[0]) * (d1[1] - d0[1]) - (tip[1] - d0[1]) * (d1[0] - d0[0]) > 0 ? 1 : 0;
    s += `<path d="M${d0.join(',')} L${tip.join(',')} A${B.door.w},${B.door.w} 0 0 ${sw} ${d1.join(',')} Z" fill="rgba(0,113,227,.05)" stroke="currentColor" stroke-width=".6" stroke-dasharray="3 2"/>`;
    // прозорец
    if (B.win) {
      const a = wpt(B.win.wall, B.win.x),
        b = wpt(B.win.wall, B.win.x + B.win.w),
        m = NRM[B.win.wall];
      const q = [a, b, [b[0] - m[0] * 12, b[1] - m[1] * 12], [a[0] - m[0] * 12, a[1] - m[1] * 12]];
      s += `<polygon points="${q.map((p) => p.join(',')).join(' ')}" fill="#cfe3f5" stroke="currentColor" stroke-width=".6"/>`;
    }
    // щранг
    const sp = wpt(B.stack.wall, clamp(B.stack.x, 0, wlen(B.stack.wall)));
    if (!mini) s += `<circle cx="${sp[0] - NRM[B.stack.wall][0] * 6}" cy="${sp[1] - NRM[B.stack.wall][1] * 6}" r="6" fill="#0071e3" stroke="#fff" stroke-width="1.2"><title>Щранг</title></circle>`;
    // уреди
    for (const f of fx) {
      const o = wpt(f.wall, f.u),
        t = TAN[f.wall],
        nn = NRM[f.wall];
      s += `<g class="fx${chk.bad.has(f) ? ' bad' : ''}" data-i="${fx.indexOf(f)}" transform="matrix(${t[0]} ${t[1]} ${nn[0]} ${nn[1]} ${o[0]} ${o[1]})">`;
      if (!mini && chk.bad.has(f) && f.cl) s += `<rect x="0" y="${f.d}" width="${f.w}" height="${f.cl}" fill="rgba(255,59,48,.08)" stroke="#ff3b30" stroke-width=".6" stroke-dasharray="2 2"/>`;
      s += fxShape(f, !mini && chk.bad.has(f)) + '</g>';
      if (f.type === 'shower') {
        const g = glassSeg(f);
        s += `<line x1="${g[0][0]}" y1="${g[0][1]}" x2="${g[1][0]}" y2="${g[1][1]}" stroke="#4aa3ff" stroke-width="${mini ? 2 : 2.4}" stroke-linecap="round"/>`;
      }
      if (!mini) {
        const r = foot(f);
        const fs = clamp(Math.min(r.x1 - r.x0, r.y1 - r.y0) / 7, 4.5, 7);
        const lbl = FXN[f.type] + (f.type === 'bath' || f.type === 'shower' ? ` ${f.w}×${f.d}` : f.type === 'sink' ? ` ${f.w}` : '');
        s += `<text x="${(r.x0 + r.x1) / 2}" y="${(r.y0 + r.y1) / 2 + fs * 0.35}" text-anchor="middle" font-size="${fs}" font-weight="600" fill="#1d1d1f" paint-order="stroke" stroke="rgba(255,255,255,.9)" stroke-width="1.6" pointer-events="none">${lbl}</text>`;
      }
    }
    if (!mini) {
      s += `<text x="${L / 2}" y="${-18}" text-anchor="middle" font-size="9" fill="currentColor">${L} см</text>`;
      s += `<text x="${L + 18}" y="${W / 2}" text-anchor="middle" font-size="9" fill="currentColor" transform="rotate(90 ${L + 18} ${W / 2})">${W} см</text>`;
    }
    return s + '</svg>';
  }
  function renderPlan() {
    const box = $('#baPlanBox');
    box.innerHTML = planSVG(false);
    const chk = checks();
    $('#baChecks').innerHTML =
      chk.msgs.map((m) => `<div class="bachk warn">⚠︎ ${esc(m)}</div>`).join('') + chk.ok.map((m) => `<div class="bachk">✓ ${esc(m)}</div>`).join('') || '';
  }
  function renderVariants() {
    $('#baVariants').innerHTML = B.vars
      .map((v, i) => `<button class="bavar" data-i="${i}" aria-pressed="${i === B.vi}">${planSVG(true, i)}<span class="small"><b>Вариант ${i + 1}</b> · ${v.fx.map((f) => FXN[f.type].toLowerCase()).join(', ')}</span></button>`)
      .join('');
  }
  function bindPlanDrag() {
    const box = $('#baPlanBox');
    let drag = null;
    const pt = (e) => {
      const svg = box.querySelector('svg');
      const p = svg.createSVGPoint();
      p.x = e.clientX;
      p.y = e.clientY;
      return p.matrixTransform(svg.getScreenCTM().inverse());
    };
    box.addEventListener('pointerdown', (e) => {
      const g = e.target.closest('.fx');
      if (!g) return;
      const f = B.fx[+g.dataset.i];
      if (!f) return;
      const p = pt(e);
      const w = toWall(p.x, p.y);
      drag = { f, off: w.k === f.wall ? w.u - f.u : f.w / 2, moved: false };
      e.preventDefault();
    });
    window.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const p = pt(e);
      const w = toWall(p.x, p.y);
      const f = drag.f;
      const len = wlen(w.k);
      let fw = f.w;
      if (fw > len) {
        if (f.type === 'bath' && len >= 150) fw = len;
        else return;
      }
      if (f.type === 'bath' && w.k !== f.wall) fw = len >= 150 && len <= 185 ? len : Math.min(170, len);
      const u = clamp(Math.round((w.u - (w.k === f.wall ? drag.off : fw / 2)) / 5) * 5, 0, len - fw);
      if (u === f.u && w.k === f.wall && fw === f.w) return;
      if (w.k !== f.wall) drag.off = fw / 2;
      Object.assign(f, { wall: w.k, u, w: fw });
      drag.moved = true;
      renderPlan();
    });
    window.addEventListener('pointerup', () => {
      if (!drag) return;
      const moved = drag.moved;
      drag = null;
      if (moved) {
        B.vars[B.vi] && (B.vars[B.vi].fx = B.fx.map((f) => Object.assign({}, f)));
        renderVariants();
        update({ plan: false });
      }
    });
  }

  /* ================= Изгледи на стените ================= */
  function drawFixturesElev(ctx, k, ppc) {
    const H = B.room.H;
    const X = (u) => u * ppc,
      Y = (h) => (H - h) * ppc;
    const fin = FIN[B.fix.fin].color;
    for (const f of B.fx) {
      const r = foot(f);
      if (!touches(r, k)) continue;
      const [a, b] = span(r, k);
      const own = f.wall === k;
      const c = (a + b) / 2;
      ctx.lineWidth = Math.max(1, ppc * 0.4);
      ctx.strokeStyle = 'rgba(29,29,31,.55)';
      if (f.type === 'bath') {
        ctx.fillStyle = 'rgba(255,255,255,.95)';
        ctx.fillRect(X(a), Y(56), X(b) - X(a), 56 * ppc);
        ctx.strokeRect(X(a), Y(56), X(b) - X(a), 56 * ppc);
        if (own) (ctx.fillStyle = fin), ctx.fillRect(X(c - 8), Y(80), 16 * ppc, 4 * ppc), ctx.fillRect(X(c - 2), Y(80), 4 * ppc, 9 * ppc);
      } else if (f.type === 'shower' && own) {
        const g = glassSeg(f).map((p) => span({ x0: p[0], x1: p[0], y0: p[1], y1: p[1] }, k)[0]);
        ctx.fillStyle = 'rgba(120,180,230,.18)';
        const g0 = Math.min(...g),
          g1 = Math.max(...g);
        ctx.fillRect(X(g0) - ppc, Y(200), Math.max(2 * ppc, X(g1) - X(g0) + 2 * ppc), 200 * ppc);
        ctx.strokeStyle = fin;
        ctx.strokeRect(X(g0) - ppc, Y(200), Math.max(2 * ppc, X(g1) - X(g0) + 2 * ppc), 200 * ppc);
        ctx.fillStyle = fin;
        ctx.fillRect(X(c - 15), Y(212), 30 * ppc, 2 * ppc);
        ctx.fillRect(X(a + 4), Y(214), (c - a - 4) * ppc, 1.4 * ppc);
        ctx.fillRect(X(c - 7), Y(118), 14 * ppc, 10 * ppc);
        ctx.fillStyle = 'rgba(29,29,31,.7)';
        ctx.fillRect(X(a + (b - a) * 0.15), Y(1.2), (b - a) * 0.7 * ppc, 1.2 * ppc);
      } else if (f.type === 'wc' && own) {
        ctx.fillStyle = 'rgba(0,0,0,.06)';
        ctx.fillRect(X(c - 30), Y(112), 60 * ppc, 112 * ppc);
        ctx.setLineDash([4, 3]);
        ctx.strokeRect(X(c - 30), Y(112), 60 * ppc, 112 * ppc);
        ctx.setLineDash([]);
        ctx.fillStyle = fin;
        ctx.fillRect(X(c - 12), Y(116), 24 * ppc, 16 * ppc);
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.roundRect ? ctx.roundRect(X(c - 18), Y(42), 36 * ppc, 14 * ppc, 6 * ppc) : ctx.rect(X(c - 18), Y(42), 36 * ppc, 14 * ppc);
        ctx.fill();
        ctx.stroke();
      } else if (f.type === 'sink' && own) {
        ctx.fillStyle = VAN[B.fix.van].color;
        ctx.fillRect(X(a), Y(85), (b - a) * ppc, 48 * ppc);
        ctx.strokeRect(X(a), Y(85), (b - a) * ppc, 48 * ppc);
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(X(a), Y(88), (b - a) * ppc, 3 * ppc);
        const dbl = B.items.sink === 'double';
        (dbl ? [a + (b - a) * 0.27, a + (b - a) * 0.73] : [c]).forEach((x) => {
          ctx.fillStyle = fin;
          ctx.fillRect(X(x - 1.2), Y(104), 2.4 * ppc, 16 * ppc);
          ctx.fillRect(X(x - 1.2), Y(104), 10 * ppc, 2 * ppc);
        });
        const mw = Math.min(b - a, 100);
        const gr = ctx.createLinearGradient(X(c - mw / 2), 0, X(c + mw / 2), 0);
        gr.addColorStop(0, '#dfe6ea');
        gr.addColorStop(0.5, '#f6f8f9');
        gr.addColorStop(1, '#d6dde2');
        ctx.fillStyle = 'rgba(255,214,150,.45)';
        ctx.fillRect(X(c - mw / 2) - 3 * ppc, Y(192) - 2 * ppc, (mw + 6) * ppc, 84 * ppc);
        ctx.fillStyle = gr;
        ctx.fillRect(X(c - mw / 2), Y(190), mw * ppc, 80 * ppc);
      } else if (f.type === 'washer' && own) {
        ctx.fillStyle = '#fff';
        ctx.fillRect(X(a), Y(85), (b - a) * ppc, 85 * ppc);
        ctx.strokeRect(X(a), Y(85), (b - a) * ppc, 85 * ppc);
        ctx.beginPath();
        ctx.arc(X(c), Y(45), 19 * ppc, 0, 7);
        ctx.stroke();
      } else if (f.type === 'radiator' && own) {
        ctx.fillStyle = fin;
        ctx.fillRect(X(a + 2), Y(170), 2.5 * ppc, 80 * ppc);
        ctx.fillRect(X(b - 4.5), Y(170), 2.5 * ppc, 80 * ppc);
        for (let i = 0; i < 9; i++) ctx.fillRect(X(a + 2), Y(166 - i * 8.5), (b - a - 4) * ppc, 1.6 * ppc);
      }
    }
  }
  function renderWalls() {
    const host = $('#baWalls');
    host.innerHTML = '';
    for (const k of WALLS) {
      const { cv, info } = wallCanvas(k, 2);
      drawFixturesElev(cv.getContext('2d'), k, 2);
      const r = regions(k);
      const a = areaOf(r.main, k) + areaOf(r.accent, k);
      const cut = (inf) => (inf && inf.edge ? `крайни парчета ${M.fmt(inf.edge, 1)} см${inf.edge < inf.tw / 3 ? ' ⚠︎ малки, премести началото' : ' ✓'}` : '');
      const fig = document.createElement('figure');
      fig.className = 'bawall';
      fig.append(cv);
      const cap = document.createElement('figcaption');
      cap.innerHTML = `<b>${WNAME[k]}</b> <span class="muted small">${wlen(k)} × ${B.room.H} см · плочки ${M.fmt(a, 2)} м²${info.main ? ' · ' + cut(info.main) : ''}${B.door.wall === k ? ' · врата' : ''}${B.win && B.win.wall === k ? ' · прозорец' : ''}</span>`;
      fig.append(cap);
      host.append(fig);
    }
  }

  /* ================= 3D ================= */
  class BathView {
    constructor(host) {
      const T = window.THREE;
      this.host = host;
      const r = (this.renderer = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }));
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
      r.outputEncoding = T.sRGBEncoding;
      r.toneMapping = T.ACESFilmicToneMapping;
      r.toneMappingExposure = 0.82;
      r.shadowMap.enabled = true;
      r.shadowMap.type = T.PCFSoftShadowMap;
      host.prepend(r.domElement);
      this.scene = new T.Scene();
      this.scene.background = new T.Color('#e9ecf2');
      const pm = new T.PMREMGenerator(r);
      this.scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
      this.camera = new T.PerspectiveCamera(50, 1, 0.05, 50);
      this.controls = new T.OrbitControls(this.camera, r.domElement);
      this.controls.enableDamping = false;
      this.controls.maxPolarAngle = Math.PI * 0.62;
      this.controls.addEventListener('change', () => this.render());
      this.scene.add(new T.HemisphereLight(0xffffff, 0xd9d4cc, 0.35));
      const sun = (this.sun = new T.DirectionalLight(0xfff4e6, 0.7));
      sun.castShadow = true;
      sun.shadow.mapSize.set(1024, 1024);
      this.scene.add(sun);
      this.group = null;
      this.ro = new ResizeObserver(() => this.resize());
      this.ro.observe(host);
      this.first = true;
    }
    resize() {
      const w = this.host.clientWidth,
        h = this.host.clientHeight;
      if (!w || !h) return;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
      this.render();
    }
    clear() {
      if (!this.group) return;
      this.scene.remove(this.group);
      this.group.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) [].concat(o.material).forEach((m) => (m.map && m.map.dispose(), m.dispose()));
      });
      this.group = null;
    }
    build() {
      const T = window.THREE;
      this.clear();
      const G = (this.group = new T.Group());
      const { L, W, H } = B.room;
      const m = (v) => v / 100;
      const ppc = Math.min(4, 2000 / Math.max(L, W, H));
      const tex = (cv) => {
        const t = new T.CanvasTexture(cv);
        t.encoding = T.sRGBEncoding;
        t.anisotropy = 8;
        return t;
      };
      const rough = (tl) => (/полиран|гланц/.test(tl.finish) ? 0.18 : /сатен/.test(tl.finish) ? 0.4 : 0.62);
      // под
      const fl = floorCanvas(ppc);
      const fmat = new T.MeshStandardMaterial({ map: tex(fl.cv), roughness: rough(tile(B.tiles.floor.key)), envMapIntensity: 0.55 });
      const floor = new T.Mesh(new T.PlaneGeometry(m(L), m(W)), fmat);
      floor.rotation.x = -Math.PI / 2;
      floor.position.set(m(L / 2), 0, m(W / 2));
      floor.receiveShadow = true;
      G.add(floor);
      // стени
      this.walls = [];
      for (const k of WALLS) {
        const { cv } = wallCanvas(k, ppc);
        const mat = new T.MeshStandardMaterial({ map: tex(cv), roughness: rough(tile(B.tiles.wall.key)), envMapIntensity: 0.55 });
        const mesh = new T.Mesh(new T.PlaneGeometry(m(wlen(k)), m(H)), mat);
        const mid = wpt(k, wlen(k) / 2);
        mesh.position.set(m(mid[0]), m(H / 2), m(mid[1]));
        mesh.rotation.y = ROT[k];
        mesh.receiveShadow = true;
        mesh.userData.n = new T.Vector3(NRM[k][0], 0, NRM[k][1]);
        G.add(mesh);
        this.walls.push(mesh);
      }
      // таван и лунички
      const ceil = new T.Mesh(new T.PlaneGeometry(m(L), m(W)), new T.MeshStandardMaterial({ color: '#f7f6f3', roughness: 0.9 }));
      ceil.rotation.x = Math.PI / 2;
      ceil.position.set(m(L / 2), m(H), m(W / 2));
      G.add(ceil);
      this.ceil = ceil;
      const spots = Math.max(2, Math.round((L * W) / 10000 / 1.3));
      const cols = Math.max(1, Math.round(Math.sqrt((spots * L) / W))),
        rows = Math.max(1, Math.ceil(spots / cols));
      const smat = new T.MeshBasicMaterial({ color: '#fff7e8' });
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const x = m(((i + 0.5) * L) / cols),
            z = m(((j + 0.5) * W) / rows);
          const s = new T.Mesh(new T.CircleGeometry(0.035, 24), smat);
          s.rotation.x = Math.PI / 2;
          s.position.set(x, m(H) - 0.002, z);
          G.add(s);
          if (i + j * cols < 3) {
            const pl = new T.PointLight(0xffe6c4, 0.35, 4.5, 2);
            pl.position.set(x, m(H) - 0.1, z);
            G.add(pl);
          }
        }
      // уреди
      this.fxg = [];
      const fin = FIN[B.fix.fin];
      const metal = new T.MeshStandardMaterial({ color: fin.color, metalness: fin.metal, roughness: fin.rough });
      const ceramic = new T.MeshPhysicalMaterial({ color: '#fbfbfa', roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.08 });
      const box = (w, h, d, mat, x, y, z, parent) => {
        const b = new T.Mesh(new T.BoxGeometry(w, h, d), mat);
        b.position.set(x, y, z);
        b.castShadow = b.receiveShadow = true;
        parent.add(b);
        return b;
      };
      for (const f of B.fx) {
        const g = new T.Group();
        const o = wpt(f.wall, f.u);
        g.position.set(m(o[0]), 0, m(o[1]));
        g.rotation.y = ROT[f.wall];
        const w = m(f.w),
          d = m(f.d);
        if (f.type === 'bath') {
          const t = 0.07,
            h = 0.56;
          box(w, h, t, ceramic, w / 2, h / 2, d - t / 2, g);
          box(w, h, t, ceramic, w / 2, h / 2, t / 2, g);
          box(t, h, d, ceramic, t / 2, h / 2, d / 2, g);
          box(t, h, d, ceramic, w - t / 2, h / 2, d / 2, g);
          box(w - 2 * t, 0.02, d - 2 * t, new T.MeshStandardMaterial({ color: '#eef3f6', roughness: 0.2 }), w / 2, 0.16, d / 2, g);
          box(0.06, 0.05, 0.08, metal, w / 2, 0.78, 0.04, g);
          box(0.03, 0.03, 0.14, metal, w / 2, 0.75, 0.09, g);
        } else if (f.type === 'shower') {
          const len = wlen(f.wall);
          const L0 = f.u < 1,
            R0 = f.u + f.w > len - 1;
          const glass = new T.MeshPhysicalMaterial({ color: '#e8f4f8', metalness: 0, roughness: 0.04, transparent: true, opacity: 0.22, envMapIntensity: 1.5 });
          if (L0 && R0) {
            box(w - 0.6, 2.0, 0.008, glass, (w - 0.6) / 2, 1.0, d, g);
            box(w - 0.6, 0.02, 0.02, metal, (w - 0.6) / 2, 2.0, d, g);
          } else {
            const x = L0 ? w : 0;
            box(0.008, 2.0, d, glass, x, 1.0, d / 2, g);
            box(0.02, 2.0, 0.02, metal, x, 1.0, 0.01, g);
            box(0.015, 0.015, d * 0.9, metal, x, 2.0, d * 0.45, g);
          }
          box(Math.min(0.8, w - 0.2), 0.006, 0.06, new T.MeshStandardMaterial({ color: '#4a4a4d', metalness: 0.8, roughness: 0.35 }), w / 2, 0.004, 0.07, g);
          const head = new T.Mesh(new T.CylinderGeometry(0.15, 0.15, 0.012, 40), metal);
          head.position.set(w / 2, 2.12, Math.min(d / 2, 0.42));
          g.add(head);
          box(0.025, 0.025, Math.min(d / 2, 0.42), metal, w / 2, 2.14, Math.min(d / 2, 0.42) / 2, g);
          box(0.16, 0.1, 0.03, metal, L0 ? w - 0.25 : 0.25, 1.12, 0.015, g);
        } else if (f.type === 'wc') {
          const tl = tile(B.tiles.wall.key);
          box(0.6, 1.12, 0.15, new T.MeshStandardMaterial({ color: tl.color, roughness: 0.55 }), w / 2, 0.56, 0.075, g);
          box(0.24, 0.16, 0.012, metal, w / 2, 1.04, 0.156, g);
          const bowl = new T.Mesh(new T.SphereGeometry(1, 40, 20), ceramic);
          bowl.scale.set(0.18, 0.15, (d - 0.15) / 2);
          bowl.position.set(w / 2, 0.3, 0.15 + (d - 0.15) / 2);
          bowl.castShadow = true;
          g.add(bowl);
          const lid = new T.Mesh(new T.CylinderGeometry(1, 1, 0.025, 40), ceramic);
          lid.scale.set(0.18, 1, (d - 0.15) / 2);
          lid.position.set(w / 2, 0.43, 0.15 + (d - 0.15) / 2);
          g.add(lid);
        } else if (f.type === 'sink') {
          const vm = VAN[B.fix.van];
          let vmat;
          if (vm.wood) {
            const cv = document.createElement('canvas');
            cv.width = 512;
            cv.height = 256;
            const c2 = cv.getContext('2d');
            fillTile(c2, 0, 0, 512, 256, { look: 'wood', color: vm.color }, rng(5), 6);
            vmat = new T.MeshStandardMaterial({ map: tex(cv), roughness: 0.55 });
          } else vmat = new T.MeshStandardMaterial({ color: vm.color, roughness: 0.5 });
          box(w, 0.45, d - 0.02, vmat, w / 2, 0.375 + 0.225, (d - 0.02) / 2, g);
          box(w, 0.03, d, ceramic, w / 2, 0.865, d / 2, g);
          const dbl = B.items.sink === 'double';
          (dbl ? [w * 0.27, w * 0.73] : [w / 2]).forEach((x) => {
            const bas = new T.Mesh(new T.CylinderGeometry(1, 1, 0.012, 40), new T.MeshStandardMaterial({ color: '#e7ebee', roughness: 0.2 }));
            bas.scale.set(Math.min(0.2, w / (dbl ? 5 : 3)), 1, 0.15);
            bas.position.set(x, 0.876, d / 2 + 0.03);
            g.add(bas);
            box(0.03, 0.2, 0.03, metal, x, 0.98, 0.06, g);
            box(0.025, 0.025, 0.14, metal, x, 1.07, 0.12, g);
          });
          const mw = Math.min(w, 1.0);
          const mirror = new T.Mesh(new T.BoxGeometry(mw, 0.8, 0.02), new T.MeshStandardMaterial({ color: '#dfe7ea', metalness: 0.92, roughness: 0.04, envMapIntensity: 1.2 }));
          mirror.position.set(w / 2, 1.5, 0.03);
          g.add(mirror);
          const glow = new T.Mesh(new T.PlaneGeometry(mw + 0.06, 0.86), new T.MeshBasicMaterial({ color: '#ffdca8', transparent: true, opacity: 0.55 }));
          glow.position.set(w / 2, 1.5, 0.018);
          g.add(glow);
        } else if (f.type === 'washer') {
          box(0.6, 0.85, 0.58, new T.MeshStandardMaterial({ color: '#f4f4f2', roughness: 0.35 }), w / 2, 0.425, 0.29, g);
          const door = new T.Mesh(new T.TorusGeometry(0.17, 0.025, 12, 40), new T.MeshStandardMaterial({ color: '#c7ccd1', metalness: 0.8, roughness: 0.3 }));
          door.position.set(w / 2, 0.45, 0.585);
          g.add(door);
          const dg = new T.Mesh(new T.CircleGeometry(0.16, 40), new T.MeshStandardMaterial({ color: '#2b3036', roughness: 0.1, metalness: 0.2 }));
          dg.position.set(w / 2, 0.45, 0.582);
          g.add(dg);
        } else if (f.type === 'radiator') {
          box(0.025, 0.8, 0.025, metal, 0.03, 1.3, 0.06, g);
          box(0.025, 0.8, 0.025, metal, w - 0.03, 1.3, 0.06, g);
          for (let i = 0; i < 9; i++) box(w - 0.06, 0.016, 0.016, metal, w / 2, 0.94 + i * 0.085, 0.06, g);
        }
        g.userData.wall = f.wall;
        this.fxg.push(g);
        G.add(g);
      }
      this.scene.add(G);
      this.sun.position.set(m(L) * 0.2, m(H) * 2, m(W) * 1.6);
      this.sun.target.position.set(m(L / 2), 0, m(W / 2));
      this.scene.add(this.sun.target);
      if (this.first) this.home();
      this.render();
    }
    home() {
      const { L, W, H } = B.room;
      // гледаме откъм стената с най-малко уреди (обикновено тази с вратата)
      const cnt = (k) => B.fx.filter((f) => f.wall === k && f.type !== 'radiator').length * 3 + (wlen(k) < Math.max(L, W) - 1 ? 4 : 0) + (k === B.door.wall ? 0 : 1);
      const k = WALLS.reduce((a, b) => (cnt(b) < cnt(a) ? b : a), 'S');
      const mid = wpt(k, wlen(k) / 2),
        n = NRM[k];
      const back = 170 + Math.max(L, W) * 0.4;
      const side = wpt(k, wlen(k) * 0.6);
      this.camera.position.set((side[0] - n[0] * back) / 100, (H * 0.95) / 100, (side[1] - n[1] * back) / 100);
      this.controls.target.set((mid[0] + n[0] * 60 + (L / 2 - mid[0]) * 0.3) / 100, 1.0, (mid[1] + n[1] * 60 + (W / 2 - mid[1]) * 0.3) / 100);
      this.controls.update();
      this.first = false;
    }
    render() {
      if (!this.walls) return;
      const c = this.camera.position;
      const hidden = new Set();
      this.walls.forEach((w, i) => {
        const v = c.clone().sub(w.position);
        w.visible = v.dot(w.userData.n) > 0;
        if (!w.visible) hidden.add(WALLS[i]);
      });
      (this.fxg || []).forEach((g) => (g.visible = !hidden.has(g.userData.wall)));
      if (this.ceil) this.ceil.visible = c.y < B.room.H / 100;
      this.renderer.render(this.scene, this.camera);
    }
    shot(wd = 1536, ht = 1024) {
      const r = this.renderer;
      const size = r.getSize(new window.THREE.Vector2());
      const pr = r.getPixelRatio();
      r.setPixelRatio(1);
      r.setSize(wd, ht, false);
      this.camera.aspect = wd / ht;
      this.camera.updateProjectionMatrix();
      this.render();
      const url = r.domElement.toDataURL('image/jpeg', 0.9);
      r.setPixelRatio(pr);
      r.setSize(size.x, size.y);
      this.camera.aspect = size.x / size.y;
      this.camera.updateProjectionMatrix();
      this.render();
      return url;
    }
  }

  /* ================= Интерфейс ================= */
  const swatchCache = {};
  function swatch(key, pat) {
    const id = key + pat;
    if (swatchCache[id]) return swatchCache[id];
    const t = tile(key);
    const span = Math.max(80, Math.min(260, t.size[0] * 2.2));
    const ppc = 260 / span;
    const cv = document.createElement('canvas');
    cv.width = 260;
    cv.height = 195;
    drawTiling(cv.getContext('2d'), span, span * 0.75, ppc, t, pat || 'straight', { grout: '#cfcdc8', joint: 2, seed: 9, centerY: true });
    return (swatchCache[id] = cv.toDataURL('image/jpeg', 0.85));
  }
  function styleThumb(st) {
    const cv = document.createElement('canvas');
    cv.width = 240;
    cv.height = 170;
    const c = cv.getContext('2d');
    drawTiling(c, 120, 85, 2, tile(st.wall[0]), st.wall[1], { grout: st.grout, joint: 2, seed: 2 });
    if (st.accent) {
      c.save();
      c.beginPath();
      c.rect(150, 0, 90, 170);
      c.clip();
      drawTiling(c, 120, 85, 2, tile(st.accent[0]), st.accent[1], { grout: st.grout, joint: 2, seed: 4 });
      c.restore();
    }
    c.save();
    c.beginPath();
    c.rect(0, 120, 240, 50);
    c.clip();
    drawTiling(c, 120, 85, 2, tile(st.floor[0]), st.floor[1], { grout: st.grout, joint: 2, seed: 6, centerY: true });
    c.restore();
    c.fillStyle = VAN[st.van].color;
    c.fillRect(20, 70, 90, 28);
    c.fillStyle = '#fafafa';
    c.fillRect(20, 66, 90, 5);
    c.fillStyle = FIN[st.fin].color;
    c.fillRect(62, 50, 5, 16);
    c.fillRect(62, 50, 14, 4);
    c.fillStyle = 'rgba(255,220,170,.5)';
    c.fillRect(36, 8, 58, 38);
    c.fillStyle = '#e8edf0';
    c.fillRect(39, 11, 52, 32);
    return cv.toDataURL('image/jpeg', 0.85);
  }
  function renderStyles() {
    $('#baStyles').innerHTML = STYLES.map((st, i) => `<button class="card stylec" data-i="${i}" aria-pressed="${B.style === i}"><span class="simg"><img alt="" src="${styleThumb(st)}"></span><span class="smeta"><b>${esc(st.name)}</b><span class="small muted">${esc(st.sub)}</span></span></button>`).join('');
  }
  function applyStyle(i) {
    const st = STYLES[i];
    B.style = i;
    B.tiles.floor = { key: st.floor[0], pat: st.floor[1] };
    B.tiles.wall = { key: st.wall[0], pat: st.wall[1] };
    B.tiles.accent = st.accent ? { key: st.accent[0], pat: st.accent[1] } : { key: null, pat: 'straight' };
    B.tiles.acc = st.acc;
    B.tiles.ht = st.ht;
    B.tiles.grout = st.grout;
    B.fix.fin = st.fin;
    B.fix.van = st.van;
  }
  function renderTileOpts() {
    const T = B.tiles,
      s = PH.surf;
    const sel = T[s];
    $$('#baSurf button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === s));
    const list = TILES.filter((t) => s === 'floor' ? t.use === 'fw' : true);
    let html = s === 'accent' ? `<button class="btile none" data-k="" aria-pressed="${!T.accent.key}"><span class="noimg">Без акцент</span><span class="m"><b>Без акцент</b><span class="muted">една плочка за стените</span></span></button>` : '';
    html += list
      .map(
        (t) =>
          `<button class="btile" data-k="${t.key}" aria-pressed="${sel.key === t.key}"><img alt="" src="${swatch(t.key, s === 'floor' ? 'straight' : 'straight')}"><span class="m"><b>${esc(t.name)}</b><span class="muted">${esc(t.type)} · ${t.size[1]}×${t.size[0]} см · ${esc(t.finish)}</span><span class="mono">${M.fmt(t.price, 0)} €/м²</span></span></button>`
      )
      .join('');
    $('#baTiles').innerHTML = html;
    const tl = sel.key ? tile(sel.key) : null;
    $('#baPat').innerHTML = PATS.map(([k, n]) => `<button data-p="${k}" aria-pressed="${sel.pat === k}" ${tl && (tl.look === 'hex' || (k === 'herringbone' && !herringOK(tl))) ? 'disabled' : ''}>${n}</button>`).join('');
    $('#baPatRow').hidden = !tl || tl.look === 'hex';
    $('#baAccRow').hidden = s !== 'accent' || !T.accent.key;
    $('#baAcc').innerHTML = [['wet', 'Душ / вана'], ...WALLS.map((k) => [k, WNAME[k]])].map(([k, n]) => `<button data-a="${k}" aria-pressed="${T.acc === k}">${n}</button>`).join('');
    $('#baHt').innerHTML = [['full', 'До тавана'], ['210', 'До 210 см'], ['120', 'До 120 см']].map(([k, n]) => `<button data-h="${k}" aria-pressed="${T.ht === k}">${n}</button>`).join('');
    $('#baGrout').innerHTML = GROUTS.map(([c, n]) => `<button class="gdot" data-g="${c}" aria-pressed="${T.grout === c}" title="${n}" style="--c:${c}"><span></span>${n}</button>`).join('');
    $('#baJoint').innerHTML = [1.5, 2, 3].map((j) => `<button data-j="${j}" aria-pressed="${T.joint === j}">${M.fmt(j, j % 1 ? 1 : 0)} мм</button>`).join('');
  }
  function renderFixOpts() {
    $('#baTier').innerHTML = TIERS.map(([k, n]) => `<button data-t="${k}" aria-pressed="${B.fix.tier === k}">${n}</button>`).join('');
    $('#baFin').innerHTML = Object.entries(FIN).map(([k, f]) => `<button class="gdot" data-f="${k}" aria-pressed="${B.fix.fin === k}" style="--c:${f.color}"><span></span>${f.name}</button>`).join('');
    $('#baVan').innerHTML = Object.entries(VAN).map(([k, v]) => `<button class="gdot" data-v="${k}" aria-pressed="${B.fix.van === k}" style="--c:${v.color}"><span></span>${v.name}</button>`).join('');
  }
  function renderBom() {
    const b = (PH.bom = bom());
    $('#baKpi').innerHTML = `<div><span class="small muted">Под</span><b>${M.fmt(b.floorA, 2)} м²</b></div><div><span class="small muted">Стени</span><b>${M.fmt(b.wallA, 2)} м²</b></div><div><span class="small muted">Акцент</span><b>${M.fmt(b.accA, 2)} м²</b></div><div><span class="small muted">Общо${B.labor ? ' с труд' : ''}</span><b>${M.eur(b.tot.all)}</b></div>`;
    const secs = ['Плочки', 'Материали', 'Санитария', 'Труд'];
    let html = '<thead><tr><th>Позиция</th><th class="num">Кол.</th><th class="num">Ед. цена</th><th class="num">Сума</th><th>Къде го има</th></tr></thead><tbody>';
    for (const s of secs) {
      const rs = b.rows.filter((r) => r.sec === s);
      if (!rs.length) continue;
      const st = rs.reduce((a, r) => a + r.total, 0);
      const off = s === 'Труд' && !B.labor;
      html += `<tr class="sec${off ? ' off' : ''}"><td colspan="3"><b>${s}</b>${off ? ' <span class="small muted">(не е включен)</span>' : ''}</td><td class="num"><b>${M.fmt(st)}</b></td><td></td></tr>`;
      html += rs
        .map((r) => `<tr class="${off ? 'off' : ''}"><td class="wrap">${esc(r.name)}${r.note ? `<div class="small muted">${esc(r.note)}</div>` : ''}</td><td class="num">${M.fmt(r.qty, r.unit === 'м²' ? 2 : 0)} ${r.unit}</td><td class="num">${M.fmt(r.price)}</td><td class="num">${M.fmt(r.total)}</td><td>${r.q ? shopLinks(r.q) : ''}</td></tr>`)
        .join('');
    }
    html += `</tbody>`;
    $('#baTable').innerHTML = html;
    M.countTo($('#baTotal'), b.tot.all);
  }
  function syncForm() {
    const R = B.room;
    $('#baL').value = R.L;
    $('#baW').value = R.W;
    $('#baH').value = R.H;
    $('#baDoorWall').value = B.door.wall;
    $('#baDoorX').value = B.door.x;
    $('#baDoorW').value = B.door.w;
    $('#baWin').checked = !!B.win;
    $('#baWinF').hidden = !B.win;
    if (B.win) {
      $('#baWinWall').value = B.win.wall;
      $('#baWinX').value = B.win.x;
      $('#baWinW').value = B.win.w;
      $('#baWinS').value = B.win.sill;
      $('#baWinH').value = B.win.h;
    }
    $('#baStackWall').value = B.stack.wall;
    $('#baStackX').value = B.stack.x;
    $$('#baWet button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === B.items.wet));
    $$('#baSink button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.v === B.items.sink));
    ['wc', 'washer', 'radiator', 'niche'].forEach((k) => ($('#baI_' + k).checked = !!B.items[k]));
    $('#baLabor').checked = !!B.labor;
  }
  function readForm() {
    const n = (id, d, a, b) => clamp(Math.round(+$(id).value || d), a, b);
    B.room = { L: n('#baL', 250, 100, 700), W: n('#baW', 180, 90, 600), H: n('#baH', 260, 210, 400) };
    B.door = { wall: $('#baDoorWall').value, x: 0, w: n('#baDoorW', 80, 60, 120) };
    B.door.x = clamp(n('#baDoorX', 20, 0, 999), 0, wlen(B.door.wall) - B.door.w);
    B.win = $('#baWin').checked ? { wall: $('#baWinWall').value, x: 0, w: n('#baWinW', 60, 30, 300), sill: n('#baWinS', 120, 0, 250), h: n('#baWinH', 60, 30, 250) } : null;
    if (B.win) B.win.x = clamp(n('#baWinX', 60, 0, 999), 0, wlen(B.win.wall) - B.win.w);
    B.stack = { wall: $('#baStackWall').value, x: clamp(n('#baStackX', 15, 0, 999), 0, wlen($('#baStackWall').value)) };
  }

  let t3 = 0;
  function update(o = {}) {
    if (o.relayout) relayout(o.keep);
    PH.floorUrl = floorCanvas(1.2).cv.toDataURL('image/jpeg', 0.82);
    if (o.plan !== false) renderPlan();
    if (o.relayout) renderVariants();
    renderBom();
    save();
    clearTimeout(t3);
    t3 = setTimeout(() => {
      if (PH.tab === 'walls') renderWalls();
      if (PH.tab === '3d' && PH.view) PH.view.build();
      PH.dirty = { walls: PH.tab !== 'walls', d3: PH.tab !== '3d' };
    }, 60);
  }
  function setTab(t) {
    PH.tab = t;
    $$('#baTab button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.t === t));
    $('#baPlanBox').hidden = t !== 'plan';
    $('#baWalls').hidden = t !== 'walls';
    $('#ba3d').hidden = t !== '3d';
    if (t === 'walls' && (!PH.dirty || PH.dirty.walls || !$('#baWalls').children.length)) renderWalls(), PH.dirty && (PH.dirty.walls = false);
    if (t === '3d') {
      if (!PH.view && window.THREE) PH.view = new BathView($('#ba3d'));
      if (PH.view) {
        PH.view.resize();
        if (!PH.view.walls || !PH.dirty || PH.dirty.d3) PH.view.build(), PH.dirty && (PH.dirty.d3 = false);
      }
    }
  }

  /* ================= AI ================= */
  function roomPrompt(notes) {
    return `The image shows a BATHROOM: either under construction (bare plaster, brick, screed, pipes sticking out) or an old bathroom to be renovated. Estimate the room so we can plan tiles and fixtures.

Conventions:
- The camera looks at the BACK wall "N". The wall on the LEFT of the photo is "W", on the RIGHT is "E". "S" is the wall behind the camera (usually where the door is).
- Positions along a wall are in cm from that wall's left end when standing inside the room and facing that wall: N from its left (W) corner, E from its N corner, S from its E corner, W from its S corner (nearest the camera).
- "length" is the N/S wall length, "width" is the E/W wall length, "height" floor to ceiling.
- Use references: door 80 × 205 cm, brick 25 × 6.5 cm, concealed toilet frame 50 cm wide, toilet waste pipe Ø110, sink outlet about 55 cm high, standard ceiling 255–270 cm, typical bathroom 150–300 cm.
- pipes: visible or clearly implied outlets: "wc" (toilet waste or frame), "water" (water outlets in the wall), "drain" (floor drain or Ø50 waste), "stack" (vertical sewer riser).
- If the door is not visible, assume wall "S", x = 20.

Client notes (Bulgarian, may be empty): ${notes || '-'}

Reply with ONLY this JSON:
{"length":250,"width":180,"height":260,"door":{"wall":"S","x":20,"w":80},"window":null,"pipes":[{"wall":"N","x":40,"kind":"stack"},{"wall":"W","x":120,"kind":"water"}],"stage":"мазилка","confidence":"medium","notes":"кратко на български какво е прието"}
"window" when present: {"wall":"E","x":60,"w":60,"sill":130,"h":60}.`;
  }
  function stylePrompt() {
    return `The image shows a bathroom the client LIKES (inspiration). Describe its finishes so we can recreate it. Use only the allowed values.
look: "concrete" | "marble" | "travertine" | "wood" | "terrazzo" | "stone" (dark or sandy stone) | "solid" (plain colour tile) | "relief" (3D textured white) | "subway" (small glossy rectangular) | "zellige" (handmade glossy uneven) | "hex" (hexagon mosaic)
size: "xl" (large slabs 120×280) | "large" (60×120) | "medium" (60×60 or 30×60/30×90) | "small" (7.5×15 to 20×20) | "plank" (wood planks)
pattern: "straight" | "brick" | "vertical" | "herringbone"
Reply with ONLY this JSON:
{"style_name":"кратко име","summary":"едно изречение на български","floor":{"look":"concrete","color":"#a19e98","size":"large","pattern":"straight"},"wall":{"look":"solid","color":"#efeeea","size":"medium","pattern":"vertical"},"accent":{"look":"zellige","color":"#6f8a78","size":"small","pattern":"vertical","where":"wet"},"tile_height":"full","grout":"light","metal":"black","vanity":"oak","wet":"shower"}
accent.where: "wet" (shower or bath walls) | "none". tile_height: "full" | "210" | "120". grout: "light" | "grey" | "beige" | "dark". metal: "chrome" | "black" | "brushed" | "gold". vanity: "oak" | "walnut" | "white" | "graphite". wet: "shower" | "bath".`;
  }
  const SZ = { xl: 280, large: 120, medium: 60, small: 15, plank: 120 };
  function nearestTile(z, wallOnly) {
    if (!z || !z.look) return null;
    const c = /^#[0-9a-f]{6}$/i.test(String(z.color)) ? h2r(z.color) : null;
    let best = null,
      bs = 1e9;
    for (const t of TILES) {
      if (!wallOnly && t.use !== 'fw') continue;
      let s = t.look === z.look ? 0 : 160;
      if (c) {
        const d = h2r(t.color);
        s += Math.hypot(c[0] - d[0], c[1] - d[1], c[2] - d[2]);
      }
      s += Math.abs(Math.log((SZ[z.size] || 60) / t.size[0])) * 25;
      if (s < bs) (bs = s), (best = t);
    }
    return best;
  }
  function applyAIStyle(st) {
    const f = nearestTile(st.floor, false),
      w = nearestTile(st.wall, true),
      a = st.accent && st.accent.where !== 'none' ? nearestTile(st.accent, true) : null;
    const pat = (p) => (PATS.some((x) => x[0] === p) ? p : 'straight');
    if (f) B.tiles.floor = { key: f.key, pat: pat(st.floor.pattern) };
    if (w) B.tiles.wall = { key: w.key, pat: pat(st.wall.pattern) };
    B.tiles.accent = a && (!w || a.key !== w.key) ? { key: a.key, pat: pat(st.accent.pattern) } : { key: null, pat: 'straight' };
    B.tiles.acc = B.tiles.accent.key ? 'wet' : 'none';
    if (['full', '210', '120'].includes(String(st.tile_height))) B.tiles.ht = String(st.tile_height);
    B.tiles.grout = { light: '#f2f1ed', grey: '#c8c6c1', beige: '#cbbca3', dark: '#55555a' }[st.grout] || B.tiles.grout;
    if (FIN[st.metal]) B.fix.fin = st.metal;
    if (VAN[st.vanity]) B.fix.van = st.vanity;
    if (st.wet === 'bath' || st.wet === 'shower') B.items.wet = st.wet;
    B.style = -1;
  }
  function applyAIRoom(r) {
    const n = (v, d, a, b) => clamp(Math.round(+v || d), a, b);
    B.room = { L: n(r.length, 250, 100, 700), W: n(r.width, 180, 90, 600), H: n(r.height, 260, 210, 400) };
    const dw = WALLS.includes(r.door && r.door.wall) ? r.door.wall : 'S';
    const dW = n(r.door && r.door.w, 80, 60, 110);
    B.door = { wall: dw, w: dW, x: clamp(n(r.door && r.door.x, 20, 0, 999), 0, wlen(dw) - dW) };
    const w = r.window;
    if (w && WALLS.includes(w.wall)) {
      const ww = n(w.w, 60, 30, 300);
      B.win = { wall: w.wall, w: ww, x: clamp(n(w.x, 60, 0, 999), 0, wlen(w.wall) - ww), sill: n(w.sill, 120, 0, 250), h: n(w.h, 60, 30, 250) };
    } else B.win = null;
    B.hints = (Array.isArray(r.pipes) ? r.pipes : []).filter((p) => p && WALLS.includes(p.wall)).map((p) => ({ wall: p.wall, x: clamp(+p.x || 0, 0, wlen(p.wall)), kind: String(p.kind) }));
    const st = B.hints.find((p) => p.kind === 'stack') || B.hints.find((p) => p.kind === 'wc') || B.hints.find((p) => p.kind === 'drain');
    if (st) B.stack = { wall: st.wall, x: Math.round(st.x) };
  }
  async function runAI() {
    const st = $('#baStatus');
    if (!PH.photo && !PH.insp) return (st.textContent = 'Качи снимка на банята си или на баня, която харесваш.');
    const mode = await M.aiMode();
    if (!mode) return (st.textContent = M.aiError({ code: 'unavailable' }));
    const btn = $('#baRun');
    btn.disabled = true;
    st.innerHTML = `<span class="spinner"></span> AI разглежда ${PH.photo && PH.insp ? 'снимките' : 'снимката'}…`;
    try {
      const jobs = [PH.photo ? M.aiJSON('bath', roomPrompt($('#baNotes').value.trim()), PH.photo) : null, PH.insp ? M.aiJSON('bathstyle', stylePrompt(), PH.insp) : null];
      const [room, style] = await Promise.all(jobs);
      const said = [];
      if (room) {
        applyAIRoom(room);
        said.push(`Банята е около ${B.room.L} × ${B.room.W} см, височина ${B.room.H} см.${room.notes ? ' ' + room.notes : ''}`);
      }
      if (style) {
        applyAIStyle(style);
        said.push(`Стил: ${style.style_name || 'по снимката'}. ${style.summary || ''}`);
      }
      syncForm();
      renderTileOpts();
      renderFixOpts();
      renderStyles();
      update({ relayout: true });
      st.innerHTML = `<span class="pill ok">готово</span> ${esc(said.join(' '))} <span class="muted">Провери размерите с рулетка и ги поправи при нужда.</span>`;
    } catch (e) {
      st.textContent = M.aiError(e);
    }
    btn.disabled = false;
  }

  /* ---------- Реалистичен рендер ---------- */
  const tileEN = (sel, where) => {
    const t = tile(sel.key);
    const L = {
      concrete: 'grey concrete-look porcelain tiles',
      marble: 'white marble-look porcelain with soft grey veins',
      travertine: 'warm beige travertine-look porcelain',
      wood: 'natural oak wood-look porcelain planks',
      terrazzo: 'light terrazzo tiles with small stone chips',
      stone: 'stone-look porcelain',
      solid: 'plain tiles',
      relief: 'white 3D wave-relief wall tiles',
      subway: 'white glossy bevelled subway tiles',
      zellige: 'handmade glossy zellige tiles with uneven colour',
      hex: 'small hexagon mosaic',
    }[t.look];
    const P = { straight: 'laid straight', brick: 'in a brick bond', vertical: 'stacked vertically', herringbone: 'in a herringbone pattern', hex: '' }[patOf(t, sel.pat)];
    return `${L}, colour ${t.color}, ${t.size[1]}×${t.size[0]} cm, ${/гланц|полиран/.test(t.finish) ? 'glossy' : 'matt'}, ${P}${where ? ', ' + where : ''}`;
  };
  function finishesEN() {
    const T = B.tiles,
      F = FIN[B.fix.fin],
      V = VAN[B.fix.van];
    const grout = GROUTS.find((g) => g[0] === T.grout)?.[0] || '#ccc';
    const lines = [
      `- Floor: ${tileEN(T.floor)}; grout ${grout}.`,
      `- Walls: ${tileEN(T.wall)}, tiled ${T.ht === 'full' ? 'all the way to the ceiling' : 'up to ' + T.ht + ' cm, smooth warm-white paint above'}.`,
      T.accent.key ? `- Accent: ${tileEN(T.accent)} on ${T.acc === 'wet' ? 'the shower / bath walls' : WEN[T.acc]}.` : '',
      `- All taps, shower and accessories in ${F.en}.`,
      B.fx.some((f) => f.type === 'wc') ? '- Wall-hung white rimless toilet with a concealed cistern and a flush plate.' : '',
      B.fx.some((f) => f.type === 'sink') ? `- Floating vanity in ${V.en} with a white ${B.items.sink === 'double' ? 'double ' : ''}basin top, a rectangular backlit LED mirror above it.` : '',
      B.fx.some((f) => f.type === 'shower') ? `- Walk-in shower with a frameless clear glass panel (${F.en} profile), a ceiling-style rain shower head, a linear floor drain${B.items.niche ? ', and a recessed niche in the shower wall' : ''}.` : '',
      B.fx.some((f) => f.type === 'bath') ? '- Built-in white bathtub with a tiled front panel.' : '',
      B.fx.some((f) => f.type === 'washer') ? '- A white front-loading washing machine.' : '',
      B.fx.some((f) => f.type === 'radiator') ? `- A ladder towel radiator in ${F.en}.` : '',
      '- Recessed warm downlights in a white ceiling.',
    ];
    return lines.filter(Boolean).join('\n');
  }
  function layoutEN() {
    const parts = [];
    for (const k of WALLS) {
      const len = wlen(k);
      const on = B.fx
        .filter((f) => f.wall === k)
        .sort((a, b) => a.u - b.u)
        .map((f) => {
          const c = (f.u + f.w / 2) / len;
          const pos = c < 0.34 ? 'at the left' : c > 0.66 ? 'at the right' : 'in the middle';
          const nm = { bath: `a bathtub ${f.w} cm long`, shower: `a walk-in shower ${f.w}×${f.d} cm`, wc: 'the wall-hung toilet', sink: `the vanity ${f.w} cm wide`, washer: 'the washing machine', radiator: 'the towel radiator' }[f.type];
          return `${nm} ${pos}`;
        });
      if (B.door.wall === k) on.push(`the door (${B.door.w} cm) ${(B.door.x + B.door.w / 2) / len < 0.34 ? 'at the left' : (B.door.x + B.door.w / 2) / len > 0.66 ? 'at the right' : 'in the middle'}`);
      if (B.win && B.win.wall === k) on.push('the existing window');
      if (on.length) parts.push(`- On ${WEN[k]}: ${on.join(', ')}.`);
    }
    return parts.join('\n');
  }
  async function real(kind) {
    if (!M.renderAI) return;
    if (kind === 'photo') {
      if (!PH.photoUrl) return M.toast('Първо качи снимка на банята си');
      return M.renderAI({
        title: 'Готовата баня в твоята снимка',
        before: PH.photoUrl,
        labels: ['Сега', 'След ремонта'],
        images: [PH.photoUrl],
        prompt: `This photo shows a bathroom that is under construction (bare plaster, pipes) or about to be renovated. Create ONE photorealistic photograph of the SAME room from exactly the same camera position, angle and lens, fully finished as a modern bathroom designed as follows.

Room about ${B.room.L} × ${B.room.W} cm, ceiling ${B.room.H} cm.
Layout (keep these positions):
${layoutEN()}

Finishes:
${finishesEN()}

Keep the room geometry, the door and the window exactly where they are. Remove all construction mess, tools and exposed pipes. Natural light matching the photo, soft shadows, realistic reflections on glass, ceramic and metal, realistic tile joints. Photorealistic, like a real estate photo. No people, no text, no watermark.`,
        again: () => real('photo'),
      });
    }
    if (!PH.view) setTab('3d');
    if (!PH.view) return M.toast('3D изгледът не е готов');
    PH.view.build();
    const before = PH.view.shot();
    return M.renderAI({
      title: 'Фотореалистична баня',
      before,
      images: [before],
      prompt: `Transform this 3D bathroom visualization into a photorealistic interior photograph, as if taken by a professional architectural photographer for a design magazine.

Keep EXACTLY the same camera position, angle and framing, the same room size and the same positions and sizes of the shower, bathtub, toilet, vanity, washing machine and radiator. Do not add or remove fixtures.

Layout:
${layoutEN()}

Finishes:
${finishesEN()}

Lighting: soft natural daylight plus warm downlights, realistic soft shadows, reflections on glass, ceramic and metal, crisp tile joints. Replace the simplified 3D shapes with real products of the same size in the same place. Photorealistic, 24 mm lens look. No people, no text, no watermark.`,
      again: () => real('scene'),
    });
  }

  /* ---------- Експорт и запитване ---------- */
  function csv() {
    const b = PH.bom || bom();
    const lines = [['Раздел', 'Позиция', 'Бележка', 'Количество', 'Мярка', 'Ед. цена €', 'Сума €']];
    b.rows.forEach((r) => lines.push([r.sec, r.name, r.note, M.fmt(r.qty, r.unit === 'м²' ? 2 : 0), r.unit, M.fmt(r.price), M.fmt(r.total)]));
    lines.push(['', 'Общо' + (B.labor ? ' с труд' : ' без труд'), '', '', '', '', M.fmt(b.tot.all)]);
    const txt = '﻿' + lines.map((l) => l.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n');
    M.saveFile('modulia-banya-kolichestva.csv', txt, 'text/csv');
  }
  async function planPng() {
    const svg = planSVG(false).replace('style="color:var(--ink)"', 'style="color:#1d1d1f"').replace(/var\(--panel\)/g, '#ffffff');
    const img = new Image();
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    await img.decode().catch(() => {});
    const cv = document.createElement('canvas');
    cv.width = 1400;
    cv.height = Math.round((1400 * (B.room.W + 68)) / (B.room.L + 68));
    const c = cv.getContext('2d');
    c.fillStyle = '#fff';
    c.fillRect(0, 0, cv.width, cv.height);
    try {
      c.drawImage(img, 0, 0, cv.width, cv.height);
    } catch (e) {}
    return cv.toDataURL('image/jpeg', 0.9);
  }
  async function pdf() {
    if (!M.pdfFrom) return M.toast('PDF не е достъпен');
    const b = PH.bom || bom();
    if (!PH.view && window.THREE) setTab('3d');
    if (PH.view) PH.view.build();
    const shot = PH.view ? PH.view.shot(1400, 860) : '';
    const plan = await planPng();
    const walls = WALLS.map((k) => {
      const { cv } = wallCanvas(k, 2);
      drawFixturesElev(cv.getContext('2d'), k, 2);
      return `<div class="keep" style="break-inside:avoid"><h3>${WNAME[k]} · ${wlen(k)} × ${B.room.H} см</h3><img src="${cv.toDataURL('image/jpeg', 0.85)}" style="width:100%;border-radius:6px"></div>`;
    }).join('');
    const rows = b.rows
      .filter((r) => r.sec !== 'Труд' || B.labor)
      .map((r) => `<tr><td>${esc(r.sec)}</td><td>${esc(r.name)}<div style="color:#86868b;font-size:10px">${esc(r.note || '')}</div></td><td class="r">${M.fmt(r.qty, r.unit === 'м²' ? 2 : 0)} ${r.unit}</td><td class="r">${M.fmt(r.total)}</td></tr>`)
      .join('');
    const html = `<div class="paper"><div class="ph"><div><h1>Баня ${B.room.L} × ${B.room.W} см</h1><div class="meta">Модулия · ${new Date().toLocaleDateString('bg-BG')} · под ${M.fmt(b.floorA, 2)} м² · стени ${M.fmt(b.wallA + b.accA, 2)} м²</div></div><div style="text-align:right"><div class="meta">Общо${B.labor ? ' с труд' : ''}</div><h1>${M.eur(b.tot.all)}</h1></div></div>
      ${shot ? `<img class="shot" src="${shot}">` : ''}<h3>План</h3><img src="${plan}" style="width:100%;border-radius:6px">
      <div class="two" style="margin-top:12px">${walls}</div>
      <h3>Количествена сметка</h3><table><thead><tr><th>Раздел</th><th>Позиция</th><th class="r">Кол.</th><th class="r">Сума, €</th></tr></thead><tbody>${rows}</tbody></table>
      <div class="fine">Количествата са с фира според шарката. Цените са ориентировъчни, с ДДС, и зависят от магазина. Наличността проверявай по връзките в Модулия. Размерите се потвърждават с оглед на място.</div></div>`;
    M.pdfFrom(html, 'modulia-banya.pdf');
  }
  function requestModal() {
    const b = PH.bom || bom();
    const m = document.createElement('div');
    m.className = 'modal';
    m.innerHTML = `<form class="card pad stack" id="baReq"><div class="row" style="justify-content:space-between"><h2 style="font-size:22px">Запитване за банята</h2><button type="button" class="xbtn" data-x aria-label="Затвори">✕</button></div>
      <p class="small muted" style="margin:0">Майстори и фирми получават плана, плочките и количествата и ти се обаждат с оферта. Ориентировъчно: <b>${M.eur(b.tot.all)}</b>.</p>
      <div class="field"><label for="baRqN">Име</label><input id="baRqN" autocomplete="name" required></div>
      <div class="field"><label for="baRqP">Телефон</label><input id="baRqP" type="tel" autocomplete="tel" required></div>
      <div class="field"><label for="baRqC">Град</label><input id="baRqC" autocomplete="address-level2"></div>
      <div class="field"><label for="baRqT">Бележка</label><textarea id="baRqT" rows="2" placeholder="Например: искам и демонтаж на старите плочки"></textarea></div>
      <label class="check small"><input type="checkbox" id="baRqOk"> Съгласен съм данните ми да се изпратят на майстори</label>
      <div class="row"><button class="btn primary" id="baRqSend">Изпрати</button><span class="small muted" id="baRqSt"></span></div></form>`;
    document.body.append(m);
    m.addEventListener('click', (e) => (e.target === m || e.target.closest('[data-x]')) && m.remove());
    m.querySelector('form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const st = $('#baRqSt');
      const name = $('#baRqN').value.trim(),
        phone = $('#baRqP').value.trim();
      if (!name || !/^[+\d][\d\s-]{6,}$/.test(phone)) return (st.textContent = 'Напиши име и телефон.');
      if (!$('#baRqOk').checked) return (st.textContent = 'Отбележи съгласието.');
      const payload = {
        name,
        phone,
        city: $('#baRqC').value.trim().slice(0, 40),
        note: $('#baRqT').value.trim().slice(0, 600),
        total: Math.round(b.tot.all * 100) / 100,
        summary: `Баня ${B.room.L}×${B.room.W}×${B.room.H} см · ${B.fx.map((f) => FXN[f.type].toLowerCase()).join(', ')} · под ${tile(B.tiles.floor.key).name} · стени ${tile(B.tiles.wall.key).name}${B.tiles.accent.key ? ' · акцент ' + tile(B.tiles.accent.key).name : ''} · ${FIN[B.fix.fin].name}`.slice(0, 300),
        project: JSON.stringify({ kind: 'bath', bath: Object.assign({}, B, { vars: [] }), bom: b.rows.map((r) => [r.sec, r.name, r.qty, r.unit, r.total]) }),
      };
      st.innerHTML = '<span class="spinner"></span> Изпращам…';
      let sent = false;
      if (M.platform && M.platform.sendRequest)
        try {
          await M.platform.sendRequest(payload);
          sent = true;
        } catch (err) {}
      if (!sent) {
        const list = M.store.get('localRequests', []);
        list.unshift(Object.assign({ id: M.uid('r'), status: 'нова', createdAt: new Date().toISOString() }, payload));
        M.store.set('localRequests', list.slice(0, 30));
      }
      m.querySelector('form').innerHTML = `<h2 style="font-size:22px">Изпратено</h2><p class="muted" style="margin:0">${sent ? 'Майсторите ще ти се обадят на ' + esc(phone) + '.' : 'Запазихме запитването на това устройство. Изпрати го отново, когато има връзка със сървъра.'}</p><button type="button" class="btn primary" data-x>Добре</button>`;
    });
  }

  /* ---------- Снимки ---------- */
  async function takePhoto(input, which) {
    const f = input.files && input.files[0];
    if (!f) return;
    const blob = await M.shrinkImage(f);
    const url = await new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.readAsDataURL(blob);
    });
    PH[which] = blob;
    PH[which + 'Url'] = url;
    const img = $(which === 'photo' ? '#baPhotoImg' : '#baInspImg');
    img.src = url;
    img.hidden = false;
    $(which === 'photo' ? '#baPhotoTxt' : '#baInspTxt').hidden = true;
    $('#baRealPhoto').hidden = !PH.photoUrl;
  }

  /* ================= Старт ================= */
  function init() {
    if (PH.ready) return;
    PH.ready = true;
    const opts = WALLS.map((k) => `<option value="${k}">${WNAME[k]}</option>`).join('');
    ['#baDoorWall', '#baWinWall', '#baStackWall'].forEach((s) => ($(s).innerHTML = opts));
    syncForm();
    renderStyles();
    renderTileOpts();
    renderFixOpts();
    if (!B.fx.length) relayout();
    else B.vars = B.vars && B.vars.length ? B.vars : [{ fx: B.fx.map((f) => Object.assign({}, f)), skip: [] }];
    if (!B.vars.length) relayout();
    update({});
    renderVariants();
    bindPlanDrag();

    const view = $('#view-bath');
    view.addEventListener('change', (e) => {
      const id = e.target.id;
      if (id === 'baPhoto') return takePhoto(e.target, 'photo');
      if (id === 'baInsp') return takePhoto(e.target, 'insp');
      if (id === 'baLabor') return (B.labor = e.target.checked), renderBom(), save();
      if (/^baI_/.test(id)) {
        B.items[id.slice(4)] = e.target.checked;
        return update({ relayout: true });
      }
      if (id === 'baWin' && e.target.checked && !B.win) $('#baWinF').hidden = false;
      if (/^ba(L|W|H|Door|Win|Stack)/.test(id)) {
        readForm();
        syncForm();
        update({ relayout: true });
      }
    });
    view.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const par = b.parentElement && b.parentElement.id;
      if (b.closest('#baWet')) return (B.items.wet = b.dataset.v), syncForm(), update({ relayout: true });
      if (b.closest('#baSink')) return (B.items.sink = b.dataset.v), syncForm(), update({ relayout: true });
      if (b.closest('#baTab')) return setTab(b.dataset.t);
      if (b.closest('#baVariants')) {
        B.vi = +b.closest('.bavar').dataset.i;
        B.fx = B.vars[B.vi].fx.map((f) => Object.assign({}, f));
        renderVariants();
        return update({});
      }
      if (b.closest('#baStyles')) {
        applyStyle(+b.closest('.stylec').dataset.i);
        renderStyles();
        renderTileOpts();
        renderFixOpts();
        syncForm();
        return update({ relayout: STYLES[B.style].wet !== B.items.wet ? ((B.items.wet = STYLES[B.style].wet), syncForm(), true) : false });
      }
      if (b.closest('#baSurf')) return (PH.surf = b.dataset.s), renderTileOpts();
      if (b.closest('#baTiles')) {
        const k = b.dataset.k;
        const sel = B.tiles[PH.surf];
        sel.key = k || null;
        if (k && patOf(tile(k), sel.pat) !== sel.pat) sel.pat = 'straight';
        if (PH.surf === 'accent' && k && B.tiles.acc === 'none') B.tiles.acc = 'wet';
        B.style = -1;
        renderStyles();
        renderTileOpts();
        return update({});
      }
      if (par === 'baPat') return (B.tiles[PH.surf].pat = b.dataset.p), renderTileOpts(), update({});
      if (par === 'baAcc') return (B.tiles.acc = b.dataset.a), renderTileOpts(), update({});
      if (par === 'baHt') return (B.tiles.ht = b.dataset.h), renderTileOpts(), update({});
      if (b.closest('#baGrout')) return (B.tiles.grout = b.closest('[data-g]').dataset.g), renderTileOpts(), update({});
      if (par === 'baJoint') return (B.tiles.joint = +b.dataset.j), renderTileOpts(), update({});
      if (par === 'baTier') return (B.fix.tier = b.dataset.t), renderFixOpts(), update({});
      if (b.closest('#baFin')) return (B.fix.fin = b.closest('[data-f]').dataset.f), renderFixOpts(), update({});
      if (b.closest('#baVan')) return (B.fix.van = b.closest('[data-v]').dataset.v), renderFixOpts(), update({});
      if (b.id === 'baRun') return runAI();
      if (b.id === 'baDemo') {
        B = Object.assign(DEF(), { vars: [] });
        applyStyle(0);
        syncForm();
        renderStyles();
        renderTileOpts();
        renderFixOpts();
        update({ relayout: true });
        $('#baStatus').innerHTML = '<span class="pill blue">пример</span> Баня 250 × 180 см с walk-in душ. Плъзгай уредите в плана, сменяй плочките и виж сметката.';
        return;
      }
      if (b.id === 'baRelayout') return update({ relayout: true });
      if (b.id === 'baReal') return real('scene');
      if (b.id === 'baRealPhoto') return real('photo');
      if (b.id === 'baCsv') return csv();
      if (b.id === 'baPdf') return pdf();
      if (b.id === 'baReq') return requestModal();
      if (b.id === 'baHome3d' && PH.view) return PH.view.home(), PH.view.render();
    });
  }
  M.bath = { state: () => B, bom, solve, checks, view: () => PH.view };
  M.on('view', (v) => {
    if (v !== 'bath') return;
    init();
    if (PH.tab === '3d' && PH.view) PH.view.resize();
  });
})();
