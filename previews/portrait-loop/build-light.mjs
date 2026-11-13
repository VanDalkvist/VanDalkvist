import {readFile,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';

// Derive soft tonal support from the original marks; never redraw the face.
export async function buildLight(page,source,map,ground,root,outsideMap) {
  const orbit=source.match(/<path d="M133 30[^\n]+\n<circle[^\n]+/)[0];
  const content=source.match(/<rect[\s\S]+(?=<\/svg>)/)[0];
  const noBackground=content.replace(/<rect[^>]+\/>/,'').replace(orbit,'');
  await page.setContent('<style>body{margin:0;background:transparent}svg{display:block}</style>'+source.replace(/<rect[^>]+\/>/,'').replace(orbit,''));
  await page.evaluate(()=>document.getAnimations().forEach(a=>{a.pause();a.currentTime=5280}));
  await page.screenshot({path:root+'portrait-alpha.png',omitBackground:true});
  const density=execFileSync('magick',[root+'portrait-alpha.png','-alpha','extract','-blur','0x12','-depth','8','gray:-']);
  // Keep the dominant connected portrait, not detached peripheral flecks.
  const width=658,height=600,seen=new Uint8Array(width*height);
  let largest=[];
  for(let seed=0;seed<density.length;seed++) {
    if(seen[seed]||density[seed]<=5)continue;
    const component=[seed];seen[seed]=1;
    for(let j=0;j<component.length;j++) {
      const p=component[j],x=p%width,y=Math.floor(p/width);
      const neighbors=[];
      if(x>0)neighbors.push(p-1);if(x<width-1)neighbors.push(p+1);
      if(y>0)neighbors.push(p-width);if(y<height-1)neighbors.push(p+width);
      for(const n of neighbors)if(!seen[n]&&density[n]>5){seen[n]=1;component.push(n);}
    }
    if(component.length>largest.length)largest=component;
  }
  const mask=Buffer.alloc(width*height);
  for(const p of largest)mask[p]=Math.round(Math.min(1,Math.max(0,(density[p]-5)/(46-5)))*255);
  execFileSync('magick',['-size',`${width}x${height}`,'-depth','8','gray:-','-blur','0x2',root+'portrait-support.png'],{input:mask});
  const support=(await readFile(root+'portrait-support.png')).toString('base64');
  const recolor=(s,palette)=>s.replace(/#[A-Fa-f0-9]{6}/g,c=>palette[c]);
  const header=source.slice(0,source.indexOf('<rect'));
  const image=`<image width="439" height="400" href="data:image/png;base64,${support}"`;
  const maskAttrs='maskUnits="userSpaceOnUse" x="0" y="0" width="439" height="400"';
  const defs=`<defs><filter id="inverse-support" color-interpolation-filters="sRGB"><feComponentTransfer><feFuncR type="linear" slope="-1" intercept="1"/><feFuncG type="linear" slope="-1" intercept="1"/><feFuncB type="linear" slope="-1" intercept="1"/></feComponentTransfer></filter><mask id="portrait-support" ${maskAttrs}>${image}/></mask><mask id="outside-support" ${maskAttrs}>${image} filter="url(#inverse-support)"/></mask></defs>\n`;
  const light=header+defs+`<rect width="439" height="400" fill="${ground}"/>\n<g mask="url(#portrait-support)">\n`+recolor(content.replace(orbit,''),map)+'</g>\n<g mask="url(#outside-support)">\n'+recolor(noBackground,outsideMap)+'</g>\n'+recolor(orbit,map)+'\n</svg>\n';
  await writeFile(root+'avatar-portrait-light.svg',light);
  return light;
}
