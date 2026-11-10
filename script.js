(() => {
  'use strict';
  const panels = [...document.querySelectorAll('.tab-panel')];
  const tabs = [...document.querySelectorAll('.nav-tab')];
  const mobileMenu = document.getElementById('mobile-menu');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  const themeToggle = document.getElementById('theme-toggle');
  const themeText = themeToggle.querySelector('.theme-text');
  const themeIcon = themeToggle.querySelector('.theme-symbol');
  const valid = new Set(tabs.map(t => t.dataset.tab));
  function closeSidebar(){sidebar.classList.remove('show');overlay.hidden=true;mobileMenu.setAttribute('aria-expanded','false');}
  function choose(tabName,fragment='',updateHash=true){
    const name=valid.has(tabName)?tabName:'overview';
    for(const p of panels){const visible=p.dataset.panel===name;p.hidden=!visible;}
    for(const t of tabs){const active=t.dataset.tab===name;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1;}
    closeSidebar();
    if(updateHash){history.replaceState(null,'','#'+(fragment||name));}
    requestAnimationFrame(()=>{
      if(fragment){const target=document.getElementById(fragment);if(target){target.scrollIntoView({behavior:'instant',block:'center'});return;}}
      window.scrollTo({top:0,behavior:'instant'});
    });
  }
  function openHash(){
    const hash=decodeURIComponent(location.hash.replace(/^#/,''));
    if(valid.has(hash)){choose(hash,'',false);return;}
    if(/^ref-\d{1,2}$/.test(hash)){choose('references',hash,false);return;}
    if(hash==='glossary'||/^term-\d+$/.test(hash)){choose('overview',hash,false);return;}
    const target=document.getElementById(hash);
    if(target){const parent=target.closest('.tab-panel'); if(parent){choose(parent.dataset.panel,hash,false);return;}}
    choose('overview','',false);
  }
  for(const t of tabs)t.addEventListener('click',()=>choose(t.dataset.tab));
  document.addEventListener('click',event=>{
    const dest=event.target.closest('[data-target]');if(dest){event.preventDefault();choose(dest.dataset.target);}
    const ref=event.target.closest('a[href^="#ref-"]');if(ref){event.preventDefault();const hash=ref.getAttribute('href').slice(1);choose('references',hash);}
  });
  window.addEventListener('hashchange',openHash);
  mobileMenu.addEventListener('click',()=>{const open=!sidebar.classList.contains('show');sidebar.classList.toggle('show',open);overlay.hidden=!open;mobileMenu.setAttribute('aria-expanded',String(open));});
  overlay.addEventListener('click',closeSidebar);
  tabs.forEach((t,i)=>t.addEventListener('keydown',e=>{if(!['ArrowDown','ArrowUp','Home','End'].includes(e.key))return;e.preventDefault();let j=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowDown'?1:-1)+tabs.length)%tabs.length;tabs[j].focus();choose(tabs[j].dataset.tab);}));

  // Theme choice is saved on the viewer's own device. Light is the default.
  let theme='light';try{theme=localStorage.getItem('pmos-theme')==='dark'?'dark':'light';}catch(_e){}
  function setTheme(mode){document.documentElement.dataset.theme=mode;const dark=mode==='dark';themeToggle.setAttribute('aria-pressed',String(dark));themeToggle.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');themeText.textContent=dark?'Light mode':'Dark mode';themeIcon.textContent=dark?'☀':'☾';}
  setTheme(theme);
  themeToggle.addEventListener('click',()=>{theme=theme==='dark'?'light':'dark';setTheme(theme);try{localStorage.setItem('pmos-theme',theme);}catch(_e){}});

  // Clickable bracketed references are derived only from existing citations.
  const citationRe=/\[(\d{1,2}(?:\s*[,;]\s*\d{1,2})*)\]/g;
  const researchRoots=document.querySelectorAll('.executive-card, .research-panel');
  for(const root of researchRoots){
    if(root.id==='panel-references')continue;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    for(const node of nodes){
      if(!node.parentElement||node.parentElement.closest('a,button,script,style'))continue;
      const str=node.nodeValue;if(!/\[\d{1,2}/.test(str))continue;
      const fragment=document.createDocumentFragment();let last=0,match;citationRe.lastIndex=0;
      while((match=citationRe.exec(str))!==null){
        fragment.append(document.createTextNode(str.slice(last,match.index)+'['));
        const numbers=match[1].split(/\s*[,;]\s*/);
        numbers.forEach((num,i)=>{if(i)fragment.append(document.createTextNode(','));const n=Number(num);if(n>=1&&n<=21){const a=document.createElement('a');a.className='citation';a.href='#ref-'+n;a.textContent=num;a.setAttribute('aria-label','View reference '+n);fragment.append(a);}else{fragment.append(document.createTextNode(num));}});
        fragment.append(document.createTextNode(']'));last=citationRe.lastIndex;
      }
      fragment.append(document.createTextNode(str.slice(last)));node.replaceWith(fragment);
    }
  }

  // Figures open in an accessible viewer, never in a new tab.
  const modal=document.getElementById('image-modal');
  const modalImg=document.getElementById('modal-image');
  const modalTitle=document.getElementById('modal-title');
  const closeModalButton=document.getElementById('modal-close');
  let previousFocus=null;
  document.querySelectorAll('.figure-open').forEach(btn=>btn.addEventListener('click',()=>{
    previousFocus=document.activeElement;const fig=btn.closest('figure');modalTitle.textContent=fig.querySelector('figcaption')?.textContent||'Published research figure';
    const im=btn.querySelector('img');modalImg.src=btn.dataset.image;modalImg.alt=im.alt;modal.hidden=false;document.body.style.overflow='hidden';closeModalButton.focus();
  }));
  function closeModal(){modal.hidden=true;modalImg.removeAttribute('src');document.body.style.overflow='';if(previousFocus&&typeof previousFocus.focus==='function')previousFocus.focus();}
  document.querySelectorAll('[data-close-modal],#modal-close').forEach(x=>x.addEventListener('click',closeModal));
  // Six clickable causal pathway nodes with short source-aligned explanations.
  const flow=window.PMOS_FLOW_DETAILS||[];
  const detail=document.getElementById('flow-detail');
  document.querySelectorAll('.flow-step').forEach((step,i)=>step.addEventListener('click',()=>{
    document.querySelectorAll('.flow-step').forEach(x=>x.setAttribute('aria-pressed',String(x===step)));
    const obj=flow[i];if(!obj)return;detail.replaceChildren();const strong=document.createElement('strong');strong.textContent=obj.title;const p=document.createElement('p');p.textContent=obj.description;detail.append(strong,p);
  }));

  // Cohort-based interactive study chart [16]. Values are prevalence percentages.
  const datasets={glucose:[['Impaired glucose regulation',31.7,47.2],['Type 2 diabetes',9.5,26.1]],cardio:[['Hypertension',16.1,34.7],['Hyperlipidemia',52.3,64.3]]};
  const plot=document.getElementById('progression-chart');
  function drawChart(kind){
    if(!plot)return;plot.replaceChildren();const data=datasets[kind];
    plot.setAttribute('aria-label',kind==='glucose'?'Baseline and follow-up prevalence of glucose abnormalities':'Baseline and follow-up prevalence of cardiovascular risk markers');
    for(const [label,base,follow] of data){
      const group=document.createElement('div');group.className='chart-group';const heading=document.createElement('div');heading.className='chart-group-name';heading.textContent=label;group.append(heading);
      for(const [name,value,key] of [['Baseline',base,'before'],['Follow-up',follow,'after']]){
        const row=document.createElement('div');row.className='chart-line';const n=document.createElement('span');n.className='chart-line-name';n.textContent=name;
        const track=document.createElement('div');track.className='chart-track';const bar=document.createElement('div');bar.className='chart-bar '+key;bar.style.width=Math.min(100,value)+'%';track.append(bar);
        const v=document.createElement('span');v.className='chart-value';v.textContent=value.toFixed(1)+'%';row.append(n,track,v);group.append(row);
      }plot.append(group);
    }
    document.querySelectorAll('.chart-choice').forEach(b=>{const active=b.dataset.chart===kind;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
  }
  drawChart('glucose');
  document.querySelectorAll('.chart-choice').forEach(b=>b.addEventListener('click',()=>drawChart(b.dataset.chart)));

  // Short definitions appear on click, focus, or pointer hover; never alter the original prose.
  const glossary=[
    ['hyperandrogenism','Elevated androgen activity that can contribute to acne, excess hair growth, and other symptoms.'],
    ['insulin resistance','Reduced responsiveness of cells to insulin.'],
    ['hyperinsulinemia','Elevated circulating insulin levels.'],
    ['ovulatory dysfunction','Irregular or absent ovulation.'],
    ['disability-adjusted life years','DALYs combine years lived with disability and years of life lost due to early mortality.'],
    ['DALYs','Disability-adjusted life years: years lived with disability plus years of life lost.'],
    ['OGTT','Oral glucose tolerance test for measuring glucose regulation.'],
    ['odds ratio','Comparison of odds of an outcome between groups; different from relative risk.'],
    ['relative risk','Comparison of the probability of an outcome between groups.'],
    ['impaired fasting glucose','Elevated fasting blood glucose below the threshold for diabetes.'],
    ['impaired glucose tolerance','Glucose regulation below the diabetes diagnostic threshold but above the usual range.']
  ];
  // Only first occurrence per panel is linked to avoid visual clutter.
  document.querySelectorAll('.research-panel:not(#panel-references)').forEach(panel=>{
    for(const [term,definition] of glossary){
      const walker=document.createTreeWalker(panel,NodeFilter.SHOW_TEXT);let node;
      while(node=walker.nextNode()){
        if(node.parentElement?.closest('a,button,h2,h3,h4,figcaption,.table-scroll,script,style'))continue;
        const re=new RegExp('\\b'+term.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\b','i');const m=re.exec(node.nodeValue);if(!m)continue;
        const fragment=document.createDocumentFragment();fragment.append(document.createTextNode(node.nodeValue.slice(0,m.index)));
        const b=document.createElement('button');b.type='button';b.className='term-trigger';b.textContent=m[0];b.dataset.term=term;b.dataset.definition=definition;b.setAttribute('aria-label','Definition of '+term);fragment.append(b);fragment.append(document.createTextNode(node.nodeValue.slice(m.index+m[0].length)));node.replaceWith(fragment);break;
      }
    }
  });
  const popover=document.getElementById('definition-popover');
  const popTitle=document.getElementById('definition-title'),popBody=document.getElementById('definition-body');
  function showDefinition(target){popTitle.textContent=target.dataset.term;popBody.textContent=target.dataset.definition;popover.hidden=false;const rect=target.getBoundingClientRect();const width=300;const x=Math.min(Math.max(12,rect.left),window.innerWidth-width-12);popover.style.left=x+'px';popover.style.top=Math.min(rect.bottom+8,window.innerHeight-popover.offsetHeight-10)+'px';}
  function hideDefinition(){popover.hidden=true;}
  document.addEventListener('click',e=>{const btn=e.target.closest('.term-trigger');if(btn){e.stopPropagation();showDefinition(btn);}else if(!e.target.closest('.definition-popover'))hideDefinition();});
  document.getElementById('definition-close').addEventListener('click',hideDefinition);
  document.addEventListener('pointerover',e=>{const b=e.target.closest('.term-trigger');if(b&&e.pointerType==='mouse')showDefinition(b);});
  document.addEventListener('pointerout',e=>{const b=e.target.closest('.term-trigger');if(b&&e.pointerType==='mouse'&&!e.relatedTarget?.closest?.('.definition-popover'))hideDefinition();});
  document.addEventListener('focusin',e=>{const b=e.target.closest('.term-trigger');if(b)showDefinition(b);});
  document.addEventListener('focusout',e=>{if(e.target.closest('.term-trigger'))hideDefinition();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!modal.hidden)closeModal();hideDefinition();closeSidebar();}});
  // Bibliography sources remain the current PDF source text; hyperlink is provided in each entry.
  openHash();
})();

// Added interactive sections for the approved 12-screenshot redesign.
(() => {
  'use strict';
  function switchGroup(buttonSelector,panelSelector,key){
    document.querySelectorAll(buttonSelector).forEach(btn=>btn.addEventListener('click',()=>{
      const value=btn.dataset[key];
      document.querySelectorAll(buttonSelector).forEach(b=>{let on=b===btn;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on));});
      document.querySelectorAll(panelSelector).forEach(p=>{p.hidden=p.dataset[key+'Panel']!==value;});
    }));
  }
  switchGroup('.risk-choice','.risk-evidence','risk');
  switchGroup('.switch-tab','.switch-view','view');
  switchGroup('.prevention-choice','.prevention-panel','prevent');
  const details=[
    ['Susceptibility & predisposition','Genetic and developmental factors may precede recognizable symptoms. PMOS causes remain incompletely understood.',[2,5]],
    ['Symptom emergence','Ovulatory, androgen-related and other manifestations can emerge in adolescence or reproductive adulthood, but presentation varies.',[1,4]],
    ['Reproductive & hormonal pathways','Possible outcomes include persistent ovulatory dysfunction and reproductive symptoms. Not everyone experiences the same course.',[2,4]],
    ['Metabolic pathways','Insulin resistance and changes in glucose regulation may increase risk for metabolic complications in some individuals. Progression is not inevitable.',[6,7,16]],
    ['Combined reproductive and metabolic pathways','Reproductive manifestations and metabolic changes may occur together in the same individual. For example, ovulatory dysfunction or androgen-related symptoms may coexist with insulin resistance or altered glucose regulation. The combination and severity of these features vary, and complications are not inevitable.',[2,4,6,7]],
    ['Long-term care at every stage','Recognition, individual monitoring and evidence-based treatment can address symptoms and help identify complications across the life course.',[4]]
  ];
  const detail=document.getElementById('branch-detail');
  document.querySelectorAll('.branch-node').forEach(b=>b.addEventListener('click',()=>{
    const i=Number(b.dataset.stage);const [head,body,refs]=details[i];
    document.querySelectorAll('.branch-node').forEach(x=>{const on=x===b;x.classList.toggle('selected',on);x.setAttribute('aria-pressed',String(on));});
    detail.replaceChildren();const title=document.createElement('h4');title.textContent=head;
    const para=document.createElement('p');para.append(document.createTextNode(body+' '));
    // One grouped citation, with each number linked individually: [2,5].
    para.append(document.createTextNode('['));
    refs.forEach((n,j)=>{
      if(j)para.append(document.createTextNode(','));
      const link=document.createElement('a');link.href='#ref-'+n;link.className='citation';
      link.textContent=String(n);link.setAttribute('aria-label','View reference '+n);
      para.append(link);
    });
    para.append(document.createTextNode(']'));
    detail.append(title,para);
  }));
})();

// Verified 1990 and 2021 observations from Lin et al. (2025), reference [8].
// Data points represent two years, never a fabricated annual series.
(() => {
  'use strict';
  const history={
    prevalence:{title:'Age-standardized prevalence',unit:'per 100,000',a:676.8,b:867.7},
    incidence:{title:'Age-standardized incidence',unit:'per 100,000',a:24.2,b:30.7},
    dalys:{title:'Age-standardized DALYs',unit:'per 100,000',a:6.0,b:7.6}
  };
  const plot=document.getElementById('historical-plot'),description=document.getElementById('historical-description');
  if(!plot||!description)return;
  const graphDescriptions={
    prevalence:'The age-standardized prevalence rate increased from 676.8 per 100,000 in 1990 to 867.7 per 100,000 in 2021. This represents a higher estimated proportion of people living with PMOS in the population at the later time point.',
    incidence:'The age-standardized incidence rate increased from 24.2 per 100,000 in 1990 to 30.7 per 100,000 in 2021. Incidence describes newly occurring cases rather than everyone already living with the condition.',
    dalys:'The age-standardized DALY rate increased from 6.0 per 100,000 in 1990 to 7.6 per 100,000 in 2021. DALYs measure health loss from disability and premature mortality; this is not a count of cases.'
  };
  function show(key){
    const d=history[key];if(!d)return;
    const m=Math.max(d.a,d.b);
    const rows=plot.querySelectorAll('.historical-row');
    [d.a,d.b].forEach((v,i)=>{
      rows[i].querySelector('.historical-bar').style.width=(v/m*100).toFixed(2)+'%';
      rows[i].querySelector('.historical-value').textContent=v.toLocaleString('en-US',{maximumFractionDigits:1});
    });
    description.replaceChildren();
    const label=document.createElement('strong');label.textContent='Graph Description:';
    description.append(label,document.createTextNode(' '+graphDescriptions[key]+' The graph compares only the two reported endpoints, not an annual trend. ['));
    const citation=document.createElement('a');citation.href='#ref-8';citation.className='citation';
    citation.textContent='8';citation.setAttribute('aria-label','View reference 8');
    description.append(citation,document.createTextNode(']'));
    plot.setAttribute('aria-label',`${d.title} ${d.unit}: ${d.a} in 1990 versus ${d.b} in 2021`);
    document.querySelectorAll('.historical-choice').forEach(b=>{const on=b.dataset.historical===key;b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));});
  }
  document.querySelectorAll('.historical-choice').forEach(b=>b.addEventListener('click',()=>show(b.dataset.historical)));
  show('prevalence');
})();
