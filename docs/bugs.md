# Bug Documentation

Tracking all bugs discovered during development and how they were fixed.

---

## Bug #1: `GameState` type unused import warning

**When:** Initial board rendering integration  
**Description:** TypeScript `noUnusedLocals` flagged `GameState` as unused in `main.ts` when imported for type annotation but only used in function parameter types.  
**Root Cause:** `GameState` was imported as a value import but only needed as a type.  
**Fix:** Changed to `import type { GameState }` to satisfy `verbatimModuleSyntax` and `noUnusedLocals` checks.  
**Status:** Fixed

---

## Bug #2: Explosion animation immediately destroyed by re-render

**When:** Adding missile/explosion animations (PR #12)  
**Description:** The explosion CSS animation (0.6s) was never visible to the user. After the missile landed and the explosion element was appended, `onComplete()` was called synchronously, which triggered `update()` → `renderBoard()` → `innerHTML = ''`, destroying the explosion element immediately.  
**Root Cause:** `onComplete()` was called alongside the explosion `setTimeout`, not inside it.  
**Fix:** Moved `onComplete()` inside the 600ms explosion timeout for hits; misses call `onComplete()` immediately.  
**Status:** Fixed

---

## Bug #3: Keyboard listener leak on game restart

**When:** Adding keyboard rotation shortcut (PR #12)  
**Description:** Every call to `renderGame` added a new `keydown` listener to `document`, but listeners were never removed. After multiple "Play Again" cycles, stale listeners accumulated.  
**Root Cause:** No cleanup mechanism for event listeners when the game was restarted.  
**Fix:** Added an `AbortController` at module scope. Each `renderGame` call aborts the previous controller and passes `{ signal }` to `addEventListener`, automatically removing old listeners.  
**Status:** Fixed

---

## Bug #4: Ship placement clicks not registering

**When:** User testing ship placement phase (post PR #12 merge)  
**Description:** Clicking on the player board during placement phase did not place ships. The click events were silently lost.  
**Root Cause:** Per-cell `mouseenter` handlers called `update()`, which did `innerHTML = ''` on the board, destroying all cells. When elements are removed from the DOM, `mouseleave` fires on them, triggering another `update()` cascade. Click events on the destroyed cells were lost in the re-render cycle.  
**Fix:** Replaced per-cell `mouseenter`/`mouseleave` with event delegation (`mouseover`/`mouseout`) on the board container. Added `updatePreview()` to toggle CSS classes in place without re-rendering the DOM.  
**Status:** Fixed

---

_More bugs will be documented as they are discovered during development._
