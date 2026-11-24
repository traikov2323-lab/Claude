/* Модулия — каталог на материали, обков и цени.
   Всички цени са ОРИЕНТИРОВЪЧНИ, в евро без ДДС, и се редактират в раздел „Цени“. */
(function () {
  const M = (window.M = window.M || {});

  M.CATALOG = {
    // ПДЧ 18 мм, лист 2800 × 2070 мм
    boards: [
      { key: 'egger-w1000', brand: 'Egger', name: 'W1000 ST9 Премиум бяло', color: '#F1F1EC', grain: false, price: 72 },
      { key: 'egger-u708', brand: 'Egger', name: 'U708 ST9 Светлосиво', color: '#C9CBC8', grain: false, price: 72 },
      { key: 'egger-h1145', brand: 'Egger', name: 'H1145 ST10 Дъб Бардолино натурален', color: '#C29467', grain: true, price: 79 },
      { key: 'egger-h3303', brand: 'Egger', name: 'H3303 ST10 Дъб Хамилтън натурален', color: '#B98A5C', grain: true, price: 79 },
      { key: 'egger-u999', brand: 'Egger', name: 'U999 ST2 Черно', color: '#26272A', grain: false, price: 75 },
      { key: 'egger-h3734', brand: 'Egger', name: 'H3734 ST9 Орех Дижон натурален', color: '#7E5D45', grain: true, price: 86 },
      { key: 'egger-u702', brand: 'Egger', name: 'U702 ST9 Кашмир сив', color: '#CFC7BA', grain: false, price: 74 },
      { key: 'krono-white', brand: 'Kronospan', name: 'Бяло гладко', color: '#F3F3EF', grain: false, price: 56 },
      { key: 'krono-sonoma', brand: 'Kronospan', name: 'Дъб Сонома', color: '#D3B489', grain: true, price: 58 },
      { key: 'kasta-white', brand: 'Kastamonu', name: 'Бяло', color: '#F2F2EE', grain: false, price: 52 },
      { key: 'kasta-anthracite', brand: 'Kastamonu', name: 'Антрацит', color: '#3C3F43', grain: false, price: 55 },
    ],
    hdf: { key: 'hdf-white', name: 'HDF 3 мм бял', price: 14 },

    frontTypes: [
      { key: 'mdf-mat', name: 'МДФ боядисан, мат', perM2: 85, painted: true, gloss: false },
      { key: 'mdf-gloss', name: 'МДФ боядисан, гланц', perM2: 115, painted: true, gloss: true },
      { key: 'pdch', name: 'ПДЧ с кант 2 мм', perM2: 0, painted: false, gloss: false },
    ],
    paintColors: [
      { key: 'white', name: 'Бяло', color: '#F1F0EC' },
      { key: 'cashmere', name: 'Кашмир', color: '#D8CFC0' },
      { key: 'grey', name: 'Светлосиво', color: '#C6C9CA' },
      { key: 'sage', name: 'Маслинено', color: '#7C8466' },
      { key: 'navy', name: 'Нощно синьо', color: '#2F3B52' },
      { key: 'graphite', name: 'Графит', color: '#46494E' },
      { key: 'sand', name: 'Пясъчно', color: '#E1D8C9' },
      { key: 'cream', name: 'Крем', color: '#EEE8DD' },
      { key: 'black', name: 'Черно мат', color: '#232326' },
      { key: 'terracotta', name: 'Глина', color: '#B7795C' },
    ],

    hardwareBrands: [
      { key: 'blum', name: 'Blum', note: 'CLIP top BLUMOTION, TANDEMBOX antaro' },
      { key: 'hettich', name: 'Hettich', note: 'Sensys, AvanTech YOU' },
      { key: 'gtv', name: 'GTV', note: 'панти с плавно затваряне, Modern Box' },
    ],
    // Формули за дъно и гръб на чекмедже (метални страници). Провери в каталога на системата преди разкрой.
    drawerSystems: {
      blum: { name: 'TANDEMBOX antaro', bottomW: 75, bottomL: 24, backW: 87, nl: 500 },
      hettich: { name: 'AvanTech YOU', bottomW: 75, bottomL: 24, backW: 87, nl: 500 },
      gtv: { name: 'Modern Box', bottomW: 75, bottomL: 24, backW: 87, nl: 500 },
    },

    handles: [
      { key: 'bar', name: 'Дръжка-лайсна 160 мм, инокс' },
      { key: 'knob', name: 'Кръгла дръжка, черна' },
      { key: 'tipon', name: 'Без дръжки (натисни-отвори)' },
      { key: 'gola', name: 'Gola профил (без дръжки), колони с дълга дръжка' },
      { key: 'long', name: 'Дълга дръжка, черна' },
      { key: 'barblack', name: 'Дръжка-лайсна, черна' },
    ],

    worktops: [
      { key: 'wt-oak', name: 'Ламиниран плот 38 мм, дъб', color: '#B8875A', grain: true, perM: 48 },
      { key: 'wt-marble', name: 'Ламиниран плот 38 мм, бял мрамор', color: '#E9E7E3', grain: false, perM: 52 },
      { key: 'wt-concrete', name: 'Ламиниран плот 38 мм, бетон', color: '#9C9B97', grain: false, perM: 45 },
      { key: 'wt-compact', name: 'Компакт плот 12 мм, черен', color: '#202124', grain: false, perM: 175, thin: true },
      { key: 'wt-white', name: 'Компакт плот 12 мм, бял', color: '#F0F0EE', grain: false, perM: 175, thin: true },
      { key: 'wt-ceramic', name: 'Керамичен плот 12 мм, мрамор', color: '#ECEBE7', grain: false, perM: 260, thin: true, marble: true },
    ],
    // Повърхност на боядисания МДФ фронт: добавка към цената на м²
    surfaces: [
      { key: 'flat', name: 'Гладък', extra: 0 },
      { key: 'fluted', name: 'Рифелен', extra: 55 },
      { key: 'shaker', name: 'Рамка', extra: 25 },
    ],
  };

  // Редактируеми цени (евро без ДДС)
  M.DEFAULT_PRICES = {
    kant08: { label: 'Кант 0,8 мм (корпус)', unit: 'м', v: 0.35 },
    kant2: { label: 'Кант 2 мм (фронтове)', unit: 'м', v: 0.95 },
    cutSheet: { label: 'Разкрой ПДЧ', unit: 'лист', v: 8 },
    cutHdf: { label: 'Разкрой HDF', unit: 'лист', v: 4 },
    bandService: { label: 'Услуга кантиране', unit: 'м', v: 0.6 },
    hinge_blum: { label: 'Панта Blum CLIP top BLUMOTION', unit: 'бр', v: 6.5 },
    hinge_hettich: { label: 'Панта Hettich Sensys', unit: 'бр', v: 5.2 },
    hinge_gtv: { label: 'Панта GTV плавно затваряне', unit: 'бр', v: 2.2 },
    drawer_blum: { label: 'Чекмедже Blum TANDEMBOX antaro (к-т)', unit: 'к-т', v: 48 },
    drawer_hettich: { label: 'Чекмедже Hettich AvanTech YOU (к-т)', unit: 'к-т', v: 42 },
    drawer_gtv: { label: 'Чекмедже GTV Modern Box (к-т)', unit: 'к-т', v: 19 },
    pullout: { label: 'Механизъм за бутилиера', unit: 'к-т', v: 45 },
    leg: { label: 'Регулируемо краче', unit: 'бр', v: 0.9 },
    plinthClip: { label: 'Клипс за цокъл', unit: 'бр', v: 0.25 },
    hanger: { label: 'Окачвач за горен шкаф', unit: 'бр', v: 1.6 },
    rail: { label: 'Шина за окачване', unit: 'м', v: 3.5 },
    handle_bar: { label: 'Дръжка-лайсна 160 мм', unit: 'бр', v: 4.5 },
    handle_knob: { label: 'Кръгла дръжка', unit: 'бр', v: 2.8 },
    handle_tipon: { label: 'Механизъм натисни-отвори', unit: 'бр', v: 8 },
    handle_gola: { label: 'Gola профил с ъгли (на фронт)', unit: 'бр', v: 9 },
    handle_long: { label: 'Дълга дръжка, черна', unit: 'бр', v: 22 },
    handle_barblack: { label: 'Дръжка-лайсна, черна', unit: 'бр', v: 5 },
    shelfPin: { label: 'Рафтоносач', unit: 'бр', v: 0.08 },
    confirmat: { label: 'Конфирмат 7×50', unit: 'бр', v: 0.06 },
    screw: { label: 'Винт 4×16', unit: 'бр', v: 0.02 },
    nail: { label: 'Скоба/пирон за гръб', unit: 'бр', v: 0.01 },
    cutout: { label: 'Изрязване в плот (мивка, плот)', unit: 'бр', v: 20 },
    laborModule: { label: 'Изработка и сглобяване', unit: 'модул', v: 35 },
    install: { label: 'Монтаж', unit: 'л.м', v: 25 },
    markup: { label: 'Надценка на цеха', unit: '%', v: 20 },
    vat: { label: 'ДДС', unit: '%', v: 20 },
  };

  M.HW_LABEL = {
    hinge: 'Панта с плавно затваряне',
    drawer: 'Система за чекмедже',
    pullout: 'Механизъм за бутилиера',
    leg: 'Регулируемо краче',
    plinthClip: 'Клипс за цокъл',
    hanger: 'Окачвач',
    rail: 'Шина за окачване (м)',
    handle: 'Дръжка / механизъм',
    handleLong: 'Дълга дръжка за колона',
    shelfPin: 'Рафтоносач',
    confirmat: 'Конфирмат 7×50',
    screw: 'Винт 4×16',
    nail: 'Скоба за гръб',
  };

  M.board = (key) => M.CATALOG.boards.find((b) => b.key === key) || M.CATALOG.boards[0];
  M.frontType = (key) => M.CATALOG.frontTypes.find((f) => f.key === key) || M.CATALOG.frontTypes[0];
  M.paint = (key) => (String(key || '')[0] === '#' ? { key, name: 'Цвят от снимката', color: key } : M.CATALOG.paintColors.find((c) => c.key === key) || M.CATALOG.paintColors[0]);
  M.worktop = (key) => M.CATALOG.worktops.find((w) => w.key === key) || M.CATALOG.worktops[0];
  M.handle = (key) => M.CATALOG.handles.find((h) => h.key === key) || M.CATALOG.handles[0];
  M.surface = (key) => M.CATALOG.surfaces.find((s) => s.key === key) || M.CATALOG.surfaces[0];
  // Фронтове по зони: base (долни), wall (горни), tall (колони). Без настройка зоната следва долните.
  M.ZONES = { base: 'Долни', wall: 'Горни', tall: 'Колони' };
  M.zoneOf = (mod) => (M.isTall && M.isTall(mod.type) ? 'tall' : mod.row === 'wall' ? 'wall' : 'base');
  M.zone = (mats, z) => {
    const o = { frontType: mats.frontType, frontColor: mats.frontColor, frontDecor: mats.frontDecor, surface: mats.surface || 'flat' };
    if (z && z !== 'base' && mats.zones && mats.zones[z]) Object.assign(o, mats.zones[z]);
    if (!M.frontType(o.frontType).painted) o.surface = 'flat';
    return o;
  };
  M.frontName = (mats, z) => {
    const o = M.zone(mats, z);
    const ft = M.frontType(o.frontType);
    if (!ft.painted) return M.board(o.frontDecor).name.replace(/^[A-Z]\d+ ST\d+ /, '');
    const sf = M.surface(o.surface);
    return M.paint(o.frontColor).name + ', ' + (ft.gloss ? 'гланц' : 'мат') + (sf.key !== 'flat' ? ', ' + sf.name.toLowerCase() : '');
  };
  M.frontsSummary = (mats) => {
    const b = M.frontName(mats, 'base'),
      w = M.frontName(mats, 'wall'),
      t = M.frontName(mats, 'tall');
    if (w === b && t === b) return b;
    return 'долни ' + b + (w !== b ? '; горни ' + w : '') + (t !== b ? '; колони ' + t : '');
  };
  M.frontColorHex = (mats, z) => {
    const o = M.zone(mats, z);
    return M.frontType(o.frontType).painted ? M.paint(o.frontColor).color : M.board(o.frontDecor).color;
  };
})();
