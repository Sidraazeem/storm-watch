# Shield Sync — shield machine mini-game

A standalone quick repair game in the same style as the other Storm Watch games.
Time a tap or Space press when the white pointer enters the green band to lock a
water-wall pump control. Each of three pumps needs two locks. A perfect lock
earns extra points; mistimed taps retain all progress.

The first successful lock is untimed practice, then the player has up to 12
seconds to finish the other locks. Completing all six ends the round immediately.
Mechanical clunks, sparks, chimes, water-shield progress arcs, NASA footage, a
best score, replay, pause, mute, and motion controls match the other mini-games.
Mobile play collapses the decorative photo panel to keep the dial and button
together. Reduced-motion preferences stop decorative motion while the essential
timing indicator continues to move.

Run `python -m http.server 8123` from the repository root and open
`http://localhost:8123/shield-sync.html`. Files: `shield-sync.html`,
`shield-sync.js`, `shield-sync.css`, existing `life-support-arcade.css`, and shared
NASA media in `assets/space/`. No main-game scripts or API keys are required.

Browser checks covered real timing locks, untimed practice, retained progress on
misses, all three pumps, early completion, timeout, pause, replay, mobile touch
targets, and reduced motion. Intended for ages 7–12; difficulty and engagement
still need child playtesting. This version is local, not publicly hosted.

Water-wall shielding is the scientific inspiration. The game calibrates fictional
pump controls; it does not tune a radiation-blocking frequency or create a force
field. The arcs, instant repair, timing dial, and score are game graphics and
mechanics. The archived SDO flare imagery is credited inside the game and in
`assets/space/CREDITS.md`; the linked DONKI record supplies the real flare story.
