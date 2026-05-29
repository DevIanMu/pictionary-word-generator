// js/app.js
// Main application: coordinates all modules

import { getRandomWord, getAllCategories, CATEGORY_CONFIG } from './words.js';
import { initBackgroundConfetti, animateCardDraw, triggerConfettiBurst, playDingSound } from './animations.js';
import { Timer } from './timer.js';

// App State
const state = {
  selectedCategories: [], // empty = all
  selectedDifficulty: 'easy',
  timerDuration: 60,
  hasDrawn: false,
  isAnimating: false
};

// DOM Elements
const elements = {};

function cacheElements() {
  elements.cardDeck = document.getElementById('cardDeck');
  elements.wordCard = document.getElementById('wordCard');
  elements.drawBtn = document.getElementById('drawBtn');
  elements.timerBtn = document.getElementById('timerBtn');
  elements.timerSection = document.getElementById('timerSection');
  elements.timerNumber = document.getElementById('timerNumber');
  elements.timerLabel = document.getElementById('timerLabel');
  elements.filterToggle = document.getElementById('filterToggle');
  elements.filterContent = document.getElementById('filterContent');
  elements.filterSummary = document.getElementById('filterSummary');
  elements.categoryPills = document.getElementById('categoryPills');
  elements.difficultyOptions = document.getElementById('difficultyOptions');
  elements.timerSelect = document.getElementById('timerSelect');
}

// Timer instance
const timer = new Timer();

timer.onComplete = () => {
  playDingSound();
  triggerConfettiBurst();

  // Show "Time's Up!" message
  const label = elements.timerLabel;
  label.innerHTML = '<span class="timer-timesup">\u23F0 Time\'s Up!</span>';

  // Reset timer button
  elements.timerBtn.querySelector('.btn-text').textContent = 'START TIMER';
  elements.timerBtn.disabled = false;
};

timer.onTick = (remaining) => {
  // Update label
  if (remaining > 0) {
    elements.timerLabel.textContent = remaining === 1 ? 'second remaining' : 'seconds remaining';
  }
};

// ==================== Initialization ====================

function init() {
  cacheElements();
  initBackgroundConfetti();
  renderCategoryPills();
  bindEvents();

  // Start deck idle animation
  if (elements.cardDeck) {
    elements.cardDeck.classList.add('idle');
  }

  // Load saved preferences
  loadPreferences();
}

// ==================== Event Binding ====================

function bindEvents() {
  // Draw button
  elements.drawBtn.addEventListener('click', handleDrawCard);

  // Timer button
  elements.timerBtn.addEventListener('click', handleTimerToggle);

  // Filter toggle
  elements.filterToggle.addEventListener('click', toggleFilterPanel);

  // Difficulty buttons
  elements.difficultyOptions.addEventListener('click', handleDifficultyClick);

  // Timer select
  elements.timerSelect.addEventListener('change', handleTimerSelect);
}

// ==================== Card Drawing ====================

async function handleDrawCard() {
  if (state.isAnimating) return;

  state.isAnimating = true;
  elements.drawBtn.disabled = true;

  // Hide deck, show card
  elements.cardDeck.style.display = 'none';
  elements.cardDeck.classList.remove('idle');

  // Get random word
  const word = getRandomWord(
    state.selectedCategories.length > 0 ? state.selectedCategories : null,
    state.selectedDifficulty
  );

  const categoryConfig = CATEGORY_CONFIG[word.category];

  // Animate card
  await animateCardDraw(elements.wordCard, word, categoryConfig.color);

  state.hasDrawn = true;
  state.isAnimating = false;
  elements.drawBtn.disabled = false;

  // If timer is already visible, auto-reset it
  if (timer.isRunning) {
    timer.reset();
    elements.timerBtn.querySelector('.btn-text').textContent = 'START TIMER';
  }
}

// ==================== Timer ====================

function handleTimerToggle() {
  if (timer.isRunning) {
    // Stop
    timer.stop();
    elements.timerBtn.querySelector('.btn-text').textContent = 'START TIMER';
    elements.timerSection.style.display = 'none';
    return;
  }

  // Show timer section
  elements.timerSection.style.display = 'flex';
  elements.timerLabel.textContent = 'seconds remaining';

  // Reset timer label
  const label = elements.timerLabel;
  label.textContent = 'seconds remaining';

  timer.setDuration(state.timerDuration);
  timer.start();

  elements.timerBtn.querySelector('.btn-text').textContent = 'STOP TIMER';
}

function handleTimerSelect(e) {
  state.timerDuration = parseInt(e.target.value, 10);
  timer.setDuration(state.timerDuration);

  // If timer is visible but not running, update display
  if (!timer.isRunning && elements.timerSection.style.display !== 'none') {
    timer.reset();
  }

  savePreferences();
}

// ==================== Filter Panel ====================

function toggleFilterPanel() {
  const isOpen = elements.filterContent.classList.contains('open');

  if (isOpen) {
    elements.filterContent.classList.remove('open');
    elements.filterToggle.setAttribute('aria-expanded', 'false');
  } else {
    elements.filterContent.classList.add('open');
    elements.filterToggle.setAttribute('aria-expanded', 'true');
  }
}

function renderCategoryPills() {
  const categories = getAllCategories();

  // "All" pill first
  const allPill = document.createElement('button');
  allPill.className = 'cat-pill active';
  allPill.textContent = 'All';
  allPill.dataset.category = 'all';
  allPill.addEventListener('click', () => handleCategoryClick(allPill));
  elements.categoryPills.appendChild(allPill);

  // Individual category pills
  for (const cat of categories) {
    const config = CATEGORY_CONFIG[cat];
    const pill = document.createElement('button');
    pill.className = 'cat-pill';
    pill.textContent = config.label;
    pill.dataset.category = cat;
    pill.addEventListener('click', () => handleCategoryClick(pill));
    elements.categoryPills.appendChild(pill);
  }
}

function handleCategoryClick(clickedPill) {
  const category = clickedPill.dataset.category;
  const allPill = elements.categoryPills.querySelector('[data-category="all"]');

  if (category === 'all') {
    // Select all: clear individual selections
    state.selectedCategories = [];
    allPill.classList.add('active');
    allPill.style.background = '';

    const pills = elements.categoryPills.querySelectorAll('.cat-pill:not([data-category="all"])');
    pills.forEach(p => {
      p.classList.remove('active');
      p.style.background = '';
    });
  } else {
    // Toggle individual category
    allPill.classList.remove('active');
    allPill.style.background = '';

    if (clickedPill.classList.contains('active')) {
      clickedPill.classList.remove('active');
      clickedPill.style.background = '';
      state.selectedCategories = state.selectedCategories.filter(c => c !== category);
    } else {
      clickedPill.classList.add('active');
      clickedPill.style.background = CATEGORY_CONFIG[category].color;
      state.selectedCategories.push(category);
    }

    // If no categories selected, revert to "All"
    if (state.selectedCategories.length === 0) {
      allPill.classList.add('active');
    }
  }

  updateFilterSummary();
  savePreferences();
}

function handleDifficultyClick(e) {
  const btn = e.target.closest('.diff-btn');
  if (!btn) return;

  // Remove active from all
  elements.difficultyOptions.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));

  // Add active to clicked
  btn.classList.add('active');

  state.selectedDifficulty = btn.dataset.difficulty;
  updateFilterSummary();
  savePreferences();
}

function updateFilterSummary() {
  let catText;
  if (state.selectedCategories.length === 0) {
    catText = 'All Categories';
  } else if (state.selectedCategories.length <= 2) {
    catText = state.selectedCategories.map(c => CATEGORY_CONFIG[c].label).join(', ');
  } else {
    catText = `${state.selectedCategories.length} Categories`;
  }

  const diffLabel = state.selectedDifficulty.charAt(0).toUpperCase() + state.selectedDifficulty.slice(1);
  elements.filterSummary.textContent = `Filters: ${catText} · ${diffLabel}`;
}

// ==================== Local Storage Preferences ====================

function savePreferences() {
  try {
    localStorage.setItem('pwg_prefs', JSON.stringify({
      categories: state.selectedCategories,
      difficulty: state.selectedDifficulty,
      timerDuration: state.timerDuration
    }));
  } catch (e) {
    // localStorage not available
  }
}

function loadPreferences() {
  try {
    const saved = localStorage.getItem('pwg_prefs');
    if (!saved) return;

    const prefs = JSON.parse(saved);

    // Restore difficulty
    if (prefs.difficulty) {
      state.selectedDifficulty = prefs.difficulty;
      elements.difficultyOptions.querySelectorAll('.diff-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.difficulty === prefs.difficulty);
      });
    }

    // Restore timer duration
    if (prefs.timerDuration) {
      state.timerDuration = prefs.timerDuration;
      elements.timerSelect.value = String(prefs.timerDuration);
      timer.setDuration(prefs.timerDuration);
    }

    // Restore categories
    if (prefs.categories && prefs.categories.length > 0) {
      state.selectedCategories = prefs.categories;
      const allPill = elements.categoryPills.querySelector('[data-category="all"]');
      allPill.classList.remove('active');

      for (const cat of prefs.categories) {
        const pill = elements.categoryPills.querySelector(`[data-category="${cat}"]`);
        if (pill) {
          pill.classList.add('active');
          pill.style.background = CATEGORY_CONFIG[cat].color;
        }
      }
    }

    updateFilterSummary();
  } catch (e) {
    // Ignore storage errors
  }
}

// ==================== Start ====================

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
