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
- Blue action guidance comes from the master highlighter, must target only the precise action/control, uses the stronger glow, ignores premature clear messages, and remains visible for the full five-second notice window.

Lesson 1 is the initial pilot used to validate the UI contract, explanation box, blue guidance, cumulative replay, direct step navigation, and Full Code behavior before scaling the curriculum.

## #Q1 info-box contract

Each lesson keeps the original source interview question through `question_id`, while every simulator step supplies a different knowledge-bearing English `question` and a Telugu-in-English-font `why_te`. The player renders `Question → unique English step question → Telugu-in-English-font explanation`. Intermediate steps carry an empty answer and therefore show no Answer UI. The final step carries the complete English lesson `answer` and `answerBox: true`, which activates the existing global Answer box without creating a second explanation component.