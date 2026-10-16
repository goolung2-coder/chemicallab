import { CHEMICALS, HAZARDS, byId } from './chemicals.js';
import { findReaction } from './reactions.js';
import * as ai from './ai.js';

const MAX_ITEMS = 6;
const NOTEBOOK_KEY = 'chemlab.notebook';
const SVG_NS = 'http://www.w3.org/2000/svg';
const $ = (id) => document.getElementById(id);
// SVG 요소는 hidden 속성을 따르지 않아서 display로 숨긴다.
const show = (el, on) => { el.style.display = on ? '' : 'none'; };

const state = {
  contents: [],      // 비커에 넣은 시약 id 목록
  colorOverride: null,
  precipitate: null,
  coat: null,
  gas: false,
  temp: 'same',
  danger: 'safe',
  reactions: [],     // 이번 비커에서 일어난 반응
};

const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function toast(msg) {
  const el = $('toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { el.hidden = true; }, 2600);
}

// ── 시약 선반 ─────────────────────────────
function renderShelf(filter = '') {
  const q = filter.trim().toLowerCase();
  const list = $('shelf');
  list.innerHTML = '';
  for (const c of CHEMICALS) {
    if (q && !`${c.name} ${c.formula}`.toLowerCase().includes(q)) continue;
    const li = document.createElement('li');
    li.className = 'chem';
    const hz = c.hazards.map((h) => HAZARDS[h].icon).join('');
    li.innerHTML = `
      <button class="chem-add" data-id="${c.id}" title="${escapeHtml(c.name)} 넣기">
        <span class="chem-swatch ${c.state === 'metal' ? 'metal' : ''}" style="background:${c.color}"></span>
        <span><span class="chem-name">${escapeHtml(c.name)}</span><span class="chem-formula">${escapeHtml(c.formula)}</span></span>
      </button>
      <span class="chem-hz" aria-label="위험 표시">${hz}</span>
      <button class="chem-info" data-info="${c.id}" aria-label="${escapeHtml(c.name)} 정보">ⓘ</button>`;
    list.appendChild(li);
  }
}

function showInfo(id) {
  const c = byId[id];
  const hz = c.hazards.length
    ? c.hazards.map((h) => `${HAZARDS[h].icon} ${HAZARDS[h].label}`).join(' · ')
    : '특별한 위험 표시 없음';
  $('info-body').innerHTML = `
    <h2>${escapeHtml(c.name)} <small>${escapeHtml(c.formula)}</small></h2>
    <p>${escapeHtml(c.info)}</p>
    <p><b>위험 표시:</b> ${hz}</p>`;
  $('dlg-info').showModal();
}

// ── 비커 시뮬레이션 ─────────────────────────
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function blend(colors) {
  if (!colors.length) return '#cfe9ff';
  const sum = colors.map(hexToRgb).reduce((a, b) => a.map((v, i) => v + b[i]), [0, 0, 0]);
  return `#${sum.map((v) => Math.round(v / colors.length).toString(16).padStart(2, '0')).join('')}`;
}

function phBalance() {
  let bal = 0;
  for (const id of state.contents) {
    if (byId[id].ph === 'acid') bal -= 1;
    if (byId[id].ph === 'base') bal += 1;
  }
  return bal;
}

function indicatorColor() {
  const bal = phBalance();
  if (state.contents.includes('cabbage')) {
    if (bal < 0) return '#d6336c';
    if (bal > 0) return '#3aa35a';
    return '#7b4fa8';
  }
  if (state.contents.includes('php')) return bal > 0 ? '#ff4fa3' : null;
  return null;
}

function liquidColor() {
  if (state.colorOverride) return state.colorOverride;
  const ind = indicatorColor();
  if (ind) return ind;
  const liquids = state.contents.map((id) => byId[id]).filter((c) => c.state === 'liquid' && !c.indicator);
  return blend(liquids.map((c) => c.color));
}

function renderBubbles(on, toxic) {
  const g = $('bubbles');
  g.innerHTML = '';
  if (!on) return;
  for (let i = 0; i < 18; i++) {
    const b = document.createElementNS(SVG_NS, 'circle');
    b.setAttribute('cx', 60 + Math.random() * 100);
    b.setAttribute('cy', 225 - Math.random() * 20);
    b.setAttribute('r', 2 + Math.random() * 4);
    b.setAttribute('fill', toxic ? '#d9ef7a' : 'rgba(255,255,255,.85)');
    b.setAttribute('class', 'bubble');
    b.style.animationDelay = `${Math.random() * 1.6}s`;
    g.appendChild(b);
  }
}

const TEMP = {
  cool: { h: 25, c: '#4c8dff', label: '차가워짐' },
  same: { h: 40, c: '#4c8dff', label: '상온' },
  warm: { h: 62, c: '#f0883e', label: '따뜻해짐' },
  hot: { h: 88, c: '#e5383b', label: '뜨거움!' },
};

function renderBeaker() {
  const n = state.contents.filter((id) => byId[id].state !== 'metal').length;
  const level = Math.min(n, MAX_ITEMS) * 30;
  const liquid = $('liquid');
  liquid.setAttribute('y', 236 - level);
  liquid.setAttribute('height', level);
  liquid.setAttribute('fill', liquidColor());
  liquid.setAttribute('fill-opacity', '0.85');

  const ppt = $('precipitate');
  const pptH = state.precipitate && level ? 18 : 0;
  ppt.setAttribute('y', 236 - pptH);
  ppt.setAttribute('height', pptH);
  ppt.setAttribute('fill', state.precipitate || 'transparent');

  const metalId = state.contents.find((id) => byId[id].state === 'metal');
  show($('metal'), metalId);
  if (metalId) {
    $('metal-body').setAttribute('fill', byId[metalId].color);
    $('metal-coat').setAttribute('fill', state.coat || 'transparent');
  }

  const toxic = state.gas === 'toxic';
  const foam = Boolean(state.gas) && !toxic && state.contents.includes('soap');
  renderBubbles(Boolean(state.gas) && level > 0, toxic);
  show($('foam'), foam);
  show($('gas-cloud'), toxic);

  const t = TEMP[state.temp] || TEMP.same;
  $('thermo-fill').style.height = `${t.h}%`;
  $('thermo-fill').style.background = t.c;
  $('thermo-label').textContent = t.label;

  const contents = $('contents');
  contents.innerHTML = state.contents.map((id) => `<li>${escapeHtml(byId[id].name)}</li>`).join('');
  show($('indicator-note'), state.contents.some((id) => byId[id].indicator));
}

function shake() {
  const svg = $('beaker');
  svg.classList.remove('shake');
  void svg.getBoundingClientRect();
  svg.classList.add('shake');
}

const DANGER_RANK = { safe: 0, caution: 1, danger: 2 };
const DANGER_LABEL = { safe: '안전', caution: '주의', danger: '위험' };

function applyReaction(r) {
  const e = r.effect || {};
  if (e.color) state.colorOverride = e.color;
  if (e.precipitate) state.precipitate = e.precipitate;
  if (e.coat) state.coat = e.coat;
  if (e.gas) state.gas = state.gas === 'toxic' ? 'toxic' : e.gas;
  if (e.temp && e.temp !== 'same') state.temp = e.temp;
  if (e.danger && DANGER_RANK[e.danger] > DANGER_RANK[state.danger]) state.danger = e.danger;
  state.reactions.push(r);
}

function addChemical(id) {
  if (state.contents.length >= MAX_ITEMS) {
    toast('비커가 가득 찼어요. 🗑️ 비우기를 눌러 새로 시작하세요.');
    return;
  }
  if (state.contents.includes(id)) {
    toast('이미 들어 있는 시약이에요.');
    return;
  }
  const prevIndicator = indicatorColor();
  const found = state.contents.map((other) => findReaction(id, other)).filter(Boolean);
  state.contents.push(id);
  found.forEach(applyReaction);
  found.forEach(logToNotebook);
  shake();
  renderBeaker();

  if (found.length) {
    renderResults();
  } else if (state.contents.length >= 2) {
    const ind = indicatorColor();
    const indicatorNote = ind !== prevIndicator && ind
      ? '지시약 색이 바뀌었어요! 용액의 산성·염기성이 달라졌다는 뜻이에요.'
      : '';
    renderResults({ noReaction: true, note: indicatorNote });
  } else {
    renderResults();
  }
}

function resetBeaker() {
  Object.assign(state, {
    contents: [], colorOverride: null, precipitate: null, coat: null,
    gas: false, temp: 'same', danger: 'safe', reactions: [],
  });
  renderBeaker();
  renderResults();
}

function reactionCard(r) {
  const level = r.effect?.danger || 'safe';
  const div = document.createElement('div');
  div.className = `card ${level}`;
  div.innerHTML = `
    <h3>${escapeHtml(r.title)}<span class="badge ${level}">${DANGER_LABEL[level]}</span>${r.ai ? '<span class="badge caution">AI 예측</span>' : ''}</h3>
    ${r.equation ? `<div class="eq">${escapeHtml(r.equation)}</div>` : ''}
    <p>${escapeHtml(r.explanation)}</p>
    ${r.effect?.gasName ? `<p>💨 발생 기체: <b>${escapeHtml(r.effect.gasName)}</b></p>` : ''}
    ${r.safety ? `<p class="safety">🛑 ${escapeHtml(r.safety)}</p>` : ''}
    ${r.ai ? '<p class="hint">AI 예측은 틀릴 수 있어요. 교과서나 선생님께 확인해 보세요.</p>' : ''}
    <div class="card-actions"><button class="ghost" data-ask="${escapeHtml(r.title)}">🤖 이 반응 더 물어보기</button></div>`;
  return div;
}

function renderResults(opts = {}) {
  const box = $('result');
  box.innerHTML = '';
  if (!state.contents.length || (state.contents.length < 2 && !state.reactions.length)) {
    box.innerHTML = '<p class="placeholder">시약을 두 가지 이상 넣으면 반응 결과가 여기에 나타납니다.</p>';
    return;
  }
  if (opts.noReaction) {
    const div = document.createElement('div');
    div.className = 'card';
    div.innerHTML = `
      <h3>눈에 띄는 반응이 없어요</h3>
      <p>${opts.note ? escapeHtml(opts.note) : '실험실 데이터베이스에 이 조합의 반응이 없어요. 단순히 섞이기만 했을 수도 있어요.'}</p>
      <div class="card-actions"><button id="btn-predict">🤖 AI에게 반응 예측 요청</button></div>`;
    box.appendChild(div);
  }
  for (const r of [...state.reactions].reverse()) box.appendChild(reactionCard(r));
}

async function predictWithAI(btn) {
  if (!(await ai.mode())) {
    toast('AI를 쓰려면 ⚙️ 설정에서 API 키를 입력하세요.');
    $('btn-settings').click();
    return;
  }
  btn.disabled = true;
  btn.textContent = '🤖 AI가 생각하는 중…';
  const snapshot = [...state.contents];
  const res = await ai.predictReaction(snapshot.map((id) => byId[id]));
  if (state.contents.join() !== snapshot.join()) return; // 그사이 비커가 바뀌었으면 무시
  if (res.error) {
    btn.disabled = false;
    btn.textContent = '🤖 다시 시도';
    toast(res.error);
    return;
  }
  const r = res.reaction;
  if (r.none) {
    if (r.effect.color) state.colorOverride = r.effect.color;
    renderBeaker();
    renderResults();
    const box = $('result');
    box.prepend(reactionCard({ ...r, title: r.title || '반응 없음', effect: { danger: r.effect.danger } }));
    return;
  }
  applyReaction(r);
  logToNotebook(r);
  shake();
  renderBeaker();
  renderResults();
}

// ── 실험 노트 ─────────────────────────────
function loadNotebook() {
  try { return JSON.parse(localStorage.getItem(NOTEBOOK_KEY)) || []; } catch { return []; }
}
function logToNotebook(r) {
  const list = loadNotebook();
  list.unshift({ title: r.title, equation: r.equation, ai: Boolean(r.ai), at: Date.now() });
  try { localStorage.setItem(NOTEBOOK_KEY, JSON.stringify(list.slice(0, 100))); } catch { /* 저장 불가 */ }
}
function openNotebook() {
  const list = loadNotebook();
  $('notebook-list').innerHTML = list.length
    ? list.map((n) => `<li><b>${escapeHtml(n.title)}</b>${n.ai ? ' <span class="badge caution">AI</span>' : ''}<br>
        ${n.equation ? `<code>${escapeHtml(n.equation)}</code><br>` : ''}
        <small>${new Date(n.at).toLocaleString('ko-KR')}</small></li>`).join('')
    : '<p class="hint">아직 기록된 실험이 없어요.</p>';
  $('dlg-notebook').returnValue = '';
  $('dlg-notebook').showModal();
}

// ── AI 조교 채팅 ─────────────────────────────
const history = [];

function addMsg(cls, text) {
  const div = document.createElement('div');
  div.className = `msg ${cls}`;
  div.textContent = text;
  $('chat-log').appendChild(div);
  $('chat-log').scrollTop = $('chat-log').scrollHeight;
  return div;
}

function beakerContext() {
  if (!state.contents.length) return '';
  const names = state.contents.map((id) => byId[id].name).join(', ');
  const rx = state.reactions.map((r) => r.title).join(' / ');
  return `\n\n(현재 가상 비커: ${names}${rx ? ` · 관찰된 반응: ${rx}` : ''})`;
}

async function sendChat(text) {
  text = text.trim();
  if (!text) return;
  if (!(await ai.mode())) {
    addMsg('err', 'AI 조교를 쓰려면 ⚙️ 설정에서 Anthropic API 키를 입력하세요.');
    return;
  }
  addMsg('me', text);
  history.push({ role: 'user', content: text + beakerContext() });
  const bubble = addMsg('ai', '…');
  const send = $('chat-send');
  send.disabled = true;
  $('ai-status').textContent = 'AI가 답변을 쓰는 중…';
  let streamed = '';
  const res = await ai.chat(history, (delta) => {
    streamed += delta;
    bubble.textContent = streamed;
    $('chat-log').scrollTop = $('chat-log').scrollHeight;
  });
  send.disabled = false;
  $('ai-status').textContent = '';
  if (res.error) {
    history.pop();
    bubble.className = 'msg err';
    bubble.textContent = res.error;
    return;
  }
  if (res.refused) {
    // 거절된 질문은 대화 기록에서 빼서 다음 질문에 영향을 주지 않게 한다.
    history.pop();
    bubble.textContent = res.text;
    return;
  }
  bubble.textContent = res.text;
  history.push({ role: 'assistant', content: res.text });
}

// ── 이벤트 연결 ─────────────────────────────
function init() {
  renderShelf();
  renderBeaker();

  $('shelf-search').addEventListener('input', (e) => renderShelf(e.target.value));
  $('shelf').addEventListener('click', (e) => {
    const add = e.target.closest('[data-id]');
    const info = e.target.closest('[data-info]');
    if (info) showInfo(info.dataset.info);
    else if (add) addChemical(add.dataset.id);
  });
  $('btn-empty').addEventListener('click', resetBeaker);

  $('result').addEventListener('click', (e) => {
    if (e.target.id === 'btn-predict') predictWithAI(e.target);
    const ask = e.target.closest('[data-ask]');
    if (ask) {
      $('chat-input').value = `"${ask.dataset.ask}" 반응이 왜 일어나는지 자세히 설명해 줘.`;
      $('chat-input').focus();
    }
  });

  $('chat-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('chat-input');
    const text = input.value;
    input.value = '';
    sendChat(text);
  });
  $('chat-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      $('chat-form').requestSubmit();
    }
  });

  $('btn-settings').addEventListener('click', () => {
    $('api-key').value = ai.getApiKey();
    $('dlg-settings').returnValue = '';
    $('dlg-settings').showModal();
  });
  $('dlg-settings').addEventListener('close', () => {
    const v = $('dlg-settings').returnValue;
    if (v === 'save') {
      ai.setApiKey($('api-key').value.trim());
      toast(ai.hasApiKey() ? 'API 키를 저장했어요.' : 'API 키가 비어 있어요.');
    } else if (v === 'clear') {
      ai.setApiKey('');
      toast('API 키를 삭제했어요.');
    }
  });

  $('btn-notebook').addEventListener('click', openNotebook);
  $('dlg-notebook').addEventListener('close', () => {
    if ($('dlg-notebook').returnValue === 'clear') {
      try { localStorage.removeItem(NOTEBOOK_KEY); } catch { /* 무시 */ }
      toast('실험 노트를 지웠어요.');
    }
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
}

init();

// claude.ai에서 열면 보는 사람의 Claude 계정을 쓰므로 API 키 설정이 필요 없다.
ai.mode().then((m) => {
  if (m === 'claude') {
    $('btn-settings').hidden = true;
    $('ai-status').textContent = '내 Claude 계정으로 AI 조교를 써요. 처음 질문할 때 사용 허용을 물어봐요.';
  }
});
