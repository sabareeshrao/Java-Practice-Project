"use strict";
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const lessonDir=path.join(root,"simulation","lessons");
const files=fs.readdirSync(lessonDir).filter(f=>/^\d{4}\.json$/.test(f)).sort();

const records=[];
for(const file of files){
  const obj=JSON.parse(fs.readFileSync(path.join(lessonDir,file),"utf8"));
  (obj.steps||[]).forEach((s,i)=>{
    records.push({
      lesson:Number(obj.lesson_number||file.slice(0,4)),
      step:i+1,
      title:s.title||"",
      question:String(s.question||"").trim(),
      telugu:String(s.why_te||"").trim()
    });
  });
}

const normalize=s=>String(s||"")
  .replace(/^\[no highlight\]\s*/i,"")
  .toLowerCase()
  .replace(/[`*_#>\[\](){},.:;!?'"“”‘’/\\|+=<>-]/g," ")
  .replace(/\s+/g," ")
  .trim();

const words=s=>normalize(s).split(" ").filter(Boolean);
const tokenSet=s=>new Set(words(s));
const jaccard=(a,b)=>{
 const A=tokenSet(a),B=tokenSet(b);
 if(!A.size||!B.size)return 0;
 let inter=0; for(const x of A) if(B.has(x)) inter++;
 return inter/(A.size+B.size-inter);
};
const bigrams=s=>{
 const w=words(s),set=new Set();
 for(let i=0;i<w.length-1;i++)set.add(w[i]+" "+w[i+1]);
 return set;
};
const dice=(a,b)=>{
 const A=bigrams(a),B=bigrams(b);
 if(!A.size||!B.size)return 0;
 let inter=0;for(const x of A)if(B.has(x))inter++;
 return (2*inter)/(A.size+B.size);
};
const similarity=(a,b)=>Math.max(jaccard(a,b),dice(a,b));

function exactGroups(field){
 const m=new Map();
 for(const r of records){
   const n=normalize(r[field]); if(!n)continue;
   if(!m.has(n))m.set(n,[]);
   m.get(n).push(r);
 }
 return [...m.values()].filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
}
function sentenceGroups(field){
 const m=new Map();
 for(const r of records){
   const raw=String(r[field]||"").replace(/^\[no highlight\]\s*/i,"");
   for(const sentence of raw.split(/(?<=[.!?])\s+|\n+/)){
     const n=normalize(sentence);
     if(words(n).length<7)continue;
     if(!m.has(n))m.set(n,[]);
     m.get(n).push({...r,sentence:sentence.trim()});
   }
 }
 return [...m.values()].filter(g=>new Set(g.map(x=>x.lesson+":"+x.step)).size>1).sort((a,b)=>b.length-a.length);
}
function nearPairs(field,threshold){
 const out=[];
 for(let i=0;i<records.length;i++){
   const a=records[i],aw=words(a[field]).length;
   if(aw<12)continue;
   for(let j=i+1;j<records.length;j++){
     const b=records[j];
     if(a.lesson===b.lesson&&a.step===b.step)continue;
     const bw=words(b[field]).length;if(bw<12)continue;
     const lenRatio=Math.min(aw,bw)/Math.max(aw,bw); if(lenRatio<0.65)continue;
     const score=similarity(a[field],b[field]);
     if(score>=threshold && normalize(a[field])!==normalize(b[field])) out.push({score,a,b});
   }
 }
 return out.sort((x,y)=>y.score-x.score);
}
const exactQ=exactGroups("question"),exactT=exactGroups("telugu");
const sentQ=sentenceGroups("question"),sentT=sentenceGroups("telugu");
const nearQ=nearPairs("question",0.82),nearT=nearPairs("telugu",0.78);

function loc(r){return `L${r.lesson}S${r.step}`;}
function printGroups(label,groups,field,limit=250){
 console.log("\n## "+label+" ("+groups.length+" groups)");
 groups.slice(0,limit).forEach((g,idx)=>{
   console.log(`GROUP ${idx+1} x${g.length}: ${g.map(loc).join(", ")}`);
   console.log("TEXT: "+String(g[0][field]||g[0].sentence).replace(/\s+/g," ").slice(0,700));
 });
}
function printPairs(label,pairs,field,limit=400){
 console.log("\n## "+label+" ("+pairs.length+" pairs)");
 pairs.slice(0,limit).forEach((p,idx)=>{
   console.log(`PAIR ${idx+1} score=${p.score.toFixed(3)}: ${loc(p.a)} <-> ${loc(p.b)}`);
   console.log("A: "+p.a[field].replace(/\s+/g," ").slice(0,500));
   console.log("B: "+p.b[field].replace(/\s+/g," ").slice(0,500));
 });
}
console.log(`REDUNDANCY_AUDIT lessons=${files.length} steps=${records.length}`);
printGroups("EXACT QUESTION DUPLICATES",exactQ,"question");
printGroups("EXACT TELUGU DUPLICATES",exactT,"telugu");
printGroups("REPEATED QUESTION SENTENCES",sentQ,"sentence");
printGroups("REPEATED TELUGU SENTENCES",sentT,"sentence");
printPairs("NEAR-DUPLICATE QUESTIONS",nearQ,"question");
printPairs("NEAR-DUPLICATE TELUGU",nearT,"telugu");

const sameLessonTelugu=new Map();
for(const r of records){
 const key=r.lesson+":"+normalize(r.telugu);
 if(!normalize(r.telugu))continue;
 if(!sameLessonTelugu.has(key))sameLessonTelugu.set(key,[]);
 sameLessonTelugu.get(key).push(r);
}
const sameLesson=[...sameLessonTelugu.values()].filter(g=>g.length>1);
console.log("\n## SAME-LESSON EXACT TELUGU REUSE ("+sameLesson.length+" groups)");
for(const g of sameLesson) console.log(`${g.map(loc).join(", ")} :: ${g[0].telugu.replace(/\s+/g," ").slice(0,500)}`);

const summary={
 lessons:files.length,steps:records.length,
 exactQuestionGroups:exactQ.length,
 exactTeluguGroups:exactT.length,
 repeatedQuestionSentenceGroups:sentQ.length,
 repeatedTeluguSentenceGroups:sentT.length,
 nearQuestionPairs:nearQ.length,
 nearTeluguPairs:nearT.length,
 sameLessonExactTeluguGroups:sameLesson.length
};
console.log("\nAUDIT_SUMMARY "+JSON.stringify(summary));
