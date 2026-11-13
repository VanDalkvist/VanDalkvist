import {readFile,writeFile} from 'node:fs/promises';
// #913: at a 375–390px viewport the old 57px tiles shrink below GitHub's
// 21px inline line box and leave a gap. A little vertical padding keeps the row flush.
for(const language of ['ru','en'])for(const theme of ['light','dark'])for(let tile=1;tile<=4;tile++) {
  const root=new URL('../../assets/',import.meta.url);
  const source=await readFile(new URL(`nav-${language}-v2-${tile}-${theme}.svg`,root),'utf8');
  const padded=source.replaceAll('height="57"','height="64"').replace('viewBox="0 0 220 57"','viewBox="0 0 220 64"').replaceAll('y="36"','y="39.5"').replace('M0 54 H220','M0 61 H220');
  await writeFile(new URL(`nav-${language}-v3-${tile}-${theme}.svg`,root),padded);
}
