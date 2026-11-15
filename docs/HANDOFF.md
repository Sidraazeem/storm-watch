# Storm Watch — Team Handoff

As of Nov 14, 2026. The live, editable version of this handoff is a shared Claude doc; this file is a snapshot of it.

## Summary

Storm Watch is a browser game for the **Build a Junior Astronaut Mission Trainer** challenge: players run a 4-person base at the Moon's south pole and keep the crew alive through three real solar storms pulled from NASA's DONKI space-weather feed. It plays like a cutaway base-management game (in the spirit of FTL and Fallout Shelter): drag astronauts between rooms, share limited power, fix breakdowns with a quick mini-game.

It is playable start to finish today. Difficulty is untuned, the art is simple drawn shapes, and nobody has played a full game at normal speed yet.

## How it fits the challenge

Every element of the challenge brief maps to something the player does. Brief as summarized by Space Data Atlas: *build an interactive game or app where students run a lunar or Martian outpost balancing life support, radiation shielding, power, and food.*

| Challenge asks for | Where it is in Storm Watch |
| --- | --- |
| Interactive game for students | Drag-and-drop base game, about 6 minutes a run, almost no reading during play |
| Lunar or Martian outpost | 4-person base at the lunar south pole: surface, Greenhouse, Workshop, Storm Shelter |
| Life support | Oxygen, water and food are tracked in real kg and drain per crew member at NASA BVAD rates (more when working outside, less when resting in the shelter). The oxygen machine makes air from water by electrolysis, so water and oxygen are linked |
| Radiation shielding | Rooms shield differently (surface 100%, Greenhouse and Workshop 50%, Shelter 10% of outside dose); a powered water-wall shield cuts up to 60% more; crew radiation dose is tracked against a career limit |
| Power | 14 kW shared between four systems with + / −; drops to 10 kW when solar panels fold during a storm |
| Food | Greenhouse grow lights plus crew working there; plants visibly wilt as food runs low |
| Real NASA data (suggested: DONKI, Curiosity RAD, life-support baselines) | Storms come from NASA DONKI flare and particle-event records, including the real warning time between flare and radiation |
| Learning outcome | After each storm a debrief card shows what really happened, the flare class, sunspot region and real warning time, with a link to the NASA record |

The brief wording above comes from Space Data Atlas (spacedata.swapniltamse.com), not NASA's official page. See *Before we submit*.

## How the game plays

A run is three storms, each with the same four beats:

1. **All clear (25 s):** send crew outside for science stars, keep tanks topped up, set power.
2. **Storm incoming (20 s, then 15 s, then 10 s):** alarm, voice warning, a storm front sweeps from the Sun. Get everyone down the ladder to the Storm Shelter.
3. **Radiation storm (30–40 s):** red streaks rain down, panels fold, power drops, machines break and spark. Someone must leave the shelter to repair them.
4. **Debrief card:** crew health and dose, plus the real NASA facts for that storm.

After storm 3 the player gets a Flight Readiness Rating (Cadet, Mission Specialist, Mission Commander, Flight Director, or Mission Failed).

**Controls:** drag an astronaut onto a room (or tap the astronaut, then the room). Use + / − under each system for power. A broken machine shows a red FIX bubble; with someone in the Workshop, tap it and match coloured plugs to sockets.

| Crew | Role | Sash and emblem | Perk |
| --- | --- | --- | --- |
| Commander (the player's own astronaut, customizable) | Commander | Player's choice of colour, star | Moves 2x faster |
| Brian | Engineer | Slate grey, ball bearing | Repair puzzle has 3 plugs instead of 4 |
| Sidra | Botanist | Green, leaf | Grows 2x food in the Greenhouse |
| Quan | Geologist | Copper, rock | Earns 2x science outside |

The crew are drawn after the team members. Each has a portrait on the crew cards, the start screen and the debrief. On the start screen, **Customize your Commander** sets the player's name, sash colour, skin tone, hair or hijab, hair colour, glasses / earrings / necklace and beard; choices are saved in the browser on that device. When the mission begins, the camera zooms in on each crew member in turn: helmet off, with a speech bubble explaining their perk (Next / Skip intro, or it moves on by itself after 6 seconds). **Team photos:** put `brian.jpg`, `sidra.jpg` and `quan.jpg` in the `crew/` folder and the game pixelates them automatically; until then the drawn portraits are used (see `crew/README.md`). If the Commander is evacuated the game continues and the next crew member takes command. No NASA logos are used on the suits (NASA's insignia need explicit permission).

**Greenhouse and Greenhouse Guard:** the greenhouse has a garden health (shown as GARDEN % in the room). Only **severe storms** hurt it: storms from X-class flares with a real radiation storm (storms 2 and 3; storm 1 only if the live flare is that strong). Unprotected, the Gannon storm costs about 30% and the 2017 storm about 60% (less with the water shield on). A green **🌱 PROTECT** bubble appears on the greenhouse and on the Food card; it opens the team's **Greenhouse Guard** mini-game inside the main game (`greenhouse-guard.html?embed=1`), and the base pauses. The mini-game starts at the current garden health; its final garden health comes back to the main game and the plants are safe for the rest of that storm. **Food production scales with garden health**, and the garden regrows between storms while the grow lights are on (about 4x faster with Sidra in the greenhouse). The standalone Greenhouse Guard site works exactly as before.

**Score** = science + crew health × 2 + supplies left − total radiation dose. A crew member is evacuated if their dose reaches 1,000 mSv or their health hits zero from running out of oxygen, water or food.

## NASA data used

All storm data comes from NASA's DONKI space-weather API (`ccmc.gsfc.nasa.gov/DONKI-API`), which needs no key or login and works from the browser. The game loads it on the start screen and uses a saved copy if NASA can't be reached in 7 seconds, so a dead Wi-Fi never breaks the demo.

| Storm | Source | Flare | Real warning time |
| --- | --- | --- | --- |
| 1 | Strongest flare of the last 30 days, fetched live (changes on its own) | M3.5, Nov 5, 2026 (as of Nov 14) | None: no radiation storm followed, so the card says "Real flare, practice storm" |
| 2 | Gannon storm, flare `2024-05-11T01:10:00-FLR-001` | X5.8, May 11, 2024 | 47 minutes |
| 3 | Flare `2017-09-10T15:35:00-FLR-001` | X8.2, Sep 10, 2017 | 19 minutes |

Warning time = minutes from flare peak to the first linked solar energetic particle (SEP) event, preferring the >100 MeV detector.

**Real vs. game tuning:** flare class, dates, sunspot region and warning times are real. Crew oxygen, water and food use per day come from NASA's Life Support Baseline Values and Assumptions Document (BVAD, NASA/TP-2015-218570 Rev2, 2022), and the water-to-oxygen ratio (18 kg water gives 16 kg oxygen) is real chemistry. Storm strength in play, tank sizes, machine output, which BVAD rate goes with which activity, and the 1,000 mSv evacuation point are game settings chosen for difficulty, not NASA values. The 600 mSv line shown on dose bars is NASA's astronaut career limit. Not used yet: Curiosity RAD readings, Moon Trek imagery.

**Time scale:** 1 game second = 1 hour on the base, shown as a Day / time clock in the header. During the storm warning the clock slows so the countdown covers the real warning time from NASA's records (47 minutes for storm 2, 19 for storm 3, a 30-minute drill for storm 1 when no radiation followed).

## Running it and the code

See the [README](../README.md) for running locally and deploying. Live site: [storm-watch-spaceapps.web.app](https://storm-watch-spaceapps.web.app) (public, any device, live NASA data), hosted on Firebase project `storm-watch-spaceapps`.

| File | What is in it |
| --- | --- |
| `index.html` | Page frame: header, game canvas, crew chips, power and system bar |
| `style.css` | Dark mission-control look, storm red-alert styles, mini-game and debrief cards |
| `game.js` | Everything else: NASA DONKI loader and saved fallback, room layout, game loop and rules, drag-and-drop, repair mini-game, canvas drawing, sound and voice |
| `build.js`, `firebase.json` | Firebase Hosting build and settings |

Useful spots in `game.js`: `CAMPAIGN` (which storms and their timings), `ZONES` (rooms and shielding), `tick()` (all game rules and rates), `endGame()` (scoring and ratings), `draw()` (everything on screen).

## Status and next steps

**Checked in the browser, no errors:** NASA data loads live and falls back to the saved copy offline; drag-and-drop moves crew through the ladder shaft; storms break machines and the plug mini-game fixes them; the flow from storm to debrief to final rating and replay. These were checked with timers skipped, so a full game at normal speed is still untested.

**Known gaps:**

- Difficulty is untuned. A passive player loses all four crew by storm 3.
- Power is still + / − buttons, the least game-like part.
- Art is simple drawn shapes; no 3D or Moon Trek imagery yet.
- Mission Control voice uses the browser's built-in speech, scripted, no AI yet.
- Not checked on a phone.

Next steps (put a name on each):

- [ ] Play 3 full games at normal speed and tune difficulty
- [x] Host a shareable link on Firebase (storm-watch-spaceapps.web.app)
- [ ] Visual polish: Moon Trek south pole imagery, better astronaut art, more storm effects
- [ ] Gemini as Mission Control: varied crisis lines and an after-action debrief, with scripted lines as fallback
- [x] Use life-support baseline (BVAD) numbers for oxygen, water and food use, and cite them
- [ ] Test on phone and tablet
- [ ] Record the demo video and write the project page

## Before we submit

Submissions close Sunday, Nov 15 at 11:59 PM local time (per the Space Apps schedule as relayed by Gemini; confirm on the official site).

- [ ] Read the official Junior Astronaut Mission Trainer page at spaceappschallenge.org/2026/challenges and confirm the wording in *How it fits the challenge*
- [ ] Confirm we are entering Mission Trainer, not Space Mission Design Game (that one is about pre-launch choices: rocket, mass, budget, comms)
- [ ] Fact-check the debrief text for storms 2 and 3 (Gannon storm, Curiosity RAD reading in Sept 2017); it was written from memory, not a cited source
- [ ] Credit NASA DONKI on the project page and in the game
- [ ] Plan the 2-minute demo: start on the live-data screen, drag crew to the shelter as the storm hits, fix one machine, show the debrief card
- [ ] Have the offline fallback ready in case venue Wi-Fi drops during judging

## Judging build (Nov 14, evening)

Both pull requests are merged, plus a full pass on gameplay, graphics, sound and learning. See the README for the challenge-fit table and data sources.

**From the pull requests**

- Sidra's PR is merged as is: BVAD life support in real kilograms, the team crew with portraits and Commander customization, crew introductions, garden health and Greenhouse Guard.
- Quan's PR is merged with fixes. The launch-prep screen is now "Pack your rocket" (it used `CARGO[k].bonus`, which did not exist, so tanks became NaN). The per-storm calm timer is kept. The fourth storm was labelled X3.3 on 2023-05-11, but NASA DONKI lists that flare as M2.1 with no radiation storm; it is replaced with the real M4.2 flare of 2023-05-09, which did send particles to GOES. The X3.3 flare Quan may have meant (2024-02-09) is in Endless mode.

**New in this build**

- Flow: title → crew intro → pack the rocket → launch cutscene → 4 storms → Mars aurora finale → rating and badges → optional Endless mode with six more real storms.
- Three levels: Cadet (ages 7-9, hints and an "Everyone to the shelter" button), Pilot (10-12), Commander (older players).
- All three mini-games open inside the main game with an animated transition: Cosmic Match fixes oxygen, Greenhouse Guard protects plants, Solar Reboot restores the panels.
- Learning: 19 collectible fact cards with sources, a quiz question in every debrief, tap-to-explain word chips, a "what your choices cost" report, Call Mission Control with the real 2.6 s signal delay, a "Real NASA data" panel, and a Cadet Logbook saved on the device.
- Sound: synthesized effects, ambience, a Geiger counter, and radio voices with Apollo-style Quindar tones. Voices use the device's own speech voices, so quality varies by device.
- Code is split: `game.js` (rules), `scene.js` (drawing), `sfx.js` (sound), `learn.js` (learning content), `crew.js` (Sidra's crew code, moved unchanged).

**Still to do**

- [ ] Play full games at normal speed with real kids in the age range and adjust `LEVELS` in `game.js`
- [ ] Check on a phone and a tablet
- [ ] Fact-check pass by a second person on `learn.js` (every card names its source)
- [ ] Add team photos to `crew/` if wanted
- [ ] Record the demo video

## Run 2 changes (Nov 14 evening)

- **Fact cards pause the game.** During play a fact card opens in the middle of the screen, the base is paused, and it stays until the player taps **Got it ▶**. Cards wait while a mini-game or repair puzzle is open. Outside play (debrief, packing) they are still small pop-ups that close by themselves.
- **Mini-game finish buttons.** Inside the main game every mini-game's results button now says **Continue →** (not "Play again"). Each game tells the main game the moment it is won, so the button at the top right changes to **Continue ▶** and also counts the result. Leaving before finishing still counts as not done.
- **Leak Patrol and Scrubber Sprint are plugged in.** Water recycler broken → Leak Patrol. Oxygen machine broken → Scrubber Sprint and Cosmic Match take turns. A sloppy round loses a little water or oxygen (see `docs/WATER-AND-AIR-GAMES.md`).
- **Phones.** The page no longer overflows sideways on a phone; cards, crew chips and the header fit; mini-games open full screen; tap targets in the scene grow on small screens; dragging an astronaut no longer scrolls the page; tap an astronaut (or their card) then tap a room also works. Tested in Chrome's phone emulation (390 x 844, touch) only: **still needs a check on a real phone**, in portrait and landscape.

## Judges build (Nov 15)

- **Storm order:** latest live flare, May 2023 (M4.2), August 2023 (X1.5, Quan's pick), September 2017 (X8.2) with the Mars aurora, then the finale **Flare Swarm** (Quan's idea): four real X flares from region 13664, May 8-11 2024. All fetched live from NASA DONKI with saved copies.
- **Shield Sync** (new mini-game) is plugged in for shield repairs. The old plug puzzle is removed; the grow lights are rebooted with Cosmic Match.
- **Every mini-game appears in every mission:** one planned breakdown per storm (SHOWCASE in game.js), on top of surprise breakdowns, which are capped at 2 per storm on Cadet and Pilot.
- **Fixes from the Nov 15 playtest:** each fact card shows at most once per mission; a debrief can no longer open over a repair (all repairs pause the base); the astronaut who runs to fix a machine goes back to safety afterwards; long real warning times no longer drain days of supplies; Cadet keeps 2 kW more power in storms.
- **Badges:** the end screen shows the whole checklist (10 badges, new ones marked) and the Logbook button shows the count.
- Checked with an automated player on Cadet: five rounds, all crew at 100% health, all six mini-games played, no repeated cards, no errors. Shield Sync was also played through its own controls. Not yet played start to finish by a person at normal speed.
