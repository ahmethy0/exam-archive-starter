const subjectEl = document.getElementById('subject');
const yearEl = document.getElementById('year');
const schemeEl = document.getElementById('scheme');
const qEl = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');

let exams = [];

// Load exams from exams.json
async function loadExams() {
  const res = await fetch('data/exams.json');  // path to your JSON
  exams = await res.json();
  initFilters();
}

// Filter and render
function fetchExams() {
  let filtered = exams;

  if (subjectEl.value) filtered = filtered.filter(e => e.subject === subjectEl.value);
  if (yearEl.value) filtered = filtered.filter(e => e.year.toString() === yearEl.value);
  if (schemeEl.value) filtered = filtered.filter(e => e.hasMarkScheme.toString() === schemeEl.value);
  if (qEl.value) {
    const q = qEl.value.toLowerCase();
    filtered = filtered.filter(e => e.title.toLowerCase().includes(q));
  }

  render(filtered);
  countEl.textContent = `${filtered.length} result${filtered.length === 1 ? '' : 's'}`;
}

// Render exam cards
function render(items) {
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = '<div class="text-gray-600">No exams found. Try different filters.</div>';
    return;
  }

  for (const e of items) {
    const card = document.createElement('a');
    card.href = e.file;
    card.target = "_blank";
    card.className = 'card block rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition';
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs uppercase tracking-wide text-gray-500">${e.subject}</div>
          <div class="text-lg font-semibold mt-1">${e.title}</div>
        </div>
        <div class="text-sm font-semibold text-blue-600">${e.year}</div>
      </div>
      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm ${e.hasMarkScheme ? 'text-emerald-600' : 'text-gray-500'}">
          ${e.hasMarkScheme ? 'Includes Mark Scheme' : 'No Mark Scheme'}
        </div>
        <button class="rounded-lg bg-blue-600 text-white text-sm px-3 py-2">Download</button>
      </div>
    `;
    grid.appendChild(card);
  }
}

// Populate filters
function initFilters() {
  const subjects = Array.from(new Set(exams.map(i => i.subject))).sort();
  const years = Array.from(new Set(exams.map(i => i.year))).sort((a,b)=>b-a);

  for (const s of subjects) {
    const opt = document.createElement('option');
    opt.value = s;
    opt.textContent = s;
    subjectEl.appendChild(opt);
  }
  for (const y of years) {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearEl.appendChild(opt);
  }

  render(exams);
  countEl.textContent = `${exams.length} result${exams.length === 1 ? '' : 's'}`;
}

// Events
[subjectEl, yearEl, schemeEl].forEach(el => el.addEventListener('change', fetchExams));
searchBtn.addEventListener('click', fetchExams);
qEl.addEventListener('keydown', (e)=>{ if(e.key === 'Enter'){ fetchExams(); } });

// Init
function render(items) {
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = '<div class="text-gray-600" data-i18n="noResults">No exams found. Try different filters.</div>';
    return;
  }

  for (const e of items) {
    const card = document.createElement('a');
    card.href = e.file;
    card.target = "_blank";
    card.className = 'card block rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition';
    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div>
          <div class="text-xs uppercase tracking-wide text-gray-500">${e.subject}</div>
          <div class="text-lg font-semibold mt-1">${e.title}</div>
        </div>
        <div class="text-sm font-semibold text-blue-600">${e.year}</div>
      </div>
      <div class="mt-4 flex items-center justify-between">
        <div class="text-sm ${e.hasMarkScheme ? 'text-emerald-600' : 'text-gray-500'}"
             data-i18n="${e.hasMarkScheme ? 'includesMarkScheme' : 'noMarkScheme'}">
          ${e.hasMarkScheme ? 'Includes Mark Scheme' : 'No Mark Scheme'}
        </div>
        <button class="rounded-lg bg-blue-600 text-white text-sm px-3 py-2">
          Download
        </button>
      </div>
    `;
    grid.appendChild(card);
  }
}
