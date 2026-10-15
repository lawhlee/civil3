export const VERSION = 1;
export const LETTERS = ['ㄱ','ㄴ','ㄷ','ㄹ','ㅁ','ㅂ'];
export const NUMBERS = ['①','②','③','④','⑤'];
export const SETS = [
  {id:'2026-09',label:'9월',count:29},
  {id:'2026-10',label:'10월',count:30}
];
export function questionLabel(item){return `${(SETS.find(s=>s.id===(item.set||SETS[0].id))||SETS[0]).label} ${item.number||item.q||item.n}번`;}
export const chapters = [
 ['01',1,35,'제1강 · 물권법 총설'],['02',36,80,'제2강 · 점유제도'],
 ['03a',81,110,'제3강 · 소유권·등기 (전반)'],['03b',111,152,'제3강 · 소유권·등기 (후반)'],
 ['04',153,190,'제4강 · 취득시효·선의취득'],['05',191,233,'제5강 · 소유권의 효력과 범위'],
 ['06',234,292,'제6강 · 공동소유·명의신탁'],['07',293,313,'제7강 · 담보·저당권'],
 ['08',314,381,'제8강 · 저당권'],['09',382,408,'제9강 · 유치권·질권'],['10',409,441,'제10강 · 비전형 담보']
];
export function shuffle(xs, rng=Math.random) {
  const a=[...xs]; for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a;
}
export function seeded(seed) {let a=seed>>>0;return ()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
const combo=q=>q.statements.some(s=>LETTERS.includes(s.key));
const cleanChoice=t=>t.replace(/^[①②③④⑤]\s*/, '');
function base(q){
  const set=q.set||SETS[0].id;
  const reviewedAnswer=q.reviewedAnswer??q.answer;
  return {q:q.n,set,number:q.number||q.n,title:q.title,topic:q.topic,pdfPage:q.pdfPage,note:q.note||'',sourceNote:q.sourceNote||'',answerReviewRequired:reviewedAnswer!==q.answer,answerReviewNote:q.answerReviewNote||''};
}
function detail(s){return {key:s.key,text:s.text,truth:s.truth,explanation:s.explanation,correction:s.correction||'',refs:s.refs||[],externalRefs:s.externalRefs||[],quotations:s.quotations||[],note:s.note||'',...(s.changed?{changed:true,originalText:s.originalText}:{}),...(s.verdictLabel?{verdictLabel:s.verdictLabel}:{}),...(s.verdictReview?{verdictReview:true}:{}),...(s.originalKey?{originalKey:s.originalKey}:{})};}
const reordered=options=>options.some((o,i)=>o.id!==[...options].sort((a,b)=>Number(a.id)-Number(b.id))[i].id);
function originalDetails(q,options){
  const statements=combo(q)?q.statements:options.map((o,i)=>({...q.statements[Number(o.id)-1],key:String(i+1),originalKey:o.id}));
  const september=(q.set||SETS[0].id)===SETS[0].id;
  return statements.map(s=>detail({...s,verdictReview:!!s.reviewVerdictLabel,verdictLabel:s.reviewVerdictLabel||(september&&q.n===8?(s.truth?'청구 인정':'청구 불인정'):september&&q.n===25?(s.truth?'소가 적법함':'소가 부적법함'):'')}));
}
export function original(q, doShuffle=false, rng=Math.random) {
  const options=q.choices.map((text,i)=>({id:String(i+1),text:cleanChoice(text),original:i+1}));
  const displayed=doShuffle?shuffle(options,rng):options;
  return {...base(q),id:`original-${q.n}`,type:'mcq',origin:'original',label:'원문',stem:q.stem,
    statements:combo(q)?q.statements.map(s=>({key:s.key,text:s.text})):[],details:originalDetails(q,displayed),options:displayed,optionsReordered:reordered(displayed),correct:String(q.reviewedAnswer??q.answer),originalAnswer:q.answer,reviewedAnswer:q.reviewedAnswer??q.answer,...(q.acceptedAnswers?{acceptedCorrectIds:q.acceptedAnswers.map(String)}:{})};
}
export function ox(q,s,changed=false){
  const v=changed?s.variant:{...s,text:s.oxText||s.text};
  return {...base(q),id:`ox-${q.n}-${s.key}-${changed?'v':'o'}`,type:'ox',origin:changed?'variant':'original',label:changed?'변형 O/X':'원문 지문 O/X',stem:'다음 지문은 옳은가요?',
    context:q.oxContext||'',statements:[{key:s.key,text:v.text}],
    details:[detail({...s,text:v.text,truth:v.truth,explanation:changed?v.explanation:s.explanation,quotations:v.quotations||s.quotations,originalText:s.text,changed})],
    options:[{id:'O',text:'옳다',symbol:'O'},{id:'X',text:'옳지 않다',symbol:'X'}],correct:v.truth?'O':'X'};
}
function variantStem(q){
  let t=q.stem;
  if(q.variantContext!==undefined)return q.variantContext;
  const lines=t.split('\n');
  const questionAt=t.search(/(?:이에 관한 설명|이에 관하여|다음의 설명|아래 각 소가|다음 설명 중)/);
  if(questionAt>=0&&questionAt>12) t=t.slice(0,questionAt).trim();
  else if(/옳[은지]|올바르|고른 것|적법한 것|인정되지 않는 경우/.test(t))t=t.replace(/[^.\n]*?(?:옳[은지]|올바르|고른 것|적법한 것|인정되지 않는 경우)[\s\S]*$/,'').trim();
  return t;
}
function caseStates(q,pattern){return q.statements.map((s,i)=>{const changed=pattern[i]==='1';const v=changed?s.variant:{...s,text:s.practiceText||s.positiveText||s.text};return {...s,text:v.text,truth:v.truth,explanation:v.explanation,quotations:v.quotations||s.quotations,originalText:s.text,changed,displayKey:LETTERS[i]};});}
const combinationText=(mask,count)=>LETTERS.slice(0,count).filter((_,i)=>mask&(1<<i)).join(', ')||'해당 없음';
function variantItem(q,states,positive,options){
  const pattern=states.map(s=>s.changed?'1':'0').join('');
  const context=variantStem(q);
  const mask=states.reduce((m,s,i)=>s.truth===positive?m|(1<<i):m,0);
  return {...base(q),id:`variant-${q.n}-${pattern}-${positive?'T':'F'}`,type:'mcq',origin:'variant',label:'사례 변형',
    stem:`${context?context+'\n\n':''}다음 지문 중 ${positive?'옳은':'옳지 않은'} 것을 모두 고르세요. (각 지문은 독립적이며, 다툼이 있는 경우 판례에 의함)`,
    statements:states.map((s,i)=>({key:LETTERS[i],text:s.text})),details:states.map((s,i)=>detail({...s,key:LETTERS[i],verdictLabel:''})),options,optionsReconstructed:true,optionsReordered:reordered(options),correct:String(mask),positive};
}
export function caseVariant(q,doShuffle=true,rng=Math.random){
  // Every changed statement is authored and checked against its source; no text negation at runtime.
  let pattern=q.statements.map(()=>rng()<0.5?'1':'0').join('');
  if(!pattern.includes('1'))pattern='1'+pattern.slice(1);
  const states=caseStates(q,pattern);
  let positive=rng()<0.5;
  let selected=states.map((s,i)=>s.truth===positive?i:-1).filter(i=>i>=0);
  if(selected.length===0){positive=!positive;selected=states.map((_,i)=>i);}
  const mask=selected.reduce((m,i)=>m|(1<<i),0);
  const masks=shuffle(Array.from({length:(1<<states.length)-1},(_,i)=>i+1).filter(m=>m!==mask),rng).slice(0,4);
  const option=(m)=>({id:String(m),text:combinationText(m,states.length)});
  let options=shuffle([option(mask),...masks.map(option)],rng);
  if(!doShuffle)options=options.sort((a,b)=>Number(a.id)-Number(b.id));
  return variantItem(q,states,positive,options);
}
export function pool(bank,{source='mix',type='all',topic='all',set='all',shuffleOptions=true}={},rng=Math.random){
  const qs=bank.filter(q=>(topic==='all'||q.topic===topic)&&(set==='all'||(q.set||SETS[0].id)===set));let out=[];
  for(const q of qs){
    if(source==='original'){out.push(original(q,shuffleOptions,rng));continue;}
    if(q.kind==='concept'){
      for(const s of q.statements){if(s.excludeOX)continue;if(source!=='variant')out.push(ox(q,s));if(source!=='claims'&&!s.excludeVariant)out.push(ox(q,s,true));}
    } else {if(source!=='variant')out.push(original(q,shuffleOptions,rng));if(source!=='claims'&&!q.excludeVariant)out.push(caseVariant(q,shuffleOptions,rng));}
  }
  return out.filter(x=>type==='all'||x.type===type);
}
export function chooseDeck(items,count,rng=Math.random,randomize=true){
  if(!randomize)return items.slice(0,count||items.length);
  // Round-robin by original question keeps a long concept question from dominating a short session.
  const groups=new Map();for(const x of shuffle(items,rng)){if(!groups.has(x.q))groups.set(x.q,[]);groups.get(x.q).push(x);}
  const order=shuffle([...groups.keys()],rng),out=[];
  while(out.length<items.length){for(const key of order){const x=groups.get(key).pop();if(x)out.push(x);}}
  return out.slice(0,count||out.length);
}
export const fresh=()=>({version:VERSION,records:{},bookmarks:{},session:null,history:[]});
const assessmentText=text=>String(text||'').normalize('NFKC').replace(/\s+/g,' ').trim();
function assessmentSignature(item){return JSON.stringify({
  stem:assessmentText(item.stem),context:assessmentText(item.context),
  statements:item.statements.map(s=>[s.key,assessmentText(s.text)]),
  options:item.options.map(o=>[o.id,assessmentText(o.text)]),correct:item.correct,accepted:[...(item.acceptedCorrectIds||[item.correct])].sort()
});}
function refreshItem(item,bank){
  const q=bank.find(q=>q.n===item.q);if(!q)return {item,changed:false};
  let next;
  if(item.id===`original-${q.n}`){
    next=original(q);
    if(item.options.length===next.options.length&&new Set(item.options.map(o=>o.id)).size===next.options.length&&item.options.every(o=>next.options.some(n=>n.id===o.id))){
      const options=new Map(next.options.map(o=>[o.id,o]));next.options=item.options.map(o=>options.get(o.id));
      next.details=originalDetails(q,next.options);next.optionsReordered=reordered(next.options);
    }
  }else{
    const oxMatch=item.id.match(/^ox-(\d+)-(.+)-(o|v)$/),caseMatch=item.id.match(/^variant-(\d+)-([01]+)-(T|F)$/);
    if(oxMatch&&Number(oxMatch[1])===q.n){
      const s=q.statements.find(s=>s.key===oxMatch[2]);if(!s)return {item,changed:false};
      next=ox(q,s,oxMatch[3]==='v');
      if(item.options.length===2&&new Set(item.options.map(o=>o.id)).size===2&&item.options.every(o=>next.options.some(n=>n.id===o.id))){
        const options=new Map(next.options.map(o=>[o.id,o]));next.options=item.options.map(o=>options.get(o.id));
      }
    }else if(caseMatch&&Number(caseMatch[1])===q.n&&caseMatch[2].length===q.statements.length){
      const states=caseStates(q,caseMatch[2]),positive=caseMatch[3]==='T';
      const mask=states.reduce((m,s,i)=>s.truth===positive?m|(1<<i):m,0);
      const options=item.options.map(o=>({...o,text:combinationText(Number(o.id),states.length)}));
      // If a later substantive correction changes the answer, retain the existing
      // combinations where possible and replace only the previous answer slot.
      if(!options.some(o=>o.id===String(mask))){
        const at=Math.max(0,options.findIndex(o=>o.id===item.correct));
        options[at]={id:String(mask),text:combinationText(mask,states.length)};
      }
      next=variantItem(q,states,positive,options);
    }else return {item,changed:false};
  }
  const changed=assessmentSignature(item)!==assessmentSignature(next);
  if(changed)next.revisionNote='지문 검토 후 내용이 수정되었습니다. 수정 전 학습 기록은 보존하며, 현재 지문으로 다시 확인해 주세요.';
  else if(item.revisionNote)next.revisionNote=item.revisionNote;
  return {item:next,changed};
}
export function refreshState(state,bank){
  // Version 1 backups store item snapshots. Refresh the source content without
  // discarding learning history or reshuffling the options the learner saw.
  for(const record of Object.values(state.records)){
    const refreshed=refreshItem(record.item,bank);record.item=refreshed.item;
    if(refreshed.changed)record.needsReview=true;
  }
  for(const [id,item] of Object.entries(state.bookmarks))state.bookmarks[id]=refreshItem(item,bank).item;
  if(state.session){
    state.session.deck=state.session.deck.map((item,i)=>{
      const refreshed=refreshItem(item,bank);
      // A response to a different proposition must not grade the revised one.
      if(refreshed.changed)delete state.session.responses[i];
      return refreshed.item;
    });
  }
  return state;
}
export function isCorrectAnswer(item,answer){return Array.isArray(item.acceptedCorrectIds)?item.acceptedCorrectIds.includes(answer):answer===item.correct;}
export function grade(state,item,answer){
  const right=isCorrectAnswer(item,answer),old=state.records[item.id]||{attempts:0,correct:0,wrong:0};
  state.records[item.id]={...old,attempts:old.attempts+1,correct:old.correct+(right?1:0),wrong:old.wrong+(right?0:1),lastCorrect:right,needsReview:false,at:Date.now(),item};return right;
}
export function statistics(state){const r=Object.values(state.records);const attempts=r.reduce((a,b)=>a+b.attempts,0),correct=r.reduce((a,b)=>a+b.correct,0);return {attempts,correct,accuracy:attempts?Math.round(correct/attempts*100):0,wrong:r.filter(x=>!x.lastCorrect||x.needsReview),covered:new Set(r.map(x=>x.item.q)).size,bookmarks:Object.values(state.bookmarks).length};}
function validAcceptedAnswers(x){return x.acceptedCorrectIds===undefined||(x.type==='mcq'&&x.origin==='original'&&Array.isArray(x.acceptedCorrectIds)&&x.acceptedCorrectIds.length>0&&new Set(x.acceptedCorrectIds).size===x.acceptedCorrectIds.length&&x.acceptedCorrectIds.includes(x.correct)&&x.acceptedCorrectIds.every(id=>typeof id==='string'&&x.options.some(o=>o.id===id)));}
export function validItem(x){return !!x&&typeof x.id==='string'&&Number.isInteger(x.q)&&x.q>=1&&x.q<=SETS.reduce((total,s)=>total+s.count,0)&&['ox','mcq'].includes(x.type)&&typeof x.stem==='string'&&Array.isArray(x.options)&&x.options.length>=2&&x.options.length<=5&&x.options.every(o=>typeof o.id==='string'&&typeof o.text==='string')&&x.options.some(o=>o.id===x.correct)&&validAcceptedAnswers(x)&&Array.isArray(x.statements)&&Array.isArray(x.details)&&x.details.every(s=>typeof s.text==='string'&&typeof s.truth==='boolean'&&typeof s.explanation==='string'&&Array.isArray(s.refs));}
export function validateState(s){
  if(!s||s.version!==VERSION||!s.records||!s.bookmarks||!Array.isArray(s.history))return false;
  if(Object.keys(s.records).length>15000||Object.keys(s.bookmarks).length>15000)return false;
  if(!Object.values(s.records).every(r=>validItem(r.item)&&[r.attempts,r.correct,r.wrong].every(n=>Number.isInteger(n)&&n>=0)&&typeof r.lastCorrect==='boolean'))return false;
  if(!Object.values(s.bookmarks).every(validItem))return false;
  if(s.session){const x=s.session;if(!Array.isArray(x.deck)||!x.deck.length||!x.deck.every(validItem)||!Number.isInteger(x.index)||x.index<0||x.index>=x.deck.length||!x.responses||!Number.isFinite(x.started)||!Number.isFinite(x.duration)||x.duration<=0||!['practice','exam'].includes(x.mode))return false;
    if(!Object.entries(x.responses).every(([i,r])=>/^\d+$/.test(i)&&x.deck[Number(i)]&&r&&x.deck[Number(i)].options.some(o=>o.id===r.selected)&&(!r.graded||typeof r.correct==='boolean')))return false;
  }
  return true;
}
export function escapeHTML(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
