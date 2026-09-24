# Operation, debugging, and incident exercises

## Start and inspect

Run mvn spring-boot:run with JDK 21. Inspect /actuator/health. A manager can read /actuator/prometheus. The service emits request IDs and method duration metrics. Match the X-Request-ID response header to log context. Do not log entire uploaded datasets or credentials.

## Profiling

Find the JVM PID with jcmd -l. Capture evidence in target/:

```text
jcmd <pid> Thread.print
jcmd <pid> GC.heap_info
jcmd <pid> JFR.start name=survey settings=profile duration=60s filename=target/survey.jfr
jcmd <pid> GC.class_histogram
```

Use JDK Mission Control to inspect allocation, blocked threads, and database waits. A heap dump may contain personal or secret data; retain it locally. Compare retained objects and allocation rate, not just total heap size. ThreadLocal values must be removed when work completes.

## Database unavailable

Observe failed requests and the database exception without leaking its internals to callers. Stop new state changes, preserve event IDs, restore connectivity, and check the outbox backlog. Retry only operations with documented idempotency. Project creation currently requires a unique name; it does not have a general Idempotency-Key contract.

## Delivery transport unavailable

A transport exception leaves the outbox event unpublished. The next scheduler pass retries. Inspect event_id and published in delivery_outbox. Verify one logical delivery in the consumer using event ID deduplication. There is no poison-message dead-letter queue or exponential backoff yet.

## Stale update and QA failure

Reload the project after HTTP 409 and resubmit with its latest version only after reviewing changes. A FAILED QA report cannot be approved. Replace points in a failed survey, then rerun independent checkpoint validation. Keep the failed audit event.

## Slow queries

Capture request latency, service duration, connection-pool metrics, and database execution plans. The migration indexes project status/time, project/elevation, and audit history lookup. Index changes have write/storage costs. On PostgreSQL run EXPLAIN (ANALYZE, BUFFERS) with representative read-only queries in a safe dataset. Do not assert percentage improvements without baseline and repeatable measurements.

## Deployment and rollback

CI compiles, tests, packages, and validates source links. Docker builds the same artifact. Keep secrets outside version control. Roll out one instance against a migrated database, test the workflow, then switch traffic. Flyway versions are append-only once released. Rolling back a JAR does not reverse a destructive schema migration; use backward-compatible migrations.

The Kubernetes example uses an externally supplied aerotopo-config Secret and a locally tagged image that must be built and made available to the cluster. It is not a deployed service. Docker, Kubernetes, and live PostgreSQL verification require those runtimes.

## Git and review

Create a feature branch, keep commits focused, run verification, and submit a PR. Review domain correctness, transaction boundaries, authorization, tests, and exact question links. Resolve conflicts by reading both behavioral changes and rerunning relevant tests. Never force-push a shared branch to hide a mistake.

## Leadership and behavioral practice

For a production incident, assign one coordinator, establish impact, stabilize service, preserve evidence, and divide diagnosis tasks. A senior developer may pair with the author while owning recovery accountability. Do not blame the junior developer. After recovery, document the contributing conditions and add a regression test.

For deadline pressure, explain the smallest safe scope, test evidence, rollback approach, and risks to stakeholders. For code review disagreement, reproduce the behavior and compare alternatives against measurable criteria. For an unfamiliar task, identify the unknowns, run a bounded experiment, and communicate findings.

Use these as project exercises. Record what you actually implemented and measured; do not present sample incidents as personal employment history.
