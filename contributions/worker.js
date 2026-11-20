// VANYA / ARC contribution heatmap v1
// 21 discrete steps: index 0 = no activity, 1..20 = increasing intensity.
const USER = "VanDalkvist";
const PALETTES = {
  dark: ["#302B28","#49332E","#5A352C","#6C392D","#7D3E2D","#8D432F","#9D4931","#AC5133","#BA5A37","#C7653C","#D27142","#DA7D49","#E28B50","#E89A5A","#EFA964","#F3B771","#F7C481","#F9D095","#FBDCAD","#FCE6C4","#FFF1DD"],
  light: ["#EAE4DD","#F6DED0","#F2CFBB","#EDBDA0","#E9AB86","#E29770","#DA845B","#D2724D","#C76443","#BB593B","#AE4F36","#A04732","#91402F","#83392C","#75332B","#682E2A","#5D2927","#542525","#4C2224","#431F21","#371B1E"]
};
const THEMES = {
  dark: {bg:"#1E1C1A",fg:"#ECE4D6",sub:"#B8AC9F",line:"#504940"},
  light: {bg:"#F6F5F0",fg:"#29231D",sub:"#685F54",line:"#D4CABD"}
};
const DAY = 86400000;
const esc = v => String(v).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[c]));
const attr = (s,k) => { const m = s.match(new RegExp("(?:^|\\s)"+k+"=[\\\"']([^\\\"']*)[\\\"']", "i")); return m?.[1] ?? null; };
const clean = v => v.replace(/<[^>]*>/g," ").replace(/&nbsp;|&#160;/g," ").replace(/\s+/g," ").trim();
const dateUTC = iso => Date.parse(iso+"T00:00:00Z");
const isoUTC = ms => new Date(ms).toISOString().slice(0,10);
function parseHtml(html) {
  const tips = new Map();
  for (const m of html.matchAll(/<tool-tip\b([^>]*)>([\s\S]*?)<\/tool-tip>/gi)) {
    const id = attr(m[1],"for"); if (id) tips.set(id,clean(m[2]));
  }
  const days = [];
  for (const m of html.matchAll(/<(?:td|rect)\b([^>]*)>/gi)) {
    const a=m[1],date=attr(a,"data-date");
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const tip = tips.get(attr(a,"id")) || attr(a,"aria-label") || "";
    const found = tip.match(/([\d,]+)\s+contributions?\b/i);
    const raw=attr(a,"data-count");
    const n = found ? Number(found[1].replace(/,/g,"")) :
      raw !== null ? Number(raw) :
      (/\bno contributions?\b/i.test(tip) || attr(a,"data-level")==="0" ? 0 : NaN);
    if (Number.isSafeInteger(n) && n>=0) days.push({date,count:n});
  }
  return days;
}
function validate(days) {
  const map = new Map();
  for (const item of days) {
    if (typeof item.date==="string" && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
      Number.isSafeInteger(item.count) && item.count>=0) map.set(item.date,item.count);
  }
  if (map.size<330) throw new Error("Incomplete contribution calendar");
  return [...map].map(([date,count])=>({date,count})).sort((a,b)=>a.date.localeCompare(b.date));
}
async function getDays() {
  // Public GitHub calendar; exact counts come from cell tooltips, not the 0..4 color level.
  try {
    const response=await fetch("https://github.com/users/"+USER+"/contributions",{
      headers:{"Accept":"text/html","User-Agent":"VanyaArc-ContributionCalendar/1.0"},
      cf:{cacheTtl:14400,cacheEverything:true}
    });
    if (!response.ok) throw new Error("GitHub "+response.status);
    return validate(parseHtml(await response.text()));
  } catch (err) {
    // Community API fallback provides exact daily counts without exposing a token.
    const response=await fetch("https://github-contributions-api.jogruber.de/v4/"+USER+"?y=last",{
      headers:{"Accept":"application/json"},cf:{cacheTtl:14400,cacheEverything:true}
    });
    if (!response.ok) throw new Error("Contribution API "+response.status);
    const data=await response.json();
    return validate((data.contributions||[]).map(d=>({date:d.date,count:d.count})));
  }
}
function render(days,theme) {
  const t=THEMES[theme], palette=PALETTES[theme];
  const today=Date.now(), nowUTC=Date.UTC(new Date(today).getUTCFullYear(),new Date(today).getUTCMonth(),new Date(today).getUTCDate());
  const current=days.filter(d=>dateUTC(d.date)<=nowUTC).slice(-366);
  if (!current.length) throw new Error("Empty calendar");
  const end=dateUTC(current[current.length-1].date), first=end-364*DAY;
  const included=current.filter(d=>dateUTC(d.date)>=first);
  const map=new Map(included.map(d=>[d.date,d.count]));
  const total=included.reduce((n,d)=>n+d.count,0);
  const positives=included.map(d=>d.count).filter(n=>n>0).sort((a,b)=>a-b);
  const cap=Math.max(1,positives[Math.floor((positives.length-1)*0.99)]||1);
  const intensity=n=>n<=0?0:Math.min(20,Math.max(1,Math.ceil(20*Math.log1p(n)/Math.log1p(cap))));
  const sunday=first-new Date(first).getUTCDay()*DAY;
  const weeks=Math.floor((end-sunday)/DAY/7)+1;
  const step=15, size=10, left=50, top=84;
  const title=total.toLocaleString("ru-RU")+" contributions за 365 дней";
  const chunks=[`<svg xmlns="http://www.w3.org/2000/svg" width="880" height="235" viewBox="0 0 880 235" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="880" height="235" fill="${t.bg}"/><g font-family="Manrope,Arial,sans-serif">\n<text x="26" y="32" font-size="19" font-weight="600" fill="${t.fg}">Ритм работы</text><text x="854" y="31" text-anchor="end" font-size="14" fill="${t.sub}">${esc(total.toLocaleString("ru-RU"))} contributions</text><path d="M26 47 H854" stroke="${t.line}" stroke-width=".85"/>\n`];
  const months=["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
  let prevMonth=-1;
  for(let w=0;w<weeks;w++){
    for(let dow=0;dow<7;dow++){
      const at=sunday+(w*7+dow)*DAY;
      if(at<first||at>end)continue;
      const date=isoUTC(at),count=map.get(date);
      if(count===undefined)continue;
      const x=left+w*step,y=top+dow*step;
      const level=intensity(count);
      chunks.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${palette[level]}"><title>${date}: ${count} contributions</title></rect>`);
      const mo=new Date(at).getUTCMonth();
      if(mo!==prevMonth && dow===0 && x<830){
        chunks.push(`<text x="${x}" y="70" font-size="12" fill="${t.sub}">${months[mo]}</text>`);
        prevMonth=mo;
      }
    }
  }
  chunks.push(`<g font-family="Manrope,Arial,sans-serif" font-size="11" fill="${t.sub}"><text x="27" y="${top+1*step+9}">пн</text><text x="27" y="${top+3*step+9}">ср</text><text x="27" y="${top+5*step+9}">пт</text><text x="26" y="221">Меньше</text>`);
  for(let i=0;i<palette.length;i++)chunks.push(`<rect x="${87+i*10}" y="212" width="8" height="8" rx="1.5" fill="${palette[i]}"/>`);
  chunks.push(`<text x="308" y="221">Больше</text><text x="854" y="221" text-anchor="end">VANYA / ARC · GitHub</text></g></g></svg>`);
  return chunks.join("");
}
function fallback(theme) {
 const t=THEMES[theme];
 return `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="235" viewBox="0 0 880 235"><rect width="880" height="235" fill="${t.bg}"/><text x="26" y="35" fill="${t.fg}" font-family="Manrope,Arial" font-size="20">Ритм работы</text><path d="M26 47 H854" stroke="${t.line}"/><text x="26" y="114" fill="${t.sub}" font-family="Manrope,Arial" font-size="15">Данные GitHub временно недоступны</text></svg>`;
}
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url), theme=url.searchParams.get("theme")==="light"?"light":"dark";
    const cacheKey=new Request(url.origin+"/?theme="+theme,{method:"GET"});
    const cache=caches.default, cached=await cache.match(cacheKey);
    if(cached)return cached;
    try {
      const svg=render(await getDays(),theme);
      const res=new Response(svg,{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public,max-age=3600,s-maxage=14400","X-Content-Type-Options":"nosniff","Access-Control-Allow-Origin":"*"}});
      ctx.waitUntil(cache.put(cacheKey,res.clone()));
      return res;
    }catch(err){
      return new Response(fallback(theme),{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public,max-age=60","X-Content-Type-Options":"nosniff"}});
    }
  }
};
