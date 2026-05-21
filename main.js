
// индексы слайдов в общем Swiper-контейнере
const SLIDE_STATISTIC = 0;
const SLIDE_MAIN1 = 1;
const SLIDE_MAIN2 = 2;

// глобальная ссылка на Swiper, инициализируется в DOMContentLoaded
let mainSwiper = null;

let values = []; // 0+   1-   2x   3/  4t  5+-(min)  6+-(max)  7x/(min)  8x/(max)
let examples = [];
let score = 1, mistake = 0, mistakeTwo = 0, totalTime = 0, examplesCount = 10;
let block;
let numberOne, numberTwo, answer;

// for work in my cv
// document.addEventListener("click", () => {
//     // проверяем, открыт ли уже нужный сайт

//     if (window.parent.location.href !== "https://sashkka1.github.io/GoodMathScore/") {
//         window.parent.location.href = "https://sashkka1.github.io/GoodMathScore/";
//     }
//     // если совпадает — ничего не делаем
// });

//для таймера вводные
var seconds = 0;
var tens = 0;
var appendTens = document.getElementById("tens")
var appendSeconds = document.getElementById("seconds")
var buttonStart = document.getElementById('button-start');
var buttonStop = document.getElementById('button-stop');
var buttonReset = document.getElementById('button-reset');
var Interval;

// TimeForSave хранит дельту времени между текущим и предыдущим примером (для
// per-example записи в статистику). TimeForSaveOld — отметка времени после
// предыдущей записи. Оба обнуляются перед стартом нового раунда.
let TimeForSave, TimeForSaveOld = 0;


// ловлю нажатие на иконку статистики
document.getElementById('statistic-icon').addEventListener('click', () => { statisticOpen(); });


// открытие и закрытие панели настроек (бывший разверт темы)
document.getElementById('settings-icon').addEventListener('click', () => { differentTheme('open'); });
document.getElementById('different-theme-block').addEventListener('click', () => { differentTheme('close'); });

// Закрывает все выпадашки настроек (темы/границы/размеры), кроме указанной по
// id. Используется на каждом триггере: одновременно может быть открыта только
// одна — открытие новой автоматически схлопывает соседнюю.
function closeOtherDropdowns(keepId) {
    ['theme-dropdown', 'ranges-dropdown', 'sizes-dropdown'].forEach(id => {
        if (id !== keepId) document.getElementById(id).classList.remove('open');
    });
}

// клик по индикатору текущей темы — переключает выпадающий список тем
document.getElementById('current-theme-indicator').addEventListener('click', (e) => {
    e.stopPropagation(); // не даём клику закрыть всю панель
    closeOtherDropdowns('theme-dropdown');
    document.getElementById('theme-dropdown').classList.toggle('open');
});

// делегированная подписка: один обработчик на все свотчи в выпадающем списке.
// Dropdown сам по выбору не закрываем — он схлопывается только повторным
// нажатием на индикатор-триггер (см. handler выше).
document.getElementById('theme-dropdown').addEventListener('click', (e) => {
    const swatch = e.target.closest('.theme-swatch');
    if (!swatch) return;
    e.stopPropagation();
    applyTheme(swatch.dataset.themeName);
});

// === Кастомные границы ползунков (rangesBounds в localStorage) ===
// Значения хранятся в localStorage.rangesBounds как JSON. Меняются через
// выпадающую панель (иконка `tune` в settings-menu). ВНИМАНИЕ про live-update:
// jQuery.ready блоки слайдеров кэшируют max/min в замыкании setFill, поэтому
// после правки в панели атрибуты обновляются, но видимый эффект на слайдерах —
// только на следующем запуске приложения (когда .ready перечитает .attr()).
// На старте: применяем bounds ДО jQuery.ready, чтобы кэш сразу был корректным.

const RANGES_DEFAULTS = {
    sumMin: 0,   sumMax: 300,
    mulMin: 1,   mulMax: 50,
    countMin: 5, countMax: 25,
};

// Жёсткие лимиты для каждой границы — пользователь не может выйти за них.
// Для +/− 0..1000, для ⋅/∶ и количества 1..100.
const RANGES_LIMITS = {
    sumMin:   { lo: 0, hi: 1000 },
    sumMax:   { lo: 0, hi: 1000 },
    mulMin:   { lo: 1, hi: 100 },
    mulMax:   { lo: 1, hi: 100 },
    countMin: { lo: 1, hi: 100 },
    countMax: { lo: 1, hi: 100 },
};

// Соседний ключ для каждой границы — нужен, чтобы не дать min обогнать max.
const RANGES_PAIR = {
    sumMin: 'sumMax', sumMax: 'sumMin',
    mulMin: 'mulMax', mulMax: 'mulMin',
    countMin: 'countMax', countMax: 'countMin',
};

function loadRangesBounds() {
    try {
        const raw = localStorage.getItem('rangesBounds');
        const stored = raw ? JSON.parse(raw) : {};
        const merged = { ...RANGES_DEFAULTS, ...stored };
        // Миграция: при ужесточении лимитов (или если в storage лежит мусор)
        // приводим каждое значение в актуальный жёсткий диапазон, потом чиним
        // инверсию min > max в каждой паре.
        for (const key in RANGES_LIMITS) {
            const { lo, hi } = RANGES_LIMITS[key];
            const n = parseInt(merged[key], 10);
            merged[key] = Number.isNaN(n) ? RANGES_DEFAULTS[key] : Math.max(lo, Math.min(hi, n));
        }
        if (merged.sumMin > merged.sumMax) merged.sumMin = merged.sumMax;
        if (merged.mulMin > merged.mulMax) merged.mulMin = merged.mulMax;
        if (merged.countMin > merged.countMax) merged.countMin = merged.countMax;
        return merged;
    } catch {
        return { ...RANGES_DEFAULTS };
    }
}

function saveRangesBounds(b) {
    cloudSet('rangesBounds', JSON.stringify(b));
}

function clampToBounds(v, lo, hi) {
    const n = parseInt(v, 10);
    if (Number.isNaN(n)) return lo;
    return Math.max(lo, Math.min(hi, n));
}

// Проставляет min/max на range-инпутах + клампит уже сохранённые values[5..9],
// чтобы слайдеры не стартанули в позиции вне нового диапазона.
function applyRangesBounds(b) {
    document.querySelectorAll('.lower, .upper').forEach(el => {
        el.setAttribute('min', b.sumMin);
        el.setAttribute('max', b.sumMax);
    });
    document.querySelectorAll('.lower-double, .upper-double').forEach(el => {
        el.setAttribute('min', b.mulMin);
        el.setAttribute('max', b.mulMax);
    });
    document.querySelectorAll('.lower-three').forEach(el => {
        el.setAttribute('min', b.countMin);
        el.setAttribute('max', b.countMax);
    });
    const stored = localStorage.getItem('values');
    if (stored) {
        const v = stored.split(',');
        v[5] = clampToBounds(v[5], b.sumMin, b.sumMax);
        v[6] = clampToBounds(v[6], b.sumMin, b.sumMax);
        v[7] = clampToBounds(v[7], b.mulMin, b.mulMax);
        v[8] = clampToBounds(v[8], b.mulMin, b.mulMax);
        v[9] = clampToBounds(v[9], b.countMin, b.countMax);
        cloudSet('values', v.join(','));
    }
    // Пресеты должны помещаться в текущие границы: если границы сузили — клампим.
    // Заодно перерисовываем инпуты пресетов, чтобы пользователь сразу увидел
    // эффект изменения границ.
    const presets = loadRangesPresets();
    presets.smallSumLower = clampToBounds(presets.smallSumLower, b.sumMin, b.sumMax);
    presets.smallSumUpper = clampToBounds(presets.smallSumUpper, b.sumMin, b.sumMax);
    presets.bigSumLower   = clampToBounds(presets.bigSumLower,   b.sumMin, b.sumMax);
    presets.bigSumUpper   = clampToBounds(presets.bigSumUpper,   b.sumMin, b.sumMax);
    presets.smallMulLower = clampToBounds(presets.smallMulLower, b.mulMin, b.mulMax);
    presets.smallMulUpper = clampToBounds(presets.smallMulUpper, b.mulMin, b.mulMax);
    presets.bigMulLower   = clampToBounds(presets.bigMulLower,   b.mulMin, b.mulMax);
    presets.bigMulUpper   = clampToBounds(presets.bigMulUpper,   b.mulMin, b.mulMax);
    presets.smallCount    = clampToBounds(presets.smallCount,    b.countMin, b.countMax);
    presets.bigCount      = clampToBounds(presets.bigCount,      b.countMin, b.countMax);
    saveRangesPresets(presets);
    fillPresetsInputs(presets);
}

function fillRangesInputs(b) {
    document.querySelectorAll('.ranges-input[data-bound]').forEach(el => {
        el.value = b[el.dataset.bound];
    });
}

// === Пресеты «Малый» / «Большой» (rangesPresets в localStorage) ===
// Значения, которые smallRange/bigRange ставят на ползунки при клике. Раньше
// были зашиты числами в код функций, теперь конфигурируются из той же панели.

const PRESETS_DEFAULTS = {
    smallSumLower: 2,   smallSumUpper: 20,
    smallMulLower: 2,   smallMulUpper: 10,
    smallCount:    10,
    bigSumLower:   150, bigSumUpper:   300,
    bigMulLower:   25,  bigMulUpper:   50,
    bigCount:      25,
};

// Лимиты совпадают с RANGES_LIMITS по типу слайдера (sum: 0..1000, mul и
// count: 1..100). Count — single value, не имеет пары в PRESETS_PAIR.
const PRESETS_LIMITS = {
    smallSumLower: { lo: 0, hi: 1000 }, smallSumUpper: { lo: 0, hi: 1000 },
    smallMulLower: { lo: 1, hi: 100 },  smallMulUpper: { lo: 1, hi: 100 },
    smallCount:    { lo: 1, hi: 100 },
    bigSumLower:   { lo: 0, hi: 1000 }, bigSumUpper:   { lo: 0, hi: 1000 },
    bigMulLower:   { lo: 1, hi: 100 },  bigMulUpper:   { lo: 1, hi: 100 },
    bigCount:      { lo: 1, hi: 100 },
};

// Lower ≤ Upper в пределах одной пары.
const PRESETS_PAIR = {
    smallSumLower: 'smallSumUpper', smallSumUpper: 'smallSumLower',
    smallMulLower: 'smallMulUpper', smallMulUpper: 'smallMulLower',
    bigSumLower:   'bigSumUpper',   bigSumUpper:   'bigSumLower',
    bigMulLower:   'bigMulUpper',   bigMulUpper:   'bigMulLower',
};

function loadRangesPresets() {
    try {
        const raw = localStorage.getItem('rangesPresets');
        const stored = raw ? JSON.parse(raw) : {};
        const merged = { ...PRESETS_DEFAULTS, ...stored };
        for (const key in PRESETS_LIMITS) {
            const { lo, hi } = PRESETS_LIMITS[key];
            const n = parseInt(merged[key], 10);
            merged[key] = Number.isNaN(n) ? PRESETS_DEFAULTS[key] : Math.max(lo, Math.min(hi, n));
        }
        // выравниваем инверсии lower > upper в каждой паре
        if (merged.smallSumLower > merged.smallSumUpper) merged.smallSumLower = merged.smallSumUpper;
        if (merged.smallMulLower > merged.smallMulUpper) merged.smallMulLower = merged.smallMulUpper;
        if (merged.bigSumLower   > merged.bigSumUpper)   merged.bigSumLower   = merged.bigSumUpper;
        if (merged.bigMulLower   > merged.bigMulUpper)   merged.bigMulLower   = merged.bigMulUpper;
        return merged;
    } catch {
        return { ...PRESETS_DEFAULTS };
    }
}

function saveRangesPresets(p) {
    cloudSet('rangesPresets', JSON.stringify(p));
}

function fillPresetsInputs(p) {
    document.querySelectorAll('.ranges-input[data-preset]').forEach(el => {
        el.value = p[el.dataset.preset];
    });
}

// триггер выпадающей панели границ
document.getElementById('ranges-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    closeOtherDropdowns('ranges-dropdown');
    document.getElementById('ranges-dropdown').classList.toggle('open');
});

// клик внутри панели не должен закрывать overlay (panel закрывается только
// повторным нажатием на иконку — как и theme-dropdown)
document.getElementById('ranges-dropdown').addEventListener('click', (e) => {
    e.stopPropagation();
});

// === Масштабы шрифта и кнопок (sizeSettings в localStorage) ===
// Хранятся как целые проценты 80..120, центр = 100. На :root проставляются как
// доли (1.0 = 100%). Применяются СРАЗУ при загрузке main.js (до DOMContentLoaded),
// чтобы избежать вспышки немасштабированного UI.

const SIZES_DEFAULTS = { fontScale: 100, btnScale: 100 };
const SIZES_LIMITS   = { fontScale: { lo: 80, hi: 120 }, btnScale: { lo: 80, hi: 120 } };

function loadSizeSettings() {
    let raw = null;
    try { raw = JSON.parse(localStorage.getItem('sizeSettings')); } catch (_) {}
    const s = Object.assign({}, SIZES_DEFAULTS, raw && typeof raw === 'object' ? raw : {});
    for (const k of Object.keys(SIZES_LIMITS)) {
        const v = parseInt(s[k], 10);
        const lim = SIZES_LIMITS[k];
        s[k] = Number.isFinite(v) ? Math.min(lim.hi, Math.max(lim.lo, v)) : SIZES_DEFAULTS[k];
    }
    return s;
}

function saveSizeSettings(s) {
    cloudSet('sizeSettings', JSON.stringify(s));
}

function applySizeSettings(s) {
    document.documentElement.style.setProperty('--font-scale', (s.fontScale / 100).toString());
    document.documentElement.style.setProperty('--btn-scale',  (s.btnScale  / 100).toString());
    document.querySelectorAll('.sizes-input').forEach(el => {
        const key = el.dataset.size;
        if (s[key] != null) el.value = s[key];
    });
}

// триггер выпадающей панели размеров
document.getElementById('sizes-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    closeOtherDropdowns('sizes-dropdown');
    document.getElementById('sizes-dropdown').classList.toggle('open');
});

// клик внутри панели не должен закрывать overlay
document.getElementById('sizes-dropdown').addEventListener('click', (e) => {
    e.stopPropagation();
});

// 'input' — живая реакция во время перетаскивания (визуально сразу видно).
// 'change' — фиксация на отпускание (когда iOS WebView не шлёт input на drag).
document.querySelectorAll('.sizes-input').forEach(input => {
    const handler = () => {
        const s = loadSizeSettings();
        const key = input.dataset.size;
        const v = parseInt(input.value, 10);
        const lim = SIZES_LIMITS[key];
        if (!Number.isFinite(v) || v < lim.lo || v > lim.hi) {
            input.value = s[key];
            return;
        }
        s[key] = v;
        saveSizeSettings(s);
        applySizeSettings(s);
    };
    input.addEventListener('input', handler);
    input.addEventListener('change', handler);
});

// применяем масштабы сразу, до DOMContentLoaded
applySizeSettings(loadSizeSettings());

// сохранение при коммите ввода (blur/Enter). Маршрутизируем по data-bound vs
// data-preset; общая схема: жёсткий лимит, потом lower ≤ upper в паре, потом save.
document.querySelectorAll('.ranges-input').forEach(input => {
    input.addEventListener('change', () => {
        if (input.dataset.bound) {
            const bounds = loadRangesBounds();
            const key = input.dataset.bound;
            const value = parseInt(input.value, 10);
            const limit = RANGES_LIMITS[key];
            if (Number.isNaN(value) || value < limit.lo || value > limit.hi) {
                input.value = bounds[key];
                return;
            }
            const counterpart = RANGES_PAIR[key];
            if (key.endsWith('Min') && value > bounds[counterpart]) {
                input.value = bounds[key];
                return;
            }
            if (key.endsWith('Max') && value < bounds[counterpart]) {
                input.value = bounds[key];
                return;
            }
            bounds[key] = value;
            saveRangesBounds(bounds);
            applyRangesBounds(bounds);
            // живое обновление слайдеров под новые границы
            if (localStorage.getItem('values')) {
                dinamicRange();
            }
        } else if (input.dataset.preset) {
            const presets = loadRangesPresets();
            const bounds = loadRangesBounds();
            const key = input.dataset.preset;
            const value = parseInt(input.value, 10);
            const limit = PRESETS_LIMITS[key];
            if (Number.isNaN(value) || value < limit.lo || value > limit.hi) {
                input.value = presets[key];
                return;
            }
            // Пресеты должны лежать внутри текущих глобальных границ — иначе клик
            // по «Малый»/«Большой» поставил бы ползунок в позицию, которую слайдер
            // тут же зажмёт под свой attr min/max.
            const isSumPreset   = key.indexOf('Sum') !== -1;
            const isMulPreset   = key.indexOf('Mul') !== -1;
            const isCountPreset = key.indexOf('Count') !== -1;
            if (isSumPreset && (value < bounds.sumMin || value > bounds.sumMax)) {
                input.value = presets[key];
                return;
            }
            if (isMulPreset && (value < bounds.mulMin || value > bounds.mulMax)) {
                input.value = presets[key];
                return;
            }
            if (isCountPreset && (value < bounds.countMin || value > bounds.countMax)) {
                input.value = presets[key];
                return;
            }
            const counterpart = PRESETS_PAIR[key];
            if (key.endsWith('Lower') && value > presets[counterpart]) {
                input.value = presets[key];
                return;
            }
            if (key.endsWith('Upper') && value < presets[counterpart]) {
                input.value = presets[key];
                return;
            }
            presets[key] = value;
            saveRangesPresets(presets);
            // пресеты применяются только по клику на «Малый»/«Большой» — слайдер
            // здесь не трогаем.
        }
    });
});

// === Применяем bounds на старте + заливаем инпуты пресетов ===
// Top-level в main.js: скрипт парсится синхронно, ещё до DOMContentLoaded и
// jQuery.ready, поэтому min/max на слайдерах будут актуальны к моменту, когда
// .ready закэширует их в замыкания setFill. Сами пресеты применяются только
// при нажатии на кнопки «Малый»/«Большой» — здесь только заливаем инпуты.
{
    const bounds = loadRangesBounds();
    applyRangesBounds(bounds);
    fillRangesInputs(bounds);
    fillPresetsInputs(loadRangesPresets());
}

// при нажатии на чекбокс вызываю проверку есть ли хоть один закрытый чекбокс
document.getElementById('checkbox+').addEventListener('click', () => { checkChekBox(document.getElementById('checkbox+').value); });
document.getElementById('checkbox-').addEventListener('click', () => { checkChekBox(document.getElementById('checkbox-').value); });
document.getElementById('checkboxx').addEventListener('click', () => { checkChekBox(document.getElementById('checkboxx').value); });
document.getElementById('checkbox/').addEventListener('click', () => { checkChekBox(document.getElementById('checkbox/').value); });

// клик по таймер-чекбоксу — у него нет id, но он единственный без id в .choice.
// Тоже инвалидирует активный пресет: настройку таймера пользователь правит руками.
document.querySelectorAll('.choice input[type="checkbox"]').forEach((cb, i) => {
    if (i === 4) cb.addEventListener('click', () => setActivePreset(null));
});

// клик на кнопку для задавания маленького диапозона
document.getElementById('small-range').addEventListener('click', () => { smallRange(); });

// клик на кнопку для задавания большого диапозона
document.getElementById('big-range').addEventListener('click', () => { bigRange(); });

// клик на кнопку начать
document.getElementById('start-button').addEventListener('click', () => { fromHomeToExample(); });

// клик на возврат на главную
document.getElementById('back-to-home-statistic').addEventListener('click', () => { statisticClose(); });
document.getElementById('back-to-home').addEventListener('click', () => { let a = 1; fromExampleToHome(a); });

// обработка кликов на клавиатуру, на каждую из клавиш
document.getElementById('number-1').addEventListener('click', () => { keyboardClick(document.getElementById('number-1').value); });
document.getElementById('number-2').addEventListener('click', () => { keyboardClick(document.getElementById('number-2').value); });
document.getElementById('number-3').addEventListener('click', () => { keyboardClick(document.getElementById('number-3').value); });
document.getElementById('number-4').addEventListener('click', () => { keyboardClick(document.getElementById('number-4').value); });
document.getElementById('number-5').addEventListener('click', () => { keyboardClick(document.getElementById('number-5').value); });
document.getElementById('number-6').addEventListener('click', () => { keyboardClick(document.getElementById('number-6').value); });
document.getElementById('number-7').addEventListener('click', () => { keyboardClick(document.getElementById('number-7').value); });
document.getElementById('number-8').addEventListener('click', () => { keyboardClick(document.getElementById('number-8').value); });
document.getElementById('number-9').addEventListener('click', () => { keyboardClick(document.getElementById('number-9').value); });
document.getElementById('number-0').addEventListener('click', () => { keyboardClick(document.getElementById('number-0').value); });
document.getElementById('number-enter').addEventListener('click', () => { keyboardClick(document.getElementById('number-enter').value); });
document.getElementById('number-delete').addEventListener('click', () => { keyboardClick(document.getElementById('number-delete').value); });

// =======================================================================
// Страница статистики (см. CLAUDE.md → раздел «Графики»)
// =======================================================================
// Источник данных — единое хранилище stats_v2 (определено ниже). Данные
// пишутся при старте сессии (statsRecordSessionStart) и на каждом ответе
// (statsRecordExample), а здесь только читаются для отображения.

const STAT_CATEGORIES = ['overall', 'big', 'small'];
let statPeriod = 'month';        // 'week' (7 дней) | 'month' (30 дней)
let statSwiper = null;           // вложенный Swiper для категорий
let statMorrisInstances = [];    // живые Morris-графики — чтобы корректно перерисовывать

function dateKey(d) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}

function randInt(lo, hi) { return Math.floor(Math.random() * (hi - lo + 1)) + lo; }

// Делит `total` на 4 неотрицательных целых, в сумме дающих total. Через
// сортировку 3 случайных точек среза. Используется для распределения дневной
// активности (examples / mistakes) по операциям +/−/×/÷.
function splitInto4(total) {
    if (total <= 0) return [0, 0, 0, 0];
    const cuts = [
        Math.floor(Math.random() * (total + 1)),
        Math.floor(Math.random() * (total + 1)),
        Math.floor(Math.random() * (total + 1)),
    ];
    cuts.sort((a, b) => a - b);
    return [cuts[0], cuts[1] - cuts[0], cuts[2] - cuts[1], total - cuts[2]];
}

// === Хранилище статистики v2 ===========================================
// Единый формат записи и чтения статистики. Источник истины — Telegram
// CloudStorage (когда приложение открыто в Telegram), плюс localStorage
// как offline-кэш и единственный backend в браузере для разработки.
//
// Схема (key: STATS_KEY_V2):
//   {
//     version: 2,
//     byDate: {
//       'YYYY-MM-DD': {
//         overall: {time, examples, mistakes, sessions,
//                   examplesByOp:[+, −, ×, ÷],
//                   mistakesByOp:[+, −, ×, ÷]},
//         big:     {... те же поля ...},
//         small:   {... те же поля ...}
//       },
//       ...
//     }
//   }
//
// Категория раунда определяется через localStorage.activePreset (см.
// setActivePreset). По умолчанию — null (только overall обновляется).

const STATS_KEY_V2 = 'stats_v2';
const STATS_KEY_LEGACY = 'stats';        // старый формат массива по дням

const inTelegram = () =>
    typeof navigator !== 'undefined' &&
    !!navigator.userAgent &&
    navigator.userAgent.includes('Telegram');

function emptyCatDay() {
    return {
        time: 0, examples: 0, mistakes: 0, sessions: 0,
        examplesByOp: [0, 0, 0, 0],
        mistakesByOp: [0, 0, 0, 0],
    };
}
function emptyDayBlock() {
    return { overall: emptyCatDay(), big: emptyCatDay(), small: emptyCatDay() };
}
function emptyStats() { return { version: 2, byDate: {} }; }

let _statsCache = null;
let _statsLoaded = false;
let _statsLoadPromise = null;

function _ensureDay(stats, dk) {
    if (!stats.byDate[dk]) stats.byDate[dk] = emptyDayBlock();
    const day = stats.byDate[dk];
    // защита от частично-инициализированных дней (например, после миграции)
    for (const cat of STAT_CATEGORIES) {
        if (!day[cat]) day[cat] = emptyCatDay();
    }
    return day;
}

// Legacy: [monthIdx, [t,e,m], [t,e,m], ...]. Один месяц истории без разбивки
// по операциям и категориям — кладём всё в overall, sessions = 1 если в дне
// был хотя бы один пример (это лучшее приближение из той информации).
function _migrateLegacyArray(arr) {
    const out = emptyStats();
    if (!Array.isArray(arr) || arr.length === 0) return out;
    const monthIdx = Number(arr[0]);
    if (!Number.isFinite(monthIdx)) return out;
    const now = new Date();
    let year = now.getFullYear();
    if (monthIdx > now.getMonth()) year -= 1;
    for (let day = 1; day < arr.length; day++) {
        const cell = arr[day];
        if (!Array.isArray(cell) || cell.length < 3) continue;
        const t = Number(cell[0]) || 0;
        const e = Number(cell[1]) || 0;
        const m = Number(cell[2]) || 0;
        if (t === 0 && e === 0 && m === 0) continue;
        const dk = dateKey(new Date(year, monthIdx, day));
        const block = _ensureDay(out, dk);
        block.overall.time = t;
        block.overall.examples = e;
        block.overall.mistakes = m;
        block.overall.sessions = e > 0 ? 1 : 0;
    }
    return out;
}

function _normalizeStats(raw) {
    if (!raw) return emptyStats();
    if (raw.version === 2 && raw.byDate && typeof raw.byDate === 'object') return raw;
    if (Array.isArray(raw)) return _migrateLegacyArray(raw);
    return emptyStats();
}

function _persistStats() {
    if (!_statsCache) return;
    let json;
    try { json = JSON.stringify(_statsCache); } catch (_) { return; }
    try { localStorage.setItem(STATS_KEY_V2, json); } catch (_) {}
    if (inTelegram() && window.Telegram && window.Telegram.WebApp &&
        window.Telegram.WebApp.CloudStorage && window.Telegram.WebApp.CloudStorage.setItem) {
        try { window.Telegram.WebApp.CloudStorage.setItem(STATS_KEY_V2, json); } catch (_) {}
    }
}

// === Зеркало localStorage → CloudStorage для остальных настроек ========
// stats_v2 пишется через _persistStats (выше). Остальные пользовательские
// настройки (values, тема, границы, пресеты, размеры, активный пресет)
// дублируются в CloudStorage через cloudSet, чтобы при заходе с другого
// устройства / переустановки приложение подтянуло их через
// bootstrapCloudStorage. В браузере вне Telegram cloudSet работает как
// обычный localStorage.setItem.
const CLOUD_SETTINGS_KEYS = [
    'values', 'userTheme', 'rangesBounds', 'rangesPresets',
    'sizeSettings', 'activePreset',
];

function cloudSet(key, value) {
    const v = (value === null || value === undefined) ? null : String(value);
    try {
        if (v === null) localStorage.removeItem(key);
        else localStorage.setItem(key, v);
    } catch (_) {}
    if (!inTelegram()) return;
    const cs = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage;
    if (!cs) return;
    try {
        if (v === null) {
            if (cs.removeItem) cs.removeItem(key);
        } else {
            if (cs.setItem) cs.setItem(key, v);
        }
    } catch (_) {}
}

// На старте: вытащить все settings-ключи из CloudStorage и положить в
// localStorage. Ключи, которых нет в облаке, но есть локально — поднимаем
// обратно (первый заход в Telegram после браузерного тестирования).
// Возвращает Promise, который резолвится после завершения. Если приложение
// не в Telegram — резолвится сразу.
function bootstrapCloudStorage() {
    if (!inTelegram()) return Promise.resolve();
    const cs = window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.CloudStorage;
    if (!cs || !cs.getItems) return Promise.resolve();
    return new Promise(resolve => {
        cs.getItems(CLOUD_SETTINGS_KEYS, (_err, vals) => {
            if (vals && typeof vals === 'object') {
                for (const key of CLOUD_SETTINGS_KEYS) {
                    const cloudVal = vals[key];
                    if (cloudVal !== undefined && cloudVal !== null && cloudVal !== '') {
                        try { localStorage.setItem(key, cloudVal); } catch (_) {}
                    } else {
                        try {
                            const localVal = localStorage.getItem(key);
                            if (localVal !== null && localVal !== '') {
                                if (cs.setItem) cs.setItem(key, localVal);
                            }
                        } catch (_) {}
                    }
                }
            }
            resolve();
        });
    });
}

// Слияние двух stats-объектов по «max per field». Применяется в statsLoad,
// чтобы если CloudStorage отстал (например, write не дошёл offline), а в
// localStorage уже есть свежие инкременты — мы не потеряли локальные данные.
// Все счётчики в нашей схеме монотонно неубывающие, так что max == свежее.
function _mergeStatsObjects(a, b) {
    const out = emptyStats();
    const aBy = (a && a.byDate) || {};
    const bBy = (b && b.byDate) || {};
    const keys = new Set([...Object.keys(aBy), ...Object.keys(bBy)]);
    const maxArr = (x, y) => [0, 1, 2, 3].map(i =>
        Math.max((x && x[i]) || 0, (y && y[i]) || 0));
    for (const dk of keys) {
        const ad = aBy[dk] || emptyDayBlock();
        const bd = bBy[dk] || emptyDayBlock();
        const blk = _ensureDay(out, dk);
        for (const cat of STAT_CATEGORIES) {
            const ac = ad[cat] || emptyCatDay();
            const bc = bd[cat] || emptyCatDay();
            blk[cat] = {
                time:         Math.max(ac.time     || 0, bc.time     || 0),
                examples:     Math.max(ac.examples || 0, bc.examples || 0),
                mistakes:     Math.max(ac.mistakes || 0, bc.mistakes || 0),
                sessions:     Math.max(ac.sessions || 0, bc.sessions || 0),
                examplesByOp: maxArr(ac.examplesByOp, bc.examplesByOp),
                mistakesByOp: maxArr(ac.mistakesByOp, bc.mistakesByOp),
            };
        }
    }
    return out;
}

// Загрузка. В Telegram — параллельно из CloudStorage (async) и localStorage,
// потом merge по «max per field» — это защита от потери данных, если cloud-
// write не дошёл offline. Если в облаке нет v2, пробуем legacy. Возвращает
// Promise, который резолвится один раз и кэширует результат.
function statsLoad() {
    if (_statsLoaded) return Promise.resolve(_statsCache);
    if (_statsLoadPromise) return _statsLoadPromise;

    const parseSafe = (s) => {
        if (!s) return null;
        try { return JSON.parse(s); } catch (_) { return null; }
    };
    const localV2     = () => _normalizeStats(parseSafe(localStorage.getItem(STATS_KEY_V2)));
    const localLegacy = () => _normalizeStats(parseSafe(localStorage.getItem(STATS_KEY_LEGACY)));
    const localCandidate = () => {
        const v2 = localV2();
        if (v2 && v2.byDate && Object.keys(v2.byDate).length) return v2;
        return localLegacy();
    };

    _statsLoadPromise = new Promise(resolve => {
        const finish = (s, persistAfter) => {
            _statsCache = s || emptyStats();
            _statsLoaded = true;
            if (persistAfter) _persistStats();
            resolve(_statsCache);
        };

        if (inTelegram() && window.Telegram && window.Telegram.WebApp &&
            window.Telegram.WebApp.CloudStorage && window.Telegram.WebApp.CloudStorage.getItem) {
            const cs = window.Telegram.WebApp.CloudStorage;
            cs.getItem(STATS_KEY_V2, (_err, val) => {
                const cloudV2 = _normalizeStats(parseSafe(val));
                if (cloudV2 && cloudV2.byDate && Object.keys(cloudV2.byDate).length) {
                    finish(_mergeStatsObjects(cloudV2, localCandidate()), true);
                    return;
                }
                cs.getItem(STATS_KEY_LEGACY, (_err2, val2) => {
                    const cloudLegacy = _normalizeStats(parseSafe(val2));
                    finish(_mergeStatsObjects(cloudLegacy, localCandidate()), true);
                });
            });
        } else {
            finish(localCandidate(), false);
        }
    });
    return _statsLoadPromise;
}

// Применяет функцию-мутатор к live-stats и сразу персистит. Если хранилище
// ещё не загружено, операция дождётся загрузки и потом применит мутацию —
// поэтому первая запись после старта может быть с задержкой 1-2 тика.
function _statsMutate(fn) {
    statsLoad().then(s => { fn(s); _persistStats(); });
}

// Регистрирует старт новой сессии (нажатие «Начать»). Инкрементирует sessions
// в overall + в выбранной категории, если указана (big|small).
function statsRecordSessionStart(category) {
    _statsMutate(s => {
        const block = _ensureDay(s, dateKey(new Date()));
        block.overall.sessions += 1;
        if (category === 'big' || category === 'small') {
            block[category].sessions += 1;
        }
    });
}

// Регистрирует один пример. opIndex: 0=+, 1=−, 2=×, 3=÷. hadMistake — была
// ли в этом примере ошибка (max 1 на пример, см. контракт mistake в CLAUDE.md).
function statsRecordExample(category, opIndex, timeSec, hadMistake) {
    const op = (Number.isFinite(opIndex) && opIndex >= 0 && opIndex <= 3) ? opIndex : 0;
    const t  = Number.isFinite(timeSec) ? Math.max(0, timeSec) : 0;
    const m  = hadMistake ? 1 : 0;
    _statsMutate(s => {
        const block = _ensureDay(s, dateKey(new Date()));
        const apply = (c) => {
            c.time         += t;
            c.examples     += 1;
            c.mistakes     += m;
            c.examplesByOp[op] += 1;
            c.mistakesByOp[op] += m;
        };
        apply(block.overall);
        if (category === 'big' || category === 'small') apply(block[category]);
    });
}

// Возвращает данные одной категории в форме { dateKey: entry } — той же, что
// раньше выдавала старая loadStats(category). Если кэш ещё не прогрет —
// вернёт пустой объект (рендер покажет ряд нулей, до резолва statsLoad).
function statsByCategory(category) {
    if (!_statsCache || !_statsCache.byDate) return {};
    const out = {};
    for (const dk of Object.keys(_statsCache.byDate)) {
        const e = _statsCache.byDate[dk][category];
        if (e) out[dk] = e;
    }
    return out;
}

// === Активный пресет (для категоризации раундов) =======================
// При клике на «Малый»/«Большой» сохраняем пометку. Любое ручное изменение
// чекбокса или ползунка сбрасывает пометку (раунд → только overall).
const ACTIVE_PRESET_KEY = 'activePreset';
function setActivePreset(p) {
    if (p === 'big' || p === 'small') cloudSet(ACTIVE_PRESET_KEY, p);
    else cloudSet(ACTIVE_PRESET_KEY, null);
}
function getActivePreset() {
    const v = localStorage.getItem(ACTIVE_PRESET_KEY);
    return (v === 'big' || v === 'small') ? v : null;
}

// === Чтение для страницы статистики ====================================
function loadStats(category) {
    return statsByCategory(category);
}

// Выдаёт упорядоченный массив дней (oldest → newest), длиной `days`, начиная
// с сегодня - (days-1). Отсутствующие даты заполняются нулями.
function filterLastNDays(catData, days) {
    const out = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const k = dateKey(d);
        const entry = catData[k] || { time: 0, examples: 0, mistakes: 0, sessions: 0 };
        out.push({
            dateKey: k,
            xLabel: String(d.getDate()),
            time: entry.time,
            examples: entry.examples,
            mistakes: entry.mistakes,
            sessions: entry.sessions,
        });
    }
    return out;
}

// Среднее за сессию по отфильтрованному окну. NaN/деление-на-ноль → 0.
function computeAverages(filtered) {
    let totalTime = 0, totalExamples = 0, totalSessions = 0;
    for (const d of filtered) {
        totalTime     += d.time;
        totalExamples += d.examples;
        totalSessions += d.sessions;
    }
    if (totalSessions === 0) return { avgTimeSec: 0, avgExamples: 0 };
    return {
        avgTimeSec: Math.round(totalTime / totalSessions),
        avgExamples: Math.round(totalExamples / totalSessions),
    };
}

function formatAvgTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}с`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

// Рисует один Morris.Line в контейнере. Контейнер очищается и получает
// inner wrapper (Morris требует фиксированную высоту/ширину). minWidth
// зависит от размера окна: для недели влезает в 90vw, для месяца включаем
// горизонтальный скролл.
function drawChart(container, filtered, metric, color) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.height = '95%';
    wrapper.style.minWidth = filtered.length <= 7 ? '90vw' : '1250px';
    container.appendChild(wrapper);

    let data;
    if (metric === 'time') {
        data = filtered.map(d => ({ day: d.xLabel, time: (d.time / 60).toFixed(2) }));
    } else if (metric === 'examples') {
        data = filtered.map(d => ({ day: d.xLabel, examples: d.examples }));
    } else {
        // mistake — доля правильных ответов: (ex - mistakes) / ex, 0..1
        data = filtered.map(d => {
            let ratio = 1;
            if (d.examples === 0 && d.mistakes === 0) ratio = 0;
            else if (d.mistakes !== 0) ratio = +((d.examples - d.mistakes) / d.examples).toFixed(2);
            return { day: d.xLabel, mistake: ratio };
        });
        metric = 'mistake';
    }

    const inst = new Morris.Line({
        element: wrapper,
        data: data,
        xkey: 'day',
        parseTime: false,
        ykeys: [metric],
        labels: [metric],
        lineColors: [color],
    });
    statMorrisInstances.push(inst);

    // прокрутка к правому краю (последний/сегодняшний день) для месяца —
    // setTimeout ждёт пока Morris отрисует SVG
    if (filtered.length > 7) {
        setTimeout(() => { container.scrollLeft = container.scrollWidth; }, 80);
    }
}

// Stacked bar chart: по дням, нижняя секция = правильные ответы, верхняя =
// ошибки. Сразу видно и объём, и долю ошибок. Используется на слайдах
// Большой/Малый вместо прежнего «доли правильных» Morris.Line.
function drawStackedDailyChart(container, filtered) {
    container.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.style.height = '95%';
    wrapper.style.minWidth = filtered.length <= 7 ? '90vw' : '1250px';
    container.appendChild(wrapper);

    const data = filtered.map(d => ({
        day: d.xLabel,
        correct: Math.max(0, (d.examples || 0) - (d.mistakes || 0)),
        mistakes: d.mistakes || 0,
    }));

    const inst = new Morris.Bar({
        element: wrapper,
        data: data,
        xkey: 'day',
        parseTime: false,
        ykeys: ['correct', 'mistakes'],
        labels: ['Правильные', 'Ошибки'],
        barColors: ['#3aa86b', '#e0533a'],
        stacked: true,
        resize: true,
        hideHover: 'auto',
    });
    statMorrisInstances.push(inst);

    if (filtered.length > 7) {
        setTimeout(() => { container.scrollLeft = container.scrollWidth; }, 80);
    }
}

// Горизонтальный bar-chart по операциям. Не Morris — это статичные 4 строки,
// рендерим обычным HTML, чтобы свободно показывать число + % рядом со
// шкалой. opBreakdown — результат computeOpBreakdown за выбранный период.
function drawOpBarChart(container, opBreakdown) {
    container.innerHTML = '';
    const symbols = ['+', '−', '×', '÷'];
    const maxMistakes = Math.max(1, ...opBreakdown.mistakesByOp);

    const wrap = document.createElement('div');
    wrap.className = 'op-bars';

    for (let i = 0; i < 4; i++) {
        const m = opBreakdown.mistakesByOp[i] || 0;
        const e = opBreakdown.examplesByOp[i] || 0;
        const pct = e > 0 ? Math.round((m / e) * 100) : 0;
        const fillW = (m / maxMistakes) * 100;

        const row = document.createElement('div');
        row.className = 'op-bar-row';
        row.innerHTML =
            `<span class="op-bar-label">${symbols[i]}</span>` +
            `<div class="op-bar-track"><div class="op-bar-fill" style="width:${fillW}%"></div></div>` +
            `<span class="op-bar-value">${m} (${pct}%)</span>`;
        wrap.appendChild(row);
    }

    container.appendChild(wrap);
}

// All-time агрегат всей категории (используется для слайда «Общая»).
// Считает по всем дням, имеющимся в mockStats[category] — без фильтра по периоду,
// потому что «Общая» это all-time, а не «за период».
function computeAllTime(catData) {
    let totalTime = 0, totalExamples = 0, totalSessions = 0, totalMistakes = 0;
    for (const k of Object.keys(catData)) {
        const d = catData[k];
        totalTime     += d.time     || 0;
        totalExamples += d.examples || 0;
        totalMistakes += d.mistakes || 0;
        // «количество заходов в которых хотя бы 1 пример решил» — это и есть
        // sessions (мок-генератор не считает session без examples → совпадает)
        if ((d.examples || 0) > 0) totalSessions += d.sessions || 0;
    }
    const avgTime = totalSessions ? Math.round(totalTime / totalSessions) : 0;
    const avgExamples = totalSessions ? Math.round(totalExamples / totalSessions) : 0;
    const avgMistakes = totalSessions ? +(totalMistakes / totalSessions).toFixed(1) : 0;
    return { totalTime, totalExamples, totalSessions, totalMistakes, avgTime, avgExamples, avgMistakes };
}

// Тот же агрегат, но за последние N дней включая сегодня. Используется для
// колонок «30 дней» и «7 дней» в таблице слайда «Общая». Структура результата
// идентична computeAllTime, чтобы renderOverallSlide мог обрабатывать все три
// периода одинаково.
function computeWindowed(catData, days) {
    let totalTime = 0, totalExamples = 0, totalSessions = 0, totalMistakes = 0;
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const entry = catData[dateKey(d)];
        if (!entry) continue;
        totalTime     += entry.time     || 0;
        totalExamples += entry.examples || 0;
        totalMistakes += entry.mistakes || 0;
        if ((entry.examples || 0) > 0) totalSessions += entry.sessions || 0;
    }
    const avgTime = totalSessions ? Math.round(totalTime / totalSessions) : 0;
    const avgExamples = totalSessions ? Math.round(totalExamples / totalSessions) : 0;
    const avgMistakes = totalSessions ? +(totalMistakes / totalSessions).toFixed(1) : 0;
    return { totalTime, totalExamples, totalSessions, totalMistakes, avgTime, avgExamples, avgMistakes };
}

// Сводка ошибок по операциям за последние N дней. Возвращает два массива по 4:
// mistakesByOp[+, −, ×, ÷] и examplesByOp[+, −, ×, ÷]. Используется для
// горизонтального bar-chart'а на слайдах Большой/Малый.
function computeOpBreakdown(catData, days) {
    const mistakesByOp = [0, 0, 0, 0];
    const examplesByOp = [0, 0, 0, 0];
    const today = new Date();
    for (let i = 0; i < days; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const entry = catData[dateKey(d)];
        if (!entry) continue;
        if (Array.isArray(entry.mistakesByOp)) {
            for (let j = 0; j < 4; j++) mistakesByOp[j] += entry.mistakesByOp[j] || 0;
        }
        if (Array.isArray(entry.examplesByOp)) {
            for (let j = 0; j < 4; j++) examplesByOp[j] += entry.examplesByOp[j] || 0;
        }
    }
    return { mistakesByOp, examplesByOp };
}

// То же, но без ограничения по периоду — суммирует по всем дням, какие есть в
// catData. Для op-bar чарта на слайде «Общая».
function computeOpBreakdownAllTime(catData) {
    const mistakesByOp = [0, 0, 0, 0];
    const examplesByOp = [0, 0, 0, 0];
    for (const k of Object.keys(catData)) {
        const entry = catData[k];
        if (Array.isArray(entry.mistakesByOp)) {
            for (let j = 0; j < 4; j++) mistakesByOp[j] += entry.mistakesByOp[j] || 0;
        }
        if (Array.isArray(entry.examplesByOp)) {
            for (let j = 0; j < 4; j++) examplesByOp[j] += entry.examplesByOp[j] || 0;
        }
    }
    return { mistakesByOp, examplesByOp };
}

// Форматирует секунды в «HHч MMм» или «MMм SSс» в зависимости от величины.
function formatLongTime(seconds) {
    if (seconds < 60) return `${seconds}с`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}ч ${m}м`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function renderOverallSlide(slideEl) {
    // Источник для «Общая» — независимая категория overall в моке. Считаем три
    // среза: all-time, последние 30 дней, последние 7 дней. Ключи объекта
    // совпадают со значениями data-period в HTML.
    const data = loadStats('overall');
    const periods = {
        all:  computeAllTime(data),
        '30d': computeWindowed(data, 30),
        '7d':  computeWindowed(data, 7),
    };

    const fillMetric = (metric, format) => {
        for (const periodKey of Object.keys(periods)) {
            const el = slideEl.querySelector(
                `.stat-cmp-val[data-metric="${metric}"][data-period="${periodKey}"]`
            );
            if (el) el.textContent = format(periods[periodKey]);
        }
    };

    fillMetric('totalTime',     s => formatLongTime(s.totalTime));
    fillMetric('totalExamples', s => s.totalExamples);
    fillMetric('totalSessions', s => s.totalSessions);
    fillMetric('totalMistakes', s => s.totalMistakes);
    fillMetric('avgTime',       s => formatLongTime(s.avgTime));
    fillMetric('avgExamples',   s => s.avgExamples);
    fillMetric('avgMistakes',   s => s.avgMistakes);

    const opBarContainer = slideEl.querySelector('.stat-graph[data-metric="opBar"]');
    if (opBarContainer) {
        drawOpBarChart(opBarContainer, computeOpBreakdownAllTime(data));
    }
}

function renderCategoryGraphSlide(slideEl) {
    const category = slideEl.dataset.category;
    const data = loadStats(category);
    const days = statPeriod === 'week' ? 7 : 30;
    const filtered = filterLastNDays(data, days);
    const opBreakdown = computeOpBreakdown(data, days);

    const { avgTimeSec, avgExamples } = computeAverages(filtered);
    slideEl.querySelector('.stat-avg-value[data-avg="time"]').textContent = formatAvgTime(avgTimeSec);
    slideEl.querySelector('.stat-avg-value[data-avg="examples"]').textContent = avgExamples;

    drawChart(slideEl.querySelector('.stat-graph[data-metric="time"]'),     filtered, 'time',     'blue');
    drawChart(slideEl.querySelector('.stat-graph[data-metric="examples"]'), filtered, 'examples', 'green');
    drawStackedDailyChart(slideEl.querySelector('.stat-graph[data-metric="dailyStacked"]'), filtered);
    drawOpBarChart(slideEl.querySelector('.stat-graph[data-metric="opBar"]'), opBreakdown);
}

function renderStatSlide(slideEl) {
    if (slideEl.dataset.category === 'overall') {
        renderOverallSlide(slideEl);
    } else {
        renderCategoryGraphSlide(slideEl);
    }
}

function renderAllStatSlides() {
    statMorrisInstances = [];
    document.querySelectorAll('.stat-slide').forEach(slide => {
        slide.querySelectorAll('.stat-graph').forEach(g => g.innerHTML = '');
    });
    document.querySelectorAll('.stat-slide').forEach(renderStatSlide);
}

function setStatPeriod(p) {
    if (p !== 'week' && p !== 'month') return;
    statPeriod = p;
    document.querySelectorAll('.stat-period-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.period === p);
    });
    // Перерисовываем все слайды под новый period (Неделя — 7 дней, Месяц — 30).
    // overall на period не реагирует (там собственные срезы внутри), но дешевле
    // вызвать единый рендер, чем разводить ветки.
    renderAllStatSlides();
    // Если пользователь сейчас на «Общей», дополнительно автопереключаемся на
    // «Большой» — тогда же показываются кнопки Большой/Малый (через
    // updateCategoryButtonsVisibility внутри setStatCategory).
    if (currentStatCategory() === 'overall') {
        setStatCategory('big');
    }
}

// Возвращает текущую активную категорию по позиции внутреннего swiper'а
// (источник истины), с фоллбэком на 'overall' до инициализации.
function currentStatCategory() {
    if (statSwiper && Number.isInteger(statSwiper.activeIndex)) {
        return STAT_CATEGORIES[statSwiper.activeIndex] || 'overall';
    }
    return 'overall';
}

// Показ/скрытие второй строки кнопок (Большой/Малый): прячем, когда активна
// «Общая», показываем на категориях big/small. CSS-класс .stat-row-hidden
// делает display:none.
function updateCategoryButtonsVisibility(cat) {
    const row = document.getElementById('stat-row-cat');
    if (!row) return;
    row.classList.toggle('stat-row-hidden', cat === 'overall');
}

// Категория переключает слайд во внутреннем Swiper и обновляет .active на
// нужной cat-кнопке. Период (week/month) живёт отдельно — не сбрасываем.
function setStatCategory(cat) {
    if (!STAT_CATEGORIES.includes(cat)) return;
    const idx = STAT_CATEGORIES.indexOf(cat);
    if (statSwiper) statSwiper.slideTo(idx);
    document.querySelectorAll('.stat-cat-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === cat);
    });
    updateCategoryButtonsVisibility(cat);
}

function statisticOpen() {
    if (mainSwiper) mainSwiper.slideTo(SLIDE_STATISTIC);

    // Ленивая инициализация вложенного Swiper. Свайп между категориями отключён
    // (как и mainSwiper) — переключение только через кнопки в шапке. Это
    // освобождает touch-события для вертикальной прокрутки внутри слайда:
    // когда контент длиннее экрана (4 графика на Большой/Малый), пользователь
    // листает слайд вверх-вниз без конкуренции со стороны Swiper. slideChange
    // на всякий случай оставлен — он синхронизирует кнопки и при программном
    // вызове slideTo из setStatCategory.
    if (!statSwiper) {
        statSwiper = new Swiper('.stat-swiper', {
            speed: 350,
            initialSlide: 0,
            spaceBetween: 0,
            allowTouchMove: false,
            simulateTouch: false,
            on: {
                slideChange: function () {
                    const cat = STAT_CATEGORIES[this.activeIndex] || 'overall';
                    document.querySelectorAll('.stat-cat-btn').forEach(b => {
                        b.classList.toggle('active', b.dataset.cat === cat);
                    });
                    updateCategoryButtonsVisibility(cat);
                },
            },
        });
    } else {
        statSwiper.slideTo(0, 0);
    }
    // Каждое открытие — на «Общая»
    document.querySelectorAll('.stat-cat-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.cat === 'overall');
    });
    updateCategoryButtonsVisibility('overall');

    // Сброс «бокового» поворота на случай если пользователь оставил перевёрнутым
    document.getElementById('statistic-root').classList.remove('flipped');

    // statsLoad() возвращает уже-разрешённую промиссу, если данные уже в кэше
    // (обычный случай — кэш греется в DOMContentLoaded). Если открыли страницу
    // ДО завершения CloudStorage-загрузки, ждём её и затем рендерим.
    statsLoad().then(() => {
        setTimeout(() => { if (statSwiper) statSwiper.update(); renderAllStatSlides(); }, 60);
    });
}

function statisticClose() {
    if (mainSwiper) mainSwiper.slideTo(SLIDE_MAIN1);
}

// Период (неделя/месяц)
document.querySelectorAll('.stat-period-btn').forEach(btn => {
    btn.addEventListener('click', () => setStatPeriod(btn.dataset.period));
});

// Категория (общая/большой/малый)
document.querySelectorAll('.stat-cat-btn').forEach(btn => {
    btn.addEventListener('click', () => setStatCategory(btn.dataset.cat));
});

// «Поворот экрана» — как у смартфона: ландшафтный rotate(90deg) с подменой
// width/height (см. .statistic.flipped в style.css). Тогл по клику.
document.getElementById('stat-flip-icon').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('statistic-root').classList.toggle('flipped');
});

// Перевод оси скролла в flipped-режиме. После transform: rotate(90deg) на
// .statistic-flip-inner DOM-y контента визуально становится физической
// горизонталью. Browser native-scroll реагирует только на физически-вертикальные
// жесты — это контр-интуитивно, потому что контент визуально лежит вбок и
// пользователь ожидает физически-горизонтального жеста. Этот pointer-handler
// ловит drag по .statistic-root и переводит физический dx в scrollTop активного
// слайда. Работает только когда панель flipped и драг начался ВНЕ хедера.
//
// Ключевой момент — pointer НЕ захватывается сразу на pointerdown. Сначала
// смотрим, реальный ли это драг (сдвиг > DRAG_THRESHOLD) или просто тап по
// точке графика. Если тап — события идут Morris'у нормально, tooltip
// показывается. Если драг — setPointerCapture перенаправляет последующие
// pointermove на root, Morris перестаёт получать события, и мы скроллим.
// Так одно касание совмещает интерактив графика и скролл.
(function setupFlippedScrollTranslation() {
    const root = document.getElementById('statistic-root');
    if (!root) return;
    let dragging = false;
    let captured = false;
    let startX = 0;
    let lastX = 0;
    const DRAG_THRESHOLD = 5;

    root.addEventListener('pointerdown', (e) => {
        if (!root.classList.contains('flipped')) return;
        if (e.target.closest('.statistic-header')) return;
        dragging = true;
        captured = false;
        startX = e.clientX;
        lastX = e.clientX;
    });

    root.addEventListener('pointermove', (e) => {
        if (!root.classList.contains('flipped') || !dragging) return;
        if (!captured) {
            if (Math.abs(e.clientX - startX) < DRAG_THRESHOLD) return;
            // Порог пройден — забираем pointer у Morris/графика
            try { root.setPointerCapture(e.pointerId); } catch (_) {}
            captured = true;
        }
        const slide = document.querySelector('.stat-slide.swiper-slide-active');
        if (!slide) return;
        const dx = e.clientX - lastX;
        if (dx === 0) return;
        // Знак: при rotate(90deg) cw пользователь, наклонив голову вправо для
        // чтения, воспринимает физический +x как «вверх» (вперёд по контенту).
        // Драг вверх (=phys-right, dx>0) ⇒ scrollTop +=.
        slide.scrollTop += dx;
        lastX = e.clientX;
    });

    const endDrag = (e) => {
        dragging = false;
        captured = false;
        if (e && e.pointerId !== undefined) {
            try { root.releasePointerCapture(e.pointerId); } catch (_) {}
        }
    };
    root.addEventListener('pointerup', endDrag);
    root.addEventListener('pointercancel', endDrag);
})();

// Debug: засеять/обнулить статистику из консоли. Пишет в stats_v2 — то же
// хранилище, что и реальные данные, так что после регенерации страница
// статистики покажет именно это.
window.regenerateMockStats = () => {
    const today = new Date();
    const out = emptyStats();
    for (let i = 34; i >= 0; i--) {
        const d = new Date(today); d.setDate(d.getDate() - i);
        const dk = dateKey(d);
        const block = _ensureDay(out, dk);
        for (const cat of STAT_CATEGORIES) {
            block[cat] = _genMockDay(cat);
        }
    }
    _statsCache = out;
    _statsLoaded = true;
    _persistStats();
    renderAllStatSlides();
};
window.clearMockStats = () => {
    _statsCache = emptyStats();
    _statsLoaded = true;
    _persistStats();
    renderAllStatSlides();
};

// Внутренний генератор «дня» — оставлен только для regenerateMockStats. ~20%
// дней нулевые, профиль активности зависит от категории.
function _genMockDay(profile) {
    if (Math.random() < 0.2) return emptyCatDay();
    let sessions, examplesPerSession, timePerExample, mistakeRate;
    if (profile === 'small') {
        sessions = randInt(1, 4);  examplesPerSession = randInt(8, 16);
        timePerExample = randInt(2, 6);   mistakeRate = Math.random() * 0.12;
    } else if (profile === 'big') {
        sessions = randInt(1, 3);  examplesPerSession = randInt(10, 22);
        timePerExample = randInt(8, 18);  mistakeRate = Math.random() * 0.35;
    } else {
        sessions = randInt(2, 6);  examplesPerSession = randInt(8, 20);
        timePerExample = randInt(4, 14);  mistakeRate = Math.random() * 0.2;
    }
    const examples = sessions * examplesPerSession;
    const time = examples * timePerExample;
    const examplesByOp = splitInto4(examples);
    const mistakesByOp = examplesByOp.map(e => {
        const opRate = mistakeRate * (0.4 + Math.random() * 1.4);
        return Math.min(e, Math.round(e * opRate));
    });
    const mistakes = mistakesByOp.reduce((a, b) => a + b, 0);
    return { time, examples, mistakes, sessions, examplesByOp, mistakesByOp };
}


function fromHomeToExample() { // переход с главного экрана на экран с примером

    // считываю чекбоксы + позиции ползунков и пишу в localStorage
    saveCurrentValues();
    examplesCount = values[9];

    // фиксируем начало новой сессии в статистике (учитывается в overall +
    // в активной категории, если пользователь нажал «Малый»/«Большой» и не
    // менял настройки руками)
    statsRecordSessionStart(getActivePreset());

    // переход на слайд с примерами
    if (mainSwiper) mainSwiper.slideTo(SLIDE_MAIN2);
    dinamicRange();
    // закрываю сообщение о победе
    block = document.getElementById('win-message');
    block.classList.add('none');

    clearInterval(Interval);
    Interval = setInterval(startTimer, 10);

    // обнуляю масив примеров, ошибки и количество примеров перед новой итерацией
    examples = [];
    mistake = 0, totalMistake = 0, mistakeTwo = 0, TimeForSaveOld = 0;
    score = 1;
    setExample();
}

function fromExampleToHome(back) {// переход с экрана с пирмером на главный экран

    // back===1 = нажатие «домой» в середине раунда. Текущий пример считаем
    // «попыткой»: записываем его в статистику (с учётом текущего mistake)
    // и показываем итог раунда. back===undefined = вызов из keyboardClick
    // после последнего правильного ответа — статистику для последнего примера
    // там уже записали, здесь только возврат UI.
    if (back === 1) {
        if (TimeForSaveOld == 0) {
            TimeForSave = seconds + (tens * 0.01);
        } else {
            TimeForSave = (seconds + (tens * 0.01)) - TimeForSaveOld;
        }
        TimeForSaveOld = seconds + (tens * 0.01);

        // opIndex текущего недорешённого примера — symbol из examples[(score-1)*4]
        const opIndex = examples[(score - 1) * 4];
        statsRecordExample(getActivePreset(), opIndex, Number(TimeForSave), mistake === 1);

        totalMistake += mistake;
        mistake = 0;
        mistakeTwo = 0;

        let a = tens <= 9 ? "0" + tens : tens;
        let b = seconds <= 9 ? "0" + seconds : seconds;
        document.getElementById('win-mistakes').textContent = totalMistake;
        document.getElementById('win-time').textContent = `${b}:${a}`;
        document.getElementById('win-message').classList.remove('none');
    }

    //меняю ползунки и чекбоксы на сохраненные значения
    let test = localStorage.getItem('values');

    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (test === null || test === undefined || test === "") {
        for (let i = 0; i < 5; i++) {
            checkboxes[i].checked = true;
        }
    } else {
        let forMemery = test.split(',');
        for (let i = 0; i < 5; i++) {
            if (forMemery[i] == "true") {
                checkboxes[i].checked = true;
            }
        }
        dinamicRange();
    }

    // возврат на главную через свайпер
    if (mainSwiper) mainSwiper.slideTo(SLIDE_MAIN1);

    // обнуляю таймер
    clearInterval(Interval);
    tens = "";
    seconds = "";
    appendTens.innerHTML = tens;
    appendSeconds.innerHTML = seconds;

    let input = document.getElementById('example-answer');
    input.outerHTML = `<p id="example-answer"></p>`;
}

// Сохраняет текущее состояние чекбоксов и позиций ползунков в localStorage.values.
// Вызывается из: change-обработчика слайдеров (отпускание ручки), smallRange/bigRange
// (программный .val() не стреляет change), fromHomeToExample (старт раунда).
// Подписи рядом со слайдерами (.easy-basket-lower и т.д.) пишет setFill — здесь
// мы их просто читаем, потому что они уже отражают актуальную позицию.
function saveCurrentValues() {
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (let i = 0; i < 5; i++) {
        values[i] = checkboxes[i].checked;
    }
    const inputs = document.querySelectorAll('input[type="text"]');
    values[5] = inputs[0].value;
    values[6] = inputs[1].value;
    values[7] = inputs[2].value;
    values[8] = inputs[3].value;
    values[9] = inputs[4].value;
    cloudSet('values', values);
}

function dinamicRange() { // ставит ползунки на сохранённые значения values[5..9]
    // Просто проставляем .val() и триггерим input — setFill из jQuery.ready
    // блоков (внизу файла) сам пересчитает fill и обновит подписи. Так формула
    // fill = (val - min) * 100 / (max - min) живёт в ОДНОМ месте, без копий
    // здесь / в smallRange / в bigRange — иначе любое расхождение между копиями
    // даёт визуальный баг "fill не там, где должен быть".
    const test = localStorage.getItem('values');
    if (!test) return;
    const v = test.split(',');

    $('.lower').val(v[5]);
    $('.upper').val(v[6]);
    $('.lower-double').val(v[7]);
    $('.upper-double').val(v[8]);
    $('.lower-three').val(v[9]);

    $('.lower').trigger('input');
    $('.upper').trigger('input');
    $('.lower-double').trigger('input');
    $('.upper-double').trigger('input');
    $('.lower-three').trigger('input');
}


function smallRange() {  // ставит ползунки в позиции из rangesPresets.small*
    const presets = loadRangesPresets();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes[0].checked = true;
    checkboxes[1].checked = true;
    checkboxes[2].checked = true;
    checkboxes[3].checked = true;
    checkboxes[4].checked = true;

    // Проставляем .val() и триггерим input — setFill сам пересчитает fill и
    // обновит подписи. Формула fill живёт ТОЛЬКО в setFill, копий тут не плодим.
    $('.lower').val(presets.smallSumLower);
    $('.upper').val(presets.smallSumUpper);
    $('.lower-double').val(presets.smallMulLower);
    $('.upper-double').val(presets.smallMulUpper);
    $('.lower-three').val(presets.smallCount);

    $('.lower').trigger('input');
    $('.upper').trigger('input');
    $('.lower-double').trigger('input');
    $('.upper-double').trigger('input');
    $('.lower-three').trigger('input');

    // .val() программно не стреляет change — сохраняем явно после того, как
    // setFill (через trigger выше) уже обновил подписи рядом со слайдерами.
    saveCurrentValues();
    setActivePreset('small');
}

function bigRange() {  // ставит ползунки в позиции из rangesPresets.big*
    const presets = loadRangesPresets();
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    checkboxes[0].checked = true;
    checkboxes[1].checked = true;
    checkboxes[2].checked = true;
    checkboxes[3].checked = true;
    checkboxes[4].checked = false;

    $('.lower').val(presets.bigSumLower);
    $('.upper').val(presets.bigSumUpper);
    $('.lower-double').val(presets.bigMulLower);
    $('.upper-double').val(presets.bigMulUpper);
    $('.lower-three').val(presets.bigCount);

    $('.lower').trigger('input');
    $('.upper').trigger('input');
    $('.lower-double').trigger('input');
    $('.upper-double').trigger('input');
    $('.lower-three').trigger('input');

    saveCurrentValues();
    setActivePreset('big');
}

function startTimer() { // реализация таймера
    tens++;
    if (values[4] == "true" || values[4] == true) {
        if (seconds == 0 || seconds == 'none') {
            appendSeconds.innerHTML = "00";
        }
    }
    if (tens > 99) {
        seconds++;
        if (values[4] == "true" || values[4] == true) {
            appendSeconds.innerHTML = "0" + seconds;
        }
        tens = 0;
    }

    if (seconds > 9) {
        if (values[4] == "true" || values[4] == true) {
            appendSeconds.innerHTML = seconds;
        }
    }
}

function keyboardClick(value) {
    let input = document.getElementById('example-answer');
    let answerUser = input.textContent;
    if (value == "delete") {
        answerUser = answerUser.slice(0, answerUser.length - 1);
        input.outerHTML = `<p id="example-answer">${answerUser}</p>`;
    } else if (value == "enter") {
        if (answerUser == answer) {
            // opIndex текущего примера читаем ДО инкремента score
            const opIndex = examples[(score - 1) * 4];

            score++;
            input.outerHTML = `<p id="example-answer"></p>`;
            blink('example-answer-block', 'good');

            if (TimeForSaveOld == 0) {
                TimeForSave = seconds + (tens * 0.01);
            } else {
                TimeForSave = (seconds + (tens * 0.01)) - TimeForSaveOld;
            }
            TimeForSaveOld = seconds + (tens * 0.01);

            // единая точка записи: пишем и в overall, и в активную категорию.
            // Работает и в браузере (localStorage), и в Telegram (CloudStorage).
            statsRecordExample(getActivePreset(), opIndex, Number(TimeForSave), mistake === 1);

            totalMistake += mistake;
            mistake = 0;       // сброс синхронный — а не внутри async-callback,
            mistakeTwo = 0;    // как было раньше (баг в браузерной ветке)

            if (score >= (+examplesCount + 1)) {
                let a;
                if (tens <= 9) {
                    a = "0" + tens;
                } else {
                    a = tens;
                }
                let b;
                if (seconds <= 9) {
                    b = "0" + seconds;
                } else {
                    b = seconds;
                }
                document.getElementById('win-mistakes').textContent = totalMistake;
                document.getElementById('win-time').textContent = `${b}:${a}`;
                document.getElementById('win-message').classList.remove('none');
                fromExampleToHome();
            } else {
                setExample();
            }
        } else {
            mistake = 1;
            mistakeTwo = 1;
            blink('example-answer-block', 'bad')
        }
    } else if (answerUser.length < 6) {
        answerUser += value;
        input.outerHTML = `<p id="example-answer">${answerUser}</p>`;
    } else {
        blink('example-answer-block', 'bad')
    }
}

function setExample() { // создаю пример и вывожу на экран
    // 0+   1-   2x   3/  4t  5+-(min)  6+-(max)  7x/(min)  8x/(max) 

    numberOne = 0;
    numberTwo = 0;
    let symbol;
    let symbolArray = ['+', '−', '⋅', '∶',];
    // window.Telegram.WebApp.CloudStorage.getItem("values", (err,test) => {
    // values = test.split(',');
    values = localStorage.getItem('values').split(',');

    for (let exit = 0; exit < 10; exit++) { // проверка на то были ли уже в предыдущих примерах подобные ответы или операнды
        let a = 0;
        for (let i = 0; i < 5;) { // рандомлю знак из тех что доступны
            symbol = randomNumber(0, 3);
            if (values[symbol] == "true") {
                i = 10;
            }
        }

        switch (symbol) { // создаю числа для примера
            case 0: // '+'
                numberOne = randomNumber(+values[5], +values[6]);
                numberTwo = randomNumber(+values[5], +values[6]);
                answer = numberOne + numberTwo;
                break;
            case 1:// '-'
                for (let exit = 0; exit < 10;) {
                    numberOne = randomNumber(+values[5], +values[6]);
                    numberTwo = randomNumber(+values[5], +values[6]);
                    let a;
                    if (numberOne < numberTwo) {
                        answer = numberTwo - numberOne;
                        a = numberTwo;
                        numberTwo = numberOne;
                        numberOne = a;
                        exit = 100;
                    } else if (numberOne = numberTwo) {
                    } else {
                        answer = numberOne - numberTwo;
                        exit = 100;
                    }
                }
                break;
            case 2:// '*'
                numberOne = randomNumber(+values[7], +values[8]);
                numberTwo = randomNumber(+values[7], +values[8]);
                answer = numberOne * numberTwo;
                break;
            case 3:// '/'
                let forSort;
                for (let i = 0; i < 1;) {
                    numberOne = randomNumber(+values[7], +values[8]);
                    numberTwo = randomNumber(+values[7], +values[8]);
                    if (numberOne == numberTwo || numberOne == 0 || numberTwo == 0 || numberOne == 1 || numberTwo == 1) {
                    } else {
                        forSort = numberOne * numberTwo;
                        numberOne = forSort;
                        answer = forSort / numberTwo;
                        i++;
                    }
                }
                break;
        }
        for (let i = 1; i <= examplesCount; i++) {
            if (symbol == examples[(i - 1) * 4]) {
                if (examples[(i - 1) * 4 + 3] == answer || examples[(i - 1) * 4 + 1] == numberOne || examples[(i - 1) * 4 + 1] == numberTwo || examples[(i - 1) * 4 + 2] == numberOne || examples[(i - 1) * 4 + 2] == numberTwo) {
                    i = 100;
                } else {
                    a++;
                }
            } else {
                a++;
            }
        }
        if (a == examplesCount) { exit = 100; } // если прошло сверку со всеми 10 примерами то 
        examples[(score - 1) * 4] = symbol;
        examples[(score - 1) * 4 + 1] = numberOne;
        examples[(score - 1) * 4 + 2] = numberTwo;
        examples[(score - 1) * 4 + 3] = answer;
        // console.log(examples);
        // console.log(a,'a', exit, 'exit');
        // exit=0;
    }
    // });

    let inputExample = document.getElementById('example');
    inputExample.outerHTML = `<p id="example">${numberOne} ${symbolArray[symbol]} ${numberTwo}</p>`;

    let inputScore = document.getElementById('score');
    inputScore.outerHTML = `<p id="score">${score}/${examplesCount}</p>`;
}

function randomNumber(min, max) { // генерациия рандомных чисел
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function blink(input, value) { // при проверках подсвечивать правильные или неправильные действия
    let inputt = document.getElementById(input);
    inputt.style.transition = "0.4s";
    if (value == 'bad') {
        inputt.classList.add('blink-bad');
        setTimeout(function () {
            inputt.classList.remove('blink-bad');
        }, 400);
    } else {
        inputt.classList.add('blink-good');
        setTimeout(function () {
            inputt.classList.remove('blink-good');
        }, 400);
    }
}

function checkChekBox(value) { // проверка есть ли хоть один закрытый чекбокс
    let checkboxes = document.querySelectorAll('input[type="checkbox"]');
    let a = 0;
    for (let i = 0; i < 4; i++) {
        values[i] = checkboxes[i].checked;
        if (checkboxes[i].checked == true) {
            a++;
        }
    }
    if (a == 0) {
        checkboxes[value].checked = true;
    }
    // Ручное изменение настроек инвалидирует активный пресет — раунд больше
    // не считается «Малым»/«Большим», даже если значения совпадают.
    setActivePreset(null);
}

function differentTheme(value) { // выдвижение горизонтальной панели настроек
    if (value == 'close') {
        document.getElementById('settings-menu').style.width = '0';
        document.getElementById('different-theme-block').style.width = '0';
        // При закрытии всей панели схлопываем и внутренние выпадающие списки —
        // пользователь обычно не хочет, чтобы они оставались раскрытыми на
        // следующий раз. Внутри открытой панели dropdown по-прежнему меняется
        // только повторным кликом по своему триггеру.
        document.getElementById('theme-dropdown').classList.remove('open');
        document.getElementById('ranges-dropdown').classList.remove('open');
        document.getElementById('sizes-dropdown').classList.remove('open');
    } else if (value == 'open') {
        // три пункта по 7vh + два gap по 0.8vh = 22.6vh
        document.getElementById('settings-menu').style.width = '22.6vh';
        document.getElementById('different-theme-block').style.width = '100vw';
    }
}

// доступные темы и дефолт. Имена должны совпадать с :root[data-theme="..."] в thems/themes.css
const THEMES = ['light', 'white', 'gray', 'dark', 'black', 'blue', 'green', 'purple', 'orange'];
const THEME_DEFAULT = 'light';

function applyTheme(name) {
    if (!THEMES.includes(name)) name = THEME_DEFAULT;
    document.documentElement.setAttribute('data-theme', name);
    cloudSet('userTheme', name);
    // подсвечиваю активный свотч (на момент первого вызова DOM уже распарсен —
    // main.js подключён в конце <body>)
    document.querySelectorAll('.theme-swatch').forEach(s => {
        s.classList.toggle('active-theme', s.dataset.themeName === name);
    });
    // обновляю визуал индикатора текущей темы — он использует те же классы
    // theme-swatch-{name}, что и свотчи в выпадающем списке, только бэкграунд
    const indicator = document.getElementById('current-theme-indicator');
    if (indicator) {
        indicator.className = 'current-theme-indicator theme-swatch-' + name;
    }
}





// Применяет настройки из localStorage к UI: тема, размеры, границы, пресеты,
// чекбоксы и позиции ползунков. Идемпотентна — можно дёрнуть и до, и после
// bootstrapCloudStorage (второй вызов перекинет UI на свежие cloud-значения).
function applyUIFromLocalStorage() {
    applyTheme(localStorage.getItem('userTheme'));
    applySizeSettings(loadSizeSettings());
    const bounds = loadRangesBounds();
    applyRangesBounds(bounds);
    fillRangesInputs(bounds);
    fillPresetsInputs(loadRangesPresets());

    const stored = localStorage.getItem('values');
    const checkboxes = document.querySelectorAll('input[type="checkbox"]');
    if (stored === null || stored === undefined || stored === '') {
        for (let i = 0; i < 5; i++) checkboxes[i].checked = true;
    } else {
        const fM = stored.split(',');
        for (let i = 0; i < 5; i++) checkboxes[i].checked = (fM[i] === 'true');
        dinamicRange();
    }
}

document.addEventListener('DOMContentLoaded', () => { // первый заход и разложение сохраненных значений

    // инициализация Swiper: палец-свайп отключён, переходы только программно через slideTo
    mainSwiper = new Swiper('.main-swiper', {
        allowTouchMove: false,
        initialSlide: SLIDE_MAIN1,
        speed: 350,
        simulateTouch: false,
    });

    window.Telegram.WebApp.expand();
    window.Telegram.WebApp.disableVerticalSwipes();

    // 1) Сразу применяем то, что есть в localStorage — UI не вспыхивает
    //    дефолтами на первом кадре.
    applyUIFromLocalStorage();

    // 2) Прогреваем кэш статистики. В Telegram — из CloudStorage + merge
    //    с localStorage (см. statsLoad), в браузере — sync.
    statsLoad();

    // 3) Подтягиваем все settings-ключи из CloudStorage и переприменяем UI
    //    (актуально при заходе с нового устройства / переустановки). В
    //    браузере вне Telegram bootstrapCloudStorage резолвится сразу,
    //    повторный applyUIFromLocalStorage даёт идемпотентный no-op.
    bootstrapCloudStorage().then(() => {
        applyUIFromLocalStorage();
    });
})




jQuery(document).ready(function () { // код первого ползунка диапозона на старте
    $('.upper').on('input', setFill);
    $('.lower').on('input', setFill);
    // change стреляет при отпускании ручки — сохраняем позицию + сбрасываем
    // активный пресет (ручная правка ≠ Малый/Большой). smallRange/bigRange
    // триггерят 'input', не 'change', так что программная установка не
    // зачищает только что выставленный пресет.
    $('.upper, .lower').on('change', () => { saveCurrentValues(); setActivePreset(null); });

    function setFill(evt) {
        // max/min читаем свежими — границы могут меняться из панели настроек
        // (см. applyRangesBounds), иначе фил/числа рисуются по старому max.
        var max = $('.upper').attr('max');
        var min = $('.lower').attr('min');
        var valUpper = $('.upper').val();
        var valLower = $('.lower').val();

        if (parseFloat(valLower) > parseFloat(valUpper)) {
            var trade = valLower;
            valLower = valUpper;
            valUpper = trade;
        }

        var width = (valUpper - min) * 100 / (max - min);
        var left = (valLower - min) * 100 / (max - min);
        $('.fill').css('left', 'calc(' + left + '%)');
        $('.fill').css('width', width - left + '%');

        $('.easy-basket-lower').val(parseInt(valLower));
        $('.easy-basket-upper').val(parseInt(valUpper));
        $('.histogram-list li').removeClass('ui-histogram-active');
    }

    // keyup на disabled-инпутах фактически не стреляет, но чиним для надёжности:
    // читаем max/min свежими, проверки сверяем с актуальной границей.
    $('.easy-basket-filter-info p input').keyup(function () {
        var max = $('.upper').attr('max');
        var min = $('.lower').attr('min');
        var valUpper = $('.easy-basket-upper').val();
        var valLower = $('.easy-basket-lower').val();
        var width = (valUpper - min) * 100 / (max - min);
        var left = (valLower - min) * 100 / (max - min);
        if (valUpper > max) {
            left = max;
        }
        if (valLower < min || valLower > max) {
            left = min;
        }
        $('.fill').css('left', 'calc(' + left + '%)');
        $('.fill').css('width', width - left + '%');
        $('.lower').val(valLower);
        $('.upper').val(valUpper);
    });
    $('.easy-basket-filter-info p input').focus(function () {
        $(this).val('');
    });
    $('.easy-basket-filter-info .iLower input').blur(function () {
        var valLower = $('.lower').val();
        $(this).val(Math.floor(valLower));
    });
    $('.easy-basket-filter-info .iUpper input').blur(function () {
        var valUpper = $('.upper').val();
        $(this).val(Math.floor(valUpper));
    });

    // После регистрации setFill — триггерим input один раз, чтобы fill и
    // подписи отрисовались под уже выставленные dinamicRange'ом значения.
    // dinamicRange сам триггерит из DOMContentLoaded-обработчика, но это
    // случается ДО регистрации setFill в этом .ready блоке, поэтому без этого
    // триггера fill оставался невычисленным до первого перетаскивания.
    $('.lower').trigger('input');
});

jQuery(document).ready(function () {  // код второго ползунка диапозона на старте
    $('.upper-double').on('input', setFill);
    $('.lower-double').on('input', setFill);
    $('.upper-double, .lower-double').on('change', () => { saveCurrentValues(); setActivePreset(null); });

    function setFill(evt) {
        var max = $('.upper-double').attr('max');
        var min = $('.lower-double').attr('min');
        var valUpper = $('.upper-double').val();
        var valLower = $('.lower-double').val();
        if (parseFloat(valLower) > parseFloat(valUpper)) {
            var trade = valLower;
            valLower = valUpper;
            valUpper = trade;
        }

        var width = (valUpper - min) * 100 / (max - min);
        var left = (valLower - min) * 100 / (max - min);
        $('.fill-double').css('left', 'calc(' + left + '%)');
        $('.fill-double').css('width', width - left + '%');

        $('.easy-basket-lower-double').val(parseInt(valLower));
        $('.easy-basket-upper-double').val(parseInt(valUpper));
        $('.histogram-list li').removeClass('ui-histogram-active');
    }

    $('.easy-basket-filter-info-double p input').keyup(function () {
        var max = $('.upper-double').attr('max');
        var min = $('.lower-double').attr('min');
        var valUpper = $('.easy-basket-upper-double').val();
        var valLower = $('.easy-basket-lower-double').val();
        var width = (valUpper - min) * 100 / (max - min);
        var left = (valLower - min) * 100 / (max - min);
        if (valUpper > max) {
            left = max;
        }
        if (valLower < min || valLower > max) {
            left = min;
        }
        $('.fill-double').css('left', 'calc(' + left + '%)');
        $('.fill-double').css('width', width - left + '%');
        $('.lower-double').val(valLower);
        $('.upper-double').val(valUpper);
    });
    $('.easy-basket-filter-info-double p input').focus(function () {
        $(this).val('');
    });
    $('.easy-basket-filter-info-double .iLower-double input').blur(function () {
        var valLower = $('.lower-double').val();
        $(this).val(Math.floor(valLower));
    });
    $('.easy-basket-filter-info-double .iUpper-double input').blur(function () {
        var valUpper = $('.upper-double').val();
        $(this).val(Math.floor(valUpper));
    });

    // см. комментарий в первом .ready блоке — триггерим input один раз после
    // регистрации setFill, чтобы fill пересчитался под текущие значения.
    $('.lower-double').trigger('input');
});

jQuery(document).ready(function () {  // код ползунка количества уровней
    // ползунок одноручный — .upper-three в HTML нет; селектор остаётся "на всякий".
    $('.lower-three').on('input', setFill);
    $('.lower-three').on('change', () => { saveCurrentValues(); setActivePreset(null); });

    function setFill(evt) {
        var max = $('.lower-three').attr('max');
        var min = $('.lower-three').attr('min');
        var valLower = $('.lower-three').val();
        // .fill-three в HTML нет, но запись в несуществующий селектор безвредна.
        var left = (valLower - min) * 100 / (max - min);
        $('.fill-three').css('left', 'calc(' + left + '%)');

        $('.easy-basket-lower-three').val(parseInt(valLower));
        $('.histogram-list li').removeClass('ui-histogram-active');
    }
    $('.easy-basket-filter-info-three p input').focus(function () {
        $(this).val('');
    });
    $('.easy-basket-filter-info-three .iLower-three input').blur(function () {
        var valLower = $('.lower-three').val();
        $(this).val(Math.floor(valLower));
    });
    $('.easy-basket-filter-info-three .iUpper-three input').blur(function () {
        var valUpper = $('.upper-three').val();
        $(this).val(Math.floor(valUpper));
    });

    // см. комментарий в первом .ready блоке — триггерим input один раз после
    // регистрации setFill, чтобы подпись пересчиталась под текущее значение.
    $('.lower-three').trigger('input');
});
