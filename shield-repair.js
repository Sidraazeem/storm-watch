// Shield Reboot: a fictional repair circuit driven by the campaign's DONKI event.
// No flare measurement is interpreted as an electronics failure probability.
(function (root) {
  'use strict';
  const N = 1, E = 2, S = 4, W = 8;
  const rotate = mask => ((mask << 1) & 15) | (mask >> 3);
  const ports = [[N, 0, -1, S], [E, 1, 0, W], [S, 0, 1, N], [W, -1, 0, E]];
  // Three small branches, no decoys. Empty corners cannot be clicked.
  const solution = [0, E|S, E|W, E|W, N|E|S|W, E|W, 0, N|E, E|W];
  const required = [3,5,1,2,7,8];
  function powered(cells) {
    const seen = new Set();
    if (!(cells[3] & W)) return seen;
    const queue = [3]; seen.add(3);
    for (const i of queue) {
      for (const [bit, dx, dy, opposite] of ports) {
        const x = i % 3 + dx, y = Math.floor(i / 3) + dy, j = y * 3 + x;
        if (x < 0 || x > 2 || y < 0 || y > 2 || seen.has(j)) continue;
        if ((cells[i] & bit) && (cells[j] & opposite)) { seen.add(j); queue.push(j); }
      }
    }
    return seen;
  }
  function createBoard(random = Math.random) {
    const cells = solution.map(mask => {
      // Each switch starts at most one clockwise tap from the designed route.
      if (random() < .75) for (let turn = 0; turn < 3; turn++) mask = rotate(mask);
      return mask;
    });
    // Always start with the input disconnected, even with a deterministic RNG.
    cells[3] = N | S;
    return cells;
  }
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function sourceURL(value) {
    try { const u = new URL(value); return u.protocol === 'https:' && u.hostname === 'ccmc.gsfc.nasa.gov' ? u.href : 'https://ccmc.gsfc.nasa.gov/tools/DONKI/'; }
    catch { return 'https://ccmc.gsfc.nasa.gov/tools/DONKI/'; }
  }
  let active = null;
  function close() {
    if (!active) return;
    clearInterval(active.timer);
    active.host.classList.remove('shield-card', 'sr-paused');
    document.removeEventListener('visibilitychange', active.visibility);
    active = null;
  }
  function start({host, event, engineer = false, demo = false, solar = false, onRestored = () => {}, onComplete, onExit, sound = () => {}, doneLabel}) {
    close();
    const a = {host, cells: createBoard(), relays: [0,0,0], latched: [false,false,false], seconds: 0,
      moves: 0, paused: false, done: false};
    active = a;
    host.classList.add('shield-card');
    const cls = /^[ABCMX]\d+(\.\d+)?$/.test(event.cls) ? event.cls : 'Unknown';
    const isLinked = Number.isFinite(event.mins) && event.mins > 0;
    host.style.setProperty('--sr-solar-color', cls.startsWith('X') ? '#ffba85' : '#ffdd88');
    const observed = isLinked ? `${event.mins} min · flare peak → linked particle detection` : 'No linked particle detection in this scenario';
    host.innerHTML = `
      <div class="sr-topline"><span>STORM WATCH / JUNIOR ENGINEER</span><button class="sr-exit" aria-label="Close repair">✕</button></div>
      <div class="sr-heading"><div><p class="sr-eyebrow">${demo ? 'LET’S PRACTICE!' : 'YOUR CREW NEEDS POWER!'}</p><h2>${solar ? 'SOLAR' : 'SHIELD'} <em>REBOOT</em></h2></div><span class="sr-alert">● OFFLINE</span></div>
      <p class="sr-instructions"><b>Tap a wire tile to turn it.</b><br>${solar ? 'Reconnect all 3 solar panels. Bring the power back!' : 'Make a glowing path to all 3 shields!'}</p>
      <div class="sr-instruments"><div><small>${solar ? 'PANELS' : 'SHIELDS'} ON</small><strong id="sr-count">0 <span>/ 3</span></strong></div><div class="sr-sun"><small>SUN SIGNAL</small><strong>☀ ${escape(cls)}</strong></div><div><small>TAKE YOUR TIME</small><strong class="sr-no-rush">No rush ♥</strong></div></div>
      <div class="sr-workspace"><div class="sr-feed"><span>POWER</span><b>⚡</b><span>START</span></div><div class="sr-grid" role="group" aria-label="Wire puzzle, three rows by three columns"></div><div class="sr-banks">${['1','2','3'].map((name,i)=>`<div class="sr-bank" data-bank="${i}"><span>${solar ? 'PANEL' : 'SHIELD'} ${name}</span><b>⬡</b><div><i></i></div></div>`).join('')}</div></div>
      <div class="sr-feedback" role="status" aria-live="polite">Start at the lightning bolt. Tap the wire beside it!</div>
      <div class="sr-actions"><button id="sr-hint">Help me ✨</button><button id="sr-pause">Pause</button><span id="sr-moves">0 turns</span></div>
      <details class="sr-data"><summary><span>REAL NASA STORY</span> ${escape(event.date)} <span class="sr-data-tag">${event.fromNasa ? 'LIVE FETCH' : 'SAVED RECORD'}</span></summary><p>${escape(observed)}${isLinked ? ` (${escape(event.sepInst)})` : ''}.</p><p>The Sun signal comes from NASA DONKI. X-class flares get a warmer solar glow in this game. The broken wires and repair puzzle are pretend; these detector times do not predict arrival at the Moon.</p><a href="${escape(sourceURL(event.link))}" target="_blank" rel="noopener">See NASA’s record ↗</a></details>
      <div class="sr-result" hidden></div>`;
    const grid = host.querySelector('.sr-grid');
    function message(text) { host.querySelector('.sr-feedback').textContent = text; }
    const tiles = a.cells.map((_, i) => {
      const tile = document.createElement('button'); tile.className = 'sr-tile'; tile.dataset.cell = i;
      tile.disabled = a.cells[i] === 0 || a.cells[i] === 15;
      if (!a.cells[i]) tile.classList.add('sr-empty');
      if (a.cells[i] === 15) tile.classList.add('sr-hub');
      tile.innerHTML = '<svg viewBox="0 0 80 80" aria-hidden="true"><path class="sr-track"/><circle cx="40" cy="40" r="6"/></svg><span class="sr-lock" aria-hidden="true">×</span>';
      tile.onclick = () => {
        if (a.paused || a.done) return;
        a.cells[i] = rotate(a.cells[i]); a.moves++; tile.classList.remove('sr-hinted');
        sound(420 + i * 12, .035, 'sine'); render();
        message(powered(a.cells).size > 1 ? 'Nice! Follow the glowing wires to the shields.' : 'Keep turning! Make the wire point toward its neighbor.');
      };
      tile.onkeydown = e => {
        const delta = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-3,ArrowDown:3}[e.key];
        if (delta) { e.preventDefault(); let next = i + delta; while (next >= 0 && next < 9 && tiles[next].disabled) next += delta; if (tiles[next]) tiles[next].focus(); }
      };
      grid.appendChild(tile); return tile;
    });
    function render() {
      const energy = powered(a.cells);
      tiles.forEach((tile, i) => {
        tile.querySelector('path').setAttribute('d', ports.filter(([bit]) => a.cells[i] & bit).map(([,dx,dy]) => `M40 40L${40+40*dx} ${40+40*dy}`).join(' '));
        tile.classList.toggle('sr-powered', energy.has(i));
        const directions = ports.filter(([bit]) => a.cells[i] & bit).map(([,dx,dy]) => dx === 1 ? 'right' : dx === -1 ? 'left' : dy === 1 ? 'down' : 'up');
        tile.setAttribute('aria-label', `Row ${Math.floor(i/3)+1}, column ${i%3+1}: ${directions.join(', ')}${energy.has(i) ? ', glowing' : ''}. ${tile.disabled ? 'Fixed tile.' : 'Tap to turn.'}`);
      });
      a.relays.forEach((charge,i) => {
        const bank = host.querySelector(`[data-bank="${i}"]`);
        bank.classList.toggle('sr-online', a.latched[i]); bank.querySelector('b').textContent = a.latched[i] ? '★' : '⬡';
        bank.querySelector('i').style.width = `${charge/.5*100}%`;
      });
      host.querySelector('#sr-count').innerHTML = `${a.latched.filter(Boolean).length} <span>/ 3</span>`;
      host.querySelector('#sr-moves').textContent = `${a.moves} turns`;
      return energy;
    }
    host.querySelector('#sr-hint').onclick = () => {
      if (a.paused || a.done) return;
      const i = required.find(i => a.cells[i] !== solution[i]);
      if (i == null) { message(`You did it! Watch your ${solar ? 'panels' : 'shields'} light up.`); return; }
      a.cells[i] = solution[i]; a.moves++;
      tiles.forEach(t => t.classList.remove('sr-hinted')); tiles[i].classList.add('sr-hinted'); tiles[i].focus();
      sound(640,.08,'sine'); render();
      message('Teamwork! I fixed one wire. You can tap Help me again anytime.');
    };
    function pause(force) {
      if (a.done) return;
      a.paused = force ?? !a.paused; host.classList.toggle('sr-paused', a.paused);
      host.querySelector('#sr-pause').textContent = a.paused ? 'Resume' : 'Pause';
      message(a.paused ? 'Paused. Your crew can wait!' : `Ready! Let’s light up those ${solar ? 'panels' : 'shields'}.`);
    }
    host.querySelector('#sr-pause').onclick = () => pause();
    host.querySelector('.sr-exit').onclick = () => { close(); onExit(); };
    a.visibility = () => { if (document.hidden) pause(true); };
    document.addEventListener('visibilitychange', a.visibility);
    a.timer = setInterval(() => {
      if (a.paused || a.done) return;
      a.seconds += .1;
      const energy = powered(a.cells);
      [2,5,8].forEach((cell,i) => {
        if (a.latched[i]) return;
        a.relays[i] = energy.has(cell) && (a.cells[cell] & E) ? Math.min(.5,a.relays[i]+.1) : 0;
        if (a.relays[i] >= .5) { a.latched[i] = true; sound(700+i*180,.12,'sine'); message(`${solar ? 'Panel' : 'Shield'} ${i+1} is on! Great job! It will stay on.`); }
      });
      render();
      if (a.latched.every(Boolean)) {
        a.done = true; clearInterval(a.timer); sound(1040,.3,'sine');
        onRestored({seconds:a.seconds,moves:a.moves});
        host.querySelector('.sr-alert').textContent = '● RESTORED'; host.querySelector('.sr-alert').classList.add('sr-restored');
        const result = host.querySelector('.sr-result'); result.hidden = false;
        result.innerHTML = `<div class="sr-stars" aria-label="Three stars">★ ★ ★</div><p class="sr-eyebrow">YOU’RE A ${solar ? 'SOLAR' : 'SHIELD'} HERO!</p><h3>${solar ? 'POWER IS BACK!' : 'YOU FIXED IT!'}</h3><p>All 3 ${solar ? 'panels' : 'shields'} are on. Your crew says thank you!</p><p class="sr-takeaway">${isLinked ? `The Sun made a bright flash. ${event.mins} minutes after its peak, a NASA detector spotted fast particles. ${solar ? 'In our game, you reconnected the solar panel controls to power the base again!' : 'Our game crew needs shields when particles arrive!'}` : `NASA spotted a bright flash on the Sun. A flash and a particle storm are different things. Our crew practices being ready!`}</p><button id="sr-return">${doneLabel || (demo ? 'Play again' : 'Back to my crew')} →</button>${demo && !doneLabel ? '<a href="./">Play full Storm Watch</a>' : ''}`;
        result.querySelector('button').onclick = () => { const stats = {seconds:a.seconds,moves:a.moves}; close(); onComplete(stats); };
        result.querySelector('button').focus();
      }
    }, 100);
    render(); tiles[3].classList.add('sr-hinted'); tiles[3].focus();
    return a;
  }
  const api = {start, close, rotate, powered, createBoard, solution, get active() { return active; }};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ShieldRepair = api;
})(typeof window !== 'undefined' ? window : globalThis);
