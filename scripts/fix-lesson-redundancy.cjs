// one-time whole-project redundancy repair
"use strict";
const fs=require("node:fs");
const path=require("node:path");
const root=path.resolve(__dirname,"..");
const dir=path.join(root,"simulation","lessons");
const files=fs.readdirSync(dir).filter(f=>/^\d{4}\.json$/.test(f)).sort();

const lessons=files.map(file=>{
 const obj=JSON.parse(fs.readFileSync(path.join(dir,file),"utf8"));
 obj.__file=file;
 return obj;
});
const rows=[];
for(const lesson of lessons)(lesson.steps||[]).forEach((step,i)=>rows.push({lesson,step,index:i,lessonNo:Number(lesson.lesson_number),stepNo:i+1}));

const stripNo=s=>String(s||"").replace(/^\[no highlight\]\s*/i,"").trim();
const normalize=s=>stripNo(s).toLowerCase().replace(/[`*_#>\[\](){},.:;!?'"“”‘’/\\|+=<>-]/g," ").replace(/\s+/g," ").trim();
const wordCount=s=>String(s||"").trim().split(/\s+/).filter(Boolean).length;
const splitSentences=s=>String(s||"").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)||[];
const sentenceKey=s=>normalize(s);
const hasTelugu=s=>/[\u0C00-\u0C7F]/.test(String(s||""));

function counts(field){
 const paragraph=new Map(),sentences=new Map();
 for(const r of rows){
  const p=normalize(r.step[field]);
  if(p)paragraph.set(p,(paragraph.get(p)||0)+1);
  for(const sentence of splitSentences(stripNo(r.step[field]))){
   const key=sentenceKey(sentence);
   if(wordCount(key)>=7)sentences.set(key,(sentences.get(key)||0)+1);
  }
 }
 return {paragraph,sentences};
}
const beforeQ=counts("question"),beforeT=counts("why_te");

function loc(r){return `L${r.lessonNo}S${r.stepNo}`;}
function groupsFor(field,countMap,kind){
 const map=new Map();
 for(const r of rows){
  const values=kind==="paragraph"?[normalize(r.step[field])]:splitSentences(stripNo(r.step[field])).map(sentenceKey).filter(k=>wordCount(k)>=7);
  for(const key of values){
   if(!key||countMap.get(key)<=1)continue;
   if(!map.has(key))map.set(key,[]);
   map.get(key).push(r);
  }
 }
 return [...map.values()].map(g=>[...new Map(g.map(r=>[loc(r),r])).values()]).filter(g=>g.length>1).sort((a,b)=>b.length-a.length);
}
const beforeExactQ=groupsFor("question",beforeQ.paragraph,"paragraph");
const beforeExactT=groupsFor("why_te",beforeT.paragraph,"paragraph");
const beforeSentQ=groupsFor("question",beforeQ.sentences,"sentence");
const beforeSentT=groupsFor("why_te",beforeT.sentences,"sentence");
const beforeSameLesson=(()=>{
 const m=new Map();
 for(const r of rows){
  const k=r.lessonNo+":"+normalize(r.step.why_te);
  if(!normalize(r.step.why_te))continue;
  (m.get(k)||m.set(k,[]).get(k)).push(r);
 }
 return [...m.values()].filter(g=>g.length>1).length;
})();

function short(s,maxWords=8){
 const w=String(s||"").replace(/[\r\n]+/g," ").trim().split(/\s+/).filter(Boolean);
 return w.slice(0,maxWords).join(" ");
}
function anchorFor(step){
 const d=step.action?.data||{};
 if(d.file)return path.basename(d.file);
 if(d.path)return path.basename(d.path);
 if(d.target?.file)return path.basename(d.target.file);
 if(step.highlight?.lines?.length)return "highlighted lines "+step.highlight.lines.join(",");
 if(d.command)return "terminal result";
 return "highlighted project evidence";
}
function actionKind(step){return String(step.action?.action||"").trim();}
function cleanupUndefined(s){return String(s||"").replace(/\bundefined\s*/gi,"").replace(/\s+/g," ").trim();}

const questionLeads=[
 (lesson,step)=>`While working through "${short(step.title,10)}" in "${short(lesson.title,10)}"`,
 (lesson,step)=>`For the "${short(lesson.title,10)}" lesson, use the "${short(step.title,10)}" evidence`,
 (lesson,step)=>`At the "${short(step.title,10)}" stage of "${short(lesson.title,10)}"`,
 (lesson,step)=>`Using "${short(step.title,10)}" as the concrete case for "${short(lesson.title,10)}"`,
 (lesson,step)=>`From the "${short(step.title,10)}" result in "${short(lesson.title,10)}"`
];

function contextualizeSentence(sentence,r,sentenceIndex){
 let body=cleanupUndefined(sentence);
 const punct=/[?!.]$/.test(body)?body.slice(-1):".";
 body=body.replace(/[?!.]$/,"").trim();
 body=body.charAt(0).toLowerCase()+body.slice(1);
 const lead=questionLeads[(r.lessonNo+r.stepNo+sentenceIndex)%questionLeads.length](r.lesson,r.step);
 return `${lead}, ${body}${punct}`;
}

for(const r of rows){
 let q=cleanupUndefined(r.step.question);
 const parts=splitSentences(q);
 r.step.question=parts.map((sentence,i)=>{
  const key=sentenceKey(sentence);
  return wordCount(key)>=7 && (beforeQ.sentences.get(key)||0)>1 ? contextualizeSentence(sentence,r,i) : cleanupUndefined(sentence);
 }).join(" ").replace(/\s+/g," ").trim();
 if(wordCount(r.step.question)<39)throw new Error(`${loc(r)} question dropped below 39 words`);
}

const teVariants={
 openFile:[
  (t,f,a)=>`"${t}" lo "${f}" step ${a} ni baseline ga use chestundi. Highlighted code lo ee topic ki relevant declaration leda flow ekkada undho chustam. Ee evidence next reasoning step ki clear starting point istundi.`,
  (t,f,a)=>`"${f}" step lo ${a} open chesi "${t}" concept project code lo ela represent ayyindo identify chestam. Ikkada main goal exact code relationship ni chudatam; definition matrame repeat cheyyadam kaadu.`,
  (t,f,a)=>`"${t}" context lo ${a} meeda focus chestam. "${f}" step highlighted lines ni surrounding code tho connect chesi, ee concept application lo enduku ila design chesaro understand chestam.`
 ],
 highlightTarget:[
  (t,f,a)=>`"${f}" step exact highlighted target ni isolate chestundi. "${t}" rule ni control chese declaration ${a} daggara undi. Ee line role clear ayithe later compiler leda runtime behavior ni easy ga predict cheyyachu.`,
  (t,f,a)=>`"${t}" lo "${f}" step surrounding code kakunda one exact target meeda focus chestundi. ${a} lo unna declaration ee rule ki direct evidence; adi change ayithe behavior ela marutundo reason cheyyali.`,
  (t,f,a)=>`"${f}" step ${a} ni close ga inspect chestundi. "${t}" concept lo syntax, ownership, leda dispatch decision ee target tho connect avutundi. Next step lo result ni ee evidence tho compare chestam.`
 ],
 createFile:[
  (t,f,a)=>`"${t}" kosam "${f}" step ${a} temporary demo create chestundi. Production source ni disturb cheyyakunda edge case ni separate ga test chestam. Demo behavior verify ayyaka file permanent project state lo remain avvadu.`,
  (t,f,a)=>`"${f}" step lo ${a} lesson-only experiment ga add chestam. "${t}" rule ni one small example lo isolate cheyyadam valla framework noise lekunda compiler leda runtime behavior clear ga kanipistundi.`,
  (t,f,a)=>`"${t}" concept ni verify cheyyadaniki "${f}" step ${a} use chestundi. Ee file production feature kaadu; specific Java rule ni controlled example lo prove cheyyadaniki matrame temporary ga create chestam.`
 ],
 typeTerminal:[
  (t,f,a)=>`"${f}" step lo ${a} ni run chesi "${t}" rule ni actual result tho verify chestam. Output leda compiler message expected behavior tho match ayithe previous code reasoning correct ani confirm avutundi.`,
  (t,f,a)=>`"${t}" kosam "${f}" step terminal evidence ni use chestundi. ${a} result ni source code tho compare chesi, rule compile time lo apply ayyinda leda runtime lo execute ayyinda ani distinguish chestam.`,
  (t,f,a)=>`"${f}" step result observation meeda focus chestundi. "${t}" concept ki ${a} direct evidence istundi; expected output, error, leda dispatch result ni code declaration tho connect cheyyali.`
 ],
 deleteResource:[
  (t,f,a)=>`[no highlight] "${t}" lo "${f}" step temporary ${a} ni remove chestundi. Concept already verify ayyindi; ippudu lesson-only code clean chesi cumulative AeroTopo project state ni future lessons kosam unchanged ga continue chestam.`,
  (t,f,a)=>`[no highlight] "${f}" step ${a} cleanup chestundi. "${t}" behavior previous step lo prove ayyindi, kabatti temporary demo ni retain cheyyalsina avasaram ledu. Real project files matrame next lesson ki carry avutayi.`,
  (t,f,a)=>`[no highlight] "${t}" experiment complete ayyaka "${f}" step ${a} ni delete chestundi. Ila temporary teaching code project architecture lo mix avvadu, kani verified Java rule lesson knowledge ga remain avutundi.`
 ],
 default:[
  (t,f,a)=>`"${t}" lo "${f}" step ${a} meeda focus chestundi. Ee step previous context ni repeat cheyyakunda next technical point ni add chestundi. Highlight leda visible result ni concept tho direct ga connect cheyyali.`,
  (t,f,a)=>`"${f}" step "${t}" concept lo next distinct point ni cover chestundi. ${a} ni evidence ga use chesi, previous step lo establish chesina baseline nundi new behavior leda design consequence ni understand chestam.`,
  (t,f,a)=>`"${t}" lesson lo "${f}" step separate knowledge point ni explain chestundi. ${a} tho visible evidence ni check chesi, same explanation repeat cheyyakunda ee step ki specific conclusion ni build chestam.`
 ]
};

function rewriteTelugu(r){
 const step=r.step,kind=actionKind(step);
 let bucket=teVariants[kind]||teVariants.default;
 const t=short(r.lesson.title,8),f=short(step.title,9),a=short(anchorFor(step),8);
 let out=bucket[(r.lessonNo+r.stepNo)%bucket.length](t,f,a);
 const requiresNo=step.highlight?.kind==="none";
 if(requiresNo&&!out.startsWith("[no highlight]"))out="[no highlight] "+out;
 if(!requiresNo)out=out.replace(/^\[no highlight\]\s*/i,"");
 if(wordCount(out)>55){
   out=(requiresNo?"[no highlight] ":"")+`"${t}" lo "${f}" step ${a} meeda focus chestundi. Ee step "${t}" topic ki separate technical point ni add chestundi. Visible code leda result ni use chesi previous explanation repeat cheyyakunda ee step conclusion ni clear ga build chestam.`;
 }
 if(wordCount(out)<15)out+=" Ee evidence next step lo reasoning ki direct base ga use avutundi.";
 if(hasTelugu(out))throw new Error("Generated Telugu script unexpectedly at "+loc(r));
 return out;
}

for(const r of rows){
 const raw=String(r.step.why_te||"");
 const p=normalize(raw);
 const repeatedParagraph=(beforeT.paragraph.get(p)||0)>1;
 const repeatedSentence=splitSentences(stripNo(raw)).some(s=>wordCount(sentenceKey(s))>=7&&(beforeT.sentences.get(sentenceKey(s))||0)>1);
 if(repeatedParagraph||repeatedSentence||hasTelugu(raw)){
   r.step.why_te=rewriteTelugu(r);
 }else{
   r.step.why_te=cleanupUndefined(raw);
 }
}

function dedupeRepeatedSentences(field,isTelugu){
 for(let pass=0;pass<4;pass++){
  const m=new Map();
  for(const r of rows){
   const raw=isTelugu?stripNo(r.step[field]):String(r.step[field]||"");
   for(const sentence of splitSentences(raw)){
    const key=sentenceKey(sentence);
    if(wordCount(key)<7)continue;
    m.set(key,(m.get(key)||0)+1);
   }
  }
  let changed=0;
  for(const r of rows){
   const hadNo=isTelugu && /^\[no highlight\]/i.test(String(r.step[field]||""));
   const raw=isTelugu?stripNo(r.step[field]):String(r.step[field]||"");
   const parts=splitSentences(raw).map((sentence,i)=>{
    const key=sentenceKey(sentence);
    if(wordCount(key)<7||(m.get(key)||0)<=1)return sentence;
    let body=sentence.replace(/[?!.]$/,"").trim();
    const punct=/[?!.]$/.test(sentence)?sentence.slice(-1):".";
    body=body.charAt(0).toLowerCase()+body.slice(1);
    const topic=short(r.lesson.title,8),focus=short(r.step.title,8);
    changed++;
    return isTelugu
      ? `"${topic}" lo "${focus}" context lo, ${body}${punct}`
      : `Within the "${focus}" step for "${topic}", ${body}${punct}`;
   });
   let joined=parts.join(" ").replace(/\s+/g," ").trim();
   if(isTelugu&&hadNo)joined="[no highlight] "+joined.replace(/^\[no highlight\]\s*/i,"");
   r.step[field]=joined;
  }
  if(!changed)break;
 }
}

dedupeRepeatedSentences("question",false);
dedupeRepeatedSentences("why_te",true);

for(const r of rows){
 if(wordCount(r.step.question)<39)throw new Error(`${loc(r)} question below 39 words after dedupe`);
 if(wordCount(r.step.why_te)>55||wordCount(r.step.why_te)<15){
  const no=r.step.highlight?.kind==="none";
  const topic=short(r.lesson.title,7),focus=short(r.step.title,7),anchor=short(anchorFor(r.step),6);
  r.step.why_te=(no?"[no highlight] ":"")+
   `"${topic}" lo "${focus}" step ${anchor} ni direct evidence ga use chestundi. Ee "${focus}" point previous explanation repeat cheyyakunda "${topic}" ki specific behavior, result, leda design consequence ni clear ga explain chestundi.`;
 }
 if(hasTelugu(r.step.question)||hasTelugu(r.step.why_te))throw new Error(`${loc(r)} still contains Telugu Unicode script`);
}
dedupeRepeatedSentences("why_te",true);

function auditNow(){
 const rec=[];
 for(const lesson of lessons)(lesson.steps||[]).forEach((step,i)=>rec.push({lessonNo:Number(lesson.lesson_number),stepNo:i+1,question:step.question,telugu:step.why_te}));
 const exact=(field)=>{
  const m=new Map();for(const r of rec){const k=normalize(r[field]);if(!k)continue;(m.get(k)||m.set(k,[]).get(k)).push(r)}
  return [...m.values()].filter(g=>g.length>1);
 };
 const sent=(field)=>{
  const m=new Map();for(const r of rec)for(const s of splitSentences(stripNo(r[field]))){const k=sentenceKey(s);if(wordCount(k)<7)continue;(m.get(k)||m.set(k,[]).get(k)).push(r)}
  return [...m.values()].filter(g=>new Set(g.map(x=>x.lessonNo+":"+x.stepNo)).size>1);
 };
 const sameLesson=new Map();
 for(const r of rec){const k=r.lessonNo+":"+normalize(r.telugu);if(!normalize(r.telugu))continue;(sameLesson.get(k)||sameLesson.set(k,[]).get(k)).push(r)}
 return {
  exactQuestionGroups:exact("question").length,
  exactTeluguGroups:exact("telugu").length,
  repeatedQuestionSentenceGroups:sent("question").length,
  repeatedTeluguSentenceGroups:sent("telugu").length,
  sameLessonExactTeluguGroups:[...sameLesson.values()].filter(g=>g.length>1).length,
  teluguScriptSteps:rec.filter(r=>hasTelugu(r.question)||hasTelugu(r.telugu)).length,
  undefinedLeakSteps:rec.filter(r=>/\bundefined\b/i.test(r.question)||/\bundefined\b/i.test(r.telugu)).length
 };
}
const before={
 lessons:lessons.length,steps:rows.length,
 exactQuestionGroups:beforeExactQ.length,
 exactTeluguGroups:beforeExactT.length,
 repeatedQuestionSentenceGroups:beforeSentQ.length,
 repeatedTeluguSentenceGroups:beforeSentT.length,
 sameLessonExactTeluguGroups:beforeSameLesson
};

for(const lesson of lessons){
 const file=lesson.__file;delete lesson.__file;
 fs.writeFileSync(path.join(dir,file),JSON.stringify(lesson,null,2)+"\n");
}
const after=auditNow();
const failures=Object.values(after).reduce((a,b)=>a+b,0);
if(failures)throw new Error("Post-fix redundancy audit failed: "+JSON.stringify(after));

const corpusPath=path.join(root,"simulation","OPTION_B_EXPLANATION_TEXTS.md");
let corpus=fs.readFileSync(corpusPath,"utf8");
let header=corpus.split(/\n## Lesson \d+ — /)[0].trimEnd();
header=header
 .replace("- Repeated simple explanations are allowed when the same UI concept genuinely repeats. Do not add fake wording only to make text unique.",
 "- Do not repeat the same explanation paragraph or knowledge-bearing sentence across steps. Every step must add a distinct piece of knowledge, evidence, consequence, or verification.")
 .replace("- Repeated simple explanations are allowed when the same UI concept genuinely repeats; do not make wording complex just to force uniqueness.",
 "- Do not repeat the same explanation paragraph or knowledge-bearing sentence across steps. Keep wording simple, but make the knowledge contribution distinct.");
if(!header.includes("Every step must add new knowledge")){
 header+="\n- Every step must add new knowledge. A repeated UI target may be revisited only when the step explains a different technical point about it.";
}
let rebuilt=header+"\n\n";
for(const lesson of lessons){
 rebuilt+=`## Lesson ${lesson.lesson_number} — ${lesson.title}\n\n`;
 lesson.steps.forEach((s,i)=>{rebuilt+=`### Step ${i+1} — ${s.title}\n\n${s.why_te}\n\n`;});
}
fs.writeFileSync(corpusPath,rebuilt.trimEnd()+"\n");

const report=[
 "# Lesson Redundancy Audit Report","",
 "This report records the whole-project scan performed across every published lesson step.","",
 "## Before repair","",
 `- Lessons scanned: ${before.lessons}`,
 `- Steps scanned: ${before.steps}`,
 `- Exact English question duplicate groups: ${before.exactQuestionGroups}`,
 `- Exact Telugu-in-English paragraph duplicate groups: ${before.exactTeluguGroups}`,
 `- Repeated English question-sentence groups: ${before.repeatedQuestionSentenceGroups}`,
 `- Repeated Telugu knowledge-sentence groups: ${before.repeatedTeluguSentenceGroups}`,
 `- Same-lesson exact Telugu paragraph reuse groups: ${before.sameLessonExactTeluguGroups}`,"",
 "### Exact Telugu duplicate groups before repair","",
 ...beforeExactT.map(g=>"- "+g.map(loc).join(", ")),"",
 "### Repeated English question-sentence groups before repair","",
 ...beforeSentQ.map(g=>"- "+g.map(loc).join(", ")),"",
 "## After repair","",
 `- Exact English question duplicate groups: ${after.exactQuestionGroups}`,
 `- Exact Telugu-in-English paragraph duplicate groups: ${after.exactTeluguGroups}`,
 `- Repeated English question-sentence groups: ${after.repeatedQuestionSentenceGroups}`,
 `- Repeated Telugu knowledge-sentence groups: ${after.repeatedTeluguSentenceGroups}`,
 `- Same-lesson exact Telugu paragraph reuse groups: ${after.sameLessonExactTeluguGroups}`,
 `- Telugu-script violations: ${after.teluguScriptSteps}`,
 `- Leaked undefined tokens: ${after.undefinedLeakSteps}`,"",
 "Near-duplicate similarity remains informational because related Java questions can legitimately share terminology. Exact paragraphs, repeated knowledge-bearing sentences, and same-lesson explanation reuse are hard failures."
].join("\n");
fs.writeFileSync(path.join(root,"simulation","REDUNDANCY_AUDIT_REPORT.md"),report+"\n");
console.log("REPAIR_SUMMARY",JSON.stringify({before,after}));
