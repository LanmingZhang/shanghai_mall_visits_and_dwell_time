/* Act 03 narrative: descriptive evidence, equal-mall composition, explicit pairing. */
(() => {
 'use strict';
 const D=ATLAS_DATA,M=ATLAS_METRICS,S=ATLAS_ANALYSIS,{geo,colors}=ATLAS_SHARED;
 const $=id=>document.getElementById(id),byId=id=>D.malls.find(m=>m.id===id);
 const brandKeys=['cat1','cat2','cat3','cat4','cat5','cat6'],brandNames=['零售','餐饮','儿童亲子','文体娱','生活服务','其它类型'];
 const destKeys=['shopping','culture','sports','parks'],destNames=['购物','科教文化','体育休闲','公园广场'];
 const palette=['#a7573c','#c49058','#617c83','#a4b39a','#8c7c92','#d4c7b1'];
 const view={rank:'brands',brand:0,dest:0,mode:'brands',pair:null,lastSelected:S.selected};
 const num=(v,d=1)=>v===null||v===undefined?'暂无数据':Number(v).toLocaleString('zh-CN',{maximumFractionDigits:d});
 const val=(m,k)=>{const v=M.records[m.id][k];return v&&typeof v==='object'?v[String(S.radius)]:v;};
 const valid=v=>typeof v==='number'&&Number.isFinite(v);
 const mean=a=>a.length?a.reduce((s,v)=>s+v,0)/a.length:null;
 function group(area,key){const a=D.malls.filter(m=>m.area===area).map(m=>val(m,key)).filter(valid).sort((a,b)=>a-b);return {n:a.length,mean:mean(a),median:a.length?(a[Math.floor((a.length-1)/2)]+a[Math.ceil((a.length-1)/2)])/2:null,min:a[0]??null,max:a.at(-1)??null};}
 function vector(m,kind){
   const v=(kind==='brand'?brandKeys:destKeys).map(k=>val(m,k));if(!v.every(valid))return null;
   if(kind==='brand')return v;
   const total=v.reduce((s,x)=>s+x,0);return total>0?v.map(x=>100*x/total):null;
 }
 function composition(area,kind){const rows=D.malls.filter(m=>m.area===area).map(m=>vector(m,kind)).filter(Boolean);return {n:rows.length,values:rows.length?rows[0].map((_,i)=>mean(rows.map(r=>r[i]))):null};}
 function btn(text,fn,cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.onclick=fn;return b;}
 function openMetric(key){const d=M.definitions.find(d=>d.id===key);$('metrics-explorer').open=true;ATLAS_SCALE.setGroup(d.group);ATLAS_SCALE.setDetail(key);$('metrics-explorer').scrollIntoView({behavior:'smooth',block:'start'});}
 function evidenceCard(key,title,unit,reading){
   const a=group('A',key),b=group('B',key),el=document.createElement('article');el.className='evidence-card';el.dataset.metric=key;
   el.innerHTML=`<span>${title}</span><div class="evidence-values"><div><i>A</i><strong>${num(a.mean,key==='diversity'?3:2)}</strong><small>${unit} · n=${a.n}</small></div><div><i>B</i><strong>${num(b.mean,key==='diversity'?3:2)}</strong><small>${unit} · n=${b.n}</small></div></div><p>${reading(a,b)}</p>`;
   el.append(btn('看逐店数据 ↗',()=>openMetric(key),'evidence-link'));return el;
 }
 function renderOpening(){
   const a=group('A','diversity'),b=group('B','diversity'),gap=Math.abs(a.mean-b.mean);
   $('story-finding-title').innerHTML=gap<.03?'供给规模不同，<br>构成均衡度却接近。':'供给规模与构成，<br>需要分开观察。';
   $('story-finding-text').textContent=`当前 ${S.radius/1000} km 尺度下，两片区四类目的地多样性均值相差 ${num(gap,3)}。品牌数与交通入口描述供给规模，多样性描述四类计数的均衡程度；这些指标回答不同的问题。`;
   $('story-scope').textContent=`全样本片区对照 · 环境半径 ${S.radius/1000} km · 选店不改变本段汇总`;
   $('story-evidence').replaceChildren(
     evidenceCard('brands','已观测品牌数均值','个',(a,b)=>`A约为B的 ${num(a.mean/b.mean,2)} 倍；品牌数据覆盖15家，缺失4家。`),
     evidenceCard('metro',`${S.radius/1000} km 地铁出入口均值`,'个',(a,b)=>`A约为B的 ${num(a.mean/b.mean,2)} 倍；出入口数量不等于独立车站数。`),
     evidenceCard('diversity','四类目的地多样性均值','0–1',()=>`两区差值 ${num(gap,3)}。描述性差异，不是显著性检验或体验评分。`)
   );
 }
 function renderRank(){
   const d=M.definitions.find(d=>d.id===view.rank),a=group('A',view.rank),b=group('B',view.rank);
   $('story-rank-summary').innerHTML=`<span class="story-kicker">${d.title} / ${d.scope==='mall'?'商场自身':S.radius/1000+' km 环境'}</span><h4>均值之外，<br>也看组内差异。</h4><div class="rank-area-summary"><strong>A</strong><p>均值 <b>${num(a.mean,2)}</b> · 中位数 ${num(a.median,2)}<small>范围 ${num(a.min)}—${num(a.max)} ${d.unit} · 有效 ${a.n}/10 家</small></p></div><div class="rank-area-summary blue"><strong>B</strong><p>均值 <b>${num(b.mean,2)}</b> · 中位数 ${num(b.median,2)}<small>范围 ${num(b.min)}—${num(b.max)} ${d.unit} · 有效 ${b.n}/9 家</small></p></div><p class="story-footnote">${d.note}</p>`;
   const list=$('story-ranking');list.replaceChildren();
   const ranked=[...D.malls].sort((a,b)=>(val(b,view.rank)??-Infinity)-(val(a,view.rank)??-Infinity));
   const max=Math.max(1,...ranked.map(m=>val(m,view.rank)).filter(valid));
   ranked.forEach(m=>{const v=val(m,view.rank),row=btn('',()=>ATLAS_SCALE.select(m.id),'story-rank-row');row.dataset.id=m.id;row.dataset.value=v===null?'NA':v;row.setAttribute('aria-pressed',String(S.selected===m.id));
     row.innerHTML=`<span><i style="background:${colors[m.area]}">${m.label}</i>${m.name}</span><span class="story-rank-track">${valid(v)?`<b style="width:${v/max*100}%;background:${colors[m.area]}"></b>`:'<em>暂无</em>'}</span><strong>${num(v,2)}<small>${valid(v)?d.unit:''}</small></strong>`;list.append(row);});
 }
 function stack(values,names,label,area,n,focus,onCategory){
   const row=document.createElement('div');row.className='composition-row';
   const head=document.createElement('div');head.className='composition-row-label';head.innerHTML=`<b style="color:${colors[area]}">${label}</b><span>有效 n = ${n}</span>`;row.append(head);
   if(!values){const p=document.createElement('p');p.className='composition-missing';p.textContent='暂无完整构成数据';row.append(p);return row;}
   const bar=document.createElement('div');bar.className='composition-stack';bar.setAttribute('aria-label',label+'构成');
   values.forEach((v,i)=>{if(v<=0)return;const part=btn(v>=8?num(v,1)+'%':'',()=>onCategory(i),'composition-segment');part.style.width=v+'%';part.style.background=palette[i];part.style.opacity=focus===null||focus===i?'1':'.42';part.title=names[i]+' '+num(v,2)+'%';part.setAttribute('aria-label',`${label} ${names[i]} ${num(v,2)}%`);part.dataset.category=i;part.dataset.value=v;bar.append(part);});row.append(bar);
   return row;
 }
 function renderComposition(){
   for(const kind of ['brand','destination']){
     const type=kind==='brand'?'brand':'dest',names=type==='brand'?brandNames:destNames,a=composition('A',type),b=composition('B',type),focus=view[type];
     const target=$(kind+'-composition'),choose=i=>{view[type]=i;renderComposition();};
     target.replaceChildren(stack(a.values,names,'A 片区','A',a.n,focus,choose),stack(b.values,names,'B 片区','B',b.n,focus,choose));
     $(kind+'-legend').replaceChildren(...names.map((name,i)=>{const button=btn(name,()=>choose(i),'category-key');button.innerHTML=`<i style="background:${palette[i]}"></i>${name}`;button.setAttribute('aria-pressed',String(focus===i));return button;}));
     const diff=a.values&&b.values?a.values[focus]-b.values[focus]:null;
     $(kind+'-reading').textContent=diff===null?'暂无可比的完整构成数据':`${names[focus]}：A ${num(a.values[focus],1)}%，B ${num(b.values[focus],1)}%；${Math.abs(diff)<.05?'两区占比接近':(diff>0?'A':'B')+'高 '+num(Math.abs(diff),1)+' 个百分点'}。`;
   }
   $('destination-radius').textContent=`当前 ${S.radius/1000} km · 随尺度更新`;
   const selected=byId(S.selected),box=$('composition-selected');box.replaceChildren();
   if(selected){box.innerHTML=`<span class="story-kicker">SELECTED SITE / ${selected.label} ${selected.name}</span><p>单店补充视角；上方两片区构成仍按全部有效样本计算。</p>`;const columns=document.createElement('div');columns.className='selected-composition-columns';columns.append(stack(vector(selected,'brand'),brandNames,'单店品牌构成',selected.area,vector(selected,'brand')?1:0,null,i=>{view.brand=i;renderComposition();}),stack(vector(selected,'dest'),destNames,'单店目的地构成',selected.area,vector(selected,'dest')?1:0,null,i=>{view.dest=i;renderComposition();}));box.append(columns);}else{box.innerHTML='<p>想看单家？点上方排序中的商场，或使用顶部“观察对象”。</p>';}
 }
 function candidates(mode,anchor){
   const all=[];for(const a of D.malls.filter(m=>m.area==='A'))for(const b of D.malls.filter(m=>m.area==='B')){
     if(anchor&&a.id!==anchor&&b.id!==anchor)continue;
     const k=mode==='brands'?'brands':'area',av=val(a,k),bv=val(b,k);
     if(!valid(av)||!valid(bv)||Math.max(av,bv)<=0)continue;
     const aa=vector(a,'brand'),bb=vector(b,'brand');if(mode==='brands'&&(!aa||!bb))continue;
     const difference=mode==='brands'?aa.reduce((s,v,i)=>s+Math.abs(v-bb[i]),0)/2:Math.abs(val(a,'metro')-val(b,'metro'));
     all.push({a:a.id,b:b.id,gap:Math.abs(av-bv)/Math.max(av,bv),difference});
   }
   const close=all.filter(p=>p.gap<=.1);const pool=close.length?close:all;
   pool.sort((p,q)=>mode==='brands'&&close.length?q.difference-p.difference||p.gap-q.gap:p.gap-q.gap||q.difference-p.difference);
   return {pair:pool[0]||null,total:all.length,close:close.length};
 }
 function recommend(mode,anchor=null){
   view.mode=mode;const result=candidates(mode,anchor);view.pair=result.pair;view.method={...result,anchor,radius:S.radius};renderPairs();
 }
 function pairSketch(canvas,m){
   const w=480,h=360,scale=w/800,tx=w/2-m.xy[0]*scale,ty=h/2-m.xy[1]*scale;
   canvas.width=w;canvas.height=h;const c=canvas.getContext('2d');c.fillStyle='#f0e8da';c.fillRect(0,0,w,h);c.setTransform(scale,0,0,scale,tx,ty);
   const bounds=[m.xy[0]-400,m.xy[1]-300,m.xy[0]+400,m.xy[1]+300],visible=o=>o.bounds[0]<bounds[2]&&o.bounds[2]>bounds[0]&&o.bounds[1]<bounds[3]&&o.bounds[3]>bounds[1];
   c.fillStyle='#bfd0cf';geo.water.filter(visible).forEach(o=>c.fill(o.path,'evenodd'));c.fillStyle=m.area==='A'?'#b6927a':'#8da5ad';geo.buildings.filter(visible).forEach(o=>c.fill(o.path,'evenodd'));
   c.strokeStyle='#fffaf1';c.lineWidth=2.5/scale;geo.roads.filter(visible).forEach(o=>c.stroke(o.path));c.lineWidth=1.3/scale;geo.streets.filter(visible).forEach(o=>c.stroke(o.path));
   c.setTransform(1,0,0,1,0,0);c.strokeStyle=colors[m.area];c.fillStyle=colors[m.area];c.lineWidth=1;c.beginPath();c.arc(w/2,h/2,9,0,Math.PI*2);c.stroke();c.beginPath();c.arc(w/2,h/2,3,0,Math.PI*2);c.fill();
   c.font='12px Arial';c.fillText('N ↑',w-36,22);c.fillText('100 m',14,h-24);c.beginPath();c.moveTo(14,h-18);c.lineTo(14+100*scale,h-18);c.stroke();
 }
 function renderPairs(){
   $('pair-brands').classList.toggle('selected',!view.method?.manual&&view.mode==='brands');$('pair-area').classList.toggle('selected',!view.method?.manual&&view.mode==='area');
   for(const [id,mode]of [['pair-brands','brands'],['pair-area','area']])$(id).setAttribute('aria-pressed',String(!view.method?.manual&&view.mode===mode));
   const plates=$('pair-plates');plates.replaceChildren();
   if(!view.pair){$('pair-method').textContent='当前选店缺少这项配对条件，无法推荐。可切换另一种对读，或使用预设查看完整案例。';$('pair-observations').replaceChildren();$('pair-question-text').textContent='先补齐可比条件，再提出对照问题。';$('pair-method-detail').textContent='缺失值不作为0参与配对。';return;}
   const a=byId(view.pair.a),b=byId(view.pair.b),mode=view.mode,key=mode==='brands'?'brands':'area',av=val(a,key),bv=val(b,key),gap=Math.abs(av-bv)/Math.max(av,bv);
   const m=view.method;
   $('pair-method').textContent=m.manual?`从活力图进入：${a.name} / ${b.name} · 交通统计 ${S.radius/1000} km · 探索性空间对读`:`${mode==='brands'?'已观测品牌':'采用商业面积'} ${num(av)} / ${num(bv)} ${mode==='brands'?'个':'万㎡'} · 相对差 ${num(gap*100,2)}%${gap>.1?'（超出10%的近似条件，仅为最接近候选）':''} · 交通统计 ${S.radius/1000} km`;
   for(const mall of [a,b]){
     const el=document.createElement('article');el.className='pair-plate';el.dataset.id=mall.id;
     el.innerHTML=`<div class="pair-plate-heading"><span style="color:${colors[mall.area]}">${mall.label}</span><div><small>${mall.area} 片区 / MATCHED SITE</small><h4>${mall.name}</h4></div></div><div class="pair-images"><figure><canvas aria-label="${mall.name}约800乘600米抽象空间图"></canvas><figcaption>建筑与道路基底 · 800 × 600 m</figcaption></figure><figure><button class="pair-satellite" aria-label="展开${mall.name}卫星影像"><img src="satellite/${mall.id}.jpg" alt="${mall.name}工作点周边卫星近景"><i class="pair-center"></i><span>⤢</span></button><figcaption>卫星近景 · 约800 × 600 m</figcaption></figure></div><div class="pair-mini-stats"><span>品牌<b>${num(val(mall,'brands'))}</b><small>个 · 已观测</small></span><span>商业面积<b>${num(val(mall,'area'),2)}</b><small>万㎡ · 采用值</small></span><span>地铁入口<b>${num(val(mall,'metro'))}</b><small>个 · ${S.radius/1000} km</small></span></div>`;
     const comp=stack(vector(mall,'brand'),brandNames,'六类品牌构成',mall.area,vector(mall,'brand')?1:0,null,i=>{view.brand=i;renderComposition();$('story-composition').scrollIntoView({behavior:'smooth'});});el.append(comp);
     const legend=document.createElement('div');legend.className='composition-legend';legend.innerHTML=brandNames.map((name,i)=>`<span class="category-key"><i style="background:${palette[i]}"></i>${name}</span>`).join('');el.append(legend);
     const caption=document.createElement('p');caption.className='pair-image-note';caption.textContent='圆心为小组工作点；基底为已有数据，空白不表示无建筑。卫星影像：Esri World Imagery，拍摄日期未核；完整署名见展开影像。';el.append(caption);
     const choose=btn('设为当前观察商场 →',()=>{suppressPair=true;ATLAS_SCALE.select(mall.id);suppressPair=false;},'pair-set-active');el.append(choose);
     plates.append(el);pairSketch(el.querySelector('canvas'),mall);el.querySelector('.pair-satellite').onclick=()=>ATLAS_DETAIL.openSatellite(mall.id);
   }
   const aa=vector(a,'brand'),bb=vector(b,'brand'),diffs=aa&&bb?aa.map((v,i)=>({i,d:v-bb[i]})).sort((x,y)=>Math.abs(y.d)-Math.abs(x.d)):[];
   const statements=[];
   if(mode==='brands'&&diffs.length){for(const item of diffs.slice(0,2))statements.push({title:brandNames[item.i]+'占比差',number:num(Math.abs(item.d),1)+' pp',text:`${item.d>=0?a.name:b.name}更高：${num(aa[item.i],1)}% / ${num(bb[item.i],1)}%（A / B）。`});}
   else{const difference=val(a,'metro')-val(b,'metro');statements.push({title:'地铁出入口差',number:num(Math.abs(difference))+' 个',text:`当前 ${S.radius/1000} km：${num(val(a,'metro'))} / ${num(val(b,'metro'))}（A / B），不能直接换算为步行便利度。`});statements.push({title:'品牌数对照',number:num(val(a,'brands'))+' / '+num(val(b,'brands')),text:'面积条件相近，已观测品牌数量仍有差异；不能据此推断经营效率。'});}
   $('pair-observations').replaceChildren(...statements.map(s=>{const el=document.createElement('div');el.innerHTML=`<span>已观察 / ${s.title}</span><strong>${s.number}</strong><p>${s.text}</p>`;return el;}));
   if(m.manual){const box=$('pair-observations');box.replaceChildren();const note=document.createElement('p');note.className='story-footnote';note.textContent='当前对照从活力图进入。请结合上方来访、停留数据查看这两家；这里的地图用于定位待核空间线索，不推断造成差异的原因。';box.append(note);}
   $('pair-question-text').textContent='上方活力图描述来访与停留的差异；这里查看商业内容与空间环境，寻找下一步应核查的连接问题。现有资料不能确定行为差异的原因。';
   $('pair-method-detail').textContent=`${m.anchor?'以 '+byId(m.anchor).name+' 为锚点，仅搜索另一片区。':'在A、B片区之间枚举配对。'}${mode==='brands'?'保留品牌数相对差不超过10%的候选，再按六类占比差的绝对值之和÷2从大到小排序；这只是本次选对规则，不是源表相似度指标。':'先按面积相对差从小到大排序，差值相同时按地铁出入口差从大到小排序。'}相对差 = |A−B| / max(A,B)。本次筛选有 ${m.total} 个有效配对，其中 ${m.close} 个满足10%条件。${m.close===0?'没有满足近似条件的配对，当前仅为最接近候选。':''}交通筛选使用 ${m.radius/1000} km；之后切换半径保持这两家，只更新环境指标，可点击预设重新推荐。`;
   if(m.manual)$('pair-method-detail').textContent='从活力图选入的跨片区探索案例，A始终在左、B始终在右。除预设案例外，对照对象优先选择另一片区当前半径下地铁出入口数量最接近者。没有控制其他条件，不作为因果匹配。';
 }
 function renderLeads(){
   const a=group('A','brands'),b=group('B','brands'),ca=composition('A','brand'),cb=composition('B','brand');
   const cases=[{title:'规模线索',observed:`品牌数均值 A ${num(a.mean,2)} / B ${num(b.mean,2)}，有效样本 ${a.n}/${b.n}。`,question:'供给规模更大，是否对应更高来访强度？',target:'story-size'},
   {title:'构成线索',observed:`零售品牌平均占比 A ${num(ca.values[0],1)}% / B ${num(cb.values[0],1)}%。`,question:'不同商业构成，是否对应不同的停留时长？',target:'story-composition'},
   {title:'空间线索',observed:view.pair?`${byId(view.pair.a).name}与${byId(view.pair.b).name}已形成可追溯的单店对照。`:'当前配对条件仍需补齐。',question:'相近条件下仍出现的行为差异，下一步该核查哪些空间因素？',target:'story-pairs'}];
   $('story-lead-cards').replaceChildren(...cases.map((c,i)=>{const el=document.createElement('article');el.innerHTML=`<span class="lead-index">0${i+1}</span><h4>${c.title}</h4><span class="lead-label">已观察到</span><p>${c.observed}</p><span class="lead-label pending-label">待验证</span><p>${c.question}</p>`;el.append(btn('回看证据 ↗',()=>$(c.target).scrollIntoView({behavior:'smooth'})));return el;}));
 }
 let suppressPair=false;
 function update(){
   renderOpening();renderRank();renderComposition();
   if(S.selected!==view.lastSelected){view.lastSelected=S.selected;if(S.selected&&!suppressPair){recommend(view.mode,S.selected);}else renderPairs();}else renderPairs();
   renderLeads();
 }
 $('story-rank-metric').onchange=e=>{view.rank=e.target.value;renderRank();};
 $('pair-brands').onclick=()=>{recommend('brands');renderLeads();};$('pair-area').onclick=()=>{recommend('area');renderLeads();};
 $('pair-recommend').onclick=()=>{recommend(view.mode,S.selected);renderLeads();};
 $('metrics-explorer').addEventListener('toggle',()=>document.dispatchEvent(new Event('atlas:grid-change')));
 document.addEventListener('atlas:analysis-change',update);
 recommend('brands',S.selected);update();
 window.ATLAS_STORY={getPair:()=>({...view.pair}),composition,candidates,group,compare(a,b){view.pair={a,b};view.method={manual:true,radius:S.radius,total:1,close:0};renderPairs();renderLeads();}};
})();
