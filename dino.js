// dino.js — Chrome Dino Run, ASCII terminal edition
// type "dino" to play  ·  space/↑ to jump  ·  q to quit
(function () {
  const G = {};
  const W = 50; // columns
  const H = 10; // rows (ground at H-1)
  const GROUND = H - 1;

  // dino frames
  const DINO = {
    run1: ["  ╭─╮ ","  │▐│╭╡","  ╰─╯││"," ▗▝   ╵"],
    run2: ["  ╭─╮ ","  │▐│╭╡","  ╰─╯╰╡"," ▗▝  ▐ "],
    jump: ["  ╭─╮ ","  │▐│╭╡","  ╰─╯╰╡"," ▗▝    "],
  };
  const DINO_W = 8;
  const DINO_H = 4;
  const DINO_X = 4;

  const CACTUS_SMALL = ["▗█▖","▐█▌","█▐█"," ╵ "];
  const CACTUS_BIG   = ["▗█▖ ","▐█▌╻","█▐█▐"," ▐█▌","  ╵ "];

  function rand(a, b) { return Math.floor(a + Math.random() * (b - a)); }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  }

  function buildGroundRow() {
    let s = "";
    for (let i = 0; i < W; i++) s += "▀";
    return s;
  }

  function renderFrame(dinoFrame, dinoY, obstacles, score, speed) {
    // dinoY: row index where top of dino starts (0 = ceiling, GROUND - DINO_H = on ground)
    const grid = [];
    for (let y = 0; y < H; y++) {
      grid[y] = [];
      for (let x = 0; x < W; x++) grid[y][x] = " ";
    }

    // ground
    for (let x = 0; x < W; x++) grid[GROUND][x] = "▀";

    // place dino
    const df = DINO[dinoFrame];
    for (let dy = 0; dy < DINO_H; dy++) {
      for (let dx = 0; dx < DINO_W; dx++) {
        const gx = DINO_X + dx;
        const gy = dinoY + dy;
        if (gy >= 0 && gy < H && gx >= 0 && gx < W) {
          const ch = df[dy][dx];
          if (ch && ch !== " ") grid[gy][gx] = ch;
        }
      }
    }

    // place obstacles
    for (const obs of obstacles) {
      const shape = obs.big ? CACTUS_BIG : CACTUS_SMALL;
      const ow = obs.big ? 4 : 3;
      const oh = obs.big ? 5 : 4;
      for (let dy = 0; dy < oh; dy++) {
        for (let dx = 0; dx < ow; dx++) {
          const gx = Math.floor(obs.x) + dx;
          const gy = GROUND - oh + 1 + dy;
          if (gy >= 0 && gy < H && gx >= 0 && gx < W) {
            const ch = shape[dy][dx];
            if (ch && ch !== " ") grid[gy][gx] = ch;
          }
        }
      }
    }

    // render to HTML lines
    const lines = [];
    for (let y = 0; y < H; y++) {
      let line = "";
      for (let x = 0; x < W; x++) {
        const ch = grid[y][x];
        if (ch === "▀") {
          line += '<span class="dim">▀</span>';
        } else if (ch === "▗" || ch === "▝" || ch === "▐" || ch === "▖" || ch === "╻") {
          line += '<span class="orange">' + ch + '</span>';
        } else if (ch === "╭" || ch === "╮" || ch === "╰" || ch === "╯" || ch === "│" || ch === "╡") {
          line += '<span class="info">' + ch + '</span>';
        } else if (ch === "█" || ch === "▌") {
          line += '<span class="warn">' + ch + '</span>';
        } else if (ch === "╵") {
          line += '<span class="dim">' + ch + '</span>';
        } else {
          line += esc(ch);
        }
      }
      lines.push(line);
    }
    return lines;
  }

  function collision(dinoY, obstacles) {
    const dx = DINO_X, dy = dinoY, dw = DINO_W, dh = DINO_H;
    for (const obs of obstacles) {
      const ow = obs.big ? 4 : 3;
      const oh = obs.big ? 5 : 4;
      const ox = Math.floor(obs.x);
      const oy = GROUND - oh + 1;
      if (dx < ox + ow && dx + dw > ox && dy < oy + oh && dy + dh > oy) return true;
    }
    return false;
  }

  function gameLoop(ctx, outEl) {
    if (G.paused) { G.rAF = requestAnimationFrame(() => gameLoop(ctx, outEl)); return; }
    G.tick++;

    // jump physics
    if (G.jumping) {
      G.jumpVel += G.gravity;
      G.dinoY += G.jumpVel;
      if (G.dinoY >= GROUND - DINO_H) {
        G.dinoY = GROUND - DINO_H;
        G.jumping = false;
        G.jumpVel = 0;
      }
    }

    // dino animation
    if (!G.jumping && G.tick % 6 === 0) {
      G.dinoFrame = G.dinoFrame === "run1" ? "run2" : "run1";
    }
    if (G.jumping) G.dinoFrame = "jump";

    // spawn obstacles
    if (G.tick % G.spawnRate === 0) {
      const big = Math.random() < 0.25;
      G.obstacles.push({ x: W - 1, big });
    }

    // move obstacles
    for (const obs of G.obstacles) obs.x -= G.speed;
    G.obstacles = G.obstacles.filter(o => o.x > -6);

    // score
    if (G.tick % 4 === 0) G.score += 1;

    // speed up
    if (G.tick % 200 === 0 && G.speed < 1.4) {
      G.speed += 0.08;
      if (G.spawnRate > 18) G.spawnRate -= 1;
    }

    // collision
    if (collision(G.dinoY, G.obstacles)) {
      G.running = false;
      gameOver(ctx, outEl);
      return;
    }

    // render
    const speedStr = (G.speed * 5).toFixed(1);
    const lines = renderFrame(G.dinoFrame, G.dinoY, G.obstacles, G.score, G.speed);
    let html = `<div class="line"><span class="head">DINO RUN</span> <span class="dim">│ score:</span> <span class="orange">${String(G.score).padStart(5,"0")}</span> <span class="dim">│ speed:</span> <span class="info">${speedStr}</span> <span class="dim">│</span> <span class="dim">↑/space jump</span> · <span class="dim">q quit</span></div>\n`;
    for (const l of lines) {
      html += `<div class="line" style="line-height:1.15;">${l}</div>\n`;
    }
    html += `<div class="line"><span class="dim">${buildGroundRow()}</span></div>`;
    outEl.innerHTML = html;
    ctx.scrollToBottom();

    G.rAF = requestAnimationFrame(() => gameLoop(ctx, outEl));
  }

  function gameOver(ctx, outEl) {
    cancelAnimationFrame(G.rAF);
    document.removeEventListener("keydown", G._onKey);

    const sc = G.score;
    let rating, cls;
    if      (sc >= 1500) { rating = "T-REX // apex predator"; cls = "ok"; }
    else if (sc >= 800)  { rating = "VELOCIRAPTOR // clever girl"; cls = "info"; }
    else if (sc >= 400)  { rating = "UTAHRAPTOR // getting warm"; cls = "warn"; }
    else if (sc >= 150)  { rating = "DILOPHOSAURUS // spits but can't aim"; cls = "dim"; }
    else                 { rating = "COMPY // you're tiny and you're dead"; cls = "dim"; }

    let overHtml = "";
    overHtml += `<div class="line">&nbsp;</div>\n`;
    overHtml += `<div class="line"><span class="head">── GAME OVER ──</span></div>\n`;
    overHtml += `<div class="line"><span class="fail">the cactus claims another.</span></div>\n`;
    overHtml += `<div class="line">&nbsp;</div>\n`;
    overHtml += `<div class="line"><span class="info">final score:</span> <span class="orange">${sc.toString().padStart(5,"0")}</span></div>\n`;
    overHtml += `<div class="line"><span class="${cls}">rating: ${rating}</span></div>\n`;
    overHtml += `<div class="line">&nbsp;</div>\n`;
    overHtml += `<div class="line"><span class="dim">type</span> <span class="orange">dino</span> <span class="dim">to play again</span></div>\n`;
    outEl.innerHTML += overHtml;
    ctx.scrollToBottom();

    // re-enable terminal input
    const input = document.getElementById("cmd-input");
    if (input) input.removeAttribute("disabled");
    G.active = false;
  }

  function start(ctx, outEl) {
    if (G.active) {
      cancelAnimationFrame(G.rAF);
      document.removeEventListener("keydown", G._onKey);
    }

    const input = document.getElementById("cmd-input");
    if (input) input.setAttribute("disabled", "1");

    outEl.innerHTML = `<div class="line"><span class="head">── DINO RUN ──</span> <span class="dim">loading terrain…</span></div>`;

    G.active = true;
    G.running = true;
    G.paused = false;
    G.tick = 0;
    G.score = 0;
    G.speed = 0.5;
    G.spawnRate = 35;
    G.dinoY = GROUND - DINO_H;
    G.dinoFrame = "run1";
    G.jumping = false;
    G.jumpVel = 0;
    G.gravity = 0.55;
    G.obstacles = [];

    function onKey(e) {
      if (!G.active) return;
      if (e.key === "ArrowUp" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        if (!G.jumping) {
          G.jumping = true;
          G.jumpVel = -2.4;
        }
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        // fast-drop — not in original dino but adds a little skill
        if (G.jumping && G.jumpVel < 0) G.jumpVel = 0.2;
      }
      if (e.key === "q" || e.key === "Q") {
        e.preventDefault();
        G.running = false;
        cancelAnimationFrame(G.rAF);
        document.removeEventListener("keydown", G._onKey);
        G.active = false;
        const input = document.getElementById("cmd-input");
        if (input) input.removeAttribute("disabled");
        outEl.innerHTML += `<div class="line">&nbsp;</div><div class="line"><span class="dim">game quit.</span> <span class="dim">score:</span> <span class="orange">${String(G.score).padStart(5,"0")}</span></div>`;
        outEl.innerHTML += `<div class="line"><span class="dim">type</span> <span class="orange">dino</span> <span class="dim">to play again</span></div>`;
        ctx.scrollToBottom();
      }
    }
    document.addEventListener("keydown", onKey);
    G._onKey = onKey;

    G.rAF = requestAnimationFrame(() => gameLoop(ctx, outEl));
  }

  window.startDino = function (ctx, outEl) {
    start(ctx, outEl);
  };
})();
