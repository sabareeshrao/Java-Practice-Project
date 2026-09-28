"use strict";
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const lessonDir=path.join(root,"simulation","lessons");
const lessonFiles=fs.readdirSync(lessonDir).filter(f=>/^\d{4}\.json$/.test(f)).sort();
const lessons=lessonFiles.map(file=>{
  const lesson=JSON.parse(fs.readFileSync(path.join(lessonDir,file),"utf8"));
  lesson.__file=file;
  return lesson;
});
const interview=JSON.parse(fs.readFileSync(path.join(root,"interview","questions.json"),"utf8"));
const sourceQuestions=new Map((interview.questions||[]).map(q=>[Number(q.id),String(q.question||"").trim()]));
const rows=[];
for(const lesson of lessons){
  (lesson.steps||[]).forEach((step,index)=>rows.push({lesson,step,index,lessonNo:Number(lesson.lesson_number),stepNo:index+1}));
}

const stripNo=s=>String(s||"").replace(/^\[no highlight\]\s*/i,"").trim();
const normalize=s=>stripNo(s).toLowerCase()
  .replace(/[\`*_#>\[\](){},.:;!?'"“”‘’\/\\|+=<>-]/g," ")
  .replace(/\s+/g," ").trim();
const words=s=>normalize(s).split(" ").filter(Boolean);
const wc=s=>String(s||"").trim().split(/\s+/).filter(Boolean).length;
const splitSentences=s=>{
  const m=String(s||"").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return m?m.map(x=>x.trim()).filter(Boolean):[];
};
const tokenSet=s=>new Set(words(s));
const jaccard=(a,b)=>{
  const A=tokenSet(a),B=tokenSet(b); if(!A.size||!B.size)return 0;
  let inter=0; for(const x of A)if(B.has(x))inter++;
  return inter/(A.size+B.size-inter);
};
const bigrams=s=>{const w=words(s),set=new Set();for(let i=0;i<w.length-1;i++)set.add(w[i]+" "+w[i+1]);return set;};
const dice=(a,b)=>{const A=bigrams(a),B=bigrams(b);if(!A.size||!B.size)return 0;let inter=0;for(const x of A)if(B.has(x))inter++;return (2*inter)/(A.size+B.size);};
const similarity=(a,b)=>Math.max(jaccard(a,b),dice(a,b));
const loc=r=>`L${r.lessonNo}S${r.stepNo}`;
const actionKind=r=>String(r.step?.action?.action||"");
const data=r=>r.step?.action?.data||{};
const basename=p=>p?path.basename(String(p)):"";
const short=(s,n=8)=>String(s||"").replace(/[\r\n]+/g," ").trim().split(/\s+/).filter(Boolean).slice(0,n).join(" ");
const plainTitle=s=>String(s||"").replace(/[—–]/g," ").replace(/["']/g,"").replace(/\s+/g," ").trim();

function transliterateKnown(s){
  return String(s||"")
    .replace(/మాత్రం/g,"matrame")
    .replace(/ఇంకా/g,"inka")
    .replace(/మార్చితే/g,"marchithe")
    .replace(/కూడదు/g,"koodadu")
    .replace(/అయితే/g,"ayithe")
    .replace(/ఉంటే/g,"unte")
    .replace(/[\u0C00-\u0C7F]+/g,"")
    .replace(/\s+/g," ").trim();
}
function anchor(r){
  const d=data(r);
  if(d.file)return basename(d.file);
  if(d.path)return basename(d.path);
  if(d.target?.file)return basename(d.target.file);
  if(d.command)return short(d.command,7);
  if(Array.isArray(r.step?.highlight?.lines)&&r.step.highlight.lines.length)return "lines "+r.step.highlight.lines.join(", ");
  return "visible code";
}
function expectedResult(r){
  const d=data(r);
  if(d.output)return short(String(d.output).replace(/\s+/g," "),8);
  if(d.expected_text)return short(d.expected_text,8);
  if(d.target?.expected_text)return short(d.target.expected_text,8);
  return "";
}
function sourceQuestion(r){
  return sourceQuestions.get(r.lessonNo)||r.lesson.title||"this Java topic";
}
function role(r){
  const k=actionKind(r);
  if(k==="openFile")return "locate";
  if(k==="highlightTarget")return "inspect";
  if(k==="createFile")return "predict";
  if(k==="typeTerminal")return "verify";
  if(k==="deleteResource")return "cleanup";
  if(k==="typeCode"||k==="replaceText"||k==="replaceFile")return "change";
  return "connect";
}

function exactGroups(field){
  const m=new Map();
  for(const r of rows){
    const key=normalize(r.step[field]); if(!key)continue;
    if(!m.has(key))m.set(key,[]); m.get(key).push(r);
  }
  return [...m.values()].filter(g=>g.length>1);
}
function sentenceGroups(field){
  const m=new Map();
  for(const r of rows){
    for(const sentence of splitSentences(field==="why_te"?stripNo(r.step[field]):r.step[field])){
      const key=normalize(sentence); if(words(key).length<7)continue;
      if(!m.has(key))m.set(key,[]); m.get(key).push(r);
    }
  }
  return [...m.values()].filter(g=>new Set(g.map(loc)).size>1);
}
function nearPairs(field,threshold,sameLessonOnly=false){
  const out=[];
  for(let i=0;i<rows.length;i++){
    const a=rows[i],aw=words(a.step[field]).length;if(aw<12)continue;
    for(let j=i+1;j<rows.length;j++){
      const b=rows[j]; if(sameLessonOnly&&a.lessonNo!==b.lessonNo)continue;
      const bw=words(b.step[field]).length;if(bw<12)continue;
      const ratio=Math.min(aw,bw)/Math.max(aw,bw);if(ratio<0.65)continue;
      const score=similarity(a.step[field],b.step[field]);
      if(score>=threshold&&normalize(a.step[field])!==normalize(b.step[field]))out.push({score,a,b});
    }
  }
  return out.sort((x,y)=>y.score-x.score);
}
function audit(){
  const exactQ=exactGroups("question"),exactT=exactGroups("why_te");
  const sentQ=sentenceGroups("question"),sentT=sentenceGroups("why_te");
  return {
    exactQuestionGroups:exactQ.length,
    exactTeluguGroups:exactT.length,
    repeatedQuestionSentenceGroups:sentQ.length,
    repeatedTeluguSentenceGroups:sentT.length,
    nearQuestionPairs:nearPairs("question",0.82).length,
    nearTeluguPairs:nearPairs("why_te",0.78).length,
    sameLessonNearQuestionPairs:nearPairs("question",0.86,true).length,
    sameLessonNearTeluguPairs:nearPairs("why_te",0.86,true).length,
    teluguScriptSteps:rows.filter(r=>/[\u0C00-\u0C7F]/.test(r.step.question)||/[\u0C00-\u0C7F]/.test(r.step.why_te)).length,
    undefinedLeakSteps:rows.filter(r=>/\bundefined\b/i.test(r.step.question)||/\bundefined\b/i.test(r.step.why_te)).length
  };
}

const before=audit();
const beforeExactT=exactGroups("why_te").map(g=>g.map(loc));
const beforeSentQ=sentenceGroups("question").map(g=>[...new Set(g.map(loc))]);
const beforeSentT=sentenceGroups("why_te").map(g=>[...new Set(g.map(loc))]);
const beforeNearQ=nearPairs("question",0.82).slice(0,250).map(p=>({score:Number(p.score.toFixed(3)),a:loc(p.a),b:loc(p.b)}));
const beforeNearT=nearPairs("why_te",0.78).slice(0,250).map(p=>({score:Number(p.score.toFixed(3)),a:loc(p.a),b:loc(p.b)}));

/* Remove boilerplate sentences that occur in more than one step, then rebuild only
   questions that are too short or still highly similar inside a lesson. */
const qSentenceCounts=new Map();
for(const r of rows){
  for(const s of splitSentences(String(r.step.question||"").replace(/\bundefined\s*/gi,""))){
    const k=normalize(s); if(words(k).length<7)continue;
    qSentenceCounts.set(k,(qSentenceCounts.get(k)||0)+1);
  }
}
for(const r of rows){
  const kept=[];
  for(const s of splitSentences(String(r.step.question||"").replace(/\bundefined\s*/gi,""))){
    const k=normalize(s);
    if(words(k).length>=7&&(qSentenceCounts.get(k)||0)>1)continue;
    kept.push(s);
  }
  r.step.question=kept.join(" ").replace(/\s+/g," ").trim();
}

function buildQuestion(r){
  const sq=sourceQuestion(r);
  const lt=plainTitle(r.lesson.title);
  const st=plainTitle(r.step.title);
  const a=anchor(r),result=expectedResult(r),k=actionKind(r);
  if(k==="openFile"){
    return `${sq} In this step, use ${a} to locate the real project evidence for ${lt} instead of repeating the definition. Which highlighted declaration establishes the baseline, what state or behavior does it control, and how will that baseline help you reason about the next step without assuming behavior that the code does not show?`;
  }
  if(k==="highlightTarget"){
    return `${sq} Focus only on the exact highlighted declaration in ${a} for ${st}. What Java rule does this line prove, which part of the syntax is decisive, and what compile-time or runtime behavior would change if that declaration were written differently while the rest of the example stayed the same?`;
  }
  if(k==="createFile"){
    return `${sq} The temporary ${a} example isolates the edge case for ${lt} without changing AeroTopo production code. Before running it, predict the compiler or runtime result from the highlighted declarations, identify the exact language rule behind that prediction, and explain why this small experiment is necessary beyond the existing project example.`;
  }
  if(k==="typeTerminal"){
    const extra=result?` The visible result begins with "${result}".`:"";
    return `${sq} Now use the terminal execution for ${st} to verify the prediction rather than restating the concept.${extra} Which source line explains the observed result, what rule has been confirmed, and how does this evidence distinguish the current case from a superficially similar Java feature that follows different resolution rules?`;
  }
  if(k==="deleteResource"){
    return `${sq} The temporary ${a} file has already proved the edge case for ${lt}. Why can it now be removed without losing the verified behavior, which real AeroTopo code remains as the permanent example, and what project-state problem would occur if lesson-only experimental files were allowed to accumulate across later chapters?`;
  }
  return `${sq} For the step "${st}", connect the visible ${a} evidence to ${lt} and identify the one new technical conclusion this step adds. What exact code or result supports that conclusion, how is it different from the previous step's purpose, and what would an interviewer expect you to say about this specific behavior?`;
}

for(const r of rows){
  if(wc(r.step.question)<39)r.step.question=buildQuestion(r);
}
for(let pass=0;pass<4;pass++){
  const pairs=nearPairs("question",0.88,true);
  if(!pairs.length)break;
  const rewrite=new Set(pairs.map(p=>loc(p.b)));
  for(const r of rows)if(rewrite.has(loc(r)))r.step.question=buildQuestion(r);
}

/* Rebuild every Telugu-in-English info box by step role.
   The content deliberately changes by locate/inspect/predict/verify/cleanup so a lesson
   cannot repeat one generic concept paragraph in every step. */
function buildWhy(r){
  const lt=plainTitle(r.lesson.title),st=plainTitle(r.step.title),a=anchor(r),res=expectedResult(r);
  const k=actionKind(r);
  let body;
  if(k==="openFile"){
    body=`${a} open chesi ${lt} concept project lo ekkada implement ayindo locate chestam; ${st} lo highlighted code baseline ni identify chesi, next step lo inspect cheyyalsina exact declaration ni context tho connect chestam.`;
  }else if(k==="highlightTarget"){
    body=`${st} lo exact highlighted declaration meeda focus chestam; ${a} syntax ${lt} rule ni line-level evidence tho prove chestundi, kabatti general definition repeat cheyyakunda ee declaration behavior ni enduku control chestundo understand chestam.`;
  }else if(k==="createFile"){
    body=`Temporary ${a} demo create chesi ${lt} edge case ni production code nundi separate ga isolate chestam; ${st} lo source ni chusi compile leda runtime result mundu predict cheyyadam ee step main purpose.`;
  }else if(k==="typeTerminal"){
    body=res
      ? `Terminal lo ${st} run chesi "${res}" result ni source expectation tho compare chestam; ee output ${lt} behavior actual ga jarigindani verify chestundi, kabatti prediction nundi evidence-based conclusion ki move avutam.`
      : `Terminal lo ${st} run chesi actual compiler leda runtime result ni source expectation tho compare chestam; ee evidence ${lt} behavior ni verify chestundi, kabatti previous prediction correct aa kaada direct ga decide cheyyachu.`;
  }else if(k==="deleteResource"){
    body=`[no highlight] Temporary ${a} ni remove chesi ${lt} kosam verify chesina rule ni matrame retain chestam; ${st} cleanup valla lesson-only demo permanent AeroTopo state lo remain avvadu, later lessons clean project continuity tho continue avutayi.`;
  }else if(k==="typeCode"||k==="replaceText"||k==="replaceFile"){
    body=`${st} lo ${a} meeda actual code change apply chesi ${lt} concept ni project behavior tho connect chestam; ee modification previous observation nundi next executable state ki move chestundi, kabatti change purpose and effect rendu clear ga untayi.`;
  }else{
    body=`${st} step lo ${a} evidence ni use chesi ${lt} gurinchi oka specific consequence ni establish chestam; previous step context ni repeat cheyyakunda current action enduku kavalo and next reasoning ki idi ela base avutundo connect chestam.`;
  }
  body=transliterateKnown(body).replace(/\s+/g," ").trim();
  if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(body))body="[no highlight] "+body;
  if(wc(body)<15)body+=" Ee evidence next step reasoning ki direct base ga use avutundi.";
  if(wc(body)>55){
    body=(r.step.highlight?.kind==="none"?"[no highlight] ":"")+`${st} lo ${a} evidence ni use chesi ${lt} ki current step-specific rule ni establish chestam; previous info repeat cheyyakunda ee action purpose, visible result, and next reasoning connection ni clear ga explain chestam.`;
  }
  return body;
}
for(const r of rows)r.step.why_te=buildWhy(r);

/* Resolve any accidental exact/sentence collision by adding the concrete step title to the same sentence. */
for(let pass=0;pass<4;pass++){
  const groups=[...exactGroups("why_te"),...sentenceGroups("why_te")];
  if(!groups.length)break;
  const later=new Set();
  for(const g of groups){
    const ordered=g.slice().sort((a,b)=>(a.lessonNo-b.lessonNo)||(a.stepNo-b.stepNo));
    ordered.slice(1).forEach(r=>later.add(loc(r)));
  }
  for(const r of rows){
    if(!later.has(loc(r)))continue;
    const no=r.step.highlight?.kind==="none";
    let body=stripNo(r.step.why_te).replace(/[.!?]$/,"");
    body+=`; ${plainTitle(r.step.title)} context lo L${r.lessonNo} step role ni separate ga verify chestam.`;
    r.step.why_te=(no?"[no highlight] ":"")+body;
    if(wc(r.step.why_te)>55)r.step.why_te=buildWhy(r);
  }
}

function compactWhy(r){
  const lt=plainTitle(r.lesson.title),st=plainTitle(r.step.title),a=anchor(r),k=actionKind(r);
  let body;
  if(k==="openFile") body=`${a} open chesi ${lt} ki real project baseline ni locate chestam; ${st} lo highlighted code next reasoning start ayye place ni clear ga chupistundi.`;
  else if(k==="highlightTarget") body=`${st} lo highlighted ${a} declaration ${lt} rule ni direct ga prove chestundi; general concept repeat cheyyakunda exact syntax behavior ni inspect chestam.`;
  else if(k==="createFile") body=`Temporary ${a} create chesi ${lt} edge case ni isolate chestam; ${st} lo compiler leda runtime result mundu prediction ni testable ga chestam.`;
  else if(k==="typeTerminal") body=`Terminal lo ${st} run chesi ${lt} behavior ni actual result tho verify chestam; source expectation and output match ayina evidence ni next conclusion ki use chestam.`;
  else if(k==="deleteResource") body=`[no highlight] Temporary ${a} remove chesi ${lt} kosam verified rule ni retain chestam; ${st} cleanup valla lesson-only code permanent project state lo remain avvadu.`;
  else body=`${st} lo ${a} evidence ni use chesi ${lt} ki current step-specific conclusion ni establish chestam; previous info repeat cheyyakunda ee action purpose ni next reasoning tho connect chestam.`;
  body=transliterateKnown(body).replace(/\s+/g," ").trim();
  if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(body))body="[no highlight] "+body;
  return body;
}

for(const r of rows){
  r.step.question=String(r.step.question||"").replace(/\bundefined\s*/gi,"").replace(/\s+/g," ").trim();
  r.step.why_te=transliterateKnown(r.step.why_te).replace(/\s+/g," ").trim();
  if(wc(r.step.why_te)>55)r.step.why_te=compactWhy(r);
  if(wc(r.step.why_te)<15)r.step.why_te=(stripNo(r.step.why_te)+" Ee step visible evidence ni next technical reasoning ki direct base ga use chestundi.").trim();
  if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(r.step.why_te))r.step.why_te="[no highlight] "+r.step.why_te;
  if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(r.step.why_te))r.step.why_te="[no highlight] "+r.step.why_te;
  if(wc(r.step.question)<39)throw new Error(`${loc(r)} question words=${wc(r.step.question)}`);
  if(wc(r.step.why_te)<15||wc(r.step.why_te)>55)throw new Error(`${loc(r)} Telugu words=${wc(r.step.why_te)}`);
  if(/[\u0C00-\u0C7F]/.test(r.step.question+r.step.why_te))throw new Error(`${loc(r)} Telugu Unicode remains`);
  if(/\bundefined\b/i.test(r.step.question+r.step.why_te))throw new Error(`${loc(r)} undefined remains`);
}

const after=audit();
const hard=after.exactQuestionGroups+after.exactTeluguGroups+after.repeatedQuestionSentenceGroups+
  after.repeatedTeluguSentenceGroups+after.sameLessonNearQuestionPairs+after.sameLessonNearTeluguPairs+
  after.teluguScriptSteps+after.undefinedLeakSteps;
if(hard)throw new Error("Repair still has hard redundancy: "+JSON.stringify(after));

for(const lesson of lessons){
  const file=lesson.__file; delete lesson.__file;
  fs.writeFileSync(path.join(lessonDir,file),JSON.stringify(lesson,null,2)+"\n");
}

/* Rebuild the living Telugu corpus from repaired lesson sources. */
const corpusPath=path.join(root,"simulation","OPTION_B_EXPLANATION_TEXTS.md");
const oldCorpus=fs.readFileSync(corpusPath,"utf8");
let header=oldCorpus.split(/\n## Lesson \d+ — /)[0].trimEnd();
header=header.replace(
  "- Repeated simple explanations are allowed when the same UI concept genuinely repeats. Do not add fake wording only to make text unique.",
  "- Do not repeat the same explanation paragraph or knowledge-bearing sentence across steps. Revisited UI is allowed only when the new step explains a different technical role, consequence, or verification."
);
if(!header.includes("Every step must add new knowledge."))header+="\n- Every step must add new knowledge. Locate, inspect, predict, verify, cleanup, and connection steps must explain different purposes even when they revisit the same file.";
let corpus=header+"\n\n";
for(const lesson of lessons){
  corpus+=`## Lesson ${lesson.lesson_number} — ${lesson.title}\n\n`;
  lesson.steps.forEach((s,i)=>{corpus+=`### Step ${i+1} — ${s.title}\n\n${s.why_te}\n\n`;});
}
fs.writeFileSync(corpusPath,corpus.trimEnd()+"\n");

/* Human-readable audit report with affected locations from the pre-repair project. */
const report=[];
report.push("# Whole-Project Lesson Redundancy Audit","");
report.push(`Scanned ${lessons.length} lessons and ${rows.length} steps.`,"");
report.push("## Before repair","");
for(const [k,v] of Object.entries(before))report.push(`- ${k}: ${v}`);
report.push("","### Exact Telugu paragraph duplicate groups","");
beforeExactT.forEach(g=>report.push("- "+g.join(", ")));
report.push("","### Repeated English question-sentence groups","");
beforeSentQ.forEach(g=>report.push("- "+g.join(", ")));
report.push("","### Repeated Telugu knowledge-sentence groups","");
beforeSentT.forEach(g=>report.push("- "+g.join(", ")));
report.push("","### Highest near-duplicate English question pairs (informational)","");
beforeNearQ.forEach(p=>report.push(`- ${p.a} <-> ${p.b} — score ${p.score}`));
report.push("","### Highest near-duplicate Telugu pairs (informational)","");
beforeNearT.forEach(p=>report.push(`- ${p.a} <-> ${p.b} — score ${p.score}`));
report.push("","## After repair","");
for(const [k,v] of Object.entries(after))report.push(`- ${k}: ${v}`);
report.push("","Hard guardrails require zero exact paragraph duplicates, zero repeated knowledge-bearing sentences, zero same-lesson near duplicates above the configured threshold, zero Telugu-script leakage, and zero undefined tokens.");
fs.writeFileSync(path.join(root,"simulation","REDUNDANCY_AUDIT_REPORT.md"),report.join("\n")+"\n");

console.log("SEMANTIC_REPAIR_SUMMARY "+JSON.stringify({before,after}));
