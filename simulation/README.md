# AeroTopo simulation curriculum

This folder is project-owned curriculum for the downstream Developer Playback site.

Rules:

- There are 2,308 source interview questions.
- The target is exactly one lesson per source question.
- A lesson may contain multiple simulator steps.
- Question text is resolved from `interview/questions.json`; lesson JSON references the source question ID instead of rewriting it.
- IntelliJ IDEA is the only IDE used for this project. Eclipse and VS Code are forbidden lesson software IDs.
- Other non-IDE tools may be introduced only when a question genuinely requires them.
- Production code is changed only when a question exposes a legitimate project improvement. Otherwise use inspect/demo/procedure/version-lab behavior.
- The real repository is the Full Code reference. The normal lesson timeline represents the cumulative project state at that point in the learning journey.
- Simulator/runtime fixes belong in `sabareeshrao/Experiment-VS-Code`, not here.

Lesson 1 is the initial pilot used to validate the UI contract, explanation box, blue guidance, cumulative replay, direct step navigation, and Full Code behavior before scaling the curriculum.
