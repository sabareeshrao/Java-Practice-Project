package com.aerotopo.service;
import com.aerotopo.domain.*;
import com.aerotopo.gis.TerrainEngine;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.concurrent.CompletableFuture;

@Service
public class AsyncQualityService {
    private final TerrainEngine terrain;
    public AsyncQualityService(TerrainEngine terrain) { this.terrain = terrain; }
    @Async("surveyExecutor")
    public CompletableFuture<Optional<SurveyPoint>> highest(List<SurveyPoint> points) {
        return CompletableFuture.completedFuture(terrain.highest(List.copyOf(points), p -> true));
    }
}
