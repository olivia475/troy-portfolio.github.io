// ── State ────────────────────────────────────────────────────────────────────
let audioCtx = null;
let isLight = false;
let params = { vol: 75, rev: 20, pitch: 50 };

// ── Audio context ─────────────────────────────────────────────────────────────
function getCtx() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

// ── Pad definitions ───────────────────────────────────────────────────────────
const padDefs = [
  { label: 'sound on!',     accent: 'accent-g', type: 'kick'   },
  { label: '',                                   type: 'snare'  },
  { label: '',                                   type: 'hihat'  },
  { label: '',                                   type: 'clap'   },
  { label: '',                                   type: 'tom'    },
  { label: '',                                   type: 'rim'    },
  { label: '',                                   type: 'cymbal' },
  { label: '',                                   type: 'shaker' },
  { label: '',                                   type: 'bass'   },
  { label: 'troy blackmore',                     type: 'chord1' },
  { label: '',                                   type: 'chord2' },
  { label: '',                                   type: 'perc1'  },
  { label: '',                                   type: 'perc2'  },
  { label: '',                                   type: 'noise'  },
  { label: '',                                   type: 'sub'    },
  { label: '',                                   type: 'fx1'    },
  { label: '',                                   type: 'fx2'    },
  { label: '',                                   type: 'fx3'    },
  { label: '',                                   type: 'stab'   },
  { label: 'work',          accent: 'accent-b', type: 'lead' },
  { label: '',                                   type: 'arp1'   },
  { label: '',                                   type: 'arp2'   },
  { label: '',                                   type: 'arp3'   },
  { label: '',                                   type: 'arp4'   },
  { label: '',                                   type: 'arp5'   },
  { label: '',                                   type: 'pad1'   },
  { label: 'about',         accent: 'accent-r', type: 'pad2' },
  { label: '',                                   type: 'pad3'   },
];

// ── Build grid ────────────────────────────────────────────────────────────────
function buildGrid() {
  const grid = document.getElementById('padGrid');
  padDefs.forEach(def => {
    const pad = document.createElement('div');
    pad.className = 'pad' + (def.accent ? ' ' + def.accent : '');
    pad.dataset.type = def.type;

    if (def.label) {
      const lbl = document.createElement('div');
      lbl.className = 'pad-label';
      lbl.textContent = def.label;
      pad.appendChild(lbl);
    }

    pad.addEventListener('mousedown', () => {
      triggerPad(pad, def.type);
      if (def.link) {
        setTimeout(() => { window.location.href = def.link; }, 160);
      }
    });
    pad.addEventListener('touchstart', e => {
      e.preventDefault();
      triggerPad(pad, def.type);
      if (def.link) {
        setTimeout(() => { window.location.href = def.link; }, 160);
      }
    }, { passive: false });

    grid.appendChild(pad);
  });
}

function triggerPad(pad, type) {
  pad.classList.add('hit');
  playSound(type);
  setTimeout(() => pad.classList.remove('hit'), 130);
}

// ── Sound engine ──────────────────────────────────────────────────────────────
function playSound(type) {
  const ctx  = getCtx();
  const vol  = params.vol  / 100;
  const rev  = params.rev  / 100;
  const pf   = 0.5 + params.pitch / 100;
  const now  = ctx.currentTime;

  const master = ctx.createGain();
  master.gain.value = vol * 0.7;
  master.connect(ctx.destination);

  function addReverb(node) {
    if (rev < 0.05) { node.connect(master); return; }

    const conv = ctx.createConvolver();
    const len  = ctx.sampleRate * (0.5 + rev * 2.5);
    const buf  = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
      }
    }
    conv.buffer = buf;

    const dry = ctx.createGain(); dry.gain.value = 1 - rev * 0.5;
    const wet = ctx.createGain(); wet.gain.value = rev * 0.5;
    node.connect(dry); dry.connect(master);
    node.connect(conv); conv.connect(wet); wet.connect(master);
  }

  const sounds = {
    kick() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(160 * pf, now);
      o.frequency.exponentialRampToValueAtTime(40 * pf, now + 0.15);
      g.gain.setValueAtTime(1, now);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.35);
    },
    snare() {
      const n = ctx.createBufferSource();
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      n.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 2000 * pf; f.Q.value = 0.5;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.8, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      n.connect(f); f.connect(g); addReverb(g); n.start(now); n.stop(now + 0.2);
    },
    hihat() {
      const n = ctx.createBufferSource();
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.05, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      n.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 8000 * pf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      n.connect(f); f.connect(g); addReverb(g); n.start(now); n.stop(now + 0.05);
    },
    clap() {
      [0, 0.01, 0.02].forEach(t => {
        const n = ctx.createBufferSource();
        const b = ctx.createBuffer(1, ctx.sampleRate * 0.08, ctx.sampleRate);
        const d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        n.buffer = b;
        const f = ctx.createBiquadFilter();
        f.type = 'bandpass'; f.frequency.value = 1200 * pf; f.Q.value = 1;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.6, now + t); g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.08);
        n.connect(f); f.connect(g); addReverb(g); n.start(now + t); n.stop(now + t + 0.08);
      });
    },
    tom() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(200 * pf, now);
      o.frequency.exponentialRampToValueAtTime(80 * pf, now + 0.2);
      g.gain.setValueAtTime(0.8, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.25);
    },
    rim() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square'; o.frequency.value = 1600 * pf;
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.04);
    },
    cymbal() {
      const n = ctx.createBufferSource();
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.8, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      n.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'highpass'; f.frequency.value = 6000 * pf;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      n.connect(f); f.connect(g); addReverb(g); n.start(now); n.stop(now + 0.8);
    },
    shaker() {
      const n = ctx.createBufferSource();
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.3));
      }
      n.buffer = b;
      const f = ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 5000 * pf; f.Q.value = 2;
      const g = ctx.createGain(); g.gain.value = 0.5;
      n.connect(f); f.connect(g); addReverb(g); n.start(now); n.stop(now + 0.1);
    },
    bass() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 55 * pf;
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = 400;
      g.gain.setValueAtTime(0.9, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      o.connect(f); f.connect(g); addReverb(g); o.start(now); o.stop(now + 0.4);
    },
    chord1() {
      [261.63, 329.63, 392].forEach(freq => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq * pf;
        g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.6);
      });
    },
    chord2() {
      [293.66, 369.99, 440].forEach(freq => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle'; o.frequency.value = freq * pf;
        g.gain.setValueAtTime(0.2, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.6);
      });
    },
    perc1() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(800 * pf, now);
      o.frequency.exponentialRampToValueAtTime(200 * pf, now + 0.1);
      g.gain.setValueAtTime(0.5, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.12);
    },
    perc2() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'square';
      o.frequency.setValueAtTime(400 * pf, now);
      o.frequency.exponentialRampToValueAtTime(150 * pf, now + 0.08);
      g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.1);
    },
    noise() {
      const n = ctx.createBufferSource();
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      n.buffer = b;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      n.connect(g); addReverb(g); n.start(now); n.stop(now + 0.3);
    },
    sub() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.value = 40 * pf;
      g.gain.setValueAtTime(1, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.5);
    },
    fx1() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.setValueAtTime(100 * pf, now);
      o.frequency.exponentialRampToValueAtTime(2000 * pf, now + 0.3);
      g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.35);
    },
    fx2() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.frequency.setValueAtTime(2000 * pf, now);
      o.frequency.exponentialRampToValueAtTime(100 * pf, now + 0.4);
      g.gain.setValueAtTime(0.4, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.45);
    },
    fx3() {
      [0, 0.05, 0.1, 0.15].forEach((t, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'square'; o.frequency.value = 440 * pf * (1 + i * 0.3);
        g.gain.setValueAtTime(0.2, now + t); g.gain.exponentialRampToValueAtTime(0.001, now + t + 0.08);
        o.connect(g); addReverb(g); o.start(now + t); o.stop(now + t + 0.08);
      });
    },
    stab() {
      [220, 277, 330].forEach(freq => {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sawtooth'; o.frequency.value = freq * pf;
        const fi = ctx.createBiquadFilter();
        fi.type = 'lowpass'; fi.frequency.value = 1200;
        g.gain.setValueAtTime(0.3, now); g.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        o.connect(fi); fi.connect(g); addReverb(g); o.start(now); o.stop(now + 0.15);
      });
    },
    lead() {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sawtooth'; o.frequency.value = 523.25 * pf;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.4, now + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.5);
    },
    arp1() { playArp([261.63, 329.63, 392, 523.25], pf, now, ctx, addReverb); },
    arp2() { playArp([293.66, 369.99, 440, 587.33], pf, now, ctx, addReverb); },
    arp3() { playArp([220, 277.18, 329.63, 440],    pf, now, ctx, addReverb); },
    arp4() { playArp([196, 246.94, 293.66, 392],    pf, now, ctx, addReverb); },
    arp5() { playArp([174.61, 220, 261.63, 349.23], pf, now, ctx, addReverb); },
    pad1() { playPad([130.81, 164.81, 196],         pf, now, ctx, addReverb); },
    pad2() { playPad([146.83, 185, 220],             pf, now, ctx, addReverb); },
    pad3() { playPad([110, 138.59, 164.81],          pf, now, ctx, addReverb); },
  };

  if (sounds[type]) sounds[type]();
  triggerVU();
}

function playArp(freqs, pf, now, ctx, addReverb) {
  freqs.forEach((freq, i) => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'triangle'; o.frequency.value = freq * pf;
    g.gain.setValueAtTime(0.25, now + i * 0.08);
    g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.12);
    o.connect(g); addReverb(g); o.start(now + i * 0.08); o.stop(now + i * 0.08 + 0.12);
  });
}

function playPad(freqs, pf, now, ctx, addReverb) {
  freqs.forEach(freq => {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq * pf;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    o.connect(g); addReverb(g); o.start(now); o.stop(now + 0.8);
  });
}

// ── VU meter ──────────────────────────────────────────────────────────────────
let vuTO;
function triggerVU() {
  for (let i = 0; i < 7; i++) {
    const bar = document.getElementById('vu' + i);
    if (!bar) continue;
    const h = 20 + Math.random() * 80;
    bar.style.height = h + '%';
    bar.className = 'vu-fill' + (h > 80 ? ' clip' : h > 60 ? ' hot' : '');
  }
  clearTimeout(vuTO);
  vuTO = setTimeout(() => {
    for (let i = 0; i < 7; i++) {
      const bar = document.getElementById('vu' + i);
      if (bar) { bar.style.height = '0%'; bar.className = 'vu-fill'; }
    }
  }, 200);
}

// ── Sliders ───────────────────────────────────────────────────────────────────
function setupSliders() {
  const sliders = [
    { track: 'trackVol',   fill: 'fillVol',   pin: 'pinVol',   val: 'valVol',   param: 'vol'   },
    { track: 'trackRev',   fill: 'fillRev',   pin: 'pinRev',   val: 'valRev',   param: 'rev'   },
    { track: 'trackPitch', fill: 'fillPitch', pin: 'pinPitch', val: 'valPitch', param: 'pitch' },
  ];

  sliders.forEach(s => {
    const track = document.getElementById(s.track);
    const fill  = document.getElementById(s.fill);
    const pin   = document.getElementById(s.pin);
    const valEl = document.getElementById(s.val);
    let dragging = false;

    function applyPct(clientX) {
      const rect = track.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      params[s.param]    = Math.round(pct * 100);
      pin.style.left     = (pct * 100) + '%';
      fill.style.width   = (pct * 100) + '%';
      valEl.textContent  = params[s.param];
    }

    // Initialise position
    const initPct = params[s.param] / 100;
    pin.style.left   = (initPct * 100) + '%';
    fill.style.width = (initPct * 100) + '%';
    valEl.textContent = params[s.param];

    // Mouse
    pin.addEventListener('mousedown',   e => { dragging = true; e.preventDefault(); });
    track.addEventListener('mousedown', e => { dragging = true; applyPct(e.clientX); e.preventDefault(); });
    document.addEventListener('mousemove', e => { if (dragging) applyPct(e.clientX); });
    document.addEventListener('mouseup',   () => { dragging = false; });

    // Touch
    pin.addEventListener('touchstart',   e => { dragging = true; e.preventDefault(); }, { passive: false });
    track.addEventListener('touchstart', e => { dragging = true; applyPct(e.touches[0].clientX); e.preventDefault(); }, { passive: false });
    document.addEventListener('touchmove', e => { if (dragging) applyPct(e.touches[0].clientX); }, { passive: false });
    document.addEventListener('touchend', () => { dragging = false; });
  });
}

// ── Theme toggle ──────────────────────────────────────────────────────────────
function toggleTheme() {
  isLight = !isLight;
  document.getElementById('studio').classList.toggle('light', isLight);
  document.getElementById('themeToggle').classList.toggle('on', isLight);
}

document.getElementById('themeToggle').addEventListener('click', toggleTheme);

// ── Init ──────────────────────────────────────────────────────────────────────
buildGrid();
setupSliders();