// Render the original CSS animation in Chromium, then replay those exact frames backwards.
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { buildLight } from './build-light.mjs';
const require = createRequire(process.env.PLAYWRIGHT_PACKAGE || new URL('../../../vanya-arc/package.json', import.meta.url));
const { chromium } = require('playwright');
const root = new URL('.', import.meta.url).pathname;
const source = await readFile(new URL('../../assets/avatar-portrait-dark-v6.svg', import.meta.url),'utf8');
const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
try {
  const page = await browser.newPage({viewport:{width:658,height:600},deviceScaleFactor:1,reducedMotion:'no-preference'});
  // Primary reference: VanDalkvist/vanya-ui src/tokens.css, executable light-theme tokens.
  const tokens = {ground:'oklch(0.964 0.008 85)',ink:'oklch(0.265 0.012 60)',accent:'oklch(0.530 0.135 42)'};
  const colors = await page.evaluate(({tokens})=>{
    const canvas=document.createElement('canvas'); canvas.width=canvas.height=1;
    const ctx=canvas.getContext('2d');
    function hex(css){ctx.clearRect(0,0,1,1);ctx.fillStyle=css;ctx.fillRect(0,0,1,1);return '#'+[...ctx.getImageData(0,0,1,1).data].slice(0,3).map(n=>n.toString(16).padStart(2,'0')).join('');}
    const mix=t=>hex(`color-mix(in oklab, ${tokens.ink} ${(1-t)*100}%, ${tokens.ground})`);
    return {ground:hex(tokens.ground),ink:hex(tokens.ink),accent:hex(tokens.accent),
      strokes:[.2,.35,.5,.65,.82,.96].map(mix),fills:[.22,.4,.6,.78,.9].map(mix),
      outside:[0,.12,.24,.38,.55,.75].map(mix)};
  },{tokens});
  const map = {'#1A1817':colors.ink,'#D59A66':colors.accent},outsideMap={...map};
  ['#5C4434','#795641','#926E52','#AC8766','#CCAA86','#EDC7A5'].forEach((c,i)=>{map[c]=colors.strokes[i];outsideMap[c]=colors.outside[i];});
  ['#5E4534','#866149','#AA8062','#C79A79','#E6BA95'].forEach((c,i)=>{map[c]=colors.fills[i];outsideMap[c]=colors.outside[i];});
  for(const c of source.match(/#[A-Fa-f0-9]{6}/g))assert.ok(map[c]&&outsideMap[c],`Unknown source color ${c}`);
  const light=await buildLight(page,source,map,colors.ground,root,outsideMap);
  await writeFile(root+'palette.json',JSON.stringify({tokens,colors,map,outsideMap},null,2)+'\n');
  const fps=25, end=132, holdFull=20, holdStart=6;
  for(const [theme,svg] of [['dark',source],['light',light]]) {
    const frames=root+`frames-${theme}/`; await mkdir(frames,{recursive:true});
    await page.setContent('<style>body{margin:0}svg{display:block}</style>'+svg);
    assert.equal(await page.evaluate(()=>document.getAnimations().length),theme==='dark'?37:74);
    await page.evaluate(()=>document.getAnimations().forEach(a=>a.pause()));
    for(let i=0;i<=end;i++) {
      await page.evaluate(t=>document.getAnimations().forEach(a=>a.currentTime=t),i*1000/fps);
      await page.screenshot({path:frames+String(i).padStart(4,'0')+'.png'});
    }
    await copyFile(frames+'0132.png',root+`${theme}-full.png`);
    const order=[...Array(end+1).keys(),...Array(holdFull).fill(end),...Array.from({length:end},(_,i)=>end-1-i),...Array(holdStart).fill(0)];
    const list=order.map(i=>`file '${frames+String(i).padStart(4,'0')+'.png'}'\nduration ${1/fps}`).join('\n');
    await writeFile(root+`${theme}-frames.txt`,list+'\n');
    execFileSync('ffmpeg',['-v','warning','-y','-f','concat','-safe','0','-i',root+`${theme}-frames.txt`,'-filter_complex','[0:v]split[a][b];[a]palettegen=reserve_transparent=0[p];[b][p]paletteuse=dither=none','-loop','0',root+`avatar-portrait-${theme}-loop.gif`],{stdio:'inherit'});
    console.log(`${theme}: ${order.length} frames, ${order.length/fps}s, ${fps}fps`);
  }
} finally {await browser.close();}
