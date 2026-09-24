package com.aerotopo.gis;

import java.util.ArrayList;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class FlightPlanner {
    public record Camera(double sensorWidthMm, double focalLengthMm, int imageWidthPixels) {
        public Camera {
            if (!Double.isFinite(sensorWidthMm) || !Double.isFinite(focalLengthMm)
                    || sensorWidthMm <= 0 || focalLengthMm <= 0 || imageWidthPixels <= 0)
                throw new IllegalArgumentException("Invalid camera");
        }
    }
    public record Strip(int sequence, double crossTrackMetres, boolean reversed) {}
    public double groundSampleDistance(double heightAboveGroundMetres, Camera camera) {
        if (!Double.isFinite(heightAboveGroundMetres) || heightAboveGroundMetres <= 0)
            throw new IllegalArgumentException("Positive flight height required");
        return heightAboveGroundMetres * camera.sensorWidthMm() / (camera.focalLengthMm() * camera.imageWidthPixels());
    }
    public List<Strip> strips(double widthMetres, double footprintWidthMetres, double sideOverlap) {
        if (!Double.isFinite(widthMetres) || !Double.isFinite(footprintWidthMetres) || !Double.isFinite(sideOverlap)
                || widthMetres <= 0 || footprintWidthMetres <= 0 || sideOverlap < 0 || sideOverlap >= 1)
            throw new IllegalArgumentException("Invalid flight parameters");
        double spacing = footprintWidthMetres * (1 - sideOverlap);
        int count = (int)Math.ceil(Math.max(0, widthMetres - footprintWidthMetres) / spacing) + 1;
        if (count > 10_000) throw new IllegalArgumentException("Flight requires too many strips");
        var result = new ArrayList<Strip>();
        for (int i = 0; i < count; i++) result.add(new Strip(i + 1, Math.min(widthMetres / 2, footprintWidthMetres / 2) + i * spacing, i % 2 != 0));
        return List.copyOf(result);
    }
}
