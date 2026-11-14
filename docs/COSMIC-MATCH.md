# Cosmic Match — standalone mini-game

Cosmic Match is a picture-matching repair mini-game designed for ages 7–12.
It uses real SDO and SOHO imagery and facts from a saved NASA DONKI event chain.
The standalone page runs independently of the main Storm Watch game.

**Team play link:** https://storm-watch-cosmic-match.web.app

## Play locally

From the repository root, run `python -m http.server 8123`, then open
`http://localhost:8123/cosmic-match.html`.

- **Find the twins:** all six pictures are visible.
- **Memory challenge:** turn two cards over, with unlimited peeks.
- Matched pairs reveal short NASA facts, read-aloud, and source links.
- No timer, lost stars, accounts, API keys, or network calls are required to play.
- **Pause motion** stops the solar movie and effects. Reduced-motion preferences
  start the game with still imagery. Sound can be switched off independently.

## Files needed to host only this mini-game

Copy `cosmic-match.html` as the host's `index.html`, then copy
`cosmic-match.js`, `cosmic-match.css`, and `assets/space/` alongside it.
No main-game scripts, base-management UI, Firebase account files, or build tools
are needed in the deployed mini-game. Serve these files with a static web server.

`node build-cosmic-match.js` creates this layout in `dist-cosmic-match/`.
The dedicated Firebase Hosting site can be updated with:

```text
firebase deploy --only hosting --config firebase.cosmic-match.json --project storm-watch-spaceapps
```

This configuration deploys only the Cosmic Match site. It does not deploy the
main Storm Watch site.

## Data and media

The September 10, 2017 X8.2 flare, linked CME, and linked particle detector event
are preserved in `tests/fixtures/donki-2017.json`. This is an archived mission,
not a live forecast. SOHO imagery illustrates particle camera strikes; the
19-minute fact uses the separate GOES detection timestamp.

Media credits and transformations are documented in
[`assets/space/CREDITS.md`](../assets/space/CREDITS.md).
The repair, orbit rings, and celebration effects are fictional game mechanics.
The intended age range still needs playtesting with children.

Run `node --test tests/cosmic-match.test.js` to verify deck composition, record
linkages, and the presence and attribution of the local media assets.
