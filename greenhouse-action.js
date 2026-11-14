(function(){
  'use strict';
  const $=s=>document.querySelector(s),names=['Lettuce','Tomatoes','Strawberries'];
  const film=$('.gg-film'),canvas=$('#ga-particles'),ctx=canvas.getContext('2d'),stage=$('.ga-stage');
  let state,quiet=false,motion=!matchMedia('(prefers-reduced-motion: reduce)').matches,audio,bus,last=0,raf,hiddenPause=false,width=1,height=1;
  let best=0;try{best=+localStorage.getItem('greenhouse-best-v2')||0;}catch{}
  function sound(kind){
    try{
      if(quiet)return;audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(!bus){bus=audio.createGain();bus.gain.value=.6;bus.connect(audio.destination);}if(audio.state==='suspended')audio.resume().catch(()=>{});
      const now=audio.currentTime;
      const note=(delay,f,end,duration,volume,type='sine')=>{const o=audio.createOscillator(),g=audio.createGain(),t=now+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+duration);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(volume,t+.005);g.gain.exponentialRampToValueAtTime(.001,t+duration);o.connect(g);g.connect(bus);o.start(t);o.stop(t+duration+.01);};
      if(kind==='catch'){note(0,190,65,.18,.13,'triangle');note(.02,700,1150,.13,.04);note(.09,1050,700,.13,.025);}
      else if(kind==='hit'){note(0,95,45,.25,.11,'sawtooth');note(0,420,140,.1,.035,'triangle');}
      else if(kind==='burst'){[0,.08,.16,.24].forEach((d,i)=>note(d,250+i*170,900+i*170,.3,.05));}
      else if(kind==='win'){[523,659,784,1046].forEach((f,i)=>note(i*.09,f,f,.65,.04));}
      else note(0,kind==='warning'?350:480,kind==='warning'?430:650,.07,.025);
    }catch{}
  }
  function plant(i){
    const crop=i===0?'<path d="M28 88C1 66 19 42 35 53c-1-32 29-31 27-4 22-12 37 17 17 32-15 12-30 14-51 7" fill="#8ae39c" stroke="#47966a" stroke-width="2"/>':i===1?'<g fill="#ff705d" stroke="#b64b42" stroke-width="2"><circle cx="30" cy="65" r="12"/><circle cx="68" cy="49" r="13"/><circle cx="63" cy="81" r="11"/></g>':'<g fill="#ff718b" stroke="#ad3f61" stroke-width="2"><path d="M22 62q16-16 29 0-1 17-15 28-15-12-14-28M58 44q16-16 29 0-1 17-15 28-15-12-14-28"/></g><g fill="#ffe7aa"><circle cx="33" cy="68" r="2"/><circle cx="39" cy="77" r="2"/><circle cx="70" cy="50" r="2"/></g>';
    return `<svg viewBox="0 0 100 125" aria-hidden="true"><g class="ga-leaves"><path d="M49 108V29" stroke="#52b678" stroke-width="5"/><path d="M48 79C6 70 9 38 26 42c18 5 21 24 22 37M50 65c0-31 24-45 31-26 3 16-16 23-31 26" fill="#5bc981"/>${crop}</g><path d="M21 101h58l-8 23H29z" fill="#a67458"/><path d="M18 100h64v8H18z" fill="#d29f78"/></svg>`;
  }
  function feedback(text){$('#gg-feedback').textContent=text;}
  function reset(){
    document.body.classList.remove('ga-running');
    state={phase:'intro',lane:1,health:[100,100,100],time:0,spawn:0,wave:0,sent:0,shots:[],fx:[],caught:0,hits:0,combo:0,maxCombo:0,score:0,charge:0,burst:0,flash:[0,0,0],banner:0,breakTime:0,lastLane:-1};
    $('.ga-plants').innerHTML=names.map((name,i)=>`<div class="ga-plant" data-plant="${i}"><div class="ga-impact" aria-hidden="true"></div>${plant(i)}<b>${name}</b><div class="ga-healthbar"><i></i></div><span class="ga-plant-health">100%</span><span class="ga-hit-label" aria-hidden="true">RADIATION HIT!</span></div>`).join('');
    $('.gg-victory').hidden=true;$('.ga-intro').hidden=false;$('.ga-banner').textContent='';$('#ga-pause').textContent='Pause';feedback('Watch the orange target. That bed is about to be hit!');render();
  }
  function move(lane){if(state.phase==='end')return;const n=Math.max(0,Math.min(2,lane));if(n!==state.lane)sound('move');state.lane=n;render();}
  function start(){state.phase='play';state.spawn=.8;document.body.classList.add('ga-running');$('.ga-intro').hidden=true;announce('WAVE 1 · PROTECT YOUR PLANTS',1.8);feedback('Move the blue shield under the red streams. Catch them before they reach the plants!');stage.focus({preventScroll:true});if(innerWidth<=650)window.scrollTo({top:0,behavior:'instant'});}
  function announce(text,duration=1.1){$('.ga-banner').textContent=text;state.banner=duration;}
  function burst(){if(state.phase!=='play'||state.charge>0)return;state.burst=2.6;state.charge=7;sound('burst');announce('WATER BURST! ALL THREE BEDS COVERED');feedback('Water Burst catches streams above every bed. Use it when two streams arrive together!');render();}
  function fx(x,y,color,text){state.fx.push({x,y,color,text,t:.9});}
  function resolveShot(shot,blocked){
    if(blocked){state.caught++;state.combo++;state.maxCombo=Math.max(state.maxCombo,state.combo);state.score+=100+Math.min(5,state.combo)*20;sound('catch');fx((shot.lane+.5)/3,.57,'#a2f7ff',state.combo>1?`${state.combo}× CATCH!`:'CAUGHT!');
      if(state.combo===3){state.charge=Math.max(0,state.charge-3);feedback('Three in a row! Bonus charge for your next Water Burst.');}
    }else{state.hits++;state.combo=0;state.health[shot.lane]=Math.max(0,state.health[shot.lane]-18);state.flash[shot.lane]=.65;sound('hit');fx((shot.lane+.5)/3,.79,'#ff8f74','−18 HEALTH');feedback(`Radiation hit the ${names[shot.lane].toLowerCase()}! Move the water shield there to intercept the next stream.`);}
  }
  function spawn(){
    let lane=Math.floor(Math.random()*3);if(lane===state.lastLane)lane=(lane+1+Math.floor(Math.random()*2))%3;state.lastLane=lane;
    state.shots.push({lane,y:-.06,warning:1.05,speed:.29+state.wave*.035,passed:false});state.sent++;
    if(state.wave===2&&state.sent%3===0)state.shots.push({lane:(lane+1)%3,y:-.06,warning:1.05,speed:.3,passed:false});
    sound('warning');
  }
  function finish(){
    state.phase='end';state.shots=[];const average=Math.round(state.health.reduce((a,b)=>a+b,0)/3),stars=average>=75?3:average>=40?2:1;
    best=Math.max(best,state.score);try{localStorage.setItem('greenhouse-best-v2',String(best));}catch{}
    $('.gg-win-stars').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);$('#ga-rating').textContent=stars===3?'GARDEN HERO!':stars===2?'STORM SURVIVOR!':'TRY A NEW STRATEGY!';
    $('#ga-summary').textContent=`${state.caught} streams caught · ${state.hits} plant hits · ${average}% garden health. Score ${state.score} · Best ${best}.`;
    $('.gg-victory').hidden=false;sound('win');$('#gg-replay').focus();render();
  }
  function tick(dt){
    state.time+=dt;state.banner=Math.max(0,state.banner-dt);if(!state.banner)$('.ga-banner').textContent='';state.flash=state.flash.map(t=>Math.max(0,t-dt));state.burst=Math.max(0,state.burst-dt);state.charge=Math.max(0,state.charge-dt);
    state.fx=state.fx.filter(f=>(f.t-=dt)>0);
    if(state.phase==='break'){state.breakTime-=dt;if(state.breakTime<=0){state.phase='play';state.wave++;state.sent=0;state.spawn=.5;announce(`WAVE ${state.wave+1} · ${state.wave===2?'DOUBLE STREAMS!':'KEEP YOUR SHIELD MOVING!'}`,1.8);}return;}
    if(state.phase!=='play')return;
    state.spawn-=dt;if(state.sent<6&&state.spawn<=0){spawn();state.spawn=state.wave===0?1.6:1.4;}
    for(const shot of state.shots){
      if(shot.warning>0){shot.warning-=dt;continue;}shot.y+=shot.speed*dt;
      if(!shot.passed&&shot.y>=.56){shot.passed=true;if(state.burst>0||state.lane===shot.lane){resolveShot(shot,true);shot.dead=true;}}
      if(!shot.dead&&shot.y>=.81){resolveShot(shot,false);shot.dead=true;}
    }
    state.shots=state.shots.filter(s=>!s.dead);
    if(state.sent===6&&!state.shots.length){if(state.wave===2)finish();else{state.phase='break';state.breakTime=2.3;announce('BREATHER · NEXT WAVE COMING',2.3);feedback('Nice work. Keep an eye on every bed—the storm will change lanes.');}}
  }
  function render(){
    const average=Math.round(state.health.reduce((a,b)=>a+b,0)/3);$('#ga-wave').textContent=`${state.wave+1} / 3`;$('#ga-caught').textContent=state.caught;$('#ga-combo').textContent='×'+state.combo;$('#ga-health').textContent=average+'%';$('#gg-progress').textContent=`Garden health: ${average}%`;
    $('.gg-garden-meter i').style.width=average+'%';$('.ga-water-shield').style.left=((state.lane+.5)/3*100)+'%';$('.ga-wide-shield').classList.toggle('ga-active',state.burst>0);
    $('#ga-burst').disabled=state.phase!=='play'||state.charge>0;$('#ga-burst span').textContent=state.burst>0?'ACTIVE':state.charge>0?`${Math.ceil(state.charge)}s`:'READY';
    document.querySelectorAll('[data-lane]').forEach(b=>{b.classList.toggle('ga-chosen',+b.dataset.lane===state.lane);b.setAttribute('aria-pressed',String(+b.dataset.lane===state.lane));});
    state.health.forEach((health,i)=>{const el=$(`[data-plant="${i}"]`);el.style.setProperty('--ga-health',health/100);el.classList.toggle('ga-hurt',state.flash[i]>0);el.classList.toggle('ga-wilted',health<65);el.classList.toggle('ga-depleted',health===0);el.querySelector('.ga-healthbar i').style.width=health+'%';el.querySelector('.ga-plant-health').textContent=health+'%';});
    document.querySelectorAll('.ga-targets span').forEach((el,i)=>el.classList.toggle('ga-targeted',state.shots.some(s=>s.lane===i&&s.warning>0)));
    stage.classList.toggle('ga-paused',state.phase==='paused');
  }
  function draw(){
    ctx.clearRect(0,0,width,height);
    for(const shot of state.shots){
      const x=(shot.lane+.5)/3*width,y=shot.y*height;
      if(shot.warning>0){ctx.fillStyle='#ffb26f';ctx.font='bold 11px Segoe UI';ctx.textAlign='center';ctx.fillText('INCOMING ↓',x,58);continue;}
      const tail=ctx.createLinearGradient(x,y-75,x,y);tail.addColorStop(0,'#ff724400');tail.addColorStop(1,'#ff7a49');ctx.strokeStyle=tail;ctx.lineWidth=9;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y-75);ctx.lineTo(x,y);ctx.stroke();
      ctx.fillStyle='#fff0be';ctx.shadowColor='#ff674d';ctx.shadowBlur=motion?14:0;ctx.beginPath();ctx.arc(x,y,7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
      ctx.fillStyle='#ffc5a0';ctx.font='bold 9px Consolas';ctx.textAlign='center';ctx.fillText('RADIATION',x,y+23);
    }
    state.fx.forEach(f=>{ctx.globalAlpha=Math.min(1,f.t*2);ctx.strokeStyle=f.color;ctx.lineWidth=2;ctx.beginPath();ctx.arc(f.x*width,f.y*height,motion?10+(1-f.t)*44:15,0,Math.PI*2);ctx.stroke();ctx.fillStyle=f.color;ctx.font='bold 12px Segoe UI';ctx.textAlign='center';ctx.fillText(f.text,f.x*width,f.y*height-18-(motion?(1-f.t)*22:0));ctx.globalAlpha=1;});
  }
  function frame(t){const dt=Math.min(.05,(t-last)/1000)||0;last=t;if(!document.hidden&&!['intro','end','paused'].includes(state.phase))tick(dt);render();draw();raf=requestAnimationFrame(frame);}
  function resize(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);width=r.width;height=r.height;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);}
  function pause(){if(state.phase==='paused'){state.phase=state.resume;$('#ga-pause').textContent='Pause';}else if(['play','break'].includes(state.phase)){state.resume=state.phase;state.phase='paused';$('#ga-pause').textContent='Resume';}render();}
  const movePointer=e=>{const r=stage.getBoundingClientRect();move(Math.floor((e.clientX-r.left)/r.width*3));};
  stage.onpointerdown=e=>{if(e.target.closest('button')||state.phase==='intro')return;stage.setPointerCapture(e.pointerId);movePointer(e);};stage.onpointermove=e=>{if(e.buttons===1)movePointer(e);};
  stage.onkeydown=e=>{if(e.target.closest('button'))return;if(['ArrowLeft','ArrowRight',' '].includes(e.key)){e.preventDefault();if(e.key===' ')burst();else move(state.lane+(e.key==='ArrowLeft'?-1:1));}};
  document.querySelectorAll('[data-lane]').forEach(b=>b.onclick=()=>move(+b.dataset.lane));$('#ga-start').onclick=start;$('#ga-burst').onclick=burst;$('#ga-pause').onclick=pause;
  $('#ga-reset').onclick=()=>{reset();$('#ga-start').focus();};$('#gg-replay').onclick=()=>{reset();start();};
  $('#gg-sound').onclick=()=>{quiet=!quiet;if(bus)bus.gain.setValueAtTime(quiet?0:.6,audio.currentTime);$('#gg-sound').textContent=quiet?'Sound off 🔇':'Sound on 🔊';$('#gg-sound').setAttribute('aria-pressed',String(!quiet));};
  function syncMotion(){document.body.classList.toggle('gg-still',!motion);$('#gg-motion').textContent=motion?'Pause effects ⏸':'Play effects ▶';$('#gg-motion').setAttribute('aria-pressed',String(!motion));film.hidden=!motion;if(motion&&!document.hidden)film.play().catch(()=>{film.hidden=true;});else film.pause();}
  $('#gg-motion').onclick=()=>{motion=!motion;syncMotion();};document.addEventListener('visibilitychange',()=>{if(document.hidden&&['play','break'].includes(state.phase)){pause();hiddenPause=true;}else if(hiddenPause){feedback('Game paused while you were away. Press Resume when you’re ready.');hiddenPause=false;}syncMotion();});
  $('.gg-dust').innerHTML=Array.from({length:18},(_,i)=>`<i style="--x:${i*37%100}%;--y:${i*59%100}%;--delay:${-i}s"></i>`).join('');
  new ResizeObserver(resize).observe(stage);window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);film.pause();});
  reset();syncMotion();resize();raf=requestAnimationFrame(frame);
  window.GreenhouseGuard={get state(){return state;}};
})();
