/* Georeferenced cached imagery: display tint only, metre geometry preserved. */
(() => {
  const centers={A:[4000,9000],B:[7500,4500]};
  const plates={};
  for(const area of ['A','B']){
    plates[area]={};
    for(const kind of ['detail','context']){
      const size=kind==='detail'?3600:14000,image=new Image();
      const p=plates[area][kind]={image,ready:false,x:centers[area][0]-size/2,y:centers[area][1]-size/2,size};
      image.onload=()=>{p.ready=true;document.dispatchEvent(new Event('atlas:plates-ready'));};
      image.onerror=()=>{p.ready=false;};
      image.src=`satellite/plates/${area}-${kind}.jpg`;
    }
  }
  function draw(ctx,area,kind,opacity=1){
    const p=plates[area][kind];if(!p.ready)return false;
    ctx.save();ctx.globalAlpha=opacity;ctx.drawImage(p.image,p.x,p.y,p.size,p.size);ctx.restore();return true;
  }
  window.ATLAS_PLATES={plates,draw};
})();
