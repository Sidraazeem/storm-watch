# Greenhouse Guard — storm defense mini-game

Move a water shield between three plant beds to intercept incoming solar-particle
streams. Missed streams reduce the plants' game health, with visible impacts,
color changes, and wilting. Catches build a combo and score. Water Burst briefly
covers all three lanes and recharges between uses.

The standalone game includes three short waves, a local best score, mechanical
catch sounds, a NASA solar movie, and a harvest-themed results screen. Players
can pause, restart, mute sounds, or pause decorative effects. Hiding the browser
pauses the action until the player resumes. The intended ages are 7–12; suitability
and difficulty still need playtesting with children.

## Run locally

From the repository root:

```text
python -m http.server 8123
```

Open `http://localhost:8123/greenhouse-guard.html`.

- Drag across the greenhouse or tap a plant-bed button to move the shield.
- Keyboard: focus the play area, use left/right arrows, and Space for Water Burst.
- On phones, the decorative movie panel collapses during play to keep controls visible.

## Files

- `greenhouse-guard.html`: standalone page and instructions.
- `greenhouse-action.js`: storm waves, collisions, health, score, sounds, and controls.
- `greenhouse-guard.css`: cinematic presentation and responsive game styles.
- `assets/space/`: existing shared NASA media and credits.

No main-game scripts, build step, login, API key, or runtime network requests are
required. Browser checks covered catches versus misses, damage and wilting,
keyboard and lane controls, Water Burst, pause, results, replay, mobile layout,
and reduced-motion preferences. This commit does not publish a hosted version.

## Science and simulation

The NASA story references the saved September 10, 2017 X8.2 flare and its linked
GOES particle detection, 19 minutes after flare peak. Water and other
hydrogen-rich materials can reduce solar-particle exposure. In-game streams,
instant plant damage, health values, wave timing, complete catches, combos, and
Water Burst are fictional mechanics, not DONKI measurements or a shielding model.
Detector timestamps do not predict arrival at the Moon. Source links and media
credits are available inside the game.
