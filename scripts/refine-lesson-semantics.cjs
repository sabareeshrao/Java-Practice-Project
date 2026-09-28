"use strict";
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const dir=path.join(root,"simulation","lessons");
const files=fs.readdirSync(dir).filter(f=>/^\d{4}\.json$/.test(f)).sort();
const lessons=files.map(file=>{const l=JSON.parse(fs.readFileSync(path.join(dir,file),"utf8"));l.__file=file;return l;});
const interview=JSON.parse(fs.readFileSync(path.join(root,"interview","questions.json"),"utf8"));
const sourceQ=new Map((interview.questions||[]).map(q=>[Number(q.id),String(q.question||"").trim()]));

const stripNo=s=>String(s||"").replace(/^\[no highlight\]\s*/i,"").trim();
const norm=s=>stripNo(s).toLowerCase().replace(/[\`*_#>\[\](){},.:;!?'"“”‘’\/\\|+=<>-]/g," ").replace(/\s+/g," ").trim();
const words=s=>norm(s).split(" ").filter(Boolean);
const wc=s=>String(s||"").trim().split(/\s+/).filter(Boolean).length;
const bigrams=s=>{const w=words(s),x=new Set();for(let i=0;i<w.length-1;i++)x.add(w[i]+" "+w[i+1]);return x;};
const similarity=(a,b)=>{
 const A=new Set(words(a)),B=new Set(words(b));if(!A.size||!B.size)return 0;
 let inter=0;for(const x of A)if(B.has(x))inter++;
 const jac=inter/(A.size+B.size-inter);
 const X=bigrams(a),Y=bigrams(b);let bi=0;for(const x of X)if(Y.has(x))bi++;
 const dice=X.size&&Y.size?2*bi/(X.size+Y.size):0;
 return Math.max(jac,dice);
};
const clean=s=>String(s||"").replace(/[—–]/g," ").replace(/["']/g,"").replace(/\s+/g," ").trim();
const action=r=>String(r.step?.action?.action||"");
const data=r=>r.step?.action?.data||{};
const fullAnchor=r=>{
 const d=data(r);
 return String(d.file||d.path||d.target?.file||d.target?.path||"visible code");
};
const shortAnchor=r=>path.basename(fullAnchor(r));
const lines=r=>Array.isArray(r.step?.highlight?.lines)&&r.step.highlight.lines.length?r.step.highlight.lines.join(", "):"";
const result=r=>{
 const d=data(r),raw=d.output||d.expected_text||d.target?.expected_text||"";
 return String(raw).replace(/[\r\n]+/g," ").trim().split(/\s+/).slice(0,7).join(" ");
};
function rowsFor(lesson){return (lesson.steps||[]).map((step,i)=>({lesson,step,stepNo:i+1,total:lesson.steps.length,lessonNo:Number(lesson.lesson_number)}));}
function hasNear(lesson,field,threshold){
 const rows=rowsFor(lesson);
 for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
  if(words(rows[i].step[field]).length<10||words(rows[j].step[field]).length<10)continue;
  if(similarity(rows[i].step[field],rows[j].step[field])>=threshold)return true;
 }
 return false;
}
const flaggedBefore=lessons.filter(l=>hasNear(l,"why_te",0.80)||hasNear(l,"question",0.84)).map(l=>Number(l.lesson_number));
const rewriteLessons=new Set(flaggedBefore.filter(n=>n>=73));

function qFor(r){
 const title=clean(r.lesson.title),stepTitle=clean(r.step.title),a=fullAnchor(r),line=lines(r),k=action(r),src=sourceQ.get(r.lessonNo)||title;
 if(k==="createFile"){
  return `The interview topic is "${src}". This step creates temporary ${a} only to isolate one edge case of ${title}; it is not production AeroTopo code. Before running anything, inspect ${line?"highlighted lines "+line:"the highlighted declarations"} and predict the compiler or runtime result. Which exact Java rule controls that prediction, and what would a different declaration change?`;
 }
 if(k==="typeTerminal"){
  const out=result(r);
  return `The previous step formed a prediction for ${title}; this step must verify it instead of explaining the definition again. Run the shown command and ${out?`compare the result beginning "${out}" with the source`:"compare the compiler or runtime result with the source"}. Which declaration explains the observed behavior, what rule has now been proved, and what competing interpretation can you reject?`;
 }
 if(k==="deleteResource"){
  return `The temporary source ${a} has already served its purpose for ${title}. Why should this exact file be removed now, which verified Java behavior remains valid after deletion, and what continuity problem would occur if lesson-only experiments accumulated in the AeroTopo project before later lessons replay the same cumulative state?`;
 }
 if(k==="highlightTarget"){
  return `For ${title}, the file location is already known, so this step narrows attention to one declaration rather than repeating the overview. Inspect ${line?"lines "+line:"the highlighted target"} in ${a}. Which keyword, signature, access level, constructor call, or expression is decisive, and how would changing only that element alter the Java rule being demonstrated?`;
 }
 if(k==="openFile"){
  if(r.stepNo===1){
   return `${src} Open ${a} and use ${line?"highlighted lines "+line:"the highlighted code"} to establish the real AeroTopo baseline. Which class, method, field, constructor, or interface relationship is relevant to ${title}, and what concrete fact can you identify here before making any broader conclusion about the language rule?`;
  }
  if(r.stepNo===r.total){
   return `Return to ${a} and use the accumulated evidence to answer "${src}" as an interview response. Which project line is your concrete example, what Java rule does it support, and what limitation or design consequence must be included so the answer is more precise than the initial baseline observation?`;
  }
  if(r.stepNo===2){
   return `The baseline for ${title} is already visible in ${a}. Now trace the exact syntax and execution or access rule in ${line?"lines "+line:"the highlighted section"}. What happens first, what is inherited or selected, and which part is fixed by the compiler versus decided at runtime? Explain only this rule-level detail, not the earlier file overview.`;
  }
  return `Move from syntax to consequence for ${title}. Using ${a}, trace how a caller, subclass, object, or method invocation is affected by the highlighted design. What invariant or substitutability guarantee does the code preserve, what misuse would break that guarantee, and why does this consequence matter in maintainable AeroTopo code?`;
 }
 return `For the step "${stepTitle}" in ${title}, use ${a} as the current evidence and identify the one technical conclusion introduced by this action. How does it differ from the preceding step's purpose, what Java behavior does it establish, and what should the learner carry forward to the next step without repeating the lesson definition?`;
}

function teFor(r){
 const title=clean(r.lesson.title),st=clean(r.step.title),a=fullAnchor(r),base=shortAnchor(r),line=lines(r),k=action(r),out=result(r);
 let t;
 if(k==="createFile"){
  t=`Temporary ${base} production code kaadu. Ee step ${title} lo oka edge case ni isolate chestundi; highlighted declaration batti run mundu compiler leda runtime result predict cheyyadam matrame current purpose.`;
 }else if(k==="typeTerminal"){
  t=out
   ? `Ippudu prediction ni terminal evidence tho verify chestam. "${out}" result ${title} behavior actual ga ela kanipistundo confirm chestundi; source declaration and output madhya connection ni ee step establish chestundi.`
   : `Ippudu command run chesi compiler leda runtime result ni source tho compare chestam. Ee verification ${title} gurinchi previous prediction correct aa kaada decide chestundi; definition repeat cheyyadam ee step purpose kaadu.`;
 }else if(k==="deleteResource"){
  t=`[no highlight] Temporary ${a} ni remove chestam because experiment already complete. Verified ${title} rule change avvadu; cleanup valla lesson-only file permanent AeroTopo state lo remain kakunda later lessons same clean project nundi continue avutayi.`;
 }else if(k==="highlightTarget"){
  t=`${st} lo ${base} ${line?"lines "+line:"highlighted declaration"} meeda matrame focus chestam. Ee exact syntax ${title} rule ni control chestundi; previous step location chupinchindi, ippudu line-level evidence enduku decisive ani inspect chestam.`;
 }else if(k==="openFile"){
  if(r.stepNo===1){
   t=`${base} open chesi ${title} ki real project baseline ni locate chestam. ${line?"Highlighted lines "+line:"Highlighted code"} relevant class/member relationship ekkada undo chupistundi; ee step observation matrame, detailed rule analysis next step lo vastundi.`;
  }else if(r.stepNo===r.total){
   t=`${base} ki return ayyi earlier evidence ni interview answer ga connect chestam. ${title} definition, real project example, important limitation ni separate ga cheppadam ee final step purpose; previous syntax explanation ni repeat cheyyamu.`;
  }else if(r.stepNo===2){
   t=`Ippudu ${base} lo exact declaration order, keyword, signature leda access rule ni inspect chestam. ${title} behavior enduku ila untundo line evidence tho prove chestam; first step file location matrame establish chesindi.`;
  }else{
   t=`Ee step ${title} syntax nundi design consequence ki move avutundi. Caller leda subclass meeda highlighted code effect enti, invariant ela preserve avutundi, wrong design valla em break avvachu ane connection ni project context lo trace chestam.`;
  }
 }else{
  t=`${st} lo ${base} evidence ni use chesi ${title} ki oka new technical conclusion establish chestam. Previous step purpose ni repeat cheyyakunda current action result next reasoning ki ela connect avutundo matrame explain chestam.`;
 }
 t=t.replace(/\s+/g," ").trim();
 if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(t))t="[no highlight] "+t;
 if(wc(t)<15)t+=" Ee point next step reasoning ki direct base ga use avutundi.";
 if(wc(t)>55){
  const no=/^\[no highlight\]/i.test(t);
  const core=stripNo(t).split(/\s+/).slice(0,42).join(" ");
  t=(no?"[no highlight] ":"")+core+".";
 }
 return t;
}

for(const lesson of lessons){
 if(!rewriteLessons.has(Number(lesson.lesson_number)))continue;
 for(const r of rowsFor(lesson)){
  r.step.question=qFor(r).replace(/\s+/g," ").trim();
  r.step.why_te=teFor(r);
  if(wc(r.step.question)<39)r.step.question+=" Support the conclusion with the highlighted project evidence and distinguish it from the nearest related Java feature.";
  if(wc(r.step.why_te)<15||wc(r.step.why_te)>55)throw new Error(`L${r.lessonNo}S${r.stepNo} Telugu words=${wc(r.step.why_te)}`);
 }
}

const remaining=[];
for(const lesson of lessons){
 const q=hasNear(lesson,"question",0.84),t=hasNear(lesson,"why_te",0.80);
 if(q||t)remaining.push({lesson:Number(lesson.lesson_number),question:q,telugu:t});
}
const remainingLater=remaining.filter(x=>x.lesson>=73);
if(remainingLater.length)throw new Error("Later semantic repetition remains: "+JSON.stringify(remainingLater.slice(0,100)));

for(const lesson of lessons){
 const file=lesson.__file;delete lesson.__file;
 fs.writeFileSync(path.join(dir,file),JSON.stringify(lesson,null,2)+"\n");
}

const corpusPath=path.join(root,"simulation","OPTION_B_EXPLANATION_TEXTS.md");
const old=fs.readFileSync(corpusPath,"utf8");
let header=old.split(/\n## Lesson \d+ — /)[0].trimEnd();
if(!header.includes("Same-lesson semantic similarity"))header+="\n- Same-lesson semantic similarity is guarded: each step must contribute a different knowledge role, not just different wording.";
let corpus=header+"\n\n";
for(const lesson of lessons){
 corpus+=`## Lesson ${lesson.lesson_number} — ${lesson.title}\n\n`;
 lesson.steps.forEach((s,i)=>corpus+=`### Step ${i+1} — ${s.title}\n\n${s.why_te}\n\n`);
}
fs.writeFileSync(corpusPath,corpus.trimEnd()+"\n");

const reportPath=path.join(root,"simulation","SEMANTIC_REDUNDANCY_REPORT.md");
const linesOut=[
 "# Same-Lesson Semantic Redundancy Audit","",
 `Thresholds: question >= 0.84, Telugu-in-English >= 0.80. Scanned ${lessons.length} lessons.`,"",
 "## Flagged before semantic refinement","",
 flaggedBefore.length?flaggedBefore.map(n=>"- L"+n).join("\n"):"- none","",
 "## Rewritten in this pass","",
 [...rewriteLessons].length?[...rewriteLessons].sort((a,b)=>a-b).map(n=>"- L"+n).join("\n"):"- none","",
 "## Remaining after refinement","",
 remaining.length?remaining.map(x=>`- L${x.lesson}: question=${x.question}, telugu=${x.telugu}`).join("\n"):"- none",""
];
fs.writeFileSync(reportPath,linesOut.join("\n")+"\n");
console.log("SEMANTIC_REFINEMENT "+JSON.stringify({flaggedBefore,rewrite:[...rewriteLessons],remaining}));
