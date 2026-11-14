// Package the standalone panel repair without the main Storm Watch game.
const fs=require('node:fs');
const path=require('node:path');
const out=path.join(__dirname,'dist-solar-reboot');
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(__dirname,'solar-panels.html'),path.join(out,'index.html'));
for(const file of ['shield-repair.js','shield-repair.css','shield-showcase.js','shield-showcase.css']){
  fs.copyFileSync(path.join(__dirname,file),path.join(out,file));
}
fs.cpSync(path.join(__dirname,'assets','space'),path.join(out,'assets','space'),{recursive:true});
console.log('Built standalone Solar Reboot in dist-solar-reboot/');
