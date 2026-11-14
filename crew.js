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

// Head-and-shoulders portrait, or the team member's picture if there is one.
// Drawn as an inline SVG (100 x 100 units) in the same cartoon style as the team avatars:
// outlined face, white suit with a neck ring, role sash and a shoulder patch, dark navy background.
const INK = '#1c2230';
function shade(hex, f) {                       // darken (f < 1) or lighten (f > 1) a #rrggbb colour
  const n = parseInt(hex.slice(1), 16), ch = s => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return '#' + [16, 8, 0].map(s => ch(s).toString(16).padStart(2, '0')).join('');
}
function portrait(c, size = 40) {
  if (PHOTOS[c.id]) return `<span class="portrait photo${PHOTO_PX ? '' : ' art'}" style="width:${size}px;height:${size}px;border-color:${c.color}"><img src="${PHOTOS[c.id]}" alt="${esc(c.name)}"></span>`;
  const p = c.look, hc = p.hairColor, sk = p.skin, skD = shade(sk, 0.82), acc = p.acc || [], hijab = p.hair === 'hijab';
  const sash = c.sash || c.color, id = 'p' + Math.random().toString(36).slice(2, 8);
  const ol = `stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"`;
  const hl = shade(hc, 1.6);
  // [behind the head, in front of the face]
  const hair = {
    short: ['', `<path d="M27 41 Q23 15 50 14 Q77 15 73 41 Q70 27 59 25 Q51 30 41 26 Q31 29 27 41Z" fill="${hc}" ${ol}/><path d="M40 20 Q50 16 62 20" stroke="${hl}" stroke-width="1.4" fill="none" opacity=".5"/>`],
    swept: ['', `<path d="M26 44 Q20 13 53 13 Q80 14 74 40 Q73 27 63 23 Q52 21 44 30 Q36 37 30 46Z" fill="${hc}" ${ol}/><path d="M47 18 Q58 15 68 22" stroke="${hl}" stroke-width="1.4" fill="none" opacity=".5"/>`],
    buzz: ['', `<path d="M28 34 Q31 16 50 16 Q69 16 72 34 Q62 24 50 24 Q38 24 28 34Z" fill="${hc}" ${ol}/>`],
    long: [`<path d="M24 42 Q20 13 50 12 Q80 13 76 42 L81 76 Q50 82 19 76Z" fill="${hc}" ${ol}/>`,
      `<path d="M27 40 Q25 15 50 14 Q75 15 73 40 Q68 24 54 22 Q50 27 46 22 Q32 24 27 40Z" fill="${hc}" ${ol}/>`],
    curly: [`<g fill="${hc}" ${ol}><circle cx="25" cy="40" r="8"/><circle cx="75" cy="40" r="8"/><circle cx="24" cy="53" r="7"/><circle cx="76" cy="53" r="7"/></g>`,
      `<g fill="${hc}" ${ol}><circle cx="30" cy="30" r="8"/><circle cx="40" cy="20" r="9"/><circle cx="55" cy="17" r="9.5"/><circle cx="68" cy="24" r="8.5"/><circle cx="73" cy="34" r="6.5"/><circle cx="27" cy="38" r="6"/></g>`],
    bun: [`<circle cx="50" cy="10" r="8.5" fill="${hc}" ${ol}/>`,
      `<path d="M27 41 Q23 16 50 15 Q77 16 73 41 Q70 26 50 24 Q30 26 27 41Z" fill="${hc}" ${ol}/>`],
    hijab: [`<path d="M19 74 Q14 42 25 25 Q35 10 50 10 Q65 10 75 25 Q86 42 81 74 Q66 82 50 82 Q34 82 19 74Z" fill="${hc}" ${ol}/>`,
      `<ellipse cx="50" cy="43" rx="22.5" ry="24.5" fill="none" stroke="${hc}" stroke-width="4"/><path d="M33 22 Q50 12 67 22" stroke="${hl}" stroke-width="1.6" fill="none" opacity=".45"/>`],
  }[p.hair] || ['', ''];
  const emblem = {
    leaf: `<path d="M-2.6 2.4 Q-3 -2.6 2.8 -2.8 Q2.8 2.6 -2.6 2.4Z M-2.6 2.4 L1.5 -1.5" fill="#4be38a" stroke="#0b3a20" stroke-width=".6"/>`,
    bearing: `<g><circle r="3.4" fill="none" stroke="#4f5d70" stroke-width="1"/><circle r="1.25" fill="none" stroke="#4f5d70" stroke-width=".8"/>${[0, 60, 120, 180, 240, 300].map(a => `<circle r=".62" cx="${(2.3 * Math.cos(a * Math.PI / 180)).toFixed(2)}" cy="${(2.3 * Math.sin(a * Math.PI / 180)).toFixed(2)}" fill="#4f5d70"/>`).join('')}</g>`,
    rock: `<path d="M-3 2 L-2.4 -1 L-0.4 -2.6 L2.2 -1.6 L3 1.6 Z" fill="#9b8f84" stroke="#3a3029" stroke-width=".5"/><line x1="-0.5" y1="-0.5" x2="2.8" y2="-3.4" stroke="#e08a4f" stroke-width=".9"/>`,
    star: `<path d="M0 -3.2 L0.9 -1 L3.1 -1 L1.4 0.4 L2 2.7 L0 1.3 L-2 2.7 L-1.4 0.4 L-3.1 -1 L-0.9 -1Z" fill="${c.color}" stroke="${INK}" stroke-width=".4"/>`,
  }[c.emblem];
  const face = hijab ? { rx: 20.5, ry: 22.5 } : { rx: 22, ry: 24.5 };
  const brow = hijab ? '#3a2a22' : shade(hc, 0.85);
  const smile = p.smile === 2 ? 'M41 55 Q50 62 59 55' : 'M43 55.5 Q50 60 57 55.5';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="portrait" width="${size}" height="${size}" viewBox="0 0 100 100" aria-label="${esc(c.name)}">
    <defs><clipPath id="${id}"><circle cx="50" cy="50" r="48.5"/></clipPath><clipPath id="${id}b"><path d="M6 104 Q8 78 31 72 L69 72 Q92 78 94 104Z"/></clipPath></defs>
    <circle cx="50" cy="50" r="48.5" fill="#0a1424"/>
    <g clip-path="url(#${id})"><g transform="translate(50 46) scale(1.12) translate(-50 -50)">
      ${hair[0]}
      <path d="M6 104 Q8 78 31 72 L69 72 Q92 78 94 104Z" fill="#eef3f8" ${ol}/>
      <g clip-path="url(#${id}b)">
        <path d="M20 86 Q24 94 26 104 M80 86 Q76 94 74 104" stroke="#c9d4e0" stroke-width="2" fill="none"/>
        ${c.edge ? `<line x1="34" y1="106" x2="86" y2="72" stroke="${c.edge}" stroke-width="14"/>` : ''}
        <line x1="34" y1="106" x2="86" y2="72" stroke="${sash}" stroke-width="11"/>
      </g>
      <circle cx="24" cy="84" r="7" fill="#dfe8f2" ${ol}/>
      <g transform="translate(24 84) scale(1.35)">${emblem}</g>
      <ellipse cx="50" cy="72" rx="21" ry="6.5" fill="#d5dde7" ${ol}/>
      <ellipse cx="50" cy="71" rx="15.5" ry="4.2" fill="#2a3446"/>
      ${hijab ? '' : `<path d="M42 58 L42 71 Q50 75 58 71 L58 58Z" fill="${skD}" ${ol}/>`}
      ${hijab ? '' : `<path d="M29 72 Q50 82 71 72" stroke="#c9d4e0" stroke-width="2.4" fill="none"/>`}
      ${hijab ? `<path d="M30 60 Q32 76 50 77 Q68 76 70 60 Q66 72 50 72 Q34 72 30 60Z" fill="${shade(hc, 0.8)}"/>` : ''}
      ${hijab ? '' : `<ellipse cx="28.5" cy="45" rx="4" ry="5.5" fill="${sk}" ${ol}/><ellipse cx="71.5" cy="45" rx="4" ry="5.5" fill="${sk}" ${ol}/>`}
      <ellipse cx="50" cy="43" rx="${face.rx}" ry="${face.ry}" fill="${sk}" ${ol}/>
      <circle cx="38" cy="51" r="3.6" fill="#ff7a7a" opacity=".22"/><circle cx="62" cy="51" r="3.6" fill="#ff7a7a" opacity=".22"/>
      ${p.beard ? `<path d="M29 45 Q30 66 50 67 Q70 66 71 45 Q68 58 59 55 Q50 52 41 55 Q32 58 29 45Z" fill="${p.beard}" ${ol}/><path d="M42 53.5 Q50 50 58 53.5 Q50 52.5 42 53.5Z" fill="${p.beard}" ${ol}/>` : ''}
      <g><ellipse cx="41" cy="43" rx="3.6" ry="3.3" fill="#fff" ${ol.replace('1.6', '1')}/><ellipse cx="59" cy="43" rx="3.6" ry="3.3" fill="#fff" ${ol.replace('1.6', '1')}/>
        <circle cx="41.4" cy="43.4" r="2.3" fill="#3a2a22"/><circle cx="59.4" cy="43.4" r="2.3" fill="#3a2a22"/>
        <circle cx="42.2" cy="42.4" r=".8" fill="#fff"/><circle cx="60.2" cy="42.4" r=".8" fill="#fff"/></g>
      <g stroke="${brow}" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M36 36.5 Q41 34 46 36"/><path d="M54 36 Q59 34 64 36.5"/></g>
      <path d="M48 47.5 Q50 51 52 47.5" stroke="${skD}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      <path d="${smile}" stroke="#6b2f25" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      ${hair[1]}
      ${acc.includes('glasses') ? `<g fill="#cfeaff" fill-opacity=".22" stroke="${p.frame || INK}" stroke-width="2.2"><rect x="33.5" y="37.5" width="14" height="11" rx="3.5"/><rect x="52.5" y="37.5" width="14" height="11" rx="3.5"/><path d="M47.5 42 Q50 40.5 52.5 42" fill="none"/><path d="M33.5 41 L28 39.5 M66.5 41 L72 39.5" fill="none"/></g>` : ''}
      ${acc.includes('earrings') && !hijab ? `<g fill="#ffd36b" ${ol.replace('1.6', '.8')}><circle cx="28.5" cy="52.5" r="2.2"/><circle cx="71.5" cy="52.5" r="2.2"/></g>` : ''}
      ${acc.includes('earrings') && hijab ? `<circle cx="31" cy="58" r="1.8" fill="#ffd36b" ${ol.replace('1.6', '.8')}/>` : ''}
      ${acc.includes('necklace') ? `<path d="M38 77 Q50 85 62 77" stroke="#ffd36b" stroke-width="1.6" fill="none"/><circle cx="50" cy="82" r="2.4" fill="#ffd36b" ${ol.replace('1.6', '.8')}/>` : ''}
      ${acc.includes('pin') ? `<circle cx="67" cy="64" r="2.2" fill="#ffd36b" ${ol.replace('1.6', '.8')}/>` : ''}
    </g></g>
    <circle cx="50" cy="50" r="48.5" fill="none" stroke="${c.color}" stroke-width="3"/>
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
