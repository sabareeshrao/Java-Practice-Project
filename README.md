# AeroTopo — Java GIS survey operations

A working Java aerial-surveying project and an interview question navigator, organized as a year 1–5 learning path.

**Start with [QUESTION_INDEX.html](QUESTION_INDEX.html)**: download/open it locally for search, year/topic filters, and an embedded source viewer with exact line numbers. GitHub displays HTML as source; it does not execute the navigator. [QUESTION_INDEX.md](QUESTION_INDEX.md) provides ordinary GitHub source links.

The inventory contains all **2,308 original questions**, including 300 Additional questions. Indexing every question is not the same as implementing every question. [COVERAGE.md](docs/COVERAGE.md) reports direct, related, procedural, optional-version, and missing evidence separately. Related mappings identify a starting point and still need focused implementation.

## What runs

- Survey creation, strict CSV point ingestion, projected-CRS checks and duplicate rejection.
- Terrain area, spatial selection, inverse-distance interpolation and flight-strip planning.
- Independent checkpoint RMSE, QA approval and delivery state transitions.
- Transactional persistence, audit history, stale-version conflict checks and delivery outbox.
- Role-protected APIs, CSRF-protected browser dashboard, metrics and optional JWT profile.
- Compiled Java laboratories for OOP, algorithms, collections, streams, generics, concurrency, I/O, JDBC, networking, reflection, and Spring lifecycle.
- Real tests for calculations, rollback, security, language/compiler behavior and concurrency.

This is a survey workflow and selected terrain-calculation application, not a photogrammetric reconstruction engine. Sample data is synthetic.

## Run locally

Install JDK 21 and Maven 3.6.3+. From this directory:

```powershell
$env:SURVEY_MANAGER_PASSWORD = 'choose-a-local-manager-password'
$env:SURVEY_PROCESSOR_PASSWORD = 'choose-a-local-processor-password'
$env:SURVEY_REVIEWER_PASSWORD = 'choose-a-local-reviewer-password'
mvn spring-boot:run
```

If Maven is bundled with IntelliJ but not on PATH:

```powershell
./scripts/maven.ps1 spring-boot:run
```

Open http://localhost:8080 and sign in as manager, processor, or reviewer with the corresponding password. Without supplied passwords, local startup generates them in the local startup log. The application binds to loopback by default.

Create a project with EPSG 32644, upload samples/hyderabad-ground.csv, run the provided independent checkpoint heights, approve, and release delivery. H2 persists data under data/. PowerShell 7 users can run ./scripts/demo.ps1 to exercise the entire HTTP workflow.

## Verify

```text
mvn verify
python tools/build_question_index.py --check
```

Maven produces target/aerotopo-1.0.0.jar, JUnit reports, and target/site/jacoco/index.html. Run the artifact with java -jar target/aerotopo-1.0.0.jar. Optional JPMS and newer-JDK examples are documented in labs/README.md.

## Learn and contribute

Read [LEARNING_PATH.md](docs/LEARNING_PATH.md), [PROJECT_CONTEXT.md](PROJECT_CONTEXT.md), and [CONTRIBUTING.md](CONTRIBUTING.md). Developers and AI contributors should start with PROJECT_CONTEXT.md and check the actual tests and coverage report before assuming a feature exists.

Questions preserve their original S.No, Master Seq, sheet and row. Edit interview/mappings.json to add a file, stable source anchor and specific explanation. Run python tools/build_question_index.py to regenerate line numbers. Do not manually patch generated HTML or Markdown indexes.

To reimport an authorized source workbook: python tools/import_questions.py "path/to/Java 2000.xlsx". This uses only Python's standard library. The personal résumé PDF is deliberately absent from the repository.

## Optional deployments

compose.yml defines PostgreSQL and the application. Supply the required passwords and run docker compose up --build. Kafka transport is enabled with survey.transport=kafka and a configured spring.kafka.bootstrap-servers. The default transport writes local delivery receipts.

The JWT profile requires JWT_ISSUER_URI and an external issuer producing the expected audience and role claims. Docker, Kubernetes, Kafka, PostgreSQL and JWT integrations require separate environment verification; see docs/VERIFICATION.md.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [HTTP API](docs/API.md)
- [Operation and incident runbook](docs/RUNBOOK.md)
- [Toolchain and language versions](docs/TOOLCHAIN.md)
- [Verification record](docs/VERIFICATION.md)
