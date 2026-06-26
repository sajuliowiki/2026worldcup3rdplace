// app.js — FIFA 2026 3rd Place Tracker UI Logic (v5.0)
// Data and standings engine loaded from standings.js (shared with worker.js)

var SCHED = MATCH_SCHEDULE; // alias for UI code
var SLOT_NAMES={'1A':'Mexico','1B':'Canada','1D':'United States','1E':'Germany','1G':'Belgium','1I':'France','1K':'Portugal','1L':'England'};
var SLOTS=['1A','1B','1D','1E','1G','1I','1K','1L'];
var POS_LABEL={1:'1st',2:'2nd',3:'3rd',4:'4th'};

// ========== BUILD GROUP INPUTS ==========
function buildGroups(){
  const g=document.getElementById('gg');let html='';
  for(const gr of GROUPS){
    const t=TEAMS[gr];
    html+=`<div class="gp" id="p_${gr}"><div class="gh"><h3>Group ${gr}</h3><span class="sb" id="b_${gr}"></span></div>`;
    html+=`<table class="mtbl">`;
    for(let md=1;md<=3;md++){
      html+=`<tr><td colspan="8" class="ml">Matchday ${md}</td></tr>`;
      SCHED[md].forEach((m,mi)=>{
        const id=`${gr}_${md}_${mi}`;
        html+=`<tr>
          <td class="tn th" title="${t[m[0]].name}">${t[m[0]].flag} ${t[m[0]].name}</td>
          <td><input type="number" class="si" id="hg_${id}" min="0" max="99" placeholder="–" oninput="updateStandings('${gr}')"></td>
          <td class="sp">–</td>
          <td><input type="number" class="si" id="ag_${id}" min="0" max="99" placeholder="–" oninput="updateStandings('${gr}')"></td>
          <td class="tn" title="${t[m[1]].name}">${t[m[1]].flag} ${t[m[1]].name}</td>
          <td><span class="yc" title="Conduct points"><svg width="8" height="11" viewBox="0 0 8 11" style="display:block"><polygon points="0,0 8,0 8,11 0,11" fill="#ef4444"/><polygon points="0,0 8,0 0,11" fill="#eab308"/></svg></span></td>
          <td><input type="number" class="ci" id="hc_${id}" min="0" max="99" value="0" oninput="updateStandings('${gr}')"></td>
          <td><input type="number" class="ci" id="ac_${id}" min="0" max="99" value="0" oninput="updateStandings('${gr}')"></td>
        </tr>`;
      });
    }
    html+=`</table>`;
    html+=`<div id="st_${gr}" class="standings-box"></div><div class="cb" id="c_${gr}"></div></div>`;
  }
  g.innerHTML=html;
}
buildGroups();

// ========== LIVE STANDINGS PREVIEW ==========
function getGroupMatches(gr){
  const matches=[];
  for(let md=1;md<=3;md++){SCHED[md].forEach((m,mi)=>{
    const id=`${gr}_${md}_${mi}`,hg=document.getElementById('hg_'+id).value,ag=document.getElementById('ag_'+id).value;
    if(hg!==''&&ag!==''){
      matches.push({home:m[0],away:m[1],hg:+hg,ag:+ag,hc:+(document.getElementById('hc_'+id).value)||0,ac:+(document.getElementById('ac_'+id).value)||0});
    }
  });}
  return matches;
}

// Format a team's possible finishing positions for the group table.
// One position  -> "1st ✓" (locked, green).  Several -> "2nd/3rd/4th" (amber).
function formatPositions(arr){
  if(!arr||!arr.length)return null;
  const sorted=[...arr].sort((a,b)=>a-b);
  if(sorted.length===1)return{text:POS_LABEL[sorted[0]]+' \u2713',locked:true};
  return{text:sorted.map(p=>POS_LABEL[p]).join('/'),locked:false};
}

// Render one group's standings table. Includes the FIFA-ranking column
// always, and the (header-less) possible-positions column once an
// analysis has produced position data.
function renderGroupStandings(gr){
  const box=document.getElementById('st_'+gr),matches=getGroupMatches(gr);
  if(!matches.length){box.innerHTML='';return;}
  const stats=computeStats(gr,matches),ranking=rankGroup(stats);
  const rows=[];let pos=1;
  for(const grp of ranking){const isTied=grp.length>1;for(const idx of grp)rows.push({...stats[idx],dispPos:pos,tied:isTied});pos+=grp.length;}

  const positions=window._lastPositions?window._lastPositions[gr]:null;
  const showPos=!!positions;

  let h=`<table class="stbl"><tr><th>#</th><th>Team</th>${showPos?'<th></th>':''}<th>MP</th><th>Pts</th><th>GD</th><th>GF</th><th>GA</th><th title="Conduct">C</th><th title="FIFA ranking">FIFA</th></tr>`;
  for(const r of rows){
    const cls=r.dispPos===3?' class="r3rd"':'';
    let posCell='';
    if(showPos){
      const fp=formatPositions(positions[r.name]);
      if(fp){const col=fp.locked?'var(--grn)':'var(--amb)';posCell=`<td class="poscol" style="color:${col}">${fp.text}</td>`;}
      else posCell='<td class="poscol"></td>';
    }
    h+=`<tr${cls}><td>${r.dispPos}${r.tied?'*':''}</td><td class="stm">${r.flag} ${r.name}</td>${posCell}<td>${r.mp}</td><td><strong>${r.pts}</strong></td><td>${r.gd>=0?'+':''}${r.gd}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.conduct}</td><td>${r.fifaRank}</td></tr>`;
  }
  h+='</table>';
  if(rows.some(r=>r.tied))h+='<div class="stie">* = tied through current tiebreaker stage</div>';
  box.innerHTML=h;
}

// Input handler: any edit invalidates the previous analysis, re-renders
// all group standings (dropping stale position columns), and refreshes
// the live 3rd-place ranking section.
function updateStandings(gr){
  invalidateAnalysis();
  for(const g of GROUPS)renderGroupStandings(g);
  renderLive3rdPlace();
}

// Clear everything derived from a previous analysis run.
function invalidateAnalysis(){
  window._lastAnalysis=null;window._lastPositions=null;window._secured=null;
  const res=document.getElementById('res');res.classList.remove('analyzed');
  GROUPS.forEach(g=>{
    const b=document.getElementById('b_'+g);if(b)b.style.display='none';
    const c=document.getElementById('c_'+g);if(c)c.style.display='none';
  });
  ['wikiCombos','wikiBoxes','wikiBracket'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
}

// ========== LIVE 3RD-PLACE SECTION (generated without running analysis) ==========
function liveCompleteness(){
  const comp={};
  for(const g of GROUPS){
    let all=true;
    for(let md=1;md<=3;md++)SCHED[md].forEach((m,mi)=>{
      const id=`${g}_${md}_${mi}`;
      if(document.getElementById('hg_'+id).value===''||document.getElementById('ag_'+id).value==='')all=false;
    });
    comp[g]=all;
  }
  return comp;
}

function renderLive3rdPlace(){
  const anyData=GROUPS.some(g=>getGroupMatches(g).length>0);
  const res=document.getElementById('res');
  if(!anyData){res.style.display='none';return;}
  res.style.display='block';

  if(typeof computeStandingsCache!=='function')return; // wiki.js not ready
  const analysis=window._lastAnalysis;
  const groupStatus=analysis?analysis.groupStatus:null;
  const completeness=liveCompleteness();
  const standingsCache=computeStandingsCache(completeness);

  // Live ranking table (status column only filled once analysis has run)
  const {html}=buildLive3rdPlaceTable(standingsCache,groupStatus,completeness);
  let extra='';
  if(analysis&&analysis.candidates)extra=buildBestWorstSummary(analysis.candidates,analysis.mode);
  document.getElementById('live3rdPlace').innerHTML=html+extra;

  // Third-place wikitext can also be produced live (status blank pre-analysis)
  try{document.getElementById('wikiThirdPlace').value=generateThirdPlaceTableWiki(standingsCache,completeness,groupStatus);}catch(e){}
}

// ========== LOCK TOGGLE ==========
function applyLock(){
  const lk=document.getElementById('lock').checked;
  for(const gr of GROUPS)for(let md=1;md<=2;md++)SCHED[md].forEach((_,mi)=>{
    const id=`${gr}_${md}_${mi}`;
    ['hg_','ag_','hc_','ac_'].forEach(p=>{const el=document.getElementById(p+id);if(el)el.disabled=lk;});
  });
}
document.getElementById('lock').addEventListener('change',applyLock);
function clearAll(){
  document.querySelectorAll('.si').forEach(el=>{el.value='';el.disabled=false;});
  document.querySelectorAll('.ci').forEach(el=>{el.value='0';el.disabled=false;});
  document.getElementById('lock').checked=false;
  window._groupCache={};
  invalidateAnalysis();
  document.getElementById('res').style.display='none';
  GROUPS.forEach(g=>{document.getElementById('b_'+g).style.display='none';document.getElementById('c_'+g).style.display='none';document.getElementById('st_'+g).innerHTML='';});
}

// ========== GATHER DATA ==========
function gather(){
  const data={},comp={};
  for(const gr of GROUPS){const matches=[];let allOk=true;
    for(let md=1;md<=3;md++)SCHED[md].forEach((m,mi)=>{
      const id=`${gr}_${md}_${mi}`,hg=document.getElementById('hg_'+id).value,ag=document.getElementById('ag_'+id).value;
      if(hg!==''&&ag!=='')matches.push({home:m[0],away:m[1],hg:+hg,ag:+ag,hc:+(document.getElementById('hc_'+id).value)||0,ac:+(document.getElementById('ac_'+id).value)||0});
      else allOk=false;
    });
    data[gr]=matches;comp[gr]=allOk;}
  return{matchData:data,completeness:comp};
}

// Has ANY group had a result entered for the given matchday?
function matchdayHasData(md){
  for(const g of GROUPS)for(let mi=0;mi<SCHED[md].length;mi++){
    const id=`${g}_${md}_${mi}`;
    if(document.getElementById('hg_'+id).value!==''&&document.getElementById('ag_'+id).value!=='')return true;
  }
  return false;
}

function getMode(){
  const el=document.querySelector('input[name="simMode"]:checked');
  return el?el.value:'regular';
}

// ========== RUN ANALYSIS ==========
let worker=null;
function run(){
  const mode=getMode();
  const{matchData,completeness}=gather();
  const anyMD2=matchdayHasData(2),anyMD3=matchdayHasData(3);

  if(!anyMD2&&!anyMD3){
    alert('Enter at least Matchday 2 results before running an analysis.\n\nWith only Matchday 1 played, nothing can be determined yet.');
    return;
  }
  if(mode==='regular'&&!anyMD3){
    alert('Full-scoreline mode needs at least one Matchday 3 result.\n\nWith only Matchdays 1 & 2 entered, switch to "Win/Draw/Loss (fast)" mode — it can still show which teams have mathematically advanced.');
    return;
  }

  document.getElementById('runBtn').disabled=true;
  document.getElementById('prog').style.display='block';
  if(worker)worker.terminate();
  worker=new Worker('worker.js');

  // Reuse cached per-group results for groups whose data (and mode) is unchanged,
  // so finished groups aren't re-simulated on every run.
  const cached={};
  for(const g of GROUPS){
    const key=cacheKeyFor(g,mode);
    if(window._groupCache && window._groupCache[key]) cached[g]=window._groupCache[key];
  }

  let cands=null;
  worker.onmessage=function(e){
    const d=e.data;
    if(d.type==='progress'){document.getElementById('pfill').style.width=(d.pct||0)+'%';document.getElementById('pmsg').textContent=d.msg||('Processing... '+(d.pct||0)+'%');}
    else if(d.type==='candidates')cands=d.data;
    else if(d.type==='result'){document.getElementById('runBtn').disabled=false;document.getElementById('prog').style.display='none';showResults(d.data,cands,completeness);}
  };
  worker.onerror=function(err){console.error(err);document.getElementById('runBtn').disabled=false;document.getElementById('pmsg').textContent='Error: '+err.message;};
  worker.postMessage({type:'analyze',data:{matchData,completeness,mode,cached}});
}

// ========== PER-GROUP RESULT CACHE ==========
// Per-group simulation depends only on that group's match data and the mode,
// so we cache it. A finished (or MD2-only) group keeps the same result run
// after run until its own scores change, avoiding a fresh 1M-scoreline sim.
window._groupCache = window._groupCache || {};

function groupSignature(gr){
  const parts=[];
  for(let md=1;md<=3;md++)SCHED[md].forEach((m,mi)=>{
    const id=`${gr}_${md}_${mi}`;
    const hg=document.getElementById('hg_'+id).value,ag=document.getElementById('ag_'+id).value;
    if(hg!==''&&ag!==''){
      const hc=document.getElementById('hc_'+id).value||'0',ac=document.getElementById('ac_'+id).value||'0';
      parts.push(`${md}.${mi}:${hg}-${ag}/${hc}-${ac}`);
    }
  });
  return parts.join(';');
}
function cacheKeyFor(gr,mode){ return `${mode}|${gr}|${groupSignature(gr)}`; }

// ========== SECURED POSITIONS ==========
// A position in a group is "secured" when exactly one team can ONLY
// finish there (its set of possible positions is the singleton {p}).
function computeSecured(groupPositions){
  const sec={};
  for(const g of GROUPS){
    sec[g]={};
    const pos=groupPositions[g]||{};
    for(let p=1;p<=4;p++){
      const locked=Object.keys(pos).filter(nm=>{const a=pos[nm];return a&&a.length===1&&a[0]===p;});
      if(locked.length===1)sec[g][p]=locked[0];
    }
  }
  return sec;
}

// ========== DISPLAY RESULTS ==========
function showResults(analysis,candidates,completeness){
  const{possibleCombos,groupStatus,teamStatus,groupPositions,mode}=analysis;
  const pSet=new Set(possibleCombos);
  const isWDL=mode==='wdl';

  window._lastPositions=groupPositions;
  window._secured=computeSecured(groupPositions);
  window._lastAnalysis={possibleCombos,groupStatus,teamStatus,completeness,candidates,groupPositions,mode};

  // Cache each group's per-group result so unchanged groups skip re-simulation next run.
  if(candidates){
    for(const g of GROUPS){
      if(candidates[g]&&groupPositions[g]) window._groupCache[cacheKeyFor(g,mode)]={candidates:candidates[g],positions:groupPositions[g]};
    }
  }

  const res=document.getElementById('res');
  res.style.display='block';
  res.classList.add('analyzed');

  for(const g of GROUPS){
    const badge=document.getElementById('b_'+g),st=groupStatus[g];
    badge.style.display='inline-block';
    badge.className='sb '+(st==='GUARANTEED_TOP8'?'s8':st==='GUARANTEED_BOTTOM4'?'s4':'st');
    badge.textContent=st==='GUARANTEED_TOP8'?'\u2713 TOP 8':st==='GUARANTEED_BOTTOM4'?'\u2717 BOTTOM 4':'? TBD';

    const box=document.getElementById('c_'+g),gc=candidates[g];
    if(gc&&gc.length){
      box.style.display='block';const ic=completeness[g];
      const fgd=v=>v>40?'\u221e':v<-40?'-\u221e':(v>=0?'+':'')+v,fgf=v=>v>40?'\u221e':''+v,fc=v=>v>40?'\u221e':''+v;
      let h=`<div class="ct">${ic?'3rd Place Team':'Possible 3rd Place Finishers'}</div>`;
      for(const c of gc){
        const ts=teamStatus[c.name]||'TBD',tcol=ts==='GUARANTEED_TOP8'?'var(--grn)':ts==='GUARANTEED_BOTTOM4'?'var(--red)':'var(--amb)',tlab=ts==='GUARANTEED_TOP8'?'\u2713 ADVANCED':ts==='GUARANTEED_BOTTOM4'?'\u2717 ELIMINATED':'? TBD';
        h+=`<div class="cd"><div class="ch"><span class="cn">${c.flag} ${c.name} <span style="color:var(--t3);font-weight:400">(FIFA ranking: ${c.fifaRank})</span></span>`;
        h+=`<span class="cs" style="color:${tcol}">${tlab}</span>`;
        h+=`</div><div class="cv">`;
        if(isWDL){
          h+=`Best: ${c.best.pts}p`;
          if(c.best.pts!==c.worst.pts)h+=` | Worst: ${c.worst.pts}p`;
        }else{
          h+=`Best: ${c.best.pts}p ${fgd(c.best.gd)}gd ${fgf(c.best.gf)}gf ${fc(c.best.conduct)}c`;
          if(!ic)h+=` | Worst: ${c.worst.pts}p ${fgd(c.worst.gd)}gd ${fgf(c.worst.gf)}gf ${fc(c.worst.conduct)}c`;
        }
        h+=`</div></div>`;
      }
      box.innerHTML=h;
    }else box.style.display='none';
  }

  document.getElementById('sgrid').innerHTML=GROUPS.map(g=>{
    const st=groupStatus[g],col=st==='GUARANTEED_TOP8'?'var(--grn)':st==='GUARANTEED_BOTTOM4'?'var(--red)':'var(--amb)',lab=st==='GUARANTEED_TOP8'?'\u2713 Top 8':st==='GUARANTEED_BOTTOM4'?'\u2717 Bottom 4':'? TBD';
    return`<div class="sc"><div class="sl">Group ${g}</div><div class="sv" style="color:${col}">${lab}</div></div>`;
  }).join('');

  // Re-render group standings so the possible-positions column appears
  GROUPS.forEach(renderGroupStandings);

  buildMatchups(pSet);buildMatrix(pSet);

  // Wiki + live 3rd-place + R32 pairings (full version, with status)
  if(typeof generateAllWiki==='function')try{generateAllWiki();}catch(e){console.error('Wiki generation:',e);}
}

// ========== MATCHUP TABLES ==========
function buildMatchups(pSet){
  const sec=window._secured||{};
  const winnerLabel=g=>(sec[g]&&sec[g][1])?` (${sec[g][1]})`:'';
  const thirdLabel=g=>(sec[g]&&sec[g][3])?` (${sec[g][3]})`:'';

  const fpOpps={},tpOpps={};SLOTS.forEach(s=>fpOpps[s]=new Set());
  if(typeof COMBO_MATRIX==='undefined'){document.getElementById('fp').innerHTML='<tr><td>Matrix data not loaded</td></tr>';return;}
  for(const combo of COMBO_MATRIX){if(pSet.has(combo.groups)){SLOTS.forEach(s=>{fpOpps[s].add(combo.matchups[s]);const tid=combo.matchups[s];if(!tpOpps[tid])tpOpps[tid]=new Set();tpOpps[tid].add(s);});}}

  let fh='<tr><th>1st Place Team</th><th>Possible 3rd Place Opponents</th></tr>';
  SLOTS.forEach(s=>{const opps=[...fpOpps[s]].sort();const g=s[1];fh+=`<tr><td style="font-weight:600">${s}${winnerLabel(g)}</td><td>${opps.map(o=>`<span class="oc">${o}${thirdLabel(o[1])}</span>`).join(' ')}</td></tr>`;});
  document.getElementById('fp').innerHTML=fh;

  let th='<tr><th>3rd Place Group</th><th>Possible 1st Place Opponents</th></tr>';
  for(const g of GROUPS){const tid='3'+g;if(!tpOpps[tid]||tpOpps[tid].size===0)continue;const opps=[...tpOpps[tid]].sort();
    th+=`<tr><td style="font-weight:600">${tid}${thirdLabel(g)}</td><td>${opps.map(o=>`<span class="oc">${o}${winnerLabel(o[1])}</span>`).join(' ')}</td></tr>`;}
  document.getElementById('tp').innerHTML=th;
}

// ========== MATRIX ==========
function togMx(){const w=document.getElementById('mxw'),a=document.getElementById('mxa');if(w.style.display==='none'){w.style.display='block';a.classList.add('op');}else{w.style.display='none';a.classList.remove('op');}}
function buildMatrix(pSet){
  if(typeof COMBO_MATRIX==='undefined')return;const w=document.getElementById('mxw');let count=0;
  let h='<table class="mx"><thead><tr><th class="rn">#</th>';GROUPS.forEach(g=>h+=`<th>${g}</th>`);
  h+='<th>1A</th><th>1B</th><th>1D</th><th>1E</th><th>1G</th><th>1I</th><th>1K</th><th>1L</th></tr></thead><tbody>';
  COMBO_MATRIX.forEach((combo,i)=>{const possible=pSet.has(combo.groups);if(possible)count++;
    h+=`<tr class="${possible?'rp':'ri'}"><td class="rn">${i+1}</td>`;
    GROUPS.forEach(g=>{const inC=combo.groupSet.has(g);h+=`<td style="color:${inC?(possible?'var(--grn)':'var(--t3)'):'var(--t3)'};font-weight:${inC?'700':'400'}">${inC?g:'\u00b7'}</td>`;});
    SLOTS.forEach(s=>h+=`<td style="font-size:8px">${combo.matchups[s]}</td>`);h+='</tr>';});
  h+='</tbody></table>';
  h=`<div style="margin-bottom:6px;font-size:12px;color:var(--t2)"><strong style="color:var(--grn)">${count}</strong> of 495 combinations still possible</div>`+h;
  w.innerHTML=h;
}

// ========== PANEL TOGGLES ==========
function togPanel(id){
  const body=document.getElementById(id+'_body');
  const arrow=document.getElementById(id+'_ar');
  if(body.classList.contains('open')){body.classList.remove('open');arrow.classList.remove('op');}
  else{body.classList.add('open');arrow.classList.add('op');}
}

// Show/hide the group-count row and relabel it based on mode
document.getElementById('rngMode').addEventListener('change',function(){
  const m=this.value;
  const show=(m==='md12plus'||m==='md1plus');
  document.getElementById('rngCountRow').style.display=show?'flex':'none';
  const lbl=document.getElementById('rngCountLabel');
  if(lbl)lbl.textContent=m==='md1plus'?'MD2 groups to fill':'MD3 groups to fill';
});

// ========== RANDOM SCORE GENERATOR ==========
function weightedRandomScore(){
  const weights=[20,18,14,10,6,3,2,1,1]; // indices 0-8
  const total=weights.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<weights.length;i++){r-=weights[i];if(r<=0)return i;}
  return 0;
}
function randomConduct(){
  const w=[30,25,20,12,6,3,2,1,1];
  const total=w.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i;}
  return 0;
}
function generateRandom(){
  const mode=document.getElementById('rngMode').value;

  // Special mode: fill ONLY Matchday 3 fixtures that are currently empty, and
  // leave everything else (including already-entered MD3 results) untouched.
  if(mode==='md3empty'){
    let filled=0;
    for(const gr of GROUPS){
      SCHED[3].forEach((_,mi)=>{
        const id=`${gr}_3_${mi}`;
        const hgEl=document.getElementById('hg_'+id),agEl=document.getElementById('ag_'+id),hcEl=document.getElementById('hc_'+id),acEl=document.getElementById('ac_'+id);
        if(hgEl.disabled)return;
        if(hgEl.value===''||agEl.value===''){hgEl.value=weightedRandomScore();agEl.value=weightedRandomScore();hcEl.value=randomConduct();acEl.value=randomConduct();filled++;}
      });
    }
    invalidateAnalysis();
    GROUPS.forEach(renderGroupStandings);
    renderLive3rdPlace();
    if(!filled)alert('No empty Matchday 3 fixtures to fill — every MD3 match already has a score.');
    return;
  }

  const countVal=Math.max(1,Math.min(12,parseInt(document.getElementById('rngCount').value)||4));
  const randomSubset=n=>new Set([...GROUPS].sort(()=>Math.random()-0.5).slice(0,n));

  // For each group, decide which matchdays to fill
  const fillMD={};GROUPS.forEach(g=>fillMD[g]=new Set());
  if(mode==='md1'){GROUPS.forEach(g=>fillMD[g].add(1));}
  else if(mode==='md1plus'){const md2g=randomSubset(countVal);GROUPS.forEach(g=>{fillMD[g].add(1);if(md2g.has(g))fillMD[g].add(2);});}
  else if(mode==='md12'){GROUPS.forEach(g=>{fillMD[g].add(1);fillMD[g].add(2);});}
  else if(mode==='md12plus'){const md3g=randomSubset(countVal);GROUPS.forEach(g=>{fillMD[g].add(1);fillMD[g].add(2);if(md3g.has(g))fillMD[g].add(3);});}
  else if(mode==='all'){GROUPS.forEach(g=>{fillMD[g].add(1);fillMD[g].add(2);fillMD[g].add(3);});}

  // Clear every unlocked box first, then fill the selected matchdays — so the
  // result reflects exactly the chosen scope (e.g. "MD1 only" leaves MD2/3 empty).
  for(const gr of GROUPS){
    for(let md=1;md<=3;md++){
      SCHED[md].forEach((_,mi)=>{
        const id=`${gr}_${md}_${mi}`;
        const hgEl=document.getElementById('hg_'+id),agEl=document.getElementById('ag_'+id),hcEl=document.getElementById('hc_'+id),acEl=document.getElementById('ac_'+id);
        if(hgEl.disabled)return; // locked MD1&2 untouched
        if(fillMD[gr].has(md)){hgEl.value=weightedRandomScore();agEl.value=weightedRandomScore();hcEl.value=randomConduct();acEl.value=randomConduct();}
        else{hgEl.value='';agEl.value='';hcEl.value='0';acEl.value='0';}
      });
    }
  }
  invalidateAnalysis();
  GROUPS.forEach(renderGroupStandings);
  renderLive3rdPlace();
}

// ========== EXPORT / IMPORT ==========
function exportData(){
  const data={};
  for(const gr of GROUPS){
    data[gr]={};
    for(let md=1;md<=3;md++){
      SCHED[md].forEach((_,mi)=>{
        const id=`${gr}_${md}_${mi}`;
        const hg=document.getElementById('hg_'+id).value,ag=document.getElementById('ag_'+id).value,hc=document.getElementById('hc_'+id).value,ac=document.getElementById('ac_'+id).value;
        if(hg!==''||ag!=='')data[gr][`md${md}_m${mi}`]={hg,ag,hc:hc||'0',ac:ac||'0'};
      });
    }
  }
  // Include precomputed per-group results for the current data so a re-run
  // (or a fresh load that imports this) skips simulation.
  const cache={};
  for(const gr of GROUPS)for(const mode of ['regular','wdl']){
    const key=cacheKeyFor(gr,mode);
    if(window._groupCache && window._groupCache[key])cache[key]=window._groupCache[key];
  }
  if(Object.keys(cache).length)data._cache=cache;
  document.getElementById('exportBox').value=JSON.stringify(data,null,2);
}
// Apply a data object (export/import JSON shape) to the input boxes.
function applyData(data){
  if(data && data._cache){ window._groupCache=window._groupCache||{}; Object.assign(window._groupCache, data._cache); }
  for(const gr of GROUPS){
    if(!data[gr])continue;
    for(let md=1;md<=3;md++){
      SCHED[md].forEach((_,mi)=>{
        const key=`md${md}_m${mi}`,id=`${gr}_${md}_${mi}`;
        if(data[gr][key]){
          const d=data[gr][key];
          const hgEl=document.getElementById('hg_'+id),agEl=document.getElementById('ag_'+id);
          if(!hgEl.disabled){hgEl.value=d.hg!==undefined?d.hg:'';agEl.value=d.ag!==undefined?d.ag:'';document.getElementById('hc_'+id).value=d.hc||'0';document.getElementById('ac_'+id).value=d.ac||'0';}
        }
      });
    }
  }
  invalidateAnalysis();
  GROUPS.forEach(renderGroupStandings);
  renderLive3rdPlace();
}
function importData(){
  const text=document.getElementById('exportBox').value.trim();
  if(!text){alert('Paste data into the text box first.');return;}
  let data;
  try{data=JSON.parse(text);}catch(e){alert('Invalid data format. Must be valid JSON.');return;}
  applyData(data);
}

// Pre-fill results from prefill.js (PREFILL_DATA), if present. Runs after all
// scripts have loaded so the live-render helpers in wiki.js are available.
// "Clear All" wipes these just like any other entered scores.
window.addEventListener('load',function(){
  try{
    if(typeof PREFILL_DATA!=='undefined' && PREFILL_DATA && Object.keys(PREFILL_DATA).length){
      applyData(PREFILL_DATA);
    }
  }catch(e){console.error('Prefill failed:',e);}
  // Apply the (default-ticked) MD1&2 lock AFTER prefill so prefilled MD1&2
  // scores still populate before those inputs are disabled.
  applyLock();
});
function downloadData(){
  exportData();
  const text=document.getElementById('exportBox').value;
  if(!text){alert('No data to download.');return;}
  const blob=new Blob([text],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');a.href=url;a.download='fifa2026_3rdplace_data.json';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}
