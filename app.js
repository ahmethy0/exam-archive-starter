const subjectEl = document.getElementById('subject');
const yearEl = document.getElementById('year');
const schemeEl = document.getElementById('scheme');
const searchBtn = document.getElementById('searchBtn');
const resetBtn = document.getElementById('resetBtn'); // new reset button
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

// Populate filter options with placeholders
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

  // Disable search initially
  disableSearch();
  updateLanguage();
}

// Enable/disable search button depending on filters
function toggleSearchButton() {
  const hasSelection = subjectEl.value || yearEl.value || schemeEl.value;
  if (hasSelection) {
    enableSearch();
  } else {
    disableSearch();
  }
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

// Render exam cards (clean design)
function render(items) {
  grid.innerHTML = '';
  if (!items.length) {
    grid.innerHTML = `<div class="col-span-full text-center text-gray-500 dark:text-gray-400" data-i18n="noResults">
      No exams found. Try different filters.
    </div>`;
    return;
  }

  for (const e of items) {
    const card = document.createElement('a');
    card.href = e.file;
    card.target = "_blank";
    card.className = 'block rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow hover:shadow-lg hover:border-blue-500 transition';
    card.innerHTML = `
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-blue-600 dark:text-blue-400">${e.subject}</span>
        <span class="text-xs px-2 py-1 rounded-full ${e.hasMarkScheme ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}">
          ${e.hasMarkScheme ? 'With Mark Scheme' : 'No Scheme'}
        </span>
      </div>
      <h3 class="mt-3 text-lg font-semibold">${e.title}</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400">${e.year}</p>
      <button class="mt-4 w-full rounded-lg bg-blue-600 text-white py-2 text-sm font-medium hover:bg-blue-700">
        Download
      </button>
    `;
    grid.appendChild(card);
  }
}

// Reset filters
function resetFilters() {
  subjectEl.selectedIndex = 0;
  yearEl.selectedIndex = 0;
  schemeEl.selectedIndex = 0;
  grid.innerHTML = "";
  countEl.classList.add("hidden");
  disableSearch();
}

// Event listeners
[subjectEl, yearEl, schemeEl].forEach(el => {
  el.addEventListener('change', toggleSearchButton);
});

searchBtn.addEventListener('click', fetchExams);
resetBtn.addEventListener('click', resetFilters);

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
