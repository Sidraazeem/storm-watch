const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const match=require('../cosmic-match.js');

test('each shuffled mission has exactly two of each picture',()=>{
  let seed=19;
  const random=()=>((seed=(seed*16807)%2147483647)/2147483647);
  const layouts=new Set();
  for(let n=0;n<200;n++){
    const deck=match.makeDeck(random);assert.equal(deck.length,6);
    for(const r of match.records)assert.equal(deck.filter(id=>id===r.id).length,2);
    layouts.add(deck.join(','));
  }
  assert.ok(layouts.size>30);
});

test('all picture facts trace to the same linked NASA event chain',()=>{
  const record=JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/donki-2017.json'),'utf8').replace(/^\uFEFF/,''));
  const [flare,cloud,particles]=match.records;
  assert.equal(flare.recordID,record.flare.flrID);assert.equal(flare.value,record.flare.classType);assert.equal(flare.link,record.flare.link);
  assert.equal(cloud.recordID,record.cme.activityID);assert.equal(cloud.value,record.cme.startTime);assert.equal(cloud.link,record.cme.link);
  assert.ok(record.cme.linkedEvents.some(e=>e.activityID===flare.recordID));
  assert.equal(particles.recordID,record.particle.sepID);assert.equal(particles.value,record.particle.eventTime);assert.equal(particles.link,record.particle.link);
  assert.ok(record.particle.linkedEvents.some(e=>e.activityID===flare.recordID));
  const minutes=(Date.parse(record.particle.eventTime)-Date.parse(record.flare.peakTime))/60000;
  assert.equal(minutes,19);assert.ok(particles.fact.includes(minutes+' minutes'));
});

test('all observation images are bundled with NASA source attribution',()=>{
  for(const r of match.records){
    const media=match.media[r.id];
    assert.ok(fs.statSync(path.join(__dirname,'..',media.image)).size>10000);
    assert.ok(new URL(media.page).hostname.endsWith('nasa.gov'));
    assert.ok(media.credit.includes('NASA'));
  }
  assert.ok(fs.statSync(path.join(__dirname,'../assets/space/solar-loop.mp4')).size>100000);
});
