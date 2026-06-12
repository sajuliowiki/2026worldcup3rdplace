// standings.js — Shared FIFA 2026 standings engine
// Single source of truth for group standings and tiebreaker logic.
// Loaded by both the main thread (app.js) and the Web Worker (worker.js).

var GROUPS = ["A","B","C","D","E","F","G","H","I","J","K","L"];

var TEAMS = {
  A:[{pos:"A1",name:"Mexico",flag:"🇲🇽"},{pos:"A2",name:"South Africa",flag:"🇿🇦"},{pos:"A3",name:"South Korea",flag:"🇰🇷"},{pos:"A4",name:"Czech Republic",flag:"🇨🇿"}],
  B:[{pos:"B1",name:"Canada",flag:"🇨🇦"},{pos:"B2",name:"Bosnia-Herzegovina",flag:"🇧🇦"},{pos:"B3",name:"Qatar",flag:"🇶🇦"},{pos:"B4",name:"Switzerland",flag:"🇨🇭"}],
  C:[{pos:"C1",name:"Brazil",flag:"🇧🇷"},{pos:"C2",name:"Morocco",flag:"🇲🇦"},{pos:"C3",name:"Haiti",flag:"🇭🇹"},{pos:"C4",name:"Scotland",flag:"🏴󠁧󠁢󠁳󠁣󠁴󠁿"}],
  D:[{pos:"D1",name:"United States",flag:"🇺🇸"},{pos:"D2",name:"Paraguay",flag:"🇵🇾"},{pos:"D3",name:"Australia",flag:"🇦🇺"},{pos:"D4",name:"Turkey",flag:"🇹🇷"}],
  E:[{pos:"E1",name:"Germany",flag:"🇩🇪"},{pos:"E2",name:"Curaçao",flag:"🇨🇼"},{pos:"E3",name:"Ivory Coast",flag:"🇨🇮"},{pos:"E4",name:"Ecuador",flag:"🇪🇨"}],
  F:[{pos:"F1",name:"Netherlands",flag:"🇳🇱"},{pos:"F2",name:"Japan",flag:"🇯🇵"},{pos:"F3",name:"Sweden",flag:"🇸🇪"},{pos:"F4",name:"Tunisia",flag:"🇹🇳"}],
  G:[{pos:"G1",name:"Belgium",flag:"🇧🇪"},{pos:"G2",name:"Egypt",flag:"🇪🇬"},{pos:"G3",name:"Iran",flag:"🇮🇷"},{pos:"G4",name:"New Zealand",flag:"🇳🇿"}],
  H:[{pos:"H1",name:"Spain",flag:"🇪🇸"},{pos:"H2",name:"Cape Verde",flag:"🇨🇻"},{pos:"H3",name:"Saudi Arabia",flag:"🇸🇦"},{pos:"H4",name:"Uruguay",flag:"🇺🇾"}],
  I:[{pos:"I1",name:"France",flag:"🇫🇷"},{pos:"I2",name:"Senegal",flag:"🇸🇳"},{pos:"I3",name:"Iraq",flag:"🇮🇶"},{pos:"I4",name:"Norway",flag:"🇳🇴"}],
  J:[{pos:"J1",name:"Argentina",flag:"🇦🇷"},{pos:"J2",name:"Algeria",flag:"🇩🇿"},{pos:"J3",name:"Austria",flag:"🇦🇹"},{pos:"J4",name:"Jordan",flag:"🇯🇴"}],
  K:[{pos:"K1",name:"Portugal",flag:"🇵🇹"},{pos:"K2",name:"DR Congo",flag:"🇨🇩"},{pos:"K3",name:"Uzbekistan",flag:"🇺🇿"},{pos:"K4",name:"Colombia",flag:"🇨🇴"}],
  L:[{pos:"L1",name:"England",flag:"🏴󠁧󠁢󠁥󠁮󠁧󠁿"},{pos:"L2",name:"Croatia",flag:"🇭🇷"},{pos:"L3",name:"Ghana",flag:"🇬🇭"},{pos:"L4",name:"Panama",flag:"🇵🇦"}],
};

// =====================================================================
// ▼▼▼ EDIT FIFA RANKINGS HERE ▼▼▼
// Lower number = better ranked. Used as final tiebreaker.
// =====================================================================
var FIFA_RANKINGS = {
  "Mexico":14,"South Africa":60,"South Korea":25,"Czech Republic":40,
  "Canada":30,"Bosnia-Herzegovina":64,"Qatar":56,"Switzerland":19,
  "Brazil":6,"Morocco":7,"Haiti":83,"Scotland":42,
  "United States":17,"Paraguay":41,"Australia":27,"Turkey":22,
  "Germany":10,"Curaçao":82,"Ivory Coast":33,"Ecuador":23,
  "Netherlands":8,"Japan":18,"Sweden":38,"Tunisia":45,
  "Belgium":9,"Egypt":29,"Iran":20,"New Zealand":85,
  "Spain":2,"Cape Verde":67,"Saudi Arabia":61,"Uruguay":16,
  "France":3,"Senegal":15,"Iraq":57,"Norway":31,
  "Argentina":1,"Algeria":28,"Austria":24,"Jordan":63,
  "Portugal":5,"DR Congo":46,"Uzbekistan":50,"Colombia":13,
  "England":4,"Croatia":11,"Ghana":73,"Panama":34
};
// =====================================================================

var MATCH_SCHEDULE = {
  1: [[0,1],[2,3]],
  2: [[0,2],[3,1]],
  3: [[3,0],[1,2]],
};

// ============================================================
// GROUP STANDINGS ENGINE
// ============================================================

function computeStats(group, matchResults) {
  var teams = TEAMS[group];
  var stats = teams.map(function(t, i) {
    return {
      idx: i, name: t.name, pos: t.pos, flag: t.flag,
      pts: 0, gf: 0, ga: 0, gd: 0, conduct: 0, mp: 0,
      fifaRank: FIFA_RANKINGS[t.name] || 100,
      h2h: {}
    };
  });
  for (var mi = 0; mi < matchResults.length; mi++) {
    var m = matchResults[mi];
    var h = stats[m.home], a = stats[m.away];
    h.gf += m.hg; h.ga += m.ag; h.mp++;
    a.gf += m.ag; a.ga += m.hg; a.mp++;
    h.conduct += (m.hc || 0); a.conduct += (m.ac || 0);
    var hp = 0, ap = 0;
    if (m.hg > m.ag) hp = 3;
    else if (m.hg < m.ag) ap = 3;
    else { hp = 1; ap = 1; }
    h.pts += hp; a.pts += ap;
    if (!h.h2h[m.away]) h.h2h[m.away] = {pts:0, gf:0, ga:0};
    if (!a.h2h[m.home]) a.h2h[m.home] = {pts:0, gf:0, ga:0};
    h.h2h[m.away].pts += hp; h.h2h[m.away].gf += m.hg; h.h2h[m.away].ga += m.ag;
    a.h2h[m.home].pts += ap; a.h2h[m.home].gf += m.ag; a.h2h[m.home].ga += m.hg;
  }
  for (var i = 0; i < stats.length; i++) stats[i].gd = stats[i].gf - stats[i].ga;
  return stats;
}

function getH2H(indices, stats) {
  var r = {};
  for (var i = 0; i < indices.length; i++) {
    var idx = indices[i];
    r[idx] = {pts:0, gf:0, ga:0, gd:0};
    for (var j = 0; j < indices.length; j++) {
      var jdx = indices[j];
      if (idx !== jdx && stats[idx].h2h[jdx]) {
        r[idx].pts += stats[idx].h2h[jdx].pts;
        r[idx].gf += stats[idx].h2h[jdx].gf;
        r[idx].ga += stats[idx].h2h[jdx].ga;
      }
    }
    r[idx].gd = r[idx].gf - r[idx].ga;
  }
  return r;
}

function rankGroup(stats) {
  var indices = stats.map(function(_, i) { return i; });
  return doRank(indices, stats);
}

function doRank(indices, stats) {
  if (indices.length <= 1) return indices.map(function(i) { return [i]; });
  var byPts = groupByFn(indices, function(i) { return stats[i].pts; }, true);
  var result = [];
  for (var p = 0; p < byPts.length; p++) {
    var pg = byPts[p];
    if (pg.length === 1) { result.push(pg); continue; }
    var resolved = resolveH2H(pg, stats);
    for (var r = 0; r < resolved.length; r++) result.push(resolved[r]);
  }
  return result;
}

function resolveH2H(tied, stats) {
  if (tied.length === 1) return [tied];
  var h = getH2H(tied, stats);
  var byPts = groupByFn(tied, function(i) { return h[i].pts; }, true);
  if (byPts.length > 1) {
    var r = [];
    for (var i = 0; i < byPts.length; i++) {
      var sg = byPts[i];
      if (sg.length === 1) r.push(sg);
      else if (sg.length < tied.length) { var sub = resolveH2H(sg, stats); for (var j = 0; j < sub.length; j++) r.push(sub[j]); }
      else { var sub2 = resolveH2HGD(sg, stats, h); for (var j = 0; j < sub2.length; j++) r.push(sub2[j]); }
    }
    return r;
  }
  return resolveH2HGD(tied, stats, h);
}

function resolveH2HGD(tied, stats, h) {
  var by = groupByFn(tied, function(i) { return h[i].gd; }, true);
  if (by.length > 1) {
    var r = [];
    for (var i = 0; i < by.length; i++) {
      var sg = by[i];
      if (sg.length === 1) r.push(sg);
      else if (sg.length < tied.length) { var sub = resolveH2H(sg, stats); for (var j = 0; j < sub.length; j++) r.push(sub[j]); }
      else { var sub2 = resolveH2HGF(sg, stats, h); for (var j = 0; j < sub2.length; j++) r.push(sub2[j]); }
    }
    return r;
  }
  return resolveH2HGF(tied, stats, h);
}

function resolveH2HGF(tied, stats, h) {
  var by = groupByFn(tied, function(i) { return h[i].gf; }, true);
  if (by.length > 1) {
    var r = [];
    for (var i = 0; i < by.length; i++) {
      var sg = by[i];
      if (sg.length === 1) r.push(sg);
      else if (sg.length < tied.length) { var sub = resolveH2H(sg, stats); for (var j = 0; j < sub.length; j++) r.push(sub[j]); }
      else { var sub2 = resolveOverallGD(sg, stats); for (var j = 0; j < sub2.length; j++) r.push(sub2[j]); }
    }
    return r;
  }
  return resolveOverallGD(tied, stats);
}

function resolveOverallGD(tied, stats) {
  var by = groupByFn(tied, function(i) { return stats[i].gd; }, true);
  if (by.length > 1) {
    var r = [];
    for (var i = 0; i < by.length; i++) {
      var sg = by[i];
      if (sg.length === 1) r.push(sg);
      else { var sub = resolveOverallGF(sg, stats); for (var j = 0; j < sub.length; j++) r.push(sub[j]); }
    }
    return r;
  }
  return resolveOverallGF(tied, stats);
}

function resolveOverallGF(tied, stats) {
  var by = groupByFn(tied, function(i) { return stats[i].gf; }, true);
  if (by.length > 1) {
    var r = [];
    for (var i = 0; i < by.length; i++) {
      var sg = by[i];
      if (sg.length === 1) r.push(sg);
      else { var sub = resolveConduct(sg, stats); for (var j = 0; j < sub.length; j++) r.push(sub[j]); }
    }
    return r;
  }
  return resolveConduct(tied, stats);
}

function resolveConduct(tied, stats) {
  var by = groupByFn(tied, function(i) { return stats[i].conduct; }, false);
  if (by.length > 1) {
    var r = [];
    for (var i = 0; i < by.length; i++) {
      var sg = by[i];
      if (sg.length === 1) r.push(sg);
      else { var sub = resolveFIFA(sg, stats); for (var j = 0; j < sub.length; j++) r.push(sub[j]); }
    }
    return r;
  }
  return resolveFIFA(tied, stats);
}

function resolveFIFA(tied, stats) {
  var sorted = tied.slice().sort(function(a, b) { return stats[a].fifaRank - stats[b].fifaRank; });
  return sorted.map(function(i) { return [i]; });
}

function groupByFn(arr, keyFn, descending) {
  var map = new Map();
  for (var i = 0; i < arr.length; i++) {
    var k = keyFn(arr[i]);
    if (!map.has(k)) map.set(k, []);
    map.get(k).push(arr[i]);
  }
  var keys = Array.from(map.keys()).sort(function(a, b) { return descending ? b - a : a - b; });
  return keys.map(function(k) { return map.get(k); });
}

// ============================================================
// STAT COMPARISON (for best/worst selection in simulation)
// Uses normalized GD/GF (±∞ past threshold) to match the
// actual 3rd-place ranking comparator. Falls through to raw
// values only when both sides saturate at the same infinity.
// ============================================================

var INF_THRESHOLD = 40;

function cmpStatNormalized(a, b) {
  // Points: higher = better
  if (a.pts !== b.pts) return a.pts - b.pts;

  // Normalized GD
  var agd = a.gd > INF_THRESHOLD ? Infinity : a.gd < -INF_THRESHOLD ? -Infinity : a.gd;
  var bgd = b.gd > INF_THRESHOLD ? Infinity : b.gd < -INF_THRESHOLD ? -Infinity : b.gd;
  if (!(agd === Infinity && bgd === Infinity) && !(agd === -Infinity && bgd === -Infinity)) {
    if (agd !== bgd) {
      if (agd === Infinity) return 1;
      if (bgd === Infinity) return -1;
      if (agd === -Infinity) return -1;
      if (bgd === -Infinity) return 1;
      return agd - bgd;
    }
  }
  // Both GD saturated at same ∞ — compare normalized GF

  var agf = a.gf > INF_THRESHOLD ? Infinity : a.gf < -INF_THRESHOLD ? -Infinity : a.gf;
  var bgf = b.gf > INF_THRESHOLD ? Infinity : b.gf < -INF_THRESHOLD ? -Infinity : b.gf;
  if (!(agf === Infinity && bgf === Infinity) && !(agf === -Infinity && bgf === -Infinity)) {
    if (agf !== bgf) {
      if (agf === Infinity) return 1;
      if (bgf === Infinity) return -1;
      if (agf === -Infinity) return -1;
      if (bgf === -Infinity) return 1;
      return agf - bgf;
    }
  }

  // Conduct: lower = better
  if (a.conduct !== b.conduct) return b.conduct - a.conduct;
  // FIFA ranking: lower = better
  if (a.fifaRank !== b.fifaRank) return b.fifaRank - a.fifaRank;
  return 0;
}
