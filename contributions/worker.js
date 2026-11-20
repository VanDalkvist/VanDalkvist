// VANYA / ARC Contribution Calendar v2
// Color authority: VanDalkvist/vanya-ui src/tokens.css (exact OKLCH values).
// 21 colors: 0 = neutral inactive, 1..20 = progressively darker terracotta.
const USER = "VanDalkvist";
const DESIGN_TOKENS = {
  light: {
    ground: [0.964, 0.008, 85], surface: [0.979, 0.006, 85],
    inset: [0.940, 0.010, 85], ink: [0.265, 0.012, 60],
    faint: [0.480, 0.012, 65], accent: [0.530, 0.135, 42]
  },
  dark: {
    ground: [0.185, 0.008, 65], surface: [0.235, 0.010, 65],
    inset: [0.150, 0.006, 65], ink: [0.930, 0.008, 75],
    faint: [0.660, 0.012, 75], accent: [0.720, 0.155, 45]
  }
};
function oklchHex(L,C,h) {
  const a=C*Math.cos(h*Math.PI/180), b=C*Math.sin(h*Math.PI/180);
  const ll=L+0.3963377774*a+0.2158037573*b;
  const mm=L-0.1055613458*a-0.0638541728*b;
  const ss=L-0.0894841775*a-1.2914855480*b;
  const l=ll*ll*ll,m=mm*mm*mm,s=ss*ss*ss;
  const linear=[
    4.0767416621*l-3.3077115913*m+0.2309699292*s,
    -1.2684380046*l+2.6097574011*m-0.3413193965*s,
    -0.0041960863*l-0.7034186147*m+1.7076147010*s
  ];
  return "#"+linear.map(v=>{
    v=Math.max(0,Math.min(1,v));
    const gamma=v<=0.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-0.055;
    return Math.round(gamma*255).toString(16).padStart(2,"0");
  }).join("").toUpperCase();
}
const toHex=v=>oklchHex(...v);
const lerp=(a,b,t)=>a+(b-a)*t;
function makePalette(theme) {
  const t=DESIGN_TOKENS[theme];
  const dark=theme==="dark";
  // The canonical @vanya/ui accent is an exact anchor in the ramp.
  // Zero uses a subdued surface color and never means "highest" activity.
  const zero=toHex(dark?t.surface:t.inset);
  const pale=dark?[0.92,0.022,45]:[0.91,0.025,42];
  const deep=dark?[0.34,0.080,45]:[0.31,0.064,42];
  const accent=t.accent;
  const anchor=dark?7:13;
  const levels=[zero];
  for(let i=1;i<=20;i++){
    let start,end,u;
    if(i<=anchor){start=pale;end=accent;u=(i-1)/(anchor-1);}
    else {start=accent;end=deep;u=(i-anchor)/(20-anchor);}
    levels.push(toHex(start.map((v,k)=>lerp(v,end[k],u))));
  }
  return levels;
}
const PALETTES={dark:makePalette("dark"),light:makePalette("light")};
const THEMES=Object.fromEntries(Object.entries(DESIGN_TOKENS).map(([name,t])=>[
  name,{bg:toHex(t.ground),fg:toHex(t.ink),sub:toHex(t.faint),line:toHex(t.faint)}
]));
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
async function getDays(env) {
  // Prefer GitHub's official GraphQL data when an owner token is configured.
  // Store GITHUB_TOKEN only as a Cloudflare Secret, never in the repository.
  if (env.GITHUB_TOKEN) {
    try {
      const response=await fetch("https://api.github.com/graphql",{
        method:"POST",
        headers:{"Authorization":"Bearer "+env.GITHUB_TOKEN,"Content-Type":"application/json","User-Agent":"VanyaArc-ContributionCalendar/1.0"},
        body:JSON.stringify({query:`query Calendar { user(login: "VanDalkvist") { contributionsCollection { contributionCalendar { weeks { contributionDays { date contributionCount } } } } } }`})
      });
      if (!response.ok) throw new Error("GitHub GraphQL HTTP "+response.status);
      const json=await response.json();
      if (json.errors?.length) throw new Error("GitHub GraphQL query failed");
      const weeks=json.data?.user?.contributionsCollection?.contributionCalendar?.weeks;
      if (!Array.isArray(weeks)) throw new Error("Missing contribution weeks");
      return validate(weeks.flatMap(w=>(w.contributionDays||[]).map(d=>({date:d.date,count:d.contributionCount}))));
    } catch(err) {
      console.warn("GitHub GraphQL unavailable; using public contributions",String(err));
    }
  }
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
function render(days,theme,lang) {
  const t=THEMES[theme], palette=PALETTES[theme];
  const today=Date.now(), nowUTC=Date.UTC(new Date(today).getUTCFullYear(),new Date(today).getUTCMonth(),new Date(today).getUTCDate());
  const current=days.filter(d=>dateUTC(d.date)<=nowUTC).slice(-366);
  if (!current.length) throw new Error("Empty calendar");
  const end=dateUTC(current[current.length-1].date), first=end-365*DAY;
  const included=current.filter(d=>dateUTC(d.date)>=first);
  const map=new Map(included.map(d=>[d.date,d.count]));
  const total=included.reduce((n,d)=>n+d.count,0);
  const positives=included.map(d=>d.count).filter(n=>n>0).sort((a,b)=>a-b);
  const cap=Math.max(1,positives[Math.floor((positives.length-1)*0.99)]||1);
  const intensity=n=>n<=0?0:Math.min(20,Math.max(1,Math.ceil(20*Math.log1p(n)/Math.log1p(cap))));
  // Monday-first ISO week layout: JS getUTCDay() uses Sunday=0.
  const firstWeekday=(new Date(first).getUTCDay()+6)%7; // Mon=0 ... Sun=6
  const monday=first-firstWeekday*DAY;
  const weeks=Math.floor((end-monday)/DAY/7)+1;
  const step=15, size=12, left=55, top=84; // 3-unit gutters, plotting across almost the full panel width
  const title=total.toLocaleString(lang==="en"?"en-US":"ru-RU")+(lang==="en"?" GitHub contributions in the last year":" contributions за год");
  const chunks=[`<svg xmlns="http://www.w3.org/2000/svg" width="880" height="235" viewBox="0 0 880 235" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title><rect width="880" height="235" fill="${t.bg}"/><g font-family="Manrope,Arial,sans-serif">\n<text x="26" y="32" font-size="19" font-weight="600" fill="${t.fg}">${esc(lang==="en"?"Work rhythm":"Ритм работы")}</text><text x="854" y="31" text-anchor="end" font-size="14" fill="${t.sub}">${esc(total.toLocaleString("ru-RU"))} contributions</text><path d="M26 47 H854" stroke="${t.line}" stroke-width=".85"/>\n`];
  const months=lang==="en"?["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]:["янв","фев","мар","апр","май","июн","июл","авг","сен","окт","ноя","дек"];
  let prevMonth=-1;
  for(let w=0;w<weeks;w++){
    for(let dow=0;dow<7;dow++){
      const at=monday+(w*7+dow)*DAY;
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
  const weekdays=lang==="en"?["Mon","Wed","Fri"]:["пн","ср","пт"];
  chunks.push(`<g font-family="Manrope,Arial,sans-serif" font-size="11" fill="${t.sub}"><text x="26" y="${top+1*step+9}">${weekdays[0]}</text><text x="26" y="${top+2*step+9}">${weekdays[1]}</text><text x="26" y="${top+4*step+9}">${weekdays[2]}</text><text x="26" y="221">${lang==="en"?"Less":"Меньше"}</text>`);
  for(let i=0;i<palette.length;i++)chunks.push(`<rect x="${87+i*10}" y="212" width="8" height="8" rx="1.5" fill="${palette[i]}"/>`);
  chunks.push(`<text x="308" y="221">${lang==="en"?"More":"Больше"}</text><text x="854" y="221" text-anchor="end">VANYA / ARC · GitHub</text></g></g></svg>`);
  return chunks.join("");
}
function fallback(theme,lang) {
 const t=THEMES[theme];
 return `<svg xmlns="http://www.w3.org/2000/svg" width="880" height="235" viewBox="0 0 880 235"><rect width="880" height="235" fill="${t.bg}"/><text x="26" y="35" fill="${t.fg}" font-family="Manrope,Arial" font-size="20">${lang==="en"?"Work rhythm":"Ритм работы"}</text><path d="M26 47 H854" stroke="${t.line}"/><text x="26" y="114" fill="${t.sub}" font-family="Manrope,Arial" font-size="15">${lang==="en"?"GitHub contribution data is temporarily unavailable":"Данные GitHub временно недоступны"}</text></svg>`;
}
export default {
  async fetch(request,env,ctx){
    const url=new URL(request.url), theme=url.searchParams.get("theme")==="light"?"light":"dark", lang=url.searchParams.get("lang")==="en"?"en":"ru";
    const cacheKey=new Request(url.origin+"/?v=7&theme="+theme+"&lang="+lang,{method:"GET"});
    const cache=caches.default, cached=await cache.match(cacheKey);
    if(cached)return cached;
    try {
      const svg=render(await getDays(env),theme,lang);
      const res=new Response(svg,{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public,max-age=3600,s-maxage=14400","X-Content-Type-Options":"nosniff","Access-Control-Allow-Origin":"*"}});
      ctx.waitUntil(cache.put(cacheKey,res.clone()));
      return res;
    }catch(err){
      return new Response(fallback(theme,lang),{headers:{"Content-Type":"image/svg+xml; charset=utf-8","Cache-Control":"public,max-age=60","X-Content-Type-Options":"nosniff"}});
    }
  }
};
