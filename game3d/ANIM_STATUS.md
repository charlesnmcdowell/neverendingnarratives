# ANIM_STATUS — game3d-anim rig log (newest on top)

> ⚠️ **WRONG-REPO / MOUNT BLOCKER (2026-06-27 run).** The canonical source repo
> `C:\Users\charl\The Sorcerer Sword ARPG` (where game3d/ should live, per the 2026-06-28
> off-OneDrive move) was **NOT mounted in this scheduled run** — only the book repo (TTRPG)
> and the SITE repo (Neverendingnarratives) were connected. So these 4 verified files were
> staged here in the SITE repo (and copied to `outputs/game3d_staging/`) as a fallback. They
> are harmless here (not linked from index.html; `publish_inplace.py` only touches `play/`;
> I never git push) but **must be relocated to `…\The Sorcerer Sword ARPG\game3d\`** and the
> `game3d-anim` schedule's folder access must include that folder for future runs to work.


> Owner: `game3d-anim` schedule. I own ONLY `game3d/src/rig.js`, `game3d/rigs/*.json`,
> `game3d/rig_test.html`, `game3d/ANIM_STATUS.md`. I never touch `arena.html` or other
> game3d files — `game3d-build` wires the rig in via the API below.

---

## RUN 2026-06-28 — increment #5: brawler hit-reaction chain + run gait

**TL;DR (this run)**
- Added 4 universal parametric clips to `src/rig.js` (no rig-JSON changes — every body plan
  reuses them): `run` (faster/longer-stride looping gait, deeper forward lean — DC dash/charge),
  and the **hit-reaction chain** `knockback` (launched off feet → airborne tumble back),
  `knockdown` (slam to ground, ends prone), `getup` (rise from prone back to stance). These fill
  the gap `hurt` (in-place flinch) and `die` (permanent collapse) didn't cover. Wired into
  `CLIP_SECS` (run .55 / knockback .5 / knockdown .7 / getup .8); knockback/knockdown/getup are
  one-shots (added to the non-loop set), `run` loops like walk. Added all four to the
  `rig_test.html` ACTIONS cycle (now 21 actions).
- Next: a light×N combo string (DC chain attacks) + a jump/air-attack arc; per-clip launch-vector
  hooks so game3d-build can drive horizontal knockback distance; start swapping placeholder stills
  for real gen-sprites art on the named enemy rigs.
- **game3d-build must wire:** unchanged API. Three new one-shots on every actor —
  `play('knockback')`, `play('knockdown')`, `play('getup')` (use `animState().done` to chain
  knockback→knockdown→getup or →die), plus a looping `play('run')` for dash/charge movement.

**Status:** `node --check` clean on a faithful bash-side copy of rig.js (OneDrive mount served a
truncated tail this run — the real Windows file is intact at 317L, confirmed via Read; the
hazard is bash-read staleness, not a write corruption). Headless smoke **PASS** over all **28 rig
JSONs** × **21 clips**: 117,600 clip-steps, **7,988,160** numeric asserts, **0 NaN/Inf** in
ropePoints/poseBones/animState; **476/476** one-shots reach `done`; 4 new clips verified across
all 4 body plans (BIPED/WINGED/QUADRUPED/STATIC).


## RUN 2026-06-27 — increment #4: named the full pit.js enemy roster onto the 4 archetypes

**TL;DR (this run)**
- Pulled the real bestiary from the reachable source of truth
  `play/src/combat/pit.js` (`FIGHTS[]` + every `mkEnemy({type:…})`) and shipped **17 named
  enemy rig JSONs**, each mapping one enemy `type` onto a body plan + the right attack clip with
  small silhouette overrides: `door`(brute-tank,attack), `champ`/`brute`(brute,attack),
  `hook`/`chain`/`grave`/`master`/`skel`/`thrall`(grunt,attack), `pyre`/`esuccubus`(caster/winged,
  fireballCast), `gunner`(draw=level&fire), `stitch`(cast=heal), `necro`/`cultwarlock`(summon=raise),
  `beast`(crawler,clawSwipe), `edragon`(crawler,breath). Each JSON carries an `archetype` pointer
  back to the `enemy_grunt|brute|flyer|crawler` template it specializes. Enemy hounds reuse the
  existing `rigs/hound.json`. NO rig.js change needed — all clips already existed.
- Next: drop real gen-sprites stills on each named rig and nudge overrides where auto-fit reads
  wrong (placeholders only so far); consider a dedicated gun-recoil clip for `gunner` and a
  ranged `cast` recoil for `pyre`; wire a couple named enemies into rig_test.html as art lands.
- **game3d-build must wire:** unchanged API. Load `rigs/<enemy.type>.json` by the pit.js `type`
  string (door/hook/chain/pyre/gunner/grave/stitch/master/necro/champ/beast/brute/skel/thrall/
  cultwarlock/edragon/esuccubus; hounds→hound.json). Use each rig's `json.attack` to pick the
  strike. Every rig also supports `spawn`/`die`/`hurt` one-shots for spawn-in and death.

**Status:** `node --check` clean on rig.js (unchanged, 283L, closer intact). Headless smoke
**PASS** over **all 28 rig JSONs** (11 prior + 17 new): every JSON parses, resolves a known body
plan, and every declared+`attack` clip exists; 4,977 clip-step runs, **335,853** numeric
assertions, **0 NaN/Inf** in ropePoints/poseBones/animState; all 14 one-shots reach `done`.
On-disk integrity verified (wc/last-char on every JSON — no OneDrive tail-truncation this run).


## RUN 2026-06-27 — increment #3: block/victory clips + 6 new rigs (summons + enemy templates)

**TL;DR (this run)**
- Added 2 universal one-shot clips to `src/rig.js` — `block` (raise guard → brace → small
  impact jitter → settle) and `victory` (arms-up double-pump cheer) — both wired into
  `CLIP_SECS` and the non-looping set. Shipped 3 more player-summon rigs: `rigs/imp.json`
  (BIPED, clawSwipe), `rigs/shambler.json` (BIPED, overhead attack), `rigs/hound.json`
  (QUADRUPED, lunge-bite via clawSwipe). Started the 14-enemy rollout with 4 reusable
  archetype templates: `enemy_grunt` (BIPED, pure auto-fit), `enemy_brute` (BIPED, wide stance),
  `enemy_flyer` (WINGED, ranged cast), `enemy_crawler` (QUADRUPED, claw-rake). Added
  `block`,`victory` to the `rig_test.html` ACTIONS cycle.
- Next: name + override the remaining specific bosses onto these 4 archetypes as art lands
  (drop a still on the matching template, nudge only where auto-fit reads wrong); swap
  placeholders for real gen-sprites art; consider a `cast`-variant per caster enemy.
- **game3d-build must wire:** unchanged API. Two NEW playable actions available on every actor:
  `block` and `victory` (both one-shots, `animState().done` fires). Enemy archetype rigs use the
  same `json.attack` convention (grunt/brute→`attack`, flyer→`fireballCast`, crawler→`clawSwipe`).

**Status:** `node --check` clean on rig.js (283L, closer intact, verified whole on disk).
Headless smoke **PASS** — 17 clips × 4 body plans + all 11 rig JSONs, **340,690** numeric
assertions, 0 NaN in ropePoints/poseBones/animState; every rig JSON parses, resolves a known
body plan, and every declared/attack clip exists; all one-shots (incl. new `block`/`victory`)
reach `done`. Hit the OneDrive tail-truncation on rig.js again (cut at L258 mid-`ropePoints`)
→ mitigated via the staged-in-`/tmp` + `node --check` + `cp`/`sync` wc/closer verify-retry loop;
rig_test.html patched the same way (156L, `</html>` intact).


## RUN 2026-06-27 — increment #2: full-coverage clips + the 3 warlock-summon rigs

**TL;DR (this run)**
- Added 3 universal clips to `src/rig.js` (`transform` = morph gather→burst→settle for the
  warlock lich/devil forms; `spawn` = summon rise+pop; `die` = collapse) and made the gait
  quadruped-aware (`walkF/walkB` now drive `legFL/FR/HL/HR`; `clawSwipe` rakes the dragon's
  foreleg). Shipped `rigs/succubus.json` (WINGED), `rigs/dragon.json` (QUADRUPED),
  `rigs/bonearcher.json` (BIPED) with auto-fit + small overrides + per-entity `attack` clip.
  Rebuilt `rig_test.html` into a 4-actor stage (one per body plan) that cycles all 15 clips.
- Next: rig the remaining player summons (claw-fiend/imp, shamblers, stitch/hound/pyre/gunner
  swarms) + start the 14 bosses through the templates; swap placeholders for real art when
  gen-sprites lands; add a `block`/`victory` pose if game3d-build needs them.
- **game3d-build must wire:** unchanged API. Per-entity `attack` clip now lives in each
  `rigs/<entity>.json` (`json.attack`) — read it to pick the right strike (succubus→fireballCast,
  dragon→breath, bonearcher→draw). New playable actions: `transform`,`spawn`,`die`.

**Status:** `node --check` clean on rig.js; headless smoke **PASS** — 15 clips × 4 body plans,
78,300 numeric assertions, 0 NaN in ropePoints/poseBones/animState; all 4 rig JSONs parse,
resolve a known body plan, and every declared/attack clip exists; all one-shots reach `done`.
Caught + fixed one real bug: `breath` (dragon attack) was looping and never completing →
added it to the non-looping set in `play()`. Re-hit the OneDrive tail-truncation twice
(rig.js cut at L218, rig_test.html cut at L116) → mitigated by staging each file in `/tmp`,
`node --check`-ing the stage, then `cp`+`sync` with a wc/closer-tag verify-and-retry loop
until the on-disk copy matched. Both files now verified whole (rig.js 269L, rig_test.html 156L).


## RUN 2026-06-27 — increment #1: rig engine + warlock biped (idle/walk/attack/hurt/cast/summon)

**TL;DR (this run)**
- Built the procedural skeletal / mesh-deform rig engine `src/rig.js` (body-plan templates
  BIPED/WINGED/QUADRUPED/STATIC, auto-fit from bbox, a vertical-rope spine deform = the
  Dragon's-Crown single-still technique, and a shared parametric clip library) + `rigs/warlock.json`
  + a standalone Phaser proving ground `rig_test.html` that auto-cycles every clip over http.
- Next: prove on the real warlock sprite (swap placeholder for `art_in/`/`assets` art once
  gen-sprites lands), then add transform poses, then per-summon attacks on real summon sprites,
  then roll the 14 enemies through the templates.
- **game3d-build must wire:** include `src/rig.js`, call the API below per actor, and set
  `window.__AUDIT__.entities = window.__riggedEntities()` each frame for the visual auditor.

**Status:** `node --check` clean; headless smoke passes for all 11 clips (no NaN bones/points;
every clip drives the deform). NOTE: `game3d/` and `GAME3D_UPLIFT_PLAN.md` did not exist yet —
the parallel `game3d-build` schedule hasn't bootstrapped them. I created `game3d/` here in the
game repo (`Neverendingnarratives/`, sibling to `play/`) so the published build can serve it over
http. If game3d-build chooses a different home, move these 4 files together. (Also hit + repaired
one OneDrive tail-truncation on rig.js — reconstructed the IIFE closer, re-verified.)

### Integration API (stable — wire against this)
```js
// 1. create once per actor (rigJson optional; auto-fit covers most entities)
const rig = Rig.createRig(spriteKey, 'BIPED', warlockRigJson).layout({x,y,w,h}); // bbox in sprite-local px
// 2. drive it
rig.play('idle'|'walkF'|'walkB'|'attack'|'hurt'|'cast'|'summon'|        // biped + warlock
         'fireballCast'|'breath'|'clawSwipe'|'draw'|'loose');           // per-summon attacks
rig.update(dtSeconds);
// 3. render the single-still deform with a vertical Phaser Rope:
const pts = rig.ropePoints(n);   // n control points top->bottom, sprite-local px (x=bend/sway, y=bob/breath)
// 4. coverage telemetry for the auditor:
window.__AUDIT__.entities = window.__riggedEntities();  // { spriteKey: {rigged,frames,action,plan,done} }
rig.animState();   // -> { rigged:true, frames:<keypose count>, action, plan, done }
rig.poseBones();   // -> [{name,parent,x,y,angle}] world bone transforms (for true per-part draw later)
```
Rendering pattern (see `rig_test.html` `update()`): build one vertical
`scene.add.rope(cx, top, key, null, points, false)`, then each frame copy `rig.
