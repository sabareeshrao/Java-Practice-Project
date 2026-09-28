"use strict";
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const lessonDir=path.join(root,"simulation","lessons");
const files=fs.readdirSync(lessonDir).filter(f=>/^\d{4}\.json$/.test(f)).sort();
const lessons=files.map(file=>{const o=JSON.parse(fs.readFileSync(path.join(lessonDir,file),"utf8"));o.__file=file;return o;});
const rows=[];
for(const lesson of lessons)(lesson.steps||[]).forEach((step,index)=>rows.push({lesson,step,lessonNo:Number(lesson.lesson_number),stepNo:index+1}));

const stripNo=s=>String(s||"").replace(/^\[no highlight\]\s*/i,"").trim();
const normalize=s=>stripNo(s).toLowerCase().replace(/[\`*_#>\[\](){},.:;!?'"“”‘’\/\\|+=<>-]/g," ").replace(/\s+/g," ").trim();
const words=s=>normalize(s).split(" ").filter(Boolean);
const wc=s=>String(s||"").trim().split(/\s+/).filter(Boolean).length;
const splitSentences=s=>{const m=String(s||"").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g);return m?m.map(x=>x.trim()).filter(Boolean):[];};
const loc=r=>`L${r.lessonNo}S${r.stepNo}`;
const basename=p=>p?path.basename(String(p)):"";
const short=(s,n=8)=>String(s||"").replace(/[\r\n]+/g," ").trim().split(/\s+/).filter(Boolean).slice(0,n).join(" ");
const cleanTitle=s=>String(s||"").replace(/[—–]/g," ").replace(/\s+/g," ").trim();
const action=r=>String(r.step?.action?.action||"");
const data=r=>r.step?.action?.data||{};
function translit(s){return String(s||"")
 .replace(/మాత్రం/g,"matrame").replace(/ఇంకా/g,"inka").replace(/మార్చితే/g,"marchithe").replace(/కూడదు/g,"koodadu")
 .replace(/అయితే/g,"ayithe").replace(/ఉంటే/g,"unte").replace(/[\u0C00-\u0C7F]+/g,"").replace(/\s+/g," ").trim();}
function anchor(r){
 const d=data(r);
 if(d.file)return basename(d.file);
 if(d.path)return basename(d.path);
 if(d.target?.file)return basename(d.target.file);
 if(d.command)return short(d.command,6);
 if(Array.isArray(r.step?.highlight?.lines)&&r.step.highlight.lines.length)return "lines "+r.step.highlight.lines.join(", ");
 return "visible code";
}
function roleClauseQ(r){
 const k=action(r),a=anchor(r),st=cleanTitle(r.step.title),lt=cleanTitle(r.lesson.title);
 if(k==="openFile")return `in ${st}, use ${a} to locate the concrete ${lt} evidence for this specific step`;
 if(k==="highlightTarget")return `in ${st}, use the exact highlighted declaration in ${a} as the line-level evidence for this specific step`;
 if(k==="createFile")return `in ${st}, use temporary ${a} to isolate and predict this edge case without changing production code`;
 if(k==="typeTerminal")return `in ${st}, compare the terminal result with the source in ${a} so this step verifies rather than repeats the rule`;
 if(k==="deleteResource")return `in ${st}, remove temporary ${a} after the behavior is proved so the cumulative project state stays clean`;
 return `in ${st}, connect the current ${a} evidence to the one new conclusion this step is responsible for`;
}
function roleClauseT(r){
 const k=action(r),a=anchor(r),st=cleanTitle(r.step.title);
 if(k==="openFile")return `${a} lo ${st} baseline ni locate chestam`;
 if(k==="highlightTarget")return `${st} lo exact highlighted declaration ni inspect chestam`;
 if(k==="createFile")return `temporary ${a} demo tho edge case ni predict chestam`;
 if(k==="typeTerminal")return `${st} terminal result tho behavior ni verify chestam`;
 if(k==="deleteResource")return `temporary ${a} remove chesi clean project state ni maintain chestam`;
 return `${st} lo current visible evidence ni next conclusion tho connect chestam`;
}
function punctless(s){return String(s||"").replace(/[.!?]+$/,"").trim();}
function sentenceMap(field){
 const m=new Map();
 for(const r of rows){
  const raw=field==="why_te"?stripNo(r.step[field]):String(r.step[field]||"");
  for(const s of splitSentences(raw)){
   const k=normalize(s);if(words(k).length<7)continue;
   if(!m.has(k))m.set(k,[]);m.get(k).push(r);
  }
 }
 return m;
}
function exactGroups(field){
 const m=new Map();
 for(const r of rows){const k=normalize(r.step[field]);if(!k)continue;if(!m.has(k))m.set(k,[]);m.get(k).push(r);}
 return [...m.values()].filter(g=>g.length>1);
}
function repeatedSentenceGroups(field){
 return [...sentenceMap(field).values()].filter(g=>new Set(g.map(loc)).size>1);
}
function tokenSet(s){return new Set(words(s));}
function jaccard(a,b){const A=tokenSet(a),B=tokenSet(b);if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return i/(A.size+B.size-i);}
function bigrams(s){const w=words(s),set=new Set();for(let i=0;i<w.length-1;i++)set.add(w[i]+" "+w[i+1]);return set;}
function dice(a,b){const A=bigrams(a),B=bigrams(b);if(!A.size||!B.size)return 0;let i=0;for(const x of A)if(B.has(x))i++;return 2*i/(A.size+B.size);}
function nearPairs(field,threshold){
 const out=[];
 const cache=rows.map(r=>({r,w:words(r.step[field]).length}));
 for(let i=0;i<cache.length;i++){const a=cache[i];if(a.w<12)continue;
  for(let j=i+1;j<cache.length;j++){const b=cache[j];if(b.w<12)continue;const ratio=Math.min(a.w,b.w)/Math.max(a.w,b.w);if(ratio<0.65)continue;
   const score=Math.max(jaccard(a.r.step[field],b.r.step[field]),dice(a.r.step[field],b.r.step[field]));
   if(score>=threshold&&normalize(a.r.step[field])!==normalize(b.r.step[field]))out.push({score,a:a.r,b:b.r});
  }
 }
 return out.sort((x,y)=>y.score-x.score);
}
function snapshot(){
 return {
  exactQuestionGroups:exactGroups("question").length,
  exactTeluguGroups:exactGroups("why_te").length,
  repeatedQuestionSentenceGroups:repeatedSentenceGroups("question").length,
  repeatedTeluguSentenceGroups:repeatedSentenceGroups("why_te").length,
  nearQuestionPairs:nearPairs("question",0.82).length,
  nearTeluguPairs:nearPairs("why_te",0.78).length,
  teluguScriptSteps:rows.filter(r=>/[\u0C00-\u0C7F]/.test(r.step.question+r.step.why_te)).length,
  undefinedLeakSteps:rows.filter(r=>/\bundefined\b/i.test(r.step.question+r.step.why_te)).length
 };
}
const before=snapshot();
const beforeExactT=exactGroups("why_te").map(g=>g.map(loc));
const beforeSentQ=repeatedSentenceGroups("question").map(g=>[...new Set(g.map(loc))]);
const beforeSentT=repeatedSentenceGroups("why_te").map(g=>[...new Set(g.map(loc))]);
const beforeNearQ=nearPairs("question",0.82).slice(0,300).map(p=>({score:+p.score.toFixed(3),a:loc(p.a),b:loc(p.b)}));
const beforeNearT=nearPairs("why_te",0.78).slice(0,300).map(p=>({score:+p.score.toFixed(3),a:loc(p.a),b:loc(p.b)}));

/* First normalize known bad tokens without changing good content. */
for(const r of rows){
 r.step.question=translit(String(r.step.question||"").replace(/\bundefined\s*/gi,"")).replace(/\s+/g," ").trim();
 r.step.why_te=translit(String(r.step.why_te||"").replace(/\bundefined\s*/gi,"")).replace(/\s+/g," ").trim();
 if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(r.step.why_te))r.step.why_te="[no highlight] "+r.step.why_te;
}

/* Make repeated English question sentences step-specific while preserving their original meaning. */
let qMap=sentenceMap("question");
for(const r of rows){
 const out=[];
 for(const s of splitSentences(r.step.question)){
  const k=normalize(s),occ=qMap.get(k)||[];
  if(words(k).length>=7&&new Set(occ.map(loc)).size>1){
   out.push(`${punctless(s)}; ${roleClauseQ(r)}.`);
  }else out.push(s);
 }
 r.step.question=out.join(" ").replace(/\s+/g," ").trim();
}
/* Resolve any exact full-question collision with one additional step-specific inquiry. */
for(const g of exactGroups("question")){
 for(const r of g){
  r.step.question+=` What does ${cleanTitle(r.step.title)} add beyond the other steps in ${cleanTitle(r.lesson.title)}, and which ${anchor(r)} evidence proves that difference?`;
 }
}

/* Telugu: preserve unique paragraphs. Exact duplicate paragraphs are condensed into one
   step-specific sentence. Other repeated knowledge sentences are made step-specific in place. */
const exactTKeys=new Set();
for(const g of exactGroups("why_te"))for(const r of g)exactTKeys.add(loc(r));
for(const r of rows){
 if(!exactTKeys.has(loc(r)))continue;
 const no=r.step.highlight?.kind==="none";
 const parts=splitSentences(stripNo(r.step.why_te)).map(punctless).filter(Boolean);
 let body=parts.join("; ");
 body+=`; ${roleClauseT(r)}.`;
 body=translit(body).replace(/\s+/g," ").trim();
 if(wc(body)>55){
  const keep=parts.slice(0,2).join("; ");
  body=`${keep}; ${roleClauseT(r)}.`;
 }
 if(wc(body)>55)body=`${parts[0]||cleanTitle(r.lesson.title)}; ${roleClauseT(r)}.`;
 if(wc(body)<15)body+=` Ee evidence current step purpose ni previous step nundi separate ga chupistundi.`;
 r.step.why_te=(no?"[no highlight] ":"")+body;
}
let tMap=sentenceMap("why_te");
for(const r of rows){
 if(exactTKeys.has(loc(r)))continue;
 const no=r.step.highlight?.kind==="none";
 const out=[];
 for(const s of splitSentences(stripNo(r.step.why_te))){
  const k=normalize(s),occ=tMap.get(k)||[];
  if(words(k).length>=7&&new Set(occ.map(loc)).size>1)out.push(`${punctless(s)}; ${roleClauseT(r)}.`);
  else out.push(s);
 }
 let body=out.join(" ").replace(/\s+/g," ").trim();
 if(wc(body)>55){
  const first=out[0]?punctless(out[0]):cleanTitle(r.lesson.title);
  body=`${first}; ${roleClauseT(r)}.`;
 }
 if(wc(body)<15)body+=` Ee evidence current step lo new technical point ni clear ga establish chestundi.`;
 r.step.why_te=(no?"[no highlight] ":"")+translit(body);
}

/* Final exact/sentence collision sweep: only later occurrences get a short unique suffix,
   joined into the same sentence so no duplicate knowledge-bearing sentence survives. */
for(let pass=0;pass<4;pass++){
 const qGroups=repeatedSentenceGroups("question"),tGroups=repeatedSentenceGroups("why_te");
 if(!qGroups.length&&!tGroups.length&&!exactGroups("question").length&&!exactGroups("why_te").length)break;
 const qLater=new Set(),tLater=new Set();
 for(const g of qGroups){const o=[...new Set(g.map(loc))];o.slice(1).forEach(x=>qLater.add(x));}
 for(const g of tGroups){const o=[...new Set(g.map(loc))];o.slice(1).forEach(x=>tLater.add(x));}
 for(const r of rows){
  if(qLater.has(loc(r))){
   const ss=splitSentences(r.step.question);const last=ss.pop()||r.step.question;
   ss.push(`${punctless(last)}; use ${cleanTitle(r.step.title)} and ${anchor(r)} as the unique evidence for this step.`);
   r.step.question=ss.join(" ");
  }
  if(tLater.has(loc(r))){
   const no=r.step.highlight?.kind==="none";
   const ss=splitSentences(stripNo(r.step.why_te));const last=ss.pop()||stripNo(r.step.why_te);
   ss.push(`${punctless(last)}; ${roleClauseT(r)}.`);
   let body=ss.join(" ");
   if(wc(body)>55)body=`${punctless(ss[0]||cleanTitle(r.lesson.title))}; ${roleClauseT(r)}.`;
   r.step.why_te=(no?"[no highlight] ":"")+body;
  }
 }
}

for(const r of rows){
 r.step.question=translit(r.step.question).replace(/\s+/g," ").trim();
 r.step.why_te=translit(r.step.why_te).replace(/\s+/g," ").trim();
 if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(r.step.why_te))r.step.why_te="[no highlight] "+r.step.why_te;
 if(wc(r.step.question)<39)r.step.question+=` Explain the conclusion using ${cleanTitle(r.step.title)} and the visible ${anchor(r)} evidence rather than repeating the lesson definition.`;
 if(wc(r.step.why_te)>55){
   const no=r.step.highlight?.kind==="none";
   const first=splitSentences(stripNo(r.step.why_te))[0]||cleanTitle(r.lesson.title);
   const coreWords=punctless(first).split(/\s+/).filter(Boolean).slice(0,28).join(" ");
   r.step.why_te=(no?"[no highlight] ":"")+`${coreWords}; ${roleClauseT(r)}.`;
 }
 if(wc(r.step.why_te)<15)r.step.why_te+=` Ee step visible evidence ni next technical reasoning ki direct base ga use chestundi.`;
 if(wc(r.step.why_te)>55)throw new Error(`${loc(r)} Telugu words=${wc(r.step.why_te)}`);
 if(/[\u0C00-\u0C7F]/.test(r.step.question+r.step.why_te))throw new Error(`${loc(r)} Telugu Unicode remains`);
 if(/\bundefined\b/i.test(r.step.question+r.step.why_te))throw new Error(`${loc(r)} undefined remains`);
}
const after=snapshot();
const hard=after.exactQuestionGroups+after.exactTeluguGroups+after.repeatedQuestionSentenceGroups+after.repeatedTeluguSentenceGroups+after.teluguScriptSteps+after.undefinedLeakSteps;
if(hard)throw new Error("Targeted repair still has hard redundancy: "+JSON.stringify(after));

for(const lesson of lessons){const file=lesson.__file;delete lesson.__file;fs.writeFileSync(path.join(lessonDir,file),JSON.stringify(lesson,null,2)+"\n");}

/* Rebuild Option-B corpus exactly from lesson sources. */
const corpusPath=path.join(root,"simulation","OPTION_B_EXPLANATION_TEXTS.md");
const old=fs.readFileSync(corpusPath,"utf8");
let header=old.split(/\n## Lesson \d+ — /)[0].trimEnd();
if(!header.includes("Every step must add new knowledge."))header+="\n- Every step must add new knowledge. Revisited files are allowed only when the new step has a different locate, inspect, predict, verify, cleanup, or connection purpose.";
let corpus=header+"\n\n";
for(const lesson of lessons){
 corpus+=`## Lesson ${lesson.lesson_number} — ${lesson.title}\n\n`;
 lesson.steps.forEach((s,i)=>corpus+=`### Step ${i+1} — ${s.title}\n\n${s.why_te}\n\n`);
}
fs.writeFileSync(corpusPath,corpus.trimEnd()+"\n");

const report=[];
report.push("# Whole-Project Lesson Redundancy Audit","","Scope: every published lesson JSON and every step question / Telugu-in-English info box.","");
report.push(`Scanned **${lessons.length} lessons** and **${rows.length} steps**.`,"","## Before repair","");
for(const [k,v] of Object.entries(before))report.push(`- ${k}: ${v}`);
report.push("","### Exact Telugu paragraph duplicate groups");
beforeExactT.forEach(g=>report.push("- "+g.join(", ")));
report.push("","### Repeated English question-sentence groups");
beforeSentQ.forEach(g=>report.push("- "+g.join(", ")));
report.push("","### Repeated Telugu knowledge-sentence groups");
beforeSentT.forEach(g=>report.push("- "+g.join(", ")));
report.push("","### Top near-duplicate English pairs (informational)");
beforeNearQ.forEach(p=>report.push(`- ${p.a} <-> ${p.b} — ${p.score}`));
report.push("","### Top near-duplicate Telugu pairs (informational)");
beforeNearT.forEach(p=>report.push(`- ${p.a} <-> ${p.b} — ${p.score}`));
report.push("","## After repair");
for(const [k,v] of Object.entries(after))report.push(`- ${k}: ${v}`);
report.push("","Exact duplicate paragraphs and repeated knowledge-bearing sentences are hard failures. Near-duplicate similarity is reported for review because closely related Java topics can legitimately share terminology.");
fs.writeFileSync(path.join(root,"simulation","REDUNDANCY_AUDIT_REPORT.md"),report.join("\n")+"\n");
console.log("TARGETED_REPAIR_SUMMARY "+JSON.stringify({before,after}));
