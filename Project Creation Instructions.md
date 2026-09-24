# Project Creation Instructions

## Purpose

Use this file as the operating contract for creating a new question-driven software-learning project from:

1. an **empty target GitHub repository**,
2. an **existing/original software project** that becomes the cumulative codebase,
3. a **question corpus** in JSON, spreadsheet, text, or another supplied source,
4. the reusable software-simulator master repository:
   `https://github.com/sabareeshrao/Experiment-VS-Code`.

The goal is to make project creation repeatable. A new AI should be able to read this file, inspect the supplied repositories/files, and build a requested lesson range such as Lessons 1–5 without needing prior chat history.

---

## 1. Required input from the user

Before building, identify these four inputs:

- **Target repository** — usually an empty/new GitHub repository that will host this project's curriculum, source code, simulator adapter, and its own GitHub Pages deployment.
- **Original project** — the real project/codebase that must be preserved and progressively enhanced rather than rebuilt as a toy example.
- **Question source** — the complete ordered question corpus. Preserve the original questions exactly in source metadata.
- **Requested lesson range** — for example: Lessons 1–5, Lesson 300, or Lessons 1500–1504.

If one of these is missing and cannot be found in the repository, ask only for that missing input.

---

## 2. Repository architecture

There are two layers.

### A. Master software/runtime repository

Canonical master:

`sabareeshrao/Experiment-VS-Code`

The master owns reusable simulator/runtime behavior:

- player shell,
- library/landing UI,
- navigation,
- explanation box runtime,
- action highlighter,
- focus-follow scrolling,
- layout persistence,
- replay/seek logic,
- IntelliJ simulator,
- Postman/database/Git/terminal/etc. simulators,
- action contracts,
- detailed capability catalogs,
- simulator validation,
- shared UI upgrades.

Do **not** copy or fork simulator code into a downstream project just to customize a lesson.

If a lesson requires a simulator capability that genuinely does not exist, upgrade the relevant simulator in the master repository first, validate it there, then pin the downstream project to the new validated master commit.

### B. Downstream project repository

Each project has its **own repository and its own GitHub Pages site**.

The downstream repository owns:

- original project source,
- question corpus/index,
- books/chapters/lessons,
- lesson JSON,
- project-specific seed state,
- cumulative project data,
- adapter/generator scripts,
- exact master runtime reference,
- deployment workflow.

The downstream project must consume a **specific validated master commit**, not an unpinned moving branch.

Use a root file:

`MASTER_SOFTWARE_REF`

Example:

```text
sabareeshrao/Experiment-VS-Code@<validated-commit-sha>
```

---

## 3. First-time bootstrap procedure

When the target repository is empty:

1. Fetch the latest state of the empty target repo.
2. Import the supplied original project into the target repo without deleting valid source, tests, configuration, documentation, migrations, deployment assets, or build files.
3. Exclude personal/temp/generated artifacts such as IDE caches, build output, local databases, secrets, binaries, and machine-specific state.
4. Add the complete question source in a stable machine-readable form.
5. Build a question index with stable IDs.
6. Add `MASTER_SOFTWARE_REF` pinned to a validated master commit.
7. Add a downstream Pages workflow that:
   - checks out the downstream repo,
   - resolves the exact master commit,
   - checks out/copies the reusable runtime,
   - runs the downstream lesson/project-data generator,
   - validates,
   - deploys to the downstream repo's own GitHub Pages site.
8. Add `simulation/course.json`.
9. Add `simulation/lessons/`.
10. Add a generator such as `scripts/build-player-data.py`.
11. Build the requested initial lesson range.
12. Validate before pushing.

Do not invent a parallel player architecture when the master runtime already supports the required behavior.

---

## 4. Curriculum hierarchy

The canonical learning hierarchy is:

```text
BOOK
  └── CHAPTER
        └── LESSON
              └── STEPS
```

Rules:

- **One source interview question = one lesson.**
- A lesson may contain many simulator steps.
- **Maximum 5 lessons per chapter.**
- If a chapter already contains 5 lessons, the next lesson starts a new chapter.
- This limit is mandatory because the sidebar must remain easy to scan without excessive scrolling.
- The build/generator must reject a chapter containing more than 5 lessons.
- Books group logically related chapters.
- Do not embed hardcoded lesson/question numbers inside the natural-language question text. Keep numbering as metadata/UI.

Example:

```text
Chapter 1
├── Lesson 1
├── Lesson 2
├── Lesson 3
├── Lesson 4
└── Lesson 5

Chapter 2
├── Lesson 6
├── Lesson 7
├── Lesson 8
├── Lesson 9
└── Lesson 10
```

---

## 5. Source-question fidelity

The supplied question corpus is authoritative.

For every lesson:

- preserve the original question exactly in the question source/index,
- link the lesson by stable `question_id`,
- do not silently rewrite the source question,
- do not skip questions unless the user explicitly asks,
- do not duplicate a source question into multiple lessons,
- do not repeat previously used questions,
- remain within the scope of the supplied question/transcript/source unless expansion is explicitly requested.

If a source question mentions another IDE, product, or concept, preserve that source wording in metadata, but follow this project's simulator policy when performing actions.

---

## 6. IntelliJ-only Java IDE policy

For Java development lessons in this project style:

- **IntelliJ IDEA is the only Java IDE used in simulator actions.**
- Do not route Java-development steps to Eclipse.
- Do not route Java-development steps to VS Code.
- If a source interview question asks “Eclipse, IntelliJ, or another IDE?”, answer the conceptual comparison as needed, but demonstrate the actual project workflow in IntelliJ.
- Other non-IDE tools may be used only when the lesson genuinely requires them.

The downstream generator should reject forbidden Java IDE routes.

---

## 7. #Q1 step-question contract

Every simulator step must have its **own unique knowledge-bearing question**.

A good step question:

1. teaches the relevant concept/context first,
2. then asks the learner to reason about the exact action being shown,
3. is specific to that step,
4. is not copied from another step.

Example shape:

```text
Maven gives the project a reproducible build model for dependencies,
plugins, testing, and packaging.

Why should you inspect pom.xml before changing a dependency version?
```

Do not use one lesson-level question repeated across every step.

### Step 1 word-count floor

Global Lesson 1 / Step 1 establishes the minimum detail level for every step question. Its current question is **39 words**, so:

- no existing or future step question may contain fewer than 39 words unless Step 1 itself is deliberately expanded later,
- longer questions are accepted and encouraged when the concept needs more context,
- never shorten or summarize a step question merely to make the UI text smaller,
- when an existing question is below the baseline, preserve its useful wording and **add instructional context before it** rather than deleting detail,
- the generator must calculate the baseline directly from Lesson 1 / Step 1 and reject any question below that live baseline,
- if Lesson 1 / Step 1 is later expanded, the new larger word count automatically becomes the new minimum for every lesson.

The generator must fail when:

- a step question is missing,
- two step questions are identical after normalization,
- a lesson answer is missing,
- required explanation text is missing.

---

## 8. Explanation-box contract

The current explanation-box style is mandatory.

For **every step**:

### Question

The step question is written in **English**.

### Explanation/info text

The explanatory text below the question is written in **Telugu using English letters** (Telugu transliteration).

Example:

```text
Question

Why should Maven remain the build authority even when IntelliJ can build the project?

Maven project build ni IntelliJ ki matrame depend kakunda
portable mariyu repeatable ga chestundi. Local machine mariyu
CI rendu ade build model ni use cheyyagalavu.
```

### Answer box

- Intermediate steps: **no Answer UI at all**.
- Final step of the lesson: show the existing global **Answer** block.
- The final interview answer must be **English**.
- Do not create a second/local explanation component.
- Use the single global explanation component provided by the master runtime.

Recommended lesson JSON fields:

```json
{
  "info_language": "te-Latn",
  "answer": "Complete English interview answer...",
  "steps": [
    {
      "question": "Unique English #Q1 step question...",
      "why_te": "Telugu explanation written with English characters..."
    }
  ]
}
```

Generated step behavior:

```text
Question → English
Explanation → Telugu in English letters
Final Answer → English
```

---

## 9. Explanation-box visual behavior

Never replace the master explanation box.

It must remain:

- globally identical across simulators,
- stable while content changes,
- dynamically sized to content,
- draggable,
- minimizable,
- closable,
- persistent,
- readable without clipping,
- non-shaky,
- answer displayed below the explanation,
- no hardcoded fixed height that hides text.

Do not introduce:

- full-screen blue overlays,
- giant focus masks,
- a second explanation card,
- product-specific explanation implementations.

---

## 10. Blue action guidance

Use the master shared highlighter.

Current interaction requirement:

- blue guidance targets only the precise relevant control, row, file, or action,
- the lighting must be clearly visible,
- it must remain visible for the full **5-second notice window**,
- premature clear messages must not make it disappear after ~1 second,
- new actions may replace the previous highlight,
- the highlight must never block navigation.

Do not reimplement this behavior downstream. Update the master highlighter if it needs improvement, validate master, then update `MASTER_SOFTWARE_REF`.

---

## 11. Master capability lookup before authoring actions

Never guess simulator actions.

For a target software:

1. Read the master `AI_CAPABILITY_INDEX.json`.
2. Treat it only as a router/summary.
3. Open that software's detailed feature catalog.
4. Open the relevant individual feature JSON.
5. Confirm:
   - capability ID,
   - canonical action,
   - expected `action.data`,
   - visible UI behavior,
   - replay behavior.
6. Inspect the engine handler when necessary.
7. Only then author the downstream lesson action.

For IntelliJ, typical existing actions include:

- `openProject`
- `openFile`
- `highlightTarget`
- `typeCode`
- `showExternalLibraries`
- `openIntegratedTerminal`
- `typeTerminal`
- `openMavenToolWindow`
- `runMavenGoal`
- `openSpringToolWindow`
- `showSpringBeans`
- `showSpringMappings`
- `openGitToolWindow`
- `searchEverywhere`
- `gotoFile`
- `gotoClass`
- `gotoSymbol`
- `gotoDeclaration`
- `findUsages`
- `findInFiles`
- `showFileStructure`
- `showQuickDocumentation`
- `showIntentionActions`
- `showCompletion`
- `showParameterInfo`
- `renameSymbol`
- `formatCode`
- `optimizeImports`
- debugger/JUnit/JPA/Security/REST/Git/Maven/Gradle actions already exposed by the master.

If the exact action exists, reuse it.

If the lesson requires a UI/behavior that does not exist, do **not** fake it with unrelated actions. Upgrade the master simulator.

---

## 12. Use the original project, not toy replacements

The original project is the cumulative codebase.

Rules:

- preserve valid existing architecture,
- improve it only when a lesson genuinely requires a change,
- do not create parallel toy classes merely to demonstrate concepts when the concept can be taught through the real project,
- do not delete working project code to simplify a lesson,
- do not replace full project files with tiny mock versions,
- keep tests/config/migrations/build files coherent.

A lesson can have:

`project_impact: "none"`
- inspection/explanation only,
- no permanent project change.

`project_impact: "temporary"`
- demonstration change,
- revert it before the lesson ends if the real project does not need it.

`project_impact: "permanent"` or a build mode equivalent
- genuine project evolution,
- later lessons inherit the change.

---

## 13. Cumulative continuity is mandatory

The project must feel like one codebase being developed over time.

If Lesson 5 adds code to a file, Lesson 500 must be able to open the **same evolved file** and see all permanent code accumulated in between.

Conceptually:

```text
Lesson 5
ProjectService.java
~ line 26

        ↓ permanent changes continue

Lesson 100
ProjectService.java
~ line 250

        ↓

Lesson 500
ProjectService.java
~ line 1200
```

When Lesson 500 focuses or types near the current working location:

- auto-scroll to the active code,
- keep the typing/highlight visible,
- allow the user to scroll upward manually,
- earlier permanent code must still be present.

The current master replay model reconstructs state by replaying prior actions for the target simulator.

Do not author lessons as isolated snapshots that forget earlier permanent edits.

---

## 14. Prefer semantic anchors over fragile line numbers

Line-number targeting is acceptable for stable inspection steps, but long-lived build lessons should increasingly target semantic anchors.

Prefer concepts such as:

```text
file = ProjectService.java
class = ProjectService
method = validateSurveyPoints
anchor = "validateSurveyPoints"
```

rather than assuming the method will forever remain at line 820.

As the project grows, earlier edits can shift later line numbers.

The desired future behavior is:

```text
find semantic anchor
→ resolve current location
→ scroll into view
→ highlight
→ type/edit relative to that code
```

---

## 15. Checkpoint strategy for very large curricula

For small lesson counts, cumulative replay from the beginning is acceptable.

For hundreds/thousands of lessons, add periodic cumulative checkpoints so opening a late lesson does not require replaying thousands of actions.

Recommended model:

```text
Lessons 1–50
→ checkpoint 50

Lessons 51–100
→ checkpoint 100

...

checkpoint 1450
+ replay Lessons 1451–1500
→ Lesson 1500 state
```

A checkpoint is a deterministic cumulative project/simulator snapshot, not a replacement for source history.

Do not sacrifice visible continuity to gain speed.

---

## 16. Auto-typing and focus-follow behavior

Whenever a lesson types or edits code:

- keep the active caret/code under view,
- scroll smoothly,
- do not let typing happen below/behind the visible viewport,
- highlight the newly typed region,
- do not shake the editor,
- allow the user to scroll afterward,
- preserve previously built code above/below.

Terminal commands should similarly remain visible while being typed/executed.

---

## 17. Prevent empty steps

A step is not valid merely because an action technically fires.

Before publishing, verify the action creates meaningful visible state.

Bad:

```text
Open Spring Tool Window
→ pane opens
→ pane contains nothing
```

Good:

```text
Open Spring Tool Window
→ AeroTopo application visible
→ representative beans/mappings/properties visible
```

If a lesson requires data in a tool window, seed the **minimum realistic project state** needed for that view.

Do not fabricate unrelated state.

Add/maintain a visible-state rule in the project generator so known lesson surfaces are meaningful.

---

## 18. Full Code behavior

The player may provide a separate **Full Code** view.

Full Code should represent the actual complete project files, not the tiny lesson seed package.

Normal lesson playback:

- optimized cumulative simulator state,
- reconstructs relevant lesson history.

Full Code:

- packages the real current downstream project,
- allows browsing the entire codebase,
- is not a substitute for cumulative lesson continuity.

---

## 19. Software UI upgrades

Before releasing a new batch of lessons:

1. Check the master repository's latest commits.
2. Determine whether new simulator/UI improvements have landed.
3. Verify the relevant master workflows/tests.
4. If the new master is validated and compatible, update the downstream exact master ref.
5. If the new master breaks an established requirement, merge/fix the behavior in master first.
6. Never silently pin downstream to a master commit with failing simulator validation.

Important: master UI upgrades should improve existing canonical actions rather than forcing every downstream lesson JSON to be rewritten.

Example:

```text
searchEverywhere action
       ↓
master upgrades Search Everywhere UI
       ↓
old and new lessons automatically look better
```

---

## 20. Git concurrency and safe-write rules

Never overwrite concurrent work.

Before any write:

1. fetch current target `main`,
2. remember its exact SHA,
3. prepare the change,
4. re-fetch `main` immediately before updating the ref,
5. if `main` moved, stop and reconcile,
6. never force-push.

For master simulator changes, use the same rule.

Never claim something was pushed, deployed, fixed, live, or green until the exact commit/run has been verified.

---

## 21. Validation required before calling a lesson batch complete

For every batch:

### Curriculum validation

Check:

- requested lesson IDs exist,
- source `question_id` matches,
- no duplicate lesson IDs,
- no duplicate source questions,
- every step question is unique,
- every step question meets or exceeds the live Lesson 1 / Step 1 word-count baseline (currently 39 words),
- English question present,
- Telugu-in-English-font explanation present,
- English final answer present,
- Answer appears only on the final step,
- chapter contains no more than 5 lessons,
- forbidden Java IDEs are not used.

### Action validation

Check:

- every required capability exists in the master detailed catalog,
- every action is canonical,
- action data matches engine expectations,
- each action has meaningful visible UI,
- no intentionally empty panels,
- auto-focus works for code/terminal actions.

### Project validation

Check:

- permanent project changes compile,
- tests pass,
- no accidental temporary/demo dependencies remain,
- original project architecture is preserved,
- cumulative continuity remains valid.

### Deployment validation

Check exact workflow results:

- downstream simulation generation,
- Maven/Gradle project verification as applicable,
- question-index verification,
- GitHub Pages build,
- GitHub Pages deploy.

For master changes additionally verify:

- repository validator,
- relevant browser test,
- shared highlighter test,
- simulator package workflow,
- master Pages deployment when applicable.

---

## 22. Lesson-batch workflow

When the user says:

`Build Lessons 1–5`

perform this sequence:

```text
1. Fetch current target main
2. Read this instruction file
3. Read MASTER_SOFTWARE_REF
4. Inspect current master state/history
5. Load exact source Questions 1–5
6. Inspect original project state
7. Inspect existing course/chapters/lessons
8. Read required master capability JSON files
9. Design each lesson as multiple meaningful simulator steps
10. Give every step a unique English #Q1 question
11. Write why_te for each step
12. Keep final interview answer in English
13. Put full answer only on each lesson's last step
14. Keep max 5 lessons in the chapter
15. Preserve/replay cumulative permanent project state
16. Prevent empty UI surfaces
17. Build/generate player data
18. Run project validation/tests
19. Re-fetch main
20. Commit without force
21. Push/update main
22. Verify exact workflows
23. Report commit + lesson/step totals + validation status
```

Do not stop after merely drafting JSON if repository write access is available and the user explicitly said to proceed.

---

## 23. Random future lesson / parallel branch workflow

It is valid to build Lesson 300 or Lesson 1500 on a branch before every earlier lesson has been authored, but do it safely.

Process:

```text
current main
    ↓
create/use lesson-specific branch
    ↓
read source question
    ↓
read project history and existing milestones
    ↓
identify prerequisites
    ↓
build lesson without inventing missing cumulative state
    ↓
validate
    ↓
commit to branch
```

If the future lesson depends on project code that earlier unpublished lessons are expected to create:

- do not pretend that state exists,
- either make the future lesson an isolated inspect/demo/procedure where appropriate,
- or record/implement a clear prerequisite before eventual merge.

Before merging the branch later:

```text
fetch latest main
→ reconcile preceding project state
→ rebase/update
→ confirm semantic anchors/current files
→ validate
→ merge
```

---

## 24. New-project instruction prompt

After this file exists in a repo, the user should be able to give a fresh AI a short instruction like:

```text
Read "Project Creation Instructions.md" completely and follow it as the project contract.

Target empty repo:
<URL>

Original project:
<URL or uploaded ZIP>

Question source:
<URL/file>

Build:
Lessons 1–5

Proceed through implementation, commit, push, and exact workflow verification.
Do not ask me to repeat rules already defined in the instruction file.
```

That should be enough for normal project creation.

---

## 25. Non-negotiable behavior summary

Always preserve these rules:

- original project stays the cumulative real project,
- one source question = one lesson,
- maximum 5 lessons per chapter,
- every simulator step has a unique English #Q1 question that is never shorter than the Lesson 1 / Step 1 baseline,
- explanation beneath the question is Telugu written in English letters,
- only the final step gets the English Answer block,
- IntelliJ only for Java IDE actions,
- reuse canonical master actions,
- missing simulator behavior is fixed upstream in master,
- exact validated master commit is pinned downstream,
- blue action guidance stays visible for the full 5-second notice window,
- auto-typing follows the active code/terminal area,
- permanent edits remain visible in later lessons,
- temporary demonstrations are reverted,
- no empty UI steps,
- no duplicated questions,
- no force pushes,
- no unverified claims of success,
- latest compatible validated master UI upgrades are consumed before releasing a lesson batch.

The finished curriculum should leave the original project progressively **upgraded, enhanced, expanded, and fully validated**, while retaining a traceable lesson-by-lesson development history.