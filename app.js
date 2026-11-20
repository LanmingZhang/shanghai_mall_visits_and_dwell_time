/* First-act atlas. All geometry is exported from the supplied GeoPackages. */
(() => {
  'use strict';
  const D = window.ATLAS_DATA;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const colors = { A: '#a14831', B: '#456572' };
  const centers = { A: [4000, 9000], B: [7500, 4500], city: [5900, 6850] };
  const state = { mode: 'compare', zoom: 1, offset: [0, 0], selected: 'SHM000385', buildings: true, names: true, bounds: true };
  let frame = 0;
  const maps = ['a', 'b'].map(key => ({ key, area: key.toUpperCase(), el: $('map-' + key), canvas: $('map-' + key).querySelector('canvas'), svg: $('map-' + key).querySelector('svg') }));
  function svgNode(name, attrs, parent, text) {
    const node = document.createElementNS(NS, name);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    if (text !== undefined) node.textContent = text;
    if (parent) parent.appendChild(node);
    return node;
  }
  function paths(g) {
    const c = g.coordinates;
    if (g.type === 'Polygon') return c.map(r => 'M' + r.map(p => p.join(',')).join('L') + 'Z').join('');
    if (g.type === 'MultiPolygon') return c.map(p => paths({type:'Polygon', coordinates:p})).join('');
    if (g.type === 'LineString') return 'M' + c.map(p => p.join(',')).join('L');
    if (g.type === 'MultiLineString') return c.map(p => paths({type:'LineString', coordinates:p})).join('');
    return '';
  }
  function cached(g) {
    const bounds = [Infinity, Infinity, -Infinity, -Infinity];
    function visit(c) {
      if (typeof c[0] === 'number') {
        bounds[0] = Math.min(bounds[0], c[0]); bounds[1] = Math.min(bounds[1], c[1]);
        bounds[2] = Math.max(bounds[2], c[0]); bounds[3] = Math.max(bounds[3], c[1]);
      } else c.forEach(visit);
    }
    visit(g.coordinates);
    return {path:new Path2D(paths(g)), bounds};
  }
  const geo = {
    water: D.water.map(cached), buildings: D.buildings.map(cached), roads: D.roads.map(cached),
    streets: D.streets.map(s => ({...cached(s.geometry), kind:s.kind, name:s.name})),
    areas: D.areas.map(a => ({...cached(a.geometry), area:a.area}))
  };
  window.ATLAS_SHARED = { geo, colors, paths, svgNode };
  const shortNames = {'上海K11购物艺术中心':'K11 购物艺术中心','上海来福士广场':'来福士广场','上海世茂广场':'世茂广场','上海新天地':'新天地','新天地时尚I&II':'新天地时尚','海上海弘基休闲广场':'海上海弘基','骏丰国际财富广场':'骏丰国际财富','君欣·时代广场':'君欣·时代广场'};
  function schedule() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; render(); }); }
  function dimensions(map) {
    const w = map.el.clientWidth, h = map.el.clientHeight;
    const sharedWidth = state.mode === 'compare' ? Math.min(...maps.map(m => m.el.clientWidth)) : w;
    const sharedHeight = state.mode === 'compare' ? Math.min(...maps.map(m => m.el.clientHeight)) : h;
    const scale = Math.min(sharedWidth, sharedHeight) / (state.mode === 'city' ? 9600 : 2650) * state.zoom;
    const c = centers[state.mode === 'city' ? 'city' : map.area];
    const cx = c[0] + state.offset[0], cy = c[1] + state.offset[1];
    return {w,h,scale,cx,cy, tx:w/2-cx*scale, ty:h/2-cy*scale};
  }
  function renderMap(map) {
    const {w,h,scale,cx,cy,tx,ty} = dimensions(map);
    if (!w || !h) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (map.canvas.width !== Math.round(w*dpr) || map.canvas.height !== Math.round(h*dpr)) {
      map.canvas.width = Math.round(w*dpr); map.canvas.height = Math.round(h*dpr);
    }
    const ctx = map.canvas.getContext('2d');
    ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,w,h);
    ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*tx,dpr*ty);
    const extent = [cx-w/2/scale, cy-h/2/scale, cx+w/2/scale, cy+h/2/scale];
    const visible = item => item.bounds[0] < extent[2] && item.bounds[2] > extent[0] && item.bounds[1] < extent[3] && item.bounds[3] > extent[1];
    // Act 01 is an abstract figure-ground drawing from the existing geometries.
    // Satellite evidence remains available in the selected mall's detail panel.
    const hasPlate=false;
    ctx.globalAlpha=1;
    ctx.fillStyle = '#bfd1d0'; geo.water.filter(visible).forEach(o => ctx.fill(o.path, 'evenodd'));
    if (state.buildings) {
      ctx.globalAlpha=hasPlate?.12:1;
      ctx.fillStyle = state.mode === 'city' ? '#bcaa96' : (map.area==='A'?'#b99b83':'#99adb2');
      geo.buildings.filter(visible).forEach(o => ctx.fill(o.path, 'evenodd'));
    }
    ctx.globalAlpha=hasPlate?.16:1;
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#fbfcf5'; ctx.lineWidth = (state.mode === 'city' ? 1.1 : 1.7)/scale;
    geo.roads.filter(visible).forEach(o => ctx.stroke(o.path));
    geo.streets.filter(visible).forEach(o => {
      ctx.strokeStyle = ['primary','secondary','trunk'].includes(o.kind) ? '#fcfcf6' : '#f8faf1';
      ctx.lineWidth = (['primary','secondary','trunk'].includes(o.kind) ? 2.8 : 1.3)/scale;
      ctx.stroke(o.path);
    });
    ctx.globalAlpha=1;
    // Street names come only from the supplied named road geometry.
    if (state.mode === 'compare' && state.zoom >= .9) {
      ctx.setTransform(dpr,0,0,dpr,0,0);
      const used = new Set(), occupied=[];
      for (const s of geo.streets) {
        if (!s.name || used.has(s.name) || !visible(s) || !['primary','secondary'].includes(s.kind)) continue;
        const x=(s.bounds[0]+s.bounds[2])/2*scale+tx, y=(s.bounds[1]+s.bounds[3])/2*scale+ty;
        if (x<60 || x>w-60 || y<30 || y>h-30 || occupied.some(p=>Math.hypot(p[0]-x,p[1]-y)<88)) continue;
        const points=D.malls.filter(m=>m.area===map.area);
        if(points.some(m=>Math.hypot(m.xy[0]*scale+tx-x,m.xy[1]*scale+ty-y)<37))continue;
        ctx.font='9px "Microsoft YaHei",sans-serif'; ctx.textAlign='center'; ctx.fillStyle='#695b4c';
        if(!hasPlate)ctx.fillText(s.name,x,y); used.add(s.name);occupied.push([x,y]);
        if (used.size>=6)break;
      }
    }
    if (state.bounds) {
      // A single even-odd mask keeps source geography intact while fading only
      // the context outside the current study frame(s), including road labels.
      ctx.save();ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*tx,dpr*ty);
      const areas=geo.areas.filter(o=>state.mode==='city'||o.area===map.area);
      const outside=new Path2D();outside.rect(extent[0]-1,extent[1]-1,extent[2]-extent[0]+2,extent[3]-extent[1]+2);
      areas.forEach(o=>outside.addPath(o.path));
      ctx.fillStyle='rgba(249,243,234,0.82)';ctx.fill(outside,'evenodd');
      areas.filter(visible).forEach(o=>{
        ctx.fillStyle=colors[o.area]+'06';ctx.fill(o.path);
        ctx.strokeStyle=colors[o.area]+'d9';ctx.lineWidth=1.8/scale;ctx.setLineDash([6/scale,3/scale]);ctx.stroke(o.path);ctx.setLineDash([]);
      });
      ctx.restore();
    }
    map.svg.replaceChildren(); map.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    window.ATLAS_GRID.draw(map.svg,{w,h,scale,tx,ty,step:state.mode==='city'?1000:500});
    if(state.mode==='compare'&&state.bounds){
      const c=centers[map.area],x1=(c[0]-1000)*scale+tx,x2=(c[0]+1000)*scale+tx,y1=(c[1]-1000)*scale+ty,y2=(c[1]+1000)*scale+ty;
      const dimY=y1-14;
      const dim=svgNode('g',{'pointer-events':'none',class:'drawing-dimensions'},map.svg);
      svgNode('path',{d:`M${x1} ${dimY-4}v8M${x1} ${dimY}H${x2}M${x2} ${dimY-4}v8`,fill:'none',stroke:colors[map.area],'stroke-width':.7},dim);
      svgNode('text',{x:(x1+x2)/2,y:dimY-5,'text-anchor':'middle',fill:colors[map.area],'font-size':9,'font-family':'Arial','letter-spacing':2},dim,'2 000 m / SAMPLE FRAME');
      for(const [x,y,sx,sy] of [[x1,y1,1,1],[x2,y1,-1,1],[x1,y2,1,-1],[x2,y2,-1,-1]])svgNode('path',{d:`M${x+sx*13} ${y}H${x}V${y+sy*13}`,stroke:colors[map.area],'stroke-width':3,fill:'none'},dim);
    }
    if(state.mode === 'city' && state.bounds) {
      ['A','B'].forEach(area=>{
        const p=centers[area];
        svgNode('text',{x:p[0]*scale+tx,y:(p[1]-1300)*scale+ty,'text-anchor':'middle',class:'overview-label'},map.svg,area+' 片区');
      });
    }
    const malls = D.malls.filter(m => state.mode === 'city' || m.area === map.area).sort((a,b)=>(a.id===state.selected?1:0)-(b.id===state.selected?1:0));
    const occupied = malls.map(m=>({x:m.xy[0]*scale+tx-13,y:m.xy[1]*scale+ty-13,w:26,h:26}));
    const labels=[];
    // Reserve the selected label first, so it remains legible in dense clusters.
    [...malls].sort((a,b)=>(b.id===state.selected?1:0)-(a.id===state.selected?1:0)).forEach(m=>{
      const x=m.xy[0]*scale+tx,y=m.xy[1]*scale+ty;
      if (!state.names || state.mode==='city' && m.id!==state.selected || x<0 || x>w || y<0 || y>h)return;
      const name=shortNames[m.name]||m.name, lw=name.length*10+6, lh=16;
      const candidates=[[17,-7],[17,13],[-lw-17,-7],[-lw-17,13],[-lw/2,-28],[-lw/2,23],[20,36],[-lw-20,36],[-lw/2,-45]];
      let best=null,bestScore=Infinity;
      for (const [dx,dy] of candidates) {
        const box={x:x+dx,y:y+dy-11,w:lw,h:lh};
        let score=occupied.filter(o=>box.x<o.x+o.w&&box.x+box.w>o.x&&box.y<o.y+o.h&&box.y+box.h>o.y).length*100;
        if(box.x<4||box.x+box.w>w-4||box.y<4||box.y+box.h>h-25)score+=1000;
        score+=Math.abs(dy)*.1;
        if(score<bestScore){bestScore=score;best={box,dx,dy};}
      }
      if(bestScore>=100&&m.id!==state.selected)return;
      occupied.push(best.box); labels.push({m,x,y,name,...best});
    });
    labels.forEach(l=>{
      const selected=l.m.id===state.selected;
      svgNode('line',{x1:l.x,y1:l.y,x2:l.x+l.dx+l.box.w/2,y2:l.y+l.dy-5,stroke:colors[l.m.area],opacity:.75,'stroke-width':.7,'pointer-events':'none'},map.svg);
      svgNode('rect',{x:l.box.x-3,y:l.box.y-1,width:l.box.w+5,height:18,fill:selected?colors[l.m.area]:(l.m.area==='A'?'#724b3a':'#405661'),opacity:selected?1:.88,class:'mall-label-bg','pointer-events':'none'},map.svg);
      svgNode('text',{x:l.x+l.dx,y:l.y+l.dy,fill:'#fffaf1',class:'mall-label'+(selected?' selected-name':'')},map.svg,l.name);
    });
    malls.forEach(m=>{
      const x=m.xy[0]*scale+tx,y=m.xy[1]*scale+ty, selected=m.id===state.selected, city=state.mode==='city';
      if(x < -30 || y < -30 || x > w+30 || y > h+30)return;
      const g=svgNode('g',{transform:`translate(${x},${y})`,class:'mall-marker',role:'button',tabindex:'0','aria-label':`${m.label} ${m.name}`,'aria-pressed':String(selected),'data-id':m.id},map.svg);
      svgNode('title',{},g,m.label+' · '+m.name);
      svgNode('circle',{r:selected?20:16,fill:'transparent'},g);
      if(selected){svgNode('circle',{r:18,fill:colors[m.area],opacity:.1},g);svgNode('circle',{r:15,fill:'none',stroke:colors[m.area],'stroke-width':.7,opacity:.55},g);}
      svgNode('circle',{r:city?5:10,fill:colors[m.area],stroke:'#fffef6','stroke-width':selected?2:1.5,class:'pin'},g);
      if(!city)svgNode('text',{x:0,y:3,'text-anchor':'middle',class:'pin-id'},g,m.label.slice(1));
      g.addEventListener('click',()=>selectMall(m.id));
      g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectMall(m.id);}});
    });
    const meters = state.mode==='city' ? 1000 : state.zoom>1.8 ? 200 : 500;
    map.el.querySelector('.map-scale').innerHTML=`<span>${meters>=1000 ? meters/1000+' km' : meters+' m'}</span><div class="scale-bar" style="width:${meters*scale}px"></div>`;
  }
  function render() {renderMap(maps[0]);if(state.mode==='compare')renderMap(maps[1]);}
  function profile() {
    if(!state.selected){
      $('profile').innerHTML='<div class="profile-index"><span class="sample-badge">19 / 全部样本</span><span>未选商场</span></div><h3 class="profile-name">先认识两个片区。</h3><p class="overview-copy">地图保留全部 19 家商场。点选任一商场，可以查看对应位置的卫星图和单店档案。</p><div class="overview-counts"><span><b style="color:var(--red)">10</b>A 片区</span><span><b style="color:var(--blue)">09</b>B 片区</span></div><button id="overview-directory" class="overview-directory">浏览 19 家商场 →</button><p class="profile-caption">2 × 2 km 为选样框，框外仍是城市背景。后续分析范围由 1 km／5 km 缓冲圈确定。</p>';
      $('overview-directory').onclick=()=>$('directory-open').click();drawLocator();return;
    }
    const m=D.malls.find(m=>m.id===state.selected), index=D.malls.indexOf(m);
    const number=v=>v===null?'暂无':Number(v).toLocaleString('zh-CN',{maximumFractionDigits:1});
    $('profile').innerHTML=`<div class="profile-index"><span class="sample-badge ${m.area==='B'?'blue':''}">${m.label} / 片区 ${m.area}</span><span>已选样本</span></div><h3 class="profile-name">${m.name}</h3><div class="profile-coords">${m.lon.toFixed(4)}° E &nbsp; ${m.lat.toFixed(4)}° N</div><div class="profile-metrics"><div class="metric"><strong>${number(m.size)}${m.size!==null?'<small>万㎡</small>':''}</strong><span>商业面积 · 采用值</span></div><div class="metric"><strong>${number(m.brands)}${m.brands!==null?'<small>个</small>':''}</strong><span>已观测品牌</span></div><div class="metric"><strong>${number(m.floors)}${m.floors!==null?'<small>层</small>':''}</strong><span>商业楼层标签</span></div><div class="metric"><strong>${number(m.metro)}<small>个</small></strong><span>1 km 内地铁出入口</span></div></div><p class="profile-caption">${m.size!==null?'面积来源：'+m.sizeSource+'。':'商业面积暂无适配当前研究对象的采用值。'}<br>已观测标签不等同实际总层数；缺失不计作零。</p><div class="profile-stepper"><span>SAMPLE ${String(index+1).padStart(2,'0')} / 19</span><div><button id="previous-mall" aria-label="上一个商场">←</button><button id="next-mall" aria-label="下一个商场">→</button></div></div>`;
    $('previous-mall').onclick=()=>selectMall(D.malls[(index+18)%19].id,true);
    $('next-mall').onclick=()=>selectMall(D.malls[(index+1)%19].id,true);
    mountSatellite(m);
    const clear=document.createElement('button');clear.className='clear-selection';clear.id='clear-selection';clear.textContent='清除选择';
    clear.onclick=()=>{state.selected=null;if($('satellite-dialog').open)$('satellite-dialog').close();profile();schedule();$('status').textContent='已清除商场选择，地图视图保持不变。';};
    $('profile').querySelector('.profile-index').lastElementChild.replaceWith(clear);
    drawLocator();
  }
  function selectMall(id, reveal=false) {
    state.selected=id;
    const m=D.malls.find(m=>m.id===id);
    if(reveal){state.offset=[0,0];state.zoom=1;}
    profile();schedule();$('status').textContent=`已选择 ${m.label} ${m.name}`;
    document.querySelector('.inspector').scrollTop=0;
    if($('satellite-dialog').open)loadSatelliteDialog();
    if(reveal && window.innerWidth<=570){$('map-'+m.area.toLowerCase()).scrollIntoView({behavior:'smooth',block:'center'});}
  }
  function drawLocator() {
    const svg=$('locator'); svg.replaceChildren();
    const s=.014,tx=35,ty=-18;
    const g=svgNode('g',{transform:`translate(${tx},${ty}) scale(${s})`},svg);
    D.water.forEach(o=>svgNode('path',{d:paths(o),fill:'#c7dbdc'},g));
    D.areas.forEach(a=>svgNode('path',{d:paths(a.geometry),fill:colors[a.area]+'20',stroke:colors[a.area],'stroke-width':60},g));
    ['A','B'].forEach(a=>{
      const c=centers[a];
      const label=svgNode('g',{role:'button',tabindex:0,'aria-label':'查看'+a+'片区',style:'cursor:pointer'},svg);
      svgNode('rect',{x:c[0]*s+tx-12,y:c[1]*s+ty-10,width:24,height:20,fill:colors[a],rx:1},label);
      svgNode('text',{x:c[0]*s+tx,y:c[1]*s+ty+4,fill:'white','font-size':12,'text-anchor':'middle'},label,a);
      const action=()=>{setMode('compare');selectMall(D.malls.find(m=>m.area===a).id,true);};
      label.onclick=action;label.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();action();}};
    });
    svgNode('text',{x:242,y:17,'text-anchor':'end',fill:'#8b9b87','font-size':8},svg,'N ↑');
    svgNode('text',{x:13,y:119,fill:'#8b9b87','font-size':8},svg,'SHANGHAI · 区位示意');
  }
  function setMode(mode) {
    state.mode=mode;state.zoom=1;state.offset=[0,0];
    $('compare-view').classList.toggle('selected',mode==='compare');$('city-view').classList.toggle('selected',mode==='city');
    $('compare-view').setAttribute('aria-pressed',mode==='compare');$('city-view').setAttribute('aria-pressed',mode==='city');
    $('panel-b').style.display=mode==='city'?'none':'';
    const heading=$('panel-a').querySelector('.map-heading');
    heading.querySelector('.area-letter').textContent=mode==='city'?'沪':'A';
    heading.querySelector('h2').textContent=mode==='city'?'上海中心城区 · 两个研究现场':'人民广场—淮海中路—新天地';
    heading.querySelector('.map-kicker').innerHTML=mode==='city'?'SHANGHAI / STUDY CONTEXT <span>19 SAMPLES</span>':'CENTRAL SHANGHAI <span>10 SAMPLES</span>';
    $('panel-a').querySelector('.map-foot').innerHTML=mode==='city'?'<span><i class="legend-dot a"></i> A 片区 <i class="legend-dot b" style="margin-left:12px"></i> B 片区</span><span>19 家已选商场</span>':'<span><i class="legend-dot a"></i> A 片区 · 10 家商场</span><span>2 km × 2 km</span>';
    maps[0].el.setAttribute('aria-label',mode==='city'?'上海两片区总览，可拖动缩放':'A片区地图，可拖动缩放');
    maps[0].svg.setAttribute('aria-label',mode==='city'?'19家商场点位':'A片区商场点位');
    $('sync-badge').textContent=mode==='city'?'城市总览 · 19 家样本':'⇄ 同尺度联动';
    schedule();
  }
  function zoom(factor){state.zoom=Math.max(.65,Math.min(4,state.zoom*factor));schedule();}
  maps.forEach(map=>{
    let drag=null;
    map.el.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12);}},{passive:false});
    map.el.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'||e.target.closest('.mall-marker'))return;
      const d=dimensions(map);drag={x:e.clientX,y:e.clientY,offset:[...state.offset],scale:d.scale};
      map.el.setPointerCapture(e.pointerId);map.el.classList.add('dragging');
    });
    map.el.addEventListener('pointermove',e=>{if(drag){state.offset=[drag.offset[0]-(e.clientX-drag.x)/drag.scale,drag.offset[1]-(e.clientY-drag.y)/drag.scale];schedule();}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])map.el.addEventListener(type,()=>{drag=null;map.el.classList.remove('dragging');});
  });
  $('compare-view').onclick=()=>setMode('compare');$('city-view').onclick=()=>setMode('city');
  $('zoom-in').onclick=()=>zoom(1.3);$('zoom-out').onclick=()=>zoom(1/1.3);
  $('reset-view').onclick=()=>{state.zoom=1;state.offset=[0,0];schedule();};
  for(const [id,key] of [['buildings-toggle','buildings'],['names-toggle','names'],['bounds-toggle','bounds']])$(id).onchange=e=>{state[key]=e.target.checked;schedule();};
  document.addEventListener('atlas:grid-change',schedule);
  document.querySelectorAll('[data-portfolio-mall]').forEach(b=>b.onclick=()=>{setMode('compare');selectMall(b.dataset.portfolioMall,true);$('map-pair').scrollIntoView({behavior:'smooth',block:'center'});});
  document.addEventListener('atlas:plates-ready',schedule);
  $('source-open').onclick=()=>$('source-dialog').showModal();
  function directory() {
    const q=$('mall-search').value.trim().toLowerCase(),list=$('directory-list');list.replaceChildren();
    const found=D.malls.filter(m=>(m.label+' '+m.name).toLowerCase().includes(q));
    found.forEach(m=>{
      const b=document.createElement('button');b.className='directory-item';
      b.innerHTML=`<span class="sample-badge ${m.area==='B'?'blue':''}">${m.label}</span><span>${m.name}</span>`;
      b.onclick=()=>{selectMall(m.id,true);$('directory-dialog').close();};list.appendChild(b);
    });
    if(!found.length)list.innerHTML='<p class="empty">没有匹配的商场，试试其他名称或编号。</p>';
  }
  $('directory-open').onclick=()=>{$('mall-search').value='';directory();$('directory-dialog').showModal();$('mall-search').focus();};
  $('mall-search').oninput=directory;
  document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
  document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
  const satelliteState={zoom:1,x:0,y:0};
  function satellitePath(m){return 'satellite/'+m.id+'.jpg';}
  function mountSatellite(m){
    const section=document.createElement('section');section.className='satellite-card';section.style.setProperty('--pin-color',colors[m.area]);
    section.innerHTML=`<div class="satellite-heading"><span>卫星影像</span><span>约 800 × 600 m</span></div><button class="satellite-preview" id="satellite-open" aria-label="展开${m.name}的卫星影像"><img src="${satellitePath(m)}" alt="${m.name}研究点位及周边的卫星影像" width="1200" height="900"><span class="satellite-crosshair" aria-hidden="true"></span><span class="satellite-expand">⤢ 放大查看</span><span class="satellite-fallback" hidden>影像暂未加载，可点击重试</span></button><div class="satellite-credit">© Esri, Vantor, Earthstar Geographics, GIS User Community</div>`;
    $('profile').querySelector('.profile-coords').after(section);
    const img=section.querySelector('img');
    img.onerror=()=>{section.querySelector('.satellite-fallback').hidden=false;section.querySelector('.satellite-crosshair').hidden=true;};
    $('satellite-open').onclick=()=>{$('satellite-dialog').showModal();loadSatelliteDialog();};
  }
  function resetSatellite(){satelliteState.zoom=1;satelliteState.x=0;satelliteState.y=0;positionSatellite();}
  function positionSatellite(){
    const stage=$('satellite-stage'),plane=$('satellite-plane');
    const w=Math.min(stage.clientWidth,stage.clientHeight*4/3),h=w*.75;
    // Clamp pan so a zoomed image cannot be accidentally lost outside the viewport.
    const maxX=Math.max(0,(w*satelliteState.zoom-stage.clientWidth)/2),maxY=Math.max(0,(h*satelliteState.zoom-stage.clientHeight)/2);
    satelliteState.x=Math.max(-maxX,Math.min(maxX,satelliteState.x));satelliteState.y=Math.max(-maxY,Math.min(maxY,satelliteState.y));
    plane.style.width=w+'px';plane.style.height=h+'px';
    plane.style.transform=`translate(calc(-50% + ${satelliteState.x}px),calc(-50% + ${satelliteState.y}px)) scale(${satelliteState.zoom})`;
    $('satellite-zoom-level').textContent=satelliteState.zoom.toFixed(1)+'×';
    $('satellite-minus').disabled=satelliteState.zoom<=1;$('satellite-plus').disabled=satelliteState.zoom>=4;
  }
  function loadSatelliteDialog(){
    const m=D.malls.find(m=>m.id===state.selected),img=$('satellite-image');
    $('satellite-title').textContent=m.label+' · '+m.name;
    $('satellite-coords').textContent=`${m.lon.toFixed(5)}° E / ${m.lat.toFixed(5)}° N`;
    $('satellite-plane').style.setProperty('--pin-color',colors[m.area]);
    $('satellite-dialog').dataset.mallId=m.id;
    $('satellite-error').hidden=true;$('satellite-loading').hidden=false;
    $('satellite-plane').hidden=true;
    img.onload=()=>{$('satellite-loading').hidden=true;$('satellite-plane').hidden=false;positionSatellite();};
    img.onerror=()=>{$('satellite-loading').hidden=true;$('satellite-error').hidden=false;};
    img.alt=m.name+'研究点位及周边卫星影像';img.src=satellitePath(m);
    resetSatellite();
  }
  function zoomSatellite(factor){satelliteState.zoom=Math.min(4,Math.max(1,satelliteState.zoom*factor));positionSatellite();}
  $('satellite-plus').onclick=()=>zoomSatellite(1.4);$('satellite-minus').onclick=()=>zoomSatellite(1/1.4);
  $('satellite-reset').onclick=resetSatellite;$('satellite-retry').onclick=loadSatelliteDialog;
  for(const [id,delta] of [['satellite-prev',-1],['satellite-next',1]])$(id).onclick=()=>{
    const index=D.malls.findIndex(m=>m.id===state.selected);selectMall(D.malls[(index+delta+19)%19].id);
  };
  let satelliteDrag=null;
  $('satellite-stage').addEventListener('wheel',e=>{e.preventDefault();zoomSatellite(e.deltaY<0?1.12:1/1.12);},{passive:false});
  $('satellite-stage').addEventListener('pointerdown',e=>{
    if(e.target.closest('button'))return;
    satelliteDrag={x:e.clientX,y:e.clientY,ox:satelliteState.x,oy:satelliteState.y};
    $('satellite-stage').setPointerCapture(e.pointerId);
  });
  $('satellite-stage').addEventListener('pointermove',e=>{if(satelliteDrag){satelliteState.x=satelliteDrag.ox+e.clientX-satelliteDrag.x;satelliteState.y=satelliteDrag.oy+e.clientY-satelliteDrag.y;positionSatellite();}});
  for(const type of ['pointerup','pointercancel','lostpointercapture'])$('satellite-stage').addEventListener(type,()=>{satelliteDrag=null;});
  new ResizeObserver(()=>{if($('satellite-dialog').open)positionSatellite();}).observe($('satellite-stage'));
  new ResizeObserver(schedule).observe($('map-pair'));
  window.addEventListener('resize',schedule);
  window.ATLAS_DETAIL={openSatellite(id){selectMall(id);$('satellite-dialog').showModal();loadSatelliteDialog();}};
  profile();schedule();
})();
