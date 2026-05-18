// Tweaks panel for spitmux site — font, matrix density, accent, effects
(function () {
  const { useEffect } = React;

  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "font": "JetBrains Mono",
    "accent": "#ff6b00",
    "matrixIntensity": 45,
    "matrixOn": true,
    "scanlines": true,
    "flicker": true,
    "chromatic": true,
    "sound": true
  }/*EDITMODE-END*/;

  const FONT_OPTIONS = [
    "JetBrains Mono",
    "IBM Plex Mono",
    "Fira Code",
    "Space Mono",
    "VT323",
  ];

  const ACCENT_OPTIONS = [
    "#ff6b00", // neon orange (default)
    "#ff8800", // amber
    "#ff4500", // red-orange
    "#ffa500", // gold
    "#39ff14", // toxic green (alt)
    "#00e5ff", // cyber cyan (alt)
  ];

  // helper: hex → derived shades
  function shade(hex, amt) {
    const m = hex.replace("#", "");
    const r = parseInt(m.slice(0, 2), 16);
    const g = parseInt(m.slice(2, 4), 16);
    const b = parseInt(m.slice(4, 6), 16);
    const f = (c) => Math.max(0, Math.min(255, Math.round(c + amt))).toString(16).padStart(2, "0");
    return `#${f(r)}${f(g)}${f(b)}`;
  }
  function rgba(hex, a) {
    const m = hex.replace("#", "");
    return `rgba(${parseInt(m.slice(0,2),16)}, ${parseInt(m.slice(2,4),16)}, ${parseInt(m.slice(4,6),16)}, ${a})`;
  }

  function applyTheme(t) {
    const root = document.documentElement;
    root.style.setProperty("--font", `"${t.font}"`);
    root.style.setProperty("--orange", t.accent);
    root.style.setProperty("--orange-glow", shade(t.accent, 30));
    root.style.setProperty("--orange-dim", shade(t.accent, -50));
    root.style.setProperty("--text", shade(t.accent, 60));
    root.style.setProperty("--text-dim", shade(t.accent, -20));
    root.style.setProperty("--shadow", `0 0 8px ${rgba(t.accent, 0.55)}, 0 0 22px ${rgba(t.accent, 0.25)}`);
    root.style.setProperty("--shadow-soft", `0 0 4px ${rgba(t.accent, 0.4)}`);

    // VT323 mode flag
    document.body.classList.toggle("font-vt323", t.font === "VT323");

    // crt/flicker toggles
    document.querySelector(".crt").style.display = t.scanlines ? "block" : "none";
    document.body.classList.toggle("flicker", !!t.flicker);

    // chromatic aberration layers
    document.querySelectorAll(".ascii.layer").forEach((el) => {
      el.style.display = t.chromatic ? "block" : "none";
    });

    // matrix toggle + intensity
    const canvas = document.getElementById("matrix");
    if (canvas) {
      canvas.style.display = t.matrixOn ? "block" : "none";
      // baseline 0.05, ramps up to 0.45 at 100% — keeps the rain subtle
      canvas.style.opacity = (0.05 + (t.matrixIntensity / 100) * 0.4).toFixed(2);
    }
    document.getElementById("matrix-pct") && (document.getElementById("matrix-pct").textContent = t.matrixIntensity + "%");

    // sound state
    if (window.spitmuxAudio) {
      if (window.spitmuxAudio.isOn() !== t.sound) window.spitmuxAudio.toggle();
    }
  }

  function App() {
    const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

    useEffect(() => {
      applyTheme(t);
    }, [t]);

    return (
      <TweaksPanel title="Tweaks">
        <TweakSection label="Typography" />
        <TweakSelect
          label="Font"
          value={t.font}
          options={FONT_OPTIONS}
          onChange={(v) => setTweak("font", v)}
        />

        <TweakSection label="Accent" />
        <TweakColor
          label="Neon"
          value={t.accent}
          options={ACCENT_OPTIONS}
          onChange={(v) => setTweak("accent", v)}
        />

        <TweakSection label="Background" />
        <TweakToggle
          label="Matrix rain"
          value={t.matrixOn}
          onChange={(v) => setTweak("matrixOn", v)}
        />
        <TweakSlider
          label="Rain density"
          value={t.matrixIntensity}
          min={0}
          max={100}
          step={5}
          unit="%"
          onChange={(v) => setTweak("matrixIntensity", v)}
        />

        <TweakSection label="CRT effects" />
        <TweakToggle
          label="Scanlines"
          value={t.scanlines}
          onChange={(v) => setTweak("scanlines", v)}
        />
        <TweakToggle
          label="Flicker"
          value={t.flicker}
          onChange={(v) => setTweak("flicker", v)}
        />
        <TweakToggle
          label="Chromatic aberration"
          value={t.chromatic}
          onChange={(v) => setTweak("chromatic", v)}
        />

        <TweakSection label="Audio" />
        <TweakToggle
          label="Keystroke clicks"
          value={t.sound}
          onChange={(v) => setTweak("sound", v)}
        />

        <TweakSection label="Easter eggs" />
        <TweakButton
          label="Trigger glitch"
          onClick={() => window.runCommand && window.runCommand("glitch")}
        />
      </TweaksPanel>
    );
  }

  // apply defaults immediately on load (before user opens tweaks)
  applyTheme(TWEAK_DEFAULTS);

  ReactDOM.createRoot(document.getElementById("tweaks-root")).render(<App />);
})();
