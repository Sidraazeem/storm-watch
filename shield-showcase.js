// Cinematic presentation for the easy, standalone puzzle. No difficulty changes.
(function(){
  'use strict';
  let cleanup=()=>{},quiet=false,audio,audioBus,motion=!matchMedia('(prefers-reduced-motion: reduce)').matches;
  function audioReady(){
    if(quiet)return false;
    audio=audio||new(window.AudioContext||window.webkitAudioContext)();
    if(!audioBus){audioBus=audio.createGain();audioBus.gain.value=.65;audioBus.connect(audio.destination);}
    if(audio.state==='suspended')audio.resume().catch(()=>{});
    return true;
  }
  function tone(frequency=440,duration=.1,type='sine'){
    try{
      if(!audioReady())return;
      const oscillator=audio.createOscillator(),gain=audio.createGain();
      oscillator.type=type;oscillator.frequency.value=frequency;
      gain.gain.setValueAtTime(.035,audio.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audio.currentTime+duration);
      oscillator.connect(gain);gain.connect(audioBus);oscillator.start();oscillator.stop(audio.currentTime+duration);
    }catch{}
  }
  function electric(kind='turn',level=0){
    try{
      if(!audioReady())return;
      const now=audio.currentTime;
      if(kind==='connect'||kind==='bank'){
        // Damped low impact plus two inharmonic metal resonances: a relay CLUNK.
        [[180,65,.18,.23],[390,270,.075,.15],[1170,810,.035,.08]].forEach(([start,end,volume,duration])=>{
          const hit=audio.createOscillator(),body=audio.createGain();hit.type='triangle';
          hit.frequency.setValueAtTime(start,now);hit.frequency.exponentialRampToValueAtTime(end,now+duration);
          body.gain.setValueAtTime(.001,now);body.gain.linearRampToValueAtTime(volume,now+.003);body.gain.exponentialRampToValueAtTime(.001,now+duration);
          hit.connect(body);body.connect(audioBus);hit.start(now);hit.stop(now+duration+.01);
        });
        if(kind==='connect')return; // Let the mechanical impact stand out from the chirps.
      }
      // A short filtered noise burst gives the switch its electrical crackle.
      const length=kind==='turn'?.075:.16,buffer=audio.createBuffer(1,Math.ceil(audio.sampleRate*length),audio.sampleRate);
      const samples=buffer.getChannelData(0);
      for(let i=0;i<samples.length;i++)samples[i]=(Math.random()*2-1)*Math.pow(1-i/samples.length,2);
      const noise=audio.createBufferSource(),filter=audio.createBiquadFilter(),gain=audio.createGain();
      noise.buffer=buffer;filter.type='bandpass';filter.frequency.value=kind==='turn'?1900:2800;filter.Q.value=.7;gain.gain.value=.045;
      noise.connect(filter);filter.connect(gain);gain.connect(audioBus);noise.start(now);
      // Rising power sweep, followed by a small musical chord for each bank.
      const sweep=audio.createOscillator(),envelope=audio.createGain();
      sweep.type='triangle';sweep.frequency.setValueAtTime(kind==='turn'?200:150,now);sweep.frequency.exponentialRampToValueAtTime(kind==='turn'?410:850,now+.16);
      envelope.gain.setValueAtTime(.022,now);envelope.gain.exponentialRampToValueAtTime(.001,now+.25);
      sweep.connect(envelope);envelope.connect(audioBus);sweep.start(now);sweep.stop(now+.26);
      if(kind==='bank'||kind==='win'){
        const notes=kind==='win'?[523.25,659.25,783.99,1046.5]:[392,493.88,587.33].map(f=>f*Math.pow(2,level/12));
        notes.forEach((frequency,i)=>{
          const oscillator=audio.createOscillator(),volume=audio.createGain(),start=now+i*.075;
          oscillator.type='sine';oscillator.frequency.value=frequency;
          volume.gain.setValueAtTime(.001,start);volume.gain.linearRampToValueAtTime(.025,start+.018);volume.gain.exponentialRampToValueAtTime(.001,start+.55);
          oscillator.connect(volume);volume.connect(audioBus);oscillator.start(start);oscillator.stop(start+.56);
        });
      }
    }catch{}
  }
  function play(){
    cleanup();
    const host=document.querySelector('#easy');
    const state=ShieldRepair.start({host,demo:true,solar:true,sound:tone,
      event:{cls:'X8.2',date:'September 10, 2017',mins:19,sepInst:'GOES13: SEM/EPS >100 MeV',fromNasa:false,link:'https://ccmc.gsfc.nasa.gov/DONKI/view/FLR/13098/-1'},
      onComplete:play,onExit:play});
    host.classList.add('se-card');
    host.querySelector('.sr-eyebrow').textContent='EASY VERSION · SIX WIRE TILES';
    const layout=document.createElement('div');layout.className='se-layout';
    const cinema=document.createElement('aside');cinema.className='se-cinema';cinema.setAttribute('aria-label','NASA solar observation and solar panel power display');
    cinema.innerHTML=`<img class="se-solar" src="assets/space/flare.jpg" alt="Real SDO ultraviolet image of the September 10, 2017 solar flare">
      <video class="se-film" src="assets/space/solar-loop.mp4" poster="assets/space/flare.jpg" muted loop playsinline preload="metadata" aria-hidden="true"></video>
      <div class="se-shade"></div><div class="se-dust" aria-hidden="true">${Array.from({length:18},(_,i)=>`<i style="--x:${(i*37)%100}%;--y:${(i*61)%100}%;--delay:${-i}s"></i>`).join('')}</div>
      <div class="se-title"><span class="se-label">REAL NASA FOOTAGE / ARCHIVE</span><h1>SOLAR<br><em>REBOOT</em></h1><p>The storm tripped the controls.<br>Reconnect the panels.<br><b>Bring your base back to life.</b></p></div>
      <div class="se-dome"><svg viewBox="0 0 320 300" role="img" aria-label="Three solar panel sections powering an illustrated Moon base"><defs><linearGradient id="se-ground" x2="0" y2="1"><stop stop-color="#51647a"/><stop offset="1" stop-color="#142336"/></linearGradient></defs>
        <ellipse cx="160" cy="239" rx="149" ry="35" fill="url(#se-ground)"/><ellipse cx="160" cy="235" rx="117" ry="21" fill="#74879a22"/>
        <g class="se-base"><path d="M103 229v-42q0-18 18-18h70q18 0 18 18v42" fill="#cadce6"/><path d="M116 177h80v21h-80z" fill="#234354"/><path d="M142 229v-23h29v23" fill="#142e42"/><path d="M208 211h33v17h-33M77 207h25v21H77" fill="#7896ac"/><path d="M188 170v-20m-10-8q10 17 20 0" fill="none" stroke="#b2d2e2" stroke-width="3"/><rect x="34" y="198" width="35" height="20" rx="2" fill="#5486b1"/><path d="M51 218v14m194-38h38v22h-38zM264 216v16" fill="#5486b1" stroke="#98c4db" stroke-width="2"/><path d="M45 228h230" stroke="#c2d8e4" stroke-width="2"/></g>
        ${[38,127,216].map((x,i)=>`<g class="se-panel" data-panel="${i}" transform="translate(${x} 88)"><path class="se-panel-cable" d="M32 67v18L${160-x} 124"/><rect class="se-panel-frame" width="66" height="65" rx="4"/><path class="se-panel-cells" d="M22 0v65M44 0v65M0 22h66M0 44h66"/><circle class="se-panel-light" cx="33" cy="75" r="4"/></g>`).join('')}
        <g class="se-crew" fill="#e7f5ff"><circle cx="129" cy="217" r="4"/><rect x="126" y="221" width="6" height="10" rx="2"/><circle cx="190" cy="217" r="4"/><rect x="187" y="221" width="6" height="10" rx="2"/></g></svg></div>
      <div class="se-protection"><span>SOLAR ARRAY OUTPUT</span><strong><b id="se-banks">0</b> / 3 panels online</strong><div class="se-meter"><i></i></div></div>
      <div class="se-credit">September 10, 2017 · X8.2 solar flare<br><a href="https://svs.gsfc.nasa.gov/12706" target="_blank" rel="noopener">NASA / GSFC / SDO ↗</a><small>Panels and Moon base are game graphics.</small></div>
      <button class="se-motion" aria-pressed="false">Pause motion ⏸</button>`;
    const console=document.createElement('div');console.className='se-console';
    const result=host.querySelector('.sr-result');
    for(const node of [...host.children])if(!node.classList.contains('sr-topline')&&node!==result)console.appendChild(node);
    layout.append(cinema,console);host.appendChild(layout);
    const effects=document.createElement('div');effects.className='se-effects';effects.setAttribute('aria-hidden','true');host.appendChild(effects);
    const sound=document.createElement('button');sound.className='se-sound';
    const updateSound=()=>{sound.textContent=quiet?'Sound off 🔇':'Sound on 🔊';sound.setAttribute('aria-pressed',String(!quiet));};
    sound.onclick=()=>{quiet=!quiet;if(audioBus)audioBus.gain.setValueAtTime(quiet?0:.65,audio.currentTime);updateSound();};updateSound();host.querySelector('.sr-topline').appendChild(sound);
    const film=cinema.querySelector('video');film.muted=true;
    let lastPlay=null,lastCount=0,celebrated=false,lastPower=new Set();const pending=[];
    const tiles=[...host.querySelectorAll('.sr-tile')];
    // Local sparks stay attached to their switch, including on a scrolled phone.
    function switchSparks(tile,count=14,connected=false){
      if(!motion)return;
      const sparks=document.createElement('span');sparks.className='se-switch-fx';sparks.setAttribute('aria-hidden','true');
      for(let i=0;i<count;i++){
        const spark=document.createElement('i'),angle=Math.random()*Math.PI*2,radius=18+Math.random()*(connected?68:42);
        spark.style.setProperty('--sx',Math.cos(angle)*radius+'px');spark.style.setProperty('--sy',Math.sin(angle)*radius+'px');spark.style.setProperty('--angle',angle+'rad');spark.style.setProperty('--life',(.35+Math.random()*.4)+'s');
        if(connected)spark.classList.add('se-connection-spark');sparks.appendChild(spark);
      }
      tile.appendChild(sparks);pending.push(setTimeout(()=>sparks.remove(),850));
    }
    function surge(tile){
      if(!motion)return;
      const ring=document.createElement('span');ring.className='se-switch-wave';ring.setAttribute('aria-hidden','true');tile.appendChild(ring);pending.push(setTimeout(()=>ring.remove(),900));
    }
    tiles.forEach(tile=>{
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.classList.add('se-current');tile.querySelector('svg').appendChild(path);
      if(tile.disabled)return;
      const turn=tile.onclick;
      tile.onclick=event=>{
        if(state.paused||state.done)return;
        turn(event);switchSparks(tile);electric('turn');update();
      };
    });
    function sync(){
      host.classList.toggle('se-still',!motion);
      const button=cinema.querySelector('.se-motion');button.textContent=motion?'Pause motion ⏸':'Play motion ▶';button.setAttribute('aria-pressed',String(!motion));
      const shouldPlay=motion&&!state.paused&&!document.hidden;
      film.hidden=!motion;
      if(shouldPlay!==lastPlay){lastPlay=shouldPlay;if(shouldPlay)film.play().catch(()=>{film.hidden=true;});else film.pause();}
    }
    function burst(n){
      if(!motion)return;
      for(let i=0;i<n;i++){
        const dot=document.createElement('i'),angle=Math.random()*Math.PI*2,distance=80+Math.random()*280;
        dot.style.setProperty('--dx',Math.cos(angle)*distance+'px');dot.style.setProperty('--dy',Math.sin(angle)*distance+'px');
        dot.style.left=(35+Math.random()*40)+'%';dot.style.top=(25+Math.random()*40)+'%';dot.style.setProperty('--hue',String(100+Math.random()*80));effects.appendChild(dot);
        pending.push(setTimeout(()=>dot.remove(),1500));
      }
    }
    const update=()=>{
      if(ShieldRepair.active!==state)return;
      const power=ShieldRepair.powered(state.cells);
      tiles.forEach((tile,i)=>{
        tile.querySelector('.se-current').setAttribute('d',tile.querySelector('.sr-track').getAttribute('d'));
        if(power.has(i)&&!lastPower.has(i)){switchSparks(tile,22,true);surge(tile);}
      });
      if([...power].some(i=>!lastPower.has(i)))electric('connect');
      lastPower=power;
      const count=state.latched.filter(Boolean).length;
      cinema.querySelector('#se-banks').textContent=count;cinema.querySelector('.se-meter i').style.width=(count/3*100)+'%';
      cinema.querySelectorAll('.se-panel').forEach((panel,i)=>panel.classList.toggle('se-panel-on',state.latched[i]));
      host.style.setProperty('--se-charge',String(count/3));
      if(count>lastCount){burst(45);electric('bank',count*2);lastCount=count;}
      if(state.done&&!celebrated){celebrated=true;electric('win');result.classList.add('se-victory');const ring=document.createElement('div');ring.className='se-victory-ring';ring.setAttribute('aria-hidden','true');result.prepend(ring);burst(100);}
      sync();
    };
    cinema.querySelector('.se-motion').onclick=()=>{motion=!motion;sync();};
    const timer=setInterval(update,100);document.addEventListener('visibilitychange',sync);
    cleanup=()=>{clearInterval(timer);pending.forEach(clearTimeout);film.pause();document.removeEventListener('visibilitychange',sync);};
    const data=host.querySelector('.sr-data');
    const credit=document.createElement('p');credit.innerHTML='Real SDO solar imagery, colorized ultraviolet. <a href="assets/space/CREDITS.md" target="_blank" rel="noopener">Media credits</a>. The movie is an archived, slowed excerpt. Reconnecting solar-panel controls, the tripped circuits, and the celebration are fictional game mechanics, not documented damage in this NASA record.';data.appendChild(credit);
    update();
  }
  window.addEventListener('pagehide',()=>cleanup());
  play();
})();
