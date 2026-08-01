(() => {
'use strict';

const LANG=document.documentElement.lang==='en'?'en':'ja';
const I18N=window.SITE_I18N||{};
const typeLabels=I18N.typeLabels||{};
const typeOrder=['paper','grant','award','book','review','press','outreach','intl','domestic','service'];
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const normalize=s=>String(s||'').replace(/\s+/g,' ').trim();
const SITE_BUILD=window.SITE_BUILD||document.documentElement.dataset.siteBuild||'3.7.4';
function updateSiteDiagnostics(pageShowEvent=null){
  const nav=performance.getEntriesByType?.('navigation')?.[0];
  window.YUYA_SITE_DIAGNOSTICS={
    build:SITE_BUILD,
    wasDiscarded:document.wasDiscarded===true,
    restoredFromBfcache:pageShowEvent?.persisted===true,
    navigationType:nav?.type||'unknown',
    visibilityState:document.visibilityState,
    timestamp:new Date().toISOString()
  };
}
updateSiteDiagnostics();

function copyReadyText(node){
  if(!node)return'';
  const clone=node.cloneNode(true);
  $$('a',clone).forEach(a=>{
    const label=normalize(a.textContent),href=a.getAttribute('href')||'';
    if(href&&/^(link|pdf|コチラ|詳細|doi)$/i.test(label))a.replaceWith(document.createTextNode(href));
  });
  return normalize(clone.textContent);
}

function normalizeDoi(value){
  const match=String(value||'').match(/10\.\d{4,9}\/[^\s<>\"']+/i);
  return match?match[0].replace(/[.,;)\]]+$/,'').toLowerCase():'';
}
let publicationMetrics={};
let publicationMetricsMeta={};

const template=$('#achievementData');
const achievements=template?$$('.achievement-source',template.content).map((el,sourceIndex)=>({
  id:el.dataset.id,
  type:el.dataset.type,
  year:Number(el.dataset.year||0),
  yearLabel:el.dataset.yearLabel||'',
  role:el.dataset.role||'',
  themes:(el.dataset.themes||'').split('|').filter(Boolean),
  plain:copyReadyText($('.achievement-cv',el)),
  html:$('.achievement-cv',el)?.innerHTML||'',
  referencePlain:copyReadyText($('.achievement-reference',el)||$('.achievement-cv',el)),
  referenceHtml:$('.achievement-reference',el)?.innerHTML||$('.achievement-cv',el)?.innerHTML||'',
  url:el.dataset.url||'',
  doi:normalizeDoi((el.dataset.url||'')+' '+copyReadyText($('.achievement-cv',el))),
  browseTitle_ja:el.dataset.title||'',
  browseSource_ja:el.dataset.meta||'',
  browseSummary_ja:el.dataset.summary||'',
  browseTitle_en:el.dataset.title||'',
  browseSource_en:el.dataset.meta||'',
  browseSummary_en:el.dataset.summary||'',
  relatedLinks:$$('.achievement-links a',el).map(a=>({label:normalize(a.textContent),href:a.getAttribute('href')||''})),
  sourceIndex,
  number:0
})) : [];

/* Restore the original category-specific descending numbering. */
typeOrder.forEach(type=>{
  const records=achievements.filter(item=>item.type===type);
  records.forEach((item,index)=>{item.number=records.length-index});
});

const availableTypes=typeOrder.filter(t=>achievements.some(x=>x.type===t));
const PAGE_SIZE={browse:{desktop:15,tablet:10,mobile:6},cv:{desktop:24,tablet:16,mobile:8}};
function viewportKey(){
  if(window.matchMedia('(max-width:640px)').matches)return'mobile';
  if(window.matchMedia('(max-width:860px)').matches)return'tablet';
  return'desktop';
}
function basePageSize(){return PAGE_SIZE[state.view][viewportKey()]}
let state={view:'browse',type:'all',query:'',role:'all',period:'all',format:'cv',selected:new Set(),page:1,pageSizeSteps:1,showAll:false,selectionMode:false};
const shell=$('#achievementShell');
const grid=$('#browseGrid');
const cvContent=$('#cvContent');
const resultCount=$('#resultCount');
const pagination=$('#achievementPagination');
const displayControls=$('#achievementDisplayControls');
let achievementUiInitialized=false;

function escapeHtml(s){
  return String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function citationText(i){return state.format==='reference'&&i.type==='paper'&&i.referencePlain?i.referencePlain:i.plain}
function citationHtml(i){return state.format==='reference'&&i.type==='paper'&&i.referenceHtml?i.referenceHtml:i.html}
function metricRecord(i){return i?.doi?publicationMetrics[i.doi]||null:null}
function hasMetricNumber(value){return value!==null&&value!==''&&value!==undefined&&Number.isFinite(Number(value))}
function metricParts(i){
  if(i?.type!=='paper')return[];
  const m=metricRecord(i);if(!m)return[];
  const parts=[];
  if(hasMetricNumber(m.wos_citations))parts.push({label:`WoS ${LANG==='ja'?'引用数':'citations'} ${Number(m.wos_citations).toLocaleString()}`,kind:'citation'});
  if(hasMetricNumber(m.openalex_citations))parts.push({label:`OpenAlex ${LANG==='ja'?'引用数':'citations'} ${Number(m.openalex_citations).toLocaleString()}`,kind:'citation'});
  if(hasMetricNumber(m.openalex_fwci))parts.push({label:`FWCI ${Number(m.openalex_fwci).toFixed(2)}`,kind:'fwci'});
  if(hasMetricNumber(m.openalex_percentile))parts.push({label:`${LANG==='ja'?'引用百分位':'citation percentile'} ${(Number(m.openalex_percentile)*100).toFixed(1)}`,kind:'percentile'});
  if(m.openalex_top_1_percent===true)parts.push({label:`OpenAlex Top 1%`,kind:'top10'});
  else if(m.openalex_top_10_percent===true)parts.push({label:`OpenAlex Top 10%`,kind:'top10'});
  if(m.wos_top_10_percent===true)parts.push({label:`WoS/InCites Top 10%`,kind:'top10'});
  if(hasMetricNumber(m.jif))parts.push({label:`JIF${m.jif_year?` ${m.jif_year}`:''} ${Number(m.jif)}${LANG==='ja'?'（雑誌指標）':' (journal metric)'}`,kind:'jif'});
  return parts;
}
function metricUpdatedAt(i){
  const m=metricRecord(i)||{};
  return m.manual_updated_at||m.openalex_retrieved_at||m.openalex_updated_at||publicationMetricsMeta.generated_at||'';
}
function metricsText(i){const parts=metricParts(i);return parts.length?` 【${parts.map(x=>x.label).join('｜')}】`:''}
function metricsHtml(i){const parts=metricParts(i);return parts.length?` <span class=\"metrics-copy\">【${parts.map(x=>escapeHtml(x.label)).join('｜')}】</span>`:''}
function visibleMetricsHtml(i){
  const parts=metricParts(i);if(!parts.length)return'';
  const updated=metricUpdatedAt(i);
  const title=updated?`${LANG==='ja'?'指標更新':'Metrics updated'}: ${String(updated).slice(0,10)}`:'';
  return ` <span class=\"paper-metrics-inline\"${title?` title=\"${escapeHtml(title)}\"`:''}>【${parts.map(x=>`<span class=\"paper-metric-inline ${escapeHtml(x.kind)}\">${escapeHtml(x.label)}</span>`).join('<span class=\"metric-separator\">｜</span>')}】</span>`;
}
function includeMetricsInCopy(){return $('#includeMetrics')?.checked===true}
function currentText(i){return citationText(i)+(includeMetricsInCopy()?metricsText(i):'')}
function currentHtml(i){return citationHtml(i)+(includeMetricsInCopy()?metricsHtml(i):'')}
function sortAchievements(list){
  return [...list].sort((a,b)=>b.year-a.year||typeOrder.indexOf(a.type)-typeOrder.indexOf(b.type)||a.sourceIndex-b.sourceIndex);
}
function filtered(){
  const q=state.query.trim().toLowerCase();
  return sortAchievements(achievements.filter(i=>{
    if(state.type!=='all'&&i.type!==state.type)return false;
    if(state.role!=='all'&&i.role!==state.role)return false;
    if(state.period==='2025plus'&&i.year<2025)return false;
    if(state.period==='2020to2024'&&(i.year<2020||i.year>2024))return false;
    if(state.period==='before2020'&&(i.year===0||i.year>=2020))return false;
    const hay=[i.plain,i.role,i.yearLabel,i['browseTitle_'+LANG],i['browseSource_'+LANG],i['browseSummary_'+LANG],...i.themes,...i.relatedLinks.flatMap(x=>[x.label,x.href]),typeLabels[i.type]].join(' ').toLowerCase();
    return !q||hay.includes(q);
  }));
}
function pageInfo(list){
  const base=basePageSize();
  const size=state.showAll?Math.max(list.length,1):Math.max(base,base*state.pageSizeSteps);
  const totalPages=Math.max(1,Math.ceil(list.length/size));
  state.page=Math.min(Math.max(1,state.page),totalPages);
  const start=(state.page-1)*size;
  const end=Math.min(start+size,list.length);
  return {base,size,totalPages,start,end,items:list.slice(start,end)};
}
function resetPage(){state.page=1}
function resetDisplay(){state.page=1;state.pageSizeSteps=1;state.showAll=false}

function renderCategories(){
  const strip=$('#categoryStrip');
  if(!strip)return;
  const counts=achievements.reduce((o,i)=>(o[i.type]=(o[i.type]||0)+1,o),{});
  strip.innerHTML=['all',...availableTypes].map(t=>`<button class="${state.type===t?'active':''}" data-type="${t}">${t==='all'?I18N.all:typeLabels[t]} ${t==='all'?achievements.length:(counts[t]||0)}</button>`).join('');
  $$('button',strip).forEach(b=>b.onclick=()=>{
    state.type=b.dataset.type;
    resetPage();
    renderAll();
  });
}
function renderRoles(){
  const sel=$('#roleSelect');
  if(!sel)return;
  const roles=[...new Set(achievements.map(i=>i.role).filter(Boolean))].sort((a,b)=>a.localeCompare(b,LANG));
  sel.innerHTML=`<option value="all">${I18N.roleAll}</option>`+roles.map(r=>`<option value="${escapeHtml(r)}">${escapeHtml(r)}</option>`).join('');
}
function card(i){
  const title=i['browseTitle_'+LANG],source=i['browseSource_'+LANG],summary=i['browseSummary_'+LANG];
  const link=i.url?`<a class="source-link" href="${escapeHtml(i.url)}" target="_blank" rel="noopener noreferrer">${I18N.original} ↗</a>`:'';
  const tags=[i.role,...i.themes.slice(0,2)].filter(Boolean).map(x=>`<span>${escapeHtml(x)}</span>`).join('');
  const related=i.relatedLinks.length?`<div class="card-related-links"><span>${LANG==='ja'?'関連リンク':'Related'}:</span>${i.relatedLinks.map(x=>`<a href="${escapeHtml(x.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.label)} ↗</a>`).join('')}</div>`:'';
  return `<article class="achievement-card" data-type="${i.type}"><div class="card-top"><div class="card-identifiers"><span class="type-badge">${escapeHtml(typeLabels[i.type]||i.type)}</span><span class="card-number">No. ${i.number}</span></div><time class="card-year">${escapeHtml(i.yearLabel)}</time></div><h3>${escapeHtml(title)}</h3>${source?`<p class="card-source">${escapeHtml(source)}</p>`:''}${summary?`<p class="card-summary">${escapeHtml(summary)}</p>`:''}${related}<div class="card-bottom"><div class="card-tags">${tags}</div>${link}</div></article>`;
}
function renderBrowse(pageItems){
  if(!grid)return;
  grid.innerHTML=pageItems.length?pageItems.map(card).join(''):`<div class="empty">${I18N.empty}</div>`;
}
function renderCV(pageItems,fullList){
  if(!cvContent)return;
  const groups={};
  pageItems.forEach(i=>(groups[i.type]??=[]).push(i));
  cvContent.innerHTML=availableTypes.filter(t=>groups[t]?.length).map(t=>`<section class="cv-group"><h3>${escapeHtml(typeLabels[t]||t)}</h3><ol class="cv-list">${groups[t].map(i=>`<li><div class="cv-item ${state.selectionMode?'selection-enabled':''}">${state.selectionMode?`<label class="cv-select" title="${escapeHtml(I18N.selectForCopy)}"><input class="cv-check" type="checkbox" data-select="${escapeHtml(i.id)}" ${state.selected.has(i.id)?'checked':''} aria-label="${escapeHtml(I18N.selectForCopy)}"><span>${escapeHtml(I18N.selectShort)}</span></label>`:''}<span class="cv-number">${i.number}.</span><span class="cv-record">${citationHtml(i)}${visibleMetricsHtml(i)}${i.relatedLinks.length?`<span class="cv-related-links">${LANG==='ja'?'関連':'Related'}: ${i.relatedLinks.map(x=>`<a href="${escapeHtml(x.href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(x.label)}</a>`).join(' / ')}</span>`:''}</span><button class="cv-copy" type="button" data-copy="${escapeHtml(i.id)}">${escapeHtml(I18N.copyOne)}</button></div></li>`).join('')}</ol></section>`).join('')||`<div class="empty">${I18N.empty}</div>`;
  $$('[data-select]',cvContent).forEach(c=>c.onchange=()=>{
    c.checked?state.selected.add(c.dataset.select):state.selected.delete(c.dataset.select);
    syncSelectAll(pageItems);
    updateSelectionUi(pageItems);
  });
  $$('[data-copy]',cvContent).forEach(b=>b.onclick=()=>{
    const item=achievements.find(i=>i.id===b.dataset.copy);
    copyItems(item?[item]:[],false);
  });
  syncSelectAll(pageItems);
  updateSelectionUi(pageItems);
}
function renderResultCount(total,start,end){
  if(!resultCount)return;
  if(!total){resultCount.textContent=LANG==='ja'?'0件':'0 records';return}
  resultCount.textContent=LANG==='ja'?`全${total}件中 ${start+1}–${end}件を表示`:`Showing ${start+1}–${end} of ${total} records`;
}
function pageNumbers(current,total){
  if(total<=7)return Array.from({length:total},(_,i)=>i+1);
  const values=[1];
  const from=Math.max(2,current-1),to=Math.min(total-1,current+1);
  if(from>2)values.push('ellipsis-start');
  for(let n=from;n<=to;n++)values.push(n);
  if(to<total-1)values.push('ellipsis-end');
  values.push(total);
  return values;
}
function renderPagination(totalPages){
  if(!pagination)return;
  if(totalPages<=1){pagination.innerHTML='';return}
  const prevLabel=LANG==='ja'?'前へ':'Previous';
  const nextLabel=LANG==='ja'?'次へ':'Next';
  const pages=pageNumbers(state.page,totalPages).map(value=>{
    if(typeof value!=='number')return '<span class="page-status" aria-hidden="true">…</span>';
    return `<button class="page-btn ${value===state.page?'active':''}" type="button" data-page="${value}" ${value===state.page?'aria-current="page"':''}>${value}</button>`;
  }).join('');
  pagination.innerHTML=`<button class="page-btn" type="button" data-page="${state.page-1}" ${state.page===1?'disabled':''} aria-label="${prevLabel}">‹</button>${pages}<span class="page-status">${state.page} / ${totalPages}</span><button class="page-btn" type="button" data-page="${state.page+1}" ${state.page===totalPages?'disabled':''} aria-label="${nextLabel}">›</button>`;
  $$('[data-page]',pagination).forEach(b=>b.onclick=()=>{
    if(b.disabled)return;
    state.page=Number(b.dataset.page);
    renderAll();
    shell?.scrollIntoView({behavior:'auto',block:'start'});
  });
}
function renderDisplayControls(list,info){
  if(!displayControls)return;
  if(!list.length){displayControls.innerHTML='';return}
  const remaining=Math.max(0,list.length-info.size);
  const controls=[];
  if(!state.showAll&&remaining>0){
    const moreCount=Math.min(info.base,remaining);
    controls.push(`<button class="display-btn strong" type="button" data-display="more">${escapeHtml(String(I18N.showMore||'').replace('{count}',moreCount))}</button>`);
    controls.push(`<button class="display-btn" type="button" data-display="all">${escapeHtml(I18N.showAll)}</button>`);
  }
  if(state.showAll||state.pageSizeSteps>1){
    controls.push(`<button class="display-btn" type="button" data-display="standard">${escapeHtml(I18N.showStandard)}</button>`);
  }
  const infoText=String(I18N.perPage||'').replace('{count}',state.showAll?list.length:info.size);
  displayControls.innerHTML=`<span class="display-control-info">${escapeHtml(infoText)}</span><div class="display-control-actions">${controls.join('')}</div>`;
  $$('[data-display]',displayControls).forEach(button=>button.onclick=()=>{
    const action=button.dataset.display;
    if(action==='more'){
      const oldStart=(state.page-1)*info.size;
      state.showAll=false;
      state.pageSizeSteps+=1;
      const newSize=basePageSize()*state.pageSizeSteps;
      state.page=Math.floor(oldStart/newSize)+1;
    }else if(action==='all'){
      state.showAll=true;
      state.page=1;
    }else{
      resetDisplay();
    }
    renderAll();
  });
}
function updateSelectionUi(pageItems=pageInfo(filtered()).items){
  if(!shell)return;
  shell.classList.toggle('selection-mode',state.selectionMode);
  const toggle=$('#toggleSelection');
  if(toggle)toggle.textContent=state.selectionMode?I18N.selectionEnd:I18N.selectionStart;
  const guidance=$('#selectionGuidance');
  if(guidance)guidance.hidden=!state.selectionMode;
  const help=$('#selectionHelpText');
  if(help)help.textContent=I18N.selectionHelp||'';
  const count=$('#selectionCount');
  if(count)count.textContent=String(I18N.selectionCount||'').replace('{count}',state.selected.size);
  const copy=$('#copySelected');
  if(copy)copy.disabled=state.selected.size===0;
  syncSelectAll(pageItems);
}

function renderAll(){
  if(!shell||!achievementUiInitialized)return;
  renderCategories();
  const list=filtered();
  const info=pageInfo(list);
  shell.classList.toggle('cv-mode',state.view==='cv');
  shell.classList.toggle('selection-mode',state.selectionMode&&state.view==='cv');
  const note=$('#modeNote');
  if(note)note.textContent=state.view==='cv'?I18N.cvNote:I18N.browseNote;
  renderResultCount(list.length,info.start,info.end);
  if(state.view==='cv'){
    renderCV(info.items,list);
    if(grid)grid.innerHTML='';
  }else{
    renderBrowse(info.items);
    if(cvContent)cvContent.innerHTML='';
  }
  renderPagination(info.totalPages);
  renderDisplayControls(list,info);
  updateSelectionUi(info.items);
}

function initializeAchievementUi(){
  if(achievementUiInitialized||!shell)return;
  achievementUiInitialized=true;
  renderRoles();
  renderAll();
  schedulePublicationMetrics();
}
function scheduleAchievementUi(){
  const run=()=>initializeAchievementUi();
  const section=$('#achievements');
  if(location.hash==='#achievements')run();
  if(section&&'IntersectionObserver' in window&&!achievementUiInitialized){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){
        observer.disconnect();
        run();
      }
    },{rootMargin:'1200px 0px'});
    observer.observe(section);
  }
  $$('a[href="#achievements"],#openCvExport,[data-view],#browseToCv').forEach(element=>{
    element.addEventListener('pointerdown',run,{once:true,passive:true});
    element.addEventListener('focus',run,{once:true});
  });
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:1800});
  else setTimeout(run,450);
}

function buildPayload(list,groupHeadings){
  const includeH=$('#includeHeadings')?.checked!==false;
  const includeN=$('#includeNumbers')?.checked!==false;
  const groups={},plain=[],htmls=[];
  list.forEach(i=>(groups[i.type]??=[]).push(i));
  availableTypes.filter(t=>groups[t]?.length).forEach(t=>{
    if(groupHeadings&&includeH){
      plain.push(`【${typeLabels[t]}】`);
      htmls.push(`<h3>${escapeHtml(typeLabels[t])}</h3>`);
    }
    groups[t].forEach(i=>{
      const number=includeN?`${i.number}. `:'';
      plain.push(number+currentText(i));
      htmls.push(`<p>${number}${currentHtml(i)}</p>`);
    });
    if(groupHeadings)plain.push('');
  });
  return {plain:plain.join('\n').trim(),html:htmls.join('')};
}
async function writeClipboard(plain,rich){
  try{
    if(navigator.clipboard&&window.ClipboardItem&&rich){
      await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([plain],{type:'text/plain'}),'text/html':new Blob([rich],{type:'text/html'})})]);
      return true;
    }
    if(navigator.clipboard){await navigator.clipboard.writeText(plain);return true}
  }catch(e){}
  const ta=document.createElement('textarea');
  ta.value=plain;
  ta.style.position='fixed';ta.style.opacity='0';
  document.body.appendChild(ta);ta.select();
  const ok=document.execCommand('copy');ta.remove();return ok;
}

function cleanHtmlFragment(html){
  const box=document.createElement('div');
  box.innerHTML=html||'';
  $$('button,script,style,iframe',box).forEach(el=>el.remove());
  $$('a',box).forEach(a=>{
    a.removeAttribute('target');
    a.removeAttribute('rel');
  });
  return box.innerHTML.trim();
}
function collectCareerSections(){
  return $$('#career .career-block').map(block=>({
    title:normalize(block.querySelector('h3')?.textContent),
    rows:$$('.timeline-row',block).map(row=>({
      time:normalize(row.querySelector('time')?.textContent),
      html:cleanHtmlFragment(row.querySelector('.timeline-content')?.innerHTML||''),
      text:normalize(row.querySelector('.timeline-content')?.textContent)
    })).filter(row=>row.time||row.text)
  })).filter(section=>section.title&&section.rows.length);
}
function collectProfileLinks(){
  const source=$$('#profile .profile-links a').length?$$('#profile .profile-links a'):$$('#contact .contact-links a');
  return source.map(a=>({label:normalize(a.textContent.replace(/↗/g,'')),href:a.href}));
}
function collectResearchThemes(){
  return $$('#research .theme-card').map(card=>({
    title:normalize(card.querySelector('h3')?.textContent),
    text:normalize(card.querySelector('.theme-text')?.textContent||card.querySelector('p')?.textContent)
  })).filter(item=>item.title);
}
function collectProjects(){
  return $$('#projects .project-row').map(row=>({
    program:normalize(row.querySelector('.project-program')?.textContent),
    title:normalize(row.querySelector('.project-main h3')?.textContent),
    description:normalize(row.querySelector('.project-main p')?.textContent),
    meta:normalize(row.querySelector('.project-meta')?.textContent)
  })).filter(item=>item.title);
}
function collectSelectedWork(){
  return $$('#featured .featured').map(card=>({
    label:normalize(card.querySelector('.year')?.textContent),
    title:normalize(card.querySelector('h3')?.textContent),
    description:normalize(card.querySelector(':scope > p')?.textContent),
    citationHtml:cleanHtmlFragment(card.querySelector('.citation')?.innerHTML||''),
    citationText:normalize(card.querySelector('.citation')?.textContent)
  })).filter(item=>item.title);
}
function groupAchievements(list){
  const groups={};
  list.forEach(item=>(groups[item.type]??=[]).push(item));
  return groups;
}
function fullCvModel(){
  const h1=$('#profile h1');
  const name=normalize([...h1?.childNodes||[]].filter(node=>node.nodeType===Node.TEXT_NODE).map(node=>node.textContent).join(' '))||normalize(h1?.textContent)||'Yuya Takane';
  return {
    name,
    altName:normalize($('#profile h1 span')?.textContent),
    role:normalize($('#profile .role')?.textContent),
    summary:normalize($('#profile .summary')?.textContent),
    keywords:$$('#profile .hero-focus span').map(node=>normalize(node.textContent)).filter(Boolean),
    contactHtml:cleanHtmlFragment($('#contact .contact-box > div:first-child p')?.innerHTML||''),
    contactText:normalize($('#contact .contact-box > div:first-child p')?.textContent),
    links:collectProfileLinks(),
    themes:collectResearchThemes(),
    projects:collectProjects(),
    selectedWork:collectSelectedWork(),
    career:collectCareerSections(),
    achievements:sortAchievements(achievements)
  };
}
function fullCvLabels(){
  return LANG==='ja'?{
    links:'外部プロフィール',themes:'研究テーマ',projects:'実施中プロジェクト',selected:'代表的成果',achievements:'研究業績',print:'印刷／PDF保存'
  }:{
    links:'External profiles',themes:'Research themes',projects:'Current projects',selected:'Selected work',achievements:'Achievements',print:'Print / save PDF'
  };
}
function fullCvHtml(model,{printView=false}={}){
  const groups=groupAchievements(model.achievements),label=fullCvLabels(),esc=escapeHtml;
  const section=(title,body)=>`<section class="cv-section"><h2>${esc(title)}</h2>${body}</section>`;
  const links=`<ul class="links">${model.links.map(link=>`<li><a href="${esc(link.href)}">${esc(link.label)}</a></li>`).join('')}</ul>`;
  const themes=`<ul>${model.themes.map(item=>`<li><strong>${esc(item.title)}</strong>${item.text?`<br>${esc(item.text)}`:''}</li>`).join('')}</ul>`;
  const projects=`<ul>${model.projects.map(item=>`<li><strong>${esc(item.title)}</strong>${item.program?`<br><span>${esc(item.program)}</span>`:''}${item.description?`<br>${esc(item.description)}`:''}${item.meta?`<br><small>${esc(item.meta)}</small>`:''}</li>`).join('')}</ul>`;
  const selected=`<ol>${model.selectedWork.map(item=>`<li><strong>${esc(item.title)}</strong>${item.description?`<br>${esc(item.description)}`:''}${item.citationHtml?`<div class="citation">${item.citationHtml}</div>`:''}</li>`).join('')}</ol>`;
  const career=model.career.map(sec=>section(sec.title,`<table>${sec.rows.map(row=>`<tr><th>${esc(row.time)}</th><td>${row.html}</td></tr>`).join('')}</table>`)).join('');
  const achievementsHtml=availableTypes.filter(type=>groups[type]?.length).map(type=>section(typeLabels[type]||type,`<ol>${groups[type].map(item=>`<li>${currentHtml(item)}</li>`).join('')}</ol>`)).join('');
  return `<!doctype html><html lang="${LANG}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(model.name)} CV</title><style>
  @page{size:A4;margin:16mm 17mm 18mm}*{box-sizing:border-box}body{margin:0 auto;max-width:900px;padding:32px 38px;color:#17283a;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Noto Sans JP",Arial,sans-serif;font-size:10.5pt;line-height:1.55}header{border-bottom:3px solid #0b2947;padding-bottom:16px;margin-bottom:20px}h1{margin:0;font-size:25pt;line-height:1.15;color:#0b2947}.alt{margin-top:4px;color:#6b7d8e;font-size:11pt;letter-spacing:.08em}.role{margin-top:10px;font-weight:700}.contact{margin-top:6px;color:#40566b}.summary{margin-top:12px}.keywords{margin-top:8px;color:#40566b}.cv-section{margin-top:22px}.cv-section h2{margin:0 0 9px;padding-bottom:4px;border-bottom:1.5px solid #2369b4;color:#0b2947;font-size:14pt}.cv-section ul,.cv-section ol{margin:7px 0 0;padding-left:23px}.cv-section li{margin:0 0 7px}.cv-section table{width:100%;border-collapse:collapse}.cv-section th,.cv-section td{padding:4px 8px 5px 0;vertical-align:top;border-bottom:1px solid #e2e8ee}.cv-section th{width:145px;text-align:left;color:#2369b4;white-space:nowrap}.links{columns:2}.citation{margin-top:3px;color:#53677a;font-size:9.5pt}a{color:#1d5fa2;text-decoration:underline}i,em{font-style:italic}strong,b{font-weight:700}.print-bar{position:sticky;top:0;display:flex;justify-content:flex-end;padding:10px 0;background:#fff}.print-bar button{padding:9px 14px;border:0;border-radius:999px;background:#0b2947;color:#fff;font-weight:700;cursor:pointer}@media print{body{max-width:none;padding:0}.print-bar{display:none}.cv-section h2{break-after:avoid}.cv-section li{break-inside:avoid}}
  </style></head><body>${printView?`<div class="print-bar"><button onclick="window.print()">${esc(label.print)}</button></div>`:''}<header><h1>${esc(model.name)}</h1>${model.altName?`<div class="alt">${esc(model.altName)}</div>`:''}<div class="role">${esc(model.role)}</div><div class="contact">${model.contactHtml}</div><p class="summary">${esc(model.summary)}</p><div class="keywords">${model.keywords.map(esc).join(' / ')}</div></header>${section(label.links,links)}${section(label.themes,themes)}${section(label.projects,projects)}${career}${section(label.selected,selected)}${section(label.achievements,achievementsHtml)}</body></html>`;
}
function fullCvPlain(model){
  const groups=groupAchievements(model.achievements),label=fullCvLabels();
  const lines=[model.name,model.altName,model.role,model.contactText,'',model.summary,'',model.keywords.join(' / '),''];
  const push=(title,rows)=>{lines.push(`【${title}】`,...rows,'')};
  push(label.links,model.links.map(item=>`${item.label}: ${item.href}`));
  push(label.themes,model.themes.map(item=>`${item.title}${item.text?` — ${item.text}`:''}`));
  push(label.projects,model.projects.map(item=>[item.title,item.program,item.description,item.meta].filter(Boolean).join(' | ')));
  model.career.forEach(sec=>push(sec.title,sec.rows.map(row=>`${row.time}${row.time?'  ':''}${row.text}`)));
  push(label.selected,model.selectedWork.map(item=>[item.title,item.description,item.citationText].filter(Boolean).join(' | ')));
  availableTypes.filter(type=>groups[type]?.length).forEach(type=>push(typeLabels[type]||type,groups[type].map(item=>`${item.number}. ${currentText(item)}`)));
  return lines.join('\n').trim();
}
function xmlEscape(value){return String(value??'').replace(/[<>&'\"]/g,char=>({'<':'&lt;','>':'&gt;','&':'&amp;',"'":'&apos;','"':'&quot;'}[char]))}
function wRun(text,{bold=false,italic=false,size=20,color='17283A'}={}){
  return `<w:r><w:rPr>${bold?'<w:b/>':''}${italic?'<w:i/>':''}<w:color w:val="${color}"/><w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r>`;
}
function wParagraph(text,{style='Normal',bold=false,italic=false,size=20,color='17283A',after=80,before=0}={}){
  return `<w:p><w:pPr><w:pStyle w:val="${style}"/><w:spacing w:before="${before}" w:after="${after}"/></w:pPr>${wRun(text,{bold,italic,size,color})}</w:p>`;
}
function wCell(text,width,bold=false){return `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/><w:vAlign w:val="top"/></w:tcPr>${wParagraph(text,{bold,size:19,after:30})}</w:tc>`}
function wTable(rows){return `<w:tbl><w:tblPr><w:tblW w:w="0" w:type="auto"/><w:tblBorders><w:bottom w:val="single" w:sz="2" w:color="D9E2EA"/><w:insideH w:val="single" w:sz="2" w:color="E6EBF0"/></w:tblBorders></w:tblPr><w:tblGrid><w:gridCol w:w="1900"/><w:gridCol w:w="7100"/></w:tblGrid>${rows.map(row=>`<w:tr>${wCell(row[0],1900,true)}${wCell(row[1],7100,false)}</w:tr>`).join('')}</w:tbl>`}
function fullCvDocumentXml(model){
  const groups=groupAchievements(model.achievements),label=fullCvLabels(),parts=[];
  parts.push(wParagraph(model.name,{style:'Title',bold:true,size:42,color:'0B2947',after:20}));
  if(model.altName)parts.push(wParagraph(model.altName,{size:20,color:'6D7E91',after:90}));
  parts.push(wParagraph(model.role,{bold:true,size:21,after:35}));
  parts.push(wParagraph(model.contactText,{size:19,color:'40566B',after:80}));
  parts.push(wParagraph(model.summary,{size:20,after:80}));
  parts.push(wParagraph(model.keywords.join(' / '),{size:19,color:'40566B',after:130}));
  const heading=title=>parts.push(wParagraph(title,{style:'Heading1',bold:true,size:28,color:'0B2947',before:180,after:70}));
  heading(label.links);model.links.forEach(item=>parts.push(wParagraph(`${item.label}: ${item.href}`,{size:18,after:35})));
  heading(label.themes);model.themes.forEach(item=>parts.push(wParagraph(`${item.title}${item.text?` — ${item.text}`:''}`,{size:19,after:55})));
  heading(label.projects);model.projects.forEach(item=>parts.push(wParagraph([item.title,item.program,item.description,item.meta].filter(Boolean).join(' | '),{size:19,after:55})));
  model.career.forEach(sec=>{heading(sec.title);parts.push(wTable(sec.rows.map(row=>[row.time,row.text])))});
  heading(label.selected);model.selectedWork.forEach((item,index)=>parts.push(wParagraph(`${index+1}. ${[item.title,item.description,item.citationText].filter(Boolean).join(' | ')}`,{size:18,after:50})));
  availableTypes.filter(type=>groups[type]?.length).forEach(type=>{heading(typeLabels[type]||type);groups[type].forEach(item=>parts.push(wParagraph(`${item.number}. ${currentText(item)}`,{size:18,after:30})))});
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${parts.join('')}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="907" w:right="964" w:bottom="1021" w:left="964" w:header="425" w:footer="425" w:gutter="0"/></w:sectPr></w:body></w:document>`;
}
let jsZipLoadPromise=null;
function ensureJsZip(){
  if(window.JSZip)return Promise.resolve(window.JSZip);
  if(jsZipLoadPromise)return jsZipLoadPromise;
  jsZipLoadPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');
    script.src='assets/js/jszip.min.js';
    script.async=true;
    script.onload=()=>window.JSZip?resolve(window.JSZip):reject(new Error('JSZip unavailable'));
    script.onerror=()=>reject(new Error('JSZip load failed'));
    document.head.appendChild(script);
  });
  return jsZipLoadPromise;
}
async function downloadFullCvDocx(){
  initializeAchievementUi();
  try{await ensureJsZip()}catch(error){toast(LANG==='ja'?'Word出力ライブラリを読み込めませんでした':'The Word export library could not be loaded');return}
  const model=fullCvModel(),zip=new window.JSZip();
  zip.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>');
  zip.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>');
  const word=zip.folder('word');
  word.file('document.xml',fullCvDocumentXml(model));
  word.file('styles.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:eastAsia="Yu Gothic"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="60" w:line="280" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:qFormat/></w:style></w:styles>');
  word.folder('_rels').file('document.xml.rels','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>');
  const props=zip.folder('docProps'),now=new Date().toISOString();
  props.file('core.xml',`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEscape(model.name)} CV</dc:title><dc:creator>${xmlEscape(model.name)}</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${now}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${now}</dcterms:modified></cp:coreProperties>`);
  props.file('app.xml','<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>Yuya Takane website CV exporter</Application></Properties>');
  const blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
  const anchor=document.createElement('a');anchor.href=URL.createObjectURL(blob);anchor.download='Yuya_Takane_full_CV.docx';anchor.click();setTimeout(()=>URL.revokeObjectURL(anchor.href),1200);
  toast(LANG==='ja'?'フルCV（Word）を保存しました':'Full Word CV saved');
}
function openFullCvPrint(){
  initializeAchievementUi();
  const popup=window.open('','_blank');
  if(!popup){toast(LANG==='ja'?'印刷画面を開けませんでした':'The print view could not be opened');return}
  popup.document.open();popup.document.write(fullCvHtml(fullCvModel(),{printView:true}));popup.document.close();
}
async function copyFullCv(){
  initializeAchievementUi();
  const model=fullCvModel(),html=fullCvHtml(model).replace(/<!doctype[\s\S]*?<body>/i,'').replace(/<\/body>[\s\S]*$/i,'');
  const ok=await writeClipboard(fullCvPlain(model),html);
  toast(ok?(LANG==='ja'?'フルCVをコピーしました':'Full CV copied'):I18N.copyFailed);
}
function openCvDialog(){initializeAchievementUi();const dialog=$('#cvExportDialog');if(!dialog)return;const full=$('#fullCvIncludeMetrics'),list=$('#includeMetrics');if(full&&list)full.checked=list.checked;if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}
function closeCvDialog(){const dialog=$('#cvExportDialog');if(!dialog)return;if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')}

async function copyItems(list,heads=true){
  if(!list.length){toast(I18N.noCopy);return}
  const p=buildPayload(list,heads),ok=await writeClipboard(p.plain,p.html);
  toast(ok?`${list.length} ${I18N.copied}`:I18N.copyFailed);
}
function toast(msg){
  const x=$('#toast');if(!x)return;
  x.textContent=msg;x.classList.add('show');
  clearTimeout(window._toast);window._toast=setTimeout(()=>x.classList.remove('show'),2200);
}
function syncSelectAll(list){
  const box=$('#selectAllVisible');if(!box)return;
  const ids=list.map(i=>i.id);
  box.checked=!!ids.length&&ids.every(id=>state.selected.has(id));
  box.indeterminate=ids.some(id=>state.selected.has(id))&&!box.checked;
}
function setView(v){
  initializeAchievementUi();
  state.view=v;
  resetDisplay();
  if(v!=='cv'){
    state.selectionMode=false;
    state.selected.clear();
  }
  $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  renderAll();
}

$$('[data-view]').forEach(b=>b.onclick=()=>setView(b.dataset.view));
$('#browseToCv')?.addEventListener('click',()=>setView('cv'));
$('#searchInput')?.addEventListener('input',e=>{state.query=e.target.value;resetPage();renderAll()});
$('#roleSelect')?.addEventListener('change',e=>{state.role=e.target.value;resetPage();renderAll()});
$('#periodSelect')?.addEventListener('change',e=>{state.period=e.target.value;resetPage();renderAll()});
$('#copyFormat')?.addEventListener('change',e=>{state.format=e.target.value;renderAll()});
$('#includeMetrics')?.addEventListener('change',()=>renderAll());
$('#fullCvIncludeMetrics')?.addEventListener('change',e=>{const box=$('#includeMetrics');if(box)box.checked=e.target.checked;renderAll()});
$('#copyVisible')?.addEventListener('click',()=>copyItems(pageInfo(filtered()).items,true));
$('#copyFiltered')?.addEventListener('click',()=>copyItems(filtered(),true));
$('#toggleSelection')?.addEventListener('click',()=>{
  state.selectionMode=!state.selectionMode;
  if(!state.selectionMode)state.selected.clear();
  renderAll();
});
$('#copySelected')?.addEventListener('click',()=>copyItems(sortAchievements(achievements.filter(i=>state.selected.has(i.id))),true));
$('#downloadTxt')?.addEventListener('click',()=>{
  const p=buildPayload(filtered(),true),blob=new Blob([p.plain],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);
  a.download=LANG==='ja'?'Yuya_Takane_研究業績.txt':'Yuya_Takane_achievements.txt';
  a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
});
$('#printCv')?.addEventListener('click',()=>{
  state.view='cv';
  $$('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view==='cv'));
  shell?.classList.add('cv-mode','print-all-records');
  const list=filtered();
  renderCV(list,list);
  if(pagination)pagination.innerHTML='';
  setTimeout(()=>window.print(),80);
});
window.addEventListener('afterprint',()=>{shell?.classList.remove('print-all-records');renderAll()});
$('#selectAllVisible')?.addEventListener('change',e=>{
  if(!state.selectionMode)return;
  pageInfo(filtered()).items.forEach(i=>e.target.checked?state.selected.add(i.id):state.selected.delete(i.id));
  renderAll();
});



function initNewsList(){
  $$('.news-list').forEach(list=>{
    const extras=$$('.news-extra',list);
    const btn=list.parentElement.querySelector('.news-toggle');
    if(!extras.length){ if(btn) btn.parentElement.hidden=true; return; }
    const apply=(expanded)=>{
      list.classList.toggle('expanded',expanded);
      extras.forEach(row=>{ row.hidden=!expanded; });
      if(btn){
        btn.setAttribute('aria-expanded',String(expanded));
        btn.textContent=expanded?(btn.dataset.closeLabel||'Collapse'):(btn.dataset.openLabel||'Show more');
      }
    };
    apply(false);
    btn?.addEventListener('click',()=>apply(btn.getAttribute('aria-expanded')!=='true'));
  });
}

$('#openCvExport')?.addEventListener('click',openCvDialog);
$('#closeCvExport')?.addEventListener('click',closeCvDialog);
$('#downloadFullCvDocx')?.addEventListener('click',downloadFullCvDocx);
$('#printFullCv')?.addEventListener('click',openFullCvPrint);
$('#copyFullCv')?.addEventListener('click',copyFullCv);
$('#cvExportDialog')?.addEventListener('click',event=>{if(event.target===event.currentTarget)closeCvDialog()});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#cvExportDialog')?.open)closeCvDialog()});

let publicationMetricsLoadPromise=null;
let publicationMetricsLoaded=false;
function loadPublicationMetrics(){
  if(publicationMetricsLoaded)return Promise.resolve(publicationMetrics);
  if(publicationMetricsLoadPromise)return publicationMetricsLoadPromise;
  publicationMetricsLoadPromise=(async()=>{
    const status=$('#publicationMetricsStatus');
    let publicData={records:{}};
    let publicError=null;
    try{
      const response=await fetch('assets/data/publication_metrics.json',{cache:'default'});
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      publicData=await response.json();
    }catch(error){publicError=error}
    let cachedData=null;
    try{cachedData=JSON.parse(localStorage.getItem('yuyaPublicationMetricsCacheV2')||'null')}catch(error){}
    publicationMetrics={...(publicData.records||{}),...(cachedData?.records||{})};
    publicationMetricsMeta=cachedData?.records?{...publicData,...cachedData,records:publicationMetrics}:publicData;
    publicationMetricsLoaded=true;
    const values=Object.values(publicationMetrics);
    const available=values.filter(m=>hasMetricNumber(m.openalex_citations)||hasMetricNumber(m.wos_citations)||hasMetricNumber(m.openalex_fwci)||hasMetricNumber(m.jif)).length;
    if(status){
      const date=publicationMetricsMeta.generated_at?String(publicationMetricsMeta.generated_at).slice(0,10):'';
      const localNote=cachedData?.records?(LANG==='ja'?'（このブラウザで取得した値を含む）':' (including values fetched in this browser)'):'';
      if(available){
        status.textContent=LANG==='ja'
          ?`論文指標：${available}件にデータあり${date?`（更新 ${date}）`:''}${localNote}。各論文の書誌・DOI直後に表示しています。JIFはJCR値を登録した場合のみ表示します。`
          :`Publication metrics are available for ${available} papers${date?` (updated ${date})`:''}${localNote} and are displayed immediately after each citation / DOI. JIF appears only when an authorized JCR value has been entered.`;
      }else{
        status.textContent=LANG==='ja'
          ?'論文指標はまだ取得されていません。下の「論文指標の取得・更新」からOpenAlexデータを取得すると、各論文の書誌・DOI直後に表示されます。'
          :'Publication metrics have not yet been fetched. Use the owner tool below to retrieve OpenAlex data; the values will then appear immediately after each citation / DOI.';
      }
      if(publicError&&!cachedData?.records)status.dataset.loadError=String(publicError);
    }
    // Metrics are visible only in the formal/CV view. Avoid a second full render on the landing view.
    if(state.view==='cv')renderAll();
    return publicationMetrics;
  })().finally(()=>{publicationMetricsLoadPromise=null});
  return publicationMetricsLoadPromise;
}
function schedulePublicationMetrics(){
  const run=()=>{void loadPublicationMetrics()};
  const section=$('#achievements');
  if(section&&'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();run()}
    },{rootMargin:'800px 0px'});
    observer.observe(section);
  }
  if('requestIdleCallback' in window)requestIdleCallback(run,{timeout:3500});
  else setTimeout(run,1200);
}

function scheduleAnalytics(){
  const id=window.SITE_GA_ID;
  if(!id||/^(localhost|127\.0\.0\.1)$/.test(location.hostname))return;
  let loaded=false;
  const load=()=>{
    if(loaded||document.getElementById('site-gtag'))return;
    loaded=true;
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments)};
    window.gtag('js',new Date());
    window.gtag('config',id);
    const script=document.createElement('script');
    script.id='site-gtag';
    script.async=true;
    script.src=`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(script);
  };
  const afterLoad=()=>{
    if('requestIdleCallback' in window)requestIdleCallback(load,{timeout:4500});
    else setTimeout(load,1800);
  };
  if(document.readyState==='complete')afterLoad();
  else window.addEventListener('load',afterLoad,{once:true});
}

/* Mobile navigation. */
function closeNav(){document.body.classList.remove('nav-open');$('#menuBtn')?.setAttribute('aria-expanded','false')}
$('#menuBtn')?.addEventListener('click',()=>{const open=document.body.classList.toggle('nav-open');$('#menuBtn').setAttribute('aria-expanded',String(open))});
$('#menuOverlay')?.addEventListener('click',closeNav);
$$('.side-nav a').forEach(a=>a.addEventListener('click',closeNav));
const sections=$$('.main section[id]'),navLinks=$$('.side-nav a');
if('IntersectionObserver' in window){
  const observer=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting)navLinks.forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));
  }),{rootMargin:'-30% 0px -62% 0px'});
  sections.forEach(s=>observer.observe(s));
}

function activateStoryMedia(detail){
  $$('[data-src]',detail).forEach(element=>{
    const source=element.dataset.src;
    if(!source)return;
    if(element.tagName==='IFRAME'){
      if(!element.getAttribute('src')||element.getAttribute('src')==='about:blank')element.setAttribute('src',source);
    }else if(element.tagName==='IMG'){
      const current=element.getAttribute('src')||'';
      if(element.dataset.srcset&&!element.getAttribute('srcset'))element.setAttribute('srcset',element.dataset.srcset);
      if(!current||current.startsWith('data:image/gif'))element.setAttribute('src',source);
    }
  });
}
function deactivateStoryFrames(detail){
  $$('iframe[data-src]',detail).forEach(frame=>{
    if(frame.getAttribute('src')&&frame.getAttribute('src')!=='about:blank')frame.setAttribute('src','about:blank');
  });
}

/* Research stories stay on the main page and expand in place. */
const storyDetails=$$('details.story-detail');
function closeOtherStories(current){storyDetails.forEach(d=>{if(d!==current&&d.open)d.open=false})}
storyDetails.forEach(detail=>{
  detail.addEventListener('toggle',()=>{
    if(detail.open){
      closeOtherStories(detail);
      activateStoryMedia(detail);
      if(detail.id)history.replaceState(null,'','#'+detail.id);
    }else{
      deactivateStoryFrames(detail);
      if(location.hash==='#'+detail.id)history.replaceState(null,'','#stories');
    }
  });
});
$$('.story-close').forEach(button=>button.addEventListener('click',()=>{
  const detail=button.closest('details.story-detail');
  if(!detail)return;
  detail.open=false;
  detail.querySelector('summary')?.focus();
  detail.scrollIntoView({behavior:'auto',block:'center'});
}));
function openStoryFromHash(){
  if(!location.hash)return;
  const id=decodeURIComponent(location.hash.slice(1));
  const target=document.getElementById(id);
  if(target?.matches('details.story-detail')){
    closeOtherStories(target);
    target.open=true;
    activateStoryMedia(target);
    setTimeout(()=>target.scrollIntoView({behavior:'auto',block:'start'}),60);
  }
}
window.addEventListener('hashchange',openStoryFromHash);
document.addEventListener('visibilitychange',()=>{
  if(!document.hidden){
    updateSiteDiagnostics();
    requestAnimationFrame(()=>document.documentElement.classList.add('tab-visible'));
  }
});
window.addEventListener('pageshow',event=>{
  updateSiteDiagnostics(event);
  document.documentElement.classList.remove('page-restoring');
  storyDetails.filter(detail=>detail.open).forEach(activateStoryMedia);
});


let lastViewportKey=viewportKey();
window.addEventListener('resize',()=>{
  const key=viewportKey();
  if(key!==lastViewportKey){lastViewportKey=key;if(achievementUiInitialized){resetDisplay();renderAll()}}
});

initNewsList();
openStoryFromHash();
scheduleAchievementUi();
scheduleAnalytics();
console.info(`[Yuya.Takane.Log] build ${SITE_BUILD}`,window.YUYA_SITE_DIAGNOSTICS);
})();
