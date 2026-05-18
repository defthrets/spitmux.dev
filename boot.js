// Splash sequence: nmap → clear → hydra brute force → clear → welcome → (terminal.js auto-runs help)
window.bootSequence = async function bootSequence(out, ctx) {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  async function typeLine(html, delay = 8, pause = 30) {
    const div = document.createElement("div");
    div.className = "line";
    out.appendChild(div);
    const stripped = html.replace(/<[^>]+>/g, "");
    for (let i = 0; i < stripped.length; i++) {
      div.textContent = stripped.slice(0, i + 1);
      ctx.scrollToBottom();
      await sleep(delay);
    }
    div.innerHTML = html;
    await sleep(pause);
    return div;
  }

  async function fastLine(html, pause = 18) {
    const div = document.createElement("div");
    div.className = "line";
    div.innerHTML = html;
    out.appendChild(div);
    ctx.scrollToBottom();
    await sleep(pause);
    return div;
  }

  // emit a block of pre-formatted ASCII art in one shot, no per-line delay
  async function art(text, klass = "art-kali", pause = 120) {
    const pre = document.createElement("pre");
    pre.className = "line " + klass;
    pre.textContent = text;
    out.appendChild(pre);
    ctx.scrollToBottom();
    await sleep(pause);
    return pre;
  }

  function blank(n = 1) {
    for (let i = 0; i < n; i++) {
      const d = document.createElement("div");
      d.className = "line";
      d.innerHTML = "&nbsp;";
      out.appendChild(d);
    }
  }

  function clearFlash() {
    window.crtFlashFrame && window.crtFlashFrame();
  }

  // ─── ASCII assets ────────────────────────────────────────────────────────
  const KALI_DRAGON = String.raw`
              ..............
           ..,;:ccc,.
         ......''';lxO.
.....''''..........,:ld;
           .';;;:::;,,.x,
      ..'''.            0Xxoc:,.  ...
  ....                ,ONkc;,;cokOdc',.
 .                   OMo           ':ddo.
                    dMc               :OO;
                    0M.                 .:o.
                    ;Wd                   ;c
                     ;XO,
                       ,d0Odlc;,..
                           ..',;:cdOOd::,.
                                    .:d;.':;.
                                       'd,  .'
                                         ;l   ..
                                          .o
                                            c
                                            .'
                                             .
`;

  const NMAP_LOGO = String.raw`
       _   _ __  __    _    ____  
      | \ | |  \/  |  / \  |  _ \ 
      |  \| | |\/| | / _ \ | |_) |
      | |\  | |  | |/ ___ \|  __/ 
      |_| \_|_|  |_/_/   \_\_|    
         network exploration tool
`;

  const HYDRA = String.raw`
        ___           ___
       / __|_  _ __ _/ __|
      | (__| || / _\` \__ \
       \___|\_, \__,_|___/
            |__/
       brute force \u2014 ssh

         ,---._    _.---,
          \   / \\ /   /
            v //\\ v
            ( /==\ )
             \\_/_/
              ===
`;

  const SKULL = String.raw`
           ▄▄▄▄▄
        ▄█▀░░░░░▀█▄
       █▀░░░░░░░░░▀█
      █░░░░░░░░░░░░░█
      █░░░██░░░██░░░█
      █░░██▒▒██▒▒██░█
      ▀█░░░██░░██░░█▀
        ▀█░░░░░░░░█▀
          ▀▀▀▀▀▀▀
    [ ACCESS GRANTED ]
`;

  // ═══════════════════════════════════════════════════════════════
  // PHASE 1 — KALI banner
  // ═══════════════════════════════════════════════════════════════
  await fastLine('<span class="dim">      \u2554\u2550\u2550\u2550 Kali GNU/Linux Rolling 2026.1 \u2014 spitmux/defthrets \u2550\u2550\u2550\u2557</span>', 220);
  blank();

  // ═══════════════════════════════════════════════════════════════
  // PHASE 2 — nmap
  // ═══════════════════════════════════════════════════════════════
  const now = new Date();
  const stamp = now.toISOString().slice(0, 16).replace("T", " ") + " UTC";

  await art(NMAP_LOGO, "art-nmap", 160);
  await typeLine('<span class="dim">$ nmap -sV -O -p- --reason --osscan-guess spitmux.defthrets</span>', 6, 80);
  await fastLine(`<span class="dim">Starting Nmap 7.94 at ${stamp}</span>`, 50);
  await fastLine('<span class="dim">NSE: Loaded 156 scripts \u00b7 Initiating Connect Scan</span>', 35);
  blank();
  await fastLine('<span class="info">Nmap scan report for</span> <span class="orange">spitmux.defthrets</span> <span class="dim">(127.0.0.1)</span>', 50);
  await fastLine('<span class="dim">Host is up (0.001s latency) \u00b7 Not shown: 65523 closed ports</span>', 50);
  blank();
  await fastLine('<span class="dim">PORT       STATE     SERVICE       VERSION</span>', 40);

  const ports = [
    ["22/tcp",    "open",     "ssh",       "OpenSSH 9.6"],
    ["80/tcp",    "open",     "http",      "nginx 1.27"],
    ["443/tcp",   "open",     "https",     "nginx 1.27 (TLS 1.3)"],
    ["1337/tcp",  "open",     "poison",    "nightshade v0.3.4"],
    ["6667/tcp",  "open",     "irc",       "hexchat 2.16"],
    ["8888/tcp",  "open",     "matrix",    "phosphor relay"],
    ["13337/tcp", "filtered", "exploit",   "firewall: deny"],
    ["31337/tcp", "open",     "elite",     "spitmux/1.0"],
    ["65535/tcp", "open",     "unknown",   "-"],
  ];
  for (const [port, state, svc, ver] of ports) {
    const stateColor =
      state === "open"     ? '<span class="ok">open</span>' :
      state === "filtered" ? '<span class="warn">filtered</span>' :
                             '<span class="fail">closed</span>';
    const padState = stateColor + " ".repeat(8 - state.length);
    const portStr = port.padEnd(10);
    const svcStr = svc.padEnd(13);
    await fastLine(
      `<span class="orange">${portStr}</span> ${padState} <span class="info">${svcStr}</span> <span class="dim">${ver}</span>`,
      24 + Math.random() * 18
    );
  }

  blank();
  await fastLine('<span class="dim">Service Info: Host: defthrets \u00b7 OS: linux 5.0 \u00b7 0 hops</span>', 50);
  await fastLine('<span class="ok">Nmap done</span><span class="dim">: 1 host up, 9 ports relevant \u00b7 8.20s elapsed</span>', 180);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 3 — clear
  // ═══════════════════════════════════════════════════════════════
  await typeLine('<span class="dim">$ clear</span>', 6, 280);
  out.innerHTML = "";
  await sleep(120);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 4 — hydra brute-force
  // ═══════════════════════════════════════════════════════════════
  await art(HYDRA, "art-hydra", 140);
  await typeLine('<span class="dim">$ hydra -l spitmux -P rockyou.txt -t 4 ssh://defthrets</span>', 6, 80);
  await fastLine('<span class="dim">Hydra v9.5 \u00b7 use only on systems you own</span>', 40);
  await fastLine(`<span class="dim">Hydra starting at ${stamp}</span>`, 40);
  await fastLine('<span class="dim">[DATA] 4 tasks \u00b7 14,344,400 login tries \u00b7</span> <span class="info">attacking ssh://defthrets:22/</span>', 60);
  blank();

  const attempts = [
    ["123456",             1],
    ["password",           2],
    ["qwerty",             3],
    ["letmein",           14],
    ["dragon",            27],
    ["hunter2",           58],
    ["monkey",           104],
    ["correcthorsebatterystaple", 622],
    ["spitmux",         1041],
    ["nightshade",      3372],
    ["defthrets",       5018],
    ["p01s0n",          8423],
  ];
  for (const [pw, n] of attempts) {
    await fastLine(
      `<span class="dim">[ATTEMPT] target defthrets \u00b7 login</span> <span class="info">spitmux</span> <span class="dim">\u00b7 pass</span> <span class="fail">"${pw}"</span> <span class="dim">\u00b7 ${n.toLocaleString()} of 14,344,400</span>`,
      28 + Math.random() * 22
    );
  }

  await sleep(80);
  await fastLine('<span class="dim">[ATTEMPT] target defthrets \u00b7 login</span> <span class="info">spitmux</span> <span class="dim">\u00b7 pass</span> <span class="ok">"p01s0n_makes_you_stronger"</span> <span class="dim">\u00b7 8,424 of 14,344,400</span>', 150);
  blank();
  await fastLine('<span class="ok">[22][ssh]</span> <span class="dim">host:</span> <span class="info">defthrets</span>   <span class="dim">login:</span> <span class="info">spitmux</span>   <span class="dim">password:</span> <span class="ok">p01s0n_makes_you_stronger</span>', 180);
  await fastLine('<span class="ok">[STATUS]</span> <span class="dim">attack finished \u00b7 1 valid password found</span>', 220);
  blank();

  await typeLine('<span class="dim">$ ssh spitmux@defthrets</span>', 6, 80);
  await fastLine('<span class="ok">access granted</span> <span class="dim">\u00b7 last login: never</span>', 160);
  await fastLine('<span class="dim">Linux defthrets 5.0 #1 SMP x86_64 GNU/Linux</span>', 80);
  await fastLine('<span class="dim">spitmux v0.3.4 (defthrets)</span>', 320);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 5 — clear
  // ═══════════════════════════════════════════════════════════════
  await typeLine('<span class="dim">$ clear</span>', 6, 280);
  out.innerHTML = "";
  await sleep(120);

  // ═══════════════════════════════════════════════════════════════
  // PHASE 6 — welcome
  // ═══════════════════════════════════════════════════════════════
  const WELCOME_ART = String.raw`
  █   █ ▄▀▀▀ █    ▄▀▀▄ ▄▀▀▄ █▄ ▄█ ▄▀▀▀
  █ ▄ █ █▀▀  █    █  █ █  █ █▀█▀█ █▀▀ 
   ▀█▀  ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀▀▀▀ ▀ ▀ ▀ ▀▀▀▀`;
  await art(WELCOME_ART, "art-hydra", 240);
  await typeLine('<span class="dim">  to spitmux\'s portfolio.</span>', 8, 220);
  blank();
  await typeLine('<span class="info">hey — glad you stopped by.</span>', 8, 140);
  blank();
  await typeLine('<span class="dim">this is my corner of the internet.</span>', 6, 40);
  await typeLine('<span class="dim">half terminal, half personal archive, all hand-built.</span>', 6, 200);
  blank();
  await fastLine('<span class="dim">' + "─".repeat(60) + "</span>", 60);
  await fastLine('<span class="orange">  left  ▸</span> <span class="dim">/prj.git</span>        <span class="dim">— every public repo i ship. click to read the readme.</span>', 80);
  await fastLine('<span class="orange">  right ▸</span> <span class="dim">/blog</span>           <span class="dim">— short posts, raw thoughts. click any to read inline.</span>', 80);
  await fastLine('<span class="orange">  below ▸</span> <span class="dim">/home/spitmux</span>   <span class="dim">— type</span> <span class="orange">help</span><span class="dim">,</span> <span class="orange">ls</span><span class="dim">,</span> <span class="orange">whoami</span><span class="dim">, or just poke.</span>', 80);
  await fastLine('<span class="dim">' + "─".repeat(60) + "</span>", 140);
  blank();
  await typeLine('<span class="dim">if you find a bug, it\'s probably a feature.</span>', 6, 60);
  await typeLine('<span class="dim">if you find a feature, it\'s probably a bug.</span>', 6, 180);
  blank();
  await typeLine('<span class="info">stay weird.</span>', 8, 120);
  await typeLine('<span class="dim">— spitmux</span>', 8, 260);
  blank();
};
