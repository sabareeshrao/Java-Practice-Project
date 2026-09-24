# Contributing

A useful contribution improves real GIS behavior or connects an interview question to verifiable code.

1. Find a question in QUESTION_INDEX.html or interview/questions.json.
2. Read its existing evidence and docs/COVERAGE.md.
3. Open a branch, normally codex/<short-description> or feature/<short-description>.
4. Implement the smallest coherent domain feature or runnable laboratory experiment.
5. Add a meaningful test when behavior changes. Assert expected results independently.
6. Add or refine the question mapping with a file and an exact method, class, configuration key, or documentation heading.
7. Regenerate the index using python tools/build_question_index.py.
8. Run Maven verification and python tools/build_question_index.py --check.
9. Describe the behavior, question IDs, verification performed, and limitations in your pull request.

## Evidence standards

- **Direct code**: the referenced implementation demonstrates the question's specific concept.
- **Related code**: useful context, but the full requested behavior is not implemented.
- **Procedure**: a concrete runbook, decision, configuration, or collaboration exercise.
- **Version lab**: executable source requiring a stated JDK/toolchain outside the default build.
- **Missing**: no adequate evidence yet.

Do not turn related code into direct coverage by changing only a label. An explanation is valuable but cannot replace requested working code. Unsupported tool integrations must remain explicitly unverified.

Questions that ask about an impossible Java declaration can use JavaCompiler tests that assert compilation fails; production sources must remain valid. Behavioral questions should use an honest project exercise and actual evidence, not fabricated company stories.

## Adding a mapping

The mapping file is keyed by the original S.No. Use stable source anchors, not manually maintained line numbers. The generator resolves anchors into the current source and builds clickable local source views. If the anchor disappears, generation must fail rather than silently point elsewhere.

Keep original question wording and provenance. More than one question may share the same evidence only when that code actually demonstrates each concept. Add a short, question-specific explanation for comparisons and edge cases.

## Domain correctness

x/y and area calculations use a documented projected CRS in metres. GeoJSON uses WGS84 longitude/latitude; never export UTM metres under a GeoJSON label. Reject NaN/infinity, mixed CRSs, invalid polygons, duplicate IDs, and unsupported states. Independently measured checkpoints must remain separate from modeled ground points.

Protect persistence consistency with transactions and concurrency tests. Avoid logging credentials outside the local startup configuration, importing private résumé information, or committing generated database files.

## Pull request checklist

- Problem, behavior, and question IDs are identified.
- Code runs; it is not pseudocode or an empty placeholder.
- Relevant tests and link checks pass.
- Integration prerequisites and unexecuted checks are disclosed.
- PROJECT_CONTEXT.md and coverage documentation reflect material changes.
