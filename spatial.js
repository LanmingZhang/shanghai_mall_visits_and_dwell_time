/* Matched-scale spatial reading. Only existing geometry and source POIs. */
(() => {
 'use strict';
 const host=document.getElementById('pair-plates'),{geo,colors}=ATLAS_SHARED;
 const state={lens:'buildings',zoom:1,wipe:0,focus:{}};
 const names={buildings:'建筑肌理',roads:'街道骨架',transit:'交通落点'};
 const intro={buildings:'先看建筑如何排列，再对照影像辨认空间。轮廓只表示现有数据覆盖，空白不等于开放空间。',roads:'让建筑退后，观察街道如何穿过近景。线条是已有道路基底，不代表可步行通道或实际入口。',transit:'把交通数量落到真实位置。点选一个站点查看名称与直线距离；距离不等于步行路程。'};
 const bar=document.createElement('div');bar.className='spatial-console';
 bar.innerHTML=`<div class="spatial-console-title"><span>SPATIAL READING ROOM</span><h4>让地图解释差异。</h4><p>两侧同步观察 · 同一方向 · 同一尺度</p></div><div class="spatial-lenses" role="group" aria-label="空间观察镜头">${Object.entries(names).map(([key,name],i)=>`<button data-lens="${key}" aria-pressed="${key==='buildings'}"><small>0${i+1}</small>${name}</button>`).join('')}</div><div class="spatial-tools"><label>抽象图 <input id="spatial-wipe" type="range" min="0" max="100" value="0" aria-label="两侧卫星影像揭示比例"> 卫星图 <output id="spatial-wipe-value">0%</output></label><div class="spatial-zoom" role="group" aria-label="同步近景尺度"><button data-zoom="1" aria-pressed="true">800 m</button><button data-zoom="1.5" aria-pressed="false">533 m</button><button data-zoom="2" aria-pressed="false">400 m</button></div></div><p id="spatial-guide"></p><div class="spatial-key"><span><i class="key-site"></i>商场工作点</span><span><i class="key-metro"></i>地铁出入口</span><span><i class="key-bus"></i>公交站点</span><span>网格 100 m · 图宽可切换 · 北向上</span></div>`;
 host.before(bar);
 const svgNode=(tag,attrs,parent,text)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v));if(text)el.textContent=text;parent.append(el);return el;};
 const list=(key)=>ATLAS_METRICS.layers[key+'123']||[];
 const visiblePoints=(m,key)=>list(key).filter(p=>Math.abs(p.xy[0]-m.xy[0])<=400/state.zoom&&Math.abs(p.xy[1]-m.xy[1])<=300/state.zoom);
 function install(){
   for(const card of host.querySelectorAll('.pair-plate')){
     if(card.querySelector('.spatial-stage'))continue;
     const m=ATLAS_DATA.malls.find(m=>m.id===card.dataset.id),old=card.querySelector('.pair-images');
     const wrap=document.createElement('div');wrap.className='spatial-view';
     wrap.innerHTML=`<div class="spatial-stage" aria-label="${m.name}同尺度空间观察图"><canvas></canvas><div class="spatial-image-clip"><img src="satellite/${m.id}.jpg" alt="${m.name}卫星近景"></div><svg viewBox="0 0 800 600" aria-label="工作点和交通设施位置"></svg><div class="spatial-topline"><span class="spatial-lens-label"></span><span>N ↑</span></div><div class="spatial-wipe-line"></div><div class="spatial-scale"><b></b><span>100 m</span></div><button class="pair-satellite spatial-expand" aria-label="展开${m.name}卫星影像">展开原始影像 ↗</button></div><div class="spatial-caption"><span class="spatial-extent"></span><span>同尺度对读 / ${m.area}</span></div><div class="spatial-evidence" aria-live="polite"></div>`;
     old.replaceWith(wrap);wrap.querySelector('.spatial-expand').onclick=()=>ATLAS_DETAIL.openSatellite(m.id);
   }
   drawAll();
 }
 function draw(card){
   const m=ATLAS_DATA.malls.find(m=>m.id===card.dataset.id),stage=card.querySelector('.spatial-stage');if(!stage)return;
   const canvas=stage.querySelector('canvas'),w=800,h=600,z=state.zoom,tx=w/2-m.xy[0]*z,ty=h/2-m.xy[1]*z;
   canvas.width=1600;canvas.height=1200;const c=canvas.getContext('2d');c.setTransform(2,0,0,2,0,0);c.fillStyle='#f3eddf';c.fillRect(0,0,w,h);c.setTransform(2*z,0,0,2*z,2*tx,2*ty);
   const bounds=[m.xy[0]-400/z,m.xy[1]-300/z,m.xy[0]+400/z,m.xy[1]+300/z],vis=o=>o.bounds[0]<bounds[2]&&o.bounds[2]>bounds[0]&&o.bounds[1]<bounds[3]&&o.bounds[3]>bounds[1];
   c.fillStyle='#bfd1cf';geo.water.filter(vis).forEach(o=>c.fill(o.path,'evenodd'));
   c.fillStyle=state.lens==='buildings'?(m.area==='A'?'#aa785a':'#6f909b'):'#ddd8cb';geo.buildings.filter(vis).forEach(o=>c.fill(o.path,'evenodd'));
   c.lineJoin='round';c.lineCap='round';
   c.strokeStyle=state.lens==='roads'?colors[m.area]:'#fcfaf2';c.lineWidth=(state.lens==='roads'?3:2)/z;geo.roads.filter(vis).forEach(o=>c.stroke(o.path));
   c.strokeStyle=state.lens==='roads'?'#af987b':'#faf7ed';c.lineWidth=1.2/z;geo.streets.filter(vis).forEach(o=>c.stroke(o.path));
   c.setTransform(2,0,0,2,0,0);
   const svg=stage.querySelector('svg');svg.replaceChildren();
   if(ATLAS_GRID.enabled){let lines='';for(let x=Math.ceil(bounds[0]/100)*100;x<=bounds[2];x+=100)lines+=`M${x*z+tx} 0v600`;for(let y=Math.ceil(bounds[1]/100)*100;y<=bounds[3];y+=100)lines+=`M0 ${y*z+ty}h800`;svgNode('path',{d:lines,stroke:'#fffaf0','stroke-width':2,'stroke-opacity':.4,fill:'none'},svg);svgNode('path',{d:lines,stroke:'#695b46','stroke-width':.65,'stroke-opacity':.28,fill:'none'},svg);}
   const points=['metro','bus'].flatMap(key=>visiblePoints(m,key).map(p=>({...p,key,d:Math.hypot(p.xy[0]-m.xy[0],p.xy[1]-m.xy[1])}))).sort((a,b)=>a.d-b.d);
   let focus=points.find(p=>p.key+'|'+p.name===state.focus[m.id])||points.find(p=>p.key==='metro')||points[0];
   if(state.lens==='transit'){
     if(focus)svgNode('path',{d:`M400 300L${focus.xy[0]*z+tx} ${focus.xy[1]*z+ty}`,stroke:'#647969','stroke-width':1.5,'stroke-dasharray':'5 5',fill:'none'},svg);
     points.forEach(p=>{
       const x=p.xy[0]*z+tx,y=p.xy[1]*z+ty,g=svgNode('g',{class:'spatial-poi',role:'button',tabindex:0,'aria-label':`${p.name}，距工作点直线约${Math.round(p.d)}米`,'data-kind':p.key,transform:`translate(${x} ${y})`},svg);
       svgNode('circle',{r:15,fill:'transparent'},g);
       if(p.key==='metro')svgNode('rect',{x:-6,y:-6,width:12,height:12,rx:2,fill:'#426b64',stroke:'#fffaf0','stroke-width':2},g);else svgNode('circle',{r:5,fill:'#ba8851',stroke:'#fffaf0','stroke-width':2},g);
       if(p===focus)svgNode('circle',{r:12,fill:'none',stroke:'#426b64','stroke-width':1.5},g);
       svgNode('title',{},g,p.name);
       const select=()=>{state.focus[m.id]=p.key+'|'+p.name;draw(card);};g.onclick=select;g.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();const next=[...stage.querySelectorAll('.spatial-poi')].find(el=>el.getAttribute('aria-label')===g.getAttribute('aria-label'));next?.focus();}};
     });
   }
   svgNode('circle',{cx:400,cy:300,r:12,fill:'#fff9ed',stroke:colors[m.area],'stroke-width':1.5},svg);svgNode('circle',{cx:400,cy:300,r:4,fill:colors[m.area]},svg);
   svgNode('path',{d:'M415 300h30l17 -25h90',stroke:colors[m.area],'stroke-width':1,fill:'none'},svg);svgNode('text',{x:465,y:266,fill:colors[m.area],'font-size':12,'font-family':'Microsoft YaHei','paint-order':'stroke',stroke:'#fff9ed','stroke-width':3},svg,'商场工作点');
   stage.querySelector('img').style.transform=`scale(${z})`;
   stage.querySelector('.spatial-scale').style.width='100%';
   stage.querySelector('.spatial-scale').style.right='auto';
   stage.querySelector('.spatial-lens-label').textContent=names[state.lens];stage.querySelector('.spatial-scale b').style.width=(100*z/8)+'%';
   card.querySelector('.spatial-extent').textContent=`图幅约 ${Math.round(800/z)} × ${Math.round(600/z)} m`;
   const evidence=card.querySelector('.spatial-evidence');
   if(state.lens==='transit'){
     const metro=points.filter(p=>p.key==='metro').length,bus=points.filter(p=>p.key==='bus').length;
     evidence.innerHTML=`<span class="spatial-evidence-index">03</span><div><strong>当前图幅（123专题点位）：${metro} 个地铁出入口 · ${bus} 个公交站点</strong><p></p><small>仅统计当前矩形近景，区别于下方 ${ATLAS_ANALYSIS.radius/1000} km 圆形缓冲区；虚线为直线参照。</small></div>`;
     evidence.querySelector('p').textContent=focus?`${focus.name} · 距工作点直线约 ${Math.round(focus.d)} m。可点击图中其他点位。`:'当前近景未显示交通点，可切换800 m图幅观察。';
   }else evidence.innerHTML=`<span class="spatial-evidence-index">${state.lens==='buildings'?'01':'02'}</span><div><strong>${state.lens==='buildings'?'观察建筑的排列与间隙':'观察街道的方向与连接'}</strong><p>${state.lens==='buildings'?'拖动上方滑杆，用卫星影像核对抽象轮廓。两侧保持相同图宽，方便比较建筑肌理。':'深色线为道路基底，细线为街道线；拖动滑杆对照影像，辨认街道与建筑的关系。'}</p><small>${state.lens==='buildings'?'数据空白不代表广场；商场边界、建筑用途与开放状态仍待核。':'线宽仅用于视觉区分，不表示真实路宽或道路等级；不推断通行权限。'}</small></div>`;
   applyWipe(stage);
 }
 function applyWipe(stage){stage.querySelector('.spatial-image-clip').style.clipPath=`inset(0 ${100-state.wipe}% 0 0)`;const line=stage.querySelector('.spatial-wipe-line');line.style.left=state.wipe+'%';line.hidden=state.wipe===0||state.wipe===100;}
 function drawAll(){document.getElementById('spatial-guide').textContent=intro[state.lens];bar.hidden=!host.querySelector('.pair-plate');host.querySelectorAll('.pair-plate').forEach(draw);}
 bar.querySelectorAll('[data-lens]').forEach(b=>b.onclick=()=>{state.lens=b.dataset.lens;bar.querySelectorAll('[data-lens]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));drawAll();});
 bar.querySelectorAll('[data-zoom]').forEach(b=>b.onclick=()=>{state.zoom=+b.dataset.zoom;bar.querySelectorAll('[data-zoom]').forEach(el=>el.setAttribute('aria-pressed',String(el===b)));drawAll();});
 document.getElementById('spatial-wipe').oninput=e=>{state.wipe=+e.target.value;document.getElementById('spatial-wipe-value').textContent=state.wipe+'%';host.querySelectorAll('.spatial-stage').forEach(applyWipe);};
 new MutationObserver(install).observe(host,{childList:true});document.addEventListener('atlas:grid-change',drawAll);install();
 window.ATLAS_SPATIAL={state,visiblePoints};
})();
