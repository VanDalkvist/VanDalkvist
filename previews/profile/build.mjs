// Render the actual READMEs through GitHub's Markdown API, with GitHub's own CSS.
import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
const root=new URL('../../',import.meta.url).pathname;
const styles=['light-0011b1fed09cb294','dark-37b5e41810563d82','primer-primitives-bd624c4ec96b42e9','primer-2aeb1babdc762f70','global-747fc17113063fdc','github-d4a7053a1b3b1731'];
for(const [language,file,output] of [['ru','README.md','index.html'],['en','README.en.md','en.html']]) {
  const rendered=execFileSync('gh',['api','markdown','-f','mode=gfm','-f','context=VanDalkvist/VanDalkvist','-F',`text=@${root+file}`],{encoding:'utf8',timeout:30000});
  const content=rendered.replace(/(src|srcset)="assets\//g,'$1="/assets/').replace('href="README.en.md"','href="/previews/profile/en.html"').replace('href="README.md"','href="/previews/profile/"');
  const html=`<!doctype html><html lang="${language}" data-color-mode="light" data-light-theme="light" data-dark-theme="dark"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="icon" href="data:,"><title>Profile layout preview · ${language.toUpperCase()}</title>
${styles.map(name=>`<link rel="stylesheet" href="https://github.githubassets.com/assets/${name}.css">`).join('\n')}
<style>body{padding:16px;background:var(--bgColor-default);color:var(--fgColor-default)}.preview-toolbar{max-width:896px;margin:0 auto 20px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;font:14px/1.5 system-ui,sans-serif}.profile-preview{max-width:896px;margin:auto}.preview-toolbar strong{margin-right:auto;font-weight:500}.preview-toolbar button{font:inherit;padding:4px 10px;border:1px solid var(--borderColor-default);border-radius:6px;background:var(--bgColor-muted);color:inherit;cursor:pointer}</style>
<nav class="preview-toolbar"><strong>Превью профиля · до публикации</strong><a id="ru" href="./">RU</a><a id="en" href="en.html">EN</a><button id="theme" type="button">Тема</button></nav>
<div class="Box profile-preview"><div class="Box-header"><span class="text-mono f6">VanDalkvist / ${file}</span></div><div class="Box-body p-4"><article class="markdown-body entry-content container-lg f5"><template id="readme">${content}</template></article></div></div>
<script>
const theme=new URLSearchParams(location.search).get('theme')==='dark'?'dark':'light';
document.documentElement.dataset.colorMode=theme;
const template=document.querySelector('#readme');
for(const source of template.content.querySelectorAll('source'))source.media=source.media.replace('(prefers-color-scheme: dark)',theme==='dark'?'(min-width: 0px)':'(max-width: 0px)');
template.replaceWith(template.content);
for(const a of document.querySelectorAll('a[href^="/previews/profile/"],.preview-toolbar a')){const u=new URL(a.href);u.searchParams.set('theme',theme);a.href=u;}
document.querySelector('#theme').textContent=theme==='light'?'Тёмная тема':'Светлая тема';
document.querySelector('#theme').onclick=()=>{const u=new URL(location.href);u.searchParams.set('theme',theme==='light'?'dark':'light');location.href=u;};
</script></html>`;
  await writeFile(new URL(output,import.meta.url),html);
  console.log(`${output}: GitHub-rendered ${file}`);
}
