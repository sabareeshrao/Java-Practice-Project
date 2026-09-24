package com.aerotopo.persistence;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "workflow_event")
public class WorkflowEvent {
    @Id private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id") private SurveyProject project;
    @Column(nullable = false) private String action;
    @Column(nullable = false) private String actor;
    @Column(nullable = false) private Instant occurredAt;
    @Column(length = 1000) private String detail;
    protected WorkflowEvent() {}
    public WorkflowEvent(SurveyProject project, String action, String actor, String detail) {
        id = UUID.randomUUID(); this.project = project; this.action = action;
        this.actor = actor; this.detail = detail; occurredAt = Instant.now();
    }
    public UUID getId() { return id; }
    public String getAction() { return action; }
    public String getActor() { return actor; }
    public Instant getOccurredAt() { return occurredAt; }
    public String getDetail() { return detail; }
}
