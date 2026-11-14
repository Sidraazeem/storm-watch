# Water and air mini-games

Two standalone 12-second arcade games, in the same cinematic style as the other
Storm Watch mini-games. They share `life-support-arcade.js` and
`life-support-arcade.css`, plus the existing NASA media in `assets/space/`.
Neither page loads the main game's code.

Run `python -m http.server 8123` from the repository root, then open:

- `http://localhost:8123/leak-patrol.html` for **Leak Patrol** (H₂O).
- `http://localhost:8123/scrubber-sprint.html` for **Scrubber Sprint** (air).

## Leak Patrol

Start with one highlighted practice leak; the timer stays stopped until it is
sealed. Tap a spraying valve once to seal it. Open leaks drain the storage tank;
the recycler continues to recover water when the pump is running. Seals build
combos and score. Emergency pump pause stops water loss for three seconds while
the player catches up, with a six-second cooldown. Long-neglected leaks cost
extra water and break the combo. The three waves progressively add leaks faster.

## Scrubber Sprint

Tap moving orange CO₂ molecules to trap them. Let blue O₂ flow back to the crew.
Three-versus-two circles, formula labels, and colors distinguish the gases.
Capturing O₂ costs cabin-air points; uncaptured CO₂ returning to the crew also
lowers the game meter. After six CO₂ captures the filter cleans itself
automatically, without interrupting captures. Optional Vacuum Boost sweeps up
the remaining on-screen CO₂ for a combo, with a six-second cooldown.
Airflow speeds up across three waves.

## Shared behavior

Both games include local best scores, replay, a mission debrief, mute, motion
controls, keyboard-accessible buttons, large mobile targets, and automatic pause
on browser hiding. Decorative effects can be stopped while essential gameplay
continues. A full run always reaches results even if the resource meter hits zero.

Browser verification covered actual pointer hits on moving molecules, seal taps,
resource changes, filter capacity, emergency abilities, pause, full simulated
12-second missions, score, replay, offline assets, mobile layout, and reduced
motion. Intended for ages 7–12; engagement and difficulty need child playtesting.
Both games are standalone prototypes; no public hosting is configured for them yet.

## NASA context and boundaries

[NASA ECLSS](https://www.nasa.gov/reference/environmental-control-and-life-support-systems-eclss/)
describes water recovery, air revitalization, and oxygen generation as distinct
life-support functions. [NASA JSC life-support research](https://www.nasa.gov/reference/jsc-life-support-subsystems/)
covers water recovery, CO₂ removal, and oxygen generation. The air game removes
CO₂; it does not turn CO₂ into oxygen.

The cinematic background reuses the archived September 10, 2017 SDO flare footage.
The linked DONKI record identifies the real flare. Controller failures, visible
gas bubbles, instantaneous sealing, percentages, filter capacity, cooldowns, and
game timing are fictional mechanics, not NASA measurements or documented damage
from that event. Media sources and preparation are in `assets/space/CREDITS.md`.


