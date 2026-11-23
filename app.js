"use strict";
(() => {
const data=window.PRACTICE_BANK, C=window.TrainerCore, main=document.querySelector("main");
if(!data||!C){main.innerHTML='<p>문항을 불러오지 못했습니다. 페이지를 새로고침해 주세요.</p>';return;}
const B=C.makeBank(data), marks="①②③④⑤", storageKey="civil3-november.practice.v1";
const questionCount=data.questions.length, conceptCount=data.questions.filter(q=>q.concept).length, caseCount=questionCount-conceptCount;
const dict={all:"전체",concept:"개념형",case:"사례형"};
const art={
 file:'<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h4M9 12h6m-6 4h6"/>',
 sliders:'<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
 stack:'<path d="m3 8 9-5 9 5-9 5zM3 12l9 5 9-5M3 16l9 5 9-5"/>',
 play:'<path d="m8 5 10 7-10 7z" fill="currentColor" stroke="none"/>',
 book:'<path d="M3 5c3-.6 6 0 9 2 3-2 6-2.6 9-2v14c-3-.6-6 0-9 2-3-2-6-2.6-9-2zM12 7v14"/>',
 tally:'<path d="M4 20h17M6 16v-4m5 4V8m5 8V4"/>',
 check:'<path d="m4 12 5 5L20 6"/>',list:'<path d="M8 6h12M8 12h12M8 18h12M4 6h.1M4 12h.1M4 18h.1"/>'
};
function icon(k){return '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(art[k]||"")+'</svg>';}
document.querySelectorAll("[data-icon]").forEach(x=>x.innerHTML=icon(x.dataset.icon));
const esc=v=>String(v??"").replace(/[&<>"']/g,k=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[k]));
const empty=()=>({cfg:{...C.defaults},active:null,attempts:{},runs:[]});
function read(){try{const s=JSON.parse(localStorage.getItem(storageKey));if(!s||!Array.isArray(s.runs)||!s.attempts)return empty();s.cfg={...C.defaults,...s.cfg};if(s.active&&(!s.active.ids?.length||s.active.ids.some(id=>!B.items.has(id))||!s.active.answers))s.active=null;if(s.active)s.active.drafts??={};return s;}catch{return empty();}}
let state=read(),cfg=state.cfg,search="",filter="all";
function save(){try{localStorage.setItem(storageKey,JSON.stringify(state));}catch{document.querySelector("#live").textContent="현재 브라우저에 기록을 저장할 수 없습니다.";}}
function announce(msg){document.querySelector("#live").textContent=msg;}
function goto(page){if(location.hash==="#"+page)render();else location.hash=page;}
function page(){return (location.hash||"#home").slice(1);}
function action(id,label,cls="secondary",extra=""){return '<button type="button" class="'+cls+'" data-do="'+esc(id)+'" '+extra+'>'+label+'</button>';}
function sourceLinks(keys){const out=[...new Set(keys||[])].filter(k=>data.caseLinks[k]).map(k=>'<a target="_blank" rel="noopener" href="'+esc(data.caseLinks[k])+'">'+(k.startsWith('민법 ')?'':'대법원 ')+esc(k)+'</a>');return out.length?'<div class="sources">'+out.join("")+'</div>':"";}
function safeNow(){return new Date().toISOString();}
function configKey(k,v,t){return '<button type="button" data-do="cfg" data-k="'+k+'" data-v="'+v+'" class="'+(cfg[k]===v?"on":"")+'" aria-pressed="'+(cfg[k]===v)+'">'+t+'</button>';}
function select(k,opts){return '<select data-setting="'+k+'">'+opts.map(([v,t])=>'<option value="'+v+'" '+(cfg[k]===v?'selected':'')+'>'+t+'</option>').join("")+'</select>';}
function counts(){const p=B.pool(cfg), types={};for(const id of p){const mode=B.items.get(id).kind;types[mode]=(types[mode]||0)+1;}return {p,types,size:cfg.size==="all"?p.length:Math.min(Number(cfg.size),p.length)};}
function scopeLabel(){return dict[cfg.scope]||"전체";}
function completed(s){return Object.keys(s.answers).length;}
function modeBtn(mode,name,sub,disabled,chosen){return '<button class="mode '+(chosen?'on':'')+'" type="button" data-do="cfg" data-k="mode" data-v="'+mode+'" aria-pressed="'+chosen+'" '+(disabled?'disabled':'')+'><span class="radio"></span><span>'+name+'<span class="sub">'+sub+'</span></span></button>';}
function home(){
 const {p,types,size}=counts(),off=cfg.scope==="case",active=state.active,answers=Object.values(state.attempts),wrongs=answers.filter(x=>!x.lastCorrect).length;
 return '<section class="hero"><div class="hero-copy"><div class="eyebrow">'+icon("book")+'물권법</div><h1>민법 III 연습문제</h1><p>공동소유와 부동산 명의신탁</p><div class="metrics"><span>전체 <strong>'+questionCount+'문항</strong></span><span>개념형 <strong>'+conceptCount+'</strong></span><span>사례형 <strong>'+caseCount+'</strong></span></div></div><div class="hero-art" aria-hidden="true"><div class="book-scene"><div class="exam-sheet"></div><div class="book"><span class="ribbon"></span><div class="book-cover"><span class="book-title">민법 III</span><span class="book-sub">연습문제</span></div></div></div></div></section>'+
 '<div class="grid-home"><section class="panel"><div class="panelhead"><span class="iconbox">'+icon("sliders")+'</span><h2>연습 세트 설정</h2></div>'+
 '<fieldset class="confgroup"><legend>문항 범위</legend><div class="segments">'+configKey("scope","all",'전체 <small>'+questionCount+'</small>')+configKey("scope","concept",'개념형 <small>'+conceptCount+'</small>')+configKey("scope","case",'사례형 <small>'+caseCount+'</small>')+'</div></fieldset>'+
 '<fieldset class="confgroup"><legend>개념형 풀이 방식</legend><div class="modes">'+modeBtn("mc","원문 객관식","원래의 다섯 선택지",off,off||cfg.mode==="mc")+modeBtn("ox","선지별 O/X","지문 하나씩 판단",off,!off&&cfg.mode==="ox")+'</div>'+(off?'<p class="note">사례형은 사실관계와 선택지를 함께 보고 원문 객관식으로 풉니다.</p>':'')+'</fieldset>'+
 '<div class="switchrow"><div><strong id="variant-label">변형문제 포함</strong><small id="variant-help">'+(off?'개념형을 포함한 세트에서 선택할 수 있습니다.':(cfg.mode==="ox"?'조건이나 결론을 바꾼 개념 지문을 추가합니다.':'변형한 개념 지문을 조합한 객관식을 추가합니다.'))+'</small></div><button class="toggle '+(!off&&cfg.variant?'on':'')+'" data-do="variant" type="button" role="switch" aria-checked="'+(!off&&cfg.variant)+'" aria-labelledby="variant-label" aria-describedby="variant-help" '+(off?'disabled':'')+'></button></div>'+
 '<div class="options"><label>문항 수 '+select("size",[["all","전체"],["10","10문제"],["20","20문제"]])+'</label><label>순서 '+select("order",[["seq","문항순"],["rand","무작위"]])+'</label></div></section>'+
 '<aside><section class="summarybox"><div class="summarytop"><span class="iconbox">'+icon("stack")+'</span><h2>이번 연습</h2></div><div class="countrow"><span>'+scopeLabel()+' · '+(cfg.order==="seq"?'문항순':'무작위')+'</span><span class="count">'+size+'<small>문제</small></span></div><div class="breakdown">'+Object.entries(types).map(([k,v])=>'<div><span>'+C.forms[k]+'</span><strong>'+v+'문제</strong></div>').join('')+(size<p.length?'<div><span>위 '+p.length+'문제 중 출제</span><strong>'+size+'문제</strong></div>':'')+'</div>'+
 action("start",icon("play")+'새 세트 시작',"primary wide")+(active?action("resume",'이어서 풀기 · '+completed(active)+'/'+active.ids.length,"secondary wide"):'')+'</section>'+
 '<div class="historytease"><div><strong>나의 학습 기록</strong><p>'+ (answers.length?'풀어 본 문제 '+answers.length+'개 · 오답 '+wrongs+'개':'아직 풀이 기록이 없습니다.')+'</p></div><a href="#history">기록 보기</a></div></aside></div>';
}
function labelFor(item){return '문 '+item.qid+(item.s?' '+item.s.label:'')+' · '+C.forms[item.kind];}
function start(ids,title,ask=true,pos=0){ids=ids.filter(x=>B.items.has(x));if(!ids.length)return;if(state.active&&ask){confirmNew(()=>start(ids,title,false,pos));return;}state.active={id:Date.now().toString(36)+Math.random().toString(36).slice(2,7),title,ids:[...ids],pos,answers:{},drafts:{},started:safeNow()};save();goto("quiz");}
function confirmNew(cb){
 const dlg=document.createElement("dialog");dlg.innerHTML='<h2>새 세트를 시작할까요?</h2><p>진행 중인 세트는 종료됩니다. 이미 채점한 문제의 학습 기록은 남습니다.</p><div class="dialogactions"><button class="secondary" data-cancel>돌아가기</button><button class="primary" data-confirm>새 세트 시작</button></div>';document.body.append(dlg);dlg.addEventListener("close",()=>dlg.remove());dlg.querySelector("[data-cancel]").onclick=()=>dlg.close();dlg.querySelector("[data-confirm]").onclick=()=>{archive(false);dlg.close();cb();};dlg.showModal();
}
function addRecord(item,chosen){
 const t=safeNow(),cid=item.id,old=state.attempts[cid]||{tries:0,correct:0};old.tries+=1;old.correct+=Number(chosen===item.answer);old.lastCorrect=chosen===item.answer;old.last=t;old.choice=chosen;state.attempts[cid]=old;
}
function archive(finished){
 const s=state.active;if(!s)return;const answered=completed(s);
 if(answered||finished){const correct=s.ids.filter(id=>s.answers[id]?.correct).length;const entry={id:s.id,title:s.title,finished,answered,count:s.ids.length,correct,time:safeNow(),answers:s.answers,ids:s.ids};state.runs.unshift(entry);}
 state.active=null;save();
}
function table(q){return '<div class="tablewrap"><table class="choices-table"><thead><tr><th scope="col">선택지</th>'+q.tableHeaders.map(x=>'<th scope="col">'+esc(x)+'</th>').join('')+'</tr></thead><tbody>'+q.tableRows.map((r,i)=>'<tr><th scope="row">'+marks[i]+'</th>'+r.map(x=>'<td>'+esc(x)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';}
function stmtbox(rows,variant){return '<div class="stmtbox">'+rows.map((s,i)=>'<div class="statement"><b>'+esc(variant?C.codes[i]:s.label)+'</b><span>'+esc(s.text)+'</span></div>').join('')+'</div>';}
function formatAnswer(it,val){return it.kind==="ox"||it.kind==="vx"?["O","X"][val]:marks[val];}
function optionList(item,sel,graded){
 const isox=item.kind==="ox"||item.kind==="vx",q=item.q;
 const choices=isox?["옳다","틀리다"]:item.kind==="vm"?item.choices:q.tableRows?["①번 조합","②번 조합","③번 조합","④번 조합","⑤번 조합"]:q.choices;
 return '<div class="'+(isox?'oxpair':'choices')+'" role="group" aria-label="답 선택">'+choices.map((t,i)=>{
 const cls=['choice',sel===i?'picked':'',graded&&i===item.answer?'good':'',graded&&i===sel&&i!==item.answer?'bad':''].join(" ");
 return '<button class="'+cls+'" data-do="pick" data-i="'+i+'" aria-pressed="'+(sel===i)+'" '+(graded?'disabled':'')+'>'+(isox?'<span class="oxsymbol">'+(i===0?'O':'X')+'</span>':'<span class="bubble">'+(i+1)+'</span>')+'<span>'+esc(t)+'</span>'+(graded&&(i===item.answer||i===sel)?'<span class="sr">'+(i===item.answer?'정답':'내 선택')+'</span>':'')+'</button>';
 }).join('')+'</div>';
}
function feedback(it,a,live=true){
 const isox=it.kind==="ox"||it.kind==="vx",q=it.q,flag=a.correct?'정답입니다':'오답입니다';
 let body;
 if(isox)body='<p class="expbody">'+esc(it.s.reason)+'</p>'+sourceLinks(it.s.cases);
 else {
  const v=it.kind==="vm";
  const rows=v?q.variants.map((x,i)=>({label:C.codes[i],mark:x.truth?"O":"X",reason:x.reason})):q.explain;
  body=rows.map(x=>'<p class="expitem"><b>'+esc(x.label+' '+x.mark)+'</b>　'+esc(x.reason)+'</p>').join("")+sourceLinks(v?q.variants.flatMap(x=>x.cases||[]):q.cases);
 }
 return '<section '+(live?'id="feedback" tabindex="-1"':'')+' class="feedback"><span class="tag '+(a.correct?'green':'red')+'">'+flag+'</span><h2>'+(!a.correct?'내 답 '+formatAnswer(it,a.choice)+'　·　':'')+'정답 '+formatAnswer(it,it.answer)+'</h2>'+body+'</section>';
}
function origRead(q){return '<div class="stem">'+esc(q.stem)+'</div>'+(q.statements.length?stmtbox(q.statements,false):'')+(q.tableRows?table(q):'');}
function questionNav(s,position){
 const prev=action("prev","이전 문제","secondary",s.pos===0?"disabled":"");
 const next=action("next","다음 문제","secondary",s.pos===s.ids.length-1?"disabled":"");
 return '<nav class="question-nav" aria-label="문제 이동 ('+position+')">'+prev+next+'</nav>';
}
function quiz(){
 const s=state.active;if(!s)return '<section class="recap empty"><h1>진행 중인 세트가 없습니다</h1><a class="primary" href="#home">연습 세트 설정</a></section>';
 const it=B.items.get(s.ids[s.pos]),q=it.q,a=s.answers[it.id],sel=a?.choice??s.drafts[it.id],isox=!!it.s;
 let question;
 if(isox){const ctx=q.id===33&&it.kind==="ox"?'<div class="passage">비법인사단 A의 대표자는 甲이다.</div>':'';question=ctx+'<div class="oxprompt">'+esc(it.s.text)+'</div>';}
 else if(it.kind==="vm")question='<div class="stem">다음 지문 중 옳은 것을 모두 고른 것은? (다툼이 있는 경우 판례에 의함)</div>'+stmtbox(q.variants,true);
 else question=origRead(q);
 const done=completed(s),all=done===s.ids.length;
 return '<div class="quizgrid"><section class="quizcard"><div class="qtop"><span class="tag">'+(q.concept?'개념형':'사례형')+'</span><span class="tag '+(it.kind.startsWith("v")?'alt':'gray')+'">'+C.forms[it.kind]+'</span><span class="qnumber">세트 '+(s.pos+1)+' / '+s.ids.length+'</span></div><div class="question-heading"><h1>문 '+q.id+(isox?' · '+esc(it.s.label):'')+'</h1>'+questionNav(s,'상단')+'</div>'+question+optionList(it,sel,!!a)+(a?feedback(it,a):'')+
 '<div class="quizactions">'+questionNav(s,'하단')+(!a?action("grade","정답 확인","primary endaction",sel==null?"disabled":""):all?action("finish","결과 보기","primary endaction"):s.pos===s.ids.length-1?action("ungraded","미채점 문제로","secondary endaction"):"")+'</div></section>'+
 '<aside class="summarybox quizside"><h2>세트 진행</h2><p class="note">'+esc(s.title)+' · '+done+' / '+s.ids.length+' 채점</p><div class="linebar"><i style="width:'+done/s.ids.length*100+'%"></i></div>'+
 '<div class="navgrid" aria-label="세트 내 문제 이동">'+s.ids.map((id,i)=>{const a=s.answers[id];return '<button class="'+(i===s.pos?'here ':'')+(a?(a.correct?'ok':'miss'):'')+'" data-do="jump" data-i="'+i+'" aria-label="'+(i+1)+'번째, '+esc(labelFor(B.items.get(id)))+', '+(a?(a.correct?'정답':'오답'):'미채점')+'" '+(i===s.pos?'aria-current="step"':'')+'>'+ (i+1)+'</button>';}).join('')+'</div><a class="linkbtn" href="#home">저장하고 설정으로</a></aside></div>';
}
function catalogRows(){
 const v=search.trim().toLowerCase();let qs=[...B.questions.values()].filter(q=>(filter==="all"||q.concept===(filter==="concept"))&&(!v||String(q.id)===v||q.title.toLowerCase().includes(v)||(!/^\d+$/.test(v)&&q.stem.includes(v))));
 return qs.length?qs.map(q=>'<div class="entry"><span class="tag '+(q.concept?'':'gray')+'">'+(q.concept?'개념형':'사례형')+'</span><div class="info"><strong>'+q.id+'. '+esc(q.title)+'</strong></div>'+action("single","원문","secondary",'data-q="'+q.id+'"')+(q.concept?action("singleox","O/X","secondary",'data-q="'+q.id+'"'):'')+'</div>').join(""):'<p class="note">조건에 맞는 문항이 없습니다.</p>';
}
function catalog(){return '<div class="screenhead"><div class="eyebrow">'+icon("list")+'민법 III 연습문제</div><h1>문항 목록</h1><p>문항을 선택해 원래 순서와 번호로 풀 수 있습니다.</p></div><div class="catalogtools"><select aria-label="문항 유형" data-filter>'+Object.entries(dict).map(([k,v])=>'<option value="'+k+'" '+(filter===k?'selected':'')+'>'+v+'</option>').join('')+'</select><input type="search" aria-label="문항 검색" placeholder="번호 또는 주제 검색" value="'+esc(search)+'" data-search></div><div class="entrylist" id="entries">'+catalogRows()+'</div>';}
function wrongIds(){return Object.keys(state.attempts).filter(id=>B.items.has(id)&&!state.attempts[id].lastCorrect).sort((a,b)=>new Date(state.attempts[b].last)-new Date(state.attempts[a].last));}
function dateTxt(t){return new Intl.DateTimeFormat("ko-KR",{month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(t));}
function entriesForIds(ids){return ids.map(id=>{const i=B.items.get(id);if(!i)return "";return '<div class="entry"><span class="tag '+(i.kind.startsWith("v")?'alt':'gray')+'">'+C.forms[i.kind]+'</span><div class="info"><strong>문 '+i.qid+(i.s?' '+esc(i.s.label):'')+' · '+esc(i.q.title)+'</strong></div>'+action("retryone","다시 풀기","secondary",'data-id="'+esc(id)+'"')+'</div>';}).join("");}
function stats(entries){return '<div class="stats">'+entries.map(([v,l])=>'<div class="stat"><span>'+l+'</span><strong>'+esc(v)+'</strong></div>').join("")+'</div>';}
function history(){
 const records=Object.values(state.attempts),attempts=records.reduce((s,a)=>s+a.tries,0),hits=records.reduce((s,a)=>s+a.correct,0),wrong=wrongIds();
 return '<div class="screenhead"><div class="eyebrow">'+icon("tally")+'민법 III</div><h1>학습 기록</h1><p>이 브라우저에서 채점한 결과를 모았습니다.</p></div>'+stats([[attempts,"누적 풀이"],[attempts?Math.round(100*hits/attempts)+"%":"—","누적 정답률"],[wrong.length,"복습할 오답"]])+
 '<section class="recap"><div class="row"><h2>오답 복습</h2>'+(wrong.length?action("retrywrong","오답으로 연습","linkbtn",'style="margin-left:auto"'):'')+'</div>'+(wrong.length?'<div class="entrylist">'+entriesForIds(wrong)+'</div>':'<p class="note">'+(attempts?'최근 풀이가 틀린 문제가 없습니다.':'문제를 풀면 최근에 틀린 문항이 여기에 표시됩니다.')+'</p>')+'</section>'+
 '<section class="recap"><h2>세트 기록</h2>'+(state.active?'<div class="historyrow"><div><strong>'+esc(state.active.title)+'</strong><small>진행 중 · '+completed(state.active)+' / '+state.active.ids.length+' 채점</small></div>'+action("resume","이어 풀기","linkbtn")+'</div>':'')+(state.runs.length?state.runs.map(r=>'<div class="historyrow"><div><strong>'+esc(r.title)+'</strong><small>'+dateTxt(r.time)+' · '+(r.finished?'완료':'중간 종료')+' · '+r.correct+' / '+r.answered+' 정답</small></div>'+action("run","결과","linkbtn",'data-id="'+esc(r.id)+'"')+'</div>').join(''):state.active?'':'<p class="note">세트를 마치면 점수와 풀이 내역을 확인할 수 있습니다.</p>')+'</section>';
}
function result(r){
 if(!r)return '<div class="recap"><p>표시할 세트가 없습니다.</p><a class="primary" href="#home">연습하기</a></div>';
 const wrong=r.ids.filter(id=>r.answers[id]&&!r.answers[id].correct),miss=r.count-r.answered;
 return '<div class="screenhead"><div class="eyebrow">'+icon("check")+'세트 결과</div><h1>'+esc(r.title)+'</h1><p>'+dateTxt(r.time)+' · '+(r.finished?'풀이 완료':'중간 종료')+(miss?' · 미채점 '+miss+'문제':'')+'</p></div>'+
 stats([[r.correct+' / '+r.answered,"맞힌 문제"],[(r.answered?Math.round(r.correct/r.answered*100):0)+'%',"정답률"],[wrong.length,"오답"]])+
 '<div class="quizactions">'+(wrong.length?action("retryresult","이 세트 오답 다시 풀기","primary"):'')+'<a href="#home" class="secondary">새 세트 설정</a></div>'+
 '<section class="recap" style="margin-top:20px"><h2>문제별 풀이 결과</h2>'+r.ids.filter(id=>r.answers[id]&&B.items.has(id)).map(id=>{const a=r.answers[id],it=B.items.get(id);return '<details><summary><span class="tag '+(a.correct?'green':'red')+'">'+(a.correct?'정답':'오답')+'</span> '+esc(labelFor(it))+' · '+esc(it.q.title)+'</summary><div class="passage">'+(it.s?esc(it.s.text):it.kind==="vm"?stmtbox(it.q.variants,true):origRead(it.q))+'</div>'+feedback(it,a,false)+'</details>';}).join("")+'</section>';
}
function render(){
 const key=page(),runId=key.startsWith("result/")?key.slice(7):null;
 let content;
 if(key==="quiz")content=quiz();
 else if(key==="catalog")content=catalog();
 else if(key==="history")content=history();
 else if(runId)content=result(state.runs.find(r=>r.id===runId));
 else content=home();
 main.innerHTML=content;
 document.querySelectorAll("[data-tab]").forEach(x=>{const t=key==="catalog"?"catalog":key==="history"||runId?"history":"home";x.classList.toggle("active",x.dataset.tab===t);if(x.dataset.tab===t)x.setAttribute("aria-current","page");else x.removeAttribute("aria-current");});
}
function reposition(i){const s=state.active;if(!s||i<0||i>=s.ids.length)return;s.pos=i;save();render();main.focus({preventScroll:true});window.scrollTo(0,0);}
function refreshControl(k,v){
 cfg[k]=v;save();render();let el;
 if(k==="variant")el=main.querySelector('[data-do="variant"]');else if(k==="scope"||k==="mode")el=main.querySelector('[data-k="'+k+'"][data-v="'+v+'"]');else el=main.querySelector('[data-setting="'+k+'"]');
 el?.focus({preventScroll:true});announce('이번 연습 '+counts().size+'문제');
}
main.addEventListener("change",e=>{if(e.target.matches("[data-setting]"))refreshControl(e.target.dataset.setting,e.target.value);if(e.target.matches("[data-filter]")){filter=e.target.value;document.querySelector("#entries").innerHTML=catalogRows();}});
main.addEventListener("input",e=>{if(e.target.matches("[data-search]")){search=e.target.value;document.querySelector("#entries").innerHTML=catalogRows();}});
main.addEventListener("click",e=>{
 const b=e.target.closest("button[data-do]");if(!b||b.disabled)return;const k=b.dataset.do;
 const s=state.active, id=s?.ids[s.pos], it=B.items.get(id), idx=Number(b.dataset.i), num=Number(b.dataset.q);
 if(k==="cfg")return refreshControl(b.dataset.k,b.dataset.v);
 if(k==="variant")return refreshControl("variant",!cfg.variant);
 if(k==="start")return start(B.draw(cfg),scopeLabel()+' · '+(cfg.scope==="case"?"원문 객관식":cfg.mode==="ox"?"선지별 O/X":"원문 객관식")+(cfg.scope!=="case"&&cfg.variant?" · 변형 포함":""));
 if(k==="resume")return goto("quiz");
 if(k==="single"||k==="singleox"){
  const ox=k==="singleox",scope=ox?"concept":filter;
  const ids=B.pool({...C.defaults,scope,mode:ox?"ox":"mc"});
  const pos=ids.indexOf(ox?num+"-ox-0":num+"-mc");
  if(pos>=0)start(ids,"문항 목록 · "+dict[scope]+" · "+(ox?"선지별 O/X":"원문 객관식"),true,pos);
  return;
 }
 if(k==="retryone")return start([b.dataset.id],"오답 복습");
 if(k==="retrywrong")return start(wrongIds(),"오답 복습");
 if(k==="run")return goto("result/"+b.dataset.id);
 if(k==="retryresult"){const r=state.runs.find(r=>r.id===page().slice(7));if(r)return start(r.ids.filter(id=>r.answers[id]&&!r.answers[id].correct),"세트 오답 복습");return;}
 if(!s||!it)return;
 if(k==="pick"&&!s.answers[id]){s.drafts[id]=idx;save();main.querySelectorAll('[data-do="pick"]').forEach(x=>{const on=Number(x.dataset.i)===idx;x.classList.toggle("picked",on);x.setAttribute("aria-pressed",String(on));});main.querySelector('[data-do="grade"]').disabled=false;return;}
 if(k==="grade"&&s.drafts[id]!=null&&!s.answers[id]){const choice=s.drafts[id];s.answers[id]={choice,correct:choice===it.answer};addRecord(it,choice);delete s.drafts[id];save();render();const fb=main.querySelector("#feedback");fb?.focus({preventScroll:true});fb?.scrollIntoView({block:"nearest"});announce(s.answers[id].correct?'정답입니다':'오답입니다. 정답 '+formatAnswer(it,it.answer));return;}
 if(k==="jump")return reposition(idx);
 if(k==="prev")return reposition(s.pos-1);
 if(k==="next")return reposition(s.pos+1);
 if(k==="ungraded"){const to=s.ids.findIndex(x=>!s.answers[x]);if(to>=0)reposition(to);return;}
 if(k==="finish"&&completed(s)===s.ids.length){const rid=s.id;archive(true);goto("result/"+rid);}
});
window.addEventListener("hashchange",()=>{render();window.scrollTo(0,0);main.focus({preventScroll:true});});
window.addEventListener("storage",e=>{if(e.key===storageKey){state=read();cfg=state.cfg;render();}});
render();
})();
