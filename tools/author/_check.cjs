const fs=require('fs');
const norm=(s)=>s.replace(/\s+/g,'').replace(/[“”"「」『』]/g,'').replace(/…+/g,'...').replace(/\.+/g,'.').replace(/[!！?？]/g,'').replace(/[，,。.]/g,'');
for(const [f,ch] of [['虚数根','ch01'],['苦涩的颜料','ch02'],['从此再也不见','ch03'],['人们将往何处去','ch04']]){
  const md=fs.readFileSync('../微调/'+f+'.md','utf8').split(/\r?\n/);
  const lines=md.filter(l=>/^\+ /.test(l)).map(l=>l.replace(/^\+ (\[[^\]]+\] )?/,''));
  const chap=JSON.parse(fs.readFileSync('src/content/private/chapters/'+ch+'.json','utf8'));
  const texts=[];for(const s of chap.scenes)for(const b of s.beats){if(b.type==='dialogue'||b.type==='narration'||b.type==='quote')texts.push(b.text);}
  const pool=new Set(texts.map(norm));
  const missing=lines.filter(t=>!pool.has(norm(t)));
  console.log(f,'md lines',lines.length,'beats text',texts.length,'missing',missing.length);
  missing.slice(0,8).forEach(t=>console.log('  MISS:',t.slice(0,60)));
}