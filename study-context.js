/* Arrange the existing atlas around the study question. */
(() => {
 'use strict';
 const $=id=>document.getElementById(id),remove=selectors=>document.querySelectorAll(selectors).forEach(e=>e.remove());
 const intro=$('act-01'), heatmap=$('act-03'), explorer=$('metrics-explorer');
 intro.before(heatmap);
 const chapters=[['act-03','商业同质化'],['act-01','认识片区'],['act-02','双尺度缓冲区'],['act-04','ABCD 条件'],['act-05','相关性分析']];
 document.querySelector('.chapter-nav').innerHTML=chapters.map(([id,name],i)=>`<a id="nav-${id}" href="#${id}"><b>0${i+1}</b> ${name}</a>`).join('');
 document.querySelector('.chapter-caption').textContent='ACT 02 — 认识片区';
 document.querySelector('.scale-intro .eyebrow').textContent='ACT 03 / 双尺度缓冲区';
 document.querySelector('.intro-right h2').textContent='两种商业角色';
 document.querySelector('.study-question').textContent='A片区聚集城市级商业目的地；B片区以社区日常服务为主。';
 $('panel-a').querySelector('.map-kicker').textContent='城市级商业目的地 · 10家';
 $('panel-b').querySelector('.map-kicker').textContent='社区日常服务 · 9家';
 const behavior=$('usage-overview');document.querySelector('.atlas').after(behavior);
 behavior.querySelector('.r-kicker').textContent='两个片区 · 19家商场';
 behavior.querySelector('.u-board-head h3').textContent='人来得多吗？留下多久？';
 behavior.querySelector('.u-board-head p').textContent='散点代表商场，两条趋势线分别按 A、B 片区拟合，随周三／周六切换。';
 document.querySelector('.next-chapter-badge').href='#act-04';document.querySelector('.next-chapter-badge').textContent='进入 ABCD 条件分析 ↓';
 document.querySelector('.chapter-transition>span').textContent='02 / 05 · 认识片区';
 document.querySelector('.chapter-transition>a').textContent='查看双尺度缓冲区 ↓';
 // Controls that select a day, mall or layer stay interactive; editorial notes do not collapse.
 remove('.u-route,.u-to-conditions,.u-scope-controls,.u-options,.u-method,.metrics-method,.research-note,.scale-takeaway p');
 const replacements={'u-options':'div','u-similar':'input','u-similar-note':'p','u-scope-description':'p'};
 for(const [id,tag] of Object.entries(replacements)){const el=document.createElement(tag);el.id=id;el.hidden=true;if(tag==='input')el.type='checkbox';behavior.append(el);}
 for(const id of ['research-archive','story-pairs','u-morphology-evidence']){const el=$(id);if(el)el.style.display='none';}
 const workspace=explorer.querySelector('.metrics-workspace');explorer.classList.add('single-screen-workspace');
 workspace.querySelector('.plate-heading').innerHTML='<span><b>商场与周边环境</b></span><span>地图与柱状图</span>';
 $('u-show-behavior').textContent='↑ 来访与停留';
 const defaults={A:'brands',B:'functionLower',C:'metro',D:'shopping'};
 document.querySelectorAll('#metric-groups button').forEach(btn=>{const original=btn.onclick;btn.onclick=e=>{original?.call(btn,e);const id=defaults[btn.dataset.group];if(id)ATLAS_SCALE.setDetail(id);};});
 function decorate(){
   const desc=ATLAS_METRICS.definitions.find(d=>d.id===ATLAS_ANALYSIS.detail);
   $('metric-chart-title').textContent=desc?.title||(ATLAS_ANALYSIS.group==='overview'?'四类条件概览':'本组指标');
   workspace.classList.toggle('expanded-indicators',ATLAS_ANALYSIS.group!=='overview'&&ATLAS_ANALYSIS.detail==='all');
   $('metric-charts').querySelectorAll('.metric-distribution').forEach(el=>el.classList.add('vertical-mall-chart'));
 }
 new MutationObserver(decorate).observe($('metric-charts'),{childList:true});decorate();
 const requested=new URLSearchParams(location.search).get('metric');
 const initial=ATLAS_METRICS.definitions.find(d=>d.id===requested);
 if(initial){ATLAS_SCALE.setGroup(initial.group);ATLAS_SCALE.setDetail(initial.id);}
 const current=document.getElementById(location.hash.slice(1));
 if(current)requestAnimationFrame(()=>current.scrollIntoView({behavior:'instant',block:'start'}));
 window.dispatchEvent(new Event('scroll'));
})();
