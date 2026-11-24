/* Модулия — фотореалистичен рендер с AI.
   „scene“: 3D изгледът става на снимка като от интериорен фотограф (същата подредба и материали).
   „room“: новата кухня се вписва фотореалистично в снимката на клиента. */
(function () {
  const M = window.M;
  const { $, esc } = M;
  const S = M.S;

  const DECOR_EN = {
    'egger-h3734': 'natural walnut wood veneer look with straight vertical grain',
    'egger-h1145': 'natural mid-tone oak wood (Bardolino oak) with vertical grain',
    'egger-h3303': 'natural Hamilton oak wood with vertical grain',
    'krono-sonoma': 'light Sonoma oak wood',
    'egger-u999': 'matt black',
    'egger-u702': 'matt cashmere grey',
    'egger-w1000': 'matt white',
    'egger-u708': 'matt light grey',
    'kasta-anthracite': 'matt anthracite',
    'krono-white': 'matt white',
    'kasta-white': 'matt white',
  };
  const WT_EN = {
    'wt-oak': 'a 38 mm solid-looking oak wood worktop',
    'wt-marble': 'a 38 mm white marble-look worktop',
    'wt-concrete': 'a 38 mm grey concrete-look worktop',
    'wt-compact': 'a thin 12 mm matt black compact worktop',
    'wt-white': 'a thin 12 mm matt white worktop',
    'wt-ceramic': 'a thin 12 mm white ceramic worktop with soft grey marble veins',
  };
  const HANDLE_EN = {
    bar: 'short brushed-steel bar handles',
    knob: 'small round black knobs',
    tipon: 'completely handleless flat fronts (push to open)',
    gola: 'handleless fronts with a dark recessed Gola channel under the worktop; long black vertical bar handles on the tall columns',
    long: 'long matt black vertical bar handles',
    barblack: 'short matt black bar handles',
  };
  const SPLASH_EN = {
    slab: 'a single large book-matched light marble slab between worktop and upper cabinets',
    marble: 'light marble tiles',
    subway: 'white glossy subway tiles',
    paint: 'a plain painted wall',
  };

  function zoneEN(mats, z) {
    const zm = M.zone(mats, z);
    const ft = M.frontType(zm.frontType);
    if (!ft.painted) return DECOR_EN[zm.frontDecor] || 'wood-look laminate';
    const sf = zm.surface === 'fluted' ? ', with fine vertical fluted (ribbed) relief' : zm.surface === 'shaker' ? ', shaker frame-and-panel doors' : ', flat slab doors';
    return `${ft.gloss ? 'high-gloss' : 'matt'} painted MDF in colour ${M.paint(zm.frontColor).color}${sf}`;
  }
  M.materialsEN = function (P) {
    const m = P.mats;
    const look = Object.assign({}, M.DEFAULT_LOOK, P.look);
    const hasWall = P.modules.some((x) => x.row === 'wall' && x.type !== 'gap');
    const hasTall = P.modules.some((x) => M.isTall(x.type));
    const d = M.dims(P.room);
    const lines = [
      `- Lower cabinet fronts: ${zoneEN(m, 'base')}.`,
      hasWall ? `- Upper wall cabinet fronts: ${zoneEN(m, 'wall')}${P.room.opts.wallH === 'ceil' ? ', running all the way up to the ceiling' : ''}.` : '- No upper wall cabinets.',
      hasTall ? `- Tall full-height columns: ${zoneEN(m, 'tall')}, with built-in black glass ovens and an integrated fridge behind doors.` : '',
      `- Worktop: ${WT_EN[m.worktop] || 'a stone-look worktop'}.`,
      `- Backsplash: ${SPLASH_EN[look.splash] || 'plain wall'}.`,
      `- Handles: ${HANDLE_EN[m.handle] || 'simple handles'}.`,
      `- Black glass induction hob, stainless undermount sink with a slim brushed tap.`,
      look.led && hasWall ? '- Warm LED strip light under the upper cabinets.' : '',
      look.spots ? '- Small recessed downlights in a white ceiling.' : '',
      look.pendant ? '- A slim black oval ring LED pendant lamp.' : '',
      look.dining ? '- An oval walnut dining table on a fluted pedestal with upholstered blue-grey velvet chairs.' : '',
      '- Light natural oak plank floor, warm white walls.',
      `- Ceiling height about ${(P.room.height / 1000).toFixed(2)} m, countertop height ${d.counterTop} mm.`,
    ];
    return lines.filter(Boolean).join('\n');
  };

  function scenePrompt() {
    const look = Object.assign({}, M.DEFAULT_LOOK, S.project.look);
    return `Transform this 3D kitchen visualization into a photorealistic interior photograph, as if taken by a professional architectural photographer for a design magazine.

Keep EXACTLY the same camera position, angle and framing, the same room geometry, cabinet layout, cabinet widths and heights, door and drawer divisions, appliance positions and overall composition. Do not add, remove, move or resize any cabinet.

Materials and details:
${M.materialsEN(S.project)}

Lighting: ${look.evening ? 'warm cosy evening light: under-cabinet LED strips and the pendant glowing, downlights on, dark sky outside' : 'soft natural daylight from the window plus subtle warm interior light'}, realistic soft shadows, ambient occlusion in corners and under cabinets, gentle reflections on the worktop, appliances and floor, realistic material textures with fine grain.

Replace the simplified 3D props (plants, fruit bowl, chairs, table, lamp) with realistic equivalents of the same size in the same place. Photorealistic, natural colours, 35 mm lens look, sharp focus. Output one image. No text, no watermark, no people.`;
  }
  function roomPrompt() {
    return `Image 1 is a photo of the client's own kitchen or room. Image 2 is the same photo with a simplified 3D mock-up of their NEW kitchen placed exactly where it will be installed.

Create one photorealistic photograph of the room from image 1 with the new kitchen installed exactly where, and exactly as large as, the mock-up in image 2: same cabinet layout, widths, heights, door divisions and appliance positions.

New kitchen materials:
${M.materialsEN(S.project)}

Keep the room from image 1: walls, ceiling, windows, doors, floor, perspective, camera and lighting. Where the old kitchen or furniture overlaps the new cabinets, remove it. Match the light, shadows, colour temperature and photo grain of image 1 so the result looks like a real photo of the finished kitchen. Output one image. No text, no watermark.`;
  }

  // 3D изглед във висока резолюция със същата камера
  M.hiResShot = function (src) {
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;left:-7000px;top:0;width:1536px;height:1024px';
    document.body.appendChild(div);
    let url = null;
    try {
      const v = new M.View3D(div, { size: [1536, 1024], lowRes: true });
      v.setProject(S.project, S.built, { look: { spin: false } });
      if (src && src.camera && src.camera.isPerspectiveCamera) {
        v.camera.position.copy(src.camera.position);
        if (src.controls && v.controls) {
          v.controls.target.copy(src.controls.target);
          v.controls.update();
        }
      }
      url = v.snapshot('image/jpeg', 0.9);
      v.dispose();
    } catch (e) {}
    div.remove();
    return url;
  };

  const toB64 = (dataUrl) => ({ data: dataUrl.split(',')[1], mime: dataUrl.slice(5, dataUrl.indexOf(';')) });
  const blobToDataUrl = (blob) =>
    new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(r.result);
      r.onerror = rej;
      r.readAsDataURL(blob);
    });

  /* ---------- Прозорец ---------- */
  let modal = null;
  function open(html) {
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      document.body.appendChild(modal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.closest('[data-rclose]')) modal.hidden = true;
      });
    }
    modal.innerHTML = `<div class="card pad stack rcard">${html}</div>`;
    modal.hidden = false;
    return modal;
  }

  function compareHtml(before, after) {
    return `<div class="compare" id="rCmp"><img src="${before}" alt="3D модел"><div class="after" style="clip-path:inset(0 0 0 50%)"><img src="${after}" alt="Фотореалистичен рендер"></div><div class="handle" style="left:50%"><span>‹ ›</span></div><span class="tag l">3D модел</span><span class="tag r">Реалистично</span></div>`;
  }
  function bindCompare() {
    const box = $('#rCmp');
    if (!box) return;
    const set = (x) => {
      const r = box.getBoundingClientRect();
      const p = Math.max(0, Math.min(100, ((x - r.left) / r.width) * 100));
      box.querySelector('.after').style.clipPath = `inset(0 0 0 ${p}%)`;
      box.querySelector('.handle').style.left = p + '%';
    };
    let down = false;
    box.addEventListener('pointerdown', (e) => {
      down = true;
      box.setPointerCapture(e.pointerId);
      set(e.clientX);
    });
    box.addEventListener('pointermove', (e) => down && set(e.clientX));
    box.addEventListener('pointerup', () => (down = false));
    if (window.gsap && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const o = { p: 92 };
      gsap.to(o, { p: 50, duration: 1.4, ease: 'power2.inOut', onUpdate: () => ((box.querySelector('.after').style.clipPath = `inset(0 0 0 ${o.p}%)`), (box.querySelector('.handle').style.left = o.p + '%')) });
    }
  }

  async function run(mode, src) {
    if (!(M.platform && M.platform.hosted)) {
      open(`<div class="row"><h2 style="font-size:24px">Фотореалистичен рендер</h2><button class="xbtn" data-rclose aria-label="Затвори">✕</button></div><p class="muted" style="margin:0">Рендерът се прави на сървъра на Модулия. Отвори приложението на неговия адрес.</p><div class="row" style="gap:16px"><div style="width:140px;height:140px;background:#fff;border-radius:14px;padding:10px">${M.qrSvg('https://modulia-bg.netlify.app/#builder')}</div><a class="btn primary" href="https://modulia-bg.netlify.app/#builder" target="_blank" rel="noopener">Отвори modulia-bg.netlify.app</a></div>`);
      return;
    }
    let before, images, prompt;
    if (mode === 'room') {
      const c = await M.arComposite();
      if (!c) return M.toast('Първо качи снимка на кухнята си и постави новата кухня върху нея');
      before = c.composite;
      images = [toB64(c.photo), toB64(c.composite)];
      prompt = roomPrompt();
    } else {
      before = M.hiResShot(src);
      if (!before) return M.toast('3D изгледът не може да се снима');
      images = [toB64(before)];
      prompt = scenePrompt();
    }
    const steps = ['Подготвям 3D изгледа…', 'AI нанася материалите…', 'Добавям светлина и сенки…', 'Доизпипвам детайлите…'];
    open(`<div class="row"><h2 style="font-size:24px">${mode === 'room' ? 'Новата кухня в твоята снимка' : 'Фотореалистичен рендер'}</h2><button class="xbtn" data-rclose aria-label="Затвори">✕</button></div>
      <div class="rwait"><img src="${before}" alt=""><div class="rscan"></div><div class="rmsg"><span class="spinner"></span> <span id="rStep">${steps[0]}</span> <span class="mono" id="rSec">0 s</span></div></div>
      <p class="small muted" style="margin:0">Обикновено отнема 10–40 секунди. Подредбата и размерите остават същите.</p>`);
    let sec = 0;
    const timer = setInterval(() => {
      sec++;
      const el = $('#rSec');
      if (!el) return clearInterval(timer);
      el.textContent = sec + ' s';
      $('#rStep').textContent = steps[Math.min(steps.length - 1, Math.floor(sec / 8))];
    }, 1000);
    try {
      const body = JSON.stringify({ mode, prompt, images });
      let r = null;
      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          r = await fetch('/api/render', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
          if (r.status < 500) break;
        } catch (e) {
          r = null;
        }
        if (attempt < 4) {
          const st = $('#rStep');
          if (st) st.textContent = 'Сървърът се подготвя…';
          await new Promise((ok) => setTimeout(ok, 3000 * (attempt + 1)));
        }
      }
      if (!r) throw new Error('Няма връзка със сървъра. Опитай отново.');
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.image) throw new Error(j.error || (r.status === 429 ? 'Твърде много заявки. Опитай след минута.' : 'Рендерът не стана. Опитай отново.'));
      clearInterval(timer);
      open(`<div class="row"><h2 style="font-size:24px">${mode === 'room' ? 'Новата кухня в твоята снимка' : 'Фотореалистичен рендер'}</h2><span class="pill ok">готово за ${sec} s</span><button class="xbtn" data-rclose aria-label="Затвори">✕</button></div>
        ${compareHtml(before, j.image)}
        <p class="small muted" style="margin:0">Плъзни, за да сравниш 3D модела с реалистичния рендер. AI рендерът е визуализация: размерите и цената идват от проекта.</p>
        <div class="row"><button class="btn primary" id="rSave"><svg class="ic"><use href="#i-download"/></svg>Свали снимката</button><button class="btn" id="rAgain"><svg class="ic"><use href="#i-sparkles"/></svg>Нов вариант</button><button class="btn" data-rclose>Коригирай кухнята</button><button class="btn" id="rReq">Изпрати заявка</button></div>`);
      bindCompare();
      $('#rSave').addEventListener('click', async () => M.saveFile('modulia-realistichno.' + (j.image.startsWith('data:image/png') ? 'png' : 'jpg'), await (await fetch(j.image)).blob()));
      $('#rAgain').addEventListener('click', () => run(mode, src));
      $('#rReq').addEventListener('click', () => {
        modal.hidden = true;
        M.setView('request');
      });
      S.lastRender = j.image;
    } catch (e) {
      clearInterval(timer);
      open(`<div class="row"><h2 style="font-size:24px">Рендерът не стана</h2><button class="xbtn" data-rclose aria-label="Затвори">✕</button></div><p class="muted" style="margin:0">${esc(e.message || 'Опитай отново.')}</p><div class="row"><button class="btn primary" id="rAgain">Опитай отново</button></div>`);
      $('#rAgain').addEventListener('click', () => run(mode, src));
    }
  }
  M.photoreal = run;

  M.on('ready', () => {
    document.addEventListener('click', (e) => {
      const b = e.target.closest('[data-real]');
      if (!b) return;
      const kind = b.dataset.real;
      if (kind === 'room') return run('room');
      const src = kind === 'builder' ? M.builderView && M.builderView() : kind === 'photo' ? M.photoView && M.photoView() : M.view3d;
      run('scene', src);
    });
  });
})();
