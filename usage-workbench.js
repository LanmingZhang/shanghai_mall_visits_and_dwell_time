/* Act 04: explain the behaviour plot, then read conditions in the map's lower deck. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),D=ATLAS_DATA,V=ATLAS_VITALITY.records,M=ATLAS_METRICS,R=ATLAS_RESEARCH,B=ATLAS_MORPHOLOGY;
 const controller=ATLAS_RESEARCH_VIEW,S=controller.state;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=(x,d=0)=>Number.isFinite(x)?x.toLocaleString('zh-CN',{maximumFractionDigits:d}):'暂无记录';
 const c={A:'#a45c42',B:'#487380',neutral:'#a5b3b7'},mall=()=>D.malls.find(m=>m.id===S.mall);
 
 const commercial=id=>ATLAS_ABCD_LOCAL[id]?.secondary;
 const median=a=>{a=[...a].sort((a,b)=>a-b);return (a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2;};
 const reference={density:median(Object.values(V).flatMap(r=>[r.wedDensity,r.satDensity])),stay:median(Object.values(V).flatMap(r=>[r.wedStay*60,r.satStay*60]))};
 const maxima={density:Math.ceil(Math.max(...Object.values(V).flatMap(r=>[r.wedDensity,r.satDensity]))/5000)*5000,stay:Math.ceil(Math.max(...Object.values(V).flatMap(r=>[r.wedStay*60,r.satStay*60]))/30)*30};
 const node=(tag,attrs,parent,text)=>{const n=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));if(text!==undefined)n.textContent=text;parent.append(n);return n;};
 const host=$('research-workbench');host.className='usage-workbench';
  host.innerHTML=`
 <section id="usage-overview" class="u-overview"><header class="u-board-head"><div><span class="r-kicker">01 / 使用表现全景</span><h3>向右，人流更密。向上，停留更久。</h3><p>每个圆点是一家商场。点选它，右侧显示两日变化，下方地图与指标同步定位。</p></div><div class="u-day-controls"><span>查看哪一天</span><div class="r-segment"><button data-u-day="wed">周三</button><button data-u-day="sat">周六</button></div></div></header>
 <div class="u-scope-controls"><div class="r-segment"><button data-u-scope="local">两个片区 · 19家</button><button data-u-scope="city">全市背景 · 170家汇总</button></div><p id="u-scope-description"></p></div>
 <div class="u-behavior-layout"><div class="u-main-plot"><svg id="u-behavior" viewBox="0 0 840 500" role="group" aria-label="横向为来访密度，纵向为平均停留时长；红蓝线为两片区的线性趋势，圆点可用键盘选择"></svg><div id="u-plot-legend" class="u-plot-legend"></div><p class="u-axis-note" id="u-axis-note"></p><div class="u-options" id="u-options"><label><input type="checkbox" id="u-similar">叠加商业线索：突出与当前商场配置接近的对象</label><p id="u-similar-note" aria-live="polite"></p></div></div><aside id="u-day-story" class="u-day-story" aria-live="polite"></aside></div>
  </section>
 <div class="u-to-conditions"><span>从使用表现，回到城市空间 ↓</span><h3>这家商场，处在怎样的环境里？</h3><p>商业、建筑、交通与周边目的地在同一张工作台里查看。点击 A/B/C/D 切换条件，读数直接出现在地图下半部。</p></div>`;

 // Keep the existing map objects and listeners; change the container, not the maps.
 const old=$('metrics-explorer'),explorer=document.createElement('section');explorer.id='metrics-explorer';explorer.className='usage-spatial-workbench';
 while(old.firstChild){const child=old.firstChild;if(child.tagName==='SUMMARY')child.remove();else explorer.append(child);}
 old.replaceWith(explorer);host.append(explorer);
 const workspace=explorer.querySelector('.metrics-workspace');
 workspace.querySelector('.plate-heading').innerHTML='<span>03 <b>空间条件工作台 / 图与数在一起</b></span><span>点击地图选店 · 下半部同步读数</span>';
 const localControls=document.createElement('div');localControls.className='u-map-controls';localControls.innerHTML=`<label>当前商场<select id="u-map-mall" aria-label="地图工作台选择商场">${D.malls.map(m=>`<option value="${m.id}">${m.label} ${esc(m.name)}</option>`).join('')}</select></label><div><span>环境范围</span><button data-u-radius="1000">1km</button><button data-u-radius="5000">5km</button></div><p id="u-fixed-radius-note"></p><button id="u-show-behavior">↑ 看这家的使用表现</button>`;
 workspace.querySelector('.plate-heading').after(localControls);
 const dock=document.createElement('div');dock.id='u-map-data';dock.className='u-map-data';
 dock.innerHTML='<div class="u-dock-title"><span>地图下半部 / 当前条件的读数</span><span id="u-dock-selection"></span></div>';
 const charts=$('metric-charts'),chartHead=workspace.querySelector('.metric-chart-heading');dock.append(chartHead,charts);
 $('metrics-maps').append(dock);
 // Put context and legend with the maps, not in a separate report below them.
 const legend=workspace.querySelector('.metric-map-legend');dock.prepend(legend);
 const evidence=document.createElement('div');evidence.id='u-morphology-evidence';evidence.className='u-morphology-evidence';dock.append(evidence);
 const method=workspace.querySelector('.metrics-method'),methodSection=document.createElement('section');methodSection.className='u-method';methodSection.innerHTML='<h4>统计范围与数据口径</h4>';
 const content=method.querySelector('div');methodSection.append(content);method.replaceWith(methodSection);
 content.insertAdjacentHTML('afterbegin','<p><b>B组补强已接入：</b>商业楼层标签与历史总层数分列；周边建筑按1／5 km分别统计；110条入口POI经名称与位置筛查，覆盖16家，另有11条待核，不计入入口读数。周边高度单位待核。</p>');
  const morphologyDefinitions=M.definitions.filter(d=>d.group==='B');
  explorer.querySelector('#metric-groups [data-group="B"]').innerHTML='<b>B</b> 建筑特征';
 $('u-map-mall').onchange=e=>select(e.target.value);
 document.querySelectorAll('[data-u-radius]').forEach(b=>b.onclick=()=>$('radius-'+b.dataset.uRadius).click());
 $('u-show-behavior').onclick=()=>$('usage-overview').scrollIntoView({behavior:'smooth'});
 const satelliteButton=document.createElement('button');satelliteButton.id='u-satellite';satelliteButton.textContent='查看卫星近景 ↗';satelliteButton.onclick=()=>ATLAS_DETAIL.openSatellite(S.mall);$('u-show-behavior').before(satelliteButton);
 document.querySelectorAll('[data-u-day]').forEach(b=>b.onclick=()=>{S.day=b.dataset.uDay;render();});
 document.querySelectorAll('[data-u-scope]').forEach(b=>b.onclick=()=>{S.scope=b.dataset.uScope;render();});
 $('u-similar').onchange=e=>{S.similar=e.target.checked;render();};
 function select(id){S.scope='local';controller.choose(id);}
 function renderPlot(){
   const city=S.scope==='city',svg=$('u-behavior');svg.replaceChildren();
   const compact=window.matchMedia('(max-width:570px)').matches,width=compact?500:840,left=compact?62:74,right=width-(compact?20:46),span=right-left;
   svg.setAttribute('viewBox',`0 0 ${width} 500`);
   const xmax=city?Math.max(R.aggregate.wed.xmax,R.aggregate.sat.xmax):maxima.density;
   const ymax=city?Math.max(R.aggregate.wed.ymax,R.aggregate.sat.ymax):maxima.stay;
   const x=v=>left+v/xmax*span,y=v=>423-v/ymax*351;
    node('rect',{x:left,y:72,width:span,height:351,fill:'#fbf7ee'},svg);
   for(let i=0;i<=4;i++){const xx=left+i*span/4,yy=423-i*351/4;node('line',{x1:xx,x2:xx,y1:72,y2:423,stroke:'#d6cbbb','stroke-dasharray':'2 6'},svg);node('line',{x1:left,x2:right,y1:yy,y2:yy,stroke:'#d6cbbb','stroke-dasharray':'2 6'},svg);node('text',{x:xx,y:446,'text-anchor':'middle'},svg,fmt(xmax*i/4));node('text',{x:left-13,y:yy+4,'text-anchor':'end'},svg,fmt(ymax*i/4));}
   node('text',{x:left,y:35,class:'u-axis-label'},svg,'↑ 平均停留时长（分钟）');node('text',{x:right,y:482,'text-anchor':'end',class:'u-axis-label'},svg,'来访密度（人／公顷） →');
   if(city){
     const a=R.aggregate[S.day],max=Math.max(...a.bins.map(b=>b[2]));
     a.bins.forEach(([bx,by,n])=>{const g=node('g',{},svg);node('rect',{x:x(bx*a.xstep)+1,y:y((by+1)*a.ystep)+1,width:span*a.xstep/xmax-2,height:351*a.ystep/ymax-2,fill:'#a66846',opacity:.12+.88*n/max},g);node('title',{},g,`${bx*a.xstep}–${(bx+1)*a.xstep}人/公顷，${by*a.ystep}–${(by+1)*a.ystep}分钟：${n}家`);});
     $('u-plot-legend').innerHTML='<i class="r-key-gradient"></i> 色块越深，落在这个范围内的商场越多。';
     $('u-axis-note').textContent='每格2000人/公顷 × 15分钟。170家是既有关联候选交集，仍需审核；这里只呈现汇总。';
   }else{
     const clip=node('clipPath',{id:'u-fit-clip'},node('defs',{},svg));
      node('rect',{x:left,y:72,width:span,height:351},clip);
      const fitLayer=node('g',{'clip-path':'url(#u-fit-clip)','aria-hidden':'true'},svg);
      for(const area of ['A','B']){
        const pairs=D.malls.filter(m=>m.area===area).map(m=>[V[m.id]?.[S.day+'Density'],V[m.id]?.[S.day+'Stay']*60]).filter(pair=>pair.every(Number.isFinite));
        if(pairs.length<2)continue;
        const mean=i=>pairs.reduce((sum,row)=>sum+row[i],0)/pairs.length;
        const mx=mean(0),my=mean(1),xx=pairs.reduce((sum,[a])=>sum+(a-mx)**2,0);
        if(xx===0)continue;
        const slope=pairs.reduce((sum,[a,b])=>sum+(a-mx)*(b-my),0)/xx;
        const lo=Math.min(...pairs.map(row=>row[0])),hi=Math.max(...pairs.map(row=>row[0]));
        node('line',{x1:x(lo),x2:x(hi),y1:y(my+slope*(lo-mx)),y2:y(my+slope*(hi-mx)),stroke:c[area],'stroke-width':2.4,'vector-effect':'non-scaling-stroke','data-area-fit':area,'data-slope':slope},fitLayer);
      }
     const near=controller.closeIds();
     [...D.malls.filter(m=>m.id!==S.mall),mall()].forEach(m=>{
       const r=V[m.id],xx=x(r[S.day+'Density']),yy=y(r[S.day+'Stay']*60),chosen=m.id===S.mall,linked=!!commercial(m.id),dim=S.similar&&!near.includes(m.id);
       const g=node('g',{tabindex:0,role:'button',class:'u-mall-point','data-id':m.id,'aria-pressed':String(chosen),'aria-label':`${m.label} ${m.name}，密度${fmt(r[S.day+'Density'])}人每公顷，平均停留${fmt(r[S.day+'Stay']*60,1)}分钟${linked?'':'，仅展示使用表现'}`,opacity:dim?.2:1},svg);
       node('circle',{cx:xx,cy:yy,r:19,fill:'transparent'},g);node('circle',{cx:xx,cy:yy,r:chosen?11:8,fill:c[m.area],stroke:chosen?'#24484c':'#fff7e8','stroke-width':chosen?3:1.5},g);
       node('title',{},g,m.name+(linked?'':' · 未纳入二级业态比较'));
       if(chosen){node('circle',{cx:xx,cy:yy,r:17,fill:'none',stroke:'#34565a','stroke-width':1},g);node('text',{x:Math.min(right-80,Math.max(left+80,xx)),y:Math.max(64,yy-25),'text-anchor':'middle',class:'u-selected-name'},svg,m.name);}
       g.onclick=()=>select(m.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(m.id);}};
     });
     $('u-plot-legend').innerHTML=`<span><i style="background:${c.A}"></i>A片区 · 线性趋势</span><span><i style="background:${c.B}"></i>B片区 · 线性趋势</span>`;
      $('u-axis-note').textContent='';
   }
   $('u-options').hidden=city;
   $('u-similar').checked=S.similar;$('u-similar').disabled=!commercial(S.mall);
   $('u-similar-note').textContent=!commercial(S.mall)?'这家保留在来访与停留分析中；暂不参与二级业态配对。':S.similar?`除当前商场外，有${controller.closeIds().length-1}家二级组成重合度≥70%。其余点淡化保留；70%仅是探索阈值。`:'可选操作：在15家有新版二级业态数据的对象中，突出二级组成重合度≥70%的商场。不影响下方完整环境数据。';
 }
 function graphicRows(key,max,unit){
   const r=V[S.mall],factor=key==='Stay'?60:1;
   return `<div class="u-two-days">${[['wed','周三'],['sat','周六']].map(([d,t])=>`<div class="u-day-row ${d===S.day?'active':''}"><span>${t}</span><div><i style="width:${r[d+key]*factor/max*100}%"></i></div><b>${fmt(r[d+key]*factor,key==='Stay'?1:0)}<small>${unit}</small></b></div>`).join('')}</div>`;
 }
 function renderDayStory(){
   if(S.scope==='city'){$('u-day-story').innerHTML='<span class="r-kicker">CITY CONTEXT / 全市背景</span><h3>放大到全市，<br>看使用表现的分布。</h3><div class="u-city-number">170</div><p>来自533家现状商业与256家LBS母样本的既有关联交集。</p><p>切换周三／周六，看整体分布怎样变化。此视图不逐商场公开LBS值。</p><button id="u-return-local">回到19家，查看具体商场 →</button>';$('u-return-local').onclick=()=>{S.scope='local';render();};return;}
   const m=mall(),r=V[m.id],dd=r.satDensity-r.wedDensity,dt=(r.satStay-r.wedStay)*60;
   const finding=Math.abs(dd)<1e-7?'两天人流密度相同':dd>0?'周六人流更密':'周六人流更疏';
   const stayFinding=Math.abs(dt)<1e-7?'平均停留相同':dt>0?'平均停留更久':'平均停留更短';
   $('u-day-story').innerHTML=`<span class="r-kicker">选中的商场 / ${m.label}</span><h3>${esc(m.name)}</h3><span class="u-two-day-caption">同一家，周三与周六一起看</span><div class="u-outcome-block"><h4><span>↔</span> 人流密度</h4>${graphicRows('Density',maxima.density,'人/公顷')}</div><div class="u-outcome-block"><h4><span>◷</span> 平均停留</h4>${graphicRows('Stay',maxima.stay,'分钟')}</div><div class="u-selected-finding"><strong>${finding}，<br>${stayFinding}。</strong><p>密度${dd>=0?'增加':'减少'}${fmt(Math.abs(dd/r.wedDensity*100),1)}%；停留${dt>=0?'增加':'减少'}${fmt(Math.abs(dt),1)}分钟。</p></div><button class="u-go-map" id="u-go-map">到下方地图，看它的空间条件 ↓</button><p class="u-small">LBS：2023-06。这里只比较资料中的周三与周六，不外推到所有工作日和周末。</p>`;
   $('u-go-map').onclick=()=>$('metrics-explorer').scrollIntoView({behavior:'smooth'});
 }
 function renderMorphology(){
   const m=mall(),r=B.records[m.id],group=ATLAS_ANALYSIS.group;
   evidence.hidden=true;
   $('u-map-mall').value=m.id;
   $('u-dock-selection').textContent=`${m.label} ${m.name} · 与所在片区作参照`;
   document.querySelectorAll('[data-u-radius]').forEach(b=>b.setAttribute('aria-pressed',String(+b.dataset.uRadius===ATLAS_ANALYSIS.radius)));
   const d=M.definitions.find(d=>d.id===ATLAS_ANALYSIS.detail);
   $('u-fixed-radius-note').textContent='';
 }
 function render(){
   if(!D.malls.some(m=>m.id===S.mall))S.mall=D.malls[0].id;
   document.querySelectorAll('[data-u-day]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.uDay===S.day)));
   document.querySelectorAll('[data-u-scope]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.uScope===S.scope)));
   $('u-scope-description').textContent=S.scope==='local'?'先读图，再点选；无须先理解统计指标。':'全市候选交集只显示汇总；下方地图仍为两个片区的19家。';
   renderPlot();renderDayStory();renderMorphology();
 }
 // Public inspection helpers support checks of the actual encodings, not screenshots alone.
 window.ATLAS_USAGE_VIEW={render,select,reference,maxima,morphologyDefinitions};
 let resizeFrame;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(renderPlot);});
 render();
 if(['#act-04','#metrics-explorer'].includes(location.hash))controller.choose(S.mall);
 else {const observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){if(!ATLAS_ANALYSIS.selected)controller.choose(S.mall);observer.disconnect();}},{threshold:0});observer.observe($('usage-overview'));}
 document.querySelector('#source-dialog>p').textContent='第一、二幕认识片区与尺度；第三幕呈现533家配置共性；第四幕解释使用表现，并把全部指标与空间图层直接展开，数据嵌入地图下半部。ABCD使用11月19日交接版；原网页LBS与533家城市背景作为不同口径保留。第五幕为待实施联合模型，第六幕为空间案例核查。';
 // Existing source descriptions remain valid: actual height and certified entrances are still unavailable.
 $('metrics-explorer').querySelector('.metrics-method')?.remove();
 if(location.hash==='#act-04')requestAnimationFrame(()=>$('act-04').scrollIntoView({behavior:'instant'}));
})();
