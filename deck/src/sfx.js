/* sfx.js — procedural WebAudio sound effects. No audio assets: every sound is
   synthesized (oscillators + filtered noise), so the game stays one folder, fully local. */
window.Spire = window.Spire || {};

Spire.sfx = (() => {
  let ac = null, master = null;
  let unlocked = false;
  const ctx = () => {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ac = new AC();
      master = ac.createGain();
      master.gain.value = 0.55;
      master.connect(ac.destination);
    }
    return ac;
  };
  const unlock = () => { const a = ctx(); if (a && a.state === "suspended") a.resume(); unlocked = true; };

  function tone(freq, dur, { type = "sine", vol = 0.2, slide = 0, delay = 0, curve = 2 } = {}) {
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + delay;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.008);
    g.gain.setTargetAtTime(0, t0 + dur * 0.4, dur / curve / 3);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.15);
  }
  function noise(dur, { vol = 0.2, freq = 1200, q = 0.8, type = "bandpass", delay = 0, slide = 0 } = {}) {
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + delay;
    const len = Math.max(1, Math.floor(a.sampleRate * dur));
    const buf = a.createBuffer(1, len, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = a.createBufferSource(); src.buffer = buf;
    const f = a.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(freq, t0); f.Q.value = q;
    if (slide) f.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t0 + dur);
    const g = a.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.006);
    g.gain.setTargetAtTime(0, t0 + dur * 0.3, dur / 5);
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0); src.stop(t0 + dur + 0.1);
  }

  return {
    unlock,
    click()   { tone(660, 0.06, { type: "triangle", vol: 0.10 }); tone(990, 0.05, { type: "sine", vol: 0.06, delay: 0.02 }); },
    hover()   { tone(520, 0.04, { type: "triangle", vol: 0.045 }); },
    card()    { noise(0.09, { vol: 0.14, freq: 2600, q: 0.6, slide: -1400 }); tone(340, 0.08, { type: "triangle", vol: 0.07 }); },
    draw()    { for (let i = 0; i < 4; i++) noise(0.05, { vol: 0.06, freq: 3000 - i * 300, delay: i * 0.055 }); },
    whoosh()  { noise(0.22, { vol: 0.16, freq: 900, q: 1.4, slide: 1400 }); },
    bolt()    { tone(880, 0.18, { type: "sawtooth", vol: 0.07, slide: -560 }); noise(0.16, { vol: 0.10, freq: 2200, slide: -1200 }); },
    hit(big)  {
      noise(big ? 0.24 : 0.14, { vol: big ? 0.30 : 0.20, freq: 260, q: 0.7, type: "lowpass" });
      tone(big ? 90 : 130, big ? 0.22 : 0.13, { type: "square", vol: big ? 0.18 : 0.11, slide: -60 });
      if (big) noise(0.3, { vol: 0.12, freq: 1600, slide: -1200, delay: 0.02 });
    },
    blocked() { tone(1250, 0.09, { type: "triangle", vol: 0.14, slide: -300 }); noise(0.07, { vol: 0.10, freq: 4200, q: 2 }); },
    shield()  { tone(520, 0.16, { type: "sine", vol: 0.12, slide: 140 }); tone(780, 0.14, { type: "sine", vol: 0.08, delay: 0.05 }); },
    heal()    { [523, 659, 784].forEach((f, i) => tone(f, 0.16, { type: "sine", vol: 0.09, delay: i * 0.07 })); },
    burn()    { noise(0.4, { vol: 0.13, freq: 900, q: 0.5, slide: -500 }); noise(0.3, { vol: 0.08, freq: 2600, delay: 0.05 }); },
    debuff()  { tone(420, 0.24, { type: "sawtooth", vol: 0.08, slide: -180 }); },
    buff()    { tone(300, 0.2, { type: "sawtooth", vol: 0.10, slide: 160 }); },
    portal()  { tone(220, 0.5, { type: "sine", vol: 0.10, slide: 240 }); noise(0.45, { vol: 0.07, freq: 700, q: 2, slide: 900 }); },
    summon()  { tone(140, 0.55, { type: "sawtooth", vol: 0.10, slide: 120 }); noise(0.5, { vol: 0.09, freq: 500, q: 1.2, slide: 700 }); },
    roar()    { tone(110, 0.5, { type: "sawtooth", vol: 0.16, slide: -40 }); noise(0.45, { vol: 0.14, freq: 420, q: 0.6, slide: -200 }); },
    energy()  { tone(880, 0.1, { type: "sine", vol: 0.10 }); tone(1320, 0.12, { type: "sine", vol: 0.08, delay: 0.05 }); },
    victory() { [392, 494, 587, 784].forEach((f, i) => tone(f, 0.34, { type: "triangle", vol: 0.12, delay: i * 0.12 })); },
    defeat()  { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.4, { type: "triangle", vol: 0.11, delay: i * 0.16 })); },
    fanfare() { [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.3, { type: "triangle", vol: 0.11, delay: i * 0.13 })); }
  };
})();
