package com.aerotopo.api;
import com.aerotopo.domain.SurveyPoint;
import com.aerotopo.gis.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/v1/gis")
public class GisController {
    public record Boundary(@NotNull @Size(min=3,max=10000) List<@NotNull SurveyPoint> vertices) {}
    public record Interpolation(@NotNull SurveyPoint query, @NotNull @Size(min=1,max=20000) List<@NotNull SurveyPoint> points) {}
    public record Flight(double heightMetres, double widthMetres, double overlap, @NotNull FlightPlanner.Camera camera) {}
    private final TerrainEngine terrain;
    private final FlightPlanner planner;
    public GisController(TerrainEngine terrain, FlightPlanner planner) { this.terrain = terrain; this.planner = planner; }
    @PostMapping("/area") public Map<String, Double> area(@Valid @RequestBody Boundary boundary) {
        return Map.of("hectares", terrain.areaHectares(boundary.vertices()));
    }
    @PostMapping("/elevation") public Map<String, Double> elevation(@Valid @RequestBody Interpolation body) {
        return Map.of("elevationMetres", terrain.elevationAt(body.query(), body.points()));
    }
    @PostMapping("/flight-plan") public Map<String, Object> flight(@Valid @RequestBody Flight body) {
        double gsd = planner.groundSampleDistance(body.heightMetres(), body.camera());
        return Map.of("gsdMetres", gsd, "strips", planner.strips(body.widthMetres(), gsd * body.camera().imageWidthPixels(), body.overlap()));
    }
}
