const fs=require('fs');
for(const model of ['embera','aether','flavo','fera','ignite']){
 const file=model+'.html';let h=fs.readFileSync(file,'utf8');
 const pattern=/<section class="pf-editorial-entry"[\s\S]*?<\/section>/g;
 const matches=h.match(pattern)||[];if(matches.length!==1)throw Error(file+': expected one added introduction');
 h=h.replace(pattern,'').replace('<section id="product-selection" class="epp-hero"','<section class="epp-hero"').replace('<link rel="stylesheet" href="assets/css/editorial-gallery.css?v=1">','');
 fs.writeFileSync(file,h);console.log(file+': introduction removed; product gallery retained');
}
