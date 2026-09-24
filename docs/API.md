# HTTP API

All routes below are under /api/v1 and require authentication. Local session/Basic writes also require the CSRF token from GET /csrf. The dashboard handles this automatically.

| Method | Route | Purpose | Write role |
|---|---|---|---|
| GET | /me | Current user and roles | — |
| GET | /csrf | Obtain browser CSRF token | — |
| POST | /projects | Create project with name and srid | MANAGER |
| GET | /projects?page=0&size=20 | Bounded pagination | — |
| GET | /projects/{id} | Project state and version | — |
| POST | /projects/{id}/points?version=0 | Multipart file CSV import | PROCESSOR or MANAGER |
| GET | /projects/{id}/points | Point values | — |
| GET | /projects/{id}/points.csv | Projected CSV export | — |
| GET | /projects/{id}/summary | Elevation summary | — |
| GET | /projects/{id}/history | Audit events | — |
| POST | /projects/{id}/quality | Checkpoint validation | PROCESSOR or MANAGER |
| POST | /projects/{id}/approve | QA approval | REVIEWER or MANAGER |
| POST | /projects/{id}/deliver | Idempotent completed delivery | MANAGER |
| POST | /gis/area | Projected boundary area in hectares | authenticated |
| POST | /gis/elevation | Inverse-distance interpolation | authenticated |
| POST | /gis/flight-plan | GSD and strip planning | authenticated |

Create body: {"name":"Hyderabad corridor","srid":32644}.

Quality body: {"version":1,"measured":[510.01,510.12],"reference":[510,510.1]}.

Approve/deliver body: {"version":2}. Fetch the project after every mutation to obtain the current version.

Area body contains vertices, each with id,x,y,z,srid. The first vertex need not be repeated. Boundaries must be valid and nonzero. Elevation body contains query and points with the same point shape.

Responses use 201 + Location for creation, 400 for invalid input, 401 for unauthenticated API requests, 403 for insufficient authority/CSRF, 404 for a missing project, and 409 for state/version/uniqueness conflicts. Error responses use ProblemDetail.

This document describes implemented endpoints. Swagger UI and generated OpenAPI integration are not installed.
