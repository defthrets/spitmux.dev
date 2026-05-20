// Blog feed — pulls from an RSSHub (or any RSS/Atom/JSON-Feed) endpoint.
// Falls back to SPITMUX.blog if the feed is empty / unreachable / not configured.
(function () {
  const feed = document.getElementById("radar-feed");
  const counter = document.getElementById("blip-counter");
  if (!feed) return;

  const D = window.SPITMUX;

  // ─── CONFIG ────────────────────────────────────────────────────────────
  // Set this to your RSSHub feed URL once it's live. Examples:
  //   "https://rsshub.app/twitter/user/spitmux"
  //   "https://my-rsshub.fly.dev/twitter/user/spitmux"
  //   "https://your-worker.workers.dev/twitter/spitmux"
  // Leave empty ("") to use the mock posts from content.js.
  const FEED_URL = (window.SPITMUX_FEED_URL || "").trim();
  const MAX_POSTS = 10;
  // ───────────────────────────────────────────────────────────────────────

  function escape(s) {
    return String(s).replace(/[&<>"]/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }

  // deterministic coordinate string per slug
  function hash(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }
  function coords(slug) {
    const h = hash(slug);
    const lat = ((h % 1800) / 10 - 90).toFixed(2);
    const lon = (((h >> 8) % 3600) / 10 - 180).toFixed(2);
    const bear = (h >> 16) % 360;
    return `${lat >= 0 ? "N" : "S"} ${Math.abs(lat).toFixed(2)} \u00b7 ${lon >= 0 ? "E" : "W"} ${Math.abs(lon).toFixed(2)} \u00b7 bearing ${String(bear).padStart(3, "0")}\u00b0`;
  }

  function fmtDate(d) {
    if (!d) return "";
    const dt = new Date(d);
    if (isNaN(dt)) return "";
    return dt.toISOString().slice(0, 10);
  }

  function stripHtml(s) {
    const tmp = document.createElement("div");
    tmp.innerHTML = s || "";
    return (tmp.textContent || tmp.innerText || "").replace(/\s+/g, " ").trim();
  }

  // ─── PARSERS ───────────────────────────────────────────────────────────
  async function fetchFeed(url) {
    const res = await fetch(url, { headers: { Accept: "application/json, application/atom+xml, application/rss+xml, text/xml, */*" }});
    if (!res.ok) throw new Error("feed http " + res.status);
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const text = await res.text();

    if (ct.includes("json") || text.trim().startsWith("{")) {
      return parseJSONFeed(JSON.parse(text));
    }
    return parseXMLFeed(text);
  }

  function parseJSONFeed(j) {
    // JSON Feed 1.x  https://www.jsonfeed.org/
    const items = j.items || [];
    return items.map((it) => ({
      slug: it.id || it.url || it.title,
      title: it.title || stripHtml(it.content_text || it.content_html || it.summary || "").slice(0, 80),
      date: fmtDate(it.date_published),
      tags: it.tags || [],
      preview: stripHtml(it.content_text || it.summary || it.content_html || "").slice(0, 220),
      url: it.url,
    }));
  }

  function parseXMLFeed(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("bad xml");

    // RSS 2.0
    const items = [...doc.querySelectorAll("item")];
    if (items.length) {
      return items.map((it) => {
        const title = it.querySelector("title")?.textContent || "";
        const desc = it.querySelector("description")?.textContent || "";
        const pubDate = it.querySelector("pubDate")?.textContent || "";
        const link = it.querySelector("link")?.textContent || "";
        const cats = [...it.querySelectorAll("category")].map(c => c.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "")).filter(Boolean);
        return {
          slug: link || title,
          title: title || stripHtml(desc).slice(0, 80),
          date: fmtDate(pubDate),
          tags: cats,
          preview: stripHtml(desc).slice(0, 220),
          url: link,
        };
      });
    }

    // Atom
    const entries = [...doc.querySelectorAll("entry")];
    if (entries.length) {
      return entries.map((e) => {
        const title = e.querySelector("title")?.textContent || "";
        const summary = e.querySelector("summary")?.textContent || e.querySelector("content")?.textContent || "";
        const updated = e.querySelector("updated")?.textContent || e.querySelector("published")?.textContent || "";
        const link = e.querySelector("link[rel='alternate'], link")?.getAttribute("href") || "";
        const cats = [...e.querySelectorAll("category")].map(c => (c.getAttribute("term") || "").toLowerCase()).filter(Boolean);
        return {
          slug: link || title,
          title: title || stripHtml(summary).slice(0, 80),
          date: fmtDate(updated),
          tags: cats,
          preview: stripHtml(summary).slice(0, 220),
          url: link,
        };
      });
    }

    throw new Error("no items found in feed");
  }

  // ─── RENDER ────────────────────────────────────────────────────────────
  function makeCard(p, i) {
    const card = document.createElement("article");
    card.className = "dossier";
    card.dataset.slug = p.slug;
    const idStr = "DSR-" + String(i + 1).padStart(3, "0");
    const tagStr = (p.tags || []).slice(0, 3).map((t) => "#" + t).join(" ");
    card.innerHTML = `
      <div class="body">
        <div class="head-row">
          <span class="id">${idStr}</span>
          <span>${escape(p.date || "")}</span>
        </div>
        <div class="title">${escape(p.title)}</div>
        ${tagStr ? `<div class="meta"><span class="tag">${escape(tagStr)}</span></div>` : ""}
        <div class="preview">${escape(p.preview || "")}</div>
        <div class="coords">${coords(p.slug || String(i))}</div>
      </div>
      <div class="grain-overlay"></div>
      <div class="hover-sweep"></div>
    `;
    card.addEventListener("click", () => {
      if (window.showBlogInTerminal) {
        window.showBlogInTerminal(p);
        return;
      }
      if (window.runCommand) window.runCommand("blog " + p.slug);
    });
    return card;
  }

  function render(posts) {
    const header = feed.querySelector(".blog-ascii");
    feed.innerHTML = "";
    if (header) feed.appendChild(header);
    posts.slice(0, MAX_POSTS).forEach((p, i) => feed.appendChild(makeCard(p, i)));
    if (counter) counter.textContent = String(posts.length).padStart(2, "0");
  }

  // ─── BOOTSTRAP ─────────────────────────────────────────────────────────
  async function init() {
    if (FEED_URL) {
      // Show loading state while fetching live feed
      feed.innerHTML = '<div style="color:var(--text);opacity:0.5;text-align:center;padding:40px;">… fetching feed …</div>';
    } else {
      // No feed URL configured — use mock posts from content.js
      render(D.blog);
      return;
    }

    try {
      const live = await fetchFeed(FEED_URL);
      if (live && live.length) {
        render(live);
        console.info("[blog-feed] loaded", live.length, "posts from", FEED_URL);
      }
    } catch (e) {
      console.warn("[blog-feed] failed to load", FEED_URL, e);
    }
  }

  init();
})();
