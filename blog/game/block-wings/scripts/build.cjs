const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const esbuild = require('esbuild');
const root = path.resolve(__dirname, '..');
const scripts = ['curriculum','combat','enemy-motion','audio-fx','blizzard','item-vfx','bullets','spells','arsenal','magic-particles','phaser-scene','game'];
(async () => {
  const source = scripts.map(name => fs.readFileSync(path.join(root, name+'.js'), 'utf8')).join('\n;\n');
  const js = (await esbuild.transform(source, {minify:true,target:'es2020',legalComments:'none',charset:'utf8'})).code;
  const css = (await esbuild.transform(fs.readFileSync(path.join(root,'game.css'),'utf8'), {loader:'css',minify:true,target:'es2020'})).code;
  const hash = crypto.createHash('sha256').update(js+css).digest('hex').slice(0,12);
  fs.mkdirSync(path.join(root,'dist'),{recursive:true});
  fs.writeFileSync(path.join(root,'dist/game.min.js'),js);
  fs.writeFileSync(path.join(root,'dist/game.min.css'),css);
  let html = fs.readFileSync(path.join(root,'index.template.html'),'utf8');
  html = html.replace('game.css',`dist/game.min.css?v=${hash}`);
  html = html.replace(/<script src="vendor\/phaser[^\"]+"><\/script>[\s\S]*?(?=<\/body>)/,
    `<script src="vendor/phaser-3.90.0.min.js"></script><script src="dist/game.min.js?v=${hash}"></script>`);
  fs.writeFileSync(path.join(root,'index.html'),html);
  const report={version:'1.0.0',build:hash,sourceJavaScriptBytes:Buffer.byteLength(source),javascriptBytes:Buffer.byteLength(js),cssBytes:Buffer.byteLength(css)};
  fs.writeFileSync(path.join(root,'dist/build.json'),JSON.stringify(report,null,2)+'\n');
  console.log(report);
})().catch(e=>{console.error(e);process.exit(1)});
