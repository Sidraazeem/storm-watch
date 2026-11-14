// Build only the standalone Cosmic Match mini-game.
const fs=require('node:fs');
const path=require('node:path');
const out=path.join(__dirname,'dist-cosmic-match');
fs.mkdirSync(out,{recursive:true});
fs.copyFileSync(path.join(__dirname,'cosmic-match.html'),path.join(out,'index.html'));
for(const file of ['cosmic-match.js','cosmic-match.css'])fs.copyFileSync(path.join(__dirname,file),path.join(out,file));
fs.cpSync(path.join(__dirname,'assets','space'),path.join(out,'assets','space'),{recursive:true});
console.log('Built standalone Cosmic Match in dist-cosmic-match/');
