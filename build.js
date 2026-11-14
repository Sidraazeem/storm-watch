// Builds the Firebase Hosting copy in dist/.
// index.html is written without <html>/<head> tags (the claude.ai artifact adds them),
// so this wraps it in a full page for normal web hosting. Run: node build.js
const fs = require('fs');
const path = require('path');

const src = __dirname;
const out = path.join(src, 'dist');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out);

let body = fs.readFileSync(path.join(src, 'index.html'), 'utf8');
const headTags = (body.match(/^\s*<(title|link)\b.*$/gm) || []).map(s => s.trim());
body = body.replace(/^\s*<(title|link)\b.*$\n?/gm, '');
body = body.replace(/^\s*<meta charset[^>]*>\s*$\n?/gim, '');   // the page head below sets the charset
const page = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Keep a Moon base crew safe through real solar storms from NASA's DONKI records. NASA Space Apps 2026.">
${headTags.join('\n')}
</head>
<body>
${body}
</body>
</html>
`;
fs.writeFileSync(path.join(out, 'index.html'), page);
for (const f of ['style.css', 'game.js']) fs.copyFileSync(path.join(src, f), path.join(out, f));
// Greenhouse Guard mini-game (opened from the main game during severe storms) and its NASA media
for (const f of ['greenhouse-guard.html', 'greenhouse-guard.css', 'greenhouse-action.js']) fs.copyFileSync(path.join(src, f), path.join(out, f));
fs.cpSync(path.join(src, 'assets'), path.join(out, 'assets'), { recursive: true });
// crew photos (optional): copy only the image files
const crew = path.join(src, 'crew');
if (fs.existsSync(crew)) fs.cpSync(crew, path.join(out, 'crew'), { recursive: true, filter: f => fs.statSync(f).isDirectory() || /\.(jpe?g|png|webp)$/i.test(f) });
console.log('Built dist/ (index.html, style.css, game.js, Greenhouse Guard, assets, crew photos)');
