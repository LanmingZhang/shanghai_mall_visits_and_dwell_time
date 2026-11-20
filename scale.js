/* Act 02. Euclidean buffers in the source metre-based projection; no data clipping. */
(() => {
  'use strict';
  const D=window.ATLAS_DATA,{geo,colors,paths,svgNode}=window.ATLAS_SHARED;
  const $=id=>document.getElementById(id);
  // One analysis state is reserved for the later ABCD and correlation sections.
  // The first act's example field-note selection does not pre-filter analysis.
  const state=window.ATLAS_ANALYSIS={radius:1000,selected:null,group:'overview',detail:'all'};
  let hoverId=null,showAllRings=false;
  const maps=['A','B'].map(area=>{
    const el=$('scale-map-'+area.toLowerCase()),malls=D.malls.filter(m=>m.area===area);
    const xs=malls.map(m=>m.xy[0]),ys=malls.map(m=>m.xy[1]);
    return {area,el,malls,canvas:el.querySelector('canvas'),svg:el.querySelector('svg'),zoom:1,offset:[0,0],
      center:[(Math.min(...xs)+Math.max(...xs))/2,(Math.min(...ys)+Math.max(...ys))/2],span:[Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)]};
  });
  let frame=0;
  function schedule(){if(!frame)frame=requestAnimationFrame(()=>{frame=0;maps.forEach(draw);});}
  function dimensions(map){
    const w=map.el.clientWidth,h=map.el.clientHeight,pad=w<420?48:70;
    const scale=Math.min((w-pad)/(map.span[0]+2*state.radius),(h-pad)/(map.span[1]+2*state.radius))*map.zoom;
    const cx=map.center[0]+map.offset[0],cy=map.center[1]+map.offset[1];
    return {w,h,scale,cx,cy,tx:w/2-cx*scale,ty:h/2-cy*scale};
  }
  function diskPath(malls){
    const p=new Path2D();
    malls.forEach(m=>{p.moveTo(m.xy[0]+state.radius,m.xy[1]);p.arc(m.xy[0],m.xy[1],state.radius,0,Math.PI*2);p.closePath();});
    return p;
  }
  function draw(map){
    const {w,h,scale,cx,cy,tx,ty}=dimensions(map);if(!w||!h)return;
    const dpr=Math.min(window.devicePixelRatio||1,2);
    if(map.canvas.width!==Math.round(w*dpr)||map.canvas.height!==Math.round(h*dpr)){map.canvas.width=Math.round(w*dpr);map.canvas.height=Math.round(h*dpr);}
    const ctx=map.canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
    ctx.setTransform(dpr*scale,0,0,dpr*scale,dpr*tx,dpr*ty);
    const extent=[cx-w/2/scale,cy-h/2/scale,cx+w/2/scale,cy+h/2/scale];
    const visible=o=>o.bounds[0]<extent[2]&&o.bounds[2]>extent[0]&&o.bounds[1]<extent[3]&&o.bounds[3]>extent[1];
    let hasPlate=window.ATLAS_PLATES.draw(ctx,map.area,'context',.83);
    if(state.radius===1000)hasPlate=window.ATLAS_PLATES.draw(ctx,map.area,'detail',.88)||hasPlate;
    ctx.globalAlpha=hasPlate?.1:1;
    ctx.fillStyle='#d0dfe0';geo.water.filter(visible).forEach(o=>ctx.fill(o.path,'evenodd'));
    ctx.fillStyle='#d0d5c9';geo.buildings.filter(visible).forEach(o=>ctx.fill(o.path,'evenodd'));
    ctx.globalAlpha=hasPlate?.16:1;
    ctx.strokeStyle='#fcfcf6';ctx.lineWidth=(state.radius===1000?1.65:1.05)/scale;ctx.lineCap='round';ctx.lineJoin='round';
    geo.roads.filter(visible).forEach(o=>ctx.stroke(o.path));
    ctx.lineWidth=(state.radius===1000?1.3:.65)/scale;
    geo.streets.filter(visible).forEach(o=>ctx.stroke(o.path));
    ctx.globalAlpha=1;
    // Nonzero fill across one compound path paints the union once. There is no
    // accumulated alpha at overlaps, and no added union-outline geometry.
    ctx.fillStyle=state.selected?'#8b99850b':colors[map.area]+'10';
    ctx.fill(diskPath(map.malls),'nonzero');
    const selected=map.malls.find(m=>m.id===state.selected);
    if(selected){ctx.fillStyle=colors[map.area]+'14';ctx.fill(diskPath([selected]));}
    // Tint only the area covered by the actual disks. Outside becomes paper;
    // no convex hull, buffer union boundary, or new analytical boundary is drawn.
    const mask=document.createElement('canvas');mask.width=map.canvas.width;mask.height=map.canvas.height;
    const maskCtx=mask.getContext('2d');maskCtx.fillStyle='rgba(249,243,233,0.79)';maskCtx.fillRect(0,0,mask.width,mask.height);
    maskCtx.setTransform(dpr*scale,0,0,dpr*scale,dpr*tx,dpr*ty);maskCtx.globalCompositeOperation='destination-out';
    maskCtx.fillStyle='#000';if(!state.selected)maskCtx.fill(diskPath(map.malls));else if(selected)maskCtx.fill(diskPath([selected]));
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(mask,0,0);ctx.restore();
    const focusedId=document.activeElement?.classList?.contains('scale-mall-marker')?document.activeElement.dataset.id:null;
    map.svg.replaceChildren();map.svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    window.ATLAS_GRID.draw(map.svg,{w,h,scale,tx,ty,step:state.radius===1000?500:1000});
    map.el.dataset.radius=state.radius;map.el.dataset.metersToPixels=scale;
    const circles=svgNode('g',{'aria-hidden':'true',class:'buffer-circles','pointer-events':'none'},map.svg);
    [...map.malls].sort((a,b)=>(a.id===state.selected?1:0)-(b.id===state.selected?1:0)).forEach(m=>{
      const active=!state.selected||m.id===state.selected;
      svgNode('circle',{cx:m.xy[0]*scale+tx,cy:m.xy[1]*scale+ty,r:state.radius*scale,fill:'none',stroke:active?colors[m.area]:'#aeb7a5','stroke-width':m.id===state.selected?1.8:.8,'stroke-opacity':0,class:'buffer-circle','data-id':m.id,'data-active':String(active)},circles);
    });
    const area=D.areas.find(a=>a.area===map.area);
    svgNode('path',{d:paths(area.geometry),transform:`translate(${tx},${ty}) scale(${scale})`,fill:'none',stroke:'#6e7e68','stroke-opacity':.65,'stroke-width':1,'stroke-dasharray':'4 4','vector-effect':'non-scaling-stroke','pointer-events':'none',class:'scale-sample-frame'},map.svg);
    [...map.malls].sort((a,b)=>(a.id===state.selected?1:0)-(b.id===state.selected?1:0)).forEach(m=>{
      const x=m.xy[0]*scale+tx,y=m.xy[1]*scale+ty,isSelected=m.id===state.selected,active=!state.selected||isSelected;
      if(x< -20||x>w+20||y< -20||y>h+20)return;
      const compact=scale<.075,r=compact?4.5:8.5;
      const g=svgNode('g',{transform:`translate(${x},${y})`,class:'scale-mall-marker',role:'button',tabindex:0,'data-id':m.id,'aria-label':m.label+' '+m.name,'aria-pressed':String(isSelected)},map.svg);
      svgNode('title',{},g,m.label+' · '+m.name);
      svgNode('circle',{r:compact?10:14,fill:'transparent'},g);
      if(isSelected)svgNode('circle',{r:r+5,fill:'none',stroke:colors[m.area],'stroke-width':1},g);
      svgNode('circle',{r,fill:active?colors[m.area]:'#a1ac98',stroke:'#fffef5','stroke-width':1.3},g);
      if(!compact)svgNode('text',{x:0,y:3,'text-anchor':'middle',fill:'#fff','font-size':8,'font-family':'Arial','pointer-events':'none'},g,m.label.slice(1));
      if(isSelected){
        const boxWidth=m.name.length*11+20,lx=Math.max(4,Math.min(w-boxWidth-4,x+17)),ly=Math.max(22,y-18);
        svgNode('line',{x1:x,y1:y,x2:lx,y2:ly,stroke:colors[m.area],'stroke-width':.7,'pointer-events':'none'},map.svg);
        svgNode('rect',{x:lx-5,y:ly-13,width:boxWidth,height:22,rx:2,fill:'#fbfcf5ee',stroke:colors[m.area]+'44','pointer-events':'none'},map.svg);
        svgNode('text',{x:lx+4,y:ly+2,fill:colors[m.area],class:'scale-marker-label','pointer-events':'none'},map.svg,m.name);
      }
      g.onclick=()=>select(m.id);
      g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(m.id);}};
      g.onpointerenter=()=>{if(!state.selected){hoverId=m.id;updateCircleLines();}};
      g.onpointerleave=()=>{if(!state.selected&&hoverId===m.id){hoverId=null;updateCircleLines();}};
      g.onfocus=()=>{if(!state.selected){hoverId=m.id;updateCircleLines();}};
      g.onblur=()=>{if(!state.selected){hoverId=null;updateCircleLines();}};
    });
    if(focusedId){const focus=map.svg.querySelector(`[data-id="${focusedId}"].scale-mall-marker`);if(focus)focus.focus({preventScroll:true});}
    const meters=state.radius===1000?(map.zoom>1.8?200:500):(map.zoom>1.8?1000:2000);
    map.el.querySelector('.scale-measure').innerHTML=`<span>${meters>=1000?meters/1000+' km':meters+' m'}</span><div style="width:${meters*scale}px"></div>`;
    updateCircleLines();
  }
  function updateCircleLines(){
    const focus=state.selected||hoverId;
    maps.forEach(map=>{
      map.svg.querySelectorAll('.buffer-circle').forEach(c=>{
        const highlighted=c.dataset.id===focus,visible=highlighted||showAllRings;
        c.setAttribute('stroke-opacity',highlighted?'.88':showAllRings?(state.selected?'.20':'.37'):'0');
        c.setAttribute('stroke-width',highlighted?'1.8':'.8');c.dataset.visible=String(visible);
      });
      map.svg.querySelector('.radius-guide')?.remove();
      const m=map.malls.find(m=>m.id===focus);if(!m)return;
      const {scale,tx,ty}=dimensions(map),x=m.xy[0]*scale+tx,y=m.xy[1]*scale+ty,r=state.radius*scale;
      const ex=x+r*.70710678,ey=y-r*.70710678,lx=x+r*.40,ly=y-r*.40;
      const g=svgNode('g',{class:'radius-guide','pointer-events':'none','aria-hidden':'true'},map.svg);
      svgNode('path',{d:`M${x} ${y}L${ex} ${ey}`,stroke:colors[map.area],'stroke-width':.8,'stroke-dasharray':'3 3'},g);
      svgNode('path',{d:`M${ex-4} ${ey-4}l8 8`,stroke:colors[map.area],'stroke-width':1.2},g);
      svgNode('rect',{x:lx-34,y:ly-12,width:68,height:21,fill:'#fbf5eb',stroke:colors[map.area]+'55','stroke-width':.6},g);
      svgNode('text',{x:lx,y:ly+2,'text-anchor':'middle',fill:colors[map.area],'font-size':10,'font-family':'Arial'},g,`R = ${state.radius/1000} km`);
    });
  }
  function notify(){document.dispatchEvent(new CustomEvent('atlas:analysis-change',{detail:{...state}}));}
  function update(){
    const large=state.radius===5000,m=D.malls.find(m=>m.id===state.selected);
    for(const r of [1000,5000]){const b=$('radius-'+r);b.classList.toggle('selected',state.radius===r);b.setAttribute('aria-pressed',String(state.radius===r));}
    $('scale-mode-label').textContent=large?'5 km / 区域尺度':'1 km / 社区尺度';
    $('scale-reason-text').textContent=large?'以商场为中心，建立半径 5 km 的区域尺度缓冲区。':'以商场为中心，建立半径 1 km 的社区尺度缓冲区。';
    $('scale-mall-select').value=state.selected||'';$('scale-clear').disabled=!state.selected;
    $('scale-selected-name').textContent=m?m.label+' · '+m.name:'全部 19 家商场';
    $('scale-selected-description').textContent=m?`显示这家商场的 ${state.radius/1000} km 圆与半径，其他商场保留为背景点位。切换半径会保留选择。`:'底色表示19家商场缓冲范围的覆盖区域。悬停看单圈，点击锁定；需要核对时可展开全部圆线。';
    $('scale-circle-area').textContent=(Math.PI*(state.radius/1000)**2).toFixed(2);
    $('scale-radius-badge').textContent='r = '+state.radius/1000+' km';
    maps.forEach(map=>{
      const own=m?.area===map.area;
      $('scale-count-'+map.area.toLowerCase()).textContent=state.radius/1000+' km · '+map.malls.length+' 个圈';
      $('scale-foot-'+map.area.toLowerCase()).textContent=!m?map.malls.length+' 家商场 · 缓冲覆盖底色':own?'单店圆与半径 · 其余点位保留':map.malls.length+' 家商场为背景 · 保留对照片区';
    });
    schedule();notify();
  }
  function fit(){maps.forEach(m=>{m.zoom=1;m.offset=[0,0];});schedule();}
  function select(id){state.selected=id||null;hoverId=null;update();}
  window.ATLAS_SCALE={select,fit,setGroup(group){state.group=group;state.detail='all';update();},setDetail(detail){state.detail=detail;update();}};
  [1000,5000].forEach(r=>$('radius-'+r).onclick=()=>{state.radius=r;fit();update();});
  ['A','B'].forEach(area=>{
    const group=document.createElement('optgroup');group.label=area+' 片区';
    D.malls.filter(m=>m.area===area).forEach(m=>{const o=document.createElement('option');o.value=m.id;o.textContent=m.label+' · '+m.name;group.appendChild(o);});
    $('scale-mall-select').appendChild(group);
  });
  $('scale-mall-select').onchange=e=>select(e.target.value);
  $('scale-clear').onclick=()=>select(null);$('scale-fit').onclick=()=>{fit();document.dispatchEvent(new Event('atlas:fit-analysis'));};
  $('all-rings-toggle').onchange=e=>{showAllRings=e.target.checked;updateCircleLines();};
  document.addEventListener('atlas:plates-ready',schedule);
  document.addEventListener('atlas:grid-change',schedule);
  maps.forEach(map=>{
    const zoom=f=>{map.zoom=Math.max(.7,Math.min(4,map.zoom*f));schedule();};
    map.el.querySelector('[data-zoom="in"]').onclick=()=>zoom(1.35);
    map.el.querySelector('[data-zoom="out"]').onclick=()=>zoom(1/1.35);
    // Preserve ordinary vertical reading. Wheel zoom is an explicit modified action.
    map.el.addEventListener('wheel',e=>{if(e.ctrlKey||e.metaKey){e.preventDefault();zoom(e.deltaY<0?1.12:1/1.12);}},{passive:false});
    let drag=null;
    map.el.addEventListener('pointerdown',e=>{
      if(e.pointerType==='touch'||e.target.closest('.scale-mall-marker,button'))return;
      drag={x:e.clientX,y:e.clientY,offset:[...map.offset],scale:dimensions(map).scale};map.el.setPointerCapture(e.pointerId);map.el.classList.add('dragging');
    });
    map.el.addEventListener('pointermove',e=>{if(drag){map.offset=[drag.offset[0]-(e.clientX-drag.x)/drag.scale,drag.offset[1]-(e.clientY-drag.y)/drag.scale];schedule();}});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])map.el.addEventListener(type,()=>{drag=null;map.el.classList.remove('dragging');});
    new ResizeObserver(schedule).observe(map.el);
  });
  
  window.addEventListener('resize',schedule);
  update();
})();
