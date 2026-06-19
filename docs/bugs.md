# Bug Documentation

All bugs discovered during development, sorted by criticality.

---

## Critical

### Bug #1: Ship placement clicks not registering
**PR:** #13
**Issue:** Clicking cells during placement did nothing — ships could not be placed.
**Cause:** Per-cell `mouseenter` handlers called `update()`, which did `innerHTML = ''`, destroying all cells mid-click. Click events were lost in the re-render cycle.
**Fix:** Switched to event delegation (`mouseover`/`mouseout`) on the board container. Added `updatePreview()` to toggle CSS classes in place without destroying the DOM.

---

## High

### Bug #2: Ship shapes only showing in first cell
**PR:** #45, #46
**Issue:** Ship SVG shapes only rendered within the first occupied cell instead of spanning all cells of the ship.
**Cause:** Two issues — (1) `getCellSize()` used `getComputedStyle().getPropertyValue('--cell-size')` which returns the raw `clamp(...)` string; `parseFloat()` on it returned `NaN`, falling through to a 30px hardcoded fallback while actual cells were ~40px. (2) `.board` table had `overflow: hidden` which clipped absolutely-positioned ship-shape wrappers extending beyond the origin cell, and adjacent table cells painted over the ship shape due to DOM stacking order.
**Fix:** (1) Replaced with a DOM probe element that measures actual rendered cell size. (2) Changed `.board` to `overflow: visible`, added `z-index: 3` to `.cell--ship-origin`, bumped `.cell--hit` z-index to 4 so hit indicators remain visible above ship shapes.

---

### Bug #3: Explosion animation never visible
**PR:** #12
**Issue:** Explosion CSS animation (0.6s) was instantly destroyed and never shown to the user.
**Cause:** `onComplete()` was called synchronously alongside the explosion timeout, triggering `update()` → `renderBoard()` → `innerHTML = ''`, which removed the explosion element before it could animate.
**Fix:** Moved `onComplete()` inside the 600ms explosion timeout.

---

### Bug #4: Speech bubbles not visible on either mascot
**PR:** #40
**Issue:** Left mascot had no visible speech text. Right mascot's text appeared in the wrong position.
**Cause:** `.mascot-container` was missing `position: relative`. Speech bubbles use `position: absolute` to sit above the mascot, but without a positioned parent they rendered relative to a distant ancestor.
**Fix:** Added `position: relative` to `.mascot-container` and `z-index: 10` to `.mascot-speech`.

---

### Bug #5: Left mascot not shouting "Fire!" on player shots
**PR:** #43
**Issue:** Only the right (Devin) mascot showed "Fire!" — the left (player) mascot stayed silent.
**Cause:** In `executeAttack()`, `update()` was called immediately after `mascotShoutFire('player')`. `update()` triggers `updateMascotForPhase('battle')` → `setMascotMood('watching')`, which reset the mascot mood before the speech bubble could render. The AI flow worked because its `update()` ran before the shout.
**Fix:** Moved `update()` before `mascotShoutFire('player')` to match the AI flow pattern.

---

## Medium

### Bug #6: Keyboard listener leak on game restart
**PR:** #12
**Issue:** After multiple "Play Again" cycles, stale `keydown` listeners accumulated on `document`.
**Cause:** Each `renderGame` call added a new listener but never removed the old one.
**Fix:** Added an `AbortController` at module scope. Each `renderGame` aborts the previous controller and passes `{ signal }` to `addEventListener`.

---

### Bug #7: Right mascot speech bubble text backwards
**PR:** #39
**Issue:** "Fire!" and other speech text appeared mirrored on the right mascot.
**Cause:** Right mascot container uses `transform: scaleX(-1)` to flip the sprite, which also flipped the child speech bubble text.
**Fix:** Added counter-transform `scaleX(-1)` on `.mascot-container--right .mascot-speech`.

---

### Bug #8: Hit/Miss text below viewport
**PR:** #42
**Issue:** The Hit/Miss/Sunk popup appeared below the visible window, requiring scrolling.
**Cause:** Cell size formula `clamp(28px, calc((100vh - 180px) / 12), 44px)` didn't reserve enough vertical space for the popup below the boards.
**Fix:** Changed to `clamp(28px, calc((100vh - 260px) / 12), 40px)` — reserves ~80px more for the popup.

---

## Low

### Bug #9: `GameState` unused import warning
**PR:** #12
**Issue:** TypeScript `noUnusedLocals` flagged `GameState` as unused in `main.ts`.
**Cause:** Imported as a value import but only used in type positions.
**Fix:** Changed to `import type { GameState }`.

---

### Bug #10: Both mascots shouting on every shot
**PR:** #41
**Issue:** Both mascots said "Fire!" regardless of which side fired.
**Cause:** `mascotShoutFire()` set mood on both mascots unconditionally.
**Fix:** Added a `side: 'player' | 'ai'` parameter. Left mascot shouts only on player shots, right mascot only on AI shots. Removed the "Engage!" text entirely.

---

### Bug #11: Empty status bar visible during battle
**PR:** #35, #36
**Issue:** A light-colored empty bar appeared between the header and boards during battle.
**Cause:** The `.status` element had base CSS (padding, background, border) that rendered even when empty. First fix (PR #35) used `display: none` but was overridden by CSS specificity.
**Fix:** Added `!important` to the hide rule and a `.status:empty` fallback to ensure complete removal.

---

### Bug #12: Mascot roaming over game boards
**PR:** #35
**Issue:** The randomly-roaming mascot would sometimes overlap with the boards and other game elements.
**Cause:** Roaming bounds were set to the full viewport without excluding board and UI element areas.
**Fix:** Constrained roaming coordinates to areas outside the boards, fleet roster, header, and buttons.

---

*13 bugs found and fixed across 46 PRs. 1 Critical, 4 High, 3 Medium, 4 Low.*
