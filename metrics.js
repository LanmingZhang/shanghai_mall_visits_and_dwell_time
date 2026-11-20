/* Act 03: audited explanatory indicators, shared analysis state, spatial evidence. */
(() => {
  'use strict';
  const D=ATLAS_DATA,M=ATLAS_METRICS,S=ATLAS_ANALYSIS,{geo,colors,paths,svgNode}=ATLAS_SHARED;
  const $=id=>document.getElementById(id),defs=M.definitions;
  const groups={A:'商业内容',B:'建筑特征',C:'城市区位交通与背景',D:'周边活动目的地'};
  const representatives=['brands','functionLower','metro','diversity'];
  const fmt=v=>v===null||v===undefined?'暂无数据':Number(v).toLocaleString('zh-CN',{maximumFractionDigits:2});
  const metricFormat=(v,d)=>v===null||v===undefined?'暂无数据':Number(v).toLocaleString('zh-CN',{maximumFractionDigits:d.unit==='0–1'?3:2});
  const valueUnit=d=>d.unit==='0–1'||d.unit==='—'?'':d.unit;
  function niceMax(value){const magnitude=10**Math.floor(Math.log10(Math.max(value,.001)));return Math.ceil(value/(magnitude/2))*(magnitude/2);}
  function value(m,d){const v=M.records[m.id][d.id];return d.scope==='mall'?(v??null):(v?.[String(S.radius)]??null);}
  function stats(area,d){const values=D.malls.filter(m=>m.area===area).map(m=>value(m,d)).filter(v=>typeof v==='number'&&Number.isFinite(v));return {n:values.length,mean:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};}
  function groupButton(group){ATLAS_SCALE.setGroup(group);}
  function detailButton(id){ATLAS_SCALE.setDetail(id);}
  document.querySelectorAll('#metric-groups button').forEach(b=>b.onclick=()=>groupButton(b.dataset.group));
  const selectedMetric=()=>defs.find(d=>d.id===S.detail);
  const skeleton123=M.layers.roads123.map(g=>{const path=new Path2D(paths(g));const coords=g.type==='LineString'?g.coordinates:g.coordinates.flat();const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);return {path,bounds:[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]};});
  let frame=0,lastRadius=S.radius;
  const maps=['A','B'].map(area=>{
    const el=$('metrics-map-'+area.toLowerCase()),malls=D.malls.filter(m=>m.area===area),xs=malls.map(m=>m.xy[0]),ys=malls.map(m=>m.xy[1]);
    return {area,el,malls,canvas:el.querySelector('canvas'),svg:el.querySelector('svg'),zoom:1,offset:[0,0],center:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],span:[Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)]};
  });
  function mapRadius(){return selectedMetric()?.fixedRadius||S.radius;}
  function dimensions(map){const w=map.el.clientWidth,h=map.el.clientHeight,r=mapRadius();const scale=Math.min((w-65)/(map.span[0]+r*2),(h-65)/(map.span[1]+r*2))*map.zoom;const cx=map.center[0]+map.offset[0],cy=map.center[1]+map.offset[1];return {w,h,scale,tx:w/2-cx*scale,ty:h/2-cy*scale};}
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;maps.forEach(drawMap);});}
  function circlePath(malls){const p=new Path2D(),r=mapRadius();malls.forEach(m=>{p.moveTo(m.xy[0]+r,m.xy[1]);p.arc(m.xy[0],m.xy[1],r,0,Math.PI*2);p.closePath();});return p;}
  function drawMap(map){
    const {w,h,scale,tx,ty}=dimensions(map);if(!w||!h)return;
    const dpr=Math.min(devicePixelRatio||1,2);if(map.canvas.width!==Math.round(w*dpr)||map.canvas.height!==Math.round(h*dpr)){map.canvas.width=Math.round(w*dpr);map.canvas.height=Math.round(h*dpr);}
    const ctx=map.canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*tx,dpr*ty);
    const extent=[-tx/scale,-ty/scale,(w-tx)/scale,(h-ty)/scale],visible=o=>o.bounds[0]<extent[2]&&o.bounds[2]>extent[0]&&o.bounds[1]<extent[3]&&o.bounds[3]>extent[1];
    ctx.fillStyle='#d2d8d3';geo.water.filter(visible).forEach(o=>ctx.fill(o.path,'evenodd'));
    ctx.fillStyle='#d5d1c7';geo.buildings.filter(visible).forEach(o=>ctx.fill(o.path,'evenodd'));
    ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#fcf8f0';ctx.lineWidth=(S.radius===1000?1.6:1)/scale;geo.roads.filter(visible).forEach(o=>ctx.stroke(o.path));
    ctx.lineWidth=.9/scale;geo.streets.filter(visible).forEach(o=>ctx.stroke(o.path));
    const m=D.malls.find(m=>m.id===S.selected),active=S.selected?map.malls.filter(x=>x.id===S.selected):map.malls;
    if(active.length){ctx.fillStyle=colors[map.area]+'09';ctx.fill(circlePath(active));}
    if(m&&m.area===map.area){ctx.strokeStyle=colors[map.area]+'bb';ctx.lineWidth=1.2/scale;ctx.stroke(circlePath(active));}
    const d=selectedMetric();
    let highlighted=0;
    if(d?.layer&&active.length){
      ctx.save();if(d.layer!=='mallGates')ctx.clip(circlePath(active),'nonzero');
      if(d.layer==='roads123'){
        ctx.strokeStyle=colors[map.area];ctx.lineWidth=(S.radius===1000?2.1:1.4)/scale;
        skeleton123.filter(visible).forEach(o=>ctx.stroke(o.path));
      }else{
        ctx.fillStyle=colors[map.area];ctx.strokeStyle='#fffaf1';ctx.lineWidth=.5/scale;
        const radius=S.radius===1000?2.3:1.6;
        M.layers[d.layer].forEach(p=>{
          if(d.layer==='mallGates'?!active.some(m=>m.id===p.mall_id):!active.some(m=>(m.xy[0]-p.xy[0])**2+(m.xy[1]-p.xy[1])**2<=S.radius*S.radius))return;
          highlighted++;ctx.beginPath();ctx.arc(p.xy[0],p.xy[1],radius/scale,0,2*Math.PI);ctx.fill();ctx.stroke();
        });
      }
      ctx.restore();
    }
    const focused=map.svg.contains(document.activeElement)?document.activeElement.dataset.id:null;
    map.svg.replaceChildren();map.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);map.el.dataset.radius=mapRadius();map.el.dataset.layer=d?.layer||'none';map.el.dataset.highlighted=highlighted;
    let gridStep=mapRadius()<=1000?500:1000;
    if(map.el.closest('.single-screen-workspace'))while(gridStep*scale<22)gridStep*=2;
    ATLAS_GRID.draw(map.svg,{w,h,scale,tx,ty,step:gridStep});
    const area=D.areas.find(a=>a.area===map.area);svgNode('path',{d:paths(area.geometry),transform:`translate(${tx},${ty}) scale(${scale})`,fill:'none',stroke:'#8b7d6a','stroke-width':.8,'stroke-dasharray':'4 4','vector-effect':'non-scaling-stroke','pointer-events':'none'},map.svg);
    [...map.malls].sort((a,b)=>(a.id===S.selected?1:0)-(b.id===S.selected?1:0)).forEach(m=>{
      const x=m.xy[0]*scale+tx,y=m.xy[1]*scale+ty,chosen=m.id===S.selected;if(x< -15||x>w+15||y< -15||y>h+15)return;
      const g=svgNode('g',{transform:`translate(${x},${y})`,role:'button',tabindex:0,class:'metrics-marker','data-id':m.id,'aria-pressed':String(chosen),'aria-label':m.label+' '+m.name},map.svg);
      svgNode('title',{},g,m.label+' · '+m.name);svgNode('circle',{r:14,fill:'transparent'},g);
      if(chosen)svgNode('circle',{r:13,fill:'none',stroke:colors[map.area],'stroke-width':1.3},g);
      svgNode('circle',{r:S.radius===1000?8:5,fill:chosen||!S.selected?colors[map.area]:'#a9a79e',stroke:'#fff9ed','stroke-width':1.2},g);
      if(S.radius===1000)svgNode('text',{x:0,y:3,'text-anchor':'middle','font-size':8,'font-family':'Arial',fill:'#fff'},g,m.label.slice(1));
      if(chosen){const width=m.name.length*10+12,lx=Math.max(5,Math.min(w-width-5,x+17)),ly=Math.max(42,y-18);svgNode('rect',{x:lx-4,y:ly-12,width,height:20,fill:'#fff8ed',stroke:colors[map.area]+'60','pointer-events':'none'},map.svg);svgNode('text',{x:lx,y:ly+2,fill:colors[map.area],'font-size':10,'pointer-events':'none'},map.svg,m.name);}
      g.onclick=()=>ATLAS_SCALE.select(m.id);g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ATLAS_SCALE.select(m.id);}};
    });
    if(focused)map.svg.querySelector(`[data-id="${focused}"]`)?.focus({preventScroll:true});
    if(d?.layer==='mallGates')M.layers.mallGates.filter(p=>active.some(m=>m.id===p.mall_id)).forEach(p=>{
      const x=p.xy[0]*scale+tx,y=p.xy[1]*scale+ty;if(x<0||x>w||y<0||y>h)return;
      const g=svgNode('g',{transform:`translate(${x},${y})`,tabindex:0,role:'button',class:'morphology-candidate','aria-label':`${p.label} ${p.name} · 筛查纳入的入口记录`},map.svg);
      svgNode('circle',{r:7,fill:'#f5faf1',stroke:'#268374','stroke-width':1.5},g);svgNode('title',{},g,`${p.label} ${p.name} · ${p.status}`);
      const show=()=>{$('metric-spatial-status').textContent=`${p.label} · ${p.name}：${p.status} · ${p.reason}。筛查记录不等于完整公众入口。`;};g.onclick=show;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();show();}};
    });
    const meters=mapRadius()<=1000?500:2000;
    map.el.querySelector('.metric-map-scale').innerHTML=`${meters>=1000?meters/1000+' km':meters+' m'}<div style="width:${meters*scale}px"></div>`;
    map.el.closest('section').querySelector('.metrics-map-caption').textContent=d?.layer?(S.selected&&m?.area!==map.area?'对照片区 · 灰底保留':d.title+(d.layer==='mallGates'?' · 商场入口定位':' · 圈内专题背景')):'抽象底图 · 商场点位';
  }
  function makeButton(text,onClick,className){const b=document.createElement('button');b.type='button';b.className=className||'';b.textContent=text;b.onclick=onClick;return b;}
  function card(d,overview=false){
    const el=document.createElement('article');el.className='metric-card';el.dataset.metric=d.id;
    const top=document.createElement('div');top.className='metric-card-heading';
    const title=document.createElement('h4');title.className='metric-card-title';title.textContent=d.title;top.append(title);
    const tag=document.createElement('span');tag.className='metric-unit';tag.textContent=d.unit;top.append(tag);el.append(top);
    const meta=document.createElement('div');meta.className='metric-card-meta';meta.textContent=`${d.group} / ${groups[d.group]} · ${d.fixedRadius?'固定 '+d.fixedRadius+' m 周边背景':d.layer==='mallGates'?'筛查纳入清单 · 非完整公众入口':d.scope==='mall'?'商场属性 · 不随半径改变':S.radius/1000+' km 环境统计'}`;el.append(meta);
    const m=D.malls.find(m=>m.id===S.selected);
    if(d.kind==='category')categorical(el,d,m);else numeric(el,d,m);
    if(overview)el.append(makeButton('查看 '+d.group+' 组全部指标 ↗',()=>groupButton(d.group),'metric-group-link'));
    return el;
  }
  function numeric(el,d,m){
    const values=m?[{name:m.name,value:value(m,d),n:value(m,d)===null?0:1,area:m.area,selected:true}, {...stats(m.area,d),name:m.area+'片区均值（含该店）',value:stats(m.area,d).mean,area:m.area,reference:true}]:['A','B'].map(area=>({...stats(area,d),name:area+'片区均值',value:stats(area,d).mean,area}));
    const all=D.malls.map(m=>value(m,d)).filter(v=>typeof v==='number');
    const max=Math.max(1,...all);const axisMax=d.unit==='%'?100:d.unit==='0–1'?1:niceMax(max*1.02);
    el.dataset.axisMax=axisMax;
    const holder=document.createElement('div');holder.className='metric-bars';
    for(const v of values){
      if(v.value===null){if(v.selected){const missing=document.createElement('p');missing.className='current-missing';missing.textContent=v.name+' · 暂无数据';holder.append(missing);}continue;}
      const row=document.createElement('div');row.className='metric-bar-row';row.dataset.area=v.area;row.dataset.value=v.value===null?'NA':v.value;row.dataset.n=v.n;
      const label=document.createElement('div');label.className='metric-bar-label';label.innerHTML=`<span>${v.name}</span><b>${metricFormat(v.value,d)}${v.value!==null?' <small>'+valueUnit(d)+'</small>':''}</b>`;row.append(label);
      const track=document.createElement('div');track.className='metric-track';
      if(v.value!==null){const bar=document.createElement('div');bar.className='metric-bar';bar.style.width=(v.value/axisMax*100)+'%';bar.style.background=colors[v.area];if(v.reference)bar.style.opacity='.35';track.append(bar);}else{track.classList.add('missing-track');track.textContent='暂无数据';}
      row.append(track);const caption=document.createElement('span');caption.className='metric-n';caption.textContent=v.selected?'单店已观测值':`有效 n = ${v.n} / ${v.area==='A'?10:9} 家`;row.append(caption);holder.append(row);
    }
    el.append(holder);
    if(all.length){const axis=document.createElement('div');axis.className='metric-axis';axis.innerHTML=`<span>0</span><span>${fmt(axisMax)} ${valueUnit(d)}</span>`;el.append(axis);}
    if(!all.length){const pending=document.createElement('div');pending.className='metric-pending';pending.textContent='待核后接入 · 当前无有效数值';el.append(pending);}
    if(S.detail===d.id){
      const dist=document.createElement('div');dist.className='metric-distribution';
      const h=document.createElement('h4');h.textContent=`${all.length} 家商场`;dist.append(h);dist.style.setProperty('--mall-count',Math.max(1,all.length));
      D.malls.forEach(mall=>{
        const v=value(mall,d);if(!Number.isFinite(v))return;
        const b=makeButton('',()=>ATLAS_SCALE.select(mall.id),'distribution-row');b.dataset.id=mall.id;b.dataset.value=v;b.setAttribute('aria-label',`${mall.name} ${metricFormat(v,d)} ${d.unit}`);b.classList.toggle('selected',mall.id===S.selected);b.title=b.getAttribute('aria-label');
        const name=document.createElement('span');name.textContent=mall.name;
        const track=document.createElement('span');track.className='distribution-track';const i=document.createElement('i');i.style.cssText=`height:${v/axisMax*100}%;min-height:${v===0?2:1}px;background:${colors[mall.area]}`;track.append(i);
        const read=document.createElement('b');read.textContent=metricFormat(v,d);b.append(name,track,read);dist.append(b);
      });el.append(dist);
    }
  }
  function categorical(el,d,m){
    const cats=[...new Set(D.malls.map(x=>value(x,d)).filter(v=>v!==null))];
    const box=document.createElement('div');box.className='grade-chart';
    if(m){const p=document.createElement('p');p.textContent=m.name+' · '+(value(m,d)||'暂无数据');p.className='grade-selected';box.append(p);}
    cats.forEach(c=>{const p=document.createElement('div');p.className='grade-row';p.innerHTML=`<span>${c}</span>`;for(const area of (m?[m.area]:['A','B'])){const list=D.malls.filter(x=>x.area===area),n=list.filter(x=>value(x,d)===c).length;const s=document.createElement('span');s.style.color=colors[area];s.textContent=`${area} ${n} 家`;p.append(s);}box.append(p);});
    const p=document.createElement('p');p.className='metric-n';p.textContent=(m?[m.area]:['A','B']).map(area=>`${area}有效 n = ${D.malls.filter(x=>x.area===area&&value(x,d)!==null).length}`).join(' / ');box.append(p);el.append(box);
  }
  function update(){
    if(S.radius!==lastRadius){maps.forEach(m=>{m.zoom=1;m.offset=[0,0];});lastRadius=S.radius;}
    document.querySelectorAll('#metric-groups button').forEach(b=>{const active=b.dataset.group===S.group;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active);});
    const details=$('metric-details');details.replaceChildren();
    if(S.group==='overview'){const hint=document.createElement('span');hint.textContent='先看四组代表指标，再选择一组展开；这里不合成总分。';details.append(hint);}else{
      const all=makeButton('全部',()=>detailButton('all'));all.classList.toggle('selected',S.detail==='all');all.setAttribute('aria-pressed',String(S.detail==='all'));details.append(all);
      defs.filter(d=>d.group===S.group).forEach(d=>{const b=makeButton(d.title,()=>detailButton(d.id));b.dataset.metric=d.id;b.classList.toggle('selected',S.detail===d.id);b.setAttribute('aria-pressed',String(S.detail===d.id));details.append(b);});
    }
    const m=D.malls.find(m=>m.id===S.selected),d=selectedMetric();
    $('metrics-context-title').textContent=(S.group==='overview'?'四组总览':S.group+' / '+groups[S.group])+' · '+(m?m.label+' '+m.name:'全部19家商场');
    $('metrics-context-description').textContent=d?d.note:'保持相同尺度，比较商场属性与周边环境。点击地图或图表中的商场，可查看单店与所在片区的参照。';
    $('metrics-context-scope').textContent=`${d?.scope==='mall'?'商场属性':S.radius/1000+' km'} · ${m?'单店视角':'两片区对照'}`;
    $('metric-spatial-status').textContent=d?.layer?`${d.title}：仅对应的圈内${d.layer==='roads123'?'道路线段':'点位'}着色，其他对象保留灰底。`:d?'该项仅更新图表：当前没有适配的已核专题几何，地图保留空间定位。':'地图为已有建筑与道路背景；选择123交通细项或购物中心入口，可查看专题几何。';
    if(d?.fixedRadius)$('metric-spatial-status').textContent='固定300m周边建筑背景：圆线标明统计范围；底图作定位，不按高度渲染建筑。1/5km按钮不改变此项数据。';
    if(d?.layer==='mallGates')$('metric-spatial-status').textContent='绿色描边点为筛查纳入的购物中心入口POI。点击或按回车查看名称及纳入理由；待核候选不绘出。';
    $('metric-chart-title').textContent=d?d.title:S.group==='overview'?'四组指标，各自读数。':groups[S.group]+' · 全部指标';
    $('metric-chart-note').textContent=m?`当前商场与${m.area}片区有效样本均值对照；参照包含该店。暂无数据不填零。`:'各图单位与横轴独立；片区均值按有值商场等权计算，标注有效 n。';
    const list=d?[d]:S.group==='overview'?representatives.map(id=>defs.find(d=>d.id===id)):defs.filter(d=>d.group===S.group);
    $('metric-charts').replaceChildren(...list.map(d=>card(d,S.group==='overview')));$('metric-charts').classList.toggle('single-metric',!!d);
    schedule();
  }
  maps.forEach(map=>{
    const zoom=f=>{map.zoom=Math.min(4,Math.max(.7,map.zoom*f));schedule();};
    map.el.querySelector('[data-zoom="in"]').onclick=()=>zoom(1.35);map.el.querySelector('[data-zoom="out"]').onclick=()=>zoom(1/1.35);
    map.el.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12);}},{passive:false});
    let drag=null;map.el.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'||e.target.closest('button,.metrics-marker,.morphology-candidate'))return;drag={x:e.clientX,y:e.clientY,offset:[...map.offset],scale:dimensions(map).scale};map.el.setPointerCapture(e.pointerId);});
    map.el.addEventListener('pointermove',e=>{if(drag){map.offset=[drag.offset[0]-(e.clientX-drag.x)/drag.scale,drag.offset[1]-(e.clientY-drag.y)/drag.scale];schedule();}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])map.el.addEventListener(type,()=>drag=null);
    new ResizeObserver(schedule).observe(map.el);
  });
  $('metrics-fit').onclick=()=>{maps.forEach(m=>{m.zoom=1;m.offset=[0,0];});schedule();};
  document.addEventListener('atlas:fit-analysis',()=>{maps.forEach(m=>{m.zoom=1;m.offset=[0,0];});schedule();});
  // Keep one actual scale/selection toolbar across both chapters. The slot
  // reserves its original height while it is fixed; no duplicated controls.
  const toolbar=$('analysis-toolbar'),slot=document.createElement('div');slot.className='analysis-toolbar-slot';toolbar.before(slot);slot.append(toolbar);
  function pinToolbar(){
    const rect=slot.getBoundingClientRect(),end=$('act-02').getBoundingClientRect().bottom,height=toolbar.offsetHeight;
    slot.style.height=height+'px';document.documentElement.style.setProperty('--analysis-toolbar-height',height+'px');
    const pinned=rect.top<=0&&end>height;
    toolbar.classList.toggle('analysis-toolbar-pinned',pinned);
    if(pinned){toolbar.style.left=rect.left+'px';toolbar.style.width=rect.width+'px';}else{toolbar.style.left='';toolbar.style.width='';}
  }
  window.addEventListener('scroll',pinToolbar,{passive:true});window.addEventListener('resize',()=>{pinToolbar();schedule();});
  new ResizeObserver(pinToolbar).observe(toolbar);
  document.addEventListener('atlas:analysis-change',update);document.addEventListener('atlas:grid-change',schedule);
  update();pinToolbar();
})();
