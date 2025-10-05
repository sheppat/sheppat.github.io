/* UsefulUtilities — cinematic interactions using GSAP
   - particle background (canvas)
   - neon parallax reacting to mouse
   - cinematic intro animations (GSAP)
   - tilt + 3D card easing
   - scroll reveals (ScrollTrigger)
   - performance-aware throttling
*/

/* ---------- Utility / Performance ---------- */
const isLowPower = (() => {
  try {
    const nav = navigator;
    if (nav && (nav.deviceMemory && nav.deviceMemory <= 1)) return true;
    if (nav && nav.hardwareConcurrency && nav.hardwareConcurrency <= 2) return true;
    return false;
  } catch (e) { return false; }
})();

/* ---------- PARTICLE FIELD (canvas) ---------- */
const canvas = document.getElementById('particle-canvas');
const ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null;
let particles = [], cw, ch, rafId;

function resizeCanvas() {
  if (!canvas) return;
  cw = canvas.width = Math.floor(window.innerWidth * devicePixelRatio);
  ch = canvas.height = Math.floor(window.innerHeight * devicePixelRatio);
  canvas.style.width = window.innerWidth + 'px';
  canvas.style.height = window.innerHeight + 'px';
  ctx && ctx.scale(devicePixelRatio, devicePixelRatio);
}
function initParticles(count = 70) {
  particles = [];
  for (let i=0;i<count;i++){
    particles.push({
      x: Math.random()*window.innerWidth,
      y: Math.random()*window.innerHeight,
      r: 0.6 + Math.random()*2.2,
      vx: (Math.random()-0.5)*0.2,
      vy: (Math.random()-0.5)*0.2,
      hue: 10 + Math.random()*40,
      life: 40 + Math.random()*120
    });
  }
}
function drawParticles() {
  if (!ctx) return;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.globalCompositeOperation = 'lighter';
  for (let p of particles){
    ctx.beginPath();
    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r*8);
    grad.addColorStop(0, `rgba(255,${120 + (p.hue%40)},${60 + (p.hue%20)},0.9)`);
    grad.addColorStop(0.4, `rgba(255,${60 + (p.hue%60)},${40 + (p.hue%30)},0.25)`);
    grad.addColorStop(1, `rgba(0,0,0,0)`);
    ctx.fillStyle = grad;
    ctx.arc(p.x, p.y, p.r*8, 0, Math.PI*2);
    ctx.fill();

    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    if (p.x < -50) p.x = window.innerWidth + 40;
    if (p.x > window.innerWidth + 50) p.x = -40;
    if (p.y < -50) p.y = window.innerHeight + 40;
    if (p.y > window.innerHeight + 50) p.y = -40;
    if (p.life <= 0) Object.assign(p, {
      x: Math.random()*window.innerWidth, y: Math.random()*window.innerHeight,
      vx: (Math.random()-0.5)*0.3, vy: (Math.random()-0.5)*0.3, life: 80 + Math.random()*120
    });
  }
  ctx.globalCompositeOperation = 'source-over';
  rafId = requestAnimationFrame(drawParticles);
}

/* throttle for mouse move */
function throttle(fn, wait=16){
  let last = 0;
  return function(...args){
    const now = performance.now();
    if (now - last >= wait) { last = now; fn.apply(this,args); }
  };
}

/* ---------- NEON PARALLAX (mouse) ---------- */
const hero = document.querySelector('.hero.cinematic');
function handleMouse(e){
  const nx = (e.clientX / window.innerWidth) - 0.5;
  const ny = (e.clientY / window.innerHeight) - 0.5;
  // move neon layers
  document.querySelectorAll('.neon-layer').forEach((el,i)=>{
    const depth = (i+1)*6;
    el.style.transform = `translate3d(${nx*depth}px, ${ny*depth}px, 0)`;
    el.style.opacity = 0.12 + i*0.03;
  });
  // subtle hero tilt
  if (hero) hero.style.transform = `perspective(900px) rotateX(${ny*3}deg) rotateY(${nx*5}deg)`;
}

/* ---------- GSAP INTRO + SCROLLTRIGGERS ---------- */
function initGSAP() {
  if (!window.gsap) return;
  gsap.registerPlugin(ScrollTrigger);

  // cinematic intro
  gsap.from('.brand-title', { y: -12, opacity: 0, duration: .7, ease: 'power3.out' });
  gsap.from('.brand-sub', { y: -6, opacity: 0, duration: .6, delay:.08 });
  gsap.from('.nav-link', { y: -8, opacity: 0, stagger: .04, duration: .6, delay:.12 });

  gsap.from('.hero-logo', { y: 24, opacity:0, scale:0.98, duration: 1.1, ease:'expo.out', delay:.18 });
  gsap.from('.hero-title', { y: 18, opacity:0, duration:.9, ease:'power3.out', delay:.28 });
  gsap.from('.hero-sub', { y: 10, opacity:0, duration:.8, delay:.36 });
  gsap.from('.hero-cta .btn', { y: 10, opacity:0, stagger:.08, duration:.6, delay:.48 });

  // feature cards reveal
  gsap.utils.toArray('.feature-card').forEach((el) => {
    gsap.from(el, {
      y: 18, opacity: 0, duration: .9, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 82%' }
    });
  });

  // preview cards with 3D tilt subtle shadow lift on scroll
  gsap.utils.toArray('.game-preview').forEach((el, i) => {
    gsap.fromTo(el, { y: 28, opacity:0 }, {
      y:0, opacity:1, duration: .9, ease:'power3.out', delay: i*0.06,
      scrollTrigger: { trigger: el, start: 'top 88%' }
    });
  });

  // footer
  gsap.from('.site-footer', { y: 12, opacity:0, duration:.8, delay:.2 });
}

/* ---------- TILT INTERACTIONS (with easing) ---------- */
function initTilt() {
  document.querySelectorAll('.tilt').forEach(card => {
    let rectW = 0, rectH = 0;
    card.addEventListener('mousemove', throttle((e) => {
      const rect = card.getBoundingClientRect();
      rectW = rect.width; rectH = rect.height;
      const px = (e.clientX - rect.left) / rectW;
      const py = (e.clientY - rect.top) / rectH;
      const rx = (py - 0.5) * -12; // rotateX
      const ry = (px - 0.5) * 12;  // rotateY
      gsap.to(card, { rotationX: rx, rotationY: ry, scale:1.032, transformPerspective:900, transformOrigin:'center', duration:0.45, ease:'power3.out' });
    }), 12);

    card.addEventListener('mouseleave', () => {
      gsap.to(card, { rotationX:0, rotationY:0, scale:1, duration:0.6, ease:'elastic.out(1,0.6)' });
    });
  });
}

/* ---------- NAV CLICK TRANSITION (fade out) ---------- */
function initNavTransitions() {
  document.querySelectorAll('.nav-link').forEach(a => {
    a.addEventListener('click', (e) => {
      // local navigation only
      const href = a.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#')) return;
      e.preventDefault();
      gsap.to('#ui', { opacity:0, y:-8, duration:.28, ease:'power2.in', onComplete: () => window.location = href });
    });
  });

  // re-enter animation
  window.addEventListener('pageshow', () => {
    gsap.fromTo('#ui', { opacity:0, y:8 }, { opacity:1, y:0, duration:.45, ease:'power3.out' });
  });
}

/* ---------- STARTUP ---------- */
function startup() {
  // Canvas + particles only on capable devices
  if (!isLowPower && ctx) {
    resizeCanvas();
    initParticles( Math.min(140, Math.floor(window.innerWidth/10)) );
    drawParticles();
    window.addEventListener('resize', () => { cancelAnimationFrame(rafId); resizeCanvas(); initParticles( Math.min(140, Math.floor(window.innerWidth/10)) ); drawParticles(); });
  } else {
    // hide canvas for low-power
    if (canvas) canvas.style.display = 'none';
  }

  // mouse neon parallax only desktop
  if (!/Mobi|Android|iPhone|iPad/.test(navigator.userAgent)) {
    window.addEventListener('mousemove', throttle(handleMouse, 16));
  }

  // initialize GSAP stuff
  initGSAP();
  initTilt();
  initNavTransitions();

  // gentle idle motion for neon layers
  if (window.gsap) {
    gsap.to('.neon-layer', { x: '+=10', y: '+=8', rotation: 0.01, duration: 8, repeat:-1, yoyo:true, ease:'sine.inOut' });
  }
}

/* ---------- INIT ---------- */
document.addEventListener('DOMContentLoaded', startup, { passive:true });

