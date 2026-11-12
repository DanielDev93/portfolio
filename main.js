/* ── INIT ─────────────────────────────────────────────── */
document.documentElement.classList.replace('no-js', 'js');
document.getElementById('yr').textContent = new Date().getFullYear();

/* ── THEME ───────────────────────────────────────────── */
const root = document.documentElement;
const initTheme = localStorage.getItem('theme') ||
  (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
root.dataset.theme = initTheme;
document.getElementById('theme-btn').addEventListener('click', () => {
  const t = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = t;
  localStorage.setItem('theme', t);
  document.querySelector('meta[name=theme-color]').content = t === 'dark' ? '#100e0b' : '#f0ebe0';
});

/* ── SCROLL PROGRESS BAR ─────────────────────────────── */
const progressBar = document.getElementById('progress');
window.addEventListener('scroll', () => {
  const max = document.body.scrollHeight - innerHeight;
  progressBar.style.width = (scrollY / max * 100) + '%';
}, { passive: true });

/* ── NAV SCROLL STATE ────────────────────────────────── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', scrollY > 40);
}, { passive: true });

/* ── ACTIVE NAV LINK ─────────────────────────────────── */
const sections  = [...document.querySelectorAll('section[id]')];
const navLinks  = [...document.querySelectorAll('.nav__links a[href^="#"]')];
const activeIO  = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
    }
  });
}, { threshold: .3 });
sections.forEach(s => activeIO.observe(s));

/* ── SCROLL REVEAL ───────────────────────────────────── */
const revealIO = new IntersectionObserver(entries => {
  // Stagger siblings inside the same parent
  const groups = new Map();
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const parent = e.target.parentElement;
    if (!groups.has(parent)) groups.set(parent, []);
    groups.get(parent).push(e.target);
  });
  groups.forEach(children => {
    children.forEach((el, i) => {
      el.style.transitionDelay = i * 90 + 'ms';
      el.classList.add('in');
      revealIO.unobserve(el);
    });
  });
}, { threshold: .1, rootMargin: '0px 0px -48px 0px' });
document.querySelectorAll('.reveal-up').forEach(el => revealIO.observe(el));

/* ── NUMBER COUNTER ──────────────────────────────────── */
function animateCount(el) {
  const to     = parseInt(el.dataset.to, 10);
  const suffix = el.dataset.suffix || '';
  const dur    = 1500;
  const start  = performance.now();
  const easeOut = p => 1 - Math.pow(1 - p, 3);
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(easeOut(p) * to) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const countIO = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { animateCount(e.target); countIO.unobserve(e.target); }
  });
}, { threshold: .6 });
document.querySelectorAll('.count').forEach(el => countIO.observe(el));

/* ── CUSTOM CURSOR ───────────────────────────────────── */
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0, rafId;

function trackCursor() {
  if (dot)  { dot.style.left  = mouseX + 'px'; dot.style.top  = mouseY + 'px'; }
  if (ring) {
    ringX += (mouseX - ringX) * .1;
    ringY += (mouseY - ringY) * .1;
    ring.style.left = ringX + 'px';
    ring.style.top  = ringY + 'px';
  }
  rafId = requestAnimationFrame(trackCursor);
}
document.addEventListener('pointermove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });
// Only run cursor on fine-pointer devices
if (matchMedia('(pointer: fine)').matches) trackCursor();

const hoverTargets = 'a, button, .project__art, .expertise__card, .skills__pills span, .contact__pill';
document.addEventListener('pointerover', e => {
  if (e.target.closest(hoverTargets)) document.body.classList.add('hovering');
});
document.addEventListener('pointerout', e => {
  if (e.target.closest(hoverTargets)) document.body.classList.remove('hovering');
});

/* ── BACK TO TOP ─────────────────────────────────────── */
document.getElementById('to-top').addEventListener('click', () =>
  window.scrollTo({ top: 0, behavior: 'smooth' })
);

/* ── GENERATIVE FLOW FIELD ───────────────────────────── */
const cv  = document.getElementById('flow');
const ctx = cv.getContext('2d');
const pma = matchMedia('(prefers-reduced-motion: reduce)').matches;
let W, H, particles = [], mouse = { x: -9999, y: -9999 }, t = 0;

// Smooth noise via layered sin/cos
const noise = (x, y, t) =>
  Math.sin(x * .003  + t       ) +
  Math.cos(y * .0035 - t * .9  ) +
  Math.sin((x + y) * .0017 + t * .55);

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  W = innerWidth; H = innerHeight;
  cv.width  = W * dpr;
  cv.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const count = Math.min(Math.floor(W * H / 9800), 140);
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    s: Math.random(),   // 0–1 seed for color picking
  }));
  ctx.clearRect(0, 0, W, H);
}

function drawFrame() {
  // Fade previous frame with a wash — creates ink-trail effect
  ctx.globalCompositeOperation = 'destination-out';
  ctx.fillStyle = 'rgba(0,0,0,.052)';
  ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = 'source-over';

  const dark = root.dataset.theme === 'dark';
  const col1 = dark ? '224,112,72'  : '196,83,45';   // accent
  const col2 = dark ? '90,158,160'  : '47,93,98';    // accent2

  t += .0013;
  for (const p of particles) {
    let ang = noise(p.x, p.y, t) * 1.25;
    // Slight repulsion from cursor
    const dx = p.x - mouse.x, dy = p.y - mouse.y;
    const d  = Math.hypot(dx, dy);
    if (d < 190) ang += (1 - d / 190) * 2.6 * (Math.sign(dx) || 1);

    const prevX = p.x, prevY = p.y;
    p.x += Math.cos(ang) * 1.15;
    p.y += Math.sin(ang) * 1.15;

    ctx.strokeStyle = `rgba(${p.s > .5 ? col1 : col2},${.17 + p.s * .22})`;
    ctx.lineWidth   = .85;
    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();

    // Wrap edges
    if (p.x < -2 || p.x > W + 2 || p.y < -2 || p.y > H + 2) {
      p.x = Math.random() * W;
      p.y = Math.random() * H;
    }
  }
  if (!pma) requestAnimationFrame(drawFrame);
}

window.addEventListener('resize', resize, { passive: true });
document.addEventListener('pointermove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
resize();
if (pma) {
  for (let i = 0; i < 240; i++) drawFrame();   // static snapshot only
} else {
  drawFrame();
}
