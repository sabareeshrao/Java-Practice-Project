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
 const specials={
  11:[
   "STS uses Ctrl+Shift+R to open a resource by name. In IntelliJ, use Go to File on AeroTopoApplication.java and explain what is being indexed, why this works even when you do not know the package path, and how file-oriented navigation differs from class-oriented search in the next step.",
   "STS uses Ctrl+Shift+T to find a Java type, while IntelliJ uses Go to Class. Search for AeroTopoApplication and explain why a type index is more precise than a file-name search when class names, nested types, or generated sources are involved, and when you would still prefer Go to File instead.",
   "STS Quick Outline and IntelliJ File Structure both navigate inside the file already open. Use AeroTopoApplication.java to explain how fields, constructors, and methods are indexed within one source file, why this is faster than global search for local navigation, and what problem it solves once a class grows beyond a few methods.",
   "STS F3 and IntelliJ Go to Declaration follow a selected symbol to its definition. Trace SpringApplication.run from AeroTopoApplication and explain how declaration navigation uses the resolved symbol rather than matching text, why that matters with overloaded methods or same-named symbols, and how it helps inspect framework APIs safely.",
   "STS Ctrl+Shift+G and IntelliJ Find Usages answer the opposite question from Go to Declaration: they show who depends on a symbol. Use AeroTopoApplication as the target and explain why reviewing callers and references before a rename or signature change reduces refactoring risk across a multi-file enterprise project.",
   "STS content assist and IntelliJ code completion use the current type context to suggest legal APIs. Open completion at the shown location and explain how compile-time type information narrows the suggestions, why this reduces memorization and typing mistakes, and how completion differs from a quick fix that reacts to a diagnosed problem.",
   "STS Ctrl+1 Quick Fix and IntelliJ Alt+Enter are diagnostic-driven actions rather than general completion. Inspect the available intention actions and explain how the caret location and current inspection determine the offered fixes, why blindly accepting an action can still be risky, and when imports or exception fixes are appropriate.",
   "STS formatting and IntelliJ Reformat Code apply configured code-style rules without changing program semantics. Reformat AeroTopoApplication.java and explain why consistent whitespace and layout reduce noisy diffs, how team style settings matter, and why formatting should be separated conceptually from refactoring or functional code changes.",
   "STS Rename and IntelliJ safe Rename operate on symbol identity rather than raw text. Use the preview-only rename flow and explain how IDE usage analysis protects unrelated comments or same-text identifiers, why reviewing the preview is valuable before a project-wide change, and how semantic rename differs from Find Usages alone."
  ],
  14:[
   "The JVM does not execute the Java source text directly. Open AeroTopoApplication.java and explain the boundary between the human-readable .java file and the bytecode eventually executed by the JVM, including which tool performs that translation and why separating compilation from execution matters for Java portability.",
   "Before compiling AeroTopo, confirm the configured Java 21 SDK and language level. Explain how the compiler target influences class-file version and available language features, why a newer or older runtime may reject incompatible bytecode, and how checking the project SDK prevents confusing source-level and JVM-level compatibility problems.",
   "Run the Maven compile phase and focus on the generated target/classes output. Explain what information a .class file contains, why successful compilation must happen before normal JVM execution, and how this step differs from class loading, verification, linking, and initialization that occur later inside the runtime.",
   "Inspect the runtime classpath after compilation. Explain how the JVM uses classpath or module-path information to locate AeroTopo classes and required libraries, what happens when a referenced class cannot be resolved, and why locating bytecode is a separate concern from verifying or executing the bytecode once found.",
   "Inspect the JVM stages for loading, verification, linking, initialization, interpretation, and JIT compilation. Describe the purpose of each stage in order, identify where structural safety checks occur, and explain why frequently executed bytecode may later become native machine code even though the application originally started from portable class files.",
   "Now focus on JVM-managed services rather than the bytecode pipeline. Explain what heap and stack memory, garbage collection, threads, exception handling, and runtime diagnostics contribute while AeroTopo is running, and why these services are responsibilities of the managed runtime rather than extra compilation stages such as loading or JIT compilation.",
   "Run java --version and use the OpenJDK 21 result to distinguish the JVM specification from a concrete runtime implementation. Explain why vendor, version, and implementation details matter when investigating performance, garbage collection, diagnostics, or compatibility issues even though Java bytecode targets the portable JVM model.",
   "Launch AeroTopo through its main class and connect all prior steps into one execution path. Explain how compiled class files are located, loaded, verified, initialized, and executed before Spring Boot continues inside the same process, and what a successful startup proves about the complete source-to-running-JVM workflow."
  ],
  93:[
   "Start from ProjectService.java and inspect its package declaration and imports before creating any demo classes. Explain how a package becomes part of a type's fully qualified identity, why Java does not require every class in an application to have a globally unique simple name, and what this real project baseline establishes for the collision experiment.",
   "Create pkgone.Tile as the first temporary type. Explain the fully qualified name created by package pkgone, why there is no collision while only this Tile exists, and what a caller must import or write explicitly to refer to this exact class from a different package.",
   "Add pkgtwo.Tile with the same simple class name. Explain why pkgone.Tile and pkgtwo.Tile are still distinct legal types, which portion of their names prevents a declaration collision, and why ambiguity appears only when a compilation unit tries to use both classes through the same unqualified simple name.",
   "Create PackageNameCollisionDemo and inspect its mixed naming strategy. Explain why importing pkgone.Tile makes the unqualified Tile refer to that type, why pkgtwo.Tile is written with its fully qualified name, and how this avoids the ambiguity that would result from trying to import both same-simple-name classes normally.",
   "Compile all three temporary files and run PackageNameCollisionDemo. The output is one:two. Explain how that result proves the two Tile objects came from different package-qualified classes, why package namespaces survive into type resolution, and what this demonstrates about using same simple class names safely.",
   "Remove PackageNameCollisionDemo first, after the runtime proof is complete. Explain why deleting the caller does not invalidate the namespace result already observed, why reversing the experiment from dependent caller to type definitions keeps cleanup easy to reason about, and what temporary artifacts still remain at this point.",
   "Remove pkgtwo.Tile next while leaving pkgone.Tile temporarily in place. Explain what namespace relationship disappears with this deletion, why the remaining pkgone.Tile no longer has a same-simple-name competitor in the temporary demo, and how deleting a type definition differs from deleting the caller that referenced it.",
   "Remove pkgone.Tile as the final temporary type. Explain how this restores the project to the state before the namespace experiment, why the demonstrated fully qualified-name rule remains valid even though both demo classes are gone, and why lesson-only package examples should not remain in the cumulative AeroTopo project.",
   "Return to ProjectService.java and summarize the package-collision rule using production structure instead of temporary files. Explain fully qualified type identity, import ambiguity, explicit disambiguation, and how packages provide scalable namespaces for large Java systems while allowing unrelated packages to reuse the same simple class name."
  ]
 };
 if(specials[r.lessonNo]) return specials[r.lessonNo][r.stepNo-1];

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
 const specials={
  11:[
   "Go to File file peru meeda search chestundi; package tree manually expand cheyyalsina avasaram ledu. Ee step file-oriented navigation ni establish chestundi, class/type search next step lo separate ga compare chestam.",
   "Go to Class Java type index ni use chestundi. File search kanna idi class identity meeda focus chestundi; nested types leda type-name navigation kavali ante ee workflow more direct ga untundi.",
   "File Structure current source file lopala fields, constructors, methods list ni chupistundi. Global project search kaadu; already open class lo member ki fast ga jump cheyyadam ee step specific purpose.",
   "Go to Declaration selected symbol resolved definition ki teesukeltundi. Plain text search kanna symbol identity use chestundi, kabatti overloaded methods leda same-name references unna appudu correct declaration ni inspect cheyyachu.",
   "Find Usages declaration nundi reverse direction lo dependents ni chupistundi. Shared symbol refactor mundu callers ekkada unnayo chusi impact scope estimate cheyyadam ee step main engineering value.",
   "Code completion current type context batti available APIs suggest chestundi. Developer memory meeda depend kakunda valid methods discover cheyyachu; diagnostic problem fix cheyyadam మాత్రం next intention-action workflow responsibility.",
   "Alt+Enter current caret diagnostic ki context-specific intention actions istundi. Import, exception, refactor suggestions problem batti marutayi; completion laga general API list kaadu, kabatti action apply mundu reason check cheyyali.",
   "Reformat Code configured style rules ni apply chestundi, program behavior ni మార్చదు. Consistent formatting valla team diffs logic changes meeda focus avutayi; functional refactor tho formatting ni mix cheyyakunda use cheyyadam better.",
   "Safe Rename symbol references ni IDE model tho update chestundi. Raw text replace kanna unrelated occurrences protect avutayi; preview chusi affected usages verify cheyyadam production refactor lo final safety check."
  ],
  14:[
   "AeroTopoApplication.java human-readable source matrame. Compiler ee source ni bytecode unna class file ga convert chestundi; JVM normal execution lo .java text ni direct ga run cheyyadu.",
   "Project Java 21 SDK class-file target and available language features ni decide chestundi. Runtime compatibility discuss cheyyadaniki mundu compile target clear ga undali; wrong JDK setup source and bytecode errors create cheyyachu.",
   "Maven compile successful ayithe target/classes lo .class files generate avutayi. Ee stage source-to-bytecode conversion; class loading leda JIT ఇంకా start kaaledu, kabatti compilation and runtime phases separate.",
   "Classpath JVM ki required application and library classes ekkada search cheyyalo cheptundi. Needed class dorakakapothe resolution/startup fail avvachu; location problem bytecode execution problem kanna different.",
   "JVM first classes load chesi bytecode verify, references link, classes initialize chestundi; taruvata interpretation and hot-code JIT native compilation jaragachu. Ee step execution pipeline order ni establish chestundi.",
   "Heap, stacks, garbage collection, threads, exceptions, diagnostics running program ki managed services. Ivi class-loading stages kaavu; application execute avutunna time lo memory and concurrency lifecycle ni JVM handle chestundi.",
   "java --version machine lo actual OpenJDK runtime ni identify chestundi. JVM specification portable model ayina vendor/version implementation details GC, diagnostics, performance debugging lo important ga marutayi.",
   "AeroTopo launch previous stages anni kalipi prove chestundi: compiled classes locate ayi initialize avvutayi, main invoke avutundi, Spring Boot same JVM process lo continue avutundi. Ee step full execution chain ni close chestundi."
  ],
  93:[
   "ProjectService.java package and imports real namespace baseline ni chupistayi. Java type identity lo package name part kabatti same simple class names different packages lo coexist avvagalavu.",
   "pkgone.Tile first temporary type. Daani full identity pkgone.Tile; second Tile ఇంకా ledu kabatti ambiguity ledu. Vere package caller exact type ni import leda fully qualified name tho refer cheyyali.",
   "pkgtwo.Tile second namespace ni add chestundi. pkgone.Tile and pkgtwo.Tile simple name same ayina full names different; declaration collision ledu, ambiguity caller unqualified Tile ni rendu types kosam use chesthe start avutundi.",
   "PackageNameCollisionDemo pkgone.Tile ni import chesi pkgtwo.Tile ni full name tho use chestundi. Ee mixed notation exact type selection ni explicit ga chestundi and duplicate simple-name imports conflict ni avoid chestundi.",
   "Demo one:two print chestundi. Runtime result rendu Tile objects different package-qualified classes nundi vachayani prove chestundi; package namespace compile-time type resolution ni correct ga separate chesindi.",
   "[no highlight] PackageNameCollisionDemo first remove chestam. Caller delete ayina observed one:two evidence change avvadu; temporary Tile definitions ఇంకా exist chestayi, cleanup dependency order ni simple ga maintain chestam.",
   "[no highlight] pkgtwo.Tile remove chesthe second temporary namespace disappear avutundi. pkgone.Tile matrame remain kabatti same-simple-name competition ఇక ఉండదు; idi caller cleanup kaakunda type-definition cleanup.",
   "[no highlight] pkgone.Tile final temporary type ni remove chesi experiment complete chestam. Project original state ki return avutundi; fully qualified names collision ni avoid chestayi ane verified rule మాత్రం remain avutundi.",
   "ProjectService.java ki return ayyi production package structure tho lesson ni close chestam. Final answer lo full type identity, import ambiguity, explicit disambiguation, scalable namespace purpose ni separate points ga explain cheyyali."
  ]
 };
 if(specials[r.lessonNo]) return specials[r.lessonNo][r.stepNo-1];

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
