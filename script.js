// 뽀모도로 타이머 - Vanilla JS
// 여러 개의 타이머 인스턴스를 동시에 생성하고 독립적으로 관리한다.

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('timerContainer');
  const template = document.getElementById('timerTemplate');
  const addBtn = document.getElementById('addTimerBtn');
  const alarmSound = document.getElementById('alarmSound');

  const CIRCLE_CIRCUMFERENCE = 2 * Math.PI * 80; // r=80

  let timerCount = 0;

  class PomodoroTimer {
    constructor(id) {
      this.id = id;
      this.mode = 'focus';
      this.minutes = 25;
      this.totalSeconds = this.minutes * 60;
      this.remainingSeconds = this.totalSeconds;
      this.intervalId = null;
      this.isRunning = false;
      this.sessionCount = 0;

      this._buildDom();
      this._bindEvents();
      this._updateDisplay();
    }

    _buildDom() {
      const fragment = template.content.cloneNode(true);
      this.el = fragment.querySelector('.timer-card');
      this.el.dataset.id = this.id;

      this.titleInput = this.el.querySelector('.timer-title');
      this.removeBtn = this.el.querySelector('.remove-btn');
      this.modeBtns = this.el.querySelectorAll('.mode-btn');
      this.timeText = this.el.querySelector('.time-text');
      this.progressRing = this.el.querySelector('.progress-ring__fg');
      this.startBtn = this.el.querySelector('.start-btn');
      this.pauseBtn = this.el.querySelector('.pause-btn');
      this.resetBtn = this.el.querySelector('.reset-btn');
      this.sessionCountEl = this.el.querySelector('.session-count');

      this.progressRing.style.strokeDasharray = `${CIRCLE_CIRCUMFERENCE}`;
      this.progressRing.style.strokeDashoffset = '0';

      container.appendChild(this.el);
    }

    _bindEvents() {
      this.removeBtn.addEventListener('click', () => this._destroy());

      this.modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          if (this.isRunning) return; // 실행 중에는 모드 변경 불가
          this.modeBtns.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.mode = btn.dataset.mode;
          this.minutes = parseInt(btn.dataset.minutes, 10);
          this.totalSeconds = this.minutes * 60;
          this.remainingSeconds = this.totalSeconds;

          this.el.classList.remove('short', 'long', 'finished');
          if (this.mode === 'short' || this.mode === 'long') {
            this.el.classList.add(this.mode);
          }
          this._updateDisplay();
        });
      });

      this.startBtn.addEventListener('click', () => this._start());
      this.pauseBtn.addEventListener('click', () => this._pause());
      this.resetBtn.addEventListener('click', () => this._reset());
    }

    _start() {
      if (this.isRunning) return;
      this.isRunning = true;
      this.el.classList.add('running');
      this.el.classList.remove('finished');
      this.startBtn.disabled = true;
      this.pauseBtn.disabled = false;

      this.intervalId = setInterval(() => {
        this.remainingSeconds--;
        this._updateDisplay();

        if (this.remainingSeconds <= 0) {
          this._finish();
        }
      }, 1000);
    }

    _pause() {
      if (!this.isRunning) return;
      this.isRunning = false;
      clearInterval(this.intervalId);
      this.el.classList.remove('running');
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;
    }

    _reset() {
      clearInterval(this.intervalId);
      this.isRunning = false;
      this.remainingSeconds = this.totalSeconds;
      this.el.classList.remove('running', 'finished');
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;
      this._updateDisplay();
    }

    _finish() {
      clearInterval(this.intervalId);
      this.isRunning = false;
      this.el.classList.remove('running');
      this.el.classList.add('finished');
      this.startBtn.disabled = false;
      this.pauseBtn.disabled = true;

      if (this.mode === 'focus') {
        this.sessionCount++;
        this.sessionCountEl.textContent = this.sessionCount;
      }

      try {
        alarmSound.currentTime = 0;
        alarmSound.play().catch(() => {});
      } catch (e) {}

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${this.titleInput.value} - 시간 종료!`);
      }

      this.remainingSeconds = this.totalSeconds;
      this._updateDisplay();
    }

    _updateDisplay() {
      const m = Math.floor(this.remainingSeconds / 60);
      const s = this.remainingSeconds % 60;
      this.timeText.textContent =
        `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

      const progress = this.remainingSeconds / this.totalSeconds;
      const offset = CIRCLE_CIRCUMFERENCE * (1 - progress);
      this.progressRing.style.strokeDashoffset = offset;
    }

    _destroy() {
      clearInterval(this.intervalId);
      this.el.remove();
    }
  }

  function createTimer() {
    timerCount++;
    new PomodoroTimer(timerCount);
  }

  addBtn.addEventListener('click', createTimer);

  // 브라우저 알림 권한 요청 (선택적)
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  // 초기 타이머 2개 생성 (여러 개 타이머가 기본으로 보이도록)
  createTimer();
  createTimer();
});