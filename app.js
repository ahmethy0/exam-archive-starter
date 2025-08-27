const subjectEl = document.getElementById('subject');
const yearEl = document.getElementById('year');
const schemeEl = document.getElementById('scheme');
const qEl = document.getElementById('q'); // hidden input
const searchBtn = document.getElementById('searchBtn');
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');

let exams = [];
let currentLang = 'en';
let translations = {};

// Retry fetch
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      if (i < retries - 1) await new Promise(r => setTimeout(r, delay));
      else throw error;
    }
  }
}

// Load translations
async function loadTranslations() {
  try {
    translations = await fetchWithRetry('/data/lang.json');
    updateLanguage();
  } catch (e) {
    console.error('Translations error:', e);
  }
}

// Update UI with translations
function updateLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key === 'results') {
      const count = parseInt(countEl.textContent) || 0;
      el.textContent = translations[currentLang]?.[key]?.replace('{n}', count) || `${count} results`;
    } else {
      el.textContent = translations[currentLang]?.[key] || el.textContent;
    }
  });
  document.documentElement.lang = currentLang;
}

// Load exams (just fetch, no rendering)
async function loadExams() {
  try {
    exams = await fetchWithRetry('/data/exams.json');
    exams = exams.filter(e => e.id && e.subject && e.year && e.title && e.file && typeof e.hasMarkScheme === 'boolean');
    initFilters();
  } catch (error) {
    grid.innerHTML = `<div class="text-red-600">Error loading exams: ${error.message}</div>`;
    console.error('Exams load error:', error);
  }
}

// Populate filters
function initFilters() {
  const subjects = Array.from(new Set(exams.map(i => i.subject))).sort();
  const years = Array.from(new Set(exams.map(i => i.year))).sort((a, b) => b - a);

  subjectEl.innerHTML = `<option value="">${translations[currentLang]?.allSubjects || 'All Subjects'}</option>`;
  yearEl.innerHTML = `<option value="">${translations[currentLang]?.allYears || 'All Years'}</option>`;
  schemeEl.innerHTML = `
    <option value="">${translations[currentLang]?.allSchemes || 'With/Without Mark Scheme'}</option>
    <option value="true">${translations[currentLang]?.includesMarkScheme || 'With Mark Scheme'}</option>
    <option value="false">${translations[currentLang]?.noMarkScheme || 'Without Mark Scheme'}</option>
  `;

  subjects.forEach(s => {
    const opt = document.createElement('option'); opt.value = s; opt.textContent = s; subjectEl.appendChild(opt);
  });
  years.forEach(y => {
    const opt = document.createElement('option'); opt.value = y; opt.textContent = y; yearEl.appendChild(opt);
  });
}

// Filter & render exams
function fetchExams() {
  const filters = {
    subject: subjectEl.value,
    year: yearEl.value,
    scheme: schemeEl.value,
    query: qEl.value.toLowerCase()
  };

  const filtered = exams.filter(e =>
    (!filters.subject || e.subject === filters.subject) &&
    (!filters.year || e.year.toString() === filters.year) &&
    (!filters.scheme || e.hasMarkScheme.toString() === filters.scheme) &&
    (!filters.query || e.title.toLowerCase().includes(filters.query))
  );

  render(filtered);
  countEl.textContent = translations[currentLang]?.results?.replace('{n}', filtered.length) || `${filtered.length} results`;
  updateLanguage();

  countEl.hidden = false;
  grid.hidden = false;
}

// Render exam cards
function render(items) {
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<div class="text-gray-600">${translations[currentLang]?.noResults || 'No exams found.'}</div>`;
    return;
  }
  items.forEach(e => {
    const card = document.createElement('a');
    card.href = e.file;
    card.target = '_blank';
    card.className = 'exam-card';
    card.innerHTML = `
      <div>
        <div class="text-sm text-gray-500">${e.subject}</div>
        <div class="text-lg font-semibold mt-1">${e.title}</div>
      </div>
      <div class="flex justify-between mt-2">
        <div class="${e.hasMarkScheme ? 'text-green-600' : 'text-gray-500'}">
          ${translations[currentLang]?.[e.hasMarkScheme?'includesMarkScheme':'noMarkScheme'] || (e.hasMarkScheme?'Includes Mark Scheme':'No Mark Scheme')}
        </div>
        <button class="btn primary" aria-label="Download ${e.title}">${translations[currentLang]?.download || 'Download'}</button>
      </div>
    `;
    grid.appendChild(card);
  });
}

// Event listeners
[subjectEl, yearEl, schemeEl].forEach(el => el.addEventListener('change', fetchExams));
searchBtn.addEventListener('click', fetchExams);
qEl.addEventListener('keydown', e => { if (e.key==='Enter') fetchExams(); });
document.querySelectorAll('[data-lang]').forEach(el=>{
  el.addEventListener('click', e=>{
    e.preventDefault();
    currentLang = el.getAttribute('data-lang');
    updateLanguage();
    initFilters(); // re-populate filters in the new language
  });
});

// Initialize
loadTranslations();
loadExams();
