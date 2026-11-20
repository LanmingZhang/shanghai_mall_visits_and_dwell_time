/* Act 05 · local, complete-pair, one-predictor ordinary least squares. */
(() => {
  'use strict';
  const periods={mean:'周三／周六等权平均',wed:'周三',sat:'周六'};
  const outcomes={Density:{title:'来访密度',unit:'人／公顷',scale:1},Stay:{title:'平均停留时长',unit:'分钟',scale:60}};
  const scopes={all:'整体',A:'A片区',B:'B片区'};
  const finite=Number.isFinite,minFit=3,smallN=6,top=3;
  const validStatus={lowN:'样本不足',constantX:'解释量为常量',constantY:'结果为常量',nonFinite:'数值不可计算'};
  const fit=(rows) => {
    const n=rows.length;
    const stop=status=>({n,status,r2:null,slope:null,intercept:null});
    if(n<minFit)return stop('lowN');
    // Center the inputs prior to accumulating squares; use a second pass for SSE.
    const xm=rows.reduce((s,[x])=>s+x/n,0),ym=rows.reduce((s,[,y])=>s+y/n,0);
    let xx=0,yy=0,xy=0;
    for(const [x,y] of rows){const dx=x-xm,dy=y-ym;xx+=dx*dx;yy+=dy*dy;xy+=dx*dy;}
    if(rows.every(([x])=>x===rows[0][0])||xx===0)return stop('constantX');
    if(rows.every(([,y])=>y===rows[0][1])||yy===0)return stop('constantY');
    const slope=xy/xx,intercept=ym-slope*xm;
    const sse=rows.reduce((s,[x,y])=>s+((y-ym)-slope*(x-xm))**2,0);
    const r2=Math.max(0,Math.min(1,1-sse/yy));
    return [slope,intercept,r2].every(finite)?{n,status:'ok',r2,slope,intercept}:stop('nonFinite');
  };
  const dayValue=(r,o,p) => {
    if(p!=='mean')return finite(r?.[p+o])?r[p+o]*outcomes[o].scale:null;
    const w=dayValue(r,o,'wed'),s=dayValue(r,o,'sat');
    return finite(w)&&finite(s)?w/2+s/2:null;
  };
  function analyze({definitions,records,malls,vitality}){
    const xs=definitions.filter(d=>d.kind==='number').flatMap(d=>
      (d.scope==='mall'?[0]:[1000,5000]).map(radius=>({id:d.id,radius,title:d.title,unit:d.unit,group:d.group,key:`${d.id}:${radius}`})));
    const results={};
    for(const o of Object.keys(outcomes)){
      const entries=xs.map(x=>({...x,cells:{}}));
      for(const period of Object.keys(periods))for(const scope of Object.keys(scopes)){
        for(const row of entries){
          const pairs=[];
          for(const m of malls){
            if(scope!=='all'&&m.area!==scope)continue;
            const raw=records[m.id]?.[row.id];
            const x=row.radius?raw?.[row.radius]:raw,y=dayValue(vitality[m.id],o,period);
            if(finite(x)&&finite(y))pairs.push([x,y]);
          }
          (row.cells[period]??={})[scope]={...fit(pairs),rank:null};
        }
        const ranked=entries.filter(row=>row.cells[period][scope].status==='ok').sort((a,b)=>b.cells[period][scope].r2-a.cells[period][scope].r2||a.key.localeCompare(b.key,'en'));
        let lastValue;
        ranked.forEach((row,i)=>{const cell=row.cells[period][scope];cell.rank=(i>0&&Math.abs(cell.r2-lastValue)<1e-12)?ranked[i-1].cells[period][scope].rank:i+1;lastValue=cell.r2;});
      }
      results[o]=entries;
    }
    return results;
  }
  const html=v=>String(v).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const r2=v=>v.toFixed(3),signed=v=>(v>=0?'+':'')+Number(v.toPrecision(4)),sizeLabel=r=>r?r/1000+' km':'商场自身';
   const count=(m,s)=>m.filter(x=>s==='all'||x.area===s).length;
   function heatCell(c){
     if(c.status!=='ok')return `<td class="reg-heat-missing" aria-label="${validStatus[c.status]}，n=${c.n}">—<small>n=${c.n}</small></td>`;
     const t=c.r2, rgb=[247-205*t,238-151*t,223-121*t].map(Math.round).join(',');
     const info=`R² ${r2(t)}，n=${c.n}，斜率 ${signed(c.slope)}`;
     return `<td data-r2="${t}" style="--heat:rgb(${rgb});--heat-ink:${t>=.61?'#fff':'#25201c'}" title="${info}" aria-label="${info}"><b>${r2(t)}</b><small>n=${c.n}</small></td>`;
   }
   function heatmap(entries,o,malls){
     const rows=[...entries].sort((a,b)=>(a.cells.mean.all.rank??Infinity)-(b.cells.mean.all.rank??Infinity)||a.group.localeCompare(b.group,'en'));
     const columns=Object.entries(scopes).map(([s,name])=>`<th scope="col">${name}<small>${count(malls,s)} 家</small></th>`).join('');
     return `<div class="reg-heat-key"><b>R²</b><span>0</span><i aria-hidden="true"></i><span>1</span><span>｜ — 未拟合</span></div><div class="reg-table-scroll reg-heatmap" tabindex="0" role="region" aria-label="${outcomes[o].title} R² 热力图"><table><caption>按整体 R² 从高到低排列</caption><thead><tr><th scope="col">解释变量</th>${columns}</tr></thead><tbody>${rows.map(row=>`<tr data-reg-key="${html(row.key)}"><th scope="row">${html(row.title)}<small>${html(row.group)} 组 · ${sizeLabel(row.radius)}</small></th>${Object.keys(scopes).map(s=>heatCell(row.cells.mean[s])).join('')}</tr>`).join('')}</tbody></table></div>`;
   }
  function shortlist(entries,malls){
    return `<div class="reg-top">${Object.entries(scopes).map(([s,name])=>{
      const rows=entries.filter(r=>r.cells.mean[s].rank!==null).sort((a,b)=>a.cells.mean[s].rank-b.cells.mean[s].rank).slice(0,top);
      return `<article><h4>${name}<small>${count(malls,s)} 家候选</small></h4>${rows.length?`<ol>${rows.map(r=>{const c=r.cells.mean[s];return `<li><b>#${c.rank} · ${html(r.title)}</b><small>${sizeLabel(r.radius)} · n=${c.n} · R² ${r2(c.r2)} · 斜率 ${signed(c.slope)}${c.n<smallN?' · 小样本':''}</small></li>`;}).join('')}</ol>`:'<p>暂无可拟合指标。</p>'}</article>`;
    }).join('')}</div>`;
  }
   function findings(results){
     const strongest=(o,scope)=>results[o].find(r=>r.cells.mean[scope].rank===1);
     const show=(o,scope)=>{const r=strongest(o,scope),c=r.cells.mean[scope];return `${html(r.title)}${r.radius?'（'+sizeLabel(r.radius)+'）':''}（${c.slope>=0?'正':'负'}相关，R² ${r2(c.r2)}，n=${c.n}）`;};
     return `<section class="reg-reading reg-findings"><h3>初步发现</h3><p><b>整体：</b>来访密度的最高项是${show('Density','all')}；停留时长的最高项是${show('Stay','all')}。</p><p><b>A 片区：</b>来访密度最接近${show('Density','A')}；停留时长最接近${show('Stay','A')}。</p><p><b>B 片区：</b>来访密度最接近${show('Density','B')}；停留时长最接近${show('Stay','B')}。</p></section>`;
   }
   function markup(results,malls){
     return `${findings(results,malls)}<p class="reg-reading">周三、周六取平均；整体、A、B 分别按 R² 排序。每项单独拟合，n 为有效商场数；1 km／5 km 分开。结果为样本内关联。</p>
       ${Object.entries(outcomes).map(([o,d])=>`<section class="reg-outcome" aria-labelledby="reg-title-${o}"><h3 id="reg-title-${o}">${d.title}<span>${d.unit}</span></h3><p class="reg-outcome-lead">各组 R² 前三</p>${shortlist(results[o],malls)}${heatmap(results[o],o,malls)}</section>`).join('')}`;
   }
  window.ATLAS_REGRESSION={fit,analyze};
  function mount(){
    const act=document.getElementById('act-05'),slot=document.getElementById('regression-panel');
    const metrics=window.ATLAS_METRICS,vitality=window.ATLAS_VITALITY?.records,malls=window.ATLAS_DATA?.malls;
    if(!act||!metrics||!vitality||!malls)return;
    const panel=slot||document.createElement('section');
    panel.id='regression-panel';panel.classList.add('atlas-regression');
    const results=analyze({...metrics,malls,vitality});
    panel.innerHTML=markup(results,malls);
    if(!slot){const header=act.querySelector('.r-heading');if(header)header.after(panel);else act.prepend(panel);}
    window.ATLAS_REGRESSION.results=results;
  }
  if(typeof document!=='undefined'){
    if(document.getElementById('act-05'))mount();else document.addEventListener('DOMContentLoaded',mount,{once:true});
  }
})();
