/* Модулия — AI от скица, преглед в стаята, сглобяване с QR, експорти, запитвания. */
(function () {
  const M = window.M;
  const { $, $$, esc } = M;
  const S = M.S;

  /* ---------- Помощни ---------- */
  const capCache = {};
  M.cap = function (name) {
    if (!capCache[name]) {
      capCache[name] =
        window.claude && typeof window.claude.use === 'function'
          ? Promise.resolve()
              .then(() => window.claude.use(name))
              .catch(() => null)
          : Promise.resolve(null);
    }
    return capCache[name];
  };

  const scripts = {};
  M.loadScript = function (src, module = false) {
    if (!scripts[src])
      scripts[src] = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = src;
        if (module) s.type = 'module';
        s.onload = res;
        s.onerror = () => rej(new Error('Не се зареди ' + src));
        document.head.appendChild(s);
      });
    return scripts[src];
  };
  const LIB = {
    html2pdf: 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js',
    jsqr: 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.js',
    mv: 'https://cdn.jsdelivr.net/npm/@google/model-viewer@3.5.0/dist/model-viewer.min.js',
    confetti: 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.js',
  };

  M.saveFile = async function (filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const dl = await M.cap('downloads');
    if (dl) {
      try {
        await dl.save({ filename, data: blob });
        M.toast('Свалено: ' + filename);
        return true;
      } catch (e) {
        const code = e && e.code;
        if (code === 'declined') {
          M.toast('Свалянето е отказано');
          return false;
        }
        if (code === 'rejected_extension' || code === 'extension_not_enabled') {
          M.toast('Този тип файл не може да се свали тук');
          return false;
        }
        if (code === 'rate_limited') {
          M.toast('Опитай отново след малко');
          return false;
        }
      }
    }
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      M.toast('Свалено: ' + filename);
      return true;
    } catch (e) {
      M.toast('Файлът не може да се свали в този изглед');
      return false;
    }
  };

  /* ---------- AI: Claude в Claude.ai или сървърът на сайта ---------- */
  M.aiMode = async function () {
    const sample = await M.cap('sample');
    if (sample) {
      const lim = await sample.limits().catch(() => null);
      if (lim && lim.images) return 'claude';
    }
    if (M.platform && M.platform.hosted) return 'server';
    return null;
  };
  const blobToB64 = (blob) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result).split(',')[1]);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });
  const parseJSON = (text) => {
    const t = String(text || '').trim();
    try {
      return JSON.parse(t);
    } catch (e) {}
    const f = t.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (f) {
      try {
        return JSON.parse(f[1]);
      } catch (e) {}
    }
    const a = t.indexOf('{'),
      b = t.lastIndexOf('}');
    if (a >= 0 && b > a) {
      const body = t.slice(a, b + 1);
      try {
        return JSON.parse(body);
      } catch (e) {}
      // поправки: коментари, излишни запетаи, кавички тип „ “
      const fixed = body
        .replace(/\/\/[^\n"]*$/gm, '')
        .replace(/,\s*([}\]])/g, '$1')
        .replace(/[\u201c\u201d\u201e]/g, '"');
      try {
        return JSON.parse(fixed);
      } catch (e) {}
    }
    throw { code: 'invalid_json', text: t };
  };
  M.aiJSON = async function (task, prompt, blob, signal) {
    const mode = await M.aiMode();
    if (mode === 'claude') {
      const sample = await M.cap('sample');
      return sample.json(prompt, { images: [blob], signal, modelTier: 'default' });
    }
    if (mode === 'server') {
      const body = JSON.stringify({ task, prompt, image: await blobToB64(blob), mediaType: blob.type || 'image/jpeg' });
      let r = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          r = await fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, signal });
          if (r.status < 500) break;
        } catch (e) {
          if (signal && signal.aborted) throw { code: 'cancelled' };
          r = null;
        }
        if (attempt < 11) await new Promise((ok) => setTimeout(ok, Math.min(8000, 3000 + attempt * 1500)));
      }
      if (!r) throw { code: 'server' };
      if (!r.ok) throw { code: r.status === 429 ? 'rate_limited' : r.status === 503 ? 'unavailable' : 'server' };
      const { text } = await r.json();
      try {
        return parseJSON(text);
      } catch (e) {
        // още един опит с изрично напомняне за JSON
        if (prompt.includes('[retry]')) throw e;
        return M.aiJSON(task, prompt + '\n\n[retry] Reply with ONE valid JSON object only. No comments, no trailing commas, no text before or after.', blob, signal);
      }
    }
    throw { code: 'unavailable' };
  };
  M.aiError = (e) => {
    const code = e && e.code;
    return code === 'not_granted'
      ? 'Достъпът до AI не е разрешен.'
      : code === 'rate_limited'
      ? 'Твърде много заявки. Опитай отново след минута.'
      : code === 'invalid_json'
      ? 'AI не успя да разчете снимката. Опитай с по-ясна снимка.'
      : code === 'unavailable'
      ? 'AI не е достъпен тук. Отвори Модулия на modulia-bg.netlify.app или в Claude.'
      : code === 'cancelled'
      ? 'Спряно.'
      : 'AI не отговори. Опитай отново.';
  };
  M.shrinkImage = (f) => shrinkImage(f);

  M.qrSvg = function (text) {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return q.createSvgTag({ cellSize: 4, margin: 0, scalable: true });
  };
  M.qrImg = function (text) {
    const q = qrcode(0, 'M');
    q.addData(text);
    q.make();
    return `<img alt="" src="${q.createDataURL(8, 0)}">`;
  };
  const qrText = (pid) => `MODULIA|${S.project.id}|${pid}`;

  const dataUrlToBlob = (u) => fetch(u).then((r) => r.blob());
  const slug = () => 'modulia-' + S.project.id.toLowerCase();

  async function pdfFrom(html, filename, opt = {}) {
    M.toast('Подготвям PDF…', 6000);
    await M.loadScript(LIB.html2pdf);
    const stage = $('#pdfStage');
    stage.innerHTML = html;
    stage.style.width = opt.width || '820px';
    const el = stage.firstElementChild;
    await new Promise((r) => setTimeout(r, 120));
    const blob = await window
      .html2pdf()
      .set({
        margin: opt.margin ?? [8, 8, 8, 8],
        filename,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: opt.scale || 2, useCORS: true, backgroundColor: '#ffffff' },
        jsPDF: { unit: 'mm', format: 'a4', orientation: opt.orientation || 'portrait' },
        pagebreak: { mode: opt.pagebreak || ['css', 'legacy'], avoid: ['tr', '.lab', '.keep'] },
      })
      .from(el)
      .outputPdf('blob');
    stage.innerHTML = '';
    return M.saveFile(filename, blob, 'application/pdf');
  }

  M.pdfFrom = pdfFrom;

  /* ---------- Снимка ---------- */
  M.on('ready', () => {
    $('#btnShot').addEventListener('click', async () => {
      if (!M.view3d) return;
      const blob = await dataUrlToBlob(M.view3d.snapshot('image/jpeg', 0.92));
      M.saveFile(slug() + '.jpg', blob, 'image/jpeg');
    });
  });

  /* ---------- Експорти: CSV, разкрой PDF, етикети, оферта ---------- */
  function cutRowsAggregated() {
    const rows = {};
    for (const p of S.built.parts) {
      const g = Object.values(S.groups).find((x) => x.items.some((i) => i.pid === p.pid));
      const mat = g ? g.label : '';
      const grain = g && g.grain && p.grain ? 'да' : 'не';
      const k = [mat, Math.round(p.L), Math.round(p.W), grain, p.edges.L1, p.edges.L2, p.edges.W1, p.edges.W2, p.name].join('|');
      if (!rows[k]) rows[k] = { mat, L: Math.round(p.L), W: Math.round(p.W), grain, e: p.edges, name: p.name, qty: 0, pids: [], mods: new Set() };
      rows[k].qty++;
      rows[k].pids.push(p.pid);
      rows[k].mods.add(p.module);
    }
    return Object.values(rows).sort((a, b) => (a.mat < b.mat ? -1 : a.mat > b.mat ? 1 : b.L - a.L));
  }

  function exportCsv() {
    const kant = (v) => (v ? String(v).replace('.', ',') : '');
    const head = ['№', 'Материал', 'Дължина (мм)', 'Ширина (мм)', 'Брой', 'Шарка по дължина', 'Кант Д1', 'Кант Д2', 'Кант Ш1', 'Кант Ш2', 'Детайл', 'Модули', 'Етикети'];
    const q = (s) => `"${String(s).replace(/"/g, '""')}"`;
    const lines = [head.map(q).join(';')];
    cutRowsAggregated().forEach((r, i) => lines.push([i + 1, r.mat, r.L, r.W, r.qty, r.grain, kant(r.e.L1), kant(r.e.L2), kant(r.e.W1), kant(r.e.W2), r.name, [...r.mods].join(' '), r.pids.join(' ')].map(q).join(';')));
    M.saveFile(slug() + '-razkroi.csv', '﻿' + lines.join('\r\n'), 'text/csv');
  }

  function sheetSvgPrint(s) {
    const modIdx = {};
    S.project.modules.forEach((m, i) => (modIdx[m.code] = i));
    let h = `<rect x="0" y="0" width="2800" height="2070" fill="#f3f4f1" stroke="#222" stroke-width="5"/>`;
    for (const pl of s.placed) {
      const it = pl.item;
      h += `<rect x="${pl.x}" y="${pl.y}" width="${pl.l}" height="${pl.w}" fill="hsl(${((modIdx[it.module] ?? 7) * 47) % 360},55%,82%)" stroke="#222" stroke-width="3"/>`;
      if (pl.l > 240 && pl.w > 80) h += `<text x="${pl.x + 12}" y="${pl.y + 40}" font-size="34" font-family="monospace" fill="#111">${it.pid} ${esc(it.module)}</text>`;
      if (pl.l > 380 && pl.w > 140) h += `<text x="${pl.x + 12}" y="${pl.y + 80}" font-size="32" font-family="monospace" fill="#333">${Math.round(it.L)}×${Math.round(it.W)}</text>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-10 -10 2820 2090" width="740" height="${Math.round((740 * 2090) / 2820)}">${h}</svg>`;
  }

  function exportCutPdf() {
    const P = S.project;
    let html = `<div class="paper" style="box-shadow:none"><div class="ph"><div><h1>Разкрой</h1><div class="meta">Проект ${P.id} · ${new Date().toLocaleDateString('bg-BG')}</div></div><div class="meta" style="text-align:right">${esc(S.profile.name)}<br>Плоча 2800×2070, диск 4 мм, подрязване 10 мм</div></div>`;
    for (const g of Object.values(S.groups).filter((x) => x.nest)) {
      html += `<h3>${esc(g.label)} — ${g.nest.sheets.length} лист(а), ${Math.round(g.nest.util * 100)}% използване</h3>`;
      g.nest.sheets.forEach((s, i) => (html += `<div class="keep" style="margin:6px 0 12px"><div class="meta">Лист ${i + 1} · ${s.placed.length} детайла · ${Math.round(s.util * 100)}%</div>${sheetSvgPrint(s)}</div>`));
    }
    html += `<h3>Разкройна листа</h3><table><thead><tr><th>№</th><th>Детайл</th><th>Материал</th><th class="r">Д</th><th class="r">Ш</th><th class="r">Бр</th><th>Шарка</th><th>Кант Д1/Д2/Ш1/Ш2</th></tr></thead><tbody>`;
    cutRowsAggregated().forEach((r, i) => {
      const k = [r.e.L1, r.e.L2, r.e.W1, r.e.W2].map((v) => (v ? String(v).replace('.', ',') : '–')).join(' / ');
      html += `<tr><td>${i + 1}</td><td>${esc(r.name)}<br><span style="color:#777;font-size:10px">${r.pids.join(' ')}</span></td><td style="font-size:10.5px">${esc(r.mat)}</td><td class="r">${r.L}</td><td class="r">${r.W}</td><td class="r">${r.qty}</td><td>${r.grain}</td><td>${k}</td></tr>`;
    });
    html += `</tbody></table></div>`;
    return pdfFrom(html, slug() + '-razkroi.pdf');
  }

  function labelsHtml() {
    const parts = S.built.parts;
    const pages = [];
    for (let i = 0; i < parts.length; i += 24) pages.push(parts.slice(i, i + 24));
    const kant = (p) => {
      const e = Object.entries(p.edges).filter(([, v]) => v);
      return e.length ? 'Кант ' + e.map(([k, v]) => k.replace('L', 'Д').replace('W', 'Ш') + ' ' + String(v).replace('.', ',')).join(', ') : 'без кант';
    };
    const matShort = (p) => {
      if (p.mat === 'hdf') return 'HDF 3 мм';
      const zm = M.zone(S.project.mats, p.zone);
      if (p.mat === 'front' && M.frontType(zm.frontType).painted) return 'МДФ ' + M.frontName(S.project.mats, p.zone);
      const b = M.board(p.mat === 'front' ? zm.frontDecor : S.project.mats.carcass);
      return b.brand + ' ' + b.name.split(' ')[0];
    };
    return `<div>${pages
      .map(
        (pg, pi) =>
          `<div class="labels-sheet" style="height:296mm;${pi < pages.length - 1 ? 'page-break-after:always;' : ''}">${pg
            .map((p) => `<div class="lab">${M.qrImg(qrText(p.pid))}<div><div class="l1">${p.pid} · ${esc(p.module)}</div><div class="l2"><b>${esc(p.name)}</b><br>${esc(matShort(p))}<br>${esc(kant(p))}</div><div class="l3">${Math.round(p.L)} × ${Math.round(p.W)}</div></div></div>`)
            .join('')}</div>`
      )
      .join('')}</div>`;
  }

  M.on('ready', () => {
    $('#expCsv').addEventListener('click', exportCsv);
    $('#expCutPdf').addEventListener('click', () => exportCutPdf().catch((e) => M.toast('PDF не се създаде: ' + e.message)));
    $('#expLabels').addEventListener('click', () => pdfFrom(labelsHtml(), slug() + '-etiketi.pdf', { margin: 0, width: '210mm', scale: 3, pagebreak: ['css'] }).catch((e) => M.toast('PDF не се създаде: ' + e.message)));
    $('#offerPdf').addEventListener('click', () => {
      if (!S.shot && M.view3d) S.shot = M.view3d.snapshot();
      pdfFrom(M.offerHTML(S.shot), slug() + '-oferta.pdf').catch((e) => M.toast('PDF не се създаде: ' + e.message));
    });
    // проект
    $('#projSave').addEventListener('click', () => M.saveFile(slug() + '.json', JSON.stringify(S.project, null, 1), 'application/json'));
    $('#projSave2').addEventListener('click', () => M.saveFile(slug() + '.json', JSON.stringify(S.project, null, 1), 'application/json'));
    $('#arGlb2').addEventListener('click', () => $('#arGlb').click());
    $('#projOpen').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        const p = JSON.parse(await f.text());
        if (!p.room || !p.mats) throw new Error();
        loadProject(p);
        M.toast('Проектът е отворен');
      } catch (err) {
        M.toast('Файлът не е проект на Модулия');
      }
    });
    $('#projNew').addEventListener('click', () => {
      loadProject(M.defaultProject());
      M.toast('Започнат е нов проект');
    });
  });

  function loadProject(p, opts = {}) {
    S.project = p;
    S.selFeature = S.selModule = null;
    S.project.look = Object.assign({}, M.DEFAULT_LOOK, S.project.look || {});
    M.syncRoomForm();
    M.renderMaterials();
    if (M.syncLook) M.syncLook();
    M.recompute({ instant: true, reframe: true });
    if (!opts.stay) M.setView(S.mode === 'pro' ? 'project' : 'builder');
  }
  M.loadProject = loadProject;
  M.cleanRoom = (r) => cleanRoom(r);

  /* ---------- AI от скица ---------- */
  let aiBlob = null;
  let aiIsSample = false;
  let aiCtl = null;
  let offView = null;

  function drawSampleSketch() {
    const c = document.createElement('canvas');
    c.width = 1200;
    c.height = 900;
    const g = c.getContext('2d');
    g.fillStyle = '#fbfaf5';
    g.fillRect(0, 0, 1200, 900);
    g.strokeStyle = 'rgba(80,120,200,.18)';
    for (let y = 40; y < 900; y += 36) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(1200, y);
      g.stroke();
    }
    let seed = 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - 0.5) * 4;
    const line = (x1, y1, x2, y2, w = 3) => {
      g.lineWidth = w;
      g.strokeStyle = '#2b2b33';
      g.beginPath();
      g.moveTo(x1 + rnd(), y1 + rnd());
      const n = 6;
      for (let i = 1; i <= n; i++) g.lineTo(x1 + ((x2 - x1) * i) / n + rnd(), y1 + ((y2 - y1) * i) / n + rnd());
      g.stroke();
    };
    const txt = (s, x, y, size = 34, rot = 0) => {
      g.save();
      g.translate(x, y);
      g.rotate(rot);
      g.fillStyle = '#1d2a6b';
      g.font = `italic ${size}px "Comic Sans MS", "Segoe Print", cursive`;
      g.fillText(s, 0, 0);
      g.restore();
    };
    // стени: A отгоре (360 см), B отдясно (300 см)
    line(150, 170, 1010, 170, 6);
    line(1010, 170, 1010, 800, 6);
    line(150, 170, 150, 260, 3);
    txt('A = 360 см', 470, 120, 40);
    txt('B = 300 см', 1045, 520, 40, Math.PI / 2);
    // прозорец на A
    line(410, 155, 670, 155, 3);
    line(410, 185, 670, 185, 3);
    line(410, 155, 410, 185, 3);
    line(670, 155, 670, 185, 3);
    txt('прозорец 110 см, перваз 100', 360, 235, 26);
    txt('от 110 см', 420, 270, 24);
    // вода под прозореца
    g.fillStyle = '#2a7de1';
    g.beginPath();
    g.arc(545, 215, 12, 0, 7);
    g.fill();
    txt('вода ~165 см', 500, 315, 26);
    // ток и абсорбатор на B
    txt('ток + абсорбатор', 760, 640, 26);
    txt('на 150 см от ъгъла', 760, 674, 24);
    line(990, 650, 960, 650, 3);
    g.fillStyle = '#d99400';
    g.fillRect(975, 640, 22, 22);
    txt('таван 260', 200, 760, 30);
    txt('хладилник в колона, съдомиялна', 200, 820, 28);
    return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.9));
  }

  async function shrinkImage(file) {
    if (!file) throw new Error('Няма файл');
    let src = null,
      w = 0,
      h = 0,
      url = null;
    try {
      // createImageBitmap спазва ориентацията от EXIF и е по-бърз на телефони
      src = await createImageBitmap(file, { imageOrientation: 'from-image' });
      w = src.width;
      h = src.height;
    } catch (e) {
      url = URL.createObjectURL(file);
      src = await new Promise((res, rej) => {
        const i = new Image();
        i.onload = () => res(i);
        i.onerror = () => rej(new Error(/heic|heif/i.test(file.type + file.name) ? 'heic' : 'decode'));
        i.src = url;
      }).finally(() => {});
      w = src.naturalWidth;
      h = src.naturalHeight;
    }
    try {
      if (!w || !h) throw new Error('decode');
      const k = Math.min(1, 1600 / Math.max(w, h));
      const c = document.createElement('canvas');
      c.width = Math.round(w * k);
      c.height = Math.round(h * k);
      c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
      const blob = await new Promise((r) => c.toBlob(r, 'image/jpeg', 0.88));
      if (!blob) throw new Error('decode');
      return blob;
    } finally {
      if (url) URL.revokeObjectURL(url);
      if (src && src.close) src.close();
    }
  }
  M.photoError = (e) => (e && e.message === 'heic' ? 'Снимката е във формат HEIC. Избери я от „Снимки“ на телефона или я запази като JPG.' : 'Снимката не може да се отвори. Опитай с друга снимка (JPG или PNG).');
  // Пускане на файл с мишката върху полетата за снимка
  document.addEventListener('dragover', (e) => {
    const d = e.target.closest && e.target.closest('label.drop[for]');
    if (d) e.preventDefault(), d.classList.add('over');
  });
  document.addEventListener('dragleave', (e) => {
    const d = e.target.closest && e.target.closest('label.drop[for]');
    if (d) d.classList.remove('over');
  });
  document.addEventListener('drop', (e) => {
    const d = e.target.closest && e.target.closest('label.drop[for]');
    if (!d) return;
    e.preventDefault();
    d.classList.remove('over');
    const inp = document.getElementById(d.htmlFor);
    if (!inp || !e.dataTransfer || !e.dataTransfer.files.length) return;
    try {
      inp.files = e.dataTransfer.files;
      inp.dispatchEvent(new Event('change', { bubbles: true }));
    } catch (err) {}
  });


  function setAiImage(blob, sample) {
    aiBlob = blob;
    aiIsSample = sample;
    const img = $('#aiPreview');
    img.src = URL.createObjectURL(blob);
    img.hidden = false;
    img.alt = sample ? 'Примерна скица' : 'Твоята снимка';
    $('#aiDropText').innerHTML = sample ? '<span class="pill">примерна скица</span> <span class="small muted">или качи своя</span>' : '<span class="small muted">Натисни, за да смениш снимката</span>';
  }

  const SAMPLE_RESULT = {
    shape: 'L',
    wallA: 3600,
    wallB: 3000,
    height: 2600,
    features: [
      { type: 'window', wall: 'A', x: 1100, w: 1100, sill: 1000, h: 1350 },
      { type: 'water', wall: 'A', x: 1650 },
      { type: 'power', wall: 'B', x: 1500 },
      { type: 'hood', wall: 'B', x: 1500 },
    ],
    confidence: 'high',
    notes: 'Демо резултат за примерната скица. Височината на прозореца е приета 135 см.',
    variants: [
      { name: 'Скандинавска', description: 'Светли маслинени фронтове, дъбов плот и бял корпус.', opts: { fridge: true, ovenTall: false, dishwasher: true, uppers: true, wallH: 720 }, mats: { carcass: 'egger-w1000', frontType: 'mdf-mat', frontColor: 'sage', worktop: 'wt-oak', handle: 'bar' } },
      { name: 'Графит и дърво', description: 'Тъмни матови фронтове, фурна в колона и кръгли дръжки.', opts: { fridge: true, ovenTall: true, dishwasher: true, uppers: true, wallH: 900 }, mats: { carcass: 'egger-u708', frontType: 'mdf-mat', frontColor: 'graphite', worktop: 'wt-oak', handle: 'knob' } },
      { name: 'Бюджетна', description: 'ПДЧ фронтове Дъб Сонома, обков GTV и без горни шкафове до прозореца.', opts: { fridge: true, ovenTall: false, dishwasher: true, uppers: true, wallH: 720 }, mats: { carcass: 'krono-white', frontType: 'pdch', frontDecor: 'krono-sonoma', worktop: 'wt-concrete', handle: 'bar', hardware: 'gtv' } },
    ],
  };

  function aiPrompt(notes) {
    const C = M.CATALOG;
    return `You are an experienced kitchen planner in Bulgaria. Read the attached image: a photo of a room or a hand-drawn sketch (floor plan or wall elevation). Labels may be in Bulgarian; measurements may be in cm or mm. Convert everything to millimetres.

Coordinate rules:
- Wall A is the main cabinet wall. For an L-shaped kitchen, wall B is the second cabinet wall and meets wall A at A's RIGHT end (as seen when facing wall A). If the drawing has the second wall on the left, mirror it.
- Positions on wall A: mm from A's LEFT end. Positions on wall B: mm from the corner with A.
- Window x = left edge; water/power/hood x = centre.
- If a value is not shown, estimate a typical one (ceiling 2600, sill 950, window height 1300) and say so in notes.

Then propose exactly 3 different design variants for this room using ONLY these keys:
carcass: ${C.boards.map((b) => b.key).join(', ')}
frontType: ${C.frontTypes.map((f) => f.key).join(', ')}
frontColor (for mdf-*): ${C.paintColors.map((c) => c.key).join(', ')}
frontDecor (for pdch): ${C.boards.map((b) => b.key).join(', ')}
worktop: ${C.worktops.map((w) => w.key).join(', ')}
handle: ${C.handles.map((h) => h.key).join(', ')}
hardware: ${C.hardwareBrands.map((h) => h.key).join(', ')}

User notes (Bulgarian, may be empty): ${notes || '-'}

Reply with ONLY this JSON (names, descriptions and notes in Bulgarian):
{"shape":"I or L","wallA":3600,"wallB":3000,"height":2600,
"features":[{"type":"window","wall":"A","x":1100,"w":1100,"sill":1000,"h":1350},{"type":"water","wall":"A","x":1650},{"type":"power","wall":"B","x":1500},{"type":"hood","wall":"B","x":1500}],
"confidence":"high|medium|low","notes":"кратко какво е прието",
"variants":[{"name":"...","description":"едно изречение","opts":{"fridge":true,"ovenTall":false,"dishwasher":true,"uppers":true,"wallH":720},"mats":{"carcass":"...","frontType":"...","frontColor":"...","frontDecor":"...","worktop":"...","handle":"...","hardware":"..."}}]}`;
  }

  function cleanRoom(r) {
    const n = (v, d, lo, hi) => {
      v = Math.round(+v);
      return Number.isFinite(v) ? Math.max(lo, Math.min(hi, v)) : d;
    };
    const shape = r.shape === 'L' ? 'L' : 'I';
    const room = { shape, wallA: n(r.wallA, 3600, 1200, 8000), wallB: n(r.wallB, 2800, 1200, 8000), height: n(r.height, 2600, 2200, 4000), features: [], opts: Object.assign({}, S.project.room.opts) };
    const seen = {};
    for (const f of Array.isArray(r.features) ? r.features : []) {
      if (!['window', 'water', 'power', 'hood'].includes(f.type)) continue;
      const wall = shape === 'L' && f.wall === 'B' ? 'B' : 'A';
      const len = wall === 'A' ? room.wallA : room.wallB;
      if (f.type !== 'window') {
        if (seen[f.type]) continue;
        seen[f.type] = 1;
        room.features.push({ id: M.uid('f'), type: f.type, wall, x: n(f.x, len / 2, 50, len - 50) });
      } else {
        const w = n(f.w, 1000, 300, len);
        room.features.push({ id: M.uid('f'), type: 'window', wall, w, x: n(f.x, 0, 0, len - w), sill: n(f.sill, 950, 0, 2000), h: n(f.h, 1300, 300, 2500) });
      }
    }
    return room;
  }

  function variantProject(room, v) {
    const C = M.CATALOG;
    const pick = (val, list, d) => (list.some((x) => x.key === val) ? val : d);
    const base = S.project.mats;
    const m = v.mats || {};
    const mats = {
      carcass: pick(m.carcass, C.boards, base.carcass),
      frontType: pick(m.frontType, C.frontTypes, base.frontType),
      frontColor: pick(m.frontColor, C.paintColors, base.frontColor),
      frontDecor: pick(m.frontDecor, C.boards, base.frontDecor),
      worktop: pick(m.worktop, C.worktops, base.worktop),
      handle: pick(m.handle, C.handles, base.handle),
      hardware: pick(m.hardware, C.hardwareBrands, base.hardware),
    };
    const o = v.opts || {};
    const r = JSON.parse(JSON.stringify(room));
    r.opts = Object.assign({}, r.opts, { fridge: !!o.fridge, ovenTall: !!o.ovenTall, dishwasher: o.dishwasher !== false, uppers: o.uppers !== false, wallH: o.wallH === 900 ? 900 : 720 });
    const p = { id: S.project.id, name: v.name, auto: true, room: r, modules: [], mats };
    p.modules = M.autoLayout(r).modules;
    return p;
  }

  async function showAiResult(res) {
    const room = cleanRoom(res);
    const feats = room.features.map((f) => `${M.FEAT[f.type].label} (${f.wall}, ${f.type === 'window' ? f.x + '–' + (f.x + f.w) : f.x} мм)`).join(' · ');
    $('#aiRoom').innerHTML = `<div class="row" style="justify-content:space-between"><h3>Разчетено от изображението</h3><span class="pill ${res.confidence === 'high' ? 'ok' : res.confidence === 'low' ? 'warn' : ''}">сигурност: ${esc(res.confidence === 'high' ? 'висока' : res.confidence === 'low' ? 'ниска' : 'средна')}</span></div>
      <p style="margin:6px 0"><b>${room.shape === 'L' ? 'Г-образна' : 'Права'}</b> · A ${room.wallA} мм${room.shape === 'L' ? ' · B ' + room.wallB + ' мм' : ''} · височина ${room.height} мм</p>
      <p class="small muted" style="margin:0">${esc(feats || 'Няма отбелязани точки')}</p>
      ${res.notes ? `<p class="small" style="margin:6px 0 0">${esc(res.notes)}</p>` : ''}`;
    const host = $('#aiVariants');
    host.innerHTML = '';
    const variants = (Array.isArray(res.variants) ? res.variants : []).slice(0, 3);
    if (!variants.length) variants.push({ name: 'Вариант', description: '', opts: room.opts, mats: S.project.mats });
    if (!offView) {
      const div = document.createElement('div');
      div.style.cssText = 'position:fixed;left:-5000px;top:0;width:640px;height:480px';
      document.body.appendChild(div);
      offView = new M.View3D(div, { size: [640, 480], lowRes: true });
    }
    for (const v of variants) {
      const p = variantProject(room, v);
      const built = M.buildProject(p);
      const groups = M.materialGroups(p, built);
      const pr = M.price(p, built, groups, M.prices());
      offView.setProject(p, built, {});
      const shot = offView.snapshot('image/jpeg', 0.85);
      const card = document.createElement('div');
      card.className = 'card variant';
      card.innerHTML = `<img src="${shot}" alt="${esc(v.name)}"><div class="pad"><div class="row" style="justify-content:space-between"><b>${esc(v.name)}</b><span class="mono">${M.eur(pr.gross)}</span></div><span class="small muted">${esc(v.description || '')}</span><button class="btn primary sm" style="margin-top:auto">Избери и редактирай</button></div>`;
      card.querySelector('button').addEventListener('click', () => {
        loadProject(Object.assign(p, { modules: [] }));
        M.toast('Вариантът е зареден. Можеш да го редактираш.');
      });
      host.appendChild(card);
    }
  }

  M.on('ready', () => {
    $('#aiFile').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      try {
        setAiImage(await shrinkImage(f), false);
      } catch (err) {
        M.toast(M.photoError(err), 5000);
      }
    });
    $('#aiSample').addEventListener('click', async () => {
      setAiImage(await drawSampleSketch(), true);
      $('#aiStatus').textContent = 'Заредена е примерна скица. Натисни „Разчети и предложи“.';
    });
    $('#aiRun').addEventListener('click', async () => {
      const st = $('#aiStatus');
      if (!aiBlob) {
        st.textContent = 'Първо качи снимка или скица.';
        return;
      }
      const btn = $('#aiRun');
      btn.disabled = true;
      st.innerHTML = '<span class="spinner"></span> AI разчита изображението. Обикновено отнема 20–60 секунди.';
      try {
        if (!(await M.aiMode())) {
          if (aiIsSample) {
            await showAiResult(SAMPLE_RESULT);
            st.textContent = 'Показан е демо резултат. AI работи на modulia-bg.netlify.app и в Claude.';
          } else st.textContent = M.aiError({ code: 'unavailable' });
          return;
        }
        aiCtl = new AbortController();
        const res = await M.aiJSON('sketch', aiPrompt($('#aiNotes').value.trim()), aiBlob, aiCtl.signal);
        if (!res || !res.wallA) throw { code: 'invalid_json' };
        await showAiResult(res);
        st.textContent = 'Готово. Провери размерите и избери вариант.';
      } catch (e) {
        st.textContent = M.aiError(e);
      } finally {
        btn.disabled = false;
      }
    });
  });

  /* ---------- Преглед в стаята (снимка + 3D в реален мащаб) ---------- */
  const AR = { view: null, img: null, taps: [], off: { x: 0, y: 0 }, ready: false };
  const OW = 1400,
    OH = 1000;

  function arEnsureView() {
    if (AR.view) return;
    const ov = document.createElement('div');
    ov.className = 'ov';
    ov.style.width = OW + 'px';
    ov.style.height = OH + 'px';
    ov.hidden = true;
    $('#arStage').appendChild(ov);
    AR.ov = ov;
    AR.view = new M.View3D(ov, { transparent: true, ortho: true, noControls: true, size: [OW, OH] });
  }

  function arRender() {
    if (!AR.view || !AR.ready) return;
    const P = S.project;
    const v = AR.view;
    v.setProject(P, S.built, { room: false });
    const LA = P.room.wallA / 1000;
    const LB = P.room.shape === 'L' ? P.room.wallB / 1000 : 0.6;
    const span = Math.max(LA, LB) + 1.2;
    const hw = span / 2,
      hh = (hw * OH) / OW;
    const cam = v.camera;
    cam.left = -hw;
    cam.right = hw;
    cam.top = hh;
    cam.bottom = -hh;
    cam.near = 0.01;
    cam.far = 50;
    const yaw = (+$('#arYaw').value * Math.PI) / 180;
    const pitch = (+$('#arPitch').value * Math.PI) / 180;
    const target = new THREE.Vector3(LA / 2, 1.1, 0.3);
    const D = 10;
    cam.position.set(target.x + D * Math.sin(yaw) * Math.cos(pitch), target.y + D * Math.sin(pitch), target.z + D * Math.cos(yaw) * Math.cos(pitch));
    cam.lookAt(target);
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    v.renderNow();
    // калибровка: подът при двата края на стена A
    const proj = (x) => {
      const p = new THREE.Vector3(x, 0, 0).project(cam);
      return { x: ((p.x + 1) / 2) * OW, y: ((1 - p.y) / 2) * OH };
    };
    const c0 = proj(0),
      c1 = proj(LA);
    const st = $('#arStage');
    const W = st.clientWidth,
      H = st.clientHeight;
    const t0 = { x: AR.taps[0].fx * W, y: AR.taps[0].fy * H },
      t1 = { x: AR.taps[1].fx * W, y: AR.taps[1].fy * H };
    const s = (Math.hypot(t1.x - t0.x, t1.y - t0.y) / Math.max(1, Math.hypot(c1.x - c0.x, c1.y - c0.y))) * (+$('#arScale').value / 100);
    const tx = t0.x - c0.x * s + AR.off.x,
      ty = t0.y - c0.y * s + AR.off.y;
    AR.ov.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
    AR.tf = { tx, ty, s };
    AR.ov.style.opacity = +$('#arOpacity').value / 100;
    AR.ov.hidden = false;
  }

  // Сцената е точно колкото снимката и се побира в екрана (вертикалните снимки от телефон не излизат извън него)
  function arFit() {
    const st = $('#arStage');
    const img = AR.img;
    if (!img || !img.naturalWidth) {
      st.style.width = '100%';
      st.style.height = '';
      return;
    }
    const phone = st.parentElement;
    const cs = getComputedStyle(phone);
    const availW = Math.max(200, phone.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight));
    const maxH = Math.max(300, window.innerHeight * (window.innerWidth < 700 ? 0.68 : 0.78));
    const ratio = img.naturalHeight / img.naturalWidth;
    const w = Math.min(availW, maxH / ratio);
    st.style.width = Math.round(w) + 'px';
    st.style.height = Math.round(w * ratio) + 'px';
  }

  let hintT = 0;
  function arHint(t, autoHide) {
    const h = $('#arHint');
    h.textContent = t;
    h.hidden = false;
    clearTimeout(hintT);
    if (autoHide) hintT = setTimeout(() => (h.hidden = true), 4500);
    const e = $('#arEmpty');
    if (e) e.hidden = true;
  }
  function arMarks() {
    $$('#arStage .tap').forEach((x) => x.remove());
    const st = $('#arStage');
    for (const t of AR.taps) {
      const d = document.createElement('div');
      d.className = 'tap';
      d.style.left = t.fx * 100 + '%';
      d.style.top = t.fy * 100 + '%';
      st.appendChild(d);
    }
  }

  M.on('ready', () => {
    const st = $('#arStage');
    $('#arFile').addEventListener('change', (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      if (AR.img) AR.img.remove();
      const img = new Image();
      img.className = 'photo';
      img.alt = 'Снимка на стената';
      img.onload = () => {
        st.style.minHeight = '0';
        arFit();
        AR.taps = [];
        AR.off = { x: 0, y: 0 };
        AR.ready = false;
        if (AR.ov) AR.ov.hidden = true;
        arMarks();
        arHint('Натисни долния ЛЯВ ъгъл на стена A (където стената среща пода).');
        $('#arRecal').disabled = false;
      };
      img.onerror = () => {
        img.remove();
        if (AR.img === img) AR.img = null;
        M.toast(M.photoError(new Error(/heic|heif/i.test(f.type + f.name) ? 'heic' : 'decode')), 5000);
      };
      img.src = URL.createObjectURL(f);
      st.insertBefore(img, st.firstChild);
      AR.img = img;
    });
    $('#arRecal').addEventListener('click', () => {
      AR.taps = [];
      AR.off = { x: 0, y: 0 };
      AR.ready = false;
      if (AR.ov) AR.ov.hidden = true;
      arMarks();
      arHint('Натисни долния ЛЯВ ъгъл на стена A.');
    });
    let drag = null;
    st.addEventListener('pointerdown', (e) => {
      if (!AR.img) return;
      const r = st.getBoundingClientRect();
      if (AR.taps.length < 2) {
        AR.taps.push({ fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height });
        arMarks();
        if (AR.taps.length === 1) arHint('Сега натисни долния ДЕСЕН ъгъл на стена A.');
        else {
          arEnsureView();
          AR.ready = true;
          arRender();
          arHint('Готово. Влачи, за да наместиш. Нагласи завъртането и наклона отляво.', true);
          setTimeout(() => $$('#arStage .tap').forEach((x) => x.remove()), 1500);
        }
        return;
      }
      drag = { x: e.clientX, y: e.clientY, ox: AR.off.x, oy: AR.off.y };
      st.setPointerCapture(e.pointerId);
    });
    st.addEventListener('pointermove', (e) => {
      if (!drag) return;
      AR.off.x = drag.ox + (e.clientX - drag.x);
      AR.off.y = drag.oy + (e.clientY - drag.y);
      arRender();
    });
    const end = () => (drag = null);
    st.addEventListener('pointerup', end);
    st.addEventListener('pointercancel', end);
    for (const [id, suf] of [
      ['arYaw', '°'],
      ['arPitch', '°'],
      ['arScale', '%'],
      ['arOpacity', '%'],
    ])
      $('#' + id).addEventListener('input', (e) => {
        $('#' + id + 'V').textContent = e.target.value + suf;
        arRender();
      });
    new ResizeObserver(() => arRender()).observe(st);
    new ResizeObserver(() => arFit()).observe(st.parentElement);
    window.addEventListener('resize', arFit);
    M.on('changed', () => {
      if (S.view === 'ar') arRender();
    });
    M.on('view', (v) => v === 'ar' && (arFit(), arRender()));

    // 3D / AR модел
    const freshGLB = () => {
      M.view3d.setProject(S.project, S.built, { keepCamera: true });
      return M.view3d.exportGLB();
    };
    $('#arGlb').addEventListener('click', async () => {
      if (!M.view3d) return M.toast('3D изгледът не е готов');
      try {
        const blob = await freshGLB();
        M.saveFile(slug() + '.glb', blob, 'model/gltf-binary');
      } catch (e) {
        M.toast('Моделът не може да се експортира');
      }
    });
    $('#arLive').addEventListener('click', async () => {
      if (!M.view3d) return M.toast('3D изгледът не е готов');
      const modal = document.createElement('div');
      modal.className = 'modal';
      modal.innerHTML = `<div class="card pad stack wide"><div class="row" style="justify-content:space-between"><h3>Кухнята в реален размер</h3><button class="btn sm" data-x>Затвори</button></div><div id="mvHost"><div class="empty"><span class="spinner"></span> Зареждам модела…</div></div><p class="small muted" id="mvNote" style="margin:0"></p></div>`;
      document.body.appendChild(modal);
      const close = () => modal.remove();
      modal.querySelector('[data-x]').addEventListener('click', close);
      modal.addEventListener('click', (e) => e.target === modal && close());
      try {
        const [blob] = await Promise.all([freshGLB(), M.loadScript(LIB.mv, true)]);
        await customElements.whenDefined('model-viewer');
        const url = URL.createObjectURL(blob);
        const mv = document.createElement('model-viewer');
        mv.setAttribute('src', url);
        mv.setAttribute('alt', '3D модел на кухнята');
        mv.setAttribute('ar', '');
        mv.setAttribute('ar-modes', 'webxr quick-look');
        mv.setAttribute('ar-scale', 'fixed');
        mv.setAttribute('style', 'width:100%;height:min(60vh,460px);background:#eef1f6;border-radius:14px');
        mv.setAttribute('ar-placement', 'floor');
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('shadow-intensity', '1');
        mv.setAttribute('exposure', '1.05');
        const host = modal.querySelector('#mvHost');
        host.innerHTML = '';
        host.appendChild(mv);
        mv.addEventListener('load', () => {
          const note = modal.querySelector('#mvNote');
          if (mv.canActivateAR) {
            note.innerHTML = 'Натисни бутона долу и насочи телефона към пода. Кухнята се появява в реален размер.';
            const go = document.createElement('button');
            go.className = 'btn primary lg';
            go.innerHTML = '<svg class="ic"><use href="#i-ar"/></svg>Постави в стаята';
            go.addEventListener('click', () => mv.activateAR());
            note.after(go);
          } else {
            const mob = /Android|iPhone|iPad/i.test(navigator.userAgent);
            note.innerHTML = mob
              ? 'Този браузър няма достъп до AR. На iPhone отвори сайта в Safari, на Android в Chrome (с Google Play Services for AR).'
              : `Завърти модела с мишката. За AR в стаята отвори Модулия на телефона: <span style="display:inline-block;width:110px;height:110px;background:#fff;padding:6px;border-radius:10px;vertical-align:middle;margin-left:8px">${M.qrSvg('https://modulia-bg.netlify.app/#ar')}</span>`;
          }
        });
        mv.addEventListener('error', () => (modal.querySelector('#mvNote').textContent = 'Моделът не се зареди в този изглед. Свали .glb файла и го отвори в AR приложение.'));
      } catch (e) {
        modal.querySelector('#mvHost').innerHTML = '<div class="empty">3D прегледът не се зареди. Свали .glb файла и го отвори в AR приложение.</div>';
      }
    });
  });

  // снимката и снимката с 3D макета, за фотореалистичния рендер
  M.arComposite = async function () {
    if (!AR.img || !AR.ready || !AR.view || !AR.tf) return null;
    const img = AR.img;
    const k0 = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
    const W = Math.round(img.naturalWidth * k0),
      H = Math.round(img.naturalHeight * k0);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0, W, H);
    const photo = c.toDataURL('image/jpeg', 0.88);
    AR.view.renderNow();
    const k = W / $('#arStage').clientWidth;
    g.globalAlpha = Math.max(0.85, +$('#arOpacity').value / 100);
    g.drawImage(AR.view.renderer.domElement, AR.tf.tx * k, AR.tf.ty * k, OW * AR.tf.s * k, OH * AR.tf.s * k);
    return { photo, composite: c.toDataURL('image/jpeg', 0.88) };
  };

  M.arLoad = function (blob, corners) {
    const st = $('#arStage');
    if (AR.img) AR.img.remove();
    const img = new Image();
    img.className = 'photo';
    img.alt = 'Снимка на твоята кухня';
    img.onload = () => {
      st.style.minHeight = '0';
      arFit();
      AR.off = { x: 0, y: 0 };
      $('#arRecal').disabled = false;
      const ok = corners && corners.left && corners.right && corners.right[0] > corners.left[0];
      if (ok) {
        AR.taps = [
          { fx: corners.left[0], fy: corners.left[1] },
          { fx: corners.right[0], fy: corners.right[1] },
        ];
        arEnsureView();
        AR.ready = true;
        arRender();
        arHint('Новата кухня е поставена върху снимката. Ако не съвпада, маркирай ъглите отново или влачи.', true);
      } else {
        AR.taps = [];
        AR.ready = false;
        if (AR.ov) AR.ov.hidden = true;
        arHint('Натисни долния ЛЯВ ъгъл на стената, където ще е кухнята.');
      }
      arMarks();
    };
    img.src = URL.createObjectURL(blob);
    st.insertBefore(img, st.firstChild);
    AR.img = img;
  };

  /* ---------- Сглобяване ---------- */
  const ASM = { view: null, modId: null, step: 0, part: null, explode: 0, playing: false, timer: 0 };

  function asmEnsure() {
    if (ASM.view) return;
    ASM.view = new M.View3D($('#asm3d'), { bg: '#eef0f5' });
  }
  function asmModules() {
    return S.project.modules.filter((m) => m.type !== 'gap');
  }

  function edgeSvg(p) {
    const c = (v) => (v === 2 ? 'var(--kant)' : v === 0.8 ? 'rgba(255,181,71,.6)' : 'var(--line-2)');
    const w = (v) => (v ? (v === 2 ? 6 : 4) : 1.5);
    return `<svg class="edgesvg" viewBox="0 0 120 70" aria-label="Кант по ръбовете"><rect x="14" y="10" width="92" height="44" style="fill:rgba(255,255,255,.06)"/>
      <line x1="14" y1="10" x2="106" y2="10" style="stroke:${c(p.edges.L1)}" stroke-width="${w(p.edges.L1)}"/><line x1="14" y1="54" x2="106" y2="54" style="stroke:${c(p.edges.L2)}" stroke-width="${w(p.edges.L2)}"/>
      <line x1="14" y1="10" x2="14" y2="54" style="stroke:${c(p.edges.W1)}" stroke-width="${w(p.edges.W1)}"/><line x1="106" y1="10" x2="106" y2="54" style="stroke:${c(p.edges.W2)}" stroke-width="${w(p.edges.W2)}"/>
      <text x="60" y="68" font-size="9" text-anchor="middle" style="fill:var(--muted)">Д ${Math.round(p.L)} · Ш ${Math.round(p.W)}</text></svg>`;
  }

  const HW_SHORT = { confirmat: 'Конфирмат 7×50', screw: 'Винт 4×16', hinge: 'Панта', leg: 'Краче', hanger: 'Окачвач', shelfPin: 'Рафтоносач', nail: 'Скоба', drawer: 'Водачи', handle: 'Дръжка', pullout: 'Механизъм' };

  function asmRender(opts = {}) {
    asmEnsure();
    const mods = asmModules();
    if (!mods.length) return;
    if (!ASM.modId || !mods.find((m) => m.id === ASM.modId)) ASM.modId = mods[0].id;
    const mod = mods.find((m) => m.id === ASM.modId);
    const res = S.built.perModule[mod.id];
    ASM.step = Math.max(0, Math.min(res.steps.length - 1, ASM.step));
    $('#asmModules').innerHTML = mods.map((m) => `<button class="chip" data-m="${m.id}" aria-pressed="${m.id === ASM.modId}" title="${esc(M.typeLabel(m.type))}">${m.code}</button>`).join('');
    $$('#asmModules .chip').forEach((b) =>
      b.addEventListener('click', () => {
        asmStop();
        ASM.modId = b.dataset.m;
        ASM.step = 0;
        ASM.part = null;
        asmRender();
      })
    );
    $('#asmTitle').textContent = `${mod.code} · ${M.typeLabel(mod.type)} · ${mod.w} мм`;
    $('#asmStepBadge').textContent = `Стъпка ${ASM.step + 1} / ${res.steps.length}`;
    const step = res.steps[ASM.step];
    const highlight = ASM.part !== null ? new Set([ASM.part]) : undefined;
    ASM.view.showModule(S.project, mod, res, { step: ASM.part !== null ? res.steps.length - 1 : ASM.step, animate: !!opts.animate, explode: ASM.explode, part: ASM.part, highlight, keepCamera: !!opts.keepCamera });
    // значка с обкова
    const hw = Object.entries(step.hw || {}).filter(([, q]) => q);
    const sb = $('#asmScrew');
    if (hw.length && ASM.part === null) {
      const [k, q] = hw[0];
      sb.innerHTML = `<svg class="ic"><use href="#i-screw"/></svg><b>${Math.round(q)}×</b>${esc(HW_SHORT[k] || M.HW_LABEL[k] || k)}`;
      sb.hidden = false;
      if (window.gsap && opts.animate) gsap.fromTo(sb, { scale: 0.6, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2)' });
    } else sb.hidden = true;
    // стъпки
    $('#asmSteps').innerHTML = res.steps
      .map((s, i) => {
        const h = Object.entries(s.hw || {})
          .filter(([, q]) => q)
          .map(([k, q]) => `${M.HW_LABEL[k] || k} × ${Math.round(q)}`)
          .join(' · ');
        return `<button class="step${i < ASM.step ? ' done' : ''}" data-s="${i}" aria-pressed="${ASM.part === null && i === ASM.step}"><span class="k">${i + 1}</span><span>${esc(s.t)}${h ? `<small>${esc(h)}</small>` : ''}</span></button>`;
      })
      .join('');
    $$('#asmSteps .step').forEach((b) =>
      b.addEventListener('click', () => {
        asmStop();
        ASM.step = +b.dataset.s;
        ASM.part = null;
        asmRender({ animate: true, keepCamera: true });
      })
    );
    const cur = $('#asmSteps .step[aria-pressed="true"]');
    if (cur) cur.scrollIntoView({ block: 'nearest' });
    // избран детайл
    const pp = ASM.part !== null ? res.parts[ASM.part] : null;
    if (pp) {
      const used = res.steps.map((s, i) => (s.p.includes(ASM.part) ? i + 1 : 0)).filter(Boolean);
      $('#asmPart').innerHTML = `<div class="partcard"><div class="qr">${M.qrSvg(qrText(pp.pid))}</div><div class="stack" style="gap:4px"><b class="mono" style="font-size:16px">${pp.pid} · ${esc(mod.code)}</b><span>${esc(pp.name)}</span><span class="small muted">${pp.mat === 'hdf' ? 'HDF 3 мм' : pp.mat === 'front' ? 'Фронт' : 'Корпус ПДЧ 18 мм'} · стъпки ${used.join(', ') || '—'}</span>${edgeSvg(pp)}</div></div><button class="btn sm" id="asmBack" style="margin-top:10px">Обратно към стъпките</button>`;
      $('#asmBack').onclick = () => {
        ASM.part = null;
        asmRender({ keepCamera: true });
      };
    } else {
      $('#asmPart').innerHTML = `<div class="stack" style="gap:6px"><b style="font-family:var(--f-display);font-size:17px">${ASM.step === 0 ? 'Всички детайли' : 'Стъпка ' + (ASM.step + 1)}</b><span class="small muted">${ASM.step === 0 ? 'Подреди детайлите по етикетите. Натисни ▶ за анимацията стъпка по стъпка.' : 'Новите детайли са в синьо. Сканирай етикет, за да видиш къде отива.'}</span></div>`;
    }
    const gparts = S.built.parts.filter((x) => x.moduleId === mod.id);
    $('#asmParts').innerHTML = gparts
      .map((p, i) => `<button class="pitem" data-i="${i}" aria-pressed="${ASM.part === i}"><span class="qr">${M.qrSvg(qrText(p.pid))}</span><span style="min-width:0"><b>${p.pid}</b><span>${esc(p.name)}</span><span class="mono">${Math.round(p.L)}×${Math.round(p.W)}</span></span></button>`)
      .join('');
    $$('#asmParts .pitem').forEach((b) =>
      b.addEventListener('click', () => {
        asmStop();
        ASM.part = ASM.part === +b.dataset.i ? null : +b.dataset.i;
        asmRender({ keepCamera: true });
      })
    );
    $('#asmPlay').innerHTML = `<svg class="ic"><use href="#i-${ASM.playing ? 'pause' : 'play'}"/></svg>`;
    $('#asmPlay').setAttribute('aria-label', ASM.playing ? 'Пауза' : 'Пусни анимацията');
  }

  function asmGo(d) {
    const mod = asmModules().find((m) => m.id === ASM.modId);
    if (!mod) return false;
    const n = S.built.perModule[mod.id].steps.length;
    const next = ASM.step + d;
    if (next < 0 || next >= n) return false;
    ASM.step = next;
    ASM.part = null;
    asmRender({ animate: d > 0, keepCamera: true });
    return true;
  }
  function asmStop() {
    ASM.playing = false;
    clearInterval(ASM.timer);
  }
  function asmPlay() {
    if (ASM.playing) {
      asmStop();
      asmRender({ keepCamera: true });
      return;
    }
    ASM.playing = true;
    ASM.part = null;
    const mod = asmModules().find((m) => m.id === ASM.modId);
    if (mod && ASM.step >= S.built.perModule[mod.id].steps.length - 1) ASM.step = 0;
    asmRender({ keepCamera: true });
    ASM.timer = setInterval(() => {
      if (!asmGo(1)) {
        asmStop();
        asmRender({ keepCamera: true });
      }
    }, 2400);
    setTimeout(() => ASM.playing && asmGo(1), 500);
  }

  function asmFindPid(pid) {
    pid = String(pid || '')
      .trim()
      .toUpperCase()
      .replace(/^Р/, 'P');
    if (/^\d+$/.test(pid)) pid = 'P' + pid.padStart(3, '0');
    const p = S.built.parts.find((x) => x.pid === pid);
    if (!p) {
      M.toast('Няма детайл ' + pid + ' в този проект');
      return;
    }
    if (!p.moduleId) {
      M.toast(`${pid} е ${p.name.toLowerCase()} за ${p.module}. Монтира се след шкафовете.`);
      return;
    }
    asmStop();
    ASM.modId = p.moduleId;
    const list = S.built.parts.filter((x) => x.moduleId === p.moduleId);
    ASM.part = list.indexOf(p);
    asmRender();
    M.toast(`${pid}: ${p.name} — ${p.module}`);
  }

  M.on('ready', () => {
    M.on('view', (v) => {
      if (v === 'assembly') asmRender();
      else asmStop();
    });
    M.on('changed', () => {
      if (S.view === 'assembly') asmRender({ keepCamera: true });
    });
    $('#asmPrev').addEventListener('click', () => (asmStop(), asmGo(-1)));
    $('#asmNext').addEventListener('click', () => (asmStop(), asmGo(1)));
    $('#asmPlay').addEventListener('click', asmPlay);
    $('#asmExplode').addEventListener('input', (e) => {
      ASM.explode = +e.target.value / 100;
      $('#asmExplodeV').textContent = e.target.value + '%';
      asmRender({ keepCamera: true });
    });
    $('#partSearch').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') asmFindPid(e.target.value);
    });
    $('#scanFile').addEventListener('change', async (e) => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      M.toast('Чета QR кода…');
      try {
        await M.loadScript(LIB.jsqr);
        const url = URL.createObjectURL(f);
        const img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = url;
        });
        let found = null;
        for (const max of [1200, 800, 1800]) {
          const k = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
          const c = document.createElement('canvas');
          c.width = Math.round(img.naturalWidth * k);
          c.height = Math.round(img.naturalHeight * k);
          const g = c.getContext('2d');
          g.drawImage(img, 0, 0, c.width, c.height);
          const d = g.getImageData(0, 0, c.width, c.height);
          found = window.jsQR(d.data, c.width, c.height, { inversionAttempts: 'attemptBoth' });
          if (found) break;
        }
        URL.revokeObjectURL(url);
        if (!found) return M.toast('Не открих QR код. Снимай етикета по-отблизо.');
        const parts = found.data.split('|');
        if (parts[0] !== 'MODULIA') return M.toast('Това не е етикет на Модулия');
        if (parts[1] !== S.project.id) M.toast('Етикетът е от друг проект (' + parts[1] + '). Търся детайла в текущия.');
        asmFindPid(parts[2]);
      } catch (err) {
        M.toast('Снимката не може да се прочете');
      }
    });
  });

  /* ---------- Запитвания ---------- */
  function requestPayload() {
    const P = S.project;
    const m = P.mats;
    const ft = M.frontType(m.frontType);
    return {
      name: $('#rqName').value.trim().slice(0, 80),
      phone: $('#rqPhone').value.trim().slice(0, 30),
      city: $('#rqCity').value,
      note: $('#rqNote').value.trim().slice(0, 600),
      total: Math.round(S.pr.gross * 100) / 100,
      summary: `${P.room.shape === 'L' ? 'Г-образна' : 'Права'} · A ${P.room.wallA}${P.room.shape === 'L' ? ' · B ' + P.room.wallB : ''} мм · ${P.modules.filter((x) => x.type !== 'gap').length} модула · ${M.board(m.carcass).brand} ${M.board(m.carcass).name} · ${M.frontsSummary(m)} · ${m.hardware.toUpperCase()}`,
      project: JSON.stringify(P),
      status: 'нова',
      createdAt: new Date().toISOString(),
    };
  }

  M.on('ready', () => {
    $('#reqForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const st = $('#rqStatus');
      const name = $('#rqName').value.trim(),
        phone = $('#rqPhone').value.trim();
      if (!name) return (st.textContent = 'Напиши името си.'), $('#rqName').focus();
      if (!/^[+\d][\d\s-]{6,}$/.test(phone)) return (st.textContent = 'Напиши телефон, на който цеховете да те потърсят.'), $('#rqPhone').focus();
      if (!$('#rqConsent').checked) return (st.textContent = 'Отбележи съгласието, за да изпратим данните на цеховете.');
      const btn = $('#rqSend');
      btn.disabled = true;
      st.innerHTML = '<span class="spinner"></span> Изпращам…';
      const payload = requestPayload();
      let sent = false;
      if (M.platform && M.platform.api) {
        try {
          await M.platform.sendRequest(payload);
          sent = true;
        } catch (err) {}
      }
      if (!sent) try {
        const [db, user] = await Promise.all([M.cap('db'), M.cap('user')]);
        const uid = user ? await user.id() : null;
        if (db && uid) {
          await db.doc('requests/' + uid).set(payload);
          sent = true;
        }
      } catch (err) {
        sent = false;
      }
      if (!sent) {
        const list = M.store.get('localRequests', []);
        list.unshift(Object.assign({ id: M.uid('r') }, payload));
        M.store.set('localRequests', list.slice(0, 30));
      }
      btn.disabled = false;
      M.loadScript(LIB.confetti)
        .then(() => {
          if (window.confetti && !matchMedia('(prefers-reduced-motion: reduce)').matches) window.confetti({ particleCount: 140, spread: 75, origin: { y: 0.7 }, colors: ['#2f6bff', '#5d8dff', '#ffb547', '#ffffff'] });
        })
        .catch(() => {});
      st.innerHTML = sent ? `<b style="color:var(--ok)">Запитването е изпратено.</b> Цехове в ${esc(payload.city)} ще се свържат с теб на ${esc(payload.phone)}.` : `<b>Запитването е записано в този браузър.</b> В публикуваната версия на Модулия то отива директно при цеховете. Можеш да го видиш в режим „Цех“ → Заявки.`;
    });
  });

  let inboxUnsub = null;
  async function renderInbox() {
    const note = $('#inboxNote');
    const host = $('#inboxList');
    const card = (r, remote) => {
      const d = new Date(r.createdAt);
      const el = document.createElement('div');
      el.className = 'card pad stack';
      el.innerHTML = `<div class="row" style="justify-content:space-between"><div><b>${esc(r.name)}</b> · <span class="muted">${esc(r.city)}</span></div><span class="pill ${r.status === 'нова' ? 'warn' : 'ok'}">${esc(r.status || 'нова')}</span></div>
        <div class="row" style="justify-content:space-between"><span class="mono" style="user-select:all">${esc(r.phone)}</span><span class="big" style="font-size:18px">${M.eur(+r.total || 0)}</span></div>
        <div class="small muted">${esc(r.summary || '')}</div>${r.note ? `<div class="small">„${esc(r.note)}“</div>` : ''}
        <div class="row" style="justify-content:space-between"><span class="small muted">${isNaN(d) ? '' : d.toLocaleString('bg-BG')}</span><div class="row"><button class="btn sm" data-copy>Копирай телефона</button>${remote ? '<button class="btn sm" data-done>Отбележи като обработена</button>' : ''}<button class="btn sm primary" data-open>Отвори проекта</button></div></div>`;
      el.querySelector('[data-open]').addEventListener('click', () => {
        try {
          const p = JSON.parse(r.project);
          M.loadProject(p);
          $('#offerClient').value = `${r.name}, ${r.phone}, ${r.city}`;
          M.toast('Проектът на клиента е отворен');
        } catch (e) {
          M.toast('Проектът не може да се отвори');
        }
      });
      el.querySelector('[data-copy]').addEventListener('click', () => {
        navigator.clipboard
          .writeText(r.phone)
          .then(() => M.toast('Телефонът е копиран'))
          .catch(() => M.toast('Маркирай номера и го копирай'));
      });
      const done = el.querySelector('[data-done]');
      if (done)
        done.addEventListener('click', async () => {
          try {
            if (remote === 'api') {
              await M.platform.setRequestStatus(r.id, 'обработена');
              el.querySelector('.pill').textContent = 'обработена';
              el.querySelector('.pill').className = 'pill ok';
            } else {
              const db = await M.cap('db');
              await db.doc('requests/' + r._id).update({ status: 'обработена' });
            }
          } catch (e) {
            M.toast('Статусът не се промени');
          }
        });
      return el;
    };
    const showLocal = (msg) => {
      note.textContent = msg;
      const list = M.store.get('localRequests', []);
      host.innerHTML = '';
      if (!list.length) host.innerHTML = '<div class="empty">Още няма запитвания. Превключи на „Клиент“, направи проект и натисни „Изпрати запитване“.</div>';
      list.forEach((r) => host.appendChild(card(r, false)));
    };
    const PL = M.platform;
    if (PL && PL.api) {
      if (!PL.user || !PL.isShop()) {
        note.textContent = 'Заявките на клиентите виждат само мебелните цехове.';
        host.innerHTML = '<div class="empty">Влез с профил на мебелен цех, за да виждаш заявките.<br><br><button class="btn primary" id="inboxLogin">Вход за цехове</button></div>';
        $('#inboxLogin').onclick = () => PL.openAuth(PL.user ? 'login' : 'signup');
        return;
      }
      note.innerHTML = '<span class="spinner"></span> Зареждам заявките…';
      try {
        const docs = await PL.listRequests();
        note.textContent = `Заявки от клиенти: ${docs.length}.`;
        host.innerHTML = '';
        if (!docs.length) host.innerHTML = '<div class="empty">Още няма заявки от клиенти.</div>';
        docs.forEach((r) => host.appendChild(card(r, 'api')));
      } catch (e) {
        note.textContent = e.status === 403 ? 'Профилът ти не е на мебелен цех.' : 'Заявките не се заредиха.';
      }
      return;
    }
    const [db, user] = await Promise.all([M.cap('db'), M.cap('user')]);
    const canRead = user ? await user.canEdit().catch(() => false) : false;
    if (!db || !canRead) return showLocal('Показани са запитванията, изпратени от този браузър. Когато Модулия е публикувана, тук идват запитванията на всички клиенти.');
    note.innerHTML = '<span class="spinner"></span> Зареждам запитванията…';
    if (inboxUnsub) inboxUnsub();
    const timer = setTimeout(() => (note.textContent = 'Заявките не се зареждат в момента. Провери връзката.'), 10000);
    inboxUnsub = db.collection('requests').onSnapshot(
      (snap) => {
        clearTimeout(timer);
        const docs = snap.docs.filter((d) => d.exists).map((d) => Object.assign({ _id: d.id }, d.data()));
        docs.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
        note.textContent = `Запитвания от клиенти: ${docs.length}. Новите идват автоматично.`;
        host.innerHTML = '';
        if (!docs.length) host.innerHTML = '<div class="empty">Още няма запитвания от клиенти.</div>';
        docs.forEach((r) => host.appendChild(card(r, true)));
      },
      () => {
        clearTimeout(timer);
        showLocal('Споделените запитвания не са достъпни. Показани са тези от този браузър.');
      }
    );
  }
  M.on('view', (v) => v === 'inbox' && renderInbox());
  M.on('auth', () => S.view === 'inbox' && renderInbox());
})();
