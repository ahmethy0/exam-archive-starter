const subjectEl = document.getElementById('subject');
const yearEl = document.getElementById('year');
const schemeEl = document.getElementById('scheme');
const searchBtn = document.getElementById('searchBtn');
const grid = document.getElementById('grid');
const countEl = document.getElementById('count');

let exams = [];
let currentLang = 'en';
let translations = {};

// Retry fetch with delay
async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    } catch (error) {
      if (i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
}

// Load translations
async function loadTranslations() {
  try {
    translations = await fetchWithRetry('/data/lang.json');
    updateLanguage();
  } catch (error) {
    console.error('Error loading translations:', error);
    grid.innerHTML = `<div class="text-red-600">Error loading translations: ${error.message}. Using default text.</div>`;
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

// Load exams from exams.json
async function loadExams() {
  try {
    exams = await fetchWithRetry('/data/exams.json');
    exams = exams.filter(e => e.id && e.subject && e.year && e.title && e.file && typeof e.hasMarkScheme === 'boolean');
    initFilters();
    grid.innerHTML = "";
    countEl.classList.add("hidden");
  } catch (error) {
    grid.innerHTML = `<div class="text-red-600" data-i18n="error">Error loading exams: ${error.message}. Please try again later.</div>`;
    console.error('Error loading exams:', error);
  }
}

// Populate filter options
function initFilters() {
  const subjects = Array.from(new Set(exams.map(i => i.subject))).sort();
  const years = Array.from(new Set(exams.map(i => i.year))).sort((a, b) => b - a);

  subjectEl.innerHTML = `<option value="" disabled selected>Select Subject</option>`;
  yearEl.innerHTML = `<option value="" disabled selected>Select Year</option>`;
  schemeEl.innerHTML = `
    <option value="" disabled selected>Select Option</option>
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

  disableSearch();
  updateLanguage();
}

// Enable/disable search button
function toggleSearchButton() {
  const hasSelection = subjectEl.value || yearEl.value || schemeEl.value;
  if (hasSelection) enableSearch();
  else disableSearch();
}

function enableSearch() {
  searchBtn.disabled = false;
  searchBtn.classList.remove("opacity-50", "cursor-not-allowed");
}

function disableSearch() {
  searchBtn.disabled = true;
  searchBtn.classList.add("opacity-50", "cursor-not-allowed");
}

// Filter and render exams
function fetchExams() {
  const filters = {
    subject: subjectEl.value,
    year: yearEl.value,
    scheme: schemeEl.value
  };

  const filtered = exams.filter(e =>
    (!filters.subject || e.subject === filters.subject) &&
    (!filters.year || e.year.toString() === filters.year) &&
    (!filters.scheme || e.hasMarkScheme.toString() === filters.scheme)
  );

  render(filtered);
  countEl.textContent = translations[currentLang]?.results?.replace('{n}', filtered.length) || `${filtered.length} results`;
  countEl.classList.remove("hidden");
  updateLanguage();
}

// Render exam cards
function render(items) {
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<div class="col-span-full text-center text-gray-500 dark:text-gray-400" data-i18n="noResults">
      No exams found. Try different filters.
    </div>`;
    return;
  }

  items.forEach(e => {
    const card = document.createElement('div');
    card.className = `
      group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 
      dark:border-gray-700 shadow-sm hover:shadow-xl hover:-translate-y-1 
      transition-all duration-200 p-6 flex flex-col justify-between
    `;

    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
          📘 ${e.subject}
        </span>
        <span class="text-xs px-2 py-1 rounded-full ${
          e.hasMarkScheme 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300' 
            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        }">
          ${e.hasMarkScheme ? 'With Mark Scheme' : 'No Scheme'}
        </span>
      </div>
      <div class="mt-4">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600">
          ${e.title}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
          📅 ${e.year}
        </p>
      </div>
      <div class="mt-6">
        <a href="${e.file}" target="_blank"
          class="block w-full text-center rounded-xl bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700 transition">
          📥 Download
        </a>
      </div>
    `;
    grid.appendChild(card);
  });

  countEl.textContent = `${items.length} results`;
  countEl.classList.remove("hidden");
}

// Event listeners
[subjectEl, yearEl, schemeEl].forEach(el => {
  el.addEventListener('change', toggleSearchButton);
});
searchBtn.addEventListener('click', fetchExams);

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

