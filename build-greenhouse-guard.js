// Package only the standalone Greenhouse Guard storm-defense game.
const fs=require('node:fs');
const path=require('node:path');
const out=path.join(__dirname,'dist-greenhouse-guard');
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(__dirname,'greenhouse-guard.html'),path.join(out,'index.html'));
for(const file of ['greenhouse-action.js','greenhouse-guard.css']){
  fs.copyFileSync(path.join(__dirname,file),path.join(out,file));
}
fs.cpSync(path.join(__dirname,'assets','space'),path.join(out,'assets','space'),{recursive:true});
console.log('Built standalone Greenhouse Guard in dist-greenhouse-guard/');
