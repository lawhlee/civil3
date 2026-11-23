"use strict";
(function (host) {
  const codes = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ"];
  const forms = {mc:"원문 객관식",ox:"원문 선지 O/X",vm:"변형 객관식",vx:"변형 O/X"};
  const defaults = {scope:"all", mode:"mc", variant:false, size:"all", order:"seq"};
  function mix(array, random = Math.random) {
    const a = [...array];
    for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
    return a;
  }
  function variantQuestion(q) {
    const rows=q.variants, max=(1<<rows.length)-1;
    const mask=rows.reduce((m,s,i)=>s.truth?m|(1<<i):m,0);
    const rank=m=>{let h=Math.imul(m+39,q.id*37+701);return Math.imul(h^(h>>>8),2654435761)>>>0;};
    const bits=m=>m.toString(2).replace(/0/g,"").length;
    const possible=Array.from({length:max+1},(_,i)=>i).filter(m=>m!==mask);
    possible.sort((a,b)=>bits(a^mask)-bits(b^mask)||rank(a)-rank(b));
    const options=[mask,...possible.slice(0,4)].sort((a,b)=>bits(a)-bits(b)||a-b);
    return {choices:options.map(m=>codes.slice(0,rows.length).filter((_,i)=>m&(1<<i)).join(", ")||"옳은 지문 없음"),answer:options.indexOf(mask)};
  }
  function makeBank(data) {
    const items=new Map(), questions=new Map();
    for(const q of data.questions){
      questions.set(q.id,q);
      function put(kind,index,answer,extra={}){
        const id=q.id+"-"+kind+(index===null?"":"-"+index);
        items.set(id,{id,qid:q.id,q,kind,index,answer,...extra});
      }
      put("mc",null,q.answer);
      if(!q.concept)continue;
      q.ox.forEach((s,i)=>put("ox",i,s.truth?0:1,{s}));
      if(q.variants?.length){
        const vm=variantQuestion(q);put("vm",null,vm.answer,{choices:vm.choices});
        q.variants.forEach((s,i)=>put("vx",i,s.truth?0:1,{s}));
      }
    }
    function pool(c) {
      const ids=[];
      for(const q of questions.values()){
        if((c.scope==="case"&&q.concept)||(c.scope==="concept"&&!q.concept))continue;
        if(q.concept&&c.mode==="ox"){
          q.ox.forEach((s,i)=>{ids.push(q.id+"-ox-"+i);if(c.variant&&items.has(q.id+"-vx-"+i))ids.push(q.id+"-vx-"+i);});
        }else{
          ids.push(q.id+"-mc");if(c.variant&&q.concept&&items.has(q.id+"-vm"))ids.push(q.id+"-vm");
        }
      }
      return ids;
    }
    function draw(c){
      const p=pool(c), ordered=c.order==="rand"?mix(p):p;
      return c.size==="all"?ordered:ordered.slice(0,Number(c.size));
    }
    return {items,questions,pool,draw};
  }
  host.TrainerCore={codes,forms,defaults,makeBank,variantQuestion};
})(typeof window!=="undefined"?window:globalThis);
