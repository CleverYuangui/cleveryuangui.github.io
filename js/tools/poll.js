'use strict';
const STORAGE_KEY = 'poll-candidates';
let candidates = [];
let id = 0;
let selectMode = false;
let selectedIds = new Set();

// DOM
const selectBtn = $('#selectBtn');
const resetBtn = $('#resetBtn');
const clearBtn = $('#clearBtn');
const clearAllBtn = $('#clearAllBtn');
const selectAllBtn = $('#selectAllBtn');
const unselectAllBtn = $('#unselectAllBtn');
const cancelBtn = $('#cancelBtn');
const sortBtn = $('#sortBtn');
const chooseBtn = $('#chooseBtn');
const normalActions = $('#normalActions');
const selectActions = $('#selectActions');
const grid = $('#grid');
const overlay = $('#overlay');
const selectOps = $('#selectOps');
const totalValue = $('#total');

const templateAddBtn = $('#templateAddBtn');
const templateAdd = $('#templateAdd');
const templateSort = $('#templateSort');
const templateChoose = $('#templateChoose');
const templateClearAll = $('#templateClearAll');
const templateCandidateMenu = $('#templateCandidateMenu');
const alertTextP = $('#alertText').content.querySelector('#alertTextP');
const alertTextN = $('#alertText').content.querySelector('#alertTextN');

// Storage
function save() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(
            candidates.map(function (c) { return { name: c.name, count: c.count }; })
        ));
    } catch (_) {}
}
function load() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const arr = JSON.parse(raw);
        if (!Array.isArray(arr)) return [];
        return arr.filter(function (x) { return x && typeof x.name === 'string'; })
            .map(function (x) {
                const n = Number(x.count);
                return { id: uid(), name: x.name, count: (isFinite(n) && n > 0) ? Math.floor(n) : 0 };
            });
    } catch (_) {
        return [];
    }
}
candidates = load();

// Parse Number
function parsePositiveInt(s) {
    if (!/^\d+$/.test(s)) return null;
    const n = parseInt(s, 10);
    if (!isFinite(n) || n <= 0) return null;
    return n;
}
function parseNonNegativeInt(s) {
    if (!/^\d+$/.test(s)) return null;
    const n = parseInt(s, 10);
    if (!isFinite(n) || n < 0) return null;
    return n;
}
function guardInput(inp, btn) {
    ['click', 'mousedown', 'mouseup', 'pointerdown', 'pointerup', 'touchstart', 'touchend', 'contextmenu'].forEach(function (evt) {
        inp.addEventListener(evt, function (e) { e.stopPropagation(); });
    });
    inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            btn.click();
        }
    });
}

// Modal
function closeModal() {
    overlay.hidden = true;
    templateAdd.hidden = true;
    templateSort.hidden = true;
    templateChoose.hidden = true;
    templateClearAll.hidden = true;
    templateCandidateMenu.hidden = true;
}
document.addEventListener('click', function (e) {
    if (e.target === overlay) closeModal();
});
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
});

// Calculate
function uid() {
    return ++id;
}
function total() {
    let res = 0;
    for (const item of candidates) res += item.count;
    return res;
}
function heatStyle(count, tot) {
    if (count === 0 || tot === 0) {
        return { bg: 'var(--card)', fg: 'var(--foreground)' };
    }
    const n = candidates.length;
    let ratio;
    if (n === 1 || n === 0) ratio = 1;
    else ratio = Math.pow(count / tot, 1 / Math.log(candidates.length));
    const hueL = parseFloat(cs.getPropertyValue('--heat-hue-low'));
    const hueH = parseFloat(cs.getPropertyValue('--heat-hue-high'));
    const sat = cs.getPropertyValue('--heat-sat').trim();
    const lig = cs.getPropertyValue('--heat-light').trim();
    const hue = hueL + (hueH - hueL) * ratio;
    return { bg: 'hsl(' + hue.toFixed(1) + ', ' + sat + ', ' + lig + ')', fg: 'white' };
}

// Render
function render() {
    const tot = total();
    totalValue.textContent = String(tot);
    grid.innerHTML = '';
    candidates.forEach(function (c) {
        const el = document.createElement('div');
        el.className = 'candidate';
        el.dataset.id = c.id;
        const st = heatStyle(c.count, tot);
        el.style.background = st.bg;
        el.style.color = st.fg;
        if (selectMode) {
            el.classList.add('in-select');
            if (selectedIds.has(c.id)) el.classList.add('selected');
        }
        const name = document.createElement('span');
        name.className = 'name';
        name.textContent = c.name;
        const count = document.createElement('span');
        count.className = 'count';
        count.textContent = String(c.count);
        el.appendChild(name);
        el.appendChild(count);
        if (selectMode) {
            const tick = document.createElement('span');
            tick.className = 'tick';
            el.appendChild(tick);
        }
        bindCandidate(el, c);
        grid.appendChild(el);
    });
    if (selectMode) {
        if (selectedIds.size === candidates.length) {
            selectAllBtn.hidden = true;
            unselectAllBtn.hidden = false;
        } else {
            selectAllBtn.hidden = false;
            unselectAllBtn.hidden = true;
        }
    }
    else {
        const clone = templateAddBtn.content.cloneNode(true);
        clone.querySelector('.add-btn').addEventListener('click', openAddModal);
        grid.appendChild(clone);
    }
}
function bindCandidate(el, c) {
    let suppressClick = false;
    let timer = null;
    el.addEventListener('click', function () {
        if (suppressClick) { suppressClick = false; return; }
        if (selectMode) {
            toggleSelect(c.id);
        } else {
            c.count += 1;
            save();
            render();
        }
    });
    el.addEventListener('contextmenu', function (e) {
        e.preventDefault();
        openCandidateMenu(c);
    });
    el.addEventListener('touchstart', function () {
        clearTimeout(timer);
        timer = setTimeout(function () {
            suppressClick = true;
            openCandidateMenu(c);
        }, 500);
    }, { passive: true });
    function cancelLP() { clearTimeout(timer); }
    el.addEventListener('touchend', cancelLP);
    el.addEventListener('touchmove', cancelLP);
    el.addEventListener('touchcancel', cancelLP);
}

// Add Modal
function openAddModal() {
    const inp = templateAdd.querySelector('#addInput');
    templateAdd.hidden = false;
    overlay.hidden = false;
    inp.value = '';
    inp.focus();
}
templateAdd.querySelector('#addBtnOk').addEventListener('click', function () {
    const inp = templateAdd.querySelector('#addInput');
    const name = inp.value.trim() || inp.placeholder;
    candidates.push({ id: uid(), name: name, count: 0 });
    save();
    render();
    closeModal();
});

// Candidate Menu
let currentCandidate;
function openCandidateMenu(c) {
    currentCandidate = c;
    templateCandidateMenu.hidden = false;
    overlay.hidden = false;
    templateCandidateMenu.querySelector('.section-label').textContent = c.name;
    ['#candidateBtnPlus', '#candidateBtnMinus', '#candidateBtnSet'].forEach(function (btn) {
        const inp = templateCandidateMenu.querySelector(btn).querySelector('.menu-input');
        inp.value = inp.dataset.default;
    });
    ['#candidateBtnRename'].forEach(function (btn) {
        const inp = templateCandidateMenu.querySelector(btn).querySelector('.menu-input');
        inp.value = '';
    });
}{
    const btn = templateCandidateMenu.querySelector('#candidateBtnPlus');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parsePositiveInt(inp.value.trim());
        if (v === null) {
            alert(alertTextP.textContent);
            return;
        }
        currentCandidate.count += v;
        save(); render(); closeModal();
    });
}{
    const btn = templateCandidateMenu.querySelector('#candidateBtnMinus');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parsePositiveInt(inp.value.trim());
        if (v === null) {
            alert(alertTextP.textContent);
            return;
        }
        currentCandidate.count = Math.max(0, currentCandidate.count - v);
        save(); render(); closeModal();
    });
}{
    const btn = templateCandidateMenu.querySelector('#candidateBtnSet');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parseNonNegativeInt(inp.value.trim());
        if (v === null) {
            alert(alertTextN.textContent);
            return;
        }
        currentCandidate.count = v;
        save(); render(); closeModal();
    });
}{
    const btn = templateCandidateMenu.querySelector('#candidateBtnRename');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = inp.value.trim() || inp.placeholder;
        currentCandidate.name = v;
        save(); render(); closeModal();
    });
}{
    const btn = templateCandidateMenu.querySelector('#candidateBtnDelete');
    btn.addEventListener('click', function () {
        candidates = candidates.filter(function (x) { return x.id != currentCandidate.id; });
        save(); render(); closeModal();
    });
}

// Select Mode
function enterSelectMode() {
    selectMode = true;
    selectedIds.clear();
    normalActions.hidden = true;
    selectActions.hidden = false;
    selectOps.hidden = false;
    buildSelectOps();
    render();
}
function exitSelectMode() {
    selectMode = false;
    selectedIds.clear();
    normalActions.hidden = false;
    selectActions.hidden = true;
    selectOps.hidden = true;
    render();
}
function toggleSelect(id) {
    if (selectedIds.has(id)) selectedIds.delete(id);
    else selectedIds.add(id);
    render();
}
function applyToSelected(fn) {
    if (selectedIds.size === 0) { return; }
    candidates.forEach(function (c) {
        if (selectedIds.has(c.id)) fn(c);
    });
    save();
    exitSelectMode();
}

function buildSelectOps() {
    ['#selectBtnPlus', '#selectBtnMinus', '#selectBtnMultiply', '#selectBtnDivideFloor', '#selectBtnDivideCeil', '#selectBtnSet'].forEach(function (btn) {
        const inp = selectOps.querySelector(btn).querySelector('.menu-input');
        inp.value = inp.dataset.default;
    });
    ['#selectBtnRename'].forEach(function (btn) {
        const inp = selectOps.querySelector(btn).querySelector('.menu-input');
        inp.value = '';
    });
}{
    const btn = selectOps.querySelector('#selectBtnPlus');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parsePositiveInt(inp.value.trim());
        if (v === null) {
            alert(alertTextP.textContent);
            return;
        }
        applyToSelected(function (c) { c.count += v; });
    });
}{
    const btn = selectOps.querySelector('#selectBtnMinus');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parsePositiveInt(inp.value.trim());
        if (v === null) {
            alert(alertTextP.textContent);
            return;
        }
        applyToSelected(function (c) { c.count = Math.max(0, c.count - v); });
    });
}{
    const btn = selectOps.querySelector('#selectBtnMultiply');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parsePositiveInt(inp.value.trim());
        if (v === null) {
            alert(alertTextP.textContent);
            return;
        }
        applyToSelected(function (c) { c.count = c.count * v; });
    });
}{
    const btn = selectOps.querySelector('#selectBtnDivideFloor');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parsePositiveInt(inp.value.trim());
        if (v === null) {
            alert(alertTextP.textContent);
            return;
        }
        applyToSelected(function (c) { c.count = Math.floor(c.count / v); });
    });
}{
    const btn = selectOps.querySelector('#selectBtnDivideCeil');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parsePositiveInt(inp.value.trim());
        if (v === null) {
            alert(alertTextP.textContent);
            return;
        }
        applyToSelected(function (c) { c.count = Math.ceil(c.count / v); });
    });
}{
    const btn = selectOps.querySelector('#selectBtnSet');
    const inp = btn.querySelector('.menu-input');
    guardInput(inp, btn);
    btn.addEventListener('click', function () {
        const v = parseNonNegativeInt(inp.value.trim());
        if (v === null) {
            alert(alertTextN.textContent);
            return;
        }
        applyToSelected(function (c) { c.count = v; });
    });
}{
    const btn = selectOps.querySelector('#selectBtnDelete');
    btn.addEventListener('click', function () {
        if (selectedIds.size === 0) { return; }
        candidates = candidates.filter(function(c) { return !selectedIds.has(c.id); });
        save();
        exitSelectMode();
    });
}

// Sort
function openSortModal() {
    templateSort.hidden = false;
    const empty = templateSort.querySelector('.modal-msg');
    const ol = templateSort.querySelector('.sort-list');
    ol.innerHTML = '';
    if (candidates.length === 0) {
        empty.hidden = false;
        ol.hidden = true;
    } else {
        empty.hidden = true;
        ol.hidden = false;
        const sorted = candidates.slice().sort(function (a, b) {
            if (b.count !== a.count) return b.count - a.count;
            return a.name.localeCompare(b.name);
        });
        sorted.forEach(function (c) {
            const li = document.createElement('li');
            const name = document.createElement('span');
            name.className = 'name';
            name.textContent = c.name;
            const cnt = document.createElement('span');
            cnt.className = 'count';
            cnt.textContent = c.count;
            li.appendChild(name);
            li.appendChild(cnt);
            ol.appendChild(li);
        });
    }
    overlay.hidden = false;
}

// Random Choose
function pickRandom() {
    const tot = total();
    if (tot === 0) {
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    let r = Math.random() * tot;
    for (let i = 0; i < candidates.length; i++) {
        r -= candidates[i].count;
        if (r < 0) return candidates[i];
    }
    return candidates[candidates.length - 1];
}
let chosen;
function openChooseModal() {
    templateChoose.hidden = false;
    const empty = templateChoose.querySelector('.modal-msg');
    const name = templateChoose.querySelector('.chosen-name');
    const row = templateChoose.querySelector('.menu-row');
    name.textContent = '';
    if (candidates.length === 0) {
        empty.hidden = false;
        name.hidden = true;
        row.hidden = true;
    } else {
        empty.hidden = true;
        name.hidden = false;
        row.hidden = false;
        chosen=pickRandom();
        name.textContent = chosen.name;
    }
    overlay.hidden = false;
}
templateChoose.querySelector('#chooseBtnOK').addEventListener('click', closeModal);
templateChoose.querySelector('#chooseBtnAgain').addEventListener('click', openChooseModal);
templateChoose.querySelector('#chooseBtnClear').addEventListener('click', function () {
    const idx = candidates.findIndex(function (x) { return x.id === chosen.id; });
    if (idx >= 0) candidates[idx].count = 0;
    save();
    render();
});
templateChoose.querySelector('#chooseBtnDelete').addEventListener('click', function () {
    candidates = candidates.filter(function (x) { return x.id !== chosen.id; });
    save();
    render();
});

// ClearAll Confirm
function openClearAllConfirm() {
    templateClearAll.hidden = false;
    overlay.hidden = false;
}
templateClearAll.querySelector('#clearBtnCancel').addEventListener('click', closeModal);
templateClearAll.querySelector('#clearBtnYes').addEventListener('click', function () {
    candidates = [];
    id = 0;
    save();
    render();
    closeModal();
});

// Event Listeners
render();
resetBtn.addEventListener('click', function () {
    candidates = [{ id: 1, name: '01 鲍美旭', count: 0 }, { id: 2, name: '02 段怡宁', count: 0 }, { id: 3, name: '03 王照杰', count: 0 }, { id: 4, name: '04 许欣怡', count: 0 }, { id: 5, name: '05 杨听云', count: 0 }, { id: 6, name: '06 周文晴', count: 0 }, { id: 7, name: '07 曾益', count: 0 }, { id: 8, name: '08 陈昊运', count: 0 }, { id: 9, name: '09 方奕航', count: 0 }, { id: 10, name: '10 冯振修', count: 0 }, { id: 11, name: '11 郭璟然', count: 0 }, { id: 12, name: '12 华奕夫', count: 0 }, { id: 13, name: '13 黄隽杰', count: 0 }, { id: 14, name: '14 蒋彧翎', count: 0 }, { id: 15, name: '15 李恩潺', count: 0 }, { id: 16, name: '16 李泊霖', count: 0 }, { id: 17, name: '17 李熙澳', count: 0 }, { id: 18, name: '18 刘善岩', count: 0 }, { id: 19, name: '19 刘天恺', count: 0 }, { id: 20, name: '20 陆博仁', count: 0 }, { id: 21, name: '21 陆璟文', count: 0 }, { id: 22, name: '22 马敬知', count: 0 }, { id: 23, name: '23 邱裴麟', count: 0 }, { id: 24, name: '24 邱语桐', count: 0 }, { id: 25, name: '25 孙晨阳', count: 0 }, { id: 26, name: '26 孙皓澄', count: 0 }, { id: 27, name: '27 汪瑞阳', count: 0 }, { id: 28, name: '28 汪昱帆', count: 0 }, { id: 29, name: '29 王衿', count: 0 }, { id: 30, name: '30 王竞扬', count: 0 }, { id: 31, name: '31 徐康杰', count: 0 }, { id: 32, name: '32 许若宸', count: 0 }, { id: 33, name: '33 严一篪', count: 0 }, { id: 34, name: '34 杨持', count: 0 }, { id: 35, name: '35 姚皓宇', count: 0 }, { id: 36, name: '36 虞思承', count: 0 }, { id: 37, name: '37 袁煊逸', count: 0 }, { id: 38, name: '38 袁泽', count: 0 }, { id: 39, name: '39 赵瑞韬', count: 0 }, { id: 40, name: '40 钟远', count: 0 }];
    id = 40;
    save();
    render();
});
clearBtn.addEventListener('click', function () {
    candidates.forEach(function (c) { c.count = 0; });
    save();
    render();
});
clearAllBtn.addEventListener('click', function () {
    if (candidates.length === 0) return;
    openClearAllConfirm();
});
selectBtn.addEventListener('click', enterSelectMode);
selectAllBtn.addEventListener('click', function () {
    candidates.forEach(function (c) { selectedIds.add(c.id); });
    render();
});
unselectAllBtn.addEventListener('click', function () {
    candidates.forEach(function (c) { selectedIds.delete(c.id); });
    render();
});
cancelBtn.addEventListener('click', exitSelectMode);
sortBtn.addEventListener('click', openSortModal);
chooseBtn.addEventListener('click', openChooseModal);
