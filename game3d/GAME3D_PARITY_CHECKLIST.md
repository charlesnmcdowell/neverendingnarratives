# GAME3D_PARITY_CHECKLIST — Warlock kit vs source-of-truth

## 2026-06-28 ~13:46Z — GROUND-BOUNCE / OTG LANDING SPLAT (DC-feel lever, run #48) — KIT PARITY UNCHANGED ~96%
- Pure spatial feel: the dash→launch→juggle air loop (runs #46–47) now ENDS with weight. `actors.js` expands the
  airborne-arc landing branch — the frame a juggled foe touches down on a GENUINE FALL (`_vy<0`, never the rising
  launch frame) it sets a one-shot `_landSplat` flag + re-arms the existing `squash` recoil envelope before
  zeroing `_hop`/`_vy`/`_airHits`. `main.js` adds `landSplat()` (mirrors `killSpark`'s central one-place scan):
  reads + CONSUMES the flag once per landing, skips corpses, sprays a low DUST `fx.burst` at the foe's FEET
  (`a.depth`): pale ring `0xb6a488` r30 + dark core `0x8a7c66` r18; called after the actor-update loop.
- PARITY: **UNCHANGED ~96%, ZERO KIT DIFF.** Pure FX — `landSplat()` only reads the flag + calls the existing
  additive `fx.burst`; actors.js only sets the flag + the visual squash scalar before the pre-existing hop-zero.
  No damage/reach/summon-economy/evolution/cooldown/kill-gold touched. Source-of-truth pit.js is top-down and has
  no juggle/airborne/landing concept, so there is no canonical mechanic to diverge from. Behavior model
  (outputs/landsplat_model_v1.js) PASSED 13/13 (one splat per launch; never on the rising frame; huge-dt safe;
  flag consumed exactly once; corpse + never-launched foe skipped).
- BENCHMARK: **~96%** of DC look+feel. The air loop now reads launch → bounce-juggle → floor-splat (a beginning,
  middle, and END) — FEEL is at the practical ceiling for the placeholder silhouettes. The only remaining LOOK
  lever is painted gen-sprites ART (PAID pipeline — forbidden in scheduled runs).
- NEXT GAP: NONE cheap/build-owned remain — the full kit + the complete DC air loop + all score-juice/FX/camera
  levers are spent. Painted **gen-sprites ART** is the sole remaining lever (PAID → user-initiated run, or Hiro
  drops PNGs into `game3d/art_in/` for the schedule's ART INTAKE to wire).

## 2026-06-28 ~14:10Z — AIR-HIT-CONFIRM bounce-juggle (DC-feel lever, run #47) — KIT PARITY UNCHANGED ~96%
- Pure spatial feel: the dash-launcher (run #46) now has a real PAYOFF. `actors.js` adds `AIR_HIT_CAP=3`/
  `AIR_HIT_VY=0.6` + `Actor.airHit()` — a follow-up light blow on an ALREADY-airborne foe re-pops it with a
  DIMINISHING fraction of the launch velocity (bounces lower each time), refreshes the helpless stagger,
  replays `knockback`, bounded by a per-actor `_airHits` counter capped at 3; `launch()` resets the counter
  and the `update()` landing branch clears it (so a fresh launch / a huge dt always starts clean). `main.js`
  `meleeHit` detects a light-side hit on a SURVIVING airborne enemy (`t._hop>0 && !t.dying`) → `t.airHit()`,
  a brighter violet `'air'` dmgPop (`#bda0ff`, +4 size, crit punch) + a violet `fx.burst`; mutually exclusive
  with the initial launcher via the `t._hop>0` gate.
- PARITY: **UNCHANGED ~96%.** Source-of-truth pit.js (reachable `play/src/combat/pit.js`, 3436 ln, reads
  whole) has NO launch/juggle/airborne/`_hop`/`_vy`/`airHit` concept — the only "air" tokens are the ranged
  "AIR SLASH" riposte projectile, and the lone CC flag is STAGGERED. So the air-juggle is a pure Dragon's-Crown
  spatial addition with no canonical mechanic to diverge from. No kit value (damage/reach/summon/evolution/
  cooldown/kill-gold) is touched — `dmg` passes through unchanged; the airHit only re-sets the kinematic hop +
  stagger (damage was already applied by `hurt()`). Behavior model (outputs/juggle_model_v1.js) PASSED 23/23.
- BENCHMARK: **~96%** of DC look+feel. Closing the dash→launch→JUGGLE loop completes a signature DC bounce
  beat, so FEEL is at the practical ceiling for the existing placeholder silhouettes. The only remaining LOOK
  lever is painted gen-sprites ART (PAID pipeline — forbidden in scheduled runs).
- NEXT GAP (chosen, subagent): **GROUND-BOUNCE / OTG splat on landing** — when a juggled foe finally touches
  down, a small ground-impact squash + dust `fx.burst` (build-owned, no art / no paid API) to punctuate the
  end of the juggle the way DC's knockdowns land with weight. Single highest-value no-art FEEL step left; all
  other gaps are painted ART, separable from build runs.

## 2026-06-28 ~13:30Z — archDevilOutro EXPIRY CINEMATIC (build-owned, run #43) — KIT PARITY ~96%
- Ported pit.js `archDevilOutro`: lv8 timed-devil EXPIRY (update L1248) now TAUNTS then branches —
  HERALD → terminal `enterDemonLord`; BASE/BINDER (no road) → guaranteed `enterLich` via the seraph
  cast-down. `_archCast` once-per-run guard prevents a devil<->lich softlock loop. Voice STUBBED to
  banners (no paid TTS); phases run off the Phaser clock, COLLAPSE to instant transform headless.
  Parity+benchmark subagent: FAITHFUL, ~96%; the lone remaining lever is painted ART (paid, out of scope).

## 2026-06-28 ~13:00Z — LV8 TIMED ARCH DEVIL (build-owned KIT, run #42) — KIT PARITY ~95%
- Ported the last build-owned kit gap: the **lv8 TIMED ARCH DEVIL borrow** (pit.js `enterDevil`/`devilT`/
  `exitDevil`). Raising the coven (`summonDemons`, end-of-fn `this.enterDevil()`) at level ≥8 now BORROWS
  the devil's shape for `devilDur()` seconds — light attack becomes the CLAW (reuses `devilClaw`), reach
  +14, `[ARCH DEVIL]` HUD tag + `DEVIL Ns` countdown; `update()` runs the `devilT`/`devilCd` clocks and
  calls `exitDevil()` (plain revert + 8s re-trigger cooldown) at expiry. `inDevil()` unifies the timed +
  terminal forms so the CLAW route fires for both; `pickEvo(20)` clears any active borrow before a terminal
  lv20 form. `__AUDIT__.devilT` exposed.
- Parity+benchmark subagent verdict: **FAITHFUL to pit.js intent**, only the two PRE-APPROVED intentional
  deviations present (NO others): (a) game3d uses base **15** / herald **21** and deliberately omits pit.js's
  archfiend-**31** value for the TIMED form (evo20==='archfiend' is the lv20 terminal `enterArchfiend`,
  reached separately) — `devilDur()` returns `herald?21:15`; (b) pit.js's **`archDevilOutro`** expiry
  cinematic (Seraph descent + guaranteed Lich / demon-lord branch + voice) is DEFERRED — exit is a plain
  `exitDevil()` revert with an 8s cooldown. Syntax gate PASS (`node --check` on a structurally-complete copy
  in the safe outputs dir; the OneDrive mount's on-file `node --check` remains the usual false negative).
- The deferred **`archDevilOutro` cinematic** is now the build-owned remainder of the devil line (story-heavy:
  Seraph/guaranteed-Lich/voice — out of cheap-brawler scope, no paid API needed but large).

## 2026-06-28 ~12:55Z — CAMERA ZOOM-WITH-SPREAD (DC-feel lever, run #41) — KIT PARITY UNCHANGED ~94%
- Pure camera/feel: new `tickCameraZoom(dt)` punches the follow-cam in on a tight cluster, eases to base
  FIT as the wave fans out (zoom 1.16→1.00 on spread 180→900px). Reads only actor x/team/dead + player,
  calls `cameras.main.setZoom`; no kit/damage/summon/evolution/hit-resolution touched → pit.js kit diff
  holds run #28's **~94%**. Parity+benchmark subagent this run: **re-confirmed ~94%, NO drift**, build
  healthy (all 4 owned files whole via Read), and INDEPENDENTLY recommended this exact increment as the
  top no-art FEEL lever. Floating damage numbers (the old "NEXT GAP" below) were completed runs #35–38.
- REMAINING build-owned KIT gap (unchanged): **lv8 TIMED ARCH DEVIL** (pit.js enterDevil/devilT, dur
  15/herald 21/archfiend 31, reach 24, CLAW/BITE label swap, red HUD timer bar). game3d has the devil
  ONLY as the terminal lv20 archfiend form — no timed `devilT` path exists. Port the mechanical core with
  the clean `exitDevil()` revert; the natural-expiry `archDevilOutro` cinematic (Seraph/guaranteed-Lich/
  voice) is story-heavy and out of brawler scope. All cheap feel levers now spent; art is the only other.
- Subagent flagged one LOW cosmetic snag (not new this run): `detonate()` L767 widens the archfiend AoE
  only for `p.sheol` bolts and ignores the computed `hordeMul().aoe` — arguably intended (only arch
  succubi throw the wide green fire). Cosmetic, no crash/regression; note for a future cleanup.

## 2026-06-28 11:41Z — COMBO DECAY (DC-feel lever, run #34) — KIT PARITY UNCHANGED
- Pure HUD/feel: the on-screen combo meter now lapses after 1.8s without a fresh landed player hit
  (was: only reset when the player was struck → persisted across whole waves). 4 additive `main.js`
  sites, no kit/damage/summon/evolution/hit-resolution code touched → pit.js kit diff stays run #28's
  **~94%**. Parity subagent PASS; CONSISTENT with pit.js's own `P.combo`/`P.comboT` expiry, not a divergence.
- [x] devilClaw "devours his own summons first" — confirmed DONE since run #28 (the run #27 "still MISSING"
  row below and the scheduled-task header are STALE; do not re-port).

### KIT PARITY — still MISSING (build-owned)
- [x] ARCH DEVIL as a level-8 TIMED ability (pit.js enterDevil/devilT) — DONE run #42 (timed borrow on
  coven-cast, 15/herald 21, CLAW route, HUD timer, exitDevil revert + 8s CD). The archfiend-31 timed value
  + the archDevilOutro cinematic are intentionally NOT in this slice (see below).
- [ ] **archDevilOutro EXPIRY CINEMATIC** (pit.js `archDevilOutro`) — the devil-timer expiry currently does a
  plain `exitDevil()` revert; pit.js instead plays a Seraph-descent / guaranteed-Lich (binder) or Demon-Lord
  (herald) transform + voice on expiry. NEW build-owned remainder of the devil line. Story-heavy/large; no
  paid API but bigger than a cheap lever. ← deferred.
- [ ] (ART, out of scope for auto-build / paid API) real painted lich/devil/backdrop + roster sprites.

BENCHMARK: ~95% of Dragon's Crown look+feel (the warlock now has the full timed-devil → terminal-form devil
arc, not just the lv20 transform). Remaining ~5% is almost entirely painted ART; the lone build-owned
mechanic left on the devil line is the story-heavy archDevilOutro expiry cinematic.

NEXT GAP (chosen, subagent): **archDevilOutro EXPIRY CINEMATIC** — port the devil-timer-expiry transform
(binder→guaranteed Lich, herald→Demon Lord, with the existing taunt banner; defer/stub the voice lines so no
paid API is touched). It is the only remaining build-owned mechanic on the devil line now that the lv8 timed
borrow is in, and it converts the current flat revert into pit.js's signature "the pact turns" beat. (All
other gaps are painted ART, separable from build runs.)

---

## 2026-06-28 — devilClaw DEVOURS OWN SUMMONS first (run #28)
- [x] devilClaw "devours his own summons first" (pit.js devilStrike(2.0,false)): `nearestSummon`+`devourSummons` eat in-reach own demons (arch succubi off the menu) BEFORE the wave; CLAW does NOT heal (heals=false — only the BITE feeds him); falls through to `meleeHit` only when nothing was devoured. Parity subagent: 1:1, one LOW cosmetic drift (game3d gates the enemy sweep on `ate>0` vs pit.js `ds.length`-exists; the dash repositions beside a summon so it almost never differs). Closes run #27's chosen NEXT GAP.

---

## 2026-06-28 — ARCH DEVIL CLAW FORM SWAP + DREADBINDER scythe ×2 (run #27)

Closed run #26's chosen NEXT GAP: the lv20 devil-road (ARCHFIEND ASCENDANT) ascension now has its own
form-swap FEEL, the build-owned analog to the lich. Picking the `archfiend` card calls `enterArchfiend()`:
the warlock rises in a red brimstone burst + camera flash, reach lengthens 92→106 (devil claws), and the
HUD/touch button re-letters ATK→CLAW. Light attack becomes the **CLAW** (`devilClaw`) — pit.js
`devilClaw`/`devilStrike(2.0)`: a rolling DASH that closes on the nearest hostile (landing beside it, red
particle trail), then a HEAVY **2× front sweep** (reuses `meleeHit` so kill/gold/ward rules are identical)
with a big camera shake. Like pit.js's Demon Lord the form is TERMINAL (no revert) — no phylactery/perish to
track. Also folded in the **DREADBINDER scythe ×2** row: `lichSlash` now deals `LICH_SLASH_DMG × (binder?2:1)`
(pit.js `*(P.evo10==='binder'?2:1)`); since the lich only ascends from the binder road this is the heavier
reaping. `__AUDIT__.archfiend` exposed for the visual auditor. Isolated parse harness PASS (both new methods,
the nested label/HUD/route ternaries, inter-method comma-chain, binder ×2 expr). On-mount `node --check` is
the usual OneDrive false negative (mount stuck on a stale 5752-byte pre-kit snapshot, mtime 04:06); real file
intact + all 11 edits inline & balanced via the file API.

### KIT PARITY — now MET
- [x] ARCHFIEND ASCENDANT form swap: `enterArchfiend()` from the lv20 archfiend card (pickEvo)
- [x] CLAW light attack (devilClaw): roll-dash to nearest hostile + 2× heavy front sweep + shake
- [x] On-screen label swap btnAtk→CLAW; HUD shows [ARCHFIEND]; `__AUDIT__.archfiend` exposed
- [x] DREADBINDER scythe ×2 damage (lichSlash binder-road doubling)
- [x] Combo increments on scythe/claw landed swings (the `update` melee-route wrapper covers all three forms)

### still MISSING
- [ ] devilClaw "devours his own summons first" branch (pit.js DEVOURED/feed) not ported — claw hits enemies only
- [ ] ARCH DEVIL as a level-8 TIMED ability (pit.js enterDevil/devilT) — game3d only has it as the terminal lv20 form
- [ ] Real painted lich/devil/backdrop art (separable art-pipeline run, gen-sprites)

BENCHMARK: ~93–94% of Dragon's Crown look+feel (both lv20 ascensions now read as real transforms, not flat
horde buffs — the devil road finally has a payoff verb to match the lich's scythe). Painted art is the ceiling.

NEXT GAP (chosen): port the devilClaw "devours his own summons" feed branch (the claw eats nearby allied
demons first for the DEVOURED beat) OR begin the painted backdrop/sprite art swap-in (art-pipeline). Cheap,
build-owned: the summon-devour branch. Mechanics are otherwise at DC parity.

---

## 2026-06-28 — LICH FORM SWAP (run #26)

The lv20 LICH SOVEREIGN ascension is now a true Dragon's-Crown-style FORM SWAP, not just a horde buff.
Picking the lichlord card calls enterLich(): the warlock rises in a bone-green burst + camera flash, his
reach lengthens 92->118 for a longer scythe arc, and the HUD/touch buttons re-letter to SCYTHE/FADE. Light
attack becomes the SCYTHE (lichSlash) — a slow, heavy sweep hitting every hostile in front that deals 16,
applies a long 5s stun, and hurls survivors 70px down the plane with a knockback clip. PORTAL becomes FADE:
an untargetable ward window, 5s base / 10s on the DREADBINDER road, 9s cooldown. The bone dragons are his
PHYLACTERY — they freeze (no decay) while risen, and once at least one is raised, if every dragon falls the
form SHATTERS back to the living warlock (reach + labels revert). We ASCEND rather than die into the form,
so the pit.js hp->50% death-rise cut is deliberately NOT applied (subagent-confirmed correct adaptation).
Off-mount logic smoke `outputs/lich_smoke.js` **24/24 asserts PASS** (enter/scythe stun+flight+dmg, kill
credit, in-front/reach gating, fade 5s/10s split + CD gate, ward block, phylactery record + shatter + revert).
On-mount `node --check` is the usual OneDrive false negative (truncated 68-line tail); real file intact via
the file API, all 10 edits inline + balanced (method comma-chain castPortal->enterLich->lichPerish->lichSlash
->fade->updateLabels->clampBand closes cleanly).

### KIT PARITY — now MET
- [x] enterLich trigger from the lv20 lichlord card (pickEvo)
- [x] SCYTHE light attack: in-front sweep, 5s stun, 70px flight, kill/gold credit
- [x] FADE replaces PORTAL: 5s/10s binder split, 9s CD, ward i-frame untargetability
- [x] On-screen label swap btnAtk->SCYTHE / btnWard->FADE (updateLabels)
- [x] Phylactery: dragons freeze while risen; all-fall -> form shatters (lichPerish)
- [x] HUD shows [LICH] + FADE timer + PHYLACTERY count; __AUDIT__.lich/.phylactery exposed

### still MISSING
- [ ] DEMON-LORD / ARCHFIEND lv20 form has no swapped attack verb/feel (reads flat vs lich) ← **NEXT GAP**
- [ ] DREADBINDER scythe ×2 damage row not ported (scythe is flat 16 on all roads)
- [ ] No combo-counter increment on scythe kills (kills/gold only)
- [ ] Real painted lich/backdrop art (separable art-pipeline run, gen-sprites)

BENCHMARK: ~93% of Dragon's Crown look+feel (holds run #25's 92-93%; the lich transformation payoff lands —
the mechanics are at DC parity, painted art is now the ceiling).

NEXT GAP (chosen): give the DEMON-LORD lv20 ascension its own distinct form-swap feel — cheap, build-owned,
same pattern as the lich; fold the binder-×2 scythe + combo-credit cleanup into that run.

---

## 2026-06-28 08:14Z — HEX CONTAGION + HERALD HEX-STACKING (run #25)
Implemented run #24's chosen NEXT GAP. `src/main.js` now ports pit.js's hex spread 1:1 — a flat DoT
became a plague. Three additive, build-owned edits (anim files untouched; build stays loadable):
- **CONTAGION (death-jump).** New `hexContagion(src)` + a central `tickContagion()` pass (called in
  `update` after all DoT ticks). A hexed foe that DIES — by ANY source this frame (melee, fire, gas,
  arrow, or the hex tick itself) — leaps its curse to the nearest living same-side foe: **×2 cumulative
  damage**, **+5s remaining time (added, never reset)**, **`hexJumps++`**. Mirrors pit.js `killEnemy`
  lines 1293–1303 (leaps to nearest in `enemies`, no range cap). The `_hexLeapt` guard makes each host
  leap exactly once (game3d has no single `killEnemy` site, so the central death-pass stands in for it).
- **HERALD HEX-STACK.** `detonateHex` now branches on the road: HEX FIEND (`herald`) hitting an
  already-hexed foe **stacks** (`hexDmg += 15`, `hexT = max(hexT,10)`, keep tick) instead of refreshing
  — pit.js lines 766–767. Any other road / un-evolved re-applies base (`hexT 10 / hexDmg 15 / hexJumps 0`),
  resetting the chain. (Base hex now also seeds `hexJumps = 0` so the contagion counter starts clean.)

Off-mount logic smoke `hex_smoke.js` **15/15 asserts PASS** (base apply, herald stack +15/refresh,
non-herald reset, contagion x2/+5s/jumps, cumulative chain 15→30→60, once-per-host guard, lone-host
no-crash, ally never infected). pit.js diff is 1:1 (exact lines read + ported). On-mount `node --check`
again a **false negative** (OneDrive served a truncated 68-line tail); the real file is intact —
confirmed whole via the file API, braces balanced, edits inline.

KIT PARITY — now MET vs pit.js:
- [x] **hex CONTAGION/jumps** ← was the **NEXT GAP**. Death-leap ×2 dmg / +5s / `hexJumps++`, leaps to
  nearest living same-side foe, fires on death from any source (central `tickContagion` pass). 1:1 w/ pit.js.
- [x] **herald hex-STACKING** — HEX FIEND road stacks `+15` dmg on an already-hexed target & refreshes to
  `max(hexT,10)` (pit.js 766–767); other roads re-apply base. `hexJumps` now seeded on base apply.

KIT PARITY — still MISSING (next runs):
- [ ] **Lich/Demon-Lord FORM SWAP** ← **NEXT GAP (chosen)**: a real transform beyond horde scaling —
  attack-kit swap (`lichSlash`/`fade`) + button-label swaps (`updateLabels()`) + phylactery state. Bigger
  than the cheap DoT ports; the last major kit divergence. (pit.js EVOLUTIONS lv20 + `setBtnLabel`.)

DC look+feel benchmark: **~92–93%** — FEEL nudged up (the herald road now has a real combo identity:
hexes that stack and chain through a pack, DC's signature "the screen catches fire" escalation); LOOK
unchanged (no new art — biggest remaining LOOK gap is still the painted `art_in/` backdrop swap-in).

## 2026-06-28 — SUMMON UPKEEP: restored `life` timeouts, dropped invented MP economy (run #24)
Implemented the run #23 NEXT GAP. `src/main.js` now gives every summon a per-type `life` and decays it
in a new `tickUpkeep(dt)`; the MP economy (`SUMMON_COST`/`UNDEAD_COST`/`MP_REGEN` + the HUD MP bar) is
gone — summons are FREE, gated only by player-alive + cap-12 + life. Off-mount smoke
`/tmp/upkeep_smoke.js` **23 asserts PASS**; parity subagent confirms the values + exceptions are 1:1
with pit.js, **no drift**. (On-mount `node --check` blocked by the OneDrive stale-placeholder hazard —
false negative; full file reviewed whole via the file API, 970L, well-formed.)

KIT PARITY — now MET vs pit.js:
- [x] **summon upkeep / `life` timeouts** ← was the **NEXT GAP**. `LIFE = {brute:18, dragon:15,
  succubus:14, shambler:24, archer:24}` (exact pit.js seconds); decays per frame, dissolves at 0 with a
  purple leafBurst. Exceptions match pit.js line 635: **lichlord freezes risen dragons**, **herald coven
  never expires**. The horde now decays → must be re-cast (pit.js's real risk/reward), not spam-permanent.
- [x] **invented MP economy retired** — `SUMMON_COST`/`UNDEAD_COST`/`MP_REGEN`, the `this.mp` field/tick,
  both `mp<COST` gates and the HUD MP bar removed. Summons are FREE (pit.js: zero `mana|mp|gold|cost`).

KIT PARITY — still MISSING (next runs):
- [ ] **hex CONTAGION/jumps + herald hex-stacking** ← **NEXT GAP (chosen, subagent re-pick)**: on a
  hexed enemy's DEATH the mark leaps to the nearest living foe at ×2 dmg / +5s (`CONTAGION x{n}`); the
  herald road STACKS hex on an already-hexed target (+15 dmg, refresh 10s). pit.js carries the data
  (`hexT/hexDmg/hexJumps`, lines ~766/1290/1538); game3d's `tickHex` is a flat DoT today. Cheap, no art.
- [ ] **Lich/Demon-Lord FORM SWAP** — real transform (attack-kit swap `lichSlash`/`fade` + `updateLabels()`
  button-label swaps + phylactery state) beyond horde scaling. DEFERRED (bigger, not cheap).

DC look+feel benchmark: **~92%** — FEEL ~93% (+1: the horde now earns its presence via upkeep/re-cast,
DC's spend-continuously tempo); LOOK ~91–92% unchanged (no new visuals this run). Biggest remaining LOOK
gap is still the painted `art_in/` backdrop swap-in (art-pipeline, separable). Biggest FEEL gap is the
deferred form swap.

**NEXT GAP (chosen):** **hex contagion + herald hex-stacking** — port pit.js's death-jump + stack onto
`tickHex` so hexes spread like a plague across the now-decaying horde. Then the Lich/Demon-Lord form swap.

---

## 2026-06-28 — LEVELING PARITY +1.5/kill (run #23)
Changed game3d leveling to pit.js's true rate and CORRECTED a misread in the prior NEXT GAP.
`tickProgression` now computes `lvl = min(20, floor(1 + 1.5*kills))` (consts `LVL_PER_KILL=1.5`,
`LVL_CAP=20`) — the exact closed form of pit.js `gainLevel()` (`P.level=min(20,P.level+1.5)` per kill,
`lvl()=floor`). Off-mount smoke `/tmp/level_smoke.js` **209 asserts PASS** (closed form == iterating
gainLevel for kills 0–200; lv10@6, lv20@13, cap 20). Subagent-verified equivalence + evo gates.

KIT PARITY — now MET vs pit.js:
- [x] **gainLevel leveling rate** — +1.5 levels/kill capped 20 ← was the **NEXT GAP**. lv10 (first
  evo road) at **6 kills**, lv20 (Demon-Lord ascension) at **13** (was 27/57 under the old 3/level).
  The DREADBINDER/HEX-FIEND road now actually triggers within a normal run.

⚠️ CORRECTION — the prior "resource-economy parity" gap was a MISREAD of pit.js:
- pit.js `summonDemons`/`summonZombies`/`summonArchers` have **NO mana/MP, NO 15% HP-tax, NO gold
  spend** (grep `mana|mp|gold|cost` → zero economy state). Summons are **FREE**, gated only by the
  **cap of 12** (`while(demons.length>=12)`) + per-summon **`life` timeouts**. Adding an MP/HP/gold
  cost would DROP parity, not raise it — so it was NOT implemented. The true pit.js "risk/reward" on
  the horde is the **`life` upkeep loop** (it decays → you re-cast), which game3d dropped.
- Note: game3d's existing `SUMMON_COST=30`/`UNDEAD_COST=25` MP gate is itself a **non-canonical
  game3d invention** that diverges from pit.js (subagent-flagged).

KIT PARITY — still MISSING (next runs):
- [ ] **summon upkeep / drop the invented MP economy** — retire `SUMMON_COST`/`UNDEAD_COST`/`MP_REGEN`
  and restore pit.js's per-summon **`life` timeouts** (brute 18 / dragon 15 / coven 14; lich-phylactery
  dragon & herald coven never expire) so the horde decays and must be re-cast. ← **NEXT GAP (chosen)**,
  cheap, no art, fixes a shipped behavioral drift.
- [ ] Lich/Demon-Lord FORM SWAP — real transform (phylactery dragon-life freeze + attack-kit +
  button-label swaps) beyond horde scaling.
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road).

DC look+feel benchmark: **~92%** — a pacing fix (no new visuals), so the LOOK axis holds at ~91–92%
(parallax + bloom + vignette, #21). The ceiling is gated by progression MECHANICS (summon upkeep, then
the form swap), not roster or visuals. Biggest remaining LOOK gap is still the painted `art_in/`
backdrop swap-in (art-pipeline, separable from build runs).

**NEXT GAP (chosen):** **summon upkeep** — drop the non-canonical MP economy and restore pit.js's
per-summon `life` timeouts (with the lich/herald exceptions), so the now-complete horde feels EARNED
through re-casting rather than spammed-once-and-permanent. Then Lich/Demon-Lord form swap → hex contagion.

---

## 2026-06-28 — CLAW-FIEND (brute) SUMMON FAMILY (run #22)
Wired pit.js `summonDemons('brute')` — the **last missing summon family**. The K summon now also
fields a melee aggro/shove **TANK** (claw fiend) that body-blocks the wave so the coven + dragon fire
from behind it. Road-scaled 1:1 with pit.js: count base **1** / DREADBINDER **2** / HEX-FIEND **2** /
DEMON LORD **3** (`mul.cnt`, maintained as a deficit, ally cap 12); hp `round((30+kills*5)*tough)`
(herald ×1.35); token shove dmg `(herald?2:1)×(binder?3:1)`; size `1.25×(binder 1.45)`. New
`bruteShove()` shoves all nearby hostiles 60px (+0.4× depth), clamps in-band, 0.2s stagger + token
chip, credits kills, no friendly fire. Loaded `rigs/brute.json`. Off-mount smoke `/tmp/brute_smoke.js`
**22 asserts PASS** (counts/hp/dmg/scale by road, deficit top-up, shove dir+distance, no friendly
fire, lethal-shove credit, world clamp).

KIT PARITY — now MET vs pit.js:
- [x] **claw-fiend (brute) summon family** — melee aggro/shove tank, road-scaled (1/2/2/3), hp
  30+kills*5 (herald ×1.35), binder ×3 dmg ← was the **NEXT GAP**. The summon roster is now COMPLETE
  (dragon + coven + undead foot-horde + claw-fiend). Subagent: intent-faithful 1:1; divergences
  intentional (no `life:18` timeout; deficit not per-cast stack; +0.2s stagger; 60 vs 70px shove —
  cosmetic). pit.js's brute doesn't taunt either, so the absent `demonTaunt` is NOT a gap.

KIT PARITY — still MISSING (next runs):
- [ ] **gainLevel / resource-economy parity** — pit.js +1.5/kill (game3d 3 kills/level); summons cost
  MP + a 15% HP-tax + gold spend (game3d re-summons are nearly free → no DC risk/reward). ← **NEXT
  GAP (chosen)**, highest-value now that the roster is complete.
- [ ] Lich/Demon-Lord FORM SWAP — real transform (phylactery dragon-life freeze + attack-kit +
  button-label swaps) beyond horde scaling.
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road).

DC look+feel benchmark: **~92%** — a kit/parity add (no new visuals), so the LOOK axis holds at
~91–92% (parallax + bloom + vignette, #21); the summon roster is now complete and the front-line/
back-line tactical layering matches DC's screen-control feel. The ceiling is now gated by progression
MECHANICS (the resource economy), not roster or visuals. Biggest remaining LOOK gap is still the
painted `art_in/` backdrop swap-in (art-pipeline, separable from build runs).

**NEXT GAP (chosen):** **gainLevel / resource-economy parity** — wire +1.5/kill leveling + the MP
cost / 15% HP-tax / gold spend on summons, so the now-complete horde feels EARNED rather than spammed.
Then Lich/Demon-Lord form swap → hex contagion.

---

## 2026-06-28 — BACKDROP PARALLAX DEPTH + POST-FX (run #21)
A pure LOOK run (build-owned `world.js` + one `arena.html` CSS line; `main.js` untouched, so the
warlock KIT is unchanged). Closed the standing "backdrop PARALLAX + post-FX" NEXT GAP: a MID crowd
parallax band (scrollFactor 0.55) gives FOUR scroll depths (far 0.35 / mid 0.55 / floor 0.85 /
pillars 1.0), plus a camera-fixed POST-FX pass — warm additive BLOOM (depth 9600) + soft radial
VIGNETTE (depth 9700), center-transparent so actors read — and the harsh inset box-shadow that
crushed the crowd wall was softened (framing now in-engine).

KIT PARITY — unchanged this run (no drift; main.js untouched). Still MISSING (next runs):
- [ ] **claw-fiend (brute) summon family** — pit.js `summonDemons('brute')` fields a melee aggro/shove
  TANK (base 1 / ×2 binder / ×3 Demon-Lord, hp 30+kills*5, herald ×2). It's the LAST missing summon
  family; `hordeMul()` road-scaling already exists. ← **NEXT GAP (chosen)**, highest-value kit add.
- [ ] gainLevel parity — pit.js +1.5/kill (game3d 3 kills/level); MP-cost / 15% HP-tax / gold spend.
- [ ] Lich/Demon-Lord FORM SWAP — pit.js real transform (phylactery dragon-life freeze + attack-kit
  + button-label swaps); game3d "Demon Lord" is only a horde ×3 + arch-burst flag.
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road).

DC look+feel benchmark: **~91–92%** — this run pushed PAST the ~90% target on the LOOK axis
(parallax depth + bloom + vignette closed the three named look gaps in one pass). **Biggest remaining
look gap:** backdrop/asset RICHNESS — the parallax bands are procedural primitive-rectangle
silhouettes, not painted art; the remaining ~8% is `art_in/` painted-layer swap-in (art-pipeline,
separable from build runs), NOT more code systems.

**NEXT GAP (chosen):** **CLAW-FIEND (brute) summon family** — bank the last missing summon family on
the parity axis (cleanly scoped, road-scaling wired) now that the look axis has cleared 90%. Then
gainLevel/HP-tax parity → Lich/Demon-Lord form swap → hex contagion.

---

## 2026-06-28 — UNDEAD FOOT-HORDE (shamblers + bone archers) (run #20)
The summoner road now fills the GROUND. New **L = RAISE THE DEAD** summon (`summonUndead`, 25 MP)
raises pit.js's two foot-horde families, distinct from the flying/casting coven: **SHAMBLERS**
(BIPED melee meat that take blows) and **BONE ARCHERS** (BIPED ranged, "minor harm at a careful
distance"). Road-scaled 1:1 with pit.js `summonZombies`/`summonArchers`:
- shamblers **base 3 / DREADBINDER 6 / LICH SOVEREIGN 9** (`_zn`); hp `25 + kills*4`.
- bone archers **base 2 / binder 4 / lichlord 6** (`_slots`); hp `15 + kills*3`.
- binder ×1.45 size + ×3 dmg (`_bR`/`_bM`); herald ×1.35 tough (HEX FIEND). hp grows with kills so
  the army swells mid-run; all share the ally cap 12 (oldest dissolves), as pit.js shares `demons`.
Archers reuse the projectile pipeline tagged `arrow:true` → new **`detonateArrow`**: a SINGLE-target
direct hit (bone-white `#e8e0c8`, BOLT.archer) with **no AoE, no fire DoT** (unlike the succubus/dragon
fire). rigs `shambler.json` (attack) + `bonearcher.json` (draw) loaded. Off-mount behavioral smoke
(`outputs/undead_check.js`, **26 asserts**) PASSED: every count/hp/dmg/size by road + arrow
single-target-no-burn + MP gate.

KIT PARITY — now MET vs pit.js:
- [x] **undead foot-horde** — shamblers (3/6/9) + bone archers (2/4/6) raised on L, road-scaled, with
  arrow single-target hits ← was the **NEXT GAP**. The DREADBINDER/LICH summoner road now grows on the ground.

KIT PARITY — still MISSING (next runs):
- [ ] **claw-fiend summon type** — pit.js binder fields "2 claw fiends" as a third summon family; not yet in game3d.
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road).
- [ ] gainLevel parity — pit.js +1.5/kill (game3d uses 3 kills/level); MP-cost / 15% HP-tax / gold.
- [ ] Lich/Demon-Lord FORM SWAP (phylactery channel, dragon-life freeze) beyond horde scaling.

DC look+feel benchmark: ~**90%** of target. The ground foot-horde (a shambling melee wall + a
back rank of bone archers loosing arrows) is the missing half of the Dragon's-Crown summoner
fantasy — the screen now fills with allies at TWO depths, not just flyers. **Biggest remaining
look gap (now the top one):** no bloom/vignette post-FX + a single flat backdrop plane (no
parallax scroll) — purely visual, build-owned in `world.js`.

**NEXT GAP (chosen):** **backdrop PARALLAX + post-FX** — give the pit real parallax scrolling
(far crowd wall slow / floor mid / pillars midground) + a bloom/vignette pass. It's the single
biggest DC-LOOK shortfall remaining now that the summon roster is nearly complete (claw-fiend is
the only kit family left). (Then: claw-fiend summon, gainLevel/HP-tax parity, lich form swap.)

---

## 2026-06-28 — LV20 ROAD-SPECIFIC ASCENSION KITS (run #19)
The lv20 ascension card now diverges MECHANICALLY, not just by name. `pickEvo` already recorded
`evo20` (`'archfiend'`/`'lichlord'`) but nothing read it; `hordeMul()`/`summonDemons`/`detonate` now do
(1:1 with pit.js EVOLUTIONS lv20). **ARCHFIEND ASCENDANT** (herald→archfiend): coven `dmg ×1.4` (pit.js
+ATK / diceN 21→31) and Sheol/hellfire blast radius `×1.5` (BURST_R 46→69; pit.js fireball aoe ×1.5 /
burst ER ×1.4). **LICH SOVEREIGN** (binder→lichlord): `dragonAdd 2` → **5** bone dragons (Demon-Lord 3
+ 2 phylactery; pit.js "raises EXTRA undead"). Each ascension keeps its lv10 inheritance. Off-mount
behavioral smoke (`outputs/evo20_check.js`, 8 asserts) PASSED.

KIT PARITY — now MET vs pit.js:
- [x] **lv20 road-specific KITS** — ARCHFIEND coven dmg ×1.4 + wider Sheol burst (46→69); LICH
  SOVEREIGN +2 phylactery dragons (→5) ← was the **NEXT GAP**.

KIT PARITY — still MISSING (next runs):
- [ ] **undead foot-horde** — pit.js `summonZombies`/`summonArchers` raise shamblers (3 / binder 6 /
  lichlord 9) + bone archers (2 / 4 / 6); game3d summons ONLY dragons + succubi, so the summoner road
  never grows on the ground. ← **NEXT GAP** (add a shambler melee-ally summon family first).
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road).
- [ ] gainLevel parity — pit.js +1.5/kill (game3d uses 3 kills/level); MP-cost / 15% HP-tax / gold.
- [ ] Lich/Demon-Lord FORM SWAP (phylactery channel, dragon-life freeze) beyond horde scaling.

DC look+feel benchmark: ~**89–90%** of target. The ascension card now visibly changes the build
(green Sheol bursts widen on archfiend; a 5-dragon swarm on lichlord). Remaining look gap: no
bloom/vignette post-FX + a single flat backdrop plane (no parallax) — the biggest DC-look shortfall.

**NEXT GAP (chosen):** **undead foot-horde** — add a shambler melee-ally summon family (counts
3/6/9 by road) so the DREADBINDER/LICH summoner road fills the ground the way pit.js does.

---

## 2026-06-28 — EVOLUTION-ROAD SELECTION UI (run #18)
The silent `road='binder'` auto-default is replaced by a real **Dragon's-Crown path-choice card
screen** (1:1 with pit.js `maybeOfferEvo`/`pickEvo`). At **Lv10** the sim FREEZES on a 2-card panel
(DREADBINDER `binder` / HEX FIEND `herald`); at **Lv20** on the 1 card `from`-filtered to the lv10
road (binder→LICH SOVEREIGN, herald→ARCHFIEND ASCENDANT). Input: keyboard **1/2** or touch
(ATK=card 1 / HEX=card 2); no input for **9s** auto-defaults to road 1 (deadlock-proof, pit.js
`evoPickT`). Choosing sets `this.road` to the card key — which the horde/ward/hex code already
branches on — so the choice now has real consequences. `node --check` + a behavioral smoke
(`outputs/evo_check.js`) PASSED end-to-end.

KIT PARITY — now MET vs pit.js:
- [x] **evolution-road SELECTION UI** (lv10 2-card + lv20 filtered) replacing the auto-default ←
  was the **NEXT GAP**; the choice now drives the dormant road code.
- [x] **herald-road HEX upgrade** — `castHex` CD 10s→3s on the herald road (pit.js `P.hexCD`); the
  herald PORTAL ward (3s→7s) was already road-checked and is now REACHABLE; herald demons ~1.35x
  tougher (`hordeMul.tough` on dragon + succubus HP).

KIT PARITY — still MISSING (next runs):
- [ ] **lv20 road-specific KITS** — the ascension currently only triples the horde (`demonLord`); it
  does NOT yet apply LICH SOVEREIGN (phylactery / +2 dragons / dragon-life freeze) or ARCHFIEND
  (permanently-arch coven + extra dmg). ← **NEXT GAP** (start with ARCHFIEND: coven all-arch + dmg).
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road).
- [ ] gainLevel parity — pit.js +1.5/kill (game3d uses 3 kills/level); MP-cost / 15% HP-tax / gold.
- [ ] Lich (phylactery) & Demon-Lord transformations beyond horde-count scaling (form swap, +2
  dragons, dragon-life freeze).

DC look+feel benchmark: ~**89%** of target (~90%) — up from ~88%. The road card screen is the
classic Dragon's-Crown "freeze, choose your path, watch the build change" beat, and it finally makes
the herald road playable (not just dead data). The remaining ~1% to 90% is the lv20 road-specific
transformation kits + real card art.

**NEXT GAP (chosen):** **lv20 road-specific kits** — wire `evo20`-keyed effects (ARCHFIEND coven
all-arch+dmg first, then LICH SOVEREIGN's +2 dragons / freeze), so the ascension card means more
than a horde-count triple.

---

## 2026-06-28 — PLAYER PORTAL WARD (run #15)
The warlock's **defensive/mobility** ability is in: pressing **P** casts `castPortal()` — 1:1 with
pit.js `portal()` for the base case. It **swaps places with the FURTHEST living enemy**, **stuns** that
foe 0.6s (`stagger`, plays `hurt`), purple-bursts both endpoints, `clampBand`s the teleported pair, and
grants the warlock a **damage-immunity WARD** (`p.wardT=3` base; herald 7s deferred). Cooldown 3s, **no
MP** (pit.js `P.parryCD=3`). The ward makes the player **untouchable** — enforced by the new
`wardBlocks()` guard in BOTH `meleeHit` (enemy melee) and `detonate` (bolt AoE), with a cyan WARDED
spark. HUD shows `WARD/PORTAL/rdy`; a pulsing cyan i-frame **ring** draws around the warded warlock.
`node --check` + behavioral smoke PASSED (swap, stun, ward on/off, CD-gate). The **herald 7s / devil-road
split** is deferred (gated behind the unbuilt road-selection — `road` only ever auto-defaults to binder).

KIT PARITY — now MET vs pit.js:
- [x] **Portal WARD** (`portal()`) — P swaps with the furthest enemy (0.6s stun) + grants a 3s
  damage-immunity ward (untouchable in melee + AoE), CD 3s no-MP ← was the **NEXT GAP**; player now has the full 4-button kit (melee · P portal · H hex · K summon)

KIT PARITY — still MISSING (next runs):
- [ ] **evolution-road SELECTION UI** — lv10 (2 cards) then lv20 (filtered); `tickProgression` auto-defaults `road='binder'`/Demon-Lord with NO player agency ← **NEXT GAP** (activates the most dormant parity code: herald 7s ward, herald HEX 3s+stack, binder/herald/Demon-Lord horde scaling)
- [ ] herald-road HEX upgrade — CD 10s→3s and hexes STACK (`P.evo10==='herald'`); ward 3s→7s on the same road (constant `WARD_T_HERALD=7` is wired, just unreachable until road choice exists)
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road)
- [ ] gainLevel parity — pit.js +1.5/kill (game3d uses 3 kills/level); MP-cost / 15% HP-tax / gold parity
- [ ] Lich (phylactery) & Demon-Lord transformations beyond the horde-count scaling (form swap, +2 dragons, dragon-life freeze)

DC look+feel benchmark: ~**88%** of target (~90%) — up from ~86%. The defensive Portal/Ward beat (a
flashy reposition + telegraphed i-frame window) completes the warlock's active kit, the core of the
Dragon's-Crown "press an ability, watch the screen react" loop. The remaining gap to 90% is
progression-facing: the evolution-road choice + transformations, not more abilities.

**NEXT GAP (chosen):** **evolution-road SELECTION UI at lv10/lv20** — replace the silent auto-default
with a real DC path-choice card screen; the single change that activates the most already-written
dormant parity code (herald ward 7s, herald HEX 3s+stacking, binder/herald/Demon-Lord horde scaling).

---

## 2026-06-28 — PLAYER HEX bolt (run #14)
First **player ability** (not summon AI): pressing **H** fires a purple (`#b070f0`) curse bolt on a
**10s cooldown**, gently aimed at the nearest foe, reusing the `fx` projectile pipeline tagged
`hex:true`. On the first hostile hit `detonateHex()` applies a **single-target ROT DoT** (no AoE, no
fire-heal): `hexT=10`, `hexDmg=15`, `hexTick=0.5` on the struck foe. `tickHex(dt)` drains 15 hp every
0.5s for 10s **without re-triggering the flinch clip** (like burns), throws purple sparks, credits
kills. HUD shows the HEX cooldown; arena.html hint adds "H hex curse". This is 1:1 with pit.js
`hexBolt()` for the BASE case (P.hexCD=10, bolt kind `'hex'` speed 420; on-hit e.hexT=10 / e.hexDmg=15
/ e.hexTick=.5). The **herald-road 3s CD + hex stacking** is intentionally deferred.

KIT PARITY — now MET vs pit.js:
- [x] **player HEX bolt** — H fires a purple curse on a 10s CD; single-target rot (15/0.5s for 10s), no AoE/fire-heal, no flinch-spam ← was a long-standing player-kit gap

KIT PARITY — still MISSING (next runs):
- [ ] **Portal WARD** (`portal()`) — swap places with the FURTHEST enemy, stun it (0.6s), and gain a damage-immunity WARD (3s base / 7s herald). game3d has NO player defensive/mobility ability yet ← **NEXT GAP**
- [ ] herald-road HEX upgrade — CD 10s→3s and hexes STACK (`P.evo10==='herald'`); ward 3s→7s on the same road
- [ ] hex CONTAGION/jumps & herald hex-stacking spread (deferred with the herald road)
- [ ] evolution-road SELECTION UI — lv10 (2 cards) then lv20 (filtered), `evoPickT` auto-resolve under AUTO; game3d auto-defaults to `binder` with no offer screen
- [ ] gainLevel parity — pit.js +1.5/kill (game3d uses 3 kills/level); MP-cost / 15% HP-tax / gold parity
- [ ] Lich (phylactery) & Demon-Lord transformations beyond the horde-count scaling (form swap, +2 dragons, dragon-life freeze)

DC look+feel benchmark: ~**86%** of target (~90%) — up from ~85%. The first PLAYER-cast ability adds
a fourth on-screen damage flavor (impact-fire / burn / ground-acid / now purple curse-rot) and finally
gives the warlock an active button beyond melee + summon, which is core to the DC "press an ability,
watch the screen react" loop. The remaining gap to 90% is the defensive Portal/Ward beat and the
evolution-road selection spectacle.

**NEXT GAP (chosen):** **Portal WARD** — swap the warlock with the furthest enemy (stunning it),
grant a short damage-immunity shield, with the herald 7s / base 3s split deferred; the highest-value
next step for both DC feel (a flashy reposition + i-frame escape) and pit.js player-kit parity.

---

## 2026-06-28 — lingering acid/gas breath CLOUD (run #13)
The bone-dragon summon now lays a **persistent ground cloud** as a SECOND attack distinct from its
bolt (pit.js `zones.push({...,type:'gas'})` at the breath cone). On its own clock (`gasEvery`=5s,
first at +1.2s) it casts `castGas()` → `fx.zone({r:98, tele:0.6, life:4.2, side, color:#7fd05a})`:
a green vapor ellipse that telegraphs with a pulsing warning ring, swells in, then fades. While a
zone is live, `tickZones()` **acid-ticks** every `GAS_TICK`=0.5s for `GAS_DMG`=14 (≈pit.js acid ~15
@0.5s) and **PARALYSES** every hostile inside the ground ellipse (`stagger` refreshed each frame →
wears off shortly after they step out), draining hp directly (no flinch-clip spam, like `tickBurns`)
and crediting enemy deaths. No friendly fire (side-checked). New normal-blend `fx.gz` layer drawn
**below the actors** so the cloud reads as floor vapor units stand in. Isolated `node --check` of the
new code PASSED + ran (OneDrive bash-read truncation is staleness, not write corruption — Read shows
both files whole & balanced).

SUMMON PARITY — now MET vs pit.js:
- [x] **lingering acid/gas breath CLOUD** — dragon lays a persistent green ground zone that acid-ticks + paralyses foes inside, distinct from its bolt ← was the prior NEXT GAP

SUMMON PARITY — still MISSING (next runs):
- [ ] arch-succubus burst-on-appear (Demon Lord: every succubus arrives arch, blasts once then survives)
- [ ] herald +35% toughness / no-timeout; binder ×2 count, ×1.45 size, ×3 dmg (coven of 6, +archers, +2 dragon lich); Demon Lord ×3 count
- [ ] HEX bolt + Portal WARD shield (player abilities, not summon AI)
- [ ] progression / evolution roads / transformations (lich phylactery, Demon Lord); MP-cost / HP-tax / gold parity

DC look+feel benchmark: ~**85%** of target (~90%) — up from ~83%. A telegraphed, churning ground
hazard that locks down clusters of enemies is core Dragon's-Crown screen-control spectacle and adds
a third damage flavor (impact-fire / burn / now ground-acid). Remaining gap to 90% is the
evolution-road horde scaling (binder/herald/Demon Lord) and the player's own HEX/WARD kit.

**NEXT GAP (chosen):** **arch-succubus burst-on-appear** + the herald/binder/Demon-Lord summon
SCALING (×2/×3 counts, ×1.45 size, ×3 dmg, +35% tough) — the evolution-road horde variety, the
next-most-visible DC summon-screen layer now that fire/acid flavors are in.

---

## 2026-06-28 — green Sheol-fire spread (run #12)
The coven's first member now rises as the **arch/herald succubus** (hp 55 / dmg 16 / scale 0.92,
fireCd 1.7) and casts **green Sheol-fire** (`#2ecc71`). On burst, a Sheol bolt applies a 3×-DPS burn
(`burnDps = BURN_DPS*3`, SHEOL_BURN_TIME 3.2s) and tags the victim + its caster-side. When a
Sheol-burning foe dies, `spreadSheol()` leaps the flame to the nearest fresh (not-already-green)
hostile of the caster within SHEOL_JUMP_R=150, igniting it for SHEOL_BURN_TIME + 5s (`+5s/jump`)
with a green burst. No friendly fire; an ordinary bolt never downgrades an active Sheol burn.
`node --check` PASSED on a faithful logic copy (OneDrive bash-read truncation is staleness, not
write corruption — real file intact).

SUMMON PARITY — now MET vs pit.js:
- [x] **green Sheol-fire** — arch/herald succubus throws a GREEN bolt that burns 3× and SPREADS on a burn-kill (+5s/jump) ← was the prior NEXT GAP

SUMMON PARITY — still MISSING (next runs):
- [ ] **lingering acid/gas breath CLOUD** (pit.js `zones` paralytic/acid) — dragon currently only bolts, no persistent ground cloud ← **NEXT GAP**
- [ ] arch-succubus burst-on-appear (Demon Lord: every succubus arrives arch, blasts once then survives)
- [ ] herald +35% toughness / no-timeout; binder ×2 count, ×1.45 size, ×3 dmg (coven of 6, +archers, +2 dragon lich); Demon Lord ×3 count
- [ ] HEX bolt + Portal WARD shield (player abilities, not summon AI)
- [ ] progression / evolution roads / transformations (lich phylactery, Demon Lord); MP-cost / HP-tax / gold parity

DC look+feel benchmark: ~**83%** of target (~90%) — up from ~80%. Colored Sheol-fire + a spreading
chain-burn add the summon-screen variety DC is known for; remaining gap to 90% is the gas/acid
breath cloud and the evolution-road spectacle.

**NEXT GAP (chosen):** **lingering acid/gas breath CLOUD** — a persistent ticking ground zone for
the bone dragon (pit.js `zones`), distinct from its single bolt; the next-most-visible summon layer.

---

## 2026-06-28 — summon ranged projectiles (run #11)
Implemented the summons' core ranged identity: succubi (coven of 3) and the bone dragon are now
`ranged` (FIRE_RANGE=330 standoff). They cast straight-traveling fire bolts (`castBolt`) drawn by a
new additive VFX manager (`src/fx.js` — glowing bolt core + outer glow + expanding `burst` impact
flash, pure motion/draw, no rules). On the first hostile hit or world edge (`stepProjectiles`),
`detonate()` applies an AoE blast (BURST_R=46) + a fire DoT (`burn`, BURN_TIME=2.4s, BURN_DPS=7) to
every hostile in the burst, with **no friendly fire**. Succubus bolts **fire-heal their caster**
off damage dealt (SUCCUBUS_HEAL=0.25 — pit.js `feedSuccubi`). `tickBurns()` drains hp over time
without re-triggering the flinch clip (burning foes keep acting) and throws ember sparks, crediting
burn-deaths. Bolt colors: succubus magenta `#ff5a8c`, dragon orange `#ff8a2c`.

SUMMON PARITY — now MET vs pit.js:
- [x] **ranged projectiles** — succubi + dragon hurl traveling fire bolts at a standoff (was the prior NEXT GAP)
- [x] bolts EXPLODE on impact into an AoE burst (pit.js `aoe`) — covers the black-dragon "exploding fireball" model generically
- [x] **fire DoT** — burst applies a refreshing burn (pit.js `fire`/burn), drains hp without flinch-lock
- [x] **succubus fire-heal** — caster heals off bolt damage dealt (pit.js `feedSuccubi`, 0.25)
- [x] no friendly fire on burst or DoT; distinct caster-keyed bolt colors

SUMMON PARITY — still MISSING (next runs):
- [ ] **green Sheol-fire spread** — arch/herald succubus throws GREEN bolt that burns 3× and SPREADS on kill (+5s/jump) ← **NEXT GAP**
- [ ] arch-succubus burst-on-appear (Demon Lord: every succubus arrives arch, blasts once then survives)
- [ ] herald +35% toughness / no-timeout; binder ×2 count, ×1.45 size, ×3 dmg (coven of 6, +archers, +2 dragon lich); Demon Lord ×3 count
- [ ] lingering acid/gas breath CLOUD (pit.js `zones` paralytic/acid) — dragon currently only bolts, no cloud
- [ ] HEX bolt + Portal WARD shield (player abilities, not summon AI)
- [ ] progression / evolution roads / transformations (lich phylactery, Demon Lord); MP-cost / HP-tax / gold parity

DC look+feel benchmark: ~**80%** of target (~90%) — up from ~72%. Layered fire projectiles
(additive glowing bolts → exploding bursts → lingering burn + ember sparks) are the signature
Dragon's-Crown summon-screen juice and read correctly now; the remaining gap to 90% is the
colored Sheol-fire variety, the gas/acid breath cloud, and evolution-road spectacle.

**NEXT GAP (chosen):** **green Sheol-fire spread** — give the (arch/herald) succubus a GREEN
(`#2ecc71`) bolt that burns harder and SPREADS its burn to a fresh hostile on a burn-kill (+5s),
the most visible next layer of summon variety and a direct pit.js parity row.

---

## 2026-06-28 — summonDemons run (run #10)
Implemented the warlock's signature: **K spends 30 MP → ally-team bone dragon + 3-succubus coven**
that fight the wave with their own seek-and-attack AI (unified `npcAI` for enemy+ally; side-based
`meleeHit`; `nearestHostile`). MP now regens +12/s and is spent (was decorative). Ally cap 12,
oldest dissolves. Each summon strikes with its own rig clip (succubus `fireballCast`, dragon
`breath`) + plays `spawn` on appear. HUD: Demons N/12; ally HP bars (cyan).

SUMMON PARITY — now MET vs pit.js:
- [x] summons fight FOR you with independent AI (the core identity — biggest gap, now closed)
- [x] dragon spawns only if none already alive
- [x] cap 12, oldest dissolves past cap
- [x] friend/foe by side (light = player+allies, dark = enemy); no friendly fire
- [x] coven baseline = 3 succubi; per-rig attack + spawn clips

SUMMON PARITY — still MISSING (next runs):
- [ ] **ranged projectiles** (succubi/black-dragon fireballs as traveling/exploding AoE + fire DoT
      + feedSuccubi fire-heal) — game3d summons are melee-contact only ← **NEXT GAP**
- [ ] binder ×2 count / ×1.45 size / ×3 dmg (+ coven of 6, +archers, +2 dragon lich)
- [ ] herald +35% summon toughness + succubi never time out + green Sheol-fire spread
- [ ] Demon Lord ×3 count + every succubus arrives as arch (burst-on-appear)
- [ ] lich phylactery: dragon-life freeze / no timeout while risen
- [ ] claw-fiend summon type; per-summon life/timeout countdown

DC look+feel benchmark: ~**72%** of target (~90%) — up from ~55–60%. An autonomous summon swarm
reads correctly; the gap to 90% is ranged projectile VFX, evolution-road variety, and layered juice.

**NEXT GAP (chosen):** summon **ranged projectiles** — succubus fireball + dragon breath as real
traveling/exploding AoE (additive `fireball`/`fireball_hit` art), with fire DoT + succubus fire-heal.

---

## 2026-06-27 — combat-resolution run
This run wired MELEE into the brawler: actors.hurt(dmg,attackerX) w/ hurt/knockback/die
clips + stagger; main.js melee hit-detect (in-front + reach + depth window), combo-on-hit,
enemy attacks hurt the player, wave-clear→nextWave (scaling hp/count), floating enemy HP
bars, DC-style HUD (HP/MP/Wave/Combo/Gold). Spatial brawler model is INTENTIONAL (not a gap).

KIT/PROGRESSION GAPS still open vs pit.js (warlock):
- **No abilities at all.** Only basic melee exists. MISSING the entire ranged/summon kit:
  HEX bolt (CD 3s herald / 10s else, stacks for herald), Portal WARD shield (7s/3s),
  summonDemons (cap 12, oldest dissolves) — bone dragon (lv3), succubi (lv5), arch devil (lv8).
- **No summons-as-allies.** pit.js summons fight FOR you (coven/shamblers/archers/dragon);
  game3d has none — they are the warlock's core identity and the biggest single gap.
- **No progression.** No gainLevel (+1.5/kill, cap 20), no lv3/5/8 unlock banners, no
  lv10/lv20 EVOLUTION roads (DREADBINDER/HEX FIEND → LICH SOVEREIGN/ARCHFIEND) w/ AUTO auto-resolve.
- **No transformations.** Lich (phylactery) and Demon Lord (×3 summons, every succubus=arch) absent.
- **MP is decorative** — HUD shows it but nothing spends/regens it; no gold spend either.
- **HP model off:** warlock should pay the 15% HP tax (×0.85 w/ CON scaling); game3d hard-codes hp:200.
- **Color identity:** keep pink/magenta hex bolts (#ff5a8c/#ffd0e0), green Sheol-fire (#7fbf6a),
  purple robe — placeholder robe (0x2b2140/0x6a3cc0) is on-tone; FX colors not yet used.

DC look+feel benchmark: ~55–60% of target (~90%). This increment added real hit-stop/stagger,
death clips, wave loop, enemy HP bars and a clean HUD — solid brawler readability. Biggest
missing DC ingredient is the warlock's signature: **summoned allies fighting alongside you.**

**NEXT GAP (chosen):** implement summonDemons → spawn ally-team Actors (start with the lv5
succubus coven + lv3 bone dragon) that seek+attack enemies, on an MP cost. This restores the
warlock's core fantasy and is the highest-value step toward both pit.js parity and DC feel.



> ⚠️ **FALLBACK STAGE (run 2026-06-28).** This is a fresh snapshot taken from the
> reachable source of truth `Neverendingnarratives/play/src/combat/pit.js` because
> the canonical build repo `C:\Users\charl\The Sorcerer Sword ARPG` was NOT mounted
> this run (see `GAME3D_BUILD_STATUS.md`). The game3d implementation files
> (`arena.html`, `src/combat`) were unreachable, so every parity row below is
> **UNVERIFIED against game3d** — it records what game3d MUST match. Fold this into
> the canonical checklist once the real folder is reconnected.

Source: `play/src/combat/pit.js` (3436 lines). Kit/evolutions/transformations stay
1:1 with this file; only the spatial model becomes the Dragon's-Crown brawler.

## Progression
- `gainLevel()`: **+1.5 levels per kill**, hard cap **level 20**.
- Evolution choice UI: **lv10** road (2 options) then **lv20** road (filtered to
  branches whose `from` == the lv10 pick). Stored on `P.evo10` / `P.evo20`
  (mirrored to `GameState.player` for persistence).
- AUTO/headless resolves the evo pick **immediately to the first road**; a manual
  player gets ~9s (`evoPickT=30`) to press 1/2 or click a card. game3d must keep
  this auto-resolve so gauntlet/autopilot never deadlock.

## Warlock evolution roads (EXACT, from `EVOLUTIONS.warlock`)
- **lv10 · DREADBINDER** (`binder`, focus DEX, look `caster`): summoner road —
  DOUBLE the horde: 2 claw fiends, a SIX-strong coven, 6 shamblers, 4 bone archers
  (+2 dragons as a lich). Every summon ~45% BIGGER and deals 3x damage (succubus
  fire = normal bolt ×3).
- **lv10 · HEX FIEND** (`herald`, focus ATK, look `devil`): devil road — Hex CD
  10s→3s and hexes STACK; bone dragon & claw fiend +35%; succubi hurl burning fire;
  arch succubus throws GREEN Sheol-fire (burns 3× hex, spreads on kill +5s/jump);
  succubi are HEALED by fire.
- **lv20 · LICH SOVEREIGN** (`lichlord`, from binder, DEX, look `lich`): lich uptime
  extended; raises extra undead.
- **lv20 · ARCHFIEND ASCENDANT** (`archfiend`, from herald, ATK, look `devil`):
  deepens HEX FIEND — +ATK, burning coven rages on.

## Abilities / cooldowns (from pit.js)
- **HEX bolt** (`hexBolt`): CD = **3s if herald else 10s** (`P.hexCD`); herald hexes
  stack. Bolt speed 420, kind `'hex'`.
- **Portal WARD** (magic shield): duration **7s if herald else 3s** (`P.wardT`).
- **summonDemons(type)**: demons STACK; oldest dissolves past cap **12**. Count
  multiplier: **Demon Lord ×3** (supersedes), **binder OR herald ×2**, else ×1.
  Binder size ×1.45 and damage ×3 (`_bMul`, `_bR`). Herald summons +35% tough
  (`_heraldSummon`).
- **Succubi**: binder coven six-strong; herald succubi NEVER time out and are healed
  by fire; Demon Lord → every succubus arrives as an ARCH succubus that blasts once
  on appear then survives (fireballs only).
- **Bone dragon**: lich freezes its life (phylactery); binder → BLACK DRAGON lobs a
  massive exploding fireball at enemies; lich summons hit harder (DREADBINDER ×3).

## Transformations (kit stays 1:1)
- **Lich** (`P.lich`): from binder→lichlord road; phylactery freezes dragon life,
  raises extra undead, +2 dragons.
- **Demon Lord** (`P.demonLord`): TRIPLES summon counts; every succubus = arch.
- (Other chars for reference: druid warden/alpha→colossus/sovereign; seraph
  wrath/aegis→judgement/bulwark — not warlock, listed in `EVOLUTIONS`.)

## Parity rows to verify in game3d (ALL currently UNVERIFIED — repo unreachable)
- [ ] level cap 20, +1.5/kill, evo offers at lv10 & lv20, auto-resolve under AUTO
- [ ] binder horde counts (2 claw / 6 coven / 6 shambler / 4 archer / +2 dragon lich)
- [ ] binder ×3 damage + ×1.45 size; herald +35% tough
- [ ] HEX CD 3s/10s split + herald stacking; ward 7s/3s split
- [ ] summon cap 12 with oldest-dissolves; Demon Lord ×3 supersede
- [ ] herald succubi no-timeout + fire-heal + green Sheol-fire spread (+5s/jump)
- [ ] lich phylactery dragon-life freeze; black dragon exploding fireball
