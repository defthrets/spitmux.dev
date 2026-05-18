// content for the spitmux terminal — edit freely
window.SPITMUX = {
  identity: {
    handle: "spitmux",
    real: "[redacted]",
    host: "defthrets",
    tagline: "you will succumb to the poison you have tasted",
    location: "//somewhere offline",
    pgp: "0xDEADBEEF C0FFEE42",
    status: "writing exploits and bad poetry",
  },

  blog: [
    {
      slug: "the-poison-protocol",
      title: "the poison protocol",
      date: "2026-05-11",
      tags: ["essay", "ritual"],
      preview: "notes on the slow seep of bad ideas through good systems. why every protocol you trust is a slow drip you've already swallowed.",
      photo: { hue: 18, label: "BOTTLE // EVIDENCE 04" },
      body: [
        "there's a thing about poison: it doesn't announce itself.",
        "you taste it once, you taste it a thousand times. the dose was the language.",
        "",
        "every protocol i've ever loved went rotten the same way:",
        "  - a clever shortcut",
        "  - a default nobody read",
        "  - a maintainer who left",
        "  - and then it's just running, everywhere, forever",
        "",
        "this post is mostly a list of poisons i've drunk.",
        "(you have drunk most of them too.)",
      ],
    },
    {
      slug: "reverse-engineering-a-toaster",
      title: "reverse engineering a toaster",
      date: "2026-04-02",
      tags: ["hardware", "writeup"],
      preview: "the firmware was 4kb. the bug was a single off-by-one. the toast was perfect.",
      photo: { hue: 30, label: "STM8 // FLASH DUMP" },
      body: [
        "$6 toaster from a thrift store. mcu was an STM8 i'd never met.",
        "dumped flash through the BDM pins after lifting a 0805 resistor.",
        "",
        "the schedule loop counted cycles instead of ms.",
        "off-by-one in the darkness scale meant level 7 was actually level 6.",
        "patched. now it incinerates.",
      ],
    },
    {
      slug: "notes-on-vt323",
      title: "notes on vt323, and why everything else feels wrong",
      date: "2026-03-18",
      tags: ["type", "tools"],
      preview: "the only font that looks like it remembers something.",
      photo: { hue: 22, label: "CRT // PHOSPHOR" },
      body: [
        "every monospace font has an opinion. most of them are timid.",
        "VT323 is the one that still smells like a CRT.",
        "i ship code in fira but i write in this.",
      ],
    },
    {
      slug: "konami-the-only-honest-ui",
      title: "konami is the only honest ui",
      date: "2026-02-09",
      tags: ["ux", "rant"],
      preview: "every modern interface is one or two secret presses away from telling the truth.",
      photo: { hue: 14, label: "CTRL // PAD" },
      body: [
        "all the good buttons are hidden.",
        "all the dangerous ones are huge and orange.",
        "↑ ↑ ↓ ↓ ← → ← → B A   — try it",
      ],
    },
    {
      slug: "on-staying-anonymous-on-purpose",
      title: "on staying anonymous on purpose",
      date: "2025-12-30",
      tags: ["opsec"],
      preview: "i don't have a face here. that's the feature.",
      photo: { hue: 6, label: "MASK // 1985.12" },
      body: [
        "no headshot. no resume. no \"about me\".",
        "if the work is interesting you will find me. if it isn't, you shouldn't.",
      ],
    },
  ],

  repos: [
    { name: "nightshade",  desc: "tiny static-site rotter. eats markdown, exhales smoke.", lang: "rust", stars: 412 },
    { name: "deadletter",  desc: "encrypted email drop, no metadata, no JS.", lang: "go", stars: 198 },
    { name: "moth",        desc: "lo-fi web crawler for archives & wayback dumps.", lang: "python", stars: 87 },
    { name: "venom",       desc: "fuzz harness for stm8/avr firmware blobs.", lang: "c", stars: 54 },
    { name: "kerosene",    desc: "minimal terminal multiplexer, ~900 LOC.", lang: "c", stars: 1127 },
    { name: "spitmux.dev", desc: "this site. you are looking at it.", lang: "html", stars: 12 },
  ],

  projects: [
    {
      name: "antiscope",
      tag: "[archive]",
      desc: "a dead-drop reading room. paste a url, get a stripped, scrollable, signed copy. no ads, no JS, no js, no js.",
      url: "https://antiscope.spitmux.dev",
    },
    {
      name: "rust in the wires",
      tag: "[zine]",
      desc: "irregular zine on disassembling cheap electronics. pdf + paper. issue 04 out now.",
      url: "https://zines.spitmux.dev",
    },
    {
      name: "nightshade.fm",
      tag: "[radio]",
      desc: "low-power streaming station. tape loops, modems, dial-up shoegaze.",
      url: "https://nightshade.fm",
    },
    {
      name: "burnbook",
      tag: "[research]",
      desc: "catalog of every UI dark pattern i've found in the wild. ~620 entries and counting.",
      url: "https://burnbook.spitmux.dev",
    },
  ],

  links: [
    { label: "github",    handle: "@defthrets",   url: "https://github.com/defthrets" },
    { label: "instagram", handle: "@spitmux",     url: "https://instagram.com/spitmux" },
    { label: "email",     handle: "spitmux@pm.me", url: "mailto:spitmux@pm.me" },
    { label: "rss",       handle: "/feed.xml",    url: "/feed.xml" },
    { label: "pgp",       handle: "0xDEADBEEF",   url: "/pgp.asc" },
  ],
};
