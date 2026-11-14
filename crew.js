// STORM WATCH: the crew (team portraits, Commander customization, crew introduction).
// Moved out of game.js unchanged so the main file stays readable.
let S; // game state (shared by all scripts)

// ---------- the crew ----------
// Three real team members plus the player's own customizable Commander.
// Each role has a sash colour and an emblem: leaf (Botanist), ball bearing (Engineer), rock (Geologist), star (Commander).
// Faces are DiceBear "Avataaars" cartoon avatars for all four. (A team member can still use a picture
// instead: add `photo: 'crew/name.jpg'` to their entry below; see crew/README.md.) DiceBear is bundled in vendor/dicebear.js so the game works offline.
// Avataaars design by Pablo Stanley (avataaars.com), free for personal and commercial use; DiceBear code MIT.
const AV = {
  skin:    ['614335', 'ae5d29', 'd08b5b', 'edb98a', 'ffdbb4'],
  tops:    { shortFlat: 'Short', shortWaved: 'Wavy', shortCurly: 'Short curly', theCaesar: 'Buzz', sides: 'Sides', bob: 'Bob',
             bun: 'Bun', curly: 'Curly', bigHair: 'Big hair', straight01: 'Long', straightAndStrand: 'Long side', fro: 'Afro',
             dreads01: 'Locs', frizzle: 'Frizzy', hijab: 'Hijab', turban: 'Turban' },
  hair:    ['2c1b18', '4a312c', '724133', 'a55728', 'b58143', 'd6b370', 'c93305', 'e8e1e1'],
  cover:   ['262e33', '25557c', '5199e4', '3c4f5c', '929598', 'ff488e', 'a7ffc4', 'e6e6e6'],   // hijab / turban colours
  glasses: { none: 'None', prescription02: 'Glasses', round: 'Round', wayfarers: 'Bold', prescription01: 'Thin' },
  beard:   { none: 'None', beardLight: 'Stubble', beardMedium: 'Beard', moustacheFancy: 'Moustache' },
  mood:    { smile: 'Smile', twinkle: 'Grin', default: 'Calm' },
};
const covered = L => L.top === 'hijab' || L.top === 'turban';
const CMD_COLORS = ['#37d6ff', '#a77bff', '#ff7ac8', '#ffd84a', '#7fb2ff'];   // no green / slate / copper (teammates) or red (danger)
const TEAM = [
  { id: 'cmd', name: 'Commander', role: 'Commander', job: 'pilot', perk: 'runs 2x faster', emblem: 'star', zone: 'work' },
  { id: 'brian', name: 'Brian', role: 'Engineer', job: 'engineer', perk: 'easier repairs', emblem: 'bearing', zone: 'work',
    color: '#a9b8ca', sash: '#4f5d70', edge: '#c9d4e0',
    look: { skin: 'edb98a', top: 'theCaesarAndSidePart', hairColor: 'a8a196', cover: '262e33', glasses: 'prescription01', glassesColor: '929598', beard: 'beardMedium', beardColor: 'e8e1e1', mood: 'default' } },
  { id: 'sidra', name: 'Sidra', role: 'Botanist', job: 'botanist', perk: 'grows 2x food', emblem: 'leaf', zone: 'green',
    color: '#4be38a', look: { skin: 'd08b5b', top: 'hijab', hairColor: '2c1b18', cover: '262e33', glasses: 'prescription02', glassesColor: 'd6b370', beard: 'none', mood: 'smile' } },
  { id: 'quan', name: 'Quan', role: 'Geologist', job: 'geologist', perk: '2x science outside', emblem: 'rock', zone: 'eva',
    color: '#e08a4f', look: { skin: 'edb98a', top: 'shaggy', hairColor: '2c1b18', cover: '262e33', glasses: 'prescription02', glassesColor: '262e33', beard: 'none', mood: 'default' } },
];
const CMD_DEFAULT = { name: 'Commander', color: CMD_COLORS[0],
  look: { skin: 'd08b5b', top: 'shortFlat', hairColor: '4a312c', cover: '262e33', glasses: 'none', beard: 'none', mood: 'smile' } };
let CMD = loadCommander();
function loadCommander() {
  try {
    const v = JSON.parse(localStorage.getItem('stormwatch.commander'));
    if (v && v.look && AV.tops[v.look.top]) return { ...CMD_DEFAULT, ...v, look: { ...CMD_DEFAULT.look, ...v.look } };
    if (v && v.name) return { ...JSON.parse(JSON.stringify(CMD_DEFAULT)), name: v.name, color: v.color || CMD_DEFAULT.color };   // older save: keep name and colour
  } catch (e) {}
  return JSON.parse(JSON.stringify(CMD_DEFAULT));
}
function saveCommander() { try { localStorage.setItem('stormwatch.commander', JSON.stringify(CMD)); } catch (e) {} }
const esc = s => String(s).replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
// colours for the tiny face in the helmet visor (scene.js)
const visor = c => ({ skin: '#' + c.look.skin, hijab: covered(c.look), hair: '#' + (covered(c.look) ? c.look.cover : c.look.hairColor) });

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
    const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(avatarSVG(c.look, 256));
    HEADS[c.id] = { img, key };
  }
  return HEADS[c.id];
}

// Round portrait: the team member's picture if there is one, otherwise a DiceBear Avataaars avatar.
function avatarSVG(L, size) {
  if (!window.DiceBear) return '';
  const g = L.glasses && L.glasses !== 'none', b = L.beard && L.beard !== 'none';
  return DiceBear.createAvatar(DiceBear.avataaars, {
    seed: 'storm-watch', ...(size ? { size } : {}), backgroundColor: ['0a1424'], skinColor: [L.skin], top: [L.top], topProbability: 100,
    hairColor: [L.hairColor], hatColor: [L.cover],
    accessories: g ? [L.glasses] : [], accessoriesProbability: g ? 100 : 0, accessoriesColor: [L.glassesColor || '262e33'],
    facialHair: b ? [L.beard] : [], facialHairProbability: b ? 100 : 0, facialHairColor: [L.beardColor || L.hairColor],
    clothing: ['shirtCrewNeck'], clothesColor: ['e6e6e6'],
    eyes: [L.mood === 'twinkle' ? 'happy' : 'default'], eyebrows: ['defaultNatural'], mouth: [L.mood || 'smile'],
  }).toString();
}
function portrait(c, size = 40) {
  if (PHOTOS[c.id]) return `<span class="portrait photo${PHOTO_PX ? '' : ' art'}" style="width:${size}px;height:${size}px;border-color:${c.color}"><img src="${PHOTOS[c.id]}" alt="${esc(c.name)}"></span>`;
  return `<span class="portrait avatar" role="img" aria-label="${esc(c.name)}" style="width:${size}px;height:${size}px;border-color:${c.color}">${avatarSVG(c.look)}</span>`;
}

// ---------- Commander customization (saved on this device) ----------
function customize() {
  const c = S.crew[0], L = CMD.look;
  const opt = (group, val, inner, on) => `<button class="opt${on ? ' on' : ''}" data-g="${group}" data-v="${esc(val)}">${inner}</button>`;
  const sw = col => `<i class="sw" style="background:${col.startsWith('#') ? col : '#' + col}"></i>`;
  const row = (label, group, items, cur, swatch) => `<div class="row"><span>${label}</span>${(Array.isArray(items) ? items.map(v => [v, v]) : Object.entries(items))
    .map(([v, t]) => opt(group, v, swatch ? sw(v) : t, cur === v)).join('')}</div>`;
  showCard(`
    <h2>YOUR COMMANDER</h2>
    <div class="cust">
      <div class="preview" id="preview">${portrait(c, 120)}</div>
      <div class="rows">
        <label>Name <input id="cname" maxlength="12" value="${esc(CMD.name)}" autocomplete="off"></label>
        ${row('Sash', 'color', CMD_COLORS, CMD.color, true)}
        ${row('Skin', 'skin', AV.skin, L.skin, true)}
        ${row('Hair', 'top', AV.tops, L.top)}
        ${covered(L) ? row(L.top === 'hijab' ? 'Hijab colour' : 'Turban colour', 'cover', AV.cover, L.cover, true) : row('Hair colour', 'hairColor', AV.hair, L.hairColor, true)}
        ${row('Glasses', 'glasses', AV.glasses, L.glasses)}
        ${row('Facial hair', 'beard', AV.beard, L.beard)}
        ${row('Expression', 'mood', AV.mood, L.mood)}
      </div>
    </div>
    <p class="src">Commander perk: <b>runs 2x faster</b>. Your choices are saved on this device. Avatars: Avataaars by Pablo Stanley, via DiceBear.</p>
    <button id="rand">🎲 Randomize</button>
    <button class="go" id="go">Done ▶</button>`, () => {
      CMD.name = ($('#cname').value.trim() || 'Commander').slice(0, 12);
      saveCommander(); applyCommander(); intro();
    });
  const pick = a => { const k = Array.isArray(a) ? a : Object.keys(a); return k[Math.floor(Math.random() * k.length)]; };
  const keepName = () => { CMD.name = ($('#cname').value.trim() || 'Commander').slice(0, 12); };
  $('#card').querySelectorAll('.opt').forEach(b => b.onclick = () => {
    if (b.dataset.g === 'color') CMD.color = b.dataset.v; else L[b.dataset.g] = b.dataset.v;
    keepName(); applyCommander(); customize(); beep(620, 0.04, 'sine');
  });
  $('#rand').onclick = () => {
    Object.assign(L, { skin: pick(AV.skin), top: pick(AV.tops), hairColor: pick(AV.hair), cover: pick(AV.cover),
      glasses: Math.random() < 0.35 ? pick(Object.keys(AV.glasses).slice(1)) : 'none',
      beard: Math.random() < 0.2 ? pick(Object.keys(AV.beard).slice(1)) : 'none', mood: pick(AV.mood) });
    CMD.color = pick(CMD_COLORS);
    keepName(); applyCommander(); customize(); beep(620, 0.04, 'sine');
  };
  $('#cname').oninput = () => { CMD.name = $('#cname').value.trim() || 'Commander'; applyCommander(); $('#preview').innerHTML = portrait(S.crew[0], 120); };
}
function applyCommander() {
  const c = S.crew[0];
  Object.assign(c, { name: CMD.name, color: CMD.color, look: { ...CMD.look } });
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
