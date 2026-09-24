package com.aerotopo.service;

import com.aerotopo.domain.*;
import com.aerotopo.gis.TerrainEngine;
import com.aerotopo.persistence.*;
import com.aerotopo.config.SurveyProperties;
import org.springframework.cache.annotation.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class ProjectService {
    public record DeliveryRequested(UUID projectId, String projectName) {}
    private final ProjectRepository projects;
    private final PointRepository points;
    private final EventRepository events;
    private final TerrainEngine terrain;
    private final SurveyProperties properties;
    private final ApplicationEventPublisher publisher;

    public ProjectService(ProjectRepository projects, PointRepository points, EventRepository events,
                          TerrainEngine terrain, SurveyProperties properties, ApplicationEventPublisher publisher) {
        this.projects = projects; this.points = points; this.events = events;
        this.terrain = terrain; this.properties = properties; this.publisher = publisher;
    }
    @Transactional
    public SurveyProject create(String name, int srid, String actor) {
        if (name == null || name.isBlank() || name.strip().length() > 120) throw new IllegalArgumentException("Invalid project name");
        if (srid < 32601 || srid > 32660) throw new IllegalArgumentException("Only northern WGS84 UTM CRS supported");
        if (projects.existsByName(name.strip())) throw new SurveyException(SurveyException.Kind.CONFLICT, "Project name already exists");
        var project = projects.save(new SurveyProject(name, srid));
        record(project, "CREATED", actor, "Survey commissioned in EPSG:" + srid);
        return project;
    }
    public Page<SurveyProject> list(int page, int size) {
        return projects.findAll(PageRequest.of(page, size, Sort.by("createdAt").descending().and(Sort.by("id"))));
    }
    public SurveyProject get(UUID id) {
        return projects.findById(id).orElseThrow(() -> new SurveyException(SurveyException.Kind.NOT_FOUND, "Survey not found"));
    }
    private SurveyProject locked(UUID id) {
        return projects.findForUpdate(id).orElseThrow(() -> new SurveyException(SurveyException.Kind.NOT_FOUND, "Survey not found"));
    }
    private void expectedVersion(SurveyProject project, long expected) {
        if (project.getVersion() != expected) throw new SurveyException(SurveyException.Kind.CONFLICT, "Stale version; reload the project");
    }
    private void record(SurveyProject project, String action, String actor, String detail) {
        events.save(new WorkflowEvent(project, action, actor, detail));
    }
    @Transactional
    @CacheEvict(value = "pointSummary", key = "#id")
    public SurveyProject ingest(UUID id, List<SurveyPoint> input, long expected, String actor) {
        var project = locked(id);
        expectedVersion(project, expected);
        if (!EnumSet.of(SurveyStatus.PLANNED, SurveyStatus.INGESTED, SurveyStatus.FAILED).contains(project.getStatus()))
            throw new SurveyException(SurveyException.Kind.CONFLICT, "Survey cannot be edited in this state");
        if (input.size() < 3 || input.size() > properties.maxPoints()) throw new IllegalArgumentException("Invalid point count");
        var ids = new HashSet<String>();
        for (var point : input) {
            if (point.srid() != project.getSrid()) throw new IllegalArgumentException("Point CRS differs from project");
            if (!ids.add(point.id())) throw new IllegalArgumentException("Duplicate point id: " + point.id());
        }
        points.replace(id, input);
        project.imported(input.size());
        record(project, "INGESTED", actor, input.size() + " observations");
        return projects.saveAndFlush(project);
    }
    @Transactional
    public QualityReport process(UUID id, long expected, List<Double> measured, List<Double> reference, String actor) {
        var project = locked(id);
        expectedVersion(project, expected);
        project.transition(SurveyStatus.PROCESSING);
        QualityReport report = terrain.validate(points.find(id), project.getSrid(), measured, reference, properties.verticalTolerance());
        project.quality(report);
        project.transition(report.passed() ? SurveyStatus.QA_READY : SurveyStatus.FAILED);
        record(project, "VALIDATED", actor, "RMSE=" + report.verticalRmse() + "; " + String.join("; ", report.issues()));
        return report;
    }
    @Transactional
    public SurveyProject approve(UUID id, long expected, String actor) {
        var project = locked(id);
        expectedVersion(project, expected);
        if (!Boolean.TRUE.equals(project.getQualityPassed())) throw new SurveyException(SurveyException.Kind.CONFLICT, "QA failed");
        project.transition(SurveyStatus.APPROVED);
        record(project, "APPROVED", actor, "QA reviewer accepted independent checkpoints");
        return projects.saveAndFlush(project);
    }
    @Transactional
    public SurveyProject deliver(UUID id, long expected, String actor) {
        var project = locked(id);
        // Repeating an already completed delivery has no further side effects.
        if (project.getStatus() == SurveyStatus.DELIVERED) return project;
        expectedVersion(project, expected);
        project.transition(SurveyStatus.DELIVERED);
        record(project, "DELIVERED", actor, "Delivery released");
        publisher.publishEvent(new DeliveryRequested(id, project.getName()));
        return projects.saveAndFlush(project);
    }
    public List<SurveyPoint> points(UUID id) { get(id); return points.find(id); }
    public List<WorkflowEvent> history(UUID id) { get(id); return events.findByProjectIdOrderByOccurredAtAsc(id); }
    @Cacheable(value = "pointSummary", key = "#id")
    public Map<String, Object> summary(UUID id) { get(id); return points.summary(id); }
}
