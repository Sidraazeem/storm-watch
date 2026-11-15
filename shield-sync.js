(function(){
 'use strict';
 // Embedded in the main Storm Watch game (shield-sync.html?embed=1): the result is sent back to the game.
 const EMBED=new URLSearchParams(location.search).has('embed');
 const tell=(ok,finished=false,pumps=0)=>{try{parent.postMessage({source:'shield-sync',ok,finished,pumps},location.origin);}catch{}};
 const $=s=>document.querySelector(s),centers=[.25,.72,.14,.61,.34,.82],half=.17,limit=12;
 let s,last=0,raf,quiet=false,motion=!matchMedia('(prefers-reduced-motion: reduce)').matches,audio,bus,best=0;
 try{best=Math.max(0,Number(localStorage.getItem('storm-shield-sync-best'))||0);}catch{}
 const film=$('.ls-film');film.muted=true;
 const distance=(a,b)=>Math.min(Math.abs(a-b),1-Math.abs(a-b));
 function sound(kind){
  try{
   if(quiet)return;audio=audio||new(window.AudioContext||window.webkitAudioContext)();if(!bus){bus=audio.createGain();bus.gain.value=.6;bus.connect(audio.destination);}if(audio.state==='suspended')audio.resume().catch(()=>{});
   const now=audio.currentTime,note=(delay,f,end,d,v,type='sine')=>{const o=audio.createOscillator(),g=audio.createGain(),t=now+delay;o.type=type;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(end,t+d);g.gain.setValueAtTime(.001,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(bus);o.start(t);o.stop(t+d+.01);};
   if(kind==='miss'){note(0,240,180,.1,.025,'triangle');return;}
   note(0,180,65,.22,.16,'triangle');note(0,420,280,.13,.06,'triangle');note(.02,1200,800,.08,.025);
   (kind==='win'?[523,659,784,1046]:kind==='pump'?[392,494,587]:[760]).forEach((f,i)=>note(.07+i*.08,f,f,.4,.03));
  }catch{}
 }
 function arc(center){const start=(center-half)*Math.PI*2-Math.PI/2,end=(center+half)*Math.PI*2-Math.PI/2,r=119;return `M${150+r*Math.cos(start)} ${150+r*Math.sin(start)} A${r} ${r} 0 0 1 ${150+r*Math.cos(end)} ${150+r*Math.sin(end)}`;}
 function feedback(text){$('#ss-feedback').textContent=text;}
 function reset(){s={phase:'practice',pointer:0,locks:0,score:0,time:0,misses:0,perfect:0,effects:[],resume:null};$('.ls-result').hidden=true;$('.ss-effects').replaceChildren();document.body.classList.toggle('ls-running',innerWidth<=650);$('#ss-pause').textContent='Pause';feedback('Practice first! Wait for green, then tap LOCK. The clock starts after your first good lock.');render();}
 function spark(){
  if(!motion)return;const area=$('.ss-effects');for(let i=0;i<26;i++){const dot=document.createElement('i'),a=Math.random()*Math.PI*2,r=40+Math.random()*120;dot.style.setProperty('--dx',Math.cos(a)*r+'px');dot.style.setProperty('--dy',Math.sin(a)*r+'px');area.appendChild(dot);s.effects.push({node:dot,t:1});}
 }
 function finish(){s.phase='end';best=Math.max(best,s.score);try{localStorage.setItem('storm-shield-sync-best',String(best));}catch{}
  const online=Math.floor(s.locks/2);$('#ss-rating').textContent=online===3?'SHIELD READY!':online?'PUMPS RECOVERED!':'TRY ANOTHER SYNC!';$('.ls-stars').textContent='★'.repeat(online)+'☆'.repeat(3-online);
  $('#ss-summary').textContent=`${online} of 3 pumps online · ${s.locks} locks · ${s.perfect} perfect hits · ${s.score} points. Best: ${best}.`;$('.ls-result').hidden=false;sound('win');if(EMBED){$('#ss-replay').textContent=online?'Continue →':'Try again ↻';if(online)tell(true,true,online);}$('#ss-replay').focus();render();
 }
 function lock(){
  if(!['practice','play'].includes(s.phase))return;
  const diff=distance(s.pointer,centers[s.locks]);
  if(diff>half){s.misses++;sound('miss');feedback('Not yet—wait for the white pointer to enter the green band. You keep your locks!');return;}
  const perfect=diff<.065;s.locks++;s.perfect+=perfect?1:0;s.score+=perfect?150:100;sound(s.locks%2===0?'pump':'lock');spark();
  if(s.phase==='practice'){s.phase='play';s.time=0;document.body.classList.add('ls-running');if(innerWidth<=650)window.scrollTo({top:0,behavior:'instant'});}
  feedback(s.locks%2===0?`CLUNK! Pump ${'ABC'[s.locks/2-1]} online. ${s.locks===6?'All water-wall pumps are ready!':'Aim for the next green band.'}`:perfect?'PERFECT LOCK! One more for this pump.':'Good lock! One more for this pump.');
  if(s.locks===6)finish();else render();
 }
 function render(){
  const online=Math.floor(s.locks/2),ready=s.locks<6&&distance(s.pointer,centers[s.locks])<=half;
  $('#ss-time').textContent=s.phase==='practice'?'PRACTICE':Math.ceil(Math.max(0,limit-s.time))+'s';$('#ss-locks').textContent=s.locks+' / 6';$('#ss-score').textContent=s.score;$('#ss-best').textContent=best;$('#ss-banks').textContent=online+' / 3 ONLINE';$('.ss-defense i').style.width=online/3*100+'%';
  $('#ss-phase').textContent=s.phase==='practice'?'PRACTICE · NO TIMER':s.phase==='paused'?'CALIBRATION PAUSED':online===3?'WATER WALLS READY':'SYNC THE PUMP CONTROLS';
  if(s.locks<6){$('#ss-target').setAttribute('d',arc(centers[s.locks]));$('#ss-pump').textContent='PUMP '+'ABC'[Math.floor(s.locks/2)];}
  $('#ss-pointer').setAttribute('transform',`rotate(${s.pointer*360} 150 150)`);$('#ss-ready').textContent=s.phase==='paused'?'PAUSED':ready?'LOCK NOW!':'WAIT…';$('#ss-precision').textContent=ready?'Tap LOCK or Space':'White pointer → green band';
  $('.ss-dial').classList.toggle('ss-in-zone',ready);$('#ss-lock').classList.toggle('ss-lock-ready',ready);$('#ss-lock').disabled=!['practice','play'].includes(s.phase);$('.ss-paused').hidden=s.phase!=='paused';
  document.querySelectorAll('[data-pump]').forEach((el,i)=>{const count=Math.max(0,Math.min(2,s.locks-i*2));el.querySelector('b').textContent=count===2?'● ●':count===1?'● ○':'○ ○';el.classList.toggle('ss-online',count===2);});
  document.querySelectorAll('[data-wall]').forEach((el,i)=>el.classList.toggle('ss-wall-on',i<online));
 }
 function pause(){if(['practice','play'].includes(s.phase)){s.resume=s.phase;s.phase='paused';$('#ss-pause').textContent='Resume';}else if(s.phase==='paused'){s.phase=s.resume;$('#ss-pause').textContent='Pause';}render();}
 function syncMotion(){document.body.classList.toggle('ss-still',!motion);$('#ss-motion').textContent=motion?'Pause effects ⏸':'Play effects ▶';$('#ss-motion').setAttribute('aria-pressed',String(!motion));film.hidden=!motion;if(motion&&!document.hidden)film.play().catch(()=>{film.hidden=true;});else film.pause();}
 function frame(t){const dt=Math.min(.05,(t-last)/1000)||0;last=t;if(!document.hidden&&['practice','play'].includes(s.phase)){s.pointer=(s.pointer+dt/(2.7-Math.floor(s.locks/2)*.16))%1;if(s.phase==='play'){s.time+=dt;if(s.time>=limit)finish();}}
  if(s.phase!=='paused'){s.effects=s.effects.filter(f=>{f.t-=dt;if(f.t<=0){f.node.remove();return false;}return true;});}render();raf=requestAnimationFrame(frame);
 }
 $('#ss-lock').onclick=lock;$('#ss-pause').onclick=pause;$('#ss-reset').onclick=()=>{reset();$('#ss-lock').focus();};$('#ss-replay').onclick=()=>{if(EMBED&&Math.floor(s.locks/2)>0)return tell(true,false,Math.floor(s.locks/2));reset();$('#ss-lock').focus();};
 document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.target.closest('button,a,summary')){e.preventDefault();lock();}});
 $('#ss-sound').onclick=()=>{quiet=!quiet;if(bus)bus.gain.setValueAtTime(quiet?0:.6,audio.currentTime);$('#ss-sound').textContent=quiet?'Sound off 🔇':'Sound on 🔊';$('#ss-sound').setAttribute('aria-pressed',String(!quiet));};$('#ss-motion').onclick=()=>{motion=!motion;syncMotion();};
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&['practice','play'].includes(s.phase))pause();syncMotion();});window.addEventListener('pagehide',()=>{if(['practice','play'].includes(s.phase))pause();cancelAnimationFrame(raf);film.pause();});window.addEventListener('pageshow',e=>{if(e.persisted){last=performance.now();syncMotion();raf=requestAnimationFrame(frame);}});
 reset();syncMotion();raf=requestAnimationFrame(frame);window.ShieldSync={get state(){return s;},centers,half};
})();
