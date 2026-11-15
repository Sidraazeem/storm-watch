// NASA/ESA imagery paired with a curated, saved NASA DONKI event chain.
(function(root) {
  'use strict';
  const source = 'https://ccmc.gsfc.nasa.gov/DONKI/view/';
  const media = {
    flare: {image:'assets/space/flare.jpg', alt:'Solar flare and glowing loops above the Sun, observed by SDO on September 10, 2017',
      credit:'NASA / GSFC / SDO', caption:'SDO · September 10, 2017 · colorized ultraviolet',
      page:'https://svs.gsfc.nasa.gov/12706'},
    cloud: {image:'assets/space/cloud.jpg', alt:'A bright cloud erupting around the dark disk of the SOHO coronagraph',
      credit:'ESA / NASA / SOHO / Joy Ng', caption:'SOHO · September 10, 2017 · 16:12 UTC',
      page:'https://www.nasa.gov/missions/goes/september-2017s-intense-solar-activity-viewed-from-space/'},
    particles: {image:'assets/space/particles.jpg', alt:'Bright speckles from energetic particles striking the SOHO camera',
      credit:'ESA / NASA / SOHO / Joy Ng', caption:'SOHO · September 10, 2017 · 18:12 UTC · camera strikes',
      page:'https://www.nasa.gov/missions/goes/september-2017s-intense-solar-activity-viewed-from-space/'}
  };
  const pictures = Object.fromEntries(Object.entries(media).map(([id,m]) => [id,
    `<img src="${m.image}" alt="${m.alt}" decoding="async" draggable="false">`]));
  // These fields are checked against tests/fixtures/donki-2017.json.
  const records = [
    {id:'flare', name:'Sun flash', tag:'FLARE · X8.2', color:'#ffbc79', link:source+'FLR/13098/-1',
      recordID:'2017-09-10T15:35:00-FLR-001', value:'X8.2',
      fact:'A big flash! NASA recorded an X8.2 flare on September 10, 2017. X is the strongest letter class for solar flares.',
      grownup:'FLR classType: X8.2; peakTime: 2017-09-10T16:06Z. Class describes X-ray brightness, not a particle dose.'},
    {id:'cloud', name:'Space cloud', tag:'ERUPTION · 16:09 UTC', color:'#c9adff', link:source+'CME/13107/-1',
      recordID:'2017-09-10T16:09:00-CME-001', value:'2017-09-10T16:09Z',
      fact:'The Sun launched a giant cloud of hot, charged gas! NASA recorded this eruption starting at 16:09 UTC and linked it to our flare.',
      grownup:'CME startTime: 2017-09-10T16:09Z. A CME is an eruption of plasma and magnetic field, not an ordinary water cloud.'},
    {id:'particles', name:'Fast particles', tag:'PARTICLES · 19 MIN', color:'#99f2d7', link:source+'SEP/13101/-1',
      recordID:'2017-09-10T16:25:00-SEP-001', value:'2017-09-10T16:25Z',
      fact:'Zoom! A NASA-listed detector spotted fast particles 19 minutes after the flare’s peak. The flash and the particles are different signals!',
      grownup:'SEP eventTime: 2017-09-10T16:25Z; GOES13 SEM/EPS >100 MeV. The 19-minute interval is measured from the 16:06 UTC flare peak to this detector event, not to arrival at the Moon.'}
  ];
  function makeDeck(random = Math.random) {
    const deck = records.flatMap(r=>[r.id,r.id]);
    for(let i=deck.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[deck[i],deck[j]]=[deck[j],deck[i]];}
    return deck;
  }
  let active = null;
  function close() {
    if(!active) return;
    active.timers.forEach(clearTimeout);
    active.host.querySelectorAll('video').forEach(v=>v.pause());
    active.host.classList.remove('cm-card','cm-still');
    active.host.parentElement.classList.remove('cosmic-modal');
    document.removeEventListener('visibilitychange',active.visibility);
    active=null;
  }
  function start({host, demo=false, system='Oxygen', onRestored=()=>{}, onComplete, onExit, sound=()=>{}, speak=()=>{}, doneLabel}) {
    doneLabel=doneLabel||(demo?'Play again':'Back to my crew');   // embedded in the main game: 'Continue'
    close();
    const a={host,deck:makeDeck(),selected:[],matched:new Set(),timers:[],mode:'twins',busy:false,done:false,lastFact:null,peek:false,
      motion:!window.matchMedia('(prefers-reduced-motion: reduce)').matches,view:'flare'};
    active=a; host.classList.add('cm-card');
    host.parentElement.classList.add('cosmic-modal');
    // System names belong to the fixed game catalog; assign text below rather than interpolate.
    host.innerHTML=`<div class="cm-top"><span>STORM WATCH / JUNIOR ENGINEER</span><button class="cm-close" aria-label="Close picture game">✕</button></div>
      <div class="cm-layout"><aside class="cm-cinema" aria-label="NASA observation viewer">
        <img class="cm-hero-image" src="${media.flare.image}" alt="${media.flare.alt}">
        <video class="cm-film" src="assets/space/solar-loop.mp4" poster="${media.flare.image}" muted loop playsinline preload="metadata" aria-hidden="true"></video>
        <div class="cm-space-dust" aria-hidden="true">${Array.from({length:20},(_,i)=>`<i style="--x:${(i*37)%100}%;--y:${(i*53)%100}%;--delay:${-i*.7}s"></i>`).join('')}</div>
        <div class="cm-cinema-shade"></div><div class="cm-orbit" aria-hidden="true"></div>
        <div class="cm-cinema-title"><span class="cm-archive">● REAL NASA IMAGERY / ARCHIVE</span><h2>COSMIC<br><em>MATCH</em></h2><p>A real storm.<br>A little space detective.<br><b>One big rescue.</b></p></div>
        <div class="cm-view-label"><span id="cm-view-name">THE SUN, UP CLOSE</span><p id="cm-view-caption">${media.flare.caption}</p><a id="cm-image-credit" href="${media.flare.page}" target="_blank" rel="noopener">${media.flare.credit} ↗</a></div>
        <button class="cm-motion" aria-pressed="false">Pause motion ⏸</button>
      </aside><div class="cm-console">
      <p class="cm-kicker">${demo?'JUNIOR ENGINEER / REPAIR PRACTICE':'REBOOT THE OXYGEN CONTROLS'}</p>
      <h3 class="cm-console-title">Bring the pictures back.</h3>
      <p class="cm-story">The storm scrambled our picture files!<br><b>Tap two pictures that look the same.</b></p>
      <div class="cm-modes" role="group" aria-label="Choose how to play"><button data-mode="twins" aria-pressed="true">Find the twins</button><button data-mode="memory" aria-pressed="false">Memory challenge</button></div>
      <div class="cm-progress"><span class="cm-stars" aria-label="0 of 3 pairs">☆ ☆ ☆</span><span><b id="cm-count">0</b> / 3 pairs fixed</span><span>No rush ♥</span></div>
      <div class="cm-board" role="group" aria-label="Six picture cards"></div>
      <section class="cm-fact" aria-label="Mission message"><div class="cm-fact-image">✦</div><div><p class="cm-fact-title">Let’s fix these files!</p><p class="cm-fact-text" role="status" aria-live="polite">Find the Sun flash, the space cloud, and the fast particles.</p><div class="cm-fact-tools" hidden><button class="cm-read">Read it to me 🔊</button><a class="cm-source" target="_blank" rel="noopener">NASA record ↗</a></div></div></section>
      <div class="cm-tools"><button id="cm-peek" hidden>Show pictures 👀</button><button id="cm-restart">Start over ↻</button><a href="?repair=shield">Try the wire game →</a></div>
      <details class="cm-notes"><summary>Real imagery · NASA credits & facts</summary><p>SDO flare imagery: NASA/GSFC/SDO. SOHO eruption and particle-strike images: ESA/NASA/SOHO/Joy Ng. These are colorized telescope observations, not views in natural color. The silent solar movie is a cropped-in-time, slowed excerpt of NASA’s September 10, 2017 footage. Pause motion to view stills.</p>${records.map(r=>`<p><a href="${r.link}" target="_blank" rel="noopener">${r.name}</a>: ${r.grownup} <a href="${media[r.id].page}" target="_blank" rel="noopener">Image source</a>.</p>`).join('')}<p>The cloud still is from 16:12 UTC; the particle-strike still is from 18:12 UTC. SOHO’s camera strikes illustrate the particle event; the 19-minute measurement uses the separate GOES detector. Facts use the saved September 10, 2017 DONKI chain. The matching repair and visual effects are game mechanics.</p></details>
      </div></div><div class="cm-effects" aria-hidden="true"></div>
      <section class="cm-victory" hidden aria-label="Repair complete"></section>`;
    if(!demo) host.querySelector('.cm-console .cm-kicker').textContent='REBOOT THE '+system.toUpperCase()+' CONTROLS';
    if(!demo) host.querySelector('.cm-tools a').remove(); // Keep campaign progress when comparing practice games.
    const board=host.querySelector('.cm-board');
    const buttons=a.deck.map((id,i)=>{
      const r=records.find(r=>r.id===id), b=document.createElement('button');
      b.className='cm-picture'; b.dataset.index=i; b.style.setProperty('--cm-color',r.color);
      b.innerHTML=`<span class="cm-back"><span>✦</span><small>RECOVER SIGNAL</small></span><span class="cm-front">${pictures[id]}<span class="cm-photo-label"><b>${r.name}</b><small>${r.tag}</small></span></span><span class="cm-check" aria-hidden="true">✓</span>`;
      b.onclick=()=>select(i);board.appendChild(b);return b;
    });
    function later(fn,ms){const timer=setTimeout(()=>{if(active===a)fn();},ms);a.timers.push(timer);}
    const film=host.querySelector('.cm-film');film.muted=true;
    function syncMotion(){
      host.classList.toggle('cm-still',!a.motion);
      const button=host.querySelector('.cm-motion');button.textContent=a.motion?'Pause motion ⏸':'Play motion ▶';button.setAttribute('aria-pressed',String(!a.motion));
      film.hidden=a.view!=='flare'||!a.motion;
      if(a.motion&&a.view==='flare'&&!document.hidden)film.play().catch(()=>{film.hidden=true;});else film.pause();
    }
    function view(id){
      a.view=id;const m=media[id];const image=host.querySelector('.cm-hero-image');image.src=m.image;image.alt=m.alt;
      host.querySelector('#cm-view-name').textContent={flare:'THE SUN, UP CLOSE',cloud:'A CLOUD LEAVES THE SUN',particles:'PARTICLES STRIKE THE CAMERA'}[id];
      host.querySelector('#cm-view-caption').textContent=m.caption;
      const credit=host.querySelector('#cm-image-credit');credit.href=m.page;credit.textContent=m.credit+' ↗';
      host.querySelector('.cm-cinema').dataset.view=id;syncMotion();
    }
    function burst(count=28){
      if(!a.motion)return;
      const effects=host.querySelector('.cm-effects');
      for(let i=0;i<count;i++){
        const dot=document.createElement('i'),angle=Math.random()*Math.PI*2,distance=70+Math.random()*330;
        dot.style.setProperty('--dx',Math.cos(angle)*distance+'px');dot.style.setProperty('--dy',Math.sin(angle)*distance+'px');
        dot.style.setProperty('--hue',String(30+Math.random()*160));dot.style.left=(38+Math.random()*40)+'%';dot.style.top=(30+Math.random()*30)+'%';effects.appendChild(dot);
        later(()=>dot.remove(),1500);
      }
    }
    host.querySelector('.cm-motion').onclick=()=>{a.motion=!a.motion;syncMotion();};
    a.visibility=()=>{if(document.hidden)film.pause();else syncMotion();};document.addEventListener('visibilitychange',a.visibility);
    syncMotion();
    function draw(){
      buttons.forEach((b,i)=>{
        const open=a.mode==='twins'||a.peek||a.selected.includes(i)||a.matched.has(a.deck[i]);
        b.classList.toggle('cm-open',open);b.classList.toggle('cm-selected',a.selected.includes(i));b.classList.toggle('cm-matched',a.matched.has(a.deck[i]));
        b.disabled=a.matched.has(a.deck[i]);
        b.setAttribute('aria-label',a.matched.has(a.deck[i])?`Matched: ${records.find(r=>r.id===a.deck[i]).name}`:open?`${records.find(r=>r.id===a.deck[i]).name}, card ${i+1}`:`Hidden picture, card ${i+1}`);
        b.setAttribute('aria-pressed',String(a.selected.includes(i)));
      });
      host.querySelector('#cm-count').textContent=a.matched.size;
      host.querySelectorAll('[data-mode]').forEach(b=>{b.disabled=a.matched.size>0;});
      const stars=host.querySelector('.cm-stars');stars.textContent=Array.from({length:3},(_,i)=>i<a.matched.size?'★':'☆').join(' ');stars.setAttribute('aria-label',`${a.matched.size} of 3 pairs`);
    }
    function message(title,text){host.querySelector('.cm-fact-title').textContent=title;host.querySelector('.cm-fact-text').textContent=text;}
    function showFact(id){
      const r=records.find(r=>r.id===id);a.lastFact=r;
      view(id);
      host.querySelector('.cm-fact-image').innerHTML=pictures[id];
      message('Match! '+r.name,r.fact);host.querySelector('.cm-fact-tools').hidden=false;host.querySelector('.cm-source').href=r.link;
    }
    function select(i){
      if(a.done||a.busy||a.peek||a.matched.has(a.deck[i])) return;
      if(a.selected[0]===i){a.selected=[];draw();return;}
      a.selected.push(i);sound(450+i*60,.045,'sine');draw();
      if(a.selected.length<2)return;
      const [first,second]=a.selected;
      if(a.deck[first]===a.deck[second]){
        a.matched.add(a.deck[first]);a.selected=[];showFact(a.deck[first]);sound(850,.13,'sine');draw();burst();
        if(a.matched.size===3){a.done=true;onRestored();later(win,500);}
      }else{
        a.busy=true;message('Good try!','Those pictures are different. Try another pair. You won’t lose any stars!');
        host.querySelector('.cm-fact-tools').hidden=true;
        later(()=>{a.selected=[];a.busy=false;draw();},850);
      }
    }
    function win(){
      const v=host.querySelector('.cm-victory');v.hidden=false;
      burst(65);
      v.innerHTML=`<div class="cm-rescue-orbit" aria-hidden="true"></div><div class="cm-win-stars">★ ★ ★</div><p class="cm-kicker">SIGNAL RESTORED / CREW SAFE</p><h3>SPACE HERO!</h3><p>All 3 picture files are back.<br>${demo?'Your crew is cheering!':'Your system is working again!'}</p><div class="cm-discoveries">${records.map(r=>`<div>${pictures[r.id]}<span><b>${r.name}</b><small>${r.tag}</small></span></div>`).join('')}</div><p class="cm-win-note">One real day on the Sun. Three different signals!</p><button class="cm-again">${doneLabel} →</button><button class="cm-review">See my discoveries</button>`;
      v.querySelector('.cm-again').onclick=()=>{close();onComplete();};
      v.querySelector('.cm-review').onclick=()=>{
        v.hidden=true;
        host.querySelector('.cm-fact').scrollIntoView({block:'nearest'});
        const done=host.querySelector('#cm-restart');done.textContent=doneLabel+(doneLabel==='Play again'?' ↻':' →');done.focus();
      };
      // Matched cards become discovery buttons when the child reviews the board.
      buttons.forEach((b,i)=>{b.disabled=false;b.onclick=()=>showFact(a.deck[i]);b.setAttribute('aria-label','Discover: '+records.find(r=>r.id===a.deck[i]).name);});
      v.querySelector('.cm-again').focus();sound(1100,.2,'sine');
    }
    host.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{
      if(a.busy||a.done||a.matched.size||a.peek)return;
      a.mode=b.dataset.mode;a.selected=[];host.querySelectorAll('[data-mode]').forEach(t=>t.setAttribute('aria-pressed',String(t===b)));
      host.querySelector('#cm-peek').hidden=a.mode!=='memory';
      message(a.mode==='memory'?'Memory challenge!':'Find the twins!',a.mode==='memory'?'Turn over two cards. Need a hint? You can show all the pictures anytime.':'Tap two pictures that look the same.');draw();
    });
    host.querySelector('#cm-peek').onclick=()=>{
      if(a.done||a.busy)return;
      a.peek=!a.peek;a.selected=[];host.querySelector('#cm-peek').textContent=a.peek?'Hide pictures 🙈':'Show pictures 👀';
      message('Take a good look!',a.peek?'When you’re ready, tap Hide pictures to keep playing.':'Now find the matching pictures!');draw();
    };
    host.querySelector('.cm-read').onclick=()=>{if(a.lastFact)speak(a.lastFact.fact);};
    host.querySelector('#cm-restart').onclick=()=>{const mode=a.mode;close();if(a.done){onComplete();return;}start({host,demo,system,onRestored,onComplete,onExit,sound,speak,doneLabel});if(mode==='memory')host.querySelector('[data-mode="memory"]').click();};
    host.querySelector('.cm-close').onclick=()=>{close();onExit();};
    draw();buttons[0].focus();return a;
  }
  const api={start,close,records,media,makeDeck,get active(){return active;}};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.CosmicMatch=api;
})(typeof window!=='undefined'?window:globalThis);
