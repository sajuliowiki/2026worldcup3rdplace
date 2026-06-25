// worker.js - FIFA 2026 3rd Place Simulation Engine (v5.0)
// Imports standings engine from standings.js (shared with app.js)
// v5.0 adds:
//   - per-team possible finishing positions (1st..4th) for every group
//   - alternate Win/Draw/Loss ("wdl") analysis mode
//   - parametrized cross-group comparator (scoreline vs points-only)

importScripts('standings.js');

// ============ SCORELINE CONFIGURATION ============

const NORMAL_SCORES = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

function buildScorelines() {
  const seen = new Set();
  const s = [];
  const add = (h, a) => { const k = h * 1000 + a; if (!seen.has(k)) { seen.add(k); s.push([h, a]); } };
  // Fine-grained low scores — accurate GD/GF near zero (the common case).
  for (const h of NORMAL_SCORES) for (const a of NORMAL_SCORES) add(h, a);
  // High-scoring block (both teams) — for goals-for tiebreakers in the high regime.
  for (let h = 79; h <= 99; h++) for (let a = 79; a <= 99; a++) add(h, a);
  // One-sided blowout ladder — every winning/losing margin from 21..99 in BOTH
  // directions. This closes the gap that previously jumped straight from margin
  // 20 to margin 99: without it, two heavily-beaten teams could not be ordered
  // relative to each other (only the absolute extremes existed), so a team that
  // can finish 3rd with unbounded-negative GD was wrongly capped. Covers
  // [99,0] and [0,99] at m=99.
  for (let m = 21; m <= 99; m++) { add(m, 0); add(0, m); }
  return s; // 441 + 441 + 158 = 1040 scorelines
}

// ============ POSITION HELPERS ============
// Convert a ranking (array-of-arrays of stat indices, ties grouped)
// into, for each team, the set of positions it occupies. Mutually
// tied teams share the full span of positions their block covers.
function accumulatePositions(ranking, stats, posMask) {
  let pos = 0;
  for (const grp of ranking) {
    for (const idx of grp) {
      const nm = stats[idx].name;
      let mask = posMask[nm] || 0;
      for (let k = 0; k < grp.length; k++) mask |= (1 << (pos + k + 1));
      posMask[nm] = mask;
    }
    pos += grp.length;
  }
}

// Indices of the teams that occupy (or share) a given 1-based position.
function teamsAtPosition(ranking, targetPos) {
  let pos = 0;
  for (const grp of ranking) {
    if (pos < targetPos && targetPos <= pos + grp.length) return grp.slice();
    pos += grp.length;
  }
  return [];
}

function maskToPositions(mask) {
  const out = [];
  for (let p = 1; p <= 4; p++) if (mask & (1 << p)) out.push(p);
  return out;
}

// ============ FIND 3RD PLACE CANDIDATES (scoreline mode) ============
// Returns { candidates, positions } where positions maps name -> [pos,...]

function simulateGroupRegular(group, playedMatches, isComplete) {
  const posMask = {};

  if (isComplete) {
    const stats = computeStats(group, playedMatches);
    const ranking = rankGroup(stats);
    accumulatePositions(ranking, stats, posMask);
    const thirdTeams = getPositionTeams(ranking, 2, stats);
    const candidates = thirdTeams.map(t => ({
      name: t.name, flag: t.flag, pos: t.pos, fifaRank: t.fifaRank,
      best: {pts: t.pts, gd: t.gd, gf: t.gf, conduct: t.conduct, fifaRank: t.fifaRank},
      worst: {pts: t.pts, gd: t.gd, gf: t.gf, conduct: t.conduct, fifaRank: t.fifaRank},
    }));
    return {candidates, positions: positionsObj(posMask)};
  }

  const md3 = MATCH_SCHEDULE[3]; // [[3,0],[1,2]]
  const m0Played = playedMatches.some(m => m.home === md3[0][0] && m.away === md3[0][1]);
  const m1Played = playedMatches.some(m => m.home === md3[1][0] && m.away === md3[1][1]);

  if (m0Played && m1Played) {
    return simulateGroupRegular(group, playedMatches, true);
  }

  const scorelines = buildScorelines();
  const candidates = {};

  function processSim(allMatches) {
    const stats = computeStats(group, allMatches);
    const ranking = rankGroup(stats);
    accumulatePositions(ranking, stats, posMask);
    const thirdTeams = getPositionTeams(ranking, 2, stats);
    for (const t of thirdTeams) {
      const sl = {pts: t.pts, gd: t.gd, gf: t.gf, conduct: t.conduct, fifaRank: t.fifaRank};
      if (!candidates[t.name]) {
        candidates[t.name] = {
          name: t.name, flag: t.flag, pos: t.pos, fifaRank: t.fifaRank,
          best: {...sl}, worst: {...sl}
        };
      } else {
        const c = candidates[t.name];
        if (cmpStatNormalized(sl, c.best) > 0) c.best = {...sl};
        if (cmpStatNormalized(sl, c.worst) < 0) c.worst = {...sl};
      }
    }
  }

  if (!m0Played && !m1Played) {
    for (const [s1h, s1a] of scorelines) {
      for (const [s2h, s2a] of scorelines) {
        processSim([
          ...playedMatches,
          {home: md3[0][0], away: md3[0][1], hg: s1h, ag: s1a, hc: 0, ac: 0},
          {home: md3[1][0], away: md3[1][1], hg: s2h, ag: s2a, hc: 0, ac: 0},
        ]);
      }
    }
  } else if (m0Played) {
    for (const [s2h, s2a] of scorelines) {
      processSim([
        ...playedMatches,
        {home: md3[1][0], away: md3[1][1], hg: s2h, ag: s2a, hc: 0, ac: 0},
      ]);
    }
  } else {
    for (const [s1h, s1a] of scorelines) {
      processSim([
        ...playedMatches,
        {home: md3[0][0], away: md3[0][1], hg: s1h, ag: s1a, hc: 0, ac: 0},
      ]);
    }
  }

  // Worst-case conduct is unbounded for any team that can still play (it could
  // pick up unlimited disciplinary points in its remaining match); best-case
  // conduct is the current total (it can't un-receive cards). The scoreline
  // simulation itself sets simulated-match conduct to 0, so we apply this here.
  const md3conduct = MATCH_SCHEDULE[3];
  const canStillPlay = new Set();
  if (!m0Played) { canStillPlay.add(md3conduct[0][0]); canStillPlay.add(md3conduct[0][1]); }
  if (!m1Played) { canStillPlay.add(md3conduct[1][0]); canStillPlay.add(md3conduct[1][1]); }
  const result = Object.values(candidates);
  for (const c of result) {
    const idx = TEAMS[group].findIndex(t => t.name === c.name);
    if (canStillPlay.has(idx)) c.worst = {...c.worst, conduct: 999}; // 999 => ∞ (past INF_THRESHOLD)
  }
  return {candidates: result, positions: positionsObj(posMask)};
}

function positionsObj(posMask) {
  const out = {};
  for (const nm in posMask) out[nm] = maskToPositions(posMask[nm]);
  return out;
}

// ============ WIN/DRAW/LOSS SIMULATION (alternate mode) ============
// Enumerates every combination of W/D/L for unplayed fixtures
// (3^X scenarios, X = unplayed fixtures). Points (and head-to-head
// points) are exact; goal difference / goals scored are treated as
// unbounded (never used to break ties). Returns possible positions
// per team and 3rd-place point candidates for the cross-group race.

function simulateGroupWDL(group, playedMatches) {
  const allFix = [];
  for (let md = 1; md <= 3; md++)
    for (const pair of MATCH_SCHEDULE[md]) allFix.push({home: pair[0], away: pair[1]});

  const key = m => m.home + '-' + m.away;
  const playedSet = new Set(playedMatches.map(key));
  const unplayed = allFix.filter(f => !playedSet.has(key(f)));

  const X = unplayed.length;
  const total = Math.pow(3, X);
  const posMask = {};
  const third = {}; // name -> {name,flag,pos,fifaRank,best,worst}

  // A team's goal difference is "determined" once it has no unplayed fixtures.
  const nonDet = new Set();
  for (const f of unplayed) { nonDet.add(f.home); nonDet.add(f.away); }
  const isDet = idx => !nonDet.has(idx);

  for (let s = 0; s < total; s++) {
    let n = s;
    const sims = [];
    for (let k = 0; k < X; k++) {
      const d = n % 3; n = (n - d) / 3;
      const f = unplayed[k];
      // Encode result as a minimal scoreline (goals are ignored by WDL ranking,
      // but feed computeStats so head-to-head points are correct).
      let hg, ag;
      if (d === 0) { hg = 1; ag = 0; }       // home win
      else if (d === 1) { hg = 1; ag = 1; }  // draw
      else { hg = 0; ag = 1; }               // away win
      sims.push({home: f.home, away: f.away, hg, ag, hc: 0, ac: 0});
    }
    const all = playedMatches.concat(sims);
    const stats = computeStats(group, all);
    const ranking = rankGroupWDL(stats, isDet);
    accumulatePositions(ranking, stats, posMask);

    // 3rd-place candidates: any team whose block spans position 3.
    const thirdIdx = teamsAtPosition(ranking, 3);
    for (const idx of thirdIdx) {
      const t = stats[idx];
      if (!third[t.name]) {
        third[t.name] = {name: t.name, flag: t.flag, pos: t.pos, fifaRank: t.fifaRank, best: t.pts, worst: t.pts};
      } else {
        if (t.pts > third[t.name].best) third[t.name].best = t.pts;
        if (t.pts < third[t.name].worst) third[t.name].worst = t.pts;
      }
    }
  }

  const candidates = Object.values(third).map(t => ({
    name: t.name, flag: t.flag, pos: t.pos, fifaRank: t.fifaRank,
    best:  {pts: t.best,  gd: 0, gf: 0, conduct: 0, fifaRank: t.fifaRank},
    worst: {pts: t.worst, gd: 0, gf: 0, conduct: 0, fifaRank: t.fifaRank},
  }));

  return {candidates, positions: positionsObj(posMask)};
}

function getPositionTeams(ranking, posIdx, stats) {
  let pos = 0;
  for (const grp of ranking) {
    if (pos <= posIdx && pos + grp.length > posIdx) {
      return grp.map(i => stats[i]);
    }
    pos += grp.length;
  }
  return [];
}

// ============ CROSS-GROUP COMPARATORS ============
// Rank comparator convention: negative => a ranks ABOVE b.

// Scoreline mode: points, then normalized GD, GF, conduct, FIFA rank.
function cmp3rd(a, b) {
  if (a.pts !== b.pts) return b.pts - a.pts;
  var agd = a.gd > INF_THRESHOLD ? Infinity : a.gd < -INF_THRESHOLD ? -Infinity : a.gd;
  var bgd = b.gd > INF_THRESHOLD ? Infinity : b.gd < -INF_THRESHOLD ? -Infinity : b.gd;
  if (agd !== bgd) {
    if (agd === Infinity && bgd === Infinity) { /* tied */ }
    else if (agd === -Infinity && bgd === -Infinity) { /* tied */ }
    else if (agd === Infinity) return -1;
    else if (bgd === Infinity) return 1;
    else if (agd === -Infinity) return 1;
    else if (bgd === -Infinity) return -1;
    else return bgd - agd;
  }
  var agf = a.gf > INF_THRESHOLD ? Infinity : a.gf < -INF_THRESHOLD ? -Infinity : a.gf;
  var bgf = b.gf > INF_THRESHOLD ? Infinity : b.gf < -INF_THRESHOLD ? -Infinity : b.gf;
  if (agf !== bgf) {
    if (agf === Infinity && bgf === Infinity) { /* tied */ }
    else if (agf === -Infinity && bgf === -Infinity) { /* tied */ }
    else if (agf === Infinity) return -1;
    else if (bgf === Infinity) return 1;
    else if (agf === -Infinity) return 1;
    else if (bgf === -Infinity) return -1;
    else return bgf - agf;
  }
  var ac = a.conduct > INF_THRESHOLD ? Infinity : a.conduct;
  var bc = b.conduct > INF_THRESHOLD ? Infinity : b.conduct;
  if (ac !== bc) {
    if (ac === Infinity && bc === Infinity) { /* tied */ }
    else if (ac === Infinity) return 1;
    else if (bc === Infinity) return -1;
    else return ac - bc;
  }
  if (a.fifaRank !== b.fifaRank) return a.fifaRank - b.fifaRank;
  return 0;
}

// WDL mode: points only. Equal points => genuine tie (GD unbounded,
// so either team could rank above the other). Never broken by FIFA rank.
function cmp3rdWDL(a, b) {
  return b.pts - a.pts;
}

// ============ CROSS-GROUP ANALYSIS ============

// analyzeAll is retained as a thin wrapper over the corner method (analyzeAllFast),
// which is exact, far faster, and fixes a per-team boundary-tie bug in the old
// Cartesian-product implementation. The rankCmp/statsDiffer params are ignored
// (regular mode only; WDL uses analyzeAllWDL).
function analyzeAll(groupCandidates) {
  return analyzeAllFast(groupCandidates);
}

function getSubsets(arr, k) {
  if (k <= 0) return [[]];
  if (k >= arr.length) return [arr.slice()];
  const result = [];
  function helper(start, cur) {
    if (cur.length === k) { result.push([...cur]); return; }
    for (let i = start; i < arr.length; i++) { cur.push(arr[i]); helper(i + 1, cur); cur.pop(); }
  }
  helper(0, []);
  return result;
}

// ============ CROSS-GROUP ANALYSIS (corner method) ============
// Equivalent to analyzeAll() but without the Cartesian product. Because top-8
// membership is a monotonic threshold, every verdict and every possible
// combination is decided at the extreme corners, so each group collapses to a
// single best / single worst third-place stat line. O(495 + teams*12) instead
// of O(product of per-group entry counts).
function analyzeAllFast(groupCandidates) {
  const gBest = {}, gWorst = {};
  for (const g of GROUPS) {
    const cands = groupCandidates[g] || [];
    if (cands.length === 0) {
      gBest[g]  = {pts:9, gd:999, gf:999, conduct:0,    fifaRank:100};
      gWorst[g] = {pts:0, gd:-999, gf:0,  conduct:9999, fifaRank:100};
      continue;
    }
    let b = cands[0].best, w = cands[0].worst;
    for (const c of cands) {
      if (cmp3rd(c.best, b) < 0) b = c.best;    // c.best ranks higher
      if (cmp3rd(c.worst, w) > 0) w = c.worst;  // c.worst ranks lower
    }
    gBest[g] = b; gWorst[g] = w;
  }

  // Possible 8-group combinations: C is achievable iff, with C at best and the
  // rest at worst, all of C outranks all of non-C — i.e. the weakest C-best is
  // not strictly out-ranked by the strongest non-C-worst.
  const possibleCombos = new Set();
  for (const C of getSubsets(GROUPS.slice(), 8)) {
    const inC = new Set(C);
    let cMinBest = null;       // worst-ranked "best" inside C
    for (const g of C) { if (cMinBest === null || cmp3rd(gBest[g], cMinBest) > 0) cMinBest = gBest[g]; }
    let dMaxWorst = null;      // best-ranked "worst" outside C
    for (const g of GROUPS) { if (!inC.has(g) && (dMaxWorst === null || cmp3rd(gWorst[g], dMaxWorst) < 0)) dMaxWorst = gWorst[g]; }
    if (cmp3rd(dMaxWorst, cMinBest) >= 0) possibleCombos.add(C.slice().sort().join(''));
  }

  // Group verdicts.
  const groupStatus = {};
  for (const g of GROUPS) {
    let blockMust = 0, blockCan = 0;
    for (const h of GROUPS) {
      if (h === g) continue;
      if (cmp3rd(gBest[h], gWorst[g]) <= 0) blockMust++;  // h (best) can sit at/above g (worst)
      if (cmp3rd(gWorst[h], gBest[g]) < 0) blockCan++;    // h (worst) always above g (best)
    }
    const mustAdvance = blockMust <= 7;
    const canAdvance = blockCan <= 7;
    if (canAdvance && mustAdvance) groupStatus[g] = 'GUARANTEED_TOP8';
    else if (!canAdvance) groupStatus[g] = 'GUARANTEED_BOTTOM4';
    else groupStatus[g] = 'TBD';
  }

  // Per-team verdicts: each team's own best/worst against the OTHER groups'
  // overall best/worst (the envelope over every third-placer that group could
  // send — which is exactly the single group best/worst).
  const teamStatus = {};
  for (const g of GROUPS) {
    for (const c of (groupCandidates[g] || [])) {
      let blockMust = 0, blockCan = 0;
      for (const h of GROUPS) {
        if (h === g) continue;
        if (cmp3rd(gBest[h], c.worst) <= 0) blockMust++;
        if (cmp3rd(gWorst[h], c.best) < 0) blockCan++;
      }
      const can = blockCan <= 7, must = blockMust <= 7;
      if (can && must) teamStatus[c.name] = 'GUARANTEED_TOP8';
      else if (!can) teamStatus[c.name] = 'GUARANTEED_BOTTOM4';
      else teamStatus[c.name] = 'TBD';
    }
  }

  return { possibleCombos: [...possibleCombos], groupStatus, teamStatus, totalEvals: 0 };
}

// Per-team third-place route verdict for WDL mode.
// Goal difference is unbounded, so two third-placed teams level on points
// could rank either way. A candidate third-placed team T (worst-when-3rd
// points = w, best = b) is therefore:
//   - guaranteed a TOP-8 third place  iff at most 7 OTHER groups can field a
//     third-placed team reaching >= w points (8+ such groups could bury T);
//   - guaranteed a BOTTOM-4 third place iff at least 8 OTHER groups are forced
//     above T even at its best (their minimum third-place points exceed b).
// This resolves individual teams against the whole field without enumerating
// the cross-group product — it's O(teams x 12).
function computeThirdRouteWDL(groupCandidates) {
  const maxThird = {}, minThird = {};
  for (const g of GROUPS) {
    const cands = groupCandidates[g] || [];
    let mx = -Infinity, mn = Infinity;
    for (const c of cands) { if (c.best.pts > mx) mx = c.best.pts; if (c.worst.pts < mn) mn = c.worst.pts; }
    if (cands.length === 0) { mx = 9; mn = 0; }
    maxThird[g] = mx; minThird[g] = mn;
  }
  const route = {};
  for (const g of GROUPS) {
    for (const c of (groupCandidates[g] || [])) {
      const w = c.worst.pts, b = c.best.pts;
      let threats = 0, forcedAbove = 0;
      for (const h of GROUPS) {
        if (h === g) continue;
        if (maxThird[h] >= w) threats++;
        if (minThird[h] > b) forcedAbove++;
      }
      route[c.name] = { gtop8: threats <= 7, gbottom4: forcedAbove >= 8 };
    }
  }
  return route;
}

// Combine each team's possible group positions with the per-team third-place
// route verdict to produce a "has advanced / eliminated / undecided" status.
function buildTeamStatusWDL(groupPositions, thirdRoute) {
  const status = {};
  for (const g of GROUPS) {
    const gp = groupPositions[g] || {};
    for (const t of TEAMS[g]) {
      const P = gp[t.name] || [1, 2, 3, 4];
      const has = p => P.indexOf(p) !== -1;
      const top2 = has(1) || has(2);
      const canThird = has(3);
      const canFourth = has(4);
      const onlyTop2 = !canThird && !canFourth;      // P subset {1,2}
      const onlyFourth = P.length === 1 && P[0] === 4;
      const r = thirdRoute[t.name] || { gtop8: false, gbottom4: false };

      if (onlyTop2) status[t.name] = 'GUARANTEED_TOP8';                       // clinched a top-2 finish
      else if (onlyFourth) status[t.name] = 'GUARANTEED_BOTTOM4';             // can only finish 4th
      else if (!canFourth && r.gtop8) status[t.name] = 'GUARANTEED_TOP8';     // never 4th, and any 3rd is top-8
      else if (!top2 && r.gbottom4) status[t.name] = 'GUARANTEED_BOTTOM4';    // never top-2, and any 3rd is bottom-4
      else status[t.name] = 'TBD';
    }
  }
  return status;
}

// ============ FAST POINTS-ONLY CROSS-GROUP ANALYSIS (WDL mode) ============
// In WDL mode goal difference is unbounded, so every group is modelled by
// just the DISTINCT third-place point totals it can achieve (not per team).
// This keeps the cross-group product small. Two safety valves prevent any
// pathological blow-up: an early exit once every combination is already
// possible, and an overall work budget that falls back to "all
// combinations possible" (a safe over-approximation) if exceeded.
function allEightSubsetKeys() {
  return getSubsets(GROUPS.slice(), 8).map(s => s.slice().sort().join(''));
}

function analyzeAllWDL(groupCandidates) {
  const groupStats = {};
  for (const g of GROUPS) {
    const cands = groupCandidates[g] || [];
    const set = new Set();
    for (const c of cands) { set.add(c.best.pts); set.add(c.worst.pts); }
    if (set.size === 0) set.add(0);
    groupStats[g] = [...set];
  }

  const possibleCombos = new Set();
  const groupCan = {}, groupMust = {};
  for (const g of GROUPS) { groupCan[g] = false; groupMust[g] = true; }

  const finalizeAllPossible = () => {
    for (const key of allEightSubsetKeys()) possibleCombos.add(key);
    for (const g of GROUPS) { groupCan[g] = true; groupMust[g] = false; }
  };

  let product = 1;
  for (const g of GROUPS) { product *= groupStats[g].length; if (product > 5e6) break; }
  if (product > 5e6) {
    finalizeAllPossible();
    return { possibleCombos: [...possibleCombos], groupStatus: statusFromCanMust(groupCan, groupMust) };
  }

  const arrays = GROUPS.map(g => groupStats[g]);
  const lens = arrays.map(a => a.length);
  const idx = new Array(12).fill(0);
  const TOTAL_COMBOS = 495; // C(12,8)
  let workBudget = 4e6;
  let done = false, aborted = false;

  while (!done) {
    const cur = GROUPS.map((g, gi) => ({group: g, pts: arrays[gi][idx[gi]]}));
    const sorted = cur.slice().sort((a, b) => b.pts - a.pts);

    let pos = 0;
    const def = new Set(), amb = new Set();
    let i = 0;
    while (i < sorted.length) {
      let j = i + 1;
      while (j < sorted.length && sorted[j].pts === sorted[i].pts) j++;
      if (pos + (j - i) <= 8) { for (let k = i; k < j; k++) def.add(sorted[k].group); }
      else if (pos < 8) { for (let k = i; k < j; k++) amb.add(sorted[k].group); }
      pos += (j - i); i = j;
    }

    if (amb.size === 0) {
      possibleCombos.add([...def].sort().join(''));
      for (const g of GROUPS) { if (def.has(g)) groupCan[g] = true; else groupMust[g] = false; }
    } else {
      const slotsLeft = 8 - def.size;
      const subs = getSubsets([...amb], slotsLeft);
      workBudget -= subs.length;
      for (const sub of subs) {
        const top8 = new Set([...def, ...sub]);
        possibleCombos.add([...top8].sort().join(''));
        for (const g of GROUPS) { if (top8.has(g)) groupCan[g] = true; else groupMust[g] = false; }
      }
    }

    if (possibleCombos.size >= TOTAL_COMBOS) { finalizeAllPossible(); break; }
    if (workBudget <= 0) { aborted = true; break; }

    let carry = true;
    for (let gi = 11; gi >= 0 && carry; gi--) {
      idx[gi]++;
      if (idx[gi] < lens[gi]) carry = false; else idx[gi] = 0;
    }
    if (carry) done = true;
  }

  if (aborted) finalizeAllPossible(); // safe over-approximation

  return { possibleCombos: [...possibleCombos], groupStatus: statusFromCanMust(groupCan, groupMust) };
}

function statusFromCanMust(groupCan, groupMust) {
  const groupStatus = {};
  for (const g of GROUPS) {
    if (groupCan[g] && groupMust[g]) groupStatus[g] = 'GUARANTEED_TOP8';
    else if (!groupCan[g]) groupStatus[g] = 'GUARANTEED_BOTTOM4';
    else groupStatus[g] = 'TBD';
  }
  return groupStatus;
}

// ============ MESSAGE HANDLER ============

self.onmessage = function(e) {
  const {type, data} = e.data;
  if (type !== 'analyze') return;

  const {matchData, completeness, mode, cached} = data;
  const isWDL = mode === 'wdl';
  const cache = cached || {};
  self.postMessage({type: 'progress', pct: 0, msg: 'Starting analysis...'});

  const groupCandidates = {};
  const groupPositions = {};

  for (let gi = 0; gi < GROUPS.length; gi++) {
    const g = GROUPS[gi];
    const played = matchData[g] || [];

    // Reuse a cached result when this group's data (and mode) is unchanged.
    if (cache[g] && cache[g].candidates && cache[g].positions) {
      self.postMessage({type: 'progress', pct: Math.round(gi / 12 * 50), msg: 'Group ' + g + ' (cached)'});
      groupCandidates[g] = cache[g].candidates;
      groupPositions[g] = cache[g].positions;
      continue;
    }

    self.postMessage({type: 'progress', pct: Math.round(gi / 12 * 50), msg: 'Simulating Group ' + g + (isWDL ? ' (W/D/L)' : '') + '...'});

    if (isWDL) {
      const r = simulateGroupWDL(g, played);
      groupCandidates[g] = r.candidates;
      groupPositions[g] = r.positions;
    } else {
      const isComplete = completeness[g];
      if (isComplete) {
        const r = simulateGroupRegular(g, played, true);
        groupCandidates[g] = r.candidates; groupPositions[g] = r.positions;
      } else if (played.length >= 4) {
        const r = simulateGroupRegular(g, played, false);
        groupCandidates[g] = r.candidates; groupPositions[g] = r.positions;
      } else {
        // Not enough data for this group — every team / position open.
        groupCandidates[g] = TEAMS[g].map(t => ({
          name: t.name, flag: t.flag, pos: t.pos, fifaRank: FIFA_RANKINGS[t.name],
          best: {pts:9, gd:999, gf:999, conduct:0, fifaRank: FIFA_RANKINGS[t.name]},
          worst: {pts:0, gd:-999, gf:0, conduct:9999, fifaRank: FIFA_RANKINGS[t.name]},
        }));
        const pos = {};
        TEAMS[g].forEach(t => { pos[t.name] = [1,2,3,4]; });
        groupPositions[g] = pos;
      }
    }
  }

  self.postMessage({type: 'progress', pct: 50, msg: 'Analyzing cross-group combinations...'});
  self.postMessage({type: 'candidates', data: groupCandidates});

  let possibleCombos, groupStatus, teamStatus, totalEvals = 0;

  if (isWDL) {
    const wdl = analyzeAllWDL(groupCandidates);
    possibleCombos = wdl.possibleCombos;
    groupStatus = wdl.groupStatus;
    // Resolve each individual team against the whole third-place field.
    const thirdRoute = computeThirdRouteWDL(groupCandidates);
    teamStatus = buildTeamStatusWDL(groupPositions, thirdRoute);
  } else {
    const analysis = analyzeAll(groupCandidates);
    possibleCombos = analysis.possibleCombos;
    groupStatus = analysis.groupStatus;
    teamStatus = analysis.teamStatus;
    totalEvals = analysis.totalEvals;
  }

  self.postMessage({type: 'progress', pct: 100, msg: 'Complete!'});
  self.postMessage({type: 'result', data: {
    possibleCombos: possibleCombos,
    groupStatus: groupStatus,
    teamStatus: teamStatus,
    groupPositions: groupPositions,
    mode: mode || 'regular',
    totalEvals: totalEvals
  }});
};
