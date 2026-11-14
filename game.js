// STORM WATCH — cutaway lunar base crisis game.
const $ = s => document.querySelector(s);
const SPEED = +new URLSearchParams(location.search).get('speed') || 1; // ?speed=5 for quick testing
const DT = 0.25;

// ---------- NASA DONKI space-weather data ----------
// Storm 1 is the strongest flare of the last 30 days (fetched live).
// Storms 2 and 3 are fixed famous events, also fetched from DONKI by ID.
// Each has a saved copy so the game still works with no internet.
const DONKI = 'https://ccmc.gsfc.nasa.gov/DONKI-API/get/';
const SAVED_LIVE = { cls: 'M3.5', peak: '2026-11-05T18:33Z', region: null, loc: null };
const CAMPAIGN = [
  { key: 'live', title: 'Latest Big Flare', warn: 20, storm: 30 },
  { key: '2024', flrID: '2024-05-11T01:10:00-FLR-001', from: '2024-05-11', to: '2024-05-11',
    title: 'The Gannon Storm', sev: 1.6, warn: 15, storm: 30,
    fact: 'This flare was part of a chain of eruptions in May 2024 that caused the strongest geomagnetic storm at Earth in over 20 years. People saw auroras much farther south than usual.',
    saved: { cls: 'X5.8', peak: '2024-05-11T01:23Z', region: 13664, loc: 'S17W47', sepTime: '2024-05-11T02:10Z', sepInst: 'GOES-P: SEISS >100 MeV' } },
  { key: '2017', flrID: '2017-09-10T15:35:00-FLR-001', from: '2017-09-10', to: '2017-09-10',
    title: 'The X8.2 Flare', sev: 2.4, warn: 10, storm: 40,
    fact: 'One of the biggest flares of its solar cycle. On Mars, NASA\'s Curiosity rover measured surface radiation roughly doubling with its RAD instrument, the same kind of data future crews will rely on.',
    saved: { cls: 'X8.2', peak: '2017-09-10T16:06Z', region: 12673, loc: 'S08W88', sepTime: '2017-09-10T16:25Z', sepInst: 'GOES13: SEM/EPS >100 MeV' } },
];

// Flare classes go A, B, C, M, X; each letter is 10x stronger. Returns strength in "M units".
const mUnits = c => ({ A: 1e-3, B: 1e-2, C: 0.1, M: 1, X: 10 }[c[0]] || 0) * (parseFloat(c.slice(1)) || 1);
const iso = d => d.toISOString().slice(0, 10);

function makeEvent(c, d, fromNasa) {
  const mins = d.sepTime ? Math.round((new Date(d.sepTime) - new Date(d.peak)) / 6e4) : null;
  const date = new Date(d.peak).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' });
  const ev = { ...c, ...d, mins, date, fromNasa };
  if (c.key === 'live') {
    ev.sev = Math.max(0.6, Math.min(1.3, 0.6 + 0.4 * Math.log10(Math.max(1, mUnits(d.cls)))));
    ev.fact = 'This is the strongest solar flare NASA recorded in the last 30 days. ' + (mins != null
      ? `Radiation particles from it were detected ${mins} minutes later.`
      : 'It did not send a radiation storm toward the Moon. Most flares don\'t, but a crew has to be ready every time, so this drill treats it as the real thing.');
  }
  return ev;
}

let EVENTS = CAMPAIGN.map(c => makeEvent(c, c.key === 'live' ? SAVED_LIVE : c.saved, false));

async function getJSON(path) {
  const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), 7000);
  try {
    const r = await fetch(DONKI + path, { signal: ctl.signal });
    if (!r.ok) throw new Error(r.status);
    const t = await r.text();
    return t ? JSON.parse(t) : [];
  } finally { clearTimeout(to); }
}

// Flare record + list of particle events (SEP) -> the fields the game uses
function pick(flr, seps) {
  const linked = (seps || [])
    .filter(s => (s.linkedEvents || []).some(l => l.activityID === flr.flrID) && s.eventTime > flr.peakTime)
    .sort((a, b) => a.eventTime < b.eventTime ? -1 : 1);
  const inst = s => (s.instruments && s.instruments[0] && s.instruments[0].displayName) || '';
  const sep = linked.find(s => />100 MeV/.test(inst(s))) || linked[0];
  return { cls: flr.classType, peak: flr.peakTime, region: flr.activeRegionNum, loc: flr.sourceLocation, link: flr.link,
    sepTime: sep && sep.eventTime, sepInst: sep && inst(sep) };
}

async function loadEvents() {
  const now = new Date(), start = new Date(now - 30 * 864e5);
  EVENTS = await Promise.all(CAMPAIGN.map(async c => {
    try {
      const range = c.key === 'live' ? `startDate=${iso(start)}&endDate=${iso(now)}` : `startDate=${c.from}&endDate=${c.to}`;
      const [flrs, seps] = await Promise.all([getJSON('FLR?' + range), getJSON('SEP?' + range)]);
      const flr = c.key === 'live' ? flrs.sort((a, b) => mUnits(b.classType) - mUnits(a.classType))[0] : flrs.find(f => f.flrID === c.flrID);
      if (!flr) throw new Error('no flare');
      return makeEvent(c, pick(flr, seps), true);
    } catch (e) {
      return makeEvent(c, c.key === 'live' ? SAVED_LIVE : c.saved, false);
    }
  }));
}

// ---------- world layout (canvas units: 1200 x 640) ----------
const W = 1200, H = 640, SURF = 250, SHAFT = 600;
const ZONES = {
  eva:     { name: 'MOON SURFACE',  tag: 'no protection',  rad: 1.0, x: 30,  y: 110, w: 520, h: 140, floor: 250, slot: i => 130 + i * 85 },
  green:   { name: 'GREENHOUSE',    tag: 'thin walls',     rad: 0.5, x: 230, y: 290, w: 350, h: 140, floor: 422, slot: i => 280 + i * 75 },
  work:    { name: 'WORKSHOP',      tag: 'thin walls',     rad: 0.5, x: 620, y: 290, w: 350, h: 140, floor: 422, slot: i => 665 + i * 75 },
  shelter: { name: 'STORM SHELTER', tag: 'deep + shielded', rad: 0.1, x: 425, y: 470, w: 350, h: 130, floor: 592, slot: i => 480 + i * 80 },
};
const SYSTEMS = {
  o2:     { name: 'Oxygen', icon: '💨', tank: 'o2',   at: [715, 318] },
  h2o:    { name: 'Water',  icon: '💧', tank: 'h2o',  at: [885, 318] },
  farm:   { name: 'Food',   icon: '🌱', tank: 'food', at: [405, 312] },
  shield: { name: 'Shield', icon: '🛡️', tank: null,   at: [600, 455] },
};
const KW_PER_LEVEL = 2, WALK = 110;

// ---------- life support: real NASA consumption rates ----------
// kg per crew member per day, from NASA's Life Support Baseline Values and Assumptions Document
// (BVAD, NASA/TP-2015-218570 Rev2, Feb 2022), as summarized in NASA NTRS 20230013896 and 20220002294.
//   Oxygen: 0.84 (surface) / 0.89 (nominal) / 1.08 (high) kg/day
//   Drinking water: 1.78 (5th percentile) / 2.79 (baseline) / 3.89 (95th percentile) kg/day
//   Food: 1.80 kg/day as shipped (30%-hydration food)
// Game choice, not NASA: which rate goes with which activity. Resting in the shelter uses
// the low end, working inside the baseline, hard work outside on the surface the high end.
const BVAD = {
  rest:    { o2: 0.84, h2o: 1.78, food: 1.80 },
  work:    { o2: 0.89, h2o: 2.79, food: 1.80 },
  outside: { o2: 1.08, h2o: 3.89, food: 1.80 },
};
const activity = c => c.path.length ? 'work' : c.zone === 'shelter' ? 'rest' : c.zone === 'eva' ? 'outside' : 'work';
// The oxygen machine splits water by electrolysis (2 H2O -> 2 H2 + O2): 18 kg of water gives 16 kg of oxygen.
const H2O_PER_O2 = 18 / 16;
// Tank sizes (kg) and machine output per power level (kg per hour). Game settings, sized so that
// power level 2 roughly keeps up with 4 crew working inside.
const TANK = { o2: 12, h2o: 46, food: 38 };
const MAKE = { o2: 0.075, h2o: 0.32, farm: 0.09, farmer: 0.075 };
// Time scale: 1 game second = 1 hour on the base. During the warning countdown the clock slows
// down so that the countdown covers the real warning time from NASA's records.
const warnMins = ev => ev.mins != null ? ev.mins : 30;
const hoursPerSec = ev => S.phase === 'warning' ? warnMins(ev) / 60 / ev.warn : 1;
const pct = k => S.tanks[k] / TANK[k] * 100;
function clock(h) {
  const m = Math.floor(h * 60);
  return `Day ${Math.floor(m / 1440) + 1} · ${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

// ---------- the crew ----------
// Three real team members plus the player's own customizable Commander.
// Each role has a sash colour and an emblem: leaf (Botanist), ball bearing (Engineer), rock (Geologist), star (Commander).
// `look` drives the portrait: skin, hair style (or hijab), hair/hijab colour, beard, accessories.
const SKIN = ['#f6dcc6', '#ecc4a2', '#d7a479', '#b47a50', '#8a5634', '#5c3820'];
const HAIR = ['#15161a', '#3b2618', '#6b4428', '#d9b46a', '#a8482a', '#a39a90', '#1f3a6b', '#6e2235'];
const STYLES = { short: 'Short', swept: 'Swept', buzz: 'Buzz', long: 'Long', curly: 'Curly', bun: 'Bun', hijab: 'Hijab' };
const ACCS = { none: 'None', glasses: 'Glasses', earrings: 'Earrings', necklace: 'Necklace' };
const CMD_COLORS = ['#37d6ff', '#a77bff', '#ff7ac8', '#ffd84a', '#7fb2ff'];   // no green / slate / copper (teammates) or red (danger)
const TEAM = [
  { id: 'cmd', name: 'Commander', role: 'Commander', job: 'pilot', perk: 'runs 2x faster', emblem: 'star', zone: 'work' },
  { id: 'brian', name: 'Brian', role: 'Engineer', job: 'engineer', perk: 'easier repairs', emblem: 'bearing', zone: 'work', photo: 'crew/brian.jpg',
    color: '#a9b8ca', sash: '#4f5d70', edge: '#c9d4e0',
    look: { skin: '#f0cdb2', hair: 'short', hairColor: '#9a9187', beard: '#a8a096', smile: 2, acc: [] } },
  { id: 'sidra', name: 'Sidra', role: 'Botanist', job: 'botanist', perk: 'grows 2x food', emblem: 'leaf', zone: 'green', photo: 'crew/sidra.jpg',
    color: '#4be38a', look: { skin: '#c08a5f', hair: 'hijab', hairColor: '#5e2d55', frame: '#d4a640', smile: 1, acc: ['glasses', 'necklace', 'pin'] } },
  { id: 'quan', name: 'Quan', role: 'Geologist', job: 'geologist', perk: '2x science outside', emblem: 'rock', zone: 'eva', photo: 'crew/quan.jpg',
    color: '#e08a4f', look: { skin: '#e9c29b', hair: 'swept', hairColor: '#15161a', smile: 1, acc: ['glasses'] } },
];
const CMD_DEFAULT = { name: 'Commander', color: CMD_COLORS[0], look: { skin: SKIN[2], hair: 'short', hairColor: HAIR[1], smile: 1, acc: [] } };
let CMD = loadCommander();
function loadCommander() {
  try {
    const v = JSON.parse(localStorage.getItem('stormwatch.commander'));
    if (v && v.look && STYLES[v.look.hair]) return { ...CMD_DEFAULT, ...v, look: { ...CMD_DEFAULT.look, ...v.look } };
  } catch (e) {}
  return JSON.parse(JSON.stringify(CMD_DEFAULT));
}
function saveCommander() { try { localStorage.setItem('stormwatch.commander', JSON.stringify(CMD)); } catch (e) {} }
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));

// ---------- crew photos (optional) ----------
// Put a photo at crew/brian.jpg, crew/sidra.jpg or crew/quan.jpg and the game turns it into
// pixel art when it loads. Until a photo is there, the drawn portrait below is used instead.
const PHOTO_PX = 40;   // pixel-art resolution: lower = chunkier pixels
const PHOTOS = {};     // crew id -> pixelated photo (data URL)
const HEADS = {};      // crew id -> image used for the helmet-off head in the scene
function loadPhoto(id, src) {
  const img = new Image();
  img.onload = () => {
    const n = PHOTO_PX, cv = document.createElement('canvas'); cv.width = cv.height = n;
    const x = cv.getContext('2d'), s = Math.min(img.width, img.height);
    x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, n, n);   // centre square crop
    const d = x.getImageData(0, 0, n, n);                                            // fewer colours = retro look
    for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = Math.round(d.data[i + k] / 255 * 7) / 7 * 255;
    x.putImageData(d, 0, 0);
    PHOTOS[id] = cv.toDataURL();
    const h = new Image(); h.src = PHOTOS[id]; HEADS[id] = { img: h, photo: true };
    if (S) { buildUI(); render(); }
  };
  img.src = src;   // a missing file just keeps the drawn portrait
}
TEAM.forEach(t => t.photo && loadPhoto(t.id, t.photo));
// Image of a crew member's head for drawing on the canvas (photo if there is one, else the drawn portrait).
function headFor(c) {
  if (HEADS[c.id] && HEADS[c.id].photo) return HEADS[c.id];
  const key = JSON.stringify([c.look, c.color]);
  if (!HEADS[c.id] || HEADS[c.id].key !== key) {
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(portrait(c, 128));
    HEADS[c.id] = { img, key };
  }
  return HEADS[c.id];
}

// Head-and-shoulders portrait as an inline SVG (64 x 64 units), or the pixelated photo if there is one.
function portrait(c, size = 40) {
  if (PHOTOS[c.id]) return `<span class="portrait photo" style="width:${size}px;height:${size}px;border-color:${c.color}"><img src="${PHOTOS[c.id]}" alt="${esc(c.name)}"></span>`;
  const p = c.look, hc = p.hairColor, sk = p.skin, acc = p.acc || [], hijab = p.hair === 'hijab';
  const sash = c.sash || c.color, id = 'p' + Math.random().toString(36).slice(2, 8);
  const hair = {
    short: [``, `<path d="M20 29 Q18 13 32 13 Q46 13 44 29 Q42 19 32 19 Q23 19 20 29Z" fill="${hc}"/>`],
    swept: [``, `<path d="M20 28 Q17 12 34 12 Q48 13 44 27 Q41 18 27 21 Q22 22 20 28Z" fill="${hc}"/><path d="M27 21 Q35 15 44 22 Q38 17 27 21Z" fill="#fff" opacity=".12"/>`],
    buzz: [``, `<path d="M21 26 Q22 15 32 15 Q42 15 43 26 Q32 19 21 26Z" fill="${hc}" opacity=".85"/>`],
    long: [`<path d="M17 30 Q16 13 32 13 Q48 13 47 30 L49 53 L15 53Z" fill="${hc}"/>`, `<path d="M20 28 Q21 15 32 15 Q43 15 44 28 Q37 20 29 21 Q24 22 20 28Z" fill="${hc}"/>`],
    curly: [`<g fill="${hc}"><circle cx="20" cy="27" r="6"/><circle cx="44" cy="27" r="6"/><circle cx="19" cy="36" r="5"/><circle cx="45" cy="36" r="5"/></g>`,
      `<g fill="${hc}"><circle cx="23" cy="19" r="6"/><circle cx="32" cy="15" r="7"/><circle cx="41" cy="19" r="6"/><circle cx="20" cy="25" r="4.5"/><circle cx="44" cy="25" r="4.5"/></g>`],
    bun: [`<circle cx="32" cy="10" r="5.5" fill="${hc}"/>`, `<path d="M20 29 Q18 14 32 14 Q46 14 44 29 Q42 19 32 19 Q23 19 20 29Z" fill="${hc}"/>`],
    hijab: [`<path d="M13 56 Q11 31 18 21 Q24 11 32 11 Q40 11 46 21 Q53 31 51 56Z" fill="${hc}"/>`,
      `<ellipse cx="32" cy="31" rx="11.5" ry="13.5" fill="none" stroke="${hc}" stroke-width="3"/><ellipse cx="32" cy="31" rx="12.5" ry="14.5" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="1"/>`],
  }[p.hair] || ['', ''];
  const emblem = {
    leaf: `<path d="M-2.6 2.4 Q-3 -2.6 2.8 -2.8 Q2.8 2.6 -2.6 2.4Z M-2.6 2.4 L1.5 -1.5" fill="#4be38a" stroke="#0b3a20" stroke-width=".6"/>`,
    bearing: `<g><circle r="3.4" fill="none" stroke="#c9d4e0" stroke-width="1"/><circle r="1.25" fill="none" stroke="#c9d4e0" stroke-width=".8"/>${[0, 60, 120, 180, 240, 300].map(a => `<circle r=".62" cx="${(2.3 * Math.cos(a * Math.PI / 180)).toFixed(2)}" cy="${(2.3 * Math.sin(a * Math.PI / 180)).toFixed(2)}" fill="#eef3f8"/>`).join('')}</g>`,
    rock: `<path d="M-3 2 L-2.4 -1 L-0.4 -2.6 L2.2 -1.6 L3 1.6 Z" fill="#9b8f84" stroke="#3a3029" stroke-width=".5"/><line x1="-0.5" y1="-0.5" x2="2.8" y2="-3.4" stroke="#e08a4f" stroke-width=".9"/>`,
    star: `<path d="M0 -3.2 L0.9 -1 L3.1 -1 L1.4 0.4 L2 2.7 L0 1.3 L-2 2.7 L-1.4 0.4 L-3.1 -1 L-0.9 -1Z" fill="${c.color}"/>`,
  }[c.emblem];
  const face = hijab ? { rx: 10.5, ry: 12.5 } : { rx: 12, ry: 14 };
  const smile = p.smile === 2 ? 'M27 37 Q32 42 37 37' : 'M28.5 37.5 Q32 40 35.5 37.5';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="portrait" width="${size}" height="${size}" viewBox="0 0 64 64" aria-label="${esc(c.name)}">
    <defs><clipPath id="${id}"><circle cx="32" cy="32" r="31"/></clipPath><clipPath id="${id}b"><path d="M6 64 Q8 52 20 50 L44 50 Q56 52 58 64Z"/></clipPath></defs>
    <circle cx="32" cy="32" r="31" fill="#0a1424"/>
    <g clip-path="url(#${id})">
      ${hair[0]}
      <path d="M6 64 Q8 52 20 50 L44 50 Q56 52 58 64Z" fill="#eef3f8"/>
      <g clip-path="url(#${id}b)">
        ${c.edge ? `<line x1="10" y1="50" x2="46" y2="68" stroke="${c.edge}" stroke-width="8.5"/>` : ''}
        <line x1="10" y1="50" x2="46" y2="68" stroke="${sash}" stroke-width="6.5"/>
      </g>
      <circle cx="21" cy="58" r="4.6" fill="#0d1726" stroke="#8fa3bd" stroke-width=".7"/>
      <g transform="translate(21 58)">${emblem}</g>
      ${hijab ? '' : `<rect x="27.5" y="40" width="9" height="11" rx="3" fill="${sk}"/>`}
      ${hijab ? `<path d="M13 56 Q11 31 18 21 Q24 11 32 11 Q40 11 46 21 Q53 31 51 56 Q42 50 32 50 Q22 50 13 56Z" fill="${hc}"/>` : ''}
      <ellipse cx="32" cy="31" rx="${face.rx}" ry="${face.ry}" fill="${sk}"/>
      ${hijab ? '' : `<ellipse cx="20.3" cy="32" rx="1.8" ry="3" fill="${sk}"/><ellipse cx="43.7" cy="32" rx="1.8" ry="3" fill="${sk}"/>`}
      ${p.beard ? `<path d="M20.5 31 Q21 46 32 46 Q43 46 43.5 31 Q41 39.5 32 40 Q23 39.5 20.5 31Z" fill="${p.beard}"/><path d="M27.5 35.6 Q32 33.6 36.5 35.6 L36 36.6 Q32 35.4 28 36.6Z" fill="${p.beard}"/>` : ''}
      <g fill="#1b1f27"><ellipse cx="27.5" cy="30.5" rx="1.4" ry="1.6"/><ellipse cx="36.5" cy="30.5" rx="1.4" ry="1.6"/></g>
      <g stroke="${hijab ? '#2a1d16' : hc}" stroke-width="1.3" stroke-linecap="round" opacity=".9"><path d="M25 26.6 Q27.5 25.4 30 26.4"/><path d="M34 26.4 Q36.5 25.4 39 26.6"/></g>
      <path d="${smile}" stroke="#7a3b2e" stroke-width="1.3" fill="none" stroke-linecap="round"/>
      ${hair[1]}
      ${acc.includes('glasses') ? `<g fill="#9fd8ff" fill-opacity=".18" stroke="${p.frame || '#1c2733'}" stroke-width="1.3"><rect x="23.3" y="27.4" width="8.4" height="6.4" rx="2"/><rect x="32.3" y="27.4" width="8.4" height="6.4" rx="2"/></g><line x1="31.7" y1="29.8" x2="32.3" y2="29.8" stroke="${p.frame || '#1c2733'}" stroke-width="1.3"/>` : ''}
      ${acc.includes('earrings') && !hijab ? `<g fill="#ffd36b"><circle cx="20.2" cy="36.6" r="1.5"/><circle cx="43.8" cy="36.6" r="1.5"/></g>` : ''}
      ${acc.includes('earrings') && hijab ? `<circle cx="22" cy="40" r="1.3" fill="#ffd36b"/>` : ''}
      ${acc.includes('necklace') ? `<path d="M24 51.5 Q32 58.5 40 51.5" stroke="#ffd36b" stroke-width="1.1" fill="none"/><circle cx="32" cy="56" r="1.7" fill="#ffd36b"/>` : ''}
      ${acc.includes('pin') ? `<circle cx="42.5" cy="45.5" r="1.6" fill="#ffd36b" stroke="#8a6a1c" stroke-width=".4"/>` : ''}
    </g>
    <circle cx="32" cy="32" r="31" fill="none" stroke="${c.color}" stroke-width="2"/>
  </svg>`;
}

let S; // game state

function newGame() {
  S = {
    round: 0, phase: 'brief', t: 0, dur: 1, I: 0, supply: 14, sel: null, drag: null, ptr: null, science: 0,
    tanks: { o2: TANK.o2 * 0.7, h2o: TANK.h2o * 0.7, food: TANK.food * 0.7 },
    hours: 0, rate: { o2: 0, h2o: 0, food: 0 }, dry: false,
    sys: { o2: { lvl: 2 }, h2o: { lvl: 2 }, farm: { lvl: 2 }, shield: { lvl: 0 } },
    crew: TEAM.map(t => t.id === 'cmd'
      ? { ...t, name: CMD.name, color: CMD.color, look: { ...CMD.look, acc: [...CMD.look.acc] } }
      : { ...t, look: { ...t.look } }),
    stats: { breaks: 0 }, fx: [], banner: null, shake: 0, meet: null,
    cam: { z: 1, x: W / 2, y: H / 2, to: { z: 1, x: W / 2, y: H / 2 } },
  };
  S.crew.forEach((c, i) => Object.assign(c, { i, x: ZONES[c.zone].slot(i), y: ZONES[c.zone].floor, path: [], dir: 1, dose: 0, health: 100, out: false }));
  for (const k in S.sys) Object.assign(S.sys[k], { broken: false, repair: 0 });
  buildUI();
  render();
}

const at = z => S.crew.filter(c => !c.out && !c.path.length && c.zone === z);
const lvl = k => S.sys[k].broken ? 0 : S.sys[k].lvl;
const used = () => Object.values(S.sys).reduce((a, s) => a + s.lvl * KW_PER_LEVEL, 0);
const playing = () => ['calm', 'warning', 'storm'].includes(S.phase);

// ---------- sound + voice ----------
let muted = false, actx;
function beep(freq = 440, dur = 0.15, type = 'square') {
  if (muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq; g.gain.value = 0.05;
    o.connect(g); g.connect(actx.destination);
    o.start(); o.stop(actx.currentTime + dur);
  } catch (e) {}
}
function say(text) {
  if (muted || !window.speechSynthesis) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; u.pitch = 0.9;
    speechSynthesis.speak(u);
  } catch (e) {}
}
let capTimer;
function log(text, cls = '', speak = false) {
  const el = $('#caption');
  el.textContent = text; el.className = 'show ' + cls;
  clearTimeout(capTimer); capTimer = setTimeout(() => el.className = cls, 6000);
  if (speak) say(text);
}

// ---------- bottom bars (crew chips, power, systems) ----------
function buildUI() {
  $('#crewbar').innerHTML = '';
  S.crew.forEach(c => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.innerHTML = `${portrait(c, 40)}<div class="who"><b style="color:${c.color}">${esc(c.name)} <small>${c.name === c.role ? '' : c.role}</small></b><span class="st"></span>
      <div class="bar dose" title="Radiation dose (red line = NASA career limit)"><i></i></div></div>`;
    b.onclick = () => { S.sel = S.sel === c.id ? null : c.id; render(); };
    $('#crewbar').appendChild(b); c.el = b;
  });
  $('#systems').innerHTML = Object.entries(SYSTEMS).map(([k, s]) =>
    `<div class="sys" data-s="${k}"><div class="name">${s.icon} ${s.name} <small></small></div>
     <div class="bar"><i></i></div>
     <div class="ctl"><button data-d="-1">−</button><div class="pips"><i></i><i></i><i></i></div><button data-d="1">+</button></div>
     <button class="fix">🔧 FIX IT</button></div>`).join('');
  document.querySelectorAll('.sys .ctl button').forEach(b => b.onclick = () => setLevel(b.closest('.sys').dataset.s, +b.dataset.d));
  document.querySelectorAll('.sys .fix').forEach(b => b.onclick = () => openFix(b.closest('.sys').dataset.s));
}

function setLevel(k, d) {
  const s = S.sys[k], n = s.lvl + d;
  if (n < 0 || n > 3) return;
  if (d > 0 && used() + KW_PER_LEVEL > S.supply) { log('Not enough power. Turn something else down first.', 'warn'); beep(180, 0.1); return; }
  s.lvl = n; beep(600 + n * 80, 0.05, 'sine'); render();
}

function render() {
  document.body.className = S.phase;
  $('#round').textContent = `Storm ${Math.min(S.round + 1, EVENTS.length)} / ${EVENTS.length}`;
  $('#phase').textContent = { brief: 'STANDBY', meet: 'CREW BRIEFING', calm: 'ALL CLEAR', warning: 'STORM INCOMING', storm: 'RADIATION STORM', debrief: 'DEBRIEF', end: 'MISSION OVER' }[S.phase];
  const hps = playing() ? hoursPerSec(EVENTS[S.round]) : 1;
  $('#timer').textContent = !playing() ? '--' : S.phase === 'warning' ? Math.ceil(S.t * hps * 60) + ' min' : Math.ceil(S.t * hps) + ' h';
  $('#clock').textContent = clock(S.hours);
  $('#pwrUsed').textContent = used(); $('#pwrMax').textContent = S.supply;
  $('#pwrBar').style.width = Math.min(100, used() / S.supply * 100) + '%';
  $('#science').textContent = Math.floor(S.science);
  for (const k in S.sys) {
    const s = S.sys[k], def = SYSTEMS[k], el = document.querySelector(`.sys[data-s="${k}"]`);
    const v = def.tank ? pct(def.tank) : lvl('shield') * 20;
    el.classList.toggle('broken', s.broken);
    el.classList.toggle('low', !!def.tank && v < 25);
    el.querySelectorAll('.pips i').forEach((p, i) => p.classList.toggle('on', i < s.lvl));
    let label = v ? `-${v}% radiation` : 'off';
    if (def.tank) {
      const kg = S.tanks[def.tank], r = S.rate[def.tank];
      label = kg.toFixed(1) + ' kg' + (r < -1e-6 ? ` · ${Math.min(99, Math.floor(kg / -r))} h left` : r > 1e-6 ? ' ▲' : '');
    }
    el.querySelector('small').textContent = s.broken ? 'BROKEN' : label;
    el.querySelector('.bar i').style.width = (def.tank ? v : v / 0.6) + '%';
  }
  S.crew.forEach(c => {
    c.el.className = 'chip' + (S.sel === c.id ? ' sel' : '') + (c.out ? ' out' : '');
    c.el.querySelector('.st').textContent = c.out ? 'Evacuated to medical' : `${c.perk} · ${Math.round(c.dose * 10)} mSv`;
    c.el.querySelector('.dose i').style.width = Math.min(100, c.dose) + '%';
  });
}

// ---------- crew movement ----------
function orderMove(c, zone) {
  if (!c || c.out || !playing() || (c.zone === zone && !c.path.length)) return;
  const z = ZONES[zone], tx = z.slot(c.i);
  c.zone = zone; c.path = [];
  if (Math.abs(c.y - z.floor) > 1) {            // different level: go via the ladder shaft
    if (Math.abs(c.x - SHAFT) > 1) c.path.push([SHAFT, c.y]);
    c.path.push([SHAFT, z.floor]);
  }
  c.path.push([tx, z.floor]);
  beep(520, 0.06, 'sine');
}
function stepCrew(dt) {
  S.crew.forEach(c => {
    let d = WALK * (c.job === 'pilot' ? 2 : 1) * dt;
    while (c.path.length && d > 0) {
      const [tx, ty] = c.path[0], dx = tx - c.x, dy = ty - c.y, len = Math.hypot(dx, dy);
      if (dx) c.dir = Math.sign(dx);
      if (len <= d) { c.x = tx; c.y = ty; c.path.shift(); d -= len; }
      else { c.x += dx / len * d; c.y += dy / len * d; d = 0; }
    }
  });
}
// radiation factor depends on where the astronaut actually is right now
const radAt = c => !c.path.length ? ZONES[c.zone].rad : c.y <= SURF + 2 ? 1 : c.y < 440 ? 0.5 : c.y >= 590 ? 0.1 : 0.3;

// ---------- game loop ----------
function setPhase(p, dur, banner) { S.phase = p; S.t = S.dur = dur; if (banner) S.banner = { text: banner, t: 2.2 }; }

function startRound() {
  S.stats = { breaks: 0, hours: 0, use: { o2: 0, h2o: 0, food: 0 }, split: 0 };
  setPhase('calm', 25, 'ALL CLEAR');
  $('#modal').classList.remove('show', 'fixing');
  log('All clear. Collect science outside and keep supplies topped up.', 'good', true);
}

function tick() {
  walkClock();
  if (!playing()) return;
  const dt = DT * SPEED, ev = EVENTS[S.round];
  S.t -= dt;

  // power: solar arrays fold into safe mode during the storm
  S.supply = S.phase === 'storm' ? 10 : 14;
  let shed = false;
  for (const k of ['farm', 'h2o', 'o2', 'shield']) while (used() > S.supply && S.sys[k].lvl > 0) { S.sys[k].lvl--; shed = true; }
  if (shed) log('Solar panels folded for safety. Less power: some systems were turned down.', 'warn');

  // storm intensity rises, peaks, then fades
  S.I = S.phase === 'storm' ? ev.sev * 3 * Math.pow(Math.sin(Math.PI * (1 - S.t / S.dur)), 0.7) || 0 : 0;

  const active = S.crew.filter(c => !c.out);

  // supplies, in real kg, at NASA BVAD rates (see BVAD above)
  const h = dt * hoursPerSec(ev), T = S.tanks;
  S.hours += h; S.stats.hours += h;
  const use = { o2: 0, h2o: 0, food: 0 };            // kg per hour for the whole crew
  active.forEach(c => { const r = BVAD[activity(c)]; for (const k in use) use[k] += r[k] / 24; });
  const farmers = at('green').reduce((a, c) => a + (c.job === 'botanist' ? 2 : 1), 0);
  const makeFood = lvl('farm') ? MAKE.farm * lvl('farm') + MAKE.farmer * farmers : 0;
  const makeH2o = MAKE.h2o * lvl('h2o');
  // oxygen is made from water: no water, no oxygen
  const wantO2 = MAKE.o2 * lvl('o2');
  const makeO2 = Math.min(wantO2, Math.max(0, T.h2o + (makeH2o - use.h2o) * h) / H2O_PER_O2 / Math.max(h, 1e-9));
  if (wantO2 > 0 && makeO2 < wantO2 * 0.5 && !S.dry) { S.dry = true; log('Water tank empty! The oxygen machine needs water to make air.', 'bad', true); }
  if (makeO2 >= wantO2 * 0.5) S.dry = false;
  S.rate = { o2: makeO2 - use.o2, h2o: makeH2o - use.h2o - makeO2 * H2O_PER_O2, food: makeFood - use.food };
  for (const k in T) T[k] = Math.max(0, Math.min(TANK[k], T[k] + S.rate[k] * h));
  for (const k in use) S.stats.use[k] += use[k] * h;
  S.stats.split += makeO2 * H2O_PER_O2 * h;

  // science from the surface
  at('eva').forEach(c => {
    const g = c.job === 'geologist' ? 2 : 1;
    S.science += g * dt;
    if (Math.random() < 0.35 * dt) S.fx.push({ x: c.x, y: c.y - 70, text: '★+' + g, t: 1.2, color: '#ffb938' });
  });

  // storm breaks things
  if (S.phase === 'storm' && Math.random() < 0.05 * ev.sev * dt) {
    const ok = Object.keys(S.sys).filter(k => !S.sys[k].broken && S.sys[k].lvl > 0);
    if (ok.length) {
      const k = ok[Math.floor(Math.random() * ok.length)];
      S.sys[k].broken = true; S.sys[k].repair = 0; S.stats.breaks++; S.shake = 0.4;
      log(`${SYSTEMS[k].name} system knocked out! Send someone to the Workshop and press FIX.`, 'bad', true);
      beep(140, 0.4, 'sawtooth');
    }
  }
  // slow automatic repair while someone is in the Workshop (the mini-game is much faster)
  const broken = Object.keys(S.sys).find(k => S.sys[k].broken);
  if (broken && at('work').length) {
    S.sys[broken].repair += 4 * at('work').length * dt;
    if (S.sys[broken].repair >= 100) repaired(broken);
  }

  // radiation dose + health
  const cut = 1 - 0.2 * lvl('shield');
  active.forEach(c => {
    c.dose += S.I * radAt(c) * cut * dt;
    if (T.o2 <= 0) c.health -= 4 * dt;
    if (T.h2o <= 0) c.health -= 1.5 * dt;
    if (T.food <= 0) c.health -= 1 * dt;
    if (c.dose >= 100) c.health = 0;
    if (c.health <= 0) {
      c.health = 0; c.out = true; c.path = [];
      const heir = c.id === 'cmd' && S.crew.find(o => !o.out && o.id !== 'cmd');
      log(heir ? `Commander ${c.name} is down and has been evacuated! ${heir.name} takes command.`
        : `${c.name} is too sick to continue and has been evacuated.`, 'bad', true);
    }
  });

  if (S.phase === 'storm' && Math.round(S.t / dt) % 4 === 0) beep(330, 0.08);
  if (S.phase === 'warning' && Math.round(S.t / dt) % 4 === 0) beep(700, 0.04, 'sine');

  // phase changes
  if (!S.crew.some(c => !c.out)) endGame();
  else if (S.t <= 0) {
    if (S.phase === 'calm') {
      setPhase('warning', ev.warn, 'STORM INCOMING');
      log(`${ev.cls} solar flare detected! Radiation arrives in ${warnMins(ev)} minutes${ev.mins != null ? '' : ' (drill)'}. Everyone to the Storm Shelter!`, 'warn', true);
    } else if (S.phase === 'warning') {
      setPhase('storm', ev.storm, 'RADIATION STORM'); S.shake = 0.8;
      log('The radiation storm has reached the outpost!', 'bad', true);
    } else debrief();
  }
  render();
}

function repaired(k) {
  S.sys[k].broken = false; S.sys[k].repair = 0;
  log(`${SYSTEMS[k].name} system repaired.`, 'good'); beep(880, 0.12, 'sine');
  const [x, y] = SYSTEMS[k].at; S.fx.push({ x, y, text: '✔ FIXED', t: 1.5, color: '#4be38a' });
}

// ---------- repair mini-game: match the plugs ----------
function openFix(k) {
  if (!S.sys[k].broken || !playing()) return;
  if (!at('work').length) { log('Nobody is in the Workshop. Drag a crew member there first.', 'warn'); beep(180, 0.1); return; }
  const n = at('work').some(c => c.job === 'engineer') ? 3 : 4;
  const plugs = [['#ff4d5e', '●'], ['#37d6ff', '▲'], ['#4be38a', '■'], ['#ffb938', '◆']].slice(0, n);
  const order = plugs.map((_, i) => i).sort(() => Math.random() - 0.5);
  const btn = (i, side) => `<button data-i="${i}" data-side="${side}" style="background:${plugs[i][0]};border-color:${plugs[i][0]}">${plugs[i][1]}</button>`;
  $('#card').innerHTML = `<h2>🔧 FIX: ${SYSTEMS[k].name.toUpperCase()}</h2><p>Tap a plug on the left, then its matching socket on the right.</p>
    <div class="wires"><div>${plugs.map((_, i) => btn(i, 'L')).join('')}</div><div>${order.map(i => btn(i, 'R')).join('')}</div></div>`;
  $('#modal').classList.add('show', 'fixing');
  let picked = null, done = 0;
  $('#card').querySelectorAll('.wires button').forEach(b => b.onclick = () => {
    if (b.dataset.side === 'L') {
      $('#card').querySelectorAll('.pick').forEach(p => p.classList.remove('pick'));
      picked = b; b.classList.add('pick'); beep(500, 0.04, 'sine');
    } else if (picked && picked.dataset.i === b.dataset.i) {
      picked.classList.remove('pick'); picked.classList.add('done'); b.classList.add('done'); picked = null; beep(760, 0.06, 'sine');
      if (++done === n) { $('#modal').classList.remove('show', 'fixing'); repaired(k); render(); }
    } else beep(160, 0.15);
  });
}

// ---------- cards ----------
function crewLine(c) { return `<li>${portrait(c, 28)}<span><b style="color:${c.color}">${esc(c.name)}</b> <small>${c.name === c.role ? '' : c.role}</small>: ${c.out ? 'evacuated' : `health ${Math.round(c.health)}%`}, total dose ${Math.round(c.dose * 10)} mSv</span></li>`; }

function debrief() {
  const ev = EVENTS[S.round];
  S.phase = 'debrief'; S.I = 0;
  const worst = Math.max(...S.crew.map(c => c.dose));
  const last = S.round === EVENTS.length - 1;
  say('Storm has passed. Stand by for debrief.');
  showCard(`
    <h2>STORM ${S.round + 1} SURVIVED</h2>
    <ul class="crewlist">${S.crew.map(crewLine).join('')}</ul>
    <p>Systems knocked out: <b>${S.stats.breaks}</b> · Highest crew dose so far: <b>${Math.round(worst * 10)} mSv</b> (NASA career limit: 600 mSv)</p>
    <p class="life">Over these <b>${Math.round(S.stats.hours)} hours</b> your crew breathed <b>${S.stats.use.o2.toFixed(1)} kg</b> of oxygen,
      drank <b>${S.stats.use.h2o.toFixed(1)} kg</b> of water and ate <b>${S.stats.use.food.toFixed(1)} kg</b> of food.
      The oxygen machine split <b>${S.stats.split.toFixed(1)} kg</b> of water to make air.
      <small>Rates from NASA's Life Support Baseline Values and Assumptions Document (BVAD).</small></p>
    <h3>${ev.mins != null ? 'THIS REALLY HAPPENED' : 'REAL FLARE, PRACTICE STORM'} — ${ev.date}</h3>
    <div class="real"><b>${ev.title}.</b> ${ev.fact}</div>
    <table class="data">
      <tr><td>Flare class</td><td><b>${ev.cls}</b> (peak ${ev.peak.slice(11, 16)} UTC)</td></tr>
      ${ev.region ? `<tr><td>Sunspot region</td><td>${ev.region}${ev.loc ? ` at ${ev.loc}` : ''}</td></tr>` : ''}
      <tr><td>Real warning time</td><td>${ev.mins != null
        ? `<b>${ev.mins} minutes</b> from flare peak to radiation at ${ev.sepTime.slice(11, 16)} UTC (${ev.sepInst})`
        : 'No radiation storm recorded for this flare'}</td></tr>
    </table>
    <p class="src">${ev.fromNasa ? '● Loaded live from NASA DONKI' : '○ Saved copy of NASA DONKI data (offline)'}${ev.link ? ` · <a href="${ev.link}" target="_blank" rel="noopener">view NASA record</a>` : ''}</p>
    <button class="go" id="go">${last ? 'See final rating' : 'Next storm ▶'}</button>`,
    () => { if (last) endGame(); else { S.round++; startRound(); } });
}

function endGame() {
  S.phase = 'end'; S.I = 0;
  const alive = S.crew.filter(c => !c.out);
  const T = S.tanks;
  const score = Math.round(S.science + S.crew.reduce((a, c) => a + c.health, 0) * 2 + pct('o2') + pct('h2o') + pct('food')
    - S.crew.reduce((a, c) => a + c.dose, 0));
  let rating = score >= 1000 ? 'FLIGHT DIRECTOR' : score >= 800 ? 'MISSION COMMANDER' : score >= 550 ? 'MISSION SPECIALIST' : 'CADET — BACK TO TRAINING';
  if (alive.length < 4 && score >= 800) rating = 'MISSION SPECIALIST';
  if (!alive.length) rating = 'MISSION FAILED';
  say(`Mission over. Your flight readiness rating is ${rating}.`);
  showCard(`
    <h2>FLIGHT READINESS RATING</h2>
    <div class="rating">${rating}</div>
    <p>Score: <b>${score}</b> · Science: <b>${Math.floor(S.science)}</b> · Crew still on duty: <b>${alive.length} / 4</b></p>
    <ul class="crewlist">${S.crew.map(crewLine).join('')}</ul>
    ${S.crew[0].out && alive.length ? `<p>Commander ${esc(S.crew[0].name)} was evacuated; ${esc(alive[0].name)} brought the crew home.</p>` : ''}
    <p>Mission length: ${clock(S.hours).replace(' · ', ', ')} · Supplies left: oxygen ${T.o2.toFixed(1)} kg, water ${T.h2o.toFixed(1)} kg, food ${T.food.toFixed(1)} kg</p>
    <button class="go" id="go">Play again</button>`, () => { newGame(); intro(); });
}

function showCard(html, onGo) {
  $('#card').innerHTML = html;
  $('#modal').classList.remove('fixing'); $('#modal').classList.add('show');
  $('#go').onclick = onGo;
  render();
}

let loaded, srcText = 'Contacting NASA for solar storm data…';
function roster() {
  return `<div class="roster">${S.crew.map(c => `<div>${portrait(c, 54)}<b style="color:${c.color}">${esc(c.name)}</b><small>${c.role} · ${c.perk}</small></div>`).join('')}</div>`;
}
function intro() {
  showCard(`
    <h2>STORM WATCH</h2>
    <p>You run a Moon base. Three <b>real solar storms</b> are coming. Keep your crew safe!</p>
    ${roster()}
    <button class="custom" id="custom">🧑‍🚀 Customize your Commander</button>
    <ul class="how">
      <li>🧑‍🚀 <b>Drag astronauts</b> between rooms.</li>
      <li>⭐ Outside they collect <b>science</b>, but have no protection.</li>
      <li>🚨 When the alarm sounds, get everyone <b>down to the Storm Shelter</b>.</li>
      <li>🔧 If something breaks, send someone to the <b>Workshop</b> and press <b>FIX</b>.</li>
      <li>⚡ Use <b>+ / −</b> to share power between oxygen, water, food and the shield.</li>
      <li>💧 The oxygen machine <b>splits water to make air</b>. Run out of water and the air runs out next.</li>
      <li>⏱️ Each second is <b>one hour</b> on the base. Working outside uses the most air and water.</li>
    </ul>
    <p class="src" id="src">${srcText}</p>
    <button class="go" id="go" disabled>Begin mission ▶</button>`, meetCrew);
  $('#custom').onclick = customize;
  loaded = loaded || loadEvents();
  loaded.then(() => {
    const n = EVENTS.filter(e => e.fromNasa).length;
    srcText = n === EVENTS.length ? `● Live NASA DONKI data loaded. Storm 1 is the strongest flare of the last 30 days: ${EVENTS[0].cls} on ${EVENTS[0].date}.`
      : n ? `◐ ${n} of ${EVENTS.length} storms loaded live from NASA; the rest use saved NASA data.`
      : '○ NASA is unreachable right now. Using saved NASA DONKI data.';
    if ($('#src')) $('#src').textContent = srcText;
    if (S.phase === 'brief' && $('#go')) $('#go').disabled = false;
  });
}

// ---------- Commander customization (saved on this device) ----------
function customize() {
  const c = S.crew[0], L = CMD.look;
  const opt = (group, val, inner, on, title = '') => `<button class="opt${on ? ' on' : ''}" data-g="${group}" data-v="${esc(val)}" title="${esc(title)}">${inner}</button>`;
  const sw = col => `<i class="sw" style="background:${col}"></i>`;
  showCard(`
    <h2>YOUR COMMANDER</h2>
    <div class="cust">
      <div class="preview" id="preview">${portrait(c, 120)}</div>
      <div class="rows">
        <label>Name <input id="cname" maxlength="12" value="${esc(CMD.name)}" autocomplete="off"></label>
        <div class="row"><span>Sash</span>${CMD_COLORS.map(col => opt('color', col, sw(col), CMD.color === col)).join('')}</div>
        <div class="row"><span>Skin</span>${SKIN.map(col => opt('skin', col, sw(col), L.skin === col)).join('')}</div>
        <div class="row"><span>Hair</span>${Object.entries(STYLES).map(([k, v]) => opt('hair', k, v, L.hair === k)).join('')}</div>
        <div class="row"><span>${L.hair === 'hijab' ? 'Hijab' : 'Hair'} colour</span>${HAIR.map(col => opt('hairColor', col, sw(col), L.hairColor === col)).join('')}</div>
        <div class="row"><span>Extra</span>${Object.entries(ACCS).map(([k, v]) => opt('acc', k, v, k === 'none' ? !L.acc.length : L.acc.includes(k))).join('')}</div>
        <div class="row"><span>Facial hair</span>${opt('beard', 'none', 'None', !L.beard)}${opt('beard', 'beard', 'Beard', !!L.beard)}</div>
      </div>
    </div>
    <p class="src">Commander perk: <b>runs 2x faster</b>. Your choices are saved on this device.</p>
    <button id="rand">🎲 Randomize</button>
    <button class="go" id="go">Done ▶</button>`, () => {
      CMD.name = ($('#cname').value.trim() || 'Commander').slice(0, 12);
      saveCommander(); applyCommander(); intro();
    });
  const pick = a => a[Math.floor(Math.random() * a.length)];
  $('#card').querySelectorAll('.opt').forEach(b => b.onclick = () => {
    const gk = b.dataset.g, v = b.dataset.v;
    if (gk === 'color') CMD.color = v;
    else if (gk === 'acc') L.acc = v === 'none' ? [] : L.acc.includes(v) ? L.acc.filter(a => a !== v) : [...L.acc, v];
    else if (gk === 'beard') L.beard = v === 'beard' ? L.hairColor : undefined;
    else { L[gk] = v; if (gk === 'hairColor' && L.beard) L.beard = v; }
    CMD.name = ($('#cname').value.trim() || 'Commander').slice(0, 12);
    applyCommander(); customize(); beep(620, 0.04, 'sine');
  });
  $('#rand').onclick = () => {
    Object.assign(L, { skin: pick(SKIN), hair: pick(Object.keys(STYLES)), hairColor: pick(HAIR),
      acc: Object.keys(ACCS).filter(k => k !== 'none' && Math.random() < 0.3) });
    L.beard = L.hair !== 'hijab' && Math.random() < 0.25 ? L.hairColor : undefined;
    CMD.color = pick(CMD_COLORS);
    CMD.name = ($('#cname').value.trim() || 'Commander').slice(0, 12);
    applyCommander(); customize(); beep(620, 0.04, 'sine');
  };
  $('#cname').oninput = () => { CMD.name = $('#cname').value.trim() || 'Commander'; applyCommander(); $('#preview').innerHTML = portrait(S.crew[0], 120); };
}
function applyCommander() {
  const c = S.crew[0];
  Object.assign(c, { name: CMD.name, color: CMD.color, look: { ...CMD.look, acc: [...CMD.look.acc] } });
  buildUI(); render();
}

// ---------- crew introduction: zoom to each astronaut, helmet off, speech bubble ----------
const MEET_LINES = {
  cmd: c => `${c.name === 'Commander' ? "I'm your Commander." : `I'm ${c.name}, your Commander.`} I move twice as fast, so send me when something breaks in the middle of a storm.`,
  brian: () => `Brian, Engineer. When a machine goes down, I bring it back. Repairs are easier with me in the Workshop.`,
  sidra: () => `Sidra, Botanist. Keep me in the Greenhouse and I'll grow twice the food.`,
  quan: () => `Quan, Geologist. Send me outside and I'll bring back twice the science. Just get me inside before the storm hits!`,
};
let meetTimer;
function meetCrew() {
  $('#modal').classList.remove('show');
  S.phase = 'meet'; S.meet = { i: -1 };
  nextMeet();
}
function nextMeet() {
  clearTimeout(meetTimer);
  if (!S.meet) return;
  const i = S.meet.i + 1;
  if (i >= S.crew.length) return endMeet();
  const c = S.crew[i];
  S.meet = { i, c };
  S.cam.to = { z: 2.6, x: c.x, y: c.y - 40 };
  const el = $('#meet');
  el.innerHTML = `<div class="who">${portrait(c, 72)}<div><b style="color:${c.color}">${esc(c.name)}</b><small>${c.role} · ${c.perk}</small></div></div>
    <p>${esc(MEET_LINES[c.id](c))}</p>
    <div class="btns"><button id="mskip">Skip intro</button><button id="mnext" class="go">${i === S.crew.length - 1 ? 'Start mission ▶' : 'Next ▶'}</button></div>`;
  el.style.borderColor = c.color; el.className = 'show';
  $('#mnext').onclick = nextMeet; $('#mskip').onclick = endMeet;
  beep(620 + i * 70, 0.07, 'sine');
  render();
  meetTimer = setTimeout(nextMeet, 6000);
}
function endMeet() {
  clearTimeout(meetTimer);
  if (!S.meet) return;
  S.meet = null; S.cam.to = { z: 1, x: W / 2, y: H / 2 };
  $('#meet').className = '';
  startRound();
}

// ---------- pointer input on the scene ----------
const cv = $('#scene'), g = cv.getContext('2d');
const toWorld = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H]; };
const zoneAt = (x, y) => Object.keys(ZONES).find(k => { const z = ZONES[k]; return x >= z.x && x <= z.x + z.w && y >= z.y - 10 && y <= z.y + z.h + 10; });
const crewAt = (x, y) => S.crew.find(c => !c.out && Math.abs(x - c.x) < 24 && y > c.y - 78 && y < c.y + 12);
const fixAt = (x, y) => Object.keys(SYSTEMS).find(k => S.sys[k].broken && Math.hypot(x - SYSTEMS[k].at[0], y - SYSTEMS[k].at[1]) < 26);
let downAt = null;

cv.addEventListener('pointerdown', e => {
  if (!playing()) return;
  const [x, y] = toWorld(e), fk = fixAt(x, y), c = crewAt(x, y);
  if (fk) return openFix(fk);
  if (c) { S.drag = S.sel = c.id; S.ptr = [x, y]; downAt = [x, y]; cv.setPointerCapture(e.pointerId); }
  else { const z = zoneAt(x, y); if (z && S.sel) { orderMove(S.crew.find(c => c.id === S.sel), z); S.sel = null; } }
  render();
});
cv.addEventListener('pointermove', e => { S.ptr = toWorld(e); });
cv.addEventListener('pointerup', e => {
  if (!S.drag) return;
  const [x, y] = toWorld(e), c = S.crew.find(c => c.id === S.drag), moved = Math.hypot(x - downAt[0], y - downAt[1]) > 12;
  S.drag = null;
  if (moved) { const z = zoneAt(x, y); if (z) orderMove(c, z); S.sel = null; }
  render();
});

// ---------- drawing ----------
const stars = Array.from({ length: 140 }, () => [Math.random() * W, Math.random() * SURF, Math.random() * 1.4 + 0.3]);
const rain = Array.from({ length: 110 }, () => ({ p: Math.random(), o: Math.random() * 1500 - 250, depth: Math.random() }));
const rocks = Array.from({ length: 60 }, () => [Math.random() * W, SURF + 20 + Math.random() * (H - SURF - 20), 2 + Math.random() * 6]);

function rr(x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); }
function circ(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, 7); }
function txt(s, x, y, size = 13, color = '#cfe6ff', align = 'left', font = 'Consolas, monospace') {
  g.font = `bold ${size}px ${font}`; g.fillStyle = color; g.textAlign = align; g.fillText(s, x, y);
}

function drawSky(ts) {
  const sky = g.createLinearGradient(0, 0, 0, SURF);
  sky.addColorStop(0, '#02040a'); sky.addColorStop(1, S.phase === 'storm' ? '#2a0a12' : '#0a1424');
  g.fillStyle = sky; g.fillRect(0, 0, W, SURF);
  g.fillStyle = '#b9cfe8'; stars.forEach(([x, y, r]) => g.fillRect(x, y, r, r));
  // Earth
  circ(1090, 62, 22); g.fillStyle = '#2a6fd6'; g.fill();
  g.save(); circ(1090, 62, 22); g.clip();
  g.fillStyle = '#3fae6a'; circ(1082, 56, 9); g.fill(); circ(1100, 72, 7); g.fill();
  g.fillStyle = 'rgba(2,4,10,.55)'; circ(1104, 62, 24); g.fill(); g.restore();
  // Sun
  const hot = S.phase === 'warning' || S.phase === 'storm';
  const R = 120 + (hot ? 45 : 0) + Math.sin(ts / 280) * 8;
  const sg = g.createRadialGradient(60, 50, 8, 60, 50, R);
  sg.addColorStop(0, '#fffbe0'); sg.addColorStop(0.3, hot ? '#ff7a1f' : '#ffc23d'); sg.addColorStop(1, 'rgba(255,120,30,0)');
  g.fillStyle = sg; g.fillRect(0, 0, 300, SURF);
  // storm front racing toward the base
  if (S.phase === 'warning') {
    const p = 1 - S.t / S.dur;
    g.lineWidth = 5;
    for (let i = 0; i < 4; i++) {
      g.strokeStyle = `rgba(255,${110 + i * 20},60,${0.9 - i * 0.2})`;
      g.beginPath(); g.arc(60, 50, Math.max(1, 40 + p * 600 - i * 22), -0.15, 1.1); g.stroke();
    }
  }
}

function drawGround() {
  const gr = g.createLinearGradient(0, SURF, 0, H);
  gr.addColorStop(0, '#5b5f68'); gr.addColorStop(0.08, '#3a3d45'); gr.addColorStop(1, '#1d1f25');
  g.fillStyle = gr; g.fillRect(0, SURF, W, H - SURF);
  g.fillStyle = 'rgba(0,0,0,.22)'; rocks.forEach(([x, y, r]) => { circ(x, y, r); g.fill(); });
  g.fillStyle = '#8a8f99'; g.fillRect(0, SURF - 2, W, 4);
  // craters on the surface
  g.fillStyle = '#4a4e57'; [[60, 30], [470, 22], [1150, 36]].forEach(([x, w]) => { g.beginPath(); g.ellipse(x, SURF + 3, w, 5, 0, 0, 7); g.fill(); });
}

function drawSurface(ts) {
  // rover + sample rocks (where EVA crew work)
  g.fillStyle = '#c9d2dc'; rr(62, 222, 46, 16, 4); g.fill();
  g.fillStyle = '#37d6ff'; g.fillRect(70, 212, 18, 10);
  g.fillStyle = '#2b2f36'; circ(72, 242, 8); g.fill(); circ(98, 242, 8); g.fill();
  g.fillStyle = '#767b85'; [[180, 6], [262, 8], [345, 5], [430, 7]].forEach(([x, r]) => { circ(x, SURF - r + 2, r); g.fill(); });
  // airlock dome over the shaft
  g.fillStyle = '#aab4c0'; g.beginPath(); g.arc(SHAFT, SURF, 34, Math.PI, 0); g.fill();
  g.fillStyle = '#0d1726'; rr(SHAFT - 12, SURF - 26, 24, 26, 4); g.fill();
  // solar panels: tilted to the Sun, folded flat in a storm
  const fold = S.phase === 'storm';
  [760, 860, 960, 1060].forEach(x => {
    g.strokeStyle = '#9aa4b0'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, SURF); g.lineTo(x, SURF - (fold ? 10 : 34)); g.stroke();
    g.save(); g.translate(x, SURF - (fold ? 10 : 34)); g.rotate(fold ? 0 : -0.5);
    g.fillStyle = fold ? '#27384f' : '#2f6fd0'; g.fillRect(-38, -4, 76, 8);
    g.strokeStyle = '#9fc4ff'; g.lineWidth = 1; for (let i = -38; i <= 38; i += 19) { g.beginPath(); g.moveTo(i, -4); g.lineTo(i, 4); g.stroke(); }
    g.restore();
  });
  txt(fold ? 'SOLAR PANELS FOLDED' : 'SOLAR PANELS', 910, SURF - 62, 11, fold ? '#ff9aa4' : '#6f8bab', 'center');
}

function drawRoom(k, ts) {
  const z = ZONES[k], storm = S.phase === 'storm', sh = lvl('shield');
  const hover = S.drag && S.ptr && zoneAt(S.ptr[0], S.ptr[1]) === k;
  if (sh) { g.shadowColor = '#37d6ff'; g.shadowBlur = 8 + sh * 8; }
  rr(z.x, z.y, z.w, z.h, 14);
  g.fillStyle = k === 'shelter' ? '#12283a' : '#16202e'; g.fill();
  g.shadowBlur = 0;
  g.lineWidth = k === 'shelter' ? 9 : 4;
  g.strokeStyle = hover ? '#ffffff' : sh ? '#37d6ff' : k === 'shelter' ? '#3f8f66' : '#52607a'; g.stroke();
  g.fillStyle = '#2a3446'; g.fillRect(z.x + 6, z.floor, z.w - 12, 6);
  txt(z.name, z.x + 14, z.y + 22, 13, '#cfe6ff');
  txt(z.tag, z.x + z.w - 14, z.y + 22, 11, k === 'shelter' ? '#4be38a' : '#6f8bab', 'right');
}

function drawMachines(ts) {
  const T = S.tanks, blink = Math.sin(ts / 90) > 0;
  // greenhouse: grow lights + plants that grow with the food supply
  const gz = ZONES.green, lit = lvl('farm');
  g.fillStyle = lit ? `rgba(200,110,255,${0.25 + lit * 0.2})` : '#222a38'; g.fillRect(gz.x + 40, gz.y + 34, gz.w - 80, 6);
  if (lit) { const lg = g.createLinearGradient(0, gz.y + 40, 0, gz.floor); lg.addColorStop(0, `rgba(200,110,255,${0.08 * lit})`); lg.addColorStop(1, 'rgba(200,110,255,0)'); g.fillStyle = lg; g.fillRect(gz.x + 40, gz.y + 40, gz.w - 80, 90); }
  for (let i = 0; i < 7; i++) {
    const px = gz.x + 45 + i * 44, hgt = 8 + pct('food') * 0.42;
    g.fillStyle = '#5a4634'; g.fillRect(px - 12, gz.floor - 8, 24, 8);
    g.strokeStyle = pct('food') < 25 ? '#9a8f3a' : '#4be38a'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(px, gz.floor - 8); g.lineTo(px + Math.sin(ts / 700 + i) * 2, gz.floor - 8 - hgt); g.stroke();
    g.fillStyle = g.strokeStyle; g.beginPath(); g.ellipse(px - 6, gz.floor - 8 - hgt * 0.6, 7, 3, -0.5, 0, 7); g.fill();
    g.beginPath(); g.ellipse(px + 6, gz.floor - 8 - hgt * 0.85, 7, 3, 0.5, 0, 7); g.fill();
  }
  // workshop: oxygen and water tanks double as supply gauges
  [['o2', 715, '#9fe8ff', 'O₂'], ['h2o', 885, '#3d8bff', 'H₂O']].forEach(([k, x, col, label]) => {
    const y0 = 335, hh = 80, v = pct(k) / 100, dead = S.sys[k].broken;
    g.fillStyle = '#0a1220'; rr(x - 24, y0, 48, hh, 10); g.fill();
    g.save(); rr(x - 24, y0, 48, hh, 10); g.clip();
    g.fillStyle = v < 0.25 ? '#ff4d5e' : col; g.globalAlpha = dead ? 0.35 : 0.85; g.fillRect(x - 24, y0 + hh * (1 - v), 48, hh * v);
    g.restore(); g.globalAlpha = 1;
    g.lineWidth = 3; g.strokeStyle = dead ? (blink ? '#ff4d5e' : '#5a1f28') : '#8fa3bd'; rr(x - 24, y0, 48, hh, 10); g.stroke();
    txt(label, x, y0 + hh / 2 + 5, 14, '#06101c', 'center');
  });
  // shield pump on top of the shelter
  const sh = lvl('shield');
  g.fillStyle = sh ? '#37d6ff' : '#3a4558'; rr(SHAFT - 44, 458, 26, 14, 4); g.fill(); rr(SHAFT + 18, 458, 26, 14, 4); g.fill();
  // broken: sparks + FIX bubble
  for (const k in SYSTEMS) if (S.sys[k].broken) {
    const [x, y] = SYSTEMS[k].at;
    g.strokeStyle = '#ffe36b'; g.lineWidth = 2;
    for (let i = 0; i < 5; i++) { const a = Math.random() * 7, r = 18 + Math.random() * 22; g.beginPath(); g.moveTo(x + Math.cos(a) * 14, y + Math.sin(a) * 14); g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.stroke(); }
    circ(x, y, 18 + Math.sin(ts / 120) * 3); g.fillStyle = '#ff4d5e'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#fff'; g.stroke();
    txt('🔧', x, y + 6, 17, '#fff', 'center', 'sans-serif');
    txt('FIX', x, y + 36, 11, '#ff9aa4', 'center');
  }
}

function drawShaft() {
  g.fillStyle = '#16202e'; g.fillRect(SHAFT - 18, SURF, 36, 222);
  g.strokeStyle = '#52607a'; g.lineWidth = 3; g.strokeRect(SHAFT - 18, SURF, 36, 222);
  g.strokeStyle = '#8fa3bd'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(SHAFT - 8, SURF); g.lineTo(SHAFT - 8, 590); g.moveTo(SHAFT + 8, SURF); g.lineTo(SHAFT + 8, 590); g.stroke();
  for (let y = SURF + 10; y < 590; y += 14) { g.beginPath(); g.moveTo(SHAFT - 8, y); g.lineTo(SHAFT + 8, y); g.stroke(); }
  // doorways into the two side rooms
  g.fillStyle = '#16202e'; g.fillRect(SHAFT - 24, 380, 48, 42);
}

function drawAstro(c, x, y, ts, alpha = 1) {
  const walking = c.path.length && alpha === 1, climbing = walking && Math.abs(c.x - SHAFT) < 1 && c.path[0][0] === SHAFT;
  const sw = walking ? Math.sin(ts / 80) * 6 : 0;
  g.save(); g.globalAlpha = alpha;
  if (S.sel === c.id && alpha === 1) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.ellipse(x, y + 2, 20, 6, 0, 0, 7); g.stroke(); }
  g.strokeStyle = '#dfe6ee'; g.lineWidth = 6; g.lineCap = 'round';
  g.beginPath(); g.moveTo(x - 5, y - 16); g.lineTo(x - 5 - (climbing ? 0 : sw), y - (climbing ? Math.max(0, sw) : 0));
  g.moveTo(x + 5, y - 16); g.lineTo(x + 5 + (climbing ? 0 : sw), y - (climbing ? Math.max(0, -sw) : 0)); g.stroke();
  g.fillStyle = '#9aa7b6'; rr(x + (c.dir > 0 ? -17 : 9), y - 40, 8, 20, 3); g.fill();  // backpack
  g.fillStyle = '#eef3f8'; rr(x - 10, y - 40, 20, 26, 6); g.fill();
  // role sash across the chest + emblem badge
  g.save(); rr(x - 10, y - 40, 20, 26, 6); g.clip();
  const sx = c.dir > 0 ? 1 : -1;
  if (c.edge) { g.strokeStyle = c.edge; g.lineWidth = 7; g.beginPath(); g.moveTo(x - 11 * sx, y - 41); g.lineTo(x + 11 * sx, y - 17); g.stroke(); }
  g.strokeStyle = c.sash || c.color; g.lineWidth = 5; g.beginPath(); g.moveTo(x - 11 * sx, y - 41); g.lineTo(x + 11 * sx, y - 17); g.stroke();
  g.restore();
  drawEmblem(c, x + 4.5 * sx, y - 34);
  g.strokeStyle = '#eef3f8'; g.lineWidth = 5;
  g.beginPath(); g.moveTo(x - 9, y - 34); g.lineTo(x - 14 + sw * 0.6, y - 20); g.moveTo(x + 9, y - 34); g.lineTo(x + 14 - sw * 0.6, y - 20); g.stroke();
  if (S.meet && S.meet.c === c && alpha === 1) {
    // crew introduction: helmet off, showing the photo or drawn portrait
    const h = headFor(c);
    g.save(); circ(x, y - 51, 13); g.fillStyle = '#0a1424'; g.fill(); g.clip();
    if (h.img.complete && h.img.naturalWidth) {
      g.imageSmoothingEnabled = !h.photo;
      const w = h.img.naturalWidth;
      if (h.photo) g.drawImage(h.img, x - 13, y - 64, 26, 26);
      else g.drawImage(h.img, w * 14 / 64, w * 10 / 64, w * 36 / 64, w * 36 / 64, x - 13, y - 64, 26, 26);
    }
    g.restore(); g.imageSmoothingEnabled = true;
    g.strokeStyle = c.color; g.lineWidth = 1.5; circ(x, y - 51, 13); g.stroke();
    g.fillStyle = '#c9d2dc'; rr(x - 9, y - 40, 18, 4, 2); g.fill();   // suit neck ring
  } else {
    circ(x, y - 50, 12); g.fillStyle = '#eef3f8'; g.fill();
    // visor: the face shows through, then a tinted glass reflection
    const vx = x + c.dir * 3, L = c.look;
    g.fillStyle = '#16263a'; g.beginPath(); g.ellipse(vx, y - 50, 7, 6, 0, 0, 7); g.fill();
    g.save(); g.beginPath(); g.ellipse(vx, y - 50, 7, 6, 0, 0, 7); g.clip();
    if (L.hair === 'hijab') { g.fillStyle = L.hairColor; g.fillRect(vx - 7, y - 56, 14, 12); }
    else { g.fillStyle = L.hairColor; g.fillRect(vx - 7, y - 57, 14, 4); }
    g.fillStyle = L.skin; g.beginPath(); g.ellipse(vx + c.dir * 1, y - 49, 4.6, 4.8, 0, 0, 7); g.fill();
    g.fillStyle = 'rgba(30,60,95,.35)'; g.fillRect(vx - 7, y - 56, 14, 12);
    g.restore();
    g.fillStyle = 'rgba(255,255,255,.75)'; circ(vx + c.dir * 4, y - 53, 1.3); g.fill();
  }
  g.lineCap = 'butt';
  if (alpha === 1 && !(S.meet && S.meet.c === c)) {
    txt(c.name, x, y - 70, 12, c.color, 'center', '"Segoe UI", sans-serif');
    g.fillStyle = '#081120'; g.fillRect(x - 16, y - 66, 32, 4);
    g.fillStyle = c.dose > 60 ? '#ff4d5e' : '#ffb938'; g.fillRect(x - 16, y - 66, 32 * Math.min(1, c.dose / 100), 4);
  }
  g.restore();
}

function drawEmblem(c, x, y) {
  g.fillStyle = '#0d1726'; circ(x, y, 4.2); g.fill();
  if (c.emblem === 'leaf') { g.fillStyle = '#4be38a'; g.beginPath(); g.ellipse(x, y, 2.6, 1.4, -0.7, 0, 7); g.fill(); }
  else if (c.emblem === 'bearing') {   // ball bearing: outer ring, inner ring, balls between
    g.strokeStyle = '#c9d4e0'; g.lineWidth = 0.9; circ(x, y, 3.3); g.stroke(); circ(x, y, 1.1); g.stroke();
    g.fillStyle = '#eef3f8'; for (let a = 0; a < 6; a++) { circ(x + Math.cos(a * Math.PI / 3) * 2.2, y + Math.sin(a * Math.PI / 3) * 2.2, 0.55); g.fill(); }
  }
  else if (c.emblem === 'rock') { g.fillStyle = '#b3a596'; g.beginPath(); g.moveTo(x - 2.6, y + 1.8); g.lineTo(x - 1.8, y - 1.2); g.lineTo(x + 0.6, y - 2.2); g.lineTo(x + 2.6, y + 1.8); g.fill(); }
  else { g.fillStyle = c.color; g.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 1.2 : 2.8, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.fill(); }
}

function drawStorm(ts, dt) {
  if (S.phase !== 'storm') return;
  const k = Math.min(1, S.I / 5), sh = lvl('shield');
  g.lineWidth = 2;
  rain.forEach(r => {
    r.p += dt * (0.9 + r.depth * 0.5); if (r.p > 1) { r.p = 0; r.o = Math.random() * 1500 - 250; r.depth = Math.random(); }
    // streaks fall from the Sun's side; most stop in the first metres of soil, few reach the deep shelter
    const maxY = SURF + r.depth * r.depth * 330 * (1 - sh * 0.15), y = r.p * (H + 60) - 40;
    if (y > maxY) return;
    const x = r.o + y * 0.55, a = (y < SURF ? 0.75 : 0.75 * (1 - (y - SURF) / (maxY - SURF + 1))) * (0.3 + k * 0.7);
    g.strokeStyle = `rgba(255,95,80,${a})`; g.beginPath(); g.moveTo(x, y); g.lineTo(x - 12, y - 22); g.stroke();
  });
  g.fillStyle = `rgba(255,30,50,${0.06 + k * 0.1 * (0.6 + 0.4 * Math.sin(ts / 150))})`; g.fillRect(0, 0, W, H);
}

// Crew walk on a real-time clock, called from both the draw loop and the game tick,
// so they keep moving at full speed even if the browser slows down drawing.
let lastWalk = performance.now();
function walkClock() {
  const now = performance.now(), dt = Math.min(1, (now - lastWalk) / 1000); lastWalk = now;
  if (playing()) stepCrew(dt * SPEED);
}

let lastTs = 0;
function draw(ts) {
  const dt = Math.min(0.1, (ts - lastTs) / 1000) || 0; lastTs = ts;
  walkClock();
  // camera: eases toward its target (used by the crew introduction)
  const cam = S.cam, ease = 1 - Math.pow(0.03, dt);
  for (const k of ['z', 'x', 'y']) cam[k] += (cam.to[k] - cam[k]) * ease;
  const cx = Math.max(W / 2 / cam.z, Math.min(W - W / 2 / cam.z, cam.x)), cy = Math.max(H / 2 / cam.z, Math.min(H - H / 2 / cam.z, cam.y));
  g.setTransform(2 * cam.z, 0, 0, 2 * cam.z, 2 * (W / 2 - cam.z * cx), 2 * (H / 2 - cam.z * cy));
  if (S.shake > 0) { S.shake -= dt; g.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10); }
  drawSky(ts); drawGround(); drawSurface(ts); drawShaft();
  ['green', 'work', 'shelter'].forEach(k => drawRoom(k, ts));
  if (S.drag && S.ptr && zoneAt(S.ptr[0], S.ptr[1]) === 'eva') { g.strokeStyle = '#fff'; g.lineWidth = 2; g.setLineDash([8, 6]); rr(34, 120, 512, 128, 12); g.stroke(); g.setLineDash([]); }
  txt('MOON SURFACE', 44, 142, 13, '#cfe6ff'); txt('no protection', 44, 158, 11, '#ffb938');
  drawMachines(ts);
  S.crew.filter(c => !c.out).sort((a, b) => a.y - b.y).forEach(c => drawAstro(c, c.x, c.y, ts));
  drawStorm(ts, dt);
  // dragged astronaut ghost
  if (S.drag && S.ptr) drawAstro(S.crew.find(c => c.id === S.drag), S.ptr[0], S.ptr[1] + 30, ts, 0.6);
  // floating texts
  S.fx = S.fx.filter(f => (f.t -= dt) > 0);
  S.fx.forEach(f => { g.globalAlpha = Math.min(1, f.t); txt(f.text, f.x, f.y - (1.5 - f.t) * 22, 15, f.color, 'center'); g.globalAlpha = 1; });
  // radiation meter
  txt('RADIATION', 1040, 112, 11, '#6f8bab', 'right'); g.fillStyle = '#081120'; g.fillRect(1048, 102, 120, 11);
  g.fillStyle = '#ff4d5e'; g.fillRect(1048, 102, 120 * Math.min(1, S.I / 7.2), 11);
  // big phase banner
  if (S.banner && (S.banner.t -= dt) > 0) {
    g.globalAlpha = Math.min(1, S.banner.t);
    txt(S.banner.text, W / 2, 200, 54, S.phase === 'storm' ? '#ff4d5e' : S.phase === 'warning' ? '#ffb938' : '#4be38a', 'center');
    g.globalAlpha = 1;
  }
  requestAnimationFrame(draw);
}

$('#mute').onclick = () => { muted = !muted; $('#mute').textContent = muted ? '🔇' : '🔊'; if (muted && window.speechSynthesis) speechSynthesis.cancel(); };

newGame();
intro();
setInterval(tick, DT * 1000);
requestAnimationFrame(draw);
