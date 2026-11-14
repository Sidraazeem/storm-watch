// Two standalone, short life-support repair games. NASA facts, fictional failures.
(function(){
  'use strict';
  const $=s=>document.querySelector(s),water=document.body.dataset.game==='water';
  const config=water?{
    title:'LEAK',second:'PATROL',system:'H₂O / WATER RECOVERY',icon:'💧',mission:'Don’t let our next drink float away.',
    pitch:'Water is escaping from our pipes!',instruction:'Tap a blue spraying leak ONCE to seal it.',
    controls:'Ignore quiet valves. Pump pause gives you extra time to catch up.',
    hint:'Blue spray means a leak. One tap seals it!',metric:'TANK RESERVE',action:'⏸ Pause pump',
    tutorial:'First, try one practice leak. Tap the blue spraying valve to stop the water. The timer waits until you’ve done it.',
    special:'Pump pause stops water loss for 3 seconds. Keep sealing while the pump rests!',
    fact:'Astronauts recover and recycle water. Fixing leaks keeps that recovered water in the life-support loop.',
    final:'WATER SAVER!',next:'scrubber-sprint.html',nextName:'Try Scrubber Sprint →'
  }:{
    title:'SCRUBBER',second:'SPRINT',system:'AIR / CARBON DIOXIDE REMOVAL',icon:'🫧',mission:'Keep the good air. Catch the CO₂.',
    pitch:'The storm tripped the air-cleaning controls.',instruction:'Tap orange CO₂ to trap it. Let blue O₂ reach the crew.',
    controls:'CO₂ has THREE circles. O₂ has TWO. Don’t vacuum up the oxygen!',
    hint:'Trap orange CO₂. Leave blue O₂ alone. The filter cleans itself!',metric:'CABIN AIR',action:'🌀 Vacuum boost',
    tutorial:'Tap orange CO₂ before it reaches the crew. Leave blue O₂ alone. The filter cleans itself automatically, so you can keep tapping!',
    special:'Vacuum boost grabs the CO₂ on screen. It’s an optional bonus—normal captures never stop!',
    fact:'Air revitalization removes carbon dioxide from the cabin. Oxygen generation is a separate life-support function.',
    final:'AIR RESCUER!',next:'leak-patrol.html',nextName:'Try Leak Patrol →'
  };
  const duration=12;let state,quiet=false,motion=!matchMedia('(prefers-reduced-motion: reduce)').matches,audio,bus,last=0,raf,serial=0;
  let best=0;try{best=Math.max(0,Number(localStorage.getItem('storm-'+(water?'water':'air')+'-best'))||0);}catch{}
  $('#arcade').innerHTML=`<div class="ls-shell"><header><span>STORM WATCH / JUNIOR ENGINEER</span><div><button id="ls-motion" aria-pressed="false">Pause effects ⏸</button><button id="ls-sound" aria-pressed="true">Sound on 🔊</button></div></header>
    <div class="ls-layout"><aside class="ls-cinema"><img class="ls-solar" src="assets/space/flare.jpg" alt="Real SDO observation of the September 10, 2017 solar flare"><video class="ls-film" src="assets/space/solar-loop.mp4" poster="assets/space/flare.jpg" muted loop playsinline preload="metadata" aria-hidden="true"></video><div class="ls-shade"></div><div class="ls-dust" aria-hidden="true"></div><div class="ls-title"><span class="ls-badge">REAL NASA FOOTAGE / ARCHIVE</span><h1>${config.title}<br><em>${config.second}</em></h1><p>${water?'Every drop matters.<br>Every seal counts.':'Your crew breathes out CO₂.<br>Your filter takes it out.'}<br><b>You keep the base alive.</b></p></div>
    <div class="ls-system-display"><span>${config.metric}</span><div class="ls-system-orb"><div class="ls-orb-fill"></div><b>${config.icon}</b><strong id="ls-big-meter">${water?'75':'100'}%</strong></div><p>${water?'Seal the pipes.<br>Save the next drink.':'Trap the CO₂.<br>Keep the crew breathing.'}</p><div class="ls-hero-bar"><i></i></div><strong id="ls-best">Best score: ${best}</strong></div>
    <div class="ls-credit">X8.2 solar flare · September 10, 2017<br><a href="https://svs.gsfc.nasa.gov/12706" target="_blank" rel="noopener">NASA / GSFC / SDO ↗</a><small>Failures, meters, and particles are game graphics.</small></div></aside>
    <section class="ls-console" aria-label="${config.system} mini-game"><p class="ls-eyebrow">${config.system} / 12-SECOND RESCUE</p><h2>${config.mission}</h2><p class="ls-instructions"><b>${config.instruction}</b><br>${config.controls}</p>
    <div class="ls-hud"><div><small>TIME LEFT</small><b id="ls-time">12s</b></div><div><small>SCORE</small><b id="ls-score">0</b></div><div><small>COMBO</small><b id="ls-combo">×0</b></div><div><small>${water?'SEALED':'CAPTURED'}</small><b id="ls-counter">0</b></div></div>
    <div class="ls-stage ${water?'ls-water-stage':'ls-air-stage'}" aria-label="${water?'Nine pipe valves. Tap spraying valves twice to seal.':'Moving CO2 and O2 molecules. Tap only the CO2.'}">
    <div class="ls-stage-top"><span id="ls-wave">WAVE 1 / 3</span><span id="ls-stage-state">${water?'WATER RECYCLER':'AIR LOOP'} · STANDBY</span></div>
    ${water?`<svg class="ls-pipes" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path class="ls-pipe-shadow" d="M100 20V340H500V100H100M300 20V340M100 220H500M500 20V340"/><path class="ls-pipe-flow" d="M100 20V340H500V100H100M300 20V340M100 220H500M500 20V340"/></svg><div class="ls-valves"></div><div class="ls-drain"><span>💧 RECYCLER → STORAGE TANK</span><span id="ls-flow-state">SEALED LOOP</span></div>`:
    `<div class="ls-air-flow" aria-hidden="true"><i></i><i></i><i></i></div><div class="ls-gas-legend"><span><b>●●● CO₂</b> TAP TO TRAP</span><span><b>●● O₂</b> LET IT PASS</span></div><div class="ls-gas-field"></div><div class="ls-crew-port"><b>🧑‍🚀</b><span>CREW<br>AIR RETURN</span></div><div class="ls-filter"><span>FILTER</span><div>${Array.from({length:6},()=>'<i></i>').join('')}</div><b id="ls-filter-label">READY</b></div>`}
    <div class="ls-effects" aria-hidden="true"></div><div class="ls-banner" role="status" aria-live="polite"></div>
    <div class="ls-intro"><span class="ls-intro-icon">${config.icon}</span><b>${config.pitch}</b><p>${config.tutorial}</p><button id="ls-start">${water?'Show me a leak →':'Start rescue →'}</button><small>${water?'Untimed practice first · then a 12-second rescue':'12 seconds · three waves · auto-cleaning filter'}</small></div><div class="ls-pause-overlay" hidden>PAUSED</div></div>
    <div id="ls-feedback" role="status" aria-live="polite">${config.hint}</div><div class="ls-controls"><button id="ls-special">${config.action} <span>READY</span></button><button id="ls-pause">Pause</button><button id="ls-reset">Restart ↻</button></div>
    <details class="ls-notes"><summary>Real NASA life support · facts & credits</summary><p>${config.fact}</p><p><a href="https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/" target="_blank" rel="noopener">NASA’s Environmental Control and Life Support Systems ↗</a> · <a href="https://www.nasa.gov/reference/jsc-life-support-subsystems/" target="_blank" rel="noopener">NASA life-support research ↗</a></p><p>The backdrop is archived NASA/GSFC/SDO imagery of September 10, 2017. <a href="https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13098/-1" target="_blank" rel="noopener">DONKI flare record ↗</a> · <a href="assets/space/CREDITS.md" target="_blank" rel="noopener">Media credits ↗</a>.</p><p>The lunar-base failures, instant repairs, colored gas bubbles, resource percentages, filter capacity, and 12-second timing are fictional game mechanics, not measured NASA equipment performance or recorded damage from this flare. CO₂ capture is not conversion into O₂. Intended for ages 7–12; difficulty still needs playtesting with children.</p></details><a class="ls-other" href="${config.next}">${config.nextName}</a></section></div>
    <section class="ls-result" hidden aria-label="Mission results"><div class="ls-result-ring" aria-hidden="true"></div><div class="ls-stars">★ ★ ★</div><p class="ls-eyebrow">LIFE SUPPORT / RESCUE COMPLETE</p><h2 id="ls-rating">${config.final}</h2><p id="ls-summary"></p><div class="ls-result-icon">${config.icon}</div><p class="ls-takeaway">${config.fact}</p><strong id="ls-result-best"></strong><button id="ls-replay">Beat my score →</button><a href="${config.next}">${config.nextName}</a></section></div>`;
  const film=$('.ls-film');film.muted=true;
  function sound(kind){
    try{
      if(quiet)return;audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(!bus){bus=audio.createGain();bus.gain.value=.6;bus.connect(audio.destination);}if(audio.state==='suspended')audio.resume().catch(()=>{});
      const now=audio.currentTime,note=(delay,f,end,life,volume,type='sine')=>{const o=audio.createOscillator(),g=audio.createGain(),t=now+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+life);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+life);o.connect(g);g.connect(bus);o.start(t);o.stop(t+life+.01);};
      if(kind==='tighten'||kind==='seal'){note(0,185,65,.23,.15,'triangle');note(0,420,280,.12,.055);if(kind==='seal')[0,.08,.16].forEach((d,i)=>note(.05+d,350+i*160,700+i*180,.13,.026));}
      else if(kind==='capture'){note(0,140,650,.2,.07,'triangle');note(.04,950,500,.16,.035);}
      else if(kind==='bad'){note(0,160,80,.2,.04,'triangle');}
      else if(kind==='special'){[0,.07,.14,.21].forEach((d,i)=>note(d,240+i*190,850+i*130,.25,.045));}
      else if(kind==='win'){[523,659,784,1046].forEach((f,i)=>note(i*.09,f,f,.6,.04));}
      else note(0,kind==='warning'?350:600,kind==='warning'?420:1000,.09,.025);
    }catch{}
  }
  function feedback(text){$('#ls-feedback').textContent=text;}
  function sparkle(element,text,color='#adffd4'){
    if(!element)return;
    const box=element.getBoundingClientRect(),stage=$('.ls-stage').getBoundingClientRect();
    const label=document.createElement('span');label.className='ls-float';label.textContent=text;label.style.left=(box.left+box.width/2-stage.left)+'px';label.style.top=(box.top-stage.top)+'px';label.style.color=color;$('.ls-effects').appendChild(label);
    const fx={node:label,ttl:1};state.effects.push(fx);
    if(!motion)return;
    for(let i=0;i<14;i++){
      const dot=document.createElement('i'),a=Math.random()*Math.PI*2,r=25+Math.random()*60;dot.className='ls-spark';dot.style.left=label.style.left;dot.style.top=(box.top+box.height/2-stage.top)+'px';dot.style.setProperty('--dx',Math.cos(a)*r+'px');dot.style.setProperty('--dy',Math.sin(a)*r+'px');dot.style.background=color;$('.ls-effects').appendChild(dot);state.effects.push({node:dot,ttl:1});
    }
  }
  function reset(){
    $('.ls-effects').replaceChildren();if(!water)$('.ls-gas-field').replaceChildren();
    state={phase:'intro',time:0,score:0,combo:0,maxCombo:0,resource:water?75:100,wave:0,next:1,leaks:Array.from({length:9},()=>({hits:0,age:0,warning:0,sealed:0})),items:[],effects:[],sealed:0,captured:0,oxygen:0,mistakes:0,escaped:0,load:0,autoClean:0,cleans:0,cooldown:0,ability:0,banner:0,spawned:0,lastValve:-1};
    $('.ls-intro').hidden=false;$('.ls-result').hidden=true;$('.ls-pause-overlay').hidden=true;$('.ls-banner').textContent='';document.body.classList.remove('ls-running');$('#ls-pause').textContent='Pause';feedback(config.hint);render();
  }
  function start(){
    state.phase=water?'learn':'play';state.next=.7;$('.ls-intro').hidden=true;document.body.classList.add('ls-running');
    if(water){state.leaks[4]={hits:1,age:0,warning:0,sealed:0};announce('TAP THIS BLUE LEAK ↓',3600);feedback('Practice: tap the blue spraying valve in the middle. No timer yet!');render();$('[data-valve="4"]').focus({preventScroll:true});}
    else{announce('CO₂ OUT. O₂ STAYS.',1.6);feedback(config.hint);}
    if(innerWidth<=650)window.scrollTo({top:0,behavior:'instant'});
  }
  function announce(text,seconds=1.1){$('.ls-banner').textContent=text;state.banner=seconds;}
  function score(points){state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.score+=points+Math.min(5,state.combo)*15;}
  function seal(index){
    if(!['play','learn'].includes(state.phase))return;const learning=state.phase==='learn',leak=state.leaks[index],button=$(`[data-valve="${index}"]`);
    if(leak.hits===0){feedback('That valve is quiet. Go for the spraying blue jets!');return;}
    leak.warning=0;leak.hits=0;sound('seal');leak.sealed=.8;state.sealed++;score(100);sparkle(button,'SEALED! +'+(100+Math.min(5,state.combo)*15));feedback(state.combo>=3?`${state.combo} seals in a row! Keep that recovered water inside the pipes.`:'CLUNK! Leak sealed. Tap the next blue spray!');
    if(learning){state.phase='play';state.next=1;announce('THAT’S IT! NOW SAVE THE WATER.',1.7);feedback('You did it! The timer is starting. Tap each new blue spray once to seal it.');}
    render();
  }
  function spawnLeak(){
    const available=state.leaks.map((l,i)=>l.hits===0&&l.sealed<=0?i:-1).filter(i=>i>=0&&i!==state.lastValve);
    if(!available.length)return;const i=available[Math.floor(Math.random()*available.length)];state.lastValve=i;state.leaks[i]={hits:1,age:0,warning:.65,sealed:0};sound('warning');
  }
  function capture(item){
    if(state.phase!=='play'||item.dead)return;
    if(item.kind==='o2'){item.dead=true;state.resource=Math.max(0,state.resource-6);state.mistakes++;state.combo=0;sound('bad');sparkle(item.node,'O₂ LOST!','#ffbb8c');feedback('That was oxygen! Let blue O₂ reach the crew. Trap orange CO₂ instead.');}
    else{
      item.dead=true;state.load++;state.captured++;state.resource=Math.min(100,state.resource+2);score(100);sound('capture');sparkle(item.node,'CO₂ TRAPPED!');
      if(state.load>=6){state.load=0;state.autoClean=1.3;state.cleans++;announce('AUTO CLEAN! KEEP CATCHING CO₂.',1.1);feedback('Filter cleaned itself. Keep tapping orange CO₂—nothing else to press!');}
      else feedback(`${state.combo}× combo! Keep catching CO₂. The filter takes care of itself.`);
    }
    render();
  }
  function spawnGas(){
    const kind=state.spawned%3===1?'o2':'co2',lane=state.spawned%3;state.spawned++;
    const item={id:++serial,kind,x:.06,y:[.25,.45,.65][lane],speed:(.20+state.wave*.02),age:0,dead:false};
    const b=document.createElement('button');b.className='ls-gas '+(kind==='co2'?'ls-co2':'ls-o2');b.dataset.gasId=item.id;b.dataset.kind=kind;b.setAttribute('aria-label',kind==='co2'?'Trap carbon dioxide, CO2':'Oxygen O2, let it pass to the crew');
    b.innerHTML=`<span class="ls-molecule" aria-hidden="true">${kind==='co2'?'<i></i><i></i><i></i>':'<i></i><i></i>'}</span><b>${kind==='co2'?'CO₂':'O₂'}</b><small>${kind==='co2'?'TRAP':'KEEP'}</small>`;b.onclick=()=>capture(item);item.node=b;state.items.push(item);$('.ls-gas-field').appendChild(b);
  }
  function special(){
    if(state.phase!=='play'||state.cooldown>0)return;state.cooldown=6;sound('special');
    if(water){state.ability=3;announce('PUMP PAUSED · KEEP SEALING!');feedback(config.special);}
    else{
      const targets=state.items.filter(i=>!i.dead&&i.kind==='co2');targets.forEach(item=>{item.dead=true;state.captured++;score(85);sparkle(item.node,'VACUUMED!');});state.load=0;state.autoClean=1;state.resource=Math.min(100,state.resource+3);state.ability=1;announce(`VACUUM BOOST · ${targets.length} CO₂ CLEARED`);feedback(config.special);
    }
    render();
  }
  function finish(){
    state.phase='end';state.resource=Math.round(state.resource);const stars=state.resource>=65?3:state.resource>=30?2:1;best=Math.max(best,state.score);try{localStorage.setItem('storm-'+(water?'water':'air')+'-best',String(best));}catch{}
    $('.ls-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('#ls-rating').textContent=stars===3?config.final:stars===2?'RESCUE COMPLETE!':'TRY A NEW STRATEGY!';
    $('#ls-summary').textContent=water?`${state.sealed} leaks sealed · ${state.resource}% tank reserve · ${state.score} points.`:`${state.captured} CO₂ captured · ${state.oxygen} O₂ delivered · ${state.resource}% cabin air · ${state.score} points.`;
    $('#ls-result-best').textContent='Best score: '+best;$('.ls-result').hidden=false;sound('win');$('#ls-replay').focus();
  }
  function tick(dt){
    state.effects=state.effects.filter(e=>{e.ttl-=dt;if(e.ttl<=0){e.node.remove();return false;}return true;});
    if(state.phase!=='play')return;
    state.time+=dt;state.cooldown=Math.max(0,state.cooldown-dt);state.ability=Math.max(0,state.ability-dt);state.autoClean=Math.max(0,state.autoClean-dt);state.banner=Math.max(0,state.banner-dt);if(!state.banner)$('.ls-banner').textContent='';
    const wave=Math.min(2,Math.floor(state.time/(duration/3)));if(wave!==state.wave){state.wave=wave;announce(`WAVE ${wave+1} · ${water?'MORE PRESSURE!':'FASTER AIRFLOW!'}`,1.5);sound('warning');}
    state.next-=dt;
    if(water){
      if(state.next<=0){spawnLeak();state.next=[1.4,1.2,1.0][wave];}
      let loss=0;
      state.leaks.forEach((leak,i)=>{leak.sealed=Math.max(0,leak.sealed-dt);if(!leak.hits)return;if(leak.warning>0){leak.warning-=dt;return;}leak.age+=dt;loss+=leak.hits*4.8;
        if(leak.age>=6){leak.hits=0;state.resource=Math.max(0,state.resource-7);state.combo=0;state.escaped++;sparkle($(`[data-valve="${i}"]`),'WATER LOST!','#ffc092');feedback('A leak ran too long! Seal blue jets before the tank loses more water.');}
      });
      if(state.ability<=0)state.resource=Math.max(0,Math.min(100,state.resource+(1.25-loss)*dt));
    }else{
      if(state.next<=0){spawnGas();state.next=[.9,.8,.7][wave];}
      for(const item of state.items){if(item.dead){item.node.remove();continue;}item.age+=dt;item.x+=item.speed*dt;
        if(item.x>=.94){item.dead=true;if(item.kind==='co2'){state.resource=Math.max(0,state.resource-8);state.combo=0;state.escaped++;sound('bad');sparkle($('.ls-crew-port'),'CO₂ RETURNED!','#ffb095');feedback('That CO₂ slipped back to the cabin! Trap the orange molecules sooner.');}else{state.oxygen++;state.score+=25;state.resource=Math.min(100,state.resource+1);sparkle($('.ls-crew-port'),'O₂ DELIVERED!','#b5ebff');}item.node.remove();}
      }
      state.items=state.items.filter(i=>!i.dead);
    }
    if(state.time>=duration)finish();
  }
  function render(){
    $('#ls-time').textContent=state.phase==='learn'?'PRACTICE':Math.ceil(Math.max(0,duration-state.time))+'s';$('#ls-score').textContent=state.score;$('#ls-combo').textContent='×'+state.combo;$('#ls-counter').textContent=water?state.sealed:state.captured;$('#ls-wave').textContent=state.phase==='learn'?'PRACTICE · TIMER STOPPED':`WAVE ${state.wave+1} / 3`;
    const resource=Math.round(state.resource);$('#ls-big-meter').textContent=resource+'%';$('.ls-hero-bar i').style.width=resource+'%';$('.ls-orb-fill').style.height=resource+'%';$('.ls-system-orb').classList.toggle('ls-low',resource<35);
    $('#ls-special').disabled=state.phase!=='play'||state.cooldown>0;$('#ls-special span').textContent=state.ability>0?'ACTIVE':state.cooldown>0?Math.ceil(state.cooldown)+'s':'READY';
    $('#ls-stage-state').textContent=state.phase==='intro'?'SYSTEM OFFLINE':state.phase==='paused'?'SYSTEM PAUSED':water?state.ability>0?'PUMP PAUSED':'RECYCLER RUNNING':state.autoClean>0?'AUTO CLEAN · KEEP TAPPING':'AUTO-CLEANING FILTER';
    $('.ls-stage').classList.toggle('ls-ability',state.ability>0);$('.ls-stage').classList.toggle('ls-learning',state.phase==='learn');$('.ls-pause-overlay').hidden=state.phase!=='paused';
    if(water){
      let active=0;state.leaks.forEach((leak,i)=>{const b=$(`[data-valve="${i}"]`);b.disabled=state.phase==='learn'&&i!==4;b.classList.toggle('ls-leaking',leak.hits>0&&leak.warning<=0);b.classList.toggle('ls-warning',leak.warning>0);b.classList.toggle('ls-sealed',leak.sealed>0);b.classList.remove('ls-half');b.querySelector('.ls-valve-wheel').textContent=leak.hits&&leak.warning<=0?'💦':'✚';b.querySelector('.ls-valve-state').textContent=leak.hits?'TAP TO SEAL':leak.sealed>0?'SEALED ✓':'VALVE '+(i+1);b.setAttribute('aria-label',leak.hits>0?`Leak ${i+1}, tap once to seal`:`Valve ${i+1}, sealed`);if(leak.hits&&leak.warning<=0)active++;});$('#ls-flow-state').textContent=state.ability>0?'FLOW PAUSED':active?`${active} LEAK${active>1?'S':''} · LOSING WATER`:'SEALED LOOP · RECOVERING';
    }else{
      state.items.forEach(item=>{item.node.style.left=item.x*100+'%';item.node.style.top=(item.y+Math.sin(item.age*2+item.id)*.035)*100+'%';});$('.ls-filter').classList.remove('ls-full');$('.ls-filter').classList.toggle('ls-auto-clean',state.autoClean>0);$('.ls-filter').querySelectorAll('i').forEach((el,i)=>el.classList.toggle('ls-loaded',i<state.load));$('#ls-filter-label').textContent=state.autoClean>0?'AUTO CLEAN ✓':'SELF-CLEANING';
    }
  }
  if(water){$('.ls-valves').innerHTML=Array.from({length:9},(_,i)=>`<button class="ls-valve" data-valve="${i}" style="left:${[16.67,50,83.33][i%3]}%;top:${[25,55,85][Math.floor(i/3)]}%"><span class="ls-valve-wheel">✚</span><span class="ls-jet" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="ls-valve-state">VALVE ${i+1}</span><span class="ls-tighten" aria-hidden="true">✓</span></button>`).join('');document.querySelectorAll('[data-valve]').forEach(b=>b.onclick=()=>seal(+b.dataset.valve));}
  function pause(){if(state.phase==='play'){state.phase='paused';$('#ls-pause').textContent='Resume';}else if(state.phase==='paused'){state.phase='play';$('#ls-pause').textContent='Pause';}render();}
  function syncMotion(){document.body.classList.toggle('ls-still',!motion);$('#ls-motion').textContent=motion?'Pause effects ⏸':'Play effects ▶';$('#ls-motion').setAttribute('aria-pressed',String(!motion));film.hidden=!motion;if(motion&&!document.hidden)film.play().catch(()=>{film.hidden=true;});else film.pause();}
  $('#ls-start').onclick=start;$('#ls-special').onclick=special;$('#ls-pause').onclick=pause;$('#ls-reset').onclick=()=>{reset();$('#ls-start').focus();};$('#ls-replay').onclick=()=>{reset();start();};
  $('#ls-sound').onclick=()=>{quiet=!quiet;if(bus)bus.gain.setValueAtTime(quiet?0:.6,audio.currentTime);$('#ls-sound').textContent=quiet?'Sound off 🔇':'Sound on 🔊';$('#ls-sound').setAttribute('aria-pressed',String(!quiet));};$('#ls-motion').onclick=()=>{motion=!motion;syncMotion();};
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.phase==='play'){pause();feedback('Paused while you were away. Press Resume to continue.');}syncMotion();});
  $('.ls-console').addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.closest('button,a,summary')){e.preventDefault();special();}});
  $('.ls-dust').innerHTML=Array.from({length:18},(_,i)=>`<i style="--x:${i*37%100}%;--y:${i*59%100}%;--delay:${-i}s"></i>`).join('');
  function frame(t){const dt=Math.min(.05,(t-last)/1000)||0;last=t;if(!document.hidden&&state.phase!=='paused')tick(dt);render();raf=requestAnimationFrame(frame);}
  window.addEventListener('pagehide',()=>{if(state.phase==='play')pause();cancelAnimationFrame(raf);film.pause();});
  window.addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();syncMotion();raf=requestAnimationFrame(frame);}});
  reset();syncMotion();raf=requestAnimationFrame(frame);
  window.LifeSupportArcade={get state(){return state;},mode:water?'water':'air'};
})();
