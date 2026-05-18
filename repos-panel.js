// Repos panel — fetches live data from github.com/<USER>, falls back to mock list.
(function () {
  const list = document.getElementById("repos-list");
  const scan = document.getElementById("repos-scan");
  if (!list) return;

  const D = window.SPITMUX;
  const USER = "defthrets";

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const rand = (a, b) => Math.floor(a + Math.random() * (b - a));
  const escape = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  const scanMsgs = [
    `scan ▸ api.github.com/users/${USER}/repos`,
    "auth ▸ public, no token",
    "fetch ▸ /repos?per_page=8&sort=updated",
    "parse ▸ json",
    "rank ▸ by updated_at desc",
    "render ▸ ttl=10m",
  ];
  let smi = 0;
  function tickScan() {
    if (!scan) return;
    scan.textContent = "» " + scanMsgs[smi % scanMsgs.length];
    smi++;
  }
  tickScan();
  setInterval(tickScan, 2600);

  function makeButton(r, i) {
    const a = document.createElement("a");
    a.className = "repo-btn loading";
    a.href = r.url;
    a.target = "_blank";
    a.rel = "noopener";
    a.dataset.idx = i;
    a.dataset.repo = JSON.stringify(r);
    a.innerHTML = `
      <span class="status-tag">link</span>
      <span class="name">${escape(r.name)}</span>
      <span class="desc">${escape(r.desc || "—")}</span>
      <div class="row">
        <span class="lang">[ ${escape(r.lang || "?")} ]</span>
        <span class="stars">${r.stars ?? 0}</span>
      </div>
      <span class="load-bar"></span>
      <div class="scan-overlay-loading"></div>
      <div class="grain-overlay"></div>
      <div class="hover-sweep"></div>
    `;
    return a;
  }

  // intercept click: render as terminal output instead of opening URL
  list.addEventListener("click", (e) => {
    const btn = e.target.closest(".repo-btn");
    if (!btn) return;
    e.preventDefault();
    let r;
    try { r = JSON.parse(btn.dataset.repo); } catch { return; }
    if (window.showRepoInTerminal) window.showRepoInTerminal(r);
  });

  async function reveal(repos) {
    list.innerHTML = "";
    const counter = document.querySelector(".repos-footer .node-count");
    if (counter) counter.textContent = `${repos.length} nodes`;
    for (let i = 0; i < repos.length; i++) {
      const r = repos[i];
      const btn = makeButton(r, i);
      list.appendChild(btn);
      requestAnimationFrame(() => btn.classList.add("in"));
      const delay = 350 + rand(150, 500);
      setTimeout(() => {
        btn.classList.remove("loading");
        const tag = btn.querySelector(".status-tag");
        tag.textContent = "ready";
        tag.classList.add("ready");
      }, delay);
      await sleep(180 + rand(40, 140));
    }
  }

  async function fetchRepos() {
    try {
      const r = await fetch(`https://api.github.com/users/${USER}/repos?sort=updated&per_page=8`, {
        headers: { Accept: "application/vnd.github+json" },
      });
      if (!r.ok) throw new Error("github api " + r.status);
      const data = await r.json();
      // skip forks, archives, and the meta repo if present
      return data
        .filter((d) => !d.fork)
        .slice(0, 6)
        .map((d) => ({
          name: d.name,
          desc: d.description || "no description",
          lang: d.language || "—",
          stars: d.stargazers_count,
          url: d.html_url,
        }));
    } catch (e) {
      return null;
    }
  }

  async function init() {
    // start with placeholder mock so panel doesn't sit empty while we fetch
    const placeholder = D.repos.slice(0, 6);
    await sleep(900); // BIOS beat
    reveal(placeholder);

    const live = await fetchRepos();
    if (live && live.length) {
      await sleep(900);
      // wipe and re-reveal with real data
      reveal(live);
    }
  }

  init();

  window.refreshReposPanel = () => init();
})();
