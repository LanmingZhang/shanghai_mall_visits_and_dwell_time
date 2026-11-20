/* Research narrative: configuration → behaviour → joint explanation → spatial checking. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),R=ATLAS_RESEARCH,D=ATLAS_DATA,V=ATLAS_VITALITY.records,M=ATLAS_METRICS;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=(x,n=0)=>Number.isFinite(x)?x.toLocaleString('zh-CN',{maximumFractionDigits:n}):'暂无';
 const pct=x=>fmt(x*100,1)+'%', byPid=new Map(R.malls.map(m=>[m.pid,m]));
 const palette=['#88a5a8','#c4b3a2','#737b9e','#b49a77','#b7654c','#d7aa58'];
 const state={level:'二级',brand:'',pid:'32147',mall:'SHM000357',day:'wed',scope:'local',similar:false,trail:false};
 const vector=m=>state.level==='一级'?m.primary:m.secondary;
 const common=(a,b)=>a.reduce((s,x,i)=>s+Math.min(x,b[i]),0);
 const current=()=>D.malls.find(m=>m.id===state.mall);
 const localCommercial=id=>ATLAS_ABCD_LOCAL[id]?.secondary?ATLAS_ABCD_LOCAL[id]:null;
 const value=(id,k)=>{const v=M.records[id][k];return v&&typeof v==='object'?v[ATLAS_ANALYSIS.radius]:v;};
 const node=(tag,attrs,parent,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;parent.append(n);return n;};
 const color=(v)=>v===undefined?'#c8c5bc':`rgb(${Math.round(224-105*v)},${Math.round(203-135*v)},${Math.round(171-126*v)})`;
 const section=(id,html)=>{const el=document.createElement('section');el.id=id;el.className='research-chapter';el.innerHTML=html;return el;};
 const heading=(n,k,title,copy)=>`<header class="r-heading"><div><span class="r-kicker">ACT ${n} / ${k}</span><h2>${title}</h2></div><p>${copy}</p></header>`;
 const oldStory=$('metrics-story'),oldMetrics=$('metrics-explorer');
 const third=$('act-03');third.classList.add('research-chapter');
 const oldIntro=third.querySelector('.metrics-intro');oldIntro.remove();
 third.querySelector('.scale-takeaway')?.remove();
 const fourth=section('act-04',heading('04','ABCD 条件分析','什么条件，<br><em>与来访和停留有关？</em>','对照商业运营、建筑空间、城市区位和周边目的地。'));
 const fifth=section('act-05',heading('05','相关性分析','什么与来访有关，<br><em>什么与停留有关？</em>','对19家商场整体及两个片区分别做单变量线性回归。'));
 third.after(fourth,fifth);
  const archive=document.createElement('div');archive.id='research-archive';archive.hidden=true;
  fifth.after(archive);archive.append(oldStory,oldMetrics);
 $('vitality').querySelector('.v-route')?.remove();
 third.innerHTML=heading('01','商业同质化','为什么走进不同的商场，<br><em>却总看到熟悉的业态？</em>','上海533家商场的一级业态平均重合度为66.6%，二级业态为49.5%。在相似的配置下，品牌运营、建筑设计和周边环境，哪些与来访和停留有关？')+`
 
 <div class="r-city" id="research-city"><div class="r-city-head"><div><span class="r-kicker">THE COMMERCIAL FABRIC / 商业配置全景</span><h3><b>533</b> 家商场，一张配置图谱。</h3><p>每列是一家商场，每行是一类业态。越深，说明该类品牌占比越高。</p></div><div class="r-segment" role="group" aria-label="业态分类层级"><button data-level="一级">6类 · 看基本框架</button><button data-level="二级">26类 · 看细分差异</button></div></div>
 <div class="r-city-controls"><label>叠加常见品牌 <select id="r-brand" aria-label="筛选含某品牌的商场"><option value="">全部533家</option></select></label><p id="r-brand-note" aria-live="polite"></p></div>
 <div class="r-heat-scroll"><div class="r-heat-layout"><div id="r-heat-labels"></div><div><canvas id="r-heatmap" role="img" aria-label="533家商业配置热图；可通过下方选择框查看任意商场"></canvas><div class="r-heat-axis"><span id="r-sort-note"></span><span>每列1家 · 点击查看具体配置 ↓</span></div></div></div></div>
 <div class="r-heat-key"><span>业态份额</span><i></i><span>0% → 50%以上</span><span>份额按在营去重品牌数计算，非面积占比；颜色上限固定。</span></div>
 <div class="r-city-bottom"><div class="r-city-inspect"><label>定位一家商场 <select id="r-city-mall" aria-label="选择533家商场中的一家"></select></label><div id="r-city-profile" aria-live="polite"></div><button id="r-city-link" class="r-link">查看这家的来访与停留 →</button></div><div class="r-city-conclusion"><span class="r-kicker">共性与差异，同时存在</span><h4 id="r-common-title"></h4><svg id="r-distribution" viewBox="0 0 480 138" role="img" aria-label="全部不重复商场对的组成重合度分布"></svg><p id="r-common-note"></p></div></div>
 <div id="r-original-links" hidden></div></div>
 <div class="r-bridge"><b>从“商场配置了什么”，<br>走向“商场被怎样使用”。</b><p>商场既要让人来，也要让人愿意留下。先认识两个片区，看看实际使用的差异。</p><a href="#act-01">认识片区 →</a></div>`;
 fourth.insertAdjacentHTML('beforeend','<div id="research-workbench"></div>');
 fifth.insertAdjacentHTML('beforeend','<div id="regression-panel"></div>');

 // Update chapter navigation without modifying the accepted first-act maps.
  const nav=document.querySelector('.chapter-nav');
 document.querySelector('#act-02 .scale-takeaway').innerHTML='<a class="next-chapter-badge" href="#act-04">进入 ABCD 条件分析 ↓</a>';
 document.title='商业配置共性下的来访与停留 · 上海双片区交互研究';
 document.querySelector('.page-footer').innerHTML='<span>城市分析 / 作业02 · 商业同质化、来访与停留</span><a href="#act-03">↑ 回到开篇</a>';
 document.querySelector('#source-dialog>p').textContent='第一、二幕保留双片区与尺度。第三幕接入533家商业配置数据，第四幕展示170家候选交集的汇总背景与19家联动核查，第五幕为研究方案的待实施模型框架，第六幕为空间核查。';
 const sourceList=document.querySelector('#source-dialog .source-list');sourceList.insertAdjacentHTML('beforeend','<dt>商业配置共性</dt><dd>2026-11-16冻结交付：533家、37,487条在营品牌关系。二级组成重合度为主描述，一级作框架背景。170家是与LBS既有主PID关联的候选交集，不是审核完成的训练样本；第三幕城市样本与第四幕的本地新版商业指标分开使用。导出来源和哈希见research-audit.json。</dd>');

 R.brands.forEach(b=>$('r-brand').insertAdjacentHTML('beforeend',`<option value="${b.id}">${esc(b.name)} · ${b.n}/533</option>`));
 [...R.malls].sort((a,b)=>a.name.localeCompare(b.name,'zh')).forEach(m=>$('r-city-mall').insertAdjacentHTML('beforeend',`<option value="${m.pid}">${esc(m.name)} · ${esc(m.district)}</option>`));
 const sourceNames=['11_品牌Top20_普及率柱状图','12_一级业态_组成与差异','12_二级业态_组成与差异','13_一级业态_两种相似指标分布','13_二级业态_两种相似指标分布','14_一级业态_533家组成热图','14_二级业态_533家组成热图'];
 $('r-original-links').innerHTML=sourceNames.map(n=>`<a href="research-evidence/${encodeURIComponent(n)}.svg" target="_blank" rel="noopener">${esc(n.slice(3))} ↗</a>`).join('')+'<a href="abcd-evidence/A_composition_cat1.svg" target="_blank" rel="noopener">本地19家 · 一级业态 ↗</a><a href="abcd-evidence/A_composition_cat2.svg" target="_blank" rel="noopener">本地19家 · 二级业态 ↗</a>';
 let ordered=[];
 function stack(values,names){return `<div class="r-stack" role="img" aria-label="${esc(names.map((n,i)=>n+pct(values[i])).join('，'))}">${values.map((v,i)=>v>0?`<span style="width:${v*100}%;background:${palette[i%palette.length]}" title="${esc(names[i])} ${pct(v)}"></span>`:'').join('')}</div>`;}
 function renderCity(){
   const level=R.levels[state.level],cats=level.categories,sortCat=state.level==='一级'?'餐饮':'休闲餐饮',si=cats.indexOf(sortCat),brand=R.brands.find(b=>b.id===state.brand),included=brand?new Set(brand.pids):null;
   ordered=[...R.malls].sort((a,b)=>vector(b)[si]-vector(a)[si]||+a.pid-+b.pid);
   document.querySelectorAll('[data-level]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.level===state.level)));
   $('r-brand').value=state.brand;$('r-city-mall').value=state.pid;
   $('r-brand-note').textContent=brand?`${brand.name}出现在${brand.n}家，占${pct(brand.n/533)}。这些列被点亮；这是品牌普及率，不是商场间重合率。`:'试一试：选一个熟悉的品牌，看它如何重复出现在不同配置的商场里。';
   const rowH=state.level==='一级'?43:16,h=cats.length*rowH;
   $('r-heat-labels').innerHTML=cats.map(c=>`<span style="height:${rowH}px">${esc(c)}</span>`).join('');
   const canvas=$('r-heatmap');canvas.width=1066;canvas.height=h;canvas.style.height=h+'px';const ctx=canvas.getContext('2d');
   ordered.forEach((m,j)=>vector(m).forEach((v,i)=>{const t=Math.min(1,v/.5);ctx.fillStyle=`rgb(${Math.round(242-110*t)},${Math.round(233-169*t)},${Math.round(214-167*t)})`;ctx.globalAlpha=included&&!included.has(m.pid)?.14:1;ctx.fillRect(j*2,i*rowH,2,rowH-1);}));ctx.globalAlpha=1;
   const index=ordered.findIndex(m=>m.pid===state.pid);ctx.strokeStyle='#153b40';ctx.lineWidth=2;ctx.strokeRect(index*2,0,3,h);
   $('r-sort-note').textContent=`按${sortCat}份额从高到低排序 →`;
   const m=byPid.get(state.pid),v=vector(m),ranked=cats.map((c,i)=>({c,v:v[i]})).sort((a,b)=>b.v-a.v),localId=Object.keys(R.local).find(id=>R.local[id].pid===state.pid);
   $('r-city-profile').innerHTML=`<h4>${esc(m.name)}</h4><p>${esc(m.district)} · ${m.n}个在营去重品牌${m.n<20?' · 清单较少，份额谨慎解读':''}</p>${stack(v,cats)}<p>${ranked.slice(0,3).map(c=>esc(c.c)+' '+pct(c.v)).join(' · ')}</p>`;
   if(localId){
     const l=ATLAS_ABCD_LOCAL[localId], lv=state.level==='一级'?l.primary:l.secondary;
     const top=lv?cats.map((c,i)=>[c,lv[i]]).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([c,v])=>esc(c)+' '+pct(v)).join(' · '):'当前层级暂无完整构成';
     $('r-city-profile').insertAdjacentHTML('beforeend',`<div class="r-local-abcd"><p><b>双片区交接版 · ${esc(l.name)}</b>${l.pids.length>1?'（合并分期）':''} · ${l.n===null?'品牌数缺失':l.n+' 个观察品牌'}</p>${lv?stack(lv,cats):''}<p>${top}</p></div>`);
   }
   $('r-city-link').disabled=!localId;$('r-city-link').textContent=localId?'查看这家的来访与停留 →':'此商场不在本地19家演示样本中';
   $('r-common-title').textContent=state.level==='一级'?'基本业态框架较接近。':'细分配置仍保留明显差异。';
   $('r-common-note').textContent=`${state.level}平均组成重合度${pct(level.mean)}，中位数${pct(level.median)}。柱高表示商场对数量；共141,778对，品牌筛选不改变参照集。`;
   const svg=$('r-distribution');svg.replaceChildren();const max=Math.max(...level.hist);
   level.hist.forEach((n,i)=>node('rect',{x:20+i*22,y:104-n/max*76,width:18,height:n/max*76,fill:'#ac7555'},svg));
   node('line',{x1:20+440*level.mean,x2:20+440*level.mean,y1:16,y2:105,stroke:'#244950','stroke-width':2},svg);node('text',{x:20+440*level.mean,y:12,'text-anchor':'middle'},svg,'均值 '+pct(level.mean));
   node('text',{x:20,y:128},svg,'0 · 完全不同');node('text',{x:460,y:128,'text-anchor':'end'},svg,'100% · 组成相同');
 }
 $('r-heatmap').onclick=e=>{const rect=e.currentTarget.getBoundingClientRect();state.pid=ordered[Math.min(532,Math.floor((e.clientX-rect.left)/rect.width*533))].pid;renderCity();};
 $('r-heatmap').onmousemove=e=>{const rect=e.currentTarget.getBoundingClientRect(),j=Math.min(532,Math.floor((e.clientX-rect.left)/rect.width*533)),i=Math.min(R.levels[state.level].categories.length-1,Math.floor((e.clientY-rect.top)/rect.height*R.levels[state.level].categories.length));e.currentTarget.title=`${ordered[j].name} · ${R.levels[state.level].categories[i]} ${pct(vector(ordered[j])[i])}`;};
 $('r-brand').onchange=e=>{state.brand=e.target.value;renderCity();};$('r-city-mall').onchange=e=>{state.pid=e.target.value;renderCity();};
 document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{state.level=b.dataset.level;renderCity();});
 $('r-city-link').onclick=()=>{const id=Object.keys(R.local).find(id=>R.local[id].pid===state.pid);if(id){state.scope='local';choose(id);$('usage-overview').scrollIntoView({behavior:'smooth'});}};

 function closeIds(){const a=localCommercial(state.mall);return a?D.malls.filter(m=>{const b=localCommercial(m.id);return b&&common(a.secondary,b.secondary)>=.7;}).map(m=>m.id):[];}
 function renderBehavior(){window.ATLAS_USAGE_VIEW?.render();}
 function choose(id){state.mall=id;if(!localCommercial(id))state.similar=false;const pid=R.local[id]?.pid;if(pid){state.pid=pid;renderCity();}ATLAS_SCALE.select(id);renderBehavior();}
 document.addEventListener('atlas:analysis-change',()=>{if(ATLAS_ANALYSIS.selected){state.mall=ATLAS_ANALYSIS.selected;if(!localCommercial(state.mall))state.similar=false;}renderBehavior();});
  function readingMode(){const links=[...nav.querySelectorAll('a')];let active=links[0];for(const a of links)if(document.querySelector(a.hash).getBoundingClientRect().top<window.innerHeight*.35)active=a;links.forEach(a=>a.classList.toggle('active',a===active));}
 window.addEventListener('scroll',readingMode,{passive:true});window.addEventListener('resize',readingMode);
 renderCity();renderBehavior();readingMode();window.ATLAS_RESEARCH_VIEW={state,common,closeIds,choose,renderBehavior};
 third.querySelector('.r-heading h2').id='metrics-title';
 const oldHashes=['#figure-days','#figure-cohort','#figure-traffic','#v-behavior','#v-change','#v-transport'];
 if(oldHashes.includes(location.hash))history.replaceState(null,'','#act-04');
 if(location.hash)requestAnimationFrame(()=>{$(location.hash.slice(1))?.scrollIntoView({behavior:'instant'});readingMode();});
})();
