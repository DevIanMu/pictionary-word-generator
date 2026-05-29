// js/timer.js
// Timer with SVG ring progress

export class Timer {
  constructor() {
    this.duration = 60;
    this.remaining = 60;
    this.isRunning = false;
    this.interval = null;
    this.onTick = null;
    this.onComplete = null;
    this.circumference = 2 * Math.PI * 54; // 339.292
  }

  /**
   * Set timer duration in seconds
   * @param {number} seconds
   */
  setDuration(seconds) {
    this.duration = parseInt(seconds, 10);
    this.reset();
  }

  /**
   * Start the timer
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.remaining = this.duration;

    this._updateDisplay();

    this.interval = setInterval(() => {
      this.remaining--;
      this._updateDisplay();

      if (this.onTick) {
        this.onTick(this.remaining);
      }

      if (this.remaining <= 0) {
        this._complete();
      }
    }, 1000);
  }

  /**
   * Stop the timer
   */
  stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Reset to full duration
   */
  reset() {
    this.stop();
    this.remaining = this.duration;
    this._updateDisplay();
  }

  /**
   * Update the SVG ring display
   * @private
   */
  _updateDisplay() {
    const progressEl = document.getElementById('timerProgress');
    const numberEl = document.getElementById('timerNumber');
    const ringEl = document.querySelector('.timer-ring');

    if (!progressEl || !numberEl) return;

    const offset = this.circumference - (this.remaining / this.duration) * this.circumference;
    progressEl.style.strokeDashoffset = offset;
    numberEl.textContent = this.remaining;

    // Warning state: last 10 seconds
    if (this.remaining <= 10) {
      progressEl.classList.add('warning');
      numberEl.classList.add('warning');

      // Shake animation
      if (ringEl) {
        ringEl.classList.remove('shake');
        void ringEl.offsetWidth;
        ringEl.classList.add('shake');
      }
    } else {
      progressEl.classList.remove('warning');
      numberEl.classList.remove('warning');
      if (ringEl) ringEl.classList.remove('shake');
    }
  }

  /**
   * Timer complete callback
   * @private
   */
  _complete() {
    this.stop();

    if (this.onComplete) {
      this.onComplete();
    }
  }
}
