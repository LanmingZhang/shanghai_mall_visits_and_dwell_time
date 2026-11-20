/* Three evidence views of the same LBS observations; no fabricated flows. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),D=ATLAS_DATA,V=ATLAS_VITALITY.records,S=ATLAS_ANALYSIS,C=ATLAS_SHARED.colors;
 const state={day:'wed',area:'all',rising:false,caseHighlighted:false};
 const finite=v=>typeof v==='number'&&Number.isFinite(v),fmt=(v,d=0)=>finite(v)?v.toLocaleString('zh-CN',{maximumFractionDigits:d}):'暂无';
 const row=id=>D.malls.find(m=>m.id===id),density=m=>V[m.id][state.day+'Density'],stay=m=>V[m.id][state.day+'Stay']*60,metro=m=>ATLAS_METRICS.records[m.id].metro[String(S.radius)];
 const scope=()=>D.malls.filter(m=>state.area==='all'||m.area===state.area);
 const median=a=>{a=a.filter(finite).sort((a,b)=>a-b);return (a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2;};
 const refs={x:median(D.malls.flatMap(m=>[V[m.id].wedDensity,V[m.id].satDensity])),y:median(D.malls.flatMap(m=>[V[m.id].wedStay*60,V[m.id].satStay*60]))};
 const dayLabel=()=>state.day==='wed'?'周三':'周六';
 const pearson=rows=>{if(rows.length<3)return null;const xs=rows.map(metro),ys=rows.map(density),mx=xs.reduce((s,x)=>s+x,0)/xs.length,my=ys.reduce((s,x)=>s+x,0)/ys.length;const a=xs.reduce((s,x,i)=>s+(x-mx)*(ys[i]-my),0),b=Math.sqrt(xs.reduce((s,x)=>s+(x-mx)**2,0)*ys.reduce((s,y)=>s+(y-my)**2,0));return b?a/b:null;};
 $('metrics-title').innerHTML='地铁口更多，<br><span>商场就更热闹吗？</span>';
 document.title='两个片区，十九家商场 · 人流、停留与空间';
 $('nav-act-03').innerHTML='<b>03</b> 人流与活力';
 const intro=$('act-03').querySelector('.metrics-intro');intro.querySelector('div>p').textContent='先看人来得密不密、留得久不久，再回到地图寻找空间线索。';
 intro.querySelector('.metrics-intro-note').innerHTML='<span>FOLLOW THE EVIDENCE / 跟着证据走</span><p><b>01</b> 人流与停留<br><b>02</b> 周三与周六<br><b>03</b> 交通与人流</p><small>19家商场 · LBS 2023-06 · 探索性关联</small>';
 const old=document.createElement('details');old.id='vitality-background';old.className='metrics-explorer';old.innerHTML='<summary><span>补充证据：规模与商业构成</span><small>19家排序 · 六类品牌 · 四类目的地</small><b>＋</b></summary>';
 const story=$('metrics-story');story.prepend(old);['story-opening','story-size','story-composition'].forEach(id=>old.append($(id)));story.querySelector('.story-nav').remove();$('story-leads').hidden=true;
 const root=document.createElement('div');root.id='vitality';root.innerHTML=`
 <nav class="v-route" aria-label="第三幕阅读顺序"><a href="#v-behavior"><b>01</b> 先看活力<span>人密不密 · 留多久</span></a><a href="#v-change"><b>02</b> 切换日期<span>热闹了 · 留住了吗</span></a><a href="#v-transport"><b>03</b> 检验直觉<span>交通多 · 人流就高吗</span></a></nav>
 <section class="v-section" id="v-behavior"><header class="v-heading"><div><span class="story-kicker">01 / TWO DIMENSIONS OF VITALITY</span><h3>热闹，与留得住。</h3><p>每个点是一家商场。越往右，人流越密；越往上，平均停留越久。</p></div><div class="v-days" role="group" aria-label="选择LBS日期"><button data-day="wed" aria-pressed="true">周三</button><button data-day="sat" aria-pressed="false">周六</button></div></header>
 <div class="v-instruction"><b>试一试</b>点击「周六」，观察点的位置怎样变化；再点一家商场，查看具体数值。<span>点的移动是指标变化，不是人的移动路线。</span></div>
 <div class="v-scope"><div role="group" aria-label="片区筛选"><button data-area="all" aria-pressed="true">全部19家</button><button data-area="A" aria-pressed="false">● A片区</button><button data-area="B" aria-pressed="false">● B片区</button></div><span id="v-count"></span></div>
 <div class="v-chart-layout"><div class="v-plot"><svg id="v-scatter" role="group" aria-label="人流密度与停留时间关系图"></svg><p class="v-chart-note">分区线固定为19家两日观测的中位数，仅作相对参照，不是活力好坏的评分线。日类型切换时坐标轴不变。</p></div><aside id="v-profile" class="v-profile" aria-live="polite"></aside></div>
 <div class="v-reading" id="v-behavior-reading" aria-live="polite"></div></section>
 <section class="v-section" id="v-change"><header class="v-heading"><div><span class="story-kicker">02 / WEDNESDAY → SATURDAY</span><h3>更热闹了，就留得更久吗？</h3><p>同一家商场，比较周三与周六。右移表示增加，左移表示减少。</p></div><label class="v-filter"><input type="checkbox" id="v-rising">只看人流密度增加的商场</label></header>
 <div id="v-facts" class="v-facts"></div><div class="v-instruction"><b>试一试</b>勾选右上角筛选，看看人流增加的商场，停留时间是否也增加。点击任意一行查看该店。</div>
 <div class="v-change-heading"><span>商场</span><span>人流密度 <small>人／公顷 · ○周三 → ●周六</small></span><span>平均停留 <small>分钟 · ○周三 → ●周六</small></span></div><div id="v-change-rows"></div><p id="v-change-note" class="v-chart-note"></p></section>
 <section class="v-section" id="v-transport"><header class="v-heading"><div><span class="story-kicker">03 / TEST THE TRANSPORT INTUITION</span><h3>交通更多，人流就一定更高？</h3><p>先看全部样本的关系，再看不符合直觉的具体商场。</p></div><div class="v-days" role="group" aria-label="切换交通关系图日期"><button data-day="wed" aria-pressed="true">周三</button><button data-day="sat" aria-pressed="false">周六</button></div></header>
 <div class="v-instruction"><b>这样读</b>越往右，地铁出入口越多；越往上，人流越密。点击一个点，再点「去地图找线索」。<span>顶部1／5 km只改变交通统计范围，LBS不随半径改变。</span></div>
 <div class="v-scope"><div role="group" aria-label="交通关系图片区筛选"><button data-area="all" aria-pressed="true">全部19家</button><button data-area="A" aria-pressed="false">● A片区</button><button data-area="B" aria-pressed="false">● B片区</button></div><span id="v-transport-scope"></span></div><div class="v-transport-top"><span>先看整体，再定位这组案例。</span><button id="v-case" class="story-outline-button" aria-pressed="false">突出案例：新天地时尚／紫荆广场 ↗</button></div>
 <div class="v-chart-layout"><div class="v-plot"><svg id="v-transit-scatter" role="group" aria-label="地铁出入口与人流密度关系图"></svg><p id="v-correlation" class="v-chart-note"></p></div><aside id="v-transit-profile" class="v-profile" aria-live="polite"></aside></div>
 <div class="v-case" id="v-case-evidence"></div><div class="v-reading"><b>看关系，也看例外。</b><p>交通条件与人流可能有关，但单一数量无法解释每家商场。回到地图，继续观察商业构成、道路和连接；不从一组对照推断因果。</p><button id="v-case-map">对读这两家商场的空间 →</button></div></section>
 <details class="v-method"><summary>这些图能说明什么？数据口径与限制</summary><p>三张图使用同一份LBS资料，是不同观察角度，不是三份独立证据。每家商场只有一组周三／周六行为值；19家不是38个独立样本。</p><p>人流密度单位为人／公顷，不是总客流；平均停留从小时换算为分钟，不等同购物时长或满意度。周三／周六不代表所有工作日／周末。采样点数是采样位置数，不是访客人数；13家仅有2个采样位置，源端密度分母与人员排除规则待核。</p><p>LBS为2023-06资料，POI为2024-07，品牌快照主要为2026。关系图是跨时点、19家样本内的探索性关联。相关系数为有效配对样本的Pearson r，不能证明因果；片区筛选后重新计算，不以选店缩减样本。</p><p>来源：整合交付包 / 04_456交接成果 / data / 02_商场中心点_LBS挂接_19.csv。所有行为值保留源值，缺失不填零。</p></details>`;
 story.prepend(root);
 // Full explanatory archive follows the spatial case rather than interrupting it.
 $('story-pairs').after(old);
 document.querySelector('.next-chapter-badge[href="#act-03"]').textContent='进入第三幕 / 人流与活力 ↓';
 $('act-03').querySelector('.scale-takeaway p').innerHTML='从人流与停留的差异，定位值得核查的空间连接。<br><small>下一步核查实际入口、过街与步行路径；OD与行为机制仍需进一步分析。</small>';
 $('source-dialog').querySelector('p').textContent='本页基于小组2026-11-18整合交付包。第三幕展示19家商场的LBS人流与停留、两日变化、交通关联及空间对读。第四至第六幕仍为预告。';
 const el=(tag,attrs,parent,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;parent.append(n);return n;};
 const plots={};
 function chart(id,transport){
   const svg=$(id),w=Math.max(320,Math.round(svg.parentElement.clientWidth)),h=w<500?390:470,p={l:58,r:22,t:42,b:58};svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.style.height=h+'px';
   let plot=plots[id];if(!plot){svg.replaceChildren();plot=plots[id]={back:el('g',{},svg),points:el('g',{},svg),labels:el('g',{'pointer-events':'none'},svg),nodes:{}};}
   plot.back.replaceChildren();plot.labels.replaceChildren();
   const data=scope().filter(m=>finite(density(m))&&finite(transport?metro(m):stay(m))),xMax=transport?Math.ceil(Math.max(1,...D.malls.map(metro).filter(finite))/10)*10:25000,yMin=transport?0:60,yMax=transport?25000:150;
   const x=v=>p.l+v/xMax*(w-p.l-p.r),y=v=>h-p.b-(v-yMin)/(yMax-yMin)*(h-p.t-p.b);
   if(!transport){el('rect',{x:p.l,y:p.t,width:w-p.l-p.r,height:h-p.t-p.b,fill:'#f2ebdd'},plot.back);el('rect',{x:x(refs.x),y:p.t,width:w-p.r-x(refs.x),height:y(refs.y)-p.t,fill:'#dce4dc'},plot.back);
     el('path',{d:`M${x(refs.x)} ${p.t}V${h-p.b}M${p.l} ${y(refs.y)}H${w-p.r}`,stroke:'#bca98a','stroke-dasharray':'4 5',fill:'none'},plot.back);
     [['较疏 · 较久',p.l+8,p.t+18,'start'],['较密 · 较久',w-p.r-8,p.t+18,'end'],['较疏 · 较短',p.l+8,h-p.b-12,'start'],['较密 · 较短',w-p.r-8,h-p.b-12,'end']].forEach(([t,xx,yy,anchor])=>el('text',{x:xx,y:yy,'text-anchor':anchor,class:'v-quadrant'},plot.back,t));}
   for(let i=0;i<=5;i++){const vx=xMax*i/5,vy=yMin+(yMax-yMin)*i/5;el('path',{d:`M${p.l} ${y(vy)}H${w-p.r}`,stroke:'#d9ccba','stroke-width':.6},plot.back);el('text',{x:p.l-9,y:y(vy)+4,'text-anchor':'end',class:'v-tick'},plot.back,fmt(vy));el('text',{x:x(vx),y:h-p.b+22,'text-anchor':'middle',class:'v-tick'},plot.back,fmt(vx));}
   el('text',{x:p.l,y:20,class:'v-axis'},plot.back,transport?'↑ 人流密度（人／公顷）':'↑ 平均停留（分钟）');el('text',{x:w-p.r,y:h-9,'text-anchor':'end',class:'v-axis'},plot.back,transport?`${S.radius/1000} km内地铁出入口（个） →`:'人流密度（人／公顷） →');
   for(const m of D.malls){let g=plot.nodes[m.id];if(!g){g=plot.nodes[m.id]=el('g',{class:'v-point',role:'button',tabindex:0,'data-id':m.id},plot.points);el('circle',{r:15,fill:'transparent'},g);el('circle',{r:7,fill:C[m.area],stroke:'#fff9ee','stroke-width':2},g);el('title',{},g);g.onclick=()=>ATLAS_SCALE.select(m.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();g.onclick();}};}
     const visible=data.includes(m);g.style.display=visible?'':'none';if(!visible)continue;
     const inCase=state.caseHighlighted&&transport&&['SHM000400','SHM000357'].includes(m.id);g.style.opacity=transport&&state.caseHighlighted&&!inCase&&S.selected!==m.id?'.25':'1';
     g.style.transform=`translate(${x(transport?metro(m):density(m))}px,${y(transport?density(m):stay(m))}px)`;g.classList.toggle('selected',S.selected===m.id);g.setAttribute('aria-pressed',String(S.selected===m.id));
     const text=`${m.name}，${dayLabel()}人流密度${fmt(density(m))}人每公顷，平均停留${fmt(stay(m),1)}分钟${transport?'，地铁出入口'+metro(m)+'个':''}`;g.setAttribute('aria-label',text);g.querySelector('title').textContent=text;
     if(S.selected===m.id||inCase){const xx=x(transport?metro(m):density(m)),yy=y(transport?density(m):stay(m)),right=xx>w*.6;el('text',{x:xx+(right?-12:12),y:yy-15,'text-anchor':right?'end':'start',class:'v-point-label'},plot.labels,m.name);}
   }
   return data;
 }
 function mapFor(id){const m=row(id);let other;if(['SHM000400','SHM000357'].includes(id))other=row(id==='SHM000400'?'SHM000357':'SHM000400');else other=D.malls.filter(n=>n.area!==m.area).sort((a,b)=>Math.abs(metro(a)-metro(m))-Math.abs(metro(b)-metro(m)))[0];ATLAS_SCALE.select(id);ATLAS_STORY.compare(m.area==='A'?id:other.id,m.area==='B'?id:other.id);$('story-pairs').scrollIntoView({behavior:'smooth',block:'start'});}
 function profile(id){const box=$(id),m=row(S.selected);box.replaceChildren();
   if(!m){box.innerHTML='<span class="story-kicker">YOUR NEXT MOVE</span><h4>点一家，<br>读懂一个点。</h4><p>点击图中的红点或蓝点，查看商场名称、人流密度与停留时间。</p><div class="v-profile-legend"><span style="color:#a14831">● A片区 · 10家</span><span style="color:#456572">● B片区 · 9家</span></div>';return;}
   const r=V[m.id];box.innerHTML=`<span class="story-kicker">${m.label} / ${dayLabel()}</span><h4>${m.name}</h4><div class="v-number"><strong>${fmt(density(m))}</strong><span>人／公顷 · 人流密度</span></div><div class="v-number"><strong>${fmt(stay(m),1)}</strong><span>分钟 · 平均停留</span></div><p>${S.radius/1000} km内地铁出入口 <b>${fmt(metro(m))}</b> 个</p><small>源采样位置 ${fmt(r.samples)} 个；不是访客人数。${state.area!=='all'&&state.area!==m.area?'当前商场在所选片区外，图中已隐藏。':''}</small>`;
   const b=document.createElement('button');b.textContent='去地图找线索 →';b.onclick=()=>mapFor(m.id);box.append(b);
 }
 function changeRows(){const all=scope(),inc=all.filter(m=>V[m.id].satDensity>V[m.id].wedDensity),short=all.filter(m=>V[m.id].satStay<V[m.id].wedStay),both=inc.filter(m=>V[m.id].satStay<V[m.id].wedStay);
   $('v-facts').innerHTML=[[inc.length,'周六人流更密'],[short.length,'周六停留更短'],[both.length,'同时更密、停留更短']].map(([n,t])=>`<div><strong>${n}<small> / ${all.length} 家</small></strong><span>${t}</span></div>`).join('');
   const rows=state.rising?inc:all;const target=$('v-change-rows');target.replaceChildren();
   rows.forEach(m=>{const r=V[m.id],button=document.createElement('button');button.className='v-change-row';button.dataset.id=m.id;button.setAttribute('aria-pressed',String(S.selected===m.id));button.innerHTML=`<span class="v-change-name"><i style="background:${C[m.area]}">${m.label}</i>${m.name}</span>`;
     for(const kind of ['Density','Stay']){const before=r['wed'+kind]*(kind==='Stay'?60:1),after=r['sat'+kind]*(kind==='Stay'?60:1),delta=after-before,max=kind==='Stay'?150:25000;const cell=document.createElement('span');cell.className='v-change-cell';cell.innerHTML=`<span class="v-change-values">${fmt(before,kind==='Stay'?1:0)} → ${fmt(after,kind==='Stay'?1:0)} <b class="${delta>0?'up':'down'}">${delta>0?'↑':'↓'} ${fmt(Math.abs(delta)/before*100,1)}%</b></span><span class="v-dumbbell"><i style="left:${Math.min(before,after)/max*100}%;width:${Math.abs(delta)/max*100}%;background:${delta>0?'#527969':'#a67751'}"></i><em style="left:${before/max*100}%"></em><b style="left:${after/max*100}%;background:${C[m.area]}"></b></span>`;button.append(cell);}
     button.onclick=()=>{ATLAS_SCALE.select(m.id);$('v-behavior').scrollIntoView({behavior:'smooth',block:'start'});};target.append(button);
   });$('v-change-note').textContent=`当前展示 ${rows.length}/${all.length} 家。两列分别使用固定刻度：人流密度0—25,000人／公顷，停留0—150分钟；圆点之间的线仅连接两日观测，没有中间日期数据。`;
 }
 function update(){root.querySelectorAll('[data-day]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.day===state.day)));root.querySelectorAll('[data-area]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.area===state.area)));
   const a=chart('v-scatter',false),b=chart('v-transit-scatter',true);$('v-count').textContent=`${dayLabel()} · 有效 ${a.length} 家 · 红 A / 蓝 B`;
   profile('v-profile');profile('v-transit-profile');changeRows();
   $('v-behavior-reading').innerHTML=`<b>活力有两个维度。</b><p>当前${dayLabel()}，图中的横向差别表示人流密度，纵向差别表示平均停留。切换日期时，同一家商场会移动到另一日的位置；来访更密并不自动意味着停留更久。</p>`;
   $('v-transport-scope').textContent=`${dayLabel()} · ${S.radius/1000} km环境 · ${state.area==='all'?'全部片区':state.area+'片区'} · 有效 ${b.length} 家`;
   $('v-correlation').textContent=`当前可见样本 Pearson r = ${fmt(pearson(b),2)}，n = ${b.length}。这是样本内的线性关联，不能解释原因；可用上方片区筛选，比较合并与分区结果。`;
   const pair=['SHM000400','SHM000357'].map(row),delta=metro(pair[0])-metro(pair[1]),dd=density(pair[0])-density(pair[1]);
   $('v-case-evidence').innerHTML=`<div><span class="story-kicker">A CONCRETE CONTRAST / 全样本之外，看一组对照</span><h4>${delta>0&&dd<0?'出入口更多，人流却没有更密。':'同一组商场，换个尺度再看。'}</h4><p>已观测品牌数114／115，规模相近。此处对照固定为这两家，不随片区筛选改变。</p></div><table><thead><tr><th>商场</th><th>${S.radius/1000} km地铁口</th><th>${dayLabel()}人流密度<br><small>人／公顷</small></th></tr></thead><tbody>${pair.map(m=>`<tr><th>${m.name}</th><td>${fmt(metro(m))}</td><td>${fmt(density(m))}</td></tr>`).join('')}</tbody></table>`;
 }
 root.querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{state.day=b.dataset.day;update();});root.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>{state.area=b.dataset.area;update();});$('v-rising').onchange=e=>{state.rising=e.target.checked;changeRows();};
 $('v-case').onclick=()=>{state.area='all';state.caseHighlighted=!state.caseHighlighted;$('v-case').setAttribute('aria-pressed',String(state.caseHighlighted));$('v-case').textContent=state.caseHighlighted?'恢复全部点的显示':'突出案例：新天地时尚／紫荆广场 ↗';ATLAS_SCALE.select('SHM000400');update();$('v-transit-scatter').scrollIntoView({behavior:'smooth',block:'center'});};$('v-case-map').onclick=()=>mapFor('SHM000400');
 document.addEventListener('atlas:analysis-change',update);
 let raf;new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{chart('v-scatter',false);chart('v-transit-scatter',true);});}).observe(root);
 update();window.ATLAS_VITALITY_VIEW={state,refs,pearson,mapFor};
})();
