# AeroTopo simulation curriculum

This folder is project-owned curriculum for the downstream Developer Playback site.

Rules:

- There are 2,308 source interview questions.
- The target is exactly one lesson per source question.
- A lesson may contain multiple simulator steps.
- Every lesson must define a `learning_question` using the **#Q1** style: the question itself first teaches the key concept/context and then asks the learner to reason about it.
- The generated info box prepends that `learning_question` to the existing step explanation on every step.
- The Answer UI is hidden on all intermediate steps and receives the complete lesson answer only on the final step.
- Question text is resolved from `interview/questions.json`; lesson JSON references the source question ID instead of rewriting it.
- IntelliJ IDEA is the only IDE used for this project. Eclipse and VS Code are forbidden lesson software IDs.
- Other non-IDE tools may be introduced only when a question genuinely requires them.
- Production code is changed only when a question exposes a legitimate project improvement. Otherwise use inspect/demo/procedure/version-lab behavior.
- The real repository is the Full Code reference. The normal lesson timeline represents the cumulative project state at that point in the learning journey.
- Simulator/runtime fixes belong in `sabareeshrao/Experiment-VS-Code`, not here.

Lesson 1 is the initial pilot used to validate the UI contract, explanation box, blue guidance, cumulative replay, direct step navigation, and Full Code behavior before scaling the curriculum.

## #Q1 info-box contract

Each lesson keeps the original source question through `question_id`, but also supplies a knowledge-bearing `learning_question`. The player renders `Question → learning_question → existing step explanation`. Only the final step carries `answer`, which activates the existing global Answer box without creating a second explanation component.
