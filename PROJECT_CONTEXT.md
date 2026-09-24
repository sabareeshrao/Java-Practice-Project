# AeroTopo: project context for developers and AI contributors

## What we are building

A working Java GIS and aerial surveying operations application with a learning path from year 1 to year 5. The central requirement is traceability: a learner opens any interview question, follows a link to actual source lines, and runs the relevant implementation or test.

The user supplied **Java 2000.xlsx**, containing 2,008 main questions and 300 Additional questions. Preserve all 2,308 question IDs, original wording, sheet names, and row numbers. The Topic Map sheet is metadata, not 919 extra questions.

The supplied Java developer PDF informs the domain: project tracking, aerial datasets, validation, QA, reporting, and delivery operations. It is a personal résumé. Do not commit the PDF, contact details, or a copied résumé. This is a new educational project, not proof of historical employment, throughput, or business savings.

## Domain and implementation

AeroTopo tracks a survey through PLANNED, INGESTED, PROCESSING, QA_READY, APPROVED, and DELIVERED. A failed validation enters FAILED. CSV imports contain ground observations with IDs, x/y/z in metres, and a projected coordinate system. Independent checkpoints drive vertical RMSE and approval eligibility.

The primary build uses Java 21, Spring Boot, Spring MVC, Spring Security, JPA, JDBC, Flyway, H2 locally, PostgreSQL optionally, JTS geometry, and Maven. Domain code and interview experiments are real compiled Java. Supplementary labs exercise language/runtime behavior that does not belong in the HTTP request path.

This application manages survey operations and performs selected terrain calculations. It does not reconstruct a photogrammetric orthomosaic from aerial imagery or claim a full GIS processing engine.

## Reading order

1. README.md: run commands and the end-to-end workflow.
2. docs/LEARNING_PATH.md: five progressive stages and exercises.
3. QUESTION_INDEX.html: central searchable question navigation.
4. interview/questions.json: source question inventory.
5. interview/mappings.json: editable evidence mappings.
6. docs/COVERAGE.md: measured implementation coverage and unresolved questions.
7. CONTRIBUTING.md: contribution and verification rules.

Some of these files are generated during the initial build. The coverage report, not this outline, is the source of truth for completed mappings.

## Architecture boundaries

- domain: values, invariants, workflow states.
- gis: projected geometry, interpolation, flight planning.
- io: strict input/output contracts.
- persistence: relational entities, repositories, SQL.
- service: transactions, workflow authorization boundaries, delivery outbox.
- api: validated DTOs, HTTP endpoints, errors.
- config / ops: security, profiles, executors, metrics, diagnostics.
- learning: executable experiments for interview concepts.
- src/test: numerical, transaction, authorization, and language evidence.
- labs: optional version/toolchain experiments outside the Java 21 build.

Keep decisions explicit. A JDBC implementation does not demonstrate Hibernate behavior; an in-process event is not Kafka; a file list is not an object-store integration. Do not label a related file as full coverage of an unrelated question.

## Work remaining and contribution priorities

The initial implementation is in progress. Audit docs/COVERAGE.md after generation. Highest priority: precise per-question mappings and tests, distributed integration verification, modern JDK labs, framework-specific examples, and the five-year learning narrative.

No source link should imply that an unimplemented feature exists. Mark evidence as direct code, related code, procedure, version-specific lab, or missing. A listed question is not necessarily an implemented question.

## Rules for future AI work

Read this file and CONTRIBUTING.md first. Inspect the current repository and test results; do not assume this note means every planned feature is complete. Preserve user source wording. Add implementations with explicit inputs, outputs, error paths, and tests. Regenerate line mappings after changes and inspect their targets. Never fill coverage by assigning every question in a module to the same broad class.

Update this note when architecture or scope changes. Keep docs/COVERAGE.md accurate about tested and untested integrations. Contributions are welcome even when they improve one question, one test, one bug, or one explanation.
