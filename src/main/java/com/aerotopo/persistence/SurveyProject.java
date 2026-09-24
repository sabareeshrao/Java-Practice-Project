package com.aerotopo.persistence;

import com.aerotopo.domain.*;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "survey_project")
public class SurveyProject {
    @Id private UUID id;
    @Version private long version;
    @Column(nullable = false, unique = true, length = 120) private String name;
    @Column(nullable = false) private int srid;
    @Enumerated(EnumType.STRING) @Column(nullable = false) private SurveyStatus status;
    @Column(nullable = false) private Instant createdAt;
    private int pointCount;
    private Double rmse;
    private Boolean qualityPassed;

    protected SurveyProject() {}
    public SurveyProject(String name, int srid) {
        this.id = UUID.randomUUID();
        this.name = name.strip();
        this.srid = srid;
        this.status = SurveyStatus.PLANNED;
        this.createdAt = Instant.now();
    }
    public void transition(SurveyStatus next) {
        if (!status.canTransitionTo(next))
            throw new SurveyException(SurveyException.Kind.CONFLICT, "Cannot move from " + status + " to " + next);
        status = next;
    }
    public void imported(int count) {
        if (status != SurveyStatus.INGESTED) transition(SurveyStatus.INGESTED);
        pointCount = count;
        rmse = null;
        qualityPassed = null;
    }
    public void quality(QualityReport report) { rmse = report.verticalRmse(); qualityPassed = report.passed(); }
    public UUID getId() { return id; }
    public long getVersion() { return version; }
    public String getName() { return name; }
    public int getSrid() { return srid; }
    public SurveyStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public int getPointCount() { return pointCount; }
    public Double getRmse() { return rmse; }
    public Boolean getQualityPassed() { return qualityPassed; }
}
