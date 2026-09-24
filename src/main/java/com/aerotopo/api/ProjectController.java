package com.aerotopo.api;

import com.aerotopo.config.SurveyProperties;
import com.aerotopo.domain.*;
import com.aerotopo.io.PointCsv;
import com.aerotopo.persistence.*;
import com.aerotopo.service.ProjectService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.net.URI;
import java.util.*;

@RestController
@RequestMapping("/api/v1")
@Validated
public class ProjectController {
    public record CreateProject(@NotBlank @Size(max=120) String name, @Min(32601) @Max(32660) int srid) {}
    public record Version(@Min(0) long version) {}
    public record Checkpoints(@Min(0) long version, @NotEmpty @Size(max=20000) List<@NotNull Double> measured,
                              @NotEmpty @Size(max=20000) List<@NotNull Double> reference) {}
    private final ProjectService service;
    private final PointCsv csv;
    private final SurveyProperties properties;
    public ProjectController(ProjectService service, PointCsv csv, SurveyProperties properties) {
        this.service = service; this.csv = csv; this.properties = properties;
    }
    @GetMapping("/csrf") public CsrfToken csrf(CsrfToken token) { return token; }
    @GetMapping("/me") public Map<String, Object> me(Authentication auth) {
        return Map.of("username", auth.getName(), "roles", auth.getAuthorities());
    }
    @PostMapping("/projects")
    @PreAuthorize("hasRole('MANAGER')")
    public ResponseEntity<SurveyProject> create(@Valid @RequestBody CreateProject request, Authentication auth) {
        var project = service.create(request.name(), request.srid(), auth.getName());
        return ResponseEntity.created(URI.create("/api/v1/projects/" + project.getId())).body(project);
    }
    @GetMapping("/projects") public Page<SurveyProject> list(@RequestParam(defaultValue="0") @Min(0) int page,
                                                           @RequestParam(defaultValue="20") @Min(1) @Max(100) int size) {
        return service.list(page, size);
    }
    @GetMapping("/projects/{id}") public SurveyProject get(@PathVariable UUID id) { return service.get(id); }
    @GetMapping("/projects/{id}/points") public List<SurveyPoint> points(@PathVariable UUID id) { return service.points(id); }
    @GetMapping("/projects/{id}/summary") public Map<String, Object> summary(@PathVariable UUID id) { return service.summary(id); }
    @GetMapping("/projects/{id}/history") public List<WorkflowEvent> history(@PathVariable UUID id) { return service.history(id); }
    @PostMapping(value="/projects/{id}/points", consumes=MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('PROCESSOR','MANAGER')")
    public SurveyProject ingest(@PathVariable UUID id, @RequestParam @Min(0) long version,
                                @RequestPart MultipartFile file, Authentication auth) throws IOException {
        return service.ingest(id, csv.read(file.getInputStream(), properties.maxPoints()), version, auth.getName());
    }
    @PostMapping("/projects/{id}/quality")
    @PreAuthorize("hasAnyRole('PROCESSOR','MANAGER')")
    public QualityReport quality(@PathVariable UUID id, @Valid @RequestBody Checkpoints body, Authentication auth) {
        return service.process(id, body.version(), body.measured(), body.reference(), auth.getName());
    }
    @PostMapping("/projects/{id}/approve")
    @PreAuthorize("hasAnyRole('REVIEWER','MANAGER')")
    public SurveyProject approve(@PathVariable UUID id, @Valid @RequestBody Version body, Authentication auth) {
        return service.approve(id, body.version(), auth.getName());
    }
    @PostMapping("/projects/{id}/deliver")
    @PreAuthorize("hasRole('MANAGER')")
    public SurveyProject deliver(@PathVariable UUID id, @Valid @RequestBody Version body, Authentication auth) {
        return service.deliver(id, body.version(), auth.getName());
    }
    @GetMapping(value="/projects/{id}/points.csv", produces="text/csv")
    public ResponseEntity<String> export(@PathVariable UUID id) {
        StringBuilder content = new StringBuilder("id,x,y,z,srid\n");
        for (var p : service.points(id)) {
            // Prefix spreadsheet formula-leading identifiers when exporting user data.
            String safe = p.id().matches("^[=+@-].*") ? "'" + p.id() : p.id();
            content.append(safe).append(',').append(p.x()).append(',').append(p.y()).append(',')
                    .append(p.z()).append(',').append(p.srid()).append('\n');
        }
        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=survey-points.csv").body(content.toString());
    }
}
