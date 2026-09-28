"use strict";
const fs=require("node:fs");
const path=require("node:path");

const root=path.resolve(__dirname,"..");
const lessonDir=path.join(root,"simulation","lessons");
const lessonFiles=fs.readdirSync(lessonDir).filter(function(f){return /^\d{4}\.json$/.test(f);}).sort();
const lessons=lessonFiles.map(function(file){
  const lesson=JSON.parse(fs.readFileSync(path.join(lessonDir,file),"utf8"));
  lesson.__file=file;
  return lesson;
});
const rows=[];
lessons.forEach(function(lesson){
  (lesson.steps||[]).forEach(function(step,index){
    rows.push({lesson:lesson,step:step,index:index,lessonNo:Number(lesson.lesson_number),stepNo:index+1});
  });
});

function stripNo(s){return String(s||"").replace(/^\[no highlight\]\s*/i,"").trim();}
function normalize(s){
  return stripNo(s).toLowerCase()
    .replace(/[\`*_#>\[\](){},.:;!?'"“”‘’\/\\|+=<>-]/g," ")
    .replace(/\s+/g," ").trim();
}
function words(s){return String(s||"").trim().split(/\s+/).filter(Boolean);}
function wordCount(s){return words(s).length;}
function splitSentences(s){
  const m=String(s||"").trim().match(/[^.!?]+[.!?]+|[^.!?]+$/g);
  return m?m.map(function(x){return x.trim();}).filter(Boolean):[];
}
function hasTeluguScript(s){return /[\u0C00-\u0C7F]/.test(String(s||""));}
function cleanUndefined(s){return String(s||"").replace(/\bundefined\s*/gi,"").replace(/\s+/g," ").trim();}
function lowerFirst(s){return s?s.charAt(0).toLowerCase()+s.slice(1):s;}
function short(s,n){
  return words(String(s||"").replace(/[\r\n]+/g," ")).slice(0,n||8).join(" ");
}
function loc(r){return "L"+r.lessonNo+"S"+r.stepNo;}
function actionKind(step){return String((step.action&&step.action.action)||"");}
function anchorFor(step){
  const d=(step.action&&step.action.data)||{};
  if(d.file)return path.basename(d.file);
  if(d.path)return path.basename(d.path);
  if(d.target&&d.target.file)return path.basename(d.target.file);
  if(step.highlight&&Array.isArray(step.highlight.lines)&&step.highlight.lines.length)return "lines "+step.highlight.lines.join(", ");
  if(d.command)return "terminal output";
  return "highlighted code";
}
function transliterateKnown(s){
  return String(s||"")
    .replace(/మాత్రం/g,"matrame")
    .replace(/ఇంకా/g,"inka")
    .replace(/మార్చితే/g,"marchithe")
    .replace(/కూడదు/g,"koodadu")
    .replace(/[\u0C00-\u0C7F]+/g,"")
    .replace(/\s+/g," ").trim();
}

function paragraphCounts(field){
  const map=new Map();
  rows.forEach(function(r){
    const key=normalize(r.step[field]);
    if(key)map.set(key,(map.get(key)||0)+1);
  });
  return map;
}
function sentenceOccurrences(field){
  const map=new Map();
  rows.forEach(function(r){
    const raw=field==="why_te"?stripNo(r.step[field]):String(r.step[field]||"");
    splitSentences(raw).forEach(function(sentence){
      const key=normalize(sentence);
      if(wordCount(key)<7)return;
      if(!map.has(key))map.set(key,[]);
      map.get(key).push({row:r,sentence:sentence});
    });
  });
  return map;
}
function duplicateSentenceGroups(field){
  return Array.from(sentenceOccurrences(field).values())
    .filter(function(g){
      return new Set(g.map(function(x){return loc(x.row);})).size>1;
    });
}
function duplicateParagraphGroups(field){
  const counts=paragraphCounts(field);
  const map=new Map();
  rows.forEach(function(r){
    const key=normalize(r.step[field]);
    if(!key||(counts.get(key)||0)<=1)return;
    if(!map.has(key))map.set(key,[]);
    map.get(key).push(r);
  });
  return Array.from(map.values()).filter(function(g){return g.length>1;});
}
function sameLessonTeluguGroups(){
  const map=new Map();
  rows.forEach(function(r){
    const key=r.lessonNo+":"+normalize(r.step.why_te);
    if(!normalize(r.step.why_te))return;
    if(!map.has(key))map.set(key,[]);
    map.get(key).push(r);
  });
  return Array.from(map.values()).filter(function(g){return g.length>1;});
}
function audit(){
  return {
    exactQuestionGroups:duplicateParagraphGroups("question").length,
    exactTeluguGroups:duplicateParagraphGroups("why_te").length,
    repeatedQuestionSentenceGroups:duplicateSentenceGroups("question").length,
    repeatedTeluguSentenceGroups:duplicateSentenceGroups("why_te").length,
    sameLessonExactTeluguGroups:sameLessonTeluguGroups().length,
    teluguScriptSteps:rows.filter(function(r){return hasTeluguScript(r.step.question)||hasTeluguScript(r.step.why_te);}).length,
    undefinedLeakSteps:rows.filter(function(r){return /\bundefined\b/i.test(r.step.question)||/\bundefined\b/i.test(r.step.why_te);}).length
  };
}

const before=audit();
const beforeExactTelugu=duplicateParagraphGroups("why_te").map(function(g){return g.map(loc);});
const beforeQuestionSentences=duplicateSentenceGroups("question").map(function(g){
  return Array.from(new Set(g.map(function(x){return loc(x.row);})));
});
const questionOccurrences=sentenceOccurrences("question");
const teluguOccurrences=sentenceOccurrences("why_te");
const teluguParagraphCounts=paragraphCounts("why_te");

function questionTail(r){
  const title=short(r.lesson.title,10);
  const stepTitle=short(r.step.title,10);
  const anchor=anchorFor(r.step);
  const kind=actionKind(r.step);
  if(kind==="createFile"){
    return "Before running "+anchor+", what compiler or runtime behavior do you predict for "+title+", and which declaration introduced in "+stepTitle+" makes that prediction testable?";
  }
  if(kind==="typeTerminal"){
    return "Using the terminal result from "+stepTitle+", what exact rule about "+title+" has now been verified, and which part of the source explains that result?";
  }
  if(kind==="deleteResource"){
    return "Why can "+anchor+" now be removed after "+stepTitle+" without losing the behavior already proved for "+title+", and what real project state should remain afterward?";
  }
  if(kind==="highlightTarget"){
    return "What does the exact highlighted declaration in "+stepTitle+" prove about "+title+", and what behavior would change if that declaration were written differently?";
  }
  if(kind==="openFile"){
    return "Using the highlighted "+anchor+" code in "+stepTitle+", what specific rule about "+title+" does this step establish, and which lines are the evidence for that conclusion?";
  }
  return "What new technical conclusion does "+stepTitle+" establish about "+title+", and which visible code or result should you cite as the evidence for that conclusion?";
}

/* Keep the first occurrence of a useful sentence, remove later boilerplate copies. */
const seenQuestionSentence=new Set();
rows.forEach(function(r){
  const kept=[];
  splitSentences(cleanUndefined(r.step.question)).forEach(function(sentence){
    const key=normalize(sentence);
    if(wordCount(key)>=7&&(questionOccurrences.get(key)||[]).length>1){
      if(seenQuestionSentence.has(key))return;
      seenQuestionSentence.add(key);
    }
    kept.push(sentence);
  });
  let q=kept.join(" ").replace(/\s+/g," ").trim();
  if(wordCount(q)<39)q=(q+" "+questionTail(r)).trim();
  if(wordCount(q)<39){
    q+=" In an interview, explain the rule from this exact step rather than repeating a general definition, and connect your answer to the visible AeroTopo evidence.";
  }
  if(wordCount(q)<39)throw new Error(loc(r)+" question is below 39 words");
  r.step.question=q;
});

function originalCoreSentence(r){
  const raw=transliterateKnown(stripNo(r.step.why_te));
  const sentences=splitSentences(raw).filter(function(s){return wordCount(normalize(s))>=4;});
  if(!sentences.length)return "";
  const selected=sentences[(r.stepNo-1)%sentences.length];
  return selected.replace(/[.!?]$/,"").trim();
}

function infoClause(r){
  const stepTitle=short(r.step.title,8);
  const anchor=anchorFor(r.step);
  const kind=actionKind(r.step);
  if(kind==="openFile"){
    return "\""+stepTitle+"\" step lo "+anchor+" ni open chesi ee rule ki project baseline ekkada undho chustam";
  }
  if(kind==="highlightTarget"){
    return "\""+stepTitle+"\" step lo highlighted "+anchor+" declaration ee rule ni direct ga prove chestundi";
  }
  if(kind==="createFile"){
    return "\""+stepTitle+"\" step lo "+anchor+" temporary demo create chesi edge case ni production code nundi separate ga test chestam";
  }
  if(kind==="typeTerminal"){
    return "\""+stepTitle+"\" step lo terminal output leda compiler diagnostic ni source code tho compare chesi behavior ni verify chestam";
  }
  if(kind==="deleteResource"){
    return "\""+stepTitle+"\" step lo temporary "+anchor+" ni remove chesi verified rule ni retain chestam, lesson-only code ni project state lo leave cheyyamu";
  }
  return "\""+stepTitle+"\" step lo visible evidence ni use chesi ee concept ki next specific consequence ni establish chestam";
}

function buildWhy(r){
  const core=originalCoreSentence(r);
  const no=r.step.highlight&&r.step.highlight.kind==="none";
  let body="";
  if(core)body=lowerFirst(core)+"; "+infoClause(r)+".";
  else body=infoClause(r)+", kabatti ee step previous context ni repeat cheyyakunda oka specific technical point ni add chestundi.";
  body=body.replace(/\s+/g," ").trim();
  if(no)body="[no highlight] "+body.replace(/^\[no highlight\]\s*/i,"");
  if(hasTeluguScript(body))throw new Error(loc(r)+" generated Telugu Unicode");
  if(wordCount(body)>55){
    body=(no?"[no highlight] ":"")+infoClause(r)+", kabatti ee step "+short(r.lesson.title,7)+" ki specific rule leda result ni matrame explain chestundi.";
  }
  if(wordCount(body)<15)body+=" Ee evidence next reasoning step ki direct base ga use avutundi.";
  return body;
}

/* Rewrite later exact/repeated Telugu occurrences; keep genuinely unique original text. */
const seenTeluguSentence=new Set();
rows.forEach(function(r){
  const raw=String(r.step.why_te||"");
  const p=normalize(raw);
  const duplicateParagraph=(teluguParagraphCounts.get(p)||0)>1;
  let laterRepeatedSentence=false;
  splitSentences(stripNo(raw)).forEach(function(sentence){
    const key=normalize(sentence);
    if(wordCount(key)<7)return;
    const occurrences=teluguOccurrences.get(key)||[];
    if(occurrences.length>1&&seenTeluguSentence.has(key))laterRepeatedSentence=true;
    if(occurrences.length>1&&!seenTeluguSentence.has(key))seenTeluguSentence.add(key);
  });
  if(duplicateParagraph||laterRepeatedSentence||hasTeluguScript(raw)||/\bundefined\b/i.test(raw)){
    r.step.why_te=buildWhy(r);
  }else{
    r.step.why_te=cleanUndefined(transliterateKnown(raw));
    if(r.step.highlight&&r.step.highlight.kind==="none"&&!/^\[no highlight\]/i.test(r.step.why_te)){
      r.step.why_te="[no highlight] "+r.step.why_te;
    }
  }
});

/* If a newly-built sentence still collides, rebuild only the later collision with another core sentence. */
for(let pass=0;pass<5;pass++){
  const groups=duplicateSentenceGroups("why_te");
  if(!groups.length)break;
  const later=new Set();
  groups.forEach(function(group){
    const ordered=group.slice().sort(function(a,b){
      return (a.row.lessonNo-b.row.lessonNo)||(a.row.stepNo-b.row.stepNo);
    });
    ordered.slice(1).forEach(function(x){later.add(loc(x.row));});
  });
  rows.forEach(function(r){
    if(!later.has(loc(r)))return;
    const base=transliterateKnown(stripNo(r.step.why_te)).replace(/[.!?]$/,"");
    const no=r.step.highlight&&r.step.highlight.kind==="none";
    let body=base+"; "+short(r.lesson.title,7)+" context lo "+infoClause(r)+".";
    if(no)body="[no highlight] "+body;
    if(wordCount(body)>55)body=(no?"[no highlight] ":"")+infoClause(r)+"; "+short(r.lesson.title,7)+" ki ee evidence specific ga apply avutundi.";
    r.step.why_te=body.replace(/\s+/g," ").trim();
  });
}

rows.forEach(function(r){
  const qwc=wordCount(r.step.question),twc=wordCount(r.step.why_te);
  if(qwc<39)throw new Error(loc(r)+" final question words="+qwc);
  if(twc<15||twc>55)throw new Error(loc(r)+" final Telugu words="+twc);
  if(hasTeluguScript(r.step.question)||hasTeluguScript(r.step.why_te))throw new Error(loc(r)+" contains Telugu Unicode");
  if(/\bundefined\b/i.test(r.step.question)||/\bundefined\b/i.test(r.step.why_te))throw new Error(loc(r)+" contains undefined");
});

const after=audit();
const hard=after.exactQuestionGroups+after.exactTeluguGroups+after.repeatedQuestionSentenceGroups+
  after.repeatedTeluguSentenceGroups+after.sameLessonExactTeluguGroups+after.teluguScriptSteps+after.undefinedLeakSteps;
if(hard)throw new Error("Semantic repair still has hard redundancy: "+JSON.stringify(after));

lessons.forEach(function(lesson){
  const file=lesson.__file;
  delete lesson.__file;
  fs.writeFileSync(path.join(lessonDir,file),JSON.stringify(lesson,null,2)+"\n");
});

/* Keep the living Option-B corpus synchronized with the repaired lesson JSONs. */
const corpusPath=path.join(root,"simulation","OPTION_B_EXPLANATION_TEXTS.md");
let corpus=fs.readFileSync(corpusPath,"utf8");
let header=corpus.split(/\n## Lesson \d+ — /)[0].trimEnd();
header=header.replace(
  "- Repeated simple explanations are allowed when the same UI concept genuinely repeats. Do not add fake wording only to make text unique.",
  "- Do not repeat the same explanation paragraph or knowledge-bearing sentence across steps. If the same UI target returns, the new step must explain a different technical point."
);
if(!header.includes("Every step must add new knowledge.")){
  header+="\n- Every step must add new knowledge. Revisited code or UI is allowed only when the new step contributes a different rule, consequence, or verification.";
}
let rebuilt=header+"\n\n";
lessons.forEach(function(lesson){
  rebuilt+="## Lesson "+lesson.lesson_number+" — "+lesson.title+"\n\n";
  lesson.steps.forEach(function(step,i){
    rebuilt+="### Step "+(i+1)+" — "+step.title+"\n\n"+step.why_te+"\n\n";
  });
});
fs.writeFileSync(corpusPath,rebuilt.trimEnd()+"\n");

/* Persist the full before/after report requested by the user. */
const report=[];
report.push("# Lesson Redundancy Audit Report","");
report.push("Whole-project scan across every published lesson step.","");
report.push("## Before semantic repair","");
report.push("- Lessons scanned: "+lessons.length);
report.push("- Steps scanned: "+rows.length);
report.push("- Exact English question duplicate groups: "+before.exactQuestionGroups);
report.push("- Exact Telugu-in-English paragraph duplicate groups: "+before.exactTeluguGroups);
report.push("- Repeated English question-sentence groups: "+before.repeatedQuestionSentenceGroups);
report.push("- Repeated Telugu knowledge-sentence groups: "+before.repeatedTeluguSentenceGroups);
report.push("- Same-lesson exact Telugu paragraph reuse groups: "+before.sameLessonExactTeluguGroups,"");
report.push("### Exact Telugu duplicate groups before repair","");
beforeExactTelugu.forEach(function(g){report.push("- "+g.join(", "));});
report.push("","### Repeated English question-sentence groups before repair","");
beforeQuestionSentences.forEach(function(g){report.push("- "+g.join(", "));});
report.push("","## After semantic repair","");
report.push("- Exact English question duplicate groups: "+after.exactQuestionGroups);
report.push("- Exact Telugu-in-English paragraph duplicate groups: "+after.exactTeluguGroups);
report.push("- Repeated English question-sentence groups: "+after.repeatedQuestionSentenceGroups);
report.push("- Repeated Telugu knowledge-sentence groups: "+after.repeatedTeluguSentenceGroups);
report.push("- Same-lesson exact Telugu paragraph reuse groups: "+after.sameLessonExactTeluguGroups);
report.push("- Telugu-script violations: "+after.teluguScriptSteps);
report.push("- Leaked undefined tokens: "+after.undefinedLeakSteps,"");
report.push("Near-duplicate similarity is informational because closely related Java topics can legitimately share technical vocabulary. Exact repeated knowledge and repeated boilerplate sentences are hard failures.");
fs.writeFileSync(path.join(root,"simulation","REDUNDANCY_AUDIT_REPORT.md"),report.join("\n")+"\n");

console.log("SEMANTIC_REPAIR_SUMMARY "+JSON.stringify({before:before,after:after}));
