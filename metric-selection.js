/* Shared indicator selection for the workbench and the regression. */
(() => {
 const M=ATLAS_METRICS;
 const removed=new Set(['floorLower','floors','mallGates','gatePending','gfa','site','buildingRecords','functionTotal','far','entrances','metro123','bus123','stationsOperating','priceRecords','internalExcluded']);
 const moveToC=new Set(['propertyAoi','footprint','coverageBuffer','heightBuffer','heightP90']);
 // A keeps the adopted commercial area; B's distinct audit source stays in the data, not as a second display predictor.
 removed.add('commercialB');
 const kept=M.definitions.filter(d=>!removed.has(d.id));
 kept.forEach(d=>{if(moveToC.has(d.id))d.group='C';});
 const order=['area','brands','grade','cat1','cat2','cat3','cat4','cat5','cat6','overlap1','overlap','similarity','floorArea','functionLower','countable','entranceCandidates','resid','office','mixed','green','water','road','metro','bus','stations','skeleton','priceMedian','priceMean','development','builtArea','heightValid','developmentHalf','propertyAoi','footprint','coverageBuffer','heightBuffer','heightP90','shopping','culture','sports','parks','destinations','diversity'];
 kept.sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
 M.definitions.splice(0,M.definitions.length,...kept);
})();
