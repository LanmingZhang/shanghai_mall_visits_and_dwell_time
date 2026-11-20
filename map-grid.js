/* Transparent metric reference, attached to geography rather than the viewport. */
(() => {
  const NS='http://www.w3.org/2000/svg';
  function node(tag,attrs,parent,text){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);if(text)n.textContent=text;parent.appendChild(n);return n;}
  const api=window.ATLAS_GRID={enabled:true,draw(svg,{w,h,scale,tx,ty,step}){
    if(!api.enabled)return;
    const g=node('g',{class:'metric-grid','pointer-events':'none','aria-hidden':'true','data-step-m':step},svg);
    const left=-tx/scale,top=-ty/scale,right=(w-tx)/scale,bottom=(h-ty)/scale;
    const x0=Math.ceil(left/step)*step,y0=Math.ceil(top/step)*step;
    // White under-stroke keeps the transparent grid readable over both aerial
    // photography and solid architectural figure-ground.
    let lines='';
    for(let x=x0;x<=right;x+=step){const px=x*scale+tx;lines+=`M${px} 0V${h}`;}
    for(let y=y0;y<=bottom;y+=step){const py=y*scale+ty;lines+=`M0 ${py}H${w}`;}
    node('path',{d:lines,fill:'none',stroke:'#fffaf0','stroke-opacity':.45,'stroke-width':2},g);
    node('path',{d:lines,fill:'none',stroke:'#775e4b','stroke-opacity':.28,'stroke-width':.7},g);
    let crosses='';
    for(let x=x0;x<=right;x+=step)for(let y=y0;y<=bottom;y+=step){const px=x*scale+tx,py=y*scale+ty;crosses+=`M${px-3} ${py}h6M${px} ${py-3}v6`;}
    node('path',{d:crosses,fill:'none',stroke:'#7a5c42','stroke-opacity':.45,'stroke-width':.8},g);
    const label=step>=1000?`${step/1000} km`:`${step} m`;
    const badge=node('g',{class:'metric-grid-key'},g);
    node('rect',{x:52,y:13,width:130,height:25,fill:'#fff9ed','fill-opacity':.92,stroke:'#bda98e','stroke-opacity':.5},badge);
    node('path',{d:'M60 20h10v10H60zM65 20v10M60 25h10',fill:'none',stroke:'#93775a','stroke-width':.65},badge);
    node('text',{x:77,y:29,fill:'#735a44','font-size':10,'font-family':'Arial, Microsoft YaHei'},badge,`每格 ${label} × ${label}`);
  }};
  document.querySelectorAll('[data-metric-grid-toggle]').forEach(input=>input.addEventListener('change',()=>{
    api.enabled=input.checked;
    if(!api.enabled)document.querySelectorAll('.metric-grid').forEach(g=>g.remove());
    document.querySelectorAll('[data-metric-grid-toggle]').forEach(other=>other.checked=api.enabled);
    document.dispatchEvent(new Event('atlas:grid-change'));
  }));
})();
