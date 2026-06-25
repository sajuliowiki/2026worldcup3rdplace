// wiki.js — Wikipedia Wikitext Generation for FIFA 2026 3rd Place Tracker (v4.0)
// v4.0: fills confirmed teams as soon as a group POSITION is secured
// (not only when every group match is played); FIFA-ranking column in
// the live 3rd-place table; mode-aware best/worst summary.

// =====================================================================
// FIFA 3-LETTER CODES
// =====================================================================
const FIFA_CODES={
  "Mexico":"MEX","South Africa":"RSA","South Korea":"KOR","Czech Republic":"CZE",
  "Canada":"CAN","Bosnia-Herzegovina":"BIH","Qatar":"QAT","Switzerland":"SUI",
  "Brazil":"BRA","Morocco":"MAR","Haiti":"HAI","Scotland":"SCO",
  "United States":"USA","Paraguay":"PAR","Australia":"AUS","Turkey":"TUR",
  "Germany":"GER","Curaçao":"CUW","Ivory Coast":"CIV","Ecuador":"ECU",
  "Netherlands":"NED","Japan":"JPN","Sweden":"SWE","Tunisia":"TUN",
  "Belgium":"BEL","Egypt":"EGY","Iran":"IRN","New Zealand":"NZL",
  "Spain":"ESP","Cape Verde":"CPV","Saudi Arabia":"KSA","Uruguay":"URU",
  "France":"FRA","Senegal":"SEN","Iraq":"IRQ","Norway":"NOR",
  "Argentina":"ARG","Algeria":"ALG","Austria":"AUT","Jordan":"JOR",
  "Portugal":"POR","DR Congo":"COD","Uzbekistan":"UZB","Colombia":"COL",
  "England":"ENG","Croatia":"CRO","Ghana":"GHA","Panama":"PAN"
};

// Secured-position map {group:{1:name,2:name,3:name,4:name}} set by the
// app before any wiki/R32 generation. Drives confirmed team fill-ins.
var _securedPos={};

// FIFA.com uses different display names than this app for some teams. Applied
// only inside the football-box reference titles when a team is confirmed.
const FIFA_TITLE_NAMES={
  "Iran":"IR Iran","South Korea":"Korea Republic","Cape Verde":"Cabo Verde",
  "DR Congo":"Congo DR","Ivory Coast":"Côte d'Ivoire","United States":"USA",
  "Czech Republic":"Czechia","Turkey":"Türkiye"
};
function fifaTitleName(name){return FIFA_TITLE_NAMES[name]||name;}

// ========== STANDINGS CACHE ==========
function computeStandingsCache(completeness) {
  const cache = {};
  for (const g of GROUPS) {
    const matches = getGroupMatches(g);
    if (matches.length === 0) continue;
    const stats = computeStats(g, matches);
    const ranking = rankGroup(stats);
    const ordered = [];
    let pos = 0;
    for (const grp of ranking) {
      for (const idx of grp) {
        pos++;
        let w=0,d=0,l=0;
        for (const m of matches) {
          if (m.home===idx) { if(m.hg>m.ag)w++; else if(m.hg===m.ag)d++; else l++; }
          else if (m.away===idx) { if(m.ag>m.hg)w++; else if(m.ag===m.hg)d++; else l++; }
        }
        ordered.push({...stats[idx], groupPos:pos, confirmed:completeness[g], w, d, l});
      }
    }
    cache[g] = ordered;
  }
  return cache;
}

function getSlotPossible(pSet) {
  const sp = {};
  SLOTS.forEach(s => sp[s] = new Set());
  for (const combo of COMBO_MATRIX) {
    if (pSet.has(combo.groups)) {
      SLOTS.forEach(s => sp[s].add(combo.matchups[s]));
    }
  }
  return sp;
}

// Resolve a fixture slot to a confirmed team (when its group position is
// secured) or a placeholder. Confirmation no longer requires the whole
// group to be finished — only that the relevant position is mathematically
// locked, and (for 3rd) that the slot has a single possible group.
function resolveTeamWiki(desc, slot, slotPossible, standingsCache, completeness, forTeam2) {
  const fbTag = forTeam2 ? 'fb' : 'fb-rt';
  const sec = _securedPos || {};

  function fill(name) {
    const code = FIFA_CODES[name] || 'CODE';
    return {wiki:`{{#invoke:flag|${fbTag}|${code}}}`, plain:name, confirmed:true};
  }

  if (desc === '3rd') {
    const possible = slotPossible[slot] ? [...slotPossible[slot]].sort() : [];
    if (possible.length === 1) {
      const grpLetter = possible[0].replace('3','');
      const secName = sec[grpLetter] ? sec[grpLetter][3] : null;
      if (secName) return fill(secName); // 3rd secured AND only one possible fixture
    }
    const grps = possible.map(p=>p.replace('3','')).join('/');
    return {wiki:`<!--{{#invoke:flag|${fbTag}|}}-->3rd Group ${grps}`, plain:`3rd Group ${grps}`, confirmed:false};
  }

  const pos = parseInt(desc[0]), grp = desc[1];
  const posLabel = pos===1?'Winner':'Runner-up';
  const secName = sec[grp] ? sec[grp][pos] : null;
  if (secName) return fill(secName); // winner / runner-up secured
  return {wiki:`<!--{{#invoke:flag|${fbTag}|}}-->${posLabel} Group ${grp}`, plain:`${posLabel} Group ${grp}`, confirmed:false};
}

// ========== LIVE 3RD-PLACE STANDINGS TABLE ==========
function buildLive3rdPlaceTable(standingsCache, groupStatus, completeness) {
  const entries = [];
  for (const g of GROUPS) {
    const sc = standingsCache[g];
    if (!sc || sc.length < 3) {
      entries.push({group:g, name:'—', flag:'', code:'', w:0, d:0, l:0, gf:0, ga:0, gd:0, pts:0, conduct:0, fifaRank:999, status:groupStatus?groupStatus[g]:''});
      continue;
    }
    const t = sc[2];
    entries.push({group:g, name:t.name, flag:t.flag, code:FIFA_CODES[t.name]||'?', w:t.w, d:t.d, l:t.l, gf:t.gf, ga:t.ga, gd:t.gd, pts:t.pts, conduct:t.conduct, fifaRank:t.fifaRank, status:groupStatus?groupStatus[g]:''});
  }

  entries.sort((a,b) => {
    if (a.pts!==b.pts) return b.pts-a.pts;
    if (a.gd!==b.gd) return b.gd-a.gd;
    if (a.gf!==b.gf) return b.gf-a.gf;
    if (a.conduct!==b.conduct) return a.conduct-b.conduct;
    return a.fifaRank-b.fifaRank;
  });

  let h = '<table class="tpt"><tr><th>#</th><th>Grp</th><th>Team</th><th>MP</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>Pts</th><th title="Conduct">C</th><th title="FIFA ranking">FIFA</th><th>Status</th></tr>';
  entries.forEach((e, i) => {
    const mp = e.w + e.d + e.l;
    const st = e.status==='GUARANTEED_TOP8'?'\u2713 Advance':e.status==='GUARANTEED_BOTTOM4'?'\u2717 Eliminated':'';
    const stCol = e.status==='GUARANTEED_TOP8'?'var(--grn)':e.status==='GUARANTEED_BOTTOM4'?'var(--red)':'';
    const rowCls = i < 8 ? ' class="tpt-adv"' : '';
    h += `<tr${rowCls}><td>${i+1}</td><td>${e.group}</td><td class="stm">${e.flag} ${e.name}</td><td>${mp}</td><td>${e.w}</td><td>${e.d}</td><td>${e.l}</td><td>${e.gf}</td><td>${e.ga}</td><td>${e.gd>=0?'+':''}${e.gd}</td><td><strong>${e.pts}</strong></td><td>${e.conduct}</td><td>${e.fifaRank}</td><td style="color:${stCol};font-size:10px;font-weight:600">${st}</td></tr>`;
  });
  h += '</table>';
  return {html: h, sortedEntries: entries};
}

// ========== BEST/WORST SUMMARY (mode-aware) ==========
function buildBestWorstSummary(candidates, mode) {
  const isWDL = mode==='wdl';
  const fgd=v=>v>40?'\u221e':v<-40?'-\u221e':(v>=0?'+':'')+v;
  const fgf=v=>v>40?'\u221e':''+v;
  const fc=v=>v>40?'\u221e':''+v;
  const fmt=s=> isWDL ? `${s.pts}p` : `${s.pts}p ${fgd(s.gd)}gd ${fgf(s.gf)}gf ${fc(s.conduct)}c`;

  let h='<div style="margin-top:10px"><table class="tpt"><tr><th>Grp</th><th>Best Result (if 3rd)</th><th>Team(s)</th><th>Worst Result (if 3rd)</th><th>Team(s)</th></tr>';
  for(const g of GROUPS){
    const gc=candidates?candidates[g]:null;
    if(!gc||gc.length===0){h+=`<tr><td>${g}</td><td colspan="4" style="color:var(--t3)">No data</td></tr>`;continue;}
    let bestStat=null,worstStat=null;
    for(const c of gc){
      if(!bestStat||cmpStatBW(c.best,bestStat)>0)bestStat=c.best;
      if(!worstStat||cmpStatBW(c.worst,worstStat)<0)worstStat=c.worst;
    }
    const sameBest=c=> c.best.pts===bestStat.pts && (isWDL || (c.best.gd===bestStat.gd && c.best.gf===bestStat.gf));
    const sameWorst=c=> c.worst.pts===worstStat.pts && (isWDL || (c.worst.gd===worstStat.gd && c.worst.gf===worstStat.gf));
    const bestTeams=gc.filter(sameBest).map(c=>`${c.flag} ${c.name}`);
    const worstTeams=gc.filter(sameWorst).map(c=>`${c.flag} ${c.name}`);
    h+=`<tr><td>${g}</td><td style="font-family:'JetBrains Mono',monospace;font-size:10px">${fmt(bestStat)}</td><td class="stm" style="font-size:10px">${bestTeams.join(', ')}</td><td style="font-family:'JetBrains Mono',monospace;font-size:10px">${fmt(worstStat)}</td><td class="stm" style="font-size:10px">${worstTeams.join(', ')}</td></tr>`;
  }
  h+='</table></div>';
  return h;
}

// ========== LIVE R32 PAIRINGS ==========
function buildR32Pairings(pSet, standingsCache, completeness) {
  if (typeof COMBO_MATRIX==='undefined'||!pSet) return '';
  const sp = getSlotPossible(pSet);
  const R32 = [
    {num:73,t1:"2A",t2:"2B",date:"June 28",city:"Inglewood"},
    {num:76,t1:"1C",t2:"2F",date:"June 29",city:"Houston"},
    {num:74,t1:"1E",t2:"3rd",slot:"1E",date:"June 29",city:"Foxborough"},
    {num:75,t1:"1F",t2:"2C",date:"June 29",city:"Guadalupe"},
    {num:78,t1:"2E",t2:"2I",date:"June 30",city:"Arlington"},
    {num:77,t1:"1I",t2:"3rd",slot:"1I",date:"June 30",city:"East Rutherford"},
    {num:79,t1:"1A",t2:"3rd",slot:"1A",date:"June 30",city:"Mexico City"},
    {num:80,t1:"1L",t2:"3rd",slot:"1L",date:"July 1",city:"Atlanta"},
    {num:82,t1:"1G",t2:"3rd",slot:"1G",date:"July 1",city:"Seattle"},
    {num:81,t1:"1D",t2:"3rd",slot:"1D",date:"July 1",city:"Santa Clara"},
    {num:84,t1:"1H",t2:"2J",date:"July 2",city:"Inglewood"},
    {num:83,t1:"2K",t2:"2L",date:"July 2",city:"Toronto"},
    {num:85,t1:"1B",t2:"3rd",slot:"1B",date:"July 2",city:"Vancouver"},
    {num:88,t1:"2D",t2:"2G",date:"July 3",city:"Arlington"},
    {num:86,t1:"1J",t2:"2H",date:"July 3",city:"Miami Gardens"},
    {num:87,t1:"1K",t2:"3rd",slot:"1K",date:"July 3",city:"Kansas City"},
  ];
  let html='<div class="r32-grid">';
  for(const m of R32){
    const t1=resolveTeamWiki(m.t1,m.slot,sp,standingsCache,completeness,false);
    const t2=resolveTeamWiki(m.t2,m.slot,sp,standingsCache,completeness,true);
    html+=`<div class="r32-match"><div class="r32-header">M${m.num} · ${m.date} · ${m.city}</div><div class="r32-teams"><span class="r32-t${t1.confirmed?' r32-conf':''}">${t1.plain}</span><span class="r32-vs">vs</span><span class="r32-t${t2.confirmed?' r32-conf':''}" style="text-align:right">${t2.plain}</span></div></div>`;
  }
  return html+'</div>';
}

// ========== WIKITEXT: THIRD-PLACE TABLE ==========
function generateThirdPlaceTableWiki(standingsCache, completeness, groupStatus) {
  const today=new Date();
  const months=['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dateStr=months[today.getMonth()]+' '+today.getDate();

  const {sortedEntries} = buildLive3rdPlaceTable(standingsCache, groupStatus, completeness);
  const teamOrder = sortedEntries.map(e=>'Gr'+e.group).join(', ');

  const L=[];
  L.push('{{#invoke:Sports table|main|style=WDL|param1_valid=y');
  L.push('|class_rules=1) Points; 2) Goal difference; 3) Goals scored; 4) Team conduct score; 5) Latest [[FIFA Men\'s World Ranking|FIFA ranking]]; 6) Previous FIFA ranking(s).');
  L.push('|source=[https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/standings FIFA]');
  L.push('');
  L.push('<!--Update team positions below (check tiebreakers)-->');
  L.push('|team_order='+teamOrder);
  L.push('');
  L.push('<!--Update team results below (including date)-->');
  L.push('|update='+dateStr+', 2026');

  for(const g of GROUPS){
    const a='Gr'+g;
    const sc=standingsCache[g];
    let w=0,d=0,l=0,gf=0,ga=0,status='';
    if(sc&&sc.length>=3){const t=sc[2];w=t.w;d=t.d;l=t.l;gf=t.gf;ga=t.ga;}
    if(groupStatus){
      if(groupStatus[g]==='GUARANTEED_TOP8')status='A';
      else if(groupStatus[g]==='GUARANTEED_BOTTOM4')status='E';
    }
    L.push(`|win_${a}=${w} |draw_${a}=${d} |loss_${a}=${l} |gf_${a}=${gf} |ga_${a}=${ga} |status_${a}=${status}`);
  }
  L.push('');
  L.push('<!--Team definitions-->');
  for(const g of GROUPS){
    const sc=standingsCache[g];
    const code=(sc&&sc.length>=3)?FIFA_CODES[sc[2].name]||'CODE':'CODE';
    L.push(`|name_Gr${g}={{#invoke:flag|fb|${code}}}`);
  }
  L.push('');
  L.push('<!--Group definitions-->');
  L.push('|show_groups=T');
  for(const g of GROUPS)L.push(`|group_Gr${g}=[[2026 FIFA World Cup#Group ${g}|${g}]]`);
  L.push('');
  L.push('<!--Qualification column definitions-->');
  L.push('|res_col_header=Q');
  L.push('|result1=KO |result2=KO |result3=KO |result4=KO |result5=KO |result6=KO |result7=KO |result8=KO');
  L.push('|col_KO=green1 |text_KO=Advance to {{#ifeq:{{PAGENAME}}|2026 FIFA World Cup|[[2026 FIFA World Cup#Knockout stage|knockout stage]]|[[2026 FIFA World Cup knockout stage|knockout stage]]}}');
  L.push('}}');
  return L.join('\n');
}

// ========== WIKITEXT: COMBINATIONS TABLE ==========
function generateCombosTableWiki(pSet) {
  if(typeof COMBO_MATRIX==='undefined')return'';
  let possCount=0;
  for(const c of COMBO_MATRIX)if(pSet.has(c.groups))possCount++;

  const legendInner = possCount===1
    ? 'Combination according to the eight qualified teams'
    : 'Combinations which are still possible<!--Combination according to the eight qualified teams-->';

  const L=[];
  L.push(`{{legend|#BBF3BB|${legendInner}}}`);
  L.push('{{sticky table start}}{{row hover highlight}}');
  L.push('{| class="wikitable mw-collapsible sortable sticky-table-head hover-highlight sort-under-center" style="text-align:center; white-space:nowrap;"');
  L.push('|+ Combinations of matches in the round of 32');
  L.push('|-');
  L.push('! scope="col" style="width:2em" | {{abbr|No.|Option number}}');
  L.push('! scope="col" style="width:2em" class="unsortable" colspan="12" | {{Navbar-header|Third-placed teams<br>advance from groups|Template:2026 FIFA World Cup third-place table}}');
  L.push('! scope="col" class="unsortable" |');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1A<br>vs');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1B<br>vs');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1D<br>vs');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1E<br>vs');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1G<br>vs');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1I<br>vs');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1K<br>vs');
  L.push('! scope="col" style="width:2em" class="unsortable" | 1L<br>vs');

  COMBO_MATRIX.forEach((combo, i) => {
    const possible = pSet.has(combo.groups);
    L.push(possible ? '|- style="background:#BBF3BB"' : '|-');
    L.push(`! scope="row" | ${i+1}`);
    const groupCells = GROUPS.map(g => combo.groupSet.has(g) ? `'''${g}'''` : '').join(' || ');
    const matchups = `${combo.matchups['1A']} || ${combo.matchups['1B']} || ${combo.matchups['1D']} || ${combo.matchups['1E']} || ${combo.matchups['1G']} || ${combo.matchups['1I']} || ${combo.matchups['1K']} || ${combo.matchups['1L']}`;
    if (i === 0) {
      L.push(`| ${groupCells}`.replace(/  +/g,' '));
      L.push('! rowspan="495" |');
      L.push(`| ${matchups}`);
    } else {
      L.push(`| ${groupCells} || ${matchups}`.replace(/  +/g,' '));
    }
  });

  L.push('|}');
  L.push('{{sticky table end}}<noinclude>');
  L.push('[[Category:2026 FIFA World Cup templates]]');
  L.push('</noinclude>');
  return L.join('\n');
}

// ========== WIKITEXT: FOOTBALL BOXES ==========
function generateFootballBoxesWiki(pSet, standingsCache, completeness) {
  if(typeof COMBO_MATRIX==='undefined')return'';
  const sp=getSlotPossible(pSet);

  // refId = FIFA.com match id; r3 = original 3rd-place placeholder for the
  // reference title (e.g. "3ABCDF"). The reference title is rebuilt below using
  // the confirmed team name (FIFA spelling) once a slot is locked.
  const matches=[
    {num:73,t1:"2A",t2:"2B",date:"6|28",time:'12:00&nbsp;p.m.',tz:'UTC−07:00|UTC−7',venue:'SoFi Stadium',city:'Inglewood, California|Inglewood',refId:'400021518'},
    {num:76,t1:"1C",t2:"2F",date:"6|29",time:'12:00&nbsp;p.m.',tz:'UTC−05:00|UTC−5',venue:'NRG Stadium',city:'Houston',refId:'400021516'},
    {num:74,t1:"1E",t2:"3rd",slot:"1E",r3:"3ABCDF",date:"6|29",time:'4:30&nbsp;p.m.',tz:'UTC−04:00|UTC−4',venue:'Gillette Stadium',city:'Foxborough, Massachusetts|Foxborough',refId:'400021513'},
    {num:75,t1:"1F",t2:"2C",date:"6|29",time:'7:00&nbsp;p.m.',tz:'UTC−06:00|UTC−6',venue:'Estadio BBVA',city:'Guadalupe, Nuevo León|Guadalupe',refId:'400021522'},
    {num:78,t1:"2E",t2:"2I",date:"6|30",time:'12:00&nbsp;p.m.',tz:'UTC−05:00|UTC−5',venue:'AT&T Stadium',city:'Arlington, Texas|Arlington',refId:'400021514'},
    {num:77,t1:"1I",t2:"3rd",slot:"1I",r3:"3CDFGH",date:"6|30",time:'5:00&nbsp;p.m.',tz:'UTC−04:00|UTC−4',venue:'MetLife Stadium',city:'East Rutherford, New Jersey|East Rutherford',refId:'400021523'},
    {num:79,t1:"1A",t2:"3rd",slot:"1A",r3:"3CEFHI",date:"6|30",time:'7:00&nbsp;p.m.',tz:'UTC−06:00|UTC−6',venue:'Estadio Azteca',city:'Mexico City',refId:'400021520'},
    {num:80,t1:"1L",t2:"3rd",slot:"1L",r3:"3EHIJK",date:"7|1",time:'12:00&nbsp;p.m.',tz:'UTC−04:00|UTC−4',venue:'Mercedes-Benz Stadium',city:'Atlanta',refId:'400021512'},
    {num:82,t1:"1G",t2:"3rd",slot:"1G",r3:"3AEHIJ",date:"7|1",time:'1:00&nbsp;p.m.',tz:'UTC−07:00|UTC−7',venue:'Lumen Field',city:'Seattle',refId:'400021525'},
    {num:81,t1:"1D",t2:"3rd",slot:"1D",r3:"3BEFIJ",date:"7|1",time:'5:00&nbsp;p.m.',tz:'UTC−07:00|UTC−7',venue:"Levi's Stadium",city:'Santa Clara, California|Santa Clara',refId:'400021524'},
    {num:84,t1:"1H",t2:"2J",date:"7|2",time:'12:00&nbsp;p.m.',tz:'UTC−07:00|UTC−7',venue:'SoFi Stadium',city:'Inglewood, California|Inglewood',refId:'400021519'},
    {num:83,t1:"2K",t2:"2L",date:"7|2",time:'7:00&nbsp;p.m.',tz:'UTC−04:00|UTC−4',venue:'BMO Field',city:'Toronto',refId:'400021526'},
    {num:85,t1:"1B",t2:"3rd",slot:"1B",r3:"3EFGIJ",date:"7|2",time:'8:00&nbsp;p.m.',tz:'UTC−07:00|UTC−7',venue:'BC Place',city:'Vancouver',refId:'400021527'},
    {num:88,t1:"2D",t2:"2G",date:"7|3",time:'1:00&nbsp;p.m.',tz:'UTC−05:00|UTC−5',venue:'AT&T Stadium',city:'Arlington, Texas|Arlington',refId:'400021515'},
    {num:86,t1:"1J",t2:"2H",date:"7|3",time:'6:00&nbsp;p.m.',tz:'UTC−04:00|UTC−4',venue:'Hard Rock Stadium',city:'Miami Gardens, Florida|Miami Gardens',refId:'400021521'},
    {num:87,t1:"1K",t2:"3rd",slot:"1K",r3:"3DEIJL",date:"7|3",time:'8:30&nbsp;p.m.',tz:'UTC−05:00|UTC−5',venue:'Arrowhead Stadium',city:'Kansas City, Missouri|Kansas City',refId:'400021517'},
  ];

  const REF_BASE='https://www.fifa.com/en/match-centre/match/17/285023/289287/';
  const L=[];
  L.push('==Matches==');
  L.push('');
  for(const m of matches){
    const r1=resolveTeamWiki(m.t1,m.slot,sp,standingsCache,completeness,false);
    const r2=resolveTeamWiki(m.t2,m.slot,sp,standingsCache,completeness,true);
    const heading=`${r1.plain} vs ${r2.plain}`;

    // Reference title: use the confirmed team's FIFA name, else the placeholder code.
    const t1code=m.t1;
    const t2code=(m.t2==='3rd')?m.r3:m.t2;
    const refName1=r1.confirmed?fifaTitleName(r1.plain):t1code;
    const refName2=r2.confirmed?fifaTitleName(r2.plain):t2code;
    const refTitle=`${refName1} vs ${refName2} {{!}} Round of 32 {{!}} FIFA World Cup 2026`;
    const report=`|report=<ref group="Report">[${REF_BASE}${m.refId} "${refTitle}"]. FIFA. Retrieved May 1, 2026.</ref>`;

    L.push(`===${heading}===`);
    L.push(`<section begin=R32-${matches.indexOf(m)+1} />{{#invoke:Football box|main`);
    L.push(`|date={{Start date|2026|${m.date}}}`);
    L.push(`|time=${m.time} [[${m.tz}]]`);
    L.push(`|team1=${r1.wiki}`);
    L.push(`|score={{score link|2026 FIFA World Cup round of 32#${heading}|Match ${m.num}}}`);
    L.push(`|team2=${r2.wiki}`);
    L.push('|goals1=');
    L.push('|goals2=');
    L.push(`|stadium=[[${m.venue}]], [[${m.city}]]`);
    L.push('|attendance=');
    L.push('|referee=');
    L.push(report);
    L.push(`}}<section end=R32-${matches.indexOf(m)+1} />`);
    L.push('');
  }
  return L.join('\n');
}

// ========== WIKITEXT: BRACKET ==========
function generateBracketWiki(pSet, standingsCache, completeness) {
  if(typeof COMBO_MATRIX==='undefined')return'';
  const sp=getSlotPossible(pSet);

  function res(desc,slot){
    return resolveTeamWiki(desc,slot,sp,standingsCache,completeness,false).wiki.replace(/fb-rt/g,'fb');
  }

  const r32=[
    {t1:"1E",t2:"3rd",slot:"1E",date:"June 29",city:"Foxborough, Massachusetts|Foxborough"},
    {t1:"1I",t2:"3rd",slot:"1I",date:"June 30",city:"East Rutherford, New Jersey|East Rutherford"},
    {t1:"2A",t2:"2B",date:"June 28",city:"Inglewood, California|Inglewood"},
    {t1:"1F",t2:"2C",date:"June 29",city:"Guadalupe, Nuevo León|Guadalupe"},
    {t1:"2K",t2:"2L",date:"July 2",city:"Toronto"},
    {t1:"1H",t2:"2J",date:"July 2",city:"Inglewood, California|Inglewood"},
    {t1:"1D",t2:"3rd",slot:"1D",date:"July 1",city:"Santa Clara, California|Santa Clara"},
    {t1:"1G",t2:"3rd",slot:"1G",date:"July 1",city:"Seattle"},
    {t1:"1C",t2:"2F",date:"June 29",city:"Houston"},
    {t1:"2E",t2:"2I",date:"June 30",city:"Arlington, Texas|Arlington"},
    {t1:"1A",t2:"3rd",slot:"1A",date:"June 30",city:"Mexico City"},
    {t1:"1L",t2:"3rd",slot:"1L",date:"July 1",city:"Atlanta"},
    {t1:"1J",t2:"2H",date:"July 3",city:"Miami Gardens, Florida|Miami Gardens"},
    {t1:"2D",t2:"2G",date:"July 3",city:"Arlington, Texas|Arlington"},
    {t1:"1B",t2:"3rd",slot:"1B",date:"July 2",city:"Vancouver"},
    {t1:"1K",t2:"3rd",slot:"1K",date:"July 3",city:"Kansas City, Missouri|Kansas City"},
  ];

  const L=[];
  L.push('==Bracket==');
  L.push('The tournament bracket is shown below, with bold denoting the winners of each match.');
  L.push('');
  L.push('<section begin=Bracket />{{#invoke:RoundN|N32');
  L.push('|style=white-space:nowrap|widescore=yes|bold_winner=high|3rdplace=yes');
  L.push('|RD1=[[#Round of 32|Round of 32]]');
  L.push('|RD2=[[#Round of 16|Round of 16]]');
  L.push('|RD3=[[#Quarterfinals|Quarterfinals]]');
  L.push('|RD4=[[#Semifinals|Semifinals]]');
  L.push('|RD5=[[#Final|Final]]');
  L.push('|Consol=[[#Match for third place|Match for third place]]');
  L.push('<!--Date – Place|Team 1|Score 1|Team 2|Score 2-->');
  L.push('<!--Round of 32-->');

  for(const m of r32){
    const t1w=res(m.t1,m.slot);
    const t2w=res(m.t2,m.slot);
    L.push(`|${m.date} – [[${m.city}]]|${t1w}||${t2w}|`);
  }

  L.push('<!--Round of 16-->');
  L.push('|July 4 – [[Philadelphia]]|<!--{{#invoke:flag|fb|}}-->Winner Match 74||<!--{{#invoke:flag|fb|}}-->Winner Match 77|');
  L.push('|July 4 – [[Houston]]|<!--{{#invoke:flag|fb|}}-->Winner Match 73||<!--{{#invoke:flag|fb|}}-->Winner Match 75|');
  L.push('|July 6 – [[Arlington, Texas|Arlington]]|<!--{{#invoke:flag|fb|}}-->Winner Match 83||<!--{{#invoke:flag|fb|}}-->Winner Match 84|');
  L.push('|July 6 – [[Seattle]]|<!--{{#invoke:flag|fb|}}-->Winner Match 81||<!--{{#invoke:flag|fb|}}-->Winner Match 82|');
  L.push('|July 5 – [[East Rutherford, New Jersey|East Rutherford]]|<!--{{#invoke:flag|fb|}}-->Winner Match 76||<!--{{#invoke:flag|fb|}}-->Winner Match 78|');
  L.push('|July 5 – [[Mexico City]]|<!--{{#invoke:flag|fb|}}-->Winner Match 79||<!--{{#invoke:flag|fb|}}-->Winner Match 80|');
  L.push('|July 7 – [[Atlanta]]|<!--{{#invoke:flag|fb|}}-->Winner Match 86||<!--{{#invoke:flag|fb|}}-->Winner Match 88|');
  L.push('|July 7 – [[Vancouver]]|<!--{{#invoke:flag|fb|}}-->Winner Match 85||<!--{{#invoke:flag|fb|}}-->Winner Match 87|');
  L.push('<!--Quarterfinals-->');
  L.push('|July 9 – [[Foxborough, Massachusetts|Foxborough]]|<!--{{#invoke:flag|fb|}}-->Winner Match 89||<!--{{#invoke:flag|fb|}}-->Winner Match 90|');
  L.push('|July 10 – [[Inglewood, California|Inglewood]]|<!--{{#invoke:flag|fb|}}-->Winner Match 93||<!--{{#invoke:flag|fb|}}-->Winner Match 94|');
  L.push('|July 11 – [[Miami Gardens, Florida|Miami Gardens]]|<!--{{#invoke:flag|fb|}}-->Winner Match 91||<!--{{#invoke:flag|fb|}}-->Winner Match 92|');
  L.push('|July 11 – [[Kansas City, Missouri|Kansas City]]|<!--{{#invoke:flag|fb|}}-->Winner Match 95||<!--{{#invoke:flag|fb|}}-->Winner Match 96|');
  L.push('<!--Semifinals-->');
  L.push('|July 14 – [[Arlington, Texas|Arlington]]|<!--{{#invoke:flag|fb|}}-->Winner Match 97||<!--{{#invoke:flag|fb|}}-->Winner Match 98|');
  L.push('|July 15 – [[Atlanta]]|<!--{{#invoke:flag|fb|}}-->Winner Match 99||<!--{{#invoke:flag|fb|}}-->Winner Match 100|');
  L.push('<!--Final-->');
  L.push('|July 19 – [[East Rutherford, New Jersey|East Rutherford]]|<!--{{#invoke:flag|fb|}}-->Winner Match 101||<!--{{#invoke:flag|fb|}}-->Winner Match 102|');
  L.push('<!--Match for third place-->');
  L.push('|July 18 – [[Miami Gardens, Florida|Miami Gardens]]|<!--{{#invoke:flag|fb|}}-->Loser Match 101||<!--{{#invoke:flag|fb|}}-->Loser Match 102|');
  L.push('}}<section end=Bracket />');
  return L.join('\n');
}

// ========== COPY BUTTON HELPER ==========
function copyWikiBox(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.select();
  el.setSelectionRange(0, 99999);
  navigator.clipboard.writeText(el.value).then(() => {
    const btn = el.previousElementSibling.querySelector('.copy-btn') || el.parentElement.querySelector('.copy-btn');
    if (btn) { const orig = btn.textContent; btn.textContent = '✓ Copied'; setTimeout(() => btn.textContent = orig, 1500); }
  });
}

// ========== MAIN EXPORT (post-analysis full render) ==========
function generateAllWiki() {
  if (!window._lastAnalysis) return;
  const {possibleCombos, groupStatus, completeness, candidates, mode} = window._lastAnalysis;
  const pSet = new Set(possibleCombos);
  _securedPos = window._secured || {};
  const standingsCache = computeStandingsCache(completeness);

  const {html: tptHtml} = buildLive3rdPlaceTable(standingsCache, groupStatus, completeness);
  const bwHtml = buildBestWorstSummary(candidates, mode);
  document.getElementById('live3rdPlace').innerHTML = tptHtml + bwHtml;

  document.getElementById('r32pairings').innerHTML = buildR32Pairings(pSet, standingsCache, completeness);

  document.getElementById('wikiThirdPlace').value = generateThirdPlaceTableWiki(standingsCache, completeness, groupStatus);
  document.getElementById('wikiCombos').value = generateCombosTableWiki(pSet);
  document.getElementById('wikiBoxes').value = generateFootballBoxesWiki(pSet, standingsCache, completeness);
  document.getElementById('wikiBracket').value = generateBracketWiki(pSet, standingsCache, completeness);
}

// Compare stat for best/worst (higher = better)
function cmpStatBW(a,b){
  if(a.pts!==b.pts)return a.pts-b.pts;
  if(a.gd!==b.gd)return a.gd-b.gd;
  if(a.gf!==b.gf)return a.gf-b.gf;
  if(a.conduct!==b.conduct)return b.conduct-a.conduct;
  if(a.fifaRank!==b.fifaRank)return b.fifaRank-a.fifaRank;
  return 0;
}
