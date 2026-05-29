// js/animations.js
// Animation utilities: card flip, confetti, shake

/**
 * Initialize background confetti - creates floating particles
 */
export function initBackgroundConfetti() {
  const container = document.querySelector('.confetti-bg');
  if (!container) return;

  const colors = ['#FF6B35', '#FFD23F', '#06D6A0', '#FF6B9D', '#FF8C42', '#AA96DA', '#4ECDC4'];
  const pieceCount = 25;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    piece.style.animationDuration = `${3 + Math.random() * 4}s`;
    piece.style.animationDelay = `${Math.random() * 5}s`;
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${6 + Math.random() * 8}px`;
    container.appendChild(piece);
  }
}

/**
 * Trigger confetti burst explosion from center
 */
export function triggerConfettiBurst() {
  const container = document.getElementById('confettiBurst');
  if (!container) return;

  // Clear any existing burst
  container.innerHTML = '';

  const colors = ['#FF6B35', '#FFD23F', '#06D6A0', '#FF6B9D', '#FF8C42', '#AA96DA', '#4ECDC4', '#F38181'];
  const pieceCount = 90;
  const gravity = 0.5;

  for (let i = 0; i < pieceCount; i++) {
    const piece = document.createElement('div');
    piece.className = 'burst-piece';

    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = 6 + Math.random() * 10;
    const angle = (Math.PI * 2 * i) / pieceCount + (Math.random() - 0.5) * 0.5;
    const velocity = 8 + Math.random() * 12;

    piece.style.width = `${size}px`;
    piece.style.height = `${size}px`;
    piece.style.background = color;
    piece.style.borderRadius = Math.random() > 0.4 ? '50%' : '2px';

    container.appendChild(piece);

    // Animate with JS for better control
    let x = 0;
    let y = 0;
    let vx = Math.cos(angle) * velocity;
    let vy = Math.sin(angle) * velocity - 5;
    let opacity = 1;
    let rotation = 0;
    let rotSpeed = (Math.random() - 0.5) * 20;

    const animate = () => {
      vx *= 0.98;
      vy += gravity;
      x += vx;
      y += vy;
      opacity -= 0.012;
      rotation += rotSpeed;

      if (opacity <= 0) {
        piece.remove();
        return;
      }

      piece.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;
      piece.style.opacity = opacity;
      requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }

  // Clean up container after animation
  setTimeout(() => {
    container.innerHTML = '';
  }, 3000);
}

/**
 * Animate the card flip and fly-in
 * @param {HTMLElement} cardEl - The .word-card element
 * @param {Object} wordData - { word, emoji, category, difficulty }
 * @param {string} categoryColor - Hex color for the category pill
 */
export function animateCardDraw(cardEl, wordData, categoryColor) {
  return new Promise((resolve) => {
    const inner = cardEl.querySelector('.card-inner');
    const categoryEl = cardEl.querySelector('#cardCategory');
    const emojiEl = cardEl.querySelector('#cardEmoji');
    const wordEl = cardEl.querySelector('#cardWord');
    const difficultyEl = cardEl.querySelector('#cardDifficulty');

    // Reset state
    cardEl.classList.remove('entering', 'landed');
    inner.classList.remove('flipped');

    // Update content while card is "back side" (not visible yet)
    categoryEl.textContent = wordData.category;
    categoryEl.style.background = categoryColor;
    emojiEl.textContent = wordData.emoji;
    wordEl.textContent = wordData.word;

    const stars = '★'.repeat(getStarCount(wordData.difficulty)) + '☆'.repeat(3 - getStarCount(wordData.difficulty));
    difficultyEl.innerHTML = `<span class="difficulty-stars">${stars}</span> <span>${capitalize(wordData.difficulty)}</span>`;

    // Show card
    cardEl.style.display = 'block';

    // Force reflow
    void cardEl.offsetWidth;

    // Add entering class to trigger CSS animation
    cardEl.classList.add('entering');

    // Listen for animation end
    const onEnd = (e) => {
      if (e.animationName === 'cardEnter') {
        cardEl.classList.remove('entering');
        cardEl.classList.add('landed');
        inner.classList.add('flipped');
        cardEl.removeEventListener('animationend', onEnd);
        resolve();
      }
    };

    cardEl.addEventListener('animationend', onEnd);

    // Fallback: resolve after max animation time
    setTimeout(() => {
      cardEl.classList.remove('entering');
      cardEl.classList.add('landed');
      inner.classList.add('flipped');
      resolve();
    }, 700);
  });
}

/**
 * Play a simple "ding" sound using Web Audio API
 */
export function playDingSound() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    // Audio not supported, silently fail
  }
}

function getStarCount(difficulty) {
  const map = { easy: 1, medium: 2, hard: 3 };
  return map[difficulty] || 1;
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
