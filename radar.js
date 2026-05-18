// Radar sweep — small canvas in the blog window header.
// 60s vibe: concentric rings, crosshair, rotating sweep with fade trail, occasional blips.
(function () {
  const canvas = document.getElementById("radar-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h, r, cx, cy, dpr;

  function fit() {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    w = canvas.width = rect.width * dpr;
    h = canvas.height = rect.height * dpr;
    cx = w / 2;
    cy = h / 2;
    r = Math.min(w, h) / 2 - 2 * dpr;
  }
  fit();
  window.addEventListener("resize", fit);

  // pip-boy green palette — fixed regardless of site accent
  function accent() {
    return getComputedStyle(document.querySelector(".radar-window")).getPropertyValue("--pb-green").trim() || "#1aff5b";
  }

  // blips — random surface targets, fade over time
  const blips = [];
  function spawnBlip() {
    blips.push({
      a: Math.random() * Math.PI * 2,
      d: 0.3 + Math.random() * 0.65,
      life: 1,
      born: performance.now(),
    });
  }
  // schedule blips
  setInterval(() => { if (Math.random() < 0.7) spawnBlip(); }, 900);
  for (let i = 0; i < 4; i++) spawnBlip();

  let angle = -Math.PI / 2;

  function draw(t) {
    const orange = accent();
    // longer fade — phosphor decay leaves a softer trail
    ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(cx, cy);

    // background tint disc — dim phosphor wash
    ctx.fillStyle = "rgba(255, 200, 120, 0.035)";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // concentric rings
    ctx.strokeStyle = orange;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1 * dpr;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, (r * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }

    // crosshair + angle ticks
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
    ctx.moveTo(0, -r); ctx.lineTo(0, r);
    ctx.stroke();

    // tick marks every 30°
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * (r - 4 * dpr), Math.sin(a) * (r - 4 * dpr));
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
      ctx.stroke();
    }

    // sweep cone (gradient wedge trailing the sweep)
    const grad = ctx.createConicGradient ? null : null;
    // draw trailing wedge via translucent triangles
    const SWEEP = Math.PI / 3.4; // wedge width
    const STEPS = 16;
    for (let i = 0; i < STEPS; i++) {
      const a0 = angle - SWEEP * (i / STEPS);
      const a1 = angle - SWEEP * ((i + 1) / STEPS);
      ctx.globalAlpha = 0.16 * (1 - i / STEPS);
      ctx.fillStyle = orange;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, a1, a0);
      ctx.closePath();
      ctx.fill();
    }

    // sweep leading edge — bright line
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = orange;
    ctx.lineWidth = 1.4 * dpr;
    ctx.shadowColor = orange;
    ctx.shadowBlur = 8 * dpr;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // blips
    const now = performance.now();
    for (let i = blips.length - 1; i >= 0; i--) {
      const b = blips[i];
      // alive based on sweep proximity to its angle
      const age = (now - b.born) / 1000;
      const life = Math.max(0, 1 - age / 3.2);
      if (life <= 0) { blips.splice(i, 1); continue; }
      const x = Math.cos(b.a) * r * b.d;
      const y = Math.sin(b.a) * r * b.d;
      ctx.globalAlpha = 0.9 * life;
      ctx.fillStyle = orange;
      ctx.beginPath();
      ctx.arc(x, y, 2.5 * dpr * (0.6 + life * 0.6), 0, Math.PI * 2);
      ctx.fill();
      // glow
      ctx.globalAlpha = 0.25 * life;
      ctx.beginPath();
      ctx.arc(x, y, 6 * dpr, 0, Math.PI * 2);
      ctx.fill();
    }

    // centre dot
    ctx.globalAlpha = 1;
    ctx.fillStyle = orange;
    ctx.beginPath();
    ctx.arc(0, 0, 2 * dpr, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    angle += 0.012 + (Math.random() - 0.5) * 0.0015; // slight warble
    if (angle > Math.PI) angle -= Math.PI * 2;

    // sparse dead-pixel grain inside the disc
    if (Math.random() < 0.4) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * r;
      ctx.globalAlpha = 0.18 + Math.random() * 0.25;
      ctx.fillStyle = orange;
      ctx.translate(cx, cy);
      ctx.fillRect(Math.cos(a) * d, Math.sin(a) * d, 1 * dpr, 1 * dpr);
      ctx.translate(-cx, -cy);
      ctx.globalAlpha = 1;
    }

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
