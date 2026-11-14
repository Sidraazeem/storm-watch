# Solar Reboot — standalone solar-panel repair

**Team play link:** https://storm-watch-solar-reboot.web.app

An easy repair mini-game intended for ages 7–12: reconnect six wire tiles to bring
three solar-panel sections online. Correct power connections make a mechanical
relay clunk, with sparks, flowing current, and a musical restoration celebration.
There is unlimited help, no failure timer, sound control, and a motion toggle.
Reduced-motion preferences start the presentation with still images.

## Run and publish

Run `python -m http.server 8123` in the repository root, then open
`http://localhost:8123/solar-panels.html`.

`node build-solar-reboot.js` packages only the mini-game in `dist-solar-reboot/`.
Deploy to its dedicated Firebase Hosting site with:

```text
firebase deploy --only hosting --config firebase.solar-reboot.json --project storm-watch-spaceapps
```

This does not deploy the main Storm Watch site or Cosmic Match. No account,
installation, API key, or running developer computer is required for teammates
to play the hosted game. All required images and the silent movie are local assets.

## Implementation and verification

- `solar-panels.html`: standalone entry page.
- `shield-repair.js` / `.css`: shared six-tile circuit logic, with solar-panel labels.
- `shield-showcase.js` / `.css`: NASA movie, solar array display, sound, and effects.
- `assets/space/`: shared observation media and attribution.

Run `node --test tests/shield-repair.test.js` for circuit solvability and dataset
provenance checks. Browser checks covered six large controls, assistance,
restoration, replay, mute, motion controls, synthesized connection sounds, video
playback, and mobile layout. Suitability for children still needs playtesting.

## NASA observations and game fiction

The archived September 10, 2017 DONKI event records provide the X8.2 flare class
and the 19-minute flare-peak-to-GOES-particle-detection interval.
Raw selected records are in `tests/fixtures/donki-2017.json`. That interval is not
a forecast for arrival at the Moon.

SDO imagery is credited to NASA/GSFC/SDO. See
[`assets/space/CREDITS.md`](../assets/space/CREDITS.md) for source URLs and movie
preparation. The panel control failures, easy reconnection repair, Moon base,
sparks, and sounds are fictional gameplay, not damage documented in DONKI.
