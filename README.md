# Storm Watch

A browser game for the NASA Space Apps Challenge 2026, **Build a Junior Astronaut Mission Trainer**. Kids aged 7 to 12 command a 4-person base at the Moon's south pole and keep the crew safe through real solar storms from NASA's DONKI space-weather records.

**Play it:** https://storm-watch-spaceapps.web.app

## How it plays

1. **Pack the rocket on Earth.** It lifts only 10 crates, so more supplies means less gear (spare parts, radiation vests, science kit, battery).
2. **Launch, then run the base.** Drag astronauts between rooms. Outside they collect science stars but have no protection.
3. **Storm warning.** Mission Control radios in a real flare from NASA's records. A Storm Tracker shows its class, sunspot region and the real warning time. Get everyone down to the Storm Shelter.
4. **Radiation storm.** Share limited power between oxygen, water, food and the water-wall shield. Machines break; three team-built mini-games fix them:
   - **Cosmic Match** reboots the oxygen machine
   - **Greenhouse Guard** shields the plants in severe storms
   - **Solar Reboot** brings the solar panels back online
5. **Debrief.** What really happened in that storm, a quiz question, and a report of what each choice cost.
6. **Finale.** After the 2017 storm, the aurora it caused at Mars (seen by NASA's MAVEN), then a Flight Readiness Rating and badges. Endless mode continues with more real storms.

## What the challenge asks for, and where it is

| Challenge element | In the game |
| --- | --- |
| Ages 7 to 12, plain language | Three levels (Cadet 7-9, Pilot 10-12, Commander for older players); tap-to-explain chips for radiation dose (mSv), microgravity, sol and more; spoken Mission Control; hints |
| Life support | Oxygen, water and food in real kilograms at NASA BVAD rates; oxygen is made by splitting water |
| Radiation shielding | Deeper rooms are safer; powered water-wall shield; radiation vests; dose tracked per astronaut |
| Power budgeting | 14 kW shared between four machines; less when panels fold or go offline |
| Food production | Greenhouse with a garden that storms damage and the Botanist regrows |
| Communication delay | Call Mission Control: the answer takes 2.6 seconds (1.3 each way), with the Mars comparison |
| Every choice costs something | Packing limit, power sharing, science versus safety; the debrief lists what each choice cost |
| Compounding consequences | Garden damage slows food for days; dose never goes down; panels stay offline until rebooted |
| Real data, attributed in the tool | "Real NASA data" panel, source on every fact card, live/saved marker on every storm |

## NASA data used

| Source | Used for |
| --- | --- |
| NASA CCMC [DONKI](https://ccmc.gsfc.nasa.gov/tools/DONKI/) | Every storm: flare class, time, sunspot region, particle arrival (real warning time), CME speed. Storm 1 is fetched live: the strongest flare of the last 30 days |
| NASA Life Support BVAD (NASA/TP-2015-218570 Rev2) | Crew oxygen, water and food use |
| NASA [OSDR](https://osdr.nasa.gov/bio/repo/search) | Bone-loss and radiation biology fact cards (OSD-417, OSD-342, OSD-2) |
| NASA MAVEN and Curiosity RAD | September 2017 Mars aurora and surface radiation |
| NASA LRO (Diviner, Moon Trek) | South-pole temperature and sunlight facts |
| NASA Artemis I (MARE) | Radiation vest |
| NASA Deep Space Network | Signal delay |
| Chang'e-4 LND (not NASA) | Background radiation on the lunar surface, 1.369 mSv per day |
| NASA SDO | Sun imagery in the mini-games (see `assets/space/CREDITS.md`) |

In-game storm strength, countdown lengths, tank sizes and difficulty multipliers are game settings, not NASA values. They are marked as such in the code.

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

This runs `build.js` first, which wraps `index.html` into a full web page in `dist/` and copies the scripts, styles, mini-games and media alongside it.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page frame (written without `<html>`/`<head>` tags so it can also be published as a claude.ai artifact) |
| `style.css`, `wow.css` | Look and layout; `wow.css` is the polish layer (fonts, cards, transitions) |
| `game.js` | Game rules and flow: NASA data loader, levels, packing, storms, repairs, debrief, scoring |
| `scene.js` | Everything drawn on the canvas: sky, base, crew, storms, launch and aurora cutscenes |
| `sfx.js` | Sound effects, ambience and radio voices, all synthesized in the browser |
| `learn.js` | Glossary chips, fact cards, quiz, Cadet Logbook, data sources panel |
| `crew.js` | Team portraits, Commander customization, crew introductions |
| `cosmic-match.*`, `solar-panels.html` + `shield-*`, `greenhouse-*` | The three mini-games (also playable on their own) |
| `build.js`, `firebase.json`, `.firebaserc` | Firebase Hosting build and settings |

See [docs/HANDOFF.md](docs/HANDOFF.md) for team notes.
