// Terminal — prompt, history, command dispatch
(function () {
  const out = document.getElementById("out");
  const input = document.getElementById("cmd-input");
  const fakeCursor = document.getElementById("fake-cursor");
  const frame = document.getElementById("frame");

  const D = window.SPITMUX;
  const history = [];
  let hIdx = -1;
  let booted = false;

  const ctx = {
    scrollToBottom() { frame.scrollTop = frame.scrollHeight; },
    write(html) { return writeLine(html); },
    blank(n = 1) { for (let i = 0; i < n; i++) writeLine("&nbsp;"); },
  };

  function writeLine(html) {
    const d = document.createElement("div");
    d.className = "line";
    d.innerHTML = html;
    out.appendChild(d);
    ctx.scrollToBottom();
    return d;
  }

  function writeBlock(html) {
    const d = document.createElement("div");
    d.className = "block";
    d.innerHTML = html;
    out.appendChild(d);
    ctx.scrollToBottom();
    return d;
  }

  // ─── click-to-render handlers ─────────────────────────────────
  window.showRepoInTerminal = function (r) {
    echoCommand(`cat repos/${r.name}`);
    writeLine(`<span class="head">── ${escapeHtml(r.name)} ──</span>`);
    writeLine(`<span class="dim">${escapeHtml(r.lang || "?")} · ★ ${r.stars ?? 0}</span>`);
    ctx.blank();
    writeLine(`<span class="info">${escapeHtml(r.desc || "no description")}</span>`);
    if (r.url) {
      ctx.blank();
      writeLine(`<span class="dim">url:</span> <a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${escapeHtml(r.url)}</a>`);
    }
    writeLine('<span class="dim">── EOF ──</span>');
    ctx.blank();
    frame.scrollTop = frame.scrollHeight;
  };

  window.showBlogInTerminal = function (p) {
    echoCommand(`cat blog/${p.slug || p.title}`);
    writeLine(`<span class="head">── ${escapeHtml(p.title || "")} ──</span>`);
    const meta = [p.date, ...(p.tags || []).map((t) => "#" + t)].filter(Boolean).join(" · ");
    if (meta) writeLine(`<span class="dim">${escapeHtml(meta)}</span>`);
    ctx.blank();
    // p.body (mock) is an array of lines; p.preview is the X tweet text
    if (Array.isArray(p.body) && p.body.length) {
      for (const line of p.body) {
        const row = document.createElement("div");
        row.className = "line";
        row.textContent = line || " ";
        out.appendChild(row);
      }
    } else if (p.preview) {
      // wrap long tweet text for the terminal width
      const row = document.createElement("div");
      row.className = "line";
      row.textContent = p.preview;
      out.appendChild(row);
    }
    if (p.url) {
      ctx.blank();
      writeLine(`<span class="dim">view on x:</span> <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener">${escapeHtml(p.url)}</a>`);
    }
    writeLine('<span class="dim">── EOF ──</span>');
    ctx.blank();
    frame.scrollTop = frame.scrollHeight;
  };

  function promptHtml() {
    return '<span class="user">spitmux</span><span class="at">@</span><span class="host">defthrets</span><span class="at">:</span><span class="path">~</span><span class="dollar"> $</span>';
  }

  function echoCommand(raw) {
    const d = document.createElement("div");
    d.className = "line prompt-line";
    d.innerHTML = `<span class="prompt">${promptHtml()}</span> <span>${escapeHtml(raw)}</span>`;
    out.appendChild(d);
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }

  // ---------------- COMMANDS ----------------
  const COMMANDS = {};

  COMMANDS.help = {
    desc: "list commands",
    run() {
      const cmds = [
        // ── essentials
        ["help",           "this list"],
        ["whoami",         "who runs this terminal"],
        ["ls",             "list everything here"],
        // ── content
        ["blog",           "list posts (or blog &lt;slug&gt; to read)"],
        ["repos",          "github repos"],
        ["projects",       "things i'm building"],
        ["links",          "where else i exist"],
        ["contact",        "how to reach me"],
        // ── nav
        ["cat <file>",     "dump a section"],
        ["open <n>",       "open Nth result of last list"],
        ["search <q>",     "grep blog + repos"],
        ["history",        "recent commands"],
        // ── system
        ["date",           "tick"],
        ["uname",          "system info"],
        ["uptime",         "how long this rig has been awake"],
        ["motd",           "message of the day"],
        ["id",             "user info"],
        ["ps",             "running processes"],
        ["df",             "disk free"],
        ["free",           "memory usage"],
        ["man <cmd>",      "manual page"],
        ["which <cmd>",    "locate a command"],
        ["cal",            "calendar"],
        ["clear",          "wipe terminal"],
        // ── the questionable stuff
        ["sudo <cmd>",     "don't"],
        ["exit",           "you can't"],
      ];
      writeLine('<span class="head">available commands</span> <span class="dim">· click any row</span>');
      writeLine('<span class="dim">' + "─".repeat(54) + "</span>");
      const block = document.createElement("div");
      block.className = "block";
      for (const [c, d] of cmds) {
        const row = document.createElement("div");
        row.className = "line help-row";
        row.innerHTML = `<span class="orange">${c.padEnd(16)}</span> <span class="dim">${d}</span>`;
        const baseCmd = c.split(" ")[0].replace(/[<>]/g, "");
        row.addEventListener("click", () => runCommand(baseCmd));
        block.appendChild(row);
      }
      out.appendChild(block);
    },
  };

  COMMANDS["?"] = COMMANDS.help;

  COMMANDS.whoami = {
    desc: "about",
    run() {
      const i = D.identity;
      const rows = [
        ["handle",   `<span class="orange">${i.handle}</span>`],
        ["host",     `${i.host}`],
        ["status",   `<span class="info">${i.status}</span>`],
        ["location", `<span class="dim">${i.location}</span>`],
        ["pgp",      `<span class="dim">${i.pgp}</span>`],
        ["tagline",  `<span class="orange">"${i.tagline}"</span>`],
      ];
      const block = document.createElement("div");
      block.className = "block kv";
      for (const [k, v] of rows) {
        const dk = document.createElement("div"); dk.className = "k"; dk.textContent = k;
        const dv = document.createElement("div"); dv.className = "v"; dv.innerHTML = v;
        block.appendChild(dk); block.appendChild(dv);
      }
      out.appendChild(block);
      ctx.blank();
    },
  };

  COMMANDS.ls = {
    desc: "list",
    run() {
      const items = [
        ["blog/",     `${D.blog.length} posts`,    "drwx", "blog"],
        ["repos/",    `${D.repos.length} repos`,   "drwx", "repos"],
        ["projects/", `${D.projects.length} dirs`, "drwx", "projects"],
        ["links/",    `${D.links.length} doors`,   "drwx", "links"],
        ["about.txt", "whoami", "-rw-", "whoami"],
        [".secret",   "(╯°□°)╯", "-r--", "cat .secret"],
      ];
      const block = document.createElement("div");
      block.className = "block";
      for (const [name, meta, mode, cmd] of items) {
        const row = document.createElement("div");
        row.className = "line ls-row";
        row.innerHTML = `<span class="dim">${mode}</span>  <span class="orange">${name.padEnd(14)}</span> <span class="dim">${meta}</span>`;
        row.addEventListener("click", () => runCommand(cmd));
        block.appendChild(row);
      }
      out.appendChild(block);
      ctx.blank();
    },
  };

  COMMANDS.dir = COMMANDS.ls;

  // last list state for `open N`
  let lastList = null;

  function showBlogList() {
    writeLine('<span class="head">~/blog</span> <span class="dim">— recent transmissions</span>');
    writeLine('<span class="dim">' + "─".repeat(54) + "</span>");
    const block = document.createElement("div");
    block.className = "block";
    D.blog.forEach((p, i) => {
      const row = document.createElement("div");
      row.className = "list-item";
      row.innerHTML = `
        <span class="bullet">${String(i + 1).padStart(2, "0")}</span>
        <span>
          <span class="title glitch" data-text="${escapeHtml(p.title)}">${escapeHtml(p.title)}</span>
          <span class="meta"> · ${p.date} · ${p.tags.map((t) => "#" + t).join(" ")}</span>
          <div class="meta">${escapeHtml(p.preview)}</div>
        </span>`;
      row.addEventListener("click", () => runCommand(`blog ${p.slug}`));
      block.appendChild(row);
    });
    out.appendChild(block);
    lastList = { kind: "blog", items: D.blog };
    writeLine('<span class="dim">→ <span class="orange">blog &lt;slug&gt;</span> to read, or <span class="orange">open N</span></span>');
    ctx.blank();
  }

  function showPost(slug) {
    const p = D.blog.find((b) => b.slug === slug);
    if (!p) {
      writeLine(`<span class="fail">cat: ${escapeHtml(slug)}: no such transmission</span>`);
      ctx.blank();
      return;
    }
    writeLine(`<span class="head">── ${p.title} ──</span>`);
    writeLine(`<span class="dim">${p.date} · ${p.tags.map((t) => "#" + t).join(" ")}</span>`);
    ctx.blank();
    const block = document.createElement("div");
    block.className = "block";
    for (const line of p.body) {
      const row = document.createElement("div");
      row.className = "line";
      row.textContent = line || " ";
      block.appendChild(row);
    }
    out.appendChild(block);
    writeLine('<span class="dim">── EOF ──</span>');
    ctx.blank();
  }

  COMMANDS.blog = {
    desc: "list / open posts",
    run(args) {
      if (!args[0]) return showBlogList();
      showPost(args[0]);
    },
  };

  COMMANDS.repos = {
    desc: "github repos",
    run() {
      writeLine('<span class="head">~/repos</span> <span class="dim">— github.com/defthrets</span>');
      writeLine('<span class="dim">' + "─".repeat(54) + "</span>");
      const block = document.createElement("div");
      block.className = "block";
      D.repos.forEach((r, i) => {
        const row = document.createElement("div");
        row.className = "list-item";
        row.innerHTML = `
          <span class="bullet">${String(i + 1).padStart(2, "0")}</span>
          <span>
            <span class="title glitch" data-text="${r.name}">${r.name}</span>
            <span class="meta"> · ${r.lang} · ★ ${r.stars}</span>
            <div class="meta">${escapeHtml(r.desc)}</div>
          </span>`;
        row.addEventListener("click", () => window.open(`https://github.com/defthrets/${r.name}`, "_blank"));
        block.appendChild(row);
      });
      out.appendChild(block);
      lastList = { kind: "repos", items: D.repos.map((r) => ({ url: `https://github.com/defthrets/${r.name}` })) };
      writeLine('<span class="dim">→ click a repo, or <span class="orange">open N</span></span>');
      ctx.blank();
    },
  };

  COMMANDS.projects = {
    desc: "current projects",
    run() {
      writeLine('<span class="head">~/projects</span> <span class="dim">— field of work</span>');
      writeLine('<span class="dim">' + "─".repeat(54) + "</span>");
      const block = document.createElement("div");
      block.className = "block";
      D.projects.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "list-item";
        row.innerHTML = `
          <span class="bullet">${String(i + 1).padStart(2, "0")}</span>
          <span>
            <span class="title glitch" data-text="${p.name}">${p.name}</span>
            <span class="meta"> · <span class="orange">${p.tag}</span></span>
            <div class="meta">${escapeHtml(p.desc)}</div>
          </span>`;
        row.addEventListener("click", () => window.open(p.url, "_blank"));
        block.appendChild(row);
      });
      out.appendChild(block);
      lastList = { kind: "projects", items: D.projects };
      ctx.blank();
    },
  };

  COMMANDS.links = {
    desc: "contact / where else",
    run() {
      writeLine('<span class="head">~/links</span> <span class="dim">— elsewhere</span>');
      writeLine('<span class="dim">' + "─".repeat(54) + "</span>");
      const block = document.createElement("div");
      block.className = "block";
      D.links.forEach((l, i) => {
        const row = document.createElement("div");
        row.className = "line";
        row.innerHTML = `<span class="bullet">${String(i + 1).padStart(2, "0")}</span>  <span class="dim">${l.label.padEnd(10)}</span> <a href="${l.url}" target="_blank" rel="noopener">${escapeHtml(l.handle)}</a>`;
        block.appendChild(row);
      });
      out.appendChild(block);
      lastList = { kind: "links", items: D.links };
      ctx.blank();
    },
  };

  COMMANDS.cat = {
    desc: "dump file",
    run(args) {
      const f = (args[0] || "").replace(/\/$/, "").toLowerCase();
      switch (f) {
        case "":         writeLine('<span class="fail">cat: missing operand</span>'); ctx.blank(); return;
        case "blog":     return showBlogList();
        case "repos":    return COMMANDS.repos.run();
        case "projects": return COMMANDS.projects.run();
        case "links":    return COMMANDS.links.run();
        case "about":
        case "about.txt":
        case "whoami":   return COMMANDS.whoami.run();
        case ".secret":
          writeLine('<span class="fail">cat: .secret: permission denied</span>');
          writeLine('<span class="dim">(try the old code)</span>');
          ctx.blank();
          return;
        default:
          // maybe a blog slug
          if (D.blog.find((b) => b.slug === f)) return showPost(f);
          writeLine(`<span class="fail">cat: ${escapeHtml(f)}: no such file</span>`);
          ctx.blank();
      }
    },
  };

  COMMANDS.open = {
    desc: "open Nth from last list",
    run(args) {
      const n = parseInt(args[0], 10);
      if (!lastList || !n) { writeLine('<span class="fail">open: no list, or bad index</span>'); ctx.blank(); return; }
      const item = lastList.items[n - 1];
      if (!item) { writeLine('<span class="fail">open: out of range</span>'); ctx.blank(); return; }
      if (lastList.kind === "blog") return showPost(item.slug);
      const url = item.url;
      if (url) {
        writeLine(`<span class="info">opening</span> <a href="${url}" target="_blank">${url}</a>`);
        window.open(url, "_blank");
      }
      ctx.blank();
    },
  };

  COMMANDS.date = {
    desc: "time",
    run() {
      writeLine(`<span class="info">${new Date().toString()}</span>`);
      ctx.blank();
    },
  };

  COMMANDS.uname = {
    desc: "system info",
    run() {
      writeLine('<span class="dim">spitmux v0.3.4 (defthrets) #1 SMP nightshade x86_64 GNU/poison</span>');
      ctx.blank();
    },
  };

  COMMANDS.clear = { desc: "clear", run() { out.innerHTML = ""; } };
  COMMANDS.cls   = COMMANDS.clear;

  COMMANDS.sudo = {
    desc: "ha",
    run(args) {
      const cmd = args.join(" ") || "(nothing)";
      writeLine(`<span class="fail">spitmux is not in the sudoers file. this incident will be reported.</span>`);
      writeLine(`<span class="dim">    attempted: ${escapeHtml(cmd)}</span>`);
      ctx.blank();
    },
  };

  COMMANDS.exit = {
    desc: "no",
    run() {
      writeLine('<span class="warn">exit: you can check in any time you like, but you can never leave.</span>');
      ctx.blank();
    },
  };
  COMMANDS.logout = COMMANDS.exit;
  COMMANDS.quit   = COMMANDS.exit;

  // ─────────────── navigation / system ───────────────────────────────────────
  COMMANDS.cd = {
    desc: "change directory",
    run(args) {
      const target = (args[0] || "~").toLowerCase();
      if (["~", "", "/home/spitmux", "/", "home"].includes(target)) {
        writeLine('<span class="dim">already at /home/spitmux. nowhere else to go.</span>');
      } else if (["blog", "repos", "projects", "links"].includes(target.replace(/^\//, ""))) {
        runCommand(target.replace(/^\//, ""));
        return;
      } else if (target === ".." || target === "...") {
        writeLine('<span class="dim">cd ..: still here. the cage is the universe.</span>');
      } else {
        writeLine(`<span class="fail">cd: ${escapeHtml(target)}: no such directory</span>`);
      }
      ctx.blank();
    },
  };

  COMMANDS.uptime = {
    desc: "uptime",
    run() {
      const days = 6 + Math.floor(Math.random() * 30);
      const load = (0.6 + Math.random() * 0.4).toFixed(2);
      writeLine(`<span class="dim">up ${days} days, 4:20, 1 user, load average: ${load}, 0.69, 1.13</span>`);
      ctx.blank();
    },
  };

  // ─────────────── standard unix things ───────────────────────────────────────────────
  COMMANDS.id = {
    desc: "user id",
    run() {
      writeLine('<span class="info">uid=1337(spitmux) gid=1337(wheel) groups=1337(wheel),27(sudo),69(skid)</span>');
      ctx.blank();
    },
  };

  COMMANDS.ps = {
    desc: "processes",
    run() {
      const procs = [
        ["  PID", "TTY",   "     TIME", "CMD"],
        [" 1337", "tty1",  " 00:04:20", "-bash"],
        [" 1492", "tty1",  " 03:14:15", "nightshade --daemon"],
        [" 2718", "?",     " 00:00:01", "matrix-rain"],
        [" 3141", "?",     " 00:00:08", "radar-static"],
        [" 6502", "?",     " 12:34:56", "social-credit-watcher"],
        [" 8086", "?",     " 00:00:42", "vim README.md"],
        ["31337", "tty1",  " 00:00:00", "ps"],
      ];
      const block = document.createElement("div");
      block.className = "block";
      procs.forEach((p, i) => {
        const row = document.createElement("div");
        row.className = "line";
        const cls = i === 0 ? "dim" : (p[3].startsWith("-bash") ? "orange" : "info");
        row.innerHTML = `<span class="${cls}">${p.join("  ")}</span>`;
        block.appendChild(row);
      });
      out.appendChild(block);
      ctx.blank();
    },
  };
  COMMANDS.top = COMMANDS.ps;
  COMMANDS.htop = COMMANDS.ps;

  COMMANDS.df = {
    desc: "disk free",
    run() {
      const rows = [
        ["Filesystem",       "Size",  "Used",  "Avail", "Use%",  "Mounted on"],
        ["/dev/poison0",     " 64G",  " 23G",  " 41G",  "36%",   "/"],
        ["/dev/poison1",     "512G",  "498G",  " 14G",  "97%",   "/home/spitmux"],
        ["tmpfs",            " 16G",  "  0",   " 16G",  " 0%",   "/dev/shm"],
        ["/dev/cdrom",       "700M",  "700M",  "  0",   "100%",  "/mnt/dwarf-fortress"],
      ];
      const block = document.createElement("div");
      block.className = "block";
      rows.forEach((r, i) => {
        const row = document.createElement("div");
        row.className = "line";
        const cls = i === 0 ? "dim" : (r[4] === "97%" || r[4] === "100%" ? "warn" : "info");
        row.innerHTML = `<span class="${cls}">${r.map((c, j) => c.padEnd(j === 0 ? 16 : 7)).join(" ")}</span>`;
        block.appendChild(row);
      });
      out.appendChild(block);
      ctx.blank();
    },
  };

  COMMANDS.free = {
    desc: "memory",
    run() {
      writeLine('<span class="dim">              total        used        free      shared  buff/cache   available</span>');
      writeLine('<span class="info">Mem:        16384000     8127334     2456788      442104     5799878     7669482</span>');
      writeLine('<span class="warn">Swap:        4194304      442104     3752200</span>');
      ctx.blank();
    },
  };

  COMMANDS.man = {
    desc: "manual",
    run(args) {
      const name = (args[0] || "").toLowerCase();
      const pages = {
        spitmux: [
          "SPITMUX(1)                  user commands                  SPITMUX(1)",
          "",
          "NAME",
          "      spitmux — a person with a terminal",
          "",
          "SYNOPSIS",
          "      spitmux [options] [target]",
          "",
          "DESCRIPTION",
          "      mostly harmless. handles encrypted email, soldering irons,",
          "      reverse engineering of small electronics, and stubborn",
          "      bugs in pre-1995 firmware. occasionally writes things.",
          "",
          "OPTIONS",
          "      -v   verbose. probably too verbose.",
          "      -q   shut up.",
          "",
          "SEE ALSO",
          "      whoami(1), contact(1), cookie(6)",
        ],
        help: ["HELP(1)", "", "see: help."],
        love: ["LOVE(1)", "", "no manual entry for love. (try cookie.)"],
      };
      const lines = pages[name] || [
        `No manual entry for ${name || "<nothing>"}.`,
        "",
        `try "man spitmux" or just "help".`,
      ];
      const block = document.createElement("div");
      block.className = "block";
      lines.forEach((l) => {
        const r = document.createElement("div");
        r.className = "line";
        r.innerHTML = `<span class="dim">${escapeHtml(l)}</span>`;
        block.appendChild(r);
      });
      out.appendChild(block);
      ctx.blank();
    },
  };

  COMMANDS.which = {
    desc: "locate command",
    run(args) {
      const name = (args[0] || "").toLowerCase();
      if (!name) { writeLine('<span class="fail">usage: which &lt;command&gt;</span>'); ctx.blank(); return; }
      if (COMMANDS[name]) {
        writeLine(`<span class="info">/usr/local/bin/${escapeHtml(name)}</span>`);
      } else {
        writeLine(`<span class="dim">${escapeHtml(name)} not found</span>`);
      }
      ctx.blank();
    },
  };
  COMMANDS.whereis = COMMANDS.which;

  COMMANDS.cal = {
    desc: "calendar",
    run() {
      const now = new Date();
      const months = ["january","february","march","april","may","june","july","august","september","october","november","december"];
      const m = months[now.getMonth()];
      const y = now.getFullYear();
      const firstDay = new Date(y, now.getMonth(), 1).getDay();
      const daysInMonth = new Date(y, now.getMonth() + 1, 0).getDate();
      const today = now.getDate();
      const header = `${m} ${y}`.padStart(15 + Math.floor((22 - (m.length + 5)) / 2));
      writeLine(`<span class="orange">${escapeHtml(header)}</span>`);
      writeLine('<span class="dim">Su Mo Tu We Th Fr Sa</span>');
      let row = "   ".repeat(firstDay);
      const block = document.createElement("div");
      block.className = "block";
      for (let d = 1; d <= daysInMonth; d++) {
        const cell = d === today ? `<span class="orange">${String(d).padStart(2)}</span>` : String(d).padStart(2);
        row += cell + " ";
        if ((firstDay + d) % 7 === 0) {
          const r = document.createElement("div");
          r.className = "line";
          r.innerHTML = `<span class="dim">${row.trimEnd()}</span>`;
          block.appendChild(r);
          row = "";
        }
      }
      if (row.trim()) {
        const r = document.createElement("div");
        r.className = "line";
        r.innerHTML = `<span class="dim">${row.trimEnd()}</span>`;
        block.appendChild(r);
      }
      out.appendChild(block);
      ctx.blank();
    },
  };

  COMMANDS.history = {
    desc: "command history",
    run() {
      if (!history.length) { writeLine('<span class="dim">no history yet.</span>'); ctx.blank(); return; }
      const block = document.createElement("div");
      block.className = "block";
      const recent = history.slice(0, 20);
      recent.forEach((cmd, i) => {
        const r = document.createElement("div");
        r.className = "line help-row";
        r.innerHTML = `<span class="dim">${String(recent.length - i).padStart(4, " ")}</span>  <span class="orange">${escapeHtml(cmd)}</span>`;
        r.addEventListener("click", () => runCommand(cmd));
        block.appendChild(r);
      });
      out.appendChild(block);
      ctx.blank();
    },
  };

  COMMANDS.motd = {
    desc: "message of the day",
    run() {
      const motds = [
        "the only winning move is to play.",
        "if you can read this, you have a fairly nice life.",
        "there is no cloud. it's just someone else's terminal.",
        "hack the planet — quietly.",
        "trust the process. distrust the protocol.",
        "good code is read more than it's run.",
      ];
      const pick = motds[Math.floor(Math.random() * motds.length)];
      writeLine(`<span class="info">${pick}</span>`);
      ctx.blank();
    },
  };

  COMMANDS.search = {
    desc: "grep blog + repos",
    run(args) {
      const q = args.join(" ").trim().toLowerCase();
      if (!q) { writeLine('<span class="fail">usage: search &lt;query&gt;</span>'); ctx.blank(); return; }
      const hits = [];
      for (const p of D.blog) {
        const hay = (p.title + " " + p.preview + " " + p.tags.join(" ")).toLowerCase();
        if (hay.includes(q)) hits.push({ kind: "blog", title: p.title, slug: p.slug });
      }
      for (const r of D.repos) {
        const hay = (r.name + " " + r.desc).toLowerCase();
        if (hay.includes(q)) hits.push({ kind: "repo", title: r.name, slug: r.name });
      }
      if (!hits.length) { writeLine(`<span class="dim">no hits for "${escapeHtml(q)}".</span>`); ctx.blank(); return; }
      writeLine(`<span class="head">${hits.length} hits for "${escapeHtml(q)}":</span>`);
      const block = document.createElement("div");
      block.className = "block";
      for (const h of hits) {
        const r = document.createElement("div");
        r.className = "line help-row";
        r.innerHTML = `<span class="dim">[${h.kind}]</span>  <span class="orange">${escapeHtml(h.title)}</span>`;
        const cmd = h.kind === "blog" ? `blog ${h.slug}` : `cat repos/${h.slug}`;
        r.addEventListener("click", () => runCommand(cmd));
        block.appendChild(r);
      }
      out.appendChild(block);
      ctx.blank();
    },
  };
  COMMANDS.grep = COMMANDS.search;

  COMMANDS.contact = {
    desc: "how to reach me",
    run() { COMMANDS.links.run(); },
  };

  // ──────────────── easter eggs ────────────────────────────────────────────────
  COMMANDS.coffee = {
    desc: "☕",
    run() {
      writeLine('<span class="fail">HTTP 418: i am a teapot.</span>');
      writeLine('<span class="dim">the requested resource refuses to brew coffee.</span>');
      ctx.blank();
    },
  };
  COMMANDS.tea = {
    desc: " ",
    run() {
      writeLine('<span class="ok">[☕] steeping... done.</span>');
      writeLine('<span class="dim">earl grey, hot. 89 cal of dignity restored.</span>');
      ctx.blank();
    },
  };

  COMMANDS.make = {
    desc: "build target",
    run(args) {
      if (args.join(" ").toLowerCase() === "me a sandwich") {
        writeLine('<span class="fail">make: *** what? make it yourself.</span>');
      } else if (args[0] === "sandwich" || !args[0]) {
        writeLine('<span class="fail">make: missing operand. try: sudo make me a sandwich</span>');
      } else {
        writeLine(`<span class="dim">make: nothing to be done for '${escapeHtml(args.join(" "))}'.</span>`);
      }
      ctx.blank();
    },
  };

  COMMANDS.fortune = {
    desc: "random wisdom",
    run() {
      const fortunes = [
        "the bug is always between the chair and the keyboard.",
        "there are 10 kinds of people: those who get binary and those who don't.",
        "the difference between art and engineering is undo.",
        "in case of fire: git commit · git push · leave the building.",
        "if it works, don't touch it. if it doesn't, also don't touch it.",
        "the cloud is just somebody else's terminal.",
        "i don't always test my code. but when i do, i do it in production.",
        "a user interface is like a joke. if you have to explain it, it's not that good.",
      ];
      const pick = fortunes[Math.floor(Math.random() * fortunes.length)];
      writeLine(`<span class="info">  » ${pick}</span>`);
      ctx.blank();
    },
  };

  COMMANDS.cowsay = {
    desc: "",
    run(args) {
      const text = args.join(" ") || "moo";
      const bar = "─".repeat(text.length + 2);
      const lines = [
        " " + bar,
        "< " + text + " >",
        " " + bar,
        "        \\   ^__^",
        "         \\  (oo)\\_______",
        "            (__)\\       )\\/\\",
        "                ||----w |",
        "                ||     ||",
      ];
      const block = document.createElement("div");
      block.className = "block";
      block.style.whiteSpace = "pre";
      for (const l of lines) {
        const r = document.createElement("div");
        r.className = "line";
        r.innerHTML = '<span class="orange">' + escapeHtml(l) + '</span>';
        block.appendChild(r);
      }
      out.appendChild(block);
      ctx.blank();
    },
  };

  COMMANDS.sl = {
    desc: "",
    run() {
      writeLine('<span class="dim">                 (  ) (@@) ( )  (@)  ()    @@    O     @     O     @</span>');
      writeLine('<span class="dim">            (@@@)</span>');
      writeLine('<span class="orange">        (    )</span>');
      writeLine('<span class="orange">     (@@@@)</span>');
      writeLine('<span class="orange">   (   )</span>');
      writeLine('<span class="warn">  ====        ________                ___________</span>');
      writeLine('<span class="warn">  _D _|  |_______/        \\__I_I_____===__|_________|</span>');
      writeLine('<span class="warn">   |(_)---  |   H\\________/ |   |        =|___ ___|</span>');
      writeLine('<span class="warn">   /     |  |   H  |  |     |   |         ||_| |_||</span>');
      writeLine('<span class="warn">  |      |  |   H  |__--------------------| [___] |</span>');
      writeLine('<span class="warn">  | ________|___H__/__|_____/[][]~\\_______|       |</span>');
      writeLine('<span class="warn">  |/ |   |-----------I_____I [][] []  D   |=======|__</span>');
      writeLine('<span class="info">__/ =| o |=-O=====O=====O=====O \\ ____Y___________|__</span>');
      writeLine('<span class="info"> |/-=|___|=    ||    ||    ||    |_____/~\\___/</span>');
      writeLine('<span class="info">  \\_/      \\_/      \\_/      \\_/      \\_/</span>');
      writeLine('<span class="dim">    you meant </span><span class="orange">ls</span><span class="dim">, didn\'t you?</span>');
      ctx.blank();
    },
  };

  COMMANDS.vim = {
    desc: "",
    run() {
      writeLine('<span class="warn">trapped in vim. press</span> <span class="orange">:wq</span> <span class="warn">or accept your fate.</span>');
      ctx.blank();
    },
  };
  COMMANDS.emacs = {
    desc: "",
    run() {
      writeLine('<span class="dim">emacs: a perfectly fine OS, lacking only a decent editor.</span>');
      ctx.blank();
    },
  };
  COMMANDS[":wq"] = { desc: "", run() { writeLine('<span class="ok">freed.</span>'); ctx.blank(); } };
  COMMANDS[":q"]  = COMMANDS[":wq"];
  COMMANDS[":q!"] = COMMANDS[":wq"];

  COMMANDS["42"] = {
    desc: "",
    run() {
      writeLine('<span class="info">the answer to life, the universe, and everything.</span>');
      writeLine('<span class="dim">we still don\'t know the question.</span>');
      ctx.blank();
    },
  };

  COMMANDS.hack = {
    desc: "",
    run() {
      const targets = ["pentagon.mil", "the.mainframe", "gibson", "area-51.gov", "your-router"];
      const t = targets[Math.floor(Math.random() * targets.length)];
      writeLine(`<span class="warn">[hack] target acquired: <span class="info">${t}</span></span>`);
      writeLine('<span class="ok">[hack] uploading virus.exe … 100%</span>');
      writeLine('<span class="ok">[hack] downloading the internet … done</span>');
      writeLine('<span class="fail">[hack] caught. authorities en route.</span>');
      ctx.blank();
    },
  };

  COMMANDS.rm = {
    desc: "",
    run(args) {
      const joined = args.join(" ");
      const dangerous = /-r[f]?\s*\/|-rf?\s*\*|--no-preserve-root|\/etc|\/boot|\/home|--recursive\s*\//.test(joined.toLowerCase());
      if (dangerous || joined === "-rf /" || joined === "-rf /*" || joined === "-rf ~") {
        runCommand.crash && runCommand.crash(`rm ${joined}`);
        return;
      }
      writeLine(`<span class="dim">rm: cannot remove '${escapeHtml(joined || "")}': operation prohibited</span>`);
      ctx.blank();
    },
  };

  COMMANDS.ping = {
    desc: "",
    run(args) {
      const target = args[0] || "defthrets";
      writeLine(`<span class="dim">PING ${escapeHtml(target)} (127.0.0.1): 56 data bytes</span>`);
      for (let i = 0; i < 4; i++) {
        const ms = (0.4 + Math.random() * 0.8).toFixed(3);
        writeLine(`<span class="dim">64 bytes from ${escapeHtml(target)}: icmp_seq=${i} ttl=64 time=${ms} ms</span>`);
      }
      writeLine(`<span class="ok">--- ${escapeHtml(target)} ping statistics ---</span>`);
      writeLine('<span class="dim">4 packets transmitted, 4 received, 0% loss</span>');
      ctx.blank();
    },
  };

  COMMANDS.banner = {
    desc: "",
    run() {
      window.scrambleEl && document.querySelectorAll(".ascii.main").forEach((el) => window.scrambleEl(el, 600));
      writeLine('<span class="orange">SPITMUX</span>');
      ctx.blank();
    },
  };

  COMMANDS.cookie = {
    desc: "",
    run() {
      writeLine('<span class="ok">you found a cookie.</span> <span class="dim">+1 social credit.</span>');
      ctx.blank();
    },
  };
  COMMANDS.konami = {
    desc: "hint",
    run() {
      writeLine('<span class="dim">↑ ↑ ↓ ↓ ← → ← → b a</span>');
      ctx.blank();
    },
  };

  // ---------------- CRASH MODE ----------------
  // triggered by destructive commands. corrupts output, shakes the
  // page, throws up a kernel panic, then reboots the splash.
  window.crashTerminal = async function crashTerminal(cmd) {
    cmd = cmd || "unknown";
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

    // 1. immediate angry red
    writeLine(`<span class="fail">!! ${escapeHtml(cmd)}</span>`);
    writeLine('<span class="fail">!! SEGFAULT</span> <span class="dim">at 0x00000000 in /home/spitmux</span>');
    writeLine('<span class="fail">!! signal 11 (SIGSEGV)</span>');
    ctx.scrollToBottom();
    await sleep(180);

    // 2. shake the whole shell + invert colors briefly
    const shell = document.querySelector(".shell");
    shell.classList.add("crashing");

    // 3. spew corruption lines into the terminal output
    const noise = "█▓▒░▒▓@#%&*?!/\\<>╳│┃═║";
    const errs = [
      "kernel: BUG: scheduling while atomic",
      "kernel: Oops: 0000 [#1] PREEMPT SMP",
      "general protection fault: 0000 [#1] PREEMPT",
      "end_request: I/O error, dev sda, sector 0",
      "EXT4-fs error: corrupted inode #2",
      "BUG: unable to handle page fault for address: 0xdeadbeef",
      "systemd[1]: Failed to mount /. Falling back to read-only.",
      "watchdog: BUG: soft lockup - CPU#0 stuck for 22s!",
      "NMI watchdog: Watchdog detected hard LOCKUP on cpu 0",
      "PANIC: double fault, error_code: 0x0",
      "reboot: machine restart",
    ];
    for (let i = 0; i < errs.length; i++) {
      const line = document.createElement("div");
      line.className = "line corrupt";
      line.innerHTML = `<span class="fail">[${(Math.random() * 1000).toFixed(3).padStart(8, " ")}] ${errs[i]}</span>`;
      out.appendChild(line);
      // mid-cascade burst of noise
      if (i % 3 === 1) {
        const noiseLine = document.createElement("div");
        noiseLine.className = "line corrupt-noise";
        let s = "";
        for (let j = 0; j < 60; j++) s += noise[(Math.random() * noise.length) | 0];
        noiseLine.innerHTML = `<span class="fail">${s}</span>`;
        out.appendChild(noiseLine);
      }
      ctx.scrollToBottom();
      await sleep(80 + Math.random() * 60);
    }

    await sleep(280);

    // 4. kernel panic full-takeover panel
    const panic = document.createElement("div");
    panic.className = "kernel-panic";
    panic.innerHTML = `
      <div class="kp-banner">KERNEL PANIC — not syncing</div>
      <div class="kp-body">
        <div>Fatal exception in interrupt context</div>
        <div>CPU: 0 PID: 1337 Comm: spitmux Tainted: G   D   W</div>
        <div>RIP: 0010:[&lt;ffffffff8042bee0&gt;] do_exit+0x0/0x440</div>
        <div>RSP: 0018:ffff88003f7c5e08 EFLAGS: 00010046</div>
        <div>Call Trace:</div>
        <div>&nbsp; [&lt;ffffffff8042bee0&gt;] do_exit+0x440</div>
        <div>&nbsp; [&lt;ffffffff8042c0d3&gt;] sys_exit_group+0x13/0x20</div>
        <div>&nbsp; [&lt;ffffffff8100c2cb&gt;] system_call_fastpath+0x16/0x1b</div>
        <div class="kp-sep">────────────────────────────────────────────────</div>
        <div>caused by: <b>${escapeHtml(cmd)}</b></div>
        <div class="kp-hint">rebooting in <span class="kp-count">5</span>…</div>
      </div>
    `;
    document.body.appendChild(panic);

    // countdown
    for (let n = 5; n >= 1; n--) {
      panic.querySelector(".kp-count").textContent = String(n);
      await sleep(900);
    }

    // 5. wipe + restart boot sequence
    panic.remove();
    shell.classList.remove("crashing");
    out.innerHTML = "";
    await sleep(300);
    if (window.bootSequence) {
      await window.bootSequence(out, ctx);
      // re-run help after boot
      if (COMMANDS.help) COMMANDS.help.run();
    }
  };
  runCommand.crash = window.crashTerminal;

  // ---------------- Dispatch ----------------
  function runCommand(raw) {
    const trimmed = raw.trim();
    if (trimmed) history.unshift(trimmed);
    hIdx = -1;
    echoCommand(raw);

    if (!trimmed) { return; }

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);

    const handler = COMMANDS[cmd];
    if (handler) {
      try { handler.run(args); }
      catch (e) { writeLine(`<span class="fail">err: ${escapeHtml(String(e))}</span>`); ctx.blank(); }
      } else {
        writeLine(`<span class="fail">${escapeHtml(cmd)}: command not found</span> <span class="dim">— try </span><span class="orange">help</span>`);
        ctx.blank();
      }
    ctx.scrollToBottom();
  }
  window.runCommand = runCommand;

  // ---------------- Input handling ----------------
  function placeFocus() { input.focus(); }
  document.addEventListener("click", (e) => {
    if (!e.target.closest("a") && !e.target.closest(".list-item")) placeFocus();
  });

  function updateCursor() {
    // measure text width to position fake cursor at end of input
    const span = document.getElementById("cmd-measure");
    const cs = window.getComputedStyle(input);
    span.style.font = cs.font;
    span.textContent = input.value;
    const w = span.offsetWidth;
    fakeCursor.style.transform = `translateX(${w}px)`;
  }
  input.addEventListener("input", () => {
    updateCursor();
    window.spitmuxAudio.click();
  });
  updateCursor();

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const v = input.value;
      input.value = "";
      updateCursor();
      runCommand(v);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (history.length === 0) return;
      hIdx = Math.min(hIdx + 1, history.length - 1);
      input.value = history[hIdx] || "";
      updateCursor();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      hIdx = Math.max(hIdx - 1, -1);
      input.value = hIdx === -1 ? "" : history[hIdx];
      updateCursor();
    } else if (e.key === "Tab") {
      e.preventDefault();
      const v = input.value;
      const names = Object.keys(COMMANDS);
      const match = names.filter((n) => n.startsWith(v));
      if (match.length === 1) {
        input.value = match[0] + " ";
        updateCursor();
      } else if (match.length > 1) {
        writeLine('<span class="dim">' + match.join("  ") + "</span>");
        ctx.blank();
      }
    } else if (e.key === "l" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      COMMANDS.clear.run();
    } else if (e.key === "c" && e.ctrlKey) {
      e.preventDefault();
      echoCommand(input.value + "^C");
      input.value = "";
      updateCursor();
    }
  });

  // Konami listener
  window.addEventListener("konami", () => {
    document.body.classList.add("unlocked");
    window.crtFlash();
    window.spitmuxAudio.beep(220, 80);
    setTimeout(() => window.spitmuxAudio.beep(440, 80), 100);
    setTimeout(() => window.spitmuxAudio.beep(880, 160), 200);
    writeLine('<span class="head">▸▸▸ KONAMI ACCEPTED ▸▸▸</span>');
    writeLine('<span class="warn">.secret unsealed. switching palette to scorch.</span>');
    writeLine('<span class="dim">try</span> <span class="orange">cat .secret</span>');
    ctx.blank();
    // unlock secret
    COMMANDS["cat"].run = ((orig) => (args) => {
      if ((args[0] || "") === ".secret") {
        writeLine('<span class="head">── .secret ──</span>');
        writeLine('<span class="orange">"you will succumb to the poison you have tasted."</span>');
        writeLine('<span class="dim">— a thing i told myself the first time i ran nmap</span>');
        ctx.blank();
        return;
      }
      orig(args);
    })(COMMANDS["cat"].run);
  });

  // ---------------- Boot ----------------
  (async () => {
    await window.bootSequence(out, ctx);
    booted = true;
    input.removeAttribute("disabled");
    // auto-show the command list so the landing page is the menu
    COMMANDS.help.run();
    placeFocus();
  })();
})();
