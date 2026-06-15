---
name: testing-battleship
description: Test the Battleship game end-to-end in the browser. Use when verifying UI changes, game mechanics, mascot behavior, animations, or deployment.
---

# Testing the Battleship Game

## Prerequisites

- Node.js and npm installed
- Repo cloned at `/home/ubuntu/repos/Battleship-Challenge`

## Dev Setup

```bash
cd /home/ubuntu/repos/Battleship-Challenge
npm install
npm run dev
```

Local dev server runs at `http://localhost:5173/Battleship-Challenge/`.

## Deployed Version

The game auto-deploys to GitHub Pages on merge to `main`:
**https://ryanklepser.github.io/Battleship-Challenge/**

Deployment is handled by `.github/workflows/deploy.yml` using GitHub Actions.
GitHub Pages must be configured with **Source: GitHub Actions** in repo settings.

## Lint & Typecheck

```bash
npm run lint
npm run typecheck
```

Both must pass before creating a PR.

## Running Tests

```bash
npm test
```

Unit tests use Vitest. Currently covers board creation, placement validation, attack/hit/miss/sunk logic.

## End-to-End Browser Testing

### Game Flow
1. **Difficulty selection** — Easy, Medium, or Expert
2. **Ship placement** — Click cells to place ships one at a time, or use "Randomize Fleet" button
3. **Battle phase** — Click enemy board cells to fire; AI responds automatically after each turn
4. **Game over** — Win/loss detection with Play Again option

### Quick Path to Battle Phase
Use "Randomize Fleet" button to skip manual ship placement.

### Key UI Elements
- **Left mascot** — positioned left of "Your Fleet" board, reacts to player events
- **Right mascot** — positioned right of "Devin's Waters" board, reacts to AI events
- **Speech bubbles** — appear above mascots with `mascot-speech--visible` class (opacity transition, visible for ~2s)
- **Missile animation** — parabolic arc from source board to target (duration: 1080ms)
- **Hit/Miss/Sunk popup** — appears below boards
- **Fleet rosters** — left sidebar showing ship status for both fleets

### Testing Mascot Speech Bubbles
Speech bubbles use CSS opacity transitions and last ~2 seconds. When testing:
- Fire a player shot → left mascot should show "Fire!"
- Wait for AI response → right mascot should show "Fire!"
- Only the firing side's mascot should shout (not both)
- Check the `mascot-speech--visible` class in DOM for verification

### Common Pitfalls
- **`update()` call ordering**: The `update()` function calls `updateMascotForPhase()` which resets mascot mood to `watching`. If `update()` is called after a mascot shout, it will immediately clear the speech bubble. The correct pattern is to call `update()` *before* the shout.
- **Right mascot text mirroring**: The right mascot container uses `transform: scaleX(-1)` to flip the sprite. Speech bubble text needs a counter-transform `scaleX(-1)` to appear correctly.
- **Speech bubble positioning**: `.mascot-container` must have `position: relative` for absolutely-positioned speech bubbles to render correctly above the mascot.
- **Board sizing**: Cell sizes use `clamp()` with viewport-relative calculations. Changes to cell sizing may push Hit/Miss text below the viewport.

## CI Pipeline

GitHub Actions runs on every PR: lint → typecheck → test → build.
CI config: `.github/workflows/ci.yml`

## Branch Strategy

- `main` — stable, auto-deploys to GitHub Pages
- `develop` — working branch
- `feature/*` or `devin/*` — feature branches off main

PRs target `main` for deployment.
