create table survey_project (
    id uuid primary key,
    version bigint not null default 0,
    name varchar(120) not null unique,
    srid integer not null check (srid between 32601 and 32660),
    status varchar(30) not null,
    created_at timestamp with time zone not null,
    point_count integer not null default 0,
    rmse double precision,
    quality_passed boolean
);
create index ix_project_status_created on survey_project(status, created_at);
create table survey_point (
    project_id uuid not null references survey_project(id),
    point_id varchar(80) not null,
    x double precision not null,
    y double precision not null,
    z double precision not null,
    srid integer not null,
    primary key(project_id, point_id)
);
create index ix_point_project_z on survey_point(project_id,z);
create table workflow_event (
    id uuid primary key,
    project_id uuid not null references survey_project(id),
    action varchar(255) not null,
    actor varchar(255) not null,
    occurred_at timestamp with time zone not null,
    detail varchar(1000)
);
create index ix_event_project_time on workflow_event(project_id,occurred_at);
create table delivery_outbox (
    event_id uuid primary key,
    project_id uuid not null references survey_project(id),
    payload varchar(2000) not null,
    published boolean not null default false,
    created_at timestamp with time zone not null
);
create table delivery_receipt (
    event_id uuid primary key,
    payload varchar(2000) not null,
    received_at timestamp with time zone not null
);
