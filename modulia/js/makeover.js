/* Модулия · Преобрази: снимки на кухнята на клиента → реалистично преобразяване с готов проект,
   снимка за вдъхновение или собствени настройки. Един и същ дизайн за всички ъгли, корекции и версии. */
(function () {
  const M = window.M;
  const { $, $$, esc } = M;

  /* ---------- Избор ---------- */
  const COLORS = [
    { k: 'walnut', n: 'Орех', c: '#7a5a43', wood: 'walnut', en: 'natural walnut wood veneer with vertical grain' },
    { k: 'oak', n: 'Дъб', c: '#b98a5c', wood: 'oak', en: 'natural oak wood veneer' },
    { k: 'lightoak', n: 'Светъл дъб', c: '#d3b489', wood: 'light_oak', en: 'light blond oak wood veneer' },
    { k: 'white', n: 'Бяло', c: '#f1f0ec', en: 'warm white' },
    { k: 'cashmere', n: 'Кашмир', c: '#d8cfc0', en: 'warm cashmere beige' },
    { k: 'greige', n: 'Грейж', c: '#b9b0a3', en: 'greige (warm grey beige)' },
    { k: 'sage', n: 'Шалфей', c: '#8f9a80', en: 'sage green' },
    { k: 'olive', n: 'Маслина', c: '#6b6f4e', en: 'deep olive green' },
    { k: 'terracotta', n: 'Глина', c: '#b7795c', en: 'terracotta clay' },
    { k: 'navy', n: 'Тъмносиньо', c: '#2f3b52', en: 'deep navy blue' },
    { k: 'graphite', n: 'Графит', c: '#46494e', en: 'graphite grey' },
    { k: 'black', n: 'Черно', c: '#232326', en: 'soft black' },
  ];
  const FRONTS = [
    ['flat', 'Гладки', 'flat slab fronts with a matt finish'],
    ['fluted', 'Рифелени', 'fronts with fine vertical fluted (ribbed) relief'],
    ['shaker', 'Шейкър', 'shaker frame and panel fronts'],
    ['gloss', 'Гланц', 'flat high gloss lacquered fronts'],
  ];
  const TOPS = [
    ['ceramic', 'Бяла керамика', 'a thin 12 mm white ceramic worktop with soft grey veins', 'wt-ceramic'],
    ['marble', 'Мрамор', 'a white Calacatta marble look worktop', 'wt-marble'],
    ['oak', 'Дъб', 'a solid natural oak worktop', 'wt-oak'],
    ['travertine', 'Травертин', 'a warm beige travertine stone worktop', 'wt-concrete'],
    ['concrete', 'Бетон', 'a grey concrete look worktop', 'wt-concrete'],
    ['black', 'Черен', 'a thin matt black compact worktop', 'wt-compact'],
  ];
  const HANDLES = [
    ['none', 'Без дръжки', 'handleless fronts with a slim recessed channel', 'gola'],
    ['black', 'Черни', 'long slim matt black bar handles', 'long'],
    ['brass', 'Месинг', 'brushed brass bar handles', 'bar'],
    ['steel', 'Инокс', 'brushed stainless steel bar handles', 'bar'],
    ['knob', 'Кнобове', 'small round knobs in the same metal as the tap', 'knob'],
  ];
  const SPLASH = [
    ['same', 'Като плота', 'the same material as the worktop as one continuous slab', 'slab'],
    ['subway', 'Метро плочки', 'white glossy subway tiles', 'subway'],
    ['zellige', 'Зелиж', 'handmade glossy zellige tiles in a soft tone matching the fronts', 'subway'],
    ['marble', 'Мрамор', 'a white marble slab', 'marble'],
  ];
  const UPPERS = [
    ['keep', 'Както сега', 'upper cabinets in the same position and size as now', 'standard'],
    ['ceiling', 'До тавана', 'upper cabinets that reach all the way to the ceiling', 'ceiling'],
    ['shelves', 'Отворени рафтове', 'no upper cabinets, two floating wooden shelves instead', 'none'],
    ['none', 'Без горни', 'no upper cabinets, a clean wall with the backsplash', 'none'],
  ];
  const METALS = [
    ['black', 'Черно', 'matt black'],
    ['brass', 'Месинг', 'brushed brass'],
    ['steel', 'Инокс', 'brushed stainless steel'],
    ['chrome', 'Хром', 'polished chrome'],
  ];
  // Готови проекти (снимките са в img/st-*.jpg)
  const PRESETS = [
    { k: 'walnut', n: 'Орех и кашмир', s: 'топъл минимализъм', low: 'walnut', up: 'cashmere', front: 'flat', top: 'ceramic', handle: 'none', splash: 'same', uppers: 'ceiling', metal: 'black' },
    { k: 'fluted', n: 'Рифелен дъб', s: 'травертин и месинг', low: 'oak', up: 'oak', front: 'fluted', top: 'travertine', handle: 'knob', splash: 'same', uppers: 'keep', metal: 'brass' },
    { k: 'sage', n: 'Шалфей и дъб', s: 'шейкър с месинг', low: 'sage', up: 'sage', front: 'shaker', top: 'oak', handle: 'brass', splash: 'zellige', uppers: 'shelves', metal: 'brass' },
    { k: 'japandi', n: 'Джапанди', s: 'светъл дъб и грейж', low: 'lightoak', up: 'greige', front: 'flat', top: 'concrete', handle: 'black', splash: 'same', uppers: 'keep', metal: 'black' },
    { k: 'graphite', n: 'Графит и мрамор', s: 'без дръжки', low: 'graphite', up: 'graphite', front: 'flat', top: 'marble', handle: 'none', splash: 'marble', uppers: 'keep', metal: 'black' },
    { k: 'white', n: 'Скандинавско бяло', s: 'бяло и дъб', low: 'white', up: 'white', front: 'flat', top: 'oak', handle: 'none', splash: 'subway', uppers: 'keep', metal: 'chrome' },
    { k: 'terracotta', n: 'Глина', s: 'топъл средиземноморски', low: 'terracotta', up: 'terracotta', front: 'flat', top: 'ceramic', handle: 'none', splash: 'same', uppers: 'shelves', metal: 'brass' },
    { k: 'navy', n: 'Тъмносиньо и месинг', s: 'модерна класика', low: 'navy', up: 'navy', front: 'shaker', top: 'marble', handle: 'brass', splash: 'subway', uppers: 'keep', metal: 'brass' },
  ];
  const QUICK = ['Горните шкафове по-светли', 'Махни дръжките', 'Добави LED под горните шкафове', 'Направи плота по-тъмен', 'Добави висока колона за хладилник', 'Повече растения и декор'];

  const MO = Object.assign({ src: 'preset', preset: 'walnut', keep: true, tidy: true }, M.store.get('makeover', {}) || {});
  if (!MO.spec) MO.spec = specOf(PRESETS[0]);
  const PH = { photos: [], insp: null, inspUrl: null, results: [], busy: false, ready: false };
  const save = () => M.store.set('makeover', { src: MO.src, preset: MO.preset, keep: MO.keep, tidy: MO.tidy, spec: MO.spec });

  function specOf(p) {
    return { low: p.low, up: p.up, front: p.front, top: p.top, handle: p.handle, splash: p.splash, uppers: p.uppers, metal: p.metal };
  }
  const col = (k) => COLORS.find((c) => c.k === k) || (/^#[0-9a-f]{6}$/i.test(k) ? { k, n: k, c: k, en: 'colour ' + k } : COLORS[0]);
  const pick = (list, k) => list.find((x) => x[0] === k) || list[0];

  /* ---------- Промптове ---------- */
  function designEN() {
    const s = MO.spec;
    const lo = col(s.low),
      up = col(s.up);
    const fr = pick(FRONTS, s.front)[2];
    const look = (c) => (c.wood ? `${c.en}` : `${s.front === 'gloss' ? 'high gloss' : 'matt'} ${c.en} paint`);
    return [
      `- Lower cabinets: ${fr}, finished in ${look(lo)}.`,
      s.uppers === 'shelves' || s.uppers === 'none' ? `- ${pick(UPPERS, s.uppers)[2]}.` : `- Upper cabinets: ${pick(UPPERS, s.uppers)[2]}, ${fr}, finished in ${look(up)}.`,
      `- Worktop: ${pick(TOPS, s.top)[2]}.`,
      `- Backsplash: ${pick(SPLASH, s.splash)[2]}.`,
      `- Handles: ${pick(HANDLES, s.handle)[2]}.`,
      `- Tap and metal details: ${pick(METALS, s.metal)[2]}. Integrated sink. Warm LED strip under the upper cabinets.`,
    ].join('\n');
  }
  function basePrompt() {
    const notes = $('#moNotes').value.trim();
    return `${
      MO.keep
        ? 'Keep the kitchen in exactly the same place, with the same length, depth and height of the cabinets, the same sink and appliance positions, so the result is realistic for this room and can be built.'
        : 'You may improve the kitchen layout within the same wall space (for example add a tall column or extend the upper cabinets), but it must stay realistic for this room.'
    }
Keep EXACTLY: the camera position, angle, lens and framing; the walls, doors and door frames, windows, the floor, the ceiling and ceiling lights, sockets and switches, and the light in the photo.
${MO.tidy ? 'Remove the clutter from the worktop and the floor (bags, dishes, towels, slippers). Keep at most two tasteful accessories.' : 'Keep the small items on the worktop.'}
${notes ? `Client wishes (Bulgarian): ${notes}\n` : ''}Realism: it must look like a real photo taken with the same phone in the same room after the new kitchen was installed: correct perspective, real material textures and grain, natural soft shadows, slight photo noise. No CGI look, no text, no watermark.`;
  }
  function promptFor(i) {
    const first = i === 0 || !PH.results[0] || !PH.results[0].cur();
    const head =
      MO.src === 'insp'
        ? `Image 1 is a real photo of the client's current kitchen. ${first ? 'Image 2' : 'Image 3'} is an inspiration kitchen the client likes. Redesign ONLY the kitchen furniture in image 1 so it copies the look of the inspiration: the same front style and colours, worktop, backsplash, handles, tap and lighting.`
        : `Image 1 is a real photo of the client's current kitchen. Redesign ONLY the kitchen furniture as a professional kitchen designer and show the same room after installation.\nNew kitchen design:\n${designEN()}`;
    const same = first ? '' : '\nImage 2 shows the SAME kitchen already redesigned, photographed from another angle. The new kitchen must match image 2 exactly: same colours, materials, handles, worktop and backsplash.';
    return `${head}${same}\n${basePrompt()}`;
  }

  /* ---------- Сървър ---------- */
  const b64 = (u) => ({ data: u.split(',')[1], mime: u.slice(5, u.indexOf(';')) });
  function aspectOf(w, h) {
    const r = w / h;
    const opts = [
      ['9:16', 9 / 16],
      ['2:3', 2 / 3],
      ['3:4', 3 / 4],
      ['4:5', 4 / 5],
      ['1:1', 1],
      ['5:4', 5 / 4],
      ['4:3', 4 / 3],
      ['3:2', 3 / 2],
      ['16:9', 16 / 9],
    ];
    return opts.reduce((a, b) => (Math.abs(Math.log(b[1] / r)) < Math.abs(Math.log(a[1] / r)) ? b : a))[0];
  }
  async function render(images, prompt, aspect, onWait) {
    const body = JSON.stringify({ mode: 'edit', prompt, aspect, images: images.map(b64) });
    let r = null;
    for (let a = 0; a < 12; a++) {
      try {
        r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (r.status < 500 && r.status !== 429) break;
      } catch (e) {
        r = null;
      }
      if (a < 11) {
        onWait && onWait(r && r.status === 429 ? 'Изчаквам свободен ред…' : 'Сървърът се подготвя…');
        await new Promise((ok) => setTimeout(ok, r && r.status === 429 ? 12000 : Math.min(8000, 3000 + a * 1500)));
      }
    }
    if (!r) throw new Error('Няма връзка със сървъра');
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.image) throw new Error(j.error || 'Снимката не стана. Опитай отново.');
    return j.image;
  }

  /* ---------- Снимки ---------- */
  async function addPhotos(files) {
    const st = $('#moStatus');
    for (const f of Array.from(files).slice(0, 6 - PH.photos.length)) {
      try {
        const blob = await M.shrinkImage(f);
        const url = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(blob);
        });
        const img = await new Promise((res) => {
          const i = new Image();
          i.onload = () => res(i);
          i.src = url;
        });
        PH.photos.push({ url, aspect: aspectOf(img.naturalWidth, img.naturalHeight) });
      } catch (e) {
        st.textContent = M.photoError(e);
      }
    }
    if (Array.from(files).length + PH.photos.length > 6) M.toast('До 6 снимки наведнъж');
    renderPhotos();
    renderResults();
  }
  function renderPhotos() {
    const n = PH.photos.length;
    $('#moPhotos').innerHTML =
      PH.photos.map((p, i) => `<div class="mothumb"><img src="${p.url}" alt="Снимка ${i + 1}"><button class="mox" data-rm="${i}" aria-label="Махни снимка ${i + 1}">✕</button><span>${i + 1}</span></div>`).join('') +
      (n < 6 ? `<label class="mothumb add" for="moFile"><svg class="ic lg"><use href="#i-camera"/></svg><b>${n ? 'Добави още' : 'Качи снимки'}</b><span class="small muted">${n ? 'от друг ъгъл' : 'до 6 снимки'}</span></label>` : '');
    $('#moRun').innerHTML = `<svg class="ic"><use href="#i-sparkles"/></svg>${PH.results.some((r) => r && r.cur()) ? 'Обнови с промените' : n > 1 ? `Преобрази ${n} снимки` : 'Преобрази'}`;
  }

  /* ---------- Резултати ---------- */
  function newResult() {
    return {
      vers: [],
      at: -1,
      busy: false,
      msg: '',
      err: '',
      cur() {
        return this.vers[this.at] || null;
      },
    };
  }
  function cmpHtml(i, before, after) {
    return `<div class="compare mocmp" data-c="${i}"><img src="${before}" alt="Сега"><div class="after" style="clip-path:inset(0 0 0 50%)"><img src="${after}" alt="Новата кухня"></div><div class="handle" style="left:50%"><span>‹ ›</span></div><span class="tag l">Сега</span><span class="tag r">Новата кухня</span></div>`;
  }
  function renderResults() {
    const box = $('#moResults');
    if (!PH.photos.length) {
      box.innerHTML = `<div class="moempty"><img src="img/st-walnut.jpg" alt=""><div><h3>Снимай кухнята си от 1 до 6 ъгъла</h3><p class="muted">Застани на входа и снимай цялата стена. AI запазва стените, пода, вратите и размерите и сменя само шкафовете, плота, гърба и дръжките.</p></div></div>`;
      $('#moAfter').hidden = true;
      return;
    }
    box.innerHTML = PH.photos
      .map((p, i) => {
        const r = PH.results[i];
        const cur = r && r.cur();
        let body;
        if (r && r.busy) body = `<div class="rwait"><img src="${cur || p.url}" alt=""><div class="rscan"></div><div class="rmsg"><span class="spinner"></span> ${esc(r.msg || 'AI преобразява…')}</div></div>`;
        else if (cur) body = cmpHtml(i, p.url, cur);
        else body = `<div class="mobefore"><img src="${p.url}" alt="Снимка ${i + 1}">${r && r.err ? `<div class="rmsg">${esc(r.err)}</div>` : ''}</div>`;
        const vers = r && r.vers.length > 1 ? `<div class="movers">${r.vers.map((v, j) => `<button data-v="${i}:${j}" aria-pressed="${j === r.at}" title="Версия ${j + 1}"><img src="${v}" alt="Версия ${j + 1}"></button>`).join('')}</div>` : '';
        const acts = cur && !r.busy
          ? `<div class="moacts"><div class="row"><input class="inp" data-fix="${i}" placeholder="Корекция, например: горните шкафове в бяло"><button class="btn primary" data-fixgo="${i}">Приложи</button></div>
             <div class="chips">${QUICK.map((q) => `<button class="chip" data-q="${i}">${q}</button>`).join('')}</div>
             <div class="row"><button class="btn sm" data-again="${i}"><svg class="ic"><use href="#i-sparkles"/></svg>Нов вариант</button><button class="btn sm" data-save="${i}"><svg class="ic"><use href="#i-download"/></svg>Свали</button></div></div>`
          : '';
        const wide = PH.photos[i].aspect && ['16:9', '3:2', '4:3', '5:4'].includes(PH.photos[i].aspect);
        return `<div class="card pad stack mores${wide ? ' wide' : ''}"><div class="row" style="justify-content:space-between"><b>Ъгъл ${i + 1}</b>${cur ? `<span class="small muted">версия ${r.at + 1} от ${r.vers.length}</span>` : ''}</div>${body}${vers}${acts}</div>`;
      })
      .join('');
    bindCompares();
    $('#moAfter').hidden = !PH.results.some((r) => r && r.cur());
  }
  function bindCompares() {
    $$('#moResults .mocmp').forEach((cmp) => {
      const set = (x) => {
        const r = cmp.getBoundingClientRect();
        const p = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
        cmp.querySelector('.after').style.clipPath = `inset(0 0 0 ${p}%)`;
        cmp.querySelector('.handle').style.left = p + '%';
      };
      let down = false;
      cmp.addEventListener('pointerdown', (e) => ((down = true), cmp.setPointerCapture(e.pointerId), set(e.clientX)));
      cmp.addEventListener('pointermove', (e) => down && set(e.clientX));
      cmp.addEventListener('pointerup', () => (down = false));
    });
  }

  async function runOne(i, images, prompt) {
    const r = PH.results[i] || (PH.results[i] = newResult());
    r.busy = true;
    r.err = '';
    r.msg = 'AI преобразява…';
    renderResults();
    try {
      const img = await render(images, prompt, PH.photos[i].aspect, (m) => {
        r.msg = m;
        renderResults();
      });
      r.vers = r.vers.slice(0, r.at + 1).concat(img);
      r.at = r.vers.length - 1;
    } catch (e) {
      r.err = e.message || 'Снимката не стана';
    }
    r.busy = false;
    renderResults();
    renderPhotos();
  }
  async function runAll() {
    const st = $('#moStatus');
    if (!PH.photos.length) return (st.textContent = 'Качи поне една снимка на кухнята си.');
    if (MO.src === 'insp' && !PH.inspUrl) return (st.textContent = 'Качи снимка на кухня, която харесваш, или избери готов проект.');
    if (!(M.platform && M.platform.hosted)) return (st.innerHTML = 'Преобразяването става на сървъра. Отвори <a href="https://modulia-bg.netlify.app/#makeover" target="_blank" rel="noopener">modulia-bg.netlify.app</a>.');
    if (PH.busy) return;
    PH.busy = true;
    $('#moRun').disabled = true;
    const t0 = Date.now();
    st.innerHTML = `<span class="spinner"></span> AI преобразява ${PH.photos.length > 1 ? PH.photos.length + ' снимки, първо ъгъл 1' : 'снимката'}. Обикновено 15 до 40 секунди на снимка.`;
    // ъгъл 1 задава дизайна, останалите го следват
    const extra = MO.src === 'insp' ? [PH.inspUrl] : [];
    await runOne(0, [PH.photos[0].url, ...extra], promptFor(0));
    const ref = PH.results[0] && PH.results[0].cur();
    if (PH.photos.length > 1)
      await Promise.all(
        PH.photos.slice(1).map((p, j) =>
          new Promise((ok) => setTimeout(ok, j * 1500)).then(() => runOne(j + 1, ref ? [p.url, ref, ...extra] : [p.url, ...extra], ref ? promptFor(j + 1) : promptFor(0)))
        )
      );
    const ok = PH.results.filter((r) => r && r.cur()).length;
    st.innerHTML = ok ? `<span class="pill ok">готово за ${Math.round((Date.now() - t0) / 1000)} s</span> Плъзгай, за да сравниш. Смени цвят или напиши корекция.` : 'Не стана. Опитай отново след малко.';
    $('#moRun').disabled = false;
    PH.busy = false;
    if (ok) $('#moResults').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  function fix(i, text) {
    const r = PH.results[i];
    if (!r || !r.cur() || !text) return;
    const prompt = `Image 1 is a photo of a redesigned kitchen. Image 2 is the same room before. Apply ONLY this change requested by the client (Bulgarian): "${text}".
Keep everything else in image 1 identical: the same framing, room, cabinets layout, materials and light, unless the change asks otherwise. The result must stay a realistic photo of this room. No text.`;
    runOne(i, [r.cur(), PH.photos[i].url], prompt);
  }

  /* ---------- Към цена и 3D ---------- */
  function toProject() {
    const s = MO.spec;
    const zone = (k) => {
      const c = col(k);
      if (c.wood) return { kind: 'wood', wood: c.wood, surface: s.front === 'fluted' ? 'fluted' : 'flat' };
      return { kind: 'paint', color: c.c, surface: s.front === 'gloss' ? 'flat' : s.front, finish: s.front === 'gloss' ? 'gloss' : 'mat' };
    };
    const st = {
      base: zone(s.low),
      wall: s.uppers === 'shelves' || s.uppers === 'none' ? null : zone(s.up),
      tall: null,
      worktop: pick(TOPS, s.top)[3],
      handle: pick(HANDLES, s.handle)[3],
      splash: pick(SPLASH, s.splash)[3],
      uppers: pick(UPPERS, s.uppers)[3],
      carcass: col(s.low).wood ? 'wood' : 'white',
      spots: true,
      pendant: false,
      dining: false,
    };
    try {
      M.applyPhotoStyle(st);
    } catch (e) {}
    M.setView('builder');
    M.toast('Дизайнът е пренесен. Въведи размерите на стената, за да видиш цената.', 4500);
  }

  /* ---------- Настройки ---------- */
  function renderOpts() {
    $$('#moSrc button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === MO.src));
    $('#moPresetBox').hidden = MO.src !== 'preset';
    $('#moInspBox').hidden = MO.src !== 'insp';
    $('#moTune').hidden = MO.src === 'insp';
    $('#moPresets').innerHTML = PRESETS.map((p) => `<button class="mopre" data-p="${p.k}" aria-pressed="${MO.preset === p.k}"><img src="img/st-${p.k}.jpg" alt="" loading="lazy"><span><b>${p.n}</b><span class="small muted">${p.s}</span></span></button>`).join('');
    const sw = (id, val, allowSame) =>
      ($(id).innerHTML =
        COLORS.map((c) => `<button class="msw" data-c="${c.k}" aria-pressed="${val === c.k}" title="${c.n}" style="--c:${c.c}"><span></span>${c.n}</button>`).join('') +
        `<label class="msw custom" title="Друг цвят"><input type="color" value="${/^#/.test(val) ? val : '#c9b8a0'}" data-custom="${id}"><span></span>Друг</label>`);
    sw('#moLow', MO.spec.low);
    sw('#moUp', MO.spec.up);
    const seg = (id, list, val) => ($(id).innerHTML = list.map(([k, n]) => `<button data-k="${k}" aria-pressed="${val === k}">${n}</button>`).join(''));
    seg('#moFront', FRONTS, MO.spec.front);
    seg('#moTop', TOPS, MO.spec.top);
    seg('#moHandle', HANDLES, MO.spec.handle);
    seg('#moSplash', SPLASH, MO.spec.splash);
    seg('#moUppers', UPPERS, MO.spec.uppers);
    seg('#moMetal', METALS, MO.spec.metal);
    $('#moKeep').checked = MO.keep;
    $('#moTidy').checked = MO.tidy;
  }
  M.makeoverPreset = (k) => {
    const p = PRESETS.find((x) => x.k === k);
    if (!p) return;
    MO.src = 'preset';
    MO.preset = k;
    MO.spec = specOf(p);
    save();
    if (PH.ready) renderOpts();
  };

  function init() {
    if (PH.ready) return;
    PH.ready = true;
    renderOpts();
    renderPhotos();
    renderResults();
    const v = $('#view-makeover');
    v.addEventListener('change', async (e) => {
      const t = e.target;
      if (t.id === 'moFile') {
        const fs = t.files;
        await addPhotos(fs);
        t.value = '';
        return;
      }
      if (t.id === 'moInspFile') {
        const f = t.files && t.files[0];
        t.value = '';
        if (!f) return;
        try {
          const blob = await M.shrinkImage(f);
          PH.inspUrl = await new Promise((res) => {
            const r = new FileReader();
            r.onload = () => res(r.result);
            r.readAsDataURL(blob);
          });
          $('#moInspImg').src = PH.inspUrl;
          $('#moInspImg').hidden = false;
          $('#moInspTxt').hidden = true;
        } catch (err) {
          $('#moStatus').textContent = M.photoError(err);
        }
        return;
      }
      if (t.dataset.custom) {
        MO.spec[t.dataset.custom === '#moLow' ? 'low' : 'up'] = t.value;
        MO.preset = null;
        save();
        return renderOpts(), renderPhotos();
      }
      if (t.id === 'moKeep') return (MO.keep = t.checked), save();
      if (t.id === 'moTidy') return (MO.tidy = t.checked), save();
    });
    v.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.dataset.rm !== undefined) {
        const i = +b.dataset.rm;
        PH.photos.splice(i, 1);
        PH.results.splice(i, 1);
        return renderPhotos(), renderResults();
      }
      if (b.closest('#moSrc')) return (MO.src = b.dataset.s), save(), renderOpts();
      if (b.closest('#moPresets')) return M.makeoverPreset(b.dataset.p), renderPhotos();
      if (b.closest('#moLow') || b.closest('#moUp')) {
        MO.spec[b.closest('#moLow') ? 'low' : 'up'] = b.dataset.c;
        MO.preset = null;
        save();
        return renderOpts();
      }
      const segMap = { moFront: 'front', moTop: 'top', moHandle: 'handle', moSplash: 'splash', moUppers: 'uppers', moMetal: 'metal' };
      const pid = b.parentElement && b.parentElement.id;
      if (segMap[pid]) {
        MO.spec[segMap[pid]] = b.dataset.k;
        MO.preset = null;
        save();
        return renderOpts();
      }
      if (b.id === 'moRun') return runAll();
      if (b.dataset.v) {
        const [i, j] = b.dataset.v.split(':').map(Number);
        PH.results[i].at = j;
        return renderResults();
      }
      if (b.dataset.fixgo !== undefined) {
        const i = +b.dataset.fixgo;
        return fix(i, $(`[data-fix="${i}"]`).value.trim());
      }
      if (b.dataset.q !== undefined) return fix(+b.dataset.q, b.textContent);
      if (b.dataset.again !== undefined) {
        const i = +b.dataset.again;
        const ref = i > 0 && PH.results[0] && PH.results[0].cur();
        const extra = MO.src === 'insp' ? [PH.inspUrl] : [];
        return runOne(i, ref ? [PH.photos[i].url, ref, ...extra] : [PH.photos[i].url, ...extra], ref ? promptFor(i) : promptFor(0));
      }
      if (b.dataset.save !== undefined) {
        const r = PH.results[+b.dataset.save];
        if (r && r.cur()) M.saveFile(`modulia-kuhnya-${+b.dataset.save + 1}.${r.cur().startsWith('data:image/png') ? 'png' : 'jpg'}`, await (await fetch(r.cur())).blob());
        return;
      }
      if (b.id === 'moToProject') return toProject();
      if (b.id === 'moToReq') return M.setView('request');
    });
    v.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.dataset && e.target.dataset.fix !== undefined) fix(+e.target.dataset.fix, e.target.value.trim());
    });
  }
  M.on('view', (v) => v === 'makeover' && init());
  // „Тенденции“ на началната страница: избира стила, преди да се отвори разделът
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-preset]');
    if (b) M.makeoverPreset(b.dataset.preset);
  }, true);
  M.makeover = { state: () => ({ MO, PH }), promptFor };
})();
