# AeroTopo simulation curriculum

This folder is project-owned curriculum for the downstream Developer Playback site.

Rules:

- There are 2,308 source interview questions.
- The target is exactly one lesson per source question.
- A lesson may contain multiple simulator steps.
- A chapter may contain **at most 5 lessons**. A sixth lesson must start a new chapter; the build rejects chapters above this limit to avoid excessive sidebar scrolling.
- Every simulator step must define its own unique `question` using the **#Q1** style: that step's question first teaches the relevant concept/context and then asks the learner to reason about it.
- Step questions must be unique across the published curriculum. Duplicate step-question text is a build error.
- Every lesson must set `info_language` to `te-Latn` for the explanatory text.
- Every step question remains **English** and follows the unique **#Q1** teaching-question style.
- Each step must provide `why_te` in Telugu written with English characters; this is the explanatory/info text shown below the English question.
- The generated info box renders `English question → Telugu-in-English-font explanation`.
- The Answer UI is hidden on all intermediate steps and receives the complete lesson answer only on the final step. The interview Answer block remains English.
- Question text is resolved from `interview/questions.json`; lesson JSON references the source question ID instead of rewriting it.
- IntelliJ IDEA is the only IDE used for this project. Eclipse and VS Code are forbidden lesson software IDs.
- Other non-IDE tools may be introduced only when a question genuinely requires them.
- Production code is changed only when a question exposes a legitimate project improvement. Otherwise use inspect/demo/procedure/version-lab behavior.
- The real repository is the Full Code reference. The normal lesson timeline represents the cumulative project state at that point in the learning journey.
- Simulator/runtime fixes belong in `sabareeshrao/Experiment-VS-Code`, not here.
- Visual guidance comes from the master highlighter. Every step must declare an explicit highlight contract; controls use a precise blue boundary, code uses a readable line highlight, and terminal commands use their native command focus. Guidance is applied after replay completes so it cannot be erased by the new step.

Lesson 1 is the initial pilot used to validate the UI contract, explanation box, blue guidance, cumulative replay, direct step navigation, and Full Code behavior before scaling the curriculum.

## #Q1 info-box contract

Each lesson keeps the original source interview question through `question_id`, while every simulator step supplies a different knowledge-bearing English `question` and a Telugu-in-English-font `why_te`. The player renders `Question → unique English step question → Telugu-in-English-font explanation`. Intermediate steps carry an empty answer and therefore show no Answer UI. The final step carries the complete English lesson `answer` and `answerBox: true`, which activates the existing global Answer box without creating a second explanation component.

## Visible-state rule

A simulator step must not intentionally open an empty software surface when the concept requires visible evidence. The downstream seed package includes minimal realistic state needed by early lessons; for example, the Spring seed state contains the AeroTopo application, representative beans, mappings, and application properties so Spring-tool-window lessons render meaningful content.

## Step 1 question-length floor

The English #Q1 text in global Lesson 1 / Step 1 is the minimum detail baseline for every simulator step question. The current baseline is **39 words**. Questions may be longer but may never be summarized below that baseline. The generator reads the live Lesson 1 / Step 1 question and rejects any shorter step question automatically.

## Question cleanliness

The 39-word minimum is a detail floor, not a padding target. Questions must gain length through step-specific technical context. Repeated filler such as "In the cumulative AeroTopo learning project..." is forbidden and rejected by the generator.

## IntelliJ UI fidelity

Every lesson batch must be authored against the latest compatible validated master IntelliJ feature catalog. Prefer specific rich P0/P1 surfaces such as real Search/Go To results, Find Usages, refactoring preview, Maven lifecycle/dependencies/profiles, Spring Services/Beans/Mappings, upgraded editor/project tree, and first-class terminal metadata instead of older generic fallback surfaces.
## Option B explanation style

Every `why_te` uses **Option B — Very easy learner style**.

- Telugu is written in English letters.
- Standard technical terms stay in English.
- Use short sentences and one idea at a time.
- Normally use 2–3 sentences.
- Keep explanations between **15 and 55 words**.
- Do not use lecture-style coaching, forced translations, motivational filler, or artificial padding.
- Repeated simple explanations are allowed when the same UI concept genuinely repeats; do not make wording complex just to force uniqueness.
- The living readable corpus is `simulation/OPTION_B_EXPLANATION_TEXTS.md`; future lesson batches must append their new explanation text there.

## Playback file coverage

Every baseline project file referenced by a lesson must be included in the generated IntelliJ seed. Files introduced by `createFile` remain lesson-created and must not be pre-seeded. Generation validates the replay order and fails if an open/highlight/edit action would target a missing file.

## Highlight stability

Line-based `highlightTarget` actions should carry `expected_text`. Generation verifies the current line still contains that text so project edits cannot silently move a lesson highlight onto unrelated code.
## Mandatory highlight contract

Every lesson step must include `highlight` with one of `auto`, `code`, `target`, or `none`.

- Use `code` for the exact source lines being discussed. Opening the right file without highlighting the relevant line is not sufficient.
- Use `target` for a precise UI control, row, dialog, tool window, result, field, or tab.
- Use `auto` only when the master can resolve a precise native target after the action completes.
- Use `none` only when no software-owned visual target exists; provide a reason and start `why_te` with `[no highlight]`.

The generator rejects steps without this contract. If an automatic target fails at runtime, the master explanation card visibly marks the step with `[no highlight]` instead of pretending that something was highlighted.

Code focus must keep the readable left side of the editor visible. Next/Previous/Replay must not push horizontal scroll to the far right.
