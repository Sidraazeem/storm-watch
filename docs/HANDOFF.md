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
| Life support | Oxygen and water tanks drain per crew member; machines refill them if powered |
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

| Crew | Role | Perk |
| --- | --- | --- |
| Ada | Pilot | Moves 2x faster |
| Kai | Engineer | Repair puzzle has 3 plugs instead of 4 |
| Rosa | Botanist | Grows 2x food in the Greenhouse |
| Sam | Geologist | Earns 2x science outside |

**Score** = science + crew health × 2 + supplies left − total radiation dose. A crew member is evacuated if their dose reaches 1,000 mSv or their health hits zero from running out of oxygen, water or food.

## NASA data used

All storm data comes from NASA's DONKI space-weather API (`ccmc.gsfc.nasa.gov/DONKI-API`), which needs no key or login and works from the browser. The game loads it on the start screen and uses a saved copy if NASA can't be reached in 7 seconds, so a dead Wi-Fi never breaks the demo.

| Storm | Source | Flare | Real warning time |
| --- | --- | --- | --- |
| 1 | Strongest flare of the last 30 days, fetched live (changes on its own) | M3.5, Nov 5, 2026 (as of Nov 14) | None: no radiation storm followed, so the card says "Real flare, practice storm" |
| 2 | Gannon storm, flare `2024-05-11T01:10:00-FLR-001` | X5.8, May 11, 2024 | 47 minutes |
| 3 | Flare `2017-09-10T15:35:00-FLR-001` | X8.2, Sep 10, 2017 | 19 minutes |

Warning time = minutes from flare peak to the first linked solar energetic particle (SEP) event, preferring the >100 MeV detector.

**Real vs. game tuning:** flare class, dates, sunspot region and warning times are real. Storm strength in play, countdown lengths, supply rates and the 1,000 mSv evacuation point are game settings chosen for difficulty, not NASA values. The 600 mSv line shown on dose bars is NASA's astronaut career limit. Not used yet: Curiosity RAD readings, the life-support baseline (BVAD) numbers, Moon Trek imagery.

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
- [ ] Use life-support baseline (BVAD) numbers for oxygen, water and food use, and cite them
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
