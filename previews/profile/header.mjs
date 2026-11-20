import {readFile,writeFile} from 'node:fs/promises';

// Current profile artwork must use the @vanya/ui palette.
// Canonical authority: VanDalkvist/vanya-ui/src/tokens.css.
// v2 nav tiles are only geometry/text references, not a color authority.
const palette={
  dark:{
    '#1E1C1A':'#15120F', // --ground
    '#ECE4D6':'#EBE7E2', // --ink
    '#B8AC9F':'#97918A', // --ink-faint
    '#504940':'#2C2A27', // --border composited over --ground
    '#E5A476':'#F2814A'  // --accent
  },
  light:{
    '#F6F5F0':'#F6F3ED', // --ground
    '#29231D':'#2A241F', // --ink
    '#685F54':'#635C57', // --ink-faint
    '#D4CABD':'#E1DEDA', // --border composited over --ground
    '#B65A34':'#AA4C23'  // --accent
  }
};
// #913: 57px tiles leave a phone gap; 64px still missed the 24px
// GitHub file viewer line box at 375px. 70px covers both contexts.
for(const language of ['ru','en'])for(const theme of ['light','dark'])for(let tile=1;tile<=4;tile++) {
  const root=new URL('../../assets/',import.meta.url);
  const source=await readFile(new URL(`nav-${language}-v2-${tile}-${theme}.svg`,root),'utf8');
  let padded=source.replaceAll('height="57"','height="70"')
    .replace('viewBox="0 0 220 57"','viewBox="0 0 220 70"')
    .replaceAll('y="36"','y="42.5"')
    .replace('M0 54 H220','M0 67 H220');
  padded=padded.replace(/#[0-9a-fA-F]{6}\b/g,color=>{
    const target=palette[theme][color.toUpperCase()];
    if(!target)throw new Error(`Unknown ${theme} SVG token: ${color}`);
    return target;
  });
  await writeFile(new URL(`nav-${language}-v4-${tile}-${theme}.svg`,root),padded);
}
