/* ---------- Constantes ---------- */
const CATALOG_URL = 'https://raw.githubusercontent.com/hasaneyldrm/exercises-dataset/main/data/exercises.json';
const ALLOWED_EQUIPMENT = new Set(['barbell', 'dumbbell', 'kettlebell', 'band', 'body weight']);

const LS_NAME = 'hierro:userName';
const LS_PHASE = 'hierro:activePhase';
const LS_CATALOG_META = 'hierro:catalogMeta';
const LS_SEEN_WELCOME = 'hierro:seenWelcome';

const WELCOME_TEXT = 'Arrancás una etapa nueva de entrenamiento. Anotá cada serie, subí el peso de a poco y priorizá la técnica — el progreso se nota semana a semana, no de un día para el otro.';

/* ---------- Rutinas precargadas ---------- */
/* match: cómo buscar el ejercicio en el catálogo descargado (equipo + palabras clave en inglés). Si no matchea, se registra igual con el nombre en español. */
const ROUTINES = {
  kettlebell: {
    label: 'Kettlebell',
    days: [
      {
        id: 'full',
        label: 'Full body',
        exercises: [
          { name: 'Sentadilla goblet (kettlebell)', group: 'piernas', sets: 3, reps: '10-12 reps',
            match: { eq: 'kettlebell', kw: ['goblet squat'], excl: [] } },
          { name: 'Peso muerto con kettlebell', group: 'piernas', sets: 3, reps: '10 reps',
            match: { eq: 'kettlebell', kw: ['deadlift'], excl: [] } },
          { name: 'Press con kettlebell por lado', group: 'empuje', sets: 3, reps: '8-10 reps c/lado',
            match: { eq: 'kettlebell', kw: ['one arm', 'press'], excl: ['floor', 'seated'] } },
          { name: 'Remo con kettlebell por lado', group: 'espalda', sets: 3, reps: '10-12 reps c/lado',
            match: { eq: 'kettlebell', kw: ['one arm row'], excl: [] } },
          { name: 'Carga suitcase por lado', group: 'core', sets: 3, reps: '20-30 seg c/lado',
            match: { eq: null, kw: ['suitcase'], excl: [] } },
          { name: 'Halo con kettlebell', group: 'core', sets: 2, reps: '8-10 reps',
            match: { eq: null, kw: ['halo'], excl: [] } },
        ],
      },
    ],
  },
  split: {
    label: 'Split',
    days: [
      {
        id: 'piernas',
        label: 'Piernas',
        emphasis: true,
        exercises: [
          { name: 'Sentadilla con barra', group: 'piernas', sets: 4, reps: '8-10 reps',
            match: { eq: 'barbell', kw: ['squat'], excl: ['jerk', 'hack', 'jump', 'wide', 'full', 'bench', 'front', 'zercher', 'sumo', 'box', 'pause', 'narrow', 'bulgarian', 'overhead', 'clean', 'frankenstein', 'one leg', 'single leg', 'thruster', 'speed'] } },
          { name: 'Sentadilla goblet (calentamiento)', group: 'piernas', sets: 2, reps: '12 reps',
            match: { eq: 'kettlebell', kw: ['goblet squat'], excl: [] } },
          { name: 'Peso muerto rumano con barra', group: 'piernas', sets: 3, reps: '10 reps',
            match: { eq: 'barbell', kw: ['romanian deadlift'], excl: [] } },
          { name: 'Zancada / step-up búlgaro', group: 'piernas', sets: 3, reps: '10 reps c/pierna',
            match: { eq: 'dumbbell', kw: ['step-up'], excl: [] } },
          { name: 'Extensión de cadera con banda', group: 'piernas', sets: 3, reps: '15 reps',
            match: { eq: 'band', kw: ['hip extension'], excl: [] } },
        ],
      },
      {
        id: 'espalda',
        label: 'Espalda',
        exercises: [
          { name: 'Remo con barra', group: 'espalda', sets: 4, reps: '8-10 reps',
            match: { eq: 'barbell', kw: ['bent over row'], excl: ['lever', 'reverse', 'one arm'] } },
          { name: 'Dominadas asistidas con banda', group: 'espalda', sets: 3, reps: 'hasta el fallo',
            match: { eq: 'band', kw: ['assisted', 'pull'], excl: [] } },
          { name: 'Remo con kettlebell', group: 'espalda', sets: 3, reps: '10-12 reps c/lado',
            match: { eq: 'kettlebell', kw: ['one arm row'], excl: [] } },
          { name: 'Apertura con banda', group: 'espalda', sets: 3, reps: '15 reps',
            match: { eq: 'band', kw: ['reverse fly'], excl: [] } },
          { name: 'Peso muerto rumano con barra', group: 'piernas', sets: 3, reps: '10 reps',
            match: { eq: 'barbell', kw: ['romanian deadlift'], excl: [] } },
        ],
      },
      {
        id: 'pecho',
        label: 'Pecho',
        exercises: [
          { name: 'Press banca con barra', group: 'empuje', sets: 4, reps: '8-10 reps',
            match: { eq: 'barbell', kw: ['bench press'], excl: ['incline', 'decline', 'close', 'guillotine', 'reverse', 'wide', 'lever'] } },
          { name: 'Press banca inclinado', group: 'empuje', sets: 3, reps: '10 reps',
            match: { eq: 'barbell', kw: ['incline', 'bench press'], excl: ['close', 'reverse', 'lever'] } },
          { name: 'Press con kettlebell en el suelo', group: 'empuje', sets: 3, reps: '10-12 reps',
            match: { eq: 'kettlebell', kw: ['floor press'], excl: [] } },
          { name: 'Flexiones', group: 'empuje', sets: 3, reps: 'hasta el fallo',
            match: { eq: 'body weight', kw: ['push-up'], excl: ['knees', 'decline', 'incline', 'clock', 'tap', 'close-grip', 'diamond', 'hand release', 'medicine', 'spiderman', 'staggered'] } },
        ],
      },
    ],
  },
};

/* ---------- IndexedDB ---------- */
function idbOpen() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('hierro-db', 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('exercises')) db.createObjectStore('exercises', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('workouts')) db.createObjectStore('workouts', { keyPath: 'id', autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
const dbPromise = idbOpen();

async function idbGetAll(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readonly').objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbClear(store) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    tx.objectStore(store).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbPutAll(store, items) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    items.forEach((it) => os.put(it));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function idbPut(store, item) {
  const db = await dbPromise;
  return new Promise((resolve, reject) => {
    const req = db.transaction(store, 'readwrite').objectStore(store).put(item);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/* ---------- Catálogo: descarga y matching ---------- */
async function fetchAndStoreCatalog() {
  const res = await fetch(CATALOG_URL);
  if (!res.ok) throw new Error('network');
  const raw = await res.json();
  const filtered = raw
    .filter((d) => ALLOWED_EQUIPMENT.has(d.equipment))
    .map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      equipment: d.equipment,
      muscle_group: d.muscle_group || d.target || d.category || '',
      target: d.target || '',
      instructions_es: (d.instructions && d.instructions.es) ? d.instructions.es : null,
    }));
  await idbClear('exercises');
  await idbPutAll('exercises', filtered);
  localStorage.setItem(LS_CATALOG_META, JSON.stringify({ count: filtered.length, updatedAt: new Date().toISOString() }));
}

/* Busca el mejor match en el catálogo para un ejercicio de rutina. Prioriza nombres que empiezan
   con el equipo (evita variantes "lever ..." mal etiquetadas) y, entre esos, el nombre más corto. */
function findMatch(catalog, def) {
  if (!def.match) return null;
  const { eq, kw, excl } = def.match;
  const kws = kw.map((k) => k.toLowerCase());
  const exs = (excl || []).map((k) => k.toLowerCase());
  const candidates = catalog.filter((c) => {
    if (eq && c.equipment !== eq) return false;
    const name = c.name.toLowerCase();
    if (!kws.every((k) => name.includes(k))) return false;
    if (exs.some((e) => name.includes(e))) return false;
    return true;
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => {
    const aStarts = eq && a.name.toLowerCase().startsWith(eq) ? 0 : 1;
    const bStarts = eq && b.name.toLowerCase().startsWith(eq) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.name.length - b.name.length;
  });
  return candidates[0];
}

/* ---------- Utilidades ---------- */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDateLong(d) {
  const s = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function formatDateShort(iso) {
  return new Intl.DateTimeFormat('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(iso));
}

function formatTarget(def) {
  return def.reps === 'hasta el fallo' ? `${def.sets} series, hasta el fallo` : `${def.sets} series × ${def.reps}`;
}

function showToast(msg, ms = 2200) {
  const old = document.getElementById('toast');
  if (old) old.remove();
  const t = document.createElement('div');
  t.id = 'toast';
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

function maybeWelcomeNoteHTML() {
  if (localStorage.getItem(LS_SEEN_WELCOME)) return '';
  return `<div class="note">${escapeHtml(WELCOME_TEXT)}<button type="button" class="dismiss" id="btn-dismiss-note">&times;</button></div>`;
}

function bindDismissNote() {
  const btn = document.getElementById('btn-dismiss-note');
  if (btn) btn.addEventListener('click', () => { localStorage.setItem(LS_SEEN_WELCOME, '1'); renderHoy(); });
}

/* ---------- Estado ---------- */
const App = {
  phase: localStorage.getItem(LS_PHASE) || 'kettlebell',
  catalog: [],
  hoy: { step: 'select', dayId: null, dayLabel: null },
};

/* ---------- Vista: Hoy ---------- */
function renderHoy() {
  if (App.phase === 'kettlebell') {
    renderDayForm(ROUTINES.kettlebell.days[0]);
    return;
  }
  if (App.hoy.step === 'form' && App.hoy.dayId) {
    const day = ROUTINES.split.days.find((d) => d.id === App.hoy.dayId);
    if (day) { renderDayForm(day); return; }
  }
  renderDaySelector();
}

function renderDaySelector() {
  App.hoy.step = 'select';
  const days = ROUTINES.split.days;
  const hoyContent = document.getElementById('hoy-content');
  hoyContent.innerHTML = `
    <div class="screen-header">
      <h1>Hoy</h1>
      <p class="sub">Elegí el día de rutina</p>
    </div>
    ${maybeWelcomeNoteHTML()}
    <div class="day-list">
      ${days.map((d) => `
        <button type="button" class="day-item ${d.emphasis ? 'legs' : ''}" data-day-id="${d.id}">
          <div>
            <div class="name">${escapeHtml(d.label)}</div>
            <div class="meta">${d.exercises.length} ejercicios</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;">
            ${d.emphasis ? '<span class="badge">Prioridad</span>' : ''}
            <span class="chevron">&rsaquo;</span>
          </div>
        </button>
      `).join('')}
    </div>
  `;
  hoyContent.querySelectorAll('.day-item').forEach((btn) => {
    btn.addEventListener('click', () => {
      const day = days.find((d) => d.id === btn.dataset.dayId);
      renderDayForm(day);
    });
  });
  bindDismissNote();
}

function renderDayForm(day) {
  App.hoy.step = 'form';
  App.hoy.dayId = day.id;
  App.hoy.dayLabel = day.label;
  const hoyContent = document.getElementById('hoy-content');
  const backBtn = App.phase === 'split' ? '<button type="button" class="btn ghost" id="btn-back-day">&lsaquo; Cambiar día</button>' : '';
  hoyContent.innerHTML = `
    <div class="screen-header">
      ${backBtn}
      <h1>${escapeHtml(day.label)}</h1>
      <p class="sub">${formatDateLong(new Date())}</p>
    </div>
    ${maybeWelcomeNoteHTML()}
    <div id="exercise-cards"></div>
    <div class="save-bar"><div class="save-bar-inner"><button type="button" class="btn" id="btn-save-workout">Guardar entrenamiento</button></div></div>
    <div style="height:70px"></div>
  `;
  const cardsEl = document.getElementById('exercise-cards');
  day.exercises.forEach((def) => cardsEl.appendChild(buildExerciseCard(def)));

  const back = document.getElementById('btn-back-day');
  if (back) back.addEventListener('click', () => { App.hoy.step = 'select'; renderHoy(); });

  document.getElementById('btn-save-workout').addEventListener('click', saveWorkout);
  bindDismissNote();
}

function buildExerciseCard(def) {
  const match = findMatch(App.catalog, def);
  const hasInstr = !!(match && match.instructions_es);
  const legsDot = def.group === 'piernas' ? '<span class="legs-dot"></span>' : '';

  const card = document.createElement('div');
  card.className = 'card exercise-card';
  card.dataset.exName = def.name;
  card.dataset.exGroup = def.group;
  card.innerHTML = `
    <div class="ex-head">
      <div>
        <div class="ex-name">${legsDot}${escapeHtml(def.name)}</div>
        <div class="ex-target">${escapeHtml(formatTarget(def))}</div>
      </div>
    </div>
    ${hasInstr ? `<button type="button" class="ex-toggle">Ver técnica</button><div class="ex-instructions" hidden>${escapeHtml(match.instructions_es)}</div>` : ''}
    <div class="set-rows"></div>
    <button type="button" class="add-set">+ Agregar serie</button>
  `;

  const rowsWrap = card.querySelector('.set-rows');
  for (let i = 0; i < def.sets; i += 1) rowsWrap.appendChild(buildSetRow(i + 1));

  card.querySelector('.add-set').addEventListener('click', () => {
    rowsWrap.appendChild(buildSetRow(rowsWrap.children.length + 1));
  });

  const toggleBtn = card.querySelector('.ex-toggle');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const box = card.querySelector('.ex-instructions');
      box.hidden = !box.hidden;
      toggleBtn.textContent = box.hidden ? 'Ver técnica' : 'Ocultar técnica';
    });
  }
  return card;
}

function buildSetRow(n) {
  const row = document.createElement('div');
  row.className = 'set-row';
  row.innerHTML = `
    <div class="set-idx">${n}</div>
    <input class="inp-weight" type="number" inputmode="decimal" step="0.5" min="0" placeholder="kg">
    <input class="inp-reps" type="number" inputmode="numeric" min="0" placeholder="reps">
    <button type="button" class="set-check">&#10003;</button>
  `;
  row.querySelector('.set-check').addEventListener('click', (e) => {
    e.currentTarget.classList.toggle('done');
  });
  return row;
}

async function saveWorkout() {
  const cards = document.querySelectorAll('#exercise-cards .exercise-card');
  const exercises = [];
  cards.forEach((card) => {
    const sets = [];
    card.querySelectorAll('.set-row').forEach((row) => {
      const w = parseFloat(row.querySelector('.inp-weight').value);
      const r = parseFloat(row.querySelector('.inp-reps').value);
      if (Number.isFinite(w) && Number.isFinite(r) && w > 0 && r > 0) sets.push({ weight: w, reps: r });
    });
    if (sets.length) exercises.push({ name: card.dataset.exName, muscleGroup: card.dataset.exGroup, sets });
  });

  if (!exercises.length) {
    showToast('Registrá al menos un peso y repeticiones antes de guardar.');
    return;
  }

  const totalVolume = exercises.reduce((sum, e) => sum + e.sets.reduce((s2, st) => s2 + st.weight * st.reps, 0), 0);
  const record = {
    date: new Date().toISOString(),
    phase: App.phase,
    dayId: App.hoy.dayId,
    dayLabel: App.hoy.dayLabel,
    exercises,
    totalVolume,
  };
  await idbPut('workouts', record);
  showToast('Entrenamiento guardado.');
  App.hoy.step = 'select';
  renderHoy();
}

/* ---------- Vista: Historial ---------- */
async function renderHistorial() {
  const workouts = await idbGetAll('workouts');
  workouts.sort((a, b) => new Date(b.date) - new Date(a.date));

  const listEl = document.getElementById('historial-list');
  listEl.innerHTML = workouts.length
    ? workouts.map(workoutItemHTML).join('')
    : '<p class="empty-state">Todavía no registraste ningún entrenamiento.</p>';

  const names = Array.from(new Set(workouts.flatMap((w) => w.exercises.map((e) => e.name)))).sort();
  const select = document.getElementById('chart-exercise-select');
  const prev = select.value;
  select.innerHTML = names.length
    ? names.map((n) => `<option value="${escapeHtml(n)}">${escapeHtml(n)}</option>`).join('')
    : '<option value="">Sin ejercicios registrados</option>';
  if (names.includes(prev)) select.value = prev;

  renderChart(select.value, workouts);
}

function workoutItemHTML(w) {
  const lines = w.exercises.map((e) => {
    const setsStr = e.sets.map((s) => `${s.weight}kg×${s.reps}`).join(', ');
    return `<div class="ex-line"><b>${escapeHtml(e.name)}</b><br>${escapeHtml(setsStr)}</div>`;
  }).join('');
  return `
    <details class="workout-item">
      <summary>
        <div class="row1"><span>${escapeHtml(w.dayLabel || '')}</span><span>${formatDateShort(w.date)}</span></div>
        <div class="row2">${Math.round(w.totalVolume)} kg de volumen total</div>
      </summary>
      <div class="workout-detail">${lines}</div>
    </details>
  `;
}

function buildSeriesForExercise(workouts, name) {
  const points = [];
  workouts.forEach((w) => {
    const ex = w.exercises.find((e) => e.name === name);
    if (!ex || !ex.sets.length) return;
    const maxWeight = Math.max(...ex.sets.map((s) => s.weight));
    const volume = ex.sets.reduce((sum, s) => sum + s.weight * s.reps, 0);
    points.push({ date: w.date, maxWeight, volume });
  });
  points.sort((a, b) => new Date(a.date) - new Date(b.date));
  return points;
}

function renderChart(name, workouts) {
  const container = document.getElementById('chart-container');
  if (!name) { container.innerHTML = '<p class="sub">Todavía no hay ejercicios registrados.</p>'; return; }
  const points = buildSeriesForExercise(workouts, name);
  if (points.length < 2) {
    container.innerHTML = `<p class="sub">${points.length === 1 ? 'Necesitás al menos 2 sesiones de este ejercicio para ver la evolución.' : 'Todavía no hay datos de este ejercicio.'}</p>`;
    return;
  }
  container.innerHTML = renderChartSVG(points);
}

function renderChartSVG(points) {
  const W = 480; const H = 180; const pad = 26;
  const n = points.length;
  const weights = points.map((p) => p.maxWeight);
  const volumes = points.map((p) => p.volume);
  const maxW = Math.max(...weights); const minW = Math.min(...weights);
  const maxV = Math.max(...volumes);
  const x = (i) => pad + (i / (n - 1)) * (W - 2 * pad);
  const yW = (v) => H - pad - ((v - minW) / ((maxW - minW) || 1)) * (H - 2 * pad);
  const yV = (v) => H - pad - (v / (maxV || 1)) * (H - 2 * pad);

  const weightLine = points.map((p, i) => `${x(i)},${yW(p.maxWeight)}`).join(' ');
  const volumeLine = points.map((p, i) => `${x(i)},${yV(p.volume)}`).join(' ');
  const dots = points.map((p, i) => `<circle cx="${x(i)}" cy="${yW(p.maxWeight)}" r="3" fill="#d96339"></circle>`).join('');
  const first = formatDateShort(points[0].date);
  const last = formatDateShort(points[n - 1].date);

  return `
    <svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <polyline points="${volumeLine}" fill="none" stroke="#6b5d4e" stroke-width="2" stroke-dasharray="4 3" />
      <polyline points="${weightLine}" fill="none" stroke="#d96339" stroke-width="2.5" />
      ${dots}
    </svg>
    <div class="chart-legend">
      <span>${escapeHtml(first)}</span>
      <span style="margin-left:auto;">${escapeHtml(last)}</span>
    </div>
    <div class="chart-legend">
      <span><span class="dot" style="background:#d96339"></span>Peso máx (kg)</span>
      <span><span class="dot" style="background:#6b5d4e"></span>Volumen (kg)</span>
    </div>
  `;
}

/* ---------- Vista: Ajustes ---------- */
function updatePhaseButtons() {
  document.querySelectorAll('.phase-btn').forEach((b) => b.classList.toggle('active', b.dataset.phase === App.phase));
  document.getElementById('phase-desc').textContent = App.phase === 'kettlebell'
    ? 'Rutina full body con kettlebell, pensada para mientras no tenés el resto del equipo.'
    : 'Rutina dividida en 3 días — espalda, pecho y piernas. El día de piernas tiene prioridad para recuperar el déficit muscular ahí.';
}

function refreshCatalogStatus() {
  const el = document.getElementById('catalog-status');
  const raw = localStorage.getItem(LS_CATALOG_META);
  if (!raw) { el.textContent = 'No descargado todavía (hace falta internet una vez).'; return; }
  const meta = JSON.parse(raw);
  el.textContent = `${meta.count} ejercicios · actualizado ${formatDateShort(meta.updatedAt)}`;
}

function setPhase(phase) {
  App.phase = phase;
  localStorage.setItem(LS_PHASE, phase);
  App.hoy = { step: 'select', dayId: null, dayLabel: null };
  updatePhaseButtons();
  renderHoy();
}

function bindAjustesEvents() {
  document.getElementById('settings-name').addEventListener('input', (e) => {
    localStorage.setItem(LS_NAME, e.target.value);
  });

  document.querySelectorAll('.phase-btn').forEach((b) => {
    b.addEventListener('click', () => setPhase(b.dataset.phase));
  });

  document.getElementById('btn-update-catalog').addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    const original = btn.textContent;
    btn.disabled = true;
    btn.textContent = 'Actualizando…';
    try {
      await fetchAndStoreCatalog();
      App.catalog = await idbGetAll('exercises');
      refreshCatalogStatus();
      showToast('Catálogo actualizado.');
      renderHoy();
    } catch (err) {
      showToast('No se pudo actualizar. Revisá tu conexión.');
    } finally {
      btn.disabled = false;
      btn.textContent = original;
    }
  });

  document.getElementById('btn-clear-history').addEventListener('click', async () => {
    if (!window.confirm('¿Borrar todo el historial de entrenamientos guardado en este dispositivo? Esta acción no se puede deshacer.')) return;
    await idbClear('workouts');
    showToast('Historial borrado.');
    renderHistorial();
  });
}

/* ---------- Tabs ---------- */
function bindTabs() {
  document.querySelectorAll('.tab').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const name = btn.dataset.tab;
      document.querySelectorAll('.view').forEach((v) => { v.hidden = true; });
      document.getElementById(`view-${name}`).hidden = false;
      if (name === 'historial') renderHistorial();
    });
  });

  document.getElementById('chart-exercise-select').addEventListener('change', async (e) => {
    const workouts = await idbGetAll('workouts');
    renderChart(e.target.value, workouts);
  });
}

/* ---------- Service worker ---------- */
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}

/* ---------- Init ---------- */
async function init() {
  document.getElementById('settings-name').value = localStorage.getItem(LS_NAME) || '';
  updatePhaseButtons();
  refreshCatalogStatus();
  bindTabs();
  bindAjustesEvents();
  registerServiceWorker();

  App.catalog = await idbGetAll('exercises');
  if (!App.catalog.length && navigator.onLine) {
    document.getElementById('hoy-content').innerHTML = '<div class="screen-header"><h1>Hierro</h1></div><p class="sub">Descargando catálogo de ejercicios…</p>';
    try {
      await fetchAndStoreCatalog();
      App.catalog = await idbGetAll('exercises');
      refreshCatalogStatus();
    } catch (err) {
      /* sin catálogo, la app sigue funcionando con los nombres en español */
    }
  }
  renderHoy();
}

init();
