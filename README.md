# Storm Watch

A browser game for the NASA Space Apps Challenge 2026, **Build a Junior Astronaut Mission Trainer**. You run a 4-person base at the Moon's south pole and keep the crew safe through three real solar storms from NASA's DONKI space-weather records.

**Play it:** https://storm-watch-spaceapps.web.app

- Drag astronauts between rooms. Outside they collect science, but have no protection.
- When the alarm sounds, get everyone down to the Storm Shelter before the radiation hits.
- Share limited power between oxygen, water, food and the radiation shield.
- When a machine breaks, send someone to the Workshop and fix it with a quick plug-matching puzzle.
- After each storm, a debrief card shows what really happened, using NASA's own record of that flare.

See [docs/HANDOFF.md](docs/HANDOFF.md) for how it fits the challenge, the NASA data used, and the team's status and next steps.

## Run it locally

No install or build is needed to play locally; it needs a small local web server (double-clicking `index.html` won't load the scripts).

```bash
python -m http.server 8123
```

Then open http://localhost:8123. Add `?speed=4` to the address to fast-forward timers while testing.

## Deploy

Hosted on Firebase Hosting (project `storm-watch-spaceapps`). With the [Firebase CLI](https://firebase.google.com/docs/cli) installed and signed in:

```bash
firebase deploy --only hosting
```

This runs `build.js` first, which wraps `index.html` into a full web page in `dist/` and copies `style.css` and `game.js` alongside it.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page frame (written without `<html>`/`<head>` tags so it can also be published as a claude.ai artifact) |
| `style.css` | Look and layout |
| `game.js` | NASA data loader, game rules, drag-and-drop, repair mini-game, drawing, sound |
| `build.js` | Builds the Firebase copy in `dist/` |
| `firebase.json`, `.firebaserc` | Firebase Hosting settings and project |

## Data credit

Solar flare and solar energetic particle records: NASA Community Coordinated Modeling Center (CCMC), [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) Space Weather Database Of Notifications, Knowledge, Information.
