const path=require('node:path');
const fs=require('node:fs');
const root=path.resolve(__dirname,'../..');
const modules=path.join(root,'design-review/aether-3d/tooling/node_modules');
const esbuild=require(path.join(modules,'esbuild'));
esbuild.buildSync({
  entryPoints:[path.join(__dirname,'scene.js')],bundle:true,minify:true,format:'esm',target:['es2020'],
  nodePaths:[modules],outfile:path.join(root,'assets/js/vendor/product-three-viewer.min.js'),legalComments:'eof'
});
fs.copyFileSync(path.join(modules,'three/LICENSE'),path.join(root,'assets/js/vendor/THREE-LICENSE.txt'));
