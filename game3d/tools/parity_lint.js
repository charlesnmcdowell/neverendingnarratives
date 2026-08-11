#!/usr/bin/env node
/* parity_lint.js — STATIC Dragon's-Crown parity gate for game3d (Lane B / B2).
 * Owned by the `playtest-bughunt` schedule. Backstop for the WebGL auditor
 * (tools/visual_audit.py -> audit/latest.json) which can't run headless here.
 * Parses arena.html + src/*.js and FAILS (exit 1) on any 🚨 gate violation.
 *
 * Permanent named regression cases (never delete):
 *   canvas-bound-to-window (P1) · touch-controls (P1) · lighting-fx (P2)
 *   actor-height-band (P3) · backdrop-layered (P1) · audit-telemetry (P2)
 *   touch-verb-coverage (P2) · touch-held-verb-coverage (P2)
 *
 * Usage:  node game3d/tools/parity_lint.js [game3dDir]
 *
 * TRUNCATION SELF-GUARD (added 2026-06-28 by playtest-bughunt): over a OneDrive
 * FUSE mount, a freshly-written file can be served with a truncated cloud tail
 * (the bytes the build just wrote are missing). A static lint then FALSE-fails
 * the very checks those missing bytes would satisfy (a regex cannot match bytes
 * that aren't there — truncation can only HIDE a pass, never fake one). So:
 * each source file is checked for its expected end-marker; if a file looks
 * truncated, any check that would FAIL on its evidence is downgraded to
 * INCONCLUSIVE (exit 2) instead of FAIL (exit 1). PASS results are always
 * trusted. Run LOCALLY on the real disk to avoid INCONCLUSIVE entirely.
 */
'use strict';
var fs = require('fs'), path = require('path');

var ROOT = process.argv[2] || path.join(__dirname, '..');
function read(rel) {
  try { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }
  catch (e) { return null; }
}

var arena = read('arena.html');
var main = read('src/main.js');
var world = read('src/world.js');
var actors = read('src/actors.js');
var fx = read('src/fx.js');
var rig = read('src/rig.js');
var allSrc = [main, world, actors, fx, rig].filter(Boolean).join('\n');

// --- truncation self-guard: does each file end with its expected closer? -----
// src/*.js are IIFEs closing with `})(typeof window ...`; arena.html ends </html>.
// A file that was read but lacks its tail = a truncated cloud-mount read.
var SRC_TAIL = /\}\)\(\s*typeof\s+window/;
function truncated(content, tail) {
  if (content == null) return false;            // absent != truncated (read() => null)
  return !tail.test(content);
}
var trunc = {
  arena:  truncated(arena, /<\/html>/i),
  main:   truncated(main, SRC_TAIL),
  world:  truncated(world, SRC_TAIL),
  actors: truncated(actors, SRC_TAIL),
  fx:     truncated(fx, SRC_TAIL),
  rig:    truncated(rig, SRC_TAIL)
};
function anyTrunc(keys) { return keys.some(function (k) { return trunc[k]; }); }

var results = [];
// evidence = file keys a check reads; a FAIL on truncated evidence -> INCONCLUSIVE.
function check(name, sev, pass, detail, evidence) {
  var inconclusive = !pass && anyTrunc(evidence || []);
  results.push({ name: name, sev: sev, pass: !!pass, inconclusive: inconclusive, detail: detail || '' });
}

// 1. canvas-bound-to-window (P1): canvas must fill the viewport. Either a Phaser
//    Scale.RESIZE/FIT block in bootArena, OR arena CSS sizing the canvas 100vw/vh.
var hasScale = !!(main && /scale\s*:\s*\{/.test(main) &&
                  /Scale\.(RESIZE|FIT)|['"](RESIZE|FIT)['"]/.test(main));
var cssFull = !!(arena && /canvas[^}]*\b(100vw|100vh|width\s*:\s*100%|height\s*:\s*100%)/.test(arena));
check('canvas-bound-to-window', 'P1', hasScale || cssFull,
  hasScale ? 'Scale.RESIZE/FIT present' :
  cssFull ? 'CSS fills canvas' :
  'bootArena uses fixed width/height with no scale{} block -> black margins off-960x540',
  ['main', 'arena']);

// 2. touch-controls (P1): on-screen stick + verb buttons for mobile.
var hasStick = !!(arena && /stickBase/.test(arena) && /stickNub/.test(arena));
var hasBtns = !!(arena && /\bbtn\b/.test(arena));
check('touch-controls', 'P1', hasStick && hasBtns,
  (hasStick ? '' : 'no #stickBase/#stickNub; ') + (hasBtns ? '' : 'no .btn verbs; ') +
  (hasStick && hasBtns ? 'present' : 'keyboard-only -> unplayable on touch'),
  ['arena']);

// 3. lighting-fx (P2): a real light/bloom/vignette pass, not just additive sprites.
var hasLight = /Light2D|enableLight|setPipeline|postFX|preFX|\bbloom\b|vignette/i.test(allSrc || '');
check('lighting-fx', 'P2', hasLight,
  hasLight ? 'lighting/post pipeline referenced' :
  'no Light2D/bloom/vignette pipeline (flat fills + additive bolts only)',
  ['main', 'world', 'actors', 'fx', 'rig']);

// 4. actor-height-band (P3): player actor should occupy ~28-36% of a 540 view.
var VIEW_H = 540, lo = 0.28, hi = 0.36;
var bh = actors && (actors.match(/\bBH\s*=\s*(\d+)/) || [])[1];
var pctH = bh ? (Number(bh) / VIEW_H) : null;
check('actor-height-band', 'P3', pctH != null && pctH >= lo && pctH <= hi,
  pctH == null ? 'BH not found in actors.js' :
  'BH=' + bh + ' @scale1 / ' + VIEW_H + ' = ' + (pctH * 100).toFixed(1) +
  '% (target ' + (lo*100) + '-' + (hi*100) + '%)',
  ['actors']);

// 5. backdrop-layered (P1): >=3 parallax layers, pillars at NEGATIVE depth (behind actors).
var farL = !!(world && /layers\.far/.test(world));
var floorL = !!(world && /layers\.floor/.test(world));
var pillL = !!(world && /layers\.pillars/.test(world));
var pillBehind = !!(world && /pil[\s\S]{0,200}setDepth\(\s*-\d+/.test(world));
check('backdrop-layered', 'P1', farL && floorL && pillL && pillBehind,
  (farL && floorL && pillL ? 'far+floor+pillars present; ' : 'missing a layer; ') +
  (pillBehind ? 'pillars behind actors' : 'pillars not at negative depth (may occlude!)'),
  ['world']);

// 6. audit-telemetry (P2): main.js must expose window.__AUDIT__.entities for the auditor.
var hasTel = !!(main && /__AUDIT__\.entities/.test(main));
check('audit-telemetry', 'P2', hasTel,
  hasTel ? '__AUDIT__.entities set' : 'no __AUDIT__.entities telemetry hook',
  ['main']);

// 7. touch-verb-coverage (P2): EVERY kit verb main.js reads off window.__TOUCH__ must be
//    wired to an on-screen control in arena.html, or that verb is UNREACHABLE on touch
//    (keyboard-only -> a whole ability is dead on mobile). Caught 2026-06-28: main.js reads
//    T._undeadEdge to fire summonUndead ('L' raise-dead foot-horde) but arena.html had only
//    ATK/HEX/WARD/SUMMON (no RAISE button, no _undeadEdge) -> raise-dead unreachable on touch.
var engVerbs = {};
(main || '').replace(/T\._(\w+)Edge/g, function (_m, v) { engVerbs[v] = true; return _m; });
var missingVerbs = Object.keys(engVerbs).filter(function (v) {
  return !(arena && arena.indexOf('_' + v + 'Edge') !== -1);
});
check('touch-verb-coverage', 'P2', missingVerbs.length === 0,
  missingVerbs.length
    ? 'engine reads _' + missingVerbs.join('Edge/_') + 'Edge but arena.html wires no touch ' +
      'control -> ' + missingVerbs.length + ' verb(s) UNREACHABLE on touch (keyboard-only)'
    : 'all ' + Object.keys(engVerbs).length + ' touch verbs wired to a control',
  ['main', 'arena']);

// 8. touch-held-verb-coverage (P2): check #7 only catches EDGE verbs (T._xEdge). A HELD/analog
//    verb the engine reads off window.__TOUCH__ is just as dead on touch if arena.html never sets
//    it. Caught 2026-06-28 (playtest run): main.js reads T.sprint — the DASH that GATES the entire
//    air-juggle chain (dash-launcher -> air-hit-confirm -> OTG land-splat) — but arena.html wires no
//    sprint control, so dash + every juggle mechanic is keyboard-only (unreachable on touch). check #7's
//    /_xEdge/ regex structurally cannot see a held verb like T.sprint, so this is its companion gate.
var heldVerbs = {};
// \bT\. anchors on the touch object `T` only — WITHOUT the \b, `SHIFT.isDown`/`LEFT.isDown`
// (keyboard reads in main.js) false-match as `T.isDown`. The boundary excludes a `T` that
// follows a word char (the trailing T of SHIFT/LEFT/RIGHT), keeping just the real `T.<verb>` reads.
(main || '').replace(/\bT\.(\w+)/g, function (_m, v) {
  if (v === 'dx' || v === 'dy' || /Edge$/.test(v)) return _m;   // analog stick + edge verbs (check #7)
  heldVerbs[v] = true; return _m;
});
var missingHeld = Object.keys(heldVerbs).filter(function (v) {
  return !(arena && arena.indexOf('T.' + v) !== -1);            // arena's touch script must SET the flag
});
check('touch-held-verb-coverage', 'P2', missingHeld.length === 0,
  missingHeld.length
    ? 'engine reads T.' + missingHeld.join('/T.') + ' (held/analog) but arena.html sets no such touch ' +
      'flag -> ' + missingHeld.length + ' verb(s) UNREACHABLE on touch (keyboard-only)'
    : 'all ' + Object.keys(heldVerbs).length + ' held touch verbs set by a control',
  ['main', 'arena']);

// --- report ---------------------------------------------------------------
var hardFails = results.filter(function (r) { return !r.pass && !r.inconclusive; });
var inconc = results.filter(function (r) { return r.inconclusive; });
console.log('parity_lint — game3d Dragon\'s-Crown gate  (ROOT=' + ROOT + ')');
results.forEach(function (r) {
  var tag = r.pass ? 'PASS' : (r.inconclusive ? 'INCONCLUSIVE' : 'FAIL');
  console.log('  [' + tag + '] ' + r.sev + ' ' + r.name + ' — ' + r.detail);
});
if (inconc.length) {
  var who = Object.keys(trunc).filter(function (k) { return trunc[k]; }).join(', ');
  console.error('\n⚠️  TRUNCATED READ (' + who + ') — ' + inconc.length +
    ' check(s) INCONCLUSIVE. The mount served a partial cloud tail; run LOCALLY ' +
    '(node game3d/tools/parity_lint.js on the real disk) to get a true verdict.');
}
if (hardFails.length) {
  console.error('\nGATE FAIL: ' + hardFails.length + ' violation(s): ' +
    hardFails.map(function (r) { return r.name + '(' + r.sev + ')'; }).join(', '));
  process.exit(1);
}
if (inconc.length) {
  console.log('\nGATE INCONCLUSIVE: ' + (results.length - inconc.length) +
    ' green, ' + inconc.length + ' unreadable (truncated mount). Not a hard fail.');
  process.exit(2);
}
console.log('\nGATE PASS: all parity checks green.');
process.exit(0);
