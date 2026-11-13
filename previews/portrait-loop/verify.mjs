import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=new URL('.',import.meta.url).pathname;
const source=readFileSync(new URL('../../assets/avatar-portrait-dark-v6.svg',import.meta.url));
assert.equal(createHash('sha256').update(source).digest('hex'),'d4a1b867c77ac1f796bcc4a4c17d2161e3c52476884a854e74af03cd53d7cb30');
const withoutColors=s=>s.replace(/#[A-Fa-f0-9]{6}/g,'COLOR');
const original=source.toString(),light=readFileSync(root+'avatar-portrait-light.svg','utf8');
const orbit=original.match(/<path d="M133 30[^\n]+\n<circle[^\n]+/)[0];
const content=original.match(/<rect[\s\S]+(?=<\/svg>)/)[0];
const inside=light.split('<g mask="url(#portrait-support)">\n')[1].split('</g>\n<g mask="url(#outside-support)">')[0];
const outside=light.split('<g mask="url(#outside-support)">\n')[1].split('</g>\n<path d="M133 30')[0];
assert.equal(withoutColors(inside),withoutColors(content.replace(orbit,'')));
assert.equal(withoutColors(outside),withoutColors(content.replace(/<rect[^>]+\/>/,'').replace(orbit,'')));
assert.equal(light.slice(0,light.indexOf('<defs>')),original.slice(0,original.indexOf('<rect')));
assert.ok(light.includes('portrait-support'),'Light version must use derived positive tonal support');
mkdirSync(root+'verification',{recursive:true});
const report={sourceUnchanged:true,lightGeometryAndMotionIdentical:true,gifs:{}};
for(const theme of ['dark','light']) {
  const file=root+`avatar-portrait-${theme}-loop.gif`;
  const info=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','stream=width,height,nb_frames,r_frame_rate,duration','-show_entries','format=duration,size','-of','json',file]));
  assert.equal(info.streams[0].width,658); assert.equal(info.streams[0].height,600);
  assert.equal(info.streams[0].nb_frames,'291'); assert.equal(info.format.duration,'11.640000');
  const gif=readFileSync(file);
  assert.ok(gif.includes(Buffer.from('NETSCAPE2.0\x03\x01\x00\x00\x00','binary')),'GIF must loop forever');
  const hashes=execFileSync('ffmpeg',['-v','error','-i',file,'-f','framemd5','-'],{encoding:'utf8'}).split('\n').filter(l=>l&&!l.startsWith('#')).map(l=>l.split(',').at(-1).trim());
  assert.equal(hashes.length,291);
  for(let i=0;i<132;i++) assert.equal(hashes[i],hashes[284-i],`Reverse mismatch at ${i}`);
  for(let i=133;i<=152;i++) assert.equal(hashes[i],hashes[132],'Full hold mismatch');
  assert.equal(hashes[0],hashes.at(-1),'Loop seam mismatch');
  assert.notEqual(hashes[33],hashes[66]); assert.notEqual(hashes[66],hashes[132]);
  execFileSync('ffmpeg',['-v','error','-y','-i',file,'-vf','select=eq(n\\,0)+eq(n\\,33)+eq(n\\,66)+eq(n\\,132)+eq(n\\,218)+eq(n\\,284)','-fps_mode','vfr',root+`verification/${theme}-%02d.png`]);
  report.gifs[theme]={...info.streams[0],bytes:Number(info.format.size),loop:'infinite',reverseFramesIdentical:true,seamIdentical:true};
  // #913: the first export baked white SVG letterboxing into the portrait's edges.
  const edges=execFileSync('magick',[root+`verification/${theme}-04.png`,'-alpha','off','-format','%[hex:p{0,0}] %[hex:p{0,599}]','info:'],{encoding:'utf8'}).trim().toLowerCase();
  const expected=theme==='dark'?'1a1817':'f5f3ed';
  assert.equal(edges,`${expected} ${expected}`,'Portrait edge must match its theme background');
  if(theme==='light') {
    // #913: the first light preview lost tonal support on both beard sides.
    const mean=crop=>Number(execFileSync('magick',[root+'verification/light-04.png','-alpha','off','-crop',crop,'-format','%[fx:mean]','info:'],{encoding:'utf8'}));
    const left=mean('70x100+240+450'),right=mean('50x100+500+450');
    assert.ok(left<.60&&right<.40,`Beard sides lost their shading: ${left}, ${right}`);
    report.gifs[theme].beardSideMeans={left,right};
  }
}
writeFileSync(root+'verification/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
