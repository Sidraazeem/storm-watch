// STORM WATCH: the crew (team portraits, Commander customization, crew introduction).
// Moved out of game.js unchanged so the main file stays readable.
let S; // game state (shared by all scripts)

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
    color: '#4be38a', look: { skin: '#c08a5f', hair: 'hijab', hairColor: '#5e2d55', frame: '#3b2a2e', smile: 1, acc: ['glasses', 'pin'] } },
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
// Put a picture at crew/brian.jpg, crew/sidra.jpg or crew/quan.jpg (square, head and shoulders).
// Until a picture is there, the drawn portrait below is used instead.
// The team uses cartoon avatars, shown as they are (PHOTO_PX = 0). To turn real photos into
// pixel art instead, set PHOTO_PX to a pixel size such as 40 (lower = chunkier pixels).
const PHOTO_PX = 0;
const PHOTOS = {};     // crew id -> pixelated photo (data URL)
const HEADS = {};      // crew id -> image used for the helmet-off head in the scene
function loadPhoto(id, src) {
  const img = new Image();
  img.onload = () => {
    const art = !PHOTO_PX, n = art ? 256 : PHOTO_PX, cv = document.createElement('canvas'); cv.width = cv.height = n;
    const x = cv.getContext('2d'), s = Math.min(img.width, img.height);
    x.imageSmoothingQuality = 'high';
    x.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, n, n);   // centre square crop
    if (!art) {                                                                       // pixel art: fewer colours = retro look
      const d = x.getImageData(0, 0, n, n);
      for (let i = 0; i < d.data.length; i += 4) for (let k = 0; k < 3; k++) d.data[i + k] = Math.round(d.data[i + k] / 255 * 7) / 7 * 255;
      x.putImageData(d, 0, 0);
    }
    PHOTOS[id] = cv.toDataURL();
    const h = new Image(); h.src = PHOTOS[id]; HEADS[id] = { img: h, photo: true, art };
    if (S) { buildUI(); render(); const r = document.querySelector('.roster'); if (r) r.outerHTML = roster(); }   // also refresh the start screen
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
  if (PHOTOS[c.id]) return `<span class="portrait photo${PHOTO_PX ? '' : ' art'}" style="width:${size}px;height:${size}px;border-color:${c.color}"><img src="${PHOTOS[c.id]}" alt="${esc(c.name)}"></span>`;
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
  SFX.crewSay(c, MEET_LINES[c.id](c));
  render();
  meetTimer = setTimeout(nextMeet, 11000);
}
function endMeet() {
  clearTimeout(meetTimer);
  if (!S.meet) return;
  S.meet = null; S.cam.to = { z: 1, x: W / 2, y: H / 2 };
  $('#meet').className = '';
  afterMeet();
}
