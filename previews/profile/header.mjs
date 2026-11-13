import {readFile,writeFile} from 'node:fs/promises';
// #913: 57px tiles leave a phone gap; 64px still missed the file viewer's
// 24px line box (the profile uses 21px). Padding to 70px covers both at 375px.
for(const language of ['ru','en'])for(const theme of ['light','dark'])for(let tile=1;tile<=4;tile++) {
  const root=new URL('../../assets/',import.meta.url);
  const source=await readFile(new URL(`nav-${language}-v2-${tile}-${theme}.svg`,root),'utf8');
  const padded=source.replaceAll('height="57"','height="70"').replace('viewBox="0 0 220 57"','viewBox="0 0 220 70"').replaceAll('y="36"','y="42.5"').replace('M0 54 H220','M0 67 H220');
  await writeFile(new URL(`nav-${language}-v4-${tile}-${theme}.svg`,root),padded);
}
