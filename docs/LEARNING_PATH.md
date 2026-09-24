# Five-year Java developer learning path

The years are progressive project stages, not a claim of employment or measured professional tenure. The current repository contains the combined implementation. Follow the stages in order; use Git branches for your exercises.

| Stage | Survey work | Java depth | Evidence |
|---|---|---|---|
| Year 1 | Capture and validate survey observations | variables, methods, classes, arrays, exceptions, collections, CSV, JDBC | SurveyPoint, PointCsv, LanguageLab, SurveyProducts, JdbcLab |
| Year 2 | Deliver a transactional backend | Spring IoC, MVC, DTO validation, JPA, Flyway, tests, HTTP | ProjectService, ProjectController, repositories, SurveyWorkflowTest |
| Year 3 | Operate a shared QA portal | role authorization, CSRF/JWT, dashboard, caches, metrics, audit history | SecurityConfig, app.js, ServiceMetrics, ApiSecurityTest |
| Year 4 | Process work concurrently and integrate systems | virtual threads, bounded queues, futures, locks, HTTP resilience, delivery outbox, Kafka adapter | ConcurrencyLab, WeatherClient, OutboxPublisher |
| Year 5 | Own reliability and technical decisions | profiling, scaling, deployment, incident response, migrations, architecture, review practices | RUNBOOK.md, ARCHITECTURE.md, Dockerfile, CI, contribution workflow |

## Year 1 exercise

Run TerrainEngineTest and LearningLabTest. Inspect SurveyPoint's immutable value semantics. Import the sample CSV. Change a coordinate to NaN and observe rejection. Use the debugger to follow constructors, collection deduplication, checked exceptions, and prepared statements.

Deliverable: a new terrain validation rule with an independently calculated expected result.

## Year 2 exercise

Run the application and create a project. Import points, then run QA. Follow controller → service → persistence and back. Submit an old version and inspect the conflict response. Cause invalid input after an attempted transition and verify transaction rollback.

Deliverable: an API endpoint with a DTO, service invariant, migration if needed, and integration test.

## Year 3 exercise

Sign in as processor, reviewer, and manager using different browser sessions. Observe authorized and forbidden actions. Inspect CSRF requests in the browser network panel. Compare local session authentication with the optional JWT profile.

Deliverable: a usable reporting feature with authorization and request validation tests.

## Year 4 exercise

Run concurrency tests. Bound processing capacity before task submission. Explain why virtual threads do not increase CPU capacity. Stop a delivery transport in a test and observe the retained outbox record. Explain the crash window between broker acknowledgement and database update.

Deliverable: a failure-injection test and a documented recovery behavior.

## Year 5 exercise

Use JFR and thread dumps while importing datasets. Compare query plans before/after a candidate index using realistic data. Rehearse an incident and write the timeline with measured evidence. Review a contribution's question mapping for precision.

Deliverable: a measured improvement, reproducible benchmark, rollback procedure, and honest PR description.

## Study loop

Find the question in QUESTION_INDEX.html. Open its evidence, run the referenced test or command, change one input, predict the result, then verify. Related-code entries are starting points; add the missing specific behavior before presenting them as full answers.
