// worker.js - FIFA 2026 3rd Place Simulation Engine (v4.0)
// Imports standings engine from standings.js (shared with app.js)
// Fixes: partial MD3 handling, normalized stat comparator

importScripts('standings.js');

// ============ SCORELINE CONFIGURATION ============

const NORMAL_SCORES = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];

function buildScorelines() {
  const s = [];
  for (const h of NORMAL_SCORES) for (const a of NORMAL_SCORES) s.push([h, a]);
  s.push([99, 0]); s.push([0, 99]);
  for (let x = 79; x <= 99; x++) for (let y = 79; y <= 99; y++) s.push([x, y]);
  return s; // 884 total
}

// ============ FIND 3RD PLACE CANDIDATES ============

function findThirdPlace(group, playedMatches, isComplete) {
  if (isComplete) {
    const stats = computeStats(group, playedMatches);
    const ranking = rankGroup(stats);
    const thirdTeams = getPositionTeams(ranking, 2, stats);
    return thirdTeams.map(t => ({
      name: t.name, flag: t.flag, pos: t.pos, fifaRank: t.fifaRank,
      best: {pts: t.pts, gd: t.gd, gf: t.gf, conduct: t.conduct, fifaRank: t.fifaRank},
      worst: {pts: t.pts, gd: t.gd, gf: t.gf, conduct: t.conduct, fifaRank: t.fifaRank},
    }));
  }

  // Determine which MD3 matches are already played vs need simulation
  const md3 = MATCH_SCHEDULE[3]; // [[3,0],[1,2]]
  const m0Played = playedMatches.some(m => m.home === md3[0][0] && m.away === md3[0][1]);
  const m1Played = playedMatches.some(m => m.home === md3[1][0] && m.away === md3[1][1]);

  // If both MD3 matches are already in playedMatches, treat as complete
  if (m0Played && m1Played) {
    return findThirdPlace(group, playedMatches, true);
  }

  const scorelines = buildScorelines();
  const candidates = {};

  function processSim(allMatches) {
    const stats = computeStats(group, allMatches);
    const ranking = rankGroup(stats);
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
    // Neither MD3 match played — simulate both (884² scenarios)
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
    // Only match 0 played — simulate match 1 only (884 scenarios)
    for (const [s2h, s2a] of scorelines) {
      processSim([
        ...playedMatches,
        {home: md3[1][0], away: md3[1][1], hg: s2h, ag: s2a, hc: 0, ac: 0},
      ]);
    }
  } else {
    // Only match 1 played — simulate match 0 only (884 scenarios)
    for (const [s1h, s1a] of scorelines) {
      processSim([
        ...playedMatches,
        {home: md3[0][0], away: md3[0][1], hg: s1h, ag: s1a, hc: 0, ac: 0},
      ]);
    }
  }

  return Object.values(candidates);
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

// ============ CROSS-GROUP ANALYSIS ============

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

function analyzeAll(groupCandidates) {
  const scenarios = {};
  for (const g of GROUPS) {
    const cands = groupCandidates[g] || [];
    const sc = [];
    for (const c of cands) {
      sc.push({group: g, name: c.name, flag: c.flag, pos: c.pos, stat: c.best, type: 'best'});
      if (cmpStatNormalized(c.best, c.worst) !== 0) {
        sc.push({group: g, name: c.name, flag: c.flag, pos: c.pos, stat: c.worst, type: 'worst'});
      }
    }
    if (sc.length === 0) {
      sc.push({group: g, name: '?', flag: '?', pos: g+'?',
        stat: {pts:0,gd:0,gf:0,conduct:0,fifaRank:100}, type: 'default'});
    }
    scenarios[g] = sc;
  }

  const possibleCombos = new Set();
  const groupCanAdvance = {}, groupMustAdvance = {};
  const teamCanAdvance = {}, teamMustAdvance = {};
  for (const g of GROUPS) { groupCanAdvance[g] = false; groupMustAdvance[g] = true; }

  let totalEvals = 0;
  let totalCombos = 1;
  for (const g of GROUPS) totalCombos *= scenarios[g].length;

  const scenarioArrays = GROUPS.map(g => scenarios[g]);
  const indices = new Array(12).fill(0);
  const lengths = scenarioArrays.map(a => a.length);

  let done = false, progressCounter = 0;
  const progressInterval = Math.max(1, Math.floor(totalCombos / 20));

  while (!done) {
    const current = indices.map((idx, gi) => scenarioArrays[gi][idx]);
    const sorted = [...current].sort((a, b) => cmp3rd(a.stat, b.stat));

    let pos = 0;
    const definiteTop8 = new Set(), ambiguous = new Set();
    let i = 0;
    while (i < sorted.length) {
      let j = i + 1;
      while (j < sorted.length && cmp3rd(sorted[i].stat, sorted[j].stat) === 0) j++;
      if (pos + (j - i) <= 8) { for (let k = i; k < j; k++) definiteTop8.add(sorted[k].group); }
      else if (pos < 8) { for (let k = i; k < j; k++) ambiguous.add(sorted[k].group); }
      pos += (j - i); i = j;
    }

    if (ambiguous.size === 0) {
      const key = [...definiteTop8].sort().join('');
      possibleCombos.add(key);
      for (const g of GROUPS) { if (definiteTop8.has(g)) groupCanAdvance[g] = true; else groupMustAdvance[g] = false; }
      for (const s of current) {
        if (!teamCanAdvance[s.name]) { teamCanAdvance[s.name] = false; teamMustAdvance[s.name] = true; }
        if (definiteTop8.has(s.group)) teamCanAdvance[s.name] = true; else teamMustAdvance[s.name] = false;
      }
    } else {
      const slotsLeft = 8 - definiteTop8.size;
      const subsets = getSubsets([...ambiguous], slotsLeft);
      for (const sub of subsets) {
        const top8 = new Set([...definiteTop8, ...sub]);
        const key = [...top8].sort().join('');
        possibleCombos.add(key);
        for (const g of GROUPS) { if (top8.has(g)) groupCanAdvance[g] = true; else groupMustAdvance[g] = false; }
        for (const s of current) {
          if (!teamCanAdvance[s.name]) { teamCanAdvance[s.name] = false; teamMustAdvance[s.name] = true; }
          if (top8.has(s.group)) teamCanAdvance[s.name] = true; else teamMustAdvance[s.name] = false;
        }
      }
    }

    totalEvals++;
    progressCounter++;
    if (progressCounter >= progressInterval) {
      progressCounter = 0;
      self.postMessage({type: 'progress', pct: Math.round(totalEvals / totalCombos * 100)});
    }

    let carry = true;
    for (let gi = 11; gi >= 0 && carry; gi--) {
      indices[gi]++;
      if (indices[gi] < lengths[gi]) carry = false;
      else indices[gi] = 0;
    }
    if (carry) done = true;
  }

  const groupStatus = {}, teamStatus = {};
  for (const g of GROUPS) {
    if (groupCanAdvance[g] && groupMustAdvance[g]) groupStatus[g] = 'GUARANTEED_TOP8';
    else if (!groupCanAdvance[g]) groupStatus[g] = 'GUARANTEED_BOTTOM4';
    else groupStatus[g] = 'TBD';
  }
  for (const name in teamCanAdvance) {
    if (teamCanAdvance[name] && teamMustAdvance[name]) teamStatus[name] = 'GUARANTEED_TOP8';
    else if (!teamCanAdvance[name]) teamStatus[name] = 'GUARANTEED_BOTTOM4';
    else teamStatus[name] = 'TBD';
  }
  return { possibleCombos: [...possibleCombos], groupStatus, teamStatus, totalEvals };
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

// ============ MESSAGE HANDLER ============

self.onmessage = function(e) {
  const {type, data} = e.data;
  if (type === 'analyze') {
    const {matchData, completeness} = data;
    self.postMessage({type: 'progress', pct: 0, msg: 'Starting analysis...'});
    const groupCandidates = {};
    for (let gi = 0; gi < GROUPS.length; gi++) {
      const g = GROUPS[gi];
      self.postMessage({type: 'progress', pct: Math.round(gi / 12 * 50), msg: 'Simulating Group ' + g + '...'});
      const isComplete = completeness[g];
      const played = matchData[g] || [];
      if (isComplete) {
        groupCandidates[g] = findThirdPlace(g, played, true);
      } else if (played.length >= 4) {
        groupCandidates[g] = findThirdPlace(g, played, false);
      } else {
        groupCandidates[g] = TEAMS[g].map(t => ({
          name: t.name, flag: t.flag, pos: t.pos, fifaRank: FIFA_RANKINGS[t.name],
          best: {pts:9, gd:999, gf:999, conduct:0, fifaRank: FIFA_RANKINGS[t.name]},
          worst: {pts:0, gd:-999, gf:0, conduct:9999, fifaRank: FIFA_RANKINGS[t.name]},
        }));
      }
    }
    self.postMessage({type: 'progress', pct: 50, msg: 'Analyzing cross-group combinations...'});
    self.postMessage({type: 'candidates', data: groupCandidates});
    const analysis = analyzeAll(groupCandidates);
    self.postMessage({type: 'progress', pct: 100, msg: 'Complete!'});
    self.postMessage({type: 'result', data: analysis});
  }
};
