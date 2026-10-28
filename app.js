const roles = [
  { id: 'dev', name: '研发负责人', icon: '⌘', focus: '状态流转 · 接口契约 · 依赖改造 · 性能容量', sample: '这个状态回跳的场景，服务端怎么防止重复处理？', keywords: ['状态', '接口', '服务端', '数据', '性能', '依赖', '并发', '超时', '系统', '技术'] },
  { id: 'qa', name: '测试', icon: '◉', focus: '可测性 · 边界异常 · 兼容性 · 回归范围', sample: '断网或重复提交时，用户会看到什么？', keywords: ['验收', '测试', '异常', '失败', '边界', '兼容', '提交', '网络', '回滚', '空'] },
  { id: 'design', name: '交互 / 视觉设计', icon: '✳', focus: '状态完整 · 操作可逆 · 一致性 · 可用性', sample: '加载超过 3 秒时，页面会给用户什么反馈？', keywords: ['页面', '交互', '按钮', '展示', '提示', '加载', '设计', '输入', '操作', '文案'] },
  { id: 'biz', name: '业务方 / 需求方', icon: '◌', focus: '目标一致 · 优先级 · 范围边界 · 投入产出', sample: '如果这期只能保留一个目标，最重要的是什么？', keywords: ['目标', '用户', '范围', '指标', '收益', '优先', '场景', '上线', '需求', '成本'] },
  { id: 'ops', name: '运营 / 数据', icon: '⌁', focus: '埋点口径 · 上线运营 · 客服支持 · 灰度回滚', sample: '这个指标的计算口径和统计周期分别是什么？', keywords: ['指标', '数据', '埋点', '运营', '上线', '灰度', '反馈', '统计', '用户', '转化'] },
  { id: 'security', name: '权限 / 数据安全', icon: '◇', focus: '权限模型 · 审计留痕 · 个人信息 · 合规风险', sample: '不同角色能看到的数据范围在哪里定义？', keywords: ['权限', '安全', '数据', '隐私', '个人信息', '删除', '登录', '审计', '访问', '保留'] },
];
const levels = { quick: { label: '快审', each: 1, minutes: 5 }, standard: { label: '标准', each: 3, minutes: 15 }, deep: { label: '深度', each: 5, minutes: 30 } };
const state = { page: 'home', doc: null, selected: roles.map(r => r.id), depth: 'standard', session: null, showPaste: false, loading: false };
const root = document.querySelector('#app');
const toastEl = document.querySelector('#toast');
const storage = {
  async get(key) { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  async set(key, value) { localStorage.setItem(key, JSON.stringify(value)); },
  async remove(key) { localStorage.removeItem(key); }
};
function esc(v='') { return String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function toast(msg) { toastEl.textContent = msg; toastEl.classList.add('show'); setTimeout(() => toastEl.classList.remove('show'), 2200); }
function parseDoc(text, title='未命名文档', url='') {
  const sections = []; let current = '正文';
  const lines = text.split(/\r?\n/); const body = [];
  for (const line of lines) { const h = line.match(/^\s{0,3}#{1,4}\s+(.+)$/); if (h) { current = h[1].trim(); sections.push(current); } else if (line.trim()) body.push({ text: line.trim(), section: current }); }
  const clean = body.map(p => p.text).join('\n');
  return { title: title || '未命名文档', text, clean, sections: [...new Set(sections)], paragraphs: body, url, fingerprint: `${url}|${simpleHash(text)}`, words: clean.length, parsedAt: Date.now() };
}
function simpleHash(str) { let h=2166136261; for(let i=0;i<str.length;i++) h=Math.imul(h^str.charCodeAt(i),16777619); return (h>>>0).toString(16); }
async function init() {
  const [saved, pref, savedDoc] = await Promise.all([storage.get('reviewSession'), storage.get('reviewPreferences'), storage.get('reviewDoc')]);
  if (pref?.selected?.length) state.selected = pref.selected;
  if (pref?.depth) state.depth = pref.depth;
  if (saved && Date.now()-saved.updatedAt < 86400000 && saved.status === 'running') state.session = saved;
  const doc = await readActiveTab();
  if (doc) state.doc = doc;
  else if (savedDoc) state.doc = savedDoc;
  render();
}
async function readActiveTab() { return null; }
function shell(content, active='home') {
  return `<header class="topbar"><div class="brand"><div class="brand-mark">预</div><div><div class="brand-name">评审预演</div><div class="brand-sub">AI 模拟评审会</div></div></div><button class="icon-btn" data-action="settings" aria-label="设置">⚙</button></header><main>${content}</main><footer class="footer-nav"><button class="nav-item ${active==='home'?'active':''}" data-action="home"><span>⌂</span>工作台</button><button class="nav-item ${active==='history'?'active':''}" data-action="history"><span>◷</span>历史记录</button><button class="nav-item ${active==='settings'?'active':''}" data-action="settings"><span>⚙</span>设置</button></footer>`;
}
function render() {
  if (state.page === 'home') renderHome(); else if (state.page === 'config') renderConfig(); else if (state.page === 'review') renderReview(); else if (state.page === 'results') renderResults(); else if (state.page === 'settings') renderSettings(); else if (state.page === 'history') renderHistory();
  bind();
}
function renderHome() {
  const d=state.doc; const activeSession=state.session;
  const content = `<section class="hero"><div class="eyebrow"><i></i>评审会前，先预演一遍</div><h1>让不同角色，<br><em>提前问出关键问题。</em></h1><p class="hero-copy">从需求文档出发，模拟研发、测试、设计等视角的评审追问，整理成你能带走的待补清单。</p><div class="hero-art"><div class="orbit orbit-a"></div><div class="orbit orbit-b"></div><div class="orbit orbit-c"></div><div class="art-center">文档</div><div class="art-chip chip-1">⌘ 研发</div><div class="art-chip chip-2">◉ 测试</div><div class="art-chip chip-3">◇ 权限</div><div class="art-chip chip-4">✳ 设计</div></div></section>
    ${activeSession ? `<section class="resume-card"><div class="resume-copy"><div class="eyebrow">上次评审 · 24 小时内有效</div><strong>${esc(activeSession.docTitle)}</strong><span>已完成 ${activeSession.questions.length} 题 · 继续上次进度</span></div><button class="btn btn-dark" data-action="resume">继续 <span>→</span></button></section>`:''}
    <section class="doc-card"><div class="section-head"><div><span class="section-kicker">01 / 评审材料</span><h2>选择一份需求文档</h2></div><button class="text-btn" data-action="import">导入文件 ↗</button></div>
      ${d ? `<div class="doc-file"><div class="file-icon">文</div><div class="file-meta"><strong>${esc(d.title)}</strong><span>${d.sections.length || 1} 个章节 · ${d.words.toLocaleString()} 字</span></div><span class="check-mark">✓</span></div>`:`<div class="empty-doc"><div class="empty-icon">＋</div><strong>添加一份需求文档</strong><span>支持粘贴内容，或导入 Markdown / TXT 文件</span><div class="empty-actions"><button class="btn btn-outline" data-action="paste">粘贴文档内容</button><button class="btn btn-outline" data-action="import">导入文件</button></div></div>`}
      ${d ? `<div class="doc-actions"><button class="text-btn paste-link" data-action="paste">粘贴或替换内容</button><button class="text-btn paste-link" data-action="import">导入其他文件</button></div>`:''}
      ${state.showPaste ? `<div class="paste-box"><input id="docTitle" placeholder="文档标题" value="${esc(d?.title || '')}"/><textarea id="docText" placeholder="粘贴需求文档正文…">${esc(d?.text || '')}</textarea><div class="row-end"><button class="btn btn-outline" data-action="cancelPaste">取消</button><button class="btn btn-dark" data-action="saveDoc">读取文档 →</button></div></div>`:''}
      <input id="fileInput" class="visually-hidden" type="file" accept=".md,.markdown,.txt,text/plain,text/markdown" />
    </section>
    <section class="privacy-note"><span>✦</span><div><strong>你的文档，由你掌控</strong><p>当前为本地演示模式，内容与评审记录只保存在此浏览器中。</p></div></section>
    <button class="btn btn-primary start-home" data-action="start" ${!d?'disabled':''}>发起模拟评审 <span>→</span></button>`;
  root.innerHTML=shell(content);
}
function renderConfig() {
  const lv=levels[state.depth], count=state.selected.length*lv.each;
  const roleCards=roles.map(r=>`<button class="role-card ${state.selected.includes(r.id)?'selected':''}" data-action="toggleRole" data-id="${r.id}"><span class="role-check">${state.selected.includes(r.id)?'✓':''}</span><span class="role-icon">${r.icon}</span><span class="role-copy"><strong>${r.name}</strong><small>${r.focus}</small><small class="sample">“${r.sample}”</small></span><span class="role-expand">⌄</span></button>`).join('');
  const content=`<button class="back-link" data-action="home">← 返回工作台</button><div class="page-title"><span class="section-kicker">02 / 评审设置</span><h1>选好视角，<br/>开始预演。</h1><p>通用基础包已为你准备好，也可以调整参与评审的角色。</p></div>
    <section class="setting-block"><div class="block-head"><div><h2>通用基础包 <span class="pill">已选 · 必选</span></h2><p>6 个角色 · 24 个检查维度</p></div><span class="lock-icon">⌑</span></div><div class="package-placeholder"><span>＋</span> 场景专项包 <small>更多场景包即将上线</small></div></section>
    <section class="setting-block"><div class="block-head"><div><h2>评审角色 <span class="muted">${state.selected.length} / 6</span></h2><p>至少保留 1 个角色</p></div><button class="text-btn" data-action="allRoles">全选</button></div><div class="role-list">${roleCards}</div></section>
    <section class="setting-block"><div class="block-head"><div><h2>评审深度</h2><p>根据文档复杂度选择评审节奏</p></div></div><div class="depth-list">${Object.entries(levels).map(([id,v])=>`<button class="depth-card ${state.depth===id?'selected':''}" data-action="depth" data-id="${id}"><span class="depth-radio">${state.depth===id?'<i></i>':''}</span><span class="depth-title">${v.label}<small>${id==='quick'?'适合快速过一遍':id==='standard'?'覆盖核心问题与一次追问':'全面压力测试'}</small></span><span class="depth-time">${v.minutes}<small>分钟</small></span></button>`).join('')}</div></section>
    <div class="config-bottom"><div><strong>预计 ${count} 个问题</strong><span>约 ${lv.minutes} 分钟 · 逐个回答</span></div><button class="btn btn-primary" data-action="begin" ${!state.selected.length?'disabled':''}>开始评审 <span>→</span></button></div>`;
  root.innerHTML=shell(content);
}
function makeQuestions(doc, selected, depth) {
  const count=levels[depth].each; const candidates=doc.paragraphs.filter(p=>p.text.length>=20); const qs=[]; const used=new Set();
  for(const roleId of selected){ const role=roles.find(r=>r.id===roleId); let n=0;
    const sorted=candidates.map((p,i)=>({p,i,score:role.keywords.reduce((s,k)=>s+(p.text.toLowerCase().includes(k.toLowerCase())?1:0),0)})).sort((a,b)=>b.score-a.score||a.i-b.i);
    for(const item of sorted){if(n>=count)break; if(used.has(`${role.id}-${item.i}`))continue; used.add(`${role.id}-${item.i}`); const checks=[
      ['边界条件','在“{quote}”这一段里，相关的边界情况和例外条件是如何定义的？'],
      ['落地细节','针对“{quote}”，具体由哪个角色负责处理，完成条件是什么？'],
      ['验证方式','关于“{quote}”，上线前如何验证结果符合预期？'],
      ['异常处理','如果“{quote}”描述的流程遇到失败或中断，后续如何恢复？'],
      ['口径澄清','“{quote}”中的关键口径如何衡量，判断标准是什么？']
    ]; const c=checks[(n+qs.length)%checks.length]; const quote=item.p.text.trim().slice(0,120);
      const prompt=c[1].replace('{quote}',quote);
      qs.push({id:`q-${role.id}-${n}-${Date.now()}`,role:role.name,roleId,dimension:role.focus.split(' · ')[n%4],checklistId:`${role.id}-seed-${n+1}`,question:prompt,quote,section:item.p.section,why:`从「${item.p.section}」的描述中核对评审边界。`,confidence:item.score?0.78:0.62,status:'pending',answer:'',feedback:null,followups:0}); n++; }
  }
  return qs;
}
async function beginReview() {
  if(!state.doc||!state.selected.length)return;
  const q=makeQuestions(state.doc,state.selected,state.depth);
  state.session={id:`r-${Date.now()}`,docTitle:state.doc.title,fingerprint:state.doc.fingerprint,docText:state.doc.text,selected:[...state.selected],depth:state.depth,status:'running',startedAt:Date.now(),updatedAt:Date.now(),questions:q,index:0,mode:'local-demo',seedVersion:'seed-v1.0',promptVersion:'local-rules-v0.1'};
  await storage.set('reviewSession',state.session); await storage.set('reviewPreferences',{selected:state.selected,depth:state.depth}); state.page='review'; render();
}
function currentQuestion(){return state.session?.questions[state.session.index];}
function renderReview() {
 const s=state.session; if(!s){state.page='home';return renderHome();} const q=currentQuestion(); if(!q){return finishReview();}
 const completed=s.questions.filter(x=>x.status!=='pending').length; const percent=Math.round(completed/s.questions.length*100);
 const content=`<div class="review-top"><button class="back-link" data-action="home">⌄ 保存并退出</button><div class="review-count"><span>问题 ${s.index+1} <i>/</i> ${s.questions.length}</span><span>${levels[s.depth].label}评</span></div><div class="progress"><i style="width:${percent}%"></i></div></div>
 <div class="review-body"><div class="role-label"><span class="role-icon">${roles.find(r=>r.id===q.roleId)?.icon||'◌'}</span><div><strong>${q.role}</strong><small>${q.dimension}</small></div></div><div class="question-card"><div class="question-badge">评审问题</div><h2>${esc(q.question)}</h2><p class="why">${esc(q.why)}</p><div class="quote-card"><div class="quote-head"><span>原文依据</span><button class="text-btn" data-action="locate">定位 ↗</button></div><blockquote>“${esc(q.quote)}”</blockquote><small>来自「${esc(q.section)}」</small></div></div>
 ${q.followupText?`<div class="followup"><span>↳ 追问</span><p>${esc(q.followupText)}</p></div>`:''}
 <div class="answer-box"><label for="answer">你的回应 <span>可以直接标记待补充或跳过</span></label><textarea id="answer" placeholder="写下你的处理方案、边界或还需要补充的内容…">${esc(q.answer)}</textarea><div class="answer-actions"><button class="btn btn-outline" data-action="todo">标记待补充</button><button class="text-btn" data-action="skip">跳过此题</button><button class="btn btn-dark" data-action="answer">提交回答 <span>→</span></button></div></div>
 <div class="review-footnote">✦ 本地演示模式 · 问题来自预设规则，无外部模型调用</div></div>`;
 root.innerHTML=shell(content);
}
function isInsufficient(text){const t=text.trim();return t.length<12||/后面再考虑|会考虑|后续补充|暂时没有|不知道|待定|todo/i.test(t)||(!/(负责|方案|通过|不超过|至少|小时|天|%|分|指标|规则|阈值|当|如果|支持|采用|由)/.test(t));}
async function handleAnswer(){const q=currentQuestion(),answer=document.querySelector('#answer').value.trim();if(!answer){toast('先写下你的回应，或标记待补充');return;}q.answer=answer;
 if(state.session.depth!=='quick'&&q.followups<1&&isInsufficient(answer)){q.followups++;q.followupText='你提到的处理方向还比较概括。能否补充一个具体方案、判断边界或负责角色？';await persist();render();return;}
 q.status='answered';await nextQuestion();}
async function setTodo(){const q=currentQuestion();q.status='todo';q.answer=document.querySelector('#answer')?.value.trim()||'';await nextQuestion();}
async function skipQuestion(){currentQuestion().status='ignored';await nextQuestion();}
async function nextQuestion(){state.session.index++;state.session.updatedAt=Date.now();await persist();if(state.session.index>=state.session.questions.length)finishReview();else render();}
async function persist(){if(state.session){state.session.updatedAt=Date.now();await storage.set('reviewSession',state.session);}}
async function finishReview(){const s=state.session;if(!s)return; s.status='completed';s.completedAt=Date.now();s.updatedAt=Date.now();await storage.set('reviewSession',s);await archiveCurrent();state.page='results';render();}
function renderResults(){const s=state.session; if(!s){state.page='home';return renderHome();}const todo=s.questions.filter(q=>q.status==='todo'),answered=s.questions.filter(q=>q.status==='answered'),ignored=s.questions.filter(q=>q.status==='ignored'),duration=Math.max(1,Math.round(((s.completedAt||Date.now())-s.startedAt)/60000));
 const unselected=roles.filter(r=>!s.selected.includes(r.id)); const grouped=s.selected.map(id=>{const role=roles.find(r=>r.id===id),items=s.questions.filter(q=>q.roleId===id&&!['ignored','hallucination'].includes(q.status));return items.length?`<section class="result-group"><div class="group-title"><span class="role-icon">${role.icon}</span><strong>${role.name}</strong><small>${items.length} 条</small></div>${items.map(q=>`<article class="result-item"><div class="result-status ${q.status}">${q.status==='todo'?'待补充':q.status==='answered'?'已回答':'已标记'}</div><strong>${esc(q.question)}</strong><p>“${esc(q.quote)}”</p><div class="feedback-row"><button data-action="feedback" data-id="${q.id}" data-kind="useful" class="${q.feedback==='useful'?'chosen':''}">♡ 有用</button><button data-action="feedback" data-id="${q.id}" data-kind="noisy" class="${q.feedback==='noisy'?'chosen':''}">△ 无用</button><button data-action="feedback" data-id="${q.id}" data-kind="hallucination" class="${q.feedback==='hallucination'?'chosen':''}">⚑ 标记幻觉</button></div></article>`).join('')}</section>`:''}).join('');
 const content=`<section class="complete-hero"><div class="complete-icon">✓</div><div class="eyebrow">评审完成 · ${duration} 分钟</div><h1>这场预演，<br/><em>帮你找到 ${todo.length} 个待补点。</em></h1><p>${esc(s.docTitle)} · 共完成 ${s.questions.length} 个问题</p></section>
 <section class="stats-grid"><div><strong>${s.questions.length}</strong><span>问题总数</span></div><div><strong>${todo.length}</strong><span>待补充</span></div><div><strong>${answered.length}</strong><span>已回答</span></div><div><strong>${Math.round((s.questions.length?answered.length/s.questions.length:0)*100)}%</strong><span>回应率</span></div></section>
 <div class="result-head"><div><span class="section-kicker">03 / 评审结果</span><h2>待补丁清单</h2></div><button class="btn btn-dark" data-action="copy">复制清单 ↗</button></div>
 <div class="result-groups">${grouped||'<div class="empty-result">没有需要处理的问题，所有问题均已跳过。</div>'}</div>
 <section class="coverage-card"><div><span class="section-kicker">覆盖情况</span><h3>已覆盖 ${s.selected.length} 个角色视角</h3><p>${unselected.length?`未覆盖：${unselected.map(r=>r.name).join('、')}`:'通用基础包角色已全部覆盖'}</p></div>${unselected.length?`<button class="btn btn-outline" data-action="rerun">补跑未覆盖 →</button>`:''}</section>
 <div class="result-actions"><button class="btn btn-primary" data-action="copy">复制补丁清单 <span>↗</span></button><button class="text-btn" data-action="newReview">开始新的评审</button></div>
 <p class="demo-disclaimer">当前评审由本地预设规则生成；接入模型服务后可提供更丰富的文档针对性提问。</p>`;
 root.innerHTML=shell(content);
}
function checklistMarkdown(){const s=state.session;const lines=[`# ${s.docTitle}｜模拟评审待补清单`,`评审时间：${new Date(s.startedAt).toLocaleString('zh-CN')} · 档位：${levels[s.depth].label}`,``];for(const r of roles.filter(x=>s.selected.includes(x.id))){const items=s.questions.filter(q=>q.roleId===r.id&&q.status!=='ignored');if(!items.length)continue;lines.push(`## ${r.name}`);for(const q of items){const verdict=q.status==='todo'?'待补充':'已采纳补充';lines.push(`- **${verdict}** ${q.question}`,`  - 原文：${q.quote}`,q.answer?`  - 回应：${q.answer}`:'');}lines.push('');}return lines.join('\n');}
function renderSettings(){const content=`<button class="back-link" data-action="home">← 返回工作台</button><div class="page-title"><span class="section-kicker">设置与隐私</span><h1>数据，<br/><em>由你掌控。</em></h1><p>本地演示模式不会上传文档内容。</p></div><section class="privacy-panel"><div class="privacy-row"><span>当前模式</span><strong><i class="green-dot"></i> 本地保存</strong></div><div class="privacy-row"><span>模型服务</span><strong>尚未连接</strong></div><div class="privacy-row"><span>数据留存</span><strong>仅此浏览器 · 可随时删除</strong></div><p>评审记录使用浏览器本地存储。清除后无法恢复。此版本未接入账号同步、云端模型或会员服务。</p></section><button class="btn btn-danger" data-action="deleteData">删除本地评审数据</button><div class="about-card"><strong>评审预演 <small>v0.1.0</small></strong><p>根据《AI 模拟评审会工具 PRD v1.0》构建的可交互 MVP 原型。</p></div>`;root.innerHTML=shell(content,'settings');}
async function renderHistory(){const hist=await storage.get('reviewHistory')||[];const content=`<button class="back-link" data-action="home">← 返回工作台</button><div class="page-title"><span class="section-kicker">你的评审档案</span><h1>每一次预演，<br/><em>都有所积累。</em></h1><p>历史场次保存在本地浏览器中。</p></div>${hist.length?`<div class="history-list">${hist.map(h=>`<button class="history-card" data-action="openHistory" data-id="${h.id}"><span class="history-date">${new Date(h.startedAt).toLocaleDateString('zh-CN')}</span><strong>${esc(h.docTitle)}</strong><small>${h.questions.length} 个问题 · ${h.questions.filter(q=>q.status==='todo').length} 个待补充</small><span>→</span></button>`).join('')}</div>`:'<div class="empty-doc"><div class="empty-icon">◷</div><strong>还没有历史评审</strong><span>完成一场评审后，记录会出现在这里。</span></div>'}`;root.innerHTML=shell(content,'history');bind();}
async function archiveCurrent(){const s=state.session;if(!s)return;let hist=await storage.get('reviewHistory')||[];hist=[s,...hist.filter(x=>x.id!==s.id)].slice(0,50);await storage.set('reviewHistory',hist);}
function bind(){root.onclick=async e=>{const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
 if(a==='home'){if(state.session?.status==='running'){await persist();toast('进度已保存，可在 24 小时内继续');}state.page='home';render();}
 if(a==='settings'){state.page='settings';render();}
 if(a==='history'){await archiveCurrent();state.page='history';await renderHistory();}
 if(a==='paste'){state.showPaste=!state.showPaste;render();}
 if(a==='cancelPaste'){state.showPaste=false;render();}
 if(a==='saveDoc'){const text=document.querySelector('#docText').value.trim();if(!text){toast('请粘贴文档正文');return;}state.doc=parseDoc(text,document.querySelector('#docTitle').value.trim()||'手动粘贴的文档');state.showPaste=false;await storage.set('reviewDoc',state.doc);render();toast('文档已读取');}
 if(a==='refresh'){state.showPaste=true;render();}
 if(a==='import'){document.querySelector('#fileInput')?.click();}
 if(a==='start'){if(!state.doc){toast('请先读取一份文档');return;}state.page='config';render();}
 if(a==='toggleRole'){if(state.selected.includes(id)){if(state.selected.length===1){toast('至少保留 1 个角色');return;}state.selected=state.selected.filter(x=>x!==id);}else state.selected.push(id);render();}
 if(a==='allRoles'){state.selected=roles.map(r=>r.id);render();}
 if(a==='depth'){state.depth=id;render();}
 if(a==='begin'){await beginReview();}
 if(a==='resume'){if(state.session){state.page='review';render();}}
 if(a==='answer'){await handleAnswer();}
 if(a==='todo'){await setTodo();}
 if(a==='skip'){await skipQuestion();}
 if(a==='locate'){toast('原文引用已在问题卡片中展示');}
 if(a==='copy'){try{await navigator.clipboard.writeText(checklistMarkdown());toast('补丁清单已复制');}catch{const t=document.createElement('textarea');t.value=checklistMarkdown();document.body.appendChild(t);t.select();document.execCommand('copy');t.remove();toast('补丁清单已复制');}}
 if(a==='feedback'){const q=state.session.questions.find(x=>x.id===id);q.feedback=b.dataset.kind;if(q.feedback==='hallucination'){q.status='hallucination';toast('已记录反馈，该问题从清单移除');}await persist();await archiveCurrent();render();}
 if(a==='rerun'){const remaining=roles.filter(r=>!state.session.selected.includes(r.id)).map(r=>r.id);state.selected=[...remaining];state.depth='quick';state.session.status='running';state.session.selected.push(...remaining);state.session.questions.push(...makeQuestions(state.doc||parseDoc(state.session.docText,state.session.docTitle),remaining,'quick'));state.session.index=state.session.questions.findIndex(q=>q.status==='pending');await persist();state.page='review';render();}
 if(a==='newReview'){await archiveCurrent();state.session=null;state.page='config';render();}
 if(a==='deleteData'){if(confirm('确定删除本地评审数据吗？删除后无法恢复。')){await storage.remove('reviewSession');await storage.remove('reviewHistory');await storage.remove('reviewPreferences');await storage.remove('reviewDoc');state.session=null;state.doc=null;state.selected=roles.map(r=>r.id);state.depth='standard';state.page='home';render();toast('本地数据已删除');}}
 if(a==='openHistory'){const h=(await storage.get('reviewHistory')||[]).find(x=>x.id===id);if(h){state.session=h;state.page='results';render();}}
 };
 root.onchange=async e=>{if(e.target.id!=='fileInput'||!e.target.files?.[0])return;const file=e.target.files[0];try{const text=await file.text();if(!text.trim()){toast('文件内容为空');return;}state.doc=parseDoc(text,file.name.replace(/\.(markdown|md|txt)$/i,''));state.showPaste=false;await storage.set('reviewDoc',state.doc);render();toast('文档已导入');}catch{toast('文件读取失败，请尝试粘贴文档内容');}};
 root.onkeydown=e=>{if(e.key==='Escape'&&state.page!=='home'){state.page='home';render();}};
}
init();
