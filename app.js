// app.js — FIFA 2026 3rd Place Tracker UI Logic
// Data and standings engine loaded from standings.js (shared with worker.js)

var SCHED = MATCH_SCHEDULE; // alias for UI code
var SLOT_NAMES={'1A':'Mexico','1B':'Canada','1D':'United States','1E':'Germany','1G':'Belgium','1I':'France','1K':'Portugal','1L':'England'};
var SLOTS=['1A','1B','1D','1E','1G','1I','1K','1L'];

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

function updateStandings(gr){
  const box=document.getElementById('st_'+gr),matches=getGroupMatches(gr);
  if(!matches.length){box.innerHTML='';return;}
  const stats=computeStats(gr,matches),ranking=rankGroup(stats);
  const rows=[];let pos=1;
  for(const grp of ranking){const isTied=grp.length>1;for(const idx of grp)rows.push({...stats[idx],dispPos:pos,tied:isTied});pos+=grp.length;}

  let h=`<table class="stbl"><tr><th>#</th><th>Team</th><th>MP</th><th>Pts</th><th>GD</th><th>GF</th><th>GA</th><th title="Conduct">C</th></tr>`;
  for(const r of rows){
    const cls=r.dispPos===3?' class="r3rd"':'';
    h+=`<tr${cls}><td>${r.dispPos}${r.tied?'*':''}</td><td class="stm">${r.flag} ${r.name}</td><td>${r.mp}</td><td><strong>${r.pts}</strong></td><td>${r.gd>=0?'+':''}${r.gd}</td><td>${r.gf}</td><td>${r.ga}</td><td>${r.conduct}</td></tr>`;
  }
  h+='</table>';
  if(rows.some(r=>r.tied))h+='<div class="stie">* = tied through current tiebreaker stage</div>';
  box.innerHTML=h;
}

// ========== LOCK TOGGLE ==========
document.getElementById('lock').addEventListener('change',function(){
  const lk=this.checked;
  for(const gr of GROUPS)for(let md=1;md<=2;md++)SCHED[md].forEach((_,mi)=>{
    const id=`${gr}_${md}_${mi}`;
    ['hg_','ag_','hc_','ac_'].forEach(p=>{const el=document.getElementById(p+id);if(el)el.disabled=lk;});
  });
});
function clearAll(){
  document.querySelectorAll('.si').forEach(el=>{el.value='';el.disabled=false;});
  document.querySelectorAll('.ci').forEach(el=>{el.value='0';el.disabled=false;});
  document.getElementById('lock').checked=false;
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

// ========== RUN ANALYSIS ==========
let worker=null;
function run(){
  const{matchData,completeness}=gather();
  let ok=false;for(const g of GROUPS)if(matchData[g].length>=4)ok=true;
  if(!ok){alert('Enter at least Matchdays 1 & 2 for one group.');return;}
  document.getElementById('runBtn').disabled=true;
  document.getElementById('prog').style.display='block';
  document.getElementById('res').style.display='none';
  if(worker)worker.terminate();
  worker=new Worker('worker.js');
  let cands=null;
  worker.onmessage=function(e){
    const d=e.data;
    if(d.type==='progress'){document.getElementById('pfill').style.width=(d.pct||0)+'%';document.getElementById('pmsg').textContent=d.msg||('Processing... '+(d.pct||0)+'%');}
    else if(d.type==='candidates')cands=d.data;
    else if(d.type==='result'){document.getElementById('runBtn').disabled=false;document.getElementById('prog').style.display='none';showResults(d.data,cands,completeness);}
  };
  worker.onerror=function(err){console.error(err);document.getElementById('runBtn').disabled=false;document.getElementById('pmsg').textContent='Error: '+err.message;};
  worker.postMessage({type:'analyze',data:{matchData,completeness}});
}

// ========== DISPLAY RESULTS ==========
function showResults(analysis,candidates,completeness){
  document.getElementById('res').style.display='block';
  const{possibleCombos,groupStatus,teamStatus}=analysis;const pSet=new Set(possibleCombos);

  // Store for wiki.js access
  window._lastAnalysis={possibleCombos,groupStatus,teamStatus,completeness,candidates};
  for(const g of GROUPS){
    const badge=document.getElementById('b_'+g),st=groupStatus[g];
    badge.style.display='inline-block';
    badge.className='sb '+(st==='GUARANTEED_TOP8'?'s8':st==='GUARANTEED_BOTTOM4'?'s4':'st');
    badge.textContent=st==='GUARANTEED_TOP8'?'✓ TOP 8':st==='GUARANTEED_BOTTOM4'?'✗ BOTTOM 4':'? TBD';
    const box=document.getElementById('c_'+g),gc=candidates[g];
    if(gc&&gc.length){
      box.style.display='block';const ic=completeness[g];
      const fgd=v=>v>40?'∞':v<-40?'-∞':(v>=0?'+':'')+v,fgf=v=>v>40?'∞':''+v;
      let h=`<div class="ct">${ic?'3rd Place Team':'Possible 3rd Place Finishers'}</div>`;
      for(const c of gc){
        const ts=teamStatus[c.name]||'TBD',tcol=ts==='GUARANTEED_TOP8'?'var(--grn)':ts==='GUARANTEED_BOTTOM4'?'var(--red)':'var(--amb)',tlab=ts==='GUARANTEED_TOP8'?'✓ TOP 8':ts==='GUARANTEED_BOTTOM4'?'✗ BOTTOM 4':'? TBD';
        h+=`<div class="cd"><div class="ch"><span class="cn">${c.flag} ${c.name}</span>`;
        if(!ic)h+=`<span class="cs" style="color:${tcol}">${tlab}</span>`;
        h+=`</div><div class="cv">Best: ${c.best.pts}p ${fgd(c.best.gd)}gd ${fgf(c.best.gf)}gf`;
        if(!ic)h+=` | Worst: ${c.worst.pts}p ${fgd(c.worst.gd)}gd ${fgf(c.worst.gf)}gf`;
        h+=`</div></div>`;
      }
      box.innerHTML=h;
    }else box.style.display='none';
  }
  document.getElementById('sgrid').innerHTML=GROUPS.map(g=>{
    const st=groupStatus[g],col=st==='GUARANTEED_TOP8'?'var(--grn)':st==='GUARANTEED_BOTTOM4'?'var(--red)':'var(--amb)',lab=st==='GUARANTEED_TOP8'?'✓ Top 8':st==='GUARANTEED_BOTTOM4'?'✗ Bottom 4':'? TBD';
    return`<div class="sc"><div class="sl">Group ${g}</div><div class="sv" style="color:${col}">${lab}</div></div>`;
  }).join('');
  buildMatchups(pSet);buildMatrix(pSet);
  // Generate wiki and R32 pairings if wiki.js is loaded
  if(typeof generateAllWiki==='function') try{generateAllWiki();}catch(e){console.error('Wiki generation:',e);}
}

// ========== MATCHUP TABLES ==========
function buildMatchups(pSet){
  const fpOpps={},tpOpps={};SLOTS.forEach(s=>fpOpps[s]=new Set());
  if(typeof COMBO_MATRIX==='undefined'){document.getElementById('fp').innerHTML='<tr><td>Matrix data not loaded</td></tr>';return;}
  for(const combo of COMBO_MATRIX){if(pSet.has(combo.groups)){SLOTS.forEach(s=>{fpOpps[s].add(combo.matchups[s]);const tid=combo.matchups[s];if(!tpOpps[tid])tpOpps[tid]=new Set();tpOpps[tid].add(s);});}}
  let fh='<tr><th>1st Place Team</th><th>Possible 3rd Place Opponents</th></tr>';
  SLOTS.forEach(s=>{const opps=[...fpOpps[s]].sort();fh+=`<tr><td style="font-weight:600">${s} (${SLOT_NAMES[s]})</td><td>${opps.map(o=>`<span class="oc">${o}</span>`).join(' ')}</td></tr>`;});
  document.getElementById('fp').innerHTML=fh;
  let th='<tr><th>3rd Place Group</th><th>Possible 1st Place Opponents</th></tr>';
  for(const g of GROUPS){const tid='3'+g;if(!tpOpps[tid]||tpOpps[tid].size===0)continue;const opps=[...tpOpps[tid]].sort();
    th+=`<tr><td style="font-weight:600">${tid}</td><td>${opps.map(o=>`<span class="oc">${o} (${SLOT_NAMES[o]})</span>`).join(' ')}</td></tr>`;}
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
    GROUPS.forEach(g=>{const inC=combo.groupSet.has(g);h+=`<td style="color:${inC?(possible?'var(--grn)':'var(--t3)'):'var(--t3)'};font-weight:${inC?'700':'400'}">${inC?g:'·'}</td>`;});
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

// Show/hide MD3 count row based on mode
document.getElementById('rngMode').addEventListener('change',function(){
  document.getElementById('rngCountRow').style.display=this.value==='md12plus'?'flex':'none';
});

// ========== RANDOM SCORE GENERATOR ==========
// Weighted random: 0-3 much more likely than 4-8
// Weights: 0→20, 1→18, 2→14, 3→10, 4→6, 5→3, 6→2, 7→1, 8→1
function weightedRandomScore(){
  const weights=[20,18,14,10,6,3,2,1,1]; // indices 0-8
  const total=weights.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<weights.length;i++){
    r-=weights[i];
    if(r<=0) return i;
  }
  return 0;
}

function randomConduct(){
  // Most matches: 0-4 conduct points per team, occasionally higher
  const w=[30,25,20,12,6,3,2,1,1];
  const total=w.reduce((a,b)=>a+b,0);
  let r=Math.random()*total;
  for(let i=0;i<w.length;i++){r-=w[i];if(r<=0)return i;}
  return 0;
}

function generateRandom(){
  const mode=document.getElementById('rngMode').value;
  let md3Count=0;

  if(mode==='md12plus'){
    md3Count=Math.max(1,Math.min(11,parseInt(document.getElementById('rngCount').value)||4));
  }

  // Which matchdays to fill per group
  const md3Groups=new Set();
  if(mode==='all'){
    GROUPS.forEach(g=>md3Groups.add(g));
  } else if(mode==='md12plus'){
    // Pick md3Count random groups for MD3
    const shuffled=[...GROUPS].sort(()=>Math.random()-0.5);
    for(let i=0;i<md3Count;i++) md3Groups.add(shuffled[i]);
  }

  // Fill scores
  for(const gr of GROUPS){
    for(let md=1;md<=3;md++){
      if(md<=2 || md3Groups.has(gr)){
        SCHED[md].forEach((_,mi)=>{
          const id=`${gr}_${md}_${mi}`;
          const hgEl=document.getElementById('hg_'+id);
          const agEl=document.getElementById('ag_'+id);
          const hcEl=document.getElementById('hc_'+id);
          const acEl=document.getElementById('ac_'+id);
          if(!hgEl.disabled){
            hgEl.value=weightedRandomScore();
            agEl.value=weightedRandomScore();
            hcEl.value=randomConduct();
            acEl.value=randomConduct();
          }
        });
      }
    }
    updateStandings(gr);
  }
}

// ========== EXPORT / IMPORT ==========
function exportData(){
  const data={};
  for(const gr of GROUPS){
    data[gr]={};
    for(let md=1;md<=3;md++){
      SCHED[md].forEach((_,mi)=>{
        const id=`${gr}_${md}_${mi}`;
        const hg=document.getElementById('hg_'+id).value;
        const ag=document.getElementById('ag_'+id).value;
        const hc=document.getElementById('hc_'+id).value;
        const ac=document.getElementById('ac_'+id).value;
        if(hg!==''||ag!==''){
          data[gr][`md${md}_m${mi}`]={hg,ag,hc:hc||'0',ac:ac||'0'};
        }
      });
    }
  }
  const json=JSON.stringify(data,null,2);
  document.getElementById('exportBox').value=json;
}

function importData(){
  const text=document.getElementById('exportBox').value.trim();
  if(!text){alert('Paste data into the text box first.');return;}
  let data;
  try{data=JSON.parse(text);}
  catch(e){alert('Invalid data format. Must be valid JSON.');return;}

  for(const gr of GROUPS){
    if(!data[gr]) continue;
    for(let md=1;md<=3;md++){
      SCHED[md].forEach((_,mi)=>{
        const key=`md${md}_m${mi}`;
        const id=`${gr}_${md}_${mi}`;
        if(data[gr][key]){
          const d=data[gr][key];
          const hgEl=document.getElementById('hg_'+id);
          const agEl=document.getElementById('ag_'+id);
          if(!hgEl.disabled){
            hgEl.value=d.hg!==undefined?d.hg:'';
            agEl.value=d.ag!==undefined?d.ag:'';
            document.getElementById('hc_'+id).value=d.hc||'0';
            document.getElementById('ac_'+id).value=d.ac||'0';
          }
        }
      });
    }
    updateStandings(gr);
  }
}

function downloadData(){
  // Export first to ensure the box is current
  exportData();
  const text=document.getElementById('exportBox').value;
  if(!text){alert('No data to download.');return;}
  const blob=new Blob([text],{type:'application/json'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download='fifa2026_3rdplace_data.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
