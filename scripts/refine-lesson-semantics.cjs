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
const rewriteLessons=new Set(flaggedBefore);


function splitKnowledge(raw){
 const text=String(raw||"")
  .replace(/^\[no highlight\]\s*/i,"")
  .replace(/[\u0C00-\u0C7F]+/g,"")
  .replace(/\b(?:Step|step)\s+\d+\b[^.;]*/g,"");
 return text.split(/[.;!?]+|\s*;\s*/).map(x=>x.trim()).filter(x=>wc(x)>=4);
}
function lessonAtoms(lesson){
 const all=[];
 for(const s of lesson.steps||[])for(const atom of splitKnowledge(s.why_te))all.push(atom);
 const out=[],seen=new Set();
 for(const atom of all){
  const k=norm(atom);
  if(!k||seen.has(k))continue;
  seen.add(k);out.push(atom);
 }
 if(!out.length)out.push(clean(lesson.title)+" concept ni project evidence tho connect chestam");
 return out;
}
function pickAtom(atoms,index){
 return atoms[Math.min(index,atoms.length-1)]||atoms[0];
}

function qFor(r){
 const title=clean(r.lesson.title),stepTitle=clean(r.step.title),a=fullAnchor(r),line=lines(r),k=action(r),srcQ=sourceQ.get(r.lessonNo)||title;
 const prefix=r.stepNo===1?srcQ+" ":"";
 if(k==="createFile"){
  return prefix+"This step creates temporary "+a+" to isolate one edge case of "+title+" without changing production AeroTopo code. Before execution, inspect "+(line?"highlighted lines "+line:"the highlighted declarations")+" and predict the compiler or runtime result. Which exact Java rule controls that prediction, what evidence in this file supports it, and what different declaration would change the outcome?";
 }
 if(k==="typeTerminal"){
  const out=result(r);
  return "The previous step formed a prediction for "+title+"; now verify it by running the shown command. "+(out?'The result begins with "'+out+'". ':"")+"Which source declaration explains that result, what rule has now been proved by execution rather than assumption, and which nearby Java feature would look similar but follow a different selection or initialization rule?";
 }
 if(k==="deleteResource"){
  return "The temporary source "+a+" has finished its job in the "+title+" experiment. Why can this exact file be removed now without losing the verified language behavior, which permanent AeroTopo source remains as the real project reference, and what continuity problem would appear if lesson-only demo files accumulated before later lessons replay the project state?";
 }
 if(k==="highlightTarget"){
  return prefix+"The file location is already known, so focus only on "+(line?"lines "+line:"the highlighted target")+" in "+a+". Which keyword, signature, constructor call, access modifier, or expression is decisive for "+title+", what precise behavior does that syntax force, and what would change if only that highlighted element were replaced while surrounding code stayed the same?";
 }
 if(k==="openFile"){
  if(r.stepNo===1){
   return prefix+"Open "+a+" and use "+(line?"highlighted lines "+line:"the highlighted code")+" to establish the real project baseline for "+title+". Which class, method, field, constructor, interface, or dependency is relevant here, what concrete fact can you observe before drawing a language-level conclusion, and why is that fact the correct starting point for the next step?";
  }
  if(r.stepNo===r.total){
   return 'Return to '+a+' after the earlier analysis and use the accumulated evidence to answer "'+srcQ+'" as an interview response. Which project line is the concrete example, what Java rule does it support, what limitation or design consequence must be included, and how does the final answer differ from the initial baseline observation?';
  }
  if(r.stepNo===2){
   return "The baseline for "+title+" is already visible in "+a+"; now trace the exact syntax and execution, access, or resolution rule in "+(line?"lines "+line:"the highlighted section")+". What happens first, what is inherited, selected, initialized, or restricted, and which part is determined by the compiler versus runtime? Explain this mechanism rather than repeating the file overview.";
  }
  return "Move from syntax to consequence for "+title+". Using "+a+", trace how the highlighted design affects a caller, subclass, object, build step, or method invocation. What invariant or contract does the code preserve, what misuse would break that guarantee, and why does this consequence matter for maintainable AeroTopo code beyond the rule identified in the previous step?";
 }
 return 'For the step "'+stepTitle+'" in '+title+", use "+a+" as the current evidence and identify the one technical conclusion introduced by this action. What does this step add beyond the preceding step, which visible code or result proves that addition, and what should the learner carry into the next step without repeating the general lesson definition?";
}


function teFor(r){
 const title=clean(r.lesson.title),st=clean(r.step.title),a=fullAnchor(r),base=shortAnchor(r),line=lines(r),k=action(r),out=result(r);
 const atoms=lessonAtoms(r.lesson);
 const a0=pickAtom(atoms,0),a1=pickAtom(atoms,1),a2=pickAtom(atoms,2),a3=pickAtom(atoms,3);
 let t;
 if(k==="createFile"){
  t=a1+". Temporary "+base+" create chesi ee rule edge case ni production code nundi separate ga isolate chestam. Ippudu run cheyyakunda source chusi expected compiler leda runtime result predict cheyyadam matrame current step purpose.";
 }else if(k==="typeTerminal"){
  t=out
   ? a2+'. Terminal run taruvata "'+out+'" result kanipistundi. Ee output source prediction ni actual behavior tho compare cheyyadaniki evidence istundi; ippudu assumption badulu verified result meeda conclusion build chestam.'
   : a2+". Ippudu terminal command run chesi compiler leda runtime result ni previous prediction tho compare chestam. Ee verification current rule actual ga ela behave chestundo prove chestundi; definition repeat cheyyadam ee step purpose kaadu.";
 }else if(k==="deleteResource"){
  t="[no highlight] Temporary "+base+" experiment complete ayyindi kabatti remove chestam. Verified "+title+" behavior change avvadu; cleanup valla lesson-only source permanent project state lo remain kakunda later lessons same clean AeroTopo baseline nundi continue avutayi.";
 }else if(k==="highlightTarget"){
  t=a1+'. "'+st+'" lo '+base+" "+(line?"lines "+line:"highlighted declaration")+" meeda matrame focus chestam. First step location chupinchindi; ippudu exact syntax behavior ni enduku control chestundo line-level evidence tho inspect chestam.";
 }else if(k==="openFile"){
  if(r.stepNo===1){
   t=a0+". "+base+" open chesi "+title+" ki real project baseline ni locate chestam. Ee step relevant class/member ekkada undo identify chestundi; detailed Java rule ni next step lo separate ga analyze chestam.";
  }else if(r.stepNo===r.total){
   t=a3+". "+base+" ki return ayyi earlier evidence ni interview answer ga connect chestam. Ippudu project example, Java rule, important limitation ni kalipi final explanation build chestam; previous syntax discussion ni malli repeat cheyyamu.";
  }else if(r.stepNo===2){
   t=a1+". Ippudu "+base+" lo exact keyword, signature, order leda access rule ni trace chestam. First step baseline matrame establish chesindi; ee step mechanism enduku ila work avutundo source evidence tho prove chestundi.";
  }else{
   t=a2+". Ee step "+title+" syntax nundi practical consequence ki move avutundi. Caller leda subclass meeda effect enti, invariant ela preserve avutundi, wrong design valla em break avvachu ane connection ni project context lo trace chestam.";
  }
 }else{
  t=pickAtom(atoms,r.stepNo-1)+'. "'+st+'" action current evidence nundi oka new consequence ni add chestundi. Previous step point ni repeat cheyyakunda, ee result next reasoning ki ela dependency create chestundo matrame explain chestam.';
 }
 t=t.replace(/[\u0C00-\u0C7F]+/g,"").replace(/\s+/g," ").trim();
 if(r.step.highlight?.kind==="none"&&!/^\[no highlight\]/i.test(t))t="[no highlight] "+t;
 if(wc(t)<15)t+=" Ee evidence next step reasoning ki direct base ga use avutundi.";
 if(wc(t)>55){
  const no=/^\[no highlight\]/i.test(t);
  const body=stripNo(t).split(/\s+/).slice(0,48).join(" ");
  t=(no?"[no highlight] ":"")+body+".";
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
if(remaining.length)throw new Error("Semantic repetition remains: "+JSON.stringify(remaining.slice(0,160)));

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
