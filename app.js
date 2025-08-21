const subjectEl = document.getElementById('subject');
const yearEl = document.getElementById('year');
const schemeEl = document.getElementById('scheme');
const qEl = document.getElementById('q');
const searchBtn = document.getElementById('searchBtn');
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');

let exams = [];
let currentLang = 'en';
let translations = {};

// Load translations
async function loadTranslations() {
  try {
    const res = await fetch('/data/lang.json');
    if (!res.ok) throw new Error(`Failed to load translations: ${res.status} ${res.statusText}`);
    translations = await res.json();
    updateLanguage();
  } catch (error) {
    console.error('Error loading translations:', error);
    grid.innerHTML = `<div class="text-red-600">Error loading translations: ${error.message}</div>`;
  }
}

// Update UI with translations
function updateLanguage() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (key === 'results') {
      const count = parseInt(countEl.textContent) || 0;
      el.textContent = translations[currentLang][key]?.replace('{n}', count) || el.textContent;
    } else {
      el.textContent = translations[currentLang][key] || el.textContent;
    }
  });
  document.documentElement.lang = currentLang;
}

// Load exams from exams.json
async function loadExams() {
  grid.innerHTML = '<div class="text-gray-600" data-i18n="loading">Loading...</div>';
  try {
    const res = await fetch('/data/exams.json');
    if (!res.ok) throw new Error(`Failed to load exams: ${res.status} ${res.statusText}`);
    exams = await res.json();
    exams = exams.filter(e => e.id && e.subject && e.year && e.title && e.file && typeof e.hasMarkScheme === 'boolean');
    initFilters();
  } catch (error) {
    grid.innerHTML = `<div class="text-red-600" data-i18n="error">Error loading exams: ${error.message}. Please try again later.</div>`;
    console.error('Error loading exams:', error);
  }
}

// Populate filter options
function initFilters() {
  const subjects = Array.from(new Set(exams.map(i => i.subject))).sort();
  const years = Array.from(new Set(exams.map(i => i.year))).sort((a, b) => b - a);

  subjectEl.innerHTML = `<option value="" data-i18n="allSubjects">${translations[currentLang]?.allSubjects || 'All Subjects'}</option>`;
  yearEl.innerHTML = `<option value="" data-i18n="allYears">${translations[currentLang]?.allYears || 'All Years'}</option>`;
  schemeEl.innerHTML = `
    <option value="" data-i18n="allSchemes">${translations[currentLang]?.allSchemes || 'With/Without Mark Scheme'}</option>
    <option value="true" data-i18n="includesMarkScheme">${translations[currentLang]?.includesMarkScheme || 'With Mark Scheme'}</option>
    <option value="false" data-i18n="noMarkScheme">${translations[currentLang]?.noMarkScheme || 'Without Mark Scheme'}</option>
  `;

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

  updateLanguage();
  fetchExams();
}

// Filter and render exams
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
}

// Render exam cards
function render(items) {
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<div class="text-gray-600" data-i18n="noResults">${translations[currentLang]?.noResults || 'No exams found. Try different filters.'}</div>`;
    return;
  }

  for (const e of items) {
    const card = document.createElement('a');
    card.href = e.file;
    card.target = "_blank";
    card.className = 'card block rounded-2xl border bg-white p-5 shadow-sm hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-600';
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
          ${translations[currentLang]?.[e.hasMarkScheme ? 'includesMarkScheme' : 'noMarkScheme'] || (e.hasMarkScheme ? 'Includes Mark Scheme' : 'No Mark Scheme')}
        </div>
        <button class="rounded-lg bg-blue-600 text-white text-sm px-3 py-2" 
                aria-label="Download ${e.title} ${e.year}" 
                data-i18n="download">
          ${translations[currentLang]?.download || 'Download'}
        </button>
      </div>
    `;
    grid.appendChild(card);
  }
}

// Event listeners
[subjectEl, yearEl, schemeEl].forEach(el => el.addEventListener('change', fetchExams));
searchBtn.addEventListener('click', fetchExams);
qEl.addEventListener('keydown', e => { if (e.key === 'Enter') fetchExams(); });
document.querySelectorAll('[data-lang]').forEach(el => {
  el.addEventListener('click', e => {
    e.preventDefault();
    currentLang = el.getAttribute('data-lang');
    updateLanguage();
    initFilters();
  });
});

// Initialize
loadTranslations();
loadExams();