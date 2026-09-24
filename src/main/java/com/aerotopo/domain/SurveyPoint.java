package com.aerotopo.domain;

import java.io.Serializable;
import java.util.Objects;

/** A ground observation in one projected CRS. x/y/z are metres, never degrees. */
public record SurveyPoint(String id, double x, double y, double z, int srid)
        implements Comparable<SurveyPoint>, Serializable {
    public SurveyPoint {
        Objects.requireNonNull(id, "point id");
        if (!id.matches("[A-Za-z0-9][A-Za-z0-9._:-]{0,79}")) throw new IllegalArgumentException("Invalid point id");
        if (!Double.isFinite(x) || !Double.isFinite(y) || !Double.isFinite(z))
            throw new IllegalArgumentException("Coordinates must be finite");
        if (srid < 32601 || srid > 32660) throw new IllegalArgumentException("Use northern WGS84 UTM EPSG:32601..32660");
    }

    public double distanceTo(SurveyPoint other) {
        requireSameCrs(other);
        return Math.hypot(x - other.x, y - other.y);
    }

    public void requireSameCrs(SurveyPoint other) {
        if (srid != other.srid) throw new IllegalArgumentException("Mixed coordinate systems");
    }

    @Override public int compareTo(SurveyPoint other) { return id.compareTo(other.id); }
}
