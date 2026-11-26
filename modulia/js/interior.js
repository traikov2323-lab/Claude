/* Модулия — Интериор.
   Снимка на стая → 3 фотореалистични варианта на интериорния дизайн в същата стая
   (същите стени, прозорци, врати, таван и пропорции) → списък за пазаруване от български магазини в рамките на бюджета. */
(function () {
  const M = window.M;
  const { $, $$, esc } = M;

  const ROOMS = [
    ['living', 'Дневна', 'living room'],
    ['bedroom', 'Спалня', 'bedroom'],
    ['kids', 'Детска', "children's room"],
    ['office', 'Кабинет', 'home office'],
    ['dining', 'Трапезария', 'dining room'],
    ['hall', 'Антре', 'entrance hall'],
  ];
  // Всеки стил има 3 палитри, за да са вариантите различни
  const STYLES = [
    { key: 'warm', bg: ['Беж и светъл дъб', 'Теракота и орех', 'Шалфей и крем'], name: 'Топъл модерен', en: 'warm modern', v: ['warm beige, cream and light oak, linen textiles, brass accents', 'terracotta, caramel and walnut, boucle and wool textures', 'soft sage green, cream and natural oak, rattan details'] },
    { key: 'scandi', bg: ['Бяло и бреза', 'Пясък и юта', 'Бяло и прашно синьо'], name: 'Скандинавски', en: 'Scandinavian', v: ['white, light grey and pale birch, cosy wool textiles', 'oatmeal, sand and light oak, jute rug and paper lamps', 'white and dusty blue with light ash wood'] },
    { key: 'japandi', bg: ['Грейж и черно', 'Глина и тъмен орех', 'Камък и маслина'], name: 'Джапанди', en: 'Japandi', v: ['warm greige, light oak and black accents, low furniture', 'clay, linen and dark walnut, paper lantern lights', 'stone grey, ash wood and olive green plants'] },
    { key: 'minimal', bg: ['Бяло и топло сиво', 'Черно, бяло и травертин', 'Кашмир монохром'], name: 'Минимализъм', en: 'minimalist', v: ['all-white and warm grey with a single oak accent', 'soft black, white and travertine', 'cashmere beige monochrome with hidden lighting'] },
    { key: 'industrial', bg: ['Графит и кожа', 'Бетон и орех', 'Тъмнозелено и месинг'], name: 'Индустриален', en: 'soft industrial', v: ['charcoal, cognac leather and black metal', 'concrete grey, walnut and black metal', 'deep green, brick tones and brass'] },
    { key: 'boho', bg: ['Теракота и ратан', 'Крем и юта', 'Ръжда и маслина'], name: 'Бохо', en: 'modern boho', v: ['terracotta, ochre and rattan with many plants', 'cream, jute and macrame with warm wood', 'rust, olive and woven textures'] },
    { key: 'classic', bg: ['Слонова кост и злато', 'Тъмносиньо и месинг', 'Бяло, орех и мрамор'], name: 'Модерна класика', en: 'modern classic', v: ['ivory, taupe and gold details, wall mouldings', 'navy blue, cream and brass', 'warm white, walnut and marble'] },
    { key: 'med', bg: ['Варово бяло и маслина', 'Пясък и теракота', 'Крем и травертин'], name: 'Средиземноморски', en: 'Mediterranean', v: ['limewash white, linen and olive wood', 'warm sand, terracotta pots and blue accents', 'cream plaster, travertine and natural oak'] },
  ];
  const STORES = {
    'ikea.bg': 'IKEA',
    'jysk.bg': 'JYSK',
    'moemax.bg': 'Mömax',
    'videnov.bg': 'Виденов',
    'jumbo.bg': 'Jumbo',
    'emag.bg': 'eMAG',
    'praktiker.bg': 'Praktiker',
    'mr-bricolage.bg': 'Mr. Bricolage',
    'homemax.bg': 'HomeMax',
  };

  const IN = Object.assign({ room: 'living', style: 'warm', budget: 500, keep: true }, M.store.get('interior', {}) || {});
  const PH = { photo: null, photoUrl: null, vars: [null, null, null], sel: 0, shop: null, busy: false, ready: false };
  const save = () => M.store.set('interior', { room: IN.room, style: IN.style, budget: IN.budget, keep: IN.keep });
  const style = () => STYLES.find((s) => s.key === IN.style) || STYLES[0];
  const roomEN = () => (ROOMS.find((r) => r[0] === IN.room) || ROOMS[0])[2];

  /* ---------- Промптове ---------- */
  function designPrompt(i) {
    const st = style();
    const notes = $('#inNotes').value.trim();
    return `Act as a professional interior designer. Redesign the interior of the ${roomEN()} in this photo.

Keep the existing room EXACTLY as it is: the same walls, windows, doors, ceiling, floor, room size and proportions, and the same camera position, angle and lens. Change ONLY the furniture, its arrangement, the colours, the lighting and the decorative elements.
Built-in elements (kitchen units, built-in wardrobes, radiators, air conditioners, sockets) stay identical. The output must have exactly the same framing as the input photo, so the two can be compared with a slider.
${
  IN.keep
    ? `Budget refresh: KEEP the existing large furniture (sofa, tables, cabinets, bed, wardrobe, TV) and the floor in the same place. Transform the room with textiles (rug, curtains, cushions, throws, bedding), lighting (pendant, floor and table lamps), wall art and mirrors, plants and decor, and small storage pieces. You may change the wall colour.`
    : 'You may replace and rearrange all furniture to create the best layout for this room.'
}

Style: ${st.en}, variant ${i + 1} of 3 with this palette: ${st.v[i]}.
${notes ? `Client wishes (Bulgarian): ${notes}\n` : ''}
The result must look like a real photograph of a real finished room: natural daylight from the windows, realistic shadows and materials, no artificial glow, no 3D-render look. No people, no text, no watermark. Output one image.`;
  }
  function shopPrompt() {
    return `The image has two halves. LEFT: the client's room now. RIGHT: the new interior design for the same room.
List every NEW or CHANGED furniture item, accessory and decorative element visible on the RIGHT, so the client can buy them in Bulgaria. Items that are the same on both sides go to "kept".
Use real products that are sold online in Bulgaria, preferably with their real series names (for IKEA, the Swedish product names). Allowed stores (domain): ${Object.keys(STORES).join(', ')}.
Prices: realistic current Bulgarian prices in EUR with VAT, per piece. The TOTAL of all items must not exceed ${IN.budget} EUR. If needed, choose cheaper alternatives or leave out the least important items.
"detail": short, max 6 words (size, colour). priority: 1 = essential for the look, 2 = important, 3 = nice to have.
Group the items, for example: "Килим, завеси и текстил", "Осветление", "Декорация и стени", "Растения", "Мебели и съхранение".

Reply with ONLY this JSON (Bulgarian text):
{"summary":"едно изречение какво се променя","kept":["диван","холна маса"],"groups":[{"name":"Килим, завеси и текстил","items":[{"name":"LÄTTBETONG килим","detail":"160×230 см, бежов","store":"ikea.bg","qty":1,"price":86.41,"priority":1}]}]}`;
  }

  /* ---------- Сървър ---------- */
  async function postRender(prompt, dataUrl, onWait) {
    const body = JSON.stringify({ mode: 'scene', prompt, images: [{ data: dataUrl.split(',')[1], mime: dataUrl.slice(5, dataUrl.indexOf(';')) }] });
    let r = null;
    for (let a = 0; a < 6; a++) {
      try {
        r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (r.status < 500 && r.status !== 429) break;
      } catch (e) {
        r = null;
      }
      if (a < 5) {
        onWait && onWait(r && r.status === 429 ? 'Изчаквам свободен ред…' : 'Сървърът се подготвя…');
        await new Promise((ok) => setTimeout(ok, (r && r.status === 429 ? 15000 : 3000) * (a + 1)));
      }
    }
    if (!r) throw new Error('Няма връзка със сървъра');
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.image) throw new Error(j.error || 'Вариантът не стана');
    return j.image;
  }

  /* ---------- Варианти ---------- */
  function renderThumbs() {
    $('#inThumbs').hidden = !PH.photoUrl;
    $('#inThumbs').innerHTML = PH.vars
      .map((v, i) => {
        const body = !v ? '<span class="muted small">—</span>' : v.img ? `<img src="${v.img}" alt="Вариант ${i + 1}">` : v.err ? `<span class="small">${esc(v.err)}</span>` : `<span class="spinner"></span><span class="small muted">${esc(v.msg || 'AI проектира…')}</span>`;
        return `<button class="inthumb${v && !v.img && !v.err ? ' wait' : ''}" data-i="${i}" aria-pressed="${PH.sel === i}"><span class="ith">${body}</span><span class="small"><b>Вариант ${i + 1}</b> · ${esc(style().bg[i])}</span></button>`;
      })
      .join('');
  }
  function renderMain() {
    const v = PH.vars[PH.sel];
    const box = $('#inMain');
    if (!PH.photoUrl) {
      box.innerHTML = '<div class="empty">Качи снимка на стаята, избери стил и бюджет. AI ще направи 3 варианта в същата стая.</div>';
      return;
    }
    if (!v || !v.img) {
      box.innerHTML = `<div class="rwait"><img src="${PH.photoUrl}" alt=""><div class="rscan"></div>${v && !v.err ? `<div class="rmsg"><span class="spinner"></span> ${esc(v.msg || 'AI проектира вариант ' + (PH.sel + 1) + '…')}</div>` : v && v.err ? `<div class="rmsg">${esc(v.err)}</div>` : ''}</div>`;
      $('#inActs').hidden = true;
      return;
    }
    box.innerHTML = `<div class="compare" id="inCmp"><img src="${PH.photoUrl}" alt="Сега"><div class="after" style="clip-path:inset(0 0 0 50%)"><img src="${v.img}" alt="Новият дизайн"></div><div class="handle" style="left:50%"><span>‹ ›</span></div><span class="tag l">Сега</span><span class="tag r">Вариант ${PH.sel + 1}</span></div>`;
    $('#inActs').hidden = false;
    const cmp = $('#inCmp');
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
  }
  async function makeVariant(i) {
    PH.vars[i] = { msg: 'AI проектира…' };
    PH.shop = PH.shop && PH.shop.from === i ? null : PH.shop;
    renderThumbs();
    if (PH.sel === i) renderMain();
    try {
      const img = await postRender(designPrompt(i), PH.photoUrl, (m) => {
        PH.vars[i].msg = m;
        renderThumbs();
        if (PH.sel === i) renderMain();
      });
      PH.vars[i] = { img };
    } catch (e) {
      PH.vars[i] = { err: e.message || 'Вариантът не стана' };
    }
    renderThumbs();
    if (PH.sel === i) renderMain();
  }
  async function makeAll() {
    const st = $('#inStatus');
    if (!PH.photoUrl) return (st.textContent = 'Качи снимка на стаята.');
    if (!(M.platform && M.platform.hosted)) return (st.innerHTML = 'Дизайнът се прави на сървъра. Отвори <a href="https://modulia-bg.netlify.app/#interior" target="_blank" rel="noopener">modulia-bg.netlify.app</a>.');
    if (PH.busy) return;
    PH.busy = true;
    $('#inRun').disabled = true;
    PH.shop = null;
    renderShop();
    PH.sel = 0;
    const t0 = Date.now();
    st.innerHTML = '<span class="spinner"></span> AI прави 3 варианта в твоята стая. Обикновено 20–60 секунди.';
    await Promise.all([0, 1, 2].map((i) => new Promise((ok) => setTimeout(ok, i * 1200)).then(() => makeVariant(i))));
    const ok = PH.vars.filter((v) => v && v.img).length;
    const first = PH.vars.findIndex((v) => v && v.img);
    if (first >= 0) PH.sel = first;
    renderThumbs();
    renderMain();
    st.innerHTML = ok ? `<span class="pill ok">готово за ${Math.round((Date.now() - t0) / 1000)} s</span> Сравни вариантите и избери един за списъка за пазаруване.` : 'Вариантите не станаха. Опитай отново след минута.';
    PH.busy = false;
    $('#inRun').disabled = false;
  }

  /* ---------- Списък за пазаруване ---------- */
  async function composite() {
    const load = (u) => new Promise((res, rej) => {
      const im = new Image();
      im.onload = () => res(im);
      im.onerror = rej;
      im.src = u;
    });
    const [a, b] = await Promise.all([load(PH.photoUrl), load(PH.vars[PH.sel].img)]);
    const h = 640;
    const wa = Math.round((a.width / a.height) * h),
      wb = Math.round((b.width / b.height) * h);
    const cv = document.createElement('canvas');
    cv.width = wa + wb + 12;
    cv.height = h;
    const c = cv.getContext('2d');
    c.fillStyle = '#fff';
    c.fillRect(0, 0, cv.width, h);
    c.drawImage(a, 0, 0, wa, h);
    c.drawImage(b, wa + 12, 0, wb, h);
    return new Promise((res) => cv.toBlob(res, 'image/jpeg', 0.88));
  }
  const num = (v, d = 0) => (Number.isFinite(+v) ? +v : d);
  async function makeShop() {
    const v = PH.vars[PH.sel];
    const st = $('#inShopSt');
    if (!v || !v.img) return;
    st.innerHTML = '<span class="spinner"></span> AI избира продукти от български магазини…';
    $('#inShopBtn').disabled = true;
    try {
      const j = await M.aiJSON('shop', shopPrompt(), await composite());
      const groups = (Array.isArray(j.groups) ? j.groups : [])
        .map((g) => ({
          name: String(g.name || 'Продукти').slice(0, 60),
          items: (Array.isArray(g.items) ? g.items : [])
            .map((it) => ({
              name: String(it.name || '').slice(0, 80),
              detail: String(it.detail || '').slice(0, 80),
              store: STORES[String(it.store || '').replace(/^www\./, '')] ? String(it.store).replace(/^www\./, '') : 'ikea.bg',
              qty: Math.max(1, Math.round(num(it.qty, 1))),
              price: Math.max(0, num(it.price)),
              priority: [1, 2, 3].includes(+it.priority) ? +it.priority : 2,
              on: true,
            }))
            .filter((it) => it.name),
        }))
        .filter((g) => g.items.length);
      PH.shop = { from: PH.sel, summary: String(j.summary || ''), kept: (Array.isArray(j.kept) ? j.kept : []).map(String).slice(0, 12), groups };
      st.textContent = '';
      renderShop();
      $('#inShop').scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      st.textContent = M.aiError(e);
    }
    $('#inShopBtn').disabled = false;
  }
  const all = () => (PH.shop ? PH.shop.groups.flatMap((g) => g.items) : []);
  const total = () => all().reduce((s, it) => s + (it.on ? it.qty * it.price : 0), 0);
  const q = (it) => `${it.name} ${it.detail}`.replace(/\s+/g, ' ').trim();
  const directUrl = (it) => 'https://duckduckgo.com/?q=' + encodeURIComponent('\\' + it.name + ' site:' + it.store);
  const searchUrl = (it) => 'https://www.google.com/search?q=' + encodeURIComponent(q(it) + ' site:' + it.store);
  function renderShop() {
    const box = $('#inShop');
    if (!PH.shop) {
      box.hidden = true;
      return;
    }
    box.hidden = false;
    const t = total(),
      B = IN.budget,
      over = t > B + 0.005;
    const n = all().filter((it) => it.on).length;
    $('#inBudget').innerHTML = `<div class="row" style="justify-content:space-between"><span class="lbl">ОБЩ БЮДЖЕТ ЗА ПРОДУКТИТЕ</span></div>
      <div class="row" style="justify-content:space-between;align-items:baseline"><b class="inbig">${M.eur(t)}</b><span class="${over ? 'inover' : 'inok'}">${over ? 'Над бюджета с ' + M.eur(t - B) : 'В рамките на ' + M.eur(B)}</span></div>
      <div class="inbar"><span style="width:${Math.min(100, (t / B) * 100)}%;${over ? 'background:#ff3b30' : ''}"></span></div>
      <div class="row small muted" style="justify-content:space-between"><span>${n} вида продукти</span><span>${over ? '' : 'Остават ' + M.eur(B - t)}</span></div>`;
    $('#inKept').innerHTML = PH.shop.kept.length ? `<span class="small muted">Запазваме:</span> ${PH.shop.kept.map((k) => `<span class="pill">${esc(k)}</span>`).join(' ')}` : '';
    $('#inSum').textContent = PH.shop.summary;
    let html = '';
    PH.shop.groups.forEach((g, gi) => {
      const gt = g.items.reduce((s, it) => s + (it.on ? it.qty * it.price : 0), 0);
      html += `<h3 class="ingh">${gi + 1}. ${esc(g.name)} — ${M.eur(gt)}</h3><div class="tablewrap"><table class="t intable"><thead><tr><th></th><th>Продукт и линк</th><th>Магазин</th><th class="num">Кол.</th><th class="num">Общо</th></tr></thead><tbody>`;
      html += g.items
        .map(
          (it, ii) => `<tr class="${it.on ? '' : 'off'}"><td><input type="checkbox" data-g="${gi}" data-i="${ii}" ${it.on ? 'checked' : ''} aria-label="Включи ${esc(it.name)}"></td>
          <td class="wrap"><a href="${directUrl(it)}" target="_blank" rel="noopener"><b>${esc(it.name)}</b> ↗</a>${it.detail ? ` <span class="muted">— ${esc(it.detail)}</span>` : ''}<div class="small"><a class="muted" href="${searchUrl(it)}" target="_blank" rel="noopener">още резултати</a>${it.priority === 3 ? ' · <span class="muted">по желание</span>' : ''}</div></td>
          <td>${esc(STORES[it.store])}</td><td class="num">${it.qty}</td><td class="num">${M.fmt(it.qty * it.price)} €</td></tr>`
        )
        .join('');
      html += '</tbody></table></div>';
    });
    $('#inGroups').innerHTML = html;
    $('#inFit').hidden = !over;
  }
  function fitBudget() {
    const items = all();
    for (const p of [3, 2]) {
      const cand = items.filter((it) => it.on && it.priority === p).sort((a, b) => b.qty * b.price - a.qty * a.price);
      for (const it of cand) {
        if (total() <= IN.budget) break;
        it.on = false;
      }
    }
    renderShop();
    M.toast(total() <= IN.budget ? 'Списъкът е в рамките на бюджета' : 'Махни още продукти, за да влезеш в бюджета');
  }
  function shopCsv() {
    const rows = [['Група', 'Продукт', 'Детайли', 'Магазин', 'Количество', 'Цена €', 'Общо €', 'Линк']];
    PH.shop.groups.forEach((g) => g.items.filter((it) => it.on).forEach((it) => rows.push([g.name, it.name, it.detail, STORES[it.store], it.qty, M.fmt(it.price), M.fmt(it.qty * it.price), directUrl(it)])));
    rows.push(['', 'Общо', '', '', '', '', M.fmt(total()), '']);
    M.saveFile('modulia-interior-spisak.csv', '﻿' + rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\r\n'), 'text/csv');
  }
  function shopText() {
    let s = `Интериор · ${style().name} · вариант ${PH.shop.from + 1}\nОбщо: ${M.eur(total())} (бюджет ${M.eur(IN.budget)})\n`;
    PH.shop.groups.forEach((g) => {
      const its = g.items.filter((it) => it.on);
      if (!its.length) return;
      s += `\n${g.name}\n` + its.map((it) => `- ${it.name}${it.detail ? ' (' + it.detail + ')' : ''} × ${it.qty} — ${M.fmt(it.qty * it.price)} € · ${STORES[it.store]} · ${searchUrl(it)}`).join('\n') + '\n';
    });
    return s;
  }

  /* ---------- Интерфейс ---------- */
  function renderOpts() {
    $('#inRoom').innerHTML = ROOMS.map(([k, n]) => `<button data-r="${k}" aria-pressed="${IN.room === k}">${n}</button>`).join('');
    $('#inStyles').innerHTML = STYLES.map((s) => `<button class="chip" data-s="${s.key}" aria-pressed="${IN.style === s.key}">${s.name}</button>`).join('');
    $('#inBudgetR').value = IN.budget;
    $('#inBudgetN').value = IN.budget;
    $('#inKeep').checked = IN.keep;
  }
  function init() {
    if (PH.ready) return;
    PH.ready = true;
    renderOpts();
    renderThumbs();
    renderMain();
    const v = $('#view-interior');
    v.addEventListener('click', async (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.closest('#inRoom')) return (IN.room = b.dataset.r), save(), renderOpts();
      if (b.closest('#inStyles')) return (IN.style = b.dataset.s), save(), renderOpts(), renderThumbs();
      if (b.closest('#inThumbs')) {
        PH.sel = +b.closest('.inthumb').dataset.i;
        renderThumbs();
        return renderMain();
      }
      if (b.id === 'inRun') return makeAll();
      if (b.id === 'inAgain') return makeVariant(PH.sel);
      if (b.id === 'inSave') {
        const img = PH.vars[PH.sel] && PH.vars[PH.sel].img;
        if (img) M.saveFile(`modulia-interior-${PH.sel + 1}.${img.startsWith('data:image/png') ? 'png' : 'jpg'}`, await (await fetch(img)).blob());
        return;
      }
      if (b.id === 'inShopBtn') return makeShop();
      if (b.id === 'inFit') return fitBudget();
      if (b.id === 'inCsv') return shopCsv();
      if (b.id === 'inCopy') {
        try {
          await navigator.clipboard.writeText(shopText());
          M.toast('Списъкът е копиран');
        } catch (err) {
          M.saveFile('modulia-interior-spisak.txt', shopText(), 'text/plain');
        }
      }
    });
    v.addEventListener('input', (e) => {
      if (e.target.id === 'inBudgetR' || e.target.id === 'inBudgetN') {
        IN.budget = Math.max(50, Math.min(20000, Math.round(+e.target.value || 500)));
        (e.target.id === 'inBudgetR' ? $('#inBudgetN') : $('#inBudgetR')).value = IN.budget;
        save();
        renderShop();
      }
    });
    v.addEventListener('change', async (e) => {
      const t = e.target;
      if (t.id === 'inKeep') return (IN.keep = t.checked), save();
      if (t.dataset && t.dataset.g !== undefined) {
        PH.shop.groups[+t.dataset.g].items[+t.dataset.i].on = t.checked;
        return renderShop();
      }
      if (t.id === 'inPhoto') {
        const f = t.files && t.files[0];
        if (!f) return;
        const blob = await M.shrinkImage(f);
        PH.photo = blob;
        PH.photoUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result);
          r.readAsDataURL(blob);
        });
        $('#inPhotoImg').src = PH.photoUrl;
        $('#inPhotoImg').hidden = false;
        $('#inPhotoTxt').hidden = true;
        PH.vars = [null, null, null];
        PH.shop = null;
        renderThumbs();
        renderMain();
        renderShop();
      }
    });
  }
  M.interior = { state: () => ({ IN, PH }), designPrompt, shopPrompt };
  M.on('view', (v) => v === 'interior' && init());
})();
