// Dirty static noise + intermittent glitch bar for the radar window.
(function () {
  const canvas = document.getElementById("radar-static");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let w, h, imageData, buf32;

  function fit() {
    const rect = canvas.getBoundingClientRect();
    // small canvas, scale up — keeps the grain chunky and "vintage"
    w = canvas.width = Math.max(120, Math.floor(rect.width / 3));
    h = canvas.height = Math.max(120, Math.floor(rect.height / 3));
    imageData = ctx.createImageData(w, h);
    buf32 = new Uint32Array(imageData.data.buffer);
  }
  fit();
  window.addEventListener("resize", fit);

  function paint() {
    // dense warm amber-white noise (more grain over the gif)
    for (let i = 0; i < buf32.length; i++) {
      const v = Math.random();
      if (v > 0.78) {
        const r = 200 + Math.floor(Math.random() * 55);
        const g = 140 + Math.floor(Math.random() * 50);
        const b = 60  + Math.floor(Math.random() * 50);
        const a = 100 + Math.floor(Math.random() * 155);
        buf32[i] = (a << 24) | (b << 16) | (g << 8) | r;
      } else {
        buf32[i] = 0;
      }
    }
    ctx.putImageData(imageData, 0, 0);
  }
  setInterval(paint, 50);
  paint();

  // intermittent glitch bar
  const bar = document.getElementById("radar-glitch-bar");
  function fire() {
    if (!bar) return;
    const top = 8 + Math.random() * 80;
    bar.style.top = top + "%";
    bar.classList.remove("go");
    void bar.offsetWidth;
    bar.classList.add("go");
  }
  function schedule() {
    const wait = 1800 + Math.random() * 4500;
    setTimeout(() => { fire(); schedule(); }, wait);
  }
  schedule();
})();
