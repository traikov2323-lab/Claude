/* Модулия: платформа: инсталиране като приложение (PWA), вход и регистрация (Netlify Identity, Google),
   проекти в акаунта и заявки към сървъра. Работи на modulia-bg.netlify.app; в Claude показва къде да се отвори. */
(function () {
  const M = window.M;
  const { $, $$, esc } = M;
  const S = M.S;

  const SITE = 'https://modulia-bg.netlify.app';
  const host = location.hostname;
  const IN_CLAUDE = !!window.claude || /claude|usercontent|anthropic/.test(host);
  const HOSTED = location.protocol === 'https:' && !IN_CLAUDE;
  const P = (M.platform = { hosted: HOSTED, api: HOSTED, user: null, site: SITE });

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isStandalone = () => matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  /* ---------- Прозорци ---------- */
  function openModal(el) {
    el.hidden = false;
    const f = el.querySelector('input, button:not([data-close])');
    if (f) setTimeout(() => f.focus(), 50);
  }
  function closeModal(el) {
    el.hidden = true;
  }
  function info(html) {
    const m = $('#infoModal');
    $('#infoBody').innerHTML = `<div class="row" style="justify-content:flex-end;margin-bottom:-8px"><button class="xbtn" data-close aria-label="Затвори">✕</button></div>` + html;
    openModal(m);
    return m;
  }
  document.addEventListener('click', (e) => {
    const m = e.target.closest('.modal');
    if (e.target.closest('[data-close]') && m) closeModal(m);
    else if (m && e.target === m) closeModal(m);
    const menu = $('#userMenu');
    if (!menu.hidden && !e.target.closest('#userMenu') && !e.target.closest('#btnAvatar')) menu.hidden = true;
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') $$('.modal').forEach((m) => (m.hidden = true));
  });
  const openHere = (what) =>
    `<h2 style="font-size:24px">${what}</h2><p class="muted" style="margin:0">Тази функция работи в приложението на собствения му адрес. Отвори го на компютъра или сканирай кода с телефона.</p>
     <div class="row" style="gap:16px;align-items:center"><div style="width:140px;height:140px;background:#fff;border-radius:14px;padding:10px">${M.qrSvg(SITE)}</div>
     <a class="btn primary" href="${SITE}" target="_blank" rel="noopener">Отвори modulia-bg.netlify.app</a></div>`;

  /* ---------- Инсталиране (PWA) ---------- */
  let deferred = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e;
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    document.body.classList.add('standalone');
    M.toast('Модулия е инсталирана');
  });
  if (HOSTED && 'serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {});

  async function install(kind) {
    if (!HOSTED) return info(openHere('Инсталирай Модулия'));
    if (deferred) {
      deferred.prompt();
      const r = await deferred.userChoice.catch(() => null);
      deferred = null;
      if (r && r.outcome === 'accepted') M.toast('Инсталирам Модулия…');
      return;
    }
    const steps = {
      ios: ['Отвори modulia-bg.netlify.app в <b>Safari</b>.', 'Натисни бутона <b>Сподели</b> в долната лента.', 'Превърти и избери <b>„Добави към началния екран“</b>.', 'Натисни <b>„Добави“</b>. Иконата се появява до другите приложения.'],
      android: ['Отвори сайта в <b>Chrome</b>.', 'Натисни менюто <b>⋮</b> горе вдясно.', 'Избери <b>„Инсталиране на приложението“</b>.'],
      desktop: ['<b>Chrome или Edge</b>: натисни иконата за инсталиране вдясно в адресната лента.', '<b>Safari на Mac</b>: меню <b>Файл → „Добави в Dock“</b>.', 'Модулия се отваря в собствен прозорец, като приложение.'],
    }[kind || (isIOS ? 'ios' : 'desktop')];
    info(`<h2 style="font-size:24px">Инсталирай Модулия</h2><ol style="margin:0;padding-left:20px;display:flex;flex-direction:column;gap:8px">${steps.map((s) => `<li>${s}</li>`).join('')}</ol>${isIOS && kind !== 'ios' ? '<p class="small muted" style="margin:0">На iPhone и iPad инсталирането става само през Safari.</p>' : ''}`);
  }

  /* ---------- Вход ---------- */
  let lib = null;
  let settings = null;
  let mode = 'login';
  let acct = 'client';
  const ERR = (e) => {
    const m = String((e && e.message) || e || '').toLowerCase();
    if (/invalid|credentials|grant/.test(m)) return 'Грешен имейл или парола.';
    if (/already|registered|exists/.test(m)) return 'Има акаунт с този имейл. Влез вместо това.';
    if (/confirm/.test(m)) return 'Потвърди имейла си от писмото, което ти изпратихме.';
    if (/password/.test(m) && /short|least|length/.test(m)) return 'Паролата трябва да е поне 8 знака.';
    if (/signup.*disabled|disabled/.test(m)) return 'Регистрацията е изключена.';
    if (/missingidentity|not configured|identity/.test(m)) return 'Входът още не е активиран за сайта.';
    return 'Не стана. Опитай отново след малко.';
  };
  const userName = (u) => (u && ((u.userMetadata && u.userMetadata.full_name) || u.name || (u.email || '').split('@')[0])) || '';
  const isShop = (u) => !!(u && u.userMetadata && u.userMetadata.account_type === 'workshop');
  P.isShop = () => isShop(P.user);

  async function loadLib() {
    if (!HOSTED) return null;
    if (!lib) lib = await import('https://cdn.jsdelivr.net/npm/@netlify/identity@2.0.1/+esm').catch(() => null);
    return lib;
  }

  function setUser(u) {
    const was = P.user && P.user.id;
    P.user = u || null;
    const btn = $('#btnLogin'),
      av = $('#btnAvatar');
    btn.hidden = !!u;
    av.hidden = !u;
    if (u) {
      const n = userName(u);
      av.innerHTML = u.pictureUrl ? `<img src="${esc(u.pictureUrl)}" alt="">` : esc((n.match(/\p{L}/gu) || ['?']).slice(0, 2).join('').toUpperCase());
      av.title = n + (u.email ? ' · ' + u.email : '');
      if (!was && isShop(u) && S.mode !== 'pro') M.setMode('pro');
    }
    M.emit('auth', P.user);
  }

  function renderAuthForm() {
    const su = mode === 'signup';
    $('#authTabLogin').setAttribute('aria-pressed', !su);
    $('#authTabSignup').setAttribute('aria-pressed', su);
    $('#authTitle').textContent = su ? 'Създай акаунт' : 'Влез в Модулия';
    $('#authNameF').hidden = !su;
    $('#authTypeF').hidden = !su;
    $('#authForgot').hidden = su;
    $('#authSubmit').textContent = su ? 'Регистрирай се' : 'Вход';
    $('#authPass').autocomplete = su ? 'new-password' : 'current-password';
    $('#authTypeClient').setAttribute('aria-pressed', acct === 'client');
    $('#authTypeShop').setAttribute('aria-pressed', acct === 'workshop');
    const g = $('#authGoogle');
    const gOn = !settings || !settings.providers || settings.providers.google !== false;
    g.disabled = !gOn;
    g.title = gOn ? '' : 'Входът с Google още не е включен';
  }

  async function openAuth(m = 'login') {
    if (!HOSTED) return info(openHere('Вход и регистрация'));
    mode = m;
    $('#authErr').textContent = '';
    $('#authErr').className = 'err';
    renderAuthForm();
    openModal($('#authModal'));
    if (!(await loadLib())) $('#authErr').textContent = 'Входът не се зареди. Провери връзката.';
    else if (!settings) $('#authErr').textContent = 'Входът още не е активиран за сайта.';
  }
  P.openAuth = openAuth;

  async function submitAuth(e) {
    e.preventDefault();
    const err = $('#authErr');
    err.className = 'err';
    const email = $('#authEmail').value.trim(),
      pass = $('#authPass').value;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return (err.textContent = 'Напиши валиден имейл.');
    if (pass.length < 8) return (err.textContent = 'Паролата трябва да е поне 8 знака.');
    const L = await loadLib();
    if (!L) return (err.textContent = 'Входът не се зареди. Провери връзката.');
    const btn = $('#authSubmit');
    btn.disabled = true;
    err.innerHTML = '<span class="spinner"></span>';
    try {
      if (mode === 'signup') {
        const name = $('#authName').value.trim();
        const u = await L.signup(email, pass, { full_name: name, account_type: acct });
        if (settings && settings.autoconfirm) {
          setUser(u);
          closeModal($('#authModal'));
          M.toast('Добре дошъл, ' + (name || email));
        } else {
          err.className = 'okmsg';
          err.textContent = 'Готово. Изпратихме ти имейл: натисни линка в него, за да потвърдиш акаунта.';
        }
      } else {
        const u = await L.login(email, pass);
        setUser(u);
        closeModal($('#authModal'));
        M.toast('Здравей, ' + userName(u));
      }
    } catch (ex) {
      err.textContent = ERR(ex);
    } finally {
      btn.disabled = false;
    }
  }

  /* ---------- Меню на профила ---------- */
  function renderMenu() {
    const u = P.user;
    const m = $('#userMenu');
    if (!u) return (m.hidden = true);
    m.innerHTML = `<div class="who"><b>${esc(userName(u))}</b><div class="small muted">${esc(u.email || '')}</div><span class="pill ${isShop(u) ? 'blue' : ''}" style="margin-top:6px">${isShop(u) ? 'Мебелен цех' : 'Клиент'}</span></div>
      <button data-a="projects"><svg class="ic"><use href="#i-cloud"/></svg>Моите проекти</button>
      <button data-a="save"><svg class="ic"><use href="#i-download"/></svg>Запази проекта в акаунта</button>
      <button data-a="type"><svg class="ic"><use href="#i-user"/></svg>${isShop(u) ? 'Смени профила на клиент' : 'Аз съм мебелен цех'}</button>
      <button data-a="logout"><svg class="ic"><use href="#i-logout"/></svg>Изход</button>`;
    m.querySelectorAll('button').forEach((b) =>
      b.addEventListener('click', async () => {
        m.hidden = true;
        const a = b.dataset.a;
        if (a === 'projects') showProjects();
        if (a === 'save') saveProject(true);
        if (a === 'type') {
          try {
            const L = await loadLib();
            const u2 = await L.updateUser({ data: { account_type: isShop(u) ? 'client' : 'workshop' } });
            setUser(u2);
            M.setMode(isShop(u2) ? 'pro' : 'client');
            M.toast(isShop(u2) ? 'Профилът е мебелен цех' : 'Профилът е клиент');
          } catch (e) {
            M.toast('Профилът не се промени');
          }
        }
        if (a === 'logout') {
          try {
            const L = await loadLib();
            await L.logout();
          } catch (e) {}
          setUser(null);
          M.toast('Излезе от акаунта');
        }
      })
    );
    m.hidden = false;
  }

  /* ---------- API ---------- */
  async function api(path, opts = {}) {
    const r = await fetch(path, Object.assign({ credentials: 'same-origin', headers: { 'Content-Type': 'application/json' } }, opts));
    if (!r.ok) {
      const e = new Error('HTTP ' + r.status);
      e.status = r.status;
      throw e;
    }
    return r.status === 204 ? null : r.json();
  }
  P.sendRequest = (payload) => api('/api/requests', { method: 'POST', body: JSON.stringify(payload) });
  P.listRequests = () => api('/api/requests');
  P.setRequestStatus = (id, status) => api('/api/requests?id=' + encodeURIComponent(id), { method: 'PATCH', body: JSON.stringify({ status }) });

  let saveTimer = 0;
  async function saveProject(loud) {
    if (!P.user) return loud && openAuth();
    try {
      await api('/api/projects', { method: 'PUT', body: JSON.stringify({ project: S.project, total: S.pr ? S.pr.gross : 0 }) });
      if (loud) M.toast('Проектът е запазен в акаунта');
    } catch (e) {
      if (loud) M.toast(e.status === 401 ? 'Влез отново, за да запазиш' : 'Проектът не се запази');
    }
  }
  P.saveNow = () => saveProject(true);
  M.on('changed', () => {
    if (!P.user) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => saveProject(false), 4000);
  });

  async function showProjects() {
    const m = info(`<h2 style="font-size:24px">Моите проекти</h2><div class="stack" id="projList" style="gap:8px"><div class="shimmer" style="height:64px"></div><div class="shimmer" style="height:64px"></div></div>`);
    m.querySelector('.card').classList.add('wide');
    try {
      const list = await api('/api/projects');
      const host = $('#projList');
      if (!list.length) return (host.innerHTML = '<div class="empty">Още няма запазени проекти. Проектът се запазва сам, докато работиш.</div>');
      host.innerHTML = '';
      list.forEach((p) => {
        const d = new Date(p.updatedAt);
        const el = document.createElement('div');
        el.className = 'projitem';
        el.innerHTML = `<svg class="ic lg" style="color:var(--accent)"><use href="#i-cube"/></svg><div style="flex:1;min-width:0"><b>${esc(p.name || 'Кухня')} · ${esc(p.id)}</b><span class="small muted">${esc(p.summary || '')} · ${isNaN(d) ? '' : d.toLocaleString('bg-BG')}</span></div><span class="mono">${M.eur(+p.total || 0)}</span><button class="btn sm primary" data-o>Отвори</button><button class="iconbtn" data-d aria-label="Изтрий">✕</button>`;
        el.querySelector('[data-o]').addEventListener('click', async () => {
          try {
            const full = await api('/api/projects?id=' + encodeURIComponent(p.id));
            M.loadProject(full.project);
            closeModal(m);
            M.toast('Проектът е отворен');
          } catch (e) {
            M.toast('Проектът не се отвори');
          }
        });
        el.querySelector('[data-d]').addEventListener('click', async () => {
          if (el.dataset.confirm !== '1') {
            el.dataset.confirm = '1';
            el.querySelector('[data-d]').textContent = 'Изтрий?';
            return;
          }
          try {
            await api('/api/projects?id=' + encodeURIComponent(p.id), { method: 'DELETE' });
            el.remove();
          } catch (e) {
            M.toast('Не се изтри');
          }
        });
        host.appendChild(el);
      });
    } catch (e) {
      $('#projList').innerHTML = `<div class="empty">${e.status === 401 ? 'Влез отново в акаунта.' : 'Проектите не се заредиха.'}</div>`;
    }
  }

  /* ---------- Старт ---------- */
  M.on('ready', async () => {
    if (isStandalone()) document.body.classList.add('standalone');
    $('#siteQr').innerHTML = M.qrSvg(SITE);
    $$('[data-install]').forEach((b) => b.addEventListener('click', () => install(b.dataset.install)));
    $$('[data-dl]').forEach((b) =>
      b.addEventListener('click', () => {
        M.setView('home');
        setTimeout(() => $('#download').scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
      })
    );
    $('#btnLogin').addEventListener('click', () => openAuth('login'));
    $('#btnAvatar').addEventListener('click', () => ($('#userMenu').hidden ? renderMenu() : ($('#userMenu').hidden = true)));
    $('#authTabLogin').addEventListener('click', () => ((mode = 'login'), renderAuthForm()));
    $('#authTabSignup').addEventListener('click', () => ((mode = 'signup'), renderAuthForm()));
    $('#authTypeClient').addEventListener('click', () => ((acct = 'client'), renderAuthForm()));
    $('#authTypeShop').addEventListener('click', () => ((acct = 'workshop'), renderAuthForm()));
    $('#authForm').addEventListener('submit', submitAuth);
    $('#authGoogle').addEventListener('click', async () => {
      const L = await loadLib();
      if (!L) return ($('#authErr').textContent = 'Входът не се зареди. Провери връзката.');
      try {
        L.oauthLogin('google');
      } catch (e) {
        $('#authErr').textContent = ERR(e);
      }
    });
    $('#authForgot').addEventListener('click', async () => {
      const email = $('#authEmail').value.trim();
      const err = $('#authErr');
      if (!email) return (err.textContent = 'Напиши имейла си и натисни отново.');
      try {
        const L = await loadLib();
        await L.requestPasswordRecovery(email);
        err.className = 'okmsg';
        err.textContent = 'Изпратихме ти имейл с линк за нова парола.';
      } catch (e) {
        err.textContent = ERR(e);
      }
    });
    if (!HOSTED) return;
    const L = await loadLib();
    if (!L) return;
    try {
      settings = await L.getSettings();
    } catch (e) {
      settings = null;
      return;
    }
    L.onAuthChange((evt, u) => {
      if (evt === 'recovery') return askNewPassword();
      setUser(u || null);
    });
    try {
      const r = await L.handleAuthCallback();
      if (r && r.type === 'recovery') askNewPassword();
      else if (r && r.user) M.toast('Влезе като ' + userName(r.user));
    } catch (e) {
      M.toast('Входът не завърши. Опитай отново.');
    }
    try {
      setUser(await L.getUser());
    } catch (e) {}
  });

  function askNewPassword() {
    const m = info(`<h2 style="font-size:24px">Нова парола</h2><div class="field"><label for="np1">Нова парола</label><input id="np1" type="password" autocomplete="new-password" minlength="8"></div><button class="btn primary" id="npSave">Запази паролата</button><div class="err" id="npErr"></div>`);
    $('#npSave').addEventListener('click', async () => {
      const v = $('#np1').value;
      if (v.length < 8) return ($('#npErr').textContent = 'Поне 8 знака.');
      try {
        const L = await loadLib();
        const u = await L.updateUser({ password: v });
        setUser(u);
        closeModal(m);
        M.toast('Паролата е сменена');
      } catch (e) {
        $('#npErr').textContent = ERR(e);
      }
    });
  }
})();
