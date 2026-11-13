import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const require=createRequire(process.env.PLAYWRIGHT_PACKAGE||new URL('../../../vanya-arc/package.json',import.meta.url));
const {chromium}=require('playwright');
const root=new URL('../../',import.meta.url);
for(const [preview,asset] of [['avatar-portrait-dark-loop.gif','avatar-portrait-dark-loop-v1.gif'],['avatar-portrait-light-loop.gif','avatar-portrait-light-loop-v1.gif'],['avatar-portrait-light.svg','avatar-portrait-light-v1.svg'],['dark-full.png','avatar-portrait-dark-still-v1.png'],['light-full.png','avatar-portrait-light-still-v1.png']])assert.ok((await readFile(new URL('previews/portrait-loop/'+preview,root))).equals(await readFile(new URL('assets/'+asset,root))),`${asset} must match its preview source`);
for(const language of ['ru','en']) {
  const text=await readFile(new URL(`assets/identity-${language}-portrait-v1.svg`,root),'utf8');
  const light=await readFile(new URL(`assets/identity-${language}-portrait-v1-light.svg`,root),'utf8');
  const withoutColors=s=>s.replace(/#[a-fA-F0-9]{6}/g,'COLOR').trim();
  assert.equal(withoutColors(light),withoutColors(text),'The light intro must retain its content and layout');
}
const browser=await chromium.launch({executablePath:process.env.CHROME||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
  for(const language of ['ru','en'])for(const theme of ['light','dark'])for(const width of [1100,390,375]) {
    const page=await browser.newPage({viewport:{width,height:1000},colorScheme:theme,reducedMotion:'no-preference'});
    const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>errors.push(r.url()));
    await page.goto(`http://127.0.0.1:48731/previews/profile/${language==='ru'?'':'en.html'}?theme=${theme}`);
    await page.waitForFunction(()=>[...document.querySelectorAll('article img')].every(i=>i.complete&&i.naturalWidth>0));
    const images=await page.locator('article img').evaluateAll(imgs=>imgs.slice(0,10).map(i=>{const r=i.getBoundingClientRect();return {src:i.currentSrc,x:r.x,y:r.y,w:r.width,h:r.height};}));
    assert.ok(images[4].src.includes(`identity-${language}-portrait-v1${theme==='light'?'-light':''}.svg`));
    assert.ok(images[5].src.includes(`avatar-portrait-${theme}-loop-v1.gif`));
    assert.ok(images[4].x<images[5].x,'Text must be left of portrait');
    const left=images[0].x,right=images[3].x+images[3].w;
    for(const [first,last] of [[4,5],[6,9]]){assert.ok(Math.abs(images[first].x-left)<.1);assert.ok(Math.abs(images[last].x+images[last].w-right)<.1);}
    const headerGap=images[4].y-(images[0].y+images[0].h),heroGap=images[6].y-(images[4].y+Math.max(images[4].h,images[5].h));
    console.log({language,theme,width,headerGap,heroGap,portrait:images[5].src.split('/').at(-1)});
    assert.ok(Math.abs(headerGap)<.1,'Header must meet the hero without an inline line-height gap');
    assert.ok(Math.abs(heroGap)<.1,'Hero must meet the next SVG row');
    assert.deepEqual(errors,[]);
    await page.close();
  }
}finally{await browser.close();}
