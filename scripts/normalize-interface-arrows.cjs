const fs=require('fs'),path=require('path');
const files=fs.readdirSync('.').filter(f=>f.endsWith('.html'));
for(const dir of ['assets/css','assets/js'])for(const f of fs.readdirSync(dir))if(/\.(css|js)$/.test(f))files.push(path.join(dir,f));
let counts=[];for(const file of files){let s=fs.readFileSync(file,'utf8');let n=0;s=s.replace(/[↗↘↙↖⬆⬇➡⬅↔↕→←↑↓][\uFE0E\uFE0F]?/gu,m=>{n++;return m[0]+'\uFE0E'});if(n){fs.writeFileSync(file,s);counts.push({file,count:n});}}
// Refresh shared files so phone browsers receive the icon correction.
for(const file of files.filter(f=>f.endsWith('.html'))){let s=fs.readFileSync(file,'utf8');s=s.replace(/((?:src|href)="assets\/(?:css|js)\/[^"?]+\.(?:css|js))(?:\?[^" ]*)?"/g,(all,base)=>base+'?v=20260917icons"');fs.writeFileSync(file,s);}
console.log(JSON.stringify(counts));
