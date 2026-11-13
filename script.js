const canvas = document.getElementById('pongCanvas');
const ctx = canvas.getContext('2d');
const W = canvas.width;
const H = canvas.height;

const $ = (id) => document.getElementById(id);
const ui = {
  menu: $('menu'), lights: $('lightsScreen'), end: $('endScreen'), pause: $('pauseScreen'),
  scoreL: $('scoreL'), scoreR: $('scoreR'), nameL: $('nameL'), nameR: $('nameR'), mode: $('modeLabel'),
  goText: $('goText'), winner: $('winner'), final: $('finalScore'), sound: $('soundBtn'),
};

const COLORS = { bg: '#0b0b0e', blue: '#2b4cff', red: '#ff2a3d', yellow: '#ffd400', line: 'rgba(255,255,255,0.12)' };
const PADDLE_W = 14;
const PADDLE_H = 130;
const BALL_R = 12;
const WIN_SCORE = 15;
const PADDLE_SPEED = 10;
const BASE_SPEED = 7;
const MAX_SPEED = 17;

const state = {
  mode: 'idle', // idle | countdown | playing | paused | over
  twoPlayers: false,
  left: { y: (H - PADDLE_H) / 2, score: 0, up: false, down: false },
  right: { y: (H - PADDLE_H) / 2, score: 0, up: false, down: false },
  ball: { x: W / 2, y: H / 2, vx: 0, vy: 0, trail: [] },
  particles: [],
  shake: 0,
};
let soundOn = true;
let audio;
let timers = [];

/* ---------- sound ---------- */
function beep(freq, dur = 0.08, type = 'square', vol = 0.06) {
  if (!soundOn) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    const o = audio.createOscillator();
    const g = audio.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, audio.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + dur);
    o.connect(g).connect(audio.destination);
    o.start();
    o.stop(audio.currentTime + dur);
  } catch (e) { /* audio unavailable */ }
}

ui.sound.addEventListener('click', () => {
  soundOn = !soundOn;
  ui.sound.classList.toggle('is-on', soundOn);
});

/* ---------- helpers ---------- */
const show = (el) => el.classList.remove('is-hidden');
const hide = (el) => el.classList.add('is-hidden');
const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); };
const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

function updateScore(side) {
  ui.scoreL.textContent = state.left.score;
  ui.scoreR.textContent = state.right.score;
  if (side) {
    const el = side === 'left' ? ui.scoreL : ui.scoreR;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }
}

function serve(dir) {
  const b = state.ball;
  b.x = W / 2;
  b.y = H / 2;
  const angle = (Math.random() * 0.8 - 0.4);
  b.vx = BASE_SPEED * Math.cos(angle) * (dir || (Math.random() > 0.5 ? 1 : -1));
  b.vy = BASE_SPEED * Math.sin(angle);
  b.trail = [];
}

function burst(x, y, color) {
  for (let i = 0; i < 16; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = 2 + Math.random() * 5;
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, color });
  }
}

/* ---------- flow ---------- */
function setNames() {
  ui.mode.textContent = state.twoPlayers ? '2 ИГРОКА' : '1 ИГРОК';
  ui.nameL.textContent = state.twoPlayers ? 'ИГРОК 1' : 'ИГРОК';
  ui.nameR.textContent = state.twoPlayers ? 'ИГРОК 2' : 'КОМПЬЮТЕР';
}

function newGame(twoPlayers) {
  clearTimers();
  state.twoPlayers = twoPlayers;
  state.left.score = state.right.score = 0;
  state.left.y = state.right.y = (H - PADDLE_H) / 2;
  state.ball.vx = state.ball.vy = 0;
  state.ball.x = W / 2;
  state.ball.y = H / 2;
  state.ball.trail = [];
  setNames();
  updateScore();
  hide(ui.menu);
  hide(ui.end);
  hide(ui.pause);
  startLights(() => { serve(); state.mode = 'playing'; });
}

// F1 start lights: five reds light up one by one, then go out
function startLights(done) {
  state.mode = 'countdown';
  const lights = ui.lights.querySelectorAll('.light');
  lights.forEach((l) => l.classList.remove('is-on'));
  ui.goText.textContent = ' ';
  ui.goText.classList.remove('is-go');
  show(ui.lights);
  lights.forEach((l, i) => later(() => { l.classList.add('is-on'); beep(440, 0.12, 'sine', 0.08); }, 500 + i * 550));
  const out = 500 + lights.length * 550 + 700;
  later(() => {
    lights.forEach((l) => l.classList.remove('is-on'));
    ui.goText.textContent = 'LIGHTS OUT';
    ui.goText.classList.add('is-go');
    beep(880, 0.25, 'sine', 0.09);
    done();
  }, out);
  later(() => hide(ui.lights), out + 700);
}

function finish() {
  state.mode = 'over';
  const leftWon = state.left.score > state.right.score;
  ui.winner.textContent = state.twoPlayers ? (leftWon ? 'Игрок 1 победил' : 'Игрок 2 победил') : (leftWon ? 'Ты победил!' : 'Победил компьютер');
  ui.winner.style.color = leftWon ? COLORS.blue : COLORS.red;
  ui.final.textContent = state.left.score + ' : ' + state.right.score;
  beep(leftWon ? 660 : 220, 0.4, 'sawtooth', 0.07);
  show(ui.end);
}

function togglePause() {
  if (state.mode === 'playing') { state.mode = 'paused'; show(ui.pause); }
  else if (state.mode === 'paused') { state.mode = 'playing'; hide(ui.pause); }
}

function toMenu() {
  clearTimers();
  state.mode = 'idle';
  hide(ui.end); hide(ui.pause); hide(ui.lights);
  show(ui.menu);
}

/* ---------- update ---------- */
function clampY(y) { return Math.max(0, Math.min(H - PADDLE_H, y)); }

function movePaddles() {
  const { left, right, ball } = state;
  if (left.up) left.y -= PADDLE_SPEED;
  if (left.down) left.y += PADDLE_SPEED;
  left.y = clampY(left.y);

  if (state.twoPlayers) {
    if (right.up) right.y -= PADDLE_SPEED;
    if (right.down) right.y += PADDLE_SPEED;
  } else {
    // AI: follows the ball with a dead zone, a bit slower than the player
    const target = ball.vx > 0 ? ball.y : H / 2;
    const center = right.y + PADDLE_H / 2;
    const diff = target - center;
    if (Math.abs(diff) > 14) right.y += Math.sign(diff) * Math.min(Math.abs(diff), PADDLE_SPEED * 0.82);
  }
  right.y = clampY(right.y);
}

function hitPaddle(paddle, dir) {
  const b = state.ball;
  const rel = (b.y - (paddle.y + PADDLE_H / 2)) / (PADDLE_H / 2); // -1..1
  const speed = Math.min(Math.hypot(b.vx, b.vy) * 1.06, MAX_SPEED);
  const angle = rel * (Math.PI / 3.2);
  b.vx = Math.cos(angle) * speed * dir;
  b.vy = Math.sin(angle) * speed;
  burst(b.x, b.y, dir > 0 ? COLORS.blue : COLORS.red);
  state.shake = 5;
  beep(dir > 0 ? 330 : 280, 0.07, 'square', 0.06);
}

function point(winnerSide) {
  const w = state[winnerSide];
  w.score++;
  updateScore(winnerSide);
  burst(state.ball.x, state.ball.y, COLORS.yellow);
  state.shake = 12;
  beep(120, 0.3, 'sawtooth', 0.07);
  if (w.score >= WIN_SCORE) {
    state.ball.vx = state.ball.vy = 0;
    finish();
    return;
  }
  // serve toward the player who just lost the point, after a short pause
  const dir = winnerSide === 'left' ? 1 : -1;
  state.ball.vx = state.ball.vy = 0;
  state.ball.x = W / 2;
  state.ball.y = H / 2;
  state.ball.trail = [];
  state.mode = 'serving';
  later(() => { serve(dir); state.mode = 'playing'; }, 800);
}

function moveBall() {
  const b = state.ball;
  b.trail.push({ x: b.x, y: b.y });
  if (b.trail.length > 14) b.trail.shift();
  b.x += b.vx;
  b.y += b.vy;

  if (b.y - BALL_R < 0) { b.y = BALL_R; b.vy = Math.abs(b.vy); beep(200, 0.04, 'triangle', 0.05); }
  if (b.y + BALL_R > H) { b.y = H - BALL_R; b.vy = -Math.abs(b.vy); beep(200, 0.04, 'triangle', 0.05); }

  const { left, right } = state;
  if (b.vx < 0 && b.x - BALL_R <= PADDLE_W && b.x > 0) {
    if (b.y + BALL_R > left.y && b.y - BALL_R < left.y + PADDLE_H) { b.x = PADDLE_W + BALL_R; hitPaddle(left, 1); }
  } else if (b.vx > 0 && b.x + BALL_R >= W - PADDLE_W && b.x < W) {
    if (b.y + BALL_R > right.y && b.y - BALL_R < right.y + PADDLE_H) { b.x = W - PADDLE_W - BALL_R; hitPaddle(right, -1); }
  }

  if (b.x < -BALL_R) point('right');
  else if (b.x > W + BALL_R) point('left');
}

function update() {
  if (state.mode === 'playing') { movePaddles(); moveBall(); }
  else if (state.mode === 'serving' || state.mode === 'countdown') movePaddles();
  state.particles.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life -= 0.03; });
  state.particles = state.particles.filter((p) => p.life > 0);
  state.shake *= 0.85;
}

/* ---------- render ---------- */
function glowRect(x, y, w, h, color) {
  ctx.shadowColor = color;
  ctx.shadowBlur = 24;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 6);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function render() {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  if (state.shake > 0.5) ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);

  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(-20, -20, W + 40, H + 40);

  // checkered edges (F1 flag)
  const sq = 14;
  for (let x = 0; x < W; x += sq) {
    for (const y of [0, H - sq]) {
      ctx.fillStyle = ((x / sq) + (y ? 1 : 0)) % 2 === 0 ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.02)';
      ctx.fillRect(x, y, sq, sq);
    }
  }

  // center line
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 3;
  ctx.setLineDash([16, 14]);
  ctx.beginPath();
  ctx.moveTo(W / 2, sq);
  ctx.lineTo(W / 2, H - sq);
  ctx.stroke();
  ctx.setLineDash([]);

  // team stripes behind paddles
  ctx.fillStyle = 'rgba(43,76,255,0.08)';
  ctx.fillRect(0, 0, 90, H);
  ctx.fillStyle = 'rgba(255,42,61,0.08)';
  ctx.fillRect(W - 90, 0, 90, H);

  glowRect(0, state.left.y, PADDLE_W, PADDLE_H, COLORS.blue);
  glowRect(W - PADDLE_W, state.right.y, PADDLE_W, PADDLE_H, COLORS.red);

  const b = state.ball;
  if (state.mode !== 'idle' && state.mode !== 'over' || b.vx !== 0) {
    b.trail.forEach((t, i) => {
      ctx.globalAlpha = (i / b.trail.length) * 0.35;
      ctx.fillStyle = COLORS.red;
      ctx.beginPath();
      ctx.arc(t.x, t.y, BALL_R * (i / b.trail.length), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }
  ctx.shadowColor = '#fff';
  ctx.shadowBlur = 20;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(b.x, b.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  state.particles.forEach((p) => {
    ctx.globalAlpha = Math.max(p.life, 0);
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, 4, 4);
  });
  ctx.globalAlpha = 1;
  ctx.restore();
}

// fixed 60 Hz logic regardless of monitor refresh rate
let last = performance.now();
let acc = 0;
function frame(now) {
  acc += Math.min(now - last, 100);
  last = now;
  const step = 1000 / 60;
  while (acc >= step) { update(); acc -= step; }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

/* ---------- input ---------- */
function pointerToPaddle(clientY) {
  const rect = canvas.getBoundingClientRect();
  const y = ((clientY - rect.top) / rect.height) * H - PADDLE_H / 2;
  state.left.y = clampY(y);
}
canvas.addEventListener('mousemove', (e) => pointerToPaddle(e.clientY));
canvas.addEventListener('touchmove', (e) => { e.preventDefault(); pointerToPaddle(e.touches[0].clientY); }, { passive: false });
canvas.addEventListener('touchstart', (e) => pointerToPaddle(e.touches[0].clientY), { passive: true });

const KEYS = {
  w: ['left', 'up'], s: ['left', 'down'],
  ArrowUp: ['right', 'up'], ArrowDown: ['right', 'down'],
};
function setKey(e, val) {
  const k = KEYS[e.key.length === 1 ? e.key.toLowerCase() : e.key];
  if (!k) return;
  e.preventDefault();
  state[k[0]][k[1]] = val;
}
document.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.key === 'p' || e.key === 'P') { e.preventDefault(); togglePause(); return; }
  setKey(e, true);
});
document.addEventListener('keyup', (e) => setKey(e, false));
window.addEventListener('blur', () => {
  state.left.up = state.left.down = state.right.up = state.right.down = false;
  if (state.mode === 'playing') togglePause();
});

$('onePlayerButton').addEventListener('click', () => newGame(false));
$('twoPlayerButton').addEventListener('click', () => newGame(true));
$('againButton').addEventListener('click', () => newGame(state.twoPlayers));
$('menuButton').addEventListener('click', toMenu);
